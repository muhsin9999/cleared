"use client";

import { useState } from "react";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { Button } from "@/components/ui/button";

const STEPS = [41, 68, 92];

export function RingDemo() {
  const [score, setScore] = useState(41);
  return (
    <div className="flex flex-wrap items-center gap-8">
      <ReadinessRing score={score} size={140} label="Demo readiness" />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Accept fixes to watch it settle.</p>
        <div className="flex gap-2" role="group" aria-label="Set demo score">
          {STEPS.map((s) => (
            <Button key={s} size="sm" variant={s === score ? "default" : "outline"} aria-pressed={s === score} onClick={() => setScore(s)}>
              {s}
            </Button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">Readiness {score}</p>
      </div>
      <div className="flex items-end gap-6">
        <ReadinessRing score={32} size={72} label="Low readiness" />
        <ReadinessRing score={64} size={72} label="Medium readiness" />
        <ReadinessRing score={94} size={72} label="High readiness" />
      </div>
    </div>
  );
}
