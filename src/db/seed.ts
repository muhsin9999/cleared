// Maya Brooks's demo workspace. Dates are relative to the time of seeding so the story never goes stale.
// Seeded history is written as Cleared’s own record (source "cleared", unverified): only events PayPal
// really sent may show "From PayPal".
import { and, eq, inArray, isNotNull, lt, ne } from "drizzle-orm";
import { deleteFiles, staticKey } from "../server/storage";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as s from "./schema";

const DAY = 86_400_000;
const at = (days: number, hour = 10) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<any, typeof s>;

export const DEMO_TAG = "ada";

// Real files for Maya's locker, rendered by scripts/demo-art and served from public/demo, so every proof opens.
const FILES: Record<string, number> = { "night-shift-cover-final.png": 214_008, "summer-static-cover-final.png": 630_472, "summer-static-sketch-v1.png": 243_735, "summer-static-cover-layers.pdf": 683_715, "logo-refresh-final.png": 79_162, "pet-portrait-final.png": 131_601, "twitch-emotes-3-final.png": 113_403 };
const file = (fileName: string, mimeType = "image/png") => ({ fileName, fileKey: staticKey(`demo/${fileName}`), mimeType, sizeBytes: FILES[fileName] });

/** Deletes demo workspaces (and their R2 files) created more than `hours` ago. Maya's base workspace stays. */
export async function cleanupDemoWorkspaces(db: Db, hours = 48) {
  const cutoff = new Date(Date.now() - hours * 3_600_000);
  const stale = await db.select({ id: s.sellers.id }).from(s.sellers).where(and(eq(s.sellers.isDemo, true), lt(s.sellers.createdAt, cutoff), ne(s.sellers.tag, DEMO_TAG)));
  if (!stale.length) return { removed: 0, files: 0 };
  const ids = stale.map((r) => r.id);
  const files = await db
    .select({ key: s.proofs.fileKey })
    .from(s.proofs)
    .innerJoin(s.sales, eq(s.sales.id, s.proofs.saleId))
    .where(and(inArray(s.sales.sellerId, ids), isNotNull(s.proofs.fileKey)));
  const keys = files.map((f) => f.key!).filter(Boolean);
  if (keys.length) await deleteFiles(keys).catch((e) => console.warn("R2 clean-up failed; continuing", (e as Error).message));
  await db.delete(s.sellers).where(inArray(s.sellers.id, ids));
  return { removed: ids.length, files: keys.length };
}

