'use client';
// ADM-16 Audit log, live. Markup and classes from the generated design (frontend/screens/adm-16-audit-log.tsx).
// Data: AuditEntries (append-only, hash-chained; paged newest first, area chips, $search on action, actor and
// key), the chain check (AuditEntries/Lodestar.VerifyChain()), today's counts, and Users to show actor names.
// A row opens the entry (ADM-19); "Verify chain" opens the full check (ADM-20). ADM-17's "See its last 30
// proposals" opens this log on the Planning agent area (AUDIT_AREA_KEY, read once).
import { useEffect, useMemo, useState } from 'react';
import Btn from '@/components/live/Btn';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton, Spinner } from '@/components/live/states';
import { shortHash } from '@/components/live/admin-data';
import { daysAgo, fmtClock, fmtDay, fmtTime } from '@/lib/format';
import { useEntitySet, useQuery } from '@/lib/odata/hooks';
import type { AuditEntry, ChainCheck, User } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';

type Chip = 'all' | 'people' | 'master' | 'plans' | 'agent' | 'denied';

/** sessionStorage key another screen sets to open the log on one area (ADM-17 → 'agent'). */
export const AUDIT_AREA_KEY = 'lodestar.audit.area';

function initialArea(): Chip {
  try {
    const v = typeof window === 'undefined' ? null : window.sessionStorage.getItem(AUDIT_AREA_KEY);
    return v && v in AREA_FILTER ? (v as Chip) : 'all';
  } catch {
    return 'all';
  }
}
const sets = (s: string[]) => `entitySet in (${s.map(x => `'${x}'`).join(',')})`;
const AREA_FILTER: Record<Chip, [string, string | undefined]> = {
  all: ['All', undefined],
  people: ['People', sets(['Users', 'Devices'])],
  master: ['Master data', sets(['Outlets', 'Vehicles', 'Calendar', 'DistrictTravel', 'ServiceAllowances'])],
  plans: ['Plans', sets(['Plans', 'Deferrals', 'Trips', 'TripStops', 'Orders'])],
  agent: ['Planning agent', sets(['AgentRuns'])],
  denied: ['Refused', "outcome eq 'DENIED'"],
};

