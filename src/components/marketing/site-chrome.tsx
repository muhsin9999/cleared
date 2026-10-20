import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { enterDemo } from "@/server/actions/session";
import { cn } from "@/lib/utils";
import { TextSubmit } from "./submit-button";

export const GITHUB_URL = "https://github.com/muhsin9999/cleared";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-judges", label: "For judges" },
];

const LINK = "rounded-md px-2.5 py-1.5 text-[0.95rem] text-ink/75 transition-colors hover:text-ink";

/** `overlay` lays the bar over the landing hero's photo instead of above the page. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={cn("z-20 w-full", overlay ? "absolute inset-x-0 top-0" : "relative")}>
      <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-8 xl:px-[clamp(2rem,5.5vw,6rem)]">
        <Link
          href="/"
          className="group -m-1.5 rounded-lg p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="cleared, home"
        >
          {/* Hover or focus presses the stamp a few degrees and deepens the ink. */}
          <Logo
            size="xl"
            markClassName="-rotate-[6deg] transition-[rotate,color] duration-200 ease-out group-hover:-rotate-[18deg] group-hover:text-cleared-strong group-focus-visible:-rotate-[18deg] group-focus-visible:text-cleared-strong"
          />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={cn(LINK, "hidden sm:inline-flex")}>
              {item.label}
            </Link>
          ))}
          <Link href="/#for-judges" className={cn(LINK, "sm:hidden")}>
            Judges
          </Link>
          <a href={GITHUB_URL} className={cn(LINK, "inline-flex items-center gap-1")}>
            GitHub
            <ArrowUpRight className="size-3.5" aria-hidden />
            <span className="sr-only">(opens the source code)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

const FOOT_LINK =
  "w-fit rounded-sm text-[0.92rem] text-ink/70 underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline";

const BUILT_ON = ["PayPal sandbox", "Render", "Neon", "Cloudflare R2", "OpenAI"];

function FootColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.85rem] font-semibold text-ink">{title}</h2>
      <ul className="mt-3.5 flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

/** The landing footer, on paper. Other public pages (legal) share it. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto w-full max-w-[1280px] px-5 pt-14 pb-10 sm:px-8 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div className="col-span-2 max-w-xs sm:col-span-3 lg:col-span-1">
            <Link href="/" className="group -m-1 inline-flex rounded-md p-1" aria-label="cleared, home">
              <Logo markClassName="transition-transform duration-200 ease-out group-hover:-rotate-[8deg]" />
            </Link>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-muted-foreground">Get paid, and stay paid.</p>
          </div>
          <nav aria-label="Footer" className="contents">
            <FootColumn title="Product">
              <li>
                <Link href="/#how-it-works" className={FOOT_LINK}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#for-judges" className={FOOT_LINK}>
                  For judges
                </Link>
              </li>
              <li>
                <form action={enterDemo}>
                  <TextSubmit pendingLabel="Opening Ada's workspace…" className={cn(FOOT_LINK, "no-underline")}>
                    Live demo
                  </TextSubmit>
                </form>
              </li>
            </FootColumn>
            <FootColumn title="Project">
              <li>
                <a href={GITHUB_URL} className={FOOT_LINK}>
                  GitHub
                </a>
              </li>
              <li>
                <a href={`${GITHUB_URL}#readme`} className={FOOT_LINK}>
                  README
                </a>
              </li>
              <li>
                <Link href="/legal" className={FOOT_LINK}>
                  Legal &amp; privacy
                </Link>
              </li>
              <li>
                <a href={`${GITHUB_URL}/issues`} className={FOOT_LINK}>
                  Report an issue
                </a>
              </li>
            </FootColumn>
          </nav>
          <FootColumn title="Built on">
            {BUILT_ON.map((name) => (
              <li key={name} className="text-[0.92rem] text-ink/70">
                {name}
              </li>
            ))}
          </FootColumn>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[0.82rem] text-muted-foreground sm:flex-row sm:justify-between">
          <p>Works with PayPal (sandbox). Not affiliated with or endorsed by PayPal.</p>
          <p>© 2026 cleared</p>
        </div>
      </div>
    </footer>
  );
}
