// Screenshots the case screen while the agent works and once it's done, log open. Usage: node scripts/spikes/plan-shot.mjs <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000"); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home");
await p.getByRole("link", { name: /open the case/i }).click({ timeout: 30000 }); await p.waitForURL(/\/cases\//);
await p.getByText("write_plan").first().waitFor({ timeout: 60000 }); await p.waitForTimeout(4000);
await p.locator("aside").first().screenshot({ path: `${out}/plan-working.png` });
await p.getByRole("button", { name: /approve and send to paypal/i }).waitFor({ timeout: 90000 }); await p.waitForTimeout(1000);
await p.getByRole("button", { name: /steps in/i }).click(); await p.waitForTimeout(700);
await p.locator("aside").first().screenshot({ path: `${out}/plan-done.png` });
console.log("done"); await b.close();
