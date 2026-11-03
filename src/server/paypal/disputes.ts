// Disputes v1. Disputes reach Cleared two ways: CUSTOMER.DISPUTE.* webhooks and a poller (syncDisputes),
// because in the sandbox no dispute webhook fired for a buyer-opened case (docs/PAYPAL.md §7b).
import "server-only";
import { eq, inArray, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { paypal } from "./client";

export type PayPalDispute = {
  dispute_id: string;
  reason: string;
  status: string;
  dispute_life_cycle_stage?: string;
  dispute_amount?: { value: string; currency_code: string };
  disputed_transactions?: { seller_transaction_id?: string; buyer_transaction_id?: string }[];
  seller_response_due_date?: string;
  create_time?: string;
  dispute_outcome?: { outcome_code?: string };
  messages?: { posted_by?: string; content?: string }[];
  evidences?: { source?: string; notes?: string }[];
  links?: { rel: string }[];
};

const STATUS: Record<string, (typeof s.disputeStatus.enumValues)[number]> = {
  OPEN: "open",
  WAITING_FOR_SELLER_RESPONSE: "waiting_for_seller",
  WAITING_FOR_BUYER_RESPONSE: "under_review",
  UNDER_REVIEW: "under_review",
  RESOLVED: "closed",
  OTHER: "open",
};

function mapStatus(d: PayPalDispute) {
  if (d.status === "RESOLVED") {
    const code = d.dispute_outcome?.outcome_code ?? "";
    return code.includes("SELLER") ? "resolved_seller" : code.includes("BUYER") ? "resolved_buyer" : "closed";
  }
  return STATUS[d.status] ?? "open";
}

/** Creates or updates Cleared's copy of a PayPal dispute. Returns null if it isn't for a Cleared sale. */
export async function upsertDispute(d: PayPalDispute) {
  const txIds = (d.disputed_transactions ?? []).map((t) => t.seller_transaction_id).filter(Boolean) as string[];
  const existing = await db.query.disputes.findFirst({ where: eq(s.disputes.paypalDisputeId, d.dispute_id) });
  let saleId = existing?.saleId ?? null;
  let sellerId = existing?.sellerId ?? null;
  if (!sellerId && txIds.length) {
    const sale =
      (await db.query.sales.findFirst({ where: inArray(s.sales.paypalCaptureId, txIds) })) ??
      (await db.query.invoices.findFirst({ where: inArray(s.invoices.paypalPaymentId, txIds), with: { sale: true } }))?.sale;
    if (sale) ({ id: saleId, sellerId } = sale);
  }
  if (!sellerId) return null;

  const values = {
    sellerId,
    saleId,
    paypalDisputeId: d.dispute_id,
    reason: d.reason,
    stage: d.dispute_life_cycle_stage ?? null,
    status: mapStatus(d),
    paypalStatus: d.status,
    amountCents: Math.round(Number(d.dispute_amount?.value ?? 0) * 100),
    buyerNote: d.messages?.find((m) => m.posted_by === "BUYER")?.content ?? d.evidences?.find((e) => e.source === "SUBMITTED_BY_BUYER")?.notes ?? existing?.buyerNote ?? null,
    responseDueAt: d.seller_response_due_date ? new Date(d.seller_response_due_date) : null,
    allowedActions: (d.links ?? []).map((l) => l.rel).filter((rel) => rel !== "self"),
    raw: d as unknown as Record<string, unknown>,
    openedAt: d.create_time ? new Date(d.create_time) : new Date(),
    resolvedAt: d.status === "RESOLVED" ? new Date() : null,
  };
  const [row] = await db.insert(s.disputes).values(values).onConflictDoUpdate({ target: s.disputes.paypalDisputeId, set: { ...values, openedAt: undefined } }).returning();
  if (saleId && row.status !== "closed" && !row.status.startsWith("resolved")) await db.update(s.sales).set({ status: "disputed" }).where(eq(s.sales.id, saleId));
  return row;
}

/** Polls PayPal for disputes and records any that are new or changed. Safe to run as often as needed. */
export async function syncDisputes() {
  const list = await paypal<{ items?: { dispute_id: string; update_time?: string }[] }>("GET", "/v1/customer/disputes?page_size=20");
  const ids = (list.items ?? []).map((i) => i.dispute_id);
  if (!ids.length) return { seen: 0, matched: 0, created: 0, createdIds: [] as string[] };
  const known = new Map((await db.query.disputes.findMany({ where: or(...ids.map((id) => eq(s.disputes.paypalDisputeId, id))) })).map((d) => [d.paypalDisputeId, d]));
  let matched = 0;
  let created = 0;
  const createdIds: string[] = [];
  for (const id of ids) {
    const detail = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${id}`);
    const before = known.get(id);
    const row = await upsertDispute(detail);
    if (!row) continue;
    matched++;
    if (!before) {
      created++;
      createdIds.push(row.id);
      const sale = row.saleId ? await db.query.sales.findFirst({ where: eq(s.sales.id, row.saleId) }) : null;
      await db
        .insert(s.events)
        .values({ sellerId: row.sellerId, saleId: row.saleId, source: "paypal", paypalEventId: `poll:${id}:created`, type: "CUSTOMER.DISPUTE.CREATED", summary: `${sale?.clientName ?? "Your client"} opened a dispute`, verified: true, payload: { dispute_id: id, via: "poll" } })
        .onConflictDoNothing({ target: s.events.paypalEventId });
    }
  }
  return { seen: ids.length, matched, created, createdIds };
}

/** Adds open, unused sandbox disputes to the judge-mode stock and retires ones PayPal no longer accepts evidence on. */
export async function syncPool() {
  const list = await paypal<{ items?: { dispute_id: string }[] }>("GET", "/v1/customer/disputes?page_size=50");
  const claimed = new Set((await db.select({ id: s.disputes.paypalDisputeId }).from(s.disputes)).map((d) => d.id));
  const pool = new Map((await db.select().from(s.disputePool)).map((p) => [p.paypalDisputeId, p]));
  let added = 0;
  let retired = 0;
  for (const { dispute_id } of list.items ?? []) {
    if (claimed.has(dispute_id) && !pool.has(dispute_id)) continue;
    const d = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${dispute_id}`);
    const usable = d.status === "WAITING_FOR_SELLER_RESPONSE" && (d.links ?? []).some((l) => l.rel === "provide_evidence");
    const existing = pool.get(dispute_id);
    if (!existing && usable && !claimed.has(dispute_id)) {
      const tx = d.disputed_transactions?.[0]?.seller_transaction_id;
      if (!tx) continue;
      await db.insert(s.disputePool).values({ paypalDisputeId: dispute_id, transactionId: tx, amountCents: Math.round(Number(d.dispute_amount?.value ?? 0) * 100) }).onConflictDoNothing();
      added++;
    } else if (existing?.status === "available" && !usable) {
      await db.update(s.disputePool).set({ status: "expired" }).where(eq(s.disputePool.id, existing.id));
      retired++;
    }
  }
  const [{ available }] = await db.select({ available: sql<number>`count(*) filter (where ${s.disputePool.status} = 'available')::int` }).from(s.disputePool);
  return { added, retired, available };
}

