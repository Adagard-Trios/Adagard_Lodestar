'use client';
// ADM-15 Import check failed, live. Markup and classes from the generated design (frontend/screens/adm-15-import-check-failed.tsx).
// Data: one failed import (DataImports('…') from ?id=, else the newest import that was not applied): the rows
// checked and passed, the rejected rows (row number with the header as row 1, key, column, value and the reason in
// plain words) and the file checks that ran. Nothing was applied. "Fix and re-upload" goes back to ADM-14 (the
// design's L301); "Download rejected rows" saves the rejected rows with their reasons as a CSV on this computer
// (built in the browser from the result; the uploaded file itself was never stored).
import { useSyncExternalStore } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { type DataImport, IMPORT_FILES } from '@/components/live/settings-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtNum, fmtTime } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The rejected rows as CSV (row, key, column, value, reason). */
export function rejectedCsv(d: DataImport): string {
  return ['row,key,column,value,reason', ...d.problems.map(p => [p.row, p.key, p.column, p.value, p.reason].map(cell).join(','))].join('\n');
}

const noSubscribe = () => () => {};

export default function LiveAdm15ImportCheckFailed() {
  // ?id= names the import (ADM-14 sends it after a failed check); undefined while rendering on the server.
  const id = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get('id'), () => undefined);
  const q = useQuery<DataImport | null>(id === undefined ? null : `adm15:${id ?? 'latest'}`, async c => {
    if (id) return c.get<DataImport>('DataImports', id);
    return (await c.list<DataImport>('DataImports', { filter: 'applied eq false', orderby: 'importedAt desc', top: 1 })).value[0] ?? null;
  });
  const d = q.data;
  const csv = d ? IMPORT_FILES.find(f => f.file === d.file)?.csv ?? d.file : '';
  const bad = d ? d.problems.length : 0;
  const rowsBad = d ? d.rows - d.passed : 0;
  const download = () => {
    if (!d) return;
    const url = URL.createObjectURL(new Blob([rejectedCsv(d)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(d.fileName ?? csv).replace(/\.csv$/i, '')}_rejected.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-15 Import check failed · desktop">
      <div className="d-app">
        <AdminSide active="N8" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Data imports "}<span className="m-sep" />{` ${d?.fileName ?? (csv || '…')} `}<span className="m-sep" />{d ? ` checked ${fmtTime(d.importedAt)}` : ''}</div>
              <div className="d-h1">{"Import check failed"}</div>
              <div className="d-sub">{d ? `Uploaded by ${d.byName ?? 'an admin'} to replace ${csv}.` : ' '}</div>
            </div>
            <span className="d-btn d-btn--ghost" data-lk="L301"><Ic n="arrow-left" />{"Back to imports"}</span>
          </div>
          <ErrorBanner error={q.error} onRetry={q.refresh} />
          {!q.error && q.data === undefined && <Skeleton rows={4} />}
          {q.data === null && <Empty title="No failed import" text="Every import so far passed its checks." icon="check" />}
          {d && (
            <>
              <div className="dx-hrow">
                <div className={`dx-hero ${d.applied ? '' : 'dx-hero--bad'}`} style={{ flex: '1.5', gap: '8px', padding: '20px 24px' }}>
                  <div className="dx-hero__l"><Ic n="info" />{d.applied ? 'This import was applied' : 'Nothing has changed yet'}</div>
                  <div className="hstack" style={{ gap: '14px', alignItems: 'flex-end' }}>
                    <span className="dx-display">{fmtNum(rowsBad || bad)}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', paddingBottom: '4px', color: 'var(--text)' }}>{(rowsBad || bad) === 1 ? 'row needs fixing' : 'rows need fixing'}</span>
                  </div>
                  <div className="dx-hero__m">{`What Lodestar plans from stays as it is until every row passes. Fix the ${fmtNum(rowsBad || bad)} ${(rowsBad || bad) === 1 ? 'row' : 'rows'} and upload the file again.`}</div>
                </div>
                <div className="d-kpi">
                  <span className="d-kpi__l">{"Rows checked"}</span>
                  <span className="d-kpi__v">{fmtNum(d.rows)}</span>
                  <span className="d-kpi__s">{"header excluded"}</span>
                </div>
                <div className="d-kpi">
                  <span className="d-kpi__l">{"Rows passed"}</span>
                  <span className="d-kpi__v">{fmtNum(d.passed)}</span>
                  <span className="d-kpi__s">{"held until the file is clean"}</span>
                </div>
              </div>
              <div className="dx-card">
                <div className="dx-card__head">
                  <span className="dx-card__title">{"Rejected rows"}</span>
                  <span className="spacer" />
                  <span className="dx-t13">{"Row numbers match your spreadsheet, header is row 1"}</span>
                </div>
                <div className="dx-tr dx-tr--head">
                  <span className="dx-td" style={{ width: '70px' }}>{"Row"}</span>
                  <span className="dx-td" style={{ width: '86px' }}>{"Key"}</span>
                  <span className="dx-td" style={{ width: '170px' }}>{"Column"}</span>
                  <span className="dx-td" style={{ width: '110px' }}>{"Value"}</span>
                  <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"What is wrong, in plain words"}</span>
                </div>
                <div style={{ maxHeight: '320px', overflow: 'auto' }} data-testid="rejected-rows">
                  {d.problems.map((p, i) => (
                    <div key={`${p.row}-${i}`} className="dx-tr" style={{ minHeight: '64px' }}>
                      <span className="dx-td" style={{ width: '70px' }}><span className="dx-mono" style={{ color: 'var(--text)' }}>{p.row}</span></span>
                      <span className="dx-td" style={{ width: '86px' }}>{p.key ? <span className="id">{p.key}</span> : '—'}</span>
                      <span className="dx-td" style={{ width: '170px' }}><span className="dx-mono">{p.column ?? '—'}</span></span>
                      <span className="dx-td" style={{ width: '110px' }}>{p.value !== null && p.value !== '' ? <span className="adm-bad">{p.value}</span> : '—'}</span>
                      <span className="dx-td" style={{ flex: '1', minWidth: '0' }}><span style={{ whiteSpace: 'normal', lineHeight: '1.4' }}>{p.reason}</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
                <div className="dx-card__head">
                  <span className="dx-card__title">{"Checks"}</span>
                  <span className="spacer" />
                  <span className="dx-t13">{`${d.checks.filter(x => x.passed).length} of ${d.checks.length} passed`}</span>
                </div>
                <div className="dx-card__body" style={{ gap: '0' }} data-testid="checks">
                  {d.checks.map(x => (
                    <div key={x.label} className="x-ck">
                      <span className="x-ck__i" style={x.passed ? undefined : { background: 'var(--tint-bad)', color: 'var(--st-exception-fg)' }}><Ic n={x.passed ? 'check' : 'x'} /></span>
                      <span className="x-ck__l">{x.label}</span>
                      <span className="x-ck__v">{x.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="x-foot">
                <span>{`Fix in your spreadsheet, or download just the ${fmtNum(bad)} rejected ${bad === 1 ? 'row' : 'rows'} with notes.`}</span>
                <span className="spacer" />
                <span className="d-btn" data-lk="L301"><Ic n="upload" />{"Fix and re-upload"}</span>
                <Btn className="d-btn d-btn--primary" disabled={!bad} onClick={download}><Ic n="download" />{"Download rejected rows"}</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
