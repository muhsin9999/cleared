// Screenshots of the send-invoice, client-confirmation and approve modals. Usage: node … <outdir> [tag]
import { chromium } from "@playwright/test";
const [out, tag = "after"] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })).newPage();
await page.goto(BASE);
await page.getByRole("button", { name: /try the live demo/i }).first().click();
await page.waitForURL("**/home", { timeout: 60_000 });
// 1. Send the invoice
await page.goto(`${BASE}/sales/new?sample=1`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
await page.getByRole("button", { name: "Check this sale" }).click();
await page.getByRole("heading", { name: /To fix|Nothing left/ }).waitFor({ timeout: 60_000 });
await page.getByRole("button", { name: /Fix all/ }).click();
await page.getByRole("button", { name: "Create invoice" }).first().click();
await page.waitForURL("**/invoice", { timeout: 60_000 }); await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: /Send through PayPal/ }).click(); await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/${tag}-1-send-invoice.png` });
// 2 and 3. The case room
await page.goto(`${BASE}/home`);
const openCase = page.getByRole("link", { name: /Open the case/i }).first();
await openCase.waitFor({ timeout: 90_000 }); await openCase.click();
await page.getByRole("button", { name: "Approve and send to PayPal" }).waitFor({ timeout: 120_000 }); await page.waitForTimeout(1500);
const tile = page.getByRole("button", { name: /confirmed receipt/i }).first();
if (await tile.count()) { await tile.click(); await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${tag}-2-client-confirmation.png` }); await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
else console.log("no client-confirmation exhibit on this case");
await page.getByRole("button", { name: "Approve and send to PayPal" }).click(); await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/${tag}-3-approve-and-send.png` });
await browser.close();
