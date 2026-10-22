"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
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

type Exhibit = { id: string; letter: string; label: string; kind: string; date: string; mime: string | null; size: number | null; file: boolean };

// The marker colour is baked into an SVG, so it can’t follow the theme tokens; this red reads on both.
const STRIKE = "#C0341D";
const WORKING = new Set(["gathering", "drafting", "checking", "submitting"]);
const RECOMMENDATION: Record<string, string> = { fight: "Respond with evidence", offer: "Offer a partial refund", accept: "Accept and refund" };
const TOOL_ICON: Record<string, LucideIcon> = { get_dispute: ShieldAlertIcon, get_sale: ReceiptTextIcon, get_invoice: FileTextIcon, list_locker_items: FolderOpenIcon, get_tracking: PackageIcon, search_policy: ScaleIcon, check_claims: ShieldCheckIcon, guardrail: ShieldAlertIcon, fallback: TriangleAlertIcon };
const KIND_ICON: Record<string, LucideIcon> = { file: FileTextIcon, message: MessageSquareTextIcon, acceptance: UserCheckIcon, tracking: PackageIcon, invoice: ReceiptTextIcon };
// How the agent's first batch of tool calls reads as its plan.
const PLAN_WORD: Record<string, string> = { get_dispute: "the dispute", get_sale: "the sale", get_invoice: "the invoice", list_locker_items: "the proof locker", get_tracking: "tracking", search_policy: "PayPal’s rules" };

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
const size = (b: number | null) => (b === null ? null : b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
const seconds = (from: string, to: string) => Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function CaseRoom({ disputeId, packet: initial, exhibits, canSubmit, resolved, real, demo = false }: { disputeId: string; packet: PacketView | null; exhibits: Exhibit[]; canSubmit: boolean; resolved: boolean; real: boolean; demo?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const asked = useRef(false);
  // Starts from the server's copy; while the agent works it is kept current by polling the packet endpoint.
  const [packet, setPacket] = useState(initial);
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <section aria-label="What Cleared AI did" className="min-w-0 rounded-[10px] border bg-surface">
        <header className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-5">
          <AgentAvatar mood={mood} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span>Cleared AI</span>
              {packet?.model && ai ? <span className="font-mono">· {packet.model}</span> : null}
              {packet?.trace.length && !working ? <span>· {Math.round(seconds(packet.startedAt, packet.trace.at(-1)!.at))}s</span> : null}
            </p>
          </div>
          {working ? <span className="inline-flex items-center gap-1.5 rounded-full bg-cleared-tint px-2.5 py-1 text-xs font-medium text-cleared-strong"><span className="size-1.5 animate-pulse rounded-full bg-cleared" /> Live</span> : null}
        </header>
        <AgentSteps packet={packet} working={working} byId={byId} />
        <p className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
          <span className="inline-flex items-center gap-1.5"><LockKeyholeIcon aria-hidden className="size-3.5" /> Read-only tools. It can’t send anything.</span>
          {packet?.id && drafted ? <Link href={`/settings/audit?subject=${packet.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">Audit log</Link> : null}
        </p>
      </section>

      <section id="reply" aria-label="Reply to PayPal" className="relative min-w-0 scroll-mt-20 overflow-hidden rounded-[10px] border bg-surface lg:sticky lg:top-20">
        <header className="flex min-h-14 flex-wrap items-center gap-2 border-b py-3.5 pr-20 pl-4 sm:pl-5">
          <h2 className="font-semibold">Reply to PayPal</h2>
          {drafted && packet!.recommendation ? <Badge className={cn("h-6", packet!.recommendation !== "fight" && "bg-caution text-white")}>{RECOMMENDATION[packet!.recommendation]}</Badge> : null}
        </header>
        {drafted ? <Reply packet={packet!} byId={byId} exhibits={exhibits} /> : <Writing />}
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

      {drafted && !submitted && !resolved && packet!.claims.length ? <JumpToReply /> : null}
    </div>
  );
}

function AgentSteps({ packet, working, byId }: { packet: PacketView | null; working: boolean; byId: Record<string, Exhibit> }) {
  const steps = packet?.trace ?? [];
  const firstMove = steps.filter((s) => s.turn === 0).map((s) => PLAN_WORD[s.tool]).filter(Boolean);
  const active =
    !packet || packet.status === "gathering"
      ? { tool: "start", label: "Starting on a Render Workflow" }
      : packet.status === "drafting"
        ? { tool: "think", label: steps.length ? "Thinking about what it found" : "Reading the case" }
        : packet.status === "checking"
          ? { tool: "check_claims", label: "Checking every claim against its exhibit" }
          : packet.status === "submitting"
            ? { tool: "submit", label: "Sending your evidence to PayPal" }
            : null;

  return (
    <ol className="relative px-4 py-4 sm:px-5" aria-live="polite">
      <span aria-hidden className="absolute top-7 bottom-7 left-[1.69rem] w-px bg-line sm:left-[1.94rem]" />
      <AnimatePresence initial={false}>
        {firstMove.length ? (
          <Row key="plan" icon={ListChecksIcon} title="plan" detail={`Check ${list(firstMove)}`} state="done" />
        ) : null}
        {steps.map((st, i) => {
          const ex = st.ref ? byId[st.ref] : undefined;
          const icon = ex ? (ex.mime?.startsWith("image/") ? ImageIcon : KIND_ICON[ex.kind] ?? FileTextIcon) : TOOL_ICON[st.tool] ?? CheckIcon;
          const batch = steps.slice(0, i).filter((x) => x.turn === st.turn).length;
          return (
            <Row
              key={`${st.at}-${i}`}
              delay={batch * 0.12}
              icon={icon}
              title={st.tool}
              arg={st.tool === "read_locker_item" && ex ? `“${ex.letter}”` : undefined}
              detail={st.detail ?? st.label}
              tone={st.tool === "guardrail" ? "risk" : st.tool === "fallback" ? "caution" : undefined}
              elapsed={packet ? seconds(packet.startedAt, st.at) : undefined}
              state="done"
            >
              {ex?.file ? <FileCard exhibit={ex} /> : null}
            </Row>
          );
        })}
        {working && active ? <Row key={`active-${active.tool}`} icon={TOOL_ICON[active.tool] ?? LoaderCircleIcon} title={active.tool === "think" || active.tool === "start" ? null : active.tool} detail={active.label} state="active" /> : null}
      </AnimatePresence>
    </ol>
  );
}

function Row({ icon: Icon, title, arg, detail, tone, elapsed, state, delay = 0, children }: { icon: LucideIcon; title: string | null; arg?: string; detail: string; tone?: "risk" | "caution"; elapsed?: number; state: "done" | "active"; delay?: number; children?: React.ReactNode }) {
  return (
    <m.li layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.25, delay }} className="relative flex gap-3 py-2">
      <span className={cn("relative z-10 mt-1.5 grid size-5 shrink-0 place-items-center rounded-full", state === "active" ? "bg-surface" : tone === "risk" ? "bg-risk text-white" : tone === "caution" ? "bg-caution text-white" : "bg-cleared text-white")}>
        {state === "active" ? <LoaderCircleIcon aria-hidden className="size-5 animate-spin text-cleared" /> : <CheckIcon aria-hidden className="size-3" strokeWidth={3} />}
      </span>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md border bg-paper", state === "active" && "border-cleared/30 bg-cleared-tint/50")}>
        <Icon aria-hidden className={cn("size-4", tone === "risk" ? "text-risk" : "text-muted-foreground")} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm">
            {title ? <span className="font-mono text-[0.8rem] font-medium">{title}</span> : null}
            {arg ? <span className="font-mono text-[0.8rem] text-muted-foreground">({arg})</span> : null}
          </p>
          {elapsed !== undefined ? <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums">{elapsed.toFixed(1)}s</span> : null}
        </div>
        <p className={cn("text-sm text-pretty", state === "active" ? "shimmer-text" : tone === "risk" ? "text-risk" : "text-muted-foreground", !title && "-mt-0.5")}>{detail}</p>
        {children}
      </div>
    </m.li>
  );
}

function FileCard({ exhibit: e }: { exhibit: Exhibit }) {
  const image = e.mime?.startsWith("image/");
  return (
    <m.a
      href={`/api/proofs/${e.id}`}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="mt-2 flex max-w-sm items-center gap-3 overflow-hidden rounded-lg border bg-paper p-1.5 pr-3 transition-colors hover:bg-muted/60"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect, not a static asset
        <img src={`/api/proofs/${e.id}`} alt="" className="size-14 shrink-0 rounded-md border object-cover" loading="lazy" />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-md border bg-surface"><FileTextIcon aria-hidden className="size-5 text-muted-foreground" /></span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-mono text-[0.8rem]">{e.label}</span>
        <span className="block text-xs text-muted-foreground">{[size(e.size), `added ${day(e.date)}`].filter(Boolean).join(" · ")}</span>
      </span>
    </m.a>
  );
}

function Writing() {
  return (
    <div className="space-y-3 px-4 py-5 sm:px-5" aria-hidden>
      {[92, 80, 86, 60].map((w, i) => (
        <div key={i} className="h-3 animate-pulse rounded-full bg-muted" style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
      ))}
      <p className="pt-2 text-sm text-muted-foreground">Written once the evidence is in.</p>
    </div>
  );
}

function Reply({ packet, byId, exhibits }: { packet: PacketView; byId: Record<string, Exhibit>; exhibits: Exhibit[] }) {
  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      {packet.source !== "ai" ? <p className="rounded-md bg-caution-tint px-3 py-2 text-sm text-caution">The AI was unavailable, so this was built from your files.</p> : null}
      {packet.rationale ? <p className="text-[0.95rem] text-pretty">{packet.rationale}</p> : null}
      <ol className="divide-y rounded-lg border">
        {packet.claims.map((c, i) => (
          <m.li key={c.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="flex items-start justify-between gap-3 px-3.5 py-3">
            <p className="text-sm text-pretty">{c.text}</p>
            <span className="flex shrink-0 flex-wrap justify-end gap-1">
              {c.exhibitIds.map((id) => (
                <span key={id} title={byId[id]?.label} className="inline-flex items-center gap-1 rounded bg-cleared-tint px-1.5 py-0.5 font-mono text-[0.7rem] text-cleared-strong">
                  <ShieldCheckIcon aria-hidden className="size-3" /> {byId[id]?.letter ?? "?"}
                </span>
              ))}
            </span>
          </m.li>
        ))}
      </ol>
      {exhibits.length ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{exhibits.length} exhibits attached</p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {exhibits.map((e) => {
              const Icon = KIND_ICON[e.kind] ?? FileTextIcon;
              const inner = (
                <>
                  {e.file && e.mime?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a private file behind a redirect
                    <img src={`/api/proofs/${e.id}`} alt="" className="h-16 w-full rounded-t-md object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-16 place-items-center rounded-t-md bg-paper"><Icon aria-hidden className="size-5 text-muted-foreground" /></span>
                  )}
                  <span className="flex items-center gap-1.5 px-2 py-1.5 text-xs">
                    <span className="grid size-4 shrink-0 place-items-center rounded bg-ink font-mono text-[0.6rem] text-paper">{e.letter}</span>
                    <span className="truncate">{e.label}</span>
                  </span>
                </>
              );
              return (
                <li key={e.id} className="w-32 shrink-0 overflow-hidden rounded-md border bg-surface">
                  {e.file ? <a href={`/api/proofs/${e.id}`} target="_blank" rel="noreferrer" className="block hover:opacity-90">{inner}</a> : inner}
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
      <DialogTrigger render={<Button size="lg" className="w-full" disabled={pending} />}>{pending ? "Sending to PayPal…" : "Approve and send to PayPal"}</DialogTrigger>
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

/** Phones: the reply sits below the steps, so offer a jump to it until it's on screen. */
function JumpToReply() {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = document.getElementById("reply");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (seen) return null;
  return (
    <m.a
      href="#reply"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-4 bottom-20 z-30 flex h-12 items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground shadow-soft lg:hidden"
    >
      Review the reply <ArrowDownIcon aria-hidden className="size-4" />
    </m.a>
  );
}
