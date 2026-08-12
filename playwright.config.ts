import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: "list",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    colorScheme: "light",
    locale: "zh-CN",
    contextOptions: {
      reducedMotion: "reduce",
    },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: "pnpm --filter @haloai/web dev",
    env: { ...process.env, NEXT_PUBLIC_AUTH_MODE: "demo" },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      testMatch: /desktop\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "tablet",
      testMatch: /tablet\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
