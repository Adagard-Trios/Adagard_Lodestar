import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { OrderStatus, TempClass, VehicleStatus } from '@prisma/client';
import { addBusinessDays, businessDate, businessWeekday, runDateRange, runDateValue, toBusinessDate } from '@lodestar/platform';
import { OUTLOOK_WEEKS } from './planning-rules';

/** Past run dates of orders the outlook needs before it forecasts anything. */
export const MIN_HISTORY_DAYS = 5;

const round1 = (n: number) => Math.round(n * 10) / 10;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** ISO 8601 week number of a YYYY-MM-DD date. */
export function isoWeek(day: string): number {
  const d = new Date(`${day}T00:00:00Z`);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 4 - (d.getUTCDay() || 7)));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
}

/**
 * Capacity Service
 * Computes available reefer capacity for a depot/date and flags shortfalls.
 * (chilled demand of a run date vs the m³ of the depot's available reefers).
 */
@Injectable()
export class CapacityService {
  constructor(private prisma: PrismaService) {}

  async getReeferCapacity(depot: string) {
    const reeferVehicles = await this.prisma.vehicle.findMany({
      where: { depot, tempClass: TempClass.CHILLED, status: VehicleStatus.AVAILABLE },
    });
    const totalKg = reeferVehicles.reduce((s, v) => s + v.capacityKg, 0);
    const totalM3 = reeferVehicles.reduce((s, v) => s + v.capacityM3, 0);
    return { vehicles: reeferVehicles, totalKg, totalM3 };
  }

  async getChilledDemand(depot: string, runDate: Date) {
    // Run dates are stored as UTC midnight of their Sri Lanka calendar date (never server-local).
    const { start: startOf, end: endOf } = runDateRange(runDate);

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

  /**
   * DSP-05 capacity outlook: OUTLOOK_WEEKS ISO weeks from the current week. The daily volume is the median
   * total and chilled m³ of the depot's past run dates (Orders, cancelled ones left out); each operating day in
   * the Calendar adds that median × (1 + its festival_ramp). Weeks the Calendar does not cover yet are listed in
   * `uncoveredWeeks`, never guessed. Too little history (under MIN_HISTORY_DAYS run dates) returns no weeks and
   * says why. Reefer capacity is the m³ of the depot's available chilled vehicles.
   */
  async getCapacityOutlook(depot: string, at: Date = new Date()) {
    const today = businessDate(at);
    const monday = addBusinessDays(today, -((businessWeekday(today) + 6) % 7));
    const history = await this.prisma.order.groupBy({
      by: ['runDate', 'tempClass'],
      where: { runDate: { lt: runDateValue(today) }, outlet: { depot }, status: { not: OrderStatus.CANCELLED } },
      _sum: { m3: true },
    });
    const days = new Map<string, { total: number; chilled: number }>();
    for (const h of history) {
      const iso = toBusinessDate(h.runDate);
      const d = days.get(iso) ?? { total: 0, chilled: 0 };
      d.total += h._sum.m3 ?? 0;
      if (h.tempClass === TempClass.CHILLED) d.chilled += h._sum.m3 ?? 0;
      days.set(iso, d);
    }
    const isos = [...days.keys()].sort();
    const basis = {
      historyDays: isos.length,
      historyFrom: isos[0] ?? null,
      historyTo: isos[isos.length - 1] ?? null,
      minHistoryDays: MIN_HISTORY_DAYS,
      medianTotalM3PerDay: isos.length ? round1(median([...days.values()].map((d) => d.total))) : null,
      medianChilledM3PerDay: isos.length ? round1(median([...days.values()].map((d) => d.chilled))) : null,
    };
    if (isos.length < MIN_HISTORY_DAYS) {
      return { depot, weeks: [], uncoveredWeeks: [], basis, reason: `Only ${isos.length} past run date${isos.length === 1 ? '' : 's'} of orders; the forecast needs ${MIN_HISTORY_DAYS}.` };
    }

    const reefers = await this.prisma.vehicle.findMany({
      where: { depot, tempClass: TempClass.CHILLED, status: VehicleStatus.AVAILABLE },
      select: { capacityM3: true },
    });
    const reeferCapacityM3 = round1(reefers.reduce((s, v) => s + v.capacityM3, 0));
    const lastWeekEnd = addBusinessDays(monday, OUTLOOK_WEEKS * 7);
    const calendar = await this.prisma.calendar.findMany({
      where: { date: { gte: runDateValue(monday), lt: runDateValue(lastWeekEnd) } },
      select: { date: true, isOperating: true, festivalRamp: true, isPayday: true, festivalName: true },
    });

    const weeks = [];
    const uncoveredWeeks: string[] = [];
    for (let w = 0; w < OUTLOOK_WEEKS; w++) {
      const weekStart = addBusinessDays(monday, w * 7);
      const weekEnd = addBusinessDays(weekStart, 7);
      const week = `W${isoWeek(weekStart)}`;
      const calDays = calendar.filter((d) => { const iso = toBusinessDate(d.date); return iso >= weekStart && iso < weekEnd; });
      if (!calDays.length) { uncoveredWeeks.push(week); continue; }
      const open = calDays.filter((d) => d.isOperating);
      const ramp = open.reduce((s, d) => s + 1 + d.festivalRamp, 0);
      weeks.push({
        week,
        weekStart,
        operatingDays: open.length,
        estimatedChilledDemandM3: Math.round(basis.medianChilledM3PerDay! * ramp),
        estimatedTotalM3: Math.round(basis.medianTotalM3PerDay! * ramp),
        reeferVehiclesAvailable: reefers.length,
        reeferCapacityM3,
        hasPayday: calDays.some((d) => d.isPayday),
        festival: calDays.find((d) => d.festivalName)?.festivalName ?? null,
      });
    }
    return { depot, weeks, uncoveredWeeks, basis, reason: null };
  }
}
