const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './temp_tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbiddenOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'json',
  use: {
    actionTimeout: 10000,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
