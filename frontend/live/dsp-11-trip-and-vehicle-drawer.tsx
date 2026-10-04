'use client';
// DSP-11 Trip and vehicle drawer, live. Markup and classes from the generated design (frontend/screens/dsp-11-trip-and-vehicle-drawer.tsx).
// The trip is the one the dispatcher opened (useFocusId('trip')) or ?id=; otherwise the run date's first departing
// trip, which is what the plan board's "Trip 1 · departs …" header opens. Data: Trips('…') with vehicle, plan and
// stops (outlet, order sizes), the vehicle's other trips that day (tabs and the minutes budget) and
// DistrictTravel for the drive times. The plan board behind the drawer is a plain backdrop. A delivered stop shows its
// proof-of-delivery photo (PodPhoto, the thumbnail DSP-A2 and SM-02 use) once the driver's photo has reached the server.
// Footer as designed: "Lock this trip" returns to the plan board (DSP-02), where the trip is edited and approved;
// "Move a stop" and "Swap vehicle" open Ask the planning agent (DSP-39): moves and vehicle swaps are draft edits
// (AgentRuns('…')/Lodestar.Resume {decision: 'edit'}) that the dispatcher then approves. Not shown: the "Vehicle"
// tab (the design gives it no content).
import { useRouter } from 'next/navigation';
import Btn from '@/components/live/Btn';
import PodPhoto from '@/components/live/PodPhoto';
import { budget } from '@/components/live/board';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { useAgentConfig } from '@/components/live/settings-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { BRAND_LETTER, dayFilter, fmtClock, fmtNum, isoDay, pct, title } from '@/lib/format';
import { useEntity, useQuery } from '@/lib/odata/hooks';
import type { Plan, Trip } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';
import { loadTone, usePlanningRules } from '@/components/live/planning-rules';

/** Where a stop move or a vehicle swap is asked for and applied to the draft. */
export const ASK_AGENT = '/plan/dsp-39-ask-the-planning-agent';
const DOCK: Record<string, string> = { REAR_DOCK: 'rear dock', STREET: 'street', MALL_BAY: 'mall bay' };
/** Gauge class by the planning service's load level (PlanningRules.load.warnPct). */
const gauge = (used: number, cap: number, warnPct: number | undefined) => `dx-g-${loadTone(used, cap, warnPct)}`;

type TripX = Trip & { plan?: Pick<Plan, 'status' | 'version'> | null };

function Meter({ label, used, cap, unit, digits = 0 }: { label: string; used: number; cap: number; unit: string; digits?: number }) {
  const warnPct = usePlanningRules().data?.load.warnPct;
  return (
    <div className="vstack" style={{ gap: '5px', flex: '1', minWidth: '0' }}>
      <span className="t-3" style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>{label}</span>
      <b style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>{fmtNum(used, digits)} / {fmtNum(cap, digits)} {unit}</b>
      <div className="dx-bar"><div className={gauge(used, cap, warnPct)} style={{ width: `${pct(used, cap)}%` }} /></div>
    </div>
  );
}

