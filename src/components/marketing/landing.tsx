import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { StampMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { DemoButton, NewSellerLink } from "./hero";
import { CheckMoment, CountUp, CountUpGroup, DisputeMoment, LockerMoment } from "./moments";
import { QuoteRotator, type SellerQuote } from "./quote-rotator";
import { GITHUB_URL } from "./site-chrome";

// Every line on this page is accounted for in docs/COPY.md (why it is there, and where it comes from).
// The page stays on paper: sections alternate paper (#F7F6F2) and a deeper paper (#F1EFE9) with a
// hairline between them, like ledger pages. Dark ink is used once, for the closing call to action.

export { Hero } from "./hero";

function SourceLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-sm text-[0.8rem] underline underline-offset-4 transition-colors",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </a>
  );
}

const CFPB_URL =
  "https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=Paypal%20Holdings%2C%20Inc&date_received_min=2025-01-01&date_received_max=2026-09-30&issue=Trouble%20accessing%20funds%20in%20your%20mobile%20or%20digital%20wallet&tab=List";

const FIGURES = [
  {
    value: 21,
    suffix: " days",
    caption: "PayPal can hold a new seller’s first payments.",
    source: "PayPal Help Center, on new sellers",
    href: "https://www.paypal.com/us/cshelp/article/HELP848",
  },
  {
    value: 180,
    suffix: " days",
    caption: "Your balance is held if PayPal closes the account. “This decision can’t be overturned.”",
    source: "PayPal Help Center, on closed accounts",
    href: "https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191",
  },
  {
    value: 3010,
    caption: "CFPB complaints about PayPal: “Trouble accessing funds”, Jan 2025 to Sep 2026.",
    source: "CFPB complaint database, filtered",
    href: CFPB_URL,
  },
];

export function TheNumbers() {
  return (
    <section className="border-t border-line bg-paper text-ink" aria-labelledby="numbers-title">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
        <h2 id="numbers-title" className="max-w-xl text-[1.9rem] leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-[2.4rem]">
          The client paid. The money still isn’t yours.
        </h2>
        <CountUpGroup className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-10 lg:mt-16">
          {FIGURES.map((f) => (
            <div key={f.href} className="flex flex-col border-t-2 border-ink pt-6">
              <dt className="order-2 mt-4 max-w-[19rem] text-[1rem] leading-relaxed text-ink/75">{f.caption}</dt>
              <dd className="order-1 text-[clamp(3.6rem,6.6vw,5.6rem)] leading-[0.9] font-bold tracking-[-0.05em] tabular-nums">
                <CountUp value={f.value} suffix={f.suffix} />
              </dd>
              <dd className="order-3 mt-3">
                <SourceLink href={f.href} className="text-ink/65 decoration-ink/25 hover:text-ink hover:decoration-ink">
                  {f.source}
                </SourceLink>
              </dd>
            </div>
          ))}
        </CountUpGroup>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Check the sale before you invoice.",
    body: "Each finding says why PayPal cares, and comes with a fix.",
    art: <CheckMoment />,
  },
  {
    title: "Keep the proof while you deliver.",
    body: "Files and the client’s “I received the work”, kept on the sale.",
    art: <LockerMoment />,
  },
  {
    title: "Answer a dispute with your exhibits.",
    body: "Cleared drafts the reply. You approve it. PayPal decides.",
    art: <DisputeMoment />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-t border-line bg-paper-deep" aria-labelledby="how-title">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
        <h2 id="how-title" className="text-[2.2rem] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-[3rem]">
          How it works
        </h2>
        <ol className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.title} className="flex flex-col">
              <div className="flex h-[16.5rem] items-center rounded-[14px] bg-surface px-6 py-8 ring-1 ring-line sm:px-8">{s.art}</div>
              <h3 className="mt-6 text-[1.3rem] leading-snug font-semibold tracking-[-0.02em] text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[1rem] leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Cleared can’t lift a limitation, release a hold early, or change a PayPal decision.
        </p>
      </div>
    </section>
  );
}

const SELLER_POSTS: SellerQuote[] = [
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

export function SellersWords() {
  return (
    <section className="border-t border-line bg-paper" aria-label="What sellers say on r/paypal">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-20 sm:px-8 lg:py-24">
        <QuoteRotator quotes={SELLER_POSTS} />
      </div>
    </section>
  );
}

const JUDGE_PATH = [
  { t: "0:00", title: "Try the live demo", body: "You’re Ada Okafor. No account, no keys." },
  { t: "0:30", title: "Check the Northwind sale", body: "Use the $400 sample, accept the fixes: 38 to 94." },
  { t: "1:30", title: "Open a test dispute", body: "Sandbox controls: “not received” on the Harmattan cover." },
  { t: "2:30", title: "Review and approve", body: "Read the drafted reply and exhibits, edit, approve." },
];

export function ForJudges() {
  return (
    <section id="for-judges" className="scroll-mt-6 border-t border-line bg-paper-deep" aria-labelledby="judges-title">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="judges-title" className="max-w-xl text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[2.6rem]">
            For judges: try it as Ada, in about three minutes.
          </h2>
          <p className="max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
            PayPal Invoicing, Orders, Tracking, Disputes and Webhooks APIs, sandbox only. The AI only drafts.
          </p>
        </div>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {JUDGE_PATH.map((s) => (
            <li key={s.t} className="bg-surface p-5">
              <span className="text-[0.85rem] font-medium text-cleared-strong tabular-nums">{s.t}</span>
              <h3 className="mt-1.5 text-[1.02rem] font-semibold tracking-[-0.01em] text-ink">{s.title}</h3>
              <p className="mt-1 text-[0.88rem] leading-snug text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
          <DemoButton />
          <NewSellerLink className="text-center sm:text-left" />
          <SourceLink href={GITHUB_URL} className="text-[0.95rem] text-ink/75 decoration-ink/25 hover:text-ink hover:decoration-ink sm:ml-auto">
            Read the code on GitHub
          </SourceLink>
        </div>
      </div>
    </section>
  );
}

/**
 * The only dark band on the page: one line, one sub-line, the demo button, and a corner of the desk
 * photo (the top sheet and the pen) in a frame with the stamp pressed on it.
 */
export function ClosingCta() {
  return (
    <section className="bg-ink text-paper" aria-labelledby="cta-title">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-28">
        <div>
          <h2 id="cta-title" className="max-w-[14ch] text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance">
            Your next commission should stay paid.
          </h2>
          <p className="mt-6 max-w-md text-[1.12rem] leading-relaxed text-paper/75">Try it as Ada on the PayPal sandbox. No sign-up.</p>
          <DemoButton className="mt-9" />
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[16px] bg-[#EAE3D6] ring-1 ring-white/10">
          {/* desk-wide.png cropped to its top-right corner: the top sheet and the fountain pen. */}
          <Image
            src="/landing/desk-wide.png"
            alt=""
            width={1586}
            height={992}
            sizes="(min-width: 1024px) 130vw, 260vw"
            className="absolute top-[-8%] left-[-153%] h-auto w-[253%] max-w-none"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-ink/25 via-transparent to-transparent" aria-hidden />
          <StampMark
            detail="full"
            className="absolute top-[30%] left-[24%] size-[38%] -rotate-12 text-cleared opacity-90 mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  );
}
