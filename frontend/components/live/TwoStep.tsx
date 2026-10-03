'use client';
// The second sign-in step of the desk (DSP-07 "Enter the 6-digit code", and ADM-01's "Next you confirm with … the
// authenticator code"): markup and classes of the generated DSP-07. The email and password from step 1 are posted
// again with the code (lib/auth/direct.ts pendingPassword, memory only):
//  - authenticator app (401 otp_required): `totp`, with "Send the code by SMS instead" when the user has a phone;
//  - SMS (401 code_sent): `code`, with a resend after the 30 s cooldown.
import { useState } from 'react';
import { Ic } from '@/components/live/icons';
import Btn from '@/components/live/Btn';
import { clock, needsCode, type PendingPassword, type SignInStep, pendingPassword } from '@/lib/auth/direct';
import { CodeInput, DemoCode, remembered, SignInMessage, useCountdown, type useDirectSignIn } from './DirectSignIn';

export function TwoStepCard({
  pending,
  flow,
  rememberKey,
  onRestart,
}: {
  pending: PendingPassword;
  flow: ReturnType<typeof useDirectSignIn>;
  /** Where "Trust this office computer" remembers the work email (30 days). */
  rememberKey: string;
  /** Back to step 1 (the code can no longer be used). */
  onRestart: () => void;
}) {
  const [step, setStep] = useState<SignInStep>(pending.step);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trust, setTrust] = useState(() => Boolean(remembered.get(rememberKey)));
  const [expiresAt] = useState(() => (pending.step.expiresIn ? pending.at + pending.step.expiresIn * 1000 : null));
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(expiresAt);
  const [resendAt, setResendAt] = useState<number | null>(() => (pending.step.resendIn ? pending.at + pending.step.resendIn * 1000 : null));
  const expiresIn = useCountdown(codeExpiresAt);
  const resendIn = useCountdown(resendAt);
  const app = step.method === 'totp';

  const verify = async (value = code) => {
    if (value.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    setError(null);
    remembered.set(rememberKey, trust ? pending.username : null);
    const r = await flow.submit({ username: pending.username, password: pending.password, ...(app ? { totp: value } : { code: value }) });
    if (r.ok) {
      pendingPassword.clear();
      return;
    }
    setCode('');
    setError(r.description);
    if (r.error === 'invalid_grant' && /password/i.test(r.description)) onRestart();
  };

  const sendSms = async () => {
    setError(null);
    const r = await flow.submit({ username: pending.username, password: pending.password, send: 'sms' });
    if (r.ok) return;
    if (needsCode(r)) {
      setStep(r);
      pendingPassword.update(r);
      setCode('');
      setCodeExpiresAt(r.expiresIn ? Date.now() + r.expiresIn * 1000 : null);
      setResendAt(Date.now() + (r.resendIn ?? 30) * 1000);
    } else {
      setError(r.description);
      if (r.retryAfter) setResendAt(Date.now() + r.retryAfter * 1000);
    }
  };

  return (
    <form className="dx-auth__card" data-testid="two-step" onSubmit={e => { e.preventDefault(); void verify(); }} noValidate>
      <div className="hstack" style={{ gap: '10px' }}>
        <span className="dx-lead"><Ic n="shield-check" /></span>
        <span className="d-eyebrow">{`Step 2 of 2 · ${pending.username}`}</span>
      </div>
      <div className="vstack" style={{ gap: '8px' }}>
        <div className="dx-h1xl">{"Enter the 6-digit code"}</div>
        <span className="dx-t14" data-testid="code-hint">
          {app
            ? 'Open the authenticator app on your work phone and enter the code it shows now.'
            : <>{step.method === 'voice' ? "We're calling your on-call phone ending " : 'We sent it to your on-call phone ending '}<b>{step.phoneHint ?? '••'}</b>{expiresIn > 0 ? `. It expires in ${clock(expiresIn)}.` : '. Send a new one if it has expired.'}</>}
        </span>
      </div>
      <CodeInput
        value={code}
        onChange={setCode}
        onComplete={v => void verify(v)}
        autoFocus
        render={(chars, focus) => (
          <div className="dx-otp">
            {chars.map((c, i) => (
              <span key={i} className={i === focus ? 'is-on' : undefined}>{c || (i === focus ? <i className="dx-caret" style={{ marginLeft: '0' }} /> : null)}</span>
            ))}
          </div>
        )}
      />
      <DemoCode code={app ? undefined : step.demoCode} />
      <SignInMessage text={error} />
      <div className="hstack" style={{ gap: '10px', fontSize: '14px', cursor: 'pointer' }} role="checkbox" aria-checked={trust} tabIndex={0}
        onClick={() => setTrust(t => !t)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTrust(t => !t); } }}>
        <span className={`dx-check${trust ? '' : ' dx-check--off'}`}><Ic n="check" /></span>
        {"Trust this office computer for 30 days"}
      </div>
      <Btn as="div" className="dx-bigbtn" lk="L146" testId="verify" busy={flow.busy} onClick={() => void verify()}>
        {flow.busy ? 'Checking…' : 'Verify and sign in'}
      </Btn>
      <button type="submit" hidden aria-hidden tabIndex={-1} />
      {(!app || step.smsAvailable) && (
        <div className="hstack" style={{ gap: '8px', fontSize: '14px' }}>
          {resendIn > 0
            ? <span className="t-3">{`${app ? 'Send the code by SMS instead' : 'Send a new code'} · ${resendIn} s`}</span>
            : <Btn className="x-link" testId="send-sms" onClick={() => void sendSms()} disabled={flow.busy}>{app ? 'Send the code by SMS instead' : 'Send a new code by SMS'}</Btn>}
          {resendIn <= 0 && <span className="t-3">{"· 30 s"}</span>}
        </div>
      )}
    </form>
  );
}
