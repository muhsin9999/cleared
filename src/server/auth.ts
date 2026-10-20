// Data-access check used by every seller page, action and route handler.
import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { readSession } from "./session";

export async function currentSeller() {
  const session = await readSession();
  if (!session) return null;
  const seller = await db.query.sellers.findFirst({ where: eq(schema.sellers.id, session.sellerId) });
  return seller ?? null;
}

export async function requireSeller() {
  const seller = await currentSeller();
  if (!seller) redirect("/?signed_out=1");
  return seller;
}

export type Seller = NonNullable<Awaited<ReturnType<typeof currentSeller>>>;
