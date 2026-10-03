'use client';
// DSP-14 Notifications panel, live. Markup and classes from the generated design (frontend/screens/dsp-14-notifications-panel.tsx).
// Data: the dispatcher's own Notifications (the API returns only the caller's), newest first, refreshed on the
// realtime "notification" event. "Mark all read" runs Notifications('…')/Lodestar.MarkRead on each unread one.
// Alerts that need the dispatcher open the exceptions inbox (DSP-13). Today's overview behind the panel is a
// plain backdrop.
// Not shown: "since you signed in" (the session has no sign-in time), so the header counts unread notifications.
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic, type IconName } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtClock, fmtDay, fmtTime } from '@/lib/format';
import { useAction, useEntitySet } from '@/lib/odata/hooks';
import type { Notification } from '@/lib/odata/types';
import { ALERT_TYPES } from '@/components/live/plan-data';

/** Alerts that need the dispatcher (as on the exceptions inbox). */
const ALERTS = new Set(ALERT_TYPES);
const isPlan = (type: string) => /PLAN|DEFERRAL|DEFERRED|AGENT|TRIP_RELEASED/.test(type);

type Tab = 'all' | 'needs' | 'plans';
type Tone = 'bad' | 'warn' | 'off' | 'ok' | '';

function look(type: string): { tone: Tone; icon: IconName } {
  if (type === 'REEFER_FAIL') return { tone: 'bad', icon: 'thermometer' };
  if (/FAIL|BLOCK|ISSUE|POD_EXCEPTION/.test(type)) return { tone: 'bad', icon: 'store' };
  if (/SIGNAL_LOST|BLACKOUT/.test(type)) return { tone: 'off', icon: 'wifi-off' };
  if (/LATE|ETA/.test(type)) return { tone: 'warn', icon: 'clock' };
  if (/SHORTFALL_FLAGGED|DEFERRAL|DEFERRED/.test(type)) return { tone: 'warn', icon: 'box' };
  if (/ACK|MATCHED|BACK|APPROVED|CREDIT_NOTE/.test(type)) return { tone: 'ok', icon: 'check' };
  return { tone: '', icon: 'send' };
}

function describe(n: Notification) {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  const text = (k: string) => (typeof p[k] === 'string' || typeof p[k] === 'number' ? String(p[k]) : undefined);
  const nice = n.type.toLowerCase().replace(/_/g, ' ');
  const head = text('title') ?? text('message') ?? nice.charAt(0).toUpperCase() + nice.slice(1);
  const meta = [text('orderId'), text('vehicleId'), text('outletId'), text('location'), text('note')].filter(Boolean).join(' · ');
  return { head, meta };
}

const when = (v: string) => (fmtDay(v) === fmtDay(new Date()) ? fmtClock(v) : `${fmtDay(v).split(' ')[0]} ${fmtTime(v)}`);

