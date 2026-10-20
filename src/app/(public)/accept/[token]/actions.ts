"use server";

import { eq, and, notInArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/db";
import type { AcceptanceRecord } from "./record";

export type AcceptState =
  | { status: "idle" }
  | { status: "accepted"; record: AcceptanceRecord }
  | { status: "reported"; at: string }
  | { status: "error"; message: string };

const NOT_FOUND: AcceptState = { status: "error", message: "This link is no longer active. Ask the seller to send it again." };

async function requestFingerprint() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const userAgent = (h.get("user-agent") ?? "unknown").slice(0, 400);
  return { ip, userAgent };
}

function findSale(token: string) {
  return db.query.sales.findFirst({ where: eq(schema.sales.acceptanceToken, token), with: { proofs: true } });
}

const optionalName = z
  .string()
  .trim()
  .max(120)
  .transform((v) => v || undefined)
  .optional();

// "Yes, I received the work": a timestamped acceptance proof, the sale marked accepted, and an event on the seller's timeline.
export async function acceptWork(token: string, _prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const parsed = optionalName.safeParse(formData.get("name") ?? undefined);
  if (!parsed.success) return { status: "error", message: "Please keep your name under 120 characters." };

  const sale = await findSale(token);
  if (!sale) return NOT_FOUND;

  const existing = sale.proofs.find((p) => p.kind === "acceptance");
  if (existing) {
    const meta = (existing.meta ?? {}) as Partial<AcceptanceRecord>;
    return { status: "accepted", record: { at: existing.occurredAt.toISOString(), name: meta.name, ip: meta.ip ?? "unknown", userAgent: meta.userAgent ?? "unknown" } };
  }

  const { ip, userAgent } = await requestFingerprint();
  const name = parsed.data;
  const at = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(schema.proofs).values({
      saleId: sale.id,
      kind: "acceptance",
      label: "Client confirmed receipt",
      meta: { ip, userAgent, ...(name ? { name } : {}) },
      occurredAt: at,
    });
    await tx
      .update(schema.sales)
      .set({ status: "accepted" })
      .where(and(eq(schema.sales.id, sale.id), notInArray(schema.sales.status, ["released", "disputed", "refunded"])));
    await tx.insert(schema.events).values({
      sellerId: sale.sellerId,
      saleId: sale.id,
      source: "cleared",
      type: "CLIENT.ACCEPTED",
      summary: `${sale.clientName} confirmed they received the work`,
      verified: true,
      payload: { name: name ?? null },
      occurredAt: at,
    });
  });

  return { status: "accepted", record: { at: at.toISOString(), name, ip, userAgent } };
}

const problemSchema = z.object({
  note: z.string().trim().min(3, "Tell the seller a little about what's wrong.").max(1000, "Please keep it under 1,000 characters."),
  name: optionalName,
});

// "Something's wrong": an early warning on the seller's timeline, before anyone opens a PayPal dispute.
export async function reportProblem(token: string, _prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const parsed = problemSchema.safeParse({ note: formData.get("note") ?? "", name: formData.get("name") ?? undefined });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form." };

  const sale = await findSale(token);
  if (!sale) return NOT_FOUND;

  const { ip, userAgent } = await requestFingerprint();
  const { note, name } = parsed.data;
  const at = new Date();
  const short = note.length > 140 ? `${note.slice(0, 137).trimEnd()}…` : note;

  await db.insert(schema.events).values({
    sellerId: sale.sellerId,
    saleId: sale.id,
    source: "cleared",
    type: "CLIENT.REPORTED_PROBLEM",
    summary: `${sale.clientName} reported a problem: ${short}`,
    verified: true,
    payload: { note, name: name ?? null, ip, userAgent },
    occurredAt: at,
  });

  return { status: "reported", at: at.toISOString() };
}
