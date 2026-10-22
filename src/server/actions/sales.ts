"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { type Finding, preflight, scoreWith } from "@/lib/preflight";
import { requireSeller } from "../auth";
import { fakeAiEnabled, fakePreflight } from "../ai/fake-client";
import { aiPreflight } from "../ai/preflight";
import { PayPalError } from "../paypal/client";
import { createAndSendInvoice, type InvoiceDraft } from "../paypal/invoicing";

const Draft = z.object({
  clientName: z.string().trim().min(1, "Add the client’s name"),
  clientEmail: z.email("Use a valid email"),
  title: z.string().trim().min(3, "Give the sale a short title"),
  description: z.string().trim().min(10, "Describe what you’re delivering"),
  kind: z.enum(["service", "digital", "physical", "other"]),
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

export async function createSale(input: z.input<typeof Draft>, aiFindings: Finding[] = []) {
  const seller = await requireSeller();
  const parsed = Draft.safeParse(input);
  if (!parsed.success) return { ok: false as const, errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const base = preflight(d, await sellerHistory());
  const ai = aiFindings.filter((f) => f.source === "ai").slice(0, 3);
  const result = { score: scoreWith(base, ai, d), findings: [...base.findings, ...ai] };
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

/** In the sandbox the payer must be a sandbox account: PayPal can't take payment on an invoice
 *  addressed to an email that isn't one (20 Oct test). Demo invoices go to the sandbox buyer. */
function payerEmail(clientEmail: string) {
  const sandboxBuyer = process.env.PAYPAL_SANDBOX_BUYER_EMAIL;
  return process.env.PAYPAL_ENV !== "live" && process.env.DEMO_MODE === "true" && sandboxBuyer ? sandboxBuyer : clientEmail;
}

// Invoicing v2 create → send (F2). On a PayPal error the draft is kept and the reason is returned.
export async function sendInvoice(saleId: string) {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.sellerId, seller.id), eq(s.sales.id, saleId)), with: { invoices: true } });
  if (!sale) return { ok: false as const, message: "Sale not found" };
  const invoice = sale.invoices[0];
  if (!invoice) return { ok: false as const, message: "This sale has no invoice draft" };
  if (invoice.sentAt) redirect(`/sales/${sale.id}`);

  let sent: Awaited<ReturnType<typeof createAndSendInvoice>>;
  try {
    sent = await createAndSendInvoice({
      workspaceTag: seller.tag,
      saleId: sale.id,
      sellerName: seller.businessName ?? seller.name,
      clientName: sale.clientName,
      clientEmail: payerEmail(sale.clientEmail),
      draft: invoice.draft as InvoiceDraft,
    });
  } catch (e) {
    const detail = e instanceof PayPalError ? ((e.body as { details?: { description?: string }[] } | null)?.details?.[0]?.description ?? e.message) : "PayPal didn’t respond";
    return { ok: false as const, message: `PayPal didn’t accept the invoice: ${detail}. Your draft is saved; try again.` };
  }

  await db.update(s.invoices).set({ status: sent.status, invoiceNumber: sent.number, paypalInvoiceId: sent.id, payerViewUrl: sent.payerViewUrl, sentAt: new Date() }).where(eq(s.invoices.id, invoice.id));
  await db.update(s.sales).set({ status: "sent" }).where(eq(s.sales.id, sale.id));
  await db.insert(s.events).values({ sellerId: seller.id, saleId: sale.id, source: "cleared", type: "INVOICING.INVOICE.SENT", summary: `Invoice #${sent.number} sent to ${sale.clientName} through PayPal`, verified: true, payload: { invoice_id: sent.id } });
  await db.insert(s.audit).values({ sellerId: seller.id, kind: "paypal.invoice.send", subjectType: "invoice", subjectId: invoice.id, output: { paypalInvoiceId: sent.id, number: sent.number }, approvedBy: seller.id });
  redirect(`/sales/${sale.id}?sent=1`);
}

// AI pre-flight suggestions for the "Check" step. Never blocks the sale: on failure the UI says so and the
// rule-based findings remain.
export async function suggestFindings(input: z.input<typeof Draft>) {
  const seller = await requireSeller();
  const parsed = Draft.partial({ clientName: true, clientEmail: true }).safeParse(input);
  if (!parsed.success) return { ok: false as const, findings: [] };
  const draft = { clientName: "", clientEmail: "", ...parsed.data } as z.infer<typeof Draft>;
  try {
    const history = await sellerHistory();
    if (fakeAiEnabled()) return { ok: true as const, findings: await fakePreflight() };
    const findings = await aiPreflight(seller.id, draft, history, preflight(draft, history).findings);
    return { ok: true as const, findings };
  } catch (e) {
    console.warn("AI pre-flight unavailable:", (e as Error).message);
    return { ok: false as const, findings: [] };
  }
}
