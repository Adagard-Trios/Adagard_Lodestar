import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Depot, OrderStatus, TripStatus, Brand, TempClass, DeferralReason } from '@prisma/client';
import { DeferralScoringService } from './deferral-scoring.service';
import { CapacityService } from './capacity.service';

/**
 * Planning Service — the core auto-plan engine.
 *
 * Auto-plan logic (from STORY.md Peliyagoda planning picture):
 *  1. Group orders by depot, brand, district
 *  2. Check reefer capacity → if short, score orders for deferral
 *  3. Move dry Fresh off reefers onto dry trucks if possible
 *  4. Assign vehicles: one brand + one district per trip
 *  5. Validate window, access, fuel constraints
 *  6. Flag van_only outlets (vans only)
 *  7. Return plan v3 with suggested deferrals
 */
@Injectable()
export class PlanningService {
  constructor(
    private prisma: PrismaService,
    private deferralScoring: DeferralScoringService,
    private capacity: CapacityService,
  ) {}

  async getPlan(depot: Depot, runDate?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf   = new Date(new Date(date).setDate(date.getDate() + 1));

    const [trips, orders, reefer, demand] = await Promise.all([
      this.prisma.trip.findMany({
        where: { depot, runDate: { gte: startOf, lt: endOf } },
        include: {
          vehicle: true,
          driver: { select: { id: true, name: true } },
          stops: { include: { outlet: true, order: true, pod: true }, orderBy: { stopSeq: 'asc' } },
          loadRecord: true,
        },
        orderBy: [{ brand: 'asc' }, { district: 'asc' }],
      }),
      this.prisma.order.findMany({
        where: {
          runDate: { gte: startOf, lt: endOf },
          outlet: { depot },
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION] },
        },
        include: { outlet: true, deferralLog: true },
      }),
      this.capacity.getReeferCapacity(depot),
      this.capacity.getChilledDemand(depot, date),
    ]);

    const chilledShortM3 = Math.max(0, demand.m3 - reefer.totalM3);

    const summary = {
      depot,
      runDate: date.toISOString().split('T')[0],
      planVersion: trips[0]?.planVersion ?? 1,
      orders: {
        total: orders.length,
        planned: orders.filter(o => o.status === OrderStatus.PLANNED).length,
        deferred: orders.filter(o => o.status === OrderStatus.DEFERRED).length,
        needsReview: orders.filter(o => o.status === OrderStatus.RECEIVED).length,
      },
      chilled: { demand: demand.m3, capacity: reefer.totalM3, shortM3: chilledShortM3 },
      trips: trips.length,
      vehiclesInWorkshop: (await this.prisma.vehicle.count({ where: { depot, status: 'WORKSHOP' } })),
    };

    // Compute deferral scores for unplanned chilled orders
    const scoredOrders = orders.map(o => ({
      ...o,
      computedScore: this.deferralScoring.computeScore({
        deferredYesterday: o.deferredYesterday,
        daysSince: o.daysSince,
        tempClass: o.tempClass,
        brand: o.brand,
        windowOpen: o.outlet.windowOpen,
        nextRunWithin24h: false,
      }),
      isProtected: o.deferralScore ? o.deferralScore >= 91 : false,
    }));

    return { summary, trips, orders: scoredOrders };
  }

  async runAutoPlan(depot: Depot, runDate?: string, resolvedBy?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const { summary, trips, orders } = await this.getPlan(depot, runDate);

    const suggestions: { orderId: string; reason: DeferralReason; score: number; notes: string }[] = [];

    if (summary.chilled.shortM3 > 0) {
      // Sort unprotected chilled orders by score ascending (lowest score = best to defer)
      const chilledOrders = orders
        .filter(o => o.tempClass === TempClass.CHILLED && !o.isProtected)
        .sort((a, b) => a.computedScore - b.computedScore);

      let remainingShort = summary.chilled.shortM3;
      for (const o of chilledOrders) {
        if (remainingShort <= 0) break;
        suggestions.push({
          orderId: o.id,
          reason: DeferralReason.CAP_REEFER,
          score: o.computedScore,
          notes: `Chilled short ${summary.chilled.shortM3.toFixed(1)} m³. days_since ${o.daysSince}, score ${o.computedScore}`,
        });
        remainingShort -= o.m3;
      }
    }

    return { summary, suggestions, trips };
  }

  async confirmDeferral(orderId: string, reason: DeferralReason, notes: string, resolvedBy: string, rescheduledDate?: string) {
    const [order] = await Promise.all([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DEFERRED },
      }),
      this.prisma.deferralLog.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          reason,
          score: 0,
          resolvedBy,
          notes,
          rescheduledDate: rescheduledDate ? new Date(rescheduledDate) : undefined,
        },
      }),
    ]);
    return order;
  }

  async getCapacityOutlook(depot: Depot) {
    return this.capacity.getCapacityOutlook(depot);
  }
}
