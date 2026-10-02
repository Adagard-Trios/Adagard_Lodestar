'use client';
// ADM-18 Notifications and integrations, live. Markup and classes from the generated design
// (frontend/screens/adm-18-notifications-and-integrations.tsx).
// Lodestar reaches people only through its apps: every Notification is stored and pushed over the realtime hub
// (notifications.service.ts). So the one channel drawn is "App push": today's Notifications count and whether
// the hub is connected (this page's own socket goes through the same gateway).
// Not drawn: SMS gateway, email relay and voice-call codes (no such integrations), "Delayed today" (no delivery
// receipts), the voice-call fallback rule, "Send a test" (SMS, email and voice only) and "Who gets what" (no
// routing settings): the backend has none of them.
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { fmtNum, daysAgo } from '@/lib/format';
import { useRealtimeStatus } from '@/lib/odata/hooks';

export default function LiveAdm18NotificationsAndIntegrations() {
  const today = useCount('Notifications', `sentAt ge ${daysAgo(0)}T00:00:00Z`, ['notification']);
  const hub = useRealtimeStatus();
  const up = hub === 'connected';
  const state = up ? 'Up' : hub === 'offline' ? 'Down' : 'Connecting';

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-18 Notifications and integrations · desktop">
      <div className="d-app">
        <AdminSide active="N11" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Trust "}<span className="m-sep" />{" outbound messages"}</div>
              <div className="d-h1">{"Notifications and integrations"}</div>
            </div>
          </div>
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card" style={{ flex: '1.15' }} data-testid="channels">
              <div className="dx-card__head">
                <span className="dx-card__title">{"Channels"}</span>
                <span className="spacer" />
                <span className={`m-tag ${up ? 'm-tag--ok' : 'm-tag--warn'}`}><span className="dot" />{up ? 'All up' : state}</span>
              </div>
              <div className="dx-lrow" style={{ minHeight: '86px' }} data-channel="push">
                <span className="dx-lead" style={{ width: '44px', height: '44px' }}><Ic n="bell" /></span>
                <div className="dx-lrow__main">
                  <span className="dx-lrow__t">{"App push"}</span>
                  <span className="dx-lrow__m">{"Plan, Dock, Run and Store alerts"}</span>
                </div>
                <div className="dx-lrow__tr">
                  <span className={`m-tag ${up ? 'm-tag--ok' : 'm-tag--warn'}`}><span className="dot" />{state}</span>
                  <span>{today === undefined ? '…' : `${fmtNum(today)} today`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
