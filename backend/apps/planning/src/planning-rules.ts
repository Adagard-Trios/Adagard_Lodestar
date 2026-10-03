import type { PrismaService } from '@lodestar/prisma';
import { BUSINESS_TIME_ZONE, BUSINESS_UTC_OFFSET_MIN, minutesOfHhmm, ORDER_CUTOFF_HHMM } from '@lodestar/platform';

/**
 * The planning rules the planning service enforces, in one place, so the desk shows exactly what the code
 * uses (GET Plans/Lodestar.PlanningRules): the deferral score weights and thresholds (DeferralScoringService),
 * the late-risk alert levels, the order cut-off, the default alert rules of a dispatcher who has saved none,
 * and the validation targets of the three estimators. Measured model quality is computed from stored
 * predictions vs what happened (measureModels); nothing here is a measurement.
 */

/** Deferral score: higher = keep (DeferralScoringService.computeScore). */
export const DEFERRAL_WEIGHTS = {
  deferredYesterday: 40,
  perDaySince: 12,
  chilled: 15,
  freshBeforeOpening: 10,
  /** "before the store opens" = the outlet window opens before this hour */
  freshBeforeHour: 8,
  nextRunWithin24h: -10,
  stockCoverPerDay: -5,
  stockCoverCap: 20,
} as const;

/** Score at or above which an order is protected (never deferred). */
export const PROTECTED_SCORE = 91;
/** Score below which an order is suggested for deferral. */
export const DEFERRAL_CANDIDATE_BELOW = 30;

/** Late-risk levels: a stop at alertPct or more raises an alert; highPct or more is shown as high. */
export const LATE_RISK = { alertPct: 30, highPct: 60, thresholdOptions: [20, 30, 40, 50] } as const;

/** A vehicle's minutes, load or weekly fuel at warnPct of its limit or more shows as tight (over 100 = over). */
export const LOAD = { warnPct: 85 } as const;

/** Alert rules of a dispatcher who has not saved their own (DSP-20, DSP-33). */
export const DEFAULT_ALERT_RULES = {
  vehicleFault: { push: true, sms: true },
  lateRisk: { push: true, threshold: LATE_RISK.alertPct, risingOnly: true },
  flags: { push: true },
  silence: { push: true, call: true, minutes: 15 },
  signalZones: { alert: false },
};

/** Validation targets the estimators are held to (Datathon brief). Targets, not measurements. */
export const MODEL_TARGETS = {
  serviceTime: { metric: 'MAE', comparator: '<=', value: 4, unit: 'min a stop' },
  lateness: { metric: 'AUC', comparator: '>=', value: 0.8, unit: null },
  demand: { metric: 'WAPE', comparator: '<=', value: 12, unit: '% a week' },
} as const;

/** Weeks in the capacity outlook (CapacityService.getCapacityOutlook). */
export const OUTLOOK_WEEKS = 10;

export function planningRules() {
  return {
    cutoff: ORDER_CUTOFF_HHMM,
    timeZone: BUSINESS_TIME_ZONE,
    deferral: { weights: DEFERRAL_WEIGHTS, protectedScore: PROTECTED_SCORE, candidateBelow: DEFERRAL_CANDIDATE_BELOW },
    lateRisk: LATE_RISK,
    load: LOAD,
    alertDefaults: DEFAULT_ALERT_RULES,
    modelTargets: MODEL_TARGETS,
    outlookWeeks: OUTLOOK_WEEKS,
  };
}

// ── measured model quality ───────────────────────────────

export interface Measured {
  /** null = not measured yet */
  value: number | null;
  /** rows the figure is computed from */
  n: number;
  /** why there is no figure, when value is null */
  reason?: string;
}

export interface StopOutcome {
  serviceMinPredicted: number | null;
  lateRiskPct: number | null;
  arrivalActual: Date | null;
  leaveActual: Date | null;
  runDate: Date;
  windowClose: string;
}

/** Mean absolute error of predicted vs actual minutes at the stop (arrival to leave). */
export function serviceTimeMae(rows: StopOutcome[]): Measured {
  const errs = rows
    .filter((r) => r.serviceMinPredicted !== null && r.arrivalActual && r.leaveActual && r.leaveActual >= r.arrivalActual)
    .map((r) => Math.abs(r.serviceMinPredicted! - (r.leaveActual!.getTime() - r.arrivalActual!.getTime()) / 60_000));
  if (!errs.length) return { value: null, n: 0, reason: 'No stop has both a predicted and an actual service time yet' };
  return { value: Math.round((errs.reduce((s, e) => s + e, 0) / errs.length) * 10) / 10, n: errs.length };
}

/** Was the stop reached after its window closed (run date at the outlet's close, Colombo time)? */
export function arrivedLate(r: Pick<StopOutcome, 'arrivalActual' | 'runDate' | 'windowClose'>): boolean {
  const close = r.runDate.getTime() + (minutesOfHhmm(r.windowClose) - BUSINESS_UTC_OFFSET_MIN) * 60_000;
  return r.arrivalActual!.getTime() > close;
}

/** AUC of the stored late risk against whether the stop was actually late (Mann-Whitney, ties count half). */
export function latenessAuc(rows: StopOutcome[]): Measured {
  const scored = rows.filter((r) => r.lateRiskPct !== null && r.arrivalActual).map((r) => ({ p: r.lateRiskPct!, late: arrivedLate(r) }));
  const pos = scored.filter((s) => s.late);
  const neg = scored.filter((s) => !s.late);
  if (!pos.length || !neg.length) {
    return {
      value: null,
      n: scored.length,
      reason: scored.length ? `Needs both late and on-time arrivals (${pos.length} late, ${neg.length} on time so far)` : 'No stop with a late risk has arrived yet',
    };
  }
  let wins = 0;
  for (const a of pos) for (const b of neg) wins += a.p > b.p ? 1 : a.p === b.p ? 0.5 : 0;
  return { value: Math.round((wins / (pos.length * neg.length)) * 100) / 100, n: scored.length };
}

/**
 * Measured quality of the estimators over the caller's depots (null depots = all): service-time MAE and
 * lateness AUC from stops that have both a prediction and an outcome. The demand forecast stores no past
 * forecasts, so its WAPE is not measured.
 */
export async function measureModels(prisma: PrismaService, depots: string[] | null) {
  const stops = await prisma.tripStop.findMany({
    where: { arrivalActual: { not: null }, ...(depots ? { trip: { is: { depot: { in: depots } } } } : {}) },
    select: {
      serviceMinPredicted: true, lateRiskPct: true, arrivalActual: true, leaveActual: true,
      trip: { select: { runDate: true } }, outlet: { select: { windowClose: true } },
    },
  });
  const rows: StopOutcome[] = stops.map((s) => ({
    serviceMinPredicted: s.serviceMinPredicted, lateRiskPct: s.lateRiskPct, arrivalActual: s.arrivalActual, leaveActual: s.leaveActual,
    runDate: s.trip.runDate, windowClose: s.outlet.windowClose,
  }));
  return {
    serviceTime: { target: MODEL_TARGETS.serviceTime, measured: serviceTimeMae(rows) },
    lateness: { target: MODEL_TARGETS.lateness, measured: latenessAuc(rows) },
    demand: { target: MODEL_TARGETS.demand, measured: { value: null, n: 0, reason: 'No past forecasts are stored to score against delivered volume' } as Measured },
  };
}
