import { BadgeCheck, Clock3, FileImage, FileText } from "lucide-react";
import { StampMark } from "@/components/brand/logo";

// Ada's seeded sale (src/db/seed.ts): paid 6 days ago, delivered, marked completed yesterday,
// so PayPal's 7-day service release (KNOWLEDGE K5) lands in 6 days.
const PROOF = [
  { icon: FileImage, label: "harmattan-sketch-v1.png", meta: "812 KB" },
  { icon: FileImage, label: "harmattan-cover-final.png", meta: "6.4 MB" },
  { icon: FileText, label: "harmattan-cover-layers.pdf", meta: "9.1 MB" },
  { icon: BadgeCheck, label: "Tolu A. confirmed receipt", meta: "Safari, iPhone" },
];

/** Hero artifact: one real sale from the demo workspace, drawn as the paperwork it is. */
export function SaleRecord() {
  return (
    <figure className="relative" aria-labelledby="sale-record-caption">
      <div className="relative rounded-[10px] border border-line bg-surface shadow-soft">
        <div className="flex items-baseline gap-2 border-b border-line py-3.5 pr-20 pl-5 sm:pl-6">
          <p className="text-[0.8rem] font-medium text-ink">Okafor Studio</p>
          <p className="text-[0.75rem] text-muted-foreground">· Sale record</p>
        </div>

        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-2.5 px-5 pt-5 text-[0.88rem] sm:px-6">
          <dt className="text-muted-foreground">Client</dt>
          <dd className="text-ink">Lagos Lo-Fi Records</dd>
          <dt className="text-muted-foreground">Work</dt>
          <dd className="text-ink">Album cover: “Harmattan Tapes”</dd>
          <dt className="text-muted-foreground">Terms</dt>
          <dd className="text-ink">3000×3000 px, layered source, 2 revision rounds</dd>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="font-semibold text-ink tabular-nums">$250.00</dd>
        </dl>

        <div className="mx-5 mt-5 flex items-start gap-3 rounded-md border border-caution/25 bg-caution-tint px-3.5 py-3 sm:mx-6">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden />
          <div className="min-w-0">
            <p className="text-[0.92rem] font-semibold text-ink">On hold. Releases in 6 days.</p>
            <p className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground">
              Marked completed in PayPal yesterday. For services, PayPal releases the payment 7 days after that.
            </p>
          </div>
        </div>

        <div className="px-5 pt-5 pb-5 sm:px-6">
          <p className="text-[0.8rem] font-medium text-ink">Proof kept on this sale</p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {PROOF.map(({ icon: Icon, label, meta }) => (
              <li key={label} className="flex items-center gap-2.5 py-2">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink">{label}</span>
                <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums">{meta}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="absolute -top-5 right-3 grid size-[4.5rem] rotate-[-12deg] place-items-center rounded-full border-2 border-cleared/60 bg-surface text-cleared sm:-right-5"
          aria-hidden
        >
          <StampMark className="size-11" />
        </div>
      </div>
      <figcaption id="sale-record-caption" className="mt-3 px-1 text-[0.8rem] leading-snug text-muted-foreground">
        From the demo workspace: Ada Okafor, a freelance illustrator, and the album cover she delivered two days ago.
      </figcaption>
    </figure>
  );
}
