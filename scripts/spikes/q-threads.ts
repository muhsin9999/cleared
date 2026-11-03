// The newest Ask Cleared messages with their conversation (dev DB unless run through render-db.mjs).
import "../../src/lib/net";
import { desc } from "drizzle-orm";
import { db, schema as s } from "../../src/db";
for (const m of await db.select().from(s.assistantMessages).orderBy(desc(s.assistantMessages.createdAt)).limit(6))
  console.log(m.createdAt.toISOString().slice(11, 19), m.thread?.slice(0, 8) ?? "null", m.kind, JSON.stringify(m.body).slice(0, 60));
process.exit(0);
