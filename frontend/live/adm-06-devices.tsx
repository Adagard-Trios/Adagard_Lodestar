'use client';
// ADM-06 Devices, live. Markup and classes from the generated design (frontend/screens/adm-06-devices.tsx).
// Data: Devices with their user (paged, filters, $search on id/label/model) and the OfflineEvents not yet synced
// per person (records waiting on a phone). A row opens the lost-phone flow (ADM-07) for that device.
import { useMemo, useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { ROLE_INFO } from '@/components/live/admin-data';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { DEPOT_NAME, fmtClock, fmtDay, fmtTime } from '@/lib/format';
import { useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { Device, OfflineEvent } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Filter = 'all' | 'waiting' | 'pending' | 'revoked';

export default function LiveAdm06Devices() {
  const [, setFocus] = useFocusId('device');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const unsynced = useQuery<OfflineEvent[]>('adm-unsynced', c => c.all<OfflineEvent>('OfflineEvents', { filter: 'syncedAt eq null', select: 'id,driverId' }));
  const queued = useMemo(() => (unsynced.data ?? []).reduce<Record<string, number>>((m, e) => ({ ...m, [e.driverId]: (m[e.driverId] ?? 0) + 1 }), {}), [unsynced.data]);
  const waitingUsers = Object.keys(queued);
  const filterExpr: Record<Filter, string | undefined> = {
    all: undefined,
    waiting: waitingUsers.length ? `userId in (${waitingUsers.map(u => `'${u}'`).join(',')})` : "id eq '__none__'",
    pending: "status eq 'PENDING'",
    revoked: "status eq 'REVOKED'",
  };
  const devices = useEntitySet<Device>('Devices', { filter: filterExpr[filter], expand: 'user($select=name,role,depot,outletId)', orderby: 'registeredAt desc', top: 30, count: true, search: search.trim() || undefined });
  const total = useCount('Devices', undefined);
  const active = useCount('Devices', "status eq 'ACTIVE'");
  const pending = useCount('Devices', "status eq 'PENDING'");
  const revoked = useCount('Devices', "status eq 'REVOKED'");
  const records = unsynced.data?.length;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-06 Devices · desktop">
      <div className="d-app">
        <AdminSide active="N3" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Devices "}<span className="m-sep" />{` ${total ?? '…'} devices `}<span className="m-sep" />{` checked ${fmtTime(new Date())}`}</div>
              <div className="d-h1">{"Devices"}</div>
              <div className="d-sub">{"Phones and tablets that hold Lodestar data. Records wait on a device until they sync, so a lost device is a data question first."}</div>
            </div>
          </div>
          <div className="d-kpis">
            <div className="d-kpi"><span className="d-kpi__l">{"Active"}</span><span className="d-kpi__v">{active ?? '…'}</span><span className="d-kpi__s">{"can sign in"}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Waiting for approval"}</span><span className="d-kpi__v">{pending ?? '…'}</span><span className="d-kpi__s">{"see access requests"}</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Revoked"}</span><span className="d-kpi__v">{revoked ?? '…'}</span><span className="d-kpi__s">{"lost or retired"}</span></div>
            <div className="d-kpi" style={records ? { background: 'var(--tint-warn)' } : undefined}>
              <span className="d-kpi__l">{"Records waiting"}</span>
              <span className="d-kpi__v">{records ?? '…'}<small>on {waitingUsers.length} {waitingUsers.length === 1 ? 'person' : 'people'}</small></span>
              <span className="d-kpi__s">{"offline events not yet synced"}</span>
            </div>
          </div>
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }} data-testid="devices">
            <div className="dx-card__head">
              <div className="d-toolbar">
                {([['all', 'All', total], ['waiting', 'Records waiting', waitingUsers.length], ['pending', 'Pending', pending], ['revoked', 'Lost or revoked', revoked]] as Array<[Filter, string, number | undefined]>).map(([k, l, n]) => (
                  <span key={k} className={`d-filter lv-click${filter === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setFilter(k); }} onKeyDown={e => { if (e.key === 'Enter') setFilter(k); }}>{l} <b>{n ?? '…'}</b></span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-search" style={{ width: '220px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search devices" placeholder="Device id, label or model" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <ErrorBanner error={devices.error ?? unsynced.error} onRetry={devices.refresh} />
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '270px' }}>{"Device"}</span>
              <span className="dx-td" style={{ width: '140px' }}>{"Last seen"}</span>
              <span className="dx-td" style={{ width: '120px' }}>{"Platform"}</span>
              <span className="dx-td" style={{ width: '110px' }}>{"Queued"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"Status"}</span>
            </div>
            {!devices.data && !devices.error && <Skeleton rows={5} />}
            {devices.data?.length === 0 && <Empty title="No devices" text="No device matches this filter." icon="phone" />}
            {devices.data?.map(d => {
              const q = queued[d.userId] ?? 0;
              const bad = d.status === 'REVOKED';
              return (
                <div key={d.id} className="dx-tr" style={{ minHeight: '58px' }} data-lk="L292" data-device={d.id} onClickCapture={() => setFocus(d.id)}>
                  <span className="dx-td" style={{ width: '270px' }}>
                    <span className="hstack" style={{ gap: '10px' }}>
                      <span className={`dx-lead${bad ? ' dx-lead--bad' : ''}`} style={{ width: '36px', height: '36px', borderRadius: '11px' }}><Ic n={d.platform === 'web' ? 'tablet' : 'phone'} /></span>
                      <span className="dx-td2">
                        <b>{d.label ?? d.model ?? d.id}</b>
                        <span>{d.user?.name ?? d.userId}{d.user ? ` · ${ROLE_INFO[d.user.role]?.label ?? d.user.role}${d.user.depot ? ` · ${DEPOT_NAME[d.user.depot] ?? d.user.depot}` : ''}` : ''}</span>
                      </span>
                    </span>
                  </span>
                  <span className="dx-td" style={{ width: '140px' }}><span className="dx-td2"><b>{d.lastSeenAt ? fmtClock(d.lastSeenAt) : '—'}</b><span>{d.lastSeenAt ? fmtDay(d.lastSeenAt) : 'never'}</span></span></span>
                  <span className="dx-td" style={{ width: '120px' }}><span className="dx-mono">{d.platform ?? '—'}</span></span>
                  <span className="dx-td" style={{ width: '110px' }}><b style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: q ? 'var(--st-exception-fg)' : 'var(--text-3)' }}>{q}</b></span>
                  <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                    {d.status === 'REVOKED' ? <span className="m-pill m-pill--bad" style={{ height: '26px', fontSize: '12.5px' }}><Ic n="ban" />Revoked{d.revokedAt ? ` ${fmtDay(d.revokedAt)}` : ''}</span>
                      : d.status === 'PENDING' ? <span className="m-pill m-pill--warn" style={{ height: '26px', fontSize: '12.5px' }}><span className="dot" />{"Waiting for approval"}</span>
                        : <span className="m-pill m-pill--ok" style={{ height: '26px', fontSize: '12.5px' }}><span className="dot" />{"Active"}</span>}
                  </span>
                </div>
              );
            })}
            <div className="spacer" />
            {devices.hasMore && <div className="x-tfoot">{devices.loadingMore ? <Spinner /> : <Btn className="x-link" onClick={() => void devices.loadMore()}>{"Show more"}<Ic n="chevron-down" /></Btn>}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
