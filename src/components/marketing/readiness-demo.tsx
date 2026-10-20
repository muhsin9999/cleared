"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { Check, TriangleAlert } from "lucide-react";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { cn } from "@/lib/utils";

// The app's sample sale (Northwind Games, $400) scored by src/lib/preflight.ts against Ada's seeded
// history (4 paid sales, average $109): 100 − 22 − 14 − 16 − 10 = 38, and 94 once every fix is accepted.
const FIXES = [
  { before: "This sale is 3× your average", after: "Split into 50% deposit + 50% on delivery", score: 54 },
  { before: "No delivery date", after: "Deliver within 10 days of payment", score: 68 },
  { before: "The description is vague", after: "Files, size and revisions spelled out", score: 84 },
  { before: "No refund or revision terms", after: "Standard terms added", score: 94 },
];

/** Landing illustration: the readiness ring climbs from 38 to 94 as Ada accepts each fix. */
export function ReadinessDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [fixed, setFixed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = FIXES.map((_, i) => window.setTimeout(() => setFixed(i + 1), 700 + i * 650));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const score = fixed === 0 ? 38 : FIXES[fixed - 1].score;

  return (
    <div ref={ref} className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <ReadinessRing score={score} size={92} label="Readiness of the Northwind Games sale" />
      <ul className="min-w-0 flex-1 space-y-1.5">
        {FIXES.map((f, i) => {
          const done = fixed > i;
          return (
            <li
              key={f.before}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[0.8rem] leading-snug transition-colors duration-200",
                done ? "border-cleared/20 bg-cleared-tint/70 text-cleared-strong" : "border-caution/25 bg-caution-tint text-caution",
              )}
            >
              {done ? <Check className="mt-px size-3.5 shrink-0" strokeWidth={3} aria-hidden /> : <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />}
              <span className="min-w-0">
                <span className="sr-only">{done ? "Fixed: " : "Finding: "}</span>
                {done ? f.after : f.before}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
