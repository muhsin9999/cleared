"use client";

import { useState, useTransition } from "react";
import { CheckIcon, FlaskConicalIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { sendInvoice } from "@/server/actions/sales";

export function SendInvoice({ saleId, clientName, clientEmail, item, amount, sandbox }: { saleId: string; clientName: string; clientEmail: string; item: string; amount: string; sandbox: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog>
      <div className="space-y-3 rounded-[10px] border bg-surface p-4">
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{amount}</span>
          <span className="text-muted-foreground"> to </span>
          <span className="break-all">{clientEmail}</span>
        </p>
        <DialogTrigger render={<Button className="w-full" />}>
          <SendIcon aria-hidden /> Send through PayPal
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send this invoice?</DialogTitle>
          <DialogDescription className="sr-only">PayPal emails the invoice to {clientEmail}. You can cancel it in PayPal until it’s paid.</DialogDescription>
        </DialogHeader>
        {/* The three facts that matter, in the order the eye wants them: how much, to whom, for what. */}
        <div className="rounded-lg border bg-paper px-4 py-3.5">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{amount}</p>
          <p className="mt-1 text-sm">
            to <span className="font-medium">{clientName}</span> <span className="break-all text-muted-foreground">· {clientEmail}</span>
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{item}</p>
        </div>
        <ul className="space-y-2 text-sm">
          {["PayPal emails it, and they pay on PayPal’s page.", "You can cancel it in PayPal until it’s paid."].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-cleared" /> {t}
            </li>
          ))}
        </ul>
        {sandbox ? (
          <p className="flex items-center gap-2 rounded-md bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            <FlaskConicalIcon aria-hidden className="size-3.5 shrink-0" /> Sandbox demo: PayPal delivers it to the test buyer, so it can be paid.
          </p>
        ) : null}
        {error ? <p role="alert" className="rounded-md bg-risk-tint px-3 py-2 text-sm text-risk">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Not yet</DialogClose>
          <Button disabled={pending} onClick={() => start(async () => { const r = await sendInvoice(saleId); if (r && !r.ok) setError(r.message); })}>{pending ? "Sending through PayPal…" : error ? "Try again" : "Send invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
