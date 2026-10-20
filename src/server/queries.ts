// Read models for the seller pages. Every function takes the seller id from requireSeller().
import "server-only";
import { and, desc, eq, inArray, isNotNull, notInArray } from "drizzle-orm";
import { db, schema as s } from "@/db";

const IN_FLIGHT = ["paid", "delivered", "accepted"] as const;

export async function listSales(sellerId: string) {
  return db.query.sales.findMany({
    where: eq(s.sales.sellerId, sellerId),
    orderBy: desc(s.sales.createdAt),
    with: { proofs: { columns: { kind: true } } },
  });
}

export async function getSale(sellerId: string, saleId: string) {
  return db.query.sales.findFirst({
    where: and(eq(s.sales.sellerId, sellerId), eq(s.sales.id, saleId)),
    with: { proofs: { orderBy: desc(s.proofs.occurredAt) }, invoices: true, events: { orderBy: desc(s.events.occurredAt) }, disputes: true },
  });
}

export async function listEvents(sellerId: string, limit = 50) {
  return db.query.events.findMany({ where: eq(s.events.sellerId, sellerId), orderBy: desc(s.events.occurredAt), limit, with: { sale: { columns: { id: true, title: true } } } });
}

export async function listDisputes(sellerId: string) {
  return db.query.disputes.findMany({ where: eq(s.disputes.sellerId, sellerId), orderBy: desc(s.disputes.openedAt), with: { sale: { columns: { id: true, title: true, clientName: true } }, packets: true } });
}

export async function listNotices(sellerId: string) {
  return db.query.notices.findMany({ where: eq(s.notices.sellerId, sellerId), orderBy: desc(s.notices.createdAt) });
}

/** Proof coverage for one sale: does it have files, client acceptance, and tracking (goods only)? */
export function coverage(sale: { kind: string; proofs: { kind: string }[] }) {
  const has = (k: string) => sale.proofs.some((p) => p.kind === k);
  const checks = [has("file") || has("message"), has("acceptance"), ...(sale.kind === "physical" ? [has("tracking")] : [])];
  return { done: checks.filter(Boolean).length, total: checks.length };
}

export async function getHome(sellerId: string) {
  const [sales, events, openDisputes] = await Promise.all([
    listSales(sellerId),
    listEvents(sellerId, 8),
    db.query.disputes.findMany({ where: and(eq(s.disputes.sellerId, sellerId), notInArray(s.disputes.status, ["resolved_seller", "resolved_buyer", "closed"])) }),
  ]);
  const inFlight = sales.filter((x) => (IN_FLIGHT as readonly string[]).includes(x.status));
  const paidish = sales.filter((x) => x.paidAt);
  const covered = paidish.filter((x) => { const c = coverage(x); return c.done === c.total; });
  const nextRelease = inFlight.map((x) => x.expectedReleaseAt).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] ?? null;
  return {
    sales,
    events,
    openDisputes,
    fundsInFlightCents: inFlight.reduce((sum, x) => sum + x.amountCents, 0),
    nextRelease,
    nextReleaseSale: inFlight.find((x) => x.expectedReleaseAt?.getTime() === nextRelease?.getTime()) ?? null,
    proofCoverage: paidish.length ? Math.round((covered.length / paidish.length) * 100) : null,
    missingProof: inFlight.filter((x) => { const c = coverage(x); return c.done < c.total; }),
  };
}

/** The newest invoice that is out with a client and payable on PayPal's page (for "Pay as the client"). */
export async function latestPayableInvoice(sellerId: string) {
  const rows = await db
    .select({ url: s.invoices.payerViewUrl, number: s.invoices.invoiceNumber, clientName: s.sales.clientName, amountCents: s.sales.amountCents })
    .from(s.invoices)
    .innerJoin(s.sales, eq(s.sales.id, s.invoices.saleId))
    .where(and(eq(s.sales.sellerId, sellerId), eq(s.sales.status, "sent"), isNotNull(s.invoices.payerViewUrl)))
    .orderBy(desc(s.invoices.sentAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function salesByIds(sellerId: string, ids: string[]) {
  if (!ids.length) return [];
  return db.query.sales.findMany({ where: and(eq(s.sales.sellerId, sellerId), inArray(s.sales.id, ids)) });
}
