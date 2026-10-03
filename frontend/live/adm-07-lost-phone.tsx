'use client';
// ADM-07 Lost phone, live. Markup and classes from the generated design (frontend/screens/adm-07-lost-phone.tsx).
// Revokes a device: Devices('…')/Lodestar.Revoke {reason}. auth disables the device and ends its Keycloak
// sessions (PLATFORM.md §2.6); the field app can no longer get a token for it. The records still on the phone
// are the person's OfflineEvents not yet synced.
import { useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { AdminSide, adminChanged } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { ROLE_INFO } from '@/components/live/admin-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtClock, fmtDayTime } from '@/lib/format';
import { useAction, useEntity, useQuery } from '@/lib/odata/hooks';
import type { Device, OfflineEvent } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

/** The lost phone drawer: over the page it was opened from (OverlayHost), or on its own route over the page's head. */
export function LostPhoneDrawer({ onClose }: { onClose?: () => void }) {
  const { name: depotName } = useDepots();
  const nav = useScreenNav();
  const [focus, setFocus] = useFocusId('device');
  const choices = useQuery<Device[]>('lost-choices', async c => (await c.list<Device>('Devices', { filter: "status eq 'ACTIVE'", expand: 'user($select=name)', orderby: 'lastSeenAt desc', top: 50 })).value);
  const id = focus ?? choices.data?.[0]?.id ?? null;
  const device = useEntity<Device>('Devices', id, { expand: 'user' });
  const d = device.data;
  const waiting = useQuery<OfflineEvent[]>(d ? `lost-events:${d.userId}` : null, async c =>
    (await c.list<OfflineEvent>('OfflineEvents', { filter: `driverId eq '${d!.userId}' and syncedAt eq null`, orderby: 'savedAt', top: 50 })).value);
  const [reason, setReason] = useState('');
  const revoke = useAction<void, Device>(c => c.action<Device>('Devices', id!, 'Revoke', { reason: reason.trim() }), {
    onSuccess: () => { adminChanged(); nav.notify(`${id} revoked. Its sessions are signed out.`); nav.go('L293'); },
  });
  const n = waiting.data?.length ?? 0;

  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      <div className="dx-drawer" style={{ width: '620px' }} role="dialog" aria-modal="true" aria-labelledby="lost-title">
        <div className="dx-drawer__head">
          <span className="dx-lead dx-lead--bad" style={{ width: '44px', height: '44px' }}><Ic n="phone" /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1' }}>
            <span className="d-eyebrow">{d ? `${d.label ?? d.model ?? 'Device'} · ${d.id}${d.platform ? ` · ${d.platform}` : ''}` : 'Device'}</span>
            <span className="dx-card__title" style={{ fontSize: '20px' }} id="lost-title">{d?.status === 'REVOKED' ? 'Device already revoked' : 'Phone reported lost'}</span>
            <span className="dx-t13">
              {d?.user ? `${d.user.name} · ${ROLE_INFO[d.user.role]?.label ?? d.user.role}${d.user.depot ? ` · ${depotName(d.user.depot)}` : ''}` : ''}
              {d?.lastSeenAt ? ` · last seen ${fmtDayTime(d.lastSeenAt)}` : ''}
            </span>
          </div>
          <span className="dx-close" data-lk="C"><Ic n="x" /></span>
        </div>
        <div className="dx-drawer__body">
          <div className="dx-field">
            <span className="dx-label">{"Device"}</span>
            <div className="dx-input dx-input--sm">
              <Ic n="phone" />
              <select className="lv-input" aria-label="Device" value={id ?? ''} onChange={e => setFocus(e.target.value || null)}>
                {d && !(choices.data ?? []).some(c => c.id === d.id) && <option value={d.id}>{d.id} · {d.label ?? d.model}</option>}
                {(choices.data ?? []).map(c => <option key={c.id} value={c.id}>{c.id} · {c.label ?? c.model ?? ''} · {c.user?.name ?? c.userId}</option>)}
              </select>
            </div>
          </div>
          <ErrorBanner error={device.error ?? choices.error} onRetry={device.refresh} />
          {!d && !device.error && (choices.data?.length === 0 ? <Empty title="No active devices" icon="phone" /> : <Skeleton rows={3} />)}
          {d && (
            <>
              <div className={`dx-hero${n ? ' dx-hero--bad' : ''}`} style={{ gap: '6px', padding: '16px 18px', borderRadius: '18px' }} data-testid="records-waiting">
                <div className="dx-hero__l"><Ic n="alert" className="ic ic--sm" />{waiting.data ? `${n} record${n === 1 ? ' exists' : 's exist'} only on that phone` : 'Checking what is still on that phone…'}</div>
                <ErrorBanner error={waiting.error} onRetry={waiting.refresh} compact />
                <div className="dx-hero__m">
                  {!waiting.data ? null : n ? <>{waiting.data!.map(e => `${e.eventType.toLowerCase().replace('_', ' ')} ${fmtClock(e.savedAt)}`).join(' · ')}. They sync if the phone finds signal before it is wiped.</> : 'Everything on this device has reached Lodestar.'}
                </div>
              </div>
              <div className="dx-sech"><b>{"What happens to the phone"}</b></div>
              <div className="adm-opt is-on">
                <span className="dx-radio is-on" style={{ marginTop: '2px' }} />
                <div className="vstack" style={{ gap: '4px', flex: '1' }}>
                  <div className="hstack" style={{ gap: '8px' }}>
                    <b style={{ fontSize: '15px' }}>{"Revoke sign-in"}</b>
                    <span className="m-tag m-tag--ok"><Ic n="check" />{"Recommended"}</span>
                  </div>
                  <span className="dx-t13" style={{ color: 'var(--text-2)' }}>{"Nobody can open Lodestar on it from now: the device is disabled and its Keycloak sessions are ended."}</span>
                </div>
              </div>
              <div className="dx-inset dx-inset--info" style={{ flexDirection: 'row', gap: '10px', padding: '12px 14px' }}>
                <Ic n="info" className="ic ic--sm" />
                <span className="dx-t13" style={{ color: 'var(--text-2)' }}>{"The person keeps working on a spare phone once you approve it. The rest of the run is on the server, so it downloads again."}</span>
              </div>
              <div className="dx-field">
                <span className="dx-label">Audit note <span style={{ color: 'var(--st-exception-fg)' }}>{"required"}</span></span>
                <div className="x-textarea" style={{ background: '#FFFFFF', boxShadow: 'inset 0 0 0 2px var(--brand-600), 0 0 0 4px var(--tint-brand)' }}>
                  <textarea className="lv-input" aria-label="Audit note" value={reason} onChange={e => setReason(e.target.value)} placeholder="Where it was lost, who reported it, what replaces it" />
                </div>
              </div>
              <ErrorBanner error={revoke.error} />
            </>
          )}
        </div>
        <div className="dx-drawer__foot">
          <span className="dx-t13" style={{ flex: '1' }}>{"Signed and chained in the audit log"}</span>
          <span className="d-btn d-btn--ghost" data-lk="C">{"Cancel"}</span>
          <Btn className="d-btn d-btn--primary" testId="revoke" busy={revoke.pending} disabled={!d || d.status === 'REVOKED' || !reason.trim()} onClick={() => void revoke.run()}>
            <Ic n="ban" />{"Revoke sign-in"}
          </Btn>
        </div>
      </div>
    </>
  );
}

export default function LiveAdm07LostPhone() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-07 Lost phone · desktop">
      <div className="d-app">
        <AdminSide active="N3" />
        <div className="dx-main">
          <div className="d-head"><div className="d-head__txt"><div className="d-eyebrow">{"Devices"}</div><div className="d-h1">{"Devices"}</div></div></div>
        </div>
      </div>
      <LostPhoneDrawer />
    </div>
  );
}
