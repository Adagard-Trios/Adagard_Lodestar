/**
 * Waypoint Lodestar — Prisma seed
 * "Every order, one thread."  Team Adagard · Tech-Triathlon 2026
 *
 * 1. Reference tables (districts, service allowances, calendar, outlets,
 *    vehicles) load at runtime from CSV files in DATA_DIR (default /data,
 *    mounted read-only). No dataset values live in this repository. Any file
 *    that is missing is replaced by a small, deterministic, clearly
 *    "synthetic" dataset. See prisma/DATA.md.
 * 2. The demo scenario (our story: people, devices, plans, Tue 7 Apr 2026
 *    hero trip, incidents) is applied on top from prisma/scenario.ts.
 *
 * Idempotent: everything is upserted, so re-running refreshes reference rows
 * and resets the scenario without creating duplicates.
 *
 * Env: DATABASE_URL, DATA_DIR (default /data), SYNTHETIC_SEED (default 20260407).
 */

import { PrismaClient } from '@prisma/client';
import { applyScenario } from './scenario';
import { DATA_FILES, loadReference, nodeFiles, Table } from './seed/reference-loader';
import { DEFAULT_SYNTHETIC_SEED } from './seed/synthetic';
import { writeReference } from './seed/writer';

export function resolveDataDir(env: NodeJS.ProcessEnv = process.env): string | null {
  const dir = env.DATA_DIR?.trim() || '/data';
  return nodeFiles.exists(dir) ? dir : null;
}

async function main(prisma: PrismaClient) {
  console.log('🌱 Seeding Waypoint Lodestar database...');

  const requested = process.env.DATA_DIR?.trim() || '/data';
  const dataDir = resolveDataDir();
  const seed = Number(process.env.SYNTHETIC_SEED) || DEFAULT_SYNTHETIC_SEED;
  console.log(dataDir
    ? `  → DATA_DIR ${dataDir}`
    : `  → DATA_DIR ${requested} not found: using synthetic reference data (seed ${seed})`);

  // ── 1. Reference data ───────────────────────────────────
  const { data, report } = loadReference(dataDir, { seed });
  for (const table of Object.keys(DATA_FILES) as Table[]) {
    const r = report[table];
    const from = r.source === 'csv' ? `csv ${DATA_FILES[table]}` : 'synthetic';
    console.log(`  → ${table.padEnd(10)} ${String(r.rows).padStart(4)} rows  from ${from}` +
      (r.skipped ? `  (${r.skipped} rows skipped)` : '') +
      (r.filled.length ? `  (+synthetic fill: ${r.filled.join(', ')})` : ''));
    for (const reason of r.skipReasons) console.warn(`      ! ${reason}`);
  }
  await writeReference(prisma, data);

  // ── 2. Scenario (our story) ─────────────────────────────
  console.log('  → Scenario: Tue 7 Apr 2026 hero thread...');
  const s = await applyScenario(prisma);
  console.log(`  → ${s.users} users, ${s.devices} devices, ${s.plans} plans, ${s.orders} orders (${s.lineItems} lines)`);
  console.log(`  → hero trip ${s.heroTripId}: ${s.stops} stops, ${s.offlineEvents} offline events, ${s.deferrals} deferrals`);
  if (s.usersMigrated.length) console.log(`  → moved legacy users to Keycloak ids: ${s.usersMigrated.join(', ')}`);
  if (s.usersKeptLegacyId.length) console.warn(`  ! users kept a legacy id (reset the DB to fix): ${s.usersKeptLegacyId.join(', ')}`);
  if (s.calendarNotesCreated.length) console.log(`  → calendar rows added for scenario notes: ${s.calendarNotesCreated.join(', ')}`);

  console.log('\n✅ Seed complete!');
  console.log('   Hero thread: VEH057 → OUT106 (6:33 actual) → OUT108 (7:26 actual)');
  console.log('   Offline: 4:38–8:40 · 7 records synced · CN-2604-0441 issued');
  console.log('   Sign-in is via Keycloak (users are matched by their subject id).');
}

if (require.main === module) {
  const prisma = new PrismaClient();
  main(prisma)
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
