// One Drizzle client for the whole app, on Neon Postgres (pooled connection string in DATABASE_URL).
import "server-only";
import "@/lib/net";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Neon's pooler runs PgBouncer in transaction mode, which does not support prepared statements.
  return drizzle(postgres(url, { max: 5, prepare: false }), { schema });
}

const g = globalThis as unknown as { __clearedDb?: ReturnType<typeof create> };
export const db = (g.__clearedDb ??= create());
export { schema };
