'use client';
// SM-26 Sign in · desktop, live. Markup and classes from the generated design (frontend/screens/sm-26-sign-in.tsx).
import { Ic } from '@/components/live/icons';
import { useSignInEntry } from '@/components/live/SignInEntry';
import Btn from '@/components/live/Btn';

/** Keycloak hosts the sign-in form; this screen is the entry point to it. */
export default function LiveSm26SignIn() {
  const entry = useSignInEntry('store');
  return (
    <div className="frame frame--desktop mode-store" data-name="SM-26 Sign in · desktop">
      <div className="sx-dauth">
        <div className="sx-dauth__brand">
          <div className="sx-dauth__logo">
            <svg viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="#047857" />
              <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l1.5-5h15L21 9" />
                <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
                <path d="M5 13v8h14v-8M10 21v-5h4v5" />
              </g>
            </svg>
            {"Lodestar Store"}
          </div>
          <div className="sx-dauth__h">{"Every order,"}<br />{"one thread."}</div>
          <div className="vstack" style={{"gap": "16px"}}>
            <div className="sx-dauth__li"><span><Ic n="clock" /></span><div><b>{"Order before 4:00 PM"}</b>{" for the next morning's run"}</div></div>
            <div className="sx-dauth__li">
              <span><Ic n="van-2" /></span>
              <div><b>{"Arrival window by 7 PM"}</b>{", live while the van is out"}</div>
            </div>
            <div className="sx-dauth__li">
              <span><Ic n="check" /></span>
              <div><b>{"Confirm what arrived"}</b>{", credit notes raised for you"}</div>
            </div>
          </div>
          <div className="sx-dauth__foot">
            <b style={{"color": "#FFFFFF"}}>{"Waypoint Group"}</b>
            <span className="m-sep" style={{"background": "#B9C0E6"}} />
            {"Fresh · Style · Tech"}
          </div>
          <svg viewBox="0 0 620 200" style={{"width": "620px", "height": "200px", "margin": "0 -56px", "flexShrink": "0"}}>
            <path d="M0 100 C90 50 180 40 270 84 C350 120 450 40 620 60 L620 200 L0 200 Z" fill="#5566E0" fillOpacity=".35" />
            {" "}
            <path d="M0 146 C130 104 250 116 360 134 C460 150 540 130 620 134 L620 200 L0 200 Z" fill="#0A0F2E" fillOpacity=".85" />
            {" "}
            <path d="M0 188 C110 160 200 168 290 152 C380 136 480 136 620 130" stroke="#F5B83D" strokeWidth="4" strokeDasharray="10 10" fill="none" />
            {" "}
            <g transform="translate(150 -86)">
              <rect x="126" y="206" width="60" height="34" rx="8" fill="#FFFFFF" />
              <path d="M186 214 h15 l11 13 v13 h-26 z" fill="#FFFFFF" />
              <path d="M189 217 h10 l8 10 h-18 z" fill="#9EE3F0" />
              <path d="M156 214v18M148.2 218.5l15.6 9M148.2 227.5l15.6-9" stroke="#0E7490" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="143" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" strokeWidth="3" />
              <circle cx="197" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" strokeWidth="3" />
            </g>
            {" "}
            <circle cx="540" cy="30" r="14" fill="#FFCB5C" />
            <circle cx="547" cy="25" r="12" fill="#27348F" />
          </svg>
        </div>
        <div className="sx-dauth__form">
          <div className="sx-dcard">
            <div className="vstack" style={{"gap": "6px"}}>
              <span className="d-h1" style={{"fontSize": "30px"}}>{"Sign in"}</span>
              <span className="d-sub" style={{"fontSize": "15px"}}>{"For store managers and receiving staff of Waypoint outlets."}</span>
            </div>
            <div className="sx-field">
              <span className="sx-field__l">{"Waypoint sign-in"}</span>
              <span className="d-sub" style={{"fontSize": "15px"}}>
                {"You sign in on the Waypoint sign-in page with your outlet account, then come straight back to your store desk."}
              </span>
            </div>
            <Btn className="d-btn d-btn--primary sx-dbtn-xl" testId="sign-in" busy={entry.busy} disabled={entry.loading} onClick={entry.start}>
              {entry.label}<Ic n="arrow-right" />
            </Btn>
            <div className="sx-divider" />
            <div className="sx-help" data-lk="L123">
              <svg className="ic ic--sm" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {"Trouble signing in? Call Kandy Hub, +94 81 222 4410"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
