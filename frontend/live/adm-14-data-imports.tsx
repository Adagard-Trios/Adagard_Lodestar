'use client';
// ADM-14 Data imports, live. Markup and classes from the generated design (frontend/screens/adm-14-data-imports.tsx).
// Data: the rows Lodestar plans from (a $count per set: Outlets, Vehicles, Calendar, DistrictTravel,
// ServiceAllowances) and each file's last import (DataImports, newest first: when, by whom, clean or failed).
// "Choose file" (or a drop) reads the CSV in the browser and sends its text to DataImports/Lodestar.Import, which
// checks every row with the seed's rules and applies the file only when all rows pass. A failed check opens
// ADM-15 (the design's L300 on a failed file's row, opened on that file's own failed import). The CSV is never stored, only the result.
// Not drawn: traffic_speed.csv and road_conditions.csv (Lodestar has no such tables) and rollback (rows are
// upserted by key and never deleted, so there is no previous version to restore).
import { useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/live/Btn';
import { AdminSide, adminChanged } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { type DataImport, IMPORT_FILES, type ImportFile, importFileOf, useImportCsv } from '@/components/live/settings-data';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { fmtDayTime, fmtNum, fmtTime, isoDay } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import { colomboDay } from '@/lib/workday';

interface FileRow {
  file: ImportFile;
  rows: number;
  last: DataImport | null;
}

export default function LiveAdm14DataImports() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<ImportFile | ''>('');
  const [picked, setPicked] = useState<File | null>(null);
  const [done, setDone] = useState<DataImport | null>(null);
  const data = useQuery<FileRow[]>('adm14-files', c =>
    Promise.all(IMPORT_FILES.map(async f => {
      const [count, last] = await Promise.all([
        c.list(f.set, { top: 0, count: true }),
        c.list<DataImport>('DataImports', { filter: `file eq '${f.file}'`, orderby: 'importedAt desc', top: 1 }),
      ]);
      return { file: f.file, rows: count.count ?? 0, last: last.value[0] ?? null };
    })),
  );
  const imp = useImportCsv(r => {
    setPicked(null);
    if (r.applied) { setDone(r); adminChanged(); void data.refresh(); } else router.push(`/admin/adm-15-import-check-failed?id=${encodeURIComponent(r.id)}`);
  });

  const choose = (f: File | undefined | null) => {
    if (!f) return;
    setDone(null);
    imp.reset();
    setPicked(f);
    setTarget(importFileOf(f.name) ?? '');
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); };
  const today = colomboDay();
  const when = (v: string) => (isoDay(v) === today ? `today ${fmtTime(v)}` : fmtDayTime(v));
  const spec = (f: ImportFile) => IMPORT_FILES.find(x => x.file === f)!;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-14 Data imports · desktop">
      <div className="d-app">
        <AdminSide active="N8" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Data "}<span className="m-sep" />{` ${IMPORT_FILES.length} files `}<span className="m-sep" />{" the planning agent reads the last clean import"}</div>
              <div className="d-h1">{"Data imports"}</div>
              <div className="d-sub">{"Replace a whole file at once. Lodestar checks every row first and applies nothing until the file is clean."}</div>
            </div>
          </div>
          <div className="adm-drop" onDragOver={e => e.preventDefault()} onDrop={onDrop} data-testid="drop">
            <Ic n="upload" />
            <div className="vstack" style={{ gap: '2px', flex: '1' }}>
              <b style={{ fontSize: '15px' }}>{picked ? picked.name : 'Drop a CSV here to replace it'}</b>
              <span className="dx-t13">
                {picked
                  ? 'Choose which file it replaces, then check it. Nothing changes unless every row passes.'
                  : 'Same columns as the file it replaces. Checked in seconds. Rows are matched by key; none are deleted.'}
              </span>
            </div>
            {picked && (
              <span className="d-filter" style={{ height: '40px' }}>
                <select className="lv-input" aria-label="File it replaces" value={target} onChange={e => setTarget(e.target.value as ImportFile)} style={{ width: 'auto' }}>
                  <option value="" disabled>{"Replaces…"}</option>
                  {IMPORT_FILES.map(f => <option key={f.file} value={f.file}>{f.csv}</option>)}
                </select>
              </span>
            )}
            {picked
              ? <Btn className="d-btn d-btn--primary" busy={imp.pending} disabled={!target} onClick={() => void imp.upload(picked, target as ImportFile)}><Ic n="check" />{"Check and import"}</Btn>
              : <Btn className="d-btn d-btn--primary" onClick={() => input.current?.click()}><Ic n="file-csv" />{"Choose file"}</Btn>}
            <input ref={input} type="file" accept=".csv,text/csv" hidden data-testid="file-input" onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <ErrorBanner error={imp.error ?? data.error} onRetry={data.refresh} />
          {done && (
            <div className="dx-banner" data-testid="import-done">
              <Ic n="check" />
              <span><b>{`${spec(done.file).csv} imported.`}</b>{` ${fmtNum(done.rows)} rows checked: ${fmtNum(done.created)} new, ${fmtNum(done.updated)} updated.`}</span>
            </div>
          )}
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card__head">
              <span className="dx-card__title">{"Files Lodestar plans from"}</span>
              <span className="spacer" />
              <span className="dx-t13">{"Rows are what Lodestar holds now"}</span>
            </div>
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '330px' }}>{"File"}</span>
              <span className="dx-td" style={{ width: '90px' }}>{"Rows"}</span>
              <span className="dx-td" style={{ width: '170px' }}>{"Last imported"}</span>
              <span className="dx-td" style={{ width: '120px' }}>{"By"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"Status"}</span>
            </div>
            {!data.data && !data.error && <Skeleton rows={5} />}
            {data.data?.map(r => {
              const f = spec(r.file);
              const failed = r.last && !r.last.applied;
              return (
                <div key={r.file} className={`dx-tr${failed ? ' dx-tr--sel lv-click' : ''}`} style={{ minHeight: '58px' }} data-testid={`file-${r.file}`}
                  {...(failed ? {
                    role: 'button', tabIndex: 0,
                    onClick: () => router.push(`/admin/adm-15-import-check-failed?id=${encodeURIComponent(r.last!.id)}`),
                    onKeyDown: (e: { key: string }) => { if (e.key === 'Enter') router.push(`/admin/adm-15-import-check-failed?id=${encodeURIComponent(r.last!.id)}`); },
                  } : {})}>
                  <span className="dx-td" style={{ width: '330px' }}>
                    <span className="hstack" style={{ gap: '10px' }}>
                      <span className={`dx-lead${failed ? ' dx-lead--bad' : ''}`} style={{ width: '36px', height: '36px', borderRadius: '11px' }}><Ic n={f.icon} /></span>
                      <span className="dx-td2"><b><span className="id">{f.csv}</span></b><span>{f.what}</span></span>
                    </span>
                  </span>
                  <span className="dx-td" style={{ width: '90px' }}><span className="dx-mono">{fmtNum(r.rows)}</span></span>
                  <span className="dx-td" style={{ width: '170px' }}>{r.last ? when(r.last.importedAt) : 'From the seed'}</span>
                  <span className="dx-td" style={{ width: '120px' }}>{r.last ? r.last.byName ?? 'Admin' : '—'}</span>
                  <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                    {failed
                      ? <span className="m-tag m-tag--bad"><Ic n="alert" />{`Check failed ${when(r.last!.importedAt)}`}</span>
                      : <span className="m-tag m-tag--ok"><Ic n="check" />{r.last ? 'Clean' : 'Clean, from the seed'}</span>}
                  </span>
                </div>
              );
            })}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>{"Every import is checked in full first. "}<b>{"Rows are matched by key"}</b>{"; columns the live system owns (vehicle status, access notes) are never overwritten, and every import is logged."}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
