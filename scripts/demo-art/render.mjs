// Renders the demo workspace's proof files (public/demo) so Maya's locker holds real files. Run: node scripts/demo-art/render.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const out = here("../../public/demo/");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1500, height: 1500 }, deviceScaleFactor: 2 });
for (const [id, name] of [["cover", "summer-static-cover-final"], ["sketch", "summer-static-sketch-v1"], ["logo", "logo-refresh-final"], ["pet", "pet-portrait-final"], ["emotes", "twitch-emotes-3-final"]]) {
  await page.goto(`file://${here("art.html")}?id=${id}`);
  await page.screenshot({ path: `${out}${name}.png` });
}
await page.goto(`file://${here("layers.html")}`);
await page.pdf({ path: `${out}summer-static-cover-layers.pdf`, format: "A4", printBackground: true });
await browser.close();
