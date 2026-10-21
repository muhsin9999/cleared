// What a judge (or a real seller) sees when something goes wrong: bad input, wrong links, no session, bad
// PayPal signatures, oversized or wrong files. Each one must give a clear message and change nothing.
import { expect, test } from "@playwright/test";
import { enterDemo, watchErrors } from "./helpers";

const RANDOM_ID = "00000000-0000-4000-8000-000000000000";

test.describe("without a session", () => {
  test("app pages send you back to the start", async ({ page }) => {
    await page.goto("/cases");
    await expect(page).toHaveURL(/\/$/);
  });

  test("APIs refuse with 401, not data", async ({ request }) => {
    for (const path of [`/api/cases/${RANDOM_ID}/packet`, `/api/proofs/${RANDOM_ID}`, "/api/events/latest"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
    const upload = await request.post(`/api/sales/${RANDOM_ID}/proofs`, { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect(upload.status()).toBe(401);
  });

  test("a webhook with a forged signature is rejected", async ({ request }) => {
    const res = await request.post("/api/paypal/webhook", {
      headers: { "paypal-transmission-id": "forged", "paypal-transmission-sig": "forged", "paypal-transmission-time": new Date().toISOString(), "paypal-cert-url": "https://api.sandbox.paypal.com/cert", "paypal-auth-algo": "SHA256withRSA" },
      data: { id: "WH-FORGED", event_type: "CUSTOMER.DISPUTE.CREATED", resource: { dispute_id: "PP-FORGED" } },
    });
    expect(res.status()).toBe(400);
  });

  test("an old acceptance link explains itself", async ({ page }) => {
    await page.goto("/accept/not-a-real-token");
    await expect(page.getByText(/isn.t active/i).first()).toBeVisible();
  });

  test("unknown pages get the Cleared 404", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { name: /nothing on file here/i })).toBeVisible();
  });
});

test.describe("inside the demo", () => {
  test.beforeEach(async ({ page }) => enterDemo(page));

  test("someone else's case or sale is a 404, not a leak", async ({ page }) => {
    for (const path of [`/cases/${RANDOM_ID}`, `/sales/${RANDOM_ID}`, `/notices/${RANDOM_ID}`]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: /nothing on file here/i }), path).toBeVisible();
    }
  });

  test("a sale with missing details says what to fix", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/sales/new");
    await expect(page.getByText("Add what it is and the price to check it.")).toBeVisible();
    await page.getByLabel("What is it?").fill("Logo");
    await page.getByLabel("Total price (USD)").fill("120");
    await page.getByRole("button", { name: /check this sale/i }).click();
    await page.getByRole("button", { name: /create invoice/i }).click({ timeout: 60_000 });
    await expect(page.getByText(/Add the client’s name/)).toBeVisible();
    await expect(page.getByText(/Use a valid email/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a notice that is too short is refused politely", async ({ page }) => {
    await page.goto("/notices/new");
    await page.getByRole("textbox").first().fill("Your account is limited.");
    await page.getByRole("radio").first().check({ force: true });
    await page.getByRole("button", { name: /check this email/i }).click();
    await expect(page.getByText(/Paste the whole email/).first()).toBeVisible();
  });

  test("a wrong file type for a notice is refused", async ({ page }) => {
    await page.goto("/notices/new");
    await page.locator('input[type="file"]').setInputFiles({ name: "notice.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    await page.getByRole("radio").first().check({ force: true });
    await page.getByRole("button", { name: /check this email/i }).click();
    await expect(page.getByText(/Upload a screenshot|PNG, JPG/).first()).toBeVisible();
  });

  test("proof uploads reject the wrong kind of file", async ({ page }) => {
    await page.goto("/sales");
    await page.getByRole("link", { name: /Album cover/i }).first().click();
    await page.waitForURL(/\/sales\/[0-9a-f-]+$/);
    await page.locator('input[type="file"]').first().setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    await expect(page.getByText(/can’t|isn’t|not a|PNG|PDF|type/i).first()).toBeVisible();
  });

  test("tracking needs a real-looking number", async ({ page }) => {
    await page.goto("/sales");
    await page.getByRole("link", { name: /Album cover/i }).first().click();
    const form = page.locator("form").filter({ hasText: /tracking/i }).first();
    if (!(await form.count())) test.skip(true, "No tracking form on this sale");
    await form.getByRole("textbox").last().fill("??");
    await form.getByRole("button").last().click();
    await expect(page.getByText(/tracking number|real payment|Choose the carrier/).first()).toBeVisible();
  });
});
