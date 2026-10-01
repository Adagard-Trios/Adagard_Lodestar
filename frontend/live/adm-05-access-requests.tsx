'use client';
// ADM-05 Access requests, live. Markup and classes from the generated design (frontend/screens/adm-05-access-requests.tsx).
// Access requests are field devices people registered from their own signed-in session (Devices in PENDING):
// a device can't be used until an admin approves it (device posture, PLATFORM.md §2.6).
// Approve: Devices('…')/Lodestar.Activate. Decline: Devices('…')/Lodestar.Revoke {reason}. Both are audited.
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { ROLE_INFO } from '@/components/live/admin-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, daysAgo, fmtDay, fmtDayTime, fmtTime } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Device } from '@/lib/odata/types';

type Tab = 'open' | 'resolved';

export default function LiveAdm05AccessRequests() {
  const [tab, setTab] = useState<Tab>('open');
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const open = useQuery<Device[]>('adm-requests', c => c.all<Device>('Devices', { filter: "status eq 'PENDING'", expand: 'user', orderby: 'registeredAt' }), { refreshOn: ['notification'] });
  const resolved = useQuery<Device[]>('adm-resolved', async c =>
    (await c.list<Device>('Devices', { filter: `status ne 'PENDING' and updatedAt ge ${daysAgo(0)}T00:00:00Z`, expand: 'user($select=name)', orderby: 'updatedAt desc', top: 10 })).value);
  const rows = tab === 'open' ? open.data ?? [] : resolved.data ?? [];
  const sel = rows.find(d => d.id === selId) ?? rows[0];
  const after = () => { void open.refresh(); void resolved.refresh(); setNote(''); setSelId(null); };
  const approve = useAction<string, Device>((c, id) => c.action<Device>('Devices', id, 'Activate'), { onSuccess: after });
  const decline = useAction<string, Device>((c, id) => c.action<Device>('Devices', id, 'Revoke', { reason: note.trim() }), { onSuccess: after });
  const oldest = open.data?.[0];

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-05 Access requests · desktop">
      <div className="d-app">
        <AdminSide active="N1" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Access requests "}<span className="m-sep" />{` ${open.data?.length ?? '…'} open `}{oldest && <><span className="m-sep" />{` oldest ${fmtDayTime(oldest.registeredAt)}`}</>}</div>
              <div className="d-h1">{"Access requests"}</div>
              <div className="d-sub">{"Devices people registered for the Dock and Run apps. Nothing can sign in on them until you approve, and every decision is logged."}</div>
            </div>
          </div>
          <ErrorBanner error={open.error ?? resolved.error ?? approve.error ?? decline.error} onRetry={() => { void open.refresh(); void resolved.refresh(); }} />
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card" style={{ width: '420px', flexShrink: '0' }} data-testid="requests">
              <div className="dx-card__head">
                <div className="dx-tabs">
                  {([['open', 'Open', open.data?.length], ['resolved', 'Resolved today', resolved.data?.length]] as Array<[Tab, string, number | undefined]>).map(([k, l, n]) => (
                    <span key={k} className={`dx-tab lv-click${tab === k ? ' is-on' : ''}`} role="tab" aria-selected={tab === k} tabIndex={0}
                      onClick={e => { e.stopPropagation(); setTab(k); setSelId(null); }} onKeyDown={e => { if (e.key === 'Enter') setTab(k); }}>{l} <b>{n ?? '…'}</b></span>
                  ))}
                </div>
              </div>
              {!open.data && !open.error && <Skeleton rows={3} />}
              {(tab === 'open' ? open.data : resolved.data)?.length === 0 && <Empty title={tab === 'open' ? 'No open requests' : 'Nothing resolved today'} text={tab === 'open' ? 'Every registered device has been decided.' : undefined} />}
              {rows.map(d => (
                <div key={d.id} className={`dx-lrow lv-click${sel?.id === d.id ? ' dx-lrow--sel' : ''}`} style={{ minHeight: '74px', ...(tab === 'resolved' ? { opacity: '.75' } : {}) }} data-device={d.id}
                  role="button" tabIndex={0} onClick={e => { e.stopPropagation(); setSelId(d.id); }} onKeyDown={e => { if (e.key === 'Enter') setSelId(d.id); }}>
                  <span className="dx-lead"><Ic n={d.platform === 'web' ? 'tablet' : 'phone'} /></span>
                  <div className="dx-lrow__main"><span className="dx-lrow__t">{d.label ?? d.model ?? 'New device'}</span><span className="dx-lrow__m">{d.user?.name ?? d.userId} · {d.id}</span></div>
                  <div className="dx-lrow__tr">
                    <span>{fmtTime(d.registeredAt)}</span>
                    {tab === 'open' ? <span className="m-tag m-tag--warn"><span className="dot" />{"Waiting"}</span> : <span className={`m-tag ${d.status === 'ACTIVE' ? 'm-tag--ok' : 'm-tag--bad'}`}><span className="dot" />{d.status === 'ACTIVE' ? 'Approved' : 'Declined'}</span>}
                  </div>
                </div>
              ))}
              <div className="dx-grp">{"Where requests come from"}</div>
              <div className="dx-card__body" style={{ paddingTop: '12px', gap: '8px' }}>
                <span className="dx-t13">{"Dock bay tablets and Run driver phones register themselves after their user signs in; store and plan staff use the desk website."}</span>
              </div>
            </div>
            <div className="dx-card" style={{ flex: '1' }}>
              {!sel ? <Empty title="Nothing selected" icon="key" /> : (
                <>
                  <div className="dx-card__head" style={{ minHeight: '74px' }}>
                    <span className="dx-lead"><Ic n="phone" /></span>
                    <div className="vstack" style={{ gap: '2px', flex: '1', minWidth: '0' }}>
                      <span className="dx-card__title" style={{ fontSize: '19px' }}>{sel.label ?? sel.model ?? sel.id} for {sel.user?.name ?? sel.userId}</span>
                      <span className="dx-t13">
                        {sel.user ? `${ROLE_INFO[sel.user.role]?.label ?? sel.user.role} · ${sel.user.outletId ?? DEPOT_NAME[sel.user.depot ?? ''] ?? ''} · ` : ''}device {sel.id} · {sel.platform ?? 'unknown platform'} · {fmtDayTime(sel.registeredAt)}
                      </span>
                    </div>
                  </div>
                  <div className="dx-card__body" style={{ gap: '14px' }}>
                    <div className="hstack" style={{ gap: '12px' }}>
                      <div className="adm-diff"><span className="adm-diff__l">{"Device"}</span><span className="adm-diff__v">{sel.model ?? '—'}</span></div>
                      <Ic n="arrow-right" />
                      <div className="adm-diff adm-diff--new"><span className="adm-diff__l">{"Bound to"}</span><span className="adm-diff__v">{sel.user?.email ?? sel.userId}</span></div>
                    </div>
                    <div className="dx-inset" style={{ gap: '0', padding: '6px 16px' }}>
                      <div className="dx-step"><span className="dx-step__i dx-step__i--ok"><Ic n="check" /></span><span>{"Registered from the person's own signed-in session"}</span><span className="dx-step__v">{fmtDay(sel.registeredAt)}</span></div>
                      <div className="dx-step">
                        <span className={`dx-step__i ${sel.status === 'PENDING' ? 'dx-step__i--wait' : 'dx-step__i--ok'}`}>{sel.status === 'PENDING' ? null : <Ic n="check" />}</span>
                        <span>{"Device tokens carry its device_id; the services check it on every call"}</span>
                        <span className="dx-step__v">{sel.status === 'PENDING' ? 'after approval' : sel.status.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="dx-t14">{"On approval the device can sign in at once. A lost device is revoked from Devices, which also ends its Keycloak sessions."}</div>
                    {tab === 'open' && (
                      <>
                        <div className="dx-field">
                          <span className="dx-label">Decision note <span className="t-3" style={{ fontWeight: '600' }}>{"(required to decline)"}</span></span>
                          <div className="x-textarea" style={{ background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}>
                            <textarea className="lv-input" aria-label="Decision note" value={note} onChange={e => setNote(e.target.value)} placeholder="How you verified the request" />
                          </div>
                        </div>
                        <div className="hstack" style={{ gap: '10px', marginTop: '2px' }}>
                          <span className="spacer" />
                          <Btn className="d-btn" testId="decline" busy={decline.pending} disabled={!note.trim()} onClick={() => void decline.run(sel.id)}><Ic n="x" />{"Decline with reason"}</Btn>
                          <Btn className="d-btn d-btn--primary" testId="approve-device" busy={approve.pending} onClick={() => void approve.run(sel.id)}><Ic n="check" />{"Approve device"}</Btn>
                        </div>
                      </>
                    )}
                    <div className="dx-hair" />
                    <div className="hstack" style={{ gap: '28px', fontSize: '13px', color: 'var(--text-2)' }}>
                      <span>Account since <b style={{ color: 'var(--text)' }}>{sel.user?.createdAt ? fmtDay(sel.user.createdAt) : '—'}</b></span>
                      <span>Status <b style={{ color: 'var(--text)' }}>{sel.status.toLowerCase()}</b></span>
                      <span className="x-link" data-lk="L291">{"People and roles"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
