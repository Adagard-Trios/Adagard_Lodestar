import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { Prisma, OrderStatus, TempClass } from '@prisma/client';
import { addBusinessDays, businessDate, isOperatingDay, runDateRange, runDateValue, toBusinessDate } from '@lodestar/platform';
import { depotDispatchers, NOTIFY, NotifyClient } from '@lodestar/security';

/** Stored window [start, end) of a run date (YYYY-MM-DD, or a Date read in Sri Lanka time). */
export function dayRange(runDate: string | Date) {
  return runDateRange(runDate);
}

/** How far ahead a moved order looks for an operating day before taking the earliest date anyway. */
const OPERATING_DAY_HORIZON = 14;

/** Orders that may still be changed by their store (before planning picks them up). */
export const EDITABLE_STATUSES: OrderStatus[] = [OrderStatus.RECEIVED];
/** Orders that may still be cancelled. */
export const CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.RECEIVED, OrderStatus.PLANNED];
/** Orders a store can count in: on the van, at the door, or already delivered by the driver. */
export const RECEIVABLE_STATUSES: OrderStatus[] = [OrderStatus.LOADED, OrderStatus.ENROUTE, OrderStatus.DELIVERED, OrderStatus.EXCEPTION];

/** SM-03: the store's own count of a delivery. */
export interface ReceiptInput {
  unitsReceived: number;
  unitsExpected: number;
  note?: string | null;
  /** When the count was saved on the phone (the app may sync it hours later). */
  savedAt: Date;
}

/**
 * Exception appended to the POD when the store counts short (same shape as the driver's POD exceptions).
 * The credited units are `qty` (= unitsShort = unitsExpected - unitsReceived): the store's count governs the
 * credit, so a client reads a POD's credited units as the STORE_RECEIPT qty when there is one, else
 * unitsOrdered - unitsDelivered. The same count is on the order (unitsReceived / unitsExpected / creditNoteId).
 */
export interface ReceiptException {
  type: 'SHORT';
  source: 'STORE_RECEIPT';
  description: string;
  unitsShort: number;
  /** credited units (the field app reads exception quantities as qty) */
  qty: number;
  unitsReceived: number;
  unitsExpected: number;
  note: string | null;
  photoUrl: null;
  reportedBy: string;
  at: string;
}

/**
 * Status moves a dispatcher may make by hand (Orders('…')/Lodestar.SetStatus). The field moves have their own
 * actions (Release, CompleteStop, PushBatch, ConfirmReceipt) and cancelling is Lodestar.Cancel.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: [OrderStatus.PLANNED, OrderStatus.DEFERRED, OrderStatus.EXCEPTION],
  PLANNED: [OrderStatus.RECEIVED, OrderStatus.LOADED, OrderStatus.DEFERRED, OrderStatus.EXCEPTION],
  LOADED: [OrderStatus.PLANNED, OrderStatus.ENROUTE, OrderStatus.EXCEPTION],
  ENROUTE: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION],
  DELIVERED: [OrderStatus.EXCEPTION],
  // an exception is resolved: delivered after all, put back for a later run, or re-planned
  EXCEPTION: [OrderStatus.DELIVERED, OrderStatus.DEFERRED, OrderStatus.PLANNED, OrderStatus.RECEIVED],
  DEFERRED: [OrderStatus.RECEIVED, OrderStatus.PLANNED],
  CANCELLED: [],
};

/** Order statuses its trip stop follows (stop and order must agree on DSP-04 and DSP-13). */
const STOP_MIRRORED: OrderStatus[] = [OrderStatus.LOADED, OrderStatus.ENROUTE, OrderStatus.DELIVERED, OrderStatus.EXCEPTION];

const MAX_NOTE = 500;
const CREDIT_NOTE_ATTEMPTS = 3;

/** Credit note ids follow the scenario's format: CN-<yy><mm>-<4-digit sequence>, e.g. CN-2604-0441. */
export function creditNotePrefix(at: Date): string {
  const [y, m] = businessDate(at).split('-');
  return `CN-${y.slice(2)}${m}-`;
}

