// Field reports from the camera / problem / delay screens. Saved in the outbox first like every write.
//   Driver → dispatch (DR-12, DR-16, DR-17/18, DR-37, DR-38): a STATUS_CHANGE OfflineEvent on the trip,
//     sent in OfflineEvents/Lodestar.PushBatch (the driver role cannot call Notifications/Send or
//     Trips ReportVehicleFault, which is the dock's). The payload is {report, ...fields, tripId, title, time} plus
//     the stop's orderId / outletId (and names) where the report is about a stop: the backend turns it into a
//     notice for dispatch (and the store, for a stop) with that human title.
//   Dock (LD-09): PRECOOL → POST LoadRecords {reeferTempC} (see sync.ts); the reading is also kept on the
//     phone per trip so the release can carry it.
// Photos stay on the phone (only "a photo was taken" travels): the person confirms the value they read.
import { kv } from '@/lib/kv';
import { queue, session } from './platform';
import type { Trip } from './types';

function sub(): string {
  const s = session.claims?.sub;
  if (!s) throw new Error('Sign in to save this');
  return s;
}

export type DriverReport =
  | { report: 'VEHICLE_CHECK'; ok: boolean; items: { item: string; ok: boolean }[]; odometerKm?: number; note?: string }
  | { report: 'STORE_CODE'; stopId: string; orderId: string; code: string }
  | { report: 'PROBLEM'; problem: string; stopId?: string; orderId?: string; units?: number; item?: string; note?: string; photo?: boolean }
  | { report: 'REEFER_TEMP'; tempC: number; setpointC?: number; action: string; note?: string }
  | { report: 'DELAY'; reason: string; minutes?: number; stopId?: string; orderId?: string; newEta?: string | null; note?: string };

/** Where the report comes from: the trip's vehicle and, for a stop, its outlet and order. */
export type ReportContext = { vehicleId?: string | null; outletId?: string | null; outletName?: string | null; orderId?: string | null; stopSeq?: number | null };

/** A stop (TripStop with its outlet) as report context. */
export const stopContext = (s: { outletId: string; orderId: string; stopSeq: number; outlet?: { name?: string | null } | null } | null | undefined, vehicleId?: string | null): ReportContext =>
  s ? { vehicleId, outletId: s.outletId, outletName: s.outlet?.name ?? null, orderId: s.orderId, stopSeq: s.stopSeq } : { vehicleId };

export const PROBLEM_LABEL: Record<string, string> = {
  STORE_CLOSED: 'Store closed',
  ACCESS_BLOCKED: 'Access blocked',
  RECEIVER_REFUSED: 'Receiver refused',
  DAMAGED_GOODS: 'Damaged goods',
  TEMPERATURE: 'Temperature problem',
  OTHER: 'Problem',
};

export const DELAY_LABEL: Record<string, string> = {
  LANDSLIDE: 'Landslide or rock fall',
  RAIN_FOG: 'Heavy rain or fog',
  TRAFFIC: 'Traffic',
  VEHICLE_ISSUE: 'Vehicle issue',
  OTHER: 'Other reason',
};

/** The human title dispatch (and the store) sees for a report. */
export function reportTitle(r: DriverReport, ctx: ReportContext = {}): string {
  const place = ctx.outletName || ctx.outletId || '';
  const van = ctx.vehicleId ? ` · ${ctx.vehicleId}` : '';
  switch (r.report) {
    case 'VEHICLE_CHECK': {
      const bad = r.items.filter(i => !i.ok).map(i => i.item.toLowerCase());
      return r.ok ? `Pre-trip check passed${van}` : `Pre-trip check: ${bad.length ? `${bad.join(', ')} not OK` : 'something is wrong'}${van}`;
    }
    case 'STORE_CODE':
      return `Delivered with the store code${place ? ` at ${place}` : ''}`;
    case 'PROBLEM': {
      const what = PROBLEM_LABEL[r.problem] ?? PROBLEM_LABEL.OTHER;
      const count = r.problem === 'DAMAGED_GOODS' && r.units ? ` · ${r.units}${r.item ? ` × ${r.item}` : ''} damaged` : '';
      return `${what}${place ? ` at ${place}` : ''}${count}`;
    }
    case 'REEFER_TEMP':
      return `Reefer at ${r.tempC} °C${r.tempC > 4 ? ' (above 4 °C)' : ''}${van}`;
    case 'DELAY':
      return `Delay${r.minutes ? ` of about ${r.minutes} min` : ''} · ${DELAY_LABEL[r.reason] ?? DELAY_LABEL.OTHER}${place ? ` · before ${place}` : ''}`;
  }
}

