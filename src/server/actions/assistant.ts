"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireSeller } from "../auth";
import { askCleared } from "../ai/ask";
import { readUpload } from "../uploads";

type Result = { ok: true } | { ok: false; error: string };

/** A public demo: cap Ask Cleared's model use per hour across all visitors. */
const HOURLY_CAP = Number(process.env.ASK_HOURLY_CAP || 120);

/** "Ask Cleared": one message, maybe with a file. */
export async function askClearedAction(form: FormData): Promise<Result> {
  const seller = await requireSeller();
  const text = String(form.get("text") ?? "").trim().slice(0, 1000);
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!text && !hasFile) return { ok: false, error: "Write a message or attach a file." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.audit).where(and(eq(s.audit.kind, "ai.ask"), gte(s.audit.createdAt, new Date(Date.now() - 3_600_000))));
  if (n >= HOURLY_CAP) return { ok: false, error: "Cleared AI has answered a lot this hour. Try again in a little while." };
  const up = hasFile ? await readUpload(file) : null;
  if (up && "error" in up) return { ok: false, error: up.error };
  try {
    await askCleared(seller.id, text || `I've attached ${up!.name}.`, up);
  } catch (e) {
    console.error("askCleared failed", e);
    await db.insert(s.assistantMessages).values({ sellerId: seller.id, kind: "agent", body: { text: "I couldn't finish that just now. Nothing was changed. Try again." } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function forgetMemo(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown memo." };
  const seller = await requireSeller();
  await db.delete(s.memos).where(and(eq(s.memos.id, id), eq(s.memos.sellerId, seller.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}
