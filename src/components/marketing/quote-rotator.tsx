"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { instrumentSerif } from "./fonts";

export type SellerQuote = { quote: string; who: string; when: string; href: string };

/** One seller's words at a time, every 6s. Hover or focus pauses it; picking a quote stops it. */
export function QuoteRotator({ quotes }: { quotes: SellerQuote[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (reduce || paused || stopped) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % quotes.length), 6000);
    return () => clearInterval(t);
  }, [reduce, paused, stopped, quotes.length]);

  const q = quotes[i];
  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="mx-auto max-w-4xl text-center"
    >
      <div className="grid min-h-[13rem] items-center sm:min-h-[11rem]">
        <AnimatePresence mode="wait" initial={false}>
          <m.figure
            key={q.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <blockquote className={cn(instrumentSerif.className, "text-[1.85rem] leading-[1.18] text-balance text-ink sm:text-[2.6rem]")}>“{q.quote}”</blockquote>
            <figcaption className="mt-5 flex flex-col items-center gap-1 text-[0.9rem] text-muted-foreground sm:flex-row sm:justify-center sm:gap-3">
              <span>{q.who}</span>
              <a href={q.href} className="inline-flex items-center gap-1 rounded-sm underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
                {q.when}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </figcaption>
          </m.figure>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex justify-center gap-1" role="group" aria-label="Choose a quote">
        {quotes.map((x, n) => (
          <button
            key={x.href}
            type="button"
            onClick={() => {
              setI(n);
              setStopped(true);
            }}
            aria-label={`Quote ${n + 1} of ${quotes.length}`}
            aria-current={n === i ? "true" : undefined}
            className="grid h-8 w-8 place-items-center rounded-full"
          >
            <span className={cn("block h-1.5 rounded-full transition-all duration-300", n === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25")} />
          </button>
        ))}
      </div>
    </div>
  );
}
