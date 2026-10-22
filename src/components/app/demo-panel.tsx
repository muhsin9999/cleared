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

// Sandbox tools: in real life Ada's client and PayPal do these. In the demo the visitor can, on the PayPal sandbox.
const GROUPS = [
  { title: "As Ada’s client", actions: [{ key: "dispute", icon: ShieldAlertIcon, title: "Open a dispute" }] },
  { title: "As PayPal", actions: [{ key: "resolve", icon: GavelIcon, title: "Decide the open dispute" }] },
  { title: "This workspace", actions: [{ key: "reset", icon: RotateCcwIcon, title: "Reset Ada’s workspace" }] },
] as const;
type Key = (typeof GROUPS)[number]["actions"][number]["key"];

export function DemoPanel({ buyerEmail, payable, stock }: { buyerEmail: string | null; payable: { url: string; label: string } | null; stock: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [useReal, setUseReal] = useState(true);

  const run = (key: Key) =>
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
      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <FlaskConicalIcon aria-hidden /> Sandbox
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sandbox</SheetTitle>
          <SheetDescription>Do what Ada’s client or PayPal would. No real money moves.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {GROUPS.map((g) => (
            <section key={g.title} className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</h3>
              {g.title === "As Ada’s client" ? (
                <div className="rounded-lg border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <CreditCardIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium">Pay an invoice</p>
                      <p className="text-sm text-muted-foreground">{payable ? payable.label : "Send an invoice first."} Log in as the sandbox buyer:</p>
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
                      Open the invoice in PayPal <ExternalLinkIcon aria-hidden className="size-4" />
                    </a>
                  ) : null}
                </div>
              ) : null}
              {g.actions.map(({ key, icon: Icon, title }) => (
                <div key={key} className="space-y-2">
                  {key === "dispute" ? (
                    <label className="flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 text-sm">
                      <span>
                        {stock > 0 ? <>Use a real sandbox dispute <span className="text-muted-foreground">· {stock} left</span></> : <span className="text-muted-foreground">None left: uses a test dispute</span>}
                      </span>
                      <Switch checked={useReal && stock > 0} disabled={stock === 0} onCheckedChange={setUseReal} aria-label="Use a real sandbox dispute" />
                    </label>
                  ) : null}
                  <Button className="w-full justify-start" variant="outline" disabled={pending} onClick={() => run(key)}>
                    <Icon aria-hidden /> {title}
                  </Button>
                </div>
              ))}
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
