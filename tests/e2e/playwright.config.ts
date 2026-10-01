import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, MOBILE_URL, WEB_URL } from './lib/env';

// Full-stack e2e against `docker compose up` (PLATFORM.md §1, §6).
//   npm test                      everything (full-stack specs skip when the stack is down, unless E2E_REQUIRE_STACK=1)
//   npm run test:stack            only @stack specs
//   npm run test:smoke            only specs that need no backend
//   E2E_WEB_URL=http://localhost:3100 npm run test:smoke -- --project=web-chromium
const CI = Boolean(process.env.CI);
// Optional: run the Chromium projects on an installed browser instead of the downloaded one (e.g. `chrome`).
const channel = process.env.E2E_BROWSER_CHANNEL || undefined;

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true, // the compose gateway uses a self-signed dev certificate
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      use: { baseURL: BASE_URL },
    },
    {
      name: 'web-chromium',
      testMatch: 'ui/web-*.spec.ts',
      use: { ...devices['Desktop Chrome'], channel, baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'web-firefox',
      testMatch: 'ui/web-*.spec.ts',
      use: { ...devices['Desktop Firefox'], baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'web-webkit',
      testMatch: 'ui/web-*.spec.ts',
      use: { ...devices['Desktop Safari'], baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-web',
      testMatch: 'ui/mobile-*.spec.ts',
      use: { ...devices['Pixel 7'], channel, baseURL: MOBILE_URL },
    },
    // Cross-role flows (Designing 04–07b, 08/P5): each role in its own browser context; driver and loader at 390×844.
    {
      name: 'flows',
      testMatch: 'flows/**/*.spec.ts',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], channel, baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
    // Every designed click (links.json) and every interactive control on every route, per role.
    {
      name: 'clicks',
      testMatch: 'clicks/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], channel, baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
    // Design conformance against tests/visual/baselines (frozen clock, masked dynamic regions).
    {
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], channel, baseURL: WEB_URL, viewport: { width: 1440, height: 900 } },
    },
  ],
});
