import "../../src/lib/net";
import { sql } from "drizzle-orm";
import { db } from "../../src/db";
const r = await db.execute(sql`select type, verification, outcome, error, count(*)::int n, max(received_at) last from webhook_deliveries group by 1,2,3,4 order by last desc limit 30`);
console.table(r);
process.exit(0);