export default function LiveAdm16AuditLog() {
  const [, setFocus] = useFocusId('audit');
  const [chip, setChip] = useState<Chip>(initialArea);
  useEffect(() => {
    // Read once: the next visit opens on All again.
    try { window.sessionStorage.removeItem(AUDIT_AREA_KEY); } catch { /* storage blocked: nothing to clear */ }
  }, []);
  const [search, setSearch] = useState('');
  const log = useEntitySet<AuditEntry>('AuditEntries', { filter: AREA_FILTER[chip][1], orderby: 'seq desc', top: 30, count: true, search: search.trim() || undefined }, {
    refreshOn: ['notification'],
  });
  const chain = useQuery<ChainCheck>('adm-chain', c => c.fn<ChainCheck>('AuditEntries', null, 'VerifyChain'));
  const today = `at ge ${daysAgo(0)}T00:00:00Z`;
  const todayAll = useCount('AuditEntries', today);
  const todayPeople = useCount('AuditEntries', `${today} and not startswith(client,'svc-')`);
  const agent = useCount('AuditEntries', `${today} and entitySet eq 'AgentRuns'`);
  const actors = useMemo(() => [...new Set((log.data ?? []).map(a => a.actor))].sort((a, b) => a.localeCompare(b)), [log.data]);
  const names = useQuery<Map<string, string>>(actors.length ? `actors:${actors.join(',')}` : null, async c => {
    const users = await c.all<User>('Users', { filter: `id in (${actors.map(a => `'${a}'`).join(',')})`, select: 'id,name' });
    return new Map(users.map(u => [u.id, u.name]));
  });

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-16 Audit log · desktop">
      <div className="d-app">
        <AdminSide active="N9" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Trust "}<span className="m-sep" />{` ${fmtDay(new Date())} `}<span className="m-sep" />{" all faces and services"}</div>
              <div className="d-h1">{"Audit log"}</div>
              <div className="d-sub">{"Tamper-evident: every entry is hashed and chained to the one before. Corrections are added as new entries, never overwritten."}</div>
            </div>
            <span className="d-btn" data-lk="L303"><Ic n="shield-check" />{"Verify chain"}</span>
          </div>
          <div className="dx-hrow">
            <div className="dx-hero adm-hero" style={{ flex: '1.4', gap: '8px', padding: '18px 22px' }} data-testid="chain-hero">
              <div className="dx-hero__l"><Ic n="shield-check" className="ic ic--sm" />Chain check · {fmtTime(new Date())}</div>
              <div className="hstack" style={{ gap: '14px', alignItems: 'flex-end' }}>
                <span className="dx-display">{chain.data ? (chain.data.valid ? 'Intact' : 'Broken') : chain.error ? 'Unknown' : '…'}</span>
                <span style={{ fontSize: '15px', color: '#CBD5E1', paddingBottom: '6px' }}>
                  {chain.data ? (chain.data.valid ? `${chain.data.checked} entries checked, 0 breaks` : `first break at #${chain.data.firstInvalidSeq}: ${chain.data.reason ?? ''}`) : ''}
                </span>
              </div>
            </div>
            <div className="d-kpi"><span className="d-kpi__l">{"Today"}</span><span className="d-kpi__v">{todayAll ?? '…'}<small>{"entries"}</small></span><span className="d-kpi__s">{todayPeople ?? '…'} by people · {todayAll !== undefined && todayPeople !== undefined ? todayAll - todayPeople : '…'} by services</span></div>
            <div className="d-kpi"><span className="d-kpi__l">{"Planning agent"}</span><span className="d-kpi__v">{agent ?? '…'}</span><span className="d-kpi__s">{"agent runs started or decided today"}</span></div>
          </div>
          <ErrorBanner error={log.error ?? chain.error} onRetry={() => { void log.refresh(); void chain.refresh(); }} />
          <div className="dx-card" style={{ flex: '1', minHeight: '0' }} data-testid="audit-log">
            <div className="dx-card__head">
              <div className="d-toolbar">
                {(Object.keys(AREA_FILTER) as Chip[]).map(k => (
                  <span key={k} className={`d-filter lv-click${chip === k ? ' is-on' : ''}`} role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setChip(k); }} onKeyDown={e => { if (e.key === 'Enter') setChip(k); }}>
                    {AREA_FILTER[k][0]}{chip === k && log.count !== undefined ? <b> {log.count}</b> : null}
                  </span>
                ))}
              </div>
              <span className="spacer" />
              <span className="d-search" style={{ width: '220px' }}>
                <Ic n="filter" className="ic ic--sm" />
                <input className="lv-input" aria-label="Search the audit log" placeholder="Action, person or key" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </div>
            <div className="dx-tr dx-tr--head">
              <span className="dx-td" style={{ width: '110px' }}>{"When"}</span>
              <span className="dx-td" style={{ width: '190px' }}>{"Who"}</span>
              <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>{"What changed"}</span>
              <span className="dx-td" style={{ width: '100px' }}>{"Area"}</span>
              <span className="dx-td" style={{ width: '120px' }}>{"Signature"}</span>
            </div>
            {!log.data && !log.error && <Skeleton rows={6} />}
            {log.data?.length === 0 && <Empty title="No entries" text="Nothing matches this filter." icon="history" />}
            {log.data?.map(a => (
              <div key={a.seq} className="dx-tr" style={{ minHeight: '52px' }} data-lk="L302" data-seq={a.seq} onClickCapture={() => setFocus(String(a.seq))}>
                <span className="dx-td" style={{ width: '110px' }}><span className="dx-td2"><b className="dx-mono" style={{ color: 'var(--text)' }}>{fmtClock(a.at)}</b><span>{fmtDay(a.at)}</span></span></span>
                <span className="dx-td" style={{ width: '190px' }}>
                  <span className="hstack" style={{ gap: '10px' }}>
                    <Ic n={a.client?.startsWith('svc-') ? 'sliders' : 'user'} className="ic ic--sm" />
                    <span className="dx-td2"><b style={{ fontWeight: '700' }}>{names.data?.get(a.actor) ?? (a.client?.startsWith('svc-') ? a.client : a.actor.slice(0, 12))}</b><span>{a.actorRoles?.join(', ')}</span></span>
                  </span>
                </span>
                <span className="dx-td" style={{ flex: '1', minWidth: '0' }}>
                  <span style={{ color: a.outcome === 'SUCCESS' ? 'var(--text)' : 'var(--st-exception-fg)' }}>
                    {a.action}{a.entityKey ? ` · ${a.entityKey}` : ''}{a.outcome !== 'SUCCESS' ? ` · ${a.outcome.toLowerCase()}` : ''}
                  </span>
                </span>
                <span className="dx-td" style={{ width: '100px' }}><span className="t-3" style={{ color: 'var(--text-2)' }}>{a.entitySet ?? a.service}</span></span>
                <span className="dx-td" style={{ width: '120px' }}><span className="adm-hash"><Ic n="link" className="ic ic--sm" />{shortHash(a.hash)}</span></span>
              </div>
            ))}
            <div className="spacer" />
            <div className="x-tfoot">
              <span>Showing <b>{log.data?.length ?? 0}</b> of <b>{log.count ?? '…'}</b> · newest first</span>
              <span className="spacer" />
              {log.hasMore && (log.loadingMore ? <Spinner /> : <Btn className="x-link" onClick={() => void log.loadMore()}>{"Older entries"}<Ic n="chevron-down" /></Btn>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
