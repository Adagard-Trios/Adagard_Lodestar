'use client';
// DSP-18 Outlet profile, live. Markup and classes from the generated design (frontend/screens/dsp-18-outlet-profile.tsx).
// Data: Outlets('…'), its recent Orders (with trip stop and deferral), its Deferrals (skip history), the
// ServiceAllowances(brand,dockType) and DistrictTravel('district') used for the access card. The outlet comes from
// the row the user opened (deferral log, cutoff queue) or ?id=; a picker covers direct visits.
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { useAgentConfig } from '@/components/live/settings-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, fmtDay, fmtNum, fmtRunDate, pct, title } from '@/lib/format';
import { useEntity, useQuery } from '@/lib/odata/hooks';
import type { Deferral, Order, Outlet } from '@/lib/odata/types';
import { depotFilter, useFocusId } from '@/lib/workday';

const DOCK: Record<string, string> = { REAR_DOCK: 'Rear dock', STREET: 'Street, no dock', MALL_BAY: 'Mall bay' };
const PARKING: Record<string, string> = { NORMAL: 'Normal, any vehicle', VAN_ONLY: 'Vans only', MALL_DOCK: 'Mall dock' };
const code = (r: string) => r.replace('_', '-');

export default function LiveDsp18OutletProfile() {
  const { runDate, active } = usePlanScope();
  const [focus, setFocus] = useFocusId('outlet');
  const [, setOrder] = useFocusId('order');
  const choices = useQuery<Outlet[]>(`outlet-choices:${active.join(',')}`, c => c.all<Outlet>('Outlets', { filter: depotFilter('depot', active), select: 'id,name', orderby: 'id' }));
  const id = focus ?? choices.data?.[0]?.id ?? null;
  const outlet = useEntity<Outlet>('Outlets', id);
  const o = outlet.data;
  const orders = useQuery<Order[]>(id ? `outlet-orders:${id}` : null, async c =>
    (await c.list<Order>('Orders', { filter: `outletId eq '${id}'`, expand: 'tripStop', orderby: 'runDate desc', top: 30 })).value,
  { refreshOn: ['eta_update', 'notification'] });
  const skips = useQuery<Deferral[]>(id ? `outlet-skips:${id}` : null, async c =>
    (await c.list<Deferral>('Deferrals', { filter: `order/outletId eq '${id}'`, expand: 'order($select=runDate)', orderby: 'createdAt desc', top: 10 })).value);
  const allowance = useQuery<{ minutes: number } | null>(o ? `allowance:${o.brand}:${o.dockType}` : null, c =>
    c.get<{ minutes: number }>('ServiceAllowances', { brand: o!.brand, dockType: o!.dockType }).catch(() => null));
  const travel = useQuery<{ depotToDistMin: number; roadClass: string } | null>(o ? `travel:${o.district}` : null, c =>
    c.get<{ depotToDistMin: number; roadClass: string }>('DistrictTravel', o!.district).catch(() => null));

  // the protected threshold is the planner's own (AgentConfig limits), not a number kept on this screen
  const protectedScore = useAgentConfig().data?.limits?.protectedScore;
  const list = orders.data ?? [];
  const upcoming = [...list].reverse().find(x => (!runDate || x.runDate.slice(0, 10) >= runDate) && !['DELIVERED', 'CANCELLED'].includes(x.status)) ?? list[0];
  const record = list.slice(0, 12).reverse();
  const stops = list.map(x => x.tripStop).filter(s => s?.arrivalActual);
  const onTime = stops.filter(s => !s!.etaModelBandLate || new Date(s!.arrivalActual!) <= new Date(s!.etaModelBandLate)).length;
  const chilled = list.filter(x => x.tempClass === 'CHILLED');
  const typical = chilled.length ? chilled.reduce((s, x) => s + x.m3, 0) / chilled.length : 0;
  const protectedNext = upcoming && (upcoming.deferredYesterday || (protectedScore !== undefined && (upcoming.deferralScore ?? 0) >= protectedScore));

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-18 Outlet profile · desktop">
      <div className="d-app">
        <PlanSide active="N7" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Fleet & outlets "}<span className="m-sep" />{" Outlets "}<span className="m-sep" />{` ${o?.district ?? ''} `}<span className="m-sep" />{` ${DEPOT_NAME[o?.depot ?? ''] ?? ''}`}
              </div>
              <div className="d-h1">{o?.name ?? (outlet.loading ? 'Loading…' : 'Outlet')} <span className="id" style={{ fontSize: '18px', color: 'var(--text-3)', fontWeight: '600' }}>{o?.id}</span></div>
            </div>
            <span className="d-search" style={{ width: '260px' }}>
              <Ic n="store" className="ic ic--sm" />
              <select className="lv-input" aria-label="Outlet" value={id ?? ''} onChange={e => setFocus(e.target.value || null)}>
                {(choices.data ?? []).map(c => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
              </select>
            </span>
          </div>
          <ErrorBanner error={outlet.error ?? orders.error ?? choices.error} onRetry={() => { void outlet.refresh(); void orders.refresh(); }} />
          {!o && !outlet.error && <Skeleton rows={3} />}
          {o && (
            <>
              <div className="dx-hrow">
                <div className="dx-hero" style={{ flex: '1.2' }}>
                  <div className="dx-hero__l"><Ic n="shield" className="ic ic--sm" />{"Consecutive-skip guard"}</div>
                  <div className="dx-display">{protectedNext ? 'Protected' : 'Normal'}<small>for {upcoming ? fmtRunDate(upcoming.runDate) : 'the next run'}</small></div>
                  <div className="dx-hero__m">
                    {protectedNext
                      ? <>Deferred on the previous run. Score <b>{upcoming?.deferralScore ?? '—'}</b>, so the planning agent won&apos;t propose it and deferring again needs a manager&apos;s reason.</>
                      : <>Not deferred on the previous run. The planner may rank it if capacity is short.</>}
                  </div>
                  <div className="dx-stats">
                    <div className="dx-stat" style={{ borderColor: 'rgba(255,255,255,.12)' }}><b>{upcoming?.deferredYesterday ? 'yes' : 'no'}</b><span style={{ color: '#B9C0E6' }}>{"deferred yesterday"}</span></div>
                    <div className="dx-stat" style={{ borderColor: 'rgba(255,255,255,.12)' }}><b>{upcoming?.daysSince ?? '—'}</b><span style={{ color: '#B9C0E6' }}>{"days since served"}</span></div>
                    <div className="dx-stat" style={{ borderColor: 'rgba(255,255,255,.12)' }}><b>{upcoming?.deferralScore ?? '—'}</b><span style={{ color: '#B9C0E6' }}>{"deferral score"}</span></div>
                  </div>
                </div>
                <div className="dx-card" style={{ flex: '1' }}>
                  <div className="dx-card__head"><span className="dx-card__title">{"Next delivery"}</span><span className="spacer" />{upcoming && <span className="m-pill m-pill--brand">{title(upcoming.status)}</span>}</div>
                  <div className="dx-card__body" style={{ gap: '0' }}>
                    {!upcoming && <Empty title="No order" text="This outlet has no recent orders." />}
                    {upcoming && (
                      <>
                        <div className="dx-kv"><span>{"Run"}</span><b>{fmtRunDate(upcoming.runDate)}</b></div>
                        <div className="dx-kv" data-lk="L169" onClickCapture={() => setOrder(upcoming.id)}><span>{"Order"}</span><b><span className="id">{upcoming.id}</span> · {upcoming.units} units</b></div>
                        <div className="dx-kv"><span>{"Load"}</span><b>{title(upcoming.tempClass)} {fmtNum(upcoming.m3, 1)} m³ · {fmtNum(upcoming.kg)} kg</b></div>
                        <div className="dx-kv"><span>{"Stop"}</span><b>{upcoming.tripStop ? `${upcoming.tripStop.tripId} · stop ${upcoming.tripStop.stopSeq}` : 'not on a trip yet'}</b></div>
                        <div className="dx-kv"><span>{"Ordered"}</span><b>{fmtDay(upcoming.orderedAt)}</b></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="dx-hrow" style={{ flex: '1' }}>
                <div className="dx-card" style={{ flex: '1' }}>
                  <div className="dx-card__head"><span className="dx-card__title">{"Access and window"}</span></div>
                  <div className="dx-card__body" style={{ gap: '0' }}>
                    <div className="dx-kv"><span>{"Unloading"}</span><b>{DOCK[o.dockType] ?? o.dockType}</b></div>
                    <div className="dx-kv"><span>{"Parking"}</span><b>{PARKING[o.parking] ?? o.parking}</b></div>
                    <div className="dx-kv"><span>{"Window"}</span><b className="mono">{o.windowOpen}–{o.windowClose}</b></div>
                    <div className="dx-kv"><span>{"Service allowance"}</span><b>{allowance.data ? `${allowance.data.minutes} min` : '—'}</b></div>
                    <div className="dx-kv"><span>From {DEPOT_NAME[o.depot] ?? o.depot}</span><b>{travel.data ? `${travel.data.depotToDistMin} min · ${o.district}` : o.district}</b></div>
                    {o.accessNote && (
                      <div className="dx-inset" style={{ marginTop: '8px', padding: '12px 14px', gap: '4px' }}>
                        <span className="dx-sech" style={{ color: 'var(--brand-600)' }}><Ic n="pen-2" />{"Access note the planner uses"}</span>
                        <span className="dx-t14">{o.accessNote}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="dx-card" style={{ flex: '1.2' }}>
                  <div className="dx-card__head"><span className="dx-card__title">{"Delivery record"}</span><span className="spacer" /><span className="dx-t13">last {record.length} orders</span></div>
                  <div className="dx-card__body" style={{ gap: '14px' }}>
                    {!orders.data && <Skeleton rows={1} />}
                    <div className="hstack" style={{ gap: '6px' }}>
                      {record.map(x => {
                        const ok = x.status === 'DELIVERED';
                        const warn = x.status === 'DEFERRED' || x.status === 'EXCEPTION';
                        return (
                          <div key={x.id} className="vstack" style={{ gap: '4px', alignItems: 'center', flex: '1' }} title={`${x.id} · ${title(x.status)}`}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '34px', borderRadius: '9px', background: ok ? 'var(--tint-ok)' : warn ? 'var(--tint-warn)' : 'var(--tint-brand)', color: ok ? 'var(--st-delivered-fg)' : warn ? 'var(--st-deferred-fg)' : 'var(--brand-600)' }}>
                              <Ic n={ok ? 'check' : warn ? 'exclaim' : 'clock'} className="ic ic--sm" />
                            </span>
                            <span className="dx-t13" style={{ whiteSpace: 'nowrap' }}>{fmtRunDate(x.runDate).replace(/ \w+$/, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="dx-stats">
                      <div className="dx-stat"><b>{stops.length ? `${pct(onTime, stops.length)}%` : '—'}</b><span>on time, last {stops.length} deliveries</span></div>
                      <div className="dx-stat"><b>{fmtNum(typical, 1)}<small>m³</small></b><span>{"typical chilled order"}</span></div>
                      <div className="dx-stat"><b>{skips.data?.length ?? '…'}</b><span>{"recent skips"}</span></div>
                    </div>
                    <div className="dx-sech"><b>{"Skip history"}</b></div>
                    <div className="vstack" style={{ gap: '0' }}>
                      {skips.data?.length === 0 && <span className="dx-t13">Never deferred.</span>}
                      {skips.data?.map(d => (
                        <div key={d.id} className="dx-kv">
                          <span className="hstack" style={{ gap: '8px' }}>{d.order ? fmtRunDate(d.order.runDate) : fmtDay(d.createdAt)} <span className="dx-code">{code(d.reason)}</span> score {d.score}</span>
                          {d.status === 'CONFIRMED'
                            ? <b className="m-tag m-tag--warn"><Ic n="shield-check" />{d.rescheduledDate ? `To ${fmtRunDate(d.rescheduledDate)}` : 'Deferred'}</b>
                            : <b className="m-tag m-tag--ok"><Ic n="check" />{title(d.status)}</b>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
