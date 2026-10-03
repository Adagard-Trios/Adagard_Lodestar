'use client';
// DSP-15 Late-risk explainer, live. Markup and classes from the generated design (frontend/screens/dsp-15-late-risk-explainer.tsx).
// The stop is the order the dispatcher opened (useFocusId('order') or ?id=), else the run date's riskiest stop not
// yet delivered (DSP-04's map legend opens this screen). Data: Trips of the run date with their stops (etaPlan,
// etaModel and its band, lateRiskPct), the stop's outlet (window close) and order (m³, chilled).
// "What moves the number" comes from the planning service's lateness model (GET Plans/Lodestar.LateRiskExplain:
// EtaService splits the stored figure into the base rate by road class, monsoon and planned hour, the +30 points
// when the model ETA is within 30 minutes of the window close, and any change made on the road since). The live
// board behind the drawer is a plain backdrop; the close button returns to DSP-04. "Hold space" opens the
// provisional deferral (DSP-A1b, the design's L58); the model line opens DSP-16 (L59). "Warn <outlet>" sends the
// outlet's store manager a notice (Notifications/Lodestar.Send).
import { useMemo } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { useLateRiskExplain, useMessageStore, usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtClock, fmtNum, isoDay, TIME_ZONE } from '@/lib/format';
import { usePlanningRules } from '@/components/live/planning-rules';
import { useEntity, useQuery } from '@/lib/odata/hooks';
import type { Order, Outlet, Trip, TripStop } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

/** Colombo hour and minutes-of-day of an instant. */
function colombo(v: string): { hour: number; min: number } {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(v)).map(x => [x.type, x.value]));
  return { hour: Number(p.hour), min: Number(p.hour) * 60 + Number(p.minute) };
}
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

