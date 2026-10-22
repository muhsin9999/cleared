"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { PayPalError } from "../paypal/client";
import { addTracking, CARRIERS, type CarrierKey, orderForCapture, settleTracking, type TrackingResult } from "../paypal/tracking";

export type MessageProofState = { error?: string; ok?: boolean };

// Saves agreed scope or client messages as written proof on a sale.
export async function addMessageProof(saleId: string, _prev: MessageProofState, form: FormData): Promise<MessageProofState> {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.id, saleId), eq(s.sales.sellerId, seller.id)) });
  if (!sale) return { error: "Sale not found." };
  const text = String(form.get("text") ?? "").trim();
  if (text.length < 10) return { error: "Paste the message or agreement (at least a sentence)." };
  await db.insert(s.proofs).values({ saleId, kind: "message", label: String(form.get("label") ?? "").trim().slice(0, 120) || "Agreed scope", text: text.slice(0, 5000) });
  await db.insert(s.events).values({ sellerId: seller.id, saleId, source: "cleared", type: "PROOF.MESSAGE_ADDED", summary: "Agreed scope saved to the proof locker", verified: true });
  revalidatePath(`/sales/${saleId}`);
  return { ok: true };
}

export type TrackingState = { error?: string; ok?: boolean };

// Sends tracking to PayPal (Add Tracking) and keeps it as proof. Goods release ~24h after delivery (K4).
// The contract is paypal-plan.md: check the values, claim the tracking number, send it once, then record the
// result, release the claim if PayPal refused it, or keep it as "unconfirmed" if PayPal never answered.
export async function addTrackingProof(saleId: string, _prev: TrackingState, form: FormData): Promise<TrackingState> {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.id, saleId), eq(s.sales.sellerId, seller.id)), with: { invoices: true } });
  if (!sale) return { error: "Sale not found." };
  // The capture always comes from this sale's own payment, never from the form.
  const captureId = sale.paypalCaptureId ?? sale.invoices.find((i) => i.paypalPaymentId)?.paypalPaymentId;
  if (!captureId || captureId.startsWith("SEEDED")) return { error: "PayPal needs a real payment before tracking can be added. Wait for the client to pay." };
  const carrier = String(form.get("carrier") ?? "") as CarrierKey;
  const trackingNumber = String(form.get("trackingNumber") ?? "").replace(/\s+/g, "").toUpperCase();
  const carrierNameOther = String(form.get("carrierNameOther") ?? "").trim();
  if (!(carrier in CARRIERS)) return { error: "Choose the carrier." };
  if (!/^[A-Z0-9-]{6,40}$/.test(trackingNumber)) return { error: "That doesn’t look like a tracking number." };
  if (carrier === "OTHER" && !carrierNameOther) return { error: "Name the carrier." };
  const label = `${carrier === "OTHER" ? carrierNameOther : carrier} ${trackingNumber}`;

  // The claim: a unique index on (sale, tracking number) lets only one caller through.
  const [claim] = await db
    .insert(s.proofs)
    .values({ saleId, kind: "tracking", label, meta: { carrier, trackingNumber, status: "sending" } })
    .onConflictDoNothing()
    .returning({ id: s.proofs.id });
  let claimId = claim?.id;
  if (!claimId) {
    const existing = await db.query.proofs.findFirst({ where: and(eq(s.proofs.saleId, saleId), eq(s.proofs.kind, "tracking"), sql`${s.proofs.meta}->>'trackingNumber' = ${trackingNumber}`) });
    const status = (existing?.meta as { status?: string } | null)?.status;
    if (!existing || status !== "unconfirmed") return { error: status === "sending" ? "Cleared is already sending this tracking number." : "This tracking number is already on this sale." };
    // A tracking number whose answer never came back: ask PayPal before sending it again.
    const orderId = sale.paypalOrderId ?? (await orderForCapture(captureId).catch(() => null));
    const settled = orderId ? await settleTracking(orderId, trackingNumber) : ({ state: "unknown" } as const);
    if (settled.state === "found") return confirm(existing.id, { outcome: "added", orderId: orderId!, trackerId: settled.trackerId, status: settled.status });
    if (settled.state === "unknown") return { error: "PayPal still hasn’t confirmed this tracking number. Try again in a few minutes." };
    await db.update(s.proofs).set({ meta: { carrier, trackingNumber, status: "sending" } }).where(eq(s.proofs.id, existing.id));
    claimId = existing.id;
  }

  let result: TrackingResult;
  try {
    result = await addTracking({ captureId, orderId: sale.paypalOrderId, carrier, carrierNameOther, trackingNumber });
  } catch (e) {
    // PayPal refused it (or it never left): release the claim so a corrected attempt isn't blocked.
    await db.delete(s.proofs).where(eq(s.proofs.id, claimId));
    if (e instanceof PayPalError) await db.insert(s.audit).values({ sellerId: seller.id, kind: "paypal.tracking.refused", subjectType: "sale", subjectId: sale.id, output: { status: e.status, debugId: e.debugId, message: e.message } });
    return { error: e instanceof PayPalError ? e.message : `PayPal didn’t accept the tracking: ${(e as Error).message}` };
  }
  if (result.outcome === "unknown") {
    await db.update(s.proofs).set({ meta: { carrier, trackingNumber, status: "unconfirmed", orderId: result.orderId } }).where(eq(s.proofs.id, claimId));
    revalidatePath(`/sales/${saleId}`);
    return { error: "PayPal didn’t confirm the tracking yet. Cleared will check PayPal before sending it again." };
  }
  return confirm(claimId, result);

  async function confirm(id: string, r: Extract<TrackingResult, { outcome: "added" }>): Promise<TrackingState> {
    await db.update(s.proofs).set({ meta: { carrier, trackingNumber, trackerId: r.trackerId, status: r.status ?? "SHIPPED" } }).where(eq(s.proofs.id, id));
    await db.update(s.sales).set({ paypalOrderId: r.orderId, paypalCaptureId: captureId, status: sale!.status === "paid" ? "delivered" : sale!.status }).where(eq(s.sales.id, sale!.id));
    await db.insert(s.events).values({ sellerId: seller.id, saleId, source: "cleared", type: "TRACKING.ADDED", summary: `Tracking sent to PayPal: ${label}`, verified: true });
    await db.insert(s.audit).values({ sellerId: seller.id, kind: "paypal.tracking.add", subjectType: "sale", subjectId: sale!.id, output: r, approvedBy: seller.id });
    revalidatePath(`/sales/${saleId}`);
    return { ok: true };
  }
}
