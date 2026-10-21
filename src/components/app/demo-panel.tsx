"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCardIcon, ExternalLinkIcon, GavelIcon, RotateCcwIcon, ShieldAlertIcon, UsersRoundIcon } from "lucide-react";
import { CopyButton } from "./copy-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { resetDemo, resolveLatestDispute, simulateDispute } from "@/server/actions/demo";

// In real life Ada's client and PayPal do these. In the demo the visitor plays both, on the PayPal sandbox.
const GROUPS = [
  {
    title: "As Ada’s client",
    actions: [{ key: "dispute", icon: ShieldAlertIcon, title: "Open a dispute", body: "Say the work on a paid sale never arrived. Uses a real dispute opened by the sandbox buyer when one is available." }],
  },
  {
    title: "As PayPal",
    actions: [{ key: "resolve", icon: GavelIcon, title: "Decide the dispute for Ada", body: "Closes the open dispute in the seller’s favour (the sandbox’s adjudicate call), after evidence is sent." }],
  },
  {
    title: "This workspace",
    actions: [{ key: "reset", icon: RotateCcwIcon, title: "Start over", body: "Puts Ada’s workspace back the way you found it." }],
  },
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
        <UsersRoundIcon aria-hidden /> <span className="hidden sm:inline">Play the client</span><span className="sm:hidden">Client</span>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Play the client, or PayPal</SheetTitle>
          <SheetDescription>Normally Ada’s client and PayPal do these. Here you can do them yourself. It all runs on the PayPal sandbox, so no real money moves.</SheetDescription>
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
                      <p className="text-sm text-muted-foreground">
                        {payable ? `Opens ${payable.label} on PayPal’s own page.` : "Send an invoice from a new sale first; it will appear here."} Log in with the sandbox buyer account below, never a real PayPal account.
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
                      Open the invoice in PayPal <ExternalLinkIcon aria-hidden className="size-4" />
                    </a>
                  ) : null}
                </div>
              ) : null}
              {g.actions.map(({ key, icon: Icon, title, body }) => (
                <div key={key} className="rounded-lg border bg-surface p-4">
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
                        {stock > 0 ? <>Use a real sandbox dispute <span className="text-muted-foreground">· {stock} left</span></> : <span className="text-muted-foreground">No real sandbox disputes left: a labelled test dispute is used</span>}
                      </span>
                      <Switch checked={useReal && stock > 0} disabled={stock === 0} onCheckedChange={setUseReal} aria-label="Use a real sandbox dispute" />
                    </label>
                  ) : null}
                  <Button className="mt-3 w-full" variant={key === "reset" ? "outline" : "default"} disabled={pending} onClick={() => run(key)}>
                    {title}
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
