'use client';
// DSP-17 Deferral log, live. Markup and classes from the generated design (frontend/screens/dsp-17-deferral-log.tsx).
// Data: Deferrals of the last 30 days in the depots in view (paged, reason chips, $search), with their Order and
// Outlet. A row opens the outlet profile (DSP-18).
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { PlanSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { BRAND_LETTER, dayFilter, daysAgo, fmtDayTime, fmtRunDate } from '@/lib/format';
import { useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { Deferral, Outlet, User } from '@/lib/odata/types';
import { depotFilter, useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

type Chip = 'ALL' | 'CAP_REEFER' | 'CAP_TIME' | 'ACCESS' | 'OTHER';
const CHIP: Record<Chip, string | undefined> = {
  ALL: undefined,
  CAP_REEFER: "reason eq 'CAP_REEFER'",
  CAP_TIME: "reason eq 'CAP_TIME'",
  ACCESS: "reason eq 'ACCESS'",
  OTHER: "reason in ('WINDOW','FUEL','VEH_DOWN')",
};
const code = (r: string) => r.replace('_', '-');
/** Who decided: the dispatcher who confirmed it, else the one who approved the plan that deferred it. */
export const deciderOf = (d: Pick<Deferral, 'resolvedBy' | 'plan'>) => d.resolvedBy ?? d.plan?.approvedBy ?? null;
/** The run the order was deferred from (the plan's run); the order itself has moved to the rescheduled run. */
export const deferredFrom = (d: Pick<Deferral, 'plan' | 'order'>) => d.plan?.runDate ?? d.order?.runDate ?? null;

function Next({ d }: { d: Deferral }) {
  switch (d.status) {
    case 'CONFIRMED':
      return <span className="m-tag m-tag--brand"><span className="dot" />To {d.rescheduledDate ? fmtRunDate(d.rescheduledDate) : 'the next run'}, protected then</span>;
    case 'REVERSED':
      return <span className="m-tag m-tag--ok"><Ic n="check" />Reversed{d.notes ? ` · ${d.notes}` : ''}</span>;
    case 'DISMISSED':
      return <span className="m-tag m-tag--ok"><Ic n="check" />Dismissed, kept on the plan</span>;
    default:
      return <span className="m-tag m-tag--warn"><span className="dot" />Waiting for a decision</span>;
  }
}

export default function LiveDsp17DeferralLog() {
  const { name: depotName } = useDepots();
  const { runDate, active } = usePlanScope();
  const [, setOutlet] = useFocusId('outlet');
  const [chip, setChip] = useState<Chip>('ALL');
  const [search, setSearch] = useState('');
  const since = daysAgo(30);
  const base = [`createdAt ge ${since}T00:00:00Z`, depotFilter('order/outlet/depot', active)].filter(Boolean).join(' and ');

  const log = useEntitySet<Deferral>('Deferrals', { filter: [base, CHIP[chip]].filter(Boolean).join(' and '), expand: 'order,plan($select=id,runDate,approvedBy)', orderby: 'createdAt desc', top: 25, count: true, search: search.trim() || undefined }, {
    refreshOn: ['notification'],
  });
  const ids = [...new Set((log.data ?? []).map(d => d.order?.outletId).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b))) as string[];
  const outlets = useQuery<Map<string, Outlet>>(ids.length ? `log-outlets:${ids.join(',')}` : null, async c => {
    const rows = await c.all<Outlet>('Outlets', { filter: `id in (${ids.map(i => `'${i}'`).join(',')})`, select: 'id,name,district,brand,parking' });
    return new Map(rows.map(o => [o.id, o]));
  });
  // who decided each row (Users directory), so the log names the dispatcher instead of "a dispatcher"
  const deciders = [...new Set((log.data ?? []).map(deciderOf).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b))) as string[];
  const people = useQuery<Map<string, string>>(deciders.length ? `log-deciders:${deciders.join(',')}` : null, async c => {
    const rows = await c.all<User>('Users', { filter: `id in (${deciders.map(i => `'${i}'`).join(',')})`, select: 'id,name' });
    return new Map(rows.map(u => [u.id, u.name]));
  });
  const reasons = useQuery<Deferral[]>(`log-reasons:${base}`, c => c.all<Deferral>('Deferrals', { filter: base, select: 'id,reason,status', expand: 'order($select=deferredYesterday)' }));
  const forRun = useCount('Deferrals', runDate ? [dayFilter('order/runDate', runDate), "status ne 'DISMISSED'", depotFilter('order/outlet/depot', active)].filter(Boolean).join(' and ') : null);

  const all = reasons.data ?? [];
  const byReason = all.reduce<Record<string, number>>((m, d) => ({ ...m, [d.reason]: (m[d.reason] ?? 0) + 1 }), {});
  const top = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0];
  const twice = all.filter(d => d.status === 'CONFIRMED' && d.order?.deferredYesterday).length;
  const chipCount: Record<Chip, number> = {
    ALL: all.length, CAP_REEFER: byReason.CAP_REEFER ?? 0, CAP_TIME: byReason.CAP_TIME ?? 0, ACCESS: byReason.ACCESS ?? 0,
    OTHER: (byReason.WINDOW ?? 0) + (byReason.FUEL ?? 0) + (byReason.VEH_DOWN ?? 0),
  };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-17 Deferral log · desktop">
      <div className="d-app">
        <PlanSide active="N3" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Records "}<span className="m-sep" />{active.length > 1 ? ' Both depots ' : ` ${depotName(active[0])} `}<span className="m-sep" />{" Last 30 days"}</div>
              <div className="d-h1">{"Deferral log"}</div>
              <div className="d-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ic n="shield-check" className="ic ic--sm" />
                {"Tamper-evident: every decision is written to the hash-chained audit log; corrections are added, never overwritten."}
              </div>
            </div>
          </div>
          <div className="dx-hrow">
            <div className="dx-hero" style={{ flex: '1.6', gap: '8px', padding: '18px 22px' }}>
              <div className="dx-hero__l"><Ic n="shield" className="ic ic--sm" />{"Consecutive-skip guard · last 30 days"}</div>
              <div className="hstack" style={{ gap: '14px', alignItems: 'flex-end' }}>
                <span className="dx-display" data-testid="skipped-twice">{reasons.data ? twice : '…'}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', paddingBottom: '4px', whiteSpace: 'nowrap' }}>{"skipped twice running"}</span>
              </div>
              <div className="dx-hero__m">Outlets deferred yesterday are protected on the next run and never proposed again.</div>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"Deferrals"}</span><span className="d-kpi__v">{reasons.data ? all.length : '…'}<small>{"in 30 days"}</small></span><span className="d-kpi__s">{all.filter(d => d.status === 'CONFIRMED').length} confirmed</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Most common"}</span><span className="d-kpi__v">{top ? top[1] : 0}<small>{top ? code(top[0]) : '—'}</small></span><span className="d-kpi__s">{"reason code"}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">For {runDate ? fmtRunDate(runDate) : '…'}</span><span className="d-kpi__v">{forRun ?? '…'}</span><span className="d-kpi__s">{"suggested or confirmed"}</span></div>
          </div>
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card__head">
              <div className="d-toolbar">
                {(['ALL', 'CAP_REEFER', 'CAP_TIME', 'ACCESS', 'OTHER'] as Chip[]).map(k => (
                  <span key={k} className={`d-filter lv-click${chip === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setChip(k); }} onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}>
                    {k === 'ALL' ? 'All' : k === 'OTHER' ? 'Other' : code(k)} <b>{chipCount[k]}</b>
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-search" style={{ width: '230px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search deferrals" placeholder="Order or note" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <ErrorBanner error={log.error ?? reasons.error} onRetry={log.refresh} />
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '90px' }}>{"Run"}</span>
              <span className="dx-td" style={{ width: '110px' }}>{"Order"}</span>
              <span className="dx-td" style={{ width: '204px' }}>{"Outlet"}</span>
              <span className="dx-td" style={{ width: '118px' }}>{"Reason"}</span>
              <span className="dx-td" style={{ width: '50px' }}>{"Score"}</span>
              <span className="dx-td" style={{ width: '232px' }}>{"Proposed · approved"}</span>
              <span className="dx-td" style={{ flex: '1' }}>{"What happened next"}</span>
            </div>
            {!log.data && !log.error && <Skeleton rows={5} />}
            {log.data?.length === 0 && <Empty title="No deferrals" text="Nothing was deferred in the last 30 days for this filter." />}
            {log.data?.map(d => {
              const o = d.order;
              const outlet = outlets.data?.get(o?.outletId ?? '');
              return (
                <div
                  key={d.id}
                  className={`dx-tr${d.isProvisional ? ' dx-tr--off' : ''}`}
                  style={{ minHeight: '54px' }}
                  data-lk="L168"
                  data-deferral={d.id}
                  onClickCapture={() => setOutlet(o?.outletId ?? null)}
                >
                  <span className="dx-td" style={{ width: '90px' }}>{deferredFrom(d) ? fmtRunDate(deferredFrom(d)!) : '—'}</span>
                  <span className="dx-td" style={{ width: '110px' }}><span className="id">{d.orderId}</span></span>
                  <span className="dx-td" style={{ width: '204px' }}>
                    <span className="hstack" style={{ gap: '10px' }}>
                      {o?.brand && <span className={`bb bb--${o.brand.toLowerCase()} dx-bb`}>{BRAND_LETTER[o.brand] ?? o.brand[0]}</span>}
                      <span className="dx-td2"><b>{outlet?.name ?? o?.outletId}</b><span><span className="id">{o?.outletId}</span> · {outlet?.district}{outlet?.parking === 'VAN_ONLY' ? ' · van_only' : ''}</span></span>
                    </span>
                  </span>
                  <span className="dx-td" style={{ width: '118px' }}><span className={`dx-code${d.isProvisional ? ' dx-code--soft' : ''}`}>{d.isProvisional ? 'PROVISIONAL' : code(d.reason)}</span></span>
                  <span className="dx-td" style={{ width: '50px' }}><b style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>{d.isProvisional ? <span className="t-3" style={{ fontSize: '14px' }}>{"n/a"}</span> : d.score}</b></span>
                  <span className="dx-td" style={{ width: '232px' }}>
                    <span className="dx-td2">
                      <b>{d.status === 'SUGGESTED' ? 'Suggested by the planner' : d.status === 'CONFIRMED' ? 'Confirmed' : d.status === 'REVERSED' ? 'Reversed' : 'Dismissed'}</b>
                      <span>{deciderOf(d) ? `by ${people.data?.get(deciderOf(d)!) ?? 'a dispatcher'}` : d.status === 'SUGGESTED' ? 'not decided yet' : 'by the plan'} · {fmtDayTime(d.confirmedAt ?? d.updatedAt ?? d.createdAt)}</span>
                    </span>
                  </span>
                  <span className="dx-td" style={{ flex: '1', minWidth: '0' }}><Next d={d} /></span>
                </div>
              );
            })}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>Showing <b>{log.data?.length ?? 0}</b> of <b>{log.count ?? '…'}</b> · every row opens the outlet</span>
              <span className="spacer" />
              {log.hasMore && (log.loadingMore ? <Spinner label="Loading more…" /> : <Btn className="x-link" onClick={() => void log.loadMore()}>{"Show more"}<Ic n="chevron-down" /></Btn>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
