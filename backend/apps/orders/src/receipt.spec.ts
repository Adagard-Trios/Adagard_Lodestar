import 'reflect-metadata';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { operationsOf } from '@lodestar/odata';
import { NotifyClient, rowFilter } from '@lodestar/security';
import { personas } from '../../../libs/security/test/principals';
import { creditNotePrefix, creditNoteSequence, OrdersService, ReceiptException } from './orders.service';
import { OrdersSet } from './orders.sets';

interface OrderDelegate {
  findUnique(a: any): Promise<any>;
  findFirst(a: any): Promise<any>;
  update(a: any): Promise<any>;
}
interface PodDelegate {
  findFirst(a: any): Promise<any>;
  update(a: any): Promise<any>;
}
interface FindManyDelegate {
  findMany(a: any): Promise<any[]>;
}

const SAVED = new Date('2026-04-07T07:05:00+05:30');

describe('Orders ConfirmReceipt (SM-03)', () => {
  describe('OrdersSet action', () => {
    let orders: OrdersService;
    let set: OrdersSet;

    beforeEach(() => {
      orders = mock(OrdersService);
      set = new OrdersSet({} as any, instance(orders));
      when(orders.confirmReceipt(anything(), anything(), anything())).thenResolve({ id: 'ORD0104217', status: 'DELIVERED' } as any);
    });

    it('is a store-manager-only, idempotent action returning the order', () => {
      const meta = operationsOf(OrdersSet).find((o) => o.name === 'ConfirmReceipt')!;
      expect(meta).toMatchObject({ kind: 'action', binding: 'entity', roles: ['store_manager'], returns: 'Lodestar.Order', idempotent: true });
      expect(meta.params).toMatchObject({
        unitsReceived: { type: 'Edm.Int32', required: true },
        unitsExpected: { type: 'Edm.Int32', required: true },
        note: 'Edm.String',
        savedAt: { type: 'Edm.DateTimeOffset', required: true },
      });
    });

    it('loads the order through the store manager outlet row filter (ABAC)', () => {
      expect(rowFilter(personas.fathima, set.options.abac)).toEqual({ outletId: 'OUT106' });
    });

    it('records the count as the caller', async () => {
      const params = { unitsReceived: 31, unitsExpected: 34, note: 'yoghurt short', savedAt: SAVED };
      await set.confirmReceipt({ principal: personas.fathima, params, entity: { id: 'ORD0104217', outletId: 'OUT106' }, headers: {} });
      verify(orders.confirmReceipt('ORD0104217', 'fathima', anything())).once();
      expect(capture(orders.confirmReceipt).last()[2]).toEqual(params);
    });

    it("403s for another outlet's order even if it was loaded", async () => {
      expect(() =>
        set.confirmReceipt({ principal: personas.fathima, params: { unitsReceived: 1, unitsExpected: 1, savedAt: SAVED }, entity: { id: 'ORD1', outletId: 'OUT108' }, headers: {} }),
      ).toThrow(expect.objectContaining({ status: 403 }));
      verify(orders.confirmReceipt(anything(), anything(), anything())).never();
    });
  });

  describe('OrdersService.confirmReceipt', () => {
    let order: OrderDelegate;
    let pod: PodDelegate;
    let service: OrdersService;
    let tx: any;
    let notify: NotifyClient;
    let outerOrder: OrderDelegate;
    let user: FindManyDelegate;

    const delivered = (podRow: any = null, extra: any = {}) => ({ id: 'ORD0104217', status: 'DELIVERED', unitsReceived: null, tripStop: podRow === undefined ? null : { pod: podRow }, ...extra });

    beforeEach(() => {
      order = mock<OrderDelegate>();
      pod = mock<PodDelegate>();
      tx = { order: instance(order), pOD: instance(pod) };
      outerOrder = mock<OrderDelegate>();
      user = mock<FindManyDelegate>();
      const prisma = { $transaction: jest.fn(async (fn: (t: any) => Promise<unknown>) => fn(tx)), order: instance(outerOrder), user: instance(user) };
      notify = mock(NotifyClient);
      when(notify.notice(anything())).thenResolve(true);
      // the receipt's outlet (Kandy) and trip, and the dispatchers: one based at Kandy, one at Peliyagoda
      when(outerOrder.findUnique(anything())).thenResolve({ outletId: 'OUT106', outlet: { depot: 'KANDY', name: 'Waypoint Fresh Kandy' }, tripStop: { tripId: 'T1' } });
      when(user.findMany(anything())).thenResolve([{ id: 'kandy-dispatcher', depot: 'KANDY' }, { id: 'nilanthi', depot: 'PELIYAGODA' }]);
      service = new OrdersService(prisma as any, instance(notify));
      when(order.update(anything())).thenCall(async (a: any) => ({ id: a.where.id, ...a.data }));
      when(pod.update(anything())).thenResolve({});
      when(order.findFirst(anything())).thenResolve(null);
      when(pod.findFirst(anything())).thenResolve(null);
    });

    it('a full count: DELIVERED with the receipt recorded, no credit note', async () => {
      when(order.findUnique(anything())).thenResolve(delivered({ id: 'POD1', creditNoteId: null, exceptions: null }, { status: 'ENROUTE' }));
      const res = await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 34, unitsExpected: 34, note: '  ', savedAt: SAVED });
      expect(res).toMatchObject({ status: 'DELIVERED', unitsReceived: 34, unitsExpected: 34, receiptNote: null, receiptSavedAt: SAVED, receivedBy: 'fathima', creditNoteId: null });
      expect((res as any).receivedAt).toBeInstanceOf(Date);
      verify(pod.update(anything())).never();
    });

    it("a short count reuses the POD's credit note and adds the shortfall to its exceptions", async () => {
      const driverException = { type: 'SHORT', description: 'Yoghurt 80g: 2 of 6 cases not loaded', photoUrl: null };
      when(order.findUnique(anything())).thenResolve(delivered({ id: 'POD-ORD0104217', creditNoteId: 'CN-2604-0441', exceptions: [driverException] }));
      const res = await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 31, unitsExpected: 34, note: 'chicken tray damaged', savedAt: SAVED });

      expect(res).toMatchObject({ creditNoteId: 'CN-2604-0441', unitsReceived: 31, receiptNote: 'chicken tray damaged' });
      const [podUpdate] = capture(pod.update).last();
      expect(podUpdate.where).toEqual({ id: 'POD-ORD0104217' });
      expect(podUpdate.data.creditNoteId).toBe('CN-2604-0441');
      expect(podUpdate.data.exceptions).toEqual([
        driverException,
        {
          type: 'SHORT',
          source: 'STORE_RECEIPT',
          description: 'Store counted 31 of 34 units (3 short)',
          unitsShort: 3,
          note: 'chicken tray damaged',
          photoUrl: null,
          reportedBy: 'fathima',
          at: SAVED.toISOString(),
        } satisfies ReceiptException,
      ]);
      verify(order.findFirst(anything())).never(); // no new number drawn
    });

    it('a short count without a POD credit note draws the next CN of the month (orders and PODs share the series)', async () => {
      when(order.findUnique(anything())).thenResolve(delivered({ id: 'POD2', creditNoteId: null, exceptions: null }));
      when(order.findFirst(anything())).thenResolve({ creditNoteId: 'CN-2604-0007' });
      when(pod.findFirst(anything())).thenResolve({ creditNoteId: 'CN-2604-0441' });
      const res = await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 0, unitsExpected: 5, savedAt: SAVED });
      expect(res).toMatchObject({ creditNoteId: 'CN-2604-0442' });
      expect(capture(order.findFirst).last()[0]).toMatchObject({ where: { creditNoteId: { startsWith: 'CN-2604-' } }, orderBy: { creditNoteId: 'desc' } });
      expect(capture(pod.update).last()[0].data).toMatchObject({ creditNoteId: 'CN-2604-0442' });
    });

    it('a short count before the driver POD synced: credit note on the order only', async () => {
      when(order.findUnique(anything())).thenResolve(delivered(undefined, { status: 'ENROUTE' }));
      const res = await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 2, unitsExpected: 3, savedAt: SAVED });
      expect(res).toMatchObject({ status: 'DELIVERED', creditNoteId: 'CN-2604-0001' });
      verify(pod.update(anything())).never();
    });

    describe("the store's issue reaches dispatch (RECEIPT_ISSUE, DSP-13)", () => {
      it("a short count tells the depot's dispatchers, with the shortfall, note and credit note", async () => {
        when(order.findUnique(anything())).thenResolve(delivered({ id: 'POD1', creditNoteId: 'CN-2604-0441', exceptions: [] }));
        await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 31, unitsExpected: 34, note: 'Damaged: tray torn', savedAt: SAVED });
        verify(notify.notice(anything())).once();
        const [n] = capture(notify.notice).last();
        expect(n).toMatchObject({ recipientId: 'kandy-dispatcher', type: 'RECEIPT_ISSUE', tripId: 'T1', outletId: 'OUT106' });
        expect(n.payload).toMatchObject({ orderId: 'ORD0104217', outletId: 'OUT106', tripId: 'T1', short: 3, note: 'Damaged: tray torn', creditNoteId: 'CN-2604-0441' });
        expect(capture(user.findMany).last()[0]).toEqual({ where: { role: 'DISPATCHER', isActive: true }, select: { id: true, depot: true } });
      });

      it('a full count with an issue reported is sent too', async () => {
        when(order.findUnique(anything())).thenResolve(delivered(null));
        await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 34, unitsExpected: 34, note: 'Damaged: one tray torn', savedAt: SAVED });
        const [n] = capture(notify.notice).last();
        expect(n).toMatchObject({ type: 'RECEIPT_ISSUE', payload: { short: 0, note: 'Damaged: one tray torn' } });
      });

      it('with no dispatcher based at the depot, every dispatcher covers it', async () => {
        when(user.findMany(anything())).thenResolve([{ id: 'nilanthi', depot: 'PELIYAGODA' }]);
        when(order.findUnique(anything())).thenResolve(delivered(null));
        await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 1, unitsExpected: 3, savedAt: SAVED });
        verify(notify.notice(anything())).once();
        expect(capture(notify.notice).last()[0]).toMatchObject({ recipientId: 'nilanthi', type: 'RECEIPT_ISSUE' });
      });

      it('a full, clean count tells nobody', async () => {
        when(order.findUnique(anything())).thenResolve(delivered(null));
        await service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 34, unitsExpected: 34, savedAt: SAVED });
        verify(notify.notice(anything())).never();
      });

      it('a refused receipt tells nobody', async () => {
        when(order.findUnique(anything())).thenResolve(delivered(null, { unitsReceived: 34 }));
        await expect(service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 1, unitsExpected: 3, savedAt: SAVED })).rejects.toMatchObject({ status: 409 });
        verify(notify.notice(anything())).never();
      });
    });

    it('draws again when two receipts raced for the same credit note number', async () => {
      when(order.findUnique(anything())).thenResolve(delivered(undefined));
      when(order.update(anything()))
        .thenReject(Object.assign(new Error('unique'), { code: 'P2002', meta: { target: ['creditNoteId'] } }))
        .thenCall(async (a: any) => ({ id: a.where.id, ...a.data }));
      await expect(service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 1, unitsExpected: 3, savedAt: SAVED })).resolves.toMatchObject({ status: 'DELIVERED' });
      verify(order.update(anything())).twice();
    });

    it.each([
      ['already confirmed', delivered(null, { unitsReceived: 34 }), 409],
      ['still being planned', delivered(null, { status: 'PLANNED' }), 409],
      ['cancelled', delivered(null, { status: 'CANCELLED' }), 409],
      ['missing', null, 404],
    ])('refuses an order that is %s', async (_label, row, status) => {
      when(order.findUnique(anything())).thenResolve(row);
      await expect(service.confirmReceipt('ORD0104217', 'fathima', { unitsReceived: 1, unitsExpected: 1, savedAt: SAVED })).rejects.toMatchObject({ status });
      verify(order.update(anything())).never();
    });

    it.each([
      ['more received than expected', { unitsReceived: 5, unitsExpected: 4 }, 'unitsReceived'],
      ['negative received', { unitsReceived: -1, unitsExpected: 4 }, 'unitsReceived'],
      ['fractional expected', { unitsReceived: 1, unitsExpected: 1.5 }, 'unitsExpected'],
      ['a bad savedAt', { unitsReceived: 1, unitsExpected: 1, savedAt: new Date('x') }, 'savedAt'],
      ['a long note', { unitsReceived: 1, unitsExpected: 1, note: 'x'.repeat(501) }, 'note'],
    ])('400 for %s', async (_label, input: any, target) => {
      await expect(service.confirmReceipt('ORD1', 'fathima', { savedAt: SAVED, ...input })).rejects.toMatchObject({ status: 400, target });
      verify(order.findUnique(anything())).never();
    });
  });

  describe('credit note numbering', () => {
    it('uses the Sri Lanka month of the count', () => {
      expect(creditNotePrefix(SAVED)).toBe('CN-2604-');
      expect(creditNotePrefix(new Date('2026-04-30T19:00:00Z'))).toBe('CN-2605-'); // 00:30 on 1 May in Colombo
    });

    it('reads the sequence of ids of the same month only', () => {
      expect(creditNoteSequence('CN-2604-0441', 'CN-2604-')).toBe(441);
      expect(creditNoteSequence('CN-2603-0999', 'CN-2604-')).toBe(0);
      expect(creditNoteSequence('CN-2604-x', 'CN-2604-')).toBe(0);
      expect(creditNoteSequence(null, 'CN-2604-')).toBe(0);
    });
  });
});
