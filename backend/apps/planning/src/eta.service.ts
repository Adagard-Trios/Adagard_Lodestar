import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { DockType, Brand } from '@prisma/client';
import { businessHour, businessMinutesOfDay, minutesOfHhmm } from '@lodestar/platform';

const MINUTE_MS = 60_000;
const addMinutes = (d: Date, min: number) => new Date(d.getTime() + min * MINUTE_MS);

/**
 * ETA Service — computes plan ETA (free-flow) and model ETA (ML-adjusted).
 *
 * From STORY.md / training data:
 *   - Plan ETA = departure + depot→district + Σ inter-stop + Σ service allowances
 *   - Model ETA for Nuwara Eliya hill road in monsoon:
 *       traffic_speed.csv speed index drops to 64 at 5 AM, 58 at 6 AM, 48 at 7 AM
 *       Monsoon hill runs average ~80 min behind free-flow plan
 *   - OUT106 late risk: 12% when planned before 6:00 AM (monsoon)
 *   - OUT108 late risk: 18% normal, 61% during blackout
 *
 * All times of day (planned hour, window close) are Sri Lanka time
 * (Asia/Colombo), never the server's local time: containers run in UTC.
 */
@Injectable()
export class EtaService {
  constructor(private prisma: PrismaService) {}

  /** Service allowance in minutes from DB */
  async getServiceMin(brand: Brand, dockType: DockType): Promise<number> {
    const sa = await this.prisma.serviceAllowance.findUnique({
      where: { brand_dockType: { brand, dockType } },
    });
    return sa?.minutes ?? 15;
  }

  /** Free-flow plan ETA for a stop */
  computePlanEta(params: {
    departTime: Date;
    depotToDistMin: number;
    priorStopServiceMins: number;   // sum of service mins for stops before this one
    priorInterStopMins: number;     // inter-stop travel for stops before this one
    interStopMin: number;           // to this stop
    serviceMin: number;             // at this stop
  }): Date {
    const totalMin =
      params.depotToDistMin +
      params.priorStopServiceMins +
      params.priorInterStopMins +
      params.interStopMin;

    return addMinutes(params.departTime, totalMin);
  }

  /**
   * Model ETA — adjusts plan ETA based on road class, time-of-day, monsoon.
   * Hill roads in monsoon: +80 min median delay vs free-flow.
   * Returns { etaModel, bandEarly, bandLate, lateRiskPct }
   */
  computeModelEta(params: {
    etaPlan: Date;
    roadClass: string;
    isMonsoon: boolean;
    /** Colombo hour of the planned arrival; defaults to the Colombo hour of etaPlan. */
    plannedHour?: number;
    windowClose: string;    // "08:00", Colombo wall clock
  }): { etaModel: Date; bandEarly: Date; bandLate: Date; lateRiskPct: number } {
    const plannedHour = params.plannedHour ?? businessHour(params.etaPlan);
    const base = baseLateRisk(params.roadClass, params.isMonsoon, plannedHour);
    let delayMin = 0;
    let bandWidthMin = 15;
    const lateRiskPct = base.pct;

    if (base.speedIndex !== null) {
      // At full speed (100) → 0 delay; at 64 → ~55% slower → ~80 min delay
      delayMin = Math.round((100 - base.speedIndex) / 100 * 80);
      bandWidthMin = 20;
    } else if (params.roadClass === 'urban') {
      delayMin = plannedHour < 6 ? 0 : 10;
    } else if (params.roadClass === 'suburban') {
      delayMin = params.isMonsoon ? 15 : 5;
    }

    const etaModel = addMinutes(params.etaPlan, delayMin);
    const bandEarly = addMinutes(etaModel, -bandWidthMin);
    const bandLate = addMinutes(etaModel, bandWidthMin);

    // Recompute late risk based on whether model ETA (Colombo time) nears the window close
    const windowCloseMin = minutesOfHhmm(params.windowClose);
    const modelEtaMin = businessMinutesOfDay(etaModel);
    return { etaModel, bandEarly, bandLate, lateRiskPct: nearCloseRisk(lateRiskPct, modelEtaMin, windowCloseMin) };
  }

