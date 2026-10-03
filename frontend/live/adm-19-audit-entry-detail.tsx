'use client';
// ADM-19 Audit entry detail, live. Markup and classes from the generated design (frontend/screens/adm-19-audit-entry-detail.tsx).
// Data: AuditEntries(seq) — the entry opened on ADM-16 (or ?id=, else the newest) — the entry before it, to show
// the chain link (its hash must equal this entry's prevHash), and the other entries for the same record.
// Entries are append-only; "Copy" and "Export" only read.
import { useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { shortHash } from '@/components/live/admin-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtClock, fmtDay, fmtDayTime, fmtStamp } from '@/lib/format';
import { useEntity, useQuery } from '@/lib/odata/hooks';
import type { AuditEntry } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

function fields(payload: unknown): Array<[string, string]> {
  if (!payload || typeof payload !== 'object') return payload === undefined || payload === null ? [] : [['value', String(payload)]];
  return Object.entries(payload as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)]);
}

/** The audit entry drawer: over the page it was opened from (OverlayHost), or on its own route over the page's head. */
export function AuditEntryDrawer({ onClose }: { onClose?: () => void }) {
  const [focus] = useFocusId('audit');
  const newest = useQuery<number | null>(focus ? null : 'audit-newest', async c => (await c.list<AuditEntry>('AuditEntries', { select: 'seq', orderby: 'seq desc', top: 1 })).value[0]?.seq ?? null);
  const seq = focus ? Number(focus) : newest.data ?? null;
  const entry = useEntity<AuditEntry>('AuditEntries', seq !== null && Number.isFinite(seq) ? seq : null);
  const e = entry.data;
  const prev = useEntity<AuditEntry>('AuditEntries', e && e.seq > 1 ? e.seq - 1 : null);
  const related = useQuery<AuditEntry[]>(e?.entitySet && e.entityKey ? `audit-rel:${e.entitySet}:${e.entityKey}` : null, async c =>
    (await c.list<AuditEntry>('AuditEntries', { filter: `entitySet eq '${e!.entitySet}' and entityKey eq '${e!.entityKey!.replace(/'/g, "''")}' and seq ne ${e!.seq}`, orderby: 'seq desc', top: 5 })).value);
  const [copied, setCopied] = useState(false);
  const links = e && (e.seq === 1 || (prev.data ? prev.data.hash === e.prevHash : undefined));

  const json = e ? JSON.stringify(e, null, 2) : '';
  const copy = () => {
    void navigator.clipboard?.writeText(json).then(() => setCopied(true));
  };
  const exportEntry = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-entry-${e?.seq}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="dx-scrim" onClick={onClose} />
      <div className="dx-drawer" style={{ width: '700px' }} role="dialog" aria-modal="true" aria-labelledby="entry-title" data-testid="audit-entry">
        <div className="dx-drawer__head">
          <span className="dx-lead"><Ic n="history" /></span>
          <div className="vstack" style={{ gap: '3px', flex: '1', minWidth: '0' }}>
            <span className="d-eyebrow">Audit entry #{e?.seq ?? '…'} <span className="m-sep" /> {e?.service ?? ''} <span className="m-sep" /> {e ? fmtDay(e.at) : ''}</span>
            <span className="dx-card__title" style={{ fontSize: '20px' }} id="entry-title">{e ? `${e.action}${e.entityKey ? ` · ${e.entityKey}` : ''}` : 'Loading…'}</span>
            <span className="dx-t13">{e ? `${e.client} · ${e.actor} · ${e.actorRoles.join(', ')}` : ''}</span>
          </div>
          <span className="dx-close" data-lk="L305"><Ic n="x" /></span>
        </div>
        <div className="dx-drawer__body" style={{ gap: '14px', padding: '16px 26px' }}>
          <ErrorBanner error={entry.error ?? newest.error} onRetry={entry.refresh} />
          {!e && !entry.error && (newest.data === null ? <Empty title="The audit log is empty" icon="history" /> : <Skeleton rows={4} />)}
          {e && (
            <>
              <div className="dx-hero adm-hero" style={{ gap: '10px', padding: '14px 18px', borderRadius: '18px', flexShrink: '0' }}>
                <div className="au-when">
                  <div className="au-when__i"><span className="au-when__l">{"Happened"}</span><span className="au-when__v">{fmtClock(e.at)}</span><span className="au-when__s">{fmtStamp(e.at)}</span></div>
                  <div className="au-when__i"><span className="au-when__l">{"Outcome"}</span><span className="au-when__v">{e.outcome.toLowerCase()}</span><span className="au-when__s">recorded by {e.service}</span></div>
                  <div className="au-when__i"><span className="au-when__l">{"Record"}</span><span className="au-when__v">{e.entitySet ?? '—'}</span><span className="au-when__s">{e.entityKey ?? 'no key'}</span></div>
                </div>
              </div>
              <div className="au-ba">
                <div className="adm-diff adm-diff--new" style={{ flex: '1' }}>
                  <div className="au-dh">{"What was recorded"}<span>#{e.seq}</span></div>
                  {fields(e.payload).length === 0 && <div className="au-f"><span className="au-f__l">{"Payload"}</span><span className="au-f__v">{"none"}</span></div>}
                  {fields(e.payload).map(([k, v]) => (
                    <div key={k} className="au-f"><span className="au-f__l">{k}</span><span className="au-f__v" style={{ wordBreak: 'break-word' }}>{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="vstack" style={{ gap: '0', flexShrink: '0' }}>
                <div className="dx-sech" style={{ paddingBottom: '4px' }}>
                  <b>{"Hash and chain"}</b>
                  <span style={{ fontWeight: '600' }}>· entry #{e.seq}</span>
                  <span className="spacer" />
                  {links === undefined ? <span className="m-tag">{"Checking…"}</span>
                    : links ? <span className="m-tag m-tag--ok"><Ic n="link" />{"Links to previous ✓"}</span>
                      : <span className="m-tag m-tag--bad"><Ic n="alert" />{"Does not link to the previous entry"}</span>}
                </div>
                <div className="dx-kv au-kv"><span>{"Hash of this entry"}</span><b className="dx-mono" style={{ wordBreak: 'break-all' }}>{e.hash}</b></div>
                <div className="dx-kv au-kv"><span>Previous entry{prev.data ? ` #${prev.data.seq} · ${prev.data.action}` : ''}</span><b className="dx-mono" style={{ wordBreak: 'break-all' }}>{e.prevHash}</b></div>
                <div className="dx-kv au-kv"><span>{"Caller"}</span><b style={{ fontFamily: 'var(--font-ui)', fontSize: '13.5px' }}>{e.client} · {e.actor}</b></div>
              </div>
              <div className="vstack" style={{ gap: '0', flexShrink: '0' }}>
                <div className="dx-sech" style={{ paddingBottom: '4px' }}><b>{"Related entries"}</b></div>
                {related.data?.length === 0 && <span className="dx-t13">{"No other entries for this record."}</span>}
                {related.data?.map(r => (
                  <div key={r.seq} className="au-rel">
                    <span className="au-rel__t">{fmtClock(r.at)}</span>
                    <span className="dx-td2"><b>{r.action} · {r.outcome.toLowerCase()}</b><span>#{r.seq} · {fmtDayTime(r.at)} · {r.client}</span></span>
                    <span className="adm-hash"><Ic n="link" className="ic ic--sm" />{shortHash(r.hash)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="dx-drawer__foot">
          <span className="hstack" style={{ gap: '8px', flex: '1', minWidth: '0' }}>
            <span className="adm-lock"><Ic n="lock" /></span>
            <span className="dx-t13" style={{ whiteSpace: 'normal' }}>{"Entries can't be edited or deleted. To fix a mistake, add a correction."}</span>
          </span>
          <Btn className="d-btn d-btn--ghost" disabled={!e} onClick={copy}><Ic n="copy" />{copied ? 'Copied' : 'Copy entry'}</Btn>
          <Btn className="d-btn d-btn--primary" disabled={!e} onClick={exportEntry}><Ic n="download" />{"Export this entry"}</Btn>
        </div>
      </div>
    </>
  );
}

export default function LiveAdm19AuditEntryDetail() {
  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-19 Audit entry detail · desktop">
      <div className="d-app">
        <AdminSide active="N9" />
        <div className="dx-main"><div className="d-head"><div className="d-head__txt"><div className="d-eyebrow">{"Trust"}</div><div className="d-h1">{"Audit log"}</div></div></div></div>
      </div>
      <AuditEntryDrawer />
    </div>
  );
}
