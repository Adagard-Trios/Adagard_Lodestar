'use client';
// ADM-10 Vehicles, live. Markup and classes from the generated design (frontend/screens/adm-10-vehicles.tsx).
// Data: Vehicles (paged, chips, $search on id and workshop note) and per-depot counts. A row opens the vehicle's
// status screen (ADM-11).
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { DEPOT_NAME, fmtNum } from '@/lib/format';
import { useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { Vehicle } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Chip = 'all' | 'reefer' | 'vans' | 'workshop';
const CHIP: Record<Chip, [string, string | undefined]> = {
  all: ['All', undefined],
  reefer: ['Reefer', "tempClass eq 'CHILLED'"],
  vans: ['Vans', "type eq 'VAN'"],
  workshop: ['Workshop', "status eq 'WORKSHOP'"],
};

function DepotKpi({ depot }: { depot: string }) {
  const all = useCount('Vehicles', `depot eq '${depot}'`);
  const down = useCount('Vehicles', `depot eq '${depot}' and status eq 'WORKSHOP'`);
  return (
    <div className="d-kpi">
      <span className="d-kpi__l">{DEPOT_NAME[depot] ?? depot}</span>
      <span className="d-kpi__v">{all !== undefined && down !== undefined ? all - down : '…'}<small>of {all ?? '…'}</small></span>
      <span className="d-kpi__s">{down ? `${down} in the workshop` : 'all in service'}</span>
    </div>
  );
}

export default function LiveAdm10Vehicles() {
  const [, setFocus] = useFocusId('vehicle');
  const [chip, setChip] = useState<Chip>('all');
  const [search, setSearch] = useState('');
  const vehicles = useEntitySet<Vehicle>('Vehicles', { filter: CHIP[chip][1], orderby: 'depot,id', top: 30, count: true, search: search.trim() || undefined });
  const counts = Object.fromEntries((Object.keys(CHIP) as Chip[]).map(k => [k, k])) as Record<Chip, Chip>;
  const reefers = useCount('Vehicles', "tempClass eq 'CHILLED'");
  const down = useQuery<Vehicle[]>('adm-down', async c => (await c.list<Vehicle>('Vehicles', { filter: "status eq 'WORKSHOP'", top: 5 })).value);

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-10 Vehicles · desktop">
      <div className="d-app">
        <AdminSide active="N5" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Master data "}<span className="m-sep" />{` ${vehicles.count ?? '…'} vehicles`}</div>
              <div className="d-h1">{"Vehicles"}</div>
              <div className="d-sub">{"Capacity is checked on weight and volume together. A vehicle in the workshop is invisible to the planning agent."}</div>
            </div>
          </div>
          <div className="d-kpis">
            <DepotKpi depot="PELIYAGODA" />
            <DepotKpi depot="KANDY" />
            <div className="d-kpi"><span className="d-kpi__l">{"Reefer capable"}</span><span className="d-kpi__v">{reefers ?? '…'}</span><span className="d-kpi__s">{"chilled orders only travel on these"}</span></div>
            <div className="d-kpi" style={down.data?.length ? { background: 'var(--tint-bad)' } : undefined}>
              <span className="d-kpi__l">{"In the workshop"}</span>
              <span className="d-kpi__v">{down.data?.length ?? '…'}</span>
              <span className="d-kpi__s">{down.data?.map(v => v.id).join(', ') || 'none'}</span>
            </div>
          </div>
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }} data-testid="vehicles">
            <div className="dx-card__head">
              <div className="d-toolbar">
                {(Object.keys(counts) as Chip[]).map(k => (
                  <span key={k} className={`d-filter lv-click${chip === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setChip(k); }} onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}>
                    {CHIP[k][0]}{chip === k && vehicles.count !== undefined ? <b> {vehicles.count}</b> : null}
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-search" style={{ width: '200px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search vehicles" placeholder="Vehicle ID" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <ErrorBanner error={vehicles.error ?? down.error} onRetry={vehicles.refresh} />
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '96px' }}>{"Vehicle"}</span>
              <span className="dx-td" style={{ width: '190px' }}>{"Type"}</span>
              <span className="dx-td" style={{ width: '110px' }}>{"Weight"}</span>
              <span className="dx-td" style={{ width: '100px' }}>{"Volume"}</span>
              <span className="dx-td" style={{ width: '110px' }}>{"Depot"}</span>
              <span className="dx-td" style={{ width: '120px' }}>{"Fuel quota"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"Status"}</span>
            </div>
            {!vehicles.data && !vehicles.error && <Skeleton rows={6} />}
            {vehicles.data?.length === 0 && <Empty title="No vehicles" text="No vehicle matches this filter." icon="truck" />}
            {vehicles.data?.map(v => (
              <div key={v.id} className="dx-tr" style={{ minHeight: '50px' }} data-lk="L297" data-vehicle={v.id} onClickCapture={() => setFocus(v.id)}>
                <span className="dx-td" style={{ width: '96px' }}><b className="id" style={{ color: 'var(--text)' }}>{v.id}</b></span>
                <span className="dx-td" style={{ width: '190px' }}>
                  <span className="hstack" style={{ gap: '8px' }}>
                    <span className={`x-veh__ic${v.tempClass === 'CHILLED' ? '' : ' x-veh__ic--dry'}`}><Ic n={v.tempClass === 'CHILLED' ? 'snow-heavy' : v.type === 'VAN' ? 'van' : 'truck'} /></span>
                    <span className="dx-td2"><b>{v.tempClass === 'CHILLED' ? 'Reefer' : 'Dry'} {v.type === 'VAN' ? 'van' : 'truck'}</b><span>{v.tempClass === 'CHILLED' ? 'reefer' : 'ambient'}</span></span>
                  </span>
                </span>
                <span className="dx-td" style={{ width: '110px' }}><span className="dx-mono">{fmtNum(v.capacityKg)} kg</span></span>
                <span className="dx-td" style={{ width: '100px' }}><span className="dx-mono">{fmtNum(v.capacityM3, 1)} m³</span></span>
                <span className="dx-td" style={{ width: '110px' }}>{(DEPOT_NAME[v.depot] ?? v.depot).split(' ')[0]}</span>
                <span className="dx-td" style={{ width: '120px' }}><span className="dx-mono">{v.weeklyLFuel} L/wk</span></span>
                <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                  {v.status === 'WORKSHOP'
                    ? <span className="m-tag m-tag--warn"><Ic n="wrench" />{v.workshopNote ?? 'Workshop'}</span>
                    : <span className="m-tag m-tag--ok"><span className="dot" />{v.status === 'ENROUTE' ? 'On the road' : 'In service'}</span>}
                </span>
              </div>
            ))}
            <div className="spacer" />
            {vehicles.hasMore && <div className="x-tfoot">{vehicles.loadingMore ? <Spinner /> : <Btn className="x-link" onClick={() => void vehicles.loadMore()}>{"Show more"}<Ic n="chevron-down" /></Btn>}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
