import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CircleAlertIcon, FileWarningIcon, HourglassIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";
import { EventList } from "@/components/app/event-row";
import { MoneyFlow } from "@/components/app/money-flow";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { getHome } from "@/server/queries";

export const metadata = { title: "Home" };

export default function HomePage() {
  return (
    <PageBody>
      <Suspense fallback={<HomeSkeleton />}>
        <Home />
      </Suspense>
    </PageBody>
  );
}

async function Home() {
  const now = await requestNow();
  const seller = await requireSeller();
  const home = await getHome(seller.id);
  const firstName = seller.name.split(" ")[0];
  const releaseDays = daysUntil(home.nextRelease, now);

  const actions = [
    ...home.openDisputes.map((d) => ({ key: d.id, tone: "risk" as const, icon: CircleAlertIcon, title: `A client opened a dispute for ${money(d.amountCents)}`, body: "Cleared is preparing an evidence packet. Review it before the deadline.", href: `/cases/${d.id}`, cta: "Open case" })),
    ...home.missingProof.map((s) => ({ key: s.id, tone: "caution" as const, icon: FileWarningIcon, title: `Proof missing on “${s.title}”`, body: "Add the delivered files and send the acceptance link so this payment is protected.", href: `/sales/${s.id}`, cta: "Add proof" })),
  ];

  if (!home.sales.length) return <EmptyHome name={firstName} />;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}
        title={`Good to see you, ${firstName}.`}
        description={actions.length ? "One thing needs you today." : "Everything is in order. Your proof is up to date."}
        actions={<Link href="/sales/new" className={buttonVariants()}>New sale</Link>}
      />

      {actions.length ? (
        <section aria-label="Action needed" className="space-y-3">
          {actions.map((a) => (
            <Card key={a.key} className={cn("flex-row items-center gap-4 border-l-4 px-5 py-4", a.tone === "risk" ? "border-l-risk" : "border-l-caution")}>
              <a.icon aria-hidden className={cn("size-5 shrink-0", a.tone === "risk" ? "text-risk" : "text-caution")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.body}</p>
              </div>
              <Link href={a.href} className={buttonVariants({ variant: a.tone === "risk" ? "default" : "outline", size: "sm" })}>{a.cta}</Link>
            </Card>
          ))}
        </section>
      ) : null}

      <section aria-label="Account health" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={WalletIcon} label="Funds in flight" value={<MoneyFlow cents={home.fundsInFlightCents} />} hint="Paid, not yet released" />
        <Stat icon={HourglassIcon} label="Next release" value={releaseDays !== null ? `${releaseDays} days` : "—"} hint={home.nextReleaseSale ? `${money(home.nextReleaseSale.amountCents)} · ${home.nextReleaseSale.clientName}` : "Nothing on hold"} />
        <Stat icon={ShieldCheckIcon} label="Proof coverage" value={home.proofCoverage !== null ? `${home.proofCoverage}%` : "—"} hint="Paid sales with files and client acceptance" />
        <Stat icon={CircleAlertIcon} label="Open cases" value={String(home.openDisputes.length)} hint={home.openDisputes.length ? "Needs a response" : "No disputes or notices"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent sales</CardTitle>
            <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">All sales <ArrowRightIcon aria-hidden className="size-3.5" /></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {home.sales.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link href={`/sales/${s.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{s.clientName} · {shortDate(s.createdAt)}</p>
                    </div>
                    <span className="font-medium tabular-nums">{money(s.amountCents)}</span>
                    <SaleStatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live from PayPal</CardTitle>
            <Link href="/activity" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Activity <ArrowRightIcon aria-hidden className="size-3.5" /></Link>
          </CardHeader>
          <CardContent>
            <EventList events={home.events} now={now} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: React.ReactNode; hint: string }) {
  return (
    <Card className="gap-2 px-5 py-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden className="size-4" /> {label}</p>
      <p className="text-[1.65rem] font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function EmptyHome({ name }: { name: string }) {
  const steps = ["Confirm your bank account and primary phone in PayPal", "Describe your first sale and run the pre-flight check", "Add tracking, or mark services completed, after delivery", "Keep your dispute rate low: answer clients fast"];
  return (
    <>
      <PageHeader title={`Welcome, ${name}.`} description="New PayPal accounts are watched closely. Start your first sale the way PayPal likes to see it." />
      <Card className="max-w-2xl px-6 py-6">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-cleared-tint text-xs font-semibold text-cleared-strong">{i + 1}</span>{s}</li>
          ))}
        </ol>
        <Link href="/sales/new" className={cn(buttonVariants({ size: "lg" }), "mt-6 w-fit")}>Check your first sale</Link>
      </Card>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-80" />
    </div>
  );
}
