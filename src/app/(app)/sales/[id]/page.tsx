import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheckIcon, CheckIcon, CreditCardIcon, ExternalLinkIcon, FileIcon, FileImageIcon, FileUpIcon, HourglassIcon, LockOpenIcon, MailIcon, MessageSquareTextIcon, PackageIcon, SendIcon, ShieldAlertIcon, ShieldCheckIcon, UserCheckIcon, type LucideIcon } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { CoverageDots } from "@/components/app/coverage-dots";
import { MessageProofForm } from "@/components/app/message-proof-form";
import { ProofDropzone } from "@/components/app/proof-dropzone";
import { TrackingForm } from "@/components/app/tracking-form";
import { EventList } from "@/components/app/event-row";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    { label: sale.releasedAt ? "Money released to Ada" : sale.expectedReleaseAt ? `Release expected ${shortDate(sale.expectedReleaseAt)}` : "Money released", at: sale.releasedAt },
  ];
  const current = steps.findIndex((s) => !s.at);

  return (
    <>
      <PageHeader
        back={{ href: "/sales", label: "All sales" }}
        title={sale.title}
        description={`${sale.clientName} · ${money(sale.amountCents)}${invoice?.invoiceNumber ? ` · Invoice #${invoice.invoiceNumber}` : ""}`}
        actions={<SaleStatusBadge status={sale.status} className="h-8 px-3 text-sm" />}
      />

      <Card className={cn("flex-col gap-4 border-l-4 px-5 py-4 sm:flex-row sm:items-center", next.tone === "risk" ? "border-l-risk" : next.tone === "done" ? "border-l-cleared bg-cleared-tint/40" : "border-l-cleared")}>
        <next.icon aria-hidden className={cn("size-6 shrink-0", next.tone === "risk" ? "text-risk" : "text-cleared-strong")} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{next.tone === "done" ? "Nothing to do" : "Next step"}</p>
          <p className="text-lg font-semibold text-pretty">{next.title}</p>
          <p className="text-sm text-muted-foreground text-pretty">{next.body}</p>
        </div>
        {next.cta ? (
          next.cta.external ? (
            <a href={next.cta.href} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>{next.cta.label} <ExternalLinkIcon aria-hidden /></a>
          ) : (
            <Link href={next.cta.href} className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>{next.cta.label}</Link>
          )
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:grid-rows-[auto_1fr] lg:items-start">
        <Card className="lg:col-start-2 lg:row-start-1">
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
                      <div className="min-w-0 pt-0.5">
                        <p className={cn("text-sm", done || isCurrent ? "font-medium" : "text-muted-foreground")}>{st.label}<span className="sr-only">{done ? " (done)" : isCurrent ? " (in progress)" : " (not yet)"}</span></p>
                        {st.at ? <p className="text-xs text-muted-foreground">{shortDate(st.at)}</p> : isCurrent ? <p className="text-xs text-cleared-strong">In progress</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheckIcon aria-hidden className="size-4 text-cleared" /> Proof locker</CardTitle>
              <CardDescription>What you delivered and what was agreed. If the client disputes, this is what Cleared’s AI builds the case from.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y rounded-lg border">
                {sale.proofs.filter((p) => p.kind === "file" || p.kind === "message").map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    {p.kind === "message" ? <MessageSquareTextIcon aria-hidden className="size-4 text-muted-foreground" /> : p.mimeType?.startsWith("image/") ? <FileImageIcon aria-hidden className="size-4 text-muted-foreground" /> : <FileIcon aria-hidden className="size-4 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      {p.fileKey ? (
                        <a href={`/api/proofs/${p.id}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">{p.fileName ?? p.label}</a>
                      ) : (
                        <p className="truncate text-sm font-medium">{p.fileName ?? p.label}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">{p.kind === "message" ? p.text : `${p.label} · ${((p.sizeBytes ?? 0) / 1_000_000).toFixed(1)} MB`}</p>
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={p.occurredAt.toISOString()}>{shortDate(p.occurredAt)}</time>
                  </li>
                ))}
                {!sale.proofs.some((p) => p.kind === "file" || p.kind === "message") ? <li className="px-4 py-6 text-center text-sm text-muted-foreground">No files or messages yet.</li> : null}
              </ul>
              <ProofDropzone saleId={sale.id} />
              <MessageProofForm saleId={sale.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>{sale.events.length ? <EventList events={sale.events} now={now} /> : <p className="text-sm text-muted-foreground">Nothing yet.</p>}</CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-start-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheckIcon aria-hidden className="size-4 text-cleared" /> Proof coverage</CardTitle>
              <CardDescription>{c.done} of {c.total} pieces of proof PayPal looks for.</CardDescription>
            </CardHeader>
            <CardContent><CoverageDots {...c} className="[&>span]:size-3" /></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheckIcon aria-hidden className="size-4" /> Client acceptance</CardTitle>
              <CardDescription>The client confirms receipt on a private page. Cleared records the time, IP and device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sale.proofs.filter((p) => p.kind === "acceptance").map((p) => {
                const meta = (p.meta ?? {}) as { name?: string; userAgent?: string };
                return (
                  <div key={p.id} className="rounded-lg bg-cleared-tint/70 px-3 py-2.5 text-sm">
                    <p className="flex items-center gap-1.5 font-medium text-cleared-strong"><CheckIcon aria-hidden className="size-4" /> Confirmed {shortDate(p.occurredAt)}</p>
                    <p className="text-xs text-muted-foreground">{meta.name} · {meta.userAgent}</p>
                  </div>
                );
              })}
              {sale.acceptanceToken ? (
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={`/accept/${sale.acceptanceToken}`} label="Copy acceptance link" toastMessage="Acceptance link copied" />
                  <Link href={`/accept/${sale.acceptanceToken}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm" })}>Preview</Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Available once the client has paid.</p>
              )}
            </CardContent>
          </Card>
          {sale.kind === "physical" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PackageIcon aria-hidden className="size-4" /> Tracking</CardTitle>
                <CardDescription>Sent to PayPal with the Add Tracking API. PayPal releases the hold about 24 hours after the carrier confirms delivery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sale.proofs.filter((p) => p.kind === "tracking").map((p) => (
                  <p key={p.id} className="flex items-center gap-2 rounded-md bg-cleared-tint/70 px-3 py-2 text-sm text-cleared-strong"><CheckIcon aria-hidden className="size-4" /> {p.label} · sent {shortDate(p.occurredAt)}</p>
                ))}
                {sale.paidAt ? <TrackingForm saleId={sale.id} /> : <p className="text-sm text-muted-foreground">Available once the client has paid.</p>}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MailIcon aria-hidden className="size-4" /> {invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : "No invoice yet"}</CardTitle>
              {invoice ? <CardDescription>{invoice.sentAt ? `Sent through PayPal ${shortDate(invoice.sentAt)}` : "Not sent yet"}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <Link href={`/sales/${sale.id}/invoice`} className={buttonVariants({ variant: "outline" })}>{invoice?.sentAt ? "View invoice" : "Review and send"}</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

type Next = { icon: LucideIcon; tone: "act" | "risk" | "done"; title: string; body: string; cta?: { label: string; href: string; external?: boolean } };

/** The one thing that moves this sale's money forward, in plain words. */
function nextStep(sale: SaleRow, x: { invoice: SaleRow["invoices"][number] | undefined; acceptance: boolean; days: number | null; dispute: SaleRow["disputes"][number] | null; files: boolean }): Next {
  if (x.dispute) return { icon: ShieldAlertIcon, tone: "risk", title: `${sale.clientName} opened a dispute`, body: "Cleared’s AI builds your reply from this sale’s proof locker. Nothing is sent to PayPal until you approve it.", cta: { label: "Open the case", href: `/cases/${x.dispute.id}` } };
  if (sale.releasedAt) return { icon: LockOpenIcon, tone: "done", title: `${money(sale.amountCents)} was released on ${shortDate(sale.releasedAt)}`, body: "PayPal has released this payment. The proof stays here in case the client ever disputes it." };
  if (!x.invoice?.sentAt) return { icon: SendIcon, tone: "act", title: "Send the invoice", body: "Cleared creates it in PayPal with the delivery terms and refund policy written in, so a reviewer can see what was agreed.", cta: { label: "Review and send", href: `/sales/${sale.id}/invoice` } };
  if (!sale.paidAt)
    return {
      icon: CreditCardIcon,
      tone: "act",
      title: `Waiting for ${sale.clientName} to pay`,
      body: `Invoice #${x.invoice.invoiceNumber} is with them on PayPal. When they pay, PayPal tells Cleared and this page updates by itself.`,
      cta: x.invoice.payerViewUrl ? { label: "Pay as the client", href: x.invoice.payerViewUrl, external: true } : undefined,
    };
  if (!x.files) return { icon: FileUpIcon, tone: "act", title: "Add what you delivered", body: "Upload the final files below. If the client ever says it never arrived, these are your proof." };
  if (!x.acceptance) return { icon: UserCheckIcon, tone: "act", title: "Ask the client to confirm they received it", body: "Copy the acceptance link and send it to them. Cleared records when and where they confirmed." };
  if (sale.kind === "physical") return { icon: PackageIcon, tone: "act", title: "Add tracking", body: "PayPal releases the hold about 24 hours after the carrier confirms delivery." };
  if (sale.completedMarkedAt && x.days !== null)
    return { icon: HourglassIcon, tone: "done", title: `${money(sale.amountCents)} releases in ${x.days} ${x.days === 1 ? "day" : "days"}`, body: "You marked the job complete in PayPal. PayPal releases service payments 7 days after that, as long as nothing changes. Your proof is complete." };
  return { icon: BadgeCheckIcon, tone: "act", title: "Mark the job complete in PayPal", body: "In PayPal: Activity → this payment → Get your money. Service payments release 7 days later." };
}
