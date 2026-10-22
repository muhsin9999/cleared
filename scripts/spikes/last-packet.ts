// Prints the newest packet's steps, plan, model and cost. Usage: npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/spikes/last-packet.ts
import "../../src/lib/net";
import { desc } from "drizzle-orm";
import { db, schema as s } from "../../src/db";
import { costOf } from "../../src/lib/ai-cost";
const p = await db.query.packets.findFirst({ orderBy: desc(s.packets.createdAt) });
const audit = await db.query.audit.findFirst({ where: (a, { eq }) => eq(a.subjectId, p!.id), orderBy: desc(s.audit.createdAt) });
for (const t of p!.trace ?? []) console.log(t.turn ?? "-", t.tool.padEnd(18), t.detail ?? t.label);
console.log("plan:", p!.trace?.find((t) => t.plan)?.plan);
const out = audit?.output as { usage?: { input: number; output: number; cached: number }; ms?: number } | undefined;
console.log("model:", p!.model, "usage:", out?.usage, "ms:", out?.ms, "cost $", costOf(out?.usage, p!.model ?? undefined));
process.exit(0);
