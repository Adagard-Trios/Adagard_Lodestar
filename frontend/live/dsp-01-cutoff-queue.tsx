'use client';
// DSP-01 Cutoff queue, live. Markup and classes from the generated design (frontend/screens/dsp-01-cutoff-queue.tsx).
// Data: Orders of the run date (paged, filter chips, $search), Vehicles for capacity. "Agent drafting" starts a
// planning-agent run (POST AgentRuns) and follows the design link to DSP-22.
import { useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope, useStartAgentRun } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { BRAND_LETTER, DEPOT_NAME, fmtNum, fmtRunDate, title } from '@/lib/format';
import { useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { Order, Vehicle } from '@/lib/odata/types';
import { depotFilter, useAgentRunId } from '@/lib/workday';

type Chip = 'all' | 'chilled' | 'van' | 'mall' | 'flagged';
const CHIP_FILTER: Record<Chip, string | undefined> = {
  all: undefined,
  chilled: "tempClass eq 'CHILLED'",
  van: "outlet/parking eq 'VAN_ONLY'",
  mall: "outlet/dockType eq 'MALL_BAY'",
  flagged: "(deferredYesterday eq true or status eq 'EXCEPTION' or deferralScore ge 91)",
};
const LIVE_STATUSES = "status ne 'CANCELLED'";

const isProtected = (o: Order) => o.deferredYesterday || (o.deferralScore ?? 0) >= 91;
const DOCK: Record<string, string> = { REAR_DOCK: 'rear dock', STREET: 'street', MALL_BAY: 'mall bay' };

function Why({ o }: { o: Order }) {
  if (isProtected(o)) return <span className="m-pill m-pill--warn"><Ic n="shield-check" />Protected{o.deferredYesterday ? ' · deferred yesterday' : ''}</span>;
  if (o.status === 'EXCEPTION') return <span className="m-pill m-pill--bad"><Ic n="alert" />Exception{o.notes ? ` · ${o.notes}` : ''}</span>;
  return (
    <>
      {o.outlet?.parking === 'VAN_ONLY' && <span className="m-tag m-tag--brand"><Ic n="van" />van_only</span>}
      {o.outlet?.dockType === 'MALL_BAY' && <span className="m-tag m-tag--info"><Ic n="store" />Mall window</span>}
      <span className="t-3">{o.notes ?? (o.daysSince ? `${o.daysSince} day${o.daysSince === 1 ? '' : 's'} since last delivery` : '')}</span>
    </>
  );
}

export default function LiveDsp01CutoffQueue() {
  const nav = useScreenNav();
  const scope = usePlanScope();
  const { runDate, ordersFilter, active, depot } = scope;
  const [chip, setChip] = useState<Chip>('all');
  const [search, setSearch] = useState('');
  const [, setRunId] = useAgentRunId();

  const base = ordersFilter ? `${ordersFilter} and ${LIVE_STATUSES}` : null;
  const queue = useEntitySet<Order>(
    'Orders',
    base ? { filter: [base, CHIP_FILTER[chip]].filter(Boolean).join(' and '), expand: 'outlet', orderby: 'deferredYesterday desc,deferralScore desc,id', top: 50, count: true, search: search.trim() || undefined } : null,
    { refreshOn: ['notification'] },
  );
  const all = useQuery<Order[]>(base ? `queue-all:${base}` : null, c =>
    c.all<Order>('Orders', { filter: base!, select: 'id,brand,tempClass,m3,kg,status,deferredYesterday,deferralScore', expand: 'outlet($select=parking,dockType)' }),
  { refreshOn: ['notification'] });
  const fleet = useQuery<Vehicle[]>(`fleet:${active.join(',')}`, c => c.all<Vehicle>('Vehicles', { filter: depotFilter('depot', active) }));

  const orders = all.data ?? [];
  const brands = { FRESH: 0, STYLE: 0, TECH: 0 } as Record<string, number>;
  orders.forEach(o => (brands[o.brand] = (brands[o.brand] ?? 0) + 1));
  const chilledOpen = orders.filter(o => o.tempClass === 'CHILLED' && !['DEFERRED', 'EXCEPTION'].includes(o.status));
  const demand = chilledOpen.reduce((s, o) => s + (o.m3 ?? 0), 0);
  const vehicles = fleet.data ?? [];
  const ready = vehicles.filter(v => v.status !== 'WORKSHOP');
  const workshop = vehicles.filter(v => v.status === 'WORKSHOP');
  const capacity = ready.filter(v => v.tempClass === 'CHILLED').reduce((s, v) => s + v.capacityM3, 0);
  const gap = capacity - demand;
  const counts: Record<Chip, number> = {
    all: orders.length,
    chilled: orders.filter(o => o.tempClass === 'CHILLED').length,
    van: orders.filter(o => o.outlet?.parking === 'VAN_ONLY').length,
    mall: orders.filter(o => o.outlet?.dockType === 'MALL_BAY').length,
    flagged: orders.filter(o => isProtected(o) || o.status === 'EXCEPTION').length,
  };
  const vans = ready.filter(v => v.type === 'VAN');

  const draftDepot = depot ?? active[0];
  const start = useStartAgentRun(run => {
    setRunId(run.id);
    nav.go('L1');
  });

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-01 Cutoff queue">
      <div className="d-app">
        <PlanSide active="N1" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Orders closed 4:00 PM"}
                <span className="m-sep" />
                {active.map(d => DEPOT_NAME[d] ?? d).join(' + ')}
              </div>
              <div className="d-h1">Cutoff queue for {runDate ? fmtRunDate(runDate) : '…'}</div>
            </div>
            <span className="d-btn" data-lk="L151"><Ic n="call" />{"Log phone order"}</span>
            <Btn
              className="d-btn d-btn--primary"
              testId="start-agent"
              busy={start.pending}
              disabled={!runDate || !draftDepot}
              onClick={() => void start.run({ depot: draftDepot!, runDate: runDate! })}
            >
              <Ic n="sparkle-plus" />
              {start.pending ? 'Agent drafting…' : `Draft the plan with the agent${active.length > 1 ? ` · ${DEPOT_NAME[draftDepot!] ?? draftDepot}` : ''}`}
            </Btn>
          </div>
          {start.error && <ErrorBanner error={start.error} onRetry={() => void start.run({ depot: draftDepot!, runDate: runDate! })} />}
          {scope.noPlans && <Empty title="No run date yet" text="There are no plans to queue orders against." icon="calendar" />}
          <div className="d-kpis">
            <div className="d-kpi d-kpi--hero x-kpi-xl" style={{ flex: '1' }}>
              <span className="d-kpi__l">{"Confirmed orders"}</span>
              <span className="d-kpi__v" data-testid="queue-total">{all.data ? orders.length : '…'}<small>{"orders"}</small></span>
              <div className="x-brands">
                <span><span className="x-dot" style={{ background: '#4ADE80' }} />{"Fresh "}<b>{brands.FRESH}</b></span>
                <span><span className="x-dot" style={{ background: '#F472B6' }} />{"Style "}<b>{brands.STYLE}</b></span>
                <span><span className="x-dot" style={{ background: '#CBD5E1' }} />{"Tech "}<b>{brands.TECH}</b></span>
              </div>
            </div>
            <div className={`d-kpi x-kpi-xl${gap < 0 ? ' d-kpi--alert' : ''}`} style={{ flex: '1.75' }}>
              <span className="d-kpi__l" style={gap < 0 ? { color: 'var(--st-exception-fg)' } : undefined}>{gap < 0 ? 'Chilled capacity gap' : 'Chilled capacity'}</span>
              <div className="x-kpi-row">
                <span className="d-kpi__v" style={gap < 0 ? { color: 'var(--st-exception-fg)' } : undefined}>{gap < 0 ? '−' : '+'}{fmtNum(Math.abs(gap), 1)}<small>{"m³"}</small></span>
                <div className="x-kpi-side"><span><b>{fmtNum(demand, 1)} m³</b>{" needed"}</span><span><b>{fmtNum(capacity, 1)} m³</b>{" on reefers ready"}</span></div>
              </div>
              <div className="x-gap">
                <div style={{ width: `${demand > 0 ? Math.min(100, (capacity / Math.max(demand, capacity)) * 100) : 100}%`, background: 'var(--chilled-fg)' }} />
                {gap < 0 && <div style={{ flex: '1', background: 'var(--st-exception-fg)' }} />}
              </div>
              <span className="d-kpi__s">{"The planning agent frees reefer space first, then proposes deferrals."}</span>
            </div>
            <div className="d-kpi" style={{ justifyContent: 'space-between' }}>
              <span className="d-kpi__l">{"Vehicles ready"}</span>
              <span className="d-kpi__v">{ready.length}<small>/ {vehicles.length}</small></span>
              <span className="d-kpi__s">
                {workshop.length ? <>In workshop: {workshop.slice(0, 3).map((v, i) => <span key={v.id}>{i ? ', ' : ''}<span className="id">{v.id}</span></span>)}{workshop.length > 3 ? ` +${workshop.length - 3}` : ''}</> : 'None in workshop'}
              </span>
            </div>
            <div className="d-kpi" style={{ justifyContent: 'space-between' }}>
              <span className="d-kpi__l">{"Access limits"}</span>
              <span className="d-kpi__v">{counts.van}<small>{"van_only"}</small> {counts.mall}<small>{"mall"}</small></span>
              <span className="d-kpi__s">{vans.length} vans ready, {vans.filter(v => v.tempClass === 'CHILLED').length} reefer</span>
            </div>
          </div>
          <div className="d-card" style={{ flex: '1', minHeight: '0' }}>
            <div className="d-card__head">
              <span className="d-card__title">{"Queue"}</span>
              <div className="d-toolbar" style={{ marginLeft: '10px' }}>
                {([['all', 'All'], ['chilled', 'Chilled'], ['van', 'van_only'], ['mall', 'Mall window'], ['flagged', 'Flagged']] as Array<[Chip, string]>).map(([k, label]) => (
                  <span
                    key={k}
                    className={`d-filter lv-click${chip === k ? ' is-on' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={chip === k}
                    onClick={e => { e.stopPropagation(); setChip(k); }}
                    onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}
                  >
                    {label} <b>{counts[k]}</b>
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="x-meta t-3">{"Sorted: "}<b className="t-2" style={{ fontWeight: '700' }}>{"needs attention first"}</b></span>
              <span className="d-search" style={{ width: '230px' }}>
                <Ic n="filter" />
                <input className="lv-input" aria-label="Search orders" placeholder="Order, outlet or note" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            {queue.error && <ErrorBanner error={queue.error} onRetry={queue.refresh} />}
            {!queue.data && !queue.error && <Skeleton rows={5} />}
            {queue.data?.length === 0 && <Empty title="The queue is empty" text={search || chip !== 'all' ? 'No orders match this filter.' : 'No orders for this run date yet.'} />}
            {queue.data && queue.data.length > 0 && (
              <div className="d-table" data-testid="queue">
                <div className="d-tr d-tr--head">
                  <span className="d-td" style={{ width: '108px' }}>{"Order"}</span>
                  <span className="d-td" style={{ width: '214px' }}>{"Outlet"}</span>
                  <span className="d-td" style={{ width: '96px' }}>{"Temperature"}</span>
                  <span className="d-td" style={{ width: '146px' }}>{"Size"}</span>
                  <span className="d-td" style={{ width: '104px' }}>{"Window"}</span>
                  <span className="d-td" style={{ flex: '1' }}>{"Why it matters"}</span>
                  <span className="d-td" style={{ width: '96px' }}>{"Status"}</span>
                </div>
                {queue.data.map(o => (
                  <div key={o.id} className={`d-tr x-tr2${isProtected(o) ? ' d-tr--warn' : ''}`} data-lk="L150" data-order={o.id}>
                    <span className="d-td id" style={{ width: '108px' }}>{o.id}</span>
                    <span className="d-td x-outlet" style={{ width: '214px' }}>
                      <span className={`bb bb--${o.brand.toLowerCase()} x-bb`}>{BRAND_LETTER[o.brand]}</span>
                      <span className="x-outlet__t">
                        <b>{o.outlet?.name ?? o.outletId}</b>
                        <span><span className="id">{o.outletId}</span> · {o.outlet?.district} · {DOCK[o.outlet?.dockType ?? ''] ?? ''}</span>
                      </span>
                    </span>
                    <span className="d-td" style={{ width: '96px' }}>
                      {o.tempClass === 'CHILLED'
                        ? <span className="m-tag m-tag--cold"><Ic n="snow-heavy" />{"Chilled"}</span>
                        : <span className="m-tag"><span className="dot" style={{ color: '#98A1B3' }} />{"Ambient"}</span>}
                    </span>
                    <span className="d-td mono" style={{ width: '146px' }}>{fmtNum(o.m3, 1)} m³ · {fmtNum(o.kg)} kg</span>
                    <span className="d-td mono" style={{ width: '104px' }}>{o.outlet ? `${o.outlet.windowOpen}–${o.outlet.windowClose}` : '—'}</span>
                    <span className="d-td x-meta" style={{ flex: '1', minWidth: '0' }}><Why o={o} /></span>
                    <span className="d-td t-2" style={{ width: '96px' }}>{title(o.status)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>Showing <b>{queue.data?.length ?? 0}</b> of <b>{queue.count ?? '…'}</b>{chip === 'all' && !search ? ' · all received' : ''}</span>
              <span className="spacer" />
              {queue.hasMore && (
                queue.loadingMore ? <Spinner label="Loading more…" /> : (
                  <Btn className="x-link" onClick={() => void queue.loadMore()}>{"Show more"}<Ic n="chevron-right" /></Btn>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
