// Deterministic claim checker (docs/AI.md guardrail 1). Every claim must cite at least one real exhibit, and
// the dates, amounts and file names it mentions must appear in what it cites (or in the sale itself).
export type Exhibit = { letter: string; kind: string; label: string; date: string; text?: string | null; meta?: Record<string, unknown> | null };
export type DraftClaim = { text: string; exhibits: string[] };
export type CheckedClaim = DraftClaim & { ok: boolean; reasons: string[] };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Dates written like "Oct 18", "18 October", "2026-10-18". Returns month-day keys "10-18". */
export function datesIn(text: string) {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/gi)) out.add(`${MONTHS.indexOf(m[1].toLowerCase()) + 1}-${Number(m[2])}`);
  for (const m of text.matchAll(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi)) out.add(`${MONTHS.indexOf(m[2].toLowerCase()) + 1}-${Number(m[1])}`);
  for (const m of text.matchAll(/\b\d{4}-(\d{2})-(\d{2})\b/g)) out.add(`${Number(m[1])}-${Number(m[2])}`);
  return out;
}

export function amountsIn(text: string) {
  return new Set([...text.matchAll(/\$\s?(\d[\d,]*(?:\.\d{2})?)/g)].map((m) => Number(m[1].replace(/,/g, ""))));
}

export function filenamesIn(text: string) {
  return new Set([...text.matchAll(/\b[\w.-]+\.(png|jpe?g|gif|pdf|psd|svg|zip)\b/gi)].map((m) => m[0].toLowerCase()));
}

const dateKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
};

export function checkClaims(claims: DraftClaim[], exhibits: Exhibit[], sale: { amountCents: number; invoiceAmounts?: number[]; extraDates?: string[] }): CheckedClaim[] {
  const byLetter = new Map(exhibits.map((e) => [e.letter.toUpperCase(), e]));
  return claims.map((c) => {
    const reasons: string[] = [];
    const cited = c.exhibits.map((l) => byLetter.get(l.toUpperCase())).filter(Boolean) as Exhibit[];
    const unknown = c.exhibits.filter((l) => !byLetter.has(l.toUpperCase()));
    if (!c.exhibits.length) reasons.push("cites no exhibit");
    if (unknown.length) reasons.push(`cites exhibit ${unknown.join(", ")}, which doesn't exist`);

    const allowedDates = new Set([...cited.map((e) => dateKey(e.date)), ...(sale.extraDates ?? []).map(dateKey)]);
    const badDates = [...datesIn(c.text)].filter((d) => !allowedDates.has(d));
    if (badDates.length) reasons.push(`mentions a date (${badDates.join(", ")}) no cited exhibit shows`);

    const allowedAmounts = new Set([sale.amountCents / 100, ...(sale.invoiceAmounts ?? [])]);
    const badAmounts = [...amountsIn(c.text)].filter((a) => !allowedAmounts.has(a));
    if (badAmounts.length) reasons.push(`mentions an amount ($${badAmounts.join(", $")}) that isn't the sale or invoice amount`);

    const citedText = cited.map((e) => `${e.label} ${e.text ?? ""}`.toLowerCase()).join(" ");
    const badFiles = [...filenamesIn(c.text)].filter((f) => !citedText.includes(f));
    if (badFiles.length) reasons.push(`names a file (${badFiles.join(", ")}) that isn't in its exhibits`);

    return { ...c, ok: reasons.length === 0, reasons };
  });
}
