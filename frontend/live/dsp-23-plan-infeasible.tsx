'use client';
// DSP-23 Plan infeasible, live. Markup and classes from the generated design (frontend/screens/dsp-23-plan-infeasible.tsx).
// Reached when the planning agent's draft cannot serve the run as the rules stand: protected orders it could not
// place (AgentRuns detail.needsReview: never deferred, so a person must decide) or hard-rule violations left after
// the redraft limit (detail.violations). DSP-22 moves here instead of the plan board, and DSP-02 links here.
// Data: the run under review (AgentRuns('…'), its contextSummary for the chilled demand and reefer capacity,
// vehiclesDown, history and deferral candidates). Nothing is changed here: the dispatcher decides on DSP-03.
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { infeasibility, useAgentRun, usePlanScope, type Infeasibility } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, fmtDayTime, fmtNum, fmtRunDate, isoDay, pct } from '@/lib/format';
import type { AgentRunDetail } from '@/lib/odata/types';
import { useAgentRunId } from '@/lib/workday';

export interface WhyRow {
  code: string;
  title: string;
  text: string;
}

const code = (c: string | undefined) => (c ?? 'RULE').toUpperCase().replace(/_/g, '-');
const list = (ids: string[]) => (ids.length <= 2 ? ids.join(' and ') : `${ids.slice(0, -1).join(', ')} and ${ids[ids.length - 1]}`);

