// Add Tracking (F3/F4) with the PayPal TypeScript SDK that APIMatic's PayPal Context Plugin documents
// (package `paypal`, built from github.com/context-plugins/paypal-typescript-sdk). The contract it follows is
// paypal-plan.md at the repo root: one long-lived client, the SDK's own retries for reads only, the write
// sent once, an unanswered write settled by re-reading the order (unknown, never "failed"), and every
// failure kind kept distinct. Works for invoice payments too: an invoice payment is a capture whose
// supplementary data names its order (verified 20 Oct 2026, docs/PAYPAL.md §8 Q2).
import "server-only";
import "@/lib/net";
import { type ClientOptions, type Order, PaypalClient, PaypalError, ShipmentCarrier } from "paypal";
import { PayPalError } from "./client";

const BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

/** Builds a client. Tests pass a fake `fetch` (and a faster retry); the app uses the shared one below. */
export function trackingClient(fetch?: ClientOptions["fetch"], retry?: ClientOptions["retry"]) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  return new PaypalClient({
    oauth2: { clientId, clientSecret },
    // The SDK knows one host (the sandbox); the live host is an explicit override.
    serverOptions: { baseUrl: BASE },
    // Reads (GET) retry on 408/429/5xx, dropped connections and timeouts; the write is never re-sent.
    retry: { timeout: 20_000, maxRetries: 2, ...retry },
    // Pinned off, so the PAYPAL_CLIENT_LOG environment variable can't switch request logging on.
    logging: { level: "off" },
    ...(fetch && { fetch }),
  });
}

// One long-lived client so the OAuth token is fetched once and shared (plugin: client-initialization).
let shared: PaypalClient | undefined;
const sdk = () => (shared ??= trackingClient());

export const CARRIERS = { UPS: ShipmentCarrier.Ups, USPS: ShipmentCarrier.Usps, FEDEX: ShipmentCarrier.Fedex, DHL: ShipmentCarrier.DhlApi, OTHER: ShipmentCarrier.Other } as const;
export type CarrierKey = keyof typeof CARRIERS;

export type TrackingResult = { outcome: "added"; orderId: string; trackerId: string | null; status: string | null } | { outcome: "unknown"; orderId: string };

type ErrorBody = { message?: string; debugId?: string; details?: { description?: string; issue?: string }[] };

/**
 * One mapping from the SDK's failure kinds to Cleared's PayPalError (paypal-plan.md, 1b.4). The seller sees
 * PayPal's own reason only for a 4xx about what they typed; our credentials, our quota and PayPal's own
 * faults get fixed messages. PayPal's debug id is always kept on the error for the audit log.
 */
function toPayPalError(e: unknown, action: string): unknown {
  if (!(e instanceof PaypalError)) return e; // an abort's reason, a configuration fault or a bug
  switch (e.kind) {
    case "api": {
      const body = "body" in e.payload ? (e.payload.body as ErrorBody | undefined) : undefined;
      const debugId = body?.debugId ?? e.headers.get("paypal-debug-id");
      if (e.status === 401 || e.status === 403) return new PayPalError(e.status, debugId, body ?? null, "Cleared couldn’t connect to your PayPal account. Try again later.");
      if (e.status === 429) return new PayPalError(e.status, debugId, body ?? null, "PayPal is busy. Try again in a minute.");
      if (e.status >= 500) return new PayPalError(e.status, debugId, body ?? null, `PayPal had a problem ${action}. Try again in a minute.`);
      const reason = body?.details?.[0]?.description ?? body?.details?.[0]?.issue ?? body?.message ?? "PayPal didn’t accept it.";
      return new PayPalError(e.status, debugId, body ?? null, reason);
    }
    case "decode":
      // PayPal answered (e.status says how) but the body was unreadable, e.g. a sandbox bot-check page.
      return new PayPalError(e.status, e.headers.get("paypal-debug-id"), null, `PayPal sent an unreadable reply while ${action}. Try again in a minute.`);
    case "timeout":
    case "connection":
      return new PayPalError(0, null, null, "PayPal didn’t answer. Try again in a minute.");
    case "auth":
      return new PayPalError(401, null, null, "Cleared couldn’t sign in to PayPal. Try again later.");
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

const trackerOn = (order: Order, trackingNumber: string) => (order.purchaseUnits?.[0]?.shipping?.trackers ?? []).find((t) => t.id?.endsWith(trackingNumber));

/**
 * Re-reads the order to settle a write whose answer never arrived (paypal-plan.md, UNKNOWN OUTCOMES).
 * `found` and `absent` are facts PayPal stated; `unknown` means the re-read itself failed.
 */
export async function settleTracking(orderId: string, trackingNumber: string, client = sdk()) {
  try {
    const order = await client.orders.getOrder({ id: orderId });
    const tracker = trackerOn(order, trackingNumber);
    return tracker ? ({ state: "found", trackerId: tracker.id ?? null, status: tracker.status ?? null } as const) : ({ state: "absent" } as const);
  } catch {
    return { state: "unknown" } as const;
  }
}

export async function addTracking(input: { captureId: string; orderId?: string | null; carrier: CarrierKey; carrierNameOther?: string; trackingNumber: string }, client = sdk()): Promise<TrackingResult> {
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
    // Every member of the reply is optional, so an answer without our tracker is not a confirmation.
    const tracker = trackerOn(order, input.trackingNumber);
    if (tracker) return { outcome: "added", orderId, trackerId: tracker.id ?? null, status: tracker.status ?? null };
    return settle(orderId, input.trackingNumber, client, null);
  } catch (e) {
    // Sent, but no answer we can trust: a timeout, a dropped connection, an unreadable 2xx, or a 5xx.
    // Never-sent failures (auth, encode) and PayPal's 4xx answers are not re-read.
    if (e instanceof PaypalError) {
      const noAnswer = e.kind === "timeout" || e.kind === "connection" || (e.kind === "decode" && e.status < 300);
      if (noAnswer || (e.kind === "api" && e.status >= 500)) return settle(orderId, input.trackingNumber, client, noAnswer ? null : e);
    }
    throw toPayPalError(e, "adding the tracking");
  }
}

/** After an unclear write: found means added; a 5xx PayPal answered stays a failure; anything else is unknown. */
async function settle(orderId: string, trackingNumber: string, client: PaypalClient, answered: PaypalError | null): Promise<TrackingResult> {
  const found = await settleTracking(orderId, trackingNumber, client);
  if (found.state === "found") return { outcome: "added", orderId, trackerId: found.trackerId, status: found.status };
  if (answered && found.state === "absent") throw toPayPalError(answered, "adding the tracking");
  return { outcome: "unknown", orderId };
}
