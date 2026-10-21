"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { BotIcon, CheckIcon, CircleSlashIcon, FileIcon, LoaderCircleIcon, MessageSquareTextIcon, PackageIcon, ReceiptTextIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { StampMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { approveAndSubmit, startDraft } from "@/server/actions/cases";

type Exhibit = { id: string; letter: string; label: string; kind: string };
type Packet = {
  id?: string;
  status: string;
  source: string;
  model: string | null;
  recommendation: string | null;
  rationale: string | null;
  claims: { text: string; exhibitIds: string[] }[];
  removed: { text: string; reasons: string[] }[];
  missing: string[];
  trace: { tool: string; label: string; at: string }[];
  error: string | null;
};

const KIND_ICON = { file: FileIcon, message: MessageSquareTextIcon, acceptance: UserCheckIcon, tracking: PackageIcon, invoice: ReceiptTextIcon } as const;
const WORKING = new Set(["gathering", "drafting", "checking", "submitting"]);
const RECOMMENDATION = { fight: "Recommended: respond with evidence", offer: "Recommended: offer a partial refund", accept: "Recommended: accept and refund" } as Record<string, string>;

export function CaseRoom({ disputeId, packet: initial, exhibits, canSubmit, resolved, real }: { disputeId: string; packet: Packet | null; exhibits: Exhibit[]; canSubmit: boolean; resolved: boolean; real: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const asked = useRef(false);
  // Starts from the server's copy; while the agent works it is kept current by polling the packet endpoint.
  const [packet, setPacket] = useState(initial);
  const working = !packet || WORKING.has(packet.status);
  const drafted = packet && !["gathering", "drafting", "checking"].includes(packet.status);
  const submitted = packet?.status === "submitted";

  // No packet yet: start the investigator once. While it works, refresh to show each step as it lands.
  useEffect(() => {
    if (!packet && !asked.current) {
      asked.current = true;
      startDraft(disputeId);
    }
  }, [packet, disputeId]);
  useEffect(() => {
    if (!working) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/cases/${disputeId}/packet`, { cache: "no-store" });
        if (res.ok && !stop) {
          const { packet: next } = (await res.json()) as { packet: Packet | null };
          setPacket(next);
          if (next && !WORKING.has(next.status)) router.refresh(); // update the timeline and status once it's done
        }
      } catch {
        // offline for a moment: try again on the next tick
      }
    };
    const t = setInterval(tick, 1500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [working, disputeId, router]);

  const letter = Object.fromEntries(exhibits.map((e) => [e.id, e.letter]));
  const steps = packet?.trace ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base"><BotIcon aria-hidden className="size-4" /> Investigation</CardTitle>
          {packet?.model && packet.source === "ai" ? <Badge variant="outline" className="font-mono text-[0.7rem]">{packet.model}</Badge> : null}
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5" aria-live="polite">
            <AnimatePresence initial={false}>
              {steps.map((st, i) => (
                <m.li key={`${st.at}-${i}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-center gap-2.5 text-sm", st.tool === "fallback" && "text-caution")}>
                  {st.tool === "check_claims" ? <ShieldCheckIcon aria-hidden className="size-4 shrink-0 text-cleared" /> : <CheckIcon aria-hidden className="size-4 shrink-0 text-cleared" />}
                  {st.label}
                </m.li>
              ))}
            </AnimatePresence>
            {working && packet?.status !== "submitting" ? (
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <LoaderCircleIcon aria-hidden className="size-4 shrink-0 animate-spin text-cleared" />
                {!steps.length ? "Starting the investigation on a Render Workflow…" : packet?.status === "checking" ? "Checking every claim against its exhibit…" : "Looking through the evidence…"}
              </li>
            ) : null}
          </ol>
          <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>The AI can only read: the dispute, the sale, the invoice, the proof locker and PayPal’s rules. It can’t send anything.</span>
            {packet?.id && drafted ? <Link href={`/settings/audit?subject=${packet.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">Why did Cleared say this?</Link> : null}
          </p>
        </CardContent>
      </Card>

      {drafted ? (
        <Card className="relative overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Evidence packet</CardTitle>
              <p className="text-sm text-muted-foreground">
                {packet!.source === "ai" ? "Drafted by Cleared AI from your proof locker · check before sending" : "Built from your proof locker (the AI was unavailable) · check before sending"}
              </p>
            </div>
            {packet!.recommendation ? <Badge className={cn(packet!.recommendation !== "fight" && "bg-caution text-white")}>{RECOMMENDATION[packet!.recommendation]}</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-6">
            {packet!.rationale ? <p className="text-[0.95rem] text-pretty">{packet!.rationale}</p> : null}
            <section aria-label="Exhibits">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">{exhibits.length ? "Exhibits" : "No proof in the locker for this sale yet"}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {exhibits.map((e, i) => {
                  const Icon = KIND_ICON[e.kind as keyof typeof KIND_ICON] ?? FileIcon;
                  return (
                    <m.li key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3 rounded-lg border bg-paper/70 px-3 py-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink font-mono text-xs text-paper">{e.letter}</span>
                      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">{e.label}</span>
                    </m.li>
                  );
                })}
              </ul>
            </section>
            <section aria-label="Claims" className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">What PayPal will read</h3>
              <ol className="space-y-2">
                {packet!.claims.map((c, i) => (
                  <m.li key={c.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="rounded-lg border px-4 py-3">
                    <p className="text-[0.95rem] text-pretty">{c.text}</p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {c.exhibitIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded bg-cleared-tint px-1.5 py-0.5 font-mono text-[0.7rem] text-cleared-strong">
                          <ShieldCheckIcon aria-hidden className="size-3" /> Exhibit {letter[id] ?? "?"}
                        </span>
                      ))}
                    </p>
                  </m.li>
                ))}
              </ol>
            </section>
            {packet!.removed.length ? (
              <section aria-label="Removed by the checker" className="rounded-lg border border-dashed px-4 py-3">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-medium"><CircleSlashIcon aria-hidden className="size-4 text-risk" /> Removed by the claim checker</h3>
                <ul className="space-y-1.5 text-sm">
                  {packet!.removed.map((r) => (
                    <li key={r.text}><span className="text-muted-foreground line-through">{r.text}</span> <span className="text-risk">· {r.reasons.join("; ")}</span></li>
                  ))}
                </ul>
              </section>
            ) : null}
            {packet!.missing.length ? (
              <div className="rounded-lg border border-caution/30 bg-caution-tint px-4 py-3 text-sm">
                <p className="font-medium">Would make this stronger</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">{packet!.missing.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
            {packet!.recommendation === "fight" && packet!.claims.length ? (
              <m.div aria-hidden initial={{ opacity: 0, scale: 1.5, rotate: -24 }} animate={{ opacity: 0.85, scale: 1, rotate: -12 }} transition={{ delay: 0.4 + packet!.claims.length * 0.12, duration: 0.25, ease: "easeOut" }} className="pointer-events-none absolute top-5 right-5 text-cleared">
                <StampMark className="size-16" />
              </m.div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {drafted ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-muted-foreground" role="status">
            {resolved
              ? "This case is closed."
              : packet!.status === "submitting"
                ? "Sending your evidence to PayPal through the evidence workflow…"
                : submitted
                  ? real
                    ? "Sent to PayPal ✓ PayPal now reviews it; the decision arrives on this page."
                    : "Submitted ✓ (simulated case). Waiting for the decision."
                  : packet!.status === "failed" && packet!.error
                    ? `Last attempt failed: ${packet!.error}`
                    : !packet!.claims.length
                      ? "There’s nothing to submit yet. Add proof to the sale, or refund the client in PayPal."
                      : canSubmit
                        ? "Nothing is sent to PayPal until you approve."
                        : "PayPal isn’t accepting evidence on this case right now."}
          </p>
          {!submitted && !resolved && packet!.status !== "submitting" ? (
            <Dialog>
              <DialogTrigger render={<Button size="lg" disabled={!canSubmit || !packet!.claims.length} />}>Approve &amp; submit to PayPal</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{packet!.status === "failed" ? "Try sending this evidence again?" : "Submit this evidence to PayPal?"}</DialogTitle>
                  <DialogDescription>PayPal will receive these {packet!.claims.length} statements as “proof of fulfilment”, with an evidence summary PDF and your uploaded files. You can’t edit them after submitting.</DialogDescription>
                </DialogHeader>
                <ol className="list-inside list-decimal space-y-1 text-sm">{packet!.claims.map((c) => <li key={c.text}>{c.text}</li>)}</ol>
                <DialogFooter>
                  <DialogClose render={<Button variant="ghost" />}>Keep reviewing</DialogClose>
                  <Button
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await approveAndSubmit(disputeId);
                        if (r.ok) toast.success(r.mode === "workflow" ? "Sending to PayPal…" : "Evidence submitted");
                        else toast.error(r.message);
                        const res = await fetch(`/api/cases/${disputeId}/packet`, { cache: "no-store" });
                        if (res.ok) setPacket(((await res.json()) as { packet: Packet | null }).packet);
                        router.refresh();
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