/** The notifications panel: over the page it was opened from (OverlayHost), or on its own route over an empty board. */
export function NotificationsDrawer({ onClose }: { onClose?: () => void }) {
  const [tab, setTab] = useState<Tab>('all');
  const list = useEntitySet<Notification>('Notifications', { orderby: 'sentAt desc', top: 50 }, { refreshOn: ['notification'] });
  const markAll = useAction<string[], unknown>(async (c, ids) => {
    for (const id of ids) await c.action('Notifications', id, 'MarkRead');
  }, { onSuccess: () => void list.refresh() });

  const all = list.data ?? [];
  const needs = (n: Notification) => !n.readAt && ALERTS.has(n.type);
  const counts: Record<Tab, number> = { all: all.length, needs: all.filter(needs).length, plans: all.filter(n => isPlan(n.type)).length };
  const shown = all.filter(n => (tab === 'needs' ? needs(n) : tab === 'plans' ? isPlan(n.type) : true));
  const unread = all.filter(n => !n.readAt);
  const fresh = shown.filter(n => !n.readAt);
  const earlier = shown.filter(n => n.readAt);
  const today = fmtDay(new Date());

  const row = (n: Notification) => {
    const { tone, icon } = look(n.type);
    const { head, meta } = describe(n);
    const isNew = !n.readAt;
    return (
      <div
        key={n.id}
        className="dx-lrow"
        style={isNew ? { background: 'var(--tint-brand)' } : tone === 'off' ? { background: '#FBFAF9' } : undefined}
        data-notification={n.id}
        {...(ALERTS.has(n.type) ? { 'data-lk': 'L56' } : {})}
      >
        <span className={`dx-lead${tone ? ` dx-lead--${tone}` : ''}`}><Ic n={icon} /></span>
        <div className="dx-lrow__main">
          <span className="dx-lrow__t" style={{ fontSize: '14.5px' }}>{head}</span>
          {meta && <span className="dx-lrow__m">{meta}</span>}
        </div>
        <div className="dx-lrow__tr">
          <span>{when(n.sentAt)}</span>
          {isNew && <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-600)', flexShrink: '0' }} />}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      <div className="dx-drawer" style={{ width: '440px' }} data-testid="notifications">
        <div className="dx-drawer__head" style={{ alignItems: 'center' }}>
          <div className="vstack" style={{ gap: '2px', flex: '1' }}>
            <span className="d-h1" style={{ fontSize: '22px' }}>{"Notifications"}</span>
            <span className="dx-t13" data-testid="unread">{list.data ? (unread.length ? `${unread.length} new` : 'Nothing new') : ''}</span>
          </div>
          {unread.length > 0 && (
            <Btn className="x-link" busy={markAll.pending} testId="mark-all-read" onClick={() => void markAll.run(unread.map(n => n.id))}>{"Mark all read"}</Btn>
          )}
          <span className="dx-close" data-lk="C"><Ic n="x" /></span>
        </div>
        <div className="hstack" style={{ padding: '14px 26px 10px' }}>
          <div className="dx-tabs">
            {([['all', 'All'], ['needs', 'Needs you'], ['plans', 'Plans']] as Array<[Tab, string]>).map(([k, label]) => (
              <span key={k} className={`dx-tab${tab === k ? ' is-on' : ' lv-click'}`} role="tab" tabIndex={0} aria-selected={tab === k}
                onClick={e => { e.stopPropagation(); setTab(k); }} onKeyDown={e => { if (e.key === 'Enter') setTab(k); }}>
                {label} <b>{counts[k]}</b>
              </span>
            ))}
          </div>
        </div>
        <ErrorBanner error={list.error ?? markAll.error} onRetry={list.refresh} />
        <div className="vstack" style={{ gap: '0', flex: '1', minHeight: '0', overflow: 'auto' }}>
          {!list.data && !list.error && <Skeleton rows={4} label="Loading notifications…" />}
          {list.data && shown.length === 0 && <Empty title="No notifications" text={tab === 'all' ? 'Nothing has been sent to you yet.' : 'Nothing in this tab.'} icon="bell" />}
          {fresh.length > 0 && <div className="dx-grp" style={{ padding: '0 26px' }}>{"New"}</div>}
          {fresh.map(row)}
          {earlier.length > 0 && <div className="dx-grp" style={{ padding: '0 26px' }}>{earlier.every(n => fmtDay(n.sentAt) === today) ? 'Earlier today' : 'Earlier'}</div>}
          {earlier.map(row)}
        </div>
        <div className="dx-drawer__foot" data-lk="L57">
          <span className="dx-t13">{"Phone alerts follow your on-call rules"}</span>
          <span className="spacer" />
          <span className="d-btn"><Ic n="cog" />{"Alert rules"}</span>
        </div>
      </div>
    </>
  );
}

export default function LiveDsp14NotificationsPanel() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-14 Notifications panel · desktop">
      <div className="d-app">
        <PlanSide active="N0" />
        <div className="dx-main" />
      </div>
      <NotificationsDrawer />
    </div>
  );
}