/** The trip drawer: over the page it was opened from (OverlayHost), or on its own route over an empty board. */
export function TripDrawer({ onClose }: { onClose?: () => void }) {
  const { name: depotName, short: depotShort } = useDepots();
  const router = useRouter();
  const { tripsFilter, loadingDate } = usePlanScope();
  const [focus, setFocus] = useFocusId('trip');

  const first = useQuery<string | null>(!focus && tripsFilter ? `drawer-first-trip:${tripsFilter}` : null, async c =>
    (await c.list<Trip>('Trips', { filter: tripsFilter, select: 'id', orderby: 'departTime,vehicleId,tripNumber', top: 1 })).value[0]?.id ?? null);
  const id = focus ?? first.data ?? null;
  const trip = useEntity<TripX>('Trips', id, { expand: 'vehicle,plan($select=status,version),stops($expand=outlet,order($select=id,kg,m3),pod($select=id,photoUrl,photoCount))' }, { refreshOn: ['eta_update', 'notification'] });
  const t = trip.data;
  const day = t ? isoDay(t.runDate) : null;
  const siblings = useQuery<Trip[]>(t && day ? `vehicle-day:${t.vehicleId}:${day}` : null, async c =>
    (await c.list<Trip>('Trips', { filter: `vehicleId eq '${t!.vehicleId}' and ${dayFilter('runDate', day!)}`, select: 'id,tripNumber,brand,district,planMinutes', expand: 'stops($select=id,outletId)', orderby: 'tripNumber' })).value);
  const travel = useQuery<{ depotToDistMin: number; interStopMin: number } | null>(t ? `travel:${t.district}` : null, c =>
    c.get<{ depotToDistMin: number; interStopMin: number }>('DistrictTravel', t!.district).catch(() => null));

  const v = t?.vehicle;
  const reefer = v?.tempClass === 'CHILLED';
  const stops = [...(t?.stops ?? [])].sort((a, b) => a.stopSeq - b.stopSeq);
  const kg = stops.reduce((s, x) => s + (x.order?.kg ?? 0), 0);
  const m3 = stops.reduce((s, x) => s + (x.order?.m3 ?? 0), 0);
  const day3 = siblings.data ?? (t ? [t] : []);
  const config = useAgentConfig();
  const max = budget(t?.brand ?? 'FRESH', config.data?.limits);
  const minutes = day3.reduce((s, x) => s + (x.planMinutes ?? 0), 0);
  const next = day3.find(x => x.tripNumber > (t?.tripNumber ?? 0));
  const tr = travel.data;
  const service = stops.every(s => s.serviceMinPredicted !== null && s.serviceMinPredicted !== undefined) ? stops.reduce((s, x) => s + (x.serviceMinPredicted ?? 0), 0) : null;
  const last = stops[stops.length - 1];
  const lastDone = last?.etaPlan && last.serviceMinPredicted ? new Date(new Date(last.etaPlan).getTime() + last.serviceMinPredicted * 60_000) : null;
  const plan = t?.plan;
  const planText = t ? `${plan && (plan.status === 'DRAFT' || plan.status === 'NEEDS_APPROVAL') ? 'draft' : 'plan'} v${plan?.version ?? t.planVersion}` : '';

  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      <div className="dx-drawer" style={{ width: '600px' }} data-testid="trip-drawer">
        <div className="dx-drawer__head">
          <span className={`dx-lead${reefer ? ' dx-lead--cold' : ''}`} style={{ width: '44px', height: '44px' }}><Ic n={v?.type === 'VAN' ? 'van' : 'truck'} /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1', minWidth: '0' }}>
            <span className="d-h1" style={{ fontSize: '24px' }}>{t ? `${t.vehicleId} · Trip ${t.tripNumber}` : trip.loading || first.loading || (!focus && loadingDate) ? 'Loading…' : 'Trip'}</span>
            {t && (
              <span className="x-meta">
                {reefer ? 'Reefer' : 'Dry'} {v?.type === 'VAN' ? 'van' : 'truck'}<span className="m-sep" />
                {title(t.brand)} · {t.district}<span className="m-sep" />
                {depotName(t.depot)}<span className="m-sep" />{planText}
              </span>
            )}
          </div>
          <span className="dx-close" data-lk="C"><Ic n="x" /></span>
        </div>
        <div className="dx-drawer__body lo-fit">
          <ErrorBanner error={trip.error ?? first.error} onRetry={() => { void trip.refresh(); void first.refresh(); }} />
          {/* the run date still loading is not "no trip" */}
          {!t && !trip.error && (id || first.loading || (!focus && loadingDate) ? <Skeleton rows={4} label="Loading the trip…" /> : <Empty title="No trip selected" text="There are no trips on the board for this run date." icon="truck" />)}
          {t && (
            <>
              {day3.length > 1 && (
                <div className="dx-tabs" style={{ alignSelf: 'flex-start' }}>
                  {day3.map(x => (
                    <span key={x.id} className={`dx-tab${x.id === t.id ? ' is-on' : ' lv-click'}`} role="tab" tabIndex={0} aria-selected={x.id === t.id}
                      onClick={e => { e.stopPropagation(); setFocus(x.id); }} onKeyDown={e => { if (e.key === 'Enter') setFocus(x.id); }}>
                      Trip {x.tripNumber} · {x.district}
                    </span>
                  ))}
                </div>
              )}
              <div className="hstack" style={{ gap: '20px', alignItems: 'flex-end' }}>
                <div className="vstack" style={{ gap: '6px' }}>
                  <span className="dx-sech">{title(t.brand)} minutes{day3.length === 2 ? ', both trips' : day3.length > 2 ? `, all ${day3.length} trips` : ''}</span>
                  <span className="dx-display" data-testid="minutes">{minutes}<small>/ {max ?? '—'} min</small></span>
                </div>
                <div className="vstack" style={{ gap: '8px', flex: '1', minWidth: '0', paddingBottom: '6px' }}>
                  <div className="dx-bar" style={{ height: '10px' }}>
                    {day3.map((x, i) => <div key={x.id} className={i === 0 ? 'dx-g-brand' : undefined} style={{ width: `${pct(x.planMinutes, Math.max(max ?? 0, minutes))}%`, ...(i ? { background: '#8C98F2' } : {}) }} />)}
                  </div>
                  <div className="between dx-t13">
                    <span>
                      {day3.map((x, i) => (
                        <span key={x.id}>{i ? ' · ' : ''}{x.id === t.id ? <b className="t-2">Trip {x.tripNumber} {x.planMinutes ?? 0}</b> : `Trip ${x.tripNumber} ${x.planMinutes ?? 0}`}</span>
                      ))}
                    </span>
                    <span>{max === undefined ? '' : minutes <= max ? `${max - minutes} min spare` : `${minutes - max} min over`}</span>
                  </div>
                </div>
              </div>
              <div className="hstack" style={{ gap: '18px' }}>
                <Meter label={`Weight, Trip ${t.tripNumber}`} used={kg} cap={v?.capacityKg ?? 0} unit="kg" />
                <Meter label={`Volume, Trip ${t.tripNumber}`} used={m3} cap={v?.capacityM3 ?? 0} unit="m³" digits={1} />
                <Meter label="Fuel this week" used={v?.usedLThisWeek ?? 0} cap={v?.weeklyLFuel ?? 0} unit="L" />
              </div>
              <div className="dx-hair" />
              <div className="dx-sech">
                <b>{stops.length} stop{stops.length === 1 ? '' : 's'} in sequence</b>
                <span className="spacer" />
                {tr && service !== null && stops.length > 0 && `${tr.depotToDistMin} drive + ${stops.length - 1} × ${tr.interStopMin} between + ${service} service = ${tr.depotToDistMin + (stops.length - 1) * tr.interStopMin + service} min`}
              </div>
              <div className="vstack" style={{ gap: '0' }} data-testid="stops">
                <div className="dx-stop">
                  <div className="dx-stop__rail"><span className="dx-stop__n dx-stop__n--dark"><Ic n="depot" /></span><span className="dx-stop__line" /></div>
                  <div className="dx-stop__main">
                    <div className="dx-stop__t">{depotName(t.depot)}{t.bay ? ` · bay ${t.bay}` : ''}<span className="dx-stop__tm">{t.departTime ? fmtClock(t.departTime) : ''}</span></div>
                    <div className="dx-stop__m">Depart{tr ? ` · ${tr.depotToDistMin} min to ${t.district}` : ''}</div>
                  </div>
                </div>
                {stops.map((s, i) => (
                  <div key={s.id} className="dx-stop" data-stop={s.id}>
                    <div className="dx-stop__rail"><span className="dx-stop__n">{s.stopSeq}</span><span className="dx-stop__line" /></div>
                    <div className="dx-stop__main">
                      <div className="dx-stop__t">
                        <span className={`bb bb--${(s.outlet?.brand ?? t.brand).toLowerCase()} dx-bb`}>{BRAND_LETTER[s.outlet?.brand ?? t.brand]}</span>
                        <span className="id">{s.outletId}</span>
                        <span className="t-2" style={{ fontWeight: '600' }}>{DOCK[s.outlet?.dockType ?? ''] ?? ''}</span>
                        <span className="dx-stop__tm">{s.etaPlan ? fmtClock(s.etaPlan) : ''}</span>
                      </div>
                      <div className="dx-stop__m">
                        {s.outlet && <span className="mono">window {s.outlet.windowOpen}–{s.outlet.windowClose}</span>}
                        {s.serviceMinPredicted !== null && s.serviceMinPredicted !== undefined && <><span className="m-sep" />service {s.serviceMinPredicted} min</>}
                        {s.order && <><span className="m-sep" />{fmtNum(s.order.m3, 1)} m³ · {fmtNum(s.order.kg)} kg</>}
                        <span className="spacer" />
                        <span className="t-3">{tr && i < stops.length - 1 ? `${tr.interStopMin} min drive` : ''}</span>
                      </div>
                    </div>
                    {s.pod?.photoUrl && <PodPhoto pod={s.pod} label={`the drop at ${s.outletId}`} width={48} height={34} />}
                  </div>
                ))}
                <div className="dx-stop">
                  <div className="dx-stop__rail"><span className="dx-stop__n dx-stop__n--dark"><Ic n="refresh" /></span></div>
                  <div className="dx-stop__main" style={{ paddingBottom: '0' }}>
                    <div className="dx-stop__t">
                      Back at {depotShort(t.depot)}{next ? `, reload for Trip ${next.tripNumber}` : ''}
                      <span className="dx-stop__tm">{t.returnTime ? `~${fmtClock(t.returnTime)}` : ''}</span>
                    </div>
                    <div className="dx-stop__m">
                      {[
                        lastDone ? `Last stop done ${fmtClock(lastDone)}` : null,
                        next ? `Trip ${next.tripNumber} ${title(next.brand)} · ${next.district}, ${new Set((next.stops ?? []).map(x => x.outletId)).size} stops, ${next.planMinutes ?? 0} min` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                {stops.length > 0 && (
                  <div className="lo-row" data-name="Load order (derived)">
                    <Ic n="lock" style={{ width: '16px', height: '16px', flexShrink: '0', color: 'var(--text-3)' }} />
                    <span className="lo-k">Load order{t.bay ? ` at bay ${t.bay}` : ''}</span>
                    <span className="lo-v" data-testid="load-order">
                      {[...stops].reverse().map((s, i) => <span key={s.id}>{i ? ' → ' : ''}<span className="id">{s.outletId}</span></span>)}
                    </span>
                    <span className="lo-n">{"from your stop order"}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="dx-drawer__foot">
          <Btn className="d-btn" testId="move-stop" disabled={!t} onClick={() => router.push(ASK_AGENT)}><Ic n="split" />{"Move a stop"}</Btn>
          <Btn className="d-btn d-btn--ghost" testId="swap-vehicle" disabled={!t} onClick={() => router.push(ASK_AGENT)}>{"Swap vehicle"}</Btn>
          <span className="spacer" />
          <span className="d-btn d-btn--primary" data-lk="L157"><Ic n="lock" />{"Lock this trip"}</span>
        </div>
      </div>
    </>
  );
}

export default function LiveDsp11TripAndVehicleDrawer() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-11 Trip and vehicle drawer · desktop">
      <div className="d-app">
        <PlanSide active="N2" />
        <div className="d-main" />
      </div>
      <TripDrawer />
    </div>
  );
}
