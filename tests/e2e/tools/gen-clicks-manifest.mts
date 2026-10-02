// Writes tests/e2e/clicks/manifest.json: every designed screen (desk + field) and every designed link, from the
// repo's generated nav tables (see lib/clicks/manifest.ts). The click specs build the same manifest in memory when
// they load, so this file is for reading and diffing, not an input you have to refresh by hand.
//
//   node tools/gen-clicks-manifest.mts         (from tests/e2e; Node 22.18+ runs TypeScript directly)
//   npm run clicks:manifest
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildManifest } from '../lib/clicks/manifest.ts';

const here = import.meta.dirname;
const repo = join(here, '..', '..', '..');
const out = join(here, '..', 'clicks', 'manifest.json');
const m = buildManifest(repo);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(m, null, 1)}\n`);
const t = m.totals;
console.log(`clicks manifest: ${t.screens} screens (${t.desk} desk, ${t.field} field; ${t.live} live, ${t.static} static mock), ${t.links} designed links, ${t.walkthrough} judge-walkthrough screens`);
console.log(`→ ${out}`);
