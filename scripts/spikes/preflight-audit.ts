// Recent AI pre-flight runs on whichever DB DATABASE_URL points at: time, ms, findings, fixes.
import "../../src/lib/net";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "../../src/db";
const rows = await db.query.audit.findMany({ where: eq(s.audit.kind, "ai.preflight"), orderBy: desc(s.audit.createdAt), limit: 15 });
for (const r of rows) {
  const o = r.output as { ms?: number; findings?: { title: string; fix?: unknown }[]; raw?: { fix_value?: string }[] };
  console.log(r.createdAt.toISOString().slice(0, 16), `${o.ms}ms`, o.findings?.map((f) => f.title).join(" | "));
  for (const x of o.raw ?? []) if (x.fix_value) console.log("    fix:", x.fix_value.slice(0, 200));
}
process.exit(0);
