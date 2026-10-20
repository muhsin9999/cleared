"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { DEMO_TAG, seedDemo } from "@/db/seed";
import { createSession, destroySession } from "../session";

// "Try the live demo": sign in as Ada, seeding her workspace if it is missing.
export async function enterDemo() {
  let ada = await db.query.sellers.findFirst({ where: eq(schema.sellers.tag, DEMO_TAG) });
  if (!ada) {
    await seedDemo(db);
    ada = await db.query.sellers.findFirst({ where: eq(schema.sellers.tag, DEMO_TAG) });
  }
  await createSession({ sellerId: ada!.id, tag: ada!.tag });
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
