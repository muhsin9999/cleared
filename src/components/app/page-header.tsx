import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, eyebrow, back, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; back?: { href: string; label: string }; className?: string }) {
  return (
    <header className={cn("space-y-3", className)}>
      {back ? (
        <Link href={back.href} className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-4" /> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? <div className="text-sm text-muted-foreground">{eyebrow}</div> : null}
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-[1.75rem]">{title}</h1>
          {description ? <p className="max-w-prose text-[0.95rem] text-muted-foreground text-pretty">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-8 sm:py-8", className)}>{children}</div>;
}
