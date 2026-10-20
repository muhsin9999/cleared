import { BadgeCheck, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** A timeline row: the PayPal event name in mono, then what it means in plain English. */
export function EventRow({
  type,
  summary,
  time,
  verified = true,
  simulated = false,
  className,
}: {
  type: string;
  summary: string;
  time: string;
  verified?: boolean;
  simulated?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cleared ring-4 ring-cleared-tint" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <code className="font-mono text-[0.75rem] font-medium tracking-[0.01em] break-all text-ink">{type}</code>
          {verified ? (
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-cleared-strong">
              <BadgeCheck className="size-3.5" aria-hidden />
              Verified
            </span>
          ) : null}
          {simulated ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 text-[0.65rem] text-muted-foreground">
              <FlaskConical className="size-3" aria-hidden />
              Simulated
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p>
      </div>
      <time className="shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums">{time}</time>
    </div>
  );
}
