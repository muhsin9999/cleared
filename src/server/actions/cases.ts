"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { templatePacket } from "../packet";

// Approval is the only path to submission: it stores what the seller saw, then (day 8) starts the
// submitEvidence workflow task. Until then the submission is recorded as simulated.
export async function approveAndSubmit(disputeId: string) {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.id, disputeId)), with: { sale: { with: { proofs: true } } } });
  if (!dispute?.sale) return { ok: false as const, message: "Case not found" };
  if (!dispute.allowedActions?.includes("provide_evidence")) return { ok: false as const, message: "PayPal isn’t accepting evidence on this case right now." };

  const packet = templatePacket(dispute.sale, dispute.sale.proofs, dispute.reason);
  const [row] = await db
    .insert(s.packets)
    .values({ disputeId: dispute.id, status: "submitted", recommendation: packet.recommendation, rationale: packet.rationale, claims: packet.claims, missingEvidence: packet.missing, coverLetter: packet.coverLetter, submittedAt: new Date() })
    .returning();
  await db.insert(s.approvals).values({ sellerId: seller.id, subjectType: "packet", subjectId: row.id, summary: { claims: packet.claims.length, exhibits: packet.exhibits.map((e) => e.label) } });
  await db.update(s.disputes).set({ status: "under_review", paypalStatus: "UNDER_REVIEW", allowedActions: [] }).where(eq(s.disputes.id, dispute.id));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, source: "cleared", type: "DISPUTE.EVIDENCE_SUBMITTED", summary: `Evidence packet submitted to PayPal (${packet.exhibits.length} exhibits)`, simulated: true });
  revalidatePath(`/cases/${dispute.id}`);
  return { ok: true as const };
}
