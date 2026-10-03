import 'reflect-metadata';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { operationsOf } from '@lodestar/odata';
import { NotifyClient } from '@lodestar/security';
import { personas } from '../../../libs/security/test/principals';
import { ORDER_TRANSITIONS, OrdersService } from './orders.service';
import { OrdersSet } from './orders.sets';

const day = (d: string) => new Date(`${d}T00:00:00.000Z`);

/** An in-memory outlets.Calendar for the operating-day rule. */
function calendarOf(rows: Array<{ date: Date; isOperating: boolean }>) {
  return {
    findMany: jest.fn(async ({ where }: any) => rows.filter((r) => +r.date >= +where.date.gte && +r.date < +where.date.lt)),
    findUnique: jest.fn(async ({ where }: any) => rows.find((r) => +r.date === +where.date) ?? null),
  };
}

describe('OrdersService', () => {
  let notify: NotifyClient;
  beforeEach(() => {
    notify = mock(NotifyClient);
    when(notify.publish(anything(), anything(), anything())).thenResolve(true);
    when(notify.notice(anything())).thenResolve(true);
  });

  describe('nextOperatingRunDate (Calendar.isOperating; a silent calendar runs Monday to Saturday)', () => {
    const svc = (rows: Array<{ date: Date; isOperating: boolean }>) => new OrdersService({ calendar: calendarOf(rows) } as any, instance(notify));

    it('a Sunday with no Calendar row is not a run: Saturday 3 Oct orders for Sunday go to Monday 5 Oct', async () => {
      await expect(svc([]).nextOperatingRunDate('2026-10-04')).resolves.toBe('2026-10-05');
      await expect(svc([]).nextOperatingRunDate('2026-10-03')).resolves.toBe('2026-10-03'); // Saturday runs
    });

    it('a Calendar row decides: an operating Sunday runs, a Monday holiday does not', async () => {
      await expect(svc([{ date: day('2026-10-04'), isOperating: true }]).nextOperatingRunDate('2026-10-04')).resolves.toBe('2026-10-04');
      await expect(svc([{ date: day('2026-10-05'), isOperating: false }]).nextOperatingRunDate('2026-10-04')).resolves.toBe('2026-10-06');
    });

    it('accepts a stored run date (Date)', async () => {
      await expect(svc([]).nextOperatingRunDate(day('2026-10-04'))).resolves.toBe('2026-10-05');
    });
  });

  describe('updateStatus (Lodestar.SetStatus)', () => {
    let order: { findUnique: jest.Mock; update: jest.Mock };
    let tripStop: { updateMany: jest.Mock };
    let svc: OrdersService;
    beforeEach(() => {
      order = { findUnique: jest.fn(), update: jest.fn(async (a: any) => ({ id: a.where.id, ...a.data })) };
      tripStop = { updateMany: jest.fn(async () => ({ count: 1 })) };
      const tx = { order, tripStop };
      svc = new OrdersService({ order, $transaction: async (fn: any) => fn(tx) } as any, instance(notify));
    });

    it('allows the designed moves and keeps the trip stop in step', async () => {
      order.findUnique.mockResolvedValue({ id: 'ORD1', status: 'ENROUTE' });
      await expect(svc.updateStatus('ORD1', 'EXCEPTION' as any, 'van broke down')).resolves.toMatchObject({ status: 'EXCEPTION', notes: 'van broke down' });
      expect(tripStop.updateMany).toHaveBeenCalledWith({ where: { orderId: 'ORD1' }, data: { status: 'EXCEPTION' } });
      order.findUnique.mockResolvedValue({ id: 'ORD1', status: 'EXCEPTION' });
      await expect(svc.updateStatus('ORD1', 'DELIVERED' as any)).resolves.toMatchObject({ status: 'DELIVERED' });
    });

    it.each([
      ['DELIVERED', 'RECEIVED'],
      ['DELIVERED', 'ENROUTE'],
      ['CANCELLED', 'RECEIVED'],
      ['RECEIVED', 'DELIVERED'],
      ['RECEIVED', 'CANCELLED'], // cancelling is Lodestar.Cancel
    ])('refuses %s → %s with 409 and writes nothing', async (from, to) => {
      order.findUnique.mockResolvedValue({ id: 'ORD1', status: from });
      await expect(svc.updateStatus('ORD1', to as any)).rejects.toMatchObject({ status: 409 });
      expect(order.update).not.toHaveBeenCalled();
      expect(tripStop.updateMany).not.toHaveBeenCalled();
    });

    it('400 for an unknown status, 404 for an unknown order', async () => {
      await expect(svc.updateStatus('ORD1', 'LOST' as any)).rejects.toMatchObject({ status: 400, target: 'status' });
      order.findUnique.mockResolvedValue(null);
      await expect(svc.updateStatus('ORD1', 'PLANNED' as any)).rejects.toMatchObject({ status: 404 });
    });

    it('the same status again only updates the notes', async () => {
      order.findUnique.mockResolvedValue({ id: 'ORD1', status: 'DELIVERED' });
      await svc.updateStatus('ORD1', 'DELIVERED' as any, 'checked');
      expect(tripStop.updateMany).not.toHaveBeenCalled();
      expect(order.update).toHaveBeenCalledWith({ where: { id: 'ORD1' }, data: { status: 'DELIVERED', notes: 'checked' } });
    });

    it('nothing leaves CANCELLED, and every status has an entry', () => {
      expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
      expect(Object.keys(ORDER_TRANSITIONS).sort()).toEqual(['CANCELLED', 'DEFERRED', 'DELIVERED', 'ENROUTE', 'EXCEPTION', 'LOADED', 'PLANNED', 'RECEIVED']);
    });

    it('is dispatch-only: loaders and drivers move orders through their own actions', () => {
      const meta = operationsOf(OrdersSet).find((o) => o.name === 'SetStatus')!;
      expect(meta.roles).toEqual(['dispatcher', 'admin', 'svc']);
      expect(meta.roles).not.toContain(personas.kasun.roles[0]);
      expect(meta.roles).not.toContain(personas.ruwan.roles[0]);
    });
  });

  describe('announceCreated (order_created)', () => {
    it("tells the outlet's depot dispatchers and the store, with the run date", async () => {
      const outlet = { findUnique: jest.fn(async () => ({ depot: 'KANDY' })) };
      const svc = new OrdersService({ outlet } as any, instance(notify));
      await svc.announceCreated({ id: 'ORD0104300', outletId: 'OUT106', runDate: day('2026-10-05'), units: 12, tempClass: 'CHILLED', status: 'RECEIVED' });
      const [event, rooms, payload] = capture(notify.publish).last();
      expect(event).toBe('order_created');
      expect(rooms).toEqual(['dispatcher:KANDY', 'store:OUT106']);
      expect(payload).toMatchObject({ orderId: 'ORD0104300', outletId: 'OUT106', depot: 'KANDY', runDate: '2026-10-05', units: 12 });
      verify(notify.notice(anything())).never();
    });
  });

  describe('order window (dispatch closes orders for a run: Orders/Lodestar.CloseOrders)', () => {
    const closures = () => {
      const rows = new Map<string, any>();
      const k = (w: any) => `${w.depot_runDate.depot}|${w.depot_runDate.runDate.toISOString()}`;
      return {
        rows,
        findUnique: jest.fn(async ({ where }: any) => rows.get(k(where)) ?? null),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const row = rows.has(k(where)) ? { ...rows.get(k(where)), ...update } : { closedAt: new Date('2026-10-04T10:00:00Z'), ...create };
          rows.set(k(where), row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = { ...rows.get(k(where)), ...data };
          rows.set(k(where), row);
          return row;
        }),
      };
    };
    const outlet = { findUnique: jest.fn(async () => ({ depot: 'KANDY' })), findMany: jest.fn(async () => [{ id: 'OUT106' }]) };

    it('closes, refuses new orders with 422 OrdersClosed, reopens, and tells the desk and the stores', async () => {
      const orderClosure = closures();
      const svc = new OrdersService({ orderClosure, outlet } as any, instance(notify));
      await expect(svc.orderWindow('KANDY', '2026-10-05')).resolves.toMatchObject({ depot: 'KANDY', runDate: '2026-10-05', closed: false });
      await expect(svc.assertOrdersOpen('OUT106', '2026-10-05')).resolves.toBeUndefined();

      const closed = await svc.closeOrders('KANDY', '2026-10-05', 'nilanthi', '  Planning the run  ');
      expect(closed).toMatchObject({ closed: true, closedBy: 'nilanthi', reason: 'Planning the run' });
      expect(capture(notify.publish).last()).toEqual(['order_window', ['dispatcher:KANDY', 'store:OUT106'], { depot: 'KANDY', runDate: '2026-10-05', closed: true }]);
      await expect(svc.assertOrdersOpen('OUT106', '2026-10-05T00:00:00.000Z')).rejects.toMatchObject({ status: 422, code: 'OrdersClosed', target: 'runDate' });
      // another run date and closing twice are no-ops for the closure
      await expect(svc.assertOrdersOpen('OUT106', '2026-10-06')).resolves.toBeUndefined();
      await svc.closeOrders('KANDY', '2026-10-05', 'someone-else');
      expect(orderClosure.upsert).toHaveBeenCalledTimes(1);

      const reopened = await svc.reopenOrders('KANDY', '2026-10-05', 'nilanthi');
      expect(reopened).toMatchObject({ closed: false, reopenedBy: 'nilanthi' });
      await expect(svc.assertOrdersOpen('OUT106', '2026-10-05')).resolves.toBeUndefined();
      await svc.reopenOrders('KANDY', '2026-10-05', 'nilanthi');
      expect(orderClosure.update).toHaveBeenCalledTimes(1);
      verify(notify.publish('order_window', anything(), anything())).twice();
    });
  });
});
