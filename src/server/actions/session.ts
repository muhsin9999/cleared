"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { DEMO_TAG, seedDemo } from "@/db/seed";
import { createSession, destroySession, readSession } from "../session";

// "Try the live demo": every visitor gets a private copy of Ada's workspace, so judges never see each
// other's changes. A returning visitor keeps their copy; the nightly clean-up removes copies after 48 hours.
export async function enterDemo() {
  const session = await readSession();
  if (session?.tag.startsWith(`${DEMO_TAG}-`)) {
    const existing = await db.query.sellers.findFirst({ where: eq(schema.sellers.id, session.sellerId), columns: { id: true } });
    if (existing) redirect("/home");
  }
  const tag = `${DEMO_TAG}-${randomBytes(5).toString("hex")}`;
  const { seller } = await seedDemo(db, tag);
  await createSession({ sellerId: seller, tag });
  redirect("/home");
}

// "Start as a new seller": an empty workspace that goes through onboarding.
export async function startNewSeller() {
  const tag = `ws-${randomBytes(4).toString("hex")}`;
  const [seller] = await db.insert(schema.sellers).values({ tag, name: "New seller", email: `${tag}@demo.cleared.app`, isDemo: true }).returning();
  await createSession({ sellerId: seller.id, tag });
  redirect("/onboarding");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
