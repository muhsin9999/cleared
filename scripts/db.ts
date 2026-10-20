// Applies migrations, and with `--seed` restores the demo workspace.
// Usage: tsx scripts/db.ts [--seed]   (uses DATABASE_URL)
import "../src/lib/net";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { seedDemo } from "../src/db/seed";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: "drizzle" });
console.log("migrations applied");
if (process.argv.includes("--seed")) console.log("seeded:", await seedDemo(db));
await client.end();
