import { ArrowRight, ArrowUpRight, FlaskConical } from "lucide-react";
import { enterDemo, startNewSeller } from "@/server/actions/session";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";
import { instrumentSerif } from "./fonts";
import { HeroBeam } from "./hero-beam";
import { LockerIllustration, PacketIllustration } from "./proof-illustrations";
import { ReadinessDemo } from "./readiness-demo";
import { GITHUB_URL } from "./site-chrome";
import { SubmitButton } from "./submit-button";

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[0.72rem] font-medium tracking-[0.1em] text-cleared-strong uppercase", className)}>{children}</p>;
}

export function DemoActions({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <form action={enterDemo}>
        <SubmitButton pendingLabel="Opening Ada's workspace…" className="h-11 w-full gap-2 px-5 text-[0.95rem] hover:bg-cleared-strong sm:w-auto">
          Try the live demo
          <ArrowRight className="size-4" aria-hidden />
        </SubmitButton>
      </form>
      <form action={startNewSeller}>
        <SubmitButton pendingLabel="Creating your workspace…" variant="outline" className="h-11 w-full bg-surface px-5 text-[0.95rem] sm:w-auto">
          Start as a new seller
        </SubmitButton>
      </form>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      {/* Faint ledger ruling behind the hero; decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgb(11_18_21/0.035)_31px,rgb(11_18_21/0.035)_32px)] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_30%,#000_20%,transparent_75%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-10 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <BlurFade delay={0.05} offset={8} className="min-w-0 max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[0.78rem] text-muted-foreground shadow-[0_1px_2px_rgb(11_18_21/0.04)]">
            <span className="size-1.5 rounded-full bg-cleared" aria-hidden />
            For freelancers, artists and first-time sellers on PayPal
          </p>
          <h1 id="hero-title" className="mt-6 text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-[4.4rem]">
            Get paid, and{" "}
            <span className={cn(instrumentSerif.className, "font-normal tracking-[-0.01em] text-cleared")}>stay</span> paid.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-muted-foreground">
            Cleared checks a sale before you send the invoice, keeps the proof while you work, and drafts your answer when PayPal asks
            questions. So your first big commission doesn&apos;t become a frozen balance.
          </p>
          <DemoActions className="mt-8" />
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <FlaskConical className="size-4 shrink-0" aria-hidden />
            No sign-up. Sandbox money only.
          </p>
        </BlurFade>
        <BlurFade delay={0.2} offset={10} className="w-full min-w-0 lg:justify-self-end lg:max-w-[30rem]">
          <HeroBeam />
        </BlurFade>
      </div>
    </section>
  );
}

const PROOF_POINTS = [
  {
    title: "Check before you sell",
    body: "Describe the sale in plain words. Cleared flags what could trigger a hold, like a sudden jump in price or no delivery date, and offers a one-tap fix for each.",
    art: <ReadinessDemo />,
  },
  {
    title: "Keep the proof",
    body: "Delivered files, the client's timestamped “I received it”, the agreed scope and tracking land in one locker per sale, as they happen.",
    art: <LockerIllustration />,
  },
  {
    title: "Answer PayPal in minutes",
    body: "When a dispute or notice arrives, Cleared drafts the response from your proof, with every sentence tied to an exhibit. You approve it before anything is sent.",
    art: <PacketIllustration />,
  },
];

export function ProofPoints() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6" aria-labelledby="proof-title">
      <div className="max-w-2xl">
        <Eyebrow>What it does</Eyebrow>
        <h2 id="proof-title" className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
          Three moments where new sellers lose money, handled.
        </h2>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PROOF_POINTS.map((p) => (
          <article key={p.title} className="flex flex-col rounded-[10px] border border-line bg-surface p-2 shadow-soft">
            <div className="flex h-56 items-center rounded-lg border border-line/70 bg-paper px-4 py-6">
              <div className="w-full">{p.art}</div>
            </div>
            <div className="px-3 pt-5 pb-4">
              <h3 className="text-[1.05rem] font-semibold tracking-[-0.015em] text-ink">{p.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Describe the sale", body: "Who it's for, what you're delivering, the price and the date. Plain words are fine." },
  { title: "Fix what could trigger a hold", body: "Cleared checks it against your history and PayPal's published guidance, then suggests fixes you accept or skip." },
  { title: "Invoice through PayPal", body: "Send a clear PayPal invoice. Files, the client's sign-off and tracking collect in the sale's proof locker." },
  { title: "Approve the answer", body: "If PayPal opens a dispute or asks questions, review the drafted packet, edit any line, then approve it." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-8 border-y border-line bg-surface" aria-labelledby="how-title">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how-title" className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
              Four steps, all inside the sale you already have.
            </h2>
          </div>
          <p className="max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
            Cleared drafts. You decide. Nothing reaches PayPal or your client without your approval.
          </p>
        </div>
        <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative border-t border-line pt-5">
              <span className="absolute -top-px left-0 h-px w-10 bg-cleared" aria-hidden />
              <span className="font-mono text-[0.75rem] font-medium text-cleared-strong tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 text-[1.02rem] font-semibold tracking-[-0.015em] text-ink">{s.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const EVIDENCE = [
  {
    figure: "3,040",
    body: "complaints about “trouble accessing funds” filed with the CFPB against PayPal, January 2025 to October 2026.",
    source: "CFPB Consumer Complaint Database",
    href: "https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=PAYPAL%20HOLDINGS%2C%20INC.&date_received_min=2025-01-01",
  },
  {
    figure: "21 days",
    body: "is how long PayPal may hold payments to a new seller before the money is available.",
    source: "PayPal Help Center, HELP848",
    href: "https://www.paypal.com/us/cshelp/article/HELP848",
  },
  {
    figure: "180 days",
    body: "is how long a balance can be held if PayPal stops offering you service, and “the decision can't be overturned.”",
    source: "PayPal Help Center, pcc191",
    href: "https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191",
  },
];

export function EvidenceStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6" aria-labelledby="evidence-title">
      <Eyebrow>Why it matters</Eyebrow>
      <h2 id="evidence-title" className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
        Honest sellers get paid, and still can&apos;t touch the money.
      </h2>
      <dl className="mt-12 grid overflow-hidden rounded-[10px] border border-line bg-surface shadow-soft md:grid-cols-3 md:divide-x md:divide-line">
        {EVIDENCE.map((e, i) => (
          <div key={e.figure} className={cn("flex flex-col p-6 sm:p-8", i > 0 && "border-t border-line md:border-t-0")}>
            <dt className="text-[2.6rem] leading-none font-semibold tracking-[-0.04em] text-ink tabular-nums">{e.figure}</dt>
            <dd className="mt-4 flex flex-1 flex-col">
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{e.body}</p>
              <a
                href={e.href}
                className="mt-6 inline-flex w-fit items-center gap-1 rounded-sm text-[0.8rem] font-medium text-cleared-strong underline decoration-cleared/30 underline-offset-4 hover:decoration-cleared"
              >
                {e.source}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const JUDGE_PATH = [
  { t: "0:00", title: "Try the live demo", body: "You're signed in as Ada Okafor, a freelance illustrator. No account, no keys." },
  { t: "0:30", title: "Check her $400 commission", body: "Accept the suggested fixes and watch readiness climb from 41 to 92, then send the invoice." },
  { t: "1:30", title: "Simulate a buyer dispute", body: "Open Sandbox controls. A verified PayPal webhook opens a case and the evidence packet assembles." },
  { t: "2:30", title: "Approve and submit", body: "Review the packet, approve it, and follow PayPal's sandbox response on the live timeline." },
];

export function ForJudges() {
  return (
    <section id="for-judges" className="scroll-mt-8 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6" aria-labelledby="judges-title">
      <div className="grid gap-10 rounded-[10px] border border-line bg-surface p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <Eyebrow>For judges</Eyebrow>
          <h2 id="judges-title" className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
            A three-minute path through the real thing.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            Cleared runs on the PayPal sandbox: real Invoicing, Orders, Tracking, Disputes and Webhooks calls, with sandbox money only.
            The AI (OpenAI gpt-5-mini) only drafts; every step that reaches PayPal waits for the seller&apos;s approval.
          </p>
          <DemoActions className="mt-8" />
          <a
            href={GITHUB_URL}
            className="mt-5 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            Read the code and the README on GitHub
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
        <ol className="relative space-y-0">
          {JUDGE_PATH.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[3.25rem_1fr] gap-x-4 pb-7 last:pb-0">
              {i < JUDGE_PATH.length - 1 ? <span className="absolute top-8 bottom-1 left-[1.6rem] w-px bg-line" aria-hidden /> : null}
              <span className="relative grid h-7 place-items-center rounded-full border border-line bg-paper font-mono text-[0.7rem] font-medium text-ink tabular-nums">
                {s.t}
              </span>
              <div className="pt-0.5">
                <h3 className="text-[0.98rem] font-semibold tracking-[-0.01em] text-ink">{s.title}</h3>
                <p className="mt-1 text-[0.9rem] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
