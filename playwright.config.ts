import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests",
  // The demo API keeps state in memory, so tests run serially until per-test tenants exist.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Start the local demo API unless tests are pointed at an already-running BASE_URL.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${BASE_URL}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
