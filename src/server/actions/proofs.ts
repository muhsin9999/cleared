"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { addTracking, CARRIERS, type CarrierKey } from "../paypal/tracking";

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
export async function addTrackingProof(saleId: string, _prev: TrackingState, form: FormData): Promise<TrackingState> {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.id, saleId), eq(s.sales.sellerId, seller.id)), with: { invoices: true } });
  if (!sale) return { error: "Sale not found." };
  const captureId = sale.paypalCaptureId ?? sale.invoices.find((i) => i.paypalPaymentId)?.paypalPaymentId;
  if (!captureId || captureId.startsWith("SEEDED")) return { error: "PayPal needs a real payment before tracking can be added. Wait for the client to pay." };
  const carrier = String(form.get("carrier") ?? "") as CarrierKey;
  const trackingNumber = String(form.get("trackingNumber") ?? "").replace(/\s+/g, "").toUpperCase();
  const carrierNameOther = String(form.get("carrierNameOther") ?? "").trim();
  if (!(carrier in CARRIERS)) return { error: "Choose the carrier." };
  if (!/^[A-Z0-9-]{6,40}$/.test(trackingNumber)) return { error: "That doesn’t look like a tracking number." };
  if (carrier === "OTHER" && !carrierNameOther) return { error: "Name the carrier." };
  try {
    const result = await addTracking({ captureId, orderId: sale.paypalOrderId, carrier, carrierNameOther, trackingNumber });
    await db.update(s.sales).set({ paypalOrderId: result.orderId, paypalCaptureId: captureId, status: sale.status === "paid" ? "delivered" : sale.status }).where(eq(s.sales.id, sale.id));
    await db.insert(s.proofs).values({ saleId, kind: "tracking", label: `${carrier === "OTHER" ? carrierNameOther : carrier} ${trackingNumber}`, meta: { carrier, trackingNumber, trackerId: result.trackerId, status: result.status } });
    await db.insert(s.events).values({ sellerId: seller.id, saleId, source: "cleared", type: "TRACKING.ADDED", summary: `Tracking sent to PayPal: ${carrier === "OTHER" ? carrierNameOther : carrier} ${trackingNumber}`, verified: true });
    await db.insert(s.audit).values({ sellerId: seller.id, kind: "paypal.tracking.add", subjectType: "sale", subjectId: sale.id, output: result, approvedBy: seller.id });
  } catch (e) {
    return { error: `PayPal didn’t accept the tracking: ${(e as Error).message}` };
  }
  revalidatePath(`/sales/${saleId}`);
  return { ok: true };
}
