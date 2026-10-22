// Add Tracking (F3/F4) with the PayPal TypeScript SDK that APIMatic's PayPal Context Plugin documents
// (package `paypal`, built from github.com/context-plugins/paypal-typescript-sdk). Written against the plugin's
// skills: one long-lived client, the SDK's own retries for reads only, no blind resend of a write, and every
// failure kind kept distinct. Works for invoice payments too: an invoice payment is a capture whose
// supplementary data names its order (verified 20 Oct 2026, docs/PAYPAL.md §8 Q2).
import "server-only";
import "@/lib/net";
import { type ClientOptions, type Order, PaypalClient, PaypalError, ShipmentCarrier } from "paypal";
import { PayPalError } from "./client";

const BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

/** Builds a client. Tests pass a fake `fetch`; the app uses the shared one below. */
export function trackingClient(fetch?: ClientOptions["fetch"]) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  return new PaypalClient({
    oauth2: { clientId, clientSecret },
    serverOptions: { baseUrl: BASE },
    // Reads (GET) retry on 408/429/5xx with backoff; writes are never retried by the SDK.
    retry: { timeout: 20_000, maxRetries: 2 },
    ...(fetch && { fetch }),
  });
}

// One long-lived client so the OAuth token is fetched once and shared (plugin: client-initialization).
let shared: PaypalClient | undefined;
const sdk = () => (shared ??= trackingClient());

export const CARRIERS = { UPS: ShipmentCarrier.Ups, USPS: ShipmentCarrier.Usps, FEDEX: ShipmentCarrier.Fedex, DHL: ShipmentCarrier.DhlApi, OTHER: ShipmentCarrier.Other } as const;
export type CarrierKey = keyof typeof CARRIERS;

/** Turns any SDK failure into our PayPalError, keeping the status and PayPal's debug id. */
function toPayPalError(e: unknown, action: string): unknown {
  if (!(e instanceof PaypalError)) return e;
  switch (e.kind) {
    case "api": {
      const body = "body" in e.payload ? (e.payload.body as { message?: string; debugId?: string; details?: { description?: string; issue?: string }[] }) : undefined;
      const message = body?.details?.[0]?.description ?? body?.details?.[0]?.issue ?? body?.message ?? `PayPal returned ${e.status}`;
      return new PayPalError(e.status, body?.debugId ?? e.headers.get("paypal-debug-id"), body ?? null, message);
    }
    case "decode":
      // PayPal's sandbox sometimes answers with a bot-check page instead of JSON.
      return new PayPalError(e.status, e.headers.get("paypal-debug-id"), null, `PayPal sent an unreadable reply while ${action}; try again in a minute`);
    case "timeout":
    case "connection":
      return new PayPalError(0, null, null, `PayPal didn’t answer while ${action}; try again in a minute`);
    case "auth":
      return new PayPalError(401, null, null, "Cleared couldn’t sign in to PayPal");
    case "encode":
      return new Error(`Cleared built an invalid request while ${action}`);
  }
}

/** Finds the PayPal order behind a capture (invoice payments included). */
export async function orderForCapture(captureId: string, client = sdk()) {
  try {
    const capture = await client.payments.getCapturedPayment({ captureId });
    return capture.supplementaryData?.relatedIds?.orderId ?? null;
  } catch (e) {
    throw toPayPalError(e, "looking up the payment");
  }
}

const trackerOn = (order: Order, trackingNumber: string) => {
  const trackers = order.purchaseUnits?.[0]?.shipping?.trackers ?? [];
  return trackers.find((t) => t.id?.endsWith(trackingNumber));
};

export async function addTracking(input: { captureId: string; orderId?: string | null; carrier: CarrierKey; carrierNameOther?: string; trackingNumber: string }, client = sdk()) {
  const orderId = input.orderId ?? (await orderForCapture(input.captureId, client));
  if (!orderId) throw new Error("PayPal didn’t return an order for this payment");
  try {
    const order = await client.orders.createOrderTracking({
      id: orderId,
      body: {
        captureId: input.captureId,
        trackingNumber: input.trackingNumber,
        carrier: CARRIERS[input.carrier],
        ...(input.carrier === "OTHER" && { carrierNameOther: input.carrierNameOther }),
        notifyPayer: true,
      },
    });
    const tracker = trackerOn(order, input.trackingNumber) ?? order.purchaseUnits?.[0]?.shipping?.trackers?.at(-1);
    return { orderId, trackerId: tracker?.id ?? null, status: tracker?.status ?? null };
  } catch (e) {
    // A write that failed without a clear answer may still have landed (plugin: configuration-resilience).
    // Look before reporting a failure, rather than sending it again and risking a second tracker.
    const unclear = e instanceof PaypalError && (e.kind === "timeout" || e.kind === "connection" || (e.kind === "api" && e.status >= 500));
    if (unclear) {
      const order = await client.orders.getOrder({ id: orderId }).catch(() => null);
      const tracker = order && trackerOn(order, input.trackingNumber);
      if (tracker) return { orderId, trackerId: tracker.id ?? null, status: tracker.status ?? null };
    }
    throw toPayPalError(e, "adding the tracking");
  }
}
