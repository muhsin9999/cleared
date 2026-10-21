import { eq } from "drizzle-orm";
import { db, schema as s } from "../src/db";
import { preflight } from "../src/lib/preflight";
import { aiPreflight } from "../src/server/ai/preflight";
const ada = await db.query.sellers.findFirst({ where: eq(s.sellers.tag, "ada") });
const history = { pastSales: 4, averageCents: 10_875, accountAgeDays: 74 };
for (const draft of [
  { clientName: "Northwind Games", clientEmail: "art@northwind.example", title: "Character sheet: 3 poses", description: "Character sheet for our game's main hero", kind: "digital" as const, amountCents: 40_000, depositPercent: null, deliveryDays: null, refundTerms: "" },
  { clientName: "Kai", clientEmail: "kai@example.com", title: "Followers boost package", description: "10,000 Instagram followers delivered in 48 hours, guaranteed results or money back", kind: "service" as const, amountCents: 30_000, depositPercent: null, deliveryDays: 2, refundTerms: "Full refund anytime" },
]) {
  const t = Date.now();
  const f = await aiPreflight(ada!.id, draft, history, preflight(draft, history).findings);
  console.log(`\n${draft.title} — ${Date.now() - t} ms`);
  for (const x of f) console.log(` [${x.severity}] ${x.title} (${x.ruleRef}) — ${x.reason}${x.fix ? `\n     fix: ${x.fix.label} → ${JSON.stringify(x.fix.patch).slice(0, 140)}` : ""}`);
}
process.exit(0);
