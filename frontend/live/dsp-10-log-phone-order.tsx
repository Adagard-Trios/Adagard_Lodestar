'use client';
// DSP-10 Log phone order, live. Markup and classes from the generated design (frontend/screens/dsp-10-log-phone-order.tsx).
// A dispatcher keys in an order a store phoned through: an outlet of their depots (Outlets), the run in view on the
// cutoff queue, the caller, the temperature class and the lines. "Add to queue" sends POST /Orders with lineItems
// (the API allows a dispatcher outlets of their depots only). The caller goes into the order's notes, as a phone
// order (Orders have no channel field). After the run's 4:00 PM cutoff the API takes a dispatcher's order for the
// closed run only with a lateReason: "Flag for a line check (late order)" sends it and the API marks the order a
// late phone order. If the API moves the order to another run, the screen says so with the run it returned.
// On success the design's link (L54) goes back to the cutoff queue (DSP-01).
import { useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner } from '@/components/live/states';
import { addDays, DEPOT_NAME, fmtNum, fmtRunDate, fmtTime, isoDay } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Order, Outlet, TempClass } from '@/lib/odata/types';
import { depotFilter } from '@/lib/workday';

interface Line {
  key: number;
  name: string;
  qty: string;
  kg: string;
}

/** m³ per kg when the outlet has no earlier order to estimate from (the same default as the store's order form). */
const DEFAULT_M3_PER_KG = 0.0045;
const DOCK: Record<string, string> = { REAR_DOCK: 'rear dock', STREET: 'street', MALL_BAY: 'mall bay' };
const PARKING: Record<string, string> = { NORMAL: 'normal access', VAN_ONLY: 'van_only access', MALL_DOCK: 'mall dock access' };

/** Orders for a run close at 4:00 PM (Asia/Colombo, UTC+05:30) the day before. */
const cutoffFor = (runDate: string) => new Date(`${addDays(runDate, -1)}T16:00:00+05:30`);

const blank = (l: Line) => !l.name.trim() && !l.qty.trim() && !l.kg.trim();
const lineOk = (l: Line) => Boolean(l.name.trim()) && Number.isInteger(Number(l.qty)) && Number(l.qty) > 0 && l.kg.trim() !== '' && Number(l.kg) >= 0;

function Check({ on, label, disabled, onToggle }: { on: boolean; label: string; disabled?: boolean; onToggle: () => void }) {
  return (
    <span
      className="hstack lv-click"
      style={{ gap: '10px', ...(disabled ? { opacity: 0.5, cursor: 'default' } : {}) }}
      role="checkbox"
      aria-checked={on}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={e => { e.stopPropagation(); if (!disabled) onToggle(); }}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !disabled) { e.preventDefault(); onToggle(); } }}
    >
      <span className={`dx-check${on ? '' : ' dx-check--off'}`}>{on && <Ic n="check" />}</span>
      {label}
    </span>
  );
}

