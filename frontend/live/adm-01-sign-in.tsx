'use client';
// ADM-01 Sign in · desktop, live. Markup and classes from the generated design (frontend/screens/adm-01-sign-in.tsx).
import { Ic } from '@/components/live/icons';
import { useSignInEntry } from '@/components/live/SignInEntry';
import Btn from '@/components/live/Btn';

/** Keycloak hosts the sign-in form; this screen is the entry point to it. */
export default function LiveAdm01SignIn() {
  const entry = useSignInEntry('admin');
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-01 Sign in · desktop">
      <div className="dx-auth">
        <div className="dx-auth__brand adm-brand">
          <div className="dx-auth__logo">
            <svg width="36" height="36" viewBox="0 0 32 32" style={{"flexShrink": "0"}}>
              <rect width="32" height="32" rx="8" fill="#334155" />
              <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </g>
            </svg>
            {"Lodestar Admin"}
          </div>
          <div className="dx-auth__tag">{"Keep the keys,"}<br /><b>{"keep the thread."}</b></div>
          <div className="dx-auth__sub">
            {"People, devices and master data behind Lodestar Plan, Dock, Run and Store. Changes here reach every face."}
          </div>
          <div style={{"display": "flex", "justifyContent": "center"}}>
            <svg width="508" height="300" viewBox="0 0 508 300" style={{"flexShrink": "0"}}>
              <circle cx="254" cy="150" r="118" fill="none" stroke="#94A3B8" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="2 8" />
              {" "}
              <circle cx="254" cy="150" r="70" fill="#F5B83D" opacity=".07" />
              {" "}
              <path d="M254 150 L120 64 M254 150 L388 64 M254 150 L120 236 M254 150 L388 236" stroke="#94A3B8" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
              {" "}
              <g transform="translate(222 118) scale(2)">
                <rect width="32" height="32" rx="8" fill="#334155" stroke="#64748B" strokeWidth=".6" />
                <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </g>
              </g>
              {" "}
              <g transform="translate(96 40) scale(1.5)">
                <rect width="32" height="32" rx="8" fill="#3B4CCA" />
                <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </g>
              </g>
              {" "}
              <g transform="translate(364 40) scale(1.5)">
                <rect width="32" height="32" rx="8" fill="#141B4D" stroke="#475569" strokeWidth=".6" />
                <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="M3.3 7 12 12l8.7-5M12 22V12" />
                </g>
              </g>
              {" "}
              <g transform="translate(96 212) scale(1.5)">
                <rect width="32" height="32" rx="8" fill="#0369A1" />
                <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 11 19-9-9 19-2-8-8-2z" />
                </g>
              </g>
              {" "}
              <g transform="translate(364 212) scale(1.5)">
                <rect width="32" height="32" rx="8" fill="#047857" />
                <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l1.5-5h15L21 9" />
                  <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
                  <path d="M5 13v8h14v-8M10 21v-5h4v5" />
                </g>
              </g>
              <text x="120" y="30" textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="700" fill="#CBD5E1">{"Plan"}</text>
              <text x="388" y="30" textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="700" fill="#CBD5E1">{"Dock"}</text>
              <text x="120" y="290" textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="700" fill="#CBD5E1">{"Run"}</text>
              <text x="388" y="290" textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="700" fill="#CBD5E1">{"Store"}</text>
            </svg>
          </div>
          <div className="dx-auth__foot">
            <span><Ic n="depot" />{"Waypoint Group HQ, Peliyagoda"}</span>
            <span><Ic n="lock" />{"Every action signed and logged"}</span>
          </div>
        </div>
        <div className="dx-auth__main">
          <div className="dx-auth__card">
            <div className="vstack" style={{"gap": "8px"}}>
              <span className="d-eyebrow">{"Waypoint Group · Lodestar Admin"}</span>
              <div className="dx-h1xl">{"Sign in to the admin console"}</div>
              <span className="dx-t14">
                {"For operations systems admins only. Dispatchers, loaders, drivers and store staff sign in to their own app."}
              </span>
            </div>
            <Btn as="div" className="dx-bigbtn" testId="sign-in" busy={entry.busy} disabled={entry.loading} onClick={entry.start}>
              <Ic n="key" />{entry.label}
            </Btn>
            <div className="dx-inset dx-inset--brand" style={{"flexDirection": "row", "alignItems": "flex-start", "gap": "12px", "padding": "14px 16px"}}>
              <svg className="ic" viewBox="0 0 24 24" style={{"width": "20px", "height": "20px", "color": "var(--brand-600)", "flexShrink": "0", "marginTop": "1px"}}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="dx-t14" style={{"fontSize": "13.5px"}}>
                <b>{"2-step verification is required."}</b>
                {" Next you confirm with your security key or the authenticator code on your work phone. There is no way to skip it."}
              </span>
            </div>
            <div className="between dx-t13"><span>{"Lost your security key? Call the Peliyagoda IT desk."}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
