import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The cleared stamp: an outer ring, a thin inner ring and a bold check. From 40px up it also sets
 * "CLEARED" around the ring; below that the text is dropped so the mark holds at favicon size.
 * A container query on the wrapper decides, so callers only pass a size class.
 * The same mark seals evidence packets, so the brand is the product moment.
 */
export function StampMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <span className={cn("@container/stamp inline-block size-6 shrink-0 align-middle", className)}>
      <svg
        viewBox="0 0 100 100"
        className="block size-full overflow-visible"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        <defs>
          {/* A circle (r = 30.5) drawn clockwise from the left, so 25% along it is the top centre. */}
          <path id={`${id}-arc`} d="M 19.5 50 a 30.5 30.5 0 1 1 61 0 a 30.5 30.5 0 1 1 -61 0" />
        </defs>

        {/* Under 40px: a heavy ring and a large check. */}
        <g className="@min-[40px]/stamp:hidden">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="9" />
          <path d="M31 51.5l12.5 12.5L70 37.5" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 40px and up: double ring, the name on the arc, three dots below, and the check in the middle. */}
        <g className="hidden @min-[40px]/stamp:inline">
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="currentColor" strokeWidth="4.5" />
          <circle cx="50" cy="50" r="41.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="50" cy="50" r="26.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <text fill="currentColor" fontSize="11.5" fontWeight="700" letterSpacing="2.6" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            <textPath href={`#${id}-arc`} startOffset="25%" textAnchor="middle">
              CLEARED
            </textPath>
          </text>
          <circle cx="50" cy="83.5" r="1.9" fill="currentColor" />
          <circle cx="42.6" cy="82.7" r="1.2" fill="currentColor" />
          <circle cx="57.4" cy="82.7" r="1.2" fill="currentColor" />
          <path d="M37 51l8.5 8.5L63.5 41.5" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </span>
  );
}

const WORDMARK_SIZE = { sm: "text-[1.05rem]", md: "text-[1.3rem]", lg: "text-[1.6rem]" } as const;
const MARK_SIZE = { sm: "size-5", md: "size-6", lg: "size-7" } as const;

/**
 * The wordmark: lowercase "cleared" in Geist Bold with tight tracking, and a green full stop.
 * `mark` puts the stamp in front for the horizontal lockup (app sidebar, footer); the landing nav
 * uses the wordmark alone.
 */
export function Logo({ className, size = "md", mark = true }: { className?: string; size?: keyof typeof WORDMARK_SIZE; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      {mark ? <StampMark className={cn("text-cleared", MARK_SIZE[size])} /> : null}
      <span className={cn("leading-none font-bold tracking-[-0.035em]", WORDMARK_SIZE[size])}>
        cleared<span className="text-cleared">.</span>
      </span>
    </span>
  );
}
