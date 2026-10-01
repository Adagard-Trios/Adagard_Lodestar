'use client';
// The faces' navigation chrome, taken from the design boards (Plan and Admin sidebars, Store desk top bar), with
// live counts and the signed-in user. The sidebar items keep the design's data-lk codes (N0, N1, …), which
// ScreenShell resolves through the screen's own link table, so navigation is exactly the prototype's.
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { initials } from '@/lib/auth/session';
import { DEPOT_NAME, BRAND_LETTER, dayFilter, fmtDay, fmtTime } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import { useEntity } from '@/lib/odata/hooks';
import type { Outlet } from '@/lib/odata/types';
import { depotFilter, useDepot, useRunDate } from '@/lib/workday';
import { Ic, type IconName } from './icons';

/** `$count` of a set with a filter (null = don't ask). Cached per key by useQuery's identity. */
export function useCount(set: string, filter: string | undefined | null, refreshOn?: string[]) {
  const q = useQuery<number>(filter === null ? null : `count:${set}:${filter ?? ''}`, async c => {
    const page = await c.list(set, { filter: filter ?? undefined, top: 0, count: true });
    return page.count ?? page.value.length;
  }, { refreshOn });
  return q.data;
}

type SideItem = { code: string; icon: IconName; label: string; count?: number; tone?: 'warn' | 'bad' } | { sect: string };

// Every item carries its data-lk code, the active one too: ScreenShell only wires codes in the screen's link table
// (some sub-screens link their active item back to the section's main screen).
function SideItems({ items, active }: { items: SideItem[]; active: string }) {
  return (
    <>
      {items.map((it, i) =>
        'sect' in it ? (
          <div key={`s${i}`} className="d-side__sect">{it.sect}</div>
        ) : (
          <div key={it.code} className={`d-side__item${it.code === active ? ' is-on' : ''}`} data-lk={it.code}>
            <Ic n={it.icon} />
            {it.label}
            {it.count !== undefined && it.count > 0 && (
              <span className={`d-side__count${it.tone === 'warn' ? ' d-side__count--warn' : it.tone === 'bad' ? ' dx-count--bad' : ''}`}>{it.count}</span>
            )}
          </div>
        ),
      )}
    </>
  );
}

function SideFoot({ role, avatarStyle }: { role: string; avatarStyle?: React.CSSProperties }) {
  const { session, logout } = useAuth();
  const name = session?.name ?? '';
  return (
    <div className="d-side__foot">
      <span className="d-avatar" style={avatarStyle}>{initials(name)}</span>
      <div className="vstack" style={{ gap: '0', minWidth: '0' }}>
        <b style={{ whiteSpace: 'nowrap' }}>{name}</b>
        <span className="t-3" style={{ whiteSpace: 'nowrap' }}>{role}</span>
        <span
          className="t-3 lv-click"
          role="button"
          tabIndex={0}
          style={{ textDecoration: 'underline' }}
          onClick={e => { e.stopPropagation(); void logout(); }}
          onKeyDown={e => { if (e.key === 'Enter') void logout(); }}
        >
          Sign out
        </span>
      </div>
    </div>
  );
}

/** Lodestar Plan sidebar (DSP boards). `active` is the item's code: N0 Today … N9 Settings. */
export function PlanSide({ active, bellLk }: { active: string; bellLk?: string }) {
  const { depot, depots, setDepot, active: inView } = useDepot();
  const { runDate } = useRunDate('Plans');
  const scope = depotFilter('outlet/depot', inView);
  const cutoff = useCount('Orders', runDate ? [dayFilter('runDate', runDate), "status eq 'RECEIVED'", scope].filter(Boolean).join(' and ') : null, ['notification']);
  const deferrals = useCount('Deferrals', "status eq 'SUGGESTED'", ['notification']);
  const items: SideItem[] = [
    { code: 'N0', icon: 'home', label: 'Today' },
    { code: 'N1', icon: 'list', label: 'Cutoff queue', count: cutoff },
    { code: 'N2', icon: 'grid', label: 'Plan board' },
    { code: 'N3', icon: 'history', label: 'Deferrals', count: deferrals, tone: 'warn' },
    { code: 'N4', icon: 'navigate', label: 'Live operations' },
    { code: 'N5', icon: 'alert', label: 'Exceptions' },
    { code: 'N6', icon: 'chart', label: 'Capacity outlook' },
    { sect: 'Records' },
    { code: 'N7', icon: 'truck', label: 'Fleet & outlets' },
    { code: 'N8', icon: 'sparkle-plus', label: 'Intelligence' },
    { code: 'N9', icon: 'cog', label: 'Settings' },
  ];
  return (
    <aside className="d-side">
      <div className="d-side__brand" style={{ whiteSpace: 'nowrap', paddingRight: '0' }}>
        <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></g></svg>
        Lodestar Plan
        <span className="dx-bell" {...(bellLk ? { 'data-lk': bellLk } : {})}><Ic n="bell" /></span>
      </div>
      <SideItems items={items} active={active} />
      <div className="d-side__sect">Depots</div>
      {depots.map(d => (
        <div
          key={d}
          className={`d-side__item lv-click${depot === d ? ' is-on' : ''}`}
          style={depot === d ? undefined : { color: 'var(--text)' }}
          role="button"
          tabIndex={0}
          aria-pressed={depot === d}
          title={depot === d ? 'Show all your depots' : `Show ${DEPOT_NAME[d] ?? d} only`}
          onClick={e => { e.stopPropagation(); setDepot(depot === d ? null : d); }}
          onKeyDown={e => { if (e.key === 'Enter') setDepot(depot === d ? null : d); }}
        >
          <Ic n="depot" />
          {DEPOT_NAME[d] ?? d}
        </div>
      ))}
      <SideFoot role={`Dispatcher · ${depots.length} depot${depots.length === 1 ? '' : 's'}`} />
    </aside>
  );
}

