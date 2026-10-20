"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";

export type MessageProofState = { error?: string; ok?: boolean };

// Saves agreed scope or client messages as written proof on a sale.
export async function addMessageProof(saleId: string, _prev: MessageProofState, form: FormData): Promise<MessageProofState> {
  const seller = await requireSeller();
  const sale = await db.query.sales.findFirst({ where: and(eq(s.sales.id, saleId), eq(s.sales.sellerId, seller.id)) });
  if (!sale) return { error: "Sale not found." };
  const text = String(form.get("text") ?? "").trim();
  if (text.length < 10) return { error: "Paste the message or agreement (at least a sentence)." };
  await db.insert(s.proofs).values({ saleId, kind: "message", label: String(form.get("label") ?? "").trim().slice(0, 120) || "Agreed scope", text: text.slice(0, 5000) });
  await db.insert(s.events).values({ sellerId: seller.id, saleId, source: "cleared", type: "PROOF.MESSAGE_ADDED", summary: "Agreed scope saved to the proof locker", verified: true });
  revalidatePath(`/sales/${saleId}`);
  return { ok: true };
}
