'use client';
// SM-30 Settings, live. Markup and classes from the generated design (frontend/screens/sm-30-settings.tsx).
// Data: the store's outlet (Outlets: dock type, parking, window, access note "as drivers see it") and the store
// manager's own preferences (Users/Lodestar.MyPreferences / SaveMyPreferences): receiving staff and the time they
// are at the door, notification channels per topic (app / SMS) and the language of this desk. "Short or moved
// orders" is always on (locked), as designed. "Save changes" saves and goes to Deliveries (the design's L139).
// "Users & access" shows the signed-in manager and this browser's session (sign out ends it); store staff have no
// Lodestar accounts of their own, so "Invite" and "Request a change" carry no action (no endpoint).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/live/Btn';
import { StoreTop, useMyOutlet } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { type Channels, type Preferences, type ReceivingStaff, type StoreTopic, usePreferences } from '@/components/live/settings-data';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DEPOT_NAME, fmtDayTime } from '@/lib/format';

const TOPICS: Array<{ k: StoreTopic; label: string; sub: string; def: Channels }> = [
  { k: 'arrivalWindow', label: 'Arrival window', sub: 'by 7 PM the evening before', def: { app: true, sms: true } },
  { k: 'vanOnTheWay', label: 'Van on the way', sub: 'live from departure', def: { app: true, sms: false } },
  { k: 'cutoffReminder', label: 'Cutoff reminder', sub: '3:00 PM if not ordered', def: { app: true, sms: false } },
  { k: 'creditNotes', label: 'Credit notes', sub: 'when raised and matched', def: { app: true, sms: false } },
];
const LANGS: Array<[NonNullable<Preferences['language']>, string, string]> = [['en', 'English', ''], ['si', 'සිංහල', ' vo-si'], ['ta', 'தமிழ்', ' vo-ta']];
const DOCK: Record<string, string> = { REAR_DOCK: 'Rear dock', STREET: 'Street', MALL_BAY: 'Mall bay' };
const PARKING: Record<string, string> = { NORMAL: 'normal access', VAN_ONLY: 'vans only', MALL_DOCK: 'mall dock' };
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
const clock = (v: string) => { const [h, m] = v.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

function Tg({ on, locked, label, onChange }: { on: boolean; locked?: boolean; label: string; onChange?: (v: boolean) => void }) {
  const cls = `sx-tg${on ? ' is-on' : ''}${locked ? ' is-lock' : ''}`;
  if (locked || !onChange) return <div className={cls} role="switch" aria-checked={on} aria-label={label}><div /></div>;
  return (
    <div className={`${cls} lv-click`} role="switch" aria-checked={on} aria-label={label} tabIndex={0}
      onClick={e => { e.stopPropagation(); onChange(!on); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!on); } }}>
      <div />
    </div>
  );
}

