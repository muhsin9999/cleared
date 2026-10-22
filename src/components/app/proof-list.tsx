"use client";

import { FileTextIcon, MessageSquareTextIcon, PackageIcon, UserCheckIcon } from "lucide-react";
import { useViewer, type ViewerItem } from "./exhibit-viewer";

const ICON = { message: MessageSquareTextIcon, acceptance: UserCheckIcon, tracking: PackageIcon } as const;
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));

/** A sale's proof, each row opening in the viewer. */
export function ProofList({ items }: { items: (ViewerItem & { sub: string })[] }) {
  const viewer = useViewer();
  if (!items.length) return <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No proof yet.</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((p) => {
        const Icon = ICON[p.kind as keyof typeof ICON] ?? FileTextIcon;
        const image = p.file && p.mime?.startsWith("image/");
        return (
          <li key={p.id}>
            <button type="button" onClick={() => viewer.open(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect
                <img src={`/api/proofs/${p.id}`} alt="" className="size-10 shrink-0 rounded-md border object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-md border bg-paper"><Icon aria-hidden className="size-4 text-muted-foreground" /></span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.sub}</span>
              </span>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={p.date}>{day(p.date)}</time>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
