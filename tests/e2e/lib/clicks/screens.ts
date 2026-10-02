// The screens the click specs run on: the manifest built from the repo when the spec loads, narrowed by env.
//   E2E_CLICKS_ONLY=<regex>     screens whose key or id matches (e.g. "^dsp-0[12]|LD-")
//   E2E_CLICKS_APP=desk|field   one app only
//   E2E_CLICKS_LIVE=1           live screens only (skip the static mocks)
// Playwright's own --grep works too: titles carry the screen id, key and path; tags @desk @field @live @static
// @walkthrough @entry @storeManager @dispatcher @loader @driver @admin.
import type { TestInfo } from '@playwright/test';
import { join } from 'node:path';
import { buildManifest, type ScreenEntry } from './manifest';

export const REPO = join(__dirname, '..', '..', '..', '..');
export const MANIFEST = buildManifest(REPO);

export function selectedScreens(): ScreenEntry[] {
  const only = process.env.E2E_CLICKS_ONLY ? new RegExp(process.env.E2E_CLICKS_ONLY, 'i') : null;
  const app = process.env.E2E_CLICKS_APP;
  const liveOnly = /^(1|true|yes)$/i.test(process.env.E2E_CLICKS_LIVE ?? '');
  return MANIFEST.screens.filter(s => (!only || only.test(s.key) || only.test(s.id)) && (!app || s.app === app) && (!liveOnly || s.live));
}

export const screenTitle = (s: ScreenEntry, what: string) => `${s.id} ${s.name} · ${s.path} · ${what}`;

export const screenTags = (s: ScreenEntry) => [
  `@${s.app}`, s.live ? '@live' : '@static', `@${s.persona}`, ...(s.walkthrough ? ['@walkthrough'] : []), ...(s.entry ? ['@entry'] : []),
];

export function annotateScreen(info: TestInfo, s: ScreenEntry) {
  info.annotations.push({ type: 'screen', description: `${s.id} ${s.name} (${s.app}, ${s.device} ${s.viewport.width}×${s.viewport.height}) as ${s.persona}` });
  info.annotations.push({ type: 'sources', description: s.sources.join(', ') });
  if (!s.live) info.annotations.push({ type: 'static mock', description: 'Not live yet: the route renders the generated design screen; its links are wired by the generator.' });
  if (s.walkthrough) info.annotations.push({ type: 'judge walkthrough', description: 'README.md "Judge walkthrough" screen: no allowlist exemptions allowed.' });
}
