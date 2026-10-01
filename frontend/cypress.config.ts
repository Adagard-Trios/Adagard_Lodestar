import { defineConfig } from 'cypress';
import { loadScreens } from './cypress/plugins/screens';

// Base URL: CYPRESS_BASE_URL (also CYPRESS_baseUrl, both native to Cypress) or BASE_URL, default the dev server.
//   npm run cy:run                                   -> http://localhost:3000
//   CYPRESS_BASE_URL=http://localhost:3100 npm run cy:run
const baseUrl = process.env.CYPRESS_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 10_000,
    pageLoadTimeout: 60_000,
    // The click-through visits hundreds of pages; keep memory flat on CI.
    numTestsKeptInMemory: 5,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on, config) {
      const manifest = loadScreens(__dirname);
      // Public (non-secret) values reach the specs through `expose` (Cypress 16; Cypress.env is for secrets).
      config.expose = { ...config.expose, screens: manifest, only: process.env.CYPRESS_SCREENS || process.env.SCREENS || '' };
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      console.log(`[cypress] ${manifest.screens.length} desktop screens, ` +
        `${manifest.screens.reduce((n, s) => n + s.links.length, 0)} links (from ${manifest.source}) at ${config.baseUrl}`);
      return config;
    },
  },
  video: false,
  screenshotOnRunFailure: true,
  reporter: 'spec',
});
