'use client';
// SM-26 Sign in · desktop, live. Markup and classes from the generated design (frontend/screens/sm-26-sign-in.tsx).
// As designed: phone number + 6-digit code from SMS, posted straight to the token endpoint (lib/auth/direct.ts,
// the realm's "lodestar direct grant" flow). "Remember this counter PC" keeps the number on this computer for 30 days.
import { useRef, useState } from 'react';
import { Ic } from '@/components/live/icons';
import { CUTOFF_LABEL } from '@/lib/workday';
import Btn from '@/components/live/Btn';
import { resetOptions } from '@/lib/auth/reset';
import { clock, localNumber, needsCode, type SignInStep } from '@/lib/auth/direct';
import { bareInput, CodeInput, DemoCode, remembered, SignInMessage, useCountdown, useDirectSignIn } from '@/components/live/DirectSignIn';

export default function LiveSm26SignIn() {
  const flow = useDirectSignIn('store');
  // Lodestar keeps no depot phone numbers: the configured support line (NEXT_PUBLIC_SUPPORT_PHONE) when set.
  const { supportPhone } = resetOptions();
  const [phone, setPhone] = useState(() => remembered.get('store.phone') ?? '');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(() => Boolean(remembered.get('store.phone')));
  const [step, setStep] = useState<SignInStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const left = useCountdown(resendAt);
  const sent = step?.error === 'code_sent';


  const send = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Enter your mobile number.');
      phoneRef.current?.focus();
      return;
    }
    const r = await flow.submit({ phone });
    if (r.ok) return;
    if (needsCode(r)) {
      setStep(r);
      setCode('');
      setResendAt(Date.now() + (r.resendIn ?? 30) * 1000);
    } else {
      setError(r.description);
      if (r.retryAfter) setResendAt(Date.now() + r.retryAfter * 1000);
    }
  };

  const verify = async (value = code) => {
    if (!sent) return send();
    if (value.length !== 6) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setError(null);
    remembered.set('store.phone', remember ? phone : null);
    const r = await flow.submit({ phone, code: value });
    if (!r.ok) {
      setError(r.description);
      setCode('');
      if (r.error === 'code_expired' || r.error === 'code_locked') setStep(null);
    }
  };

  const change = () => {
    setStep(null);
    setCode('');
    setError(null);
    setResendAt(null);
    phoneRef.current?.focus();
  };

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
            <div className="sx-dauth__li"><span><Ic n="clock" /></span><div><b>{`Order before ${CUTOFF_LABEL}`}</b>{" for the next morning's run"}</div></div>
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
          <form className="sx-dcard" onSubmit={e => { e.preventDefault(); void verify(); }} noValidate>
            <div className="vstack" style={{"gap": "6px"}}>
              <span className="d-h1" style={{"fontSize": "30px"}}>{"Sign in"}</span>
              <span className="d-sub" style={{"fontSize": "15px"}}>{"For store managers and receiving staff of Waypoint outlets."}</span>
            </div>
            <div className="sx-field">
              <div className="between">
                <label className="sx-field__l" htmlFor="sm26-phone">{"Phone number"}</label>
                {sent && <Btn className="sx-link" style={{"fontSize": "13px"}} onClick={change} testId="change-phone">{"Change"}</Btn>}
              </div>
              <div className={`sx-field__box${sent ? '' : ' is-focus'}`} style={{"height": "54px"}}>
                <span className="sx-field__pre"><small>{"LK"}</small>{"+94"}</span>
                <input
                  id="sm26-phone"
                  ref={phoneRef}
                  className="sx-field__v"
                  style={{ ...bareInput, "fontSize": "19px" }}
                  data-testid="phone-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="77 123 4567"
                  value={sent ? localNumber(phone) : phone}
                  readOnly={sent}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="sx-field">
              <div className="between">
                <span className="sx-field__l">{"6-digit code from SMS"}</span>
                {left > 0
                  ? <span style={{"fontSize": "13px", "color": "var(--text-3)"}}>{`Resend in ${clock(left)}`}</span>
                  : <Btn className="sx-link" style={{"fontSize": "13px"}} onClick={() => void send()} disabled={flow.busy} testId="send-code">{sent ? 'Resend code' : 'Send code'}</Btn>}
              </div>
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={v => void verify(v)}
                autoFocus={sent}
                render={(chars, focus) => (
                  <div className="sx-otp">
                    {chars.map((c, i) => <div key={i} className={`sx-otp__c${i === focus ? ' is-focus' : ''}`} style={{"height": "56px"}}>{c}</div>)}
                  </div>
                )}
              />
              <DemoCode code={step?.demoCode} />
            </div>
            <SignInMessage text={error} />
            <div className="sx-check" role="checkbox" aria-checked={remember} tabIndex={0} style={{ cursor: 'pointer' }}
              onClick={() => setRemember(r => !r)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRemember(r => !r); } }}>
              <i style={remember ? undefined : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px var(--line-strong)' }}><Ic n="check" /></i>{"Remember this counter PC for 30 days"}
            </div>
            <Btn className="d-btn d-btn--primary sx-dbtn-xl" lk="L122" testId="sign-in" busy={flow.busy} onClick={() => void verify()}>
              {flow.busy ? (sent ? 'Signing in…' : 'Sending code…') : 'Sign in'}<Ic n="arrow-right" />
            </Btn>
            <div className="sx-divider" />
            <div className="sx-help" data-lk="L123">
              <svg className="ic ic--sm" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {supportPhone ? `Trouble signing in? Call ${supportPhone}` : 'Trouble signing in? Get sign-in help'}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
