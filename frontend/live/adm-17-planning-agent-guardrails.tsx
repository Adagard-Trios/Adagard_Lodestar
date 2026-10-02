'use client';
// ADM-17 Planning agent guardrails, live. Markup and classes from the generated design (frontend/screens/adm-17-planning-agent-guardrails.tsx).
// Data: the agent's own guardrails (AgentRuns/Lodestar.AgentConfig, from the agent's GET /config: human approval,
// canPublish false, max redrafts, the hard rules it checks, the protected score, what it reads) and the outlet
// access notes it reads with the outlet rows (Outlets accessNote). Every guardrail is enforced in code (agent and
// planning service), so the toggles show the state and cannot be switched here; the locked ones carry the lock.
// "See its last 30 proposals" opens the audit log (the design's L304).
import { AdminSide, useCount } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { useAgentConfig } from '@/components/live/settings-data';
import { ErrorBanner, Skeleton } from '@/components/live/states';
import { CUTOFF_LABEL } from '@/lib/workday';
import { useQuery } from '@/lib/odata/hooks';
import type { Outlet } from '@/lib/odata/types';
import type { ReactNode } from 'react';

const READ_LABEL: Record<string, [string, string]> = {
  master: ['Orders, outlets, vehicles, calendar', 'master data'],
  feeds: ['Travel times, service allowances', 'CSV feeds'],
};

function Can({ title, sub, on, locked }: { title: string; sub: ReactNode; on: boolean; locked?: boolean }) {
  const toggle = <span className={`dx-toggle${on ? '' : ' dx-toggle--off'}`} style={locked ? { opacity: '.6' } : undefined} role="switch" aria-checked={on} aria-label={title}><i /></span>;
  return (
    <div className="dx-kv" style={{ minHeight: '58px' }}>
      <span className="dx-td2" style={{ whiteSpace: 'normal' }}><b>{title}</b><span>{sub}</span></span>
      {locked ? <span className="hstack" style={{ gap: '8px' }}><span className="adm-lock"><Ic n="lock" /></span>{toggle}</span> : toggle}
    </div>
  );
}

function Reads({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className="x-ck" style={{ minHeight: '31px' }}>
      <span className="x-ck__i" style={on ? undefined : { background: 'var(--surface-3)', color: 'var(--text-3)' }}><Ic n={on ? 'check' : 'x'} /></span>
      <span className="x-ck__l" style={on ? undefined : { color: 'var(--text-2)', fontWeight: '500' }}>{label}</span>
      <span className="x-ck__v">{value}</span>
    </div>
  );
}

