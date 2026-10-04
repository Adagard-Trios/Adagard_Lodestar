'use client';
// ADM-21 Depots, live. The depot registry every Lodestar app names depots from (OData Depots). Same admin visual
// language as ADM-08 Outlets (table card, filter chips, search) and ADM-04/09 (drawer form).
// Data: Depots (admins also see deactivated ones). Register: POST Depots {code, name, district, address?, phone?,
// lat?, lng?}; edit: PATCH with If-Match; deactivate / reactivate: PATCH {isActive}. The API refuses a code already
// registered (409) and deactivating a depot that still has active outlets or vehicles (422 DepotInUse); every write
// is audited. A depot's code is its key (it is what tokens, outlets, vehicles and plans carry) and never changes.
import { useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { AdminSide, adminChanged } from '@/components/live/chrome';
import { refreshDepots } from '@/components/live/depots';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import type { WithEtag } from '@/lib/odata/client';
import { useAction, useEntitySet, useODataClient } from '@/lib/odata/hooks';
import type { DepotRow } from '@/lib/odata/types';

type Chip = 'all' | 'active' | 'off';
const CHIP: Record<Chip, [string, string | undefined]> = {
  all: ['All', undefined],
  active: ['Active', 'isActive eq true'],
  off: ['Deactivated', 'isActive eq false'],
};

/** Same rules as the API (backend/libs/odata/src/depots.ts, DepotsSet). */
export const DEPOT_CODE = /^[A-Z][A-Z0-9_]{1,31}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

interface Form { code: string; name: string; district: string; address: string; phone: string; lat: string; lng: string }
const EMPTY: Form = { code: '', name: '', district: '', address: '', phone: '', lat: '', lng: '' };

/** Field problems in plain words, keyed by field; empty when the form can be saved. */
export function depotProblems(f: Form, creating: boolean): Partial<Record<keyof Form, string>> {
  const p: Partial<Record<keyof Form, string>> = {};
  if (creating && !DEPOT_CODE.test(f.code.trim().toUpperCase())) p.code = 'Use 2 to 32 capital letters, digits or _, starting with a letter (e.g. GALLE).';
  if (!f.name.trim()) p.name = 'A depot needs a name.';
  else if (f.name.trim().length > 80) p.name = 'At most 80 characters.';
  if (!f.district.trim()) p.district = 'A depot needs a district.';
  if (f.phone.trim() && !PHONE.test(f.phone.trim())) p.phone = 'Use a phone number, e.g. +94 91 222 3344.';
  const lat = f.lat.trim() === '' ? null : Number(f.lat);
  const lng = f.lng.trim() === '' ? null : Number(f.lng);
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) p.lat = 'Latitude is between -90 and 90.';
  if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) p.lng = 'Longitude is between -180 and 180.';
  if ((lat === null) !== (lng === null)) p[lat === null ? 'lat' : 'lng'] = 'Give both coordinates, or neither.';
  return p;
}

const formOf = (d: DepotRow): Form => ({
  code: d.code, name: d.name, district: d.district, address: d.address ?? '', phone: d.phone ?? '',
  lat: d.lat === null || d.lat === undefined ? '' : String(d.lat), lng: d.lng === null || d.lng === undefined ? '' : String(d.lng),
});

function Field({ label, error, children, flex = '1' }: { label: string; error?: string; children: React.ReactNode; flex?: string }) {
  return (
    <div className="dx-field" style={{ flex }}>
      <span className="dx-label">{label}</span>
      <div className="dx-input dx-input--sm" style={error ? { borderColor: 'var(--st-exception-fg)' } : undefined}>{children}</div>
      {error && <span className="dx-t13" style={{ color: 'var(--st-exception-fg)' }} role="alert">{error}</span>}
    </div>
  );
}

