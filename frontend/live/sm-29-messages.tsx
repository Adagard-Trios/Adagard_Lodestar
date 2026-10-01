'use client';
// SM-29 Messages, live. Markup and classes from the generated design (frontend/screens/sm-29-messages.tsx).
// Data: the user's own Notifications (the API only returns the caller's), grouped by day; opening one marks it
// read (Notifications('…')/Lodestar.MarkRead). New notifications arrive over the WebSocket (user:<sub> room).
import { useMemo, useState } from 'react';
import Btn from '@/components/live/Btn';
import { StoreTop } from '@/components/live/chrome';
import { Ic, type IconName } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { fmtDay, fmtDayTime, fmtTime } from '@/lib/format';
import { useAction, useEntitySet } from '@/lib/odata/hooks';
import type { Notification } from '@/lib/odata/types';

type Filter = 'all' | 'action' | 'deliveries' | 'credits';
const DELIVERY_TYPES = ['ETA_UPDATE', 'POD_MATCHED', 'ARRIVAL', 'SIGNAL_LOST', 'SIGNAL_BACK', 'BLACKOUT_DETECTED', 'DEFERRAL_SUGGESTED', 'DISPATCH_NOTICE'];
const FILTER: Record<Filter, string | undefined> = {
  all: undefined,
  action: 'readAt eq null',
  deliveries: `type in (${DELIVERY_TYPES.map(t => `'${t}'`).join(',')})`,
  credits: "type in ('CREDIT_NOTE_ISSUED','SHORTFALL_ACK')",
};

function look(type: string): { lead: string; icon: IconName; pill: string } {
  if (/CREDIT|MATCH/.test(type)) return { lead: 'm-row__lead--ok', icon: 'shield-check', pill: 'm-pill--ok' };
  if (/SHORT|FAIL|BLACKOUT|LOST/.test(type)) return { lead: 'm-row__lead--warn', icon: 'alert', pill: 'm-pill--warn' };
  if (/ETA|ARRIV|DELIVER/.test(type)) return { lead: '', icon: 'van-2', pill: 'm-pill--brand' };
  return { lead: '', icon: 'message', pill: 'm-pill--brand' };
}
const label = (type: string) => type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
const payloadText = (n: Notification) => {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  return String(p.message ?? p.description ?? p.title ?? p.note ?? '');
};

