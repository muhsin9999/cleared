"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Cleared's agent: a round seal with two eyes. Only the eyes act, and they follow what the agent is really
// doing (the case room maps the packet's status to a mood), so the face is never a decoration on its own.
export type AgentMood = "idle" | "working" | "thinking" | "concerned" | "done";

// The agent wears the Cleared stamp: brand green with the stamp's double ring, so it reads on light and dark.
export const AGENT_GREEN = "#0f7b5f";

type Gaze = { x: number; y: number };
const LOOKS: Record<Exclude<AgentMood, "done">, Gaze[]> = {
  idle: [{ x: 0, y: 0 }, { x: -7, y: 0 }, { x: 7, y: -1 }, { x: 0, y: -6 }, { x: 0, y: 0 }, { x: 6, y: 4 }],
  working: [{ x: -4, y: 7 }, { x: 0, y: 8 }, { x: 4, y: 7 }, { x: 0, y: 8 }],
  thinking: [{ x: 5, y: -7 }, { x: -3, y: -8 }, { x: 6, y: -6 }],
  concerned: [{ x: 0, y: 2 }],
};
const PACE: Record<AgentMood, number> = { idle: 1700, working: 900, thinking: 1400, concerned: 4000, done: 4000 };

export function AgentAvatar({ mood = "idle", className, still = false, label = "Cleared AI" }: { mood?: AgentMood; className?: string; still?: boolean; label?: string }) {
  const reduce = useReducedMotion();
  const moving = !still && !reduce;
  const [look, setLook] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!moving || mood === "done") return;
    const t = setInterval(() => setLook((i) => i + 1), PACE[mood]);
    return () => clearInterval(t);
  }, [moving, mood]);
  useEffect(() => {
    if (!moving || mood === "done") return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        next();
      }, 2600 + Math.random() * 2400);
    };
    next();
    return () => clearTimeout(t);
  }, [moving, mood]);

  const looks = mood === "done" ? [{ x: 0, y: -2 }] : LOOKS[mood];
  const gaze = moving ? looks[look % looks.length] : mood === "working" ? { x: 0, y: 6 } : { x: 0, y: 0 };
  const ry = blink ? 1 : mood === "concerned" ? 7 : 9;

  return (
    <span role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 100 100" className="size-full overflow-visible">
        <m.g animate={moving && mood === "working" ? { y: [0, -1.5, 0] } : { y: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <circle cx="50" cy="50" r="49" fill={AGENT_GREEN} />
          <circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3.5" />
          <circle cx="50" cy="50" r="38.5" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.3" />
          <m.g initial={false} animate={gaze} transition={{ type: "spring", stiffness: 180, damping: 18 }}>
            {mood === "done" ? (
              <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
                <path d="M30 52 Q37 42 44 52" />
                <path d="M56 52 Q63 42 70 52" />
              </g>
            ) : (
              <g fill="#fff">
                {[37, 63].map((cx) => (
                  <m.ellipse key={cx} cx={cx} cy="50" rx="6.5" initial={false} animate={{ ry, cy: mood === "concerned" ? 52 : 50 }} transition={{ duration: blink ? 0.06 : 0.2 }} />
                ))}
                {mood === "concerned" ? <rect x="26" y="36" width="48" height="12" fill={AGENT_GREEN} /> : null}
              </g>
            )}
          </m.g>
        </m.g>
      </svg>
      <AnimatePresence>
        {mood === "done" ? (
          <m.span
            key="check"
            aria-hidden
            initial={reduce ? false : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.15 }}
            className="absolute -top-[6%] -right-[6%] grid size-[40%] place-items-center rounded-full bg-white shadow-sm ring-2 ring-[#0f7b5f]"
          >
            <svg viewBox="0 0 20 20" className="size-[62%]" fill="none" stroke={AGENT_GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10.5l3.2 3L15 6.5" /></svg>
          </m.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
