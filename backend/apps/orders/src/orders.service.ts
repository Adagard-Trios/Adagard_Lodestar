import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Prisma, OrderStatus, TempClass } from '@prisma/client';

/** Day window [start, end) in UTC for a run date given as YYYY-MM-DD. */
export function dayRange(runDate: string | Date) {
  const start = new Date(typeof runDate === 'string' ? `${runDate.slice(0, 10)}T00:00:00.000Z` : runDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** Orders that may still be changed by their store (before planning picks them up). */
export const EDITABLE_STATUSES: OrderStatus[] = [OrderStatus.RECEIVED];
/** Orders that may still be cancelled. */
export const CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.RECEIVED, OrderStatus.PLANNED];

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /** Summary stats for the plan board (DSP-01), limited to what the caller may see. */
  async getSummary(runDate: string, scope?: Prisma.OrderWhereInput) {
    const { start, end } = dayRange(runDate);
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
      runDate: start.toISOString().slice(0, 10),
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
