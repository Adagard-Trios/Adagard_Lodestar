'use client';
// DSP-19 Fleet and vehicle profile, live. Markup and classes from the generated design
// (frontend/screens/dsp-19-fleet-and-vehicle-profile.tsx).
// Data: Vehicles of the depot tab, the run date's Trips per vehicle; the profile panel updates a vehicle with
// Vehicles('…')/Lodestar.SetStatus {status, workshopNote}.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/live/Btn';
import { PlanSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { usePlanScope } from '@/components/live/plan-data';
import { useAgentConfig } from '@/components/live/settings-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, dayFilter, fmtNum, fmtRunDate, pct } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Trip, Vehicle, VehicleStatus } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Filter = 'all' | 'reefer' | 'dry' | 'vans' | 'workshop';
const FILTERS: Array<[Filter, string, (v: Vehicle) => boolean]> = [
  ['all', 'All', () => true],
  ['reefer', 'Reefer', v => v.tempClass === 'CHILLED'],
  ['dry', 'Dry', v => v.tempClass === 'AMBIENT'],
  ['vans', 'Vans', v => v.type === 'VAN'],
  ['workshop', 'Workshop', v => v.status === 'WORKSHOP'],
];
const kind = (v: Vehicle) => `${v.tempClass === 'CHILLED' ? 'Reefer' : 'Dry'} ${v.type === 'VAN' ? 'van' : 'truck'}`;

function DepotTab({ depot, on, onPick }: { depot: string; on: boolean; onPick: () => void }) {
  const n = useCount('Vehicles', `depot eq '${depot}'`);
  return (
    <span className={`dx-tab lv-click${on ? ' is-on' : ''}`} role="tab" aria-selected={on} tabIndex={0}
      onClick={e => { e.stopPropagation(); onPick(); }} onKeyDown={e => { if (e.key === 'Enter') onPick(); }}>
      {DEPOT_NAME[depot] ?? depot} <b>{n ?? '…'}</b>
    </span>
  );
}

export default function LiveDsp19FleetAndVehicleProfile() {
  const router = useRouter();
  const { runDate, depots, depot: pinned } = usePlanScope();
  const maxTrips = useAgentConfig().data?.limits?.maxTripsPerVehicle;
  const [tab, setTab] = useState<string | null>(null);
  const depot = tab ?? pinned ?? depots[0];
  const [filter, setFilter] = useState<Filter>('all');
  const [focus, setFocus] = useFocusId('vehicle');
  const outlets = useCount('Outlets', undefined);

  const fleet = useQuery<Vehicle[]>(depot ? `fleet-tab:${depot}` : null, c => c.all<Vehicle>('Vehicles', { filter: `depot eq '${depot}'`, orderby: 'tempClass desc,id' }), {
    refreshOn: ['notification'],
  });
  const trips = useQuery<Trip[]>(depot && runDate ? `fleet-trips:${depot}:${runDate}` : null, c =>
    c.all<Trip>('Trips', { filter: `depot eq '${depot}' and ${dayFilter('runDate', runDate!)}`, select: 'id,vehicleId,planMinutes,district,tripNumber,status' }));
  const all = fleet.data ?? [];
  const rows = all.filter(FILTERS.find(f => f[0] === filter)![2]);
  const sel = all.find(v => v.id === focus) ?? rows[0];
  const tripsOf = (id: string) => (trips.data ?? []).filter(t => t.vehicleId === id);

  const [status, setStatus] = useState<VehicleStatus | ''>('');
  const [note, setNote] = useState<string | null>(null);
  const update = useAction<{ id: string; status: VehicleStatus; workshopNote?: string }, Vehicle>(
    (c, p) => c.action<Vehicle>('Vehicles', p.id, 'SetStatus', { status: p.status, workshopNote: p.workshopNote }),
    { onSuccess: () => { void fleet.refresh(); setStatus(''); setNote(null); } },
  );
  const pick = (id: string) => {
    setFocus(id);
    setStatus('');
    setNote(null);
  };
  const reefersLeft = all.filter(v => v.tempClass === 'CHILLED' && v.status !== 'WORKSHOP' && v.id !== sel?.id).length;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-19 Fleet and vehicle profile · desktop">
      <div className="d-app">
        <PlanSide active="N7" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Fleet & outlets "}<span className="m-sep" />{" Vehicles "}<span className="m-sep" />{runDate ? ` ${fmtRunDate(runDate)} run` : ''}</div>
              <div className="d-h1">Fleet · {DEPOT_NAME[depot ?? ''] ?? depot}</div>
            </div>
            <div className="dx-tabs" role="tablist">
              {depots.map(d => <DepotTab key={d} depot={d} on={d === depot} onPick={() => setTab(d)} />)}
              <span className="dx-tab lv-click" role="tab" tabIndex={0} onClick={e => { e.stopPropagation(); router.push('/plan/dsp-18-outlet-profile'); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/plan/dsp-18-outlet-profile'); } }}>Outlets <b>{outlets ?? '…'}</b></span>
            </div>
          </div>
          <ErrorBanner error={fleet.error ?? trips.error} onRetry={fleet.refresh} />
          <div className="dx-hrow" style={{ flex: '1' }}>
            <div className="dx-card" style={{ flex: '1', minWidth: '0' }} data-testid="fleet">
              <div className="dx-card__head">
                <div className="d-toolbar">
                  {FILTERS.map(([k, l, fn]) => (
                    <span key={k} className={`d-filter lv-click${filter === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                      onClick={e => { e.stopPropagation(); setFilter(k); }} onKeyDown={e => { if (e.key === 'Enter') setFilter(k); }}>
                      {l} <b>{all.filter(fn).length}</b>
                    </span>
                  ))}
                </div>
              </div>
              <div className="dx-tr dx-tr--head">
                <span className="dx-td" style={{ width: '104px' }}>{"Vehicle"}</span>
                <span className="dx-td" style={{ width: '100px' }}>{"Type"}</span>
                <span className="dx-td" style={{ width: '140px' }}>{"Capacity"}</span>
                <span className="dx-td" style={{ width: '124px' }}>{"Fuel this week"}</span>
                <span className="dx-td" style={{ flex: '1' }}>{runDate ? fmtRunDate(runDate) : 'Run'}</span>
              </div>
              {!fleet.data && !fleet.error && <Skeleton rows={6} />}
              {fleet.data && rows.length === 0 && <Empty title="No vehicles" text="No vehicle matches this filter." icon="truck" />}
              {rows.map(v => {
                const down = v.status === 'WORKSHOP';
                const fuel = pct(v.usedLThisWeek, v.weeklyLFuel);
                const ts = tripsOf(v.id);
                return (
                  <div
                    key={v.id}
                    className={`dx-tr lv-click${sel?.id === v.id ? ' dx-tr--sel' : ''}${down && sel?.id !== v.id ? ' dx-tr--off' : ''}`}
                    style={{ minHeight: '52px' }}
                    data-vehicle={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); pick(v.id); }}
                    onKeyDown={e => { if (e.key === 'Enter') pick(v.id); }}
                  >
                    <span className="dx-td" style={{ width: '104px' }}>
                      <span className="hstack" style={{ gap: '8px' }}>
                        <span className={`x-veh__ic${v.tempClass === 'CHILLED' ? '' : ' x-veh__ic--dry'}`}><Ic n={v.type === 'VAN' ? 'van' : 'truck'} /></span>
                        <span className="id" style={{ fontSize: '14px', ...(down ? { textDecoration: 'line-through', color: 'var(--text-3)' } : {}) }}>{v.id}</span>
                      </span>
                    </span>
                    <span className="dx-td" style={{ width: '100px' }}>{kind(v)}</span>
                    <span className="dx-td" style={{ width: '140px' }}>{fmtNum(v.capacityKg)} kg · {fmtNum(v.capacityM3, 1)} m³</span>
                    <span className="dx-td" style={{ width: '124px' }}>
                      <span className="vstack" style={{ gap: '4px', width: '112px' }}>
                        <span style={{ fontSize: '13px' }}><b style={fuel >= 85 ? { color: 'var(--st-deferred-fg)' } : undefined}>{v.usedLThisWeek}</b> / {v.weeklyLFuel} L</span>
                        <span className="dx-bar" style={{ height: '5px' }}>
                          <span style={{ display: 'block', width: `${fuel}%`, borderRadius: '999px', background: down ? '#A8A29E' : fuel >= 85 ? 'var(--star-500)' : 'var(--st-delivered-fg)' }} />
                        </span>
                      </span>
                    </span>
                    <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                      {down ? <span className="m-pill m-pill--offline"><Ic n="wrench" />{"Workshop"}</span>
                        : ts.length ? `${ts.length} trip${ts.length === 1 ? '' : 's'} · ${ts.reduce((s, t) => s + (t.planMinutes ?? 0), 0)} min · ${[...new Set(ts.map(t => t.district))].join(', ')}`
                          : <span className="t-3">no trips</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            {sel && (
              <div className="dx-card" style={{ width: '372px', flexShrink: '0' }} data-testid="vehicle-profile">
                <div className="dx-card__head" style={{ minHeight: '64px' }}>
                  <span className={`dx-lead${sel.tempClass === 'CHILLED' ? ' dx-lead--cold' : ''}`}><Ic n={sel.type === 'VAN' ? 'van' : 'truck'} /></span>
                  <div className="vstack" style={{ gap: '0' }}><span className="dx-card__title">{sel.id}</span><span className="dx-t13">{kind(sel)} · {DEPOT_NAME[sel.depot] ?? sel.depot}</span></div>
                  <span className="spacer" />
                  <span className="dx-close" data-lk="C"><Ic n="x" /></span>
                </div>
                <div className="dx-card__body" style={{ gap: '14px' }}>
                  <div className={`dx-inset${sel.status === 'WORKSHOP' ? ' dx-inset--off' : ''}`} style={{ gap: '6px' }}>
                    <span className="dx-sech" style={sel.status === 'WORKSHOP' ? { color: 'var(--st-offline-fg)' } : undefined}><Ic n="wrench" className="ic ic--sm" />{"Status"}</span>
                    <span className="dx-display" style={{ fontSize: '32px', color: 'var(--text)' }}>{sel.status === 'WORKSHOP' ? 'In workshop' : sel.status === 'ENROUTE' ? 'On the road' : 'Available'}</span>
                    {sel.workshopNote && <span className="dx-t14">{sel.workshopNote}</span>}
                  </div>
                  <div className="vstack" style={{ gap: '0' }}>
                    <div className="dx-kv"><span>{"Capacity"}</span><b>{fmtNum(sel.capacityKg)} kg · {fmtNum(sel.capacityM3, 1)} m³</b></div>
                    <div className="dx-kv"><span>{"Temperature"}</span><b>{sel.tempClass === 'CHILLED' ? 'Reefer, chilled' : 'Dry, ambient'}</b></div>
                    <div className="dx-kv"><span>{"Fuel"}</span><b>{fmtNum(sel.kmPerLitre, 1)} km/L</b></div>
                    <div className="dx-kv"><span>{"Weekly quota"}</span><b>{sel.usedLThisWeek} of {sel.weeklyLFuel} L used</b></div>
                    <div className="dx-kv"><span>{"Trips a day"}</span><b>Max {maxTrips ?? '—'} · home {DEPOT_NAME[sel.depot] ?? sel.depot}</b></div>
                  </div>
                  {sel.tempClass === 'CHILLED' && (
                    <div className="dx-inset dx-inset--warn" style={{ padding: '12px 14px' }}>
                      <span className="dx-t14">Without it {DEPOT_NAME[sel.depot] ?? sel.depot} has <b>{reefersLeft} reefers</b> ready.</span>
                    </div>
                  )}
                  <div className="dx-field">
                    <span className="dx-label">{"Update status"}</span>
                    <div className="dx-input">
                      <select className="lv-input" aria-label="Vehicle status" value={status || sel.status} onChange={e => setStatus(e.target.value as VehicleStatus)}>
                        <option value="AVAILABLE">Available</option>
                        <option value="WORKSHOP">In workshop</option>
                        <option value="ENROUTE">On the road</option>
                      </select>
                    </div>
                    <div className="dx-input"><input className="lv-input" aria-label="Workshop note" placeholder="Workshop note" value={note ?? sel.workshopNote ?? ''} onChange={e => setNote(e.target.value)} /></div>
                  </div>
                  <ErrorBanner error={update.error} />
                </div>
                <div className="spacer" />
                <div className="dx-drawer__foot" style={{ padding: '14px 20px' }}>
                  <span className="spacer" />
                  <Btn className="d-btn d-btn--primary" testId="update-vehicle" busy={update.pending} onClick={() => void update.run({ id: sel.id, status: (status || sel.status) as VehicleStatus, workshopNote: (note ?? sel.workshopNote) || undefined })}>
                    <Ic n="pen" />{"Update status"}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
