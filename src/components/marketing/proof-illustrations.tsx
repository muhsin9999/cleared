import { BadgeCheck, Check, FileImage, MessageSquareText, ReceiptText } from "lucide-react";
import { StampMark } from "@/components/brand/logo";

const LOCKER = [
  { icon: FileImage, label: "harmattan-cover-final.png", meta: "6.4 MB" },
  { icon: BadgeCheck, label: "Client confirmed receipt", meta: "18:02" },
  { icon: MessageSquareText, label: "Agreed scope, email thread", meta: "Oct 13" },
  { icon: ReceiptText, label: "Invoice #0007, paid", meta: "$250" },
];

/** Landing illustration: a miniature proof locker. */
export function LockerIllustration() {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface" aria-label="Example proof locker">
      {LOCKER.map(({ icon: Icon, label, meta }) => (
        <li key={label} className="flex items-center gap-2.5 px-3 py-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[0.75rem] text-ink">{label}</span>
          <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground tabular-nums">{meta}</span>
          <Check className="size-3.5 shrink-0 text-cleared" strokeWidth={3} aria-label="Kept" />
        </li>
      ))}
    </ul>
  );
}

const EXHIBITS = [
  { n: "A", line: "Final files delivered Oct 18" },
  { n: "B", line: "Client acceptance, 18:02" },
  { n: "C", line: "Invoice terms and scope" },
];

/** Landing illustration: an evidence packet sealed with the cleared stamp. */
export function PacketIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[17rem]" role="img" aria-label="Example evidence packet with three exhibits, ready for the seller to review">
      <div className="absolute inset-x-3 -bottom-2 h-full rounded-lg border border-line bg-surface/70" aria-hidden />
      <div className="absolute inset-x-1.5 -bottom-1 h-full rounded-lg border border-line bg-surface/90" aria-hidden />
      <div className="relative rounded-lg border border-line bg-surface p-3.5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[0.62rem] tracking-[0.08em] text-muted-foreground uppercase">Evidence packet</p>
          <p className="font-mono text-[0.62rem] text-muted-foreground">PP-D-4417</p>
        </div>
        <p className="mt-1 text-[0.8rem] font-medium text-ink">Item received as described</p>
        <ul className="mt-2.5 space-y-1.5">
          {EXHIBITS.map((e) => (
            <li key={e.n} className="flex items-center gap-2 text-[0.72rem] text-ink">
              <span className="grid size-4 place-items-center rounded-[4px] border border-line bg-paper font-mono text-[0.6rem] font-semibold">{e.n}</span>
              {e.line}
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-dashed border-line pt-2 pr-12 text-[0.65rem] leading-snug text-muted-foreground">
          Drafted by Cleared AI · Ada approves before sending
        </div>
        <div className="absolute -right-3 -bottom-4 grid size-14 rotate-[-14deg] place-items-center rounded-full border-2 border-cleared/70 bg-surface/80 text-cleared" aria-hidden>
          <StampMark className="size-9" />
        </div>
      </div>
    </div>
  );
}
