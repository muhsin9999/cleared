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

// The same three jobs, in the same order, as the "Start here" card the demo opens on.
const DEMO_PATH = [
  { n: "1", title: "A client disputes $250", body: "Watch Cleared’s AI agent read the dispute, match Ada’s files and draft her reply." },
  { n: "2", title: "A $400 job, before it’s invoiced", body: "The AI flags what would lose a dispute and fixes it in one tap. Then a real PayPal invoice goes out." },
  { n: "3", title: "“Your account has been limited”", body: "Cleared checks a scary email for phishing before Ada clicks anything." },
];

/**
 * The only dark band on the page, and the one place it asks for the demo: one line, the button, the three
 * jobs the demo opens on, and a corner of the desk photo with the stamp pressed on it.
 */
export function ClosingCta() {
  return (
    <section id="for-judges" className="scroll-mt-6 bg-ink text-paper" aria-labelledby="cta-title">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-28">
        <div>
          <h2 id="cta-title" className="max-w-[14ch] text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance">
            Your next commission should stay paid.
          </h2>
          <p className="mt-6 max-w-md text-[1.12rem] leading-relaxed text-paper/75">Try it as Ada Okafor, an illustrator, on the PayPal sandbox. About three minutes, no sign-up, no keys.</p>
          <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
            <DemoButton />
            <NewSellerLink className="text-center sm:text-left" linkClassName="text-paper/75 decoration-paper/30 hover:text-paper hover:decoration-paper" />
          </div>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[10px] bg-[#EAE3D6] ring-1 ring-white/10">
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
        <div className="lg:col-span-2">
          <p className="text-[0.9rem] font-medium text-paper/60">The demo opens on three jobs:</p>
          <ol className="mt-4 grid gap-px overflow-hidden rounded-[10px] bg-white/10 ring-1 ring-white/10 sm:grid-cols-3">
            {DEMO_PATH.map((s) => (
              <li key={s.n} className="bg-ink p-5">
                <span className="grid size-7 place-items-center rounded-full border border-white/20 text-[0.85rem] font-semibold tabular-nums">{s.n}</span>
                <h3 className="mt-3 text-[1.02rem] font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-1 text-[0.9rem] leading-snug text-paper/70">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex flex-col gap-2 text-[0.88rem] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
            <span>PayPal Invoicing, Orders, Tracking, Disputes and Webhooks APIs, sandbox only. The AI only drafts; Ada approves.</span>
            <SourceLink href={GITHUB_URL} className="text-paper/75 decoration-paper/30 hover:text-paper hover:decoration-paper">Read the code on GitHub</SourceLink>
          </p>
        </div>
      </div>
    </section>
  );
}
