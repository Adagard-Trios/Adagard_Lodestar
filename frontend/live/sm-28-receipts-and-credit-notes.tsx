'use client';
// SM-28 Receipts & credit notes, live. Markup and classes from the generated design
// (frontend/screens/sm-28-receipts-and-credit-notes.tsx).
// Data: the outlet's PODs (proof of delivery, written by the driver's phone and synced) with their TripStop, and
// the matching Orders; credit notes are the PODs that carry a creditNoteId. Realtime credit_note_issued and
// eta_update events on the store:<outlet> room refresh the list.
import { useMemo, useState } from 'react';
import { StoreTop } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fmtClock, fmtDay, fmtRunDate } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { Order, POD, TripStop } from '@/lib/odata/types';

type Row = POD & { tripStop?: TripStop; order?: Order };
type Tab = 'receipts' | 'credits';

function exceptionsOf(p: POD): Array<{ type?: string; description?: string }> {
  const ex = p.exceptions;
  if (!Array.isArray(ex)) return [];
  return ex.map(e => (typeof e === 'string' ? { description: e } : e));
}

export default function LiveSm28ReceiptsAndCreditNotes() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('receipts');
  const [selId, setSelId] = useState<string | null>(null);

  const rows = useQuery<Row[]>(session?.outletId ? `receipts:${session.outletId}` : null, async c => {
    const pods = (await c.list<POD & { tripStop?: TripStop }>('PODs', { expand: 'tripStop', orderby: 'savedAt desc', top: 60 })).value;
    const ids = [...new Set(pods.map(p => p.tripStop?.orderId).filter(Boolean))] as string[];
    const orders = ids.length ? await c.all<Order>('Orders', { filter: `id in (${ids.map(i => `'${i}'`).join(',')})`, select: 'id,runDate,tempClass,units,outletId' }) : [];
    const byId = new Map(orders.map(o => [o.id, o]));
    return pods.map(p => ({ ...p, order: byId.get(p.tripStop?.orderId ?? '') }));
  }, { refreshOn: ['credit_note_issued', 'eta_update', 'notification'] });

  const all = useMemo(() => rows.data ?? [], [rows.data]);
  const credits = all.filter(p => p.creditNoteId);
  const shown = tab === 'credits' ? credits : all;
  const sel = shown.find(p => p.id === selId) ?? credits[0] ?? shown[0];
  const matched = all.filter(p => p.syncedAt).length;
  const unitsCredited = credits.reduce((s, p) => s + Math.max(0, p.unitsOrdered - p.unitsDelivered), 0);
  const disputes = all.filter(p => p.unitsDelivered < p.unitsOrdered && !p.creditNoteId).length;
  const offline = all.filter(p => p.savedOffline).length;

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-28 Receipts & credit notes · desktop">
      <div className="s-shell">
        <StoreTop active="receipts" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{session?.outletId}<span className="m-sep" />{" your count and the driver's record, side by side"}</div>
              <div className="d-h1">{"Receipts & credit notes"}</div>
            </div>
          </div>
          <div className="d-kpis">
            <div className="d-kpi d-kpi--hero" style={{ flex: '1.6' }}>
              <span className="d-kpi__l"><Ic n="shield-check" className="ic ic--sm" />{"Receipts matched"}</span>
              <span className="d-kpi__v cd__v" style={{ fontSize: '36px' }} data-testid="matched">{matched}<small>of {all.length}</small></span>
              <span className="d-kpi__s">{matched === all.length ? "Every count agrees with the driver's proof of delivery" : 'Some proofs are still syncing from the phone'}</span>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"Units credited"}</span><span className="d-kpi__v">{unitsCredited}</span><span className="d-kpi__s">{credits.length} credit note{credits.length === 1 ? '' : 's'}</span></div>
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
              {shown.map(p => {
                const short = p.unitsDelivered < p.unitsOrdered;
                return (
                  <div key={p.id} className={`sx-tr lv-click${sel?.id === p.id ? ' sx-tr--sel' : ''}`} data-pod={p.id} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setSelId(p.id); }} onKeyDown={e => { if (e.key === 'Enter') setSelId(p.id); }}>
                    <span className="c" style={{ width: '104px', fontWeight: sel?.id === p.id ? '700' : undefined }}>{p.order ? fmtRunDate(p.order.runDate) : fmtDay(p.savedAt)}</span>
                    <span className="c" style={{ width: '128px' }}><span className="id">{p.tripStop?.orderId}</span></span>
                    <span className="c" style={{ width: '112px' }}>{p.order?.tempClass === 'CHILLED' ? <span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled"}</span> : <span className="m-tag"><span className="dot" />{"Ambient"}</span>}</span>
                    <span className="c" style={{ width: '104px' }}>{short ? <b style={{ color: 'var(--st-deferred-fg)' }}>{p.unitsDelivered} of {p.unitsOrdered}</b> : `${p.unitsDelivered} of ${p.unitsOrdered}`}</span>
                    <span className="c" style={{ width: '118px' }}>{p.receiverName ?? '—'} · {fmtClock(p.savedAt)}</span>
                    <span className="c" style={{ width: '124px' }}>{p.syncedAt ? <span className="sx-okc"><Ic n="check" />Matched {fmtClock(p.syncedAt)}</span> : <span style={{ color: 'var(--text-3)' }}>syncing</span>}</span>
                    <span className="c" style={{ flex: '1' }}>{p.creditNoteId ? <><span className="id" style={{ color: 'var(--st-deferred-fg)' }}>{p.creditNoteId}</span><span style={{ color: 'var(--text-2)' }}>{` ${p.unitsOrdered - p.unitsDelivered} units`}</span></> : <span style={{ color: 'var(--text-3)' }}>{"None"}</span>}</span>
                  </div>
                );
              })}
            </div>
            <div className="d-panel">
              {sel && (
                <div className="d-card" data-testid="credit-detail">
                  <div className="d-card__head" style={{ minHeight: '58px' }}>
                    <span className="d-card__title">{sel.creditNoteId ? 'Credit note' : 'Receipt'}</span>
                    <span className="id" style={{ fontSize: '14px', color: 'var(--text-2)' }}>{sel.creditNoteId ?? sel.tripStop?.orderId}</span>
                    <div className="spacer" />
                    <span className={`m-pill ${sel.syncedAt ? 'm-pill--ok' : 'm-pill--offline'}`}><span className="dot" />{sel.syncedAt ? 'Matched' : 'Syncing'}</span>
                  </div>
                  <div className="d-card__body" style={{ gap: '0' }}>
                    <div className="vstack" style={{ gap: '2px', paddingBottom: '12px' }}>
                      <span className="d-kpi__v" style={{ fontSize: '40px' }}>{Math.max(0, sel.unitsOrdered - sel.unitsDelivered)}<small>{"units"}</small></span>
                      <span className="d-sub">{sel.order ? fmtRunDate(sel.order.runDate) : ''} · on <span className="id">{sel.tripStop?.orderId}</span> · saved {fmtClock(sel.savedAt)}</span>
                    </div>
                    {exceptionsOf(sel).map((e, i) => (
                      <div key={i} className="sx-pkv"><span>{e.description}</span><b>{e.type ?? ''}</b></div>
                    ))}
                    <div className="sx-pkv"><span>{"Driver's record"}</span><b style={{ color: sel.syncedAt ? 'var(--st-delivered-fg)' : undefined }}>{sel.savedOffline ? 'saved offline' : 'online'}{sel.syncedAt ? ` · synced ${fmtClock(sel.syncedAt)}` : ''}</b></div>
                    <div className="sx-pkv"><span>{"Received by"}</span><b>{sel.receiverName ?? '—'}</b></div>
                    <div className="sx-pkv"><span>{"Delivered"}</span><b>{sel.unitsDelivered} of {sel.unitsOrdered}</b></div>
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
