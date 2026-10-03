'use client';
// ADM-02 Overview, live. Markup and classes from the generated design (frontend/screens/adm-02-overview.tsx).
// Data: Devices waiting for activation (access requests) and recently revoked, DENIED AuditEntries of the last
// 24 h, the admin's own audited actions today, Users/Devices/OfflineEvents counts for system health, the audit
// chain check (AuditEntries/Lodestar.VerifyChain()), the last data import (DataImports) and Plans waiting for a
// dispatcher's approval.
// A lost phone is the design's "Run moved to a new phone" case: a person asked for a new device (PENDING) while
// their old one is still ACTIVE. It ranks first, with the records still on it (their OfflineEvents not synced),
// and opens ADM-07 (L285) for that device. A request row opens ADM-05 on that request; a refused call opens its
// audit entry (ADM-19).
import { useRouter } from 'next/navigation';
import { useScreenNav } from '@/components/ScreenShell';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { daysAgo, fmtDay, fmtDayTime, fmtRunDate, fmtTime, TIME_ZONE } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import { IMPORT_FILES, type DataImport } from '@/components/live/settings-data';
import type { AuditEntry, ChainCheck, Device, OfflineEvent, Plan } from '@/lib/odata/types';
import { useFocusId } from '@/lib/workday';
import { useDepots } from '@/components/live/depots';

