"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { Check, TriangleAlert } from "lucide-react";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { cn } from "@/lib/utils";

const FIXES = [
  { before: "Delivery date missing", after: "Delivery by Nov 4 added" },
  { before: "First sale over 3× your average", after: "Explained in the invoice note" },
];

/** Landing illustration: the readiness ring climbs from 41 to 92 as two fixes land. */
export function ReadinessDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [fixed, setFixed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = [window.setTimeout(() => setFixed(1), 700), window.setTimeout(() => setFixed(2), 1500)];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const score = fixed === 0 ? 41 : fixed === 1 ? 68 : 92;

  return (
    <div ref={ref} className="flex items-center gap-4">
      <ReadinessRing score={score} size={84} label="Readiness of Ada's sale" />
      <ul className="min-w-0 flex-1 space-y-2">
        {FIXES.map((f, i) => {
          const done = fixed > i;
          return (
            <li
              key={f.before}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2.5 py-2 text-[0.75rem] leading-snug transition-colors duration-200",
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
