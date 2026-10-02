'use client';
// SM-01 Place order, live. Markup and classes from the generated design (frontend/screens/sm-01-place-order.tsx).
// Starts from the outlet's last dry and chilled orders (Orders + OrderLineItems), the store adjusts quantities or
// adds items, and "Submit" sends POST /Orders with lineItems — one order per temperature class, for the outlet
// in the user's token (the API refuses any other outlet). The Calendar row of the run date feeds the festival card.
// After a run's 4:00 PM cutoff the API still takes the order and moves it to the next open operating run; the
// screen then shows the run date and note the API returned instead of moving on.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { StoreTop, useMyOutlet } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { addDays, fmtNum, fmtRunDate, isoDay } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Order, OrderLineItem, TempClass } from '@/lib/odata/types';

interface Line {
  key: string;
  name: string;
  last: number;
  qty: number;
  /** kg per unit */
  unitKg: number;
}

const DEFAULT_M3_PER_KG = 0.0045;
const tomorrow = () => addDays(new Date().toISOString().slice(0, 10), 1);
/** The first run whose 4:00 PM cutoff (the day before) has not passed yet. */
const nextOpenRun = () => {
  const t = tomorrow();
  return new Date() < cutoffFor(t) ? t : addDays(t, 1);
};

function toLines(order: Order | undefined): Line[] {
  return (order?.lineItems ?? []).map((li: OrderLineItem) => ({
    key: li.id,
    name: li.name,
    last: li.qty,
    qty: li.qty,
    unitKg: li.qty ? li.kg / li.qty : li.kg,
  }));
}

function cutoffFor(runDate: string): Date {
  // Orders close at 4:00 PM (Sri Lanka time, UTC+05:30) the day before the run.
  return new Date(`${addDays(runDate, -1)}T16:00:00+05:30`);
}

function LineTable({ title, cls, lines, setLines, note, tempClass }: {
  title: string; cls: string; lines: Line[]; setLines: (l: Line[]) => void; note: string; tempClass: TempClass;
}) {
  const [name, setName] = useState('');
  const [kg, setKg] = useState('');
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const weight = lines.reduce((s, l) => s + l.qty * l.unitKg, 0);
  const bump = (k: string, d: number) => setLines(lines.map(l => (l.key === k ? { ...l, qty: Math.max(0, l.qty + d) } : l)));
  const add = () => {
    const unitKg = Number(kg);
    if (!name.trim() || !(unitKg > 0)) return;
    setLines([...lines, { key: `new-${Date.now()}`, name: name.trim(), last: 0, qty: 1, unitKg }]);
    setName('');
    setKg('');
  };
  return (
    <div className="d-card" style={{ flex: '1' }} data-testid={`lines-${tempClass.toLowerCase()}`}>
      <div className="d-card__head">
        <span className="d-card__title">{title}</span>
        <span className={`m-tag ${cls}`}>{tempClass === 'CHILLED' ? <Ic n="snow" /> : <span className="dot" />}{tempClass === 'CHILLED' ? 'Chilled' : 'Ambient'}</span>
        <div className="spacer" />
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{note}</span>
      </div>
      <div className="ot-row ot-row--head">
        <span className="ot-item">{"Item"}</span>
        <span className="ot-last">{"Last order"}</span>
        <span className="ot-sug">{"kg / unit"}</span>
        <span className="ot-qty">{"Qty"}</span>
        <span className="ot-kg">{"kg"}</span>
      </div>
      {lines.length === 0 && <Empty title="No lines yet" text="Add the items for this order below." icon="plus" />}
      {lines.map(l => (
        <div key={l.key} className="ot-row" data-line={l.name}>
          <span className="ot-item"><b>{l.name}</b><span>{l.last ? `last ${l.last}` : 'new'}</span></span>
          <span className="ot-last">{l.last || '—'}</span>
          <span className="ot-sug">{fmtNum(l.unitKg, 1)}</span>
          <span className="ot-qty">
            <span className="qty">
              <Btn className="qty__b" title={`Less ${l.name}`} onClick={() => bump(l.key, -1)}><Ic n="minus" /></Btn>
              <span className="qty__v" aria-label={`${l.name} quantity`}>{l.qty}</span>
              <Btn className="qty__b" title={`More ${l.name}`} onClick={() => bump(l.key, 1)}><Ic n="plus" /></Btn>
            </span>
          </span>
          <span className="ot-kg">{fmtNum(l.qty * l.unitKg, 1)}</span>
        </div>
      ))}
      <div className="ot-row ot-row--add">
        <Ic n="plus" className="ic ic--sm" />
        <input className="lv-input" style={{ flex: '2' }} aria-label={`New ${title.toLowerCase()} item`} placeholder="Add item" value={name} onChange={e => setName(e.target.value)} />
        <input className="lv-input" style={{ flex: '1' }} aria-label="kg per unit" placeholder="kg / unit" inputMode="decimal" value={kg} onChange={e => setKg(e.target.value)} />
        <Btn className="x-link" onClick={add} disabled={!name.trim() || !(Number(kg) > 0)}>{"Add"}</Btn>
      </div>
      <div className="ot-row ot-row--total">
        <span className="ot-item"><b>{"Total"}</b><span>{tempClass === 'CHILLED' ? 'kept separate so it can travel in a reefer' : 'every operating day'}</span></span>
        <span className="ot-qty">{units}</span>
        <span className="ot-kg">{fmtNum(weight, 1)}</span>
      </div>
    </div>
  );
}

