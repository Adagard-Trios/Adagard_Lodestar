import {
  arrivalShiftMs, departureShiftMs, podExceptionsWithStoreCount, ProgressStop, recordArrival, recordDeparture, shiftRemainingEtas, StopProgressStore,
} from './field-progress';

const T = (hhmm: string) => new Date(`2026-10-05T${hhmm}:00+05:30`);
const MIN = 60_000;

const stop = (over: Partial<ProgressStop> = {}): ProgressStop => ({
  id: 'S1', tripId: 'T1', stopSeq: 1, orderId: 'ORD1', outletId: 'OUT106', etaModel: T('06:00'), etaPlan: T('05:55'), serviceMinPredicted: 20, ...over,
});

/** An in-memory trips.TripStop table. */
function store(rows: any[]): StopProgressStore & { rows: any[] } {
  return {
    rows,
    tripStop: {
      findMany: jest.fn(async ({ where }: any) =>
        rows
          .filter((r) => r.tripId === where.tripId && !where.status.notIn.includes(r.status))
          .filter((r) => (where.stopSeq.gt !== undefined ? r.stopSeq > where.stopSeq.gt : r.stopSeq >= where.stopSeq.gte))
          .sort((a, b) => a.stopSeq - b.stopSeq)),
      update: jest.fn(async ({ where, data }: any) => Object.assign(rows.find((r) => r.id === where.id), data)),
    },
  };
}

const later = () => [
  { id: 'S2', tripId: 'T1', stopSeq: 2, orderId: 'ORD2', outletId: 'OUT108', status: 'ENROUTE', etaModel: T('06:40'), etaPlan: T('06:35'), etaModelBandEarly: T('06:30'), etaModelBandLate: T('06:55'), lateRiskPct: 20 },
  { id: 'S3', tripId: 'T1', stopSeq: 3, orderId: 'ORD3', outletId: 'OUT110', status: 'ENROUTE', etaModel: T('07:20'), etaPlan: T('07:15'), etaModelBandEarly: null, etaModelBandLate: null, lateRiskPct: null },
  { id: 'S4', tripId: 'T1', stopSeq: 4, orderId: 'ORD4', outletId: 'OUT111', status: 'DELIVERED', etaModel: T('08:00'), etaPlan: T('08:00') },
];