export default function LiveDsp15LateRiskExplainer() {
  const levels = usePlanningRules().data?.lateRisk;
  const nav = useScreenNav();
  const { runDate, tripsFilter } = usePlanScope();
  const [focusOrder] = useFocusId('order');
  const trips = useQuery<Trip[]>(tripsFilter ? `dsp15:${tripsFilter}` : null, c => c.all<Trip>('Trips', { filter: tripsFilter, expand: 'stops,vehicle' }));

  const picked = useMemo(() => {
    const all = (trips.data ?? []).flatMap(t => (t.stops ?? []).map(s => ({ s, t })));
    const focused = focusOrder ? all.find(x => x.s.orderId === focusOrder) : undefined;
    if (focused) return focused;
    const open = all.filter(x => x.s.status !== 'DELIVERED' && x.s.lateRiskPct !== null && x.s.lateRiskPct !== undefined);
    return (open.length ? open : all).sort((a, b) => (b.s.lateRiskPct ?? -1) - (a.s.lateRiskPct ?? -1))[0];
  }, [trips.data, focusOrder]);
  const s: TripStop | undefined = picked?.s;
  const t: Trip | undefined = picked?.t;
  const outlet = useEntity<Outlet>('Outlets', s?.outletId ?? null);
  const order = useEntity<Order>('Orders', s?.orderId ?? null, { select: 'id,m3,units,tempClass' });
  const explain = useLateRiskExplain(s?.id);
  const warn = useMessageStore(names => nav.notify(`Sent to ${names}`));

  const o = outlet.data;
  const risk = s?.lateRiskPct ?? null;
  const planMin = s?.etaPlan ? colombo(s.etaPlan) : null;
  const modelMin = s?.etaModel ? colombo(s.etaModel).min : null;
  const closeMin = o ? toMin(o.windowClose) : null;
  const ex = explain.data?.parts.length ? explain.data : null;
  const road = explain.data?.roadClass ?? null;
  const monsoon = Boolean(explain.data?.monsoon);
  const warnText = s ? `Delivery to ${o?.name ?? s.outletId} may be late: model ETA ${s.etaModel ? `~${fmtClock(s.etaModel)}` : 'not known yet'}${o ? `, receiving closes ${o.windowClose}` : ''}${risk !== null ? ` (late risk ${risk}%)` : ''}.` : '';

  // Arrival axis: 30-minute ticks around the plan, the band and the window close.
  const early = s?.etaModelBandEarly ? colombo(s.etaModelBandEarly).min : modelMin;
  const late = s?.etaModelBandLate ? colombo(s.etaModelBandLate).min : modelMin;
  const pts = [planMin?.min, early, late, closeMin].filter((x): x is number => typeof x === 'number');
  const from = pts.length ? Math.floor(Math.min(...pts) / 30) * 30 : 0;
  const to = pts.length ? Math.max(from + 60, Math.ceil(Math.max(...pts) / 30) * 30) : 60;
  const at = (m: number) => `${(((m - from) / (to - from)) * 100).toFixed(1)}%`;
  const ticks = Array.from({ length: Math.floor((to - from) / 30) + 1 }, (_, i) => from + i * 30);
  const tone = risk === null || !levels ? 'var(--text)' : risk >= levels.highPct ? 'var(--st-exception-fg)' : risk >= levels.alertPct ? 'var(--st-deferred-fg)' : 'var(--st-delivered-fg)';
  const nowLabel = fmtClock(new Date());
  let cum = 0;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-15 Late-risk explainer · desktop">
      <div className="d-app">
        <PlanSide active="N4" />
        <div className="d-main" />
      </div>
      <div className="dx-scrim" />
      <div className="dx-drawer" style={{ width: '640px' }} data-testid="late-risk">
        <div className="dx-drawer__head">
          <span className="dx-lead dx-lead--warn" style={{ width: '44px', height: '44px' }}><Ic n="alert" /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1', minWidth: '0' }}>
            <span className="d-h1" style={{ fontSize: '24px' }}>{s ? `Why ${s.outletId} reads ${risk ?? '—'}%` : 'Late risk'}</span>
            <span className="x-meta">
              {o?.name ?? s?.outletId ?? ''}
              {t && s && <><span className="m-sep" />{`${t.vehicleId} Trip ${t.tripNumber}, stop ${s.stopSeq}`}</>}
              {order.data && <><span className="m-sep" />{`${order.data.tempClass === 'CHILLED' ? 'chilled' : 'ambient'} ${fmtNum(order.data.m3, 1)} m³`}</>}
            </span>
          </div>
          <span className="dx-close" data-lk="C"><Ic n="x" /></span>
        </div>
        <div className="dx-drawer__body">
          <ErrorBanner error={trips.error ?? outlet.error ?? explain.error ?? warn.error} onRetry={() => { void trips.refresh(); void explain.refresh(); }} />
          {!trips.data && !trips.error && <Skeleton rows={5} />}
          {trips.data && !s && <Empty title="No stops on this run" text="The late-risk figure appears once a plan is live." icon="clock" />}
          {s && (
            <>
              <div className="hstack" style={{ gap: '20px', alignItems: 'flex-end' }}>
                <div className="vstack" style={{ gap: '6px' }}>
                  <span className="dx-sech">{`Late risk at ${nowLabel}`}</span>
                  <span className="dx-display" style={{ fontSize: '56px', color: tone }}>{risk === null ? '—' : `${risk}%`}</span>
                </div>
                <div className="vstack" style={{ gap: '6px', flex: '1', paddingBottom: '6px' }}>
                  <span className="dx-t14">{ex && ex.parts[2].value !== 0 ? <>{"Planned at "}<b>{`${risk! - ex.parts[2].value}%`}</b>{"."}</> : 'Unchanged since the plan.'}{o ? ` Late means missing the ${o.windowClose} window.` : ''}</span>
                  <span className="dx-t14">{"Model ETA "}<b>{s.etaModel ? `~${fmtClock(s.etaModel)}` : '—'}</b>{` · plan ${s.etaPlan ? fmtClock(s.etaPlan) : '—'}${road ? ` (${monsoon ? 'monsoon ' : ''}${road} road)` : ''}.`}</span>
                </div>
              </div>
              <div className="vstack" style={{ gap: '2px' }}>
                <div className="dx-sech" style={{ marginBottom: '4px' }}><b>{"What moves the number"}</b><span className="spacer" />{"percentage points"}</div>
                {!ex && !explain.data && !explain.error && <Skeleton rows={3} label="Reading the lateness model…" />}
                {explain.data && !ex && <span className="dx-t13">{"No breakdown yet: the stop has no planned arrival or late-risk figure."}</span>}
                {ex?.parts.map((p, i) => {
                  const left = p.value >= 0 ? cum : cum + p.value;
                  cum += p.value;
                  return (
                    <div key={p.label} className="dx-wf">
                      <div className="dx-wf__l"><b>{p.label}</b><span>{p.detail}</span></div>
                      <div className="dx-wf__track">
                        <div className="dx-wf__bar" style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(0.8, Math.abs(p.value))}%`, background: i === 0 ? 'var(--brand-500)' : p.value === 0 ? 'var(--text-3)' : p.value < 0 ? 'var(--st-delivered-fg)' : 'var(--star-500)' }} />
                      </div>
                      <span className="dx-wf__v">{i === 0 ? `${p.value}%` : `${p.value < 0 ? '−' : '+'}${Math.abs(p.value)}`}</span>
                    </div>
                  );
                })}
              </div>
              {pts.length > 0 && (
                <div className="vstack" style={{ gap: '8px' }} data-testid="arrival-band">
                  <div className="dx-sech"><b>{`Predicted arrival at ${s.outletId}`}</b><span className="spacer" />{"model band"}</div>
                  <div style={{ position: 'relative', height: '54px' }}>
                    <div style={{ position: 'absolute', left: '0', right: '0', top: '10px', height: '14px', borderRadius: '999px', background: 'var(--surface-2)' }} />
                    {early !== null && late !== null && <div style={{ position: 'absolute', left: at(early), width: `${(((late - early) / (to - from)) * 100).toFixed(1)}%`, top: '10px', height: '14px', borderRadius: '999px', background: 'repeating-linear-gradient(135deg, #FDE0B0, #FDE0B0 6px, #FFF1D6 6px, #FFF1D6 12px)', boxShadow: 'inset 0 0 0 1.5px #F5B83D' }} />}
                    {planMin && <div style={{ position: 'absolute', left: at(planMin.min), top: '2px', width: '3px', height: '30px', borderRadius: '2px', background: 'var(--brand-900)' }} />}
                    {closeMin !== null && <div style={{ position: 'absolute', left: at(closeMin), top: '2px', width: '3px', height: '30px', borderRadius: '2px', background: 'var(--st-exception-fg)' }} />}
                    {ticks.map((m, i) => (
                      <span key={m} style={{ position: 'absolute', left: at(m), marginLeft: i ? '-14px' : '0px', top: '34px', fontSize: '12.5px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{clock(m)}</span>
                    ))}
                  </div>
                  <div className="hstack dx-t13" style={{ gap: '16px' }}>
                    {planMin && <span className="hstack" style={{ gap: '6px' }}><i style={{ display: 'block', width: '3px', height: '12px', background: 'var(--brand-900)' }} />{`Plan ${clock(planMin.min)}`}</span>}
                    {early !== null && late !== null && <span className="hstack" style={{ gap: '6px' }}><i style={{ display: 'block', width: '14px', height: '10px', borderRadius: '3px', background: '#FDE0B0', boxShadow: 'inset 0 0 0 1px #F5B83D' }} />{`Likely ${clock(early)} to ${clock(late)}`}</span>}
                    {o && <span className="hstack" style={{ gap: '6px' }}><i style={{ display: 'block', width: '3px', height: '12px', background: 'var(--st-exception-fg)' }} />{`Window closes ${o.windowClose}`}</span>}
                  </div>
                </div>
              )}
              {ex && (
                <div className="dx-inset dx-inset--off" style={{ gap: '6px', padding: '12px 16px' }}>
                  <span className="dx-t14">
                    {ex.parts[2].value > 0
                      ? <><b>{`Rising because of what the road reported since the plan (+${ex.parts[2].value}).`}</b>{" The planned part comes from the road class, the monsoon flag and the planned hour."}</>
                      : <><b>{"This is the planned figure."}</b>{` It comes from the ${road ?? ''} road class, ${monsoon ? 'the monsoon flag' : 'a dry day'} and the planned hour; it changes when the van reports a new ETA.`}</>}
                  </span>
                </div>
              )}
              <div className="vstack" style={{ gap: '8px' }}>
                <div className="dx-sech"><b>{"Suggested, you decide"}</b></div>
                <div className="hstack" style={{ gap: '10px', fontSize: '14px' }}>
                  <span className="x-why__n">{"1"}</span>
                  {`Hold ${order.data ? `${fmtNum(order.data.m3, 1)} m³` : 'the order'} on a later run as a provisional deferral. Cancel if the van confirms.`}
                </div>
                <div className="hstack" style={{ gap: '10px', fontSize: '14px' }}>
                  <span className="x-why__n">{"2"}</span>
                  {`Tell ${s.outletId} a delay is possible${o ? `; receiving is open until ${o.windowClose}` : ''}.`}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="dx-drawer__foot">
          <span className="dx-t13" data-lk="L59">{`Lateness model · advisory${runDate ? ` · run ${isoDay(runDate)}` : ''}`}</span>
          <span className="spacer" />
          <Btn className="d-btn" testId="warn-store" busy={warn.pending} disabled={!s} onClick={() => void warn.run({ outletId: s!.outletId, text: warnText, tripId: t?.id })}><Ic n="send" />{`Warn ${s?.outletId ?? 'the store'}`}</Btn>
          <span className="d-btn d-btn--primary" data-lk="L58"><Ic n="truck" />{"Hold space on a later run"}</span>
        </div>
      </div>
    </div>
  );
}
