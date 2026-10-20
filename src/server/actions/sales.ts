"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { preflight } from "@/lib/preflight";
import { requireSeller } from "../auth";

const Draft = z.object({
  clientName: z.string().trim().min(1, "Add the client’s name"),
  clientEmail: z.email("Use a valid email"),
  title: z.string().trim().min(3, "Give the sale a short title"),
  description: z.string().trim().min(10, "Describe what you’re delivering"),
  kind: z.enum(["service", "digital", "physical"]),
  amountCents: z.number().int().positive("Enter an amount"),
  depositPercent: z.number().int().min(10).max(90).nullable(),
  deliveryDays: z.number().int().min(1).max(365).nullable(),
  refundTerms: z.string(),
});

export async function sellerHistory() {
  const seller = await requireSeller();
  const paid = await db.query.sales.findMany({ where: and(eq(s.sales.sellerId, seller.id), isNotNull(s.sales.paidAt)), columns: { amountCents: true } });
  return {
    pastSales: paid.length,
    averageCents: paid.length ? Math.round(paid.reduce((sum, x) => sum + x.amountCents, 0) / paid.length) : null,
    accountAgeDays: seller.accountOpenedAt ? Math.floor((Date.now() - seller.accountOpenedAt.getTime()) / 86_400_000) : null,
  };
}

export async function createSale(input: z.input<typeof Draft>) {
  const seller = await requireSeller();
  const parsed = Draft.safeParse(input);
  if (!parsed.success) return { ok: false as const, errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const result = preflight(d, await sellerHistory());
  const chargedCents = d.depositPercent ? Math.round((d.amountCents * d.depositPercent) / 100) : d.amountCents;

  const [sale] = await db
    .insert(s.sales)
    .values({
      sellerId: seller.id,
      clientName: d.clientName,
      clientEmail: d.clientEmail,
      title: d.title,
      description: d.description,
      kind: d.kind,
      amountCents: chargedCents,
      depositPercent: d.depositPercent,
      deliveryDueAt: d.deliveryDays ? new Date(Date.now() + d.deliveryDays * 86_400_000) : null,
      readinessScore: result.score,
      preflight: result,
      acceptanceToken: randomBytes(12).toString("base64url"),
    })
    .returning();

  await db.insert(s.invoices).values({
    saleId: sale.id,
    draft: {
      items: [{ name: d.depositPercent ? `${d.title}: deposit (${d.depositPercent}%)` : d.title, description: d.description, quantity: "1", unitAmount: (chargedCents / 100).toFixed(2) }],
      note: d.deliveryDays ? `Delivered within ${d.deliveryDays} days of payment.` : undefined,
      terms: d.refundTerms || undefined,
    },
  });
  await db.insert(s.events).values({ sellerId: seller.id, saleId: sale.id, source: "cleared", type: "PREFLIGHT.COMPLETED", summary: `Pre-flight check for “${d.title}”: ${result.score}/100`, verified: true });
  redirect(`/sales/${sale.id}/invoice`);
}

// Day 2 wireframe: marks the invoice as sent. Day 5 replaces this with Invoicing v2 create → send (scripts/spikes/03-invoice.mjs).
export async function sendInvoice(saleId: string) {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.sellerId, seller.id), eq(s.sales.id, saleId)), with: { invoices: true } });
  if (!sale) return { ok: false as const, message: "Sale not found" };
  const invoice = sale.invoices[0];
  const number = String(8 + (await db.$count(s.invoices))).padStart(4, "0");
  await db.update(s.invoices).set({ status: "SENT", invoiceNumber: number, sentAt: new Date() }).where(eq(s.invoices.id, invoice.id));
  await db.update(s.sales).set({ status: "sent" }).where(eq(s.sales.id, sale.id));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: sale.id, source: "cleared", type: "INVOICING.INVOICE.SENT", summary: `Invoice #${number} sent to ${sale.clientName}`, simulated: true, verified: false });
  redirect(`/sales/${sale.id}?sent=1`);
}