function DepotForm({ depot, onClose, onSaved }: { depot: WithEtag<DepotRow> | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState<Form>(depot ? formOf(depot) : EMPTY);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: k === 'code' ? v.toUpperCase().replace(/\s+/g, '_') : v }));
  const problems = depotProblems(form, !depot);
  const valid = Object.keys(problems).length === 0;
  const shown = touched ? problems : {};
  const body = () => {
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    return { name: form.name.trim(), district: form.district.trim(), address: form.address.trim() || null, phone: form.phone.trim() || null, lat: num(form.lat), lng: num(form.lng) };
  };
  const save = useAction<void, DepotRow>(c => (depot
    ? c.update<DepotRow>('Depots', depot.code, body(), depot['@odata.etag'])
    : c.create<DepotRow>('Depots', { code: form.code.trim(), ...body() })), {
    onSuccess: d => onSaved(depot ? `${d?.name ?? form.name.trim()} saved.` : `${d?.name ?? form.name.trim()} registered. Every app lists it now.`),
  });
  const toggle = useAction<void, DepotRow>(c => c.update<DepotRow>('Depots', depot!.code, { isActive: !depot!.isActive }, depot!['@odata.etag']), {
    onSuccess: () => onSaved(depot!.isActive ? `${depot!.name} deactivated. It is no longer offered for new outlets, vehicles or people.` : `${depot!.name} is active again.`),
  });

  return (
    <div className="dx-drawer" style={{ width: '600px' }} role="dialog" aria-modal="true" aria-labelledby="depot-title" data-testid="depot-form">
      <div className="dx-drawer__head">
        <span className="dx-lead" style={{ width: '44px', height: '44px' }}><Ic n="depot" /></span>
        <div className="vstack" style={{ gap: '3px', flex: '1' }}>
          <span className="d-eyebrow">{depot ? `Depot · ${depot.code}` : 'Depots'}</span>
          <span className="dx-card__title" style={{ fontSize: '20px' }} id="depot-title">{depot ? `Edit ${depot.name}` : 'Register depot'}</span>
        </div>
        <Btn className="dx-close" title="Close" onClick={onClose}><Ic n="x" /></Btn>
      </div>
      <div className="dx-drawer__body">
        <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
          <Field label="Code" error={shown.code} flex="0 0 180px">
            <input className="lv-input" aria-label="Depot code" placeholder="GALLE" value={form.code} disabled={Boolean(depot)} onChange={e => set('code', e.target.value)} style={{ fontFamily: 'var(--font-mono, monospace)' }} />
          </Field>
          <Field label="Name" error={shown.name}>
            <input className="lv-input" aria-label="Depot name" placeholder="Galle DC" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
        </div>
        {!depot && <span className="dx-t13">{"The code is the depot's key on every outlet, vehicle, person and plan. It cannot be changed later."}</span>}
        <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
          <Field label="District" error={shown.district}>
            <input className="lv-input" aria-label="District" placeholder="Galle" value={form.district} onChange={e => set('district', e.target.value)} />
          </Field>
          <Field label="Desk phone" error={shown.phone}>
            <Ic n="phone" />
            <input className="lv-input" aria-label="Desk phone" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
        </div>
        <Field label="Address">
          <Ic n="depot" />
          <input className="lv-input" aria-label="Address" value={form.address} onChange={e => set('address', e.target.value)} />
        </Field>
        <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
          <Field label="Latitude" error={shown.lat}>
            <input className="lv-input" aria-label="Latitude" inputMode="decimal" value={form.lat} onChange={e => set('lat', e.target.value)} />
          </Field>
          <Field label="Longitude" error={shown.lng}>
            <input className="lv-input" aria-label="Longitude" inputMode="decimal" value={form.lng} onChange={e => set('lng', e.target.value)} />
          </Field>
        </div>
        {depot && (
          <div className="dx-inset" style={{ gap: '6px', padding: '14px 16px' }}>
            <div className="between"><span className="dx-sech"><b>{depot.isActive ? 'In service' : 'Deactivated'}</b></span></div>
            <span className="dx-t13">
              {depot.isActive
                ? 'Deactivating hides the depot from new outlets, vehicles, people and plans. A depot with active outlets or vehicles cannot be deactivated: move them first.'
                : 'Reactivating offers the depot again everywhere.'}
            </span>
            <div className="hstack">
              <Btn className={`d-btn${depot.isActive ? ' d-btn--ghost' : ''}`} testId="toggle-depot" busy={toggle.pending} onClick={() => void toggle.run()}>
                <Ic n={depot.isActive ? 'lock' : 'check'} />{depot.isActive ? 'Deactivate depot' : 'Reactivate depot'}
              </Btn>
            </div>
            <ErrorBanner error={toggle.error} compact />
          </div>
        )}
        <ErrorBanner error={save.error} />
      </div>
      <div className="dx-drawer__foot">
        <span className="dx-t13" style={{ flex: '1' }}>{"Logged as a change by you in the audit chain."}</span>
        <Btn className="d-btn d-btn--ghost" onClick={onClose}>{"Cancel"}</Btn>
        <Btn
          className="d-btn d-btn--primary"
          testId="save-depot"
          busy={save.pending}
          disabled={touched && !valid}
          onClick={() => { setTouched(true); if (valid) void save.run(); }}
        >
          <Ic n="check" />{depot ? 'Save changes' : 'Register depot'}
        </Btn>
      </div>
    </div>
  );
}

