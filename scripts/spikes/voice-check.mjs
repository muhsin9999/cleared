// Voice typing in Ask Cleared, with a stand-in recogniser (headless Chrome can't hear). Usage: node … <outdir>
import { chromium } from "@playwright/test";
const out = process.argv[2];
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  class Fake {
    start() { const say = (t, at) => setTimeout(() => this.onresult?.({ results: [[{ transcript: t }]] }), at); say("when does my", 300); say("when does my held money release", 900); this._t = setTimeout(() => {}, 1e9); }
    stop() { clearTimeout(this._t); setTimeout(() => this.onend?.(), 50); }
  }
  Object.defineProperty(window, "webkitSpeechRecognition", { value: Fake, configurable: true, writable: true });
  Object.defineProperty(window, "SpeechRecognition", { value: Fake, configurable: true, writable: true });
});
const page = await ctx.newPage();
const ok = (c, m) => console.log(c ? "PASS" : "FAIL", m);
await page.goto(BASE);
await page.getByRole("button", { name: /try the live demo/i }).first().click();
await page.waitForURL("**/home", { timeout: 60_000 }); await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: /^Ask/ }).first().click();
const mic = page.getByRole("button", { name: "Voice typing" });
await mic.waitFor({ timeout: 10_000 });
await page.screenshot({ path: `${out}/voice-1-idle.png` });
await mic.click(); await page.waitForTimeout(1200);
const box = page.getByLabel("Message Cleared AI");
ok((await box.inputValue()) === "when does my held money release", `spoken words fill the box ("${await box.inputValue()}")`);
ok(await page.getByRole("button", { name: "Stop voice typing" }).isVisible(), "the mic shows it is listening");
await page.screenshot({ path: `${out}/voice-2-listening.png` });
await page.getByRole("button", { name: "Stop voice typing" }).click(); await page.waitForTimeout(300);
ok(await mic.isVisible(), "stop returns to the mic");
ok((await page.locator("ol[aria-live] li").count()) <= 1, "nothing was sent without pressing Send");
// A browser without speech recognition never sees the button.
const plain = await (await browser.newContext({ storageState: await ctx.storageState() })).newPage();
await plain.addInitScript(() => { delete window.webkitSpeechRecognition; delete window.SpeechRecognition; });
await plain.goto(`${BASE}/home`); await plain.waitForLoadState("networkidle");
await plain.getByRole("button", { name: /^Ask/ }).first().click(); await plain.waitForTimeout(800);
ok((await plain.getByRole("button", { name: "Voice typing" }).count()) === 0, "no mic where the browser can't do it");
await browser.close();
