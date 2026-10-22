// PayPal webhooks (F5): verify with PayPal, store once, translate to plain English, update the sale.
import "server-only";
import { X509Certificate } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { describe, resourceOf, type WebhookEvent } from "@/lib/paypal-events";
import { checkSignature, trustedCertUrl } from "@/lib/paypal-signature";
import { paypal } from "./client";
import { upsertDispute, type PayPalDispute } from "./disputes";

export type { WebhookEvent };

const HEADERS = ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"] as const;

const certs = new Map<string, string>();

async function cert(url: string) {
  const hit = certs.get(url);
  if (hit) return hit;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`PayPal certificate fetch failed (${res.status})`);
  const pem = await res.text();
  const x = new X509Certificate(pem);
  if (new Date(x.validTo) < new Date()) throw new Error("PayPal signing certificate has expired");
  certs.set(url, pem);
  return pem;
}

/**
 * Confirms a delivery really came from PayPal for our webhook. First the offline check on the exact bytes PayPal
 * sent (PayPal's certificate, fetched only from its own API hosts); if that can't decide, PayPal's own
 * verify-webhook-signature API, given the raw event so nothing is re-serialised. Returns SUCCESS or FAILURE.
 */
export async function verifySignature(headers: Headers, raw: string) {
  const missing = HEADERS.filter((h) => !headers.get(h));
  if (missing.length) return { status: "FAILURE" as const, reason: `missing ${missing.join(", ")}` };
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  // Without our webhook id nothing can be verified, so nothing is accepted (PayPal retries later).
  if (!webhookId) return { status: "FAILURE" as const, reason: "PAYPAL_WEBHOOK_ID is not set" };
  const get = (h: (typeof HEADERS)[number]) => headers.get(h)!;
  const certUrl = get("paypal-cert-url");
  if (!trustedCertUrl(certUrl)) return { status: "FAILURE" as const, reason: "certificate is not on a PayPal host" };
  if (/^SHA256withRSA$/i.test(get("paypal-auth-algo"))) {
    try {
      const ok = checkSignature({ transmissionId: get("paypal-transmission-id"), time: get("paypal-transmission-time"), webhookId, raw, signature: get("paypal-transmission-sig"), certPem: await cert(certUrl) });
      if (ok) return { status: "SUCCESS" as const, reason: null, method: "certificate" };
    } catch (e) {
      console.warn("Offline webhook check failed, asking PayPal:", (e as Error).message);
    }
  }
  const fields = {
    auth_algo: get("paypal-auth-algo"),
    cert_url: certUrl,
    transmission_id: get("paypal-transmission-id"),
    transmission_sig: get("paypal-transmission-sig"),
    transmission_time: get("paypal-transmission-time"),
    webhook_id: webhookId,
  };
  // The event goes in as PayPal sent it, spliced into the JSON, not parsed and re-stringified.
  const body = `${JSON.stringify(fields).slice(0, -1)},"webhook_event":${raw}}`;
  const result = await paypal<{ verification_status: "SUCCESS" | "FAILURE" }>("POST", "/v1/notifications/verify-webhook-signature", { rawBody: body });
  return { status: result.verification_status, reason: result.verification_status === "SUCCESS" ? null : "PayPal did not confirm the signature", method: "api" };
}

/** Finds the Cleared sale an event belongs to, using the ids PayPal includes. */
async function matchSale(event: WebhookEvent) {
  const r = resourceOf(event);
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
      const payment = ((resourceOf(event) as { payments?: { transactions?: { payment_id?: string }[] } }).payments?.transactions ?? [])[0]?.payment_id;
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
