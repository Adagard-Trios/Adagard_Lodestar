// Signs every persona in once, one after another, before the workers start, and shares the tokens
// through .auth/tokens.json. Keycloak's brute-force protection treats near-simultaneous logins to the
// same account as an attack (quick-login lockout), so parallel workers must not each log in.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { authCodeLogin, TOKEN_FILE, type TokenSet } from './lib/auth';
import { PERSONAS } from './lib/env';
import { stackUp } from './lib/fixtures';

export default async function globalSetup() {
  if (!(await stackUp())) return;
  const tokens: Record<string, { token: TokenSet; until: number }> = {};
  for (const p of Object.values(PERSONAS)) {
    try {
      const token = await authCodeLogin(p);
      tokens[p.username] = { token, until: Date.now() + (token.expires_in - 30) * 1000 };
    } catch (e) {
      console.warn(`global setup: ${p.username} could not sign in: ${String(e).slice(0, 160)}`);
    }
  }
  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
}
