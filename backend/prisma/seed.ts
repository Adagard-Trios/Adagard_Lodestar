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
 *    hero trip, incidents) is applied on top from prisma/scenario.ts. That
 *    day is history: the completed run behind the receipts and credit notes.
 * 3. The demo delivery day (prisma/seed/demo-day.ts): an over-capacity run
 *    with 100+ open orders and no trips yet, on DEMO_DATE (default: today in
 *    Sri Lanka). Built from the peak-day scenario files when they are in
 *    DATA_DIR, otherwise generated.
 *
 * Idempotent: everything is upserted, so re-running refreshes reference rows
 * and resets the scenario without creating duplicates.
 *
 * Env: DATABASE_URL, DATA_DIR (default /data), SYNTHETIC_SEED (default 20260407),
 *      DEMO_DATE (YYYY-MM-DD, default today in Asia/Colombo).
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { applyScenario } from './scenario';
import { DATA_FILES, loadReference, nodeFiles, Table } from './seed/reference-loader';
import { PEAK_FILES, buildDemoDay, resolveDemoDate } from './seed/demo-day';
import { writeDemoDay } from './seed/demo-writer';
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

  // ── 3. Demo delivery day ────────────────────────────────
  const operating = new Map(data.calendar.map((c) => [c.date.toISOString().slice(0, 10), c.isOperating]));
  const date = resolveDemoDate(process.env, (d) => operating.get(d) ?? new Date(`${d}T00:00:00Z`).getUTCDay() !== 0);
  const read = (name: string) => (dataDir && nodeFiles.exists(join(dataDir, name)) ? readFileSync(join(dataDir, name), 'utf8') : null);
  const vehicles = data.vehicles.map((v) => ({ id: v.id, depot: v.depot, type: v.type, tempClass: v.tempClass, capacityM3: v.capacityM3 }));
  const demo = buildDemoDay({
    date, seed, vehicles,
    outlets: data.outlets.map((o) => ({ id: o.id, brand: o.brand, depot: o.depot, isActive: o.isActive ?? true })),
    peak: { orders: read(PEAK_FILES.orders), fleet: read(PEAK_FILES.fleet) },
  });
  for (const reason of demo.skipped) console.warn(`      ! peak day: ${reason}`);
  const d = await writeDemoDay(prisma, demo, vehicles);
  console.log(`  → Demo day ${d.date}${process.env.DEMO_DATE ? ' (DEMO_DATE)' : ' (today, Asia/Colombo)'}: ${demo.orders.length} orders ` +
    `(${d.ordersCreated} new, ${d.ordersKept} already there), Peliyagoda orders from ${demo.source.peliyagoda}`);
  console.log(`  → ${d.workshop.length} vehicles in the workshop (${demo.source.fleet}): ${d.workshop.join(', ')}; ${d.drivers} roster drivers`);
  if (d.calendarAdded.length) console.log(`  → calendar rows added around the demo day: ${d.calendarAdded[0]} .. ${d.calendarAdded[d.calendarAdded.length - 1]} (${d.calendarAdded.length})`);

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
