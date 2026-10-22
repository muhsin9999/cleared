// Captures the agent's finish celebration: the sale check's last beat and the ring crossing into "ready".
// Usage: node scripts/spikes/burst-shot.mjs <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000"); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home");
await p.goto("http://localhost:3000/sales/new?sample=1"); await p.getByRole("button", { name: /check this sale/i }).click();
const checked = p.getByText("Checked", { exact: true });
await checked.waitFor({ timeout: 30000 });
const box = await checked.boundingBox();
const clip = { x: box.x - 90, y: box.y - 45, width: 330, height: 120 };
for (const t of [120, 320]) { await p.waitForTimeout(t === 120 ? 120 : 200); await p.screenshot({ path: `${out}/burst-check-${t}.png`, clip }); }
await p.getByRole("button", { name: /create invoice/i }).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(600);
await p.getByRole("button", { name: /fix all/i }).click();
const ring = p.getByRole("meter").first().locator("..");
for (const t of [120, 300]) { await p.waitForTimeout(t === 120 ? 120 : 180); await ring.screenshot({ path: `${out}/burst-ring-${t}.png` }); }
console.log("done"); await b.close();
