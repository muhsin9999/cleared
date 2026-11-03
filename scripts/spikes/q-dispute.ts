// One dispute as Cleared stores it, plus its newest events (read-only; live via render-db.mjs).
import "../../src/lib/net";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "../../src/db";
const d = await db.query.disputes.findFirst({ where: eq(s.disputes.paypalDisputeId, (process.env.DISPUTE ?? process.argv[2])) });
console.log(d?.status, d?.paypalStatus, d?.stage, d?.sellerId);
if (d) for (const e of await db.select().from(s.events).where(eq(s.events.sellerId, d.sellerId)).orderBy(desc(s.events.occurredAt)).limit(6)) console.log(e.occurredAt.toISOString().slice(11, 19), e.source, e.type, e.summary.slice(0, 80));
process.exit(0);
