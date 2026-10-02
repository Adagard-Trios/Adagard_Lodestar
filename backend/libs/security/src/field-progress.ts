// What a stop's progress on the road means for everyone watching it: the store (SM-02/SM-11) and live ops
// (DSP-04) are told when the van arrives and leaves (stop_arrived / stop_delivered), and the stops still to
// come move by the time the van is actually running behind or ahead (eta_update). Shared by the trips
// service (Arrive, CompleteStop) and the sync service (ARRIVAL, LEAVE, POD_SAVE, DELAY reports).
import type { NotifyClient } from './notify';

/** Stops whose ETA no longer moves: the van has been there (or never will be). */
export const CLOSED_STOP_STATUSES = ['DELIVERED', 'EXCEPTION', 'CANCELLED', 'DEFERRED'] as const;

/** Smaller differences are noise (clock skew, rounding): the ETAs stay where they are. */
export const ETA_SHIFT_MIN_MS = 60_000;

/** Service time at a stop when the plan did not predict one (planning's getServiceMin fallback). */
export const DEFAULT_SERVICE_MIN = 15;

/** The tables these helpers read and write (trips schema). */
export interface StopProgressStore {
  tripStop: {
    findMany(args: any): Promise<any[]>;
    update(args: any): Promise<any>;
  };
}

/** A stop as stored BEFORE this arrival or departure was written. */
export interface ProgressStop {
  id: string;
  tripId: string;
  stopSeq: number;
  orderId: string;
  outletId: string;
  etaModel?: Date | null;
  etaPlan?: Date | null;
  serviceMinPredicted?: number | null;
  arrivalActual?: Date | null;
  leaveActual?: Date | null;
}

export interface ProgressTrip {
  id: string;
  depot: string;
  vehicleId: string;
}

export interface ShiftedStop {
  stopId: string;
  stopSeq: number;
  orderId: string;
  outletId: string;
  etaModel: Date;
  etaModelBandEarly: Date | null;
  etaModelBandLate: Date | null;
  lateRiskPct: number | null;
  shiftMs: number;
}

const time = (d: Date | string | null | undefined): number | null => {
  if (d === null || d === undefined) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};
const plus = (d: Date | null | undefined, ms: number): Date | null => (d ? new Date(new Date(d).getTime() + ms) : null);

/**
 * How far the arrival at `at` moves the stops after this one. The first arrival is measured against the ETA
 * the stop was given; a corrected arrival only by the correction (the rest was applied already).
 */
export function arrivalShiftMs(stop: ProgressStop, at: Date): number | null {
  const base = time(stop.arrivalActual) ?? time(stop.etaModel) ?? time(stop.etaPlan);
  return base === null ? null : at.getTime() - base;
}

/**
 * How far leaving at `at` moves the stops after this one: the time spent at the door beyond the predicted
 * service time (the arrival's own shift was applied when it was recorded). A corrected departure moves
 * them only by the correction.
 */
export function departureShiftMs(stop: ProgressStop, at: Date): number | null {
  const left = time(stop.leaveActual);
  if (left !== null) return at.getTime() - left;
  const arrived = time(stop.arrivalActual) ?? time(stop.etaModel) ?? time(stop.etaPlan);
  if (arrived === null) return null;
  return at.getTime() - (arrived + (stop.serviceMinPredicted ?? DEFAULT_SERVICE_MIN) * 60_000);
}

/**
 * Moves the model ETA (and its band) of the trip's open stops after `afterSeq` by `shiftMs`. A van running
 * ahead never brings a stop forward of its plan ETA (it waits for the store's window). Returns the stops moved.
 */
export async function shiftRemainingEtas(
  db: StopProgressStore,
  tripId: string,
  afterSeq: number,
  shiftMs: number | null,
  opts: { inclusive?: boolean } = {},
): Promise<ShiftedStop[]> {
  if (shiftMs === null || !Number.isFinite(shiftMs) || Math.abs(shiftMs) < ETA_SHIFT_MIN_MS) return [];
  const rows =
    (await db.tripStop.findMany({
      where: { tripId, stopSeq: opts.inclusive ? { gte: afterSeq } : { gt: afterSeq }, status: { notIn: [...CLOSED_STOP_STATUSES] } },
      select: {
        id: true, stopSeq: true, orderId: true, outletId: true, etaModel: true, etaPlan: true,
        etaModelBandEarly: true, etaModelBandLate: true, lateRiskPct: true,
      },
      orderBy: { stopSeq: 'asc' },
    })) ?? [];
  const shifted: ShiftedStop[] = [];
  for (const row of rows) {
    const base = time(row.etaModel) ?? time(row.etaPlan);
    if (base === null) continue;
    let next = base + shiftMs;
    const floor = time(row.etaPlan);
    if (shiftMs < 0 && floor !== null && next < floor) next = Math.min(base, floor);
    const applied = next - base;
    if (Math.abs(applied) < ETA_SHIFT_MIN_MS) continue;
    const update = {
      etaModel: new Date(next),
      etaModelBandEarly: plus(row.etaModelBandEarly, applied),
      etaModelBandLate: plus(row.etaModelBandLate, applied),
    };
    await db.tripStop.update({ where: { id: row.id }, data: update });
    shifted.push({
      stopId: row.id, stopSeq: row.stopSeq, orderId: row.orderId, outletId: row.outletId, ...update,
      lateRiskPct: row.lateRiskPct ?? null, shiftMs: applied,
    });
  }
  return shifted;
}

