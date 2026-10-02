'use client';
// DSP-34 Reset access · desktop, live. Markup and classes from the generated design (frontend/screens/dsp-34-reset-access.tsx).
// Reached from DSP-06's "Trouble signing in?" (L145). Keycloak owns credentials (lib/auth/reset.ts): when the realm
// allows self-service reset, "Reset with your work email" opens Keycloak's reset-credentials page, which emails a
// one-time link; otherwise (the shipped realm) the screen gives the admin-request path the design shows. "Back to
// sign in" is the design's link (L175).
import { Ic } from '@/components/live/icons';
import { runtimeConfig } from '@/lib/config';
import { adminRequestMail, resetCredentialsUrl, resetOptions } from '@/lib/auth/reset';

export default function LiveDsp34ResetAccess() {
  const opts = resetOptions();
  // live screens render in the browser only (LiveSwitch waits for the client), so the runtime config is there
  const resetUrl = opts.selfService && typeof window !== 'undefined' ? resetCredentialsUrl(runtimeConfig()) : null;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-34 Reset access · desktop">
      <div className="dx-auth">
        <div className="dx-auth__brand">
          <div className="dx-auth__logo">
            <svg viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="#3B4CCA" />
              <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </g>
            </svg>
            {"Lodestar Plan"}
          </div>
          <div style={{ height: '18px' }} />
          <div className="dx-auth__tag">{"Every order,"}<br /><b>{"one thread."}</b></div>
          <div className="dx-auth__sub">{"Review the agent's plans, approve them for docks, drivers and stores, and follow every order to the shelf."}</div>
          <div style={{ display: 'flex', borderRadius: '28px', overflow: 'hidden', background: 'rgba(255,255,255,.04)' }}>
            <svg width="508" height="270" viewBox="0 0 508 270" style={{ flexShrink: '0' }} aria-hidden>
              <circle cx="404" cy="66" r="58" fill="#F5B83D" opacity=".10" />
              <circle cx="404" cy="66" r="34" fill="#F5B83D" opacity=".14" />
              <path d="M404 30 L411.5 58.5 L440 66 L411.5 73.5 L404 102 L396.5 73.5 L368 66 L396.5 58.5 Z" fill="#F5B83D" />
              <circle cx="404" cy="66" r="4" fill="#141B4D" />
              <path d="M0 214 C 70 150 130 170 190 132 C 250 94 318 150 372 122 C 424 96 468 112 508 96 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".30" />
              <path d="M0 244 C 90 200 168 222 250 188 C 330 156 412 204 508 172 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".55" />
              <path d="M36 236 C 110 222 150 196 196 186 S 292 160 336 150 S 420 126 466 120" stroke="#F5B83D" strokeWidth="3" fill="none" strokeDasharray="1 10" strokeLinecap="round" />
              <circle cx="36" cy="236" r="9" fill="#FFFFFF" /><circle cx="36" cy="236" r="4" fill="#141B4D" />
              <circle cx="196" cy="186" r="7" fill="#FFCB5C" /><circle cx="336" cy="150" r="7" fill="#FFCB5C" />
              <circle cx="466" cy="120" r="10" fill="#F5B83D" stroke="#FFFFFF" strokeWidth="3" />
            </svg>
          </div>
          <div className="dx-auth__foot">
            <span><Ic n="depot" />{"Peliyagoda DC"}</span>
            <span><Ic n="depot" />{"Kandy Hub"}</span>
            <span><Ic n="lock" />{"Waypoint Group staff only"}</span>
          </div>
        </div>
        <div className="dx-auth__main">
          <div className="dx-auth__card">
            <div className="hstack" style={{ gap: '10px' }}>
              <span className="dx-lead dx-lead--ok"><Ic n={opts.selfService ? 'mail-check' : 'key-round'} /></span>
              <span className="d-eyebrow">{"Trouble signing in · Waypoint single sign-on"}</span>
            </div>
            <div className="vstack" style={{ gap: '8px' }}>
              <div className="dx-h1xl">{opts.selfService ? 'Reset with your work email' : 'Your admin resets your sign-in'}</div>
              <span className="dx-t14" data-testid="reset-how">
                {opts.selfService
                  ? 'The Waypoint sign-in page asks for your work email and sends a single sign-on reset link. It works once and expires in minutes.'
                  : 'Passwords and 2-step codes for Lodestar are kept by Waypoint single sign-on, and resets go through the Lodestar admin. Ask them below; they can also restore depot access.'}
              </span>
            </div>
            <div className="dx-inset dx-inset--brand ax-note">
              <Ic n="shield-check" />
              <div className="vstack" style={{ gap: '2px' }}>
                <b>{"Your draft plan is safe"}</b>
                <span className="dx-t14">{"Agent drafts and plans live on the server, not in this browser. Nothing goes live until a dispatcher approves."}</span>
              </div>
            </div>
            {resetUrl && (
              <a className="dx-bigbtn" href={resetUrl} data-testid="reset-link" onClick={e => e.stopPropagation()}>
                <Ic n="mail" />{"Reset with your work email"}<Ic n="external" />
              </a>
            )}
            <div className={resetUrl ? 'd-btn' : 'dx-bigbtn'} data-lk="L175" data-testid="back-to-sign-in"><Ic n="arrow-left" />{"Back to sign in"}</div>
            <div className="dx-or"><i />{"or ask a person"}<i /></div>
            <div className="vstack" style={{ gap: '14px' }}>
              <div className="hstack" style={{ gap: '12px', alignItems: 'flex-start' }}>
                <span className="dx-lead"><Ic n="shield" /></span>
                <div className="vstack" style={{ gap: '1px', flex: '1', minWidth: '0' }}>
                  <b style={{ fontSize: '15px' }}>{"Ask the Lodestar admin"}</b>
                  <span className="dx-t13">{"Resets single sign-on and depot access"}</span>
                </div>
                {opts.supportEmail && (
                  <a className="x-link" style={{ marginTop: '9px' }} href={adminRequestMail(opts.supportEmail, 'Lodestar Plan')} onClick={e => e.stopPropagation()}>{"Message"}</a>
                )}
              </div>
              <div className="hstack" style={{ gap: '12px', alignItems: 'flex-start' }}>
                <span className="dx-lead"><Ic n="headset" /></span>
                <div className="vstack" style={{ gap: '1px', flex: '1', minWidth: '0' }}>
                  <b style={{ fontSize: '15px' }}>{"Call the Peliyagoda IT desk"}</b>
                  <span className="dx-t13">{opts.supportPhone ? `${opts.supportPhone} · locked accounts, new phones` : 'Open 24 hours · locked accounts, new phones'}</span>
                </div>
                {opts.supportPhone && (
                  <a className="x-link" style={{ marginTop: '9px' }} href={`tel:${opts.supportPhone.replace(/\s+/g, '')}`} onClick={e => e.stopPropagation()}>{"Call"}</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
