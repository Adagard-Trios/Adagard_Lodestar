import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { personas } from '../../../libs/security/test/principals';
import { OfflineEventsSet } from './offline-events.set';
import { OfflineEventInput, SyncService } from './sync.service';

interface OfflineEventDelegate {
  findUnique(a: any): Promise<any>;
  create(a: any): Promise<any>;
  update(a: any): Promise<any>;
  findMany(a: any): Promise<any[]>;
}
interface FindUniqueDelegate {
  findUnique(a: any): Promise<any>;
}
interface TripStopDelegate {
  findFirst(a: any): Promise<any>;
  update(a: any): Promise<any>;
}
interface DeferralDelegate {
  findUnique(a: any): Promise<any>;
  update(a: any): Promise<any>;
  delete(a: any): Promise<any>;
  deleteMany(a: any): Promise<any>;
}
interface PodDelegate {
  upsert(a: any): Promise<any>;
}
interface UpdateDelegate {
  update(a: any): Promise<any>;
}

describe('SyncService', () => {
  let offlineEvent: OfflineEventDelegate;
  let trip: FindUniqueDelegate;
  let tripStop: TripStopDelegate;
  let deferralLog: DeferralDelegate;
  let pod: PodDelegate;
  let order: UpdateDelegate;
  let service: SyncService;

  beforeEach(() => {
    offlineEvent = mock<OfflineEventDelegate>();
    trip = mock<FindUniqueDelegate>();
    tripStop = mock<TripStopDelegate>();
    deferralLog = mock<DeferralDelegate>();
    pod = mock<PodDelegate>();
    order = mock<UpdateDelegate>();
    service = new SyncService({
      offlineEvent: instance(offlineEvent),
      trip: instance(trip),
      tripStop: instance(tripStop),
      deferralLog: instance(deferralLog),
      pOD: instance(pod),
      order: instance(order),
    } as any);

    let n = 0;
    when(offlineEvent.findUnique(anything())).thenResolve(null);
    when(offlineEvent.create(anything())).thenCall(async (a: any) => ({ id: a.data.id ?? `gen-${++n}`, ...a.data }));
    when(offlineEvent.update(anything())).thenResolve({});
    when(trip.findUnique(anything())).thenResolve({ vehicleId: 'VEH057' });
    when(tripStop.findFirst(anything())).thenResolve({ id: 'S1', leaveActual: null });
    when(tripStop.update(anything())).thenResolve({});
    when(deferralLog.findUnique(anything())).thenResolve(null);
    when(deferralLog.update(anything())).thenResolve({});
    when(pod.upsert(anything())).thenResolve({});
    when(order.update(anything())).thenResolve({});
  });

  describe('validate', () => {
    const ok = { eventType: 'ARRIVAL', savedAt: '2026-04-07T04:38:00+05:30', tripId: 'T1', payload: { stopSeq: 1 } };

    it('accepts well-formed events and defaults payload', () => {
      const [e] = service.validate([{ ...ok, eventType: 'PHOTO', payload: undefined, id: 'evt-0001' }]);
      expect(e).toEqual({ id: 'evt-0001', tripId: 'T1', eventType: 'PHOTO', payload: {}, savedAt: ok.savedAt });
      expect(service.validate([ok])[0].payload).toEqual({ stopSeq: 1 });
    });

    const pod = (payload: any) => ({ ...ok, eventType: 'POD_SAVE', payload });

    it('accepts a well-formed POD_SAVE payload', () => {
      expect(service.validate([pod({ orderId: 'ORD1', units: 0 })])).toHaveLength(1);
      expect(service.validate([pod({ orderId: 'ORD1', units: 10, unitsOrdered: 10 })])).toHaveLength(1);
    });

    it.each([
      ['ARRIVAL without stopSeq', { ...ok, payload: undefined }],
      ['ARRIVAL with a string stopSeq', { ...ok, payload: { stopSeq: '1' } }],
      ['LEAVE with a fractional stopSeq', { ...ok, eventType: 'LEAVE', payload: { stopSeq: 1.5 } }],
      ['POD_SAVE without orderId', pod({ units: 1 })],
      ['POD_SAVE with an empty orderId', pod({ orderId: '', units: 1 })],
      ['POD_SAVE with a numeric orderId', pod({ orderId: 42, units: 1 })],
      ['POD_SAVE without units', pod({ orderId: 'ORD1' })],
      ['POD_SAVE with negative units', pod({ orderId: 'ORD1', units: -1 })],
      ['POD_SAVE with fractional units', pod({ orderId: 'ORD1', units: 1.5 })],
      ['POD_SAVE with units > unitsOrdered', pod({ orderId: 'ORD1', units: 11, unitsOrdered: 10 })],
      ['POD_SAVE with a non-integer unitsOrdered', pod({ orderId: 'ORD1', units: 1, unitsOrdered: 'ten' })],
    ])('rejects %s with 400', (_label, evt) => {
      expect(() => service.validate([evt])).toThrow(expect.objectContaining({ status: 400, target: 'events' }));
    });

    it('drops unknown fields such as driverId', () => {
      const [e] = service.validate([{ ...ok, driverId: 'someone-else' }]);
      expect(e).not.toHaveProperty('driverId');
    });

    it.each([
      ['a non-object', null],
      ['a bad eventType', { ...ok, eventType: 'DELETE_ALL' }],
      ['a missing savedAt', { ...ok, savedAt: undefined }],
      ['a bad savedAt', { ...ok, savedAt: 'yesterday-ish' }],
      ['a numeric savedAt', { ...ok, savedAt: 1712451480000 }],
      ['a short id', { ...ok, id: 'abc' }],
      ['an id with bad characters', { ...ok, id: "evt'; drop table" }],
      ['a non-string id', { ...ok, id: 12345678 }],
    ])('rejects %s with 400', (_label, evt) => {
      expect(() => service.validate([evt])).toThrow(expect.objectContaining({ status: 400, target: 'events' }));
    });

    it('rejects more than 200 events', () => {
      expect(() => service.validate(new Array(201).fill(ok))).toThrow(expect.objectContaining({ status: 400 }));
      expect(service.validate(new Array(200).fill(ok))).toHaveLength(200);
    });
  });

  describe('pushBatch', () => {
    const evt = (over: Partial<OfflineEventInput>): OfflineEventInput => ({
      tripId: 'T1',
      eventType: 'ARRIVAL',
      payload: { stopSeq: 1 },
      savedAt: '2026-04-06T23:08:00.000Z',
      ...over,
    });

    it('reports a replayed client id as DUPLICATE and does not apply it', async () => {
      when(offlineEvent.findUnique(anything())).thenResolve({ id: 'evt-00000001' });
      const res = await service.pushBatch(personas.ruwan, [evt({ id: 'evt-00000001' })]);
      expect(res).toMatchObject({ synced: 0, duplicates: 1, results: [{ id: 'evt-00000001', status: 'DUPLICATE' }] });
      verify(offlineEvent.create(anything())).never();
      verify(tripStop.update(anything())).never();
    });

    it('rejects events for a trip of another vehicle, a missing trip id, and an unknown trip', async () => {
      when(trip.findUnique(anything())).thenCall(async (a: any) => (a.where.id === 'T-OTHER' ? { vehicleId: 'VEH001' } : null));
      const res = await service.pushBatch(personas.ruwan, [evt({ tripId: 'T-OTHER' }), evt({ tripId: undefined }), evt({ tripId: 'T-GONE' })]);
      expect(res.rejected).toBe(3);
      expect(res.results.map((r) => r.reason)).toEqual(['Trip is not assigned to your vehicle', 'tripId is required', 'Unknown trip']);
      verify(offlineEvent.create(anything())).never();
    });

    it('lets a privileged caller push for any vehicle', async () => {
      when(trip.findUnique(anything())).thenResolve({ vehicleId: 'VEH001' });
      const res = await service.pushBatch(personas.admin, [evt({})]);
      expect(res.synced).toBe(1);
    });

    it('records the driver from the token, never from the body', async () => {
      const spoofed = { ...evt({ id: 'evt-00000002' }), driverId: 'mallory' } as any;
      await service.pushBatch(personas.ruwan, [spoofed]);
      const data = capture(offlineEvent.create).last()[0].data;
      expect(data.driverId).toBe('ruwan');
      expect(data).toMatchObject({ id: 'evt-00000002', tripId: 'T1', eventType: 'ARRIVAL' });
      expect(data.savedAt).toEqual(new Date('2026-04-06T23:08:00.000Z'));
      expect(data.syncedAt).toBeInstanceOf(Date);
    });

    it('applies events in savedAt order regardless of arrival order', async () => {
      const res = await service.pushBatch(personas.ruwan, [
        evt({ id: 'evt-third01', savedAt: '2026-04-07T03:10:00.000Z', eventType: 'LEAVE' }),
        evt({ id: 'evt-first01', savedAt: '2026-04-06T23:08:00.000Z' }),
        evt({ id: 'evt-second1', savedAt: '2026-04-07T06:00:00+05:30', eventType: 'PHOTO' }),
      ]);
      expect(res.results.map((r) => r.id)).toEqual(['evt-first01', 'evt-second1', 'evt-third01']);
      const created = [0, 1, 2].map((i) => capture(offlineEvent.create).byCallIndex(i)[0].data.id);
      expect(created).toEqual(['evt-first01', 'evt-second1', 'evt-third01']);
    });

    it('ARRIVAL and LEAVE stamp the stop by trip and stopSeq', async () => {
      await service.pushBatch(personas.ruwan, [
        evt({ payload: { stopSeq: 2, time: '2026-04-07T03:00:00.000Z' } }),
        evt({ eventType: 'LEAVE', payload: { stopSeq: 2 }, savedAt: '2026-04-07T03:20:00.000Z' }),
      ]);
      expect(capture(tripStop.findFirst).first()[0]).toEqual({ where: { tripId: 'T1', stopSeq: 2 } });
      expect(capture(tripStop.update).first()[0].data).toEqual({ arrivalActual: new Date('2026-04-07T03:00:00.000Z'), status: 'ENROUTE' });
      expect(capture(tripStop.update).second()[0].data).toEqual({ leaveActual: new Date('2026-04-07T03:20:00.000Z'), status: 'DELIVERED' });
    });

    describe('POD_SAVE', () => {
      const podEvt = evt({ id: 'evt-pod-0108', eventType: 'POD_SAVE', payload: { orderId: 'ORD108', units: 12 }, savedAt: '2026-04-07T02:30:00.000Z' });

      it('reverses a provisional deferral (never deletes it) and records the conflict', async () => {
        when(deferralLog.findUnique(anything())).thenResolve({ id: 'D1', orderId: 'ORD108', isProvisional: true, status: 'CONFIRMED' });

        const res = await service.pushBatch(personas.ruwan, [podEvt]);

        expect(res).toMatchObject({ synced: 1, conflicts: 1 });
        expect(res.results[0].conflict).toMatch(/field evidence wins/);
        const [defUpd] = capture(deferralLog.update).last();
        expect(defUpd.where).toEqual({ orderId: 'ORD108' });
        expect(defUpd.data.status).toBe('REVERSED');
        verify(deferralLog.delete(anything())).never();
        verify(deferralLog.deleteMany(anything())).never();

        // The conflict is recorded in the single create, after the event was applied.
        const [created] = capture(offlineEvent.create).last();
        expect(created.data).toMatchObject({ id: 'evt-pod-0108', conflictResolved: true });
        expect(created.data.conflictNote).toMatch(/Provisional deferral reversed/);
        verify(offlineEvent.update(anything())).never();

        expect(capture(tripStop.findFirst).last()[0]).toEqual({ where: { orderId: 'ORD108', tripId: 'T1' } });
        const [podArgs] = capture(pod.upsert).last();
        expect(podArgs.where).toEqual({ tripStopId: 'S1' });
        expect(podArgs.create).toMatchObject({ tripStopId: 'S1', unitsDelivered: 12, unitsOrdered: 12, savedOffline: true });
        expect(capture(order.update).last()[0]).toEqual({ where: { id: 'ORD108' }, data: { status: 'DELIVERED' } });
      });

      it('no conflict for a non-provisional or already reversed deferral', async () => {
        when(deferralLog.findUnique(anything())).thenResolve({ isProvisional: false, status: 'CONFIRMED' }, { isProvisional: true, status: 'REVERSED' });
        const res = await service.pushBatch(personas.ruwan, [podEvt, { ...podEvt, id: 'evt-pod-0109' }]);
        expect(res.conflicts).toBe(0);
        verify(deferralLog.update(anything())).never();
        const created = capture(offlineEvent.create).last()[0].data;
        expect(created).not.toHaveProperty('conflictResolved');
        expect(created).not.toHaveProperty('conflictNote');
      });

      it('records nothing when applying the event fails, so a retry is applied (not a duplicate)', async () => {
        when(pod.upsert(anything())).thenReject(new Error('db down'));
        await expect(service.pushBatch(personas.ruwan, [podEvt])).rejects.toThrow('db down');
        verify(offlineEvent.create(anything())).never();

        when(pod.upsert(anything())).thenResolve({});
        const retry = await service.pushBatch(personas.ruwan, [podEvt]);
        expect(retry).toMatchObject({ synced: 1, duplicates: 0 });
        verify(offlineEvent.create(anything())).once();
      });

      it('applies the event before recording it', async () => {
        const order_: string[] = [];
        when(pod.upsert(anything())).thenCall(async () => void order_.push('apply'));
        when(offlineEvent.create(anything())).thenCall(async (a: any) => {
          order_.push('record');
          return a.data;
        });
        await service.pushBatch(personas.ruwan, [podEvt]);
        expect(order_).toEqual(['apply', 'record']);
      });

      it('ignores a POD for an order that is not on the event trip', async () => {
        when(tripStop.findFirst(anything())).thenResolve(null);
        const res = await service.pushBatch(personas.ruwan, [podEvt]);
        expect(res.synced).toBe(1);
        verify(pod.upsert(anything())).never();
        verify(order.update(anything())).never();
      });
    });
  });

  it('getSyncStatus ANDs the trip with the scope and counts', async () => {
    const t1 = new Date('2026-04-07T03:00:00.000Z');
    const t2 = new Date('2026-04-07T03:05:00.000Z');
    when(offlineEvent.findMany(anything())).thenResolve([
      { syncedAt: t1, conflictResolved: false },
      { syncedAt: null, conflictResolved: false },
      { syncedAt: t2, conflictResolved: true },
    ]);
    const scope = { trip: { is: { vehicleId: 'VEH057' } } };
    const res = await service.getSyncStatus('T1', scope as any);
    expect(res).toEqual({ total: 3, synced: 2, pending: 1, conflicts: 1, lastSyncedAt: t2 });
    expect(capture(offlineEvent.findMany).last()[0].where).toEqual({ AND: [{ tripId: 'T1' }, scope] });
  });
});

