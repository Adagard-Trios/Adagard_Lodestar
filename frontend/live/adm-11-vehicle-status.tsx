'use client';
// ADM-11 Vehicle status, live. Markup and classes from the generated design (frontend/screens/adm-11-vehicle-status.tsx).
// The vehicle chosen on ADM-10 (focus id, or ?id=). Saves with Vehicles('…')/Lodestar.SetStatus
// {status: 'WORKSHOP' | 'AVAILABLE', workshopNote?}; leaving the workshop clears the note (fleet.service.ts).
// "What the planning agent does" is worked out from Vehicles: the planner drafts only AVAILABLE vehicles, so the
// depot's count of the same kind (reefer/dry × truck/van) changes by one, and other vehicles of that kind already
// in the workshop are named.
// Not drawn: "Retired" (no such status), "From" and "Back in service" dates (the API keeps no dates), the
// VEH-DOWN reason code (the note is free text), the run dates the vehicle misses, and "Notify … by email".
import { useState, type ReactNode } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtNum } from '@/lib/format';
import { useAction, useEntity, useQuery } from '@/lib/odata/hooks';
import type { Vehicle } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

type Target = 'AVAILABLE' | 'WORKSHOP';

const kindOf = (v: Vehicle) => `${v.tempClass === 'CHILLED' ? 'reefer' : 'dry'} ${v.type === 'VAN' ? 'van' : 'truck'}`;
function StatusForm({ v }: { v: Vehicle }) {
  const { short: depotShort } = useDepots();
  const nav = useScreenNav();
  const [target, setTarget] = useState<Target>(v.status === 'WORKSHOP' ? 'WORKSHOP' : 'AVAILABLE');
  const [note, setNote] = useState(v.workshopNote ?? '');
  const same = `depot eq '${v.depot}' and tempClass eq '${v.tempClass}' and type eq '${v.type}'`;
  const available = useCount('Vehicles', `${same} and status eq 'AVAILABLE'`);
  const alsoOut = useQuery<Vehicle[]>(`adm-veh-out:${v.id}`, async c =>
    (await c.list<Vehicle>('Vehicles', { select: 'id', filter: `${same} and status eq 'WORKSHOP' and id ne '${v.id}'`, orderby: 'id', top: 5 })).value);
  const save = useAction<void, Vehicle>(
    c => c.action<Vehicle>('Vehicles', v.id, 'SetStatus', target === 'WORKSHOP' ? { status: 'WORKSHOP', workshopNote: note.trim() } : { status: 'AVAILABLE' }),
    { onSuccess: () => { nav.notify(target === 'WORKSHOP' ? `${v.id} is in the workshop.` : `${v.id} is back in service.`); nav.go('L298'); } },
  );
  const changed = target === 'WORKSHOP' ? v.status !== 'WORKSHOP' || note.trim() !== (v.workshopNote ?? '') : v.status === 'WORKSHOP';
  const valid = changed && (target === 'AVAILABLE' || Boolean(note.trim()));
  const kind = kindOf(v);
  const plural = `${kind}s`;
  const drops = target === 'WORKSHOP' && v.status === 'AVAILABLE';
  const rises = target === 'AVAILABLE' && v.status === 'WORKSHOP';
  const others = alsoOut.data?.map(o => o.id) ?? [];

  return (
    <div className="dx-drawer" style={{ width: '600px' }} role="dialog" aria-modal="true" aria-labelledby="vehicle-title">
      <div className="dx-drawer__head">
        <span className={`dx-lead${v.tempClass === 'CHILLED' ? ' dx-lead--cold' : ''}`} style={{ width: '44px', height: '44px' }}><Ic n={v.type === 'VAN' ? 'van' : 'truck'} /></span>
        <div className="vstack" style={{ gap: '3px', flex: '1' }}>
          <span className="d-eyebrow">{`Vehicle · ${depotShort(v.depot)}`}</span>
          <span className="dx-card__title" style={{ fontSize: '20px' }} id="vehicle-title">{`${v.id} · ${kind}`}</span>
          <span className="dx-t13">{`${fmtNum(v.capacityKg)} kg · ${fmtNum(v.capacityM3, 1)} m³ · ${fmtNum(v.kmPerLitre, 1)} km/L · ${v.weeklyLFuel} L a week`}</span>
        </div>
        <span className="dx-close" data-lk="C"><Ic n="x" /></span>
      </div>
      <div className="dx-drawer__body">
        <div className="dx-field">
          <span className="dx-label">{"Status"}</span>
          <div className="dx-tabs" role="radiogroup" aria-label="Status">
            {([['AVAILABLE', 'In service'], ['WORKSHOP', 'In workshop']] as Array<[Target, string]>).map(([k, l]) => (
              <span key={k} className={`dx-tab lv-click${target === k ? ' is-on' : ''}`} role="radio" aria-checked={target === k} tabIndex={0}
                onClick={e => { e.stopPropagation(); setTarget(k); }} onKeyDown={e => { if (e.key === 'Enter') setTarget(k); }}>
                {k === 'WORKSHOP' && <Ic n="wrench" className="ic ic--sm" />}{l}
              </span>
            ))}
          </div>
        </div>
        {target === 'WORKSHOP' && (
          <div className="dx-field">
            <span className="dx-label">{"Reason"}</span>
            <div className="dx-input dx-input--sm">
              <input className="lv-input" aria-label="Reason" value={note} onChange={e => setNote(e.target.value)} placeholder="What failed, where, when" />
            </div>
          </div>
        )}
        {changed && (
          <div className="dx-inset dx-inset--brand" style={{ gap: '10px' }} data-testid="agent-effect">
            <span className="dx-sech" style={{ color: 'var(--brand-600)' }}><Ic n="sparkle-plus" className="ic ic--sm" /><b>{"What the planning agent does"}</b></span>
            {(drops || rises) && (
              <div className="x-conseq__r">
                <Ic n={drops ? 'ban' : 'check'} style={{ color: 'var(--brand-600)' }} />
                <span>{drops ? `Leaves ${v.id} out of the drafts until it is back in service.` : `Drafts can use ${v.id} again from the next run.`}</span>
              </div>
            )}
            {(drops || rises) && available !== undefined && (
              <div className="x-conseq__r">
                <Ic n={v.tempClass === 'CHILLED' ? 'snow-heavy' : v.type === 'VAN' ? 'van' : 'truck'} style={{ color: 'var(--brand-600)' }} />
                <span>
                  {`${depotShort(v.depot)} ${plural} ${drops ? 'drop' : 'rise'} from ${available} to `}<b>{drops ? Math.max(0, available - 1) : available + 1}</b>
                  {others.length > 0 ? ` (${others.join(', ')} ${others.length === 1 ? 'is' : 'are'} out too).` : '.'}
                  {drops && v.tempClass === 'CHILLED' && <>{" Expect deferral proposals with reason "}<b>{"CAP-REEFER"}</b>{"."}</>}
                </span>
              </div>
            )}
            <div className="x-conseq__r">
              <Ic n="check" style={{ color: 'var(--st-delivered-fg)' }} />
              <span>{"Nothing published changes."}</span>
            </div>
          </div>
        )}
        <ErrorBanner error={save.error ?? alsoOut.error} />
      </div>
      <div className="dx-drawer__foot">
        <span className="dx-t13" style={{ flex: '1' }}>{"Logged with your name and reason"}</span>
        <span className="d-btn d-btn--ghost" data-lk="C">{"Cancel"}</span>
        <Btn className="d-btn d-btn--primary" testId="set-status" busy={save.pending} disabled={!valid} onClick={() => void save.run()}>
          {target === 'WORKSHOP' ? <><Ic n="wrench" />{"Mark in workshop"}</> : <><Ic n="check" />{"Mark in service"}</>}
        </Btn>
      </div>
    </div>
  );
}

export default function LiveAdm11VehicleStatus() {
  const [id] = useFocusId('vehicle');
  const vehicle = useEntity<Vehicle>('Vehicles', id);
  const wrap = (body: ReactNode) => <div className="dx-drawer" style={{ width: '600px' }}><div className="dx-drawer__body">{body}</div></div>;
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-11 Vehicle status · desktop">
      <div className="d-app">
        <AdminSide active="N5" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Master data"}</div>
              <div className="d-h1">{"Vehicles"}</div>
              <div className="d-sub">{"Capacity is checked on weight and volume together. A vehicle in the workshop is invisible to the planning agent."}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="dx-scrim" />
      {!id && wrap(<Empty title="No vehicle chosen" text="Pick a vehicle in Vehicles to change its status." icon="truck" />)}
      {id && vehicle.error && wrap(<ErrorBanner error={vehicle.error} onRetry={vehicle.refresh} />)}
      {id && !vehicle.data && !vehicle.error && wrap(<Skeleton rows={4} />)}
      {vehicle.data && <StatusForm key={vehicle.data.id} v={vehicle.data} />}
    </div>
  );
}
