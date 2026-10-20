"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { seedDemo } from "@/db/seed";
import { requireSeller } from "../auth";
import { createSession } from "../session";

// Demo panel actions. Until judge mode is wired to the sandbox (PLAN day 9) the dispute buttons
// create clearly labelled simulated records so the flow can be clicked through end to end.

export async function resetDemo() {
  const seller = await requireSeller();
  if (!seller.isDemo) throw new Error("Only demo workspaces can be reset");
  const { seller: id } = await seedDemo(db, seller.tag);
  await createSession({ sellerId: id, tag: seller.tag });
  revalidatePath("/", "layout");
  redirect("/home?reset=1");
}

export async function simulateDispute() {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.sellerId, seller.id), eq(s.sales.status, "accepted")) });
  if (!sale) return { ok: false as const, message: "No paid and delivered sale to dispute. Reset the demo first." };
  const [dispute] = await db
    .insert(s.disputes)
    .values({
      sellerId: seller.id,
      saleId: sale.id,
      paypalDisputeId: `SIM-${Date.now().toString(36).toUpperCase()}`,
      reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
      stage: "INQUIRY",
      status: "waiting_for_seller",
      paypalStatus: "WAITING_FOR_SELLER_RESPONSE",
      amountCents: sale.amountCents,
      buyerNote: "We never received the final files for the album cover.",
      responseDueAt: new Date(Date.now() + 10 * 86_400_000),
      allowedActions: ["provide_evidence", "accept_claim"],
    })
    .returning();
  await db.update(s.sales).set({ status: "disputed" }).where(eq(s.sales.id, sale.id));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: sale.id, type: "CUSTOMER.DISPUTE.CREATED", summary: `${sale.clientName} opened a dispute: “not received”`, simulated: true, verified: false, payload: { dispute_id: dispute.paypalDisputeId } });
  revalidatePath("/", "layout");
  return { ok: true as const, disputeId: dispute.id };
}

export async function resolveLatestDispute() {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.status, "under_review")) })
    ?? (await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.status, "waiting_for_seller")) }));
  if (!dispute) return { ok: false as const, message: "No open dispute to resolve." };
  await db.update(s.disputes).set({ status: "resolved_seller", paypalStatus: "RESOLVED", resolvedAt: new Date() }).where(eq(s.disputes.id, dispute.id));
  if (dispute.saleId) await db.update(s.sales).set({ status: "accepted" }).where(eq(s.sales.id, dispute.saleId));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, type: "CUSTOMER.DISPUTE.RESOLVED", summary: "Dispute closed in your favour", simulated: true, payload: { dispute_id: dispute.paypalDisputeId, outcome: "RESOLVED_SELLER_FAVOUR" } });
  revalidatePath("/", "layout");
  return { ok: true as const, disputeId: dispute.id };
}
