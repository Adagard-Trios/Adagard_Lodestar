import { anything, capture, instance, mock, when } from 'ts-mockito';
import { CapacityService } from './capacity.service';

interface OrderDelegate {
  aggregate(a: any): Promise<any>;
}
interface VehicleDelegate {
  findMany(a: any): Promise<any[]>;
}

describe('CapacityService', () => {
  let order: OrderDelegate;
  let vehicle: VehicleDelegate;
  let service: CapacityService;

  beforeEach(() => {
    order = mock<OrderDelegate>();
    vehicle = mock<VehicleDelegate>();
    service = new CapacityService({ order: instance(order), vehicle: instance(vehicle) } as any);
  });

  describe('getChilledDemand', () => {
    it('uses the stored run-date window and excludes deferred, exception and cancelled orders', async () => {
      when(order.aggregate(anything())).thenResolve({ _sum: { m3: 118.4, kg: 9000 }, _count: { id: 42 } });
      // 17:00 UTC is 22:30 in Colombo, still 7 Apr there: select 7 Apr, whatever the server time zone.
      const res = await service.getChilledDemand('PELIYAGODA', new Date('2026-04-07T17:00:00.000Z'));

      expect(res).toEqual({ m3: 118.4, kg: 9000, orders: 42 });
      const [args] = capture(order.aggregate).last();
      expect(args.where.runDate).toEqual({ gte: new Date('2026-04-07T00:00:00.000Z'), lt: new Date('2026-04-08T00:00:00.000Z') });
      expect(args.where).toMatchObject({ tempClass: 'CHILLED', outlet: { depot: 'PELIYAGODA' } });
      expect(args.where.status.notIn).toEqual(expect.arrayContaining(['DEFERRED', 'EXCEPTION', 'CANCELLED']));
    });

    it('treats empty sums as zero', async () => {
      when(order.aggregate(anything())).thenResolve({ _sum: { m3: null, kg: null }, _count: { id: 0 } });
      await expect(service.getChilledDemand('KANDY', new Date('2026-04-07T00:00:00.000Z'))).resolves.toEqual({ m3: 0, kg: 0, orders: 0 });
    });
  });

  it('getReeferCapacity sums available chilled vehicles', async () => {
    when(vehicle.findMany(anything())).thenResolve([
      { capacityKg: 1000, capacityM3: 10.5 },
      { capacityKg: 2000, capacityM3: 20 },
    ]);
    const res = await service.getReeferCapacity('KANDY');
    expect(res).toMatchObject({ totalKg: 3000, totalM3: 30.5 });
    expect(capture(vehicle.findMany).last()[0].where).toEqual({ depot: 'KANDY', tempClass: 'CHILLED', status: 'AVAILABLE' });
  });
});
