"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  FolderOpenIcon,
  GavelIcon,
  ImageIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  PackageIcon,
  ReceiptTextIcon,
  ScaleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useViewer, type ViewerItem } from "@/components/app/exhibit-viewer";
import { StampMark } from "@/components/brand/logo";
import { AgentAvatar, type AgentMood } from "@/components/brand/agent-avatar";
import { markerStrike } from "@/components/brand/marks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { approveAndSubmit, startDraft } from "@/server/actions/cases";
import { resolveLatestDispute } from "@/server/actions/demo";
import type { PacketView } from "@/server/packet-view";

type Exhibit = ViewerItem & { letter: string };
type Step = PacketView["trace"][number];

// The marker colour is baked into an SVG, so it can’t follow the theme tokens; this red reads on both.
const STRIKE = "#C0341D";
const WORKING = new Set(["gathering", "drafting", "checking", "submitting"]);
const RECOMMENDATION: Record<string, string> = { fight: "Respond with evidence", offer: "Offer a partial refund", accept: "Accept and refund" };
const TOOL_ICON: Record<string, LucideIcon> = { get_dispute: ShieldAlertIcon, get_sale: ReceiptTextIcon, get_invoice: FileTextIcon, list_locker_items: FolderOpenIcon, get_tracking: PackageIcon, search_policy: ScaleIcon, check_claims: ShieldCheckIcon, guardrail: ShieldAlertIcon, fallback: TriangleAlertIcon };
const KIND_ICON: Record<string, LucideIcon> = { file: FileTextIcon, message: MessageSquareTextIcon, acceptance: UserCheckIcon, tracking: PackageIcon, invoice: ReceiptTextIcon };
// How the agent's first batch of tool calls reads as its plan.
const PLAN_WORD: Record<string, string> = { get_dispute: "the dispute", get_sale: "the sale", get_invoice: "the invoice", list_locker_items: "the proof locker", get_tracking: "tracking", search_policy: "PayPal’s rules" };

const seconds = (from: string, to: string) => Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const isImage = (e: Exhibit) => e.file && !!e.mime?.startsWith("image/");
const exhibitIcon = (e: Exhibit) => (isImage(e) ? ImageIcon : KIND_ICON[e.kind] ?? FileTextIcon);

