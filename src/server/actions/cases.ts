"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { templatePacket } from "../packet";
import { startTask } from "../workflows";

// Approval is the only path to submission: it stores exactly what the seller saw and approved, then starts
// the submitEvidence workflow task, which sends it to PayPal. Simulated cases (SIM-…) are recorded as such.
export async function approveAndSubmit(disputeId: string) {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.id, disputeId)), with: { sale: { with: { proofs: true } } } });
  if (!dispute?.sale) return { ok: false as const, message: "Case not found" };
  if (!dispute.allowedActions?.includes("provide_evidence")) return { ok: false as const, message: "PayPal isn’t accepting evidence on this case right now." };

  const packet = templatePacket(dispute.sale, dispute.sale.proofs, dispute.reason);
  if (!packet.claims.length) return { ok: false as const, message: "There’s no proof to submit yet." };
  const simulated = dispute.paypalDisputeId.startsWith("SIM-");
  const [row] = await db
    .insert(s.packets)
    .values({ disputeId: dispute.id, status: simulated ? "submitted" : "submitting", recommendation: packet.recommendation, rationale: packet.rationale, claims: packet.claims, missingEvidence: packet.missing, coverLetter: packet.coverLetter, submittedAt: simulated ? new Date() : null })
    .returning();
  await db.insert(s.approvals).values({ sellerId: seller.id, subjectType: "packet", subjectId: row.id, summary: { claims: packet.claims.map((c) => c.text), exhibits: packet.exhibits.map((e) => e.label) } });

  if (simulated) {
    await db.update(s.disputes).set({ status: "under_review", paypalStatus: "UNDER_REVIEW", allowedActions: [] }).where(eq(s.disputes.id, dispute.id));
    await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, source: "cleared", type: "DISPUTE.EVIDENCE_SUBMITTED", summary: `Evidence packet submitted (${packet.exhibits.length} exhibits)`, simulated: true });
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: true as const, mode: "simulated" as const };
  }

  try {
    const run = await startTask("submitEvidence", [row.id]);
    await db.update(s.packets).set({ workflowRunId: run.runId }).where(eq(s.packets.id, row.id));
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: true as const, mode: run.mode };
  } catch (e) {
    await db.update(s.packets).set({ status: "failed", error: (e as Error).message.slice(0, 500) }).where(eq(s.packets.id, row.id));
    revalidatePath(`/cases/${dispute.id}`);
    return { ok: false as const, message: `PayPal didn’t take the evidence: ${(e as Error).message}. Nothing was lost; you can try again.` };
  }
}
