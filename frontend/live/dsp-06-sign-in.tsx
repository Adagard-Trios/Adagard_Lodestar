'use client';
// DSP-06 Sign in · desktop, live. Markup and classes from the generated design (frontend/screens/dsp-06-sign-in.tsx).
import { Ic } from '@/components/live/icons';
import { DEPOT_NAME } from '@/lib/format';
import { useSignInEntry } from '@/components/live/SignInEntry';
import Btn from '@/components/live/Btn';

/**
 * Keycloak hosts the sign-in form; this screen is the entry point to it. "Continue" (the design's L144 to DSP-07)
 * opens Keycloak, which asks for the 2-step code itself when the account has an authenticator; DSP-07 shows the status.
 */
export default function LiveDsp06SignIn() {
  const entry = useSignInEntry('plan');
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-06 Sign in · desktop">
      <div className="dx-auth">
        <div className="dx-auth__brand">
          <div className="dx-auth__logo">
            <svg viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="#3B4CCA" />
              <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </g>
            </svg>
            {"Lodestar Plan"}
          </div>
          <div style={{"height": "18px"}} />
          <div className="dx-auth__tag">{"Every order,"}<br /><b>{"one thread."}</b></div>
          <div className="dx-auth__sub">
            {"Review the agent's plans, approve them for docks, drivers and stores, and follow every order to the shelf."}
          </div>
          <div style={{"display": "flex", "borderRadius": "28px", "overflow": "hidden", "background": "rgba(255,255,255,.04)"}}>
            <svg width="508" height="270" viewBox="0 0 508 270" style={{"flexShrink": "0"}}>
              <circle cx="404" cy="66" r="58" fill="#F5B83D" opacity=".10" />
              {" "}
              <circle cx="404" cy="66" r="34" fill="#F5B83D" opacity=".14" />
              {" "}
              <path d="M404 30 L411.5 58.5 L440 66 L411.5 73.5 L404 102 L396.5 73.5 L368 66 L396.5 58.5 Z" fill="#F5B83D" />
              {" "}
              <circle cx="404" cy="66" r="4" fill="#141B4D" />
              {" "}
              <path d="M0 214 C 70 150 130 170 190 132 C 250 94 318 150 372 122 C 424 96 468 112 508 96 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".30" />
              {" "}
              <path d="M0 244 C 90 200 168 222 250 188 C 330 156 412 204 508 172 L508 270 L0 270 Z" fill="#3B4CCA" opacity=".55" />
              {" "}
              <path d="M36 236 C 110 222 150 196 196 186 S 292 160 336 150 S 420 126 466 120" stroke="#F5B83D" strokeWidth="3" fill="none" strokeDasharray="1 10" strokeLinecap="round" />
              {" "}
              <circle cx="36" cy="236" r="9" fill="#FFFFFF" />
              <circle cx="36" cy="236" r="4" fill="#141B4D" />
              {" "}
              <circle cx="196" cy="186" r="7" fill="#FFCB5C" />
              {" "}
              <circle cx="336" cy="150" r="7" fill="#FFCB5C" />
              {" "}
              <circle cx="466" cy="120" r="10" fill="#F5B83D" stroke="#FFFFFF" strokeWidth="3" />
            </svg>
          </div>
          <div className="dx-auth__foot">
            {Object.entries(DEPOT_NAME).map(([k, name]) => <span key={k}><Ic n="depot" />{name}</span>)}
            <span><Ic n="lock" />{"Waypoint Group staff only"}</span>
          </div>
        </div>
        <div className="dx-auth__main">
          <div className="dx-auth__card">
            <div className="vstack" style={{"gap": "8px"}}>
              <span className="d-eyebrow">{"Waypoint Group · Lodestar Plan"}</span>
              <div className="dx-h1xl">{"Sign in to plan the run"}</div>
              <span className="dx-t14">{"Use your work email. Dispatchers and depot leads only."}</span>
            </div>
            <div className="dx-inset dx-inset--brand" style={{"flexDirection": "row", "alignItems": "flex-start", "gap": "12px", "padding": "14px 16px"}}>
              <Ic n="key" />
              <span className="dx-t14" style={{"fontSize": "13.5px"}}>
                <b>{"Waypoint single sign-on."}</b>
                {" You enter your work email and password on the Waypoint sign-in page, then come straight back to the plan."}
              </span>
            </div>
            <Btn as="div" className="dx-bigbtn" testId="sign-in" lk="L144" busy={entry.busy} disabled={entry.loading} onClick={entry.start}>
              {entry.label}<Ic n="arrow-right" />
            </Btn>
            <div className="between dx-t13"><span data-lk="L145">{"Trouble signing in? Call the Peliyagoda IT desk."}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
