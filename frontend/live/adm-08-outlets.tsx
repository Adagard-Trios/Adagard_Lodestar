'use client';
// ADM-08 Outlets, live. Markup and classes from the generated design (frontend/screens/adm-08-outlets.tsx).
// Data: Outlets (paged, brand/access chips, depot filter, $search on id, name, district, address). A row opens
// the outlet in ADM-09. "Import CSV" opens ADM-14 data imports.
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { BRAND_LETTER, DEPOT_NAME, title } from '@/lib/format';
import { useEntitySet } from '@/lib/odata/hooks';
import type { Depot, Outlet } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Chip = 'all' | 'FRESH' | 'STYLE' | 'TECH' | 'van' | 'mall';
const CHIP: Record<Chip, [string, string | undefined]> = {
  all: ['All', undefined],
  FRESH: ['Fresh', "brand eq 'FRESH'"],
  STYLE: ['Style', "brand eq 'STYLE'"],
  TECH: ['Tech', "brand eq 'TECH'"],
  van: ['van_only', "parking eq 'VAN_ONLY'"],
  mall: ['mall_dock', "parking eq 'MALL_DOCK'"],
};
const DOCK: Record<string, string> = { REAR_DOCK: 'rear dock', STREET: 'street', MALL_BAY: 'mall bay' };

function ChipN({ filter }: { filter: string | undefined }) {
  return <b>{useCount('Outlets', filter) ?? '…'}</b>;
}

export default function LiveAdm08Outlets() {
  const [, setFocus] = useFocusId('outlet');
  const [chip, setChip] = useState<Chip>('all');
  const [depot, setDepot] = useState<Depot | ''>('');
  const [search, setSearch] = useState('');
  const filter = [CHIP[chip][1], depot ? `depot eq '${depot}'` : undefined].filter(Boolean).join(' and ') || undefined;
  const outlets = useEntitySet<Outlet>('Outlets', { filter, orderby: 'id', top: 30, count: true, search: search.trim() || undefined });
  const plg = useCount('Outlets', "depot eq 'PELIYAGODA'");
  const kdy = useCount('Outlets', "depot eq 'KANDY'");

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-08 Outlets · desktop">
      <div className="d-app">
        <AdminSide active="N4" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Master data "}<span className="m-sep" />{" Outlets"}</div>
              <div className="d-h1">{"Outlets"}</div>
              <div className="d-sub">{"The planning agent reads these rows for every draft. Change a window here, not in a plan."}</div>
            </div>
            <span className="d-btn" data-lk="L295"><Ic n="upload" />{"Import CSV"}</span>
          </div>
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }} data-testid="outlets">
            <div className="dx-card__head" style={{ minHeight: '62px' }}>
              <div className="d-toolbar">
                {(Object.keys(CHIP) as Chip[]).map(k => (
                  <span key={k} className={`d-filter lv-click${chip === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setChip(k); }} onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}>
                    {CHIP[k][0]} <ChipN filter={CHIP[k][1]} />
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-filter">
                <Ic n="depot" className="ic ic--sm" />
                <select className="lv-input" aria-label="Depot" value={depot} onChange={e => setDepot(e.target.value as Depot | '')} style={{ width: 'auto' }}>
                  <option value="">Both depots</option>
                  <option value="PELIYAGODA">{DEPOT_NAME.PELIYAGODA}</option>
                  <option value="KANDY">{DEPOT_NAME.KANDY}</option>
                </select>
              </span>
              <span className="d-search" style={{ width: '200px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search outlets" placeholder="ID, name or district" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <ErrorBanner error={outlets.error} onRetry={outlets.refresh} />
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '76px' }}>{"ID"}</span>
              <span className="dx-td" style={{ width: '230px' }}>{"Outlet"}</span>
              <span className="dx-td" style={{ width: '120px' }}>{"District"}</span>
              <span className="dx-td" style={{ width: '100px' }}>{"Depot"}</span>
              <span className="dx-td" style={{ width: '100px' }}>{"Dock type"}</span>
              <span className="dx-td" style={{ width: '130px' }}>{"Window"}</span>
              <span className="dx-td" style={{ width: '100px' }}>{"Access"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"Status"}</span>
            </div>
            {!outlets.data && !outlets.error && <Skeleton rows={6} />}
            {outlets.data?.length === 0 && <Empty title="No outlets" text="No outlet matches this filter." icon="store" />}
            {outlets.data?.map(o => (
              <div key={o.id} className="dx-tr" style={{ minHeight: '50px' }} data-lk="L294" data-outlet={o.id} onClickCapture={() => setFocus(o.id)}>
                <span className="dx-td" style={{ width: '76px' }}><span className="id">{o.id}</span></span>
                <span className="dx-td" style={{ width: '230px' }}>
                  <span className="hstack" style={{ gap: '10px' }}><span className={`bb bb--${o.brand.toLowerCase()} dx-bb`}>{BRAND_LETTER[o.brand]}</span><span className="dx-td2"><b>{o.name}</b><span>Waypoint {title(o.brand)}</span></span></span>
                </span>
                <span className="dx-td" style={{ width: '120px' }}>{o.district}</span>
                <span className="dx-td" style={{ width: '100px' }}>{(DEPOT_NAME[o.depot] ?? o.depot).split(' ')[0]}</span>
                <span className="dx-td" style={{ width: '100px' }}><span className="dx-mono">{DOCK[o.dockType] ?? o.dockType}</span></span>
                <span className="dx-td" style={{ width: '130px' }}><span className="dx-mono">{o.windowOpen} to {o.windowClose}</span></span>
                <span className="dx-td" style={{ width: '100px' }}>
                  {o.parking === 'VAN_ONLY' ? <span className="acc acc--van">{"van_only"}</span> : o.parking === 'MALL_DOCK' ? <span className="acc">{"mall_dock"}</span> : <span className="t-3" style={{ color: 'var(--text-3)' }}>{"normal"}</span>}
                </span>
                <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                  {o.isActive ? <span className="m-tag m-tag--ok"><span className="dot" />{"Active"}</span> : <span className="m-tag m-tag--bad"><span className="dot" />{"Inactive"}</span>}
                </span>
              </div>
            ))}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>Showing <b>{outlets.data?.length ?? 0}</b> of <b>{outlets.count ?? '…'}</b> · {DEPOT_NAME.PELIYAGODA} {plg ?? '…'} · {DEPOT_NAME.KANDY} {kdy ?? '…'}</span>
              <span className="spacer" />
              {outlets.hasMore && (outlets.loadingMore ? <Spinner /> : <Btn className="x-link" onClick={() => void outlets.loadMore()}>{"Show more"}<Ic n="chevron-down" /></Btn>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
