import { defineConfig, devices } from "@playwright/test";

// End-to-end checks of the judge path and the unhappy paths. Against a local build by default:
//   npm run build && npm run start        then   npm run e2e
//   BASE_URL=https://cleared-web.onrender.com npm run e2e     (the live demo)
export default defineConfig({
  testDir: "e2e",
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium", viewport: { width: 1440, height: 900 } } }],
});
