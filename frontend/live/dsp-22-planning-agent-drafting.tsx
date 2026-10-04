'use client';
// DSP-22 Planning agent drafting, live. Markup and classes from the generated design
// (frontend/screens/dsp-22-planning-agent-drafting.tsx).
// Data: AgentRuns('…') polled while the LangGraph run drafts; its history drives the steps. When the run stops
// at NEEDS_APPROVAL the screen moves on to the plan board (the design's auto-advance), where a human decides —
// or, when the draft cannot serve the run as the rules stand (protected orders it could not place, rule
// violations left), to DSP-23 Plan infeasible, which says why.
// Nothing goes live from here: the agent can never publish.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { tripTwoHead } from '@/components/live/board';
import { infeasibility, useReviewRun, usePlanScope, useStartAgentRun, useStartingRun } from '@/components/live/plan-data';
import { type AgentConfig, useAgentConfig } from '@/components/live/settings-data';
import { Empty, ErrorBanner } from '@/components/live/states';
import { fmtNum, fmtRunDate, fmtTime, isoDay } from '@/lib/format';
import type { AgentRunDetail } from '@/lib/odata/types';
import { useDepots } from '@/components/live/depots';

const BOARD = '/plan/dsp-02-plan-board';
export const INFEASIBLE = '/plan/dsp-23-plan-infeasible';

type Step = { node: string; label: (d: AgentRunDetail, c?: AgentConfig) => React.ReactNode; value?: (d: AgentRunDetail) => string };

/** "Checking the N rules: weight, volume, …" from the agent's own rule list (AgentConfig), never a fixed count. */
const rulesLine = (c?: AgentConfig) => {
  const rules = Array.isArray(c?.rules) ? c!.rules : [];
  return rules.length ? `Checking the ${rules.length} rules: ${rules.map(r => r.label.toLowerCase()).join(', ')}` : 'Checking the rules';
};
const cs = (d: AgentRunDetail) => (d.contextSummary ?? {}) as {
  orders?: number; vehicles?: number; vehiclesDown?: string[]; chilledDemand?: { m3?: number }; reeferCapacity?: { m3?: number };
};

const STEPS: Step[] = [
  { node: 'load_context', label: d => <><b>Read {cs(d).orders ?? 'the'} orders</b>{" with outlets, access and windows"}</>, value: d => (cs(d).orders !== undefined ? `${cs(d).orders} orders` : '') },
  {
    node: 'load_context',
    label: d => <><b>Checked the fleet:</b> {cs(d).vehiclesDown?.length ? `${cs(d).vehiclesDown!.length} not available, ${cs(d).vehiclesDown!.slice(0, 3).join(' ')}` : 'every vehicle available'}</>,
    value: d => (cs(d).vehicles !== undefined ? `${(cs(d).vehicles ?? 0) - (cs(d).vehiclesDown?.length ?? 0)} / ${cs(d).vehicles} ready` : ''),
  },
  { node: 'draft_plan', label: d => <><b>Packing trips:</b> {d.plan?.trips?.length ?? 0}{" trips, 1 brand and 1 district a trip"}</>, value: d => (cs(d).reeferCapacity?.m3 ? `${fmtNum(cs(d).reeferCapacity!.m3, 1)} m³ reefer` : '') },
  { node: 'check_rules', label: (_d, c) => <>{rulesLine(c)}</>, value: d => (d.ruleChecks ? `${d.ruleChecks.filter(r => r.passed).length} / ${d.ruleChecks.length} pass` : '') },
  { node: 'rank_deferrals', label: () => <>{"Ranking deferral candidates if anything is left over, protected outlets kept"}</>, value: d => (d.deferrals ? `${d.deferrals.length} candidates` : '') },
  { node: 'explain', label: () => <>{"Writing what it did and what it checked"}</> },
];