export default function LiveDsp10LogPhoneOrder() {
  const nav = useScreenNav();
  const { runDate, active, noPlans } = usePlanScope();
  const [outletId, setOutletId] = useState('');
  const [caller, setCaller] = useState('');
  const [tempClass, setTempClass] = useState<TempClass>('AMBIENT');
  const [lines, setLines] = useState<Line[]>([{ key: 1, name: '', qty: '', kg: '' }]);
  const [readBack, setReadBack] = useState(false);
  const [lineCheck, setLineCheck] = useState(false);
  const [moved, setMoved] = useState<Order | null>(null);

  const outlets = useQuery<Outlet[]>(active.length ? `phone-outlets:${active.join(',')}` : null, c =>
    c.all<Outlet>('Outlets', {
      filter: ['isActive eq true', depotFilter('depot', active)].filter(Boolean).join(' and '),
      select: 'id,name,brand,district,depot,dockType,parking,windowOpen,windowClose',
      orderby: 'id',
    }));
  const outlet = outlets.data?.find(o => o.id === outletId);
  // the outlet's own earlier orders of this temperature give the m³ per kg estimate
  const history = useQuery<Order[]>(outletId ? `phone-ratio:${outletId}:${tempClass}` : null, async c =>
    (await c.list<Order>('Orders', { filter: `outletId eq '${outletId}' and tempClass eq '${tempClass}'`, select: 'id,kg,m3', orderby: 'runDate desc', top: 12 })).value);
  const base = (history.data ?? []).filter(o => o.kg > 0 && o.m3 > 0);
  const baseKg = base.reduce((s, o) => s + o.kg, 0);
  const ratio = baseKg > 0 ? base.reduce((s, o) => s + o.m3, 0) / baseKg : DEFAULT_M3_PER_KG;

  const filled = lines.filter(l => !blank(l));
  const units = filled.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  const kg = Math.round(filled.reduce((s, l) => s + (Number(l.kg) || 0), 0) * 10) / 10;
  const m3 = Math.round(kg * ratio * 100) / 100;

  const now = new Date();
  const msLeft = runDate ? cutoffFor(runDate).getTime() - now.getTime() : 0;
  const late = Boolean(runDate) && msLeft <= 0;
  const left = msLeft < 3_600_000 ? `${Math.max(1, Math.ceil(msLeft / 60_000))} min` : `${Math.floor(msLeft / 3_600_000)} h ${Math.floor((msLeft % 3_600_000) / 60_000)} m`;

  const problem =
    !runDate ? 'There is no run in view to log the order for.'
      : !outlet ? 'Choose the outlet.'
        : !caller.trim() ? 'Say who called.'
          : !filled.length ? 'Add at least one line.'
            : filled.some(l => !lineOk(l)) ? 'Every line needs an item, a whole quantity and its weight in kg.'
              : !readBack ? 'Read the order back to the caller.'
                : late && !lineCheck ? 'The cutoff has passed: flag it for a line check to log it as a late order.'
                  : null;

  const save = useAction<void, Order>(async c => {
    if (!outlet || !runDate) throw new Error('Choose the outlet.');
    const who = caller.trim();
    return c.create<Order>('Orders', {
      outletId: outlet.id,
      runDate: `${runDate}T00:00:00.000Z`,
      brand: outlet.brand,
      tempClass,
      units,
      kg,
      m3,
      notes: `Phone order from ${who}`,
      ...(late ? { lateReason: `Late phone order from ${who}, flagged for a line check` } : {}),
      lineItems: filled.map(l => ({ name: l.name.trim(), qty: Number(l.qty), kg: Number(l.kg), tempClass })),
    });
  }, {
    onSuccess: o => {
      nav.notify(`Received: ${o.id} for ${fmtRunDate(o.runDate)}`);
      // the API moved the order to another run: say so before going back to the queue
      if (runDate && isoDay(o.runDate) !== runDate) setMoved(o);
      else nav.go('L54');
    },
  });

  const setLine = (key: number, k: 'name' | 'qty' | 'kg', v: string) => setLines(ls => ls.map(l => (l.key === key ? { ...l, [k]: v } : l)));
  const addLine = () => setLines(ls => [...ls, { key: Math.max(0, ...ls.map(l => l.key)) + 1, name: '', qty: '', kg: '' }]);

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-10 Log phone order · desktop">
      <div className="d-app">
        <PlanSide active="N1" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{late ? 'Orders closed 4:00 PM' : 'Orders close 4:00 PM'}<span className="m-sep" />{active.map(d => DEPOT_NAME[d] ?? d).join(' + ')}</div>
              <div className="d-h1">Cutoff queue for {runDate ? fmtRunDate(runDate) : '…'}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="dx-scrim" />
      <div className="dx-modal" style={{ left: '370px', top: '92px', width: '700px' }} role="dialog" aria-modal="true" aria-labelledby="phone-order-title">
        <div className="dx-modal__head">
          <span className="dx-lead"><Ic n="call" /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1' }}>
            <span className="d-h1" style={{ fontSize: '24px' }} id="phone-order-title">{"Log phone order"}</span>
            <span className="dx-t14">{"Keyed-in orders join the same queue and Order Thread."}</span>
          </div>
          {runDate && <span className="m-pill m-pill--warn" data-testid="cutoff-pill"><Ic n="clock" />{late ? 'Cutoff passed' : `Cutoff in ${left}`}</span>}
        </div>
        <div className="dx-modal__body">
          {noPlans && <Empty title="No run date yet" text="There are no plans to queue orders against." icon="calendar" />}
          <ErrorBanner error={outlets.error} onRetry={outlets.refresh} />
          <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
            <div className="dx-field" style={{ flex: '1.4' }}>
              <span className="dx-label">{"Outlet"}</span>
              <div className="dx-input">
                <Ic n="store" />
                {outlet && <span className="id">{outlet.id}</span>}
                <select className="lv-input" aria-label="Outlet" value={outletId} disabled={!outlets.data} onChange={e => setOutletId(e.target.value)}>
                  <option value="">{outlets.data ? 'Choose an outlet…' : 'Loading outlets…'}</option>
                  {(outlets.data ?? []).map(o => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
                </select>
              </div>
              {outlet && (
                <span className="dx-t13" data-testid="outlet-line">
                  {outlet.district} · {DOCK[outlet.dockType] ?? outlet.dockType} · {PARKING[outlet.parking] ?? outlet.parking} · window {outlet.windowOpen}–{outlet.windowClose}
                </span>
              )}
              {outlets.data?.length === 0 && <span className="dx-t13">{"No active outlets in your depots."}</span>}
            </div>
            <div className="dx-field" style={{ flex: '1' }}>
              <span className="dx-label">{"Run"}</span>
              <div className="dx-input"><Ic n="calendar" /><span data-testid="run-date">{runDate ? fmtRunDate(runDate) : '…'}</span></div>
              <span className="dx-t13">{"Set by the 4:00 PM cutoff"}</span>
            </div>
          </div>
          <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
            <div className="dx-field" style={{ flex: '1.4' }}>
              <span className="dx-label">{"Caller"}</span>
              <div className="dx-input"><Ic n="user" /><input className="lv-input" aria-label="Caller" value={caller} onChange={e => setCaller(e.target.value)} /></div>
            </div>
            <div className="dx-field" style={{ flex: '1' }}>
              <span className="dx-label">{"Temperature"}</span>
              <div className="dx-tabs" style={{ height: '48px', alignItems: 'center' }} role="radiogroup" aria-label="Temperature">
                {([['AMBIENT', 'Ambient'], ['CHILLED', 'Chilled']] as Array<[TempClass, string]>).map(([t, label]) => (
                  <span key={t} className={`dx-tab lv-click${tempClass === t ? ' is-on' : ''}`} style={{ flex: '1', height: '40px' }} role="radio" aria-checked={tempClass === t} tabIndex={0}
                    onClick={e => { e.stopPropagation(); setTempClass(t); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTempClass(t); } }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="vstack" style={{ gap: '8px' }}>
            <div className="dx-sech">
              <b>{"Lines"}</b>
              <span className="spacer" />
              <Btn className="x-link" onClick={addLine}><Ic n="plus" />{"Add line"}</Btn>
            </div>
            <div className="dx-card" style={{ boxShadow: 'inset 0 0 0 1px var(--hair)' }} data-testid="lines">
              <div className="dx-tr dx-tr--head" style={{ minHeight: '34px', padding: '0 16px' }}>
                <span className="dx-td" style={{ flex: '1' }}>{"Item"}</span>
                <span className="dx-td" style={{ width: '110px' }}>{"Quantity"}</span>
                <span className="dx-td x-num" style={{ width: '70px' }}>{"Weight"}</span>
              </div>
              {lines.map((l, i) => (
                <div key={l.key} className="dx-tr" style={{ minHeight: '40px', padding: '0 16px' }}>
                  <span className="dx-td" style={{ flex: '1' }}><input className="lv-input" aria-label={`Item ${i + 1}`} value={l.name} onChange={e => setLine(l.key, 'name', e.target.value)} /></span>
                  <span className="dx-td" style={{ width: '110px' }}><input className="lv-input" aria-label={`Quantity ${i + 1}`} inputMode="numeric" value={l.qty} onChange={e => setLine(l.key, 'qty', e.target.value)} /></span>
                  <span className="dx-td x-num" style={{ width: '70px' }}><input className="lv-input" style={{ textAlign: 'right' }} aria-label={`Weight in kg ${i + 1}`} inputMode="decimal" value={l.kg} onChange={e => setLine(l.key, 'kg', e.target.value)} /></span>
                </div>
              ))}
              <div className="dx-tr" style={{ minHeight: '42px', padding: '0 16px', background: '#FAFBFD' }} data-testid="lines-total">
                <b className="dx-td" style={{ flex: '1' }}>{filled.length} line{filled.length === 1 ? '' : 's'} · {units} units</b>
                <span className="dx-td t-2" style={{ width: '110px' }}>{fmtNum(m3, 1)} m³</span>
                <b className="dx-td x-num" style={{ width: '70px' }}>{fmtNum(kg)} kg</b>
              </div>
            </div>
          </div>
          <div className="hstack" style={{ gap: '26px', fontSize: '14px' }}>
            <Check on={readBack} label="Read back to the caller" onToggle={() => setReadBack(v => !v)} />
            <Check on={late && lineCheck} disabled={!late} label="Flag for a line check (late order)" onToggle={() => setLineCheck(v => !v)} />
          </div>
          <ErrorBanner error={save.error} />
          {moved && (
            <div className="lv-banner lv-banner--warn" role="status" data-testid="order-moved">
              <Ic n="clock" />
              <div className="lv-banner__txt">
                <b>Received: {moved.id} for {fmtRunDate(moved.runDate)}</b>
                <span>{moved.notes}</span>
              </div>
              <Btn className="d-btn d-btn--ghost lv-btn" onClick={() => nav.go('L54')}>{"Back to the queue"}</Btn>
            </div>
          )}
        </div>
        <div className="dx-modal__foot">
          <span className="dx-t13" data-testid="phone-order-hint">
            {problem ?? <>Saves as the next order number · Phone · you, {fmtTime(now)}</>}
          </span>
          <span className="spacer" />
          <Btn className="d-btn d-btn--ghost" onClick={() => nav.go('L54')}>{"Cancel"}</Btn>
          <Btn className="d-btn d-btn--primary" testId="add-to-queue" busy={save.pending} disabled={Boolean(problem) || Boolean(moved)} onClick={() => void save.run()}>
            <Ic n="plus" />{"Add to queue"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
