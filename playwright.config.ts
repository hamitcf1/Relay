import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Aetherius Relay.
 * Documentation: docs/qa/TEST_PLAN.md
 */
const TEST_PORT = process.env.PORT || '5174';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
