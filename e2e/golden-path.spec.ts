// The judge path (docs/DEMO.md): check a sale, fix it, invoice through PayPal, get a dispute, watch the agent
// build the case, approve, and see it resolved. Uses simulated disputes so the real sandbox stock is kept.
import { expect, test } from "@playwright/test";
import { enterDemo, sandboxControls, watchErrors } from "./helpers";

test("judge path: sale → invoice → dispute → agent → approve → resolved", async ({ page }) => {
  const errors = watchErrors(page);
  await enterDemo(page);

  await test.step("pre-flight finds the risks and the fixes clear them", async () => {
    await page.goto("/sales/new");
    await page.getByRole("button", { name: /character sheet for a game studio/i }).click();
    await page.getByRole("button", { name: /check this sale/i }).click();
    await expect(page.getByText(/This sale is \d+× your average/)).toBeVisible();
    await expect(page.getByRole("button", { name: /create invoice/i })).toBeVisible({ timeout: 40_000 });
    // Accept every suggested fix, from the rules and from the AI.
    for (let i = 0; i < 10; i++) {
      const fix = page.locator("button:has(svg.lucide-wand-sparkles)").first();
      if (!(await fix.count())) break;
      await fix.click();
      await page.waitForTimeout(400);
    }
    await expect(page.getByText(/Ready to (send|invoice)/).first()).toBeVisible();
  });

  await test.step("invoice is created and sent through PayPal", async () => {
    await page.getByRole("button", { name: /create invoice/i }).click();
    await page.waitForURL("**/invoice");
    await expect(page.getByText("Total due")).toBeVisible();
    await page.getByRole("button", { name: /via PayPal/i }).click();
    await page.getByRole("button", { name: /^send invoice$/i }).click();
    await page.waitForURL(/\/sales\/[0-9a-f-]+\?sent=1/, { timeout: 60_000 });
  });

  await test.step("a dispute arrives and the agent investigates", async () => {
    const panel = await sandboxControls(page);
    await panel.getByRole("button", { name: /simulate a buyer dispute/i }).click();
    await page.waitForURL(/\/cases\/[0-9a-f-]+/);
    await expect(page.getByText(/Read the dispute|Starting the investigation/).first()).toBeVisible();
    await expect(page.getByText(/Checked every claim|AI unavailable/).first()).toBeVisible({ timeout: 150_000 });
    await expect(page.getByRole("button", { name: /approve & submit to paypal/i })).toBeVisible();
    await expect(page.getByText(/Exhibit [A-Z]/).first()).toBeVisible();
  });

  await test.step("seller approves; Cleared submits", async () => {
    await page.getByRole("button", { name: /approve & submit to paypal/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^approve & submit$/i }).click();
    await expect(page.getByText(/Submitted ✓|Sent to PayPal ✓/).first()).toBeVisible({ timeout: 60_000 });
  });

  await test.step("audit log explains the packet", async () => {
    await page.getByRole("link", { name: /why did cleared say this/i }).click();
    await expect(page.getByText(/Claim checker/).first()).toBeVisible();
    await page.goBack();
  });

  await test.step("the case resolves in Ada's favour", async () => {
    const panel = await sandboxControls(page);
    await panel.getByRole("button", { name: /resolve in ada/i }).click();
    await expect(page.getByText(/Closed in your favour/).first()).toBeVisible();
  });

  expect(errors, "uncaught browser errors").toEqual([]);
});
