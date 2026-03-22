import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_TEST_SERVER_PORT || 4173);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/site/server.mjs',
    url: `http://127.0.0.1:${port}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PLAYWRIGHT_TEST_SERVER_PORT: String(port),
    },
  },
});
