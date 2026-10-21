import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CircleAlertIcon, FileWarningIcon, HourglassIcon, PlusIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";
import { EventList } from "@/components/app/event-row";
import { MoneyFlow } from "@/components/app/money-flow";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StartHere } from "@/components/app/start-here";
import { AgentTag } from "@/components/brand/marks";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { getHome, getTour } from "@/server/queries";

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
  const [home, tour] = await Promise.all([getHome(seller.id), seller.isDemo ? getTour(seller.id) : null]);
  const firstName = seller.name.split(" ")[0];
  const releaseDays = daysUntil(home.nextRelease, now);

  const actions = [
    ...home.openDisputes.map((d) => ({ key: d.id, tone: "risk" as const, icon: CircleAlertIcon, title: `A client opened a dispute for ${money(d.amountCents)}`, body: d.status === "under_review" ? "Your evidence is with PayPal. The decision will appear on the case." : "is building your case from the proof locker. Review it before the deadline.", ai: d.status !== "under_review", href: `/cases/${d.id}`, cta: "Open case" })),
    ...home.missingProof.map((s) => ({ key: s.id, tone: "caution" as const, icon: FileWarningIcon, title: `Proof missing on “${s.title}”`, body: "Add the delivered files and send the acceptance link so this payment is protected.", ai: false, href: `/sales/${s.id}`, cta: "Add proof" })),
  ];

  if (!home.sales.length) return <EmptyHome name={firstName} />;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}
        title={`Good to see you, ${firstName}.`}
        description={actions.length ? "One thing needs you today." : "Everything is in order. Your proof is up to date."}
        actions={<Link href="/sales/new" className={cn(buttonVariants({ size: "lg" }), "hidden sm:inline-flex")}><PlusIcon aria-hidden /> New sale</Link>}
      />

      {tour ? <StartHere tour={tour} /> : null}

      {actions.length ? (
        <section aria-label="Action needed" className="space-y-3">
          {actions.map((a) => (
            <Card key={a.key} className={cn("flex-row items-center gap-4 border-l-4 px-5 py-4", a.tone === "risk" ? "border-l-risk" : "border-l-caution")}>
              <a.icon aria-hidden className={cn("size-5 shrink-0", a.tone === "risk" ? "text-risk" : "text-caution")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.ai ? <><AgentTag className="mr-1 text-[0.72rem]" /> </> : null}{a.body}</p>
              </div>
              <Link href={a.href} className={buttonVariants({ variant: a.tone === "risk" ? "default" : "outline", size: "sm" })}>{a.cta}</Link>
            </Card>
          ))}
        </section>
      ) : null}

      <section aria-label="Account health" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={WalletIcon} label="Paid, still on hold" value={<MoneyFlow cents={home.fundsInFlightCents} />} hint="Clients have paid; PayPal hasn’t released it to Ada yet." />
        <Stat
          icon={HourglassIcon}
          label="Next release"
          value={releaseDays !== null ? `${releaseDays} ${releaseDays === 1 ? "day" : "days"}` : "—"}
          hint={home.nextReleaseSale ? `${money(home.nextReleaseSale.amountCents)} from ${home.nextReleaseSale.clientName}. PayPal releases service payments 7 days after the job is marked complete.` : "Nothing on hold."}
          href={home.nextReleaseSale ? `/sales/${home.nextReleaseSale.id}` : undefined}
        />
        <Stat icon={ShieldCheckIcon} label="Proof coverage" value={home.proofCoverage !== null ? `${home.proofCoverage}%` : "—"} hint="Paid sales with delivered files and the client’s confirmation saved." />
        <Stat icon={CircleAlertIcon} label="Open cases" value={String(home.openDisputes.length)} hint={home.openDisputes.length ? "A dispute needs a response." : "No disputes or PayPal notices waiting."} href="/cases" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
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
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="font-medium tabular-nums">{money(s.amountCents)}</span>
                      <SaleStatusBadge status={s.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <Link href="/activity" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">See all <ArrowRightIcon aria-hidden className="size-3.5" /></Link>
          </CardHeader>
          <CardContent>
            <EventList events={home.events} now={now} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, hint, href }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: React.ReactNode; hint: string; href?: string }) {
  const body = (
    <Card className={cn("h-full gap-1.5 px-4 py-4 sm:px-5", href && "transition-colors hover:bg-muted/40")}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden className="size-4" /> {label}</p>
      <p className="text-[1.65rem] font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="hidden text-xs leading-relaxed text-muted-foreground text-pretty sm:block">{hint}</p>
    </Card>
  );
  return href ? <Link href={href} className="block rounded-[10px] focus-visible:outline-2 focus-visible:outline-focus">{body}</Link> : body;
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
