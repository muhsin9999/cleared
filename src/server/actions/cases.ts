"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { ensureDraft, startTask } from "../workflows";

type Claim = { text: string; exhibitIds: string[] };

// Starts (or resumes) the investigator for a case that has no packet yet.
export async function startDraft(disputeId: string) {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.id, disputeId)), columns: { id: true } });
  if (!dispute) return;
  await ensureDraft(dispute.id);
  revalidatePath(`/cases/${disputeId}`);
}

// Approval is the only path to submission. It records exactly the packet the seller reviewed, then starts the
// submitEvidence workflow task, which sends it to PayPal. Simulated cases (SIM-…) are recorded as such.
export async function approveAndSubmit(disputeId: string) {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.id, disputeId)) });
  if (!dispute) return { ok: false as const, message: "Case not found" };
  if (!dispute.allowedActions?.includes("provide_evidence")) return { ok: false as const, message: "PayPal isn’t accepting evidence on this case right now." };
  const packet = await db.query.packets.findFirst({ where: eq(s.packets.disputeId, dispute.id), orderBy: desc(s.packets.createdAt) });
  if (!packet || !["awaiting_approval", "failed"].includes(packet.status)) return { ok: false as const, message: "The packet isn’t ready for approval yet." };
  const claims = (packet.claims as Claim[] | null) ?? [];
  if (!claims.length) return { ok: false as const, message: "There’s no proof to submit yet." };

  await db.insert(s.approvals).values({ sellerId: seller.id, subjectType: "packet", subjectId: packet.id, summary: { source: packet.source, model: packet.model, recommendation: packet.recommendation, claims: claims.map((c) => c.text) } });

  if (dispute.paypalDisputeId.startsWith("SIM-")) {
    await db.update(s.packets).set({ status: "submitted", submittedAt: new Date(), error: null }).where(eq(s.packets.id, packet.id));
    await db.update(s.disputes).set({ status: "under_review", paypalStatus: "UNDER_REVIEW", allowedActions: [] }).where(eq(s.disputes.id, dispute.id));
    await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, source: "cleared", type: "DISPUTE.EVIDENCE_SUBMITTED", summary: `Evidence packet submitted (${claims.length} claims)`, simulated: true });
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: true as const, mode: "simulated" as const };
  }

  await db.update(s.packets).set({ status: "submitting", error: null }).where(eq(s.packets.id, packet.id));
  try {
    const run = await startTask("submitEvidence", [packet.id]);
    if (run.runId) await db.update(s.packets).set({ workflowRunId: run.runId }).where(eq(s.packets.id, packet.id));
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: true as const, mode: run.mode };
  } catch (e) {
    await db.update(s.packets).set({ status: "failed", error: (e as Error).message.slice(0, 500) }).where(eq(s.packets.id, packet.id));
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: false as const, message: `PayPal didn’t take the evidence: ${(e as Error).message}. Nothing was lost; you can try again.` };
  }
}
