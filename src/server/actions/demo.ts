"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { seedDemo } from "@/db/seed";
import { reasonText } from "@/lib/paypal-events";
import { requireSeller } from "../auth";
import { adjudicate, claimPoolDispute } from "../paypal/disputes";
import { createSession } from "../session";
import { ensureDraft } from "../workflows";

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

export async function simulateDispute(useReal = true) {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.sellerId, seller.id), eq(s.sales.status, "accepted")) });
  if (!sale) return { ok: false as const, message: "No paid and delivered sale to dispute. Reset the demo first." };

  // Prefer a real sandbox dispute from the stock; it then behaves exactly like one PayPal sent us.
  try {
    const real = useReal ? await claimPoolDispute(seller.id, sale.id, sale.amountCents) : null;
    if (real) {
      await db
        .insert(s.events)
        .values({ sellerId: seller.id, saleId: sale.id, paypalEventId: `pool:${real.paypalDisputeId}:claimed`, type: "CUSTOMER.DISPUTE.CREATED", summary: `${sale.clientName} opened a dispute: ${reasonText(real.reason)}`, verified: true, payload: { dispute_id: real.paypalDisputeId, via: "sandbox stock" } })
        .onConflictDoNothing({ target: s.events.paypalEventId });
      await ensureDraft(real.id);
      revalidatePath("/", "layout");
      return { ok: true as const, disputeId: real.id };
    }
  } catch (e) {
    console.warn("Dispute stock unavailable, falling back to a simulated dispute:", (e as Error).message);
  }

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
  await ensureDraft(dispute.id);
  revalidatePath("/", "layout");
  return { ok: true as const, disputeId: dispute.id };
}

export async function resolveLatestDispute() {
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.status, "under_review")) })
    ?? (await db.query.disputes.findFirst({ where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.status, "waiting_for_seller")) }));
  if (!dispute) return { ok: false as const, message: "No open dispute to resolve." };
  if (!dispute.paypalDisputeId.startsWith("SIM-")) {
    // A real sandbox dispute is only ever decided by PayPal. Never fake the outcome.
    const r = await adjudicate(dispute.paypalDisputeId, "SELLER_FAVOR");
    if (!r.ok) return { ok: false as const, message: `PayPal hasn’t opened this case for a decision yet (${r.status.toLowerCase().replaceAll("_", " ")}). In the sandbox that can take a while after evidence is sent.` };
    await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, source: "paypal", type: "CUSTOMER.DISPUTE.RESOLVED", summary: "PayPal closed the dispute in your favour (sandbox decision)", verified: true, payload: { dispute_id: dispute.paypalDisputeId } });
    revalidatePath("/", "layout");
    return { ok: true as const, disputeId: dispute.id };
  }
  await db.update(s.disputes).set({ status: "resolved_seller", paypalStatus: "RESOLVED", resolvedAt: new Date() }).where(eq(s.disputes.id, dispute.id));
  if (dispute.saleId) await db.update(s.sales).set({ status: "accepted" }).where(eq(s.sales.id, dispute.saleId));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: dispute.saleId, type: "CUSTOMER.DISPUTE.RESOLVED", summary: "Dispute closed in your favour", simulated: true, payload: { dispute_id: dispute.paypalDisputeId, outcome: "RESOLVED_SELLER_FAVOUR" } });
  revalidatePath("/", "layout");
  return { ok: true as const, disputeId: dispute.id };
}

/** "Start here", step 1: brings in a dispute on Ada's delivered album cover and opens the case room. */
export async function startDisputeTour() {
  const seller = await requireSeller();
  if (!seller.isDemo) throw new Error("Only demo workspaces have the tour");
  const existing = await db.query.disputes.findFirst({ where: eq(s.disputes.sellerId, seller.id), columns: { id: true } });
  if (existing) redirect(`/cases/${existing.id}`);
  // Local runs and e2e set DEMO_TEST_DISPUTES so they never use up the real sandbox disputes kept for judges.
  const r = await simulateDispute(process.env.DEMO_TEST_DISPUTES !== "true");
  if (!r.ok) redirect("/cases");
  redirect(`/cases/${r.disputeId}`);
}
