import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { personas } from '../../../libs/security/test/principals';
import { FleetService } from './fleet.service';
import { VehiclesSet } from './vehicles.set';

interface VehicleDelegate {
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
  count(args: any): Promise<number>;
  groupBy(args: any): Promise<any[]>;
}

describe('VehiclesSet', () => {
  let fleet: FleetService;
  let set: VehiclesSet;

  beforeEach(() => {
    fleet = mock(FleetService);
    set = new VehiclesSet({} as any, instance(fleet));
  });

  it('SetStatus delegates with the entity id and params', async () => {
    when(fleet.updateStatus(anything(), anything(), anything())).thenResolve({ id: 'VEH004', status: 'WORKSHOP' } as any);
    const res = await set.setStatus({ principal: personas.nilanthi, params: { status: 'WORKSHOP', workshopNote: 'compressor' }, entity: { id: 'VEH004' }, headers: {} });
    expect(res).toMatchObject({ status: 'WORKSHOP' });
    verify(fleet.updateStatus('VEH004', 'WORKSHOP' as any, 'compressor')).once();
  });

  describe('RecordFuel', () => {
    it.each([0, -5, 1000, 5000, NaN, undefined])('rejects litres=%p with 400', (litres) => {
      expect(() => set.recordFuel({ principal: personas.ruwan, params: { litres }, entity: { id: 'VEH057' }, headers: {} })).toThrow(
        expect.objectContaining({ status: 400, target: 'litres' }),
      );
    });

    it('records a valid amount', async () => {
      when(fleet.updateFuelUsage('VEH057', 42.5)).thenResolve({ id: 'VEH057' } as any);
      await set.recordFuel({ principal: personas.ruwan, params: { litres: 42.5 }, entity: { id: 'VEH057' }, headers: {} });
      verify(fleet.updateFuelUsage('VEH057', 42.5)).once();
    });
  });

  it('reads start a new fuel week first, so the planner never sees the litres of an earlier week', async () => {
    const prisma = { vehicle: { findMany: async () => [{ id: 'VEH057' }], findFirst: async () => ({ id: 'VEH057' }) } };
    set = new VehiclesSet(prisma as any, instance(fleet));
    when(fleet.resetFuelWeek()).thenResolve({ count: 1 });
    await expect(set.findMany({})).resolves.toEqual([{ id: 'VEH057' }]);
    await expect(set.findFirst({ where: { id: 'VEH057' } })).resolves.toEqual({ id: 'VEH057' });
    verify(fleet.resetFuelWeek()).twice();
  });

  it('Summary passes the caller row filter', async () => {
    const rowFilter = { depot: { in: ['KANDY'] } };
    when(fleet.getSummary(anything())).thenResolve({ total: 3 } as any);
    await set.summary({ principal: personas.kasun, params: {}, rowFilter, headers: {} });
    expect(capture(fleet.getSummary).last()).toEqual([rowFilter]);
  });
});

describe('FleetService', () => {
  let vehicle: VehicleDelegate;
  let service: FleetService;

  beforeEach(() => {
    vehicle = mock<VehicleDelegate>();
    service = new FleetService({ vehicle: instance(vehicle) } as any);
    when(vehicle.update(anything())).thenCall(async (a: any) => a);
    when(vehicle.updateMany(anything())).thenResolve({ count: 0 });
  });

  describe('updateStatus', () => {
    it('clears the workshop note when leaving WORKSHOP', async () => {
      await service.updateStatus('VEH004', 'AVAILABLE');
      expect(capture(vehicle.update).last()[0]).toEqual({ where: { id: 'VEH004' }, data: { status: 'AVAILABLE', workshopNote: null } });
    });

    it('keeps the existing note when entering WORKSHOP without a note', async () => {
      await service.updateStatus('VEH004', 'WORKSHOP');
      expect(capture(vehicle.update).last()[0].data).toEqual({ status: 'WORKSHOP' });
    });

    it('sets the note when one is given', async () => {
      await service.updateStatus('VEH004', 'WORKSHOP', 'brakes');
      expect(capture(vehicle.update).last()[0].data).toEqual({ status: 'WORKSHOP', workshopNote: 'brakes' });
    });
  });

  it('updateFuelUsage increments the weekly litres (rounded)', async () => {
    await service.updateFuelUsage('VEH057', 12.6);
    expect(capture(vehicle.update).last()[0]).toEqual({ where: { id: 'VEH057' }, data: { usedLThisWeek: { increment: 13 } } });
  });

  it('a new week (Monday 00:00 Colombo) starts the fuel count again before litres are added', async () => {
    const wednesday = new Date('2026-04-08T06:00:00Z');
    const monday = new Date('2026-04-05T18:30:00.000Z'); // Mon 6 Apr 00:00 Colombo
    await service.updateFuelUsage('VEH057', 5, wednesday);
    expect(capture(vehicle.updateMany).last()[0]).toEqual({ where: { fuelWeekStart: { lt: monday } }, data: { usedLThisWeek: 0, fuelWeekStart: monday } });
    verify(vehicle.updateMany(anything())).calledBefore(vehicle.update(anything()));
  });

  describe('getSummary', () => {
    it('returns totals, depot breakdown and availability inside the scope', async () => {
      const scope = { depot: { in: ['KANDY'] } };
      when(vehicle.count(anything())).thenCall(async (a: any) => {
        const status = a.where.AND?.[1]?.status;
        return status === 'WORKSHOP' ? 1 : status === 'ENROUTE' ? 2 : 10;
      });
      when(vehicle.groupBy(anything())).thenResolve([
        { depot: 'KANDY', tempClass: 'CHILLED', _count: { id: 4 } },
        { depot: 'KANDY', tempClass: 'AMBIENT', _count: { id: 6 } },
      ]);

      const res = await service.getSummary(scope as any);

      expect(res).toEqual({
        total: 10,
        byDepot: [
          { depot: 'KANDY', tempClass: 'CHILLED', count: 4 },
          { depot: 'KANDY', tempClass: 'AMBIENT', count: 6 },
        ],
        workshop: 1,
        enroute: 2,
        available: 7,
      });
      const countArgs = capture(vehicle.count);
      expect(countArgs.first()[0]).toEqual({ where: scope });
      expect(countArgs.second()[0]).toEqual({ where: { AND: [scope, { status: 'WORKSHOP' }] } });
      expect(capture(vehicle.groupBy).last()[0]).toMatchObject({ by: ['depot', 'tempClass'], where: scope });
    });

    it('uses an empty filter without a scope', async () => {
      when(vehicle.count(anything())).thenResolve(0);
      when(vehicle.groupBy(anything())).thenResolve([]);
      await expect(service.getSummary()).resolves.toMatchObject({ total: 0, available: 0 });
      expect(capture(vehicle.count).first()[0]).toEqual({ where: {} });
    });
  });
});