export function CaseRoom({ disputeId, packet: initial, exhibits, canSubmit, resolved, real, demo = false }: { disputeId: string; packet: PacketView | null; exhibits: Exhibit[]; canSubmit: boolean; resolved: boolean; real: boolean; demo?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const asked = useRef(false);
  // Starts from the server's copy; while the agent works it is kept current by polling the packet endpoint.
  const [packet, setPacket] = useState(initial);
  // The exhibit the seller is pointing at in the reply; the log lights up the step where the agent opened it.
  const [focus, setFocus] = useState<string | null>(null);
  const working = !packet || WORKING.has(packet.status);
  const drafted = !!packet && !["gathering", "drafting", "checking"].includes(packet.status);
  const submitted = packet?.status === "submitted";

  // No packet yet: start the investigator once. While it works, poll to show each step as it lands.
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
          const { packet: next } = (await res.json()) as { packet: PacketView | null };
          setPacket(next);
          if (next && !WORKING.has(next.status)) router.refresh(); // update the status badge once it's done
        }
      } catch {
        // offline for a moment: try again on the next tick
      }
    };
    const t = setInterval(tick, 1200);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [working, disputeId, router]);

  const byId = Object.fromEntries(exhibits.map((e) => [e.id, e]));
  const ai = packet?.source === "ai";
  const mood: AgentMood = resolved || submitted ? "done" : working ? (packet?.status === "checking" || !packet?.trace.length ? "thinking" : "working") : !ai || !packet?.claims.length ? "concerned" : "done";
  const title = resolved ? "Case closed" : submitted ? "Sent to PayPal" : packet?.status === "submitting" ? "Sending to PayPal…" : working ? "Building your case" : ai ? "Your reply is ready" : "Reply built from your files";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
      <aside aria-label="What Cleared AI did" className="min-w-0 rounded-[10px] border bg-surface lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1">
        <header className="flex items-center gap-3 px-4 py-3.5">
          <AgentAvatar mood={mood} milestone={resolved ? "closed" : submitted ? "sent" : "drafted"} label="" className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              <span>Cleared AI</span>
              {packet?.model && ai ? <span className="font-mono">· {packet.model}</span> : null}
            </p>
          </div>
          {working ? <span className="inline-flex items-center gap-1.5 rounded-full bg-cleared-tint px-2.5 py-1 text-xs font-medium text-cleared-strong"><span className="size-1.5 animate-pulse rounded-full bg-cleared" /> Live</span> : null}
        </header>
        <AgentLog packet={packet} working={working} byId={byId} focus={focus} />
        <p className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><LockKeyholeIcon aria-hidden className="size-3.5" /> Read-only. It can’t send anything.</span>
          {packet?.id && drafted ? <Link href={`/settings/audit?subject=${packet.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">Audit log</Link> : null}
        </p>
      </aside>

      <section aria-label="Reply to PayPal" className="relative min-w-0 overflow-hidden rounded-[10px] border bg-surface lg:col-start-1 lg:row-start-1">
        <header className="flex min-h-14 flex-wrap items-center gap-2 border-b py-3.5 pr-20 pl-4 sm:pl-5">
          <h2 className="font-semibold">Reply to PayPal</h2>
          {drafted && packet!.recommendation ? <Badge className={cn("h-6", packet!.recommendation !== "fight" && "bg-caution text-white")}>{RECOMMENDATION[packet!.recommendation]}</Badge> : null}
        </header>
        {drafted ? <Reply packet={packet!} byId={byId} exhibits={exhibits} onFocus={setFocus} /> : <Writing />}
        {drafted ? (
          <footer className="space-y-3 border-t px-4 py-4 sm:px-5">
            {resolved ? (
              <p className="text-sm" role="status">Closed. {demo ? <Link href="/home" className="font-medium underline underline-offset-2">Back to home</Link> : null}</p>
            ) : packet!.status === "submitting" ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircleIcon aria-hidden className="size-4 animate-spin" /> Sending to PayPal…</p>
            ) : submitted ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-cleared-strong" role="status"><CheckIcon aria-hidden className="size-4" /> {real ? "Sent. PayPal is reviewing it." : "Sent (test dispute). Waiting for a decision."}</p>
                {demo ? (
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await resolveLatestDispute();
                        if (!r.ok) toast.error(r.message);
                        router.refresh();
                      })
                    }
                  >
                    <GavelIcon aria-hidden /> {pending ? "Asking PayPal…" : "Ask PayPal to decide"}
                  </Button>
                ) : null}
              </div>
            ) : packet!.status === "failed" && packet!.error ? (
              <p className="text-sm text-risk" role="status">Last attempt failed: {packet!.error}</p>
            ) : !packet!.claims.length ? (
              <p className="text-sm text-muted-foreground" role="status">Nothing to send yet. Add proof to the sale first.</p>
            ) : !canSubmit ? (
              <p className="text-sm text-muted-foreground" role="status">PayPal isn’t taking evidence on this case right now.</p>
            ) : null}
            {!submitted && !resolved && packet!.status !== "submitting" && packet!.claims.length && canSubmit ? (
              <Approve packet={packet!} pending={pending} onApprove={() =>
                start(async () => {
                  const r = await approveAndSubmit(disputeId);
                  if (r.ok) toast.success("Sending to PayPal…");
                  else toast.error(r.message);
                  const res = await fetch(`/api/cases/${disputeId}/packet`, { cache: "no-store" });
                  if (res.ok) setPacket(((await res.json()) as { packet: PacketView | null }).packet);
                  router.refresh();
                })
              } />
            ) : null}
          </footer>
        ) : null}
        {drafted && packet!.recommendation === "fight" && packet!.claims.length ? (
          <m.div aria-hidden initial={{ opacity: 0, scale: 1.5, rotate: -24 }} animate={{ opacity: 0.85, scale: 1, rotate: -12 }} transition={{ delay: 0.5, duration: 0.25, ease: "easeOut" }} className="pointer-events-none absolute top-1.5 right-4 text-cleared">
            <StampMark className="size-12" />
          </m.div>
        ) : null}
      </section>
    </div>
  );
}

/**
 * The agent's steps. While it works, each finished step is one line and the current one shimmers; once it's
 * done the run folds into a summary that opens again on click. Lines for opened files open the file.
 */
function AgentLog({ packet, working, byId, focus }: { packet: PacketView | null; working: boolean; byId: Record<string, Exhibit>; focus: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const steps = packet?.trace ?? [];
  // The agent writes its own plan; older runs (and the fallback) get one worded from its first tool calls.
  const wrotePlan = steps.some((s) => s.plan?.length);
  const firstMove = wrotePlan ? [] : steps.filter((s) => s.turn === 0).map((s) => PLAN_WORD[s.tool]).filter(Boolean);
  const active =
    !packet || packet.status === "gathering"
      ? { tool: "start", label: "Starting on a Render Workflow" }
      : packet.status === "drafting"
        ? { tool: "think", label: steps.length ? "Thinking about what it found" : "Reading the case" }
        : packet.status === "checking"
          ? { tool: "check_claims", label: "Checking every claim against its exhibit" }
          : null;
  const total = packet && steps.length ? Math.round(seconds(packet.startedAt, steps.at(-1)!.at)) : 0;
  const opened = steps.filter((s) => s.ref).length;
  // Pointing at an exhibit in the reply opens the log, so the matching step can light up.
  const open = working || expanded || (!!focus && steps.some((s) => s.ref === focus));

  return (
    <div className="border-t">
      {!working && steps.length ? (
        <button type="button" onClick={() => setExpanded((x) => !x)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40">
          <span className="grid size-5 place-items-center rounded-full bg-cleared text-white"><CheckIcon aria-hidden className="size-3" strokeWidth={3} /></span>
          <span className="min-w-0 flex-1">
            <span className="font-medium">{steps.length} steps in {total}s</span>
            <span className="text-muted-foreground"> · opened {opened} {opened === 1 ? "file" : "files"}</span>
          </span>
          <ChevronDownIcon aria-hidden className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      ) : null}
      <AnimatePresence initial={false}>
        {open ? (
          <m.ol key="steps" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden px-2 pt-1 pb-2" aria-live="polite">
            {firstMove.length ? <Line icon={ListChecksIcon} name="plan" detail={`Check ${list(firstMove)}`} /> : null}
            {steps.map((st, i) =>
              st.plan?.length ? (
                <PlanBlock key={`${st.at}-${i}`} steps={st.plan} elapsed={packet ? seconds(packet.startedAt, st.at) : 0} />
              ) : (
                <StepLine key={`${st.at}-${i}`} step={st} ex={st.ref ? byId[st.ref] : undefined} elapsed={packet ? seconds(packet.startedAt, st.at) : 0} lit={!!focus && st.ref === focus} />
              ),
            )}
            {working && active ? <ActiveLine label={active.label} name={active.tool === "think" || active.tool === "start" ? null : active.tool} /> : null}
          </m.ol>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PlanBlock({ steps, elapsed }: { steps: string[]; elapsed: number }) {
  return (
    <m.li layout="position" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="my-1 rounded-md border bg-paper px-2.5 py-2">
      <p className="flex items-center gap-2.5">
        <ListChecksIcon aria-hidden className="size-3.5 shrink-0 text-cleared" />
        <span className="flex-1 font-mono text-[0.75rem]">write_plan</span>
        <span className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">{elapsed.toFixed(1)}s</span>
      </p>
      <ol className="mt-1.5 space-y-0.5 pl-6 text-xs text-muted-foreground">
        {steps.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-3 shrink-0 font-mono text-[0.65rem] leading-[1.1rem] text-cleared">{i + 1}</span>
            <span className="min-w-0">{x}</span>
          </li>
        ))}
      </ol>
    </m.li>
  );
}

function StepLine({ step, ex, elapsed, lit }: { step: Step; ex?: Exhibit; elapsed: number; lit: boolean }) {
  const viewer = useViewer();
  const tone = step.tool === "guardrail" ? "risk" : step.tool === "fallback" ? "caution" : undefined;
  return (
    <Line
      icon={ex ? exhibitIcon(ex) : TOOL_ICON[step.tool] ?? CheckIcon}
      name={step.tool}
      arg={step.tool === "read_locker_item" && ex ? ex.letter : undefined}
      detail={step.detail ?? step.label}
      elapsed={elapsed}
      tone={tone}
      lit={lit}
      onOpen={ex ? () => viewer.open(ex) : undefined}
      thumb={ex && isImage(ex) ? `/api/proofs/${ex.id}` : undefined}
    />
  );
}

function Line({ icon: Icon, name, arg, detail, elapsed, tone, lit, onOpen, thumb }: { icon: LucideIcon; name: string; arg?: string; detail: string; elapsed?: number; tone?: "risk" | "caution"; lit?: boolean; onOpen?: () => void; thumb?: string }) {
  const body = (
    <>
      <Icon aria-hidden className={cn("size-3.5 shrink-0", tone === "risk" ? "text-risk" : tone === "caution" ? "text-caution" : "text-cleared")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[0.75rem]">
          {name}
          {arg ? <span className="text-muted-foreground">(“{arg}”)</span> : null}
        </span>
        <span className={cn("block truncate text-xs", tone === "risk" ? "text-risk" : "text-muted-foreground")}>{detail}</span>
      </span>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect
        <img src={thumb} alt="" className="size-8 shrink-0 rounded border object-cover" loading="lazy" />
      ) : null}
      {elapsed !== undefined ? <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground tabular-nums">{elapsed.toFixed(1)}s</span> : null}
    </>
  );
  const cls = cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors", lit && "bg-cleared-tint ring-1 ring-cleared/30");
  return (
    <m.li layout="position" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {onOpen ? <button type="button" onClick={onOpen} className={cn(cls, "hover:bg-muted/60")} title="Open this file">{body}</button> : <div className={cls}>{body}</div>}
    </m.li>
  );
}

function ActiveLine({ name, label }: { name: string | null; label: string }) {
  return (
    <m.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 flex items-center gap-2.5 rounded-md border border-cleared/20 bg-cleared-tint/40 px-2 py-2.5">
      <LoaderCircleIcon aria-hidden className="size-3.5 shrink-0 animate-spin text-cleared" />
      <span className="min-w-0">
        {name ? <span className="block font-mono text-[0.75rem]">{name}</span> : null}
        <span className="shimmer-text block text-sm">{label}</span>
      </span>
    </m.li>
  );
}

function Writing() {
  return (
    <div className="space-y-3 px-4 py-6 sm:px-5" aria-hidden>
      {[92, 80, 86, 60].map((w, i) => (
        <div key={i} className="h-3 animate-pulse rounded-full bg-muted" style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
      ))}
      <p className="pt-2 text-sm text-muted-foreground">Written once the evidence is in.</p>
    </div>
  );
}

function Reply({ packet, byId, exhibits, onFocus }: { packet: PacketView; byId: Record<string, Exhibit>; exhibits: Exhibit[]; onFocus: (id: string | null) => void }) {
  const viewer = useViewer();
  const point = (id: string) => ({ onMouseEnter: () => onFocus(id), onMouseLeave: () => onFocus(null), onFocus: () => onFocus(id), onBlur: () => onFocus(null) });
  return (
    <div className="space-y-5 px-4 py-5 sm:px-5">
      {packet.source !== "ai" ? <p className="rounded-md bg-caution-tint px-3 py-2 text-sm text-caution">The AI was unavailable, so this was built from your files.</p> : null}
      {packet.rationale ? <p className="max-w-prose text-[0.95rem] text-pretty">{packet.rationale}</p> : null}
      <ol className="divide-y rounded-lg border">
        {packet.claims.map((c, i) => (
          <m.li key={c.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex items-start justify-between gap-3 px-3.5 py-3">
            <p className="text-sm text-pretty">{c.text}</p>
            <span className="flex shrink-0 flex-wrap justify-end gap-1">
              {c.exhibitIds.map((id) =>
                byId[id] ? (
                  <button key={id} type="button" title={`Open ${byId[id].label}`} onClick={() => viewer.open(byId[id])} {...point(id)} className="inline-flex items-center gap-1 rounded bg-cleared-tint px-1.5 py-0.5 font-mono text-[0.7rem] text-cleared-strong transition-colors hover:bg-cleared hover:text-white">
                    <ShieldCheckIcon aria-hidden className="size-3" /> {byId[id].letter}
                  </button>
                ) : null,
              )}
            </span>
          </m.li>
        ))}
      </ol>
      {exhibits.length ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{exhibits.length} exhibits · click to open</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {exhibits.map((e) => {
              const Icon = exhibitIcon(e);
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => viewer.open(e)} {...point(e.id)} className="group block w-full overflow-hidden rounded-md border bg-surface text-left transition-shadow hover:shadow-soft focus-visible:outline-2 focus-visible:outline-focus">
                    {isImage(e) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect
                      <img src={`/api/proofs/${e.id}`} alt="" className="h-20 w-full object-cover transition-transform group-hover:scale-[1.03]" />
                    ) : (
                      <span className="grid h-20 place-items-center bg-paper"><Icon aria-hidden className="size-5 text-muted-foreground" /></span>
                    )}
                    <span className="flex items-center gap-1.5 px-2 py-1.5 text-xs">
                      <span className="grid size-4 shrink-0 place-items-center rounded bg-ink font-mono text-[0.6rem] text-paper">{e.letter}</span>
                      <span className="truncate">{e.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {packet.removed.length ? (
        <div className="rounded-lg border border-dashed border-risk/30 px-3.5 py-3">
          <p className="text-sm font-medium text-risk">Struck by the claim checker</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {packet.removed.map((r) => <li key={r.text}><span className="text-muted-foreground" style={markerStrike(STRIKE)}>{r.text}</span> <span className="text-risk">· {r.reasons.join("; ")}</span></li>)}
          </ul>
        </div>
      ) : null}
      {packet.ignored.length ? (
        <div className="rounded-lg border border-risk/25 bg-risk-tint/40 px-3.5 py-3">
          <p className="text-sm font-medium text-risk">Ignored an instruction hidden in the case</p>
          <ul className="mt-1 space-y-1">{packet.ignored.map((x) => <li key={x} className="font-mono text-[0.8rem] text-ink/70">“<span style={markerStrike(STRIKE)}>{x.replace(/^[“"]|[”"]$/g, "")}</span>”</li>)}</ul>
        </div>
      ) : null}
      {packet.missing.length ? (
        <div className="rounded-lg bg-caution-tint px-3.5 py-3 text-sm">
          <p className="font-medium">Would make it stronger</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">{packet.missing.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}

function Approve({ packet, pending, onApprove }: { packet: PacketView; pending: boolean; onApprove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="w-full sm:w-auto sm:min-w-64" disabled={pending} />}>{pending ? "Sending to PayPal…" : "Approve and send to PayPal"}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{packet.status === "failed" ? "Try sending again?" : "Send this to PayPal?"}</DialogTitle>
          <DialogDescription>{packet.claims.length} statements and your files go to PayPal as proof of delivery. You can’t edit them after.</DialogDescription>
        </DialogHeader>
        <ol className="list-inside list-decimal space-y-1 text-sm">{packet.claims.map((c) => <li key={c.text}>{c.text}</li>)}</ol>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Keep reviewing</DialogClose>
          <Button
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onApprove();
            }}
          >
            Approve and send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