describe('OfflineEventsSet', () => {
  let sync: SyncService;
  let set: OfflineEventsSet;

  beforeEach(() => {
    sync = mock(SyncService);
    set = new OfflineEventsSet({} as any, instance(sync));
  });

  it('PushBatch validates then delegates with the caller principal', async () => {
    const raw = [{ eventType: 'ARRIVAL', savedAt: '2026-04-07T00:00:00Z', tripId: 'T1' }];
    const validated = [{ eventType: 'ARRIVAL', savedAt: '2026-04-07T00:00:00Z', tripId: 'T1', payload: {} }] as any;
    when(sync.validate(raw)).thenReturn(validated);
    when(sync.pushBatch(anything(), anything())).thenResolve({ synced: 1 } as any);
    await set.pushBatch({ principal: personas.ruwan, params: { events: raw }, headers: {} });
    const [p, events] = capture(sync.pushBatch).last();
    expect(p).toBe(personas.ruwan);
    expect(events).toBe(validated);
  });

  it('PushBatch surfaces validation errors without pushing', () => {
    const real = new SyncService({} as any);
    const s = new OfflineEventsSet({} as any, real);
    expect(() => s.pushBatch({ principal: personas.ruwan, params: { events: [{ eventType: 'NOPE', savedAt: 'x' }] }, headers: {} })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it('SyncStatus passes the row filter', async () => {
    const rowFilter = { trip: { is: { vehicleId: 'VEH057' } } };
    when(sync.getSyncStatus(anything(), anything())).thenResolve({ total: 0 } as any);
    await set.syncStatus({ principal: personas.ruwan, params: { tripId: 'T1' }, rowFilter, headers: {} });
    expect(capture(sync.getSyncStatus).last()).toEqual(['T1', rowFilter]);
  });
});
