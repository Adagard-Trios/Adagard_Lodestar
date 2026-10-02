'use client';
// ADM-20 Chain check result, live. Markup and classes from the generated design (frontend/screens/adm-20-chain-check-result.tsx).
// Runs GET /odata/v4/AuditEntries/Lodestar.VerifyChain(): the audit service recomputes every entry's
// sha256(prevHash + canonical JSON) and the links between them. "Run again" repeats it; the report can be saved.
import { useEffect, useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fmtDayTime, fmtNum } from '@/lib/format';
import { useAction } from '@/lib/odata/hooks';
import type { ChainCheck } from '@/lib/odata/types';
import { shortHash } from '@/components/live/admin-data';

export default function LiveAdm20ChainCheckResult() {
  const { session } = useAuth();
  const [took, setTook] = useState<{ ms: number; at: string } | null>(null);
  const check = useAction<void, ChainCheck>(async c => {
    const t0 = performance.now();
    const r = await c.fn<ChainCheck>('AuditEntries', null, 'VerifyChain');
    setTook({ ms: performance.now() - t0, at: new Date().toISOString() });
    return r;
  });
  const total = useCount('AuditEntries', undefined);
  useEffect(() => {
    void check.run();
    // run once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const r = check.data;
  const ok = r?.valid;
  const save = () => {
    if (!r) return;
    const report = { ...r, verifiedAt: took?.at, verifiedBy: session?.name, durationMs: took ? Math.round(took.ms) : undefined };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-chain-verification.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-20 Chain check result · desktop">
      <div className="d-app">
        <AdminSide active="N9" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Trust "}<span className="m-sep" />{" Audit log "}<span className="m-sep" />{" chain check"}</div>
              <div className="d-h1">{"Chain check result"}</div>
              <div className="d-sub">{"Lodestar re-read every entry and checked its hash and the link to the entry before it."}</div>
            </div>
            <span className="d-btn" data-lk="L306"><Ic n="arrow-left" data-lk="B" />{"Back to audit log"}</span>
            <Btn className="d-btn" testId="verify-again" busy={check.pending} onClick={() => void check.run()}><Ic n="refresh" />{"Run again"}</Btn>
            <Btn className="d-btn d-btn--primary" disabled={!r} onClick={save}><Ic n="download" />{"Export verification report"}</Btn>
          </div>
          <ErrorBanner error={check.error} onRetry={() => void check.run()} />
          <div className="dx-hrow">
            <div className={`dx-hero adm-hero${ok === false ? ' dx-hero--bad' : ''}`} style={{ flex: '1.4', gap: '8px', padding: '18px 22px' }} data-testid="chain-result">
              <div className="dx-hero__l"><Ic n="shield-check" className="ic ic--sm" />{took ? `Verified ${fmtDayTime(took.at)}` : 'Verifying…'}</div>
              <div className="hstack" style={{ gap: '14px', alignItems: 'flex-end' }}>
                <span className="dx-display" data-testid="chain-valid" data-valid={r ? String(r.valid) : undefined}>{r ? (r.valid ? 'Intact' : 'Broken') : check.pending ? '…' : '—'}</span>
                <span style={{ fontSize: '15px', color: '#CBD5E1', paddingBottom: '6px' }}>
                  {r ? (r.valid ? `${fmtNum(r.checked)} entries checked, 0 breaks` : `${fmtNum(r.checked)} checked, first break at #${r.firstInvalidSeq}`) : ''}
                </span>
              </div>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"Took"}</span><span className="d-kpi__v">{took ? (took.ms / 1000).toFixed(1) : '…'}<small>{"seconds"}</small></span><span className="d-kpi__s">#1 to #{r?.headSeq ?? '…'}, oldest first</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Run by"}</span><span className="d-kpi__v" style={{ fontSize: '22px' }}>{session?.name ?? '…'}</span><span className="d-kpi__s">{"by hand, from this screen"}</span></div>
          </div>
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card" style={{ flex: '1.3' }}>
              <div className="dx-card__head">
                <span className="dx-card__title">{"What was checked"}</span>
                <span className="spacer" />
                {r && <span className={`m-tag ${ok ? 'm-tag--ok' : 'm-tag--bad'}`}><span className="dot" />{ok ? '3 of 3 passed' : 'a check failed'}</span>}
              </div>
              {!r && check.pending && <Skeleton rows={3} label="Verifying the audit chain…" />}
              {r && (
                <>
                  <div className="dx-lrow" style={{ minHeight: '62px', padding: '8px 20px' }}>
                    <span className={`dx-lead ${ok ? 'dx-lead--ok' : 'dx-lead--bad'}`} style={{ width: '40px', height: '40px' }}><Ic n="hash" /></span>
                    <div className="dx-lrow__main">
                      <span className="dx-lrow__t">{"Each hash matches its entry"}</span>
                      <span className="dx-lrow__m" style={{ whiteSpace: 'normal' }}>{"sha256 of the previous hash and the entry's canonical JSON is recomputed for every entry"}</span>
                    </div>
                    <div className="dx-lrow__tr"><span className="dx-lrow__v">{fmtNum(r.checked)}</span><span>of {fmtNum(total ?? r.checked)}</span></div>
                  </div>
                  <div className="dx-lrow" style={{ minHeight: '62px', padding: '8px 20px' }}>
                    <span className={`dx-lead ${ok ? 'dx-lead--ok' : 'dx-lead--bad'}`} style={{ width: '40px', height: '40px' }}><Ic n="link" /></span>
                    <div className="dx-lrow__main">
                      <span className="dx-lrow__t">{"Each entry links to the one before"}</span>
                      <span className="dx-lrow__m" style={{ whiteSpace: 'normal' }}>{"The previous hash stored in each entry matches the entry before it"}</span>
                    </div>
                    <div className="dx-lrow__tr"><span className="dx-lrow__v">{fmtNum(Math.max(0, r.checked - 1))}</span><span>{"links"}</span></div>
                  </div>
                  <div className="dx-lrow" style={{ minHeight: '62px', padding: '8px 20px' }}>
                    <span className={`dx-lead ${ok ? 'dx-lead--ok' : 'dx-lead--bad'}`} style={{ width: '40px', height: '40px' }}><Ic n="shield-check" /></span>
                    <div className="dx-lrow__main">
                      <span className="dx-lrow__t">{"Head of the chain"}</span>
                      <span className="dx-lrow__m" style={{ whiteSpace: 'normal' }}>{r.headHash ? `#${r.headSeq} · ${shortHash(r.headHash)}` : 'empty log'}</span>
                    </div>
                    <div className="dx-lrow__tr"><span className="dx-lrow__v">{r.headSeq ?? 0}</span><span>{"latest"}</span></div>
                  </div>
                  {!ok && (
                    <div className="dx-card__body" style={{ paddingTop: '12px', gap: '4px' }}>
                      <span className="dx-t14" style={{ fontSize: '13.5px', color: 'var(--st-exception-fg)' }}>
                        <b>Break at #{r.firstInvalidSeq}.</b> {r.reason}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="dx-card" style={{ flex: '1' }}>
              <div className="dx-card__head"><span className="dx-card__title">{"Who can see the audit log"}</span><span className="spacer" /><span className="m-tag"><Ic n="eye-2" />{"Set by role"}</span></div>
              <div className="dx-card__body" style={{ gap: '0' }}>
                <div className="au-who">
                  <span className="dx-lead dx-lead--ok"><Ic n="shield-check" /></span>
                  <div className="au-who__b"><b>{"Admins"}</b><span>{"Everything, across all faces. Only admins (and services) can read or verify the chain."}</span></div>
                  <span className="au-who__s">{"Full log"}</span>
                </div>
                <div className="au-who">
                  <span className="dx-lead "><Ic n="sliders" /></span>
                  <div className="au-who__b"><b>{"Services"}</b><span>{"Append entries with their own service identity; they can never change one."}</span></div>
                  <span className="au-who__s">{"Append only"}</span>
                </div>
                <div className="dx-inset" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '12px 14px', marginTop: '6px' }}>
                  <Ic n="lock" className="ic ic--sm" />
                  <span className="dx-t13" style={{ color: 'var(--text-2)' }}>{"Nobody can edit or delete an entry, admins included: the database rejects UPDATE and DELETE."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
