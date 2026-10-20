import { BadgeCheck, Check, FileImage, FileText, ReceiptText } from "lucide-react";
import { StampMark } from "@/components/brand/logo";

// Mirrors the evidence seeded on Ada's "Harmattan Tapes" sale in src/db/seed.ts.
const LOCKER = [
  { icon: FileImage, label: "harmattan-cover-final.png", meta: "6.4 MB" },
  { icon: FileText, label: "harmattan-cover-layers.pdf", meta: "9.1 MB" },
  { icon: BadgeCheck, label: "Tolu A. confirmed receipt", meta: "18:00" },
  { icon: ReceiptText, label: "PayPal invoice, paid", meta: "$250" },
];

/** Landing illustration: the proof kept on one sale. */
export function LockerIllustration() {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface" aria-label="Proof kept on the Harmattan Tapes sale">
      {LOCKER.map(({ icon: Icon, label, meta }) => (
        <li key={label} className="flex items-center gap-2.5 px-3 py-2.5">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[0.8rem] text-ink">{label}</span>
          <span className="shrink-0 font-mono text-[0.68rem] text-muted-foreground tabular-nums">{meta}</span>
          <Check className="size-3.5 shrink-0 text-cleared" strokeWidth={3} aria-label="Kept" />
        </li>
      ))}
    </ul>
  );
}

const EXHIBITS = [
  { n: "A", line: "Final cover and layered file, delivered" },
  { n: "B", line: "Client confirmed receipt, with time and device" },
  { n: "C", line: "Invoice terms: 3000×3000 px, 2 revisions" },
];

/** Landing illustration: a drafted dispute response, sealed with the cleared stamp once Ada approves. */
export function PacketIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[20rem]" role="img" aria-label="A drafted dispute response citing three exhibits, waiting for Ada's approval">
      <div className="absolute inset-x-3 -bottom-2 h-full rounded-lg border border-line bg-surface/70" aria-hidden />
      <div className="absolute inset-x-1.5 -bottom-1 h-full rounded-lg border border-line bg-surface/90" aria-hidden />
      <div className="relative rounded-lg border border-line bg-surface p-4 shadow-soft">
        <p className="text-[0.72rem] text-muted-foreground">Reply to a “not received” dispute · $250</p>
        <p className="mt-1.5 text-[0.85rem] leading-snug text-ink">
          The final files were delivered and the client confirmed receipt
          <sup className="ml-0.5 font-mono text-[0.6rem] text-cleared-strong">A, B</sup>, as agreed in the invoice
          <sup className="ml-0.5 font-mono text-[0.6rem] text-cleared-strong">C</sup>.
        </p>
        <ul className="mt-3 space-y-1.5">
          {EXHIBITS.map((e) => (
            <li key={e.n} className="flex items-center gap-2 text-[0.76rem] text-ink">
              <span className="grid size-4 place-items-center rounded-[4px] border border-line bg-paper font-mono text-[0.6rem] font-semibold">{e.n}</span>
              {e.line}
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-dashed border-line pt-2 pr-12 text-[0.7rem] leading-snug text-muted-foreground">
          Drafted by Cleared AI · Ada checks it and approves it before it is sent
        </div>
        <div className="absolute -right-3 -bottom-4 grid size-14 rotate-[-14deg] place-items-center rounded-full border-2 border-cleared/70 bg-surface/80 text-cleared" aria-hidden>
          <StampMark className="size-9" />
        </div>
      </div>
    </div>
  );
}
