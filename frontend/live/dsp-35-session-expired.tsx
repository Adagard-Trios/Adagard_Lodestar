'use client';
// DSP-35 Session expired · desktop, live. Markup and classes from the generated design
// (frontend/screens/dsp-35-session-expired.tsx): the "Your session ended" dialog over the dimmed plan board.
// Reached when the tab's session can no longer be renewed (refresh token refused or expired): AuthProvider ends it,
// remembers who it was (sessionStorage), and the Plan route guard comes here with ?returnTo=<the page>.
// No data is read here (there is no token); the board behind the dialog is a placeholder. "Sign in again" (the
// design's L176) starts the Keycloak sign-in and comes back to the page the dispatcher was on; "Use another
// account" asks Keycloak for the credentials again.
import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/live/icons';
import { useAuth } from '@/lib/auth/AuthProvider';
import { readEndedSession, type EndedSession } from '@/lib/auth/session';
import { fmtTime } from '@/lib/format';
import { useAgentRunId } from '@/lib/workday';

const DEFAULT_RETURN = '/plan/dsp-02-plan-board';

/** The page to come back to: a local /plan path only (never another origin or face). */
export function safeReturn(v: string | null | undefined): string {
  return v && /^\/plan(\/[^\\\s]*)?$/.test(v) && !v.startsWith('/plan/dsp-35-session-expired') ? v : DEFAULT_RETURN;
}

/** "after 8 hours" / "after 45 minutes" */
export function sessionLength(ended: Pick<EndedSession, 'startedAt' | 'endedAt'> | null): string | null {
  if (!ended?.startedAt) return null;
  const mins = Math.round((ended.endedAt - ended.startedAt * 1000) / 60_000);
  if (mins <= 0) return null;
  if (mins < 90) return `after ${mins} minute${mins === 1 ? '' : 's'}`;
  const h = Math.round(mins / 60);
  return `after ${h} hour${h === 1 ? '' : 's'}`;
}

const NAV = ['Today', 'Cutoff queue', 'Plan board', 'Deferrals', 'Live operations', 'Exceptions', 'Capacity outlook'];

