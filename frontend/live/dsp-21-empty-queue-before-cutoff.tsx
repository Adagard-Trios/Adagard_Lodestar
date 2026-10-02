'use client';
// DSP-21 Empty queue before cutoff, live. Markup and classes from the generated design
// (frontend/screens/dsp-21-empty-queue-before-cutoff.tsx).
// Reached from DSP-01 when the run the queue fills for (the first operating day whose 4:00 PM cutoff has not
// passed) has no orders yet in the depot(s) in view. Data: Orders of that run per depot ($count), Vehicles of the
// depot(s), the Calendar row (festival ramp), and the orders of the last four same weekdays (the usual count and
// the usual time of the first order). As soon as an order arrives or the cutoff passes, it goes back to DSP-01.
import { useEffect } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope, useOpenRun } from '@/components/live/plan-data';
import { ErrorBanner } from '@/components/live/states';
import { addDays, dayFilter, DEPOT_NAME, fmtDayTime, fmtRunDate, fmtTime } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { Order, Vehicle } from '@/lib/odata/types';
import { CUTOFF_LABEL, depotFilter } from '@/lib/workday';

const weekdayOf = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });

/** "6 h 50 m" */
export function untilText(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h ? `${h} h ${m} m` : `${m} m`;
}

/** Minutes after midnight in Colombo. */
const colomboMinutes = (iso: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map(x => [x.type, x.value]),
  );
  return Number(p.hour) * 60 + Number(p.minute);
};
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
};

/** What the last four runs on the same weekday looked like: orders per run and when the first order came. */
export function weekdayPattern(orders: Pick<Order, 'runDate' | 'orderedAt'>[], days: string[]) {
  const byDay = days.map(d => orders.filter(o => String(o.runDate).slice(0, 10) === d));
  const withOrders = byDay.filter(os => os.length > 0);
  const avg = withOrders.length ? Math.round(withOrders.reduce((s, os) => s + os.length, 0) / withOrders.length) : null;
  const firsts = withOrders.map(os => Math.min(...os.map(o => colomboMinutes(o.orderedAt))));
  const first = median(firsts);
  return { avg, first: first === null ? null : `${Math.floor(first / 60)}:${String(first % 60).padStart(2, '0')}`, runs: withOrders.length };
}

