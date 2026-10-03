'use client';
// DSP-09 Order detail drawer, live. Markup and classes from the generated design (frontend/screens/dsp-09-order-detail-drawer.tsx).
// The order is the row the dispatcher opened (cutoff queue, outlet profile: useFocusId('order')) or ?id=; a direct
// visit shows the first order of the queue. Data: Orders('…') with outlet, lines, trip stop and own deferral; the
// trip's Plan (draft or approved); the outlet's previous deferral (why it is protected) and last delivery;
// ServiceAllowances and DistrictTravel for the access card. The queue behind the drawer is a plain backdrop.
// Not shown: "Message store" (the design gives no message to send) and the deciding dispatcher's name.
import { Fragment, useState } from 'react';
import { PlanSide } from '@/components/live/chrome';
import { Ic, type IconName } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { BRAND_LETTER, fmtClock, fmtDay, fmtNum, fmtRunDate, fmtTime } from '@/lib/format';
import { useEntity, useQuery } from '@/lib/odata/hooks';
import type { Deferral, Order, Plan, Trip } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

const DOCK: Record<string, string> = { REAR_DOCK: 'Rear dock', STREET: 'Street', MALL_BAY: 'Mall bay' };
const PARKING: Record<string, string> = { NORMAL: 'normal', VAN_ONLY: 'van only', MALL_DOCK: 'mall dock' };
const code = (r: string) => r.replace('_', '-');
const weekday = (v: string | null | undefined) => fmtDay(v).split(' ')[0];
const weekdayRun = (v: string | null | undefined) => fmtRunDate(v).split(' ')[0];
const dayTime = (v: string | null | undefined) => (v ? `${weekday(v)} ${fmtTime(v)}` : '');
const planLabel = (trip: Trip | undefined, plan: Plan | null | undefined) =>
  trip ? `${plan && (plan.status === 'DRAFT' || plan.status === 'NEEDS_APPROVAL') ? 'draft' : 'plan'} v${plan?.version ?? trip.planVersion}` : '';

type OrderX = Order & { latePhone?: boolean };
type Step = { label: string; time: string; state: 'ok' | 'warn' | 'now' | 'todo'; icon?: IconName };

function steps(o: OrderX, deferral: Deferral | null | undefined, plan: Plan | null | undefined): Step[] {
  const stop = o.tripStop;
  const stage =
    o.status === 'DELIVERED' ? 4
      : o.status === 'LOADED' || o.status === 'ENROUTE' ? 3
        : o.status === 'DEFERRED' ? 1
          : stop ? 2 : 0;
  const state = (i: number, icon: IconName): Pick<Step, 'state' | 'icon'> =>
    i < stage || (i === 4 && stage === 4) ? { state: 'ok', icon: 'check' } : i === stage ? { state: 'now', icon } : { state: 'todo' };
  const out: Step[] = [{ label: 'Received', time: dayTime(o.orderedAt), state: 'ok', icon: 'check' }];
  if (deferral) out.push({ label: 'Deferred', time: `${weekdayRun(deferral.order?.runDate ?? o.runDate)} run`, state: 'warn', icon: 'history' });
  out.push({ label: 'Planned', time: dayTime(plan?.createdAt), ...state(2, 'grid') });
  out.push({ label: 'Loaded', time: weekdayRun(o.runDate), ...state(3, 'truck') });
  out.push({ label: 'Delivered', time: stop?.arrivalActual ? fmtClock(stop.arrivalActual) : o.outlet ? `by ${o.outlet.windowClose}` : '', ...state(4, 'check') });
  return out;
}

