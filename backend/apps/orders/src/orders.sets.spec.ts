import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { ODataError } from '@lodestar/odata';
import { personas } from '../../../libs/security/test/principals';
import { OrdersService } from './orders.service';
import { OrdersSet } from './orders.sets';

/** Prisma delegate surface the Orders set touches. */
interface OutletDelegate {
  findUnique(args: any): Promise<any>;
}

describe('OrdersSet', () => {
  let orders: OrdersService;
  let outlet: OutletDelegate;
  let set: OrdersSet;

  beforeEach(() => {
    orders = mock(OrdersService);
    outlet = mock<OutletDelegate>();
    set = new OrdersSet({ outlet: instance(outlet) } as any, instance(orders));
    when(orders.nextOrderId()).thenResolve('ORD0104300');
  });

  const body = { outletId: 'OUT106', runDate: new Date('2026-04-08'), brand: 'FRESH', tempClass: 'CHILLED', units: 4, kg: 20, m3: 0.2 };

  describe('beforeCreate (ABAC on writes)', () => {
    it('lets a store manager order for her own outlet and fills server-side fields', async () => {
      when(outlet.findUnique(anything())).thenResolve({ depot: 'KANDY' });
      const data = await set.beforeCreate({ ...body }, { principal: personas.fathima, headers: {} });
      expect(data).toMatchObject({ id: 'ORD0104300', status: 'RECEIVED', outletId: 'OUT106' });
      expect(data.orderedAt).toBeInstanceOf(Date);
    });

    it('refuses an order for another outlet', async () => {
      when(outlet.findUnique(anything())).thenResolve({ depot: 'KANDY' });
      await expect(set.beforeCreate({ ...body, outletId: 'OUT108' }, { principal: personas.fathima, headers: {} })).rejects.toMatchObject({
        status: 403,
      });
    });

    it('lets a dispatcher order for an outlet in her depots only', async () => {
      when(outlet.findUnique(anything())).thenResolve({ depot: 'KANDY' });
      await expect(set.beforeCreate({ ...body }, { principal: personas.nilanthi, headers: {} })).resolves.toBeDefined();
      when(outlet.findUnique(anything())).thenResolve({ depot: 'KANDY' });
      const kandyOnly = { ...personas.nilanthi, depots: ['PELIYAGODA'] };
      await expect(set.beforeCreate({ ...body }, { principal: kandyOnly, headers: {} })).rejects.toBeInstanceOf(ODataError);
    });

    it('turns line items into a nested create and validates them', async () => {
      when(outlet.findUnique(anything())).thenResolve({ depot: 'KANDY' });
      const data = await set.beforeCreate(
        { ...body, lineItems: [{ name: 'Fresh milk', qty: 2, kg: 4, tempClass: 'CHILLED' }] },
        { principal: personas.admin, headers: {} },
      );
      expect(data.lineItems).toEqual({ create: [{ name: 'Fresh milk', qty: 2, kg: 4, tempClass: 'CHILLED' }] });
      await expect(
        set.beforeCreate({ ...body, lineItems: [{ name: 'x', qty: 0 }] }, { principal: personas.admin, headers: {} }),
      ).rejects.toThrow(/lineItems\[0\]/);
    });

    it('requires the order fields', async () => {
      await expect(set.beforeCreate({ outletId: 'OUT106' }, { principal: personas.admin, headers: {} })).rejects.toThrow(/runDate is required/);
    });
  });

  describe('beforeUpdate', () => {
    it('blocks a store edit once planning picked the order up', async () => {
      await expect(set.beforeUpdate({ notes: 'x' }, { id: 'ORD1', status: 'PLANNED' }, { principal: personas.fathima, headers: {} })).rejects.toMatchObject({
        status: 409,
      });
      await expect(set.beforeUpdate({ notes: 'x' }, { id: 'ORD1', status: 'RECEIVED' }, { principal: personas.fathima, headers: {} })).resolves.toEqual({
        notes: 'x',
      });
      await expect(set.beforeUpdate({ notes: 'x' }, { id: 'ORD1', status: 'PLANNED' }, { principal: personas.nilanthi, headers: {} })).resolves.toBeDefined();
    });
  });

  describe('Lodestar.Cancel', () => {
    it('cancels an order that is not loaded yet', async () => {
      when(orders.cancel('ORD1', 'duplicate')).thenResolve({ id: 'ORD1', status: 'CANCELLED' } as any);
      const res = await set.cancel({ principal: personas.fathima, params: { reason: 'duplicate' }, entity: { id: 'ORD1', status: 'RECEIVED' }, headers: {} });
      expect(res).toMatchObject({ status: 'CANCELLED' });
      verify(orders.cancel('ORD1', 'duplicate')).once();
    });

    it('refuses to cancel a delivered order', async () => {
      await expect(
        set.cancel({ principal: personas.fathima, params: {}, entity: { id: 'ORD1', status: 'DELIVERED' }, headers: {} }),
      ).rejects.toMatchObject({ status: 409 });
      verify(orders.cancel(anything(), anything())).never();
    });
  });

  describe('Lodestar.SetStatus and functions', () => {
    it('delegates the status change', async () => {
      when(orders.updateStatus('ORD1', 'LOADED' as any, undefined)).thenResolve({ id: 'ORD1' } as any);
      await set.setStatus({ principal: personas.kasun, params: { status: 'LOADED' }, entity: { id: 'ORD1' }, headers: {} });
      verify(orders.updateStatus('ORD1', 'LOADED' as any, undefined)).once();
    });

    it('passes the caller row filter into Summary and DeferralSuggestions', async () => {
      const rowFilter = { outlet: { is: { depot: { in: ['KANDY'] } } } };
      when(orders.getSummary(anything(), anything())).thenResolve({ total: 1 } as any);
      when(orders.getDeferralSuggestions(anything(), anything())).thenResolve([]);
      await set.summary({ principal: personas.nilanthi, params: { runDate: '2026-04-07' }, rowFilter, headers: {} });
      await set.deferralSuggestions({ principal: personas.nilanthi, params: { runDate: '2026-04-07' }, rowFilter, headers: {} });
      expect(capture(orders.getSummary).last()).toEqual(['2026-04-07', rowFilter]);
      expect(capture(orders.getDeferralSuggestions).last()).toEqual(['2026-04-07', rowFilter]);
    });
  });
});
