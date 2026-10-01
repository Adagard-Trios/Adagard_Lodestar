'use client';
// SM-27 Orders & history, live. Markup and classes from the generated design (frontend/screens/sm-27-orders-and-history.tsx).
// Data: the outlet's Orders (paged, filters, $search) with their TripStop, the outlet's PODs (receipts, credit
// notes), and the selected order with its OrderLineItems. Store managers only ever see their own outlet: the API
// filters by the outlet_id claim. An order that planning has not picked up yet can be cancelled
// (Orders('…')/Lodestar.Cancel).
import { useMemo, useState } from 'react';
import Btn from '@/components/live/Btn';
import { StoreTop } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { addDays, daysAgo, fmtClock, fmtDay, fmtRunDate, isoDay, title } from '@/lib/format';
import { useAction, useEntity, useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { Order, POD } from '@/lib/odata/types';

type Filter = 'all' | 'upcoming' | 'delivered' | 'credited';
const FILTER: Record<Filter, string | undefined> = {
  all: undefined,
  upcoming: "status in ('RECEIVED','PLANNED','LOADED','ENROUTE')",
  delivered: "status eq 'DELIVERED'",
  credited: 'tripStop/pod/creditNoteId ne null',
};
const PILL: Record<string, [string, string]> = {
  RECEIVED: ['m-pill--brand', 'Received'], PLANNED: ['m-pill--brand', 'Planned'], LOADED: ['m-pill--loaded', 'Loaded'],
  ENROUTE: ['m-pill--info', 'On the way'], DELIVERED: ['m-pill--ok', 'Delivered'], DEFERRED: ['m-pill--warn', 'Deferred'],
  EXCEPTION: ['m-pill--bad', 'Exception'], CANCELLED: ['', 'Cancelled'],
};
const CANCELLABLE = ['RECEIVED', 'PLANNED'];
const STEPS: Array<[string, string]> = [['RECEIVED', 'Received'], ['PLANNED', 'Planned'], ['LOADED', 'Loaded'], ['ENROUTE', 'En route'], ['DELIVERED', 'Delivered']];

export default function LiveSm27OrdersAndHistory() {
  const { session } = useAuth();
  const outletId = session?.outletId;
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const mine = outletId ? `outletId eq '${outletId}'` : null;

  const list = useEntitySet<Order>('Orders', mine ? { filter: [mine, FILTER[filter]].filter(Boolean).join(' and '), expand: 'tripStop', orderby: 'runDate desc,id', top: 25, count: true, search: search.trim() || undefined } : null, {
    refreshOn: ['eta_update', 'credit_note_issued', 'notification'],
  });
  const pods = useQuery<POD[]>('store-pods', c => c.all<POD>('PODs', { orderby: 'savedAt desc', top: 200 }), { refreshOn: ['credit_note_issued'] });
  const podByStop = useMemo(() => new Map((pods.data ?? []).map(p => [p.tripStopId, p])), [pods.data]);
  const week = useQuery<number>(mine ? `store-week-count:${outletId}` : null, async c => (await c.list('Orders', { filter: `${mine} and runDate ge ${daysAgo(7)}T00:00:00Z`, top: 0, count: true })).count ?? 0);
  const recent = useQuery<Order[]>(mine ? `store-28d:${outletId}` : null, c => c.all<Order>('Orders', { filter: `${mine} and status eq 'DELIVERED' and runDate ge ${daysAgo(28)}T00:00:00Z`, expand: 'tripStop', select: 'id,runDate,status' }));

  const rows = list.data ?? [];
  const sel = rows.find(o => o.id === selId) ?? rows[0];
  const detail = useEntity<Order>('Orders', sel?.id ?? null, { expand: 'lineItems' });
  const cancel = useAction<string, Order>((c, id) => c.action<Order>('Orders', id, 'Cancel', { reason: 'Cancelled by the store' }), {
    onSuccess: () => { void list.refresh(); void detail.refresh(); },
  });

  const delivered = recent.data ?? [];
  const onTime = delivered.filter(o => o.tripStop?.arrivalActual && (!o.tripStop.etaModelBandLate || new Date(o.tripStop.arrivalActual) <= new Date(o.tripStop.etaModelBandLate))).length;
  const credited = (pods.data ?? []).filter(p => p.creditNoteId);
  const creditedUnits = credited.reduce((s, p) => s + Math.max(0, p.unitsOrdered - p.unitsDelivered), 0);
  const nextRun = addDays(new Date().toISOString().slice(0, 10), 1);
  const cutoff = new Date(`${addDays(nextRun, -1)}T16:00:00+05:30`).getTime() - new Date().getTime();

  const pod = sel?.tripStop ? podByStop.get(sel.tripStop.id) : undefined;
  const at = sel ? STEPS.findIndex(([s]) => s === (sel.status === 'DEFERRED' || sel.status === 'EXCEPTION' ? 'PLANNED' : sel.status)) : -1;

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-27 Orders & history · desktop">
      <div className="s-shell">
        <StoreTop active="order" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{outletId}<span className="m-sep" />{" every order, delivery and receipt"}</div>
              <div className="d-h1">{"Orders & history"}</div>
            </div>
            <div className="d-search">
              <Ic n="filter" className="ic ic--sm" />
              <input className="lv-input" aria-label="Search orders" placeholder="Search orders or notes" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="d-btn d-btn--primary" data-lk="L131"><Ic n="plus" />New order for {fmtRunDate(nextRun)}</span>
          </div>
          <div className="d-kpis">
            <div className="d-kpi d-kpi--hero" style={{ flex: '1.6' }}>
              <span className="d-kpi__l"><Ic n="clock" className="ic ic--sm" />{fmtRunDate(nextRun)} orders close at 4:00 PM</span>
              <span className="d-kpi__v cd__v" style={{ fontSize: '36px' }}>{cutoff > 0 ? `${Math.floor(cutoff / 3_600_000)} h ${Math.floor((cutoff % 3_600_000) / 60_000)} m` : 'Closed'}<small>{cutoff > 0 ? 'left' : ''}</small></span>
              <span className="d-kpi__s">{"Orders after the cutoff go to the following run"}</span>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"On time · last 4 weeks"}</span><span className="d-kpi__v">{onTime}<small>of {delivered.length}</small></span><span className="d-kpi__s">{"arrived inside the ETA band"}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Units credited"}</span><span className="d-kpi__v">{creditedUnits}</span><span className="d-kpi__s">{credited.length} credit note{credited.length === 1 ? '' : 's'}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Orders this week"}</span><span className="d-kpi__v">{week.data ?? '…'}</span><span className="d-kpi__s">{"last 7 days and booked"}</span></div>
          </div>
          <ErrorBanner error={list.error ?? pods.error ?? cancel.error} onRetry={list.refresh} />
          <div className="d-split">
            <div className="d-card" style={{ flex: '1' }} data-testid="orders">
              <div className="d-card__head">
                <span className="d-card__title">{"All orders"}</span>
                <div className="d-toolbar" style={{ marginLeft: '8px' }}>
                  {([['all', 'All'], ['upcoming', 'Upcoming'], ['delivered', 'Delivered'], ['credited', 'Credited']] as Array<[Filter, string]>).map(([k, l]) => (
                    <span key={k} className={`d-filter lv-click${filter === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                      onClick={e => { e.stopPropagation(); setFilter(k); }} onKeyDown={e => { if (e.key === 'Enter') setFilter(k); }}>
                      {l}{filter === k && list.count !== undefined ? <b> {list.count}</b> : null}
                    </span>
                  ))}
                </div>
                <div className="spacer" />
              </div>
              <div className="sx-tr sx-tr--head" data-lk="L133">
                <span className="c" style={{ width: '110px' }}>{"Delivery day"}</span>
                <span className="c" style={{ width: '130px' }}>{"Order"}</span>
                <span className="c" style={{ width: '116px' }}>{"Temperature"}</span>
                <span className="c" style={{ width: '96px' }}>{"Units"}</span>
                <span className="c" style={{ width: '130px' }}>{"Status"}</span>
                <span className="c" style={{ width: '110px' }}>{"Arrived"}</span>
                <span className="c" style={{ flex: '1' }}>{"Receipt"}</span>
              </div>
              {!list.data && !list.error && <Skeleton rows={5} />}
              {list.data?.length === 0 && <Empty title="No orders" text={search || filter !== 'all' ? 'Nothing matches this filter.' : 'Place your first order.'} />}
              {rows.map(o => {
                const p = o.tripStop ? podByStop.get(o.tripStop.id) : undefined;
                const short = p && p.unitsDelivered < p.unitsOrdered;
                const [cls, label] = PILL[o.status] ?? ['', o.status];
                return (
                  <div key={o.id} className={`sx-tr lv-click${sel?.id === o.id ? ' sx-tr--sel' : ''}`} data-order={o.id} data-outlet={o.outletId} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setSelId(o.id); }} onKeyDown={e => { if (e.key === 'Enter') setSelId(o.id); }}>
                    <span className="c" style={{ width: '110px', fontWeight: sel?.id === o.id ? '700' : undefined }}>{fmtRunDate(o.runDate)}</span>
                    <span className="c" style={{ width: '130px' }}><span className="id">{o.id}</span></span>
                    <span className="c" style={{ width: '116px' }}>{o.tempClass === 'CHILLED' ? <span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled"}</span> : <span className="m-tag"><span className="dot" />{"Ambient"}</span>}</span>
                    <span className="c" style={{ width: '96px' }}>{short ? <b style={{ color: 'var(--st-deferred-fg)' }}>{p!.unitsDelivered} of {p!.unitsOrdered}</b> : o.units}</span>
                    <span className="c" style={{ width: '130px' }}><span className={`m-pill ${cls}`}><span className="dot" />{label}</span></span>
                    <span className="c" style={{ width: '110px' }}>{o.tripStop?.arrivalActual ? fmtClock(o.tripStop.arrivalActual) : <span style={{ color: 'var(--text-3)' }}>—</span>}</span>
                    <span className="c" style={{ flex: '1' }}>
                      {p?.creditNoteId ? <><span className="id" style={{ color: 'var(--st-deferred-fg)' }}>{p.creditNoteId}</span><span style={{ color: 'var(--text-2)' }}>{` ${p.unitsOrdered - p.unitsDelivered} units`}</span></>
                        : p ? <span className="sx-okc"><Ic n="check" />Matched {p.syncedAt ? fmtClock(p.syncedAt) : fmtClock(p.savedAt)}</span>
                          : <span style={{ color: 'var(--text-3)' }}>{"after delivery"}</span>}
                    </span>
                  </div>
                );
              })}
              {list.hasMore && (
                <div className="x-tfoot">{list.loadingMore ? <Spinner label="Loading more…" /> : <Btn className="x-link" onClick={() => void list.loadMore()}>{"Show more"}<Ic n="chevron-down" /></Btn>}</div>
              )}
            </div>
            <div className="d-panel">
              {sel && (
                <div className="d-card" data-testid="order-detail">
                  <div className="d-card__head" style={{ minHeight: '58px' }}>
                    <span className="d-card__title id" style={{ fontFamily: 'var(--font-mono)' }}>{sel.id}</span>
                    {sel.tempClass === 'CHILLED' ? <span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled"}</span> : <span className="m-tag"><span className="dot" />{"Ambient"}</span>}
                    <div className="spacer" />
                    <span className={`m-pill ${(PILL[sel.status] ?? [''])[0]}`}><span className="dot" />{(PILL[sel.status] ?? ['', sel.status])[1]}</span>
                  </div>
                  <div className="d-card__body" style={{ gap: '0' }}>
                    <div className="sx-dthread">
                      <div className="thread">
                        {STEPS.flatMap(([s, l], i) => {
                          const done = i < at || sel.status === 'DELIVERED';
                          const step = (
                            <div key={s} className={`thread__step ${done ? 'is-done' : i === at ? 'is-now' : ''}`}>
                              <div className="thread__node">{done || i === at ? <Ic n="check" /> : null}</div>
                              <div className="thread__label">{l}</div>
                              <div className="thread__time">{i === 0 ? fmtDay(sel.orderedAt).split(' ')[0] : i === 4 && sel.tripStop?.arrivalActual ? fmtClock(sel.tripStop.arrivalActual) : ''}</div>
                            </div>
                          );
                          return i < STEPS.length - 1 ? [step, <div key={`${s}-b`} className={`thread__bar${i < at || sel.status === 'DELIVERED' ? ' is-done' : ''}`} />] : [step];
                        })}
                      </div>
                    </div>
                    <div className="sx-pkv" style={{ marginTop: '10px' }}><span>{"Ordered"}</span><b>{sel.units} units · {detail.data?.lineItems?.length ?? '…'} lines</b></div>
                    <div className="sx-pkv"><span>{"Delivery"}</span><b>{fmtRunDate(isoDay(sel.runDate))}</b></div>
                    <div className="sx-pkv"><span>{"You received"}</span><b>{pod ? `${pod.unitsDelivered}${pod.receiverName ? ` · ${pod.receiverName}` : ''}` : '—'}</b></div>
                    <div className="sx-pkv"><span>{"Driver's record"}</span><b style={pod ? { color: 'var(--st-delivered-fg)' } : undefined}>{pod ? (pod.syncedAt ? `Matched ${fmtClock(pod.syncedAt)}` : 'Saved on the phone, syncing') : '—'}</b></div>
                    <div className="sx-pkv"><span>{"Credit note"}</span><b>{pod?.creditNoteId ? <><span className="id">{pod.creditNoteId}</span> · {pod.unitsOrdered - pod.unitsDelivered} units</> : 'none'}</b></div>
                    {detail.data?.lineItems && detail.data.lineItems.length > 0 && (
                      <div className="vstack" style={{ gap: '0', marginTop: '8px' }}>
                        {detail.data.lineItems.map(li => <div key={li.id} className="sx-pkv"><span>{li.name}</span><b>{li.qty} · {li.kg} kg</b></div>)}
                      </div>
                    )}
                    <div className="hstack" style={{ gap: '8px', marginTop: '12px' }}>
                      {CANCELLABLE.includes(sel.status) && (
                        <Btn className="d-btn" testId="cancel-order" busy={cancel.pending} onClick={() => void cancel.run(sel.id)}>{"Cancel order"}</Btn>
                      )}
                      <span className="d-btn d-btn--ghost" data-lk="L131">{"Reorder"}</span>
                      <span className="t-3" style={{ fontSize: '12.5px' }}>{title(sel.brand)} · {sel.kg} kg · {sel.m3} m³</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
