// PayPal webhooks (F5): verify with PayPal, store once, translate to plain English, update the sale.
import "server-only";
import { eq, or } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { describe, type WebhookEvent } from "@/lib/paypal-events";
import { paypal } from "./client";
import { upsertDispute, type PayPalDispute } from "./disputes";

export type { WebhookEvent };

const HEADERS = ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"] as const;

/** Asks PayPal whether this delivery really came from PayPal for our webhook. Returns SUCCESS or FAILURE. */
export async function verifySignature(headers: Headers, event: WebhookEvent) {
  const missing = HEADERS.filter((h) => !headers.get(h));
  if (missing.length) return { status: "FAILURE" as const, reason: `missing ${missing.join(", ")}` };
  const result = await paypal<{ verification_status: "SUCCESS" | "FAILURE" }>("POST", "/v1/notifications/verify-webhook-signature", {
    body: {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    },
  });
  return { status: result.verification_status, reason: null };
}

/** Finds the Cleared sale an event belongs to, using the ids PayPal includes. */
async function matchSale(event: WebhookEvent) {
  const r = event.resource as Record<string, unknown>;
  const invoiceId = event.resource_type === "invoices" || event.event_type.startsWith("INVOICING.") ? ((r.id as string) ?? (r.invoice_id as string)) : null;
  if (invoiceId) {
    const inv = await db.query.invoices.findFirst({ where: eq(s.invoices.paypalInvoiceId, invoiceId), with: { sale: true } });
    if (inv) return inv.sale;
  }
  const related = (r.supplementary_data as { related_ids?: { order_id?: string } } | undefined)?.related_ids;
  const orderId = event.event_type.startsWith("CHECKOUT.ORDER") ? (r.id as string) : related?.order_id;
  const captureId = event.event_type.startsWith("PAYMENT.CAPTURE") ? (r.id as string) : null;
  if (orderId || captureId) {
    const conds = [orderId && eq(s.sales.paypalOrderId, orderId), captureId && eq(s.sales.paypalCaptureId, captureId)].filter(Boolean) as ReturnType<typeof eq>[];
    const sale = await db.query.sales.findFirst({ where: or(...conds) });
    if (sale) return sale;
  }
  return null;
}

export type IngestOutcome = "stored" | "duplicate" | "unmatched";

/** Stores a verified event exactly once and applies its effect on the sale. */
export async function ingest(event: WebhookEvent): Promise<IngestOutcome> {
  if (await db.query.events.findFirst({ where: eq(s.events.paypalEventId, event.id), columns: { id: true } })) return "duplicate";

  if (event.event_type.startsWith("CUSTOMER.DISPUTE.")) {
    const dispute = await upsertDispute(event.resource as unknown as PayPalDispute);
    if (!dispute) return record(event, null, null, "unmatched");
    const sale = dispute.saleId ? await db.query.sales.findFirst({ where: eq(s.sales.id, dispute.saleId) }) : null;
    return record(event, dispute.sellerId, sale ?? null, "stored");
  }

  const sale = await matchSale(event);
  if (sale) {
    const at = event.create_time ? new Date(event.create_time) : new Date();
    if (event.event_type === "INVOICING.INVOICE.PAID") {
      await db.update(s.sales).set({ status: sale.status === "sent" || sale.status === "draft" ? "paid" : sale.status, paidAt: sale.paidAt ?? at }).where(eq(s.sales.id, sale.id));
      const payment = ((event.resource as { payments?: { transactions?: { payment_id?: string }[] } }).payments?.transactions ?? [])[0]?.payment_id;
      await db.update(s.invoices).set({ status: "PAID", paidAt: at, ...(payment ? { paypalPaymentId: payment } : {}) }).where(eq(s.invoices.saleId, sale.id));
    }
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      await db.update(s.sales).set({ status: sale.status === "sent" || sale.status === "draft" ? "paid" : sale.status, paidAt: sale.paidAt ?? at, paypalCaptureId: (event.resource as { id: string }).id }).where(eq(s.sales.id, sale.id));
    }
  }
  return record(event, sale?.sellerId ?? null, sale, sale ? "stored" : "unmatched");
}

async function record(event: WebhookEvent, sellerId: string | null, sale: { id: string; clientName: string } | null, outcome: IngestOutcome) {
  const inserted = await db
    .insert(s.events)
    .values({
      sellerId,
      saleId: sale?.id ?? null,
      paypalEventId: event.id,
      type: event.event_type,
      summary: describe(event, sale?.clientName),
      verified: true,
      payload: event as unknown as Record<string, unknown>,
      occurredAt: event.create_time ? new Date(event.create_time) : new Date(),
    })
    .onConflictDoNothing({ target: s.events.paypalEventId })
    .returning({ id: s.events.id });
  return inserted.length ? outcome : "duplicate";
}
