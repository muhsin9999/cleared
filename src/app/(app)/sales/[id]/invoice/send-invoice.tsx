"use client";

import { useState, useTransition } from "react";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { sendInvoice } from "@/server/actions/sales";

export function SendInvoice({ saleId, clientEmail, amount }: { saleId: string; clientEmail: string; amount: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog>
      <DialogTrigger render={<Button size="lg" className="h-auto w-full py-3 whitespace-normal" />}>
        <SendIcon aria-hidden /> Send {amount} invoice to {clientEmail} via PayPal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send this invoice through PayPal?</DialogTitle>
          <DialogDescription>
            PayPal emails {clientEmail} an invoice for {amount} with the items and terms shown. They pay on PayPal’s page. You can cancel the invoice in PayPal until it’s paid.
          </DialogDescription>
        </DialogHeader>
        {error ? <p role="alert" className="rounded-md bg-risk-tint px-3 py-2 text-sm text-risk">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Not yet</DialogClose>
          <Button disabled={pending} onClick={() => start(async () => { const r = await sendInvoice(saleId); if (r && !r.ok) setError(r.message); })}>{pending ? "Sending through PayPal…" : error ? "Try again" : "Send invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
