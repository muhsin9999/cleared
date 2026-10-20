import { ArrowRight, ArrowUpRight } from "lucide-react";
import { enterDemo, startNewSeller } from "@/server/actions/session";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";
import { instrumentSerif } from "./fonts";
import { LockerIllustration, PacketIllustration } from "./proof-illustrations";
import { ReadinessDemo } from "./readiness-demo";
import { SaleRecord } from "./sale-record";
import { GITHUB_URL } from "./site-chrome";
import { SubmitButton } from "./submit-button";

// Every line on this page is accounted for in docs/COPY.md (why it is there, and where it comes from).

function SourceLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-sm text-[0.8rem] text-muted-foreground underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </a>
  );
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
    <section aria-labelledby="hero-title">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <BlurFade delay={0.05} offset={8} className="min-w-0 max-w-xl">
          <h1 id="hero-title" className="text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-[4.4rem]">
            Get paid, and{" "}
            <span className={cn(instrumentSerif.className, "font-normal tracking-[-0.01em] text-cleared")}>stay</span> paid.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-ink/80">
            PayPal can hold a new seller&apos;s first payments for up to 21 days. If it closes your account, it keeps the balance for 180.
          </p>
          <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-pretty text-muted-foreground">
            Cleared checks each sale against the reasons PayPal gives for holds before you send the invoice, keeps your proof while you
            deliver, and drafts your reply if PayPal or your client asks questions. You approve every word.
          </p>
          <DemoActions className="mt-8" />
          <p className="mt-4 max-w-[34rem] text-sm leading-relaxed text-muted-foreground">
            Runs on the PayPal sandbox: no sign-up, no real money. Cleared is not affiliated with PayPal.
          </p>
        </BlurFade>
        <BlurFade delay={0.2} offset={10} className="w-full min-w-0 pt-2 lg:justify-self-end lg:max-w-[29rem] lg:pt-4">
          <SaleRecord />
        </BlurFade>
      </div>
    </section>
  );
}

const SELLER_POSTS = [
  {
    quote: "paypal immediately limited my account once their payment of 100 usd went through",
    who: "An artist, after the first commission invoice on a new business account",
    when: "r/paypal, Aug 2026",
    href: "https://www.reddit.com/r/paypal/comments/1vsg48l/paypal_banned_my_business_account_after_first_art/",
  },
  {
    quote:
      "I submitted everything they requested, including my ID, screenshots of conversations with clients showing WIPs, completed artwork, and proof that I was doing legitimate freelance commissions.",
    who: "A freelance digital artist, before the account was closed",
    when: "r/paypal, Aug 2026",
    href: "https://www.reddit.com/r/paypal/comments/1vhx32n/were_no_longer_offering_paypal_services_for_this/",
  },
  {
    quote: "PayPal says I can access my money only in 6 months (180 days), which is so far away it sounds like never.",
    who: "A 3D artist paid through Patreon, with $1,293 in the account",
    when: "r/paypal, Nov 2025",
    href: "https://www.reddit.com/r/paypal/comments/1ot7xb1/paypal_banned_me_permanently_after_getting_my_1k/",
  },
];

const CFPB_URL =
  "https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=Paypal%20Holdings%2C%20Inc&date_received_min=2025-01-01&date_received_max=2026-09-30&issue=Trouble%20accessing%20funds%20in%20your%20mobile%20or%20digital%20wallet&tab=List";

