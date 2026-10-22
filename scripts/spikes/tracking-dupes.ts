// Counts tracking proofs that would break the proofs_tracking_unique index (same sale, same tracking number).
import "../../src/lib/net";
import { sql } from "drizzle-orm";
import { db } from "../../src/db";
const r = await db.execute(sql`select count(*)::int as dupes from (select sale_id, meta->>'trackingNumber' n from proofs where kind = 'tracking' group by 1, 2 having count(*) > 1) d`);
console.log("duplicate tracking claims:", r[0]?.dupes);
process.exit(0);
