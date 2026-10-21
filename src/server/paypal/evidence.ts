// Submits an approved evidence packet to PayPal (F6): Disputes v1 provide-evidence, multipart.
// Runs as the Render Workflow task `submitEvidence` (src/workflows/main.ts); proven against the sandbox on 20 Oct.
import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { money } from "@/lib/format";
import { REASON_LABEL } from "@/lib/labels";
import { MAX_CASE_BYTES, MAX_FILE_BYTES } from "@/lib/evidence-files";
import { evidencePdf } from "../evidence-pdf";
import { exhibitsFor } from "../exhibits";
import { templatePacket } from "../packet";
import { readFile } from "../storage";
import { paypal, paypalMultipart } from "./client";
import { upsertDispute, type PayPalDispute } from "./disputes";

export async function submitEvidence(packetId: string) {
  const packet = await db.query.packets.findFirst({ where: eq(s.packets.id, packetId), with: { dispute: { with: { sale: { with: { proofs: { orderBy: s.proofs.occurredAt }, invoices: true } }, seller: true } } } });
  if (!packet?.dispute.sale) throw new Error("Packet or sale not found");
  const { dispute } = packet;
  const sale = dispute.sale!;

  const live = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${dispute.paypalDisputeId}`);
  if (!(live.links ?? []).some((l) => l.rel === "provide_evidence")) {
    await upsertDispute(live);
    throw new Error(`PayPal isn’t accepting evidence on ${dispute.paypalDisputeId} right now (${live.status})`);
  }

  const draft = templatePacket(sale, sale.proofs, dispute.reason);
  // Exactly the claims the seller approved (AI-drafted and checked, or the template fallback).
  const claims = (packet.claims as typeof draft.claims | null) ?? [];
  if (!claims.length) throw new Error("The approved packet has no claims");
  const pdf = await evidencePdf({
    sellerName: dispute.seller.businessName ?? dispute.seller.name,
    clientName: sale.clientName,
    saleTitle: sale.title,
    amount: money(sale.amountCents),
    disputeId: dispute.paypalDisputeId,
    reason: REASON_LABEL[dispute.reason] ?? dispute.reason,
    claims,
    exhibits: exhibitsFor(sale).map((e) => ({ id: e.id, number: e.letter, label: e.label, kind: e.kind, date: new Date(e.date) })),
    coverLetter: packet.coverLetter ?? draft.coverLetter,
  });

  const form = new FormData();
  const notes = claims.map((c, i) => `${i + 1}. ${c.text}`).join(" ").slice(0, 2000);
  form.append("input", new Blob([JSON.stringify({ evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", notes }] })], { type: "application/json" }));
  form.append("evidence-file", new Blob([pdf as BlobPart], { type: "application/pdf" }), "evidence-summary.pdf");
  let total = pdf.byteLength;
  const attached: string[] = ["evidence-summary.pdf"];
  for (const proof of sale.proofs) {
    if (!proof.fileKey || !proof.mimeType || (proof.sizeBytes ?? 0) > MAX_FILE_BYTES || total + (proof.sizeBytes ?? 0) > MAX_CASE_BYTES) continue;
    const bytes = await readFile(proof.fileKey);
    form.append("evidence-file", new Blob([bytes as BlobPart], { type: proof.mimeType }), proof.fileName ?? "exhibit");
    total += bytes.byteLength;
    attached.push(proof.fileName ?? "exhibit");
  }

  await paypalMultipart(`/v1/customer/disputes/${dispute.paypalDisputeId}/provide-evidence`, form);

  const after = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${dispute.paypalDisputeId}`);
  await upsertDispute(after);
  await db.update(s.packets).set({ status: "submitted", submittedAt: new Date(), error: null }).where(eq(s.packets.id, packet.id));
  await db.insert(s.events).values({ sellerId: dispute.sellerId, saleId: sale.id, source: "cleared", type: "DISPUTE.EVIDENCE_SUBMITTED", summary: `Evidence sent to PayPal: ${attached.length} file${attached.length > 1 ? "s" : ""}, ${claims.length} statements`, verified: true, payload: { dispute_id: dispute.paypalDisputeId, files: attached, paypal_status: after.status } });
  const approval = await db.query.approvals.findFirst({ where: eq(s.approvals.subjectId, packet.id), orderBy: desc(s.approvals.approvedAt) });
  await db.insert(s.audit).values({ sellerId: dispute.sellerId, kind: "paypal.dispute.provide_evidence", subjectType: "packet", subjectId: packet.id, output: { files: attached, bytes: total, paypalStatus: after.status }, approvedBy: approval?.sellerId ?? null });
  return { files: attached, paypalStatus: after.status };
}
