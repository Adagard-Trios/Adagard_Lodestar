'use client';
// DSP-07 2-step verification, live. Markup and classes from the generated design (frontend/screens/dsp-07-2-step-verification.tsx).
// Keycloak owns 2-step verification: when an account has an authenticator app, Keycloak asks for the 6-digit code
// on its own sign-in page after the password (DSP-06 "Continue"), so Lodestar never sees or checks a code. This
// screen shows the signed-in user's status (Users/Lodestar.MyTwoFactor: authenticator set up or not, from the
// identity admin API) and opens Keycloak's account console, "Signing in", to set one up or replace it.
// "Continue to Lodestar Plan" goes to Today (the design's L146). Not drawn: the code boxes, "Trust this office
// computer" and "Send the code by SMS" (Keycloak's own page does this; the realm has no SMS authenticator).
import Btn from '@/components/live/Btn';
import { Ic } from '@/components/live/icons';
import { DEPOT_NAME } from '@/lib/format';
import { useTwoFactor } from '@/components/live/settings-data';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { runtimeConfig } from '@/lib/config';
import { fmtRunDate } from '@/lib/format';

/** Keycloak's account console, "Signing in" (two-factor authentication). */
export function accountSecurityUrl(authority: string): string {
  return `${authority.replace(/\/+$/, '')}/account/#/security/signingin`;
}

export default function LiveDsp072StepVerification() {
  const { session } = useAuth();
  const tf = useTwoFactor();
  const s = tf.data;
  const open = () => window.open(accountSecurityUrl(runtimeConfig().authority), '_blank', 'noopener');
  const status = !s ? null : !s.available ? 'unknown' : s.enabled ? 'on' : s.setupRequired ? 'required' : 'off';

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-07 2-step verification · desktop">
      <div className="dx-auth">
        <div className="dx-auth__brand">
          <div className="dx-auth__logo">
            <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></g></svg>
            {"Lodestar Plan"}
          </div>
          <div style={{ height: '18px' }} />
          <div className="dx-auth__tag">{"Every order,"}<br /><b>{"one thread."}</b></div>
          <div className="dx-auth__sub">{"Review the agent's plans, approve them for docks, drivers and stores, and follow every order to the shelf."}</div>
          <div style={{"display": "flex", "borderRadius": "28px", "overflow": "hidden", "background": "rgba(255,255,255,.04)"}}><svg width="508" height="270" viewBox="0 0 508 270" style={{"flexShrink": "0"}}><circle cx="404" cy="66" r="58" fill="#F5B83D" opacity=".10" />{" "}<circle cx="404" cy="66" r="34" fill="#F5B83D" opacity=".14" />{" "}<path d="M404 30 L411.5 58.5 L440 66 L411.5 73.5 L404 102 L396.5 73.5 L368 66 L396.5 58.5 Z" fill="#F5B83D" />{" "}<circle cx="404" cy="66" r="4" fill="#141B4D" />{" "}<path d="M0 214 C 70 150 130 170 190 132 C 250 94 318 150 372 122 C 424 96 468 112 508 96 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".30" />{" "}<path d="M0 244 C 90 200 168 222 250 188 C 330 156 412 204 508 172 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".55" />{" "}<path d="M36 236 C 110 222 150 196 196 186 S 292 160 336 150 S 420 126 466 120" stroke="#F5B83D" strokeWidth="3" fill="none" strokeDasharray="1 10" strokeLinecap="round" />{" "}<circle cx="36" cy="236" r="9" fill="#FFFFFF" /><circle cx="36" cy="236" r="4" fill="#141B4D" />{" "}<circle cx="196" cy="186" r="7" fill="#FFCB5C" />{" "}<circle cx="336" cy="150" r="7" fill="#FFCB5C" />{" "}<circle cx="466" cy="120" r="10" fill="#F5B83D" stroke="#FFFFFF" strokeWidth="3" /></svg></div>
          <div className="dx-auth__foot">
            {Object.entries(DEPOT_NAME).map(([k, name]) => <span key={k}><Ic n="depot" />{name}</span>)}
            <span><Ic n="lock" />{"Waypoint Group staff only"}</span>
          </div>
        </div>
        <div className="dx-auth__main">
          <div className="dx-auth__card" data-testid="two-factor">
            <div className="hstack" style={{ gap: '10px' }}>
              <span className="dx-lead"><Ic n="shield-check" /></span>
              <span className="d-eyebrow">{`Step 2 of 2 · ${session?.email ?? session?.username ?? session?.name ?? ''}`}</span>
            </div>
            <div className="vstack" style={{ gap: '8px' }}>
              <div className="dx-h1xl">
                {status === 'on' ? '2-step verification is on' : status === 'off' || status === 'required' ? 'Set up 2-step verification' : '2-step verification'}
              </div>
              <span className="dx-t14">
                {status === 'on' && <>{"Waypoint sign-in asks for the 6-digit code from your authenticator app after your password."}{s?.otp[0]?.label ? <> {"Device: "}<b>{s.otp[0].label}</b>{"."}</> : null}{s?.otp[0]?.createdAt ? ` Set up ${fmtRunDate(s.otp[0].createdAt)}.` : ''}</>}
                {status === 'required' && 'Waypoint sign-in will ask you to scan a QR code with an authenticator app the next time you sign in.'}
                {status === 'off' && 'Add an authenticator app (Google Authenticator, Microsoft Authenticator, FreeOTP) in your Waypoint account. After that, sign-in asks for its 6-digit code.'}
                {status === 'unknown' && 'Waypoint sign-in asks for the 6-digit code from your authenticator app when your account has one. Manage it in your Waypoint account.'}
              </span>
            </div>
            <ErrorBanner error={tf.error} onRetry={tf.refresh} />
            {!s && !tf.error && <Skeleton rows={2} label="Checking your sign-in methods…" />}
            {s && s.otp.length > 1 && (
              <div className="vstack" style={{ gap: '4px' }}>
                {s.otp.map((c, i) => <span key={i} className="dx-t13"><Ic n="phone" />{` ${c.label ?? 'Authenticator'}${c.createdAt ? ` · ${fmtRunDate(c.createdAt)}` : ''}`}</span>)}
              </div>
            )}
            <div className="hstack" style={{ gap: '10px', fontSize: '14px' }}>
              <span className="dx-check" style={status === 'on' ? undefined : { opacity: 0.4 }}><Ic n="check" /></span>
              {status === 'on' ? 'Authenticator app set up' : 'No authenticator app yet'}
            </div>
            <div className="dx-bigbtn" data-lk="L146">{"Continue to Lodestar Plan"}<Ic n="arrow-right" /></div>
            <div className="hstack" style={{ gap: '8px', fontSize: '14px' }}>
              <Btn className="x-link" onClick={open}>{status === 'on' ? 'Manage in your Waypoint account' : 'Set up in your Waypoint account'}</Btn>
              <span className="t-3">{"· opens Waypoint sign-in"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
