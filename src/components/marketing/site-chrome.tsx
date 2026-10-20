import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

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
        <Link href="/" className="-m-1 rounded-md p-1" aria-label="cleared, home">
          <Logo size="lg" mark={false} />
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

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Works with PayPal (sandbox). Not affiliated with or endorsed by PayPal.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/legal" className="rounded-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline">
            Legal &amp; privacy
          </Link>
          <a href={GITHUB_URL} className="rounded-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline">
            Source on GitHub
          </a>
          <a href={`${GITHUB_URL}/issues`} className="rounded-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline">
            Report an issue
          </a>
        </nav>
      </div>
    </footer>
  );
}