/** "Why, in order of impact": chilled shortfall, vehicles down, protected orders, then rule violations. */
export function whyRows(f: Infeasibility): WhyRow[] {
  const rows: WhyRow[] = [];
  if (f.shortM3 > 0) {
    rows.push({
      code: 'CAP-REEFER',
      title: `Reefers carry ${fmtNum(f.capacityM3, 1)} m³, the run needs ${fmtNum(f.demandM3, 1)}`,
      text: `${fmtNum(f.shortM3, 1)} m³ of chilled orders has no reefer space, after dry orders were moved off the reefers.`,
    });
  }
  if (f.vehiclesDown.length) {
    rows.push({
      code: 'VEH-DOWN',
      title: `${list(f.vehiclesDown)} ${f.vehiclesDown.length === 1 ? 'is' : 'are'} not available`,
      text: 'Left out of this run by the fleet status (workshop or out of service). Their space would help close the gap.',
    });
  }
  for (const r of f.review) {
    rows.push({
      code: /CONFLICT/.test(r.reason ?? '') ? 'PROTECTED' : code(/\(([A-Z_]+)\)/.exec(r.detail ?? '')?.[1] ?? r.reason),
      title: `${r.orderId}${r.outletId ? ` (${r.outletId})` : ''} is protected and has no place`,
      text: r.detail ?? 'Protected orders are never deferred: you place it, or allow another order to wait.',
    });
  }
  const seen = new Set<string>();
  for (const v of f.violations) {
    const key = `${v.rule}:${v.vehicleId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ code: code(v.rule), title: `${v.vehicleId}: ${v.reason}`, text: v.detail });
  }
  return rows;
}

/** Seconds from the first to the last step the agent recorded. */
function draftSeconds(d: AgentRunDetail): number | null {
  const at = (d.history ?? []).map(h => new Date(h.at).getTime()).filter(t => !Number.isNaN(t));
  if (at.length < 2) return null;
  return Math.max(1, Math.round((Math.max(...at) - Math.min(...at)) / 1000));
}

export default function LiveDsp23PlanInfeasible() {
  const nav = useScreenNav();
  const scope = usePlanScope();
  const [runId] = useAgentRunId();
  const run = useAgentRun(runId);
  const detail: AgentRunDetail = run.data?.detail ?? {};
  const f = infeasibility(run.data);
  const version = detail.plan?.version ?? detail.version;
  const depot = run.data?.depot ?? scope.depot ?? scope.active[0];
  const runDate = run.data ? isoDay(run.data.runDate) : scope.runDate;
  const orders = Number((detail.contextSummary as { orders?: number } | undefined)?.orders ?? 0);
  const suggested = (detail.deferrals ?? []).filter(d => d.suggested);
  const tries = 1 + Number(detail.redrafts ?? 0);
  const secs = draftSeconds(detail);
  const rows = f ? whyRows(f) : [];
  const usable = f && f.demandM3 > 0 ? pct(f.capacityM3, f.demandM3) : 0;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-23 Plan infeasible · desktop">
      <div className="d-app">
        <PlanSide active="N2" brandLk="L172" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {`${DEPOT_NAME[depot ?? ''] ?? depot ?? ''} `}<span className="m-sep" />
                {` ${runDate ? `${fmtRunDate(runDate)} run` : 'Planning agent draft'} `}<span className="m-sep" />
                {` ${run.data ? fmtDayTime(run.data.updatedAt ?? run.data.createdAt) : ''}`}
              </div>
              <div className="d-h1" data-testid="infeasible-title">
                {!f ? 'The draft serves the run' : f.review.length ? `No plan places all${orders ? ` ${orders}` : ''} orders as the rules stand` : `No plan serves all${orders ? ` ${orders}` : ''} without deferrals`}
              </div>
            </div>
            <span className="d-btn" data-lk="B"><Ic n="filter" />{"Edit constraints"}</span>
            <span className="d-btn d-btn--primary" data-lk="L172"><Ic n="arrow-left" />Go back to draft{version ? ` v${version}` : ''}</span>
          </div>
          {run.error && <ErrorBanner error={run.error} onRetry={run.refresh} />}
          {!runId && <Empty title="No draft under review" text="Start the planning agent from the cutoff queue; if its draft cannot serve the run, the reasons show here." icon="sparkle-plus" />}
          {runId && !run.data && !run.error && <Skeleton rows={4} label="Loading the draft…" />}
          {run.data && !f && (
            <Empty title="This draft serves every order" text="Nothing is left that needs your judgement here. Review it on the plan board." icon="check">
              <span className="d-btn d-btn--primary" data-lk="L172"><Ic n="grid" />{"Open the plan board"}</span>
            </Empty>
          )}
          {f && (
            <>
              <div className="hstack" style={{ gap: '10px' }}>
                <span className="dx-sech">{"Rule that holds"}</span>
                <span className="d-filter is-on">{"Protected orders are never deferred "}<Ic n="lock" /></span>
                <span className="dx-t13">Planning agent tried {tries} way{tries === 1 ? '' : 's'}{secs ? ` in ${secs} s` : ''}</span>
              </div>
              <div className="dx-hrow">
                <div className="dx-hero dx-hero--bad" style={{ flex: '1' }} data-testid="infeasible-hero">
                  <div className="dx-hero__l"><Ic n="alert" />{"Plan can't be built"}</div>
                  {f.shortM3 > 0 ? (
                    <>
                      <div className="dx-display">{fmtNum(f.shortM3, 1)} m³<small>{"chilled won't fit"}</small></div>
                      <div className="dx-bar" style={{ height: '10px', background: 'rgba(180,35,24,.12)' }}>
                        <div className="dx-g-cold" style={{ width: `${usable}%` }} />
                        <div style={{ flex: '1', background: 'var(--st-exception-fg)' }} />
                      </div>
                      <div className="x-legend">
                        <span><i className="x-sw" style={{ background: 'var(--chilled-fg)' }} />usable {fmtNum(f.capacityM3, 1)}</span>
                        <span><i className="x-sw" style={{ background: 'var(--st-exception-fg)' }} />short {fmtNum(f.shortM3, 1)} of {fmtNum(f.demandM3, 1)} m³</span>
                      </div>
                    </>
                  ) : (
                    <div className="dx-display">{f.review.length || f.violations.length}<small>{f.review.length ? `protected order${f.review.length === 1 ? '' : 's'} can't be placed` : `rule conflict${f.violations.length === 1 ? '' : 's'} left`}</small></div>
                  )}
                </div>
              </div>
              <div className="dx-hrow" style={{ flex: '1' }}>
                <div className="dx-card" style={{ flex: '1' }}>
                  <div className="dx-card__head"><span className="dx-card__title">{"Why, in order of impact"}</span></div>
                  {rows.map((r, i) => (
                    <div key={i} className="dx-lrow" style={{ alignItems: 'flex-start', padding: '14px 20px' }} data-testid="why">
                      <span style={{ paddingTop: '2px' }}><span className="dx-code">{r.code}</span></span>
                      <div className="dx-lrow__main">
                        <span className="dx-lrow__t">{r.title}</span>
                        <span className="dx-t14" style={{ whiteSpace: 'normal' }}>{r.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dx-card" style={{ width: '380px', flexShrink: '0' }}>
                  <div className="dx-card__head"><span className="dx-card__title">{"What you can do"}</span></div>
                  <div className="dx-card__body" style={{ gap: '10px' }}>
                    <div className="dx-inset dx-inset--brand" style={{ gap: '4px' }} data-lk="L173">
                      <b style={{ fontSize: '15px' }}>{suggested.length ? `Allow ${suggested.length} deferral${suggested.length === 1 ? '' : 's'}` : 'Decide the deferrals'}</b>
                      <span className="dx-t14">
                        {suggested.length
                          ? `Back to draft${version ? ` v${version}` : ''}: ${suggested.slice(0, 3).map(d => `${d.outletId} (${d.score})`).join(', ')}${suggested.length > 3 ? ` +${suggested.length - 3}` : ''} to the next run.`
                          : 'No order is a suggested deferral; open the candidates and choose.'}
                        {f.review.length ? ` ${list(f.review.map(r => r.outletId ?? r.orderId))} stay${f.review.length === 1 ? 's' : ''} protected.` : ''}
                      </span>
                    </div>
                    <Btn as="div" className="dx-inset lv-click" style={{ gap: '4px' }} onClick={() => nav.go('L173')}>
                      <b style={{ fontSize: '15px' }}>{"Choose who waits yourself"}</b>
                      <span className="dx-t14">Open the deferral decision with every candidate and score ({(detail.deferrals ?? []).length}).</span>
                    </Btn>
                    <Btn as="div" className="dx-inset lv-click" style={{ gap: '4px' }} onClick={() => nav.go('N6')}>
                      <b style={{ fontSize: '15px' }}>Hire a reefer for {runDate ? fmtRunDate(runDate).split(' ')[0] : 'the run'}</b>
                      <span className="dx-t14">{"Outside Lodestar. The capacity outlook shows the weeks that are short of reefers."}</span>
                    </Btn>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
