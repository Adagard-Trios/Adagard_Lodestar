'use client';
// ADM-02 Overview, live. Markup and classes from the generated design (frontend/screens/adm-02-overview.tsx).
// Data: Devices waiting for activation (access requests) and recently revoked, DENIED AuditEntries of the last
// 24 h, the admin's own audited actions today, Users/Devices/OfflineEvents counts for system health, the audit
// chain check (AuditEntries/Lodestar.VerifyChain()) and Plans waiting for a dispatcher's approval.
import { useAuth } from '@/lib/auth/AuthProvider';
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, daysAgo, fmtDay, fmtDayTime, fmtRunDate, fmtTime } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { AuditEntry, ChainCheck, Device, Plan } from '@/lib/odata/types';

export default function LiveAdm02Overview() {
  const { session } = useAuth();
  const since = `${daysAgo(1)}T00:00:00Z`;
  const pending = useQuery<Device[]>('adm-pending', async c => (await c.list<Device>('Devices', { filter: "status eq 'PENDING'", expand: 'user($select=name,role,depot)', orderby: 'registeredAt desc', top: 5 })).value);
  const denied = useQuery<AuditEntry[]>('adm-denied', async c => (await c.list<AuditEntry>('AuditEntries', { filter: `outcome eq 'DENIED' and at ge ${since}`, orderby: 'seq desc', top: 3 })).value);
  const mine = useQuery<AuditEntry[]>(session ? `adm-mine:${session.sub}` : null, async c =>
    (await c.list<AuditEntry>('AuditEntries', { filter: `actor eq '${session!.sub}' and at ge ${daysAgo(0)}T00:00:00Z`, orderby: 'seq desc', top: 4 })).value);
  const waiting = useQuery<Plan[]>('adm-waiting', async c => (await c.list<Plan>('Plans', { filter: "status in ('NEEDS_APPROVAL','DRAFT')", orderby: 'runDate desc', top: 3 })).value);
  const chain = useQuery<ChainCheck>('adm-chain', c => c.fn<ChainCheck>('AuditEntries', null, 'VerifyChain'));
  const users = useCount('Users', undefined);
  const activeUsers = useCount('Users', 'isActive eq true');
  const devices = useCount('Devices', "status eq 'ACTIVE'");
  const seen = useCount('Devices', `status eq 'ACTIVE' and lastSeenAt ge ${since}`);
  const backlog = useCount('OfflineEvents', 'syncedAt eq null');
  const today = useCount('AuditEntries', `at ge ${daysAgo(0)}T00:00:00Z`);

  const needs = (pending.data?.length ?? 0) + (denied.data?.length ?? 0);
  const first = (session?.name ?? '').split(' ')[0];

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-02 Overview · desktop">
      <div className="d-app">
        <AdminSide active="N0" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{fmtDay(new Date())} <span className="m-sep" /> {fmtTime(new Date())} <span className="m-sep" />{" Both depots"}</div>
              <div className="d-h1">Hello{first ? `, ${first}` : ''}</div>
              <div className="d-sub">{!(pending.data && denied.data) ? ' ' : needs ? `${needs} thing${needs === 1 ? ' is' : 's are'} waiting for you.` : 'Nothing is waiting for you. Everything is quiet.'}</div>
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
                    {pending.data?.length ?? 0} device request{pending.data?.length === 1 ? '' : 's'}, {denied.data?.length ?? 0} refused access
                  </span>
                </div>
                <div className="dx-hero__m" style={{ marginBottom: '6px' }}>Activate devices people registered, and check calls the services refused.</div>
                {!pending.data && <Skeleton rows={2} />}
                {pending.data?.map(d => (
                  <div key={d.id} className="x-hrow" style={{ padding: '12px 0' }} data-device={d.id}>
                    <span className="adm-hlead"><Ic n="phone" /></span>
                    <div className="x-hrow__main">
                      <div className="x-hrow__t">{d.label ?? d.model ?? 'Device'} waiting<span className="id">{d.id}</span></div>
                      <div className="x-hrow__m">{d.user?.name ?? d.userId} · {d.platform ?? ''} · registered {fmtDayTime(d.registeredAt)}</div>
                    </div>
                    <div className="x-hrow__s"><b style={{ fontSize: '15px', fontFamily: 'var(--font-ui)' }}>{"Pending"}</b>{"activation"}</div>
                  </div>
                ))}
                {denied.data?.map(a => (
                  <div key={a.seq} className="x-hrow" style={{ padding: '12px 0' }} data-audit={a.seq}>
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
                <div className="dx-card__head"><span className="dx-card__title">{"Your actions today"}</span><span className="spacer" /><span className="x-link" data-lk="L287">{"Audit log"}<Ic n="chevron-right" /></span></div>
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
                </div>
              </div>
              <div className="dx-card" style={{ flex: '1', minHeight: '0' }}>
                <div className="dx-card__head"><span className="dx-card__title">{"Waiting on someone else"}</span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  {waiting.data?.length === 0 && <Empty title="Nothing waiting" text="No plan is waiting for a dispatcher." />}
                  {waiting.data?.map(p => (
                    <div key={p.id} className="dx-kv" style={{ minHeight: '56px' }}>
                      <span className="hstack" style={{ gap: '10px' }}><Ic n="grid" className="ic ic--sm" /><span className="dx-td2"><b>{p.id}</b><span>{DEPOT_NAME[p.depot] ?? p.depot} · {fmtRunDate(p.runDate)} · approval by a dispatcher</span></span></span>
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
