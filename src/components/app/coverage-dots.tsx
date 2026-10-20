import { cn } from "@/lib/utils";

export function CoverageDots({ done, total, className }: { done: number; total: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={`Proof coverage ${done} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("size-2 rounded-full", i < done ? "bg-cleared" : "border border-input bg-transparent")} />
      ))}
    </span>
  );
}
