// Screenshots of the 4 Nov wording and delivery changes (local server :3100, fake AI, test disputes). node … <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2], BASE = "http://localhost:3100";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto(BASE); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home", { timeout: 60_000 });
// Every sale page: note which delivery state each shows.
await p.goto(`${BASE}/sales`); await p.waitForLoadState("networkidle");
const hrefs = [...new Set(await p.locator('a[href^="/sales/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")).filter((h) => /^\/sales\/[0-9a-f-]{36}$/.test(h))))];
let i = 0;
for (const h of hrefs) {
  await p.goto(BASE + h); await p.waitForLoadState("networkidle"); await p.waitForTimeout(500);
  const title = await p.locator("h1").first().innerText();
  const card = await p.getByText(/Deliver to /).first().locator("xpath=ancestor::*[contains(@class,'rounded')][1]").innerText().catch(() => "");
  console.log(title, "|", card.replace(/\s+/g, " ").slice(0, 140));
  await p.screenshot({ path: `${out}/sale-${++i}.png`, fullPage: true });
}
// The new delivery step, end to end: copy the link, open it as the client, confirm, back to the sale.
await p.goto(`${BASE}/sales`); await p.waitForLoadState("networkidle");
await p.getByRole("link", { name: /Podcast cover art/ }).first().click(); await p.getByRole("button", { name: "Copy link" }).waitFor({ timeout: 30_000 }); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/deliver-1-sale.png`, fullPage: true });
const link = await p.locator("p.font-mono").first().innerText();
console.log("delivery link:", link);
const client = await (await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })).newPage();
await client.goto(link); await client.waitForLoadState("networkidle"); await client.screenshot({ path: `${out}/deliver-2-client.png`, fullPage: true });
await client.getByLabel(/name/i).first().fill("Sam Carter");
await client.getByRole("button", { name: /received|confirm/i }).first().click(); await client.waitForTimeout(1500);
await client.screenshot({ path: `${out}/deliver-3-thanks.png`, fullPage: true });
await p.reload(); await p.waitForLoadState("networkidle"); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/deliver-4-confirmed.png`, fullPage: true });
// The case room's first line.
await p.goto(`${BASE}/home`); await p.waitForLoadState("networkidle");
await p.getByRole("link", { name: /Open the case/i }).first().click({ timeout: 90_000 }); await p.getByText("Opening the case").first().waitFor({ timeout: 30_000 }).catch(() => console.log("no 'Opening the case' line")); await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/case-start.png` });
// The sale check.
await p.goto(`${BASE}/sales/new?sample=1`); await p.waitForLoadState("networkidle");
await p.getByRole("button", { name: "Check this sale" }).click();
await p.getByRole("heading", { name: /To fix|Nothing left/ }).waitFor({ timeout: 90_000 }); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/sale-check.png`, fullPage: true });
await b.close();