const LABEL: Record<DriverReport['report'], string> = {
  VEHICLE_CHECK: 'Vehicle check',
  STORE_CODE: 'Store code',
  PROBLEM: 'Problem reported',
  REEFER_TEMP: 'Reefer temperature',
  DELAY: 'Delay reported',
};

/**
 * A driver's report to dispatch, as a STATUS_CHANGE event on the trip: payload.report says which report, with the
 * trip id, the stop's order and outlet where it is about a stop, and a human title.
 */
export async function reportToDispatch(tripId: string | undefined, report: DriverReport, ref?: string, ctx: ReportContext = {}) {
  if (!tripId) throw new Error('No trip on this phone yet');
  const at = new Date().toISOString();
  const title = reportTitle(report, ctx);
  const orderId = ('orderId' in report && report.orderId) || ctx.orderId || undefined;
  const where = {
    ...(orderId ? { orderId } : {}),
    ...(ctx.outletId ? { outletId: ctx.outletId } : {}),
    ...(ctx.outletName ? { outletName: ctx.outletName } : {}),
    ...(ctx.stopSeq ? { stopSeq: ctx.stopSeq } : {}),
    ...(ctx.vehicleId ? { vehicleId: ctx.vehicleId } : {}),
  };
  return queue.enqueue('STATUS_CHANGE', {
    sub: sub(),
    tripId,
    ref: ref ?? tripId,
    label: LABEL[report.report],
    payload: { ...report, ...where, tripId, title, time: at },
    savedAt: at,
  });
}

const precoolKey = (tripId: string) => `lodestar.precool.${tripId}`;

/** LD-09: the reefer reading the loader confirmed (queued for the load record, kept for the release). */
export async function recordPrecool(trip: Pick<Trip, 'id' | 'bay' | 'vehicleId'>, reeferTempC: number) {
  if (!Number.isFinite(reeferTempC)) throw new Error('Enter the temperature');
  await kv.set(precoolKey(trip.id), JSON.stringify({ reeferTempC, at: new Date().toISOString() })).catch(() => undefined);
  return queue.enqueue('PRECOOL', {
    sub: sub(),
    tripId: trip.id,
    ref: trip.id,
    label: `Pre-cool · ${trip.vehicleId} ${reeferTempC.toFixed(1)}°C`,
    payload: { tripId: trip.id, bay: trip.bay ?? undefined, reeferTempC },
  });
}

/** The pre-cool reading saved for a trip on this phone, if any. */
export async function precoolReading(tripId: string): Promise<number | null> {
  try {
    const raw = await kv.get(precoolKey(tripId));
    return raw ? (JSON.parse(raw).reeferTempC as number) : null;
  } catch {
    return null;
  }
}

/**
 * DR-16 "today's store code" (instead of a signature, no signal needed): 4 digits worked out on the phone
 * from the outlet and the run day, so the driver's phone can check it offline. It is a convenience check,
 * not a secret: the store side has no designed screen showing it yet.
 */
export function dailyStoreCode(outletId: string, day: string): string {
  let h = 2166136261;
  for (const ch of `${outletId.toUpperCase()}|${day}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return String(h % 10000).padStart(4, '0');
}
