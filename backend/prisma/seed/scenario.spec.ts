import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CALENDAR_NOTES, DEVICES, HERO_OFFLINE_EVENTS, HERO_TRIP_ID, OUTLET_ANCHORS, PLAN_IDS, PLAN_PUBLISHED_AT, SCENARIO_DAY,
  USER_IDS, VEHICLE_ANCHORS, applyScenario,
} from '../scenario';
import { generateSynthetic } from './synthetic';
import { writeReference } from './writer';
import { FakePrisma, counts, fakePrisma } from './testing/fake-prisma';

const quiet = () => undefined;

async function seeded(mutate?: (db: FakePrisma) => Promise<void> | void): Promise<FakePrisma> {
  const db = fakePrisma();
  await writeReference(db as any, generateSynthetic({ seed: 1 }));
  if (mutate) await mutate(db);
  return db;
}

describe('applyScenario', () => {
  it('writes the story in synthetic mode', async () => {
    const db = await seeded();
    const s = await applyScenario(db as any, quiet);

    expect(s.missingOverlayTargets).toEqual([]);
    expect(s.heroTripId).toBe(HERO_TRIP_ID);
    expect(db.user.rows.map((u) => u.id).sort()).toEqual(Object.values(USER_IDS).sort());
    expect(db.user.rows.every((u) => u.passwordHash === null)).toBe(true);
    expect(db.user.rows.find((u) => u.email === 'fathima@waypoint.lk')).toMatchObject({ outletId: 'OUT106', role: 'STORE_MANAGER' });

    expect(db.device.rows.map((d) => [d.id, d.userId, d.status])).toEqual([
      ['DEV-RB-01', USER_IDS.ruwan, 'ACTIVE'],
      ['DEV-KJ-01', USER_IDS.kasun, 'ACTIVE'],
      ['DEV-FR-01', USER_IDS.fathima, 'ACTIVE'],
      ['DEV-NP-01', USER_IDS.nilanthi, 'ACTIVE'],
    ]);

    const plg3 = db.plan.rows.find((p) => p.id === PLAN_IDS.plgV3);
    expect(plg3).toMatchObject({ status: 'PUBLISHED', source: 'AUTOPLAN', approvedBy: USER_IDS.nilanthi, publishedAt: PLAN_PUBLISHED_AT });
    expect(PLAN_PUBLISHED_AT.toISOString()).toBe('2026-04-06T13:10:00.000Z');
    expect(db.plan.rows.filter((p) => p.status === 'SUPERSEDED').map((p) => p.id).sort()).toEqual([PLAN_IDS.plgV1, PLAN_IDS.plgV2]);

    const trip = db.trip.rows[0];
    expect(trip).toMatchObject({ id: HERO_TRIP_ID, vehicleId: 'VEH057', planId: PLAN_IDS.plkV3, driverId: USER_IDS.ruwan });
    expect(db.tripStop.rows.map((r) => r.id).sort()).toEqual(['STP-ORD0104209', 'STP-ORD0104216', 'STP-ORD0104217']);
    expect(db.pOD.rows.find((p) => p.id === 'POD-ORD0104217')?.creditNoteId).toBe('CN-2604-0441');
    expect(db.loadRecord.rows[0]).toMatchObject({ id: 'LR-TRP-VEH057-20260407', loaderId: USER_IDS.kasun });
    expect(db.offlineEvent.rows).toHaveLength(HERO_OFFLINE_EVENTS.length);
    expect(db.orderLineItem.rows).toHaveLength(16);

    expect(db.deferralLog.rows.map((d) => [d.orderId, d.status, d.planId])).toEqual([
      ['ORD0104188', 'CONFIRMED', PLAN_IDS.plgV3],
      ['ORD0104195', 'CONFIRMED', PLAN_IDS.plgV3],
    ]);
    expect(db.deferralLog.rows.every((d) => d.confirmedAt?.getTime() === PLAN_PUBLISHED_AT.getTime())).toBe(true);

    expect(db.vehicle.rows.find((v) => v.id === 'VEH057')?.usedLThisWeek).toBe(298);
    expect(db.vehicle.rows.find((v) => v.id === 'VEH004')).toMatchObject({ status: 'WORKSHOP' });
    expect(db.vehicle.rows.find((v) => v.id === 'VEH021')).toMatchObject({ status: 'WORKSHOP' });
    for (const c of CALENDAR_NOTES) {
      expect(db.calendar.rows.find((r) => r.date.getTime() === c.date.getTime())?.note).toBe(c.note);
    }
    expect(s.calendarNotesCreated).toEqual([]);
  });

  it('is idempotent (second run creates nothing new)', async () => {
    const db = await seeded();
    await applyScenario(db as any, quiet);
    const first = JSON.stringify(counts(db));
    await applyScenario(db as any, quiet);
    expect(JSON.stringify(counts(db))).toBe(first);
  });

  it('overlays story names on dataset outlets without changing dataset columns (CSV mode)', async () => {
    const db = await seeded((d) => {
      const o = d.outlet.rows.find((r) => r.id === 'OUT106')!;
      Object.assign(o, { name: 'Waypoint Fresh Somewhere 106', windowOpen: '06:00' });
    });
    await applyScenario(db as any, quiet);
    const o = db.outlet.rows.find((r) => r.id === 'OUT106')!;
    expect(o.name).toBe('Waypoint Fresh Nuwara Eliya');
    expect(o.windowOpen).toBe('06:00');
    expect(o.accessNote).toMatch(/Lawson St/);
  });

  it('creates a calendar row for a scenario note when the calendar lacks that date', async () => {
    const db = await seeded((d) => {
      d.calendar.rows = d.calendar.rows.filter((r) => r.date.getTime() !== SCENARIO_DAY.getTime());
    });
    const s = await applyScenario(db as any, quiet);
    expect(s.calendarNotesCreated).toEqual(['2026-04-07']);
    expect(db.calendar.rows.find((r) => r.date.getTime() === SCENARIO_DAY.getTime())).toMatchObject({ isOperating: true, note: expect.stringMatching(/^HERO DAY/) });
  });

  it('reuses a legacy hero trip and removes legacy duplicates', async () => {
    const db = await seeded(async (d) => {
      await d.trip.create({ data: { id: 'legacy-trip', vehicleId: 'VEH057', runDate: SCENARIO_DAY } });
      await d.offlineEvent.create({ data: { id: 'legacy-ofe', tripId: 'legacy-trip', eventType: 'ARRIVAL', savedAt: HERO_OFFLINE_EVENTS[1].savedAt } });
      await d.orderLineItem.create({ data: { id: 'legacy-oli', orderId: 'ORD0104216', name: 'Tea' } });
    });
    const s = await applyScenario(db as any, quiet);
    expect(s.heroTripId).toBe('legacy-trip');
    expect(db.trip.rows).toHaveLength(1);
    expect(db.offlineEvent.rows.some((e) => e.id === 'legacy-ofe')).toBe(false);
    expect(db.orderLineItem.rows.some((e) => e.id === 'legacy-oli')).toBe(false);
  });

  it('moves a legacy user (same email, cuid id) to the Keycloak id', async () => {
    const db = await seeded(async (d) => {
      await d.user.create({ data: { id: 'ckold123', email: 'ruwan@waypoint.lk', name: 'Ruwan', passwordHash: 'bcrypt...' } });
    });
    const s = await applyScenario(db as any, quiet);
    expect(s.usersMigrated).toEqual(['ruwan@waypoint.lk']);
    expect(db.user.rows.find((u) => u.email === 'ruwan@waypoint.lk')).toMatchObject({ id: USER_IDS.ruwan, passwordHash: null });
  });

  it('keeps the legacy id and warns when the id change fails', async () => {
    const logs: string[] = [];
    const db = await seeded(async (d) => {
      await d.user.create({ data: { id: 'ckold456', email: 'fathima@waypoint.lk', name: 'F' } });
      d.user.failNextUpdate = new Error('FK violation');
    });
    const s = await applyScenario(db as any, (m) => logs.push(m));
    expect(s.usersKeptLegacyId).toEqual(['fathima@waypoint.lk']);
    expect(db.user.rows.find((u) => u.email === 'fathima@waypoint.lk')?.id).toBe('ckold456');
    expect(logs.join('\n')).toMatch(/keeping legacy id/);
  });

  it('reports overlay targets missing from reference data instead of crashing', async () => {
    const db = await seeded((d) => {
      d.vehicle.rows = d.vehicle.rows.filter((v) => v.id !== 'VEH021');
    });
    const s = await applyScenario(db as any, quiet);
    expect(s.missingOverlayTargets).toEqual(['VEH021']);
  });

  it('anchors are consistent with the story', () => {
    expect(OUTLET_ANCHORS.find((o) => o.id === 'OUT108')).toMatchObject({ windowOpen: '04:00', windowClose: '07:45', depot: 'KANDY' });
    expect(VEHICLE_ANCHORS.find((v) => v.id === 'VEH057')).toMatchObject({ capacityKg: 1040, capacityM3: 7, weeklyLFuel: 450 });
  });
});

describe('device posture: realm and scenario agree', () => {
  // Every field-capable person (store manager, dispatcher, loader, driver) carries a device_id
  // attribute in the realm, and that device is seeded ACTIVE for the same person, so their
  // field-app tokens pass the posture check (PLATFORM.md §2.6).
  const realm = JSON.parse(readFileSync(join(__dirname, '..', '..', 'identity', 'lodestar-realm.json'), 'utf8'));
  const people = (realm.users as any[]).filter((u) => !u.username.startsWith('service-account-') && u.username !== 'admin');

  it.each(people.map((u) => [u.username, u]))('%s has a device_id that is an ACTIVE seeded device of theirs', (username, u: any) => {
    const deviceId = u.attributes?.device_id?.[0];
    expect(deviceId).toMatch(/^DEV-[A-Z0-9-]+$/);
    expect(DEVICES.find((d) => d.id === deviceId)).toMatchObject({ user: username, status: 'ACTIVE' });
  });

  it('covers fathima (store manager) and nilanthi (dispatcher)', () => {
    expect(people.map((u) => u.username).sort()).toEqual(['fathima', 'kasun', 'nilanthi', 'ruwan']);
  });
});