/** Lodestar Admin sidebar (ADM boards). `active`: N0 Overview … N11 Notifications. */
export function AdminSide({ active }: { active: string }) {
  const requests = useCount('Devices', "status eq 'PENDING'");
  const people = useCount('Users', undefined);
  const revoked = useCount('Devices', "status eq 'REVOKED'");
  const outlets = useCount('Outlets', undefined);
  const vehicles = useCount('Vehicles', undefined);
  const items: SideItem[] = [
    { code: 'N0', icon: 'home', label: 'Overview' },
    { code: 'N1', icon: 'key', label: 'Access requests', count: requests, tone: 'warn' },
    { code: 'N2', icon: 'people', label: 'People and roles', count: people },
    { code: 'N3', icon: 'phone', label: 'Devices', count: revoked, tone: 'bad' },
    { sect: 'Master data' },
    { code: 'N4', icon: 'store', label: 'Outlets', count: outlets },
    { code: 'N5', icon: 'truck', label: 'Vehicles', count: vehicles },
    { code: 'N6', icon: 'sliders', label: 'Operating rules' },
    { code: 'N7', icon: 'calendar', label: 'Calendar' },
    { sect: 'Data and trust' },
    { code: 'N8', icon: 'upload', label: 'Data imports' },
    { code: 'N9', icon: 'history', label: 'Audit log' },
    { code: 'N10', icon: 'sparkle-plus', label: 'Planning agent' },
    { code: 'N11', icon: 'message', label: 'Notifications' },
  ];
  return (
    <aside className="d-side">
      <div className="d-side__brand" style={{ whiteSpace: 'nowrap' }}>
        <svg width="28" height="28" viewBox="0 0 32 32" style={{ flexShrink: '0' }}><rect width="32" height="32" rx="8" fill="#334155" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></g></svg>
        Lodestar Admin
      </div>
      <SideItems items={items} active={active} />
      <SideFoot role="Systems admin" avatarStyle={{ background: '#334155', color: '#FFFFFF' }} />
    </aside>
  );
}

const STORE_NAV: Array<{ key: string; icon: IconName; label: string; href: string }> = [
  { key: 'order', icon: 'plus', label: 'Order', href: '/store/sm-01-place-order' },
  { key: 'deliveries', icon: 'van-2', label: 'Deliveries', href: '/store/sm-02-deliveries' },
  { key: 'receipts', icon: 'check', label: 'Receipts', href: '/store/sm-28-receipts-and-credit-notes' },
  { key: 'messages', icon: 'message', label: 'Messages', href: '/store/sm-29-messages' },
];

/** The store manager's outlet (from the token's outlet_id claim). */
export function useMyOutlet() {
  const { session } = useAuth();
  return useEntity<Outlet>('Outlets', session?.outletId ?? null);
}

/** Lodestar Store top bar (SM boards). `avatarLk` keeps the design's link on the avatar where it has one. */
export function StoreTop({ active, avatarLk, extra }: { active: string; avatarLk?: string; extra?: ReactNode }) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const outlet = useMyOutlet();
  const unread = useCount('Notifications', 'readAt eq null', ['notification', 'credit_note_issued', 'eta_update']);
  const o = outlet.data;
  return (
    <div className="s-top">
      <div className="s-top__brand">
        <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v8h14v-8M10 21v-5h4v5" /></g></svg>
        Lodestar Store
      </div>
      <div className="s-top__outlet">
        <span className={`bb bb--${(o?.brand ?? 'FRESH').toLowerCase()}`}>{BRAND_LETTER[o?.brand ?? 'FRESH']}</span>
        {o?.name ?? (outlet.loading ? 'Loading outlet…' : 'Your outlet')}
        <span className="id">{session?.outletId}</span>
      </div>
      <div className="s-top__nav">
        {STORE_NAV.map(n => (
          <span
            key={n.key}
            className={`s-top__i${n.key === active ? ' is-on' : ' lv-click'}`}
            role={n.key === active ? undefined : 'link'}
            tabIndex={n.key === active ? undefined : 0}
            onClick={n.key === active ? undefined : e => { e.stopPropagation(); router.push(n.href); }}
            onKeyDown={n.key === active ? undefined : e => { if (e.key === 'Enter') router.push(n.href); }}
          >
            <Ic n={n.icon} />
            {n.label}
            {n.key === 'messages' && unread ? <span className="s-top__count">{unread}</span> : null}
          </span>
        ))}
      </div>
      <div className="spacer" />
      {extra}
      <span className="s-top__clock">{fmtDay(new Date())} · {fmtTime(new Date())}</span>
      <div className="m-iconbtn lv-click" title="Sign out" role="button" tabIndex={0} onClick={e => { e.stopPropagation(); void logout(); }}>
        <Ic n="log-in" />
      </div>
      <span className="d-avatar" {...(avatarLk ? { 'data-lk': avatarLk } : {})} title={session?.name}>{initials(session?.name ?? '')}</span>
    </div>
  );
}