export default function LiveDsp22PlanningAgentDrafting() {
  const { name: depotName } = useDepots();
  const router = useRouter();
  const scope = usePlanScope();
  const { runId: reviewId, run: review, setRunId } = useReviewRun();
  const config = useAgentConfig();
  const start = useStartAgentRun(r => setRunId(r.id), { track: true });
  // the draft this tab just asked for (DSP-01 or the button below): the agent is still working on it, so no
  // earlier run of the day stands in for it; its steps advance with the time it has been drafting
  const starting = useStartingRun();
  const pending = Boolean(starting && !starting.failed);
  const now = useNow(pending);
  const runId = pending ? null : reviewId;
  const run = pending ? { ...review, data: undefined, error: undefined, drafting: true } : review;
  const status = pending ? 'DRAFTING' : String(run.data?.status ?? '').toUpperCase();
  const detail: AgentRunDetail = run.data?.detail ?? {};
  const paced = pending ? Math.max(0, Math.min(Math.floor((now - starting!.at) / 4000), STEPS.length - 1)) : 0;
  const done = new Set(pending ? STEPS.slice(0, paced).map(s => s.node) : (detail.history ?? []).map(h => h.node));
  const ready = status === 'NEEDS_APPROVAL';
  const blocked = ready && infeasibility(run.data) !== null;
  const next = blocked ? INFEASIBLE : BOARD;

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => router.push(next), 1500);
      return () => clearTimeout(t);
    }
  }, [ready, next, router]);

  const firstOpen = pending ? paced : STEPS.findIndex(s => !done.has(s.node));
  const progress = ready || ['APPROVED', 'REJECTED'].includes(status) ? 100 : Math.round((Math.max(firstOpen, 0) / STEPS.length) * 100);
  const depot = starting?.depot ?? run.data?.depot ?? scope.depot ?? scope.active[0];
  const runDate = starting?.runDate ?? (run.data ? isoDay(run.data.runDate) : scope.runDate);
  const begin = () => { setRunId(null); void start.run({ depot: depot!, runDate: runDate! }); };

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-22 Planning agent drafting · desktop">
      <div className="d-app">
        <PlanSide active="N2" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {depotName(depot)}
                <span className="m-sep" />
                {runDate ? `${fmtRunDate(runDate)} run` : ''}
                {run.data && <><span className="m-sep" />started {fmtTime(run.data.createdAt)}</>}
              </div>
              <div className="d-h1">
                {blocked ? 'The draft cannot serve every order' : ready ? 'Draft ready for your review' : status === 'FAILED' ? 'The planning agent stopped' : `Planning agent is drafting ${runDate ? fmtRunDate(runDate) : ''}`}
              </div>
            </div>
            <span className="d-btn" data-lk="C"><Ic n="x" />{"Stop, plan manually"}</span>
          </div>
          {starting?.failed && !start.error && <ErrorBanner error={new Error('The planning agent could not draft this run. Start it again or plan manually.')} />}
          {!runId && !pending && (
            <div className="dx-card">
              <Empty title="No draft running" text="Start the planning agent for this run date. It drafts and explains; only you can approve." icon="sparkle-plus">
                <Btn
                  className="d-btn d-btn--primary"
                  testId="start-agent"
                  busy={start.pending}
                  disabled={!depot || !runDate}
                  onClick={begin}
                >
                  <Ic n="sparkle-plus" />{"Start the planning agent"}
                </Btn>
              </Empty>
              <ErrorBanner error={start.error} />
            </div>
          )}
          {run.error && <ErrorBanner error={run.error} onRetry={run.refresh} />}
          {status === 'FAILED' && <ErrorBanner error={new Error('The agent run failed. Plan manually or start a new draft.')} />}
          {(runId || pending) && (
            <div className="dx-hrow">
              <div className="dx-card" style={{ flex: '1' }}>
                <div className="dx-card__body" style={{ padding: '22px 24px', gap: '14px' }}>
                  <div className="hstack" style={{ gap: '16px', alignItems: 'flex-end' }}>
                    <span className="dx-display" data-testid="agent-status">{ready ? 'Ready' : status ? status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ') : 'Starting'}</span>
                    <span className="dx-t14" style={{ paddingBottom: '6px' }}>
                      {blocked ? 'opening why the plan can’t be built' : ready ? 'opening the plan board for your review' : `step ${Math.min(Math.max(firstOpen, 0) + 1, STEPS.length)} of ${STEPS.length} · you can keep working`}
                      {" · nothing goes live from here"}
                    </span>
                  </div>
                  <div className="dx-bar" style={{ height: '10px' }}><div className="dx-g-brand" style={{ width: `${progress}%` }} /></div>
                  <div className="vstack" style={{ gap: '0' }}>
                    {STEPS.map((s, i) => {
                      const ok = done.has(s.node) && (i < firstOpen || firstOpen === -1);
                      const working = !ok && i === firstOpen && run.drafting;
                      return (
                        <div key={i} className="dx-step" style={ok || working ? undefined : { color: 'var(--text-3)' }}>
                          {ok ? <span className="dx-step__i dx-step__i--ok"><Ic n="check" /></span> : working ? <span className="dx-spin lv-spin" /> : <span className="dx-step__i dx-step__i--wait" />}
                          <span>{s.label(detail, config.data)}</span>
                          {(ok || working) && <span className="dx-step__v">{ok ? s.value?.(detail) ?? 'done' : 'working'}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {ready && (
                    <div className="hstack" style={{ gap: '10px' }}>
                      {blocked && <Btn className="d-btn d-btn--primary" testId="see-infeasible" onClick={() => router.push(INFEASIBLE)}><Ic n="alert" />{"See why the plan can’t be built"}</Btn>}
                      <Btn className={`d-btn${blocked ? '' : ' d-btn--primary'}`} onClick={() => router.push(BOARD)}><Ic n="grid" />{"Review on the plan board"}</Btn>
                    </div>
                  )}
                </div>
              </div>
              <div className="dx-col" style={{ width: '320px', flexShrink: '0' }}>
                <div className="dx-inset dx-inset--brand" style={{ padding: '18px' }}>
                  <span className="dx-sech" style={{ color: 'var(--brand-600)' }}>{"Run"}</span>
                  <b style={{ fontSize: '16px' }} className="mono">{runId ?? 'starting…'}</b>
                  <span className="dx-t14">{detail.redrafts ? `${String(detail.redrafts)} redraft(s) after rule checks.` : 'Drafts, checks the rules and explains itself.'}</span>
                </div>
                <div className="dx-inset" style={{ padding: '18px' }}>
                  <span className="dx-sech">{"Your locks are kept"}</span>
                  <span className="dx-t14">{"Locked trips and manual moves stay as you left them. Protected outlets can't be proposed for deferral."}</span>
                </div>
                <div className="dx-inset" style={{ padding: '18px' }}>
                  <span className="dx-sech">{"Draft only"}</span>
                  <span className="dx-t14">{"The agent can't publish, message stores or unlock protected outlets. You review and approve on the plan board."}</span>
                </div>
              </div>
            </div>
          )}
          {(runId || pending) && !ready && (
            <div className="vstack" style={{ gap: '12px', flex: '1', minHeight: '0', opacity: '.9' }} aria-hidden>
              <div className="x-lanehead">
                <span style={{ width: '168px' }}>{"Vehicle · Fresh minutes"}</span>
                <span style={{ flex: '1' }}>{"Trip 1"}</span>
                <span style={{ flex: '1' }}>{tripTwoHead(config.data?.limits)}</span>
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} className="hstack" style={{ gap: '14px' }}>
                  <div className="vstack" style={{ gap: '8px', width: '168px', flexShrink: '0' }}>
                    <span className="dx-skel" style={{ width: '90px' }} />
                    <span className="dx-skel" style={{ width: '130px', height: '18px' }} />
                    <span className="dx-skel" style={{ width: '110px', height: '8px' }} />
                  </div>
                  <div className="dx-skelcard">
                    <span className="dx-skel" style={{ width: '60%' }} />
                    <span className="dx-skel" style={{ width: '85%', height: '8px' }} />
                    <span className="dx-skel" style={{ width: '40%', height: '8px' }} />
                  </div>
                  <div className="dx-skelcard">
                    <span className="dx-skel" style={{ width: '55%' }} />
                    <span className="dx-skel" style={{ width: '80%', height: '8px' }} />
                    <span className="dx-skel" style={{ width: '45%', height: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The clock, ticking each second while `on` (the paced steps of a draft still being made). */
function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [on]);
  return now;
}
