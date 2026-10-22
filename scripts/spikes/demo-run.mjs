// Walks the demo's main path and screenshots each moment. Usage: node scripts/spikes/demo-run.mjs <outdir> [phone]
import { chromium } from "@playwright/test";
const [out, mode] = process.argv.slice(2);
const phone = mode === "phone";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await b.newPage(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const tag = phone ? "phone" : "desk";
const shot = (n, full = !phone) => p.screenshot({ path: `${out}/${tag}-${n}.png`, fullPage: full });
await p.goto("http://localhost:3000"); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home");
await p.waitForTimeout(1200); await shot("1-home-watching");
await p.getByRole("link", { name: /open the case/i }).waitFor({ timeout: 30000 }); await p.waitForTimeout(1500); await shot("2-home-dispute");
await p.getByRole("link", { name: /open the case/i }).click(); await p.waitForURL(/\/cases\/[0-9a-f-]+/);
await p.waitForTimeout(2500); await shot("3-case-start");
await p.waitForTimeout(3500); await shot("4-case-tools");
await p.getByRole("button", { name: /approve and send to paypal/i }).waitFor({ timeout: 60000 }); await p.waitForTimeout(1500); await shot("5-case-ready");
if (phone) { await shot("5b-case-ready-full", true); }
await p.getByRole("button", { name: /approve and send to paypal/i }).click(); await p.getByRole("button", { name: /^approve and send$/i }).click();
await p.getByRole("button", { name: /ask paypal to decide/i }).waitFor({ timeout: 60000 }); await p.waitForTimeout(800); await shot("6-case-sent");
await p.getByRole("button", { name: /ask paypal to decide/i }).click(); await p.waitForTimeout(5000); await shot("7-case-closed");
await p.goto("http://localhost:3000/home"); await p.waitForTimeout(1500); await shot("8-home-after");
console.log("done");
await b.close();
