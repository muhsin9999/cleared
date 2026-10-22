// Prints the judge-mode dispute stock. Live: node --env-file=.env.local scripts/spikes/render-db.mjs scripts/spikes/pool.ts
import "../../src/lib/net";
import { sql } from "drizzle-orm";
import { db } from "../../src/db";
console.table(await db.execute(sql`select status, count(*)::int n from dispute_pool group by 1`));
process.exit(0);
