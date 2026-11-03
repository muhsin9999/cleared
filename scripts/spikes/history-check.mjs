// Chat history in Ask Cleared: two conversations, switch between them. Usage: node … <outdir> (local server :3100)
import { chromium } from "@playwright/test";
const out = process.argv[2], BASE = process.env.BASE_URL ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
const ok = (c, m) => console.log(c ? "PASS" : "FAIL", m);
await p.goto(BASE); await p.getByRole("button", { name: /try the live demo/i }).first().click(); await p.waitForURL("**/home", { timeout: 60_000 });
const ask = async (q) => {
  await p.getByLabel("Message Cleared AI").fill(q); await p.getByRole("button", { name: "Send" }).click();
  await p.getByText("Cleared AI is looking…").waitFor({ state: "detached", timeout: 60_000 });
  await p.waitForFunction(() => document.querySelectorAll('[role="dialog"] ol > li').length >= 2, null, { timeout: 30_000 }); await p.waitForTimeout(500);
};
await p.getByRole("button", { name: /^Ask/ }).first().click(); await p.waitForTimeout(600);
await ask("Which client paid me the most?");
await p.getByRole("button", { name: "New chat" }).click(); await p.waitForTimeout(300);
ok(!(await p.getByText("Which client paid me the most?").count()), "New chat opens an empty conversation");
await ask("Anything I should chase today?");
await p.getByRole("button", { name: "Past conversations" }).click(); await p.waitForTimeout(400);
const items = await p.locator('section[aria-label="Past conversations"] li').allInnerTexts();
ok(items.length === 2, `History lists 2 conversations: ${items.map((t) => t.split("\n")[0]).join(" | ")}`);
await p.screenshot({ path: `${out}/history-list.png` });
await p.getByRole("button", { name: /Which client paid me the most/ }).click(); await p.waitForTimeout(400);
ok((await p.getByText("Which client paid me the most?").count()) === 1 && !(await p.getByText("Anything I should chase today?").count()), "picking it shows that conversation only");
await p.screenshot({ path: `${out}/history-switched.png` });
await p.reload(); await p.waitForLoadState("networkidle"); await p.getByRole("button", { name: /^Ask/ }).first().click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "Past conversations" }).click(); await p.waitForTimeout(400);
ok((await p.locator('section[aria-label="Past conversations"] li').count()) === 2, "history survives a reload");
await b.close();
