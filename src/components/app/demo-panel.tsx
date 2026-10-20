"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCardIcon, ExternalLinkIcon, FlaskConicalIcon, GavelIcon, RotateCcwIcon, ShieldAlertIcon } from "lucide-react";
import { CopyButton } from "./copy-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { resetDemo, resolveLatestDispute, simulateDispute } from "@/server/actions/demo";

const ACTIONS = [
  { key: "dispute", icon: ShieldAlertIcon, title: "Simulate a buyer dispute", body: "The client of a paid sale says the work never arrived. Uses a real dispute opened by the sandbox buyer when one is available." },
  { key: "resolve", icon: GavelIcon, title: "Resolve in Ada’s favour", body: "Plays PayPal’s part and closes the open dispute for the seller (sandbox adjudicate)." },
  { key: "reset", icon: RotateCcwIcon, title: "Reset demo", body: "Restores Ada’s workspace to its starting state. Runs nightly too." },
] as const;

export function DemoPanel({ buyerEmail, payable, stock }: { buyerEmail: string | null; payable: { url: string; label: string } | null; stock: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [useReal, setUseReal] = useState(true);

  const run = (key: (typeof ACTIONS)[number]["key"]) =>
    start(async () => {
      setOpen(false);
      if (key === "reset") return resetDemo();
      const result = key === "dispute" ? await simulateDispute(useReal && stock > 0) : await resolveLatestDispute();
      if (!result.ok) return void toast.error(result.message);
      // The success notice arrives through <LiveEvents>, the same path a real PayPal webhook takes.
      router.push(`/cases/${result.disputeId}`);
    });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2 border-dashed" />}>
        <FlaskConicalIcon aria-hidden className="text-caution" /> Sandbox controls
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sandbox controls</SheetTitle>
          <SheetDescription>Actions that would normally come from Ada’s client or from PayPal. Everything runs on the PayPal sandbox; no real money moves.</SheetDescription>
        </SheetHeader>
        <ul className="space-y-3 px-4 pb-6">
          <li className="rounded-lg border bg-surface p-4">
            <div className="flex items-start gap-3">
              <CreditCardIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">Pay as the client</p>
                <p className="text-sm text-muted-foreground">
                  {payable ? `Opens ${payable.label} on PayPal’s own page.` : "Send an invoice first; it will appear here."} Log in with the sandbox buyer account, never a real PayPal account.
                </p>
                {buyerEmail ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{buyerEmail}</code>
                    <CopyButton value={buyerEmail} label="Copy" toastMessage="Sandbox buyer email copied" />
                  </div>
                ) : null}
              </div>
            </div>
            {payable ? (
              <a href={payable.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border bg-paper text-sm font-medium hover:bg-muted">
                Open invoice in PayPal <ExternalLinkIcon aria-hidden className="size-4" />
              </a>
            ) : null}
          </li>
          {ACTIONS.map(({ key, icon: Icon, title, body }) => (
            <li key={key} className="rounded-lg border bg-surface p-4">
              <div className="flex items-start gap-3">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
              {key === "dispute" ? (
                <label className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 text-sm">
                  <span>
                    {stock > 0 ? <>Use a real sandbox dispute <span className="text-muted-foreground">· {stock} left</span></> : <span className="text-muted-foreground">No real sandbox disputes left: a labelled simulated one is used</span>}
                  </span>
                  <Switch checked={useReal && stock > 0} disabled={stock === 0} onCheckedChange={setUseReal} aria-label="Use a real sandbox dispute" />
                </label>
              ) : null}
              <Button className="mt-3 w-full" variant={key === "reset" ? "outline" : "default"} disabled={pending} onClick={() => run(key)}>
                {title}
              </Button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
