// J4, the dispute investigator (docs/AI.md). A tool-using agent with READ-ONLY tools: it decides what to look
// at, then drafts an evidence packet in a fixed schema. Code checks every claim; the seller approves; only the
// submitEvidence workflow task can send anything to PayPal. Runs as the Render Workflow task `draftPacket`.
// The loop itself lives in investigate.ts so the evals run exactly the same code.
import "server-only";
import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { exhibitsFor } from "../exhibits";
import { templatePacket } from "../packet";
import { fakeAiEnabled, fakeClient } from "./fake-client";
import { investigate, packetEffort, packetModel, PROMPT_VERSION, type CaseFile } from "./investigate";

async function load(disputeId: string) {
  const dispute = await db.query.disputes.findFirst({
    where: eq(s.disputes.id, disputeId),
    with: { sale: { with: { proofs: { orderBy: s.proofs.occurredAt }, invoices: true } }, seller: true },
  });
  if (!dispute?.sale) throw new Error("Dispute or sale not found");
  return dispute;
}

function caseFile(d: Awaited<ReturnType<typeof load>>, sellerNotes: string[] = []): CaseFile {
  const sale = d.sale!;
  return {
    caseId: d.paypalDisputeId,
    sellerName: d.seller.businessName ?? d.seller.name,
    dispute: { reason: d.reason, buyerNote: d.buyerNote, amountCents: d.amountCents, stage: d.stage, paypalStatus: d.paypalStatus, responseDueAt: d.responseDueAt, openedAt: d.openedAt },
    sale: { title: sale.title, description: sale.description, kind: sale.kind, clientName: sale.clientName, amountCents: sale.amountCents, paidAt: sale.paidAt, deliveredAt: sale.deliveredAt, deliveryDueAt: sale.deliveryDueAt },
    invoice: sale.invoices[0] ?? null,
    exhibits: exhibitsFor(sale),
    sellerNotes,
  };
}

/** The seller's memos about this sale (or about their business in general), newest first. */
async function notesFor(sellerId: string, saleId: string) {
  const rows = await db.select({ text: s.memos.text, saleId: s.memos.saleId }).from(s.memos).where(eq(s.memos.sellerId, sellerId)).orderBy(desc(s.memos.createdAt)).limit(20);
  return rows.filter((r) => !r.saleId || r.saleId === saleId).map((r) => r.text);
}

type Step = { tool: string; label: string; turn?: number; detail?: string; ref?: string; plan?: string[] };
async function addStep(packetId: string, step: Step) {
  const row = await db.query.packets.findFirst({ where: eq(s.packets.id, packetId), columns: { trace: true } });
  await db.update(s.packets).set({ trace: [...(row?.trace ?? []), { ...step, at: new Date().toISOString() }] }).where(eq(s.packets.id, packetId));
}

/** Drafts the packet for a dispute with the agent, checks it, and stores it for the seller's approval. */
export async function draftPacket(packetId: string) {
  const packet = await db.query.packets.findFirst({ where: eq(s.packets.id, packetId) });
  if (!packet) throw new Error("Packet not found");
  const d = await load(packet.disputeId);
  const c = caseFile(d, await notesFor(d.sellerId, d.sale!.id));
  const fake = fakeAiEnabled();
  await db.update(s.packets).set({ status: "drafting", trace: [], model: fake ? "fake-local" : packetModel(c.dispute.amountCents) }).where(eq(s.packets.id, packetId));

  const r = await investigate(c, { onStep: (step) => addStep(packetId, step), ...(fake && { client: fakeClient(c), model: "fake-local" }) });

  await db.update(s.packets).set({ status: "checking" }).where(eq(s.packets.id, packetId));
  await addStep(packetId, { tool: "check_claims", label: "Checked every claim against its exhibit", detail: `${r.kept.length} kept${r.removed.length ? `, ${r.removed.length} struck` : ""}` });
  if (r.injections.length) await addStep(packetId, { tool: "guardrail", label: `Ignored ${r.injections.length === 1 ? "an instruction" : `${r.injections.length} instructions`} hidden in the case` });
  const idByLetter = Object.fromEntries(c.exhibits.map((e) => [e.letter, e.id]));

  await db
    .update(s.packets)
    .set({
      status: "awaiting_approval",
      source: "ai",
      recommendation: r.recommendation,
      rationale: r.parsed.rationale,
      claims: r.kept.map((x) => ({ text: x.text, exhibitIds: x.exhibits.map((l) => idByLetter[l.toUpperCase()]).filter(Boolean), evidenceType: "PROOF_OF_FULFILLMENT" })),
      removedClaims: r.removed.map((x) => ({ text: x.text, reasons: x.reasons })),
      missingEvidence: r.parsed.missing_evidence,
      ignoredInstructions: r.injections,
      coverLetter: r.parsed.cover_letter,
    })
    .where(eq(s.packets.id, packetId));
  await db.insert(s.audit).values({
    sellerId: d.sellerId,
    kind: "ai.packet.draft",
    subjectType: "packet",
    subjectId: packetId,
    model: r.model,
    effort: packetEffort(),
    inputHash: createHash("sha256").update(JSON.stringify({ d: d.paypalDisputeId, exhibits: c.exhibits })).digest("hex").slice(0, 16),
    output: { ...r.parsed, injections: r.injections, rules: r.rules, ms: r.ms, usage: r.usage, promptVersion: PROMPT_VERSION },
    checker: { kept: r.kept.length, removed: r.removed.map((x) => ({ text: x.text, reasons: x.reasons })) },
  });
  await db.insert(s.events).values({ sellerId: d.sellerId, saleId: d.saleId, source: "cleared", type: "PACKET.DRAFTED", summary: `Evidence packet drafted: ${r.kept.length} claims, each citing an exhibit`, verified: true });
  return { kept: r.kept.length, removed: r.removed.length, ms: r.ms, usage: r.usage };
}

/** Template packet from the locker, used when the agent fails. Clearly marked source "template". */
export async function draftTemplateFallback(packetId: string, reason: string) {
  const packet = await db.query.packets.findFirst({ where: eq(s.packets.id, packetId) });
  if (!packet) return;
  const d = await load(packet.disputeId);
  const t = templatePacket(d.sale!, d.sale!.proofs, d.reason);
  await db.update(s.packets).set({ status: "awaiting_approval", source: "template", recommendation: t.recommendation, rationale: t.rationale, claims: t.claims, missingEvidence: t.missing, coverLetter: t.coverLetter, error: `AI unavailable: ${reason}`.slice(0, 500) }).where(eq(s.packets.id, packetId));
  await addStep(packetId, { tool: "fallback", label: "AI unavailable: built the reply from your files instead" });
}

/** The newest packet for a dispute (any status). */
export async function latestPacket(disputeId: string) {
  return db.query.packets.findFirst({ where: eq(s.packets.disputeId, disputeId), orderBy: desc(s.packets.createdAt) });
}

