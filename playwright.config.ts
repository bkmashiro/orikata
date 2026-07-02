import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173'
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/demo/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
