// Runs before the `clicks` project (playwright.config.ts dependencies): signs every persona the selected screens
// need in ONCE, one after another, and saves the Keycloak SSO state to .auth/clicks-<persona>.json. The click tests
// reuse it in parallel workers without another password login (Keycloak locks accounts on near-simultaneous logins).
// A saved state younger than E2E_CLICKS_SSO_MAX_AGE_MIN (20) minutes is reused as is.
import { test as setup } from '@playwright/test';
import type { PersonaKey } from '../../lib/env';
import { PERSONAS } from '../../lib/env';
import { ensureSignedIn } from '../../lib/clicks/browser';
import { selectedScreens } from '../../lib/clicks/screens';
import { stackUp } from '../../lib/fixtures';
import { REQUIRE_STACK } from '../../lib/env';

setup('sign each persona in once and keep the SSO session for the click tests', async ({ browser }) => {
  setup.setTimeout(5 * 60_000);
  const up = await stackUp();
  if (!up && REQUIRE_STACK) throw new Error('stack not reachable (E2E_REQUIRE_STACK is set)');
  setup.skip(!up, 'stack not reachable; start it with: docker compose up -d --build');
  const personas = [...new Set(selectedScreens().map(s => s.persona as PersonaKey))];
  for (const who of personas) {
    await setup.step(`${PERSONAS[who].username} (${who})`, () => ensureSignedIn(browser, who));
  }
});
