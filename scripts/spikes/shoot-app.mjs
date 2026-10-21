// Screenshots every app page on desktop and phone, for design review. Usage: node scripts/spikes/shoot-app.mjs <outdir> [tag]
import { chromium } from "@playwright/test";
const out = process.argv[2], tag = process.argv[3] ?? "before";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE);
await page.getByRole("button", { name: /try the live demo/i }).first().click();
await page.waitForURL("**/home", { timeout: 60_000 });
const sale = await page.locator('a[href^="/sales/"]:not([href="/sales/new"])').first().getAttribute("href");
const pages = ["/home", "/sales", sale, "/sales/new", "/cases", "/activity", "/notices/new", "/settings", "/settings/audit", ...(process.env.EXTRA ?? "").split(",").filter(Boolean)];
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, storageState: await ctx.storageState() });
const pp = await phone.newPage();
for (const [i, p] of pages.entries()) {
  const name = `${tag}-${String(i).padStart(2, "0")}-${p.replace(/\W+/g, "_")}`;
  await page.goto(BASE + p); await page.waitForLoadState("networkidle"); await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-d.png`, fullPage: true });
  await pp.goto(BASE + p); await pp.waitForLoadState("networkidle"); await pp.waitForTimeout(600);
  await pp.screenshot({ path: `${out}/${name}-m.png`, fullPage: true });
  console.log(name);
}
console.log("sale", sale);
await browser.close();