export default function LiveSm29Messages() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selId, setSelId] = useState<string | null>(null);
  const list = useEntitySet<Notification>('Notifications', { filter: FILTER[filter], orderby: 'sentAt desc', top: 30, count: true }, {
    refreshOn: ['notification', 'credit_note_issued', 'eta_update'],
  });
  const unread = useEntitySet<Notification>('Notifications', { filter: 'readAt eq null', top: 0, count: true }, { refreshOn: ['notification'] });
  const markRead = useAction<string, Notification>((c, id) => c.action<Notification>('Notifications', id, 'MarkRead'), {
    onSuccess: n => {
      list.setData(rows => (rows ?? []).map(r => (r.id === n.id ? { ...r, readAt: n.readAt ?? new Date().toISOString() } : r)));
      void unread.refresh();
    },
  });

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const sel = rows.find(n => n.id === selId) ?? rows[0];
  const open = (n: Notification) => {
    setSelId(n.id);
    if (!n.readAt) void markRead.run(n.id);
  };
  const days = useMemo(() => {
    const m = new Map<string, Notification[]>();
    rows.forEach(n => m.set(fmtDay(n.sentAt), [...(m.get(fmtDay(n.sentAt)) ?? []), n]));
    return [...m.entries()];
  }, [rows]);
  const p = (sel?.payload ?? {}) as Record<string, unknown>;

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-29 Messages · desktop">
      <div className="s-shell">
        <StoreTop active="messages" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Structured notices from the depot, drivers and Lodestar "}<span className="m-sep" />{unread.count ? ` ${unread.count} unread` : ' nothing needs action'}</div>
              <div className="d-h1">{"Messages"}</div>
            </div>
            <div className="d-toolbar">
              {([['all', 'All'], ['action', 'Needs action'], ['deliveries', 'Deliveries'], ['credits', 'Credits']] as Array<[Filter, string]>).map(([k, l]) => (
                <span key={k} className={`d-filter lv-click${filter === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                  onClick={e => { e.stopPropagation(); setFilter(k); }} onKeyDown={e => { if (e.key === 'Enter') setFilter(k); }}>
                  {l}{k === 'action' ? <b> {unread.count ?? 0}</b> : filter === k && list.count !== undefined ? <b> {list.count}</b> : null}
                </span>
              ))}
            </div>
          </div>
          <ErrorBanner error={list.error ?? markRead.error} onRetry={list.refresh} />
          <div className="d-split">
            <div className="d-card" style={{ width: '480px', flexShrink: '0' }} data-testid="messages">
              <div className="sx-dlist">
                {!list.data && !list.error && <Skeleton rows={4} />}
                {list.data?.length === 0 && <Empty title="No messages" text="Notices from the depot and drivers appear here." icon="message" />}
                {days.map(([day, ns], i) => (
                  <div key={day}>
                    <div className="sx-dday" style={i === 0 ? { borderTop: 'none' } : undefined}>{day}</div>
                    {ns.map(n => {
                      const lk = look(n.type);
                      return (
                        <div key={n.id} className={`sx-dn lv-click${sel?.id === n.id ? ' sx-dn--sel' : ''}`} data-notification={n.id} data-unread={!n.readAt || undefined}
                          role="button" tabIndex={0} onClick={e => { e.stopPropagation(); open(n); }} onKeyDown={e => { if (e.key === 'Enter') open(n); }}>
                          <div className={`m-row__lead ${lk.lead}`}><Ic n={lk.icon} /></div>
                          <div className="sx-dn__main">
                            <div className="sx-dn__k"><span>{label(n.type)}{n.readAt ? '' : ' · new'}</span><span>{fmtTime(n.sentAt)}</span></div>
                            <div className="sx-dn__t" style={n.readAt ? undefined : { fontWeight: 800 }}>{payloadText(n) || label(n.type)}</div>
                            <div className="sx-dn__m">{[n.tripId, (n.payload as Record<string, unknown> | null)?.orderId, (n.payload as Record<string, unknown> | null)?.creditNoteId].filter(Boolean).join(' · ')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {list.hasMore && <div style={{ padding: '10px 16px' }}>{list.loadingMore ? <Spinner /> : <Btn className="x-link" onClick={() => void list.loadMore()}>{"Older messages"}<Ic n="chevron-down" /></Btn>}</div>}
              </div>
            </div>
            <div className="d-card" style={{ flex: '1' }}>
              {!sel ? <Empty title="Nothing selected" icon="message" /> : (
                <div className="d-card__body" style={{ padding: '24px 28px', gap: '18px' }} data-testid="message-detail">
                  <div className="between">
                    <span className={`m-pill ${look(sel.type).pill}`}><Ic n={look(sel.type).icon} className="ic ic--sm" />{label(sel.type)}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-3)' }}>{fmtDayTime(sel.sentAt)} · {sel.channel.toLowerCase()}</span>
                  </div>
                  <div className="vstack" style={{ gap: '6px' }}>
                    <span className="d-h1" style={{ fontSize: '30px' }}>{payloadText(sel) || label(sel.type)}</span>
                    <span className="d-sub" style={{ fontSize: '15px' }}>{sel.readAt ? `Read ${fmtDayTime(sel.readAt)}` : 'New'}</span>
                  </div>
                  <div className="kvl">
                    {Object.entries(p).filter(([, v]) => v !== null && typeof v !== 'object').map(([k, v]) => (
                      <div key={k} className="kvl__r"><span>{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span><span>{String(v)}</span></div>
                    ))}
                    {sel.tripId && <div className="kvl__r"><span>{"Trip"}</span><span className="id">{sel.tripId}</span></div>}
                  </div>
                  <div className="hstack" style={{ gap: '10px' }}>
                    <span className="d-btn d-btn--primary" data-lk="L137">{"Receipts & credit notes"}</span>
                    <span className="d-btn" data-lk="L138">{"Open orders"}</span>
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
