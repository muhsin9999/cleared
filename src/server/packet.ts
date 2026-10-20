// Template evidence packet built only from the proof locker. It is the fallback when the AI draft
// fails validation, and the day-2 stand-in before the AI pipeline (docs/AI.md J4) exists.
import "server-only";
import { money, shortDate } from "@/lib/format";

type Proof = { id: string; kind: string; label: string; fileName: string | null; text: string | null; meta: unknown; occurredAt: Date };
type Sale = { title: string; clientName: string; amountCents: number; description: string; paidAt: Date | null; deliveredAt: Date | null };

export type Claim = { text: string; exhibitIds: string[]; evidenceType: "PROOF_OF_FULFILLMENT" | "OTHER" };

export function templatePacket(sale: Sale, proofs: Proof[], reason: string) {
  const exhibits = proofs.map((p, i) => ({ id: p.id, number: String.fromCharCode(65 + i), label: p.fileName ?? p.label, kind: p.kind, date: p.occurredAt }));
  const ex = (kind: string) => exhibits.filter((e) => e.kind === kind);
  const claims: Claim[] = [];
  const scope = ex("message");
  if (scope.length) claims.push({ text: `The client agreed the scope in writing: ${sale.description}`, exhibitIds: scope.map((e) => e.id), evidenceType: "OTHER" });
  const files = ex("file");
  if (files.length) claims.push({ text: `The work was delivered as ${files.length} file${files.length > 1 ? "s" : ""}, the final version on ${shortDate(files.at(-1)!.date)}.`, exhibitIds: files.map((e) => e.id), evidenceType: "PROOF_OF_FULFILLMENT" });
  const acc = ex("acceptance");
  if (acc.length) claims.push({ text: `${sale.clientName} confirmed receipt of the work on ${shortDate(acc[0].date)}, recorded with time, IP and device.`, exhibitIds: acc.map((e) => e.id), evidenceType: "PROOF_OF_FULFILLMENT" });

  const missing = [!files.length && "Delivered files", !acc.length && "Client confirmation of receipt", !scope.length && "Agreed scope (messages or brief)"].filter(Boolean) as string[];
  const strong = files.length > 0 && acc.length > 0;
  return {
    recommendation: strong ? "fight" : missing.length >= 2 ? "accept" : "offer",
    rationale: strong
      ? `The client says the ${reason === "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" ? "work never arrived" : "work wasn’t as described"}, but the locker shows delivery and the client’s own confirmation.`
      : "The locker is missing key proof, so a partial refund may be the fairest and cheapest outcome.",
    claims,
    missing,
    exhibits,
    coverLetter: `We delivered “${sale.title}” (${money(sale.amountCents)}) as agreed. The attached exhibits show the agreed scope, the delivered files and the client’s confirmation of receipt.`,
  };
}
