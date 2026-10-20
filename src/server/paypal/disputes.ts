// Disputes v1. Disputes reach Cleared two ways: CUSTOMER.DISPUTE.* webhooks and a poller (syncDisputes),
// because in the sandbox no dispute webhook fired for a buyer-opened case (docs/PAYPAL.md §7b).
import "server-only";
import { eq, inArray, or } from "drizzle-orm";
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
  if (!ids.length) return { seen: 0, matched: 0, created: 0 };
  const known = new Map((await db.query.disputes.findMany({ where: or(...ids.map((id) => eq(s.disputes.paypalDisputeId, id))) })).map((d) => [d.paypalDisputeId, d]));
  let matched = 0;
  let created = 0;
  for (const id of ids) {
    const detail = await paypal<PayPalDispute>("GET", `/v1/customer/disputes/${id}`);
    const before = known.get(id);
    const row = await upsertDispute(detail);
    if (!row) continue;
    matched++;
    if (!before) {
      created++;
      const sale = row.saleId ? await db.query.sales.findFirst({ where: eq(s.sales.id, row.saleId) }) : null;
      await db
        .insert(s.events)
        .values({ sellerId: row.sellerId, saleId: row.saleId, source: "paypal", paypalEventId: `poll:${id}:created`, type: "CUSTOMER.DISPUTE.CREATED", summary: `${sale?.clientName ?? "Your client"} opened a dispute`, verified: true, payload: { dispute_id: id, via: "poll" } })
        .onConflictDoNothing({ target: s.events.paypalEventId });
    }
  }
  return { seen: ids.length, matched, created };
}
