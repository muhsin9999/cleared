"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { CheckIcon, FileIcon, LoaderCircleIcon, MessageSquareTextIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { StampMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { approveAndSubmit } from "@/server/actions/cases";

type Packet = {
  recommendation: string;
  rationale: string;
  claims: { text: string; exhibitIds: string[] }[];
  missing: string[];
  exhibits: { id: string; number: string; label: string; kind: string; date: string }[];
  coverLetter: string;
};

const STEPS = ["Gathering proof from the locker", "Drafting the packet", "Checking every claim against an exhibit"];
const KIND_ICON = { file: FileIcon, message: MessageSquareTextIcon, acceptance: UserCheckIcon, tracking: FileIcon } as const;

export function CaseRoom({ disputeId, packet, canSubmit, submitted, resolved }: { disputeId: string; packet: Packet; canSubmit: boolean; submitted: boolean; resolved: boolean }) {
  const [step, setStep] = useState(submitted ? STEPS.length : 0);
  const [pending, start] = useTransition();
  const ready = step >= STEPS.length;

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setStep((n) => n + 1), 1100);
    return () => clearTimeout(t);
  }, [step, ready]);

  const byId = Object.fromEntries(packet.exhibits.map((e) => [e.id, e]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Investigation</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid gap-2 sm:grid-cols-3" aria-live="polite">
            {STEPS.map((label, i) => (
              <li key={label} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", i < step ? "border-cleared/30 bg-cleared-tint/50" : i === step ? "border-cleared/40" : "text-muted-foreground")}>
                {i < step ? <CheckIcon aria-hidden className="size-4 text-cleared" /> : i === step ? <LoaderCircleIcon aria-hidden className="size-4 animate-spin text-cleared" /> : <span className="size-4" />}
                {label}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Evidence packet</CardTitle>
            <p className="text-sm text-muted-foreground">Drafted by Cleared from your proof locker · check before sending</p>
          </div>
          {ready ? <Badge>{packet.recommendation === "fight" ? "Recommended: respond with evidence" : packet.recommendation === "offer" ? "Recommended: offer a partial refund" : "Recommended: accept"}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <section aria-label="Exhibits">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{packet.exhibits.length ? "Exhibits" : "No proof in the locker for this sale yet"}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              <AnimatePresence>
                {step >= 1 &&
                  packet.exhibits.map((e, i) => {
                    const Icon = KIND_ICON[e.kind as keyof typeof KIND_ICON] ?? FileIcon;
                    return (
                      <m.li key={e.id} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.12 }} className="flex items-center gap-3 rounded-lg border bg-paper/70 px-3 py-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink font-mono text-xs text-paper">{e.number}</span>
                        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{e.label}</span>
                      </m.li>
                    );
                  })}
              </AnimatePresence>
            </ul>
          </section>

          {ready ? (
            <m.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-label="Claims" className="space-y-3">
              <p className="text-sm text-pretty">{packet.rationale}</p>
              <ol className="space-y-2">
                {packet.claims.map((c, i) => (
                  <m.li key={c.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }} className="rounded-lg border px-4 py-3">
                    <p className="text-[0.95rem] text-pretty">{c.text}</p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {c.exhibitIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded bg-cleared-tint px-1.5 py-0.5 font-mono text-[0.7rem] text-cleared-strong">
                          <ShieldCheckIcon aria-hidden className="size-3" /> Exhibit {byId[id]?.number}
                        </span>
                      ))}
                    </p>
                  </m.li>
                ))}
              </ol>
              {packet.missing.length ? (
                <div className="rounded-lg border border-caution/30 bg-caution-tint px-4 py-3 text-sm">
                  <p className="font-medium">Missing evidence</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">{packet.missing.map((m_) => <li key={m_}>{m_}</li>)}</ul>
                </div>
              ) : null}
            </m.section>
          ) : null}

          {ready && packet.recommendation === "fight" ? (
            <m.div aria-hidden initial={{ opacity: 0, scale: 1.6, rotate: -24 }} animate={{ opacity: 0.85, scale: 1, rotate: -12 }} transition={{ delay: 0.5 + packet.claims.length * 0.15, duration: 0.25, ease: "easeOut" }} className="pointer-events-none absolute top-5 right-5 text-cleared">
              <StampMark className="size-16" />
            </m.div>
          ) : null}
        </CardContent>
      </Card>

      {ready ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {resolved
              ? "This case is closed."
              : submitted
                ? "Submitted to PayPal ✓ Waiting for PayPal’s decision."
                : !packet.claims.length
                  ? "There’s nothing to submit yet. Add proof to the sale, or refund the client in PayPal."
                  : canSubmit
                    ? "Nothing is sent to PayPal until you approve."
                    : "PayPal isn’t accepting evidence on this case right now."}
          </p>
          {!submitted && !resolved ? (
            <Dialog>
              <DialogTrigger render={<Button size="lg" disabled={!canSubmit || !packet.claims.length} />}>Approve &amp; submit to PayPal</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit this evidence to PayPal?</DialogTitle>
                  <DialogDescription>PayPal will receive {packet.claims.length} statements and {packet.exhibits.length} exhibits as “proof of fulfilment”. You can’t edit them after submitting.</DialogDescription>
                </DialogHeader>
                <ul className="space-y-1 text-sm">{packet.exhibits.map((e) => <li key={e.id} className="flex gap-2"><span className="font-mono text-muted-foreground">{e.number}</span>{e.label}</li>)}</ul>
                <DialogFooter>
                  <DialogClose render={<Button variant="ghost" />}>Keep editing</DialogClose>
                  <Button
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await approveAndSubmit(disputeId);
                        if (r.ok) toast.success("Evidence submitted to PayPal");
                        else toast.error(r.message);
                      })
                    }
                  >
                    {pending ? "Submitting…" : "Approve & submit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
