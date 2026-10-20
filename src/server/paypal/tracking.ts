// Add Tracking (F3/F4) with PayPal's official Server SDK (@paypal/paypal-server-sdk), the code path for
// the APIMatic sponsor track. Works for invoice payments too: an invoice payment is a capture whose
// supplementary data names its order (verified 20 Oct 2026, docs/PAYPAL.md §8 Q2).
import "server-only";
import "@/lib/net";
import { ApiError, Client, Environment, OrdersController, PaymentsController, ShipmentCarrier } from "@paypal/paypal-server-sdk";

let client: Client | undefined;
function sdk() {
  return (client ??= new Client({
    clientCredentialsAuthCredentials: { oAuthClientId: process.env.PAYPAL_CLIENT_ID!, oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET! },
    environment: process.env.PAYPAL_ENV === "live" ? Environment.Production : Environment.Sandbox,
    timeout: 20_000,
  }));
}

export const CARRIERS = { UPS: ShipmentCarrier.Ups, USPS: ShipmentCarrier.Usps, FEDEX: ShipmentCarrier.Fedex, DHL: ShipmentCarrier.DhlApi, OTHER: ShipmentCarrier.Other } as const;
export type CarrierKey = keyof typeof CARRIERS;

/** Finds the PayPal order behind a capture (invoice payments included). */
export async function orderForCapture(captureId: string) {
  const { result } = await withRetry(() => new PaymentsController(sdk()).getCapturedPayment({ captureId }));
  return result.supplementaryData?.relatedIds?.orderId ?? null;
}

/** PayPal's sandbox sometimes answers with a Cloudflare bot-check page instead of JSON; retry those. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const transient = e instanceof ApiError ? e.statusCode >= 500 || String(e.body ?? "").includes("<html") : /<html|ECONNRESET|ETIMEDOUT/i.test(String(e));
      if (!transient || i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 800 * i));
    }
  }
}

export async function addTracking(input: { captureId: string; orderId?: string | null; carrier: CarrierKey; carrierNameOther?: string; trackingNumber: string }) {
  const orderId = input.orderId ?? (await orderForCapture(input.captureId));
  if (!orderId) throw new Error("PayPal didn’t return an order for this payment");
  try {
    const { result } = await withRetry(() => new OrdersController(sdk()).createOrderTracking({
      id: orderId,
      body: {
        captureId: input.captureId,
        trackingNumber: input.trackingNumber,
        carrier: CARRIERS[input.carrier],
        carrierNameOther: input.carrier === "OTHER" ? input.carrierNameOther : undefined,
        notifyPayer: true,
      },
    }));
    const tracker = result.purchaseUnits?.[0]?.shipping?.trackers?.find((t) => t.id?.endsWith(input.trackingNumber)) ?? result.purchaseUnits?.[0]?.shipping?.trackers?.at(-1);
    return { orderId, trackerId: tracker?.id ?? null, status: tracker?.status ?? null };
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.result as { details?: { description?: string }[]; message?: string } | undefined;
      throw new Error(body?.details?.[0]?.description ?? body?.message ?? `PayPal returned ${e.statusCode}`);
    }
    throw e;
  }
}
