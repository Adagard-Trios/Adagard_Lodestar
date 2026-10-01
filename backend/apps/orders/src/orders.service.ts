import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { Prisma, OrderStatus, TempClass } from '@prisma/client';
import { businessDate, runDateRange } from '@lodestar/platform';

/** Stored window [start, end) of a run date (YYYY-MM-DD, or a Date read in Sri Lanka time). */
export function dayRange(runDate: string | Date) {
  return runDateRange(runDate);
}

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

/** Exception appended to the POD when the store counts short (same shape as the driver's POD exceptions). */
export interface ReceiptException {
  type: 'SHORT';
  source: 'STORE_RECEIPT';
  description: string;
  unitsShort: number;
  note: string | null;
  photoUrl: null;
  reportedBy: string;
  at: string;
}

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
  constructor(private prisma: PrismaService) {}

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

  /** Status transition: planned → loaded → enroute → delivered / deferred / exception */
  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return this.prisma.order.update({
      where: { id },
      data: { status, ...(notes ? { notes } : {}) },
    });
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
   * and the shortfall is added to the POD's exceptions.
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

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => this.recordReceipt(tx, orderId, receivedBy, { ...input, note }));
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

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
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
