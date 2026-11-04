import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheckIcon, CheckIcon, CreditCardIcon, ExternalLinkIcon, FileUpIcon, HourglassIcon, LockOpenIcon, MailIcon, PackageIcon, SendIcon, ShieldAlertIcon, ShieldCheckIcon, UserCheckIcon, type LucideIcon } from "lucide-react";
import { Confirmed, DeliveryLink } from "@/components/app/delivery-link";
import { MessageProofForm } from "@/components/app/message-proof-form";
import { ProofDropzone } from "@/components/app/proof-dropzone";
import { TrackingForm } from "@/components/app/tracking-form";
import { isConfirmedProof } from "@/lib/proof-status";
import { EventList } from "@/components/app/event-row";
import { ProofList } from "@/components/app/proof-list";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { coverage, getSale } from "@/server/queries";

type SaleRow = NonNullable<Awaited<ReturnType<typeof getSale>>>;

export default function SalePage({ params }: PageProps<"/sales/[id]">) {
  return (
    <PageBody>
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <Sale params={params} />
      </Suspense>
    </PageBody>
  );
}

async function Sale({ params }: { params: PageProps<"/sales/[id]">["params"] }) {
  const now = await requestNow();
  const { id } = await params;
  const seller = await requireSeller();
  const sale = await getSale(seller.id, id);
  if (!sale) notFound();

  const c = coverage(sale);
  const invoice = sale.invoices[0];
  const days = daysUntil(sale.expectedReleaseAt, now);
  const acceptance = sale.proofs.find((p) => p.kind === "acceptance");
  const dispute = sale.disputes.find((d) => !d.status.startsWith("resolved") && d.status !== "closed") ?? null;
  const next = nextStep(sale, { invoice, acceptance: !!acceptance, days, dispute, files: c.done > 0 });

  // Where the money is, newest step last. A step without a date hasn't happened yet.
  const steps = [
    { label: "Invoice sent", at: invoice?.sentAt ?? null },
    { label: `${sale.clientName} paid`, at: sale.paidAt },
    { label: "Work delivered", at: sale.deliveredAt },
    { label: "Client confirmed receipt", at: acceptance?.occurredAt ?? null },
    { label: sale.releasedAt ? "Money released to you" : sale.expectedReleaseAt ? `Release expected ${shortDate(sale.expectedReleaseAt)}` : "Money released", at: sale.releasedAt },
  ];
  const current = steps.findIndex((s) => !s.at);
  const checklist = [
    { label: "Terms on the PayPal invoice", ok: !!invoice?.sentAt },
    { label: "Files you delivered", ok: c.files },
    { label: `${sale.clientName} confirmed`, ok: !!acceptance },
    ...(sale.kind === "physical" ? [{ label: "Tracking", ok: c.tracking }] : []),
  ];
  const proofItems = sale.proofs.map((p) => ({
    id: p.id,
    label: p.fileName ?? p.label,
    kind: p.kind,
    date: p.occurredAt.toISOString(),
    mime: p.mimeType,
    size: p.sizeBytes,
    file: !!p.fileKey,
    text: p.text,
    meta: p.meta as Record<string, unknown> | null,
    sub: p.kind === "message" ? (p.text ?? p.label) : p.kind === "acceptance" ? `${(p.meta as { name?: string } | null)?.name ?? "Client"} confirmed` : p.label,
  }));

  return (
    <>
      <PageHeader
        back={{ href: "/sales", label: "All sales" }}
        title={sale.title}
        description={`${sale.clientName} · ${money(sale.amountCents)}${invoice?.invoiceNumber ? ` · Invoice #${invoice.invoiceNumber}` : ""}`}
        actions={<SaleStatusBadge status={sale.status} className="h-8 px-3 text-sm" />}
      />

      <section aria-label={next.tone === "done" ? "Status" : "Next step"} className={cn("flex flex-col gap-4 rounded-[10px] border px-4 py-4 sm:flex-row sm:items-center sm:px-5", next.tone === "risk" ? "border-risk/25 bg-risk-tint/40" : next.tone === "done" ? "border-cleared/20 bg-cleared-tint/40" : "bg-surface")}>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", next.tone === "risk" ? "bg-risk/10 text-risk" : "bg-cleared-tint text-cleared-strong")}>
          <next.icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pretty">{next.title}</p>
          <p className="text-sm text-muted-foreground text-pretty">{next.body}</p>
        </div>
        {next.cta ? (
          next.cta.external ? (
            <a href={next.cta.href} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>{next.cta.label} <ExternalLinkIcon aria-hidden /></a>
          ) : (
            <Link href={next.cta.href} className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>{next.cta.label}</Link>
          )
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2"><ShieldCheckIcon aria-hidden className="size-4 text-cleared" /> Proof</CardTitle>
              <span className="text-xs text-muted-foreground">{checklist.filter((x) => x.ok).length} of {checklist.length} covered</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* What a dispute would be answered with, in plain words: each piece Cleared keeps for this sale. */}
              <ul aria-label="Proof checklist" className="flex flex-wrap gap-2">
                {checklist.map((x) => (
                  <li key={x.label} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", x.ok ? "border-cleared/30 bg-cleared-tint/50 text-cleared-strong" : "text-muted-foreground")}>
                    {x.ok ? <CheckIcon aria-hidden className="size-3.5" /> : <span aria-hidden className="size-2 rounded-full border border-current" />}
                    {x.label}
                    <span className="sr-only">{x.ok ? " (done)" : " (not yet)"}</span>
                  </li>
                ))}
              </ul>
              <ProofList items={proofItems} />
              <ProofDropzone saleId={sale.id} />
              <MessageProofForm saleId={sale.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>{sale.events.length ? <EventList events={sale.events} now={now} /> : <p className="text-sm text-muted-foreground">Nothing yet.</p>}</CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent>
              <ol aria-label="Sale progress" className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-border">
                {steps.map((st, i) => {
                  const done = !!st.at;
                  const isCurrent = i === current;
                  return (
                    <li key={st.label} className="relative flex gap-3">
                      <span className={cn("relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 bg-surface", done ? "border-cleared bg-cleared text-primary-foreground" : isCurrent ? "border-cleared" : "border-line")}>
                        {done ? <CheckIcon aria-hidden className="size-3.5" /> : isCurrent ? <span aria-hidden className="size-2 rounded-full bg-cleared" /> : null}
                      </span>
                      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-0.5">
                        <p className={cn("text-sm", done || isCurrent ? "font-medium" : "text-muted-foreground")}>
                          {st.label}
                          <span className="sr-only">{done ? " (done)" : isCurrent ? " (in progress)" : " (not yet)"}</span>
                        </p>
                        {st.at ? <span className="shrink-0 text-xs text-muted-foreground">{shortDate(st.at)}</span> : isCurrent ? <span className="shrink-0 text-xs text-cleared-strong">Now</span> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Link href={`/sales/${sale.id}/invoice`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5")}>
                <MailIcon aria-hidden /> {invoice?.sentAt ? `Invoice #${invoice.invoiceNumber}` : "Review the invoice"}
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserCheckIcon aria-hidden className="size-4" /> Deliver to {sale.clientName}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {acceptance ? (
                <Confirmed
                  name={(acceptance.meta as { name?: string } | null)?.name ?? sale.clientName}
                  when={shortDate(acceptance.occurredAt)}
                  device={(acceptance.meta as { userAgent?: string } | null)?.userAgent}
                />
              ) : !sale.acceptanceToken ? (
                <p className="text-sm text-muted-foreground">Ready once {sale.clientName} has paid.</p>
              ) : !c.files ? (
                <p className="text-sm text-muted-foreground text-pretty">Add the final files under Proof. Then send {sale.clientName} the delivery link to confirm.</p>
              ) : (
                <DeliveryLink path={`/accept/${sale.acceptanceToken}`} client={sale.clientName} />
              )}
            </CardContent>
          </Card>
          {sale.kind === "physical" ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PackageIcon aria-hidden className="size-4" /> Tracking</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {sale.proofs.filter((p) => p.kind === "tracking").map((p) => (
                  isConfirmedProof(p) ? (
                    <p key={p.id} className="flex items-center gap-2 text-sm text-cleared-strong"><CheckIcon aria-hidden className="size-4" /> {p.label} · sent {shortDate(p.occurredAt)}</p>
                  ) : (
                    <p key={p.id} className="text-sm text-caution">{p.label} · PayPal hasn’t confirmed it yet. Send it again and Cleared checks PayPal first.</p>
                  )
                ))}
                {sale.paidAt ? <TrackingForm saleId={sale.id} /> : <p className="text-sm text-muted-foreground">Available once the client has paid.</p>}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

type Next = { icon: LucideIcon; tone: "act" | "risk" | "done"; title: string; body: string; cta?: { label: string; href: string; external?: boolean } };

/** The one thing that moves this sale's money forward, in plain words. */
function nextStep(sale: SaleRow, x: { invoice: SaleRow["invoices"][number] | undefined; acceptance: boolean; days: number | null; dispute: SaleRow["disputes"][number] | null; files: boolean }): Next {
  if (x.dispute) return { icon: ShieldAlertIcon, tone: "risk", title: `${sale.clientName} opened a dispute`, body: "Cleared AI builds your reply. You approve it.", cta: { label: "Open the case", href: `/cases/${x.dispute.id}` } };
  if (sale.releasedAt) return { icon: LockOpenIcon, tone: "done", title: `${money(sale.amountCents)} was released on ${shortDate(sale.releasedAt)}`, body: "Proof stays here in case of a dispute." };
  if (!x.invoice?.sentAt) return { icon: SendIcon, tone: "act", title: "Send the invoice", body: "Terms and refund policy are written in.", cta: { label: "Review and send", href: `/sales/${sale.id}/invoice` } };
  if (!sale.paidAt)
    return {
      icon: CreditCardIcon,
      tone: "act",
      title: `Waiting for ${sale.clientName} to pay`,
      body: `Invoice #${x.invoice.invoiceNumber} is with them on PayPal.`,
      cta: x.invoice.payerViewUrl ? { label: "Pay as the client", href: x.invoice.payerViewUrl, external: true } : undefined,
    };
  if (!x.files) return { icon: FileUpIcon, tone: "act", title: "Add the files you delivered", body: "Your proof if they say it never arrived." };
  if (!x.acceptance) return { icon: UserCheckIcon, tone: "act", title: `Send ${sale.clientName} the delivery link`, body: "They confirm with one click that they got the files." };
  if (sale.kind === "physical") return { icon: PackageIcon, tone: "act", title: "Add tracking", body: "PayPal releases the hold about 24 hours after the carrier confirms delivery." };
  if (sale.completedMarkedAt && x.days !== null)
    return { icon: HourglassIcon, tone: "done", title: `${money(sale.amountCents)} releases in ${x.days} ${x.days === 1 ? "day" : "days"}`, body: "PayPal releases service payments 7 days after the job is marked complete." };
  return { icon: BadgeCheckIcon, tone: "act", title: "Mark the job complete in PayPal", body: "Payment releases 7 days later." };
}