export default function LiveSm30Settings() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const outlet = useMyOutlet();
  const prefs = usePreferences();
  // Local edits on top of the saved preferences; null = nothing edited.
  const [edit, setEdit] = useState<Preferences | null>(null);
  const draft: Preferences | null = edit ?? prefs.data ?? null;
  const setDraft = (next: Preferences | ((d: Preferences | null) => Preferences)) =>
    setEdit(e => (typeof next === 'function' ? next(e ?? prefs.data ?? null) : next));
  const [adding, setAdding] = useState<ReceivingStaff | null>(null);
  const o = outlet.data;
  const staff = draft?.receiving?.staff ?? [];
  const staffFrom = draft?.receiving?.staffFrom ?? '';
  const lang = draft?.language ?? 'en';
  const channels = (t: (typeof TOPICS)[number]) => ({ ...t.def, ...(draft?.notifications?.[t.k] ?? {}) });
  const setChannel = (t: (typeof TOPICS)[number], ch: keyof Channels, v: boolean) =>
    setDraft(d => ({ ...(d ?? {}), notifications: { ...(d?.notifications ?? {}), [t.k]: { ...channels(t), [ch]: v } } }));
  const setReceiving = (r: NonNullable<Preferences['receiving']>) => setDraft(d => ({ ...(d ?? {}), receiving: { ...(d?.receiving ?? {}), ...r } }));
  const dirty = edit !== null && JSON.stringify(edit) !== JSON.stringify(prefs.data ?? {});
  const save = () => void prefs.save.run({
    receiving: draft?.receiving ?? {},
    notifications: Object.fromEntries(TOPICS.map(t => [t.k, channels(t)])),
    language: lang,
  })
    .then(r => { if (r) { setEdit(null); router.push('/store/sm-02-deliveries'); } });

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-30 Settings · desktop">
      <div className="s-shell">
        <StoreTop active="settings" />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {o?.name ?? 'Your outlet'}{" "}<span className="m-sep" />{` ${session?.outletId ?? ''} `}
                {o && <><span className="m-sep" />{` ${DEPOT_NAME[o.depot] ?? o.depot}`}</>}
              </div>
              <div className="d-h1">{"Settings"}</div>
            </div>
            <Btn className="d-btn d-btn--ghost" disabled={!dirty} onClick={() => { setEdit(null); setAdding(null); }}>{"Discard"}</Btn>
            <Btn className="d-btn d-btn--primary" lk="L139" busy={prefs.save.pending} disabled={!draft} onClick={save}>{"Save changes"}</Btn>
          </div>
          <ErrorBanner error={prefs.error ?? prefs.save.error ?? outlet.error} onRetry={() => { void prefs.refresh(); void outlet.refresh(); }} />
          <div className="d-split">
            <div className="sx-subnav">
              <span className="d-side__item"><Ic n="store" />{"Store details"}</span>
              <span className="d-side__item is-on"><Ic n="people" />{"Receiving"}</span>
              <span className="d-side__item"><Ic n="bell" />{"Notifications"}</span>
              <span className="d-side__item"><Ic n="key" />{"Users & access"}</span>
              <span className="d-side__item"><Ic n="globe" />{"Language"}</span>
              <div className="d-card" style={{ marginTop: '18px', padding: '16px', gap: '8px' }} data-testid="dock-note">
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-3)' }}>{"Your dock, as drivers see it"}</span>
                <span style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text)' }}>
                  {o ? (o.accessNote || `${DOCK[o.dockType] ?? o.dockType} · ${PARKING[o.parking] ?? o.parking} · window ${o.windowOpen}–${o.windowClose}`) : '…'}
                </span>
                <span className="sx-link" style={{ fontSize: '13px' }}>{"Request a change"}</span>
              </div>
            </div>
            <div className="vstack" style={{ gap: '18px', flex: '1', minWidth: '0' }}>
              <div className="d-card" data-testid="receiving-staff">
                <div className="d-card__head">
                  <span className="d-card__title">{"Receiving staff"}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{`shown to the driver and ${o ? DEPOT_NAME[o.depot] ?? o.depot : 'the depot'}`}</span>
                  <div className="spacer" />
                  <Btn className="d-btn" style={{ height: '34px' }} disabled={!draft || staff.length >= 20} onClick={() => setAdding({ name: '', phone: '', note: '' })}><Ic n="user-plus" />{"Add staff"}</Btn>
                </div>
                {!draft ? <Skeleton rows={3} /> : (
                  <>
                    <div className="sx-set-row">
                      <div className="m-row__lead"><Ic n="clock" /></div>
                      <div className="sx-set-row__main">
                        <b>{"Staff at the door from"}</b>
                        <span>{o ? `window ${o.windowOpen}–${o.windowClose}` : ''}</span>
                      </div>
                      <input className="lv-input sx-chip" type="time" aria-label="Staff at the door from" style={{ width: '120px' }} value={staffFrom}
                        onChange={e => setReceiving({ staffFrom: e.target.value })} />
                    </div>
                    {staff.map((s, i) => (
                      <div key={`${s.name}-${i}`} className="sx-set-row">
                        <span className="sx-set-av">{initials(s.name)}</span>
                        <div className="sx-set-row__main">
                          <b>{s.name}</b>
                          <span>{['Receiver', s.phone, s.note].filter(Boolean).join(' · ')}</span>
                        </div>
                        <Btn className="sx-link" title={`Remove ${s.name}`} onClick={() => setReceiving({ staff: staff.filter((_, j) => j !== i) })}>{"Remove"}</Btn>
                      </div>
                    ))}
                    {staff.length === 0 && !adding && <div className="sx-set-row"><div className="sx-set-row__main"><span>{"No receiving staff yet. Drivers see the names you add here."}</span></div></div>}
                    {adding && (
                      <div className="sx-set-row" data-testid="add-staff">
                        <input className="lv-input" aria-label="Name" placeholder="Name" value={adding.name} onChange={e => setAdding({ ...adding, name: e.target.value })} />
                        <input className="lv-input" aria-label="Phone" placeholder="Phone" value={adding.phone} onChange={e => setAdding({ ...adding, phone: e.target.value })} />
                        <input className="lv-input" aria-label="Note" placeholder="Note (signs for deliveries…)" value={adding.note} onChange={e => setAdding({ ...adding, note: e.target.value })} />
                        <Btn className="d-btn d-btn--primary" disabled={!adding.name.trim()} onClick={() => {
                          setReceiving({ staff: [...staff, { name: adding.name.trim(), ...(adding.phone?.trim() ? { phone: adding.phone.trim() } : {}), ...(adding.note?.trim() ? { note: adding.note.trim() } : {}) }] });
                          setAdding(null);
                        }}>{"Add"}</Btn>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="d-card">
                <div className="d-card__head">
                  <span className="d-card__title">{"Users & access"}</span>
                  <div className="spacer" />
                  <span className="d-btn" style={{ height: '34px' }}><Ic n="user-plus" />{"Invite"}</span>
                </div>
                <div className="sx-set-row">
                  <span className="d-avatar">{initials(session?.name ?? '')}</span>
                  <div className="sx-set-row__main">
                    <b>{session?.name}</b>
                    <span>{"Store manager · orders, receipts, settings"}</span>
                  </div>
                  <span className="m-pill m-pill--brand">{"Owner"}</span>
                </div>
                <div className="sx-set-row">
                  <span className="sx-set-av"><Ic n="grid" /></span>
                  <div className="sx-set-row__main">
                    <b>{"This browser"}</b>
                    <span>{session?.expiresAt ? `Signed in · session renews until ${fmtDayTime(new Date(session.expiresAt * 1000))}` : 'Signed in'}</span>
                  </div>
                  <Btn className="sx-link" style={{ fontSize: '13px' }} onClick={() => void logout()}>{"Sign out"}</Btn>
                </div>
              </div>
            </div>
            <div className="vstack" style={{ gap: '18px', width: '420px', flexShrink: '0' }}>
              <div className="d-card" data-testid="store-notifications">
                <div className="d-card__head">
                  <span className="d-card__title">{"Notifications"}</span>
                  <div className="spacer" />
                  <span className="sx-col-h">{"App"}</span>
                  <span className="sx-col-h">{"SMS"}</span>
                </div>
                {TOPICS.slice(0, 2).map(t => (
                  <div key={t.k} className="sx-set-row">
                    <div className="sx-set-row__main"><b>{t.label}</b><span>{t.sub}</span></div>
                    <div className="sx-col-h"><Tg label={`${t.label} app`} on={!!channels(t).app} onChange={draft ? v => setChannel(t, 'app', v) : undefined} /></div>
                    <div className="sx-col-h"><Tg label={`${t.label} SMS`} on={!!channels(t).sms} onChange={draft ? v => setChannel(t, 'sms', v) : undefined} /></div>
                  </div>
                ))}
                <div className="sx-set-row">
                  <div className="sx-set-row__main"><b>{"Short or moved orders"}</b><span>{"always on, both channels"}</span></div>
                  <div className="sx-col-h"><Tg label="Short or moved orders app" on locked /></div>
                  <div className="sx-col-h"><Tg label="Short or moved orders SMS" on locked /></div>
                </div>
                {TOPICS.slice(2).map(t => (
                  <div key={t.k} className="sx-set-row">
                    <div className="sx-set-row__main"><b>{t.label}</b><span>{t.sub}</span></div>
                    <div className="sx-col-h"><Tg label={`${t.label} app`} on={!!channels(t).app} onChange={draft ? v => setChannel(t, 'app', v) : undefined} /></div>
                    <div className="sx-col-h"><Tg label={`${t.label} SMS`} on={!!channels(t).sms} onChange={draft ? v => setChannel(t, 'sms', v) : undefined} /></div>
                  </div>
                ))}
              </div>
              <div className="d-card">
                <div className="d-card__head"><span className="d-card__title">{"Language"}</span></div>
                <div className="d-card__body">
                  <div className="m-seg" style={{ margin: '0' }} role="radiogroup" aria-label="Language">
                    {LANGS.map(([k, label, cls]) => (
                      <span key={k} className={`m-seg__i${cls}${lang === k ? ' is-on' : ' lv-click'}`} role="radio" aria-checked={lang === k} tabIndex={0}
                        onClick={e => { e.stopPropagation(); setDraft(d => ({ ...(d ?? {}), language: k })); }}
                        onKeyDown={e => { if (e.key === 'Enter') setDraft(d => ({ ...(d ?? {}), language: k })); }}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{`For this desk${staffFrom ? ` · staff at the door from ${clock(staffFrom)}` : ''}. Staff phones keep their own setting.`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
