"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { m, useReducedMotion } from "motion/react";
import { Check, RotateCcw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// The app's sample sale (src/app/(app)/sales/new/new-sale-flow.tsx) checked by src/lib/preflight.ts
// against Ada's seeded history (average $109). Findings weigh 22 + 14 + 16 + 10, so it starts at 38.
// Each accepted fix removes its weight (the split leaves 6 for the spike), so it ends at 94.
const ROWS = [
  {
    before: { title: "3× your usual sale", sub: "One big payment on a young account" },
    after: { title: "3× your usual sale", sub: "Split into deposit + final" },
  },
  {
    before: { title: "No delivery date", sub: "Open-ended delivery" },
    after: { title: "Delivery date added", sub: "Within 10 days" },
  },
  {
    before: { title: "The description is vague", sub: "No format, size or revisions" },
    after: { title: "Files, size and revisions spelled out", sub: "PNG 3000×3000 px, 2 revision rounds" },
  },
];

// phase: 0 found · 1–3 rows fixed · 4 refund terms added · 5 ready to invoice · 6 stamped
const SCORE_AT = [38, 54, 68, 84, 94, 94, 94];
const STEPS_MS = [650, 1100, 1550, 1950, 2250, 2550];
const FINAL = 6;

function usePhase() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);
  const doneAt = useRef(0);

  useEffect(() => {
    if (reduce) {
      const t = window.setTimeout(() => setPhase(FINAL), 0);
      return () => clearTimeout(t);
    }
    const timers = STEPS_MS.map((ms, i) =>
      window.setTimeout(() => {
        setPhase(i + 1);
        if (i + 1 === FINAL) doneAt.current = Date.now();
      }, ms + (run === 0 ? 0 : -350)),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduce, run]);

  const replay = useCallback(
    (force = false) => {
      if (reduce) return;
      // Hover and focus replay only once the last run has settled, so the card never loops.
      if (!force && (doneAt.current === 0 || Date.now() - doneAt.current < 1200)) return;
      doneAt.current = 0;
      setPhase(0);
      setRun((r) => r + 1);
    },
    [reduce],
  );

  return { phase, replay, reduce };
}

