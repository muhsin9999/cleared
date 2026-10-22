// Screenshots /architecture: map, a selected node, a journey mid-play, trust, decisions, and the phone view.
// Usage: node scripts/spikes/arch-shot.mjs <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000/architecture"); await p.waitForTimeout(2000);
await p.screenshot({ path: `${out}/arch-1-map.png` });
await p.locator(".react-flow__node-arch").filter({ hasText: "draftPacket" }).click(); await p.waitForTimeout(700);
await p.screenshot({ path: `${out}/arch-2-node.png` });
await p.getByRole("button", { name: "Close" }).click();
await p.getByRole("button", { name: "Journeys", exact: true }).click(); await p.getByRole("button", { name: "Pause" }).click();
await p.getByRole("button", { name: "Step 4", exact: true }).click(); await p.waitForTimeout(1200);
await p.screenshot({ path: `${out}/arch-3-journey.png` });
await p.getByRole("button", { name: "Trust", exact: true }).click(); await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/arch-4-trust.png` });
await p.getByRole("button", { name: "Decisions", exact: true }).click(); await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/arch-5-decisions.png` });
const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ph.goto("http://localhost:3000/architecture"); await ph.waitForTimeout(1500);
await ph.screenshot({ path: `${out}/arch-6-phone.png` });
await ph.getByText("Agent · draftPacket").first().click(); await ph.waitForTimeout(800);
await ph.screenshot({ path: `${out}/arch-7-phone-sheet.png` });
console.log("done"); await b.close();