export function creditNoteSequence(id: string | null | undefined, prefix: string): number {
  if (!id?.startsWith(prefix)) return 0;
  const n = Number(id.slice(prefix.length));
  return Number.isInteger(n) ? n : 0;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(NOTIFY) private notify: NotifyClient,
  ) {}

  /** Summary stats for the plan board (DSP-01), limited to what the caller may see. */
  async getSummary(runDate: string, scope?: Prisma.OrderWhereInput) {
    const { start, end, iso } = dayRange(runDate);
    const where: Prisma.OrderWhereInput = { AND: [{ runDate: { gte: start, lt: end } }, scope ?? {}] };

    const [total, byStatus, chilled, deferred] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({ by: ['status'], where, _count: { id: true } }),
      this.prisma.order.aggregate({
        where: { AND: [where, { tempClass: TempClass.CHILLED }] },
        _sum: { m3: true, kg: true },
        _count: { id: true },
      }),
      this.prisma.order.count({ where: { AND: [where, { status: OrderStatus.DEFERRED }] } }),
    ]);

    return {
      runDate: iso,
      total,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {} as Record<string, number>),
      chilledM3: chilled._sum.m3 ?? 0,
      chilledKg: chilled._sum.kg ?? 0,
      chilledOrders: chilled._count.id,
      deferred,
      delivered: byStatus.find((s) => s.status === OrderStatus.DELIVERED)?._count.id ?? 0,
    };
  }

  /** Lowest-scoring unprotected orders of a run date: the deferral candidates. */
  getDeferralSuggestions(runDate: string, scope?: Prisma.OrderWhereInput) {
    const { start, end } = dayRange(runDate);
    return this.prisma.order.findMany({
      where: {
        AND: [
          { runDate: { gte: start, lt: end } },
          { status: { in: [OrderStatus.RECEIVED, OrderStatus.PLANNED] } },
          { deferralScore: { gt: 0, lt: 91 } }, // score < 91 means not protected
          scope ?? {},
        ],
      },
      orderBy: { deferralScore: 'asc' },
      take: 10,
    });
  }

  /**
   * A dispatcher's status move (ORDER_TRANSITIONS, else 409). Setting the current status again only updates
   * the notes. The order's trip stop follows LOADED / ENROUTE / DELIVERED / EXCEPTION.
   */
  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    if (!Object.values(OrderStatus).includes(status)) {
      throw ODataError.badRequest(`status must be one of ${Object.values(OrderStatus).join(', ')}`, 'status');
    }
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (status === OrderStatus.CANCELLED && order.status !== status) throw ODataError.conflict(`Use Lodestar.Cancel to cancel order ${id}`);
    if (order.status !== status && !ORDER_TRANSITIONS[order.status].includes(status)) {
      throw ODataError.conflict(`Order ${id} is ${order.status} and cannot move to ${status}`);
    }
    return this.prisma.$transaction(async (tx) => {
      if (order.status !== status && STOP_MIRRORED.includes(status)) {
        await tx.tripStop.updateMany({ where: { orderId: id }, data: { status } });
      }
      return tx.order.update({ where: { id }, data: { status, ...(notes ? { notes } : {}) } });
    });
  }

  /** A new order (POST Orders committed): the depot's dispatchers and the store see it at once (order_created). */
  async announceCreated(order: { id: string; outletId: string; runDate: Date | string; units?: number; tempClass?: string; status?: string; latePhone?: boolean }) {
    const outlet = await this.prisma.outlet.findUnique({ where: { id: order.outletId }, select: { depot: true } });
    const payload = {
      orderId: order.id, outletId: order.outletId, depot: outlet?.depot ?? null, runDate: toBusinessDate(order.runDate),
      status: order.status ?? OrderStatus.RECEIVED, units: order.units ?? null, tempClass: order.tempClass ?? null, latePhone: order.latePhone ?? false,
    };
    await this.notify.publish('order_created', [...(outlet ? [`dispatcher:${outlet.depot}`] : []), `store:${order.outletId}`], payload);
  }

  /** Cancel an order that has not been loaded yet. */
  async cancel(id: string, reason?: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, ...(reason ? { notes: `Cancelled: ${reason}` } : {}) },
    });
  }

  /**
   * Orders('…')/Lodestar.ConfirmReceipt: records the store's count on the order
   * and marks it DELIVERED. A short count gets a credit note: the POD's own
   * credit note when the driver already raised one, else a new CN-YYMM-NNNN,
   * and the shortfall is added to the POD's exceptions. A short count or a reported issue (the note,
   * SM-18) reaches the depot's dispatchers as RECEIPT_ISSUE (DSP-13).
   */
  async confirmReceipt(orderId: string, receivedBy: string, input: ReceiptInput) {
    const { unitsReceived, unitsExpected } = input;
    if (!Number.isInteger(unitsExpected) || unitsExpected < 0) throw ODataError.badRequest('unitsExpected must be a non-negative integer', 'unitsExpected');
    if (!Number.isInteger(unitsReceived) || unitsReceived < 0 || unitsReceived > unitsExpected) {
      throw ODataError.badRequest('unitsReceived must be between 0 and unitsExpected', 'unitsReceived');
    }
    if (!(input.savedAt instanceof Date) || Number.isNaN(input.savedAt.getTime())) throw ODataError.badRequest('savedAt must be a date-time', 'savedAt');
    const note = typeof input.note === 'string' && input.note.trim() ? input.note.trim() : null;
    if (note && note.length > MAX_NOTE) throw ODataError.badRequest(`note is limited to ${MAX_NOTE} characters`, 'note');

    const order = await this.receiptWithCreditNote(orderId, receivedBy, { ...input, note });
    await this.announceReceiptIssue(order);
    await this.announceCreditNote(order);
    return order;
  }

  private async receiptWithCreditNote(orderId: string, receivedBy: string, input: ReceiptInput) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => this.recordReceipt(tx, orderId, receivedBy, input));
      } catch (err) {
        // Two short receipts drew the same credit note number: draw again.
        const target = (err as any)?.meta?.target;
        const creditNoteClash = (err as any)?.code === 'P2002' && String(target ?? '').includes('creditNoteId');
        if (!creditNoteClash || attempt >= CREDIT_NOTE_ATTEMPTS) throw err;
      }
    }
  }

  private async recordReceipt(tx: Prisma.TransactionClient, orderId: string, receivedBy: string, input: ReceiptInput) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        unitsReceived: true,
        tripStop: { select: { pod: { select: { id: true, creditNoteId: true, exceptions: true } } } },
      },
    });
    if (!order) throw ODataError.notFound(`Order ${orderId} was not found`);
    if (order.unitsReceived !== null && order.unitsReceived !== undefined) {
      throw ODataError.conflict(`The receipt of order ${orderId} was already confirmed`);
    }
    if (!RECEIVABLE_STATUSES.includes(order.status)) {
      throw ODataError.conflict(`Order ${orderId} is ${order.status} and cannot be received`);
    }

    const short = input.unitsExpected - input.unitsReceived;
    const pod = order.tripStop?.pod ?? null;
    let creditNoteId: string | null = null;
    if (short > 0) {
      creditNoteId = pod?.creditNoteId ?? (await this.nextCreditNoteId(tx, input.savedAt));
      if (pod) {
        const exception: ReceiptException = {
          type: 'SHORT',
          source: 'STORE_RECEIPT',
          description: `Store counted ${input.unitsReceived} of ${input.unitsExpected} units (${short} short)`,
          unitsShort: short,
          qty: short,
          unitsReceived: input.unitsReceived,
          unitsExpected: input.unitsExpected,
          note: input.note ?? null,
          photoUrl: null,
          reportedBy: receivedBy,
          at: input.savedAt.toISOString(),
        };
        const previous = Array.isArray(pod.exceptions) ? pod.exceptions : [];
        await tx.pOD.update({
          where: { id: pod.id },
          data: { creditNoteId, exceptions: [...previous, exception] as unknown as Prisma.InputJsonValue },
        });
      }
    }

    // nothing arrived at all is not a delivery: the order stays an exception for dispatch (DSP-13)
    const nothingArrived = input.unitsExpected > 0 && input.unitsReceived === 0;
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: nothingArrived ? OrderStatus.EXCEPTION : OrderStatus.DELIVERED,
        unitsReceived: input.unitsReceived,
        unitsExpected: input.unitsExpected,
        receiptNote: input.note ?? null,
        receiptSavedAt: input.savedAt,
        receivedAt: new Date(),
        receivedBy,
        creditNoteId,
      },
    });
  }

  /** The store counted short or reported an issue: the depot's dispatchers are told (DSP-13 exceptions inbox). */
  private async announceReceiptIssue(order: { id: string; unitsReceived: number | null; unitsExpected: number | null; receiptNote: string | null; creditNoteId: string | null }) {
    const short = (order.unitsExpected ?? 0) - (order.unitsReceived ?? 0);
    if (short <= 0 && !order.receiptNote) return;
    const where = await this.prisma.order.findUnique({
      where: { id: order.id },
      select: { outletId: true, outlet: { select: { depot: true, name: true } }, tripStop: { select: { tripId: true } } },
    });
    if (!where?.outlet) return;
    const tripId = where.tripStop?.tripId;
    const payload = {
      orderId: order.id, outletId: where.outletId, tripId: tripId ?? null,
      unitsReceived: order.unitsReceived, unitsExpected: order.unitsExpected, short, note: order.receiptNote, creditNoteId: order.creditNoteId,
      title: `${where.outlet.name}: ${short > 0 ? `${short} short` : 'issue reported'} on ${order.id}`,
    };
    for (const recipientId of await depotDispatchers(this.prisma, where.outlet.depot)) {
      await this.notify.notice({ recipientId, type: 'RECEIPT_ISSUE', ...(tripId ? { tripId } : {}), outletId: where.outletId, payload });
    }
  }

  /** A short count carries a credit note: the store's screens (SM-19/20, SM-28) refresh on credit_note_issued. */
  private async announceCreditNote(order: { id: string; creditNoteId: string | null; unitsReceived: number | null; unitsExpected: number | null }) {
    if (!order.creditNoteId) return;
    const where = await this.prisma.order.findUnique({ where: { id: order.id }, select: { outletId: true, tripStop: { select: { tripId: true } } } });
    if (!where?.outletId) return;
    await this.notify.publish('credit_note_issued', [`store:${where.outletId}`], {
      creditNoteId: order.creditNoteId, orderId: order.id, outletId: where.outletId, tripId: where.tripStop?.tripId ?? null,
      unitsCredited: (order.unitsExpected ?? 0) - (order.unitsReceived ?? 0), unitsReceived: order.unitsReceived, unitsExpected: order.unitsExpected,
    });
  }

  /** Next free credit note number of the month the count was saved in (orders and PODs share the series). */
  async nextCreditNoteId(tx: Prisma.TransactionClient, at: Date): Promise<string> {
    const prefix = creditNotePrefix(at);
    const where = { creditNoteId: { startsWith: prefix } };
    const [order, pod] = await Promise.all([
      tx.order.findFirst({ where, orderBy: { creditNoteId: 'desc' }, select: { creditNoteId: true } }),
      tx.pOD.findFirst({ where, orderBy: { creditNoteId: 'desc' }, select: { creditNoteId: true } }),
    ]);
    const last = Math.max(creditNoteSequence(order?.creditNoteId, prefix), creditNoteSequence(pod?.creditNoteId, prefix));
    return `${prefix}${String(last + 1).padStart(4, '0')}`;
  }

  /**
   * The first operating run date on or after `from` (isOperatingDay: the Calendar row decides; a date the
   * Calendar is silent about runs Monday to Saturday, not Sunday).
   */
  async nextOperatingRunDate(from: string | Date): Promise<string> {
    const first = toBusinessDate(from);
    const rows = await this.prisma.calendar.findMany({
      where: { date: { gte: dayRange(first).start, lt: dayRange(addBusinessDays(first, OPERATING_DAY_HORIZON)).start } },
      select: { date: true, isOperating: true },
    });
    const calendar = new Map(rows.map((c) => [businessDate(c.date), c]));
    for (let i = 0; i < OPERATING_DAY_HORIZON; i++) {
      const d = addBusinessDays(first, i);
      if (isOperatingDay(d, calendar.get(d))) return d;
    }
    return first;
  }

  /**
   * Whether dispatch has closed orders for a depot's run (Orders/Lodestar.CloseOrders): the time cut-off closes
   * every run at 4:00 PM the day before; a dispatcher may also close one explicitly once the day is being planned.
   */
  async orderWindow(depot: string, runDate: string | Date) {
    const iso = toBusinessDate(runDate);
    const row = await this.prisma.orderClosure.findUnique({ where: { depot_runDate: { depot, runDate: runDateValue(iso) } } });
    return {
      depot,
      runDate: iso,
      closed: !!row?.closed,
      closedBy: row?.closedBy ?? null,
      closedAt: row?.closedAt?.toISOString() ?? null,
      reason: row?.reason ?? null,
      reopenedBy: row?.reopenedBy ?? null,
      reopenedAt: row?.reopenedAt?.toISOString() ?? null,
    };
  }

  /** 422 OrdersClosed when dispatch has closed orders for the outlet's depot on that run date. */
  async assertOrdersOpen(outletId: string, runDate: string | Date) {
    const outlet = await this.prisma.outlet.findUnique({ where: { id: outletId }, select: { depot: true } });
    if (!outlet) return;
    const w = await this.orderWindow(outlet.depot, runDate);
    if (w.closed) {
      throw ODataError.unprocessable(
        'OrdersClosed',
        `Dispatch has closed orders for the ${w.runDate} run at ${outlet.depot}${w.reason ? ` (${w.reason})` : ''}; order for a later run or call dispatch`,
        'runDate',
      );
    }
  }

  /** Closes orders for a depot's run (dispatcher); stores and the desk are told. Closing twice keeps the first closure. */
  async closeOrders(depot: string, runDate: string | Date, by: string, reason?: string | null) {
    const iso = toBusinessDate(runDate);
    const key = { depot, runDate: runDateValue(iso) };
    const note = reason?.trim() ? reason.trim().slice(0, 300) : null;
    const current = await this.prisma.orderClosure.findUnique({ where: { depot_runDate: key } });
    if (!current?.closed) {
      await this.prisma.orderClosure.upsert({
        where: { depot_runDate: key },
        create: { ...key, closed: true, closedBy: by, reason: note },
        update: { closed: true, closedBy: by, closedAt: new Date(), reason: note, reopenedBy: null, reopenedAt: null },
      });
      await this.announceWindow(depot, iso, true);
    }
    return this.orderWindow(depot, iso);
  }

  /** Reopens orders for a depot's run (dispatcher). */
  async reopenOrders(depot: string, runDate: string | Date, by: string) {
    const iso = toBusinessDate(runDate);
    const key = { depot, runDate: runDateValue(iso) };
    const current = await this.prisma.orderClosure.findUnique({ where: { depot_runDate: key } });
    if (current?.closed) {
      await this.prisma.orderClosure.update({ where: { depot_runDate: key }, data: { closed: false, reopenedBy: by, reopenedAt: new Date() } });
      await this.announceWindow(depot, iso, false);
    }
    return this.orderWindow(depot, iso);
  }

  /** Live refresh for the desk and the depot's stores (best effort). */
  private async announceWindow(depot: string, runDate: string, closed: boolean) {
    try {
      const outlets = await this.prisma.outlet.findMany({ where: { depot }, select: { id: true } });
      await this.notify.publish('order_window', [`dispatcher:${depot}`, ...outlets.map((o) => `store:${o.id}`)], { depot, runDate, closed });
    } catch {
      // the closure is stored; screens pick it up on their next read
    }
  }

  /** Next order number in the ORD0000000 format. */
  async nextOrderId(): Promise<string> {
    const last = await this.prisma.order.findFirst({
      where: { id: { startsWith: 'ORD' } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const n = last ? Number(last.id.slice(3)) || 0 : 0;
    return `ORD${String(n + 1).padStart(7, '0')}`;
  }
}