export async function seedDemo(db: Db, tag = DEMO_TAG) {
  // Remove the old workspace's uploaded files from R2 before its rows disappear.
  const old = await db
    .select({ key: s.proofs.fileKey })
    .from(s.proofs)
    .innerJoin(s.sales, eq(s.sales.id, s.proofs.saleId))
    .innerJoin(s.sellers, eq(s.sellers.id, s.sales.sellerId))
    .where(and(eq(s.sellers.tag, tag), isNotNull(s.proofs.fileKey)));
  const keys = old.map((r) => r.key!).filter(Boolean);
  if (keys.length) await deleteFiles(keys).catch((e) => console.warn("R2 clean-up failed; continuing", (e as Error).message));
  await db.delete(s.sellers).where(eq(s.sellers.tag, tag));

  const [ada] = await db
    .insert(s.sellers)
    .values({
      tag,
      name: "Maya Brooks",
      businessName: "Maya Brooks Studio",
      email: "maya@mayabrooks.studio",
      sells: "digital",
      typicalPriceCents: 6_000,
      typicalDeliveryDays: 7,
      takesDeposits: true,
      accountOpenedAt: at(-74),
      isDemo: true,
      onboardedAt: at(-74),
    })
    .returning();

  const released = [
    { clientName: "Bloom Bakery", clientEmail: "hello@bloombakery.example", title: "Logo refresh", description: "Refreshed wordmark and two color variants, delivered as SVG and PNG.", kind: "digital" as const, amountCents: 8_000, paidAt: at(-52) },
    { clientName: "Jonas Miller", clientEmail: "jonas@miller.example", title: "Pet portrait", description: "Digital portrait of a golden retriever, 3000×3000 PNG.", kind: "digital" as const, amountCents: 6_000, paidAt: at(-38) },
    { clientName: "Rowan Hale", clientEmail: "rowan@hale.example", title: "Twitch emotes ×3", description: "Three custom emotes at 112, 56 and 28 px.", kind: "digital" as const, amountCents: 4_500, paidAt: at(-21) },
  ];
  for (const r of released) {
    const [sale] = await db
      .insert(s.sales)
      .values({ ...r, sellerId: ada.id, status: "released", readinessScore: 88, deliveredAt: new Date(r.paidAt.getTime() + 4 * DAY), completedMarkedAt: new Date(r.paidAt.getTime() + 4 * DAY), expectedReleaseAt: new Date(r.paidAt.getTime() + 11 * DAY), releasedAt: new Date(r.paidAt.getTime() + 11 * DAY), createdAt: new Date(r.paidAt.getTime() - DAY) })
      .returning();
    const delivered = new Date(r.paidAt.getTime() + 4 * DAY);
    await db.insert(s.proofs).values([
      { saleId: sale.id, kind: "file", label: "Final files", ...file(`${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-final.png`), occurredAt: delivered },
      { saleId: sale.id, kind: "acceptance", label: "Client confirmed receipt", meta: { name: r.clientName, ip: "198.51.100.x", userAgent: "Chrome 141 on macOS" }, occurredAt: new Date(delivered.getTime() + 3 * 3_600_000) },
    ]);
    await db.insert(s.events).values([
      { sellerId: ada.id, saleId: sale.id, source: "cleared", type: "INVOICING.INVOICE.PAID", summary: `${r.clientName} paid $${r.amountCents / 100}`, verified: false, occurredAt: r.paidAt },
      { sellerId: ada.id, saleId: sale.id, source: "cleared", type: "FUNDS.RELEASED", summary: `$${r.amountCents / 100} from ${r.clientName} is available`, verified: true, occurredAt: new Date(r.paidAt.getTime() + 11 * DAY) },
    ]);
  }

  // The sale judges dispute: paid, delivered, accepted, and still on hold.
  const [cover] = await db
    .insert(s.sales)
    .values({
      sellerId: ada.id,
      clientName: "Golden Hour Records",
      clientEmail: "studio@goldenhour.example",
      title: "Album cover: “Summer Static”",
      description: "Square album cover, 3000×3000 px, with one layered source file. Two revision rounds included. Delivered within 10 days of payment.",
      kind: "digital",
      amountCents: 25_000,
      status: "accepted",
      readinessScore: 94,
      paypalCaptureId: "SEEDED-CAPTURE",
      paidAt: at(-6, 9),
      deliveredAt: at(-2, 15),
      completedMarkedAt: at(-1, 9),
      expectedReleaseAt: at(6, 9),
      acceptanceToken: `seed-${tag}-cover`,
      createdAt: at(-7),
    })
    .returning();
  await db.insert(s.invoices).values({
    saleId: cover.id,
    invoiceNumber: "0007",
    status: "PAID",
    paypalInvoiceId: `SEED-${tag}-0007`,
    draft: {
      items: [{ name: "Album cover artwork", description: "3000×3000 px PNG + layered source PDF, 2 revision rounds", quantity: "1", unitAmount: "250.00" }],
      note: "Final files delivered within 10 days of payment.",
      terms: "Revisions: 2 rounds. Refunds available until the first sketch is approved.",
    },
    sentAt: at(-7),
    paidAt: at(-6, 9),
  });
  await db.insert(s.proofs).values([
    { saleId: cover.id, kind: "message", label: "Agreed scope (email thread)", text: "Square cover, retro tape aesthetic, 2 revision rounds, final PNG + layered source (PDF).", occurredAt: at(-7, 12) },
    { saleId: cover.id, kind: "file", label: "Sketch v1", ...file("summer-static-sketch-v1.png"), occurredAt: at(-4, 16) },
    { saleId: cover.id, kind: "file", label: "Final cover", ...file("summer-static-cover-final.png"), occurredAt: at(-2, 15) },
    { saleId: cover.id, kind: "file", label: "Layered source", ...file("summer-static-cover-layers.pdf", "application/pdf"), occurredAt: at(-2, 15) },
    { saleId: cover.id, kind: "acceptance", label: "Client confirmed receipt", meta: { name: "Jordan L., Golden Hour Records", ip: "73.162.xx.xx", userAgent: "Safari 19 on iPhone" }, occurredAt: at(-2, 18) },
  ]);
  await db.insert(s.events).values([
    { sellerId: ada.id, saleId: cover.id, source: "cleared", type: "INVOICING.INVOICE.PAID", summary: "Golden Hour Records paid $250", verified: false, occurredAt: at(-6, 9) },
    { sellerId: ada.id, saleId: cover.id, source: "cleared", type: "PROOF.FILES_ADDED", summary: "Final files added to the proof locker", verified: true, occurredAt: at(-2, 15) },
    { sellerId: ada.id, saleId: cover.id, source: "cleared", type: "CLIENT.ACCEPTED", summary: "Golden Hour Records confirmed they received the work", verified: true, occurredAt: at(-2, 18) },
    { sellerId: ada.id, saleId: cover.id, source: "cleared", type: "SALE.COMPLETED_MARKED", summary: "Marked completed in PayPal: release starts in 7 days", verified: true, occurredAt: at(-1, 9) },
  ]);

  // Paid and delivered, waiting for the client to confirm: the sale where a visitor copies the delivery link, opens
  // it as the client and confirms, and watches the proof land.
  const [podcast] = await db
    .insert(s.sales)
    .values({
      sellerId: ada.id,
      clientName: "Night Shift Podcast",
      clientEmail: "hello@nightshiftpod.example",
      title: "Podcast cover art",
      description: "Square podcast cover, 3000×3000 px PNG. One revision round. Delivered within 7 days of payment.",
      kind: "digital",
      amountCents: 11_000,
      status: "delivered",
      readinessScore: 92,
      paidAt: at(-3, 10),
      deliveredAt: at(-1, 16),
      acceptanceToken: `seed-${tag}-podcast`,
      createdAt: at(-4),
    })
    .returning();
  await db.insert(s.invoices).values({
    saleId: podcast.id,
    invoiceNumber: "0009",
    status: "PAID",
    paypalInvoiceId: `SEED-${tag}-0009`,
    draft: { items: [{ name: "Podcast cover art", description: "3000×3000 px PNG, 1 revision round", quantity: "1", unitAmount: "110.00" }], note: "Delivered within 7 days of payment.", terms: "Revisions: 1 round. Refunds available until the first draft is approved." },
    sentAt: at(-4),
    paidAt: at(-3, 10),
  });
  await db.insert(s.proofs).values([
    { saleId: podcast.id, kind: "message", label: "Agreed scope (email)", text: "Square cover for Night Shift, night-sky look, 3000×3000 PNG, one revision round.", occurredAt: at(-4, 11) },
    { saleId: podcast.id, kind: "file", label: "Final cover", ...file("night-shift-cover-final.png"), occurredAt: at(-1, 16) },
  ]);
  await db.insert(s.events).values([
    { sellerId: ada.id, saleId: podcast.id, source: "cleared", type: "INVOICING.INVOICE.PAID", summary: "Night Shift Podcast paid $110", verified: false, occurredAt: at(-3, 10) },
    { sellerId: ada.id, saleId: podcast.id, source: "cleared", type: "PROOF.FILES_ADDED", summary: "Final files added to the proof locker", verified: true, occurredAt: at(-1, 16) },
  ]);

  // An invoice that is out and unpaid.
  const [deposit] = await db
    .insert(s.sales)
    .values({
      sellerId: ada.id,
      clientName: "Kestrel Press",
      clientEmail: "editors@kestrel.example",
      title: "Book illustrations (deposit)",
      description: "50% deposit for 6 interior illustrations, line art with one tone.",
      kind: "service",
      amountCents: 15_000,
      depositPercent: 50,
      status: "sent",
      readinessScore: 86,
      deliveryDueAt: at(16),
      createdAt: at(-1, 14),
    })
    .returning();
  await db.insert(s.invoices).values({
    saleId: deposit.id,
    invoiceNumber: "0008",
    status: "SENT",
    draft: { items: [{ name: "Interior illustrations: deposit (50%)", description: "6 illustrations, line art + one tone", quantity: "1", unitAmount: "150.00" }] },
    sentAt: at(-1, 14),
  });
  await db.insert(s.events).values({ sellerId: ada.id, saleId: deposit.id, source: "cleared", type: "INVOICING.INVOICE.SENT", summary: "Invoice #0008 sent to Kestrel Press", verified: true, occurredAt: at(-1, 14) });

  return { seller: ada.id, sales: released.length + 3 };
}
