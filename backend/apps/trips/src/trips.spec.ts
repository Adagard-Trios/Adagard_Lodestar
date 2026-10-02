import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { NotifyClient } from '@lodestar/security';
import { personas } from '../../../libs/security/test/principals';
import { FleetClient } from './fleet.client';
import { TripsService, tripLitres } from './trips.service';
import { LoadRecordsSet, TripsSet, TripStopsSet } from './trips.sets';

interface TravelDelegate {
  findUnique(args: any): Promise<any>;
}
interface TripDelegate {
  findUnique(args: any): Promise<any>;
  findMany(args: any): Promise<any[]>;
  update(args: any): Promise<any>;
}
interface LoadRecordDelegate {
  findUnique(args: any): Promise<any>;
  update(args: any): Promise<any>;
}
interface PodDelegate {
  upsert(args: any): Promise<any>;
}
interface UpdateDelegate {
  update(args: any): Promise<any>;
  findMany(args: any): Promise<any[]>;
  updateMany(args: any): Promise<{ count: number }>;
}

describe('TripsSet', () => {
  let trips: TripsService;
  let set: TripsSet;

  beforeEach(() => {
    trips = mock(TripsService);
    set = new TripsSet({} as any, instance(trips));
  });

  it('SetStatus passes the current status from the bound entity', async () => {
    when(trips.updateStatus(anything(), anything(), anything(), anything())).thenResolve({} as any);
    const departTime = new Date('2026-04-07T00:30:00.000Z');
    await set.setStatus({ principal: personas.kasun, params: { status: 'LOADING', departTime }, entity: { id: 'T1', status: 'PLANNED' }, headers: {} });
    verify(trips.updateStatus('T1', 'PLANNED' as any, 'LOADING' as any, departTime)).once();
  });

  describe('Release', () => {
    it.each(['   ', '', undefined, null, 12345])('requires a non-empty string seal number (%p → 400)', (sealNumber) => {
      expect(() => set.release({ principal: personas.kasun, params: { sealNumber }, entity: { id: 'T1' }, headers: {} })).toThrow(
        expect.objectContaining({ status: 400, target: 'sealNumber' }),
      );
      verify(trips.release(anything(), anything(), anything())).never();
    });

    it('delegates with seal and reefer temperature', async () => {
      when(trips.release('T1', 'SEAL-9', 3.5)).thenResolve({ id: 'T1', status: 'ENROUTE' } as any);
      await expect(
        set.release({ principal: personas.kasun, params: { sealNumber: 'SEAL-9', reeferTempC: 3.5 }, entity: { id: 'T1' }, headers: {} }),
      ).resolves.toMatchObject({ status: 'ENROUTE' });
    });
  });

  describe('BayQueue', () => {
    it('refuses a foreign depot', () => {
      expect(() =>
        set.bayQueue({ principal: personas.kasun, params: { depot: 'PELIYAGODA', runDate: '2026-04-07' }, rowFilter: {}, headers: {} }),
      ).toThrow(expect.objectContaining({ status: 403 }));
      verify(trips.getBayQueue(anything(), anything(), anything())).never();
    });

    it('passes depot, run date and row filter for the caller depot', async () => {
      const rowFilter = { depot: { in: ['KANDY'] } };
      when(trips.getBayQueue(anything(), anything(), anything())).thenResolve([]);
      await set.bayQueue({ principal: personas.kasun, params: { depot: 'KANDY', runDate: '2026-04-07' }, rowFilter, headers: {} });
      expect(capture(trips.getBayQueue).last()).toEqual(['KANDY', '2026-04-07', rowFilter]);
    });
  });
});

