"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckIcon, CircleAlertIcon, InfoIcon, SparklesIcon, TriangleAlertIcon, WandSparklesIcon } from "lucide-react";
import { AgentTag } from "@/components/brand/marks";
import { ReadinessRing } from "@/components/brand/readiness-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/lib/format";
import { type Finding, type History, preflight, type SaleDraft, scoreWith } from "@/lib/preflight";
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

const SEVERITY = {
  risk: { icon: CircleAlertIcon, label: "Risk", className: "text-risk", chip: "bg-risk-tint text-risk" },
  caution: { icon: TriangleAlertIcon, label: "Worth fixing", className: "text-caution", chip: "bg-caution-tint text-caution" },
  info: { icon: InfoIcon, label: "Good to know", className: "text-muted-foreground", chip: "bg-muted text-muted-foreground" },
} as const;

const applied = (draft: SaleDraft, f: Finding) => !!f.fix && Object.entries(f.fix.patch).every(([k, v]) => draft[k as keyof SaleDraft] === v);

export function NewSaleFlow({ history, sample = false }: { history: History; sample?: boolean }) {
  const [step, setStep] = useState<"describe" | "scan" | "fix">("describe");
  const [draft, setDraft] = useState<SaleDraft>(sample ? SAMPLE : EMPTY);
  const [initial, setInitial] = useState<Finding[]>([]);
  const [ai, setAi] = useState<Finding[]>([]);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "failed">("idle");
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
              <Button type="button" variant="outline" size="sm" onClick={() => setDraft(SAMPLE)}>
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
                <Input id="amount" inputMode="decimal" value={draft.amountCents ? String(draft.amountCents / 100) : ""} onChange={(e) => set("amountCents", Math.round(Number(e.target.value.replace(/[^0-9.]/g, "")) * 100) || 0)} placeholder="400" />
                <FieldError errors={errors.amountCents?.map((message) => ({ message }))} />
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
                {(["digital", "service", "physical"] as const).map((k) => (
                  <Button key={k} type="button" size="sm" variant={draft.kind === k ? "default" : "outline"} aria-pressed={draft.kind === k} onClick={() => set("kind", k)}>
                    {{ digital: "Digital work", service: "Service", physical: "Physical goods" }[k]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-end gap-3">
              {!draft.title || !draft.amountCents ? <p className="text-sm text-muted-foreground">Add what it is and the price to check it.</p> : null}
              <Button size="lg" disabled={!draft.title || !draft.amountCents} onClick={() => { setInitial(preflight(draft, history).findings); setAi([]); askAi(draft); setStep("scan"); }}>Check this sale</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "scan" ? <Scan findings={result.findings} waiting={aiStatus === "loading"} onDone={() => setStep("fix")} /> : null}

      {step === "fix" ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <Card className="items-center gap-3 px-6 py-6 text-center lg:sticky lg:top-20 lg:self-start">
            <ReadinessRing score={score} />
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {score >= 85 ? "Ready to invoice." : "Accept the fixes to protect this payment."}
            </p>
            <p className="text-xs text-muted-foreground">
              Compared with your {history.pastSales} past sales{history.averageCents ? ` (avg ${money(history.averageCents)})` : ""}.
            </p>
          </Card>
          <div className="space-y-3">
            {aiStatus === "failed" ? (
              <p className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
                AI suggestions are unavailable right now. The rule checks below still apply.
                <Button variant="ghost" size="sm" onClick={() => askAi(draft)}>Retry</Button>
              </p>
            ) : null}
            {[...initial, ...ai].map((first) => {
              const f = first.source === "ai" ? first : (result.findings.find((x) => x.id === first.id) ?? first);
              const sev = SEVERITY[f.severity];
              const done = f.source === "ai" ? applied(draft, f) : !result.findings.some((x) => x.id === first.id) || applied(draft, f);
              return (
                <Card key={f.id} className={cn("gap-3 px-5 py-4 transition-colors", done && "border-cleared/30 bg-cleared-tint/40")}>
                  <div className="flex items-start gap-3">
                    {done ? <CheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-cleared" /> : <sev.icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", sev.className)} />}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{f.title}</p>
                        <span className={cn("rounded px-1.5 py-0.5 text-[0.7rem] font-medium", done ? "bg-cleared-tint text-cleared-strong" : sev.chip)}>{done ? "Fixed" : sev.label}</span>
                        <Badge variant="outline" className="font-mono text-[0.65rem]">PayPal rule {f.ruleRef}</Badge>
                        {f.source === "ai" ? <AgentTag className="text-[0.7rem]" /> : null}
                      </div>
                      <p className="text-sm text-muted-foreground text-pretty">{f.reason}</p>
                    </div>
                  </div>
                  {f.fix && !done ? (
                    <Button variant="outline" size="sm" className="w-fit self-end" onClick={() => setDraft((d) => ({ ...d, ...f.fix!.patch }))}>
                      <WandSparklesIcon aria-hidden /> {f.fix.label}
                    </Button>
                  ) : null}
                </Card>
              );
            })}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("describe")}>Edit details</Button>
              <Button
                size="lg"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await createSale(draft, ai);
                    if (r && !r.ok) {
                      setErrors(r.errors);
                      setStep("describe");
                    }
                  })
                }
              >
                {pending ? "Creating invoice…" : "Create invoice"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Scan({ findings, waiting, onDone }: { findings: Finding[]; waiting: boolean; onDone: () => void }) {
  const checks = useMemo(() => ["Comparing with your sales history", "Reading PayPal’s hold and limitation rules", ...findings.map((f) => f.title), "Reading the sale like a PayPal reviewer would", "Planning the proof you’ll need"], [findings]);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= checks.length) {
      if (waiting) return; // the AI pass is still running; finish when it does
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [shown, checks.length, onDone, waiting]);

  return (
    <Card className="relative overflow-hidden px-6 py-6">
      <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <AgentTag className="text-[0.8rem]" /> is checking this sale against your history and PayPal’s published rules…
      </p>
      <ul className="space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {checks.slice(0, shown).map((c) => (
            <m.li key={c} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 text-[0.95rem]">
              <CheckIcon aria-hidden className="size-4 text-cleared" /> {c}
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
