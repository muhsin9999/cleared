// Runs the investigator on the landing page's case (evals scenario "bakery-scene") and saves everything it
// did to evals/scene-run.json, so the agent scene shows a real run rather than invented output.
//   npx tsx --env-file-if-exists=.env.local scripts/record-scene.ts [runs]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { costOf } from "../src/lib/ai-cost";
import { checkClaims } from "../src/lib/claim-checker";
import { investigate, packetEffort, packetModel, PROMPT_VERSION } from "../src/server/ai/investigate";
import { SCENARIOS } from "../evals/scenarios";

const scenario = SCENARIOS.find((s) => s.id === "bakery-scene")!;
const model = packetModel(scenario.caseFile.dispute.amountCents);
const runs = [];
for (let i = 0; i < Number(process.argv[2] ?? 3); i++) {
  const steps: string[] = [];
  const r = await investigate(scenario.caseFile, { model, effort: packetEffort(), onStep: ({ label }) => steps.push(label) });
  const run = {
    recommendation: r.recommendation,
    rationale: r.parsed.rationale,
    kept: r.kept.map((c) => ({ text: c.text, exhibits: c.exhibits })),
    removed: r.removed.map((c) => ({ text: c.text, exhibits: c.exhibits, reasons: c.reasons })),
    injections: r.injections,
    steps,
    seconds: Math.round(r.ms / 100) / 10,
    cost: costOf(r.usage, model),
  };
  console.log(JSON.stringify(run, null, 2));
  runs.push(run);
}
// The scene's struck line: an invented claim put through the real claim checker, to show what it catches.
const c = scenario.caseFile;
const invented = [{ text: "Tolu was sent a reminder on Oct 18, 2026.", exhibits: ["C"] }];
const checkerDemo = checkClaims(invented as Parameters<typeof checkClaims>[0], c.exhibits, { amountCents: c.sale.amountCents, invoiceAmounts: [], extraDates: [c.sale.paidAt, c.sale.deliveredAt, c.dispute.openedAt].filter(Boolean).map((x) => x!.toISOString()) });
// The page quotes the latest full eval on the same model ("Right call in 39 of 39 tests"), so copy its totals.
const latest = `evals/results/latest-${model}.json`;
const s = existsSync(latest) ? JSON.parse(readFileSync(latest, "utf8")).summary : null;
const evals = s && { ranAt: s.ranAt, runs: s.scenarios, recommendationCorrect: s.recommendationCorrect, injectionResisted: s.injectionResisted, injectionCases: s.injectionCases };
writeFileSync("evals/scene-run.json", JSON.stringify({ model, promptVersion: PROMPT_VERSION, ranAt: new Date().toISOString(), runs, checkerDemo, evals }, null, 2));
process.exit(0);
