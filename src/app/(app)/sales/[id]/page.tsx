import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon, FileIcon, FileImageIcon, HourglassIcon, MailIcon, MessageSquareTextIcon, PackageIcon, ShieldCheckIcon, UploadIcon, UserCheckIcon } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { CoverageDots } from "@/components/app/coverage-dots";
import { EventList } from "@/components/app/event-row";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysUntil, money, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { coverage, getSale } from "@/server/queries";

export default function SalePage({ params }: PageProps<"/sales/[id]">) {
  return (
    <PageBody>
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <Sale params={params} />
      </Suspense>
    </PageBody>
  );
}

const STEPS = ["sent", "paid", "delivered", "accepted", "released"] as const;

async function Sale({ params }: { params: PageProps<"/sales/[id]">["params"] }) {
  const now = await requestNow();
  const { id } = await params;
  const seller = await requireSeller();
  const sale = await getSale(seller.id, id);
  if (!sale) notFound();

  const reached = sale.releasedAt ? 4 : sale.proofs.some((p) => p.kind === "acceptance") ? 3 : sale.deliveredAt ? 2 : sale.paidAt ? 1 : sale.status === "sent" ? 0 : -1;
  const c = coverage(sale);
  const invoice = sale.invoices[0];
  const days = daysUntil(sale.expectedReleaseAt, now);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/sales" className="hover:text-foreground">Sales</Link>}
        title={sale.title}
        description={`${sale.clientName} · ${money(sale.amountCents)}${invoice?.invoiceNumber ? ` · Invoice #${invoice.invoiceNumber}` : ""}`}
        actions={<SaleStatusBadge status={sale.status} />}
      />

      <ol aria-label="Sale progress" className="grid grid-cols-5 gap-2">
        {STEPS.map((step, i) => (
          <li key={step} className="space-y-2">
            <div className={cn("h-1.5 rounded-full", i <= reached ? "bg-cleared" : "bg-border")} />
            <p className={cn("flex items-center gap-1 text-xs sm:text-sm", i <= reached ? "text-foreground" : "text-muted-foreground")}>
              {i <= reached ? <CheckIcon aria-hidden className="size-3.5 text-cleared" /> : null}
              <span className="capitalize">{step}</span>
              <span className="sr-only">{i <= reached ? "(done)" : "(not yet)"}</span>
            </p>
          </li>
        ))}
      </ol>

      {sale.paidAt && !sale.releasedAt ? (
        <Card className="flex-row items-start gap-4 border-cleared/25 bg-cleared-tint/60 px-5 py-4">
          <HourglassIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-cleared-strong" />
          <div className="space-y-1">
            <p className="font-medium">
              {sale.completedMarkedAt && days !== null ? `${money(sale.amountCents)} releases in ${days} days` : "PayPal is holding this payment"}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.kind === "physical"
                ? "Add tracking from an approved carrier. PayPal releases the hold about 24 hours after the carrier confirms delivery."
                : sale.completedMarkedAt
                  ? "You marked this order completed in PayPal. Services release 7 days after that, as long as nothing changes."
                  : "Mark the order completed in PayPal (Activity → this payment → Get your money). Services release 7 days later."}
            </p>
          </div>
        </Card>
      ) : null}

      <Tabs defaultValue="locker">
        <TabsList>
          <TabsTrigger value="locker">Proof locker</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="locker" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Deliverables and messages</CardTitle>
              <CardDescription>What you delivered and what was agreed. PayPal accepts JPG, PNG, GIF and PDF up to 10 MB each.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y rounded-lg border">
                {sale.proofs.filter((p) => p.kind === "file" || p.kind === "message").map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    {p.kind === "message" ? <MessageSquareTextIcon aria-hidden className="size-4 text-muted-foreground" /> : p.mimeType?.startsWith("image/") ? <FileImageIcon aria-hidden className="size-4 text-muted-foreground" /> : <FileIcon aria-hidden className="size-4 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.fileName ?? p.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.kind === "message" ? p.text : `${p.label} · ${((p.sizeBytes ?? 0) / 1_000_000).toFixed(1)} MB`}</p>
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={p.occurredAt.toISOString()}>{shortDate(p.occurredAt)}</time>
                  </li>
                ))}
                {!sale.proofs.some((p) => p.kind === "file" || p.kind === "message") ? <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing here yet.</li> : null}
              </ul>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-paper/60 px-4 py-8 text-center">
                <UploadIcon aria-hidden className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium">Drop delivered files here</p>
                <p className="text-xs text-muted-foreground">Uploads arrive with the proof locker build (day 6).</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
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
                  <CardDescription>Sent to PayPal with the Add Tracking API.</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card><CardContent className="pt-6"><EventList events={sale.events} now={now} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="invoice" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MailIcon aria-hidden className="size-4" /> {invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : "No invoice yet"}</CardTitle>
              {invoice ? <CardDescription>Status in PayPal: <Badge variant="outline">{invoice.status}</Badge></CardDescription> : null}
            </CardHeader>
            <CardContent>
              <Link href={`/sales/${sale.id}/invoice`} className={buttonVariants({ variant: "outline" })}>{invoice?.sentAt ? "View invoice" : "Review and send"}</Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
