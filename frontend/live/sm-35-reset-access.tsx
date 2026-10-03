'use client';
// SM-35 Reset access · desktop, live. Markup and classes from the generated design (frontend/screens/sm-35-reset-access.tsx).
// Reached from SM-26's "Trouble signing in?" (L123). Keycloak owns credentials (lib/auth/reset.ts). Two ways, as the
// design's switch shows:
//  - "Email me a link": Keycloak's reset-credentials page, which emails a one-time link (only when the realm
//    allows self-service reset; otherwise the tab says so and points to the admin);
//  - "Ask the admin": the Lodestar admin resets single sign-on; the depot takes orders by phone meanwhile.
// Lodestar keeps no depot phone numbers: the call line shows NEXT_PUBLIC_SUPPORT_PHONE when it is configured
// (lib/auth/reset.ts) and otherwise names the depot without a number.
// "Back to sign in" is the design's L141; once reset, "Sign in with your new password" follows L140 (the store desk,
// which asks Keycloak to sign in first).
import { useState } from 'react';
import { Ic } from '@/components/live/icons';
import { CUTOFF_LABEL } from '@/lib/workday';
import { runtimeConfig } from '@/lib/config';
import { useDepots } from '@/components/live/depots';
import { useAuth } from '@/lib/auth/AuthProvider';
import { adminRequestMail, depotLabel, resetCredentialsUrl, resetOptions, telHref } from '@/lib/auth/reset';

type Tab = 'email' | 'admin';

export default function LiveSm35ResetAccess() {
  const opts = resetOptions();
  const { session } = useAuth();
  const { name: depotName } = useDepots();
  const depot = depotLabel(session?.depots, depotName);
  const [tab, setTab] = useState<Tab>(opts.selfService ? 'email' : 'admin');
  // live screens render in the browser only (LiveSwitch waits for the client), so the runtime config is there
  const resetUrl = opts.selfService && typeof window !== 'undefined' ? resetCredentialsUrl(runtimeConfig()) : null;

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-35 Reset access · desktop">
      <div className="sx-dauth">
        <div className="sx-dauth__brand">
          <div className="sx-dauth__logo">
            <svg viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="#047857" />
              <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v8h14v-8M10 21v-5h4v5" />
              </g>
            </svg>
            {"Lodestar Store"}
          </div>
          <div className="sx-dauth__h">{"Every order,"}<br />{"one thread."}</div>
          <div className="vstack" style={{ gap: '16px' }}>
            <div className="sx-dauth__li"><span><Ic n="clock" /></span><div><b>{`Order before ${CUTOFF_LABEL}`}</b>{" for the next morning's run"}</div></div>
            <div className="sx-dauth__li"><span><Ic n="van-2" /></span><div><b>{"Arrival window by 7 PM"}</b>{", live while the van is out"}</div></div>
            <div className="sx-dauth__li"><span><Ic n="check" /></span><div><b>{"Confirm what arrived"}</b>{", credit notes raised for you"}</div></div>
          </div>
          <div className="sx-dauth__foot">
            <b style={{ color: '#FFFFFF' }}>{"Waypoint Group"}</b>
            <span className="m-sep" style={{ background: '#B9C0E6' }} />
            {"Fresh · Style · Tech"}
          </div>
        </div>
        <div className="sx-dauth__form">
          <div className="sx-dcard">
            <span className="sx-link ax-back" data-lk="L141"><Ic n="arrow-left" />{"Back to sign in"}</span>
            <div className="vstack" style={{ gap: '6px' }}>
              <span className="d-h1" style={{ fontSize: '30px' }}>{"Sign-in help"}</span>
              <span className="d-sub" style={{ fontSize: '15px' }}>{"Get back into the counter PC when your sign-in or 2-step code doesn't work."}</span>
            </div>
            <div className="m-seg" style={{ margin: '0' }} role="tablist">
              {([['email', 'Email me a link'], ['admin', 'Ask the admin']] as Array<[Tab, string]>).map(([k, label]) => (
                <span
                  key={k}
                  className={`m-seg__i lv-click${tab === k ? ' is-on' : ''}`}
                  role="tab"
                  tabIndex={0}
                  aria-selected={tab === k}
                  data-testid={`tab-${k}`}
                  onClick={e => { e.stopPropagation(); setTab(k); }}
                  onKeyDown={e => { if (e.key === 'Enter') setTab(k); }}
                >
                  {label}
                </span>
              ))}
            </div>
            {tab === 'email' && (
              resetUrl ? (
                <>
                  <div className="ax-sent">
                    <span className="ax-disc ax-disc--ok"><Ic n="mail" /></span>
                    <div className="ax-sent__t">
                      <b>{"Reset on the Waypoint sign-in page"}</b>
                      <span>{"Enter your work email there. The link works once, for a few minutes."}</span>
                    </div>
                  </div>
                  <a className="d-btn d-btn--primary sx-dbtn-xl" href={resetUrl} data-testid="reset-link" onClick={e => e.stopPropagation()}>{"Email me a reset link"}<Ic n="external" /></a>
                  <span className="d-btn d-btn--ghost" data-lk="L140" data-testid="sign-in-new">{"Sign in with your new password"}<Ic n="arrow-right" /></span>
                </>
              ) : (
                <div className="ax-sent" data-testid="no-self-reset">
                  <span className="ax-disc"><Ic n="info" /></span>
                  <div className="ax-sent__t">
                    <b>{"Email reset is not switched on for Waypoint sign-in"}</b>
                    <span>{"Your sign-in is reset by the Lodestar admin. Use “Ask the admin”."}</span>
                  </div>
                </div>
              )
            )}
            {tab === 'admin' && (
              <>
                <div className="ax-sent" data-testid="admin-path">
                  <span className="ax-disc ax-disc--ok"><Ic n="shield" /></span>
                  <div className="ax-sent__t">
                    <b>{"The Lodestar admin resets your sign-in"}</b>
                    <span>{"They reset single sign-on for your outlet account. Usually within 1 hour."}</span>
                  </div>
                </div>
                {opts.supportEmail && (
                  <a className="d-btn d-btn--primary sx-dbtn-xl" href={adminRequestMail(opts.supportEmail, 'Lodestar Store')} onClick={e => e.stopPropagation()}>{"Message the admin"}<Ic n="mail" /></a>
                )}
                <span className="d-btn d-btn--ghost" data-lk="L140">{"Sign in after the reset"}<Ic n="arrow-right" /></span>
              </>
            )}
            <div className="sx-divider" />
            <div className="sx-help ax-help">
              <Ic n="shield" className="ic ic--sm" />
              <span>{"No access to your inbox? "}<span className="sx-link lv-click" role="button" tabIndex={0} onClick={e => { e.stopPropagation(); setTab('admin'); }} onKeyDown={e => { if (e.key === 'Enter') setTab('admin'); }}>{"Ask the Lodestar admin"}</span>{" to reset your sign-in. Usually within 1 hour."}</span>
            </div>
            <div className="sx-help ax-help">
              <Ic n="call" className="ic ic--sm" />
              <span data-testid="depot-call">
                {`Order due before ${CUTOFF_LABEL}? Call ${depot}`}
                {opts.supportPhone ? <>{', '}<a className="sx-link" style={{ whiteSpace: 'nowrap' }} href={telHref(opts.supportPhone)} onClick={e => e.stopPropagation()}>{opts.supportPhone}</a></> : '.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
