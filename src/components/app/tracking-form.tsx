"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTrackingProof, type TrackingState } from "@/server/actions/proofs";

const CARRIERS = [
  ["UPS", "UPS"],
  ["USPS", "USPS"],
  ["FEDEX", "FedEx"],
  ["DHL", "DHL"],
  ["OTHER", "Other carrier"],
] as const;

export function TrackingForm({ saleId }: { saleId: string }) {
  const [state, action, pending] = useActionState(addTrackingProof.bind(null, saleId), {} as TrackingState);
  const [carrier, setCarrier] = useState("UPS");
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <label className="sr-only" htmlFor="carrier">Carrier</label>
        <select id="carrier" name="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-9 rounded-md border border-input bg-surface px-2 text-sm">
          {CARRIERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="sr-only" htmlFor="trackingNumber">Tracking number</label>
        <Input id="trackingNumber" name="trackingNumber" placeholder="Tracking number" autoComplete="off" required />
      </div>
      {carrier === "OTHER" ? <Input name="carrierNameOther" placeholder="Carrier name" aria-label="Carrier name" required /> : null}
      <div className="flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className={state.error ? "text-sm text-risk" : "text-sm text-cleared"}>{state.error ?? (state.ok ? "Sent to PayPal. The hold lifts about 24 hours after delivery." : "")}</p>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Sending to PayPal…" : "Send tracking to PayPal"}</Button>
      </div>
    </form>
  );
}
