"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BookOpenIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleDollarSignIcon,
  FileTextIcon,
  HistoryIcon,
  InfoIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
  WandSparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { AgentAvatar, type AgentMood } from "@/components/brand/agent-avatar";
import { AgentTag } from "@/components/brand/marks";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/lib/format";
import { RULES } from "@/lib/knowledge";
import { applyFix, type Finding, fixApplied, type History, preflight, type SaleDraft, scoreWith } from "@/lib/preflight";
import { cn } from "@/lib/utils";
import { createSale, suggestFindings } from "@/server/actions/sales";

const SAMPLE: SaleDraft = {
  clientName: "Northwind Games",
  clientEmail: "art@northwind.example",
  title: "Character sheet: 3 poses",
  description: "Character sheet for our game's main hero",
  kind: "digital",
  amountCents: 40_000,
  depositPercent: null,
  deliveryDays: null,
  refundTerms: "",
};

const EMPTY: SaleDraft = { clientName: "", clientEmail: "", title: "", description: "", kind: "digital", amountCents: 0, depositPercent: null, deliveryDays: null, refundTerms: "" };

const KINDS = { digital: "Digital work", service: "Service", physical: "Physical goods", other: "Other" } as const;

const SEVERITY = {
  risk: { icon: CircleAlertIcon, className: "text-risk" },
  caution: { icon: TriangleAlertIcon, className: "text-caution" },
  info: { icon: InfoIcon, className: "text-muted-foreground" },
} as const;

const applied = (draft: SaleDraft, f: Finding) => !!f.fix && fixApplied(draft, f.fix);

/** One line in the agent's check log: the check it ran and what it found. */
type CheckLine = { tool: string; arg?: string; icon: LucideIcon; doing: string; detail: string; tone?: "risk" | "caution"; at?: number };
type AiStatus = "idle" | "loading" | "done" | "failed";

