import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MailWarningIcon, ReceiptTextIcon, ShieldAlertIcon, type LucideIcon } from "lucide-react";
import { AgentTag } from "@/components/brand/marks";
import { SubmitButton } from "@/components/marketing/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startDisputeTour } from "@/server/actions/demo";

type Tour = { disputeId: string | null; checkedSaleId: string | null; noticeId: string | null };

type Job = { key: string; icon: LucideIcon; ai: boolean; does: string; title: string; body: string; cta: string; doneCta: string; href: string; doneHref: string | null; action?: () => Promise<void> };

// The demo's front door: the three jobs Cleared's AI does, in the order a seller meets them on a bad day.
// Each one runs for real (PayPal sandbox, the live model); the card only points the way and ticks them off.
export function StartHere({ tour }: { tour: Tour }) {
  const jobs: Job[] = [
    {
      key: "dispute",
      icon: ShieldAlertIcon,
      ai: true,
      does: "builds the case",
      title: "A client disputes a $250 payment",
      body: "Lagos Lo-Fi Records has disputed what they paid for the album cover. Watch the agent read the dispute, match Ada’s files and draft her reply.",
      cta: "Open the dispute",
      doneCta: "Back to the case",
      href: "",
      doneHref: tour.disputeId && `/cases/${tour.disputeId}`,
      action: startDisputeTour,
    },
    {
      key: "sale",
      icon: ReceiptTextIcon,
      ai: true,
      does: "checks the sale",
      title: "A $400 job, before it’s invoiced",
      body: "Ada’s biggest commission yet. The AI flags what would lose a dispute later, fixes it in one tap, then sends a real PayPal invoice.",
      cta: "Check the sale",
      doneCta: "See the sale",
      href: "/sales/new?sample=1",
      doneHref: tour.checkedSaleId && `/sales/${tour.checkedSaleId}`,
    },
    {
      key: "notice",
      icon: MailWarningIcon,
      ai: false,
      does: "checks the email",
      title: "“Your account has been limited”",
      body: "An email says it’s from PayPal. Cleared checks the sender and links for phishing before Ada clicks anything; for a real notice, the AI drafts her reply.",
      cta: "Check the email",
      doneCta: "See the verdict",
      href: "/notices/new?sample=phishing",
      doneHref: tour.noticeId && `/notices/${tour.noticeId}`,
    },
  ];
  const done = jobs.filter((j) => j.doneHref).length;
  const next = jobs.find((j) => !j.doneHref)?.key;

  return (
    <section aria-labelledby="start-here" className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-soft">
      <header className="flex flex-col gap-3 border-b border-line bg-paper/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id="start-here" className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[-0.01em]">
            Start here: three times Cleared steps in for Ada
          </h2>
          <p className="text-sm text-muted-foreground">About three minutes. Each one runs live on the PayPal sandbox; nothing is pre-recorded.</p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums" aria-live="polite">
          {done} of 3 done
          <span aria-hidden className="ml-3 inline-flex gap-1 align-middle">
            {jobs.map((j) => <span key={j.key} className={cn("h-1.5 w-6 rounded-full", j.doneHref ? "bg-cleared" : "bg-line")} />)}
          </span>
        </p>
      </header>
      <ol className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {jobs.map((j, i) => {
          const isNext = j.key === next;
          const cls = cn(buttonVariants({ variant: isNext ? "default" : "outline", size: isNext ? "lg" : "default" }), "w-full justify-between md:w-fit md:self-start");
          return (
            <li key={j.key} className={cn("flex flex-col gap-3 px-5 py-5", isNext && "bg-cleared-tint/35")}>
              <div className="flex items-center gap-2 text-sm">
                {j.doneHref ? (
                  <span className="grid size-6 place-items-center rounded-full bg-cleared text-primary-foreground"><CheckIcon aria-hidden className="size-3.5" /><span className="sr-only">Done:</span></span>
                ) : (
                  <span className="grid size-6 place-items-center rounded-full border border-line bg-paper text-xs font-semibold">{i + 1}</span>
                )}
                {j.ai ? <AgentTag className="text-[0.75rem]" /> : <span className="inline-flex items-center gap-1.5 font-medium"><j.icon aria-hidden className="size-4 text-muted-foreground" /> Cleared</span>}
                <span className="text-muted-foreground">{j.does}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-semibold text-pretty">{j.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{j.body}</p>
              </div>
              {j.doneHref ? (
                <Link href={j.doneHref} className={cls}>{j.doneCta} <ArrowRightIcon aria-hidden /></Link>
              ) : j.action ? (
                <form action={j.action}>
                  <SubmitButton variant={isNext ? "default" : "outline"} size={isNext ? "lg" : "default"} pendingLabel="Fetching the dispute from PayPal…" className="w-full justify-between md:w-fit">{j.cta} <ArrowRightIcon aria-hidden /></SubmitButton>
                </form>
              ) : (
                <Link href={j.href} className={cls}>{j.cta} <ArrowRightIcon aria-hidden /></Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
