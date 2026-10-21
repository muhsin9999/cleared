import { expect, type Page } from "@playwright/test";

/** Lands on the public page and opens a private copy of Ada's demo workspace. */
export async function enterDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /try the live demo/i }).first().click();
  await page.waitForURL("**/home", { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: /Good to see you/ })).toBeVisible();
}

/** Opens the "Play the client" panel with the real-dispute switch off, so tests never use up the judges' stock. */
export async function sandboxControls(page: Page) {
  await page.getByRole("button", { name: /play the client|^client$/i }).click();
  const sw = page.getByRole("dialog").getByRole("switch");
  if ((await sw.count()) && (await sw.getAttribute("aria-checked")) === "true") await sw.click();
  return page.getByRole("dialog");
}

/** Collects uncaught page errors so a test can assert the browser stayed clean. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}
