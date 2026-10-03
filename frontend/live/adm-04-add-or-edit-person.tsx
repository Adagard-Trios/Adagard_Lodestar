'use client';
// ADM-04 Add or edit person, live. Markup and classes from the generated design (frontend/screens/adm-04-add-or-edit-person.tsx).
// Add: POST /Users {email, name, role, depot?, outletId?, phone?} (auth creates the Keycloak identity).
// Edit: PATCH /Users('…') with If-Match (the ETag read with the person) {name, role, depot, outletId, phone,
// isActive}; disabling a person disables their sign-in. Outlets come from /Outlets for the store scope.
import { useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { AdminSide, adminChanged } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { ROLE_INFO, ROLES } from '@/components/live/admin-data';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { useAction, useEntity, useQuery } from '@/lib/odata/hooks';
import type { Depot, Outlet, User, UserRole } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

const CAN: Record<UserRole, Array<[boolean, string]>> = {
  DISPATCHER: [[true, 'Review agent drafts and approve plans for their depots'], [true, 'Decide deferrals, follow live operations'], [false, 'Change master data or people (asks the Lodestar admin)']],
  LOADER: [[true, 'See the bay queue and load sheets of their depot'], [true, 'Record shortfalls and release trips'], [false, 'See plans of other depots or edit orders']],
  DRIVER: [[true, 'Run their vehicle\'s trips, offline too'], [true, 'Record arrivals and proof of delivery'], [false, 'See other vehicles or outlets off their route']],
  STORE_MANAGER: [[true, 'Place and change orders for their outlet until the cutoff'], [true, 'See the arrival window, confirm receipt, report issues'], [false, 'See other outlets, plans or the audit log']],
  ADMIN: [[true, 'Manage people, devices and master data'], [true, 'Read the hash-chained audit log'], [false, 'Approve plans (dispatchers only)']],
};

interface Form {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  depot: Depot | '';
  outletId: string;
  isActive: boolean;
}

const EMPTY: Form = { role: 'STORE_MANAGER', name: '', email: '', phone: '', depot: '', outletId: '', isActive: true };

function PersonForm({ person }: { person: (User & { '@odata.etag'?: string }) | null }) {
  const { name: depotName, active: activeDepots, loading: depotsLoading } = useDepots();
  const nav = useScreenNav();
  const [form, setForm] = useState<Form>(
    person
      ? { role: person.role, name: person.name, email: person.email, phone: person.phone ?? '', depot: person.depot ?? '', outletId: person.outletId ?? '', isActive: person.isActive }
      : EMPTY,
  );
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  // Depot choices from the registry (ADM-21): depots in service, plus the person's current one if since deactivated.
  const depotChoices = [...activeDepots.map(d => d.code), ...(form.depot && !activeDepots.some(d => d.code === form.depot) ? [form.depot] : [])];
  const outlets = useQuery<Outlet[]>('adm-outlets', c => c.all<Outlet>('Outlets', { select: 'id,name,district,depot', orderby: 'id' }));
  const outlet = outlets.data?.find(o => o.id === form.outletId);
  const needsOutlet = form.role === 'STORE_MANAGER';
  const valid = form.name.trim() && (person || /\S+@\S+\.\S+/.test(form.email)) && (!needsOutlet || form.outletId);

  const save = useAction<void, User>(async c => {
    const depot = needsOutlet ? outlet?.depot ?? (form.depot || null) : form.depot || null;
    const common = { name: form.name.trim(), role: form.role, depot, outletId: needsOutlet ? form.outletId : null, phone: form.phone.trim() || null };
    if (person) return c.update<User>('Users', person.id, { ...common, isActive: form.isActive }, person['@odata.etag']);
    return c.create<User>('Users', { ...common, email: form.email.trim() });
  }, {
    onSuccess: u => {
      adminChanged();
      nav.notify(person ? `${u?.name ?? form.name.trim()} saved.` : `${u?.name ?? form.name.trim()} added. They can sign in with ${ROLE_INFO[form.role].face}.`);
      nav.go('L290');
    },
  });

  const first = form.name.trim().split(' ')[0] || 'this person';

  return (
    <div className="dx-drawer" style={{ width: '600px' }} role="dialog" aria-modal="true" aria-labelledby="person-title">
      <div className="dx-drawer__head">
        <span className="dx-lead" style={{ width: '44px', height: '44px' }}><Ic n={person ? 'user' : 'user-plus'} /></span>
        <div className="vstack" style={{ gap: '3px', flex: '1' }}>
          <span className="d-eyebrow">{"People and roles"}</span>
          <span className="dx-card__title" style={{ fontSize: '20px' }} id="person-title">{person ? `Edit ${person.name}` : 'Add person'}</span>
        </div>
        <span className="dx-close" data-lk="C"><Ic n="x" /></span>
      </div>
      <div className="dx-drawer__body">
        <div className="dx-field">
          <span className="dx-label">{"Role and face"}</span>
          <div className="dx-tabs" style={{ gap: '2px' }} role="radiogroup" aria-label="Role">
            {ROLES.map(r => (
              <span key={r} className={`dx-tab lv-click${form.role === r ? ' is-on' : ''}`} role="radio" aria-checked={form.role === r} tabIndex={0}
                onClick={e => { e.stopPropagation(); set('role', r); }} onKeyDown={e => { if (e.key === 'Enter') set('role', r); }}>
                <Ic n={ROLE_INFO[r].icon} className="ic ic--sm" />{ROLE_INFO[r].label.replace('Store manager', 'Store')}
              </span>
            ))}
          </div>
        </div>
        <div className="hstack" style={{ gap: '14px', alignItems: 'flex-start' }}>
          <div className="dx-field" style={{ flex: '1' }}><span className="dx-label">{"Full name"}</span><div className="dx-input dx-input--sm"><input className="lv-input" aria-label="Full name" value={form.name} onChange={e => set('name', e.target.value)} /></div></div>
          <div className="dx-field" style={{ flex: '1' }}><span className="dx-label">{"Mobile number"}</span><div className="dx-input dx-input--sm"><input className="lv-input" aria-label="Mobile number" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></div></div>
        </div>
        <div className="dx-field">
          <span className="dx-label">{"Work email"}</span>
          <div className="dx-input dx-input--sm">
            <Ic n="mail" />
            <input className="lv-input" aria-label="Work email" type="email" value={form.email} disabled={Boolean(person)} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        {needsOutlet ? (
          <div className="dx-field">
            <span className="dx-label">{"Outlet scope"}</span>
            <div className="dx-input dx-input--sm">
              <Ic n="store" />
              <select className="lv-input" aria-label="Outlet" value={form.outletId} onChange={e => set('outletId', e.target.value)}>
                <option value="">Choose an outlet…</option>
                {(outlets.data ?? []).map(o => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
              </select>
              <span className="spacer" />
              {outlet && <span className="t-3" style={{ fontSize: '13px' }}>{outlet.district} · {depotName(outlet.depot)}</span>}
            </div>
          </div>
        ) : form.role !== 'ADMIN' ? (
          <div className="dx-field">
            <span className="dx-label">{"Depot scope"}</span>
            <div className="hstack" style={{ gap: '10px', flexWrap: 'wrap' }}>
              {depotsLoading && !depotChoices.length && <span className="t-3" style={{ fontSize: '13px' }}>Loading depots…</span>}
              {depotChoices.map(d => (
                <div key={d} className={`adm-opt lv-click${form.depot === d ? ' is-on' : ''}`} style={{ flex: '1', padding: '10px 12px' }} role="radio" aria-checked={form.depot === d} tabIndex={0}
                  onClick={e => { e.stopPropagation(); set('depot', d); }} onKeyDown={e => { if (e.key === 'Enter') set('depot', d); }}>
                  <span className={`dx-radio${form.depot === d ? ' is-on' : ''}`} />
                  <span className="dx-td2"><b>{depotName(d)}</b><span>{d}</span></span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {person && (
          <div className="dx-field">
            <span className="dx-label">{"Access"}</span>
            <div className={`adm-opt lv-click${form.isActive ? ' is-on' : ''}`} style={{ padding: '10px 12px' }} role="checkbox" aria-checked={form.isActive} tabIndex={0}
              onClick={e => { e.stopPropagation(); set('isActive', !form.isActive); }} onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); set('isActive', !form.isActive); } }}>
              <span className={`dx-radio${form.isActive ? ' is-on' : ''}`} />
              <span className="dx-td2"><b>{form.isActive ? 'Can sign in' : 'Sign-in disabled'}</b><span>{"Turning this off also disables the identity in Keycloak"}</span></span>
            </div>
          </div>
        )}
        <div className="dx-inset" style={{ gap: '4px', padding: '14px 16px' }}>
          <div className="between" style={{ marginBottom: '4px' }}><span className="dx-sech"><b>What {first} can do</b></span><span className="dx-t13">{ROLE_INFO[form.role].label} preset</span></div>
          {CAN[form.role].map(([ok, t]) => (
            <div key={t} className="x-ck" style={{ minHeight: '32px' }}>
              <span className="x-ck__i" style={ok ? undefined : { background: 'var(--surface-3)', color: 'var(--text-3)' }}><Ic n={ok ? 'check' : 'x'} /></span>
              <span style={{ fontSize: '13.5px', color: ok ? 'var(--text)' : 'var(--text-2)' }}>{t}</span>
            </div>
          ))}
        </div>
        <ErrorBanner error={save.error} />
      </div>
      <div className="dx-drawer__foot">
        <span className="dx-t13" style={{ flex: '1' }}>{"Logged as a change by you in the audit chain."}</span>
        <span className="d-btn d-btn--ghost" data-lk="C">{"Cancel"}</span>
        <Btn className="d-btn d-btn--primary" testId="save-person" busy={save.pending} disabled={!valid} onClick={() => void save.run()}>
          <Ic n={person ? 'check' : 'send'} />{person ? 'Save changes' : 'Add person'}
        </Btn>
      </div>
    </div>
  );
}

export default function LiveAdm04AddOrEditPerson() {
  const [id] = useFocusId('user');
  const person = useEntity<User>('Users', id);
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-04 Add or edit person · desktop">
      <div className="d-app">
        <AdminSide active="N2" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"People and roles"}</div>
              <div className="d-h1">{"Who can sign in, where"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="dx-scrim" />
      {id && person.error && <div className="dx-drawer" style={{ width: '600px' }}><div className="dx-drawer__body"><ErrorBanner error={person.error} onRetry={person.refresh} /></div></div>}
      {id && !person.data && !person.error && <div className="dx-drawer" style={{ width: '600px' }}><div className="dx-drawer__body"><Skeleton rows={4} /></div></div>}
      {(!id || person.data) && <PersonForm key={person.data?.id ?? 'new'} person={id ? person.data ?? null : null} />}
    </div>
  );
}