/** Claims one real sandbox dispute for a demo sale (atomically, so two judges never share one) and links it. */
export async function claimPoolDispute(sellerId: string, saleId: string, saleAmountCents: number) {
  // Prefer a dispute for the same amount as the sale, so the case reads naturally.
  const [claim] = await db.execute<{ paypal_dispute_id: string; transaction_id: string }>(sql`
    update ${s.disputePool} set status = 'claimed', claimed_by_seller = ${sellerId}, claimed_at = now()
    where id = (select id from ${s.disputePool} where status = 'available'
                order by (amount_cents = ${saleAmountCents}) desc, created_at limit 1 for update skip locked)
    returning paypal_dispute_id, transaction_id`);
  if (!claim) return null;
  await db.update(s.sales).set({ paypalCaptureId: claim.transaction_id }).where(eq(s.sales.id, saleId));
  const detail = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${claim.paypal_dispute_id}`);
  return upsertDispute(detail);
}

export type SandboxStep = "decided" | "deciding" | "escalated" | "resend" | "reviewing";

/**
 * Sandbox only: takes a real dispute one step closer to PayPal's decision, doing whatever PayPal allows right now.
 * Proven against the sandbox on 3 Nov 2026: evidence on an inquiry hands it to the buyer; the seller escalates it to a
 * claim; PayPal asks for evidence again; once that is in, the claim is under review and PayPal offers `adjudicate`
 * (about 30 minutes later); adjudicate closes it a minute or so after. Never fakes an outcome.
 */
export async function advanceSandboxDecision(paypalDisputeId: string): Promise<{ step: SandboxStep; status: string; stage?: string }> {
  const path = `/v1/customer/disputes/${paypalDisputeId}`;
  let live = await paypal<PayPalDispute>("GET", path);
  const has = (rel: string) => (live.links ?? []).some((l) => l.rel === rel);
  if (live.status === "RESOLVED") {
    await upsertDispute(live);
    return { step: "decided", status: live.status };
  }
  if (has("adjudicate")) {
    await paypal("POST", `${path}/adjudicate`, { body: { adjudication_outcome: "SELLER_FAVOR" }, representation: false });
    for (let i = 0; i < 6 && live.status !== "RESOLVED"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      live = await paypal<PayPalDispute>("GET", path);
    }
    await upsertDispute(live);
    return { step: live.status === "RESOLVED" ? "decided" : "deciding", status: live.status };
  }
  // The claim is asking for evidence: the caller re-sends the seller's approved reply.
  if (has("provide_evidence")) return { step: "resend", status: live.status };
  if (live.dispute_life_cycle_stage === "INQUIRY" && has("escalate")) {
    await paypal("POST", `${path}/escalate`, { body: { note: "Sandbox demo: escalating to a claim so PayPal can review the seller's evidence and decide." }, representation: false });
    await upsertDispute(await paypal<PayPalDispute>("GET", path));
    return { step: "escalated", status: live.status };
  }
  await upsertDispute(live);
  return { step: "reviewing", status: live.status, stage: live.dispute_life_cycle_stage };
}