describe('TripStopsSet', () => {
  let trips: TripsService;
  let set: TripStopsSet;

  beforeEach(() => {
    trips = mock(TripsService);
    set = new TripStopsSet({} as any, instance(trips));
  });

  it('CompleteStop delegates with the stop id and entity.orderId', async () => {
    const params = { unitsDelivered: 10, unitsOrdered: 10, receiverName: 'Fathima' };
    when(trips.completeStop(anything(), anything(), anything())).thenResolve({ id: 'S1' } as any);
    await set.completeStop({ principal: personas.ruwan, params, entity: { id: 'S1', orderId: 'ORD1', tripId: 'T1' }, headers: {} });
    verify(trips.completeStop('S1', 'ORD1', deepEqual(params))).once();
  });

  it('Arrive uses the given time or now', async () => {
    when(trips.arrive(anything(), anything())).thenResolve({} as any);
    const t = new Date('2026-04-07T01:00:00.000Z');
    await set.arrive({ principal: personas.ruwan, params: { time: t }, entity: { id: 'S1' }, headers: {} });
    expect(capture(trips.arrive).last()).toEqual(['S1', t]);
    await set.arrive({ principal: personas.ruwan, params: {}, entity: { id: 'S1' }, headers: {} });
    expect(capture(trips.arrive).last()[1]).toBeInstanceOf(Date);
  });

  describe('UpdateLateRisk', () => {
    it.each([-1, 101])('rejects %p with 400', (pct) => {
      expect(() => set.updateLateRisk({ principal: personas.nilanthi, params: { lateRiskPct: pct }, entity: { id: 'S1' }, headers: {} })).toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });

    it.each([0, 61, 100])('accepts %p', async (pct) => {
      when(trips.updateLateRisk('S1', pct)).thenResolve({} as any);
      await set.updateLateRisk({ principal: personas.nilanthi, params: { lateRiskPct: pct }, entity: { id: 'S1' }, headers: {} });
      verify(trips.updateLateRisk('S1', pct)).once();
    });
  });
});

describe('LoadRecordsSet', () => {
  let trips: TripsService;
  let trip: TripDelegate;
  let set: LoadRecordsSet;

  beforeEach(() => {
    trips = mock(TripsService);
    trip = mock<TripDelegate>();
    set = new LoadRecordsSet({ trip: instance(trip) } as any, instance(trips));
  });

  it('sets loaderId from the caller and vehicleId from the trip', async () => {
    when(trip.findUnique(anything())).thenResolve({ vehicleId: 'VEH057', depot: 'KANDY' });
    const data = await set.beforeCreate(
      { tripId: 'T1', bay: 'B2', loaderId: 'someone-else', vehicleId: 'VEH999' },
      { principal: personas.kasun, headers: {} },
    );
    expect(data).toMatchObject({ tripId: 'T1', bay: 'B2', loaderId: 'kasun', vehicleId: 'VEH057' });
    expect(data.loadedAt).toBeInstanceOf(Date);
    expect(capture(trip.findUnique).last()[0]).toMatchObject({ where: { id: 'T1' } });
  });

  it('hides a trip of a foreign depot as 404', async () => {
    when(trip.findUnique(anything())).thenResolve({ vehicleId: 'VEH001', depot: 'PELIYAGODA' });
    await expect(set.beforeCreate({ tripId: 'T9', bay: 'B1' }, { principal: personas.kasun, headers: {} })).rejects.toMatchObject({ status: 404 });
  });

  it('404 for an unknown trip, 400 without tripId/bay', async () => {
    when(trip.findUnique(anything())).thenResolve(null);
    await expect(set.beforeCreate({ tripId: 'T9', bay: 'B1' }, { principal: personas.kasun, headers: {} })).rejects.toMatchObject({ status: 404 });
    await expect(set.beforeCreate({ tripId: 'T9' }, { principal: personas.kasun, headers: {} })).rejects.toMatchObject({ status: 400 });
  });

  it('RecordShortfalls delegates with the trip id', async () => {
    const shortfalls = [{ item: 'milk', qtyOrdered: 4, qtyLoaded: 3, reason: 'stock' }];
    when(trips.updateShortfalls(anything(), anything())).thenResolve({} as any);
    await set.recordShortfalls({ principal: personas.kasun, params: { shortfalls }, entity: { id: 'LR1', tripId: 'T1' }, headers: {} });
    expect(capture(trips.updateShortfalls).last()).toEqual(['T1', shortfalls]);
  });
});