export default function LiveDsp21EmptyQueueBeforeCutoff() {
  const nav = useScreenNav();
  const { depot, depots, active, setDepot } = usePlanScope();
  const now = new Date();
  const open = useOpenRun(now);
  const run = open.runDate;
  const scope = depotFilter('outlet/depot', active);
  const day = dayFilter('runDate', run);

  const counts = useQuery<Record<string, number>>(`queue-counts:${run}:${depots.join(',')}`, async c => {
    const out: Record<string, number> = {};
    await Promise.all(depots.map(async d => {
      const pg = await c.list('Orders', { filter: `${day} and outlet/depot eq '${d}' and status ne 'CANCELLED'`, top: 0, count: true });
      out[d] = pg.count ?? pg.value.length;
    }));
    return out;
  }, { refreshOn: ['notification'], pollMs: 60_000 });
  const inView = useCount('Orders', [day, scope, "status ne 'CANCELLED'"].filter(Boolean).join(' and '), ['notification']);
  const fleet = useQuery<Vehicle[]>(`fleet:${active.join(',')}`, c => c.all<Vehicle>('Vehicles', { filter: depotFilter('depot', active), select: 'id,status,depot' }));
  const calendar = useQuery<{ festivalName?: string | null; festivalRamp?: number | null } | null>(`calendar:${run}`, async c =>
    (await c.list<{ festivalName?: string | null; festivalRamp?: number | null }>('Calendar', { filter: `date eq ${run}T00:00:00Z`, top: 1 })).value[0] ?? null);
  const pastDays = [7, 14, 21, 28].map(n => addDays(run, -n));
  const history = useQuery<Order[]>(`weekday-history:${run}:${active.join(',')}`, c =>
    c.all<Order>('Orders', {
      filter: [`(${pastDays.map(d => `(${dayFilter('runDate', d)})`).join(' or ')})`, scope, "status ne 'CANCELLED'"].filter(Boolean).join(' and '),
      select: 'id,runDate,orderedAt',
    }));

  // Orders arrived, or the cutoff passed: the queue is no longer empty-before-cutoff.
  const filled = inView !== undefined && inView > 0;
  const closed = !open.before;
  useEffect(() => {
    if (filled || closed) nav.go('N1');
  }, [filled, closed, nav]);

  const vehicles = fleet.data ?? [];
  const ready = vehicles.filter(v => v.status !== 'WORKSHOP').length;
  const pattern = weekdayPattern(history.data ?? [], pastDays);
  const ramp = calendar.data?.festivalRamp ?? 0;
  const forecast = pattern.avg !== null ? Math.round(pattern.avg * (1 + (ramp || 0))) : null;
  const where = active.length === 1 ? DEPOT_NAME[active[0]] ?? active[0] : 'your depots';
  const shortWhere = active.length === 1 ? (DEPOT_NAME[active[0]] ?? active[0]).split(' ')[0] : 'All';

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-21 Empty queue before cutoff · desktop">
      <div className="d-app">
        <PlanSide active="N1" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {active.length === 1 ? `${DEPOT_NAME[active[0]] ?? active[0]} ` : 'Both depots '}
                <span className="m-sep" />{` ${fmtRunDate(run)} run `}<span className="m-sep" />{` ${fmtDayTime(now)}`}
              </div>
              <div className="d-h1">Cutoff queue for {fmtRunDate(run)}</div>
            </div>
            <div className="dx-tabs">
              {depots.map(d => (
                <span
                  key={d}
                  className={`dx-tab lv-click${depot === d || (!depot && depots.length === 1) ? ' is-on' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={depot === d}
                  data-testid={`tab-${d}`}
                  onClick={e => { e.stopPropagation(); setDepot(depot === d ? null : d); }}
                  onKeyDown={e => { if (e.key === 'Enter') setDepot(depot === d ? null : d); }}
                >
                  {`${(DEPOT_NAME[d] ?? d).replace(' DC', '')} `}<b>{counts.data?.[d] ?? '…'}</b>
                </span>
              ))}
            </div>
            <span className="d-btn d-btn--disabled" aria-disabled="true"><Ic n="sparkle-plus" />Agent drafts at {CUTOFF_LABEL}</span>
          </div>
          <ErrorBanner error={counts.error ?? fleet.error} onRetry={() => { void counts.refresh(); void fleet.refresh(); }} />
          <div className="dx-card" style={{ flex: '1' }}>
            <div className="dx-empty" data-state="empty">
              <svg width="220" height="170" viewBox="0 0 220 170" aria-hidden>
                <ellipse cx="110" cy="150" rx="88" ry="12" fill="#141B4D" opacity=".06" />{" "}
                <rect x="58" y="22" width="104" height="126" rx="16" fill="#FFFFFF" stroke="#DCE0EE" strokeWidth="2" />{" "}
                <rect x="84" y="12" width="52" height="20" rx="8" fill="#3B4CCA" />{" "}
                <rect x="76" y="54" width="68" height="8" rx="4" fill="#EEF0FF" /><rect x="76" y="74" width="52" height="8" rx="4" fill="#EEF0FF" /><rect x="76" y="94" width="60" height="8" rx="4" fill="#EEF0FF" /><rect x="76" y="114" width="40" height="8" rx="4" fill="#EEF0FF" />{" "}
                <circle cx="166" cy="44" r="24" fill="#F5B83D" opacity=".18" />{" "}
                <path d="M166 26 L170.5 39.5 L184 44 L170.5 48.5 L166 62 L161.5 48.5 L148 44 L161.5 39.5 Z" fill="#F5B83D" />{" "}
                <circle cx="166" cy="44" r="2.6" fill="#141B4D" />{" "}
                <circle cx="44" cy="96" r="6" fill="#3B4CCA" opacity=".35" /><circle cx="30" cy="70" r="3.5" fill="#F5B83D" opacity=".7" />
              </svg>
              <span className="dx-h1xl" data-testid="empty-title">No {active.length === 1 ? `${DEPOT_NAME[active[0]] ?? active[0]} ` : ''}orders yet</span>
              <span className="dx-t14" style={{ maxWidth: '520px' }}>
                Orders for {weekdayOf(run)} land here as stores send them, from the store app or by phone. Nothing to plan until the {CUTOFF_LABEL} cutoff.
              </span>
              <div className="hstack" style={{ gap: '10px', marginTop: '6px' }}>
                <span className="d-btn d-btn--primary" data-lk="L171"><Ic n="call" />{"Log phone order"}</span>
                <Btn className="d-btn" onClick={() => nav.go('N6')}><Ic n="chart" />{"Capacity outlook"}</Btn>
              </div>
            </div>
            <div className="dx-stats" style={{ padding: '18px 24px 22px', borderTop: '1px solid var(--hair)' }}>
              <div className="dx-stat" data-testid="until-cutoff"><b>{untilText(open.msLeft)}</b><span>until cutoff, {fmtTime(open.cutoff)}</span></div>
              <div className="dx-stat" data-testid="forecast">
                <b>{forecast === null ? '—' : `~${forecast}`}</b>
                <span>{forecast === null ? `no ${weekdayOf(run)} runs to go by` : `orders forecast${calendar.data?.festivalName ? `, ${calendar.data.festivalName}` : `, usual ${weekdayOf(run)}`}`}</span>
              </div>
              <div className="dx-stat" data-testid="vehicles-ready"><b>{fleet.data ? `${ready} / ${vehicles.length}` : '…'}</b><span>{shortWhere} vehicles ready</span></div>
              <div className="dx-stat" data-testid="first-order"><b>{pattern.first ?? '—'}</b><span>{pattern.first ? `usual first order, ${weekdayOf(run)}s` : 'no first-order pattern yet'}</span></div>
            </div>
          </div>
          <span className="t-3" style={{ fontSize: '12.5px' }}>
            Counting orders for {where} on the {fmtRunDate(run)} run. The queue opens on its own once the first order arrives.
          </span>
        </div>
      </div>
    </div>
  );
}
