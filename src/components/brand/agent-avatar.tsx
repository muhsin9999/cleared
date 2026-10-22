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
/**
 * Counts the moments `signal` turns on (or changes to a new truthy value) while the component is mounted.
 * It is 0 on first render, so something already finished when a page opens doesn't celebrate again; only
 * finishing in front of the viewer does.
 */
export function useCelebration(signal: boolean | string) {
  const [prev, setPrev] = useState(signal);
  const [count, setCount] = useState(0);
  if (signal !== prev) {
    setPrev(signal);
    if (signal) setCount((c) => c + 1);
  }
  return count;
}

const RAYS = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);

/**
 * Short green rays that burst out and fade once, around whatever it sits on (the avatar, the readiness
 * ring). Render it with a new `key` each time it should play; it draws nothing under reduced motion.
 */
export function Burst({ className, color = AGENT_GREEN, from = 56, length = 10 }: { className?: string; color?: string; from?: number; length?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none absolute inset-0 size-full overflow-visible", className)}>
      {RAYS.map((deg, i) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <m.line
            x1="50" x2="50" y1={50 - from} y2={50 - from - length}
            stroke={color} strokeWidth="4" strokeLinecap="round"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, -2, -6, -9] }}
            transition={{ duration: 0.8, delay: 0.05 + (i % 2) * 0.06, ease: "easeOut" }}
          />
        </g>
      ))}
    </svg>
  );
}

const PACE: Record<AgentMood, number> = { idle: 1700, working: 900, thinking: 1400, concerned: 4000, done: 4000 };

// `calm` is for lists such as Activity: the eyes drift less, wait several seconds between moves and each copy
// keeps its own timing, so a column of faces never moves in step or pulls the eye away from the text.
// `milestone` names what was just finished (e.g. "drafted", "sent"): reaching a new one while already done
// celebrates again.
export function AgentAvatar({ mood = "idle", className, still = false, calm = false, label = "Cleared AI", milestone = "done" }: { mood?: AgentMood; className?: string; still?: boolean; calm?: boolean; label?: string; milestone?: string }) {
  const reduce = useReducedMotion();
  const moving = !still && !reduce;
  const [look, setLook] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!moving || mood === "done") return;
    if (!calm) {
      const t = setInterval(() => setLook((i) => i + 1), PACE[mood]);
      return () => clearInterval(t);
    }
    let t: ReturnType<typeof setTimeout>;
    const next = (first: boolean) => {
      t = setTimeout(() => {
        setLook((i) => i + 1);
        next(false);
      }, (first ? 2500 : 5000) + Math.random() * 5000);
    };
    next(true);
    return () => clearTimeout(t);
  }, [moving, mood, calm]);
  useEffect(() => {
    if (!moving || mood === "done") return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        next();
      }, calm ? 6000 + Math.random() * 8000 : 2600 + Math.random() * 2400);
    };
    next();
    return () => clearTimeout(t);
  }, [moving, mood, calm]);

  // Finishing in front of the viewer: a small hop and a ray burst, once (the happy eyes and badge stay).
  const celebrated = useCelebration(mood === "done" && milestone);

  const looks = mood === "done" ? [{ x: 0, y: -2 }] : LOOKS[mood];
  const raw = moving ? looks[look % looks.length] : mood === "working" ? { x: 0, y: 6 } : { x: 0, y: 0 };
  const gaze = calm ? { x: raw.x * 0.55, y: raw.y * 0.55 } : raw;
  const ry = blink ? 1 : mood === "concerned" ? 7 : 9;

  return (
    <span role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      {celebrated && !calm ? <Burst key={celebrated} /> : null}
      <svg viewBox="0 0 100 100" className="size-full overflow-visible">
        <m.g key={`hop-${celebrated}`} animate={celebrated && !reduce ? { y: [0, -7, 0, -2, 0] } : { y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <m.g animate={moving && mood === "working" ? { y: [0, -1.5, 0] } : { y: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <circle cx="50" cy="50" r="49" fill={AGENT_GREEN} />
          <circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3.5" />
          <circle cx="50" cy="50" r="38.5" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.3" />
          <m.g initial={false} animate={gaze} transition={calm ? { type: "spring", stiffness: 60, damping: 16 } : { type: "spring", stiffness: 180, damping: 18 }}>
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
