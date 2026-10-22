"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

type Tone = "risk" | "caution" | "cleared";

export function readinessTone(score: number): Tone {
  if (score < 50) return "risk";
  if (score < 80) return "caution";
  return "cleared";
}

const TONE_STROKE: Record<Tone, string> = { risk: "stroke-risk", caution: "stroke-caution", cleared: "stroke-cleared" };
const TONE_WORD: Record<Tone, string> = { risk: "Needs work", caution: "Almost ready", cleared: "Ready to send" };

/**
 * The pre-flight readiness score: an SVG ring plus an animated number.
 * Change `score` and both the ring and the digits settle to the new value.
 */
export function ReadinessRing({
  score,
  size = 120,
  strokeWidth,
  label = "Readiness",
  showVerdict = true,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showVerdict?: boolean;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = strokeWidth ?? Math.max(4, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const tone = readinessTone(value);
  const compact = size < 96;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} out of 100, ${TONE_WORD[tone].toLowerCase()}`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn(TONE_STROKE[tone], "transition-[stroke-dashoffset,stroke] duration-700 ease-out")}
        />
      </svg>
      {/* NumberFlow pads its box above and below the digits; with a verdict under it the pair is pulled up a little to look centred. */}
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center", showVerdict && !compact && "-translate-y-[4%]")} aria-hidden>
        <NumberFlow
          value={value}
          className={cn("font-semibold tracking-[-0.03em] text-ink tabular-nums", compact ? "text-lg" : "text-[2rem] leading-none")}
        />
        {showVerdict && !compact ? <span className="-mt-0.5 text-[0.7rem] font-medium text-muted-foreground">{TONE_WORD[tone]}</span> : null}
      </div>
    </div>
  );
}
