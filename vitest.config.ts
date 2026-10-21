import { configDefaults, defineConfig } from "vitest/config";

// Unit tests only: e2e/ holds Playwright specs, run with `npm run e2e`.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, "e2e/**"] } });
