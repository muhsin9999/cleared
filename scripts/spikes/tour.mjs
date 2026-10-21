// Walks the Start here tour and screenshots each stop. Usage: node scripts/spikes/tour.mjs <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const shot = (n) => p.screenshot({ path: `${out}/tour-${n}.png`, fullPage: true });
await p.goto("http://localhost:3000"); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home");
await p.getByRole("button", { name: /open the dispute/i }).click();
await p.waitForURL(/\/cases\/[0-9a-f-]+/, { timeout: 60000 }); await p.waitForTimeout(1500); await shot("1-case-working");
await p.getByText(/Checked every claim|AI unavailable|Built from your proof locker/).first().waitFor({ timeout: 120000 }).catch(() => {});
await p.waitForTimeout(2500); await shot("2-case-drafted");
const approve = p.getByRole("button", { name: /approve & submit to paypal/i });
if (await approve.isEnabled()) { await approve.click(); await p.getByRole("button", { name: /^approve & submit$/i }).click(); await p.waitForTimeout(12000); await shot("3-case-submitted"); }
const decide = p.getByRole("button", { name: /play paypal/i });
if (await decide.count()) { await decide.click(); await p.waitForTimeout(8000); await shot("4-case-closed"); }
await p.goto("http://localhost:3000/home"); await p.waitForTimeout(800); await shot("5-home-after-1");
await p.getByRole("link", { name: /check the sale/i }).click(); await p.waitForURL("**/sales/new**"); await p.waitForTimeout(800); await shot("6-sale-prefilled");
await p.getByRole("button", { name: /check this sale/i }).click();
await p.getByRole("button", { name: /create invoice/i }).waitFor({ timeout: 60000 }); await p.waitForTimeout(800); await shot("7-sale-findings");
await p.getByRole("button", { name: /create invoice/i }).click(); await p.waitForURL("**/invoice", { timeout: 60000 }); await p.waitForTimeout(800); await shot("8-invoice");
await p.goto("http://localhost:3000/notices/new?sample=phishing"); await p.waitForTimeout(800); await shot("9-notice-prefilled");
await p.getByRole("button", { name: /check this email/i }).click(); await p.waitForURL(/\/notices\/[0-9a-f-]+/, { timeout: 60000 }); await p.waitForTimeout(800); await shot("10-notice-verdict");
await p.goto("http://localhost:3000/home"); await p.waitForTimeout(800); await shot("11-home-done");
await p.goto("http://localhost:3000/"); await p.locator("#for-judges").scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
await p.locator("#for-judges").screenshot({ path: `${out}/tour-12-landing-cta.png` });
console.log("done");
await b.close();
