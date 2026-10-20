"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { BadgeCheck, Check, FileImage, FileText, ReceiptText, TriangleAlert } from "lucide-react";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { cn } from "@/lib/utils";
import { InkStamp } from "./hero-stage";

/** Counts 0 → steps.length once the element scrolls into view, one step every `gap` ms. */
function useSteps(count: number, { gap, start }: { gap: number; start: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const t = window.setTimeout(() => setStep(count), 0);
      return () => clearTimeout(t);
    }
    const timers = Array.from({ length: count }, (_, i) => window.setTimeout(() => setStep(i + 1), start + i * gap));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, count, gap, start]);

  return { ref, step };
}

// (a) Check: the readiness ring steps 38 → 94 as each finding on the Northwind Games sale is fixed
// (weights from src/lib/preflight.ts).
const CHECKS = [
  { label: "Split into deposit + final", score: 54 },
  { label: "Delivery within 10 days", score: 68 },
  { label: "Files, size and revisions", score: 84 },
  { label: "Refund terms added", score: 94 },
];

export function CheckMoment() {
  const { ref, step } = useSteps(CHECKS.length, { gap: 450, start: 500 });
  const score = step === 0 ? 38 : CHECKS[step - 1].score;
  return (
    <div ref={ref} className="flex w-full items-center gap-5">
      <ReadinessRing score={score} size={104} showVerdict={false} label="Readiness of the Northwind Games sale" />
      <ul className="min-w-0 flex-1 space-y-2">
        {CHECKS.map((c, i) => {
          const done = step > i;
          return (
            <li key={c.label} className="flex items-center gap-2 text-[0.82rem] text-ink">
              <span
                className={cn(
                  "grid size-[1.15rem] shrink-0 place-items-center rounded-full transition-colors duration-300",
                  done ? "bg-cleared text-white" : "bg-caution-tint text-caution",
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" strokeWidth={3.2} /> : <TriangleAlert className="size-2.5" />}
              </span>
              <span className={cn("truncate transition-colors duration-300", done ? "text-ink" : "text-muted-foreground")}>{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// (b) Keep the proof: the evidence seeded on Ada's "Harmattan Tapes" sale (src/db/seed.ts) drops in.
const LOCKER = [
  { icon: FileImage, label: "harmattan-cover-final.png", meta: "6.4 MB" },
  { icon: FileText, label: "harmattan-cover-layers.pdf", meta: "9.1 MB" },
  { icon: BadgeCheck, label: "Tolu A. confirmed receipt", meta: "18:00" },
  { icon: ReceiptText, label: "PayPal invoice, paid", meta: "$250" },
];

export function LockerMoment() {
  const { ref, step } = useSteps(LOCKER.length, { gap: 380, start: 350 });
  return (
    <div ref={ref} className="w-full">
      <p className="mb-2 flex items-center justify-between text-[0.75rem] text-muted-foreground">
        <span>Harmattan Tapes · proof kept</span>
        <span className="tabular-nums">
          <NumberFlow value={step} /> of {LOCKER.length}
        </span>
      </p>
      <ul className="space-y-1.5" aria-label="Proof kept on the Harmattan Tapes sale">
        {LOCKER.map(({ icon: Icon, label, meta }, i) => {
          const shown = step > i;
          return (
            <m.li
              key={label}
              initial={false}
              animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.25, y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-2.5 rounded-[8px] border border-line bg-surface px-3 py-2 shadow-[0_1px_2px_rgb(11_18_21/0.04)]"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[0.8rem] text-ink">{label}</span>
              <span className="shrink-0 text-[0.72rem] text-muted-foreground tabular-nums">{meta}</span>
              <Check className={cn("size-3.5 shrink-0 transition-colors duration-300", shown ? "text-cleared" : "text-line")} strokeWidth={3} aria-label={shown ? "Kept" : undefined} />
            </m.li>
          );
        })}
      </ul>
    </div>
  );
}

// (c) Answer disputes: the demo's simulated "not received" dispute on the delivered Harmattan cover
// (server/actions/demo.ts) becomes a drafted reply citing exhibits A–C, then the stamp seals it.
const EXHIBITS = [
  { n: "A", line: "Final cover and layered file, delivered" },
  { n: "B", line: "Client confirmed receipt, with time" },
  { n: "C", line: "Invoice terms: 3000×3000 px, 2 revisions" },
];

export function DisputeMoment() {
  // 1: reply page replaces the notice · 2–4: exhibits A, B, C · 5: sealed
  const { ref, step } = useSteps(5, { gap: 420, start: 900 });
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[21rem]" role="img" aria-label="A “not received” dispute becomes a drafted reply citing three exhibits, sealed with the cleared stamp once Ada approves it">
      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <m.div
            key="notice"
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-[10px] border border-caution/30 bg-surface p-4 shadow-soft"
          >
            <p className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-caution">
              <TriangleAlert className="size-3.5" aria-hidden /> Dispute: item not received
            </p>
            <p className="mt-2 text-[0.85rem] text-ink">Lagos Lo-Fi Records · $250.00</p>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">Respond within 10 days</p>
            <div className="mt-4 space-y-1.5" aria-hidden>
              <div className="h-1.5 w-11/12 rounded-full bg-secondary" />
              <div className="h-1.5 w-8/12 rounded-full bg-secondary" />
            </div>
          </m.div>
        ) : (
          <m.div
            key="reply"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative rounded-[10px] border border-line bg-surface p-4 shadow-soft"
          >
            <p className="pr-12 text-[0.75rem] text-muted-foreground">Reply to PayPal · drafted, for Ada to approve</p>
            <p className="mt-1.5 text-[0.84rem] leading-snug text-ink">
              The files were delivered and the client confirmed receipt
              <sup className="ml-0.5 text-[0.6rem] font-semibold text-cleared-strong">A, B</sup>, as the invoice set out
              <sup className="ml-0.5 text-[0.6rem] font-semibold text-cleared-strong">C</sup>.
            </p>
            <ul className="mt-3 space-y-1.5">
              {EXHIBITS.map((e, i) => (
                <m.li
                  key={e.n}
                  initial={false}
                  animate={step > i + 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 14 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="flex items-center gap-2 text-[0.76rem] text-ink"
                >
                  <span className="grid size-[1.1rem] place-items-center rounded-[4px] border border-line bg-paper text-[0.62rem] font-semibold">{e.n}</span>
                  {e.line}
                </m.li>
              ))}
            </ul>
            <InkStamp pressed={step >= 5} className="absolute -top-8 -right-6 size-[5.25rem]" />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A big figure that counts up from zero the first time it scrolls into view. */
export function CountUp({ value, suffix, className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  // Server and first paint show the real number; it only resets to 0 if it is still off-screen.
  const [shown, setShown] = useState(value);
  const armed = useRef(false);

  useEffect(() => {
    if (reduce || armed.current) return;
    armed.current = true;
    if (!inView) {
      const t = window.setTimeout(() => setShown(0), 0);
      return () => clearTimeout(t);
    }
  }, [inView, reduce]);

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setShown(value), 150);
    return () => clearTimeout(t);
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {value.toLocaleString("en-US")}
        {suffix}
      </span>
      <NumberFlow
        aria-hidden
        className="[&::part(suffix)]:text-[0.42em] [&::part(suffix)]:tracking-[-0.02em]" value={shown} suffix={suffix} transformTiming={{ duration: 1100, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }} spinTiming={{ duration: 1100, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }} />
    </span>
  );
}
