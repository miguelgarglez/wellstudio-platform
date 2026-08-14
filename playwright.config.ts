import { defineConfig, devices } from '@playwright/test'

import { SANDBOX_FIXTURES_REQUEST_HEADER } from './modules/public/server/sandbox-fixtures'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3001)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`
const shouldManageWebServer = !process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'output/playwright/report', open: 'never' }]],
  use: {
    baseURL,
    extraHTTPHeaders: {
      [SANDBOX_FIXTURES_REQUEST_HEADER]: '1',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: shouldManageWebServer
    ? {
        command: `pnpm exec next dev --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
})
