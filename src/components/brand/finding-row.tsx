import { Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Severity = "risk" | "caution" | "info";

const SEVERITY: Record<Severity, { icon: LucideIcon; word: string; tone: string; chip: string }> = {
  risk: { icon: OctagonAlert, word: "High risk", tone: "text-risk", chip: "bg-risk-tint text-risk" },
  caution: { icon: TriangleAlert, word: "Check this", tone: "text-caution", chip: "bg-caution-tint text-caution" },
  info: { icon: Info, word: "Good to know", tone: "text-muted-foreground", chip: "bg-secondary text-muted-foreground" },
};

/** One pre-flight or notice finding. Severity is carried by icon + word, never colour alone. */
export function FindingRow({
  severity,
  title,
  detail,
  action,
  className,
}: {
  severity: Severity;
  title: string;
  detail?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const s = SEVERITY[severity];
  const Icon = s.icon;
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3.5", className)}>
      <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", s.chip)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          <span className={cn("mr-2 text-xs font-semibold tracking-[0.02em] uppercase", s.tone)}>{s.word}</span>
          {title}
        </p>
        {detail ? <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
