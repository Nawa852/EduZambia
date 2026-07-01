import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile smoke test config.
 * Emulates iPhone 14 (iOS Safari) and Pixel 7 (Android Chrome).
 * Assumes dev server is already running at http://localhost:8080.
 */
export default defineConfig({
  testDir: "./tests/mobile-smoke",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "iPhone 14 (iOS Safari)", use: { ...devices["iPhone 14"] } },
    { name: "Pixel 7 (Android Chrome)", use: { ...devices["Pixel 7"] } },
    { name: "Small phone (iPhone SE)", use: { ...devices["iPhone SE"] } },
  ],
});
