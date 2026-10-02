'use client';
// SM-28 Receipts & credit notes, live. Markup and classes from the generated design
// (frontend/screens/sm-28-receipts-and-credit-notes.tsx).
// Data: one row per delivered order, from both records: the store's own count on the Order
// (Orders('…')/Lodestar.ConfirmReceipt: unitsReceived, the receipt note and the credit note a short count raises,
// even before the driver's POD exists) and the driver's POD (proof of delivery, written on the driver's phone and
// synced) with its exceptions. Credit notes are the rows with a creditNoteId on the order or the POD. Every store
// event (STORE_EVENTS) refreshes the list; ?id= or the order picked on SM-29 opens that order.
import { useMemo, useState } from 'react';
import { StoreTop } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { isCounted, orderCredit, STORE_EVENTS } from '@/components/live/store-data';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fmtClock, fmtDay, fmtRunDate } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { Order, POD, TripStop } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Row = { id: string; order?: Order; pod?: POD & { tripStop?: TripStop }; creditNoteId: string | null; credited: number; at: string };
type Tab = 'receipts' | 'credits';

function exceptionsOf(p: POD | undefined): Array<{ type?: string; description?: string }> {
  const ex = p?.exceptions;
  if (!Array.isArray(ex)) return [];
  return ex.map(e => (typeof e === 'string' ? { description: e } : e));
}

/** One row per order: its count, its POD and its credit note. */
export function receiptRows(orders: Order[], pods: Array<POD & { tripStop?: TripStop }>): Row[] {
  const byId = new Map<string, Row>();
  const put = (order: Order | undefined, pod: (POD & { tripStop?: TripStop }) | undefined) => {
    const id = order?.id ?? pod?.tripStop?.orderId;
    if (!id) return;
    const prev = byId.get(id);
    const o = order ?? prev?.order;
    const p = pod ?? prev?.pod ?? (o?.tripStop?.pod as (POD & { tripStop?: TripStop }) | undefined) ?? undefined;
    const credit = orderCredit(o, p);
    byId.set(id, { id, order: o, pod: p, creditNoteId: credit.creditNoteId, credited: credit.units, at: o?.receiptSavedAt ?? p?.savedAt ?? o?.runDate ?? '' });
  };
  pods.forEach(p => put(undefined, p));
  orders.forEach(o => put(o, undefined));
  return [...byId.values()].sort((a, b) => b.at.localeCompare(a.at));
}

