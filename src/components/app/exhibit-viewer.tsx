"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DownloadIcon, ExternalLinkIcon, FileXIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// One viewer for every piece of proof in the app: files open in full, messages and records as text, and any
// file can be downloaded. Anything that shows an exhibit calls useViewer().open(item).

export type ViewerItem = {
  id: string;
  letter?: string;
  label: string;
  kind: string;
  date: string;
  mime: string | null;
  size: number | null;
  file: boolean;
  text?: string | null;
  meta?: Record<string, unknown> | null;
};

const Ctx = createContext<{ open: (item: ViewerItem) => void } | null>(null);

export function useViewer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewer needs <ViewerProvider>");
  return ctx;
}

const KIND: Record<string, string> = { file: "File", message: "Message", acceptance: "Client confirmation", tracking: "Tracking", invoice: "PayPal invoice" };
const when = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const size = (b: number | null) => (b === null ? null : b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
const RECORD_LABEL: Record<string, string> = { name: "Confirmed by", userAgent: "Device", ip: "IP address", carrier: "Carrier", trackingNumber: "Tracking number", status: "Status" };
const order = (k: string) => { const i = Object.keys(RECORD_LABEL).indexOf(k); return i < 0 ? 99 : i; };

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<ViewerItem | null>(null);
  const [open, setOpen] = useState(false);
  const show = useCallback((i: ViewerItem) => {
    setItem(i);
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ open: show }), [show]);
  const src = item ? `/api/proofs/${item.id}` : "";
  const image = item?.file && item.mime?.startsWith("image/");
  const pdf = item?.file && item.mime === "application/pdf";

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92svh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          {item ? (
            <>
              <header className="flex items-start gap-3 border-b py-3 pr-12 pl-4 sm:pl-5">
                {item.letter ? <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded bg-ink font-mono text-xs text-paper">{item.letter}</span> : null}
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base font-semibold">{item.label}</DialogTitle>
                  <DialogDescription className="text-xs">{[KIND[item.kind] ?? item.kind, when(item.date), size(item.size)].filter(Boolean).join(" · ")}</DialogDescription>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-auto bg-paper">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect
                  <img src={src} alt={item.label} className="mx-auto block max-h-[72svh] w-auto max-w-full object-contain p-4" />
                ) : pdf ? (
                  <iframe src={src} title={item.label} className="block h-[72svh] w-full bg-white" />
                ) : item.kind === "file" && !item.file ? (
                  <p className="flex flex-col items-center gap-2 px-6 py-16 text-center text-sm text-muted-foreground"><FileXIcon aria-hidden className="size-6" /> This file isn’t available in this workspace.</p>
                ) : (
                  <div className="space-y-4 p-4 sm:p-6">
                    {item.text ? <p className="max-w-prose rounded-lg border bg-surface px-4 py-3 text-[0.95rem] whitespace-pre-wrap text-pretty">{item.text}</p> : null}
                    {item.meta && Object.keys(item.meta).length ? (
                      <dl className="grid max-w-prose grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border bg-surface px-4 py-3 text-sm">
                        {Object.entries(item.meta).sort(([a], [b]) => order(a) - order(b)).map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-muted-foreground">{RECORD_LABEL[k] ?? k}</dt>
                            <dd className="min-w-0 break-words">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {!item.text && !item.meta ? <p className="text-sm text-muted-foreground">Nothing more is recorded for this item.</p> : null}
                  </div>
                )}
              </div>
              {item.file ? (
                <footer className="flex flex-wrap justify-end gap-2 border-t px-4 py-3 sm:px-5">
                  <a href={src} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost" })}>
                    <ExternalLinkIcon aria-hidden /> Open in new tab
                  </a>
                  <a href={`${src}?download=1`} download className={cn(buttonVariants(), "min-w-32")}>
                    <DownloadIcon aria-hidden /> Download
                  </a>
                </footer>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
