import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { OrderStatus, Brand, TempClass, Depot } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /** List orders for a run date (defaults to today). Supports filters. */
  async findAll(params: {
    runDate?: string;
    status?: OrderStatus;
    depot?: Depot;
    brand?: Brand;
    tempClass?: TempClass;
    outletId?: string;
  }) {
    const { runDate, status, depot, brand, tempClass, outletId } = params;
    const dateFilter = runDate ? new Date(runDate) : new Date('2026-04-07'); // default hero day

    return this.prisma.order.findMany({
      where: {
        runDate: {
          gte: new Date(dateFilter.toDateString()),
          lt: new Date(new Date(dateFilter).setDate(dateFilter.getDate() + 1)),
        },
        ...(status    ? { status }    : {}),
        ...(brand     ? { brand }     : {}),
        ...(tempClass ? { tempClass } : {}),
        ...(outletId  ? { outletId }  : {}),
        ...(depot ? { outlet: { depot } } : {}),
      },
      include: {
        outlet: {
          select: { id: true, name: true, brand: true, district: true, depot: true,
                    dockType: true, parking: true, windowOpen: true, windowClose: true, accessNote: true },
        },
        lineItems: true,
        tripStop: {
          include: {
            trip: { select: { id: true, vehicleId: true, status: true, planVersion: true } },
            pod: true,
          },
        },
        deferralLog: true,
      },
      orderBy: [{ status: 'asc' }, { outlet: { district: 'asc' } }],
    });
  }

  /** Summary stats for the plan board (DSP-01) */
  async getSummary(runDate?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf = new Date(new Date(date).setDate(date.getDate() + 1));

    const [total, byStatus, chilled, deferred] = await Promise.all([
      this.prisma.order.count({ where: { runDate: { gte: startOf, lt: endOf } } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { runDate: { gte: startOf, lt: endOf } },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { runDate: { gte: startOf, lt: endOf }, tempClass: TempClass.CHILLED },
        _sum: { m3: true, kg: true },
        _count: { id: true },
      }),
      this.prisma.order.count({
        where: { runDate: { gte: startOf, lt: endOf }, status: OrderStatus.DEFERRED },
      }),
    ]);

    return {
      runDate: date.toISOString().split('T')[0],
      total,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
      chilledM3: chilled._sum.m3 ?? 0,
      chilledKg: chilled._sum.kg ?? 0,
      chilledOrders: chilled._count.id,
      deferred,
      delivered: (byStatus.find(s => s.status === 'DELIVERED')?._count.id) ?? 0,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        outlet: true,
        lineItems: true,
        tripStop: { include: { trip: true, pod: true } },
        deferralLog: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  /** Status transition: planned → loaded → enroute → delivered / deferred / exception */
  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    const order = await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status, ...(notes ? { notes } : {}) },
    });
  }

  /** Create an order (store manager places order via Store app) */
  async create(data: {
    id: string;
    outletId: string;
    runDate: string;
    brand: Brand;
    tempClass: TempClass;
    units: number;
    kg: number;
    m3: number;
    notes?: string;
  }) {
    return this.prisma.order.create({
      data: {
        ...data,
        runDate: new Date(data.runDate),
        orderedAt: new Date(),
        status: OrderStatus.RECEIVED,
      },
    });
  }

  async getDeferralSuggestions(runDate?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf = new Date(new Date(date).setDate(date.getDate() + 1));
    return this.prisma.order.findMany({
      where: {
        runDate: { gte: startOf, lt: endOf },
        status: { in: [OrderStatus.RECEIVED, OrderStatus.PLANNED] },
        deferralScore: { gt: 0, lt: 91 }, // score <91 means not protected
      },
      include: { outlet: true },
      orderBy: { deferralScore: 'asc' },
      take: 10,
    });
  }
}
