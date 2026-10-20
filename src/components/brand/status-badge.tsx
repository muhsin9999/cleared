import { BadgeCheck, Banknote, LockOpen, PackageCheck, PencilLine, Send, TriangleAlert, Undo2, type LucideIcon } from "lucide-react";
import { SALE_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SaleStatus = keyof typeof SALE_STATUS_LABEL;

// Every status pairs an icon with its word, so it never relies on colour alone.
const STATUS_STYLE: Record<SaleStatus, { icon: LucideIcon; className: string }> = {
  draft: { icon: PencilLine, className: "border-line bg-secondary text-muted-foreground" },
  sent: { icon: Send, className: "border-line bg-surface text-ink" },
  paid: { icon: Banknote, className: "border-cleared/20 bg-surface text-cleared-strong" },
  delivered: { icon: PackageCheck, className: "border-cleared/20 bg-cleared-tint/60 text-cleared-strong" },
  accepted: { icon: BadgeCheck, className: "border-cleared/25 bg-cleared-tint text-cleared-strong" },
  released: { icon: LockOpen, className: "border-cleared bg-cleared text-primary-foreground" },
  disputed: { icon: TriangleAlert, className: "border-risk/25 bg-risk-tint text-risk" },
  refunded: { icon: Undo2, className: "border-line bg-secondary text-muted-foreground" },
};

export function SaleStatusBadge({ status, className }: { status: SaleStatus; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_STYLE[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {SALE_STATUS_LABEL[status]}
    </span>
  );
}