export function SellersWords() {
  return (
    <section className="border-y border-line bg-surface" aria-labelledby="words-title">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24">
        <div className="max-w-md">
          <h2 id="words-title" className="text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
            The client paid. The money still isn&apos;t yours.
          </h2>
          <p className="mt-5 text-[1rem] leading-relaxed text-muted-foreground">
            Freelancers and artists describe the same thing on r/paypal: a first big payment arrives, the account is limited, and they
            send PayPal their proof after the fact.
          </p>

          <div className="mt-10 space-y-6 border-t border-line pt-8">
            <p className="text-[0.95rem] leading-relaxed text-ink">
              <span className="text-[1.6rem] font-semibold tracking-[-0.03em] tabular-nums">3,010</span>{" "}
              complaints were sent to the US Consumer Financial Protection Bureau about PayPal under “Trouble accessing funds in your
              mobile or digital wallet”, from January 2025 to September 2026.
            </p>
            <SourceLink href={CFPB_URL}>CFPB complaint database, filtered</SourceLink>
          </div>
        </div>

        <div>
          <ul className="divide-y divide-line border-y border-line">
            {SELLER_POSTS.map((p) => (
              <li key={p.href} className="py-7 first:pt-6 last:pb-6">
                <blockquote className="text-[1.15rem] leading-relaxed tracking-[-0.01em] text-pretty text-ink">“{p.quote}”</blockquote>
                <div className="mt-3 flex flex-col gap-1 text-[0.85rem] text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                  <span>{p.who}</span>
                  <SourceLink href={p.href}>{p.when}</SourceLink>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <figure className="rounded-[10px] border border-line bg-paper p-5">
              <blockquote className="text-[0.95rem] leading-relaxed text-ink">
                “We hold the initial payments you receive for up to 21 days.”
              </blockquote>
              <figcaption className="mt-3">
                <SourceLink href="https://www.paypal.com/us/cshelp/article/HELP848">PayPal Help Center, on new sellers</SourceLink>
              </figcaption>
            </figure>
            <figure className="rounded-[10px] border border-line bg-paper p-5">
              <blockquote className="text-[0.95rem] leading-relaxed text-ink">
                “This decision can&apos;t be overturned.” The balance is “held for 180 days”.
              </blockquote>
              <figcaption className="mt-3">
                <SourceLink href="https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191">
                  PayPal Help Center, on closed accounts
                </SourceLink>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

const MOMENTS = [
  {
    when: "Before you send the invoice",
    title: "Northwind Games offers Ada $400. That is more than 3× her usual sale, and Cleared says so first.",
    body: [
      "A sudden spike in sales is one of the reasons PayPal gives for limiting an account. Long delivery times are a factor it weighs when it holds money back.",
      "Cleared reads the sale the way you describe it, compares it with your own history, and explains each finding in a sentence. Every finding comes with a fix you can accept or skip.",
    ],
    art: <ReadinessDemo />,
  },
  {
    when: "While you deliver",
    title: "The proof is kept as you work, not gathered after the money is frozen.",
    body: [
      "Each file you deliver, the client's timestamped “I received the work”, and the terms you agreed are stored on the sale they belong to.",
      "For a service, Cleared reminds you to mark the order completed in PayPal. PayPal says it releases the payment 7 days after that.",
    ],
    art: <LockerIllustration />,
  },
  {
    when: "If the client disputes",
    title: "You start from a drafted reply that cites your proof, not from a blank form.",
    body: [
      "PayPal gives you 10 days to respond to a dispute. Cleared drafts the reply from what is on the sale, and every sentence points to an exhibit. A checker removes any claim the proof does not support.",
      "You edit it and approve it. Nothing is sent to PayPal or your client before you do, and PayPal makes the decision.",
    ],
    art: <PacketIllustration />,
  },
];

export function WhatItDoes() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 lg:py-24" aria-labelledby="does-title">
      <h2 id="does-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
        What Cleared does with Ada&apos;s next sale.
      </h2>
      <div className="mt-12 divide-y divide-line border-y border-line">
        {MOMENTS.map((m) => (
          <article key={m.when} className="grid gap-8 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div className="max-w-xl">
              <p className="text-[0.95rem] font-medium text-cleared-strong">{m.when}</p>
              <h3 className="mt-2 text-[1.45rem] leading-snug font-semibold tracking-[-0.02em] text-balance text-ink">{m.title}</h3>
              {m.body.map((para) => (
                <p key={para} className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>
            <div className="flex items-center rounded-[10px] border border-line bg-surface p-5 sm:p-8">
              <div className="w-full">{m.art}</div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-[0.98rem] leading-relaxed text-ink">
        What Cleared can&apos;t do: lift a limitation, release a hold early, or change a PayPal decision. It helps you give PayPal fewer
        reasons to hold your money, and better proof when it asks.
      </p>
    </section>
  );
}

const JUDGE_PATH = [
  { t: "0:00", title: "Try the live demo", body: "You're signed in as Ada Okafor of Okafor Studio. No account, no keys." },
  {
    t: "0:30",
    title: "Check the Northwind Games sale",
    body: "Start a new sale, use the $400 character-sheet sample, accept the fixes and watch readiness go from 38 to 94.",
  },
  { t: "1:30", title: "Open a test dispute", body: "In Sandbox controls, simulate a “not received” dispute on the Harmattan Tapes cover she has already delivered." },
  { t: "2:30", title: "Review and approve", body: "Read the drafted reply and its exhibits, change any line, then approve it." },
];

export function ForJudges() {
  return (
    <section id="for-judges" className="scroll-mt-8 border-t border-line bg-surface" aria-labelledby="judges-title">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:py-24">
        <div>
          <h2 id="judges-title" className="text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
            For judges: try it as Ada, in about three minutes.
          </h2>
          <p className="mt-5 text-[0.98rem] leading-relaxed text-muted-foreground">
            Cleared is built on PayPal&apos;s Invoicing, Orders, Tracking, Disputes and Webhooks APIs, in the sandbox, with test money only.
            The AI (OpenAI gpt-5-mini) only drafts. Anything that would reach PayPal waits for the seller&apos;s approval.
          </p>
          <DemoActions className="mt-8" />
          <SourceLink href={GITHUB_URL} className="mt-5 text-sm text-ink">
            Read the code and the README on GitHub
          </SourceLink>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {JUDGE_PATH.map((s) => (
            <li key={s.title} className="grid grid-cols-[3.5rem_1fr] gap-x-4 py-5">
              <span className="pt-0.5 font-mono text-[0.8rem] text-muted-foreground tabular-nums">{s.t}</span>
              <div>
                <h3 className="text-[1rem] font-semibold tracking-[-0.01em] text-ink">{s.title}</h3>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
