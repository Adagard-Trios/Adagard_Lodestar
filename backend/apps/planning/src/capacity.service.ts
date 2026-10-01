import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Depot, TempClass, VehicleStatus } from '@prisma/client';

/**
 * Capacity Service
 * Computes available reefer capacity for a depot/date and flags shortfalls.
 * From STORY.md (Peliyagoda scenario):
 *   Chilled demand: 118.4 m³
 *   Reefer capacity usable in 3:30–8:00 window: 109.8 m³
 *   Shortfall: 8.6 m³ (VEH004 in workshop)
 */
@Injectable()
export class CapacityService {
  constructor(private prisma: PrismaService) {}

  async getReeferCapacity(depot: Depot) {
    const reeferVehicles = await this.prisma.vehicle.findMany({
      where: { depot, tempClass: TempClass.CHILLED, status: VehicleStatus.AVAILABLE },
    });
    const totalKg = reeferVehicles.reduce((s, v) => s + v.capacityKg, 0);
    const totalM3 = reeferVehicles.reduce((s, v) => s + v.capacityM3, 0);
    return { vehicles: reeferVehicles, totalKg, totalM3 };
  }

  async getChilledDemand(depot: Depot, runDate: Date) {
    // Run dates are stored as UTC midnight; use a UTC day window (not server-local).
    const startOf = new Date(runDate);
    startOf.setUTCHours(0, 0, 0, 0);
    const endOf = new Date(startOf);
    endOf.setUTCDate(endOf.getUTCDate() + 1);

    const agg = await this.prisma.order.aggregate({
      where: {
        runDate: { gte: startOf, lt: endOf },
        tempClass: TempClass.CHILLED,
        outlet: { depot },
        status: { notIn: ['DEFERRED', 'EXCEPTION', 'CANCELLED'] as any },
      },
      _sum: { m3: true, kg: true },
      _count: { id: true },
    });

    return {
      m3: agg._sum.m3 ?? 0,
      kg: agg._sum.kg ?? 0,
      orders: agg._count.id,
    };
  }

  async getCapacityOutlook(depot: Depot) {
    // 10-week outlook W15–W24 (grounded in training data medians)
    // Peliyagoda: median 183 m³/day total, 58 m³/day chilled
    // Kandy:      median 100 m³/day total, 30 m³/day chilled
    const baseChilledM3PerDay = depot === Depot.PELIYAGODA ? 58 : 30;
    const baseTotalM3PerDay   = depot === Depot.PELIYAGODA ? 183 : 100;

    const weeks = [];
    const startWeek = new Date('2026-04-06'); // W15
    for (let w = 0; w < 10; w++) {
      const weekStart = new Date(startWeek);
      weekStart.setDate(startWeek.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const calDays = await this.prisma.calendar.findMany({
        where: { date: { gte: weekStart, lt: weekEnd }, isOperating: true },
      });

      const operatingDays = calDays.length || 5;
      const avgFestivalRamp = calDays.reduce((s, d) => s + d.festivalRamp, 0) / Math.max(calDays.length, 1);
      const multiplier = 1 + avgFestivalRamp;

      const reeferVehicles = await this.prisma.vehicle.count({
        where: { depot, tempClass: TempClass.CHILLED, status: VehicleStatus.AVAILABLE },
      });

      weeks.push({
        week: `W${15 + w}`,
        weekStart: weekStart.toISOString().split('T')[0],
        operatingDays,
        estimatedChilledDemandM3: Math.round(baseChilledM3PerDay * operatingDays * multiplier),
        estimatedTotalM3: Math.round(baseTotalM3PerDay * operatingDays * multiplier),
        reeferVehiclesAvailable: reeferVehicles,
        reeferCapacityM3: reeferVehicles * 25, // ~avg 25 m³ per reefer trip
        hasPayday: calDays.some(d => d.isPayday),
        festival: calDays.find(d => d.festivalName)?.festivalName ?? null,
      });
    }
    return { depot, weeks };
  }
}
