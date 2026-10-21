// The exhibits for a sale: every proof-locker item in date order, then the PayPal invoice (real evidence of
// what was agreed). Shared by the investigator, the case room and the evidence PDF so letters always match.
import { money } from "@/lib/format";

type Proof = { id: string; kind: string; label: string; fileName: string | null; text: string | null; meta: unknown; occurredAt: Date };
type Invoice = { id: string; invoiceNumber: string | null; draft: unknown; sentAt: Date | null; createdAt: Date; status: string };

export type SaleExhibit = { id: string; letter: string; kind: string; label: string; date: string; text: string | null; meta: Record<string, unknown> | null };

export function exhibitsFor(sale: { proofs: Proof[]; invoices?: Invoice[]; amountCents: number }): SaleExhibit[] {
  const list: SaleExhibit[] = sale.proofs.map((p, i) => ({ id: p.id, letter: String.fromCharCode(65 + i), kind: p.kind, label: p.fileName ?? p.label, date: p.occurredAt.toISOString(), text: p.text, meta: p.meta as Record<string, unknown> | null }));
  const inv = sale.invoices?.find((i) => i.sentAt);
  if (inv) {
    const d = inv.draft as { items?: { name: string; description?: string; unitAmount: string }[]; note?: string; terms?: string };
    const text = [...(d.items ?? []).map((it) => `${it.name}${it.description ? ` (${it.description})` : ""}: $${it.unitAmount}`), d.note, d.terms].filter(Boolean).join(". ");
    list.push({ id: inv.id, letter: String.fromCharCode(65 + list.length), kind: "invoice", label: `PayPal invoice #${inv.invoiceNumber ?? "draft"} (${money(sale.amountCents)})`, date: (inv.sentAt ?? inv.createdAt).toISOString(), text, meta: { status: inv.status } });
  }
  return list;
}