export default function LiveAdm17PlanningAgentGuardrails() {
  const config = useAgentConfig();
  const c = config.data;
  const noteCount = useCount('Outlets', 'accessNote ne null');
  const notes = useQuery<Outlet[]>('adm17-notes', cl => cl.all<Outlet>('Outlets', { filter: 'accessNote ne null', select: 'id,name,district,accessNote', orderby: 'id', top: 3 }, 1));
  const reads = new Set(c?.reads ?? []);
  const readsMaster = ['Orders', 'Outlets', 'Vehicles', 'Calendar'].every(s => reads.has(s));
  const readsFeeds = ['DistrictTravel', 'ServiceAllowances'].every(s => reads.has(s));
  const readsLive = reads.has('Trips') || reads.has('TripStops');

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-17 Planning agent guardrails · desktop">
      <div className="d-app">
        <AdminSide active="N10" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Trust "}<span className="m-sep" />{" applies to both depots"}</div>
              <div className="d-h1">{"Planning agent guardrails"}</div>
              <div className="d-sub">{"The planning agent drafts and proposes. People decide. These settings say what it may read and what it may never do."}</div>
            </div>
            <span className="d-btn" data-lk="L304"><Ic n="history" />{"See its last 30 proposals"}</span>
          </div>
          <ErrorBanner error={config.error} onRetry={config.refresh} />
          <div className="dx-hero adm-hero" style={{ flexDirection: 'row', alignItems: 'center', gap: '18px', padding: '20px 24px' }} data-testid="approval-lock">
            <span className="adm-bigLock"><Ic n="lock" /></span>
            <div className="vstack" style={{ gap: '4px', flex: '1' }}>
              <span className="dx-hero__l" style={{ padding: '0' }}>{"Locked setting · cannot be changed here"}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                {c && (!c.humanApproval || c.canPublish) ? 'Warning: the agent reports it can publish without approval' : "It can never publish a plan without a dispatcher's approval"}
              </span>
              <span className="dx-hero__m">{`Plans reach docks, drivers and stores only after a ${c?.decidedBy ?? 'dispatcher'} presses Approve in Lodestar Plan. This holds on the phone at 3 AM too. Changing it needs a Waypoint policy change, not an admin click.`}</span>
            </div>
          </div>
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-card" style={{ flex: '1.1' }}>
              <div className="dx-card__head"><span className="dx-card__title">{"What it may do"}</span></div>
              <div className="dx-card__body" style={{ gap: '0' }} data-testid="may-do">
                {!c && !config.error ? <Skeleton rows={5} /> : (
                  <>
                    <Can title={`Draft plans at the ${CUTOFF_LABEL} cutoff`} on sub={c ? `Every draft shows the ${c.rules.length} rules it checked and its reasons; up to ${c.maxRedrafts} redrafts to clear a violation` : 'Every draft shows the rules it used and its reasons'} />
                    <Can title="Re-plan when something breaks" on sub="Vehicle failure, blocked dock, late store report. Waits for approval" />
                    <Can title="Propose deferrals with a reason code" on sub={`Never defers an outlet deferred on the previous run${c ? ` (score ${c.limits.protectedScore} or more is protected) · ${c.reasonCodes.join(', ')}` : ''}`} />
                    <Can title="Swap vehicles inside the same depot" on sub="Only between vehicles that pass weight, volume and reefer checks" />
                    <Can title="Plan a vehicle marked in the workshop" on={false} locked sub="Blocked while a workshop date is set in Vehicles" />
                    <Can title="Publish without approval" on={c ? c.canPublish : false} locked sub="Blocked for every depot, every hour" />
                  </>
                )}
              </div>
            </div>
            <div className="dx-col" style={{ flex: '1' }}>
              <div className="dx-card">
                <div className="dx-card__head"><span className="dx-card__title">{"What it may read"}</span></div>
                <div className="dx-card__body" style={{ gap: '0', paddingBottom: '12px' }} data-testid="may-read">
                  <Reads label={READ_LABEL.master[0]} value={READ_LABEL.master[1]} on={!c || readsMaster} />
                  <Reads label={READ_LABEL.feeds[0]} value={READ_LABEL.feeds[1]} on={!c || readsFeeds} />
                  <Reads label="Live vehicle positions and delivery records" value={readsLive ? 'live' : 'not read'} on={readsLive} />
                  <Reads label="Dispatcher notes" value={noteCount === undefined ? '…' : `${noteCount} active`} on />
                  <Reads label="Personal phone numbers and sign-in data" value="never" on={false} />
                  <Reads label="Proof-of-delivery photos" value="never" on={false} />
                </div>
              </div>
              <div className="dx-card" style={{ flex: '1' }}>
                <div className="dx-card__head">
                  <span className="dx-card__title">{"Dispatcher notes reuse"}</span>
                  <span className="spacer" />
                  <span className="dx-toggle" role="switch" aria-checked aria-label="Dispatcher notes reuse"><i /></span>
                </div>
                <div className="dx-card__body" style={{ gap: '6px' }}>
                  <span className="dx-t13" style={{ color: 'var(--text-2)' }}>
                    {"Access notes sit on the outlet rows the agent reads for every draft, so they travel with the outlet. Each note belongs to its outlet; an admin changes or clears it in Outlets."}
                  </span>
                  <ErrorBanner error={notes.error} onRetry={notes.refresh} compact />
                  {notes.data?.map((o, i) => (
                    <div key={o.id} className="dx-kv" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', minHeight: '0', padding: i === notes.data!.length - 1 ? '10px 0 0' : '10px 0 6px' }}>
                      <span className="hstack" style={{ gap: '8px' }}><span className="id" style={{ color: 'var(--text)' }}>{o.id}</span><b style={{ fontSize: '14px' }}>{o.district}</b></span>
                      <span style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'normal' }}>{o.accessNote}</span>
                      <span className="dx-t13">{o.name}</span>
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
