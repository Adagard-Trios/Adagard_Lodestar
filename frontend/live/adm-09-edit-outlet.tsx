'use client';
// ADM-09 Edit outlet, live. Markup and classes from the generated design (frontend/screens/adm-09-edit-outlet.tsx).
// The outlet chosen on ADM-08 (focus id, or ?id=). Saves the delivery window with
// PATCH Outlets('…') {windowOpen, windowClose} and If-Match (the ETag read with the outlet); the API checks
// HH:mm and open-before-close. The store manager is the outlet's STORE_MANAGER in Users.
// Not drawn: "Effective from" and "First used in" (a window change applies at once; outlets keep no dated
// versions), "Reason" (the PATCH has no reason field), "Trips this changes" (draft trips live only inside agent
// runs), and "Tell … " (no such notification). The footer says "Change is logged": the audit chain keeps the
// request, not the old value.
import { useState, type ReactNode } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { BRAND_LETTER, title } from '@/lib/format';
import { useAction, useEntity, useQuery } from '@/lib/odata/hooks';
import type { Outlet, User } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

const DOCK: Record<string, string> = { REAR_DOCK: 'rear_dock', STREET: 'street', MALL_BAY: 'mall_bay' };
const ACCESS: Record<string, string> = { NORMAL: 'normal access', VAN_ONLY: 'van_only', MALL_DOCK: 'mall_dock' };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function OutletForm({ outlet }: { outlet: Outlet & { '@odata.etag'?: string } }) {
  const { name: depotName } = useDepots();
  const nav = useScreenNav();
  const [open, setOpen] = useState(outlet.windowOpen);
  const [close, setClose] = useState(outlet.windowClose);
  const manager = useQuery<User | null>(`adm-outlet-manager:${outlet.id}`, async c =>
    (await c.list<User>('Users', { select: 'id,name', filter: `outletId eq '${outlet.id}' and role eq 'STORE_MANAGER'`, orderby: 'name', top: 1 })).value[0] ?? null);
  const formatOk = HHMM.test(open) && HHMM.test(close);
  const orderOk = formatOk && open < close;
  const changed = open !== outlet.windowOpen || close !== outlet.windowClose;
  const save = useAction<void, Outlet>(c => c.update<Outlet>('Outlets', outlet.id, { windowOpen: open, windowClose: close }, outlet['@odata.etag']), {
    onSuccess: () => { nav.notify(`${outlet.id} delivers ${open} to ${close} from now on.`); nav.go('L296'); },
  });
  const brand = `Waypoint ${title(outlet.brand)}`;

  return (
    <div className="dx-drawer" style={{ width: '620px' }} role="dialog" aria-modal="true" aria-labelledby="outlet-title">
      <div className="dx-drawer__head">
        <span className={`bb bb--${outlet.brand.toLowerCase()} bb--lg`}>{BRAND_LETTER[outlet.brand]}</span>
        <div className="vstack" style={{ gap: '3px', flex: '1' }}>
          <span className="d-eyebrow">{`Outlet · ${outlet.id}`}</span>
          <span className="dx-card__title" style={{ fontSize: '20px' }} id="outlet-title">{`${brand} ${outlet.name}`}</span>
          {manager.data && <span className="dx-t13">{`Store manager ${manager.data.name}`}</span>}
        </div>
        <span className="dx-close" data-lk="C"><Ic n="x" /></span>
      </div>
      <div className="dx-drawer__body">
        <div className="hstack" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <span className="m-tag m-tag--ok"><span className="dot" />{brand}</span>
          <span className="m-tag"><Ic n="depot" />{`${outlet.district} · ${depotName(outlet.depot)}`}</span>
          <span className="m-tag"><Ic n="store" />{`${DOCK[outlet.dockType] ?? outlet.dockType} · ${ACCESS[outlet.parking] ?? outlet.parking}`}</span>
        </div>
        <div className="dx-field">
          <span className="dx-label">{"Delivery window"}</span>
          <div className="hstack" style={{ gap: '12px' }}>
            <div className="adm-diff" style={{ flex: '1' }}>
              <span className="adm-diff__l">{"Now"}</span>
              <span className={`adm-diff__v${changed ? ' adm-diff__v--old' : ''}`} data-testid="window-now">{`${outlet.windowOpen} to ${outlet.windowClose}`}</span>
            </div>
            <Ic n="arrow-right" style={{ width: '20px', height: '20px', color: 'var(--text-3)', flexShrink: '0' }} />
            <div className="adm-diff adm-diff--new" style={{ flex: '1' }}>
              <span className="adm-diff__l">{"New"}</span>
              <span className="adm-diff__v hstack" style={{ gap: '6px' }}>
                <input className="lv-input" type="time" aria-label="Window opens" value={open} onChange={e => setOpen(e.target.value)} style={{ width: 'auto' }} />
                {"to"}
                <input className="lv-input" type="time" aria-label="Window closes" value={close} onChange={e => setClose(e.target.value)} style={{ width: 'auto' }} />
              </span>
            </div>
          </div>
          {formatOk && !orderOk && <span className="dx-t13" style={{ color: 'var(--st-exception-fg)' }} role="alert">{"A delivery window must end after it starts."}</span>}
        </div>
        <ErrorBanner error={save.error} />
      </div>
      <div className="dx-drawer__foot">
        <span className="dx-t13" style={{ flex: '1' }}>{"Change is logged"}</span>
        <span className="d-btn d-btn--ghost" data-lk="C">{"Cancel"}</span>
        <Btn className="d-btn d-btn--primary" testId="save-window" busy={save.pending} disabled={!changed || !orderOk} onClick={() => void save.run()}>
          <Ic n="check" />{"Save window change"}
        </Btn>
      </div>
    </div>
  );
}

/** The outlet drawer: over the page it was opened from (OverlayHost), or on its own route over the page's head. */
export function OutletDrawer({ onClose }: { onClose?: () => void }) {
  const [id] = useFocusId('outlet');
  const outlet = useEntity<Outlet>('Outlets', id);
  const wrap = (body: ReactNode) => <div className="dx-drawer" style={{ width: '620px' }}><div className="dx-drawer__body">{body}</div></div>;
  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      {!id && wrap(<Empty title="No outlet chosen" text="Pick an outlet in Outlets to change its window." icon="store" />)}
      {id && outlet.error && wrap(<ErrorBanner error={outlet.error} onRetry={outlet.refresh} />)}
      {id && !outlet.data && !outlet.error && wrap(<Skeleton rows={4} />)}
      {outlet.data && <OutletForm key={outlet.data.id} outlet={outlet.data} />}
    </>
  );
}

export default function LiveAdm09EditOutlet() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-09 Edit outlet · desktop">
      <div className="d-app">
        <AdminSide active="N4" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Master data"}</div>
              <div className="d-h1">{"Outlets"}</div>
              <div className="d-sub">{"The planning agent reads these rows for every draft. Change a window here, not in a plan."}</div>
            </div>
          </div>
        </div>
      </div>
      <OutletDrawer />
    </div>
  );
}
