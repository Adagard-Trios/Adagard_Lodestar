'use client';
// The planning service's rules (Plans/Lodestar.PlanningRules): order cut-off, deferral score weights and
// thresholds, late-risk and load levels, default alert rules, the estimators' targets and their measured quality.
// The desk renders these instead of keeping its own copies of the numbers.
import type { AlertRules } from '@/components/live/settings-data';
import { type ODataClient, valueOf } from '@/lib/odata/client';
import { useQuery } from '@/lib/odata/hooks';

export interface ModelTarget {
  metric: string;
  comparator: '<=' | '>=';
  value: number;
  unit: string | null;
}

export interface Measured {
  value: number | null;
  n: number;
  reason?: string;
}

export interface PlanningRules {
  /** "HH:mm", Colombo time, the day before each run */
  cutoff: string;
  timeZone: string;
  deferral: {
    weights: {
      deferredYesterday: number;
      perDaySince: number;
      chilled: number;
      freshBeforeOpening: number;
      freshBeforeHour: number;
      nextRunWithin24h: number;
      stockCoverPerDay: number;
      stockCoverCap: number;
    };
    protectedScore: number;
    candidateBelow: number;
  };
  lateRisk: { alertPct: number; highPct: number; thresholdOptions: number[] };
  load: { warnPct: number };
  alertDefaults: Required<AlertRules>;
  modelTargets: Record<'serviceTime' | 'lateness' | 'demand', ModelTarget>;
  outlookWeeks: number;
  models: Record<'serviceTime' | 'lateness' | 'demand', { target: ModelTarget; measured: Measured }>;
}

const cache = new WeakMap<ODataClient, Promise<PlanningRules>>();

/** The rules, fetched once per client (a failed fetch is retried on the next call). */
export function loadPlanningRules(c: ODataClient): Promise<PlanningRules> {
  let p = cache.get(c);
  if (!p) {
    p = c.fn('Plans', null, 'PlanningRules').then(r => {
      const v = valueOf<PlanningRules>(r);
      if (!v || typeof v.cutoff !== 'string') throw new Error('The planning service returned no planning rules');
      return v;
    });
    p.catch(() => cache.delete(c));
    cache.set(c, p);
  }
  return p;
}

export const usePlanningRules = () => useQuery<PlanningRules>('planning-rules', c => loadPlanningRules(c));

/** "16:00" → "4:00 PM". */
export function clock12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The cut-off as the desk writes it ("4:00 PM"), or an ellipsis while it loads. */
export function useCutoffLabel(): string {
  const r = usePlanningRules().data;
  return r ? clock12(r.cutoff) : '…';
}

/** ok / warn / bad for a used share of a limit, by the planning service's load level (no level known = no warning). */
export function loadTone(used: number, cap: number, warnPct: number | undefined): 'ok' | 'warn' | 'bad' {
  const p = cap ? used / cap : 0;
  return p > 1 ? 'bad' : warnPct !== undefined && p * 100 >= warnPct ? 'warn' : 'ok';
}
