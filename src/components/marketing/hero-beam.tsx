"use client";

import { useRef } from "react";
import { BadgeCheck, Check, Landmark } from "lucide-react";
import { StampMark } from "@/components/brand/logo";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const BEAM = { pathColor: "#0b1215", pathOpacity: 0.12, pathWidth: 1.5, gradientStartColor: "#0f7b5f", gradientStopColor: "#4fa58a" } as const;

const TIMELINE = [
  { time: "09:12", type: "PREFLIGHT.CHECKED", line: "Readiness 41 → 92 after three fixes" },
  { time: "09:20", type: "INVOICING.INVOICE.PAID", line: "Northwind Studio paid $400.00" },
  { time: "16:05", type: "CLIENT.ACCEPTED", line: "Client confirmed they received the work" },
];

function Node({
  nodeRef,
  label,
  sub,
  size = "md",
  className,
  children,
}: {
  nodeRef: React.RefObject<HTMLDivElement | null>;
  label: string;
  sub: string;
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex w-20 flex-col items-center gap-2 text-center sm:w-24">
      <div
        ref={nodeRef}
        className={cn(
          "grid place-items-center rounded-full border border-line bg-surface shadow-soft",
          size === "lg" ? "size-[4.5rem] sm:size-20" : "mt-3 size-12 sm:size-14",
          className,
        )}
      >
        {children}
      </div>
      <div className="leading-tight">
        <div className="text-[0.8rem] font-semibold tracking-[-0.01em] text-ink">{label}</div>
        <div className="text-[0.7rem] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/** Hero visual: Ada's sale flowing through cleared to PayPal, and verified events flowing back. */
export function HeroBeam() {
  const containerRef = useRef<HTMLDivElement>(null);
  const adaRef = useRef<HTMLDivElement>(null);
  const clearedRef = useRef<HTMLDivElement>(null);
  const paypalRef = useRef<HTMLDivElement>(null);

  return (
    <figure className="relative rounded-[10px] border border-line bg-surface shadow-soft" aria-labelledby="hero-beam-caption">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[0.68rem] tracking-[0.08em] text-muted-foreground uppercase">Ada&apos;s biggest commission</p>
          <p className="mt-1 truncate text-[0.95rem] font-medium text-ink">Brand illustrations for Northwind Studio</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-lg font-semibold tracking-[-0.02em] text-ink tabular-nums">$400.00</span>
          <SaleStatusBadge status="accepted" />
        </div>
      </div>

      <div ref={containerRef} className="relative flex items-start justify-between px-4 pt-8 pb-6 sm:px-8">
        <Node nodeRef={adaRef} label="Ada Okafor" sub="Illustrator">
          <span className="text-sm font-semibold tracking-[-0.01em] text-ink">AO</span>
        </Node>
        <Node nodeRef={clearedRef} label="cleared" sub="Checks the sale" size="lg" className="border-cleared/30 ring-4 ring-cleared-tint">
          <StampMark className="size-9 text-cleared sm:size-10" />
        </Node>
        <Node nodeRef={paypalRef} label="PayPal" sub="Sandbox">
          <Landmark className="size-5 text-ink" aria-hidden />
        </Node>

        <AnimatedBeam containerRef={containerRef} fromRef={adaRef} toRef={clearedRef} duration={4} {...BEAM} />
        <AnimatedBeam containerRef={containerRef} fromRef={clearedRef} toRef={paypalRef} duration={4} delay={0.6} {...BEAM} />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={paypalRef}
          toRef={clearedRef}
          duration={4}
          delay={2.2}
          curvature={-34}
          startYOffset={10}
          endYOffset={12}
          reverse
          {...BEAM}
        />
      </div>

      <ol className="mx-4 mb-4 divide-y divide-line rounded-lg border border-line bg-paper/60 sm:mx-5 sm:mb-5" aria-label="What happened, in order">
        {TIMELINE.map((e) => (
          <li key={e.type} className="flex items-center gap-3 px-3 py-2.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-cleared-tint text-cleared-strong">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[0.7rem] font-medium tracking-[0.01em] text-ink">{e.type}</p>
              <p className="truncate text-[0.78rem] text-muted-foreground">{e.line}</p>
            </div>
            <span className="shrink-0 font-mono text-[0.68rem] text-muted-foreground tabular-nums">{e.time}</span>
          </li>
        ))}
      </ol>

      <figcaption id="hero-beam-caption" className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-[0.75rem] text-muted-foreground">
        <BadgeCheck className="size-3.5 text-cleared" aria-hidden />
        The sale goes out through cleared to PayPal. Verified PayPal events come back to Ada&apos;s timeline.
      </figcaption>
    </figure>
  );
}
