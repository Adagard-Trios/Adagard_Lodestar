import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Prisma } from '@prisma/client';
import {
  buildEdmModel,
  DmmfDatamodel,
  entitySetOptions,
  IdempotencyRecord,
  IdempotencyService,
  IdempotencyStore,
  ODataEngine,
  ODataRegistry,
  operationsOf,
  requestHash,
} from '@lodestar/odata';
import { personas } from '../../../libs/security/test/principals';
import { TripsService } from './trips.service';
import { LoadRecordsSet, PODsSet, TripsSet, TripStopsSet } from './trips.sets';

interface Delegate {
  findFirst(a: any): Promise<any>;
  findUnique(a: any): Promise<any>;
}

describe('trips writes honour Idempotency-Key', () => {
  it('declares Release, RecordShortfalls and POST LoadRecords idempotent (and nothing else)', () => {
    const idempotent = [TripsSet, TripStopsSet, LoadRecordsSet].flatMap((c) => operationsOf(c).filter((o) => o.idempotent).map((o) => o.name));
    expect(idempotent.sort()).toEqual(['RecordShortfalls', 'Release']);
    expect(entitySetOptions(LoadRecordsSet)?.idempotentCreate).toBe(true);
    expect(entitySetOptions(TripsSet)?.idempotentCreate).toBeUndefined();
  });

  describe('Trips Release through the engine', () => {
    let trips: TripsService;
    let trip: Delegate;
    let store: IdempotencyStore;
    let engine: ODataEngine;
    const released = { id: 'T1', status: 'ENROUTE', sealNumber: 'KDY-57-10413', updatedAt: new Date(2) };
    const body = { sealNumber: 'KDY-57-10413', reeferTempC: 3 };
    const request = (b: object = body) => ({
      method: 'POST',
      path: "/Trips('T1')/Lodestar.Release",
      query: '',
      headers: { 'idempotency-key': 'rel-0001' },
      body: b,
      principal: personas.kasun,
      baseUrl: 'https://localhost:8443/odata/v4',
    });

    beforeEach(() => {
      trips = mock(TripsService);
      trip = mock<Delegate>();
      store = mock<IdempotencyStore>();
      when(trip.findFirst(anything())).thenResolve({ id: 'T1', depot: 'KANDY', status: 'LOADING', updatedAt: new Date(1) });
      when(trips.release('T1', 'KDY-57-10413', 3)).thenResolve(released as any);
      when(store.find(anything(), anything())).thenResolve(null);
      when(store.claim(anything())).thenResolve(true);
      when(store.complete(anything(), anything(), anything())).thenResolve();
      when(store.purgeExpired(anything())).thenResolve(0);
      const prisma = { trip: instance(trip) } as any;
      const model = buildEdmModel(Prisma.dmmf.datamodel as unknown as DmmfDatamodel);
      const registry = new ODataRegistry('trips', model, [
        new TripsSet(prisma, instance(trips)),
        new TripStopsSet(prisma, instance(trips)),
        new PODsSet(prisma),
        new LoadRecordsSet(prisma, instance(trips)),
      ]);
      engine = new ODataEngine(registry, {}, undefined, new IdempotencyService(instance(store)));
    });

    it('a first release runs and is stored under the loader and route', async () => {
      const res = await engine.handle(request());
      expect(res).toMatchObject({ status: 200, body: { id: 'T1', status: 'ENROUTE' }, audit: { action: 'Trips.Release' } });
      verify(trips.release('T1', 'KDY-57-10413', 3)).once();
      verify(store.claim(anything())).once();
      verify(store.complete('kasun', 'rel-0001', anything())).once();
    });

    it('a retry after a lost response is replayed without releasing again', async () => {
      const stored: IdempotencyRecord = {
        key: 'rel-0001',
        userId: 'kasun',
        route: "POST /Trips('T1')/Lodestar.Release",
        requestHash: requestHash(body),
        status: 'DONE',
        response: { status: 200, headers: { 'OData-Version': '4.0' }, body: { id: 'T1', status: 'ENROUTE' }, audit: { action: 'Trips.Release', entitySet: 'Trips', entityKey: 'T1' } },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };
      when(store.find('kasun', 'rel-0001')).thenResolve(stored);
      const res = await engine.handle(request());
      expect(res.headers['Idempotent-Replay']).toBe('true');
      expect(res.body).toEqual({ id: 'T1', status: 'ENROUTE' });
      verify(trips.release(anything(), anything(), anything())).never();

      await expect(engine.handle(request({ sealNumber: 'KDY-OTHER' }))).rejects.toMatchObject({ status: 422, code: 'IdempotencyKeyReused' });
      verify(trips.release(anything(), anything(), anything())).never();
    });
  });
});