describe('field progress: ETAs of the stops still to come', () => {
  it('an arrival is measured against the stop ETA the first time, then only by a correction', () => {
    expect(arrivalShiftMs(stop(), T('06:25'))).toBe(25 * MIN);
    expect(arrivalShiftMs(stop({ arrivalActual: T('06:25') }), T('06:25'))).toBe(0); // replayed: nothing more
    expect(arrivalShiftMs(stop({ arrivalActual: T('06:25') }), T('06:30'))).toBe(5 * MIN);
    expect(arrivalShiftMs(stop({ etaModel: null }), T('06:00'))).toBe(5 * MIN); // the plan ETA when there is no model ETA
    expect(arrivalShiftMs(stop({ etaModel: null, etaPlan: null }), T('06:00'))).toBeNull();
  });

  it('a departure moves them by the time at the door beyond the predicted service', () => {
    expect(departureShiftMs(stop({ arrivalActual: T('06:25') }), T('06:55'))).toBe(10 * MIN); // 30 min at the door, 20 predicted
    expect(departureShiftMs(stop(), T('06:30'))).toBe(10 * MIN); // no arrival recorded: from the ETA
    expect(departureShiftMs(stop({ serviceMinPredicted: null, arrivalActual: T('06:00') }), T('06:15'))).toBe(0); // 15 min default
    expect(departureShiftMs(stop({ leaveActual: T('06:55') }), T('06:55'))).toBe(0); // replayed
  });

  it('moves model ETA and band of open later stops only, and returns them', async () => {
    const db = store(later());
    const moved = await shiftRemainingEtas(db, 'T1', 1, 25 * MIN);
    expect(moved.map((m) => m.stopId)).toEqual(['S2', 'S3']); // S4 is delivered
    expect(db.rows[0]).toMatchObject({ etaModel: T('07:05'), etaModelBandEarly: T('06:55'), etaModelBandLate: T('07:20') });
    expect(db.rows[1]).toMatchObject({ etaModel: T('07:45'), etaModelBandEarly: null });
    expect(db.rows[2].etaModel).toEqual(T('08:00'));
  });

  it('ignores less than a minute, and never brings a stop ahead of its plan ETA', async () => {
    const db = store(later());
    expect(await shiftRemainingEtas(db, 'T1', 1, 30_000)).toEqual([]);
    expect(await shiftRemainingEtas(db, 'T1', 1, null)).toEqual([]);
    const moved = await shiftRemainingEtas(db, 'T1', 1, -20 * MIN);
    expect(moved.map((m) => [m.stopId, m.shiftMs / MIN])).toEqual([['S2', -5], ['S3', -5]]);
    expect(db.rows[0].etaModel).toEqual(T('06:35'));
  });

  it('recordArrival: stop_arrived to the store, the depot and the trip; eta_update per moved stop', async () => {
    const db = store(later());
    const notify = { publish: jest.fn().mockResolvedValue(true) };
    const trip = { id: 'T1', depot: 'KANDY', vehicleId: 'VEH057' };
    await recordArrival(db, notify, trip, stop(), T('06:25'));
    expect(notify.publish).toHaveBeenCalledWith('stop_arrived', ['store:OUT106', 'dispatcher:KANDY', 'trip:T1'], expect.objectContaining({
      stopId: 'S1', orderId: 'ORD1', outletId: 'OUT106', vehicleId: 'VEH057', arrivalActual: T('06:25').toISOString(), lateMin: 25,
    }));
    expect(notify.publish).toHaveBeenCalledWith('eta_update', ['store:OUT108', 'trip:T1'], expect.objectContaining({
      tripId: 'T1', stopId: 'S2', outletId: 'OUT108', etaModel: T('07:05').toISOString(), shiftMin: 25, lateRiskPct: 20, cause: 'ARRIVAL',
    }));
    expect(notify.publish).toHaveBeenCalledTimes(3);

    // the same arrival again (a retry) moves nothing and says nothing new
    notify.publish.mockClear();
    await recordArrival(db, notify, trip, stop({ arrivalActual: T('06:25') }), T('06:25'));
    expect(notify.publish).not.toHaveBeenCalled();
  });

  it('recordDeparture: stop_delivered with the outcome, then the overrun moves the later stops', async () => {
    const db = store(later());
    const notify = { publish: jest.fn().mockResolvedValue(true) };
    await recordDeparture(db, notify, { id: 'T1', depot: 'KANDY', vehicleId: 'VEH057' }, stop({ arrivalActual: T('06:00') }), T('06:30'), { status: 'EXCEPTION' });
    expect(notify.publish).toHaveBeenNthCalledWith(1, 'stop_delivered', ['store:OUT106', 'dispatcher:KANDY', 'trip:T1'], expect.objectContaining({ status: 'EXCEPTION', leaveActual: T('06:30').toISOString() }));
    expect(db.rows[0].etaModel).toEqual(T('06:50')); // 30 min at the door, 20 predicted
  });
});

describe('podExceptionsWithStoreCount (credit units stay on the POD)', () => {
  const count = { unitsReceived: 31, unitsExpected: 34, receiptNote: 'tray torn', receivedBy: 'fathima', receiptSavedAt: T('07:05'), creditNoteId: 'CN-2610-0001' };
  const driver = [{ type: 'DAMAGED', description: 'chicken', photoUrl: null }];

  it("adds the store's earlier count to a new POD", () => {
    expect(podExceptionsWithStoreCount(driver, null, count)).toEqual([
      ...driver,
      expect.objectContaining({ type: 'SHORT', source: 'STORE_RECEIPT', qty: 3, unitsShort: 3, unitsReceived: 31, unitsExpected: 34, note: 'tray torn', reportedBy: 'fathima' }),
    ]);
  });

  it("keeps the store's entry when the driver rewrites the list, without doubling it", () => {
    const stored = [{ type: 'SHORT', source: 'STORE_RECEIPT', qty: 3 }];
    expect(podExceptionsWithStoreCount(driver, stored, count)).toEqual([...driver, stored[0]]);
    expect(podExceptionsWithStoreCount([...driver, stored[0]], stored, count)).toEqual([...driver, stored[0]]);
  });

  it('adds nothing for a full count or no count', () => {
    expect(podExceptionsWithStoreCount(driver, null, { ...count, unitsReceived: 34 })).toEqual(driver);
    expect(podExceptionsWithStoreCount(null, null, null)).toEqual([]);
  });
});