export function NewSaleFlow({ history, sample = false }: { history: History; sample?: boolean }) {
  const [step, setStep] = useState<"describe" | "scan" | "fix">("describe");
  const [draft, setDraft] = useState<SaleDraft>(sample ? SAMPLE : EMPTY);
  // The price keeps what was typed ("12." on the way to "12.50"); the draft holds cents, 0 until the price is valid.
  const [amountText, setAmountText] = useState(sample ? String(SAMPLE.amountCents / 100) : "");
  const setAmount = (raw: string) => {
    setAmountText(raw);
    const n = /^\$?\s*\d[\d,]*(\.\d{0,2})?$/.test(raw.trim()) ? Number(raw.trim().replace(/[$,\s]/g, "")) : NaN;
    setDraft((d) => ({ ...d, amountCents: n > 0 ? Math.round(n * 100) : 0 }));
  };
  const amountError = amountText.trim() && !draft.amountCents ? "Enter a price above $0, like 400 or 49.99" : undefined;
  const [initial, setInitial] = useState<Finding[]>([]);
  const [checks, setChecks] = useState<{ rules: CheckLine[]; proof: CheckLine }>({ rules: [], proof: proofLine(EMPTY) });
  const [ai, setAi] = useState<Finding[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [log, setLog] = useState<CheckLine[]>([]);
  const askAi = (d: SaleDraft) => {
    setAiStatus("loading");
    suggestFindings(d).then((r) => {
      setAi(r.findings);
      setAiStatus(r.ok ? "done" : "failed");
    });
  };
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const result = useMemo(() => preflight(draft, history), [draft, history]);
  const score = scoreWith(result, ai, draft);
  const set = <K extends keyof SaleDraft>(k: K, v: SaleDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const aiCheck = useMemo(() => (aiStatus === "loading" || aiStatus === "idle" ? null : aiLine(aiStatus, ai.length)), [aiStatus, ai.length]);
  const create = () =>
    start(async () => {
      const r = await createSale(draft, ai);
      if (r && !r.ok) {
        setErrors(r.errors);
        setStep("describe");
      }
    });

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-3 text-sm" aria-label="Steps">
        {(["describe", "scan", "fix"] as const).map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2", step === s ? "font-medium text-foreground" : "text-muted-foreground")} aria-current={step === s ? "step" : undefined}>
            <span className={cn("grid size-6 place-items-center rounded-full border text-xs", step === s && "border-cleared bg-cleared text-primary-foreground")}>{i + 1}</span>
            {["Describe", "Check", "Fix"][i]}
            {i < 2 ? <span aria-hidden className="mx-1 h-px w-6 bg-border" /> : null}
          </li>
        ))}
      </ol>

      {step === "describe" ? (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Try a sample:</span>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                  setDraft(SAMPLE);
                  setAmountText(String(SAMPLE.amountCents / 100));
                }}>
                <SparklesIcon aria-hidden /> $400 character sheet for a game studio
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="clientName">Client name</FieldLabel>
                <Input id="clientName" value={draft.clientName} onChange={(e) => set("clientName", e.target.value)} />
                <FieldError errors={errors.clientName?.map((message) => ({ message }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="clientEmail">Client email (their PayPal email)</FieldLabel>
                <Input id="clientEmail" type="email" value={draft.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} />
                <FieldError errors={errors.clientEmail?.map((message) => ({ message }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="title">What is it?</FieldLabel>
                <Input id="title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Album cover" />
                <FieldError errors={errors.title?.map((message) => ({ message }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="amount">Total price (USD)</FieldLabel>
                <Input id="amount" inputMode="decimal" value={amountText} onChange={(e) => setAmount(e.target.value)} placeholder="400" aria-invalid={!!amountError || undefined} />
                <FieldError errors={(amountError ? [amountError] : (errors.amountCents ?? [])).map((message) => ({ message }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="description">What are you delivering?</FieldLabel>
              <Textarea id="description" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Files, sizes, number of revisions, anything the client is expecting" />
              <FieldError errors={errors.description?.map((message) => ({ message }))} />
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Kind of sale</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(KINDS) as SaleDraft["kind"][]).map((k) => (
                  <Button key={k} type="button" size="sm" variant={draft.kind === k ? "default" : "outline"} aria-pressed={draft.kind === k} onClick={() => set("kind", k)}>
                    {KINDS[k]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-end gap-3">
              {!draft.title || !draft.amountCents ? <p className="text-sm text-muted-foreground">Add what it is and the price to check it.</p> : null}
              <Button
                size="lg"
                disabled={!draft.title || !draft.amountCents}
                onClick={() => {
                  const found = preflight(draft, history).findings;
                  setInitial(found);
                  setChecks({ rules: plan(draft, history, found), proof: proofLine(draft) });
                  setAi([]);
                  askAi(draft);
                  setStep("scan");
                }}
              >
                Check this sale
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "scan" ? (
        <Scan
          rules={checks.rules}
          ai={aiCheck}
          proof={checks.proof}
          pastSales={history.pastSales}
          onDone={(l) => {
            setLog(l);
            setStep("fix");
          }}
        />
      ) : null}

      {step === "fix" ? (
        <Fix
          draft={draft}
          setDraft={setDraft}
          history={history}
          score={score}
          findings={[...initial, ...ai].map((first) => {
            const f = first.source === "ai" ? first : (result.findings.find((x) => x.id === first.id) ?? first);
            const done = f.source === "ai" ? applied(draft, f) : !result.findings.some((x) => x.id === first.id) || applied(draft, f);
            return { f, done };
          })}
          aiFailed={aiStatus === "failed"}
          retryAi={() => askAi(draft)}
          log={log}
          pending={pending}
          onCreate={create}
          onEdit={() => setStep("describe")}
        />
      ) : null}
    </div>
  );
}

// The checks the agent runs, in order, worded from what each one actually found. The rule checks are worked out
// up front; the AI reviewer's line is known only when its call returns, so the log waits on it.
function plan(draft: SaleDraft, history: History, findings: Finding[]): CheckLine[] {
  const by = (id: string) => findings.find((f) => f.id === id);
  const spike = by("spike");
  return [
    { tool: "get_sales_history", icon: HistoryIcon, doing: "Reading your sales history", detail: history.pastSales ? `${history.pastSales} paid sales · avg ${money(history.averageCents ?? 0)}` : "No paid sales yet" },
    { tool: "search_policy", arg: "holds, reserves, limits", icon: BookOpenIcon, doing: "Reading PayPal’s published rules", detail: `${RULES.length} rules loaded` },
    { tool: "check_amount", icon: CircleDollarSignIcon, doing: "Comparing the price with your usual sales", ...(spike ? { detail: spike.title, tone: "risk" as const } : history.pastSales ? { detail: `${money(draft.amountCents)} is in line with your sales` } : { detail: "No past sales to compare with yet" }) },
    { tool: "check_delivery", icon: CalendarClockIcon, doing: "Looking for a delivery date", ...(by("delivery") ? { detail: "No delivery date", tone: "caution" as const } : { detail: `Delivery within ${draft.deliveryDays} days` }) },
    { tool: "check_description", icon: FileTextIcon, doing: "Reading what you’ll deliver", ...(by("vague") ? { detail: "Vague: no files, size or revisions", tone: "caution" as const } : { detail: "Deliverables are specific" }) },
    { tool: "check_terms", icon: ScaleIcon, doing: "Looking for refund and revision terms", ...(by("refunds") ? { detail: "No refund or revision terms", tone: "caution" as const } : { detail: "Terms are written down" }) },
    { tool: "check_coverage", icon: ShieldCheckIcon, doing: "Checking Seller Protection", ...(by("signature") ? { detail: "Needs signature confirmation at $750+", tone: "caution" as const } : { detail: draft.kind === "physical" ? "Covered once tracking shows delivery" : "Not covered, so proof matters" }) },
  ];
}

const REVIEW = { tool: "review_as_paypal", icon: SparklesIcon, doing: "Reading it the way a PayPal reviewer would" };

function aiLine(status: AiStatus, found: number): CheckLine {
  if (status === "failed") return { ...REVIEW, detail: "Unavailable right now · the rule checks still apply", tone: "caution" };
  return found ? { ...REVIEW, detail: `Found ${found} more to fix`, tone: "caution" } : { ...REVIEW, detail: "Nothing else to fix" };
}

function proofLine(draft: SaleDraft): CheckLine {
  return { tool: "plan_proof", icon: ListChecksIcon, doing: "Planning the proof you’ll keep", detail: draft.kind === "physical" ? "Keep tracking and the client’s sign-off" : "Keep the files and the client’s sign-off" };
}

const STEP_MS = 620;

function Scan({ rules, ai, proof, pastSales, onDone }: { rules: CheckLine[]; ai: CheckLine | null; proof: CheckLine; pastSales: number; onDone: (log: CheckLine[]) => void }) {
  const started = useRef(0);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);
  const [done, setDone] = useState<CheckLine[]>([]);
  const all = useMemo(() => [...rules, ai, proof], [rules, ai, proof]);
  const next = all[done.length];
  const finished = done.length === all.length;
  // The AI reviewer is the one real wait: the log sits on its line until the call comes back.
  const waiting = !finished && !next;

  useEffect(() => {
    started.current = performance.now();
  }, []);
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => finish.current(done), 1100);
      return () => clearTimeout(t);
    }
    if (!next) return;
    const t = setTimeout(() => setDone((d) => [...d, { ...next, at: (performance.now() - started.current) / 1000 }]), STEP_MS);
    return () => clearTimeout(t);
  }, [done, next, finished]);

  const mood: AgentMood = finished ? "done" : waiting ? "thinking" : "working";
  const active = finished ? null : (next ?? REVIEW);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <header className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-5">
        <AgentAvatar mood={mood} label="" className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{finished ? "Checked" : "Checking this sale"}</p>
          <p className="text-xs text-muted-foreground">{pastSales ? `Cleared AI · compared with your ${pastSales} past sales and PayPal’s rules` : "Cleared AI · no past sales yet, so PayPal’s rules only"}</p>
        </div>
        {finished ? null : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cleared-tint px-2.5 py-1 text-xs font-medium text-cleared-strong">
            <span className="size-1.5 animate-pulse rounded-full bg-cleared" /> Live
          </span>
        )}
      </header>
      <ol className="px-2 py-2 sm:px-3" aria-live="polite">
        {done.map((l) => <LogLine key={l.tool} line={l} />)}
        {active ? (
          <m.li key={`active-${active.tool}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 flex items-center gap-2.5 rounded-md border border-cleared/20 bg-cleared-tint/40 px-2 py-2.5">
            <LoaderCircleIcon aria-hidden className="size-3.5 shrink-0 animate-spin text-cleared" />
            <span className="min-w-0">
              <span className="block font-mono text-[0.75rem]">{active.tool}</span>
              <span className="shimmer-text block text-sm">{active.doing}</span>
            </span>
          </m.li>
        ) : null}
      </ol>
    </Card>
  );
}

function LogLine({ line }: { line: CheckLine }) {
  return (
    <m.li layout="position" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
      <line.icon aria-hidden className={cn("size-3.5 shrink-0", line.tone === "risk" ? "text-risk" : line.tone === "caution" ? "text-caution" : "text-cleared")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[0.75rem]">
          {line.tool}
          {line.arg ? <span className="text-muted-foreground">(“{line.arg}”)</span> : null}
        </span>
        <span className={cn("block truncate text-xs", line.tone === "risk" ? "text-risk" : "text-muted-foreground")}>{line.detail}</span>
      </span>
      {line.at !== undefined ? <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground tabular-nums">{line.at.toFixed(1)}s</span> : null}
    </m.li>
  );
}

type Item = { f: Finding; done: boolean };
const RANK = { risk: 0, caution: 1, info: 2 } as const;

// The fix step: the score and the sale stay pinned on the left with the button that creates the invoice, so
// nothing needs a scroll to the bottom. Open fixes come first; fixed ones fold away into one line.
function Fix({
  draft,
  setDraft,
  history,
  score,
  findings,
  aiFailed,
  retryAi,
  log,
  pending,
  onCreate,
  onEdit,
}: {
  draft: SaleDraft;
  setDraft: React.Dispatch<React.SetStateAction<SaleDraft>>;
  history: History;
  score: number;
  findings: Item[];
  aiFailed: boolean;
  retryAi: () => void;
  log: CheckLine[];
  pending: boolean;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const [showFixed, setShowFixed] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const open = findings.filter((x) => !x.done && x.f.severity !== "info").sort((a, b) => RANK[a.f.severity] - RANK[b.f.severity]);
  const fixed = findings.filter((x) => x.done);
  const notes = findings.filter((x) => !x.done && x.f.severity === "info");
  const fixable = open.filter((x) => x.f.fix);
  // Each fix is applied on top of the last, so two fixes to the description both land.
  const fixAll = () => setDraft((d) => fixable.reduce((acc, x) => applyFix(acc, x.f.fix!), d));
  const deposit = draft.depositPercent ? Math.round((draft.amountCents * draft.depositPercent) / 100) : null;

  const actions = (
    <>
      <Button size="lg" className="w-full" disabled={pending} onClick={onCreate}>{pending ? "Creating invoice…" : "Create invoice"}</Button>
      <Button variant="ghost" className="w-full" onClick={onEdit}>Edit details</Button>
    </>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <Card className="gap-0 p-0 lg:sticky lg:top-20">
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 lg:flex-col lg:text-center">
          <ReadinessRing score={score} size={112} />
          <p className="text-sm text-muted-foreground" aria-live="polite">{score >= 85 ? "Ready to invoice." : open.length ? `${open.length} ${open.length === 1 ? "thing" : "things"} to fix first.` : "Almost there."}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t px-5 py-3.5 text-sm">
          <dt className="text-muted-foreground">Client</dt>
          <dd className="min-w-0 truncate text-right">{draft.clientName || "—"}</dd>
          <dt className="text-muted-foreground">Price</dt>
          <dd className="text-right tabular-nums">{money(draft.amountCents)}</dd>
          {deposit ? (
            <>
              <dt className="text-muted-foreground">Paid in</dt>
              <dd className="text-right tabular-nums">{money(deposit)} + {money(draft.amountCents - deposit)}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="text-right">{draft.deliveryDays ? `${draft.deliveryDays} days` : "Not set"}</dd>
        </dl>
        {log.length ? (
          <div className="border-t">
            <button type="button" onClick={() => setShowLog((x) => !x)} aria-expanded={showLog} className="flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm hover:bg-muted/40">
              <AgentAvatar mood="idle" still label="" className="size-5" />
              <span className="min-w-0 flex-1">
                <span className="font-medium">{log.length} checks</span>
                <span className="text-muted-foreground"> in {log.at(-1)?.at?.toFixed(1)}s · {history.pastSales} past sales</span>
              </span>
              <ChevronDownIcon aria-hidden className={cn("size-4 text-muted-foreground transition-transform", showLog && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {showLog ? (
                <m.ol key="log" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden px-2 pb-2">
                  {log.map((l) => <LogLine key={l.tool} line={l} />)}
                </m.ol>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
        <div className="hidden space-y-1 border-t p-4 lg:block">{actions}</div>
      </Card>

      <div className="min-w-0 space-y-4">
        {aiFailed ? (
          <p className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
            AI suggestions are unavailable right now. The rule checks still apply.
            <Button variant="ghost" size="sm" onClick={retryAi}>Retry</Button>
          </p>
        ) : null}

        <section aria-label="To fix" className="rounded-[10px] border bg-surface">
          <header className="flex min-h-13 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5">
            <div className="min-w-0">
              <h2 className="font-semibold">{open.length ? `To fix (${open.length})` : "Nothing left to fix"}</h2>
              {open.length ? <p className="text-xs text-muted-foreground text-pretty">Each fix writes the missing terms into the invoice, so they’re on record if a dispute ever comes.</p> : null}
            </div>
            {fixable.length > 1 ? (
              <Button size="sm" onClick={fixAll}>
                <WandSparklesIcon aria-hidden /> Fix all {fixable.length}
              </Button>
            ) : null}
          </header>
          {open.length ? (
            <ol className="divide-y">
              <AnimatePresence initial={false}>
                {open.map(({ f }) => {
                  const sev = SEVERITY[f.severity];
                  return (
                    <m.li key={f.id} layout="position" exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                      <sev.icon aria-hidden className={cn("mt-0.5 size-4.5 shrink-0", sev.className)} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium">{f.title}</span>
                          {f.source === "ai" ? <AgentTag className="text-[0.68rem]" /> : null}
                          <span className="font-mono text-[0.65rem] text-muted-foreground" title={`PayPal rule ${f.ruleRef}`}>{f.ruleRef}</span>
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground text-pretty" title={f.reason}>{f.reason}</p>
                        {f.fix ? (
                          <Button variant="outline" size="sm" className="mt-2.5 h-auto min-h-8 w-fit max-w-full py-1.5 text-left whitespace-normal" onClick={() => setDraft((d) => applyFix(d, f.fix!))}>
                            <WandSparklesIcon aria-hidden /> {f.fix.label}
                          </Button>
                        ) : null}
                      </div>
                    </m.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          ) : (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-5">
              <CheckIcon aria-hidden className="size-4 text-cleared" /> Every fix is in. Create the invoice when you’re ready.
            </p>
          )}
          {fixed.length ? (
            <div className="border-t">
              <button type="button" onClick={() => setShowFixed((x) => !x)} aria-expanded={showFixed} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted/40 sm:px-5">
                <span className="grid size-4.5 place-items-center rounded-full bg-cleared text-white"><CheckIcon aria-hidden className="size-3" strokeWidth={3} /></span>
                <span className="flex-1 font-medium">Fixed ({fixed.length})</span>
                <ChevronDownIcon aria-hidden className={cn("size-4 text-muted-foreground transition-transform", showFixed && "rotate-180")} />
              </button>
              {showFixed ? (
                <ul className="space-y-1 px-4 pb-3 text-sm text-muted-foreground sm:px-5">
                  {fixed.map(({ f }) => <li key={f.id} className="pl-7">{f.title}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        {notes.map(({ f }) => (
          <p key={f.id} className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-4 py-2.5 text-sm">
            <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span><span className="font-medium">{f.title}.</span> <span className="text-muted-foreground">{f.reason}</span></span>
          </p>
        ))}

        <div className="space-y-1 lg:hidden">{actions}</div>
      </div>
    </div>
  );
}