describe('TripsService', () => {
  let trip: TripDelegate;
  let txTrip: TripDelegate;
  let txLoad: LoadRecordDelegate;
  let txPod: PodDelegate;
  let txOrder: UpdateDelegate;
  let txStop: UpdateDelegate;
  let service: TripsService;
  let notify: NotifyClient;
  let fleet: FleetClient;
  let travel: TravelDelegate;

  beforeEach(() => {
    trip = mock<TripDelegate>();
    txTrip = mock<TripDelegate>();
    txLoad = mock<LoadRecordDelegate>();
    txPod = mock<PodDelegate>();
    txOrder = mock<UpdateDelegate>();
    txStop = mock<UpdateDelegate>();
    const tx = { trip: instance(txTrip), loadRecord: instance(txLoad), pOD: instance(txPod), order: instance(txOrder), tripStop: instance(txStop) };
    travel = mock<TravelDelegate>();
    const prisma = { trip: instance(trip), districtTravel: instance(travel), $transaction: async (cb: (t: any) => any) => cb(tx) };
    notify = mock(NotifyClient);
    when(notify.notice(anything())).thenResolve(true);
    when(notify.publish(anything(), anything(), anything())).thenResolve(true);
    fleet = mock(FleetClient);
    when(fleet.recordFuel(anything(), anything())).thenResolve(true);
    service = new TripsService(prisma as any, instance(notify), instance(fleet));
    for (const d of [trip, txLoad, txOrder, txStop]) when(d.update(anything())).thenCall(async (a: any) => a);
    // a released trip comes back with its stops' outlets (for the stores to tell)
    when(txTrip.update(anything())).thenCall(async (a: any) => ({ ...a, id: 'T1', depot: 'KANDY', vehicleId: 'VEH057', driverId: 'ruwan', bay: 'K2', stops: [{ outletId: 'OUT106' }, { outletId: 'OUT108' }] }));
    when(txStop.findMany(anything())).thenResolve([{ orderId: 'O1' }, { orderId: 'O2' }]);
    for (const d of [txOrder, txStop]) when(d.updateMany(anything())).thenResolve({ count: 2 });
    when(txPod.upsert(anything())).thenResolve({});
    when(txTrip.findUnique(anything())).thenResolve({ status: 'LOADING' });
  });

  describe('updateStatus', () => {
    it.each([
      ['PLANNED', 'LOADING'],
      ['PLANNED', 'ENROUTE'],
      ['LOADING', 'ENROUTE'],
      ['LOADING', 'PLANNED'],
      ['ENROUTE', 'COMPLETE'],
      ['ENROUTE', 'ENROUTE'],
    ])('allows %s → %s', async (from, to) => {
      await service.updateStatus('T1', from as any, to as any);
      expect(capture(trip.update).last()[0]).toMatchObject({ where: { id: 'T1' }, data: { status: to } });
    });

    it.each([
      ['PLANNED', 'COMPLETE'],
      ['ENROUTE', 'PLANNED'],
      ['ENROUTE', 'LOADING'],
      ['COMPLETE', 'ENROUTE'],
      ['COMPLETE', 'PLANNED'],
    ])('refuses %s → %s with 409', async (from, to) => {
      await expect(service.updateStatus('T1', from as any, to as any)).rejects.toMatchObject({ status: 409 });
      verify(trip.update(anything())).never();
    });

    it('stamps returnTime on COMPLETE and keeps an explicit departTime', async () => {
      const departTime = new Date('2026-04-07T00:00:00.000Z');
      await service.updateStatus('T1', 'PLANNED', 'LOADING', departTime);
      expect(capture(trip.update).last()[0].data).toEqual({ status: 'LOADING', departTime });
      await service.updateStatus('T1', 'ENROUTE', 'COMPLETE');
      expect(capture(trip.update).last()[0].data.returnTime).toBeInstanceOf(Date);
    });

    describe('fuel', () => {
      beforeEach(() => {
        // Alpha: 15 km out, 10 min between stops; 3 stops on a 5 km/L truck → (2 × 15 + 2 × 5) / 5 = 8 L
        when(trip.findUnique(anything())).thenResolve({ vehicleId: 'V-T1', district: 'Alpha', vehicle: { kmPerLitre: 5 }, _count: { stops: 3 } });
        when(travel.findUnique(anything())).thenResolve({ district: 'Alpha', distKm: 15, depotToDistMin: 20, interStopMin: 10 });
      });

      it('a completed trip records the litres of its route with fleet', async () => {
        await service.updateStatus('T1', 'ENROUTE', 'COMPLETE');
        verify(fleet.recordFuel('V-T1', 8)).once();
        expect(capture(travel.findUnique).last()[0]).toEqual({ where: { district: 'Alpha' } });
      });

      it.each([['PLANNED', 'LOADING'], ['LOADING', 'ENROUTE'], ['COMPLETE', 'COMPLETE']])('records no fuel for %s → %s', async (from, to) => {
        await service.updateStatus('T1', from as any, to as any);
        verify(fleet.recordFuel(anything(), anything())).never();
      });
    });
  });

  describe('tripLitres', () => {
    it('is the round trip plus the hops between stops, at the vehicle km/L', () => {
      expect(tripLitres({ distKm: 30, depotToDistMin: 40, interStopMin: 12 }, 1, 6)).toBe(10);
      expect(tripLitres({ distKm: null, depotToDistMin: 50, interStopMin: 10 }, 2, 5)).toBe(13); // 2 × 50 × 0.6 + 5 = 65 km
      expect(tripLitres(null, 2, 5)).toBe(0);
      expect(tripLitres({ distKm: 30, depotToDistMin: 40, interStopMin: 12 }, 1, 0)).toBe(0);
    });
  });

  describe('release', () => {
    it.each(['ENROUTE', 'COMPLETE'])('refuses a %s trip with 409 before touching the load record', async (status) => {
      when(txTrip.findUnique(anything())).thenResolve({ status });
      when(txLoad.findUnique(anything())).thenResolve({ tripId: 'T1' });
      await expect(service.release('T1', 'SEAL-1')).rejects.toMatchObject({ status: 409 });
      expect(capture(txTrip.findUnique).last()[0]).toEqual({ where: { id: 'T1' }, select: { status: true } });
      verify(txLoad.update(anything())).never();
      verify(txTrip.update(anything())).never();
    });

    it('refuses a missing trip with 409', async () => {
      when(txTrip.findUnique(anything())).thenResolve(null);
      await expect(service.release('T1', 'SEAL-1')).rejects.toMatchObject({ status: 409 });
      verify(txLoad.findUnique(anything())).never();
    });

    it('releases a PLANNED trip too', async () => {
      when(txTrip.findUnique(anything())).thenResolve({ status: 'PLANNED' });
      when(txLoad.findUnique(anything())).thenResolve({ tripId: 'T1' });
      await expect(service.release('T1', 'SEAL-1')).resolves.toMatchObject({ data: { status: 'ENROUTE' } });
    });

    it('refuses a trip without a load record with 409', async () => {
      when(txLoad.findUnique(anything())).thenResolve(null);
      await expect(service.release('T1', 'SEAL-1')).rejects.toMatchObject({ status: 409 });
      verify(txTrip.update(anything())).never();
    });

    it('sends the open stops and their orders en route and tells the driver, depot and stores (trip_released)', async () => {
      when(txLoad.findUnique(anything())).thenResolve({ tripId: 'T1' });
      const out = await service.release('T1', 'SEAL-1');
      expect(out).not.toHaveProperty('stops');
      expect(capture(txStop.updateMany).last()[0]).toMatchObject({ where: { tripId: 'T1' }, data: { status: 'ENROUTE' } });
      expect(capture(txOrder.updateMany).last()[0]).toEqual({ where: { id: { in: ['O1', 'O2'] } }, data: { status: 'ENROUTE' } });
      expect(capture(notify.notice).last()[0]).toMatchObject({ recipientId: 'ruwan', type: 'TRIP_RELEASED', tripId: 'T1' });
      const [event, rooms, payload] = capture(notify.publish).last();
      expect(event).toBe('trip_released');
      expect(rooms).toEqual(['trip:T1', 'dispatcher:KANDY', 'loader:KANDY', 'driver:ruwan', 'store:OUT106', 'store:OUT108']);
      expect(payload).toMatchObject({ tripId: 'T1', vehicleId: 'VEH057', sealNumber: 'SEAL-1', outlets: ['OUT106', 'OUT108'] });
    });

    it('does not announce a release that was refused', async () => {
      when(txLoad.findUnique(anything())).thenResolve(null);
      await expect(service.release('T1', 'SEAL-1')).rejects.toMatchObject({ status: 409 });
      verify(notify.publish(anything(), anything(), anything())).never();
    });

    it('seals the load record and sends the trip ENROUTE', async () => {
      when(txLoad.findUnique(anything())).thenResolve({ tripId: 'T1' });
      await service.release('T1', 'SEAL-1', 4);
      const lr = capture(txLoad.update).last()[0];
      expect(lr.where).toEqual({ tripId: 'T1' });
      expect(lr.data).toMatchObject({ sealNumber: 'SEAL-1', reeferTempC: 4 });
      const t = capture(txTrip.update).last()[0];
      expect(t.data).toMatchObject({ status: 'ENROUTE', sealNumber: 'SEAL-1', reeferTempC: 4 });
      expect(t.data.departTime).toBe(lr.data.releasedAt);
    });

    it('omits the reefer temperature when not given', async () => {
      when(txLoad.findUnique(anything())).thenResolve({ tripId: 'T1' });
      await service.release('T1', 'SEAL-1');
      expect(capture(txTrip.update).last()[0].data).not.toHaveProperty('reeferTempC');
    });
  });

  describe('completeStop', () => {
    it('rejects unitsDelivered > unitsOrdered with 400', async () => {
      await expect(service.completeStop('S1', 'ORD1', { unitsDelivered: 11, unitsOrdered: 10 })).rejects.toMatchObject({
        status: 400,
        target: 'unitsDelivered',
      });
      await expect(service.completeStop('S1', 'ORD1', { unitsDelivered: -1, unitsOrdered: 10 })).rejects.toMatchObject({ status: 400 });
      verify(txPod.upsert(anything())).never();
    });

    it('upserts the POD and delivers order and stop', async () => {
      const arrivalActual = new Date('2026-04-07T01:00:00.000Z');
      await service.completeStop('S1', 'ORD1', { unitsDelivered: 8, unitsOrdered: 10, receiverName: 'F', arrivalActual });
      const pod = capture(txPod.upsert).last()[0];
      expect(pod.where).toEqual({ tripStopId: 'S1' });
      expect(pod.create).toMatchObject({ tripStopId: 'S1', unitsDelivered: 8, unitsOrdered: 10, receiverName: 'F' });
      expect(pod.create).not.toHaveProperty('arrivalActual');
      expect(pod.update.syncedAt).toBeInstanceOf(Date);
      expect(capture(txOrder.update).last()[0]).toEqual({ where: { id: 'ORD1' }, data: { status: 'DELIVERED' } });
      const stop = capture(txStop.update).last()[0];
      expect(stop.data).toMatchObject({ status: 'DELIVERED', arrivalActual });
      expect(stop.data.leaveActual).toBeInstanceOf(Date);
    });
  });

  it('getBayQueue ANDs the day range with the scope', async () => {
    when(trip.findMany(anything())).thenResolve([]);
    const scope = { depot: { in: ['KANDY'] } };
    await service.getBayQueue('KANDY', '2026-04-07', scope as any);
    const where = capture(trip.findMany).last()[0].where;
    expect(where.AND[0]).toEqual({
      depot: 'KANDY',
      runDate: { gte: new Date('2026-04-07T00:00:00.000Z'), lt: new Date('2026-04-08T00:00:00.000Z') },
    });
    expect(where.AND[1]).toBe(scope);
  });
});
