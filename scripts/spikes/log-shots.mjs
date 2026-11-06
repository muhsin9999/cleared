// The agent log while it works and after (local :3100, fake AI, test disputes). node … <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2], BASE = "http://localhost:3100";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto(BASE); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home", { timeout: 60_000 });
await p.getByRole("link", { name: /Open the case/i }).first().click({ timeout: 90_000 });
for (const t of [14000, 20000, 25000]) { await p.waitForTimeout(t === 14000 ? 14000 : t === 20000 ? 6000 : 5000); await p.screenshot({ path: `${out}/log-working-${t}.png` }); }
await p.getByRole("button", { name: "Approve and send to PayPal" }).waitFor({ timeout: 120_000 }); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/log-done.png` });
await p.getByRole("button", { name: /steps in/ }).click(); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/log-expanded.png` });
await b.close();
