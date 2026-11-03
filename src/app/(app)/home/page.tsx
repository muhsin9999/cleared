import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CircleAlertIcon, FileWarningIcon, HourglassIcon, MailWarningIcon, PlusIcon, ReceiptTextIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";
import { AgentCard, DemoArrival } from "@/components/app/agent-card";
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
import { REASON_LABEL } from "@/lib/labels";
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
  const dispute = home.openDisputes[0];

  if (!home.sales.length) return <EmptyHome name={firstName} />;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}
        title={`Good to see you, ${firstName}.`}
        actions={<Link href="/sales/new" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "hidden sm:inline-flex")}><PlusIcon aria-hidden /> New sale</Link>}
      />

      {dispute ? (
        <AgentCard tone="risk" {...disputeCard(dispute)} href={`/cases/${dispute.id}`} cta="Open the case" />
      ) : seller.isDemo && !home.lastDispute ? (
        <DemoArrival body="Disputes, holds and notices land here first." />
      ) : (
        <AgentCard
          mood={home.lastDispute?.status === "resolved_seller" ? "done" : "idle"}
          title="Watching your PayPal account"
          body={home.lastDispute?.status === "resolved_seller" ? `Last dispute closed in your favor: ${money(home.lastDispute.amountCents)} kept.` : "Disputes, holds and notices land here first."}
        />
      )}

      {home.missingProof.length ? (
        <ul aria-label="Proof missing" className="space-y-2">
          {home.missingProof.map((x) => (
            <li key={x.id}>
              <Link href={`/sales/${x.id}`} className="flex items-center gap-3 rounded-[10px] border border-caution/30 bg-caution-tint/50 px-4 py-3 text-sm hover:bg-caution-tint">
                <FileWarningIcon aria-hidden className="size-4 shrink-0 text-caution" />
                <span className="min-w-0 flex-1 truncate">Proof missing on <span className="font-medium">{x.title}</span></span>
                <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section aria-label="Cleared AI can also" className="grid gap-3 sm:grid-cols-2">
        <Tool href={seller.isDemo ? "/sales/new?sample=1" : "/sales/new"} icon={ReceiptTextIcon} title="Check a sale before you invoice" />
        <Tool href={seller.isDemo ? "/notices/new?sample=phishing" : "/notices/new"} icon={MailWarningIcon} title="Check a “PayPal” email" />
      </section>

      <section aria-label="Account health" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={WalletIcon} label="Paid, still on hold" value={<MoneyFlow cents={home.fundsInFlightCents} />} />
        <Stat
          icon={HourglassIcon}
          label="Next release"
          value={releaseDays !== null ? `${releaseDays} ${releaseDays === 1 ? "day" : "days"}` : "—"}
          hint={home.nextReleaseSale ? `${money(home.nextReleaseSale.amountCents)} · ${home.nextReleaseSale.clientName}` : undefined}
          href={home.nextReleaseSale ? `/sales/${home.nextReleaseSale.id}` : undefined}
        />
        <Stat icon={ShieldCheckIcon} label="Proof coverage" value={home.proofCoverage !== null ? `${home.proofCoverage}%` : "—"} />
        <Stat icon={CircleAlertIcon} label="Open cases" value={String(home.openDisputes.length)} href="/cases" />
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

function Tool({ href, icon: Icon, title }: { href: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-[10px] border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40">
      <span className="grid size-8 place-items-center rounded-md bg-paper"><Icon aria-hidden className="size-4 text-muted-foreground" /></span>
      <span className="flex-1">{title}</span>
      <ArrowRightIcon aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

type OpenDispute = Awaited<ReturnType<typeof getHome>>["openDisputes"][number];
function disputeCard(d: OpenDispute) {
  const packet = d.packets[0]?.status;
  const who = `${money(d.amountCents)} dispute from ${d.sale?.clientName ?? "a client"}`;
  const reason = REASON_LABEL[d.reason] ?? "Disputed";
  if (d.status === "under_review" || packet === "submitted") return { mood: "done" as const, title: who, body: "Your reply is with PayPal." };
  if (packet === "awaiting_approval") return { mood: "done" as const, title: who, body: "Cleared AI drafted your reply. Approve it to send." };
  if (packet && packet !== "failed") return { mood: "working" as const, title: who, body: "Cleared AI is building your reply…" };
  return { mood: "concerned" as const, title: `New: ${who}`, body: `${reason}. Cleared AI starts on it when you open it.` };
}

function Stat({ icon: Icon, label, value, hint, href }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <Card className={cn("h-full gap-1.5 px-4 py-4 sm:px-5", href && "transition-colors hover:bg-muted/40")}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden className="size-4" /> {label}</p>
      <p className="text-[1.65rem] font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      {hint ? <p className="hidden text-xs text-muted-foreground sm:block">{hint}</p> : null}
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