export default function LiveSm01PlaceOrder() {
  const router = useRouter();
  const nav = useScreenNav();
  const { session } = useAuth();
  const outlet = useMyOutlet();
  const outletId = session?.outletId;
  const [runDate, setRunDate] = useState(nextOpenRun);
  const [moved, setMoved] = useState<Order[] | null>(null);

  const history = useQuery<Order[]>(outletId ? `order-base:${outletId}` : null, async c =>
    (await c.list<Order>('Orders', { filter: `outletId eq '${outletId}' and status ne 'CANCELLED'`, expand: 'lineItems', orderby: 'runDate desc', top: 12 })).value);
  const lastDry = history.data?.find(o => o.tempClass === 'AMBIENT');
  const lastChilled = history.data?.find(o => o.tempClass === 'CHILLED');
  const [dry, setDry] = useState<Line[] | null>(null);
  const [chilled, setChilled] = useState<Line[] | null>(null);
  const dryLines = dry ?? toLines(lastDry);
  const chilledLines = chilled ?? toLines(lastChilled);
  const calendar = useQuery<{ festivalName?: string | null; festivalRamp?: number; isOperating?: boolean } | null>(`calendar:${runDate}`, async c =>
    (await c.list<{ festivalName?: string; festivalRamp?: number; isOperating?: boolean }>('Calendar', { filter: `date eq ${runDate}T00:00:00Z`, top: 1 })).value[0] ?? null);

  const ratio = useMemo(() => {
    const base = (history.data ?? []).filter(o => o.kg > 0);
    const kg = base.reduce((s, o) => s + o.kg, 0);
    const m3 = base.reduce((s, o) => s + o.m3, 0);
    return kg > 0 && m3 > 0 ? m3 / kg : DEFAULT_M3_PER_KG;
  }, [history.data]);

  const sum = (lines: Line[]) => ({
    units: lines.reduce((s, l) => s + l.qty, 0),
    kg: Math.round(lines.reduce((s, l) => s + l.qty * l.unitKg, 0) * 10) / 10,
  });
  const d = sum(dryLines);
  const ch = sum(chilledLines);
  const orders = [d.units ? 1 : 0, ch.units ? 1 : 0].reduce((a, b) => a + b, 0);
  const cutoff = cutoffFor(runDate);
  const msLeft = cutoff.getTime() - new Date().getTime();
  const late = msLeft <= 0;

  const submit = useAction<void, Order[]>(async c => {
    const o = outlet.data;
    if (!o || !outletId) throw new Error('Your outlet could not be loaded.');
    const created: Order[] = [];
    for (const [tempClass, lines] of [['AMBIENT', dryLines], ['CHILLED', chilledLines]] as Array<[TempClass, Line[]]>) {
      const items = lines.filter(l => l.qty > 0);
      if (!items.length) continue;
      const kg = Math.round(items.reduce((s, l) => s + l.qty * l.unitKg, 0) * 10) / 10;
      created.push(await c.create<Order>('Orders', {
        outletId,
        runDate: `${runDate}T00:00:00.000Z`,
        brand: o.brand,
        tempClass,
        units: items.reduce((s, l) => s + l.qty, 0),
        kg,
        m3: Math.round(kg * ratio * 100) / 100,
        lineItems: items.map(l => ({ name: l.name, qty: l.qty, kg: Math.round(l.qty * l.unitKg * 10) / 10, tempClass })),
      }));
    }
    if (!created.length) throw new Error('Add at least one item with a quantity.');
    return created;
  }, {
    onSuccess: created => {
      nav.notify(`Received: ${created.map(o => o.id).join(', ')}`);
      // the API moved an order placed after the cutoff to a later run: say so before moving on
      if (created.some(o => isoDay(o.runDate) !== runDate)) setMoved(created);
      else router.push('/store/sm-27-orders-and-history');
    },
  });

  const o = outlet.data;
  const h = Math.max(0, Math.floor(msLeft / 3_600_000));
  const m = Math.max(0, Math.floor((msLeft % 3_600_000) / 60_000));

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-01 Place order · desktop">
      <div className="s-shell">
        <StoreTop active="order" />
        <div className="d-main" style={{ paddingBottom: '20px' }}>
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"New order "}<span className="m-sep" />{lastDry || lastChilled ? ' started from your last order' : ' first order'}</div>
              <div className="d-h1">Order for {fmtRunDate(runDate)}</div>
              <div className="d-sub">
                {o ? `Delivered in your window ${o.windowOpen}–${o.windowClose} · ${o.dockType.toLowerCase().replace('_', ' ')}, ${o.parking.toLowerCase().replace('_', ' ')} access · ` : ''}
                {"delivery date "}
                <input className="lv-input" type="date" aria-label="Delivery date" value={runDate} min={tomorrow()} onChange={e => setRunDate(e.target.value || nextOpenRun())}
                  style={{ width: 'auto', display: 'inline-block', font: 'inherit', color: 'var(--brand-600)', fontWeight: 700 }} />
              </div>
            </div>
            <div className="vstack" style={{ gap: '2px', alignItems: 'flex-end', marginRight: '4px' }}>
              <span className="fw7" style={{ fontSize: '14px', color: 'var(--text)' }} data-testid="order-summary">
                {orders} order{orders === 1 ? '' : 's'} · {d.units + ch.units} units · {fmtNum(d.kg + ch.kg)} kg · {fmtNum((d.kg + ch.kg) * ratio, 1)} m³
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{"\"Received\" with order numbers at once"}</span>
            </div>
            <Btn className="d-btn d-btn--primary" style={{ padding: '0 20px' }} testId="submit-order" busy={submit.pending} disabled={!orders || !o || Boolean(moved)} onClick={() => void submit.run()}>
              <Ic n="send" />Submit {orders} order{orders === 1 ? '' : 's'}
            </Btn>
          </div>
          <ErrorBanner error={submit.error ?? history.error ?? outlet.error} onRetry={history.error ? history.refresh : undefined} />
          {moved && (
            <div className="lv-banner lv-banner--warn" role="status" data-testid="order-moved">
              <Ic n="clock" />
              <div className="lv-banner__txt">
                <b>Received: {moved.map(x => `${x.id} for ${fmtRunDate(x.runDate)}`).join(', ')}</b>
                <span>{moved.find(x => x.notes)?.notes}</span>
              </div>
              <Btn className="d-btn d-btn--ghost lv-btn" onClick={() => router.push('/store/sm-27-orders-and-history')}>{"See your orders"}</Btn>
            </div>
          )}
          <div className="d-kpis">
            <div className="d-kpi d-kpi--hero" style={{ flex: '1.75', gap: '8px' }}>
              <div className="between"><span className="d-kpi__l"><Ic n="clock" className="ic ic--sm" />{"Orders close at 4:00 PM"}</span><span className="d-kpi__l">for the {fmtRunDate(runDate)} run</span></div>
              <span className="d-kpi__v cd__v">{late ? 'Closed' : `${h} h ${m} m`}<small>{late ? '' : 'left'}</small></span>
              <div className="m-progress cd__bar"><div style={{ width: `${late ? 100 : Math.max(0, Math.min(100, 100 - (msLeft / 86_400_000) * 100))}%` }} /></div>
              <span className="d-kpi__s">{late ? <>This run is closed. Submit now and the order goes to the next open run, <b style={{ color: '#FFFFFF' }}>{fmtRunDate(nextOpenRun())}</b> or the next operating day after it.</> : <>After 4:00 PM this order goes to the <b style={{ color: '#FFFFFF' }}>{fmtRunDate(addDays(runDate, 1))} run</b></>}</span>
            </div>
            <div className="d-kpi">
              <span className="d-kpi__l"><span className="m-tag"><span className="dot" />{"Dry order"}</span><span className="m-sep" />{dryLines.length} lines</span>
              <span className="d-kpi__v">{d.units}<small>{"units"}</small></span>
              <span className="d-kpi__s">{fmtNum(d.kg)} kg · {fmtNum(d.kg * ratio, 1)} m³</span>
            </div>
            <div className="d-kpi">
              <span className="d-kpi__l"><span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled order"}</span><span className="m-sep" />{chilledLines.length} lines</span>
              <span className="d-kpi__v">{ch.units}<small>{"units"}</small></span>
              <span className="d-kpi__s">{fmtNum(ch.kg)} kg · {fmtNum(ch.kg * ratio, 1)} m³ · travels in a reefer</span>
            </div>
            {calendar.data?.festivalName ? (
              <div className="d-kpi d-kpi--fest">
                <span className="d-kpi__l"><Ic n="sparkle" className="ic ic--sm" />{calendar.data.festivalName}</span>
                <span className="d-kpi__v">{calendar.data.festivalRamp ? `+${Math.round(calendar.data.festivalRamp * 100)}%` : '—'}</span>
                <span className="d-kpi__s">{"Festival ramp on the operating calendar."}</span>
              </div>
            ) : calendar.data && calendar.data.isOperating === false ? (
              <div className="d-kpi d-kpi--fest"><span className="d-kpi__l">{"Calendar"}</span><span className="d-kpi__v">{"Closed"}</span><span className="d-kpi__s">{"No run on this date. Pick another day."}</span></div>
            ) : null}
          </div>
          {!history.data && !history.error ? <Skeleton rows={4} /> : (
            <div className="hstack" style={{ gap: '16px', alignItems: 'stretch', flex: '1', minHeight: '0' }}>
              <LineTable title="Dry order" cls="" lines={dryLines} setLines={setDry} note="every operating day" tempClass="AMBIENT" />
              <LineTable title="Chilled order" cls="m-tag--cold" lines={chilledLines} setLines={setChilled} note="needs a reefer" tempClass="CHILLED" />
            </div>
          )}
          {lastDry && <span className="t-3" style={{ fontSize: '12.5px' }}>Started from {lastDry.id}{lastChilled ? ` and ${lastChilled.id}` : ''} ({fmtRunDate(isoDay(lastDry.runDate))}).</span>}
        </div>
      </div>
    </div>
  );
}
