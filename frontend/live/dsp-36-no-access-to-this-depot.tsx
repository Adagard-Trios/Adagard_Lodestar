'use client';
// DSP-36 No access to this depot, live. Markup and classes from the generated design
// (frontend/screens/dsp-36-no-access-to-this-depot.tsx).
// Reached when the API refuses a write with 403 for a depot outside the dispatcher's own (depot ABAC: "You do not
// plan for depot …", "no access to depot …"): the OData client records it (lib/desk-status) and the Plan desk
// watch comes here. The other depot's plans are not readable either (reads are filtered to the user's depots), so
// instead of a preview the screen says what was refused and offers the user's own depots. "Request edit access"
// mails the Lodestar admin (NEXT_PUBLIC_SUPPORT_EMAIL) or copies the request to send; only an admin can add a
// depot to an account (the depot attribute in Keycloak).
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { useAuth } from '@/lib/auth/AuthProvider';
import { resetOptions } from '@/lib/auth/reset';
import { useDeskStatus } from '@/lib/desk-status';
import { DEPOT_NAME, fmtDayTime } from '@/lib/format';
import { useDepot } from '@/lib/workday';

const name = (d: string | null | undefined) => (d ? DEPOT_NAME[d] ?? d : 'this depot');

/** The access request the admin receives. */
export function accessRequest(user: { name?: string; email?: string } | null | undefined, depot: string | null, own: string[]): string {
  return `Please give ${user?.name ?? 'me'}${user?.email ? ` (${user.email})` : ''} edit access to ${name(depot)} in Lodestar Plan. `
    + `I plan for ${own.map(d => name(d)).join(' and ') || 'no depot yet'}.`;
}

export default function LiveDsp36NoAccessToThisDepot() {
  const nav = useScreenNav();
  const { session } = useAuth();
  const { depots, setDepot } = useDepot();
  const { depotDenied } = useDeskStatus();
  const depot = depotDenied?.depot ?? null;
  const own = depots.map(d => name(d)).join(' and ');
  const support = resetOptions().supportEmail;
  const text = accessRequest(session, depot, depots);

  const request = async () => {
    if (support) {
      window.location.href = `mailto:${encodeURIComponent(support)}?subject=${encodeURIComponent(`Lodestar Plan: edit access to ${name(depot)}`)}&body=${encodeURIComponent(text)}`;
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      nav.notify('Request copied. Send it to the Lodestar admin, who grants depot access.');
    } catch {
      nav.notify(text);
    }
  };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-36 No access to this depot · desktop">
      <div className="d-app">
        <PlanSide active="N2" brandLk="L177" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {`${name(depot)} `}<span className="m-sep" />{" not one of your depots "}
                {depotDenied && <><span className="m-sep" />{` refused ${fmtDayTime(new Date(depotDenied.at))}`}</>}
              </div>
              <div className="d-h1" data-testid="denied-title">{depot ? `No access to ${name(depot)}` : 'No access to this depot'}</div>
            </div>
            <span className="d-btn" data-lk="B"><Ic n="arrow-left" />Back to {depots.length === 1 ? `${name(depots[0])} plan` : 'your plans'}</span>
            <Btn className="d-btn d-btn--primary" testId="request-access" onClick={() => void request()}><Ic n="user-plus" />{"Request edit access"}</Btn>
          </div>
          <div className="dx-hrow">
            <div className="dx-hero dx-hero--soft" style={{ flex: '1.35' }}>
              <div className="dx-hero__l"><Ic n="lock" />No access to edit {name(depot)}<span className="spacer" /><span className="m-pill"><Ic n="eye" />{"Your depots only"}</span></div>
              <div className="dx-h1xl" style={{ fontSize: '30px' }}>{"You can plan your own depots, not this one"}</div>
              <div className="dx-hero__m">
                {"Your account plans "}<b>{own || 'no depot yet'}</b>{". "}
                {name(depot)}{" plans are edited and approved by its own dispatchers. Lodestar shows and changes only the depots on your account; moves, drafts and approval for other depots are refused."}
              </div>
            </div>
            <div className="dx-card" style={{ flex: '1' }}>
              <div className="dx-card__head"><span className="dx-card__title">{"Who can give you edit access"}</span></div>
              <div className="dx-lrow">
                <span className="dx-lead"><Ic n="shield" /></span>
                <div className="dx-lrow__main"><span className="dx-lrow__t">{"Lodestar admin"}</span><span className="dx-lrow__m">{"Grants depot access · your request goes here"}</span></div>
              </div>
              <div className="dx-lrow">
                <span className="dx-lead"><Ic n="people" /></span>
                <div className="dx-lrow__main"><span className="dx-lrow__t">{name(depot)} dispatchers</span><span className="dx-lrow__m">{"Plan owners · they approve that depot's plans"}</span></div>
              </div>
            </div>
          </div>
          <div className="hstack" style={{ gap: '10px' }}>
            <span className="dx-sech">{"What was refused"}</span>
            <span className="dx-t13">{depotDenied ? `on ${depotDenied.path || 'this desk'}` : 'nothing in this tab yet'}</span>
          </div>
          <div className="dx-card">
            <div className="dx-lrow" style={{ alignItems: 'flex-start', padding: '14px 20px' }}>
              <span style={{ paddingTop: '2px' }}><span className="dx-code">{"DEPOT-ABAC"}</span></span>
              <div className="dx-lrow__main">
                <span className="dx-lrow__t" data-testid="denied-message">{depotDenied?.message ?? 'Lodestar refuses changes for depots outside your account.'}</span>
                <span className="dx-t14" style={{ whiteSpace: 'normal' }}>{"Nothing was changed. Every service checks your depots on each request, whatever the screen shows."}</span>
              </div>
            </div>
            {depots.map(d => (
              <Btn key={d} as="div" className="dx-lrow lv-click" onClick={() => { setDepot(d); nav.go('N2'); }} testId={`own-${d}`}>
                <span className="dx-lead"><Ic n="depot" /></span>
                <div className="dx-lrow__main"><span className="dx-lrow__t">Open the {name(d)} plan</span><span className="dx-lrow__m">{"One of your depots · full edit access"}</span></div>
                <Ic n="chevron-right" />
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