const inList = (ids: string[]) => ids.map(i => `'${i.replace(/'/g, "''")}'`).join(',');
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function LiveAdm02Overview() {
  const { name: depotName } = useDepots();
  const router = useRouter();
  const nav = useScreenNav();
  const [, setDevice] = useFocusId('device');
  const [, setAudit] = useFocusId('audit');
  const { session } = useAuth();
  const since = `${daysAgo(1)}T00:00:00Z`;
  const pending = useQuery<Device[]>('adm-pending', async c => (await c.list<Device>('Devices', { filter: "status eq 'PENDING'", expand: 'user($select=name,role,depot)', orderby: 'registeredAt desc', top: 5 })).value);
  const denied = useQuery<AuditEntry[]>('adm-denied', async c => (await c.list<AuditEntry>('AuditEntries', { filter: `outcome eq 'DENIED' and at ge ${since}`, orderby: 'seq desc', top: 3 })).value);
  const mine = useQuery<AuditEntry[]>(session ? `adm-mine:${session.sub}` : null, async c =>
    (await c.list<AuditEntry>('AuditEntries', { filter: `actor eq '${session!.sub}' and at ge ${daysAgo(0)}T00:00:00Z`, orderby: 'seq desc', top: 4 })).value);
  const askers = [...new Set((pending.data ?? []).map(d => d.userId))].sort((a, b) => a.localeCompare(b));
  const lost = useQuery<Array<Device & { records: number }>>(pending.data ? `adm-lost:${askers.join(',')}` : null, async c => {
    if (!askers.length) return [];
    const [old, events] = await Promise.all([
      c.all<Device>('Devices', { filter: `status eq 'ACTIVE' and userId in (${inList(askers)})`, expand: 'user($select=name,role,depot)', orderby: 'lastSeenAt desc' }),
      c.all<OfflineEvent>('OfflineEvents', { filter: `syncedAt eq null and driverId in (${inList(askers)})`, select: 'id,driverId' }),
    ]);
    return old
      .filter(d => d.status === 'ACTIVE' && askers.includes(d.userId))
      .map(d => ({ ...d, records: events.filter(e => e.driverId === d.userId).length }))
      .sort((a, b) => b.records - a.records);
  });
  const lastImport = useQuery<DataImport | null>('adm-last-import', async c => (await c.list<DataImport>('DataImports', { orderby: 'importedAt desc', top: 1 })).value[0] ?? null);
  const waiting = useQuery<Plan[]>('adm-waiting', async c => (await c.list<Plan>('Plans', { filter: "status in ('NEEDS_APPROVAL','DRAFT')", orderby: 'runDate desc', top: 3 })).value);
  const chain = useQuery<ChainCheck>('adm-chain', c => c.fn<ChainCheck>('AuditEntries', null, 'VerifyChain'));
  const users = useCount('Users', undefined);
  const activeUsers = useCount('Users', 'isActive eq true');
  const devices = useCount('Devices', "status eq 'ACTIVE'");
  const seen = useCount('Devices', `status eq 'ACTIVE' and lastSeenAt ge ${since}`);
  const backlog = useCount('OfflineEvents', 'syncedAt eq null');
  const today = useCount('AuditEntries', `at ge ${daysAgo(0)}T00:00:00Z`);

  const lostN = lost.data?.length ?? 0;
  const needs = (pending.data?.length ?? 0) + (denied.data?.length ?? 0) + lostN;
  const first0 = lost.data?.[0];
  const openRequest = (d: Device) => { setDevice(d.id); router.push('/admin/adm-05-access-requests'); };
  const openLost = (d: Device) => { setDevice(d.id); if (!nav.go('L285')) router.push('/admin/adm-07-lost-phone'); };
  const openAudit = (a: AuditEntry) => { setAudit(String(a.seq)); router.push('/admin/adm-19-audit-entry-detail'); };
  const click = (fn: () => void) => ({
    role: 'button' as const, tabIndex: 0,
    onClick: (e: { stopPropagation(): void }) => { e.stopPropagation(); fn(); },
    onKeyDown: (e: { key: string }) => { if (e.key === 'Enter') fn(); },
  });
  const first = (session?.name ?? '').split(' ')[0];
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: TIME_ZONE }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const year = new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: TIME_ZONE }).format(now);

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-02 Overview · desktop">
      <div className="d-app">
        <AdminSide active="N0" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{fmtDay(now)} {year} <span className="m-sep" /> {fmtTime(now)} <span className="m-sep" />{" Both depots"}</div>
              <div className="d-h1">{greeting}{first ? `, ${first}` : ''}</div>
              <div className="d-sub">{!(pending.data && denied.data) ? ' ' : needs ? `${needs} thing${needs === 1 ? ' is' : 's are'} waiting for you. Everything else is quiet.` : 'Nothing is waiting for you. Everything is quiet.'}</div>
            </div>
            <span className="d-btn d-btn--ghost" data-lk="L287"><Ic n="history" />{"Open audit log"}</span>
          </div>
          <ErrorBanner error={pending.error ?? denied.error} onRetry={() => { void pending.refresh(); void denied.refresh(); }} />
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-col" style={{ flex: '1.35' }}>
              <div className="dx-hero adm-hero" style={{ gap: '6px', padding: '22px 24px 8px' }}>
                <div className="dx-hero__l"><Ic n="bell" className="ic ic--sm" />{"Needs you now"}</div>
                <div className="hstack" style={{ gap: '14px', alignItems: 'flex-end' }}>
                  <span className="dx-display" data-testid="needs-you">{pending.data && denied.data ? needs : '…'}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', paddingBottom: '5px' }} data-lk="L285">
                    {plural(pending.data?.length ?? 0, 'device request')}, {lostN ? `${plural(lostN, 'lost phone')}, ` : ''}{denied.data?.length ?? 0} refused access
                  </span>
                </div>
                <div className="dx-hero__m" style={{ marginBottom: '6px' }}>
                  {first0
                    ? <>Start with the lost phone: it holds <b>{plural(first0.records, 'record')}</b> that {first0.records === 1 ? 'has' : 'have'} not reached Lodestar yet.</>
                    : 'Activate devices people registered, and check calls the services refused.'}
                </div>
                {!pending.data && <Skeleton rows={2} />}
                {lost.data?.map(d => (
                  <div key={d.id} className="x-hrow lv-click" style={{ padding: '12px 0' }} data-lost={d.id} {...click(() => openLost(d))}>
                    <span className="adm-hlead adm-hlead--bad"><Ic n="phone" /></span>
                    <div className="x-hrow__main">
                      <div className="x-hrow__t">{d.label ?? d.model ?? 'Phone'} replaced, still active<span className="id">{d.id}</span></div>
                      <div className="x-hrow__m">{d.user?.name ?? d.userId} asked for a new device{d.lastSeenAt ? ` · last seen ${fmtDayTime(d.lastSeenAt)}` : ''}</div>
                    </div>
                    <div className="x-hrow__s"><b style={{ fontSize: '15px', fontFamily: 'var(--font-ui)' }}>{plural(d.records, 'record')}</b>{"not synced"}</div>
                  </div>
                ))}
                {pending.data?.map(d => (
                  <div key={d.id} className="x-hrow lv-click" style={{ padding: '12px 0' }} data-device={d.id} {...click(() => openRequest(d))}>
                    <div className="x-hrow__main">
                      <div className="x-hrow__t">{d.label ?? d.model ?? 'Device'} waiting<span className="id">{d.id}</span></div>
                      <div className="x-hrow__m">{d.user?.name ?? d.userId} · {d.platform ?? ''} · registered {fmtDayTime(d.registeredAt)}</div>
                    </div>
                    <div className="x-hrow__s"><b style={{ fontSize: '15px', fontFamily: 'var(--font-ui)' }}>{"Pending"}</b>{"activation"}</div>
                  </div>
                ))}
                {denied.data?.map(a => (
                  <div key={a.seq} className="x-hrow lv-click" style={{ padding: '12px 0' }} data-audit={a.seq} {...click(() => openAudit(a))}>
                    <span className="adm-hlead adm-hlead--bad"><Ic n="ban" /></span>
                    <div className="x-hrow__main">
                      <div className="x-hrow__t">Refused: {a.action}<span className="id">#{a.seq}</span></div>
                      <div className="x-hrow__m">{a.actor} · {a.client} · {fmtTime(a.at)}</div>
                    </div>
                    <div className="x-hrow__s"><b style={{ fontSize: '15px', fontFamily: 'var(--font-ui)' }}>{a.service}</b>{"service"}</div>
                  </div>
                ))}
              </div>
              <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
                <div className="dx-card__head"><span className="dx-card__title">{"Resolved today"}</span><span className="spacer" /><span className="x-link" data-lk="L287">{"Audit log"}<Ic n="chevron-right" /></span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  {mine.data?.length === 0 && <span className="dx-t13">No changes by you today.</span>}
                  {mine.data?.map(a => (
                    <div key={a.seq} className="dx-kv" style={{ minHeight: '54px' }}>
                      <span className="hstack" style={{ gap: '10px' }}><Ic n="check" className="ic ic--sm" /><span className="dx-td2"><b>{a.action}{a.entityKey ? ` · ${a.entityKey}` : ''}</b><span>{a.service} · {fmtTime(a.at)}</span></span></span>
                      <span className={`m-tag ${a.outcome === 'SUCCESS' ? 'm-tag--ok' : 'm-tag--warn'}`}><span className="dot" />{a.outcome === 'SUCCESS' ? 'Done' : a.outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dx-col" style={{ flex: '1' }}>
              <div className="dx-card">
                <div className="dx-card__head">
                  <span className="dx-card__title">{"System health"}</span><span className="spacer" />
                  <span className={`m-tag ${chain.data?.valid === false ? 'm-tag--warn' : 'm-tag--ok'}`}><span className="dot" />{chain.data ? (chain.data.valid ? 'All normal' : 'Check the audit chain') : 'Checking…'}</span>
                </div>
                <div className="dx-card__body" style={{ gap: '0', paddingBottom: '10px' }}>
                  <div className="adm-health">
                    <span className="adm-health__i" style={{ color: 'var(--st-delivered-fg)' }}><Ic n="people" /></span>
                    <div className="vstack" style={{ gap: '1px', minWidth: '0', flex: '1' }}>
                      <span className="adm-health__l">{"People with access"}</span>
                      <span className="adm-health__v">{activeUsers ?? '…'} <small>of {users ?? '…'}</small></span>
                      <span className="adm-health__s">{"active accounts in the directory"}</span>
                    </div>
                  </div>
                  <div className="adm-health">
                    <span className="adm-health__i" style={{ color: 'var(--st-delivered-fg)' }}><Ic n="phone" /></span>
                    <div className="vstack" style={{ gap: '1px', minWidth: '0', flex: '1' }}>
                      <span className="adm-health__l">{"Devices seen in 24 h"}</span>
                      <span className="adm-health__v">{seen ?? '…'} <small>of {devices ?? '…'}</small></span>
                      <span className="adm-health__s">{"active bay tablets and driver phones"}</span>
                    </div>
                  </div>
                  <div className="adm-health">
                    <span className="adm-health__i" style={{ color: backlog ? 'var(--st-deferred-fg)' : 'var(--st-delivered-fg)' }}><Ic n="refresh" /></span>
                    <div className="vstack" style={{ gap: '1px', minWidth: '0', flex: '1' }}>
                      <span className="adm-health__l">{"Sync backlog"}</span>
                      <span className="adm-health__v">{backlog ?? '…'} <small>records</small></span>
                      <span className="adm-health__s">{"offline events not yet replayed"}</span>
                    </div>
                  </div>
                  <div className="adm-health">
                    <span className="adm-health__i" style={{ color: chain.data?.valid === false ? 'var(--st-exception-fg)' : 'var(--st-delivered-fg)' }}><Ic n="shield-check" /></span>
                    <div className="vstack" style={{ gap: '1px', minWidth: '0', flex: '1' }}>
                      <span className="adm-health__l">{"Audit chain"}</span>
                      <span className="adm-health__v">{chain.data ? (chain.data.valid ? 'Intact' : 'Broken') : '…'} <small>{chain.data?.checked ?? ''} entries</small></span>
                      <span className="adm-health__s">{today ?? '…'} entries today</span>
                    </div>
                  </div>
                  <div className="adm-health" data-testid="last-import">
                    <span className="adm-health__i" style={{ color: lastImport.data && !lastImport.data.applied ? 'var(--st-exception-fg)' : 'var(--st-delivered-fg)' }}><Ic n="upload" /></span>
                    <div className="vstack" style={{ gap: '1px', minWidth: '0', flex: '1' }}>
                      <span className="adm-health__l">{"Last data import"}</span>
                      <span className="adm-health__v">
                        {lastImport.data ? IMPORT_FILES.find(f => f.file === lastImport.data!.file)?.csv ?? lastImport.data.file : lastImport.data === null ? 'None yet' : '…'}
                        {lastImport.data && <small> {fmtDay(lastImport.data.importedAt)}</small>}
                      </span>
                      <span className="adm-health__s">
                        {lastImport.data
                          ? `${lastImport.data.rows} rows, ${lastImport.data.applied ? 'clean' : 'check failed'} · by ${lastImport.data.byName ?? 'an admin'}`
                          : lastImport.data === null ? 'the planner reads the seeded reference data' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
                <div className="dx-card__head"><span className="dx-card__title">{"Waiting on someone else"}</span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  {waiting.data?.length === 0 && <Empty title="Nothing waiting" text="No plan is waiting for a dispatcher." />}
                  {waiting.data?.map(p => (
                    <div key={p.id} className="dx-kv" style={{ minHeight: '56px' }}>
                      <span className="hstack" style={{ gap: '10px' }}><Ic n="grid" className="ic ic--sm" /><span className="dx-td2"><b>{p.id}</b><span>{depotName(p.depot)} · {fmtRunDate(p.runDate)} · approval by a dispatcher</span></span></span>
                      <span className="m-pill m-pill--warn" style={{ height: '26px', fontSize: '12.5px' }}><span className="dot" />{"Waiting"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