export default function LiveAdm21Depots() {
  const nav = useScreenNav();
  const client = useODataClient();
  const [chip, setChip] = useState<Chip>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<WithEtag<DepotRow> | 'new' | null>(null);
  const list = useEntitySet<DepotRow>('Depots', { filter: CHIP[chip][1], orderby: 'name', top: 100, count: true, search: search.trim() || undefined });
  const rows = list.data;

  const saved = (msg: string) => {
    setEditing(null);
    nav.notify(msg);
    void list.refresh();
    void refreshDepots(client);
    adminChanged();
  };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-21 Depots · desktop">
      <div className="d-app">
        <AdminSide active="D1" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Master data "}<span className="m-sep" />{" Depots"}</div>
              <div className="d-h1">{"Depots"}</div>
              <div className="d-sub">{"Every Lodestar app names depots from this list. Register a depot here before giving it outlets, vehicles or people."}</div>
            </div>
            <Btn className="d-btn d-btn--primary" testId="new-depot" onClick={() => setEditing('new')}><Ic n="plus" />{"Register depot"}</Btn>
          </div>
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }} data-testid="depots">
            <div className="dx-card__head" style={{ minHeight: '62px' }}>
              <div className="d-toolbar">
                {(Object.keys(CHIP) as Chip[]).map(k => (
                  <span key={k} className={`d-filter lv-click${chip === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setChip(k); }} onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}>
                    {CHIP[k][0]}
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-search" style={{ width: '220px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search depots" placeholder="Code, name or district" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <ErrorBanner error={list.error} onRetry={list.refresh} />
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '130px' }}>{"Code"}</span>
              <span className="dx-td" style={{ width: '220px' }}>{"Depot"}</span>
              <span className="dx-td" style={{ width: '240px' }}>{"Address"}</span>
              <span className="dx-td" style={{ width: '150px' }}>{"Desk phone"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"Status"}</span>
            </div>
            {!rows && !list.error && <Skeleton rows={3} />}
            {rows?.length === 0 && (
              <Empty title="No depots" text={search.trim() || chip !== 'all' ? 'No depot matches this filter.' : 'Register the first depot to plan from it.'} icon="depot" />
            )}
            {rows?.map(d => (
              <div key={d.code} className="dx-tr lv-click" style={{ minHeight: '50px' }} role="button" tabIndex={0} data-depot={d.code}
                onClick={e => { e.stopPropagation(); setEditing(d); }} onKeyDown={e => { if (e.key === 'Enter') setEditing(d); }}>
                <span className="dx-td" style={{ width: '130px' }}><span className="id">{d.code}</span></span>
                <span className="dx-td" style={{ width: '220px' }}><span className="dx-td2"><b>{d.name}</b><span>{d.district}</span></span></span>
                <span className="dx-td" data-label="Address" style={{ width: '240px' }}>{d.address || <span className="t-3" style={{ color: 'var(--text-3)' }}>{"not given"}</span>}</span>
                <span className="dx-td" data-label="Desk phone" style={{ width: '150px' }}><span className="dx-mono">{d.phone || '—'}</span></span>
                <span className="dx-td" data-label="Status" style={{ flex: '1', minWidth: '0' }}>
                  {d.isActive ? <span className="m-tag m-tag--ok"><span className="dot" />{"Active"}</span> : <span className="m-tag m-tag--bad"><span className="dot" />{"Deactivated"}</span>}
                </span>
              </div>
            ))}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>Showing <b>{rows?.length ?? 0}</b> of <b>{list.count ?? '…'}</b></span>
            </div>
          </div>
        </div>
      </div>
      {editing && (
        <>
          <div className="dx-scrim" onClick={() => setEditing(null)} />
          <DepotForm key={editing === 'new' ? 'new' : editing.code} depot={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />
        </>
      )}
    </div>
  );
}