/** The order drawer: over the page it was opened from (OverlayHost), or on its own route over an empty board. */
export function OrderDrawer({ onClose }: { onClose?: () => void }) {
  const { ordersFilter } = usePlanScope();
  const [focus] = useFocusId('order');
  const [, setOutlet] = useFocusId('outlet');
  const [allLines, setAllLines] = useState(false);

  const first = useQuery<string | null>(!focus && ordersFilter ? `drawer-first:${ordersFilter}` : null, async c =>
    (await c.list<Order>('Orders', { filter: `${ordersFilter} and status ne 'CANCELLED'`, select: 'id', orderby: 'deferredYesterday desc,deferralScore desc,id', top: 1 })).value[0]?.id ?? null);
  const id = focus ?? first.data ?? null;
  const order = useEntity<OrderX>('Orders', id, { expand: 'outlet,lineItems,tripStop($expand=trip),deferralLog' }, { refreshOn: ['notification', 'eta_update'] });
  const o = order.data;
  const trip = o?.tripStop?.trip;
  const plan = useEntity<Plan>('Plans', trip?.planId ?? null, { select: 'id,status,version,createdAt' });
  const prior = useQuery<Deferral | null>(o?.deferredYesterday ? `prior-deferral:${o.id}` : null, async c =>
    (await c.list<Deferral>('Deferrals', { filter: `order/outletId eq '${o!.outletId}' and orderId ne '${o!.id}'`, expand: 'order($select=runDate)', orderby: 'createdAt desc', top: 1 })).value[0] ?? null);
  const lastDelivered = useQuery<Order | null>(o ? `last-delivered:${o.outletId}` : null, async c =>
    (await c.list<Order>('Orders', { filter: `outletId eq '${o!.outletId}' and status eq 'DELIVERED'`, select: 'id,runDate', orderby: 'runDate desc', top: 1 })).value[0] ?? null);
  const allowance = useQuery<{ minutes: number } | null>(o?.outlet ? `allowance:${o.outlet.brand}:${o.outlet.dockType}` : null, c =>
    c.get<{ minutes: number }>('ServiceAllowances', { brand: o!.outlet!.brand, dockType: o!.outlet!.dockType }).catch(() => null));
  const travel = useQuery<{ depotToDistMin: number } | null>(o?.outlet ? `travel:${o.outlet.district}` : null, c =>
    c.get<{ depotToDistMin: number }>('DistrictTravel', o!.outlet!.district).catch(() => null));

  const deferral = o?.deferralLog ? { ...o.deferralLog, order: o.deferralLog.order ?? o } : prior.data ?? null;
  const isProtected = Boolean(o && (o.deferredYesterday || (o.deferralScore ?? 0) >= 91));
  const lines = o?.lineItems ?? [];
  const shown = allLines ? lines : lines.slice(0, 4);
  const service = o?.tripStop?.serviceMinPredicted ?? allowance.data?.minutes;
  const history = o ? [
    trip && { key: 'planned', icon: 'grid' as IconName, at: plan.data?.createdAt, text: <>Planned on {trip.vehicleId} Trip {trip.tripNumber}, stop {o.tripStop!.stopSeq}, {planLabel(trip, plan.data)}</> },
    deferral && {
      key: 'deferred', icon: 'history' as IconName, tone: 'var(--st-deferred-fg)', at: deferral.confirmedAt ?? deferral.createdAt,
      text: <>Deferred from {weekdayRun(deferral.order?.runDate)} run · <span className="x-code">{code(deferral.reason)}</span></>,
    },
    { key: 'received', icon: 'store' as IconName, at: o.orderedAt, text: <>{o.latePhone ? 'Logged by phone' : 'Received from the store app'}, {lines.length} line{lines.length === 1 ? '' : 's'}</> },
  ].filter(Boolean) as Array<{ key: string; icon: IconName; tone?: string; at?: string | null; text: React.ReactNode }> : [];

  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      <div className="dx-drawer" data-testid="order-drawer">
        <div className="dx-drawer__head">
          {o && <span className={`bb bb--${o.brand.toLowerCase()} bb--lg`}>{BRAND_LETTER[o.brand]}</span>}
          <div className="vstack" style={{ gap: '3px', flex: '1', minWidth: '0' }}>
            <span className="d-h1" style={{ fontSize: '24px' }}>{o?.outlet?.name ?? o?.outletId ?? (order.loading || first.loading ? 'Loading…' : 'Order')}</span>
            {o && (
              <span className="x-meta">
                <span className="id">{o.id}</span><span className="m-sep" />
                <span className="id">{o.outletId}</span><span className="m-sep" />
                {o.outlet?.district}<span className="m-sep" />{o.latePhone ? 'Phone order' : 'Store app'}
              </span>
            )}
          </div>
          <span className="dx-close" data-lk="C"><Ic n="x" /></span>
        </div>
        <div className="dx-drawer__body">
          <ErrorBanner error={order.error ?? first.error} onRetry={() => { void order.refresh(); void first.refresh(); }} />
          {!o && !order.error && (id || first.loading ? <Skeleton rows={4} label="Loading the order…" /> : <Empty title="No order selected" text="Open an order from the cutoff queue." icon="list" />)}
          {o && (
            <>
              {isProtected && (
                <div className="dx-inset dx-inset--warn" style={{ flexDirection: 'row', alignItems: 'center', gap: '18px', padding: '18px 20px' }} data-testid="protected">
                  <div className="vstack" style={{ gap: '6px', flex: '1', minWidth: '0' }}>
                    <span className="dx-sech" style={{ color: 'var(--st-deferred-fg)' }}><Ic n="shield-check" className="ic ic--sm" />{"Consecutive-skip guard"}</span>
                    <span className="dx-display" style={{ fontSize: '36px', color: 'var(--st-deferred-fg)' }}>{"Protected"}</span>
                    <span className="dx-t14">
                      {deferral && !o.deferralLog
                        ? `Deferred on the ${fmtRunDate(deferral.order?.runDate)} run (${code(deferral.reason)}). `
                        : o.deferredYesterday ? 'Deferred on the previous run. ' : ''}
                      {"Deferring again needs a manager's reason."}
                    </span>
                  </div>
                  <div className="x-score"><b style={{ fontSize: '40px' }}>{o.deferralScore ?? '—'}</b><span>{"score · locked"}</span></div>
                </div>
              )}
              <div className="vstack" style={{ gap: '12px' }}>
                <div className="dx-sech"><b>{"Order Thread"}</b><span className="spacer" />{trip ? `Planned in ${planLabel(trip, plan.data)}` : ''}</div>
                <div className="dx-thread" data-testid="thread">
                  {steps(o, deferral, plan.data).map((s, i) => (
                    <Fragment key={s.label}>
                      {i > 0 && <div className={`dx-thread__bar${s.state !== 'todo' ? ' dx-thread__bar--ok' : ''}`} />}
                      <div className="dx-thread__s" data-step={s.label} data-state={s.state}>
                        <span className={`dx-thread__n${s.state === 'todo' ? '' : ` dx-thread__n--${s.state}`}`}>{s.state !== 'todo' && s.icon && <Ic n={s.icon} />}</span>
                        <span className={`dx-thread__l${s.state === 'todo' ? ' dx-thread__l--dim' : ''}`}>{s.label}</span>
                        <span className="dx-thread__t">{s.time}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="hstack" style={{ gap: '26px', alignItems: 'flex-start' }}>
                <div className="vstack" style={{ gap: '6px', flex: '1', minWidth: '0' }}>
                  <div className="dx-sech">
                    <b>{lines.length} line{lines.length === 1 ? '' : 's'}</b>{` · ${fmtNum(o.m3, 1)} m³ · ${fmtNum(o.kg)} kg`}<span className="spacer" />
                    {lines.length > 4 && (
                      <span className="x-link lv-click" role="button" tabIndex={0} aria-expanded={allLines}
                        onClick={e => { e.stopPropagation(); setAllLines(v => !v); }} onKeyDown={e => { if (e.key === 'Enter') setAllLines(v => !v); }}>
                        {"All"}<Ic n="chevron-down" />
                      </span>
                    )}
                  </div>
                  <div className="vstack" style={{ gap: '0', ...(allLines ? { maxHeight: '180px', overflow: 'auto' } : {}) }} data-testid="lines">
                    {shown.map(l => (
                      <div key={l.id} className="dx-kv">
                        <span className="hstack" style={{ gap: '6px' }}>
                          {l.tempClass === 'CHILLED' ? <Ic n="snow-heavy" className="ic ic--sm" style={{ color: 'var(--chilled-fg)' }} /> : <Ic n="box-2" className="ic ic--sm" />}
                          {l.name}
                        </span>
                        <b>{l.qty}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="vstack" style={{ gap: '6px', width: '228px', flexShrink: '0' }}>
                  <div className="dx-sech"><b>{"Outlet access"}</b></div>
                  <div className="vstack" style={{ gap: '0' }}>
                    <div className="dx-kv"><span>{"Unloading"}</span><b>{o.outlet ? `${DOCK[o.outlet.dockType] ?? o.outlet.dockType}, ${PARKING[o.outlet.parking] ?? o.outlet.parking}` : '—'}</b></div>
                    <div className="dx-kv"><span>{"Window"}</span><b className="mono">{o.outlet ? `${o.outlet.windowOpen}–${o.outlet.windowClose}` : '—'}</b></div>
                    <div className="dx-kv"><span>{"Service"}</span><b>{service !== undefined && service !== null ? `${service} min` : '—'}</b></div>
                    <div className="dx-kv"><span>{"From depot"}</span><b>{travel.data ? `${travel.data.depotToDistMin} min` : '—'}</b></div>
                  </div>
                </div>
              </div>
              <div className="vstack" style={{ gap: '6px' }}>
                <div className="dx-sech"><b>{"History"}</b><span className="spacer" />{lastDelivered.data ? `Last delivered ${fmtRunDate(lastDelivered.data.runDate)}` : ''}</div>
                <div className="vstack" style={{ gap: '0' }} data-testid="history">
                  {history.map(h => (
                    <div key={h.key} className="dx-kv">
                      <span className="hstack" style={{ gap: '8px' }}><Ic n={h.icon} className="ic ic--sm" style={h.tone ? { color: h.tone } : undefined} />{h.text}</span>
                      <b className="t-3" style={{ fontWeight: '600' }}>{dayTime(h.at)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="dx-drawer__foot">
          {o && <span className="d-btn d-btn--ghost" data-lk="L154" onClickCapture={() => setOutlet(o.outletId)}>{"Outlet profile"}</span>}
          <span className="spacer" />
          <span className="d-btn d-btn--primary" data-lk="L153"><Ic n="grid" />{"Open on plan board"}</span>
        </div>
      </div>
    </>
  );
}

export default function LiveDsp09OrderDetailDrawer() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-09 Order detail drawer · desktop">
      <div className="d-app">
        <PlanSide active="N1" />
        <div className="d-main" />
      </div>
      <OrderDrawer />
    </div>
  );
}
