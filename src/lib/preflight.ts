// Deterministic pre-flight checks (F1). They run before, and independently of, the AI pass,
// so a sale always gets a result. Rule ids refer to docs/KNOWLEDGE.md.

export type SaleDraft = {
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  kind: "service" | "digital" | "physical" | "other";
  amountCents: number;
  depositPercent: number | null;
  deliveryDays: number | null;
  refundTerms: string;
};

export type History = { pastSales: number; averageCents: number | null; accountAgeDays: number | null };

export type Finding = {
  id: string;
  severity: "risk" | "caution" | "info";
  title: string;
  reason: string;
  ruleRef: string;
  fix?: Fix;
  weight: number;
  /** "ai" for findings suggested by the model on top of the rules. */
  source?: "rules" | "ai";
};

/** A one-click fix. `patch` sets fields outright; `add` appends a sentence to a text field, so several fixes to
 *  the same field (vague description, usage rights) stack instead of overwriting each other. */
export type Fix = { label: string; patch?: Partial<SaleDraft>; add?: { field: "description" | "refundTerms"; text: string } };

const joinSentences = (a: string, b: string) => {
  const head = a.trim();
  if (!head) return b.trim();
  return `${/[.!?]$/.test(head) ? head : `${head}.`} ${b.trim()}`;
};

export function applyFix(draft: SaleDraft, fix: Fix): SaleDraft {
  const next = { ...draft, ...fix.patch };
  if (fix.add && !next[fix.add.field].includes(fix.add.text.trim())) next[fix.add.field] = joinSentences(next[fix.add.field], fix.add.text);
  return next;
}

export function fixApplied(draft: SaleDraft, fix: Fix) {
  const patched = Object.entries(fix.patch ?? {}).every(([k, v]) => draft[k as keyof SaleDraft] === v);
  return patched && (!fix.add || draft[fix.add.field].includes(fix.add.text.trim()));
}

/** Template gaps a model sometimes leaves in suggested text: "[file format(s)]", "{size}", "<client>", "TBD". */
export const hasPlaceholder = (text: string) => /\[[^\]]*\]|\{[^}]*\}|<[^>]*>|\bTBD\b|\bX{2,}\b/i.test(text);

/** Weight of an AI finding in the readiness score (rules stay the main signal). */
export const AI_WEIGHT = { risk: 12, caution: 6, info: 0 } as const;

/** Score with AI findings counted until their fix is applied. */
export function scoreWith(base: { score: number; findings: Finding[] }, ai: Finding[], draft: SaleDraft) {
  const open = ai.filter((f) => !(f.fix && fixApplied(draft, f.fix)));
  return Math.max(0, base.score - open.reduce((sum, f) => sum + f.weight, 0));
}

const DELIVERABLE_WORDS = /\b(png|jpe?g|pdf|psd|svg|file|files|px|pages?|revisions?|rounds?|illustrations?|logo|cover|portrait|video|minutes|hours|session|delivered|ship|shipping)\b/i;

export function preflight(draft: SaleDraft, history: History): { score: number; findings: Finding[] } {
  const findings: Finding[] = [];

  if (history.averageCents && draft.amountCents >= history.averageCents * 3) {
    const ratio = Math.floor(draft.amountCents / history.averageCents);
    findings.push({
      id: "spike",
      severity: "risk",
      title: `This sale is ${ratio}× your average`,
      reason: `Your past ${history.pastSales} sales averaged $${Math.round(history.averageCents / 100)}. PayPal lists a sudden jump in sales as higher-risk activity, especially on a young account. Splitting into a deposit and a final payment keeps each payment closer to your usual size.`,
      ruleRef: "K8",
      fix: { label: "Split into 50% deposit + 50% on delivery", patch: { depositPercent: 50 } },
      weight: draft.depositPercent ? 6 : 22,
    });
  }

  if (!draft.deliveryDays) {
    findings.push({
      id: "delivery",
      severity: "caution",
      title: "No delivery date",
      reason: "Long or open-ended delivery times are a factor PayPal weighs for holds and reserves. A clear date also answers a “not received” claim before it starts.",
      ruleRef: "K13",
      fix: { label: "Deliver within 10 days of payment", patch: { deliveryDays: 10 } },
      weight: 14,
    });
  }

  if (draft.description.trim().length < 60 || !DELIVERABLE_WORDS.test(draft.description)) {
    findings.push({
      id: "vague",
      severity: "caution",
      title: "The description is vague",
      reason: "Say exactly what the client gets: format, size, number of revisions. That wording becomes your evidence if the client later says the work wasn’t as described.",
      ruleRef: "K16",
      fix: { label: "Spell out files, size and revisions", add: { field: "description", text: "Delivered as PNG (3000×3000 px) plus a layered source file, with 2 revision rounds." } },
      weight: 16,
    });
  }

  if (!draft.refundTerms.trim()) {
    findings.push({
      id: "refunds",
      severity: "caution",
      title: "No refund or revision terms",
      reason: "PayPal advises communicating early and refunding promptly. Written terms set expectations and keep complaints low.",
      ruleRef: "K14",
      fix: { label: "Add standard terms", patch: { refundTerms: "Refunds available until the first sketch is approved. Two revision rounds included." } },
      weight: 10,
    });
  }

  if (draft.kind !== "physical") {
    findings.push({
      id: "protection",
      severity: "info",
      title: draft.kind === "other" ? "Only shipped goods are covered by Seller Protection" : "Services and digital work aren’t covered by Seller Protection",
      reason: "For intangible work, your proof is everything. Cleared will keep the files and ask the client to confirm receipt.",
      ruleRef: "K16",
      weight: 0,
    });
  } else if (draft.amountCents >= 75_000) {
    findings.push({
      id: "signature",
      severity: "caution",
      title: "Signature confirmation needed at $750+",
      reason: "US Seller Protection for goods of $750 or more requires signature confirmation on delivery.",
      ruleRef: "K16",
      weight: 8,
    });
  }

  const score = Math.max(0, Math.min(100, 100 - findings.reduce((sum, f) => sum + f.weight, 0)));
  return { score, findings };
}
