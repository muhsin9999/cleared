import { cn } from "@/lib/utils";

/** The cleared stamp: a ring with a check. The same mark seals evidence packets. */
export function StampMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-6", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.6 2.2" opacity="0.55" />
      <path d="M11 16.4l3.4 3.4L21.2 13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <StampMark className="text-cleared" />
      <span className="text-[1.15rem] font-semibold tracking-[-0.02em]">cleared</span>
    </span>
  );
}