function ArtTile() {
  // A thumbnail of the work being sold: three poses of one character, drawn in code.
  return (
    <div className="relative size-[3.6em] shrink-0 overflow-hidden rounded-[0.55em] bg-[#EFE3D2] ring-1 ring-ink/5" aria-hidden>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full">
        <rect x="0" y="34" width="48" height="14" fill="#E5D3BC" />
        {[
          { x: 10, c: "#1F4D3F", tilt: -6 },
          { x: 24, c: "#B5562E", tilt: 0 },
          { x: 38, c: "#2C3E50", tilt: 8 },
        ].map((f) => (
          <g key={f.x} transform={`rotate(${f.tilt} ${f.x} 34)`}>
            <circle cx={f.x} cy="15.5" r="4" fill="#E9B98F" />
            <path d={`M${f.x - 4.5} 37 q0 -14 4.5 -16 q4.5 2 4.5 16 z`} fill={f.c} />
            <path d={`M${f.x - 4.2} 13.5 q4.2 -5 8.4 0`} fill="none" stroke="#2A1D14" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function Ring({ score, ready }: { score: number; ready: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[7.4em] shrink-0 place-items-center" aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7.5" className="stroke-[#ECE9E2]" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={cn("transition-[stroke-dashoffset,stroke] duration-500 ease-out", ready ? "stroke-cleared" : "stroke-caution")}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <NumberFlow value={score} className="text-[2.35em] font-semibold tracking-[-0.04em] text-ink tabular-nums" />
        <span className="mt-[0.2em] text-[0.74em] text-muted-foreground">Readiness</span>
      </div>
    </div>
  );
}

function SaleCard({ phase, onReplay, className }: { phase: number; onReplay: (force?: boolean) => void; className?: string }) {
  const ready = phase >= 5;
  const score = SCORE_AT[phase];
  return (
    <div
      className={cn("group/card relative rounded-[0.9em] bg-surface p-[1.5em] shadow-[0_1px_2px_rgb(11_18_21/0.06),0_18px_48px_-12px_rgb(40_30_15/0.28)] ring-1 ring-ink/[0.06]", className)}
      onPointerEnter={() => onReplay()}
      onFocus={() => onReplay()}
    >
      <div className="flex items-start gap-[0.9em]">
        <ArtTile />
        <div className="min-w-0 flex-1 pt-[0.25em]">
          <p className="truncate text-[1.02em] font-semibold tracking-[-0.01em] text-ink">Character sheet: 3 poses</p>
          <p className="mt-[0.15em] text-[0.86em] text-muted-foreground">Northwind Games</p>
        </div>
        <div className="pt-[0.2em] text-right">
          <p className="text-[1.35em] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">$400.00</p>
          <p className="mt-[0.4em] text-[0.78em] text-muted-foreground">Sale amount</p>
        </div>
      </div>

      <div className="my-[1.15em] h-px bg-line" />

      <div className="flex items-center gap-[1.25em]">
        <Ring score={score} ready={ready} />
        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <p
            className={cn(
              "flex items-center gap-[0.4em] text-[1.2em] font-semibold tracking-[-0.02em] transition-colors duration-300",
              ready ? "text-cleared-strong" : "text-caution",
            )}
          >
            {ready ? <Check className="size-[0.95em]" strokeWidth={3} aria-hidden /> : <TriangleAlert className="size-[0.9em]" aria-hidden />}
            {ready ? "Ready to invoice" : "Worth fixing"}
          </p>
          <p className="mt-[0.35em] text-[0.88em] leading-snug text-muted-foreground">
            {ready ? "$200 deposit now, $200 on delivery." : "Four things PayPal weighs. Each has a fix."}
          </p>
          <span className="sr-only">Readiness {score} out of 100.</span>
        </div>
      </div>

      <ul className="mt-[1.1em] divide-y divide-line border-t border-line">
        {ROWS.map((row, i) => {
          const done = phase > i;
          const text = done ? row.after : row.before;
          return (
            <li key={i} className="flex items-center gap-[0.8em] py-[0.72em]">
              <span
                className={cn(
                  "grid size-[1.75em] shrink-0 place-items-center rounded-full transition-colors duration-300",
                  done ? "bg-cleared text-white" : "bg-caution-tint text-caution",
                )}
                aria-hidden
              >
                {done ? (
                  <m.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }} className="grid">
                    <Check className="size-[1em]" strokeWidth={3.2} />
                  </m.span>
                ) : (
                  <TriangleAlert className="size-[0.9em]" />
                )}
              </span>
              <m.div key={done ? "a" : "b"} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="min-w-0 flex-1">
                <p className="truncate text-[0.93em] font-medium text-ink">{text.title}</p>
                <p className="truncate text-[0.8em] text-muted-foreground">{text.sub}</p>
              </m.div>
              <span className={cn("shrink-0 text-[0.82em] font-medium", done ? "text-cleared-strong" : "text-caution")}>{done ? "Fixed" : "To fix"}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-[1em] border-t border-line pt-[0.8em] text-[0.8em] text-muted-foreground">
        <span className="flex items-center gap-[0.4em]">
          {phase >= 4 ? <Check className="size-[1.05em] text-cleared" strokeWidth={3} aria-hidden /> : <span className="size-[1.05em]" aria-hidden />}
          {phase >= 4 ? "Refund and revision terms added" : "No refund or revision terms yet"}
        </span>
        <button
          type="button"
          onClick={() => onReplay(true)}
          className="-mr-[0.4em] inline-flex items-center gap-[0.35em] rounded-[0.4em] px-[0.4em] py-[0.15em] text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
        >
          <RotateCcw className="size-[1em]" aria-hidden />
          Replay
          <span className="sr-only"> the check</span>
        </button>
      </div>
    </div>
  );
}

/** The CLEARED stamp pressed onto the invoice, with a slightly uneven ink. */
export function InkStamp({ className, pressed = true }: { className?: string; pressed?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <m.div
      className={cn("pointer-events-none text-cleared mix-blend-multiply", className)}
      initial={false}
      animate={pressed ? { opacity: 0.9, scale: [1.4, 0.97, 1], rotate: -12 } : { opacity: 0, scale: 1.4, rotate: -18 }}
      transition={pressed ? { duration: 0.42, times: [0, 0.72, 1], ease: "easeOut" } : { duration: 0.2 }}
      aria-hidden
    >
      <svg viewBox="0 0 120 120" className="block size-full overflow-visible">
        <defs>
          <filter id={`${id}-ink`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.6" result="holes" />
            <feComposite in="SourceGraphic" in2="holes" operator="in" result="speckled" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
            <feDisplacementMap in="speckled" in2="warp" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <path id={`${id}-top`} d="M 24 60 a 36 36 0 1 1 72 0" />
          <path id={`${id}-bottom`} d="M 14.5 60 a 45.5 45.5 0 0 0 91 0" />
        </defs>
        <g filter={`url(#${id}-ink)`} fill="none" stroke="currentColor">
          <circle cx="60" cy="60" r="56" strokeWidth="4.5" />
          <circle cx="60" cy="60" r="50" strokeWidth="1.4" />
          <circle cx="60" cy="60" r="29" strokeWidth="1.4" />
          <text fill="currentColor" stroke="none" fontSize="13.5" fontWeight="700" letterSpacing="3" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
              CLEARED
            </textPath>
          </text>
          <text fill="currentColor" stroke="none" fontSize="8.5" fontWeight="600" letterSpacing="2.4" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
              READY TO INVOICE
            </textPath>
          </text>
          <circle cx="18.5" cy="60" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="101.5" cy="60" r="1.8" fill="currentColor" stroke="none" />
          <path d="M45 61l10 10 21-22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </m.div>
  );
}

/** Ink on the top sheet of the photo: the deposit invoice Cleared prepares once the sale is ready. */
function PaperInvoice({ visible }: { visible: boolean }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      className="text-[#2B2620] mix-blend-multiply"
      aria-hidden
    >
      <div className="flex items-start justify-between">
        <p className="text-[1.75em] leading-none font-bold tracking-[-0.04em]">
          cleared<span className="text-cleared">.</span>
        </p>
        <div className="text-right text-[0.78em] leading-snug">
          <p className="font-semibold">Invoice #0009</p>
          <p className="opacity-75">Okafor Studio</p>
        </div>
      </div>
      <p className="mt-[1.4em] text-[0.72em] opacity-70">Billed to</p>
      <p className="text-[0.95em] font-semibold">Northwind Games</p>
      <div className="mt-[1.1em] flex justify-between border-b border-current/30 pb-[0.3em] text-[0.68em] opacity-70">
        <span>Description</span>
        <span>Amount</span>
      </div>
      <div className="flex items-start justify-between gap-[1em] py-[0.55em] text-[0.8em] leading-snug">
        <span>
          Character sheet: 3 poses
          <br />
          <span className="opacity-75">Deposit (50%)</span>
        </span>
        <span className="tabular-nums">$200.00</span>
      </div>
      <div className="flex justify-between border-t border-current/40 pt-[0.45em] text-[0.95em] font-semibold">
        <span>Total</span>
        <span className="tabular-nums">$200.00</span>
      </div>
    </m.div>
  );
}

/**
 * The hero's centrepiece. `scene` lays the card, the paper invoice and the stamp over the desk photo
 * (positions are fractions of desk-wide.png, sizes are container-relative so they track the photo);
 * `stack` is the phone version, with the card in the flow and the stamp on its corner.
 *
 * Sequence: card in (0–0.5s) → each finding ticks to "Fixed" 450ms apart while the score steps
 * 38 → 54 → 68 → 84 → 94 → "Ready to invoice" (2.25s) → the stamp presses on (2.55s, settles by ~3s).
 */
export function HeroStage({ layout }: { layout: "scene" | "stack" }) {
  const { phase, replay } = usePhase();
  const stamped = phase >= FINAL;

  if (layout === "stack") {
    return (
      <div className="relative mx-auto w-full max-w-[24rem] text-[13.5px] sm:text-[15px]">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <SaleCard phase={phase} onReplay={replay} />
        </m.div>
        <InkStamp pressed={stamped} className="absolute -right-1 -bottom-24 size-[7rem]" />
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-[13.4%] left-[69.6%] w-[22.6cqw] origin-top-left rotate-[8.4deg] text-[0.98cqw]">
        <PaperInvoice visible />
      </div>
      <InkStamp pressed={stamped} className="absolute top-[38.5%] left-[79.6%] size-[10.5cqw]" />
      <m.div
        className="absolute top-[34%] left-[45%] w-[30em] text-[1cqw]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SaleCard phase={phase} onReplay={replay} />
      </m.div>
    </>
  );
}
