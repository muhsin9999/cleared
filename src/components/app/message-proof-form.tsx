"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addMessageProof, type MessageProofState } from "@/server/actions/proofs";

export function MessageProofForm({ saleId }: { saleId: string }) {
  const [state, action, pending] = useActionState(addMessageProof.bind(null, saleId), {} as MessageProofState);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="scope-text" className="text-sm font-medium">Paste what you and the client agreed</label>
      <Textarea id="scope-text" name="text" rows={3} placeholder="e.g. the email or chat where they confirmed the brief, price and delivery date" key={state.ok ? "saved" : "draft"} />
      <div className="flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className={state.error ? "text-sm text-risk" : "text-sm text-cleared"}>{state.error ?? (state.ok ? "Saved to the locker." : "")}</p>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>{pending ? "Saving…" : "Save as proof"}</Button>
      </div>
    </form>
  );
}