  /**
   * DSP-15 Late-risk explainer: a stop's late risk as parts that add up to its stored figure, the way
   * computeModelEta sets it (base rate by road class, monsoon and planned hour; +30 points when the model ETA is
   * within 30 minutes of the window close, capped at 95) plus what changed on the road since (UpdateLateRisk).
   */
  async explainStop(stopId: string) {
    const stop = await this.prisma.tripStop.findUnique({
      where: { id: stopId },
      select: {
        id: true, etaPlan: true, etaModel: true, lateRiskPct: true,
        trip: { select: { depot: true, runDate: true } },
        outlet: { select: { district: true, windowClose: true } },
      },
    });
    if (!stop) return null;
    const [travel, day] = await Promise.all([
      this.prisma.districtTravel.findUnique({ where: { district: stop.outlet.district }, select: { roadClass: true } }),
      this.prisma.calendar.findUnique({ where: { date: stop.trip.runDate }, select: { monsoon: true } }),
    ]);
    const roadClass = travel?.roadClass ?? null;
    const isMonsoon = (day?.monsoon ?? 0) > 0;
    const plannedHour = stop.etaPlan ? businessHour(stop.etaPlan) : null;
    return {
      stopId: stop.id,
      depot: stop.trip.depot,
      runDate: stop.trip.runDate,
      roadClass,
      monsoon: isMonsoon,
      plannedHour,
      windowClose: stop.outlet.windowClose,
      lateRiskPct: stop.lateRiskPct,
      ...explainLateRisk({ roadClass, isMonsoon, plannedHour, etaModel: stop.etaModel, windowClose: stop.outlet.windowClose, actual: stop.lateRiskPct }),
    };
  }
}

/** The base late risk before the window-close check, and the hill-road speed index it rests on (monsoon only). */
export function baseLateRisk(roadClass: string | null, isMonsoon: boolean, plannedHour: number): { pct: number; speedIndex: number | null } {
  if (roadClass === 'hill' && isMonsoon) {
    // Traffic speed index: 5AM=64, 6AM=58, 7AM=48 → slowdowns
    const speedIndex = plannedHour <= 5 ? 64 : plannedHour <= 6 ? 58 : 48;
    // Late risk: before 6AM in monsoon → 20% (from training: 51 runs, 20% late)
    return { pct: plannedHour < 6 ? 20 : 53, speedIndex };
  }
  if (roadClass === 'urban') return { pct: 8, speedIndex: null };
  if (roadClass === 'suburban') return { pct: 12, speedIndex: null };
  return { pct: 5, speedIndex: null };
}

const WINDOW_MARGIN_MIN = 30;
const WINDOW_PENALTY = 30;
const RISK_CAP = 95;

/** +30 points when the model ETA (Colombo minutes of day) is within 30 minutes of the window close, capped at 95. */
function nearCloseRisk(pct: number, modelEtaMin: number, windowCloseMin: number): number {
  return modelEtaMin > windowCloseMin - WINDOW_MARGIN_MIN ? Math.min(pct + WINDOW_PENALTY, RISK_CAP) : pct;
}

const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

export interface LateRiskPart {
  key: 'base' | 'window' | 'road';
  label: string;
  detail: string;
  value: number;
}

/** A late-risk figure as parts that add up: base rate, arrival near the window close, updates on the road. */
export function explainLateRisk(p: {
  roadClass: string | null;
  isMonsoon: boolean;
  plannedHour: number | null;
  etaModel: Date | null;
  windowClose: string;
  actual: number | null;
}): { base: number | null; planned: number | null; parts: LateRiskPart[] } {
  if (p.plannedHour === null || p.actual === null) return { base: null, planned: null, parts: [] };
  const base = baseLateRisk(p.roadClass, p.isMonsoon, p.plannedHour);
  const closeMin = minutesOfHhmm(p.windowClose);
  const modelMin = p.etaModel ? businessMinutesOfDay(p.etaModel) : null;
  const planned = modelMin === null ? base.pct : nearCloseRisk(base.pct, modelMin, closeMin);
  const near = planned !== base.pct;
  const baseDetail = base.speedIndex !== null
    ? `Monsoon hill road, planned ${p.plannedHour < 6 ? 'before' : 'after'} 6 AM · 51 runs · speed index ${base.speedIndex}`
    : `${p.roadClass ?? 'Unknown'} road, ${p.isMonsoon ? 'monsoon' : 'dry season'}`;
  const windowDetail = modelMin === null
    ? 'No model ETA yet'
    : near
      ? `Model ETA ${clock(modelMin)} is within ${WINDOW_MARGIN_MIN} min of ${clock(closeMin)}`
      : `Model ETA ${clock(modelMin)}, more than ${WINDOW_MARGIN_MIN} min before ${clock(closeMin)}`;
  return {
    base: base.pct,
    planned,
    parts: [
      { key: 'base', label: 'Base rate', detail: baseDetail, value: base.pct },
      { key: 'window', label: 'Arrival near the window close', detail: windowDetail, value: planned - base.pct },
      {
        key: 'road',
        label: 'Updates on the road',
        detail: p.actual === planned ? 'No change since the plan' : 'Re-estimated since the plan (driver position, ETA updates)',
        value: p.actual - planned,
      },
    ],
  };
}
