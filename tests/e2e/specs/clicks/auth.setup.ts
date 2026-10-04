// Runs before the `clicks` project (playwright.config.ts dependencies): signs every persona the selected screens
// need in ONCE per app, one after another, on the designed sign-in screens, and saves the session
// (.auth/session-<app>-<persona>.json, lib/session.ts). The click tests restore it in parallel workers without
// another SMS code. A saved session that can still be renewed is reused as is.
import { test as setup } from '@playwright/test';
import type { PersonaKey } from '../../lib/env';
import { PERSONAS } from '../../lib/env';
import { ensureSignedIn } from '../../lib/clicks/browser';
import type { App } from '../../lib/session';
import { selectedScreens } from '../../lib/clicks/screens';
import { stackUp } from '../../lib/fixtures';
import { REQUIRE_STACK } from '../../lib/env';

setup('sign each persona in once and keep the SSO session for the click tests', async ({ browser }) => {
  setup.setTimeout(5 * 60_000);
  const up = await stackUp();
  if (!up && REQUIRE_STACK) throw new Error('stack not reachable (E2E_REQUIRE_STACK is set)');
  setup.skip(!up, 'stack not reachable; start it with: docker compose up -d --build');
  const apps = new Map<PersonaKey, Set<App>>();
  for (const s of selectedScreens()) {
    const who = s.persona as PersonaKey;
    apps.set(who, (apps.get(who) ?? new Set()).add(s.app === 'field' ? 'field' : 'desk'));
  }
  for (const [who, list] of apps) {
    await setup.step(`${PERSONAS[who].username} (${who}): ${[...list].join(', ')}`, () => ensureSignedIn(browser, who, [...list]));
  }
});