export default function LiveDsp35SessionExpired() {
  const auth = useAuth();
  const router = useRouter();
  const [runId] = useAgentRunId();
  // browser-only (LiveSwitch renders live screens after hydration)
  const [ended] = useState<EndedSession | null>(() => (typeof window === 'undefined' ? null : readEndedSession()));
  const [returnTo] = useState(() => (typeof window === 'undefined' ? DEFAULT_RETURN : safeReturn(new URLSearchParams(window.location.search).get('returnTo'))));
  const [busy, setBusy] = useState<'again' | 'other' | null>(null);
  const [failed, setFailed] = useState(false);

  const signedIn = auth.status === 'authenticated';
  const start = (kind: 'again' | 'other') => (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (signedIn && kind === 'again') {
      router.push(returnTo);
      return;
    }
    setBusy(kind);
    setFailed(false);
    auth.login(returnTo, kind === 'other' ? { prompt: 'login' } : undefined).catch(() => {
      setBusy(null);
      setFailed(true);
    });
  };
  const key = (kind: 'again' | 'other') => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') start(kind)(e);
  };
  const length = sessionLength(ended);
  const account = ended?.email ?? ended?.name ?? auth.session?.email ?? auth.session?.name ?? null;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-35 Session expired · desktop">
      <div className="d-app">
        <aside className="d-side" aria-hidden>
          <div className="d-side__brand" style={{ whiteSpace: 'nowrap', paddingRight: '0' }}>
            <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></g></svg>
            {"Lodestar Plan"}
          </div>
          {NAV.map(n => <div key={n} className={`d-side__item${n === 'Plan board' ? ' is-on' : ''}`}>{n}</div>)}
        </aside>
        <div className="dx-main" aria-hidden>
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Lodestar Plan "}<span className="m-sep" />{" signed out"}</div>
              <div className="d-h1">{"Plan board"}</div>
            </div>
            <span className="d-btn d-btn--disabled"><Ic n="lock" />{"Approve & go live"}</span>
          </div>
          <div className="x-board">
            <div className="x-lanehead"><span style={{ width: '168px' }}>{"Vehicle · minutes"}</span><span style={{ flex: '1' }}>{"Trip 1"}</span><span style={{ flex: '1' }}>{"Trip 2 · max 2 trips a day"}</span></div>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="hstack" style={{ gap: '14px' }}>
                <div className="vstack" style={{ gap: '8px', width: '168px', flexShrink: '0' }}>
                  <span className="dx-skel" style={{ width: '90px' }} /><span className="dx-skel" style={{ width: '130px', height: '18px' }} />
                </div>
                <div className="dx-skelcard"><span className="dx-skel" style={{ width: '60%' }} /><span className="dx-skel" style={{ width: '85%', height: '8px' }} /></div>
                <div className="dx-skelcard"><span className="dx-skel" style={{ width: '55%' }} /><span className="dx-skel" style={{ width: '80%', height: '8px' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dx-scrim" />
      <div className="dx-modal" role="dialog" aria-modal="true" aria-labelledby="dsp35-title" style={{ left: '450px', top: '214px', width: '540px' }}>
        <div className="dx-modal__head">
          <span className="dx-lead"><Ic n="lock" /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1' }}>
            <span className="d-h1" id="dsp35-title" style={{ fontSize: '24px' }}>{signedIn ? 'You are signed in again' : 'Your session ended'}</span>
            <span className="dx-t14" data-testid="ended-at">
              {signedIn
                ? 'Your session is active. Carry on where you were.'
                : ended
                  ? `Signed out at ${fmtTime(new Date(ended.endedAt))}${length ? ` ${length}` : ''}, for security.`
                  : 'Your sign-in could not be renewed, for security.'}
            </span>
          </div>
        </div>
        <div className="dx-modal__body">
          <div className="dx-inset dx-inset--ok ax-note">
            <Ic n="cloud-check" />
            <div className="vstack" style={{ gap: '2px' }}>
              <b>{"Your work is kept on the server"}</b>
              <span className="dx-t14">
                {runId ? `The planning agent's draft (run ${runId}) and every plan stay on the server and open again as soon as you sign in.` : 'Plans and agent drafts stay on the server and open again as soon as you sign in.'}
              </span>
            </div>
          </div>
          <div className="hstack ax-quiet"><Ic n="info" /><span><b>{"Nothing was published."}</b>{" Signing out never approves or publishes a plan; drivers and stores have seen nothing new."}</span></div>
          {account && (
            <div className="dx-field">
              <span className="dx-label">{"Signed in as"}</span>
              <div className="dx-input" data-testid="account"><Ic n="user" />{account}</div>
            </div>
          )}
          {failed && <span className="dx-t13" role="alert" style={{ color: 'var(--st-exception-fg)' }}>{"The sign-in service did not answer. Try again in a moment."}</span>}
        </div>
        <div className="dx-modal__foot">
          {!signedIn && (
            <span className="d-btn d-btn--ghost lv-click" role="button" tabIndex={0} data-testid="other-account" onClick={start('other')} onKeyDown={key('other')}>
              {busy === 'other' ? 'Opening sign-in…' : 'Use another account'}
            </span>
          )}
          <span className="spacer" />
          <span className="d-btn d-btn--primary" data-lk="L176" role="button" tabIndex={0} data-testid="sign-in-again" aria-busy={busy === 'again'} onClick={start('again')} onKeyDown={key('again')}>
            <Ic n="log-in" />{signedIn ? 'Continue' : busy === 'again' ? 'Opening sign-in…' : 'Sign in again'}
          </span>
        </div>
      </div>
    </div>
  );
}
