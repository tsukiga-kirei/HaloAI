import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const apiOrigin = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3100";
const sharedEnv = {
  ...process.env,
  API_HOST: "127.0.0.1",
  API_PORT: "3100",
  API_WEB_ORIGIN: baseURL,
  AUTH_BASE_URL: apiOrigin,
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ?? "haloai-local-auth-secret-change-before-production",
  DATABASE_URL:
    process.env.DATABASE_URL ?? "postgresql://haloai_app:haloai_app_local@localhost:5432/haloai",
  AUTH_DATABASE_URL:
    process.env.AUTH_DATABASE_URL ??
    "postgresql://haloai_auth:haloai_auth_local@localhost:5432/haloai",
};

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
  webServer: [
    {
      command: "pnpm --filter @haloai/api dev",
      url: `${apiOrigin}/health/ready`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: sharedEnv,
    },
    {
      command: "pnpm --filter @haloai/web exec next dev --hostname 127.0.0.1 --port 3000",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: sharedEnv,
    },
  ],
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
