import { defineConfig, devices } from '@playwright/test'

// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html']],
  
  /* Shared settings for all projects below */
  use: {
    baseURL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: false
  },
  
  expect: {
    timeout: 30000
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // }
  ],
  
  webServer: [
    {
      name: 'frontend',
      command: 'cd ../frontend && npm run start',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI
    },
    {
      name: 'backend',
      command: 'cd ../backend && npm run start',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: !process.env.CI
    }
  ]
})
