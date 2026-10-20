import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StampMark } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/lib/format";
import type { Finding } from "@/lib/preflight";
import { requireSeller } from "@/server/auth";
import { getSale } from "@/server/queries";
import { SendInvoice } from "./send-invoice";

export const metadata = { title: "Invoice" };

type Draft = { items: { name: string; description?: string; quantity: string; unitAmount: string }[]; note?: string; terms?: string };

export default function InvoicePage({ params }: PageProps<"/sales/[id]/invoice">) {
  return (
    <PageBody>
      <Suspense fallback={<Skeleton className="h-[36rem]" />}>
        <Invoice params={params} />
      </Suspense>
    </PageBody>
  );
}

async function Invoice({ params }: { params: PageProps<"/sales/[id]/invoice">["params"] }) {
  const { id } = await params;
  const seller = await requireSeller();
  const sale = await getSale(seller.id, id);
  if (!sale) notFound();
  const invoice = sale.invoices[0];
  if (!invoice) notFound();
  const draft = invoice.draft as Draft;
  const findings = ((sale.preflight as { findings?: Finding[] } | null)?.findings ?? []).filter((f) => f.severity !== "info");

  return (
    <>
      <PageHeader eyebrow={<Link href={`/sales/${sale.id}`} className="hover:text-foreground">{sale.title}</Link>} title={invoice.sentAt ? `Invoice #${invoice.invoiceNumber}` : "Review the invoice"} description={invoice.sentAt ? "Sent through PayPal. The client pays on PayPal’s own page." : "This is what PayPal will email the client. Check every line."} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <article aria-label="Invoice preview" className="relative rounded-[10px] border bg-surface px-6 py-8 shadow-soft sm:px-10">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
            <div>
              <p className="text-lg font-semibold tracking-[-0.01em]">{seller.businessName ?? seller.name}</p>
              <p className="text-sm text-muted-foreground">{seller.email}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Invoice</p>
              <p className="font-mono">{invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : "Draft"}</p>
            </div>
          </header>
          <section className="grid gap-1 py-6 text-sm">
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Bill to</p>
            <p className="font-medium">{sale.clientName}</p>
            <p className="text-muted-foreground">{sale.clientEmail}</p>
          </section>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs tracking-[0.08em] text-muted-foreground uppercase"><th className="py-2 font-medium">Item</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
            <tbody>
              {draft.items.map((it) => (
                <tr key={it.name} className="border-b align-top">
                  <td className="py-3 pr-4"><p className="font-medium">{it.name}</p>{it.description ? <p className="mt-0.5 text-muted-foreground text-pretty">{it.description}</p> : null}</td>
                  <td className="py-3 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{money(Math.round(Number(it.unitAmount) * 100))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={2} className="pt-4 text-right font-medium">Total due</td><td className="pt-4 text-right text-lg font-semibold tabular-nums">{money(sale.amountCents)}</td></tr></tfoot>
          </table>
          {draft.note || draft.terms ? (
            <section className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              {draft.note ? <div><p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Delivery</p><p className="mt-1">{draft.note}</p></div> : null}
              {draft.terms ? <div><p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Terms</p><p className="mt-1">{draft.terms}</p></div> : null}
            </section>
          ) : null}
          {invoice.sentAt ? <StampMark className="absolute top-6 right-6 size-16 rotate-[-12deg] text-cleared/70" title="Sent" /> : null}
        </article>
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Why this wording helps</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {findings.length ? findings.map((f) => <li key={f.id}><p className="font-medium">{f.title}</p><p className="text-muted-foreground">Addressed by PayPal rule {f.ruleRef}.</p></li>) : <li className="text-muted-foreground">Clear items, a delivery date and written terms are what PayPal and the client both look for.</li>}
              </ul>
            </CardContent>
          </Card>
          {invoice.sentAt ? null : <SendInvoice saleId={sale.id} clientEmail={sale.clientEmail} amount={money(sale.amountCents)} />}
        </aside>
      </div>
    </>
  );
}