/** One eta_update per moved stop, to its store and to the trip's room (DSP-04 joins trip:<id>). */
export async function publishEtaUpdates(notify: Pick<NotifyClient, 'publish'>, trip: ProgressTrip, shifted: ShiftedStop[], cause: string) {
  for (const s of shifted) {
    await notify.publish('eta_update', [`store:${s.outletId}`, `trip:${trip.id}`], {
      tripId: trip.id, vehicleId: trip.vehicleId, depot: trip.depot, stopId: s.stopId, stopSeq: s.stopSeq, orderId: s.orderId, outletId: s.outletId,
      etaModel: s.etaModel.toISOString(), etaModelBandEarly: s.etaModelBandEarly?.toISOString() ?? null, etaModelBandLate: s.etaModelBandLate?.toISOString() ?? null,
      lateRiskPct: s.lateRiskPct, shiftMin: Math.round(s.shiftMs / 60_000), cause,
    });
  }
}

const stopRooms = (trip: ProgressTrip, stop: ProgressStop) => [`store:${stop.outletId}`, `dispatcher:${trip.depot}`, `trip:${trip.id}`];
const stopRef = (trip: ProgressTrip, stop: ProgressStop) => ({
  tripId: trip.id, vehicleId: trip.vehicleId, depot: trip.depot, stopId: stop.id, stopSeq: stop.stopSeq, orderId: stop.orderId, outletId: stop.outletId,
});

/**
 * The van arrived at a stop (`stop` as stored before the arrival): stop_arrived to the store, the depot's
 * dispatchers and the trip, and the stops after it move by the delay.
 */
export async function recordArrival(db: StopProgressStore, notify: Pick<NotifyClient, 'publish'>, trip: ProgressTrip, stop: ProgressStop, at: Date) {
  const shiftMs = arrivalShiftMs(stop, at);
  const first = !stop.arrivalActual;
  if (first || (shiftMs !== null && Math.abs(shiftMs) >= ETA_SHIFT_MIN_MS)) {
    const eta = time(stop.etaModel) ?? time(stop.etaPlan);
    await notify.publish('stop_arrived', stopRooms(trip, stop), {
      ...stopRef(trip, stop), arrivalActual: at.toISOString(), etaModel: eta === null ? null : new Date(eta).toISOString(),
      lateMin: eta === null ? null : Math.round((at.getTime() - eta) / 60_000),
    });
  }
  const shifted = await shiftRemainingEtas(db, trip.id, stop.stopSeq, shiftMs);
  await publishEtaUpdates(notify, trip, shifted, 'ARRIVAL');
  return shifted;
}

/**
 * The van left a stop (`stop` as stored before the departure, with the arrival already recorded):
 * stop_delivered (status DELIVERED, or EXCEPTION for a failed stop) to the store, the depot's dispatchers and
 * the trip, and the stops after it move by the overrun at the door.
 */
export async function recordDeparture(
  db: StopProgressStore,
  notify: Pick<NotifyClient, 'publish'>,
  trip: ProgressTrip,
  stop: ProgressStop,
  at: Date,
  outcome: { status: 'DELIVERED' | 'EXCEPTION'; [k: string]: unknown },
) {
  await notify.publish('stop_delivered', stopRooms(trip, stop), { ...stopRef(trip, stop), leaveActual: at.toISOString(), ...outcome });
  const shifted = await shiftRemainingEtas(db, trip.id, stop.stopSeq, departureShiftMs(stop, at));
  await publishEtaUpdates(notify, trip, shifted, 'DEPARTURE');
  return shifted;
}

// ---------------------------------------------------------------- POD exceptions and the store's count

/** The store's own count of an order (Orders('…')/Lodestar.ConfirmReceipt), as the order holds it. */
export interface StoreCount {
  unitsReceived: number | null;
  unitsExpected: number | null;
  receiptNote?: string | null;
  receivedBy?: string | null;
  receiptSavedAt?: Date | null;
  creditNoteId?: string | null;
}

const isStoreEntry = (e: unknown) => !!e && typeof e === 'object' && (e as any).source === 'STORE_RECEIPT';

/**
 * The exceptions a POD keeps when the driver writes theirs: the driver's list, plus the store's count
 * (source STORE_RECEIPT) — the entry already on the POD, or, when the store counted short before the POD
 * existed, one made from the order's count. The store's shortfall is never lost to a driver's (re)write.
 */
export function podExceptionsWithStoreCount(driver: unknown[] | null | undefined, previous: unknown, order?: StoreCount | null): unknown[] {
  const own = (Array.isArray(driver) ? driver : []).filter((e) => !isStoreEntry(e));
  const kept = (Array.isArray(previous) ? previous : []).filter(isStoreEntry);
  if (kept.length) return [...own, ...kept];
  const short = order && order.unitsReceived !== null && order.unitsExpected !== null ? order.unitsExpected - order.unitsReceived : 0;
  if (!order || short <= 0) return own;
  return [
    ...own,
    {
      type: 'SHORT', source: 'STORE_RECEIPT',
      description: `Store counted ${order.unitsReceived} of ${order.unitsExpected} units (${short} short)`,
      unitsShort: short, qty: short, unitsReceived: order.unitsReceived, unitsExpected: order.unitsExpected,
      note: order.receiptNote ?? null, photoUrl: null, reportedBy: order.receivedBy ?? null,
      at: order.receiptSavedAt ? new Date(order.receiptSavedAt).toISOString() : null,
    },
  ];
}
