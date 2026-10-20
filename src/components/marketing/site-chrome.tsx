import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const GITHUB_URL = "https://github.com/muhsin9999/cleared";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-judges", label: "For judges" },
];

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" className="-m-1 rounded-md p-1" aria-label="cleared, home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-0.5 text-sm sm:gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink sm:inline-flex"
          >
            {item.label}
          </Link>
        ))}
        <Link href="/#for-judges" className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink sm:hidden">
          Judges
        </Link>
        <a
          href={GITHUB_URL}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
        >
          GitHub
          <ArrowUpRight className="size-3.5" aria-hidden />
          <span className="sr-only">(opens the source code)</span>
        </a>
      </nav>
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