export default function LiveSm28ReceiptsAndCreditNotes() {
  const { session } = useAuth();
  const outletId = session?.outletId;
  const [tab, setTab] = useState<Tab>('receipts');
  const [focus, setFocus] = useFocusId('order');
  const [picked, setSelId] = useState<string | null>(null);
  const selId = picked ?? focus;

  const rows = useQuery<Row[]>(outletId ? `receipts:${outletId}` : null, async c => {
    const mine = `outletId eq '${outletId}'`;
    const [pods, counted] = await Promise.all([
      c.list<POD & { tripStop?: TripStop }>('PODs', { expand: 'tripStop', orderby: 'savedAt desc', top: 60 }).then(r => r.value),
      c.list<Order>('Orders', { filter: `${mine} and (unitsReceived ne null or status in ('DELIVERED','EXCEPTION'))`, expand: 'tripStop($expand=pod)', orderby: 'runDate desc,id', top: 60 }).then(r => r.value),
    ]);
    const known = new Set(counted.map(o => o.id));
    const missing = [...new Set(pods.map(p => p.tripStop?.orderId).filter((x): x is string => !!x && !known.has(x)))];
    const more = missing.length ? await c.all<Order>('Orders', { filter: `id in (${missing.map(i => `'${i}'`).join(',')})` }) : [];
    return receiptRows([...counted, ...more], pods);
  }, { refreshOn: STORE_EVENTS });

  const all = useMemo(() => rows.data ?? [], [rows.data]);
  const credits = all.filter(r => r.creditNoteId);
  const shown = tab === 'credits' ? credits : all;
  const sel = shown.find(r => r.id === selId) ?? all.find(r => r.id === selId) ?? credits[0] ?? shown[0];
  // matched: the store's count agrees with the driver's synced record
  const matched = all.filter(r => r.pod?.syncedAt && (!isCounted(r.order) || r.order!.unitsReceived === r.pod.unitsDelivered)).length;
  const unitsCredited = credits.reduce((s, r) => s + r.credited, 0);
  const disputes = all.filter(r => !r.creditNoteId && ((r.pod && r.pod.unitsDelivered < r.pod.unitsOrdered) || (isCounted(r.order) && r.order!.unitsReceived! < (r.order!.unitsExpected ?? r.order!.units)))).length;
  const offline = all.filter(r => r.pod?.savedOffline).length;
  const pick = (id: string) => { setSelId(id); setFocus(null); };

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-28 Receipts & credit notes · desktop">
      <div className="s-shell">
        <StoreTop active="receipts" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{outletId}<span className="m-sep" />{" your count and the driver's record, side by side"}</div>
              <div className="d-h1">{"Receipts & credit notes"}</div>
            </div>
          </div>
          <div className="d-kpis">
            <div className="d-kpi d-kpi--hero" style={{ flex: '1.6' }}>
              <span className="d-kpi__l"><Ic n="shield-check" className="ic ic--sm" />{"Receipts matched"}</span>
              <span className="d-kpi__v cd__v" style={{ fontSize: '36px' }} data-testid="matched">{matched}<small>of {all.length}</small></span>
              <span className="d-kpi__s">{matched === all.length ? "Every count agrees with the driver's proof of delivery" : "Some counts differ from the driver's record, or the record is still syncing"}</span>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"Units credited"}</span><span className="d-kpi__v" data-testid="units-credited">{unitsCredited}</span><span className="d-kpi__s">{credits.length} credit note{credits.length === 1 ? '' : 's'}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Open disputes"}</span><span className="d-kpi__v">{disputes}</span><span className="d-kpi__s">{disputes ? 'short without a credit note' : 'nothing waiting on you'}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Saved offline"}</span><span className="d-kpi__v">{offline}</span><span className="d-kpi__s">{"proofs made without signal, synced later"}</span></div>
          </div>
          <ErrorBanner error={rows.error} onRetry={rows.refresh} />
          <div className="d-split">
            <div className="d-card" style={{ flex: '1' }} data-testid="receipts">
              <div className="d-card__head">
                <div className="m-seg" style={{ margin: '0', width: '280px' }}>
                  {([['receipts', `Receipts · ${all.length}`], ['credits', `Credit notes · ${credits.length}`]] as Array<[Tab, string]>).map(([k, l]) => (
                    <span key={k} className={`m-seg__i lv-click${tab === k ? ' is-on' : ''}`} style={{ height: '30px', fontSize: '13px' }} role="button" tabIndex={0}
                      onClick={e => { e.stopPropagation(); setTab(k); }} onKeyDown={e => { if (e.key === 'Enter') setTab(k); }}>{l}</span>
                  ))}
                </div>
                <div className="spacer" />
                <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{"latest first"}</span>
              </div>
              <div className="sx-tr sx-tr--head" data-lk="L135">
                <span className="c" style={{ width: '104px' }}>{"Delivery"}</span>
                <span className="c" style={{ width: '128px' }}>{"Order"}</span>
                <span className="c" style={{ width: '112px' }}>{"Temperature"}</span>
                <span className="c" style={{ width: '104px' }}>{"Received"}</span>
                <span className="c" style={{ width: '118px' }}>{"Counted by"}</span>
                <span className="c" style={{ width: '124px' }}>{"Driver record"}</span>
                <span className="c" style={{ flex: '1' }}>{"Credit"}</span>
              </div>
              {!rows.data && !rows.error && <Skeleton rows={5} />}
              {rows.data && shown.length === 0 && <Empty title={tab === 'credits' ? 'No credit notes' : 'No receipts yet'} text="Receipts appear once a delivery is made." />}
              {shown.map(r => {
                const o = r.order;
                const p = r.pod;
                const expected = o ? o.unitsExpected ?? o.units : p?.unitsOrdered ?? 0;
                const got = isCounted(o) ? o!.unitsReceived! : p?.unitsDelivered;
                const short = got !== undefined && got < expected;
                return (
                  <div key={r.id} className={`sx-tr lv-click${sel?.id === r.id ? ' sx-tr--sel' : ''}`} data-pod={p?.id} data-order={r.id} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); pick(r.id); }} onKeyDown={e => { if (e.key === 'Enter') pick(r.id); }}>
                    <span className="c" style={{ width: '104px', fontWeight: sel?.id === r.id ? '700' : undefined }}>{o ? fmtRunDate(o.runDate) : fmtDay(p?.savedAt)}</span>
                    <span className="c" style={{ width: '128px' }}><span className="id">{r.id}</span></span>
                    <span className="c" style={{ width: '112px' }}>{o?.tempClass === 'CHILLED' ? <span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled"}</span> : <span className="m-tag"><span className="dot" />{"Ambient"}</span>}</span>
                    <span className="c" style={{ width: '104px' }}>{got === undefined ? <span style={{ color: 'var(--text-3)' }}>—</span> : short ? <b style={{ color: 'var(--st-deferred-fg)' }}>{got} of {expected}</b> : `${got} of ${expected}`}</span>
                    <span className="c" style={{ width: '118px' }}>{isCounted(o) ? `You · ${fmtClock(o!.receiptSavedAt ?? o!.receivedAt)}` : p ? `${p.receiverName ?? '—'} · ${fmtClock(p.savedAt)}` : '—'}</span>
                    <span className="c" style={{ width: '124px' }}>{p?.syncedAt ? <span className="sx-okc"><Ic n="check" />{isCounted(o) && o!.unitsReceived !== p.unitsDelivered ? 'Differs' : 'Matched'} {fmtClock(p.syncedAt)}</span> : <span style={{ color: 'var(--text-3)' }}>{p ? 'syncing' : 'not synced yet'}</span>}</span>
                    <span className="c" style={{ flex: '1' }}>{r.creditNoteId ? <><span className="id" style={{ color: 'var(--st-deferred-fg)' }}>{r.creditNoteId}</span><span style={{ color: 'var(--text-2)' }}>{` ${r.credited} units`}</span></> : <span style={{ color: 'var(--text-3)' }}>{"None"}</span>}</span>
                  </div>
                );
              })}
            </div>
            <div className="d-panel">
              {sel && (
                <div className="d-card" data-testid="credit-detail">
                  <div className="d-card__head" style={{ minHeight: '58px' }}>
                    <span className="d-card__title">{sel.creditNoteId ? 'Credit note' : 'Receipt'}</span>
                    <span className="id" style={{ fontSize: '14px', color: 'var(--text-2)' }}>{sel.creditNoteId ?? sel.id}</span>
                    <div className="spacer" />
                    <span className={`m-pill ${sel.pod?.syncedAt ? 'm-pill--ok' : 'm-pill--offline'}`}><span className="dot" />{sel.pod?.syncedAt ? 'Matched' : sel.pod ? 'Syncing' : "Driver's record pending"}</span>
                  </div>
                  <div className="d-card__body" style={{ gap: '0' }}>
                    <div className="vstack" style={{ gap: '2px', paddingBottom: '12px' }}>
                      <span className="d-kpi__v" style={{ fontSize: '40px' }}>{sel.credited}<small>{"units"}</small></span>
                      <span className="d-sub">{sel.order ? fmtRunDate(sel.order.runDate) : ''} · on <span className="id">{sel.id}</span>{sel.at ? ` · saved ${fmtClock(sel.at)}` : ''}</span>
                    </div>
                    {exceptionsOf(sel.pod).map((e, i) => (
                      <div key={i} className="sx-pkv"><span>{e.description}</span><b>{e.type ?? ''}</b></div>
                    ))}
                    {isCounted(sel.order) && (
                      <div className="sx-pkv"><span>{"Your count"}</span><b>{sel.order!.unitsReceived} of {sel.order!.unitsExpected ?? sel.order!.units}{sel.order!.receiptSavedAt ? ` · ${fmtClock(sel.order!.receiptSavedAt)}` : ''}</b></div>
                    )}
                    {sel.order?.receiptNote && <div className="sx-pkv"><span>{"Your note"}</span><b>{sel.order.receiptNote}</b></div>}
                    <div className="sx-pkv"><span>{"Driver's record"}</span><b style={{ color: sel.pod?.syncedAt ? 'var(--st-delivered-fg)' : undefined }}>{sel.pod ? `${sel.pod.savedOffline ? 'saved offline' : 'online'}${sel.pod.syncedAt ? ` · synced ${fmtClock(sel.pod.syncedAt)}` : ''}` : 'not synced yet'}</b></div>
                    <div className="sx-pkv"><span>{"Received by"}</span><b>{sel.pod?.receiverName ?? '—'}</b></div>
                    <div className="sx-pkv"><span>{"Delivered"}</span><b>{sel.pod ? `${sel.pod.unitsDelivered} of ${sel.pod.unitsOrdered}` : '—'}</b></div>
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
