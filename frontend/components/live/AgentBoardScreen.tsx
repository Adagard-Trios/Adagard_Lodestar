'use client';
// Shared body of DSP-39 (Ask the planning agent) and DSP-40 (Agent proposal in draft): the draft board on the
// left (design class ag-board), the ask panel on the right. Without a run under review it offers to start one.
import { useRouter } from 'next/navigation';
import Btn from './Btn';
import AskAgent from './AskAgent';
import { Lane, useBoardCards } from './board';
import { PlanSide } from './chrome';
import { Ic } from './icons';
import { useAgentRun, usePlanScope, useStartAgentRun } from './plan-data';
import { Empty, ErrorBanner, Skeleton } from './states';
import { DEPOT_NAME, fmtNum, fmtRunDate } from '@/lib/format';
import { useAgentRunId } from '@/lib/workday';

export default function AgentBoardScreen({ name, mode }: { name: string; mode: 'ask' | 'proposal' }) {
  const router = useRouter();
  const scope = usePlanScope();
  const [runId, setRunId] = useAgentRunId();
  const run = useAgentRun(runId);
  const start = useStartAgentRun(r => setRunId(r.id));
  const detail = run.data?.detail ?? null;
  const board = useBoardCards({ draft: detail, tripsFilter: scope.tripsFilter, ordersFilter: scope.ordersFilter, active: scope.active });
  const deferrals = detail?.deferrals ?? [];
  const version = detail?.plan?.version ?? detail?.version;
  const depot = run.data?.depot ?? scope.depot ?? scope.active[0];
  const waiting = run.data?.status === 'NEEDS_APPROVAL';

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name={name}>
      <div className="d-app">
        <PlanSide active="N2" />
        <div className="d-main" style={{ gap: '16px' }}>
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Draft by planning agent "}<span className="m-sep" />{version ? ` v${version} ` : ' '}<span className="m-sep" />
                <span className={`m-tag ${waiting ? 'm-tag--warn' : 'm-tag--ok'}`}><span className="dot" />{run.data ? (waiting ? 'waiting for your approval' : run.data.status.toLowerCase().replace('_', ' ')) : 'no draft'}</span>
              </div>
              <div className="d-h1">Plan for {scope.runDate ? fmtRunDate(scope.runDate) : '…'}</div>
            </div>
            <span className="d-btn ag-btn-on"><Ic n="sparkle-plus" />{"Ask the agent"}</span>
            <Btn className={`d-btn${waiting ? '' : ' d-btn--disabled'}`} disabled={!waiting} onClick={() => router.push('/plan/dsp-12-approve-and-go-live')}><Ic n="lock" />{"Approve & go live"}</Btn>
            <Btn className="d-btn d-btn--primary" onClick={() => router.push('/plan/dsp-03-deferral-decision')}><Ic n="history" />Review deferrals{deferrals.length ? ` (${deferrals.length})` : ''}</Btn>
          </div>
          <ErrorBanner error={run.error ?? start.error} onRetry={run.refresh} />
          {!runId && (
            <Empty title="No draft to ask about" text="Start the planning agent for this run date first." icon="sparkle-plus">
              <Btn className="d-btn d-btn--primary" testId="start-agent" busy={start.pending} disabled={!depot || !scope.runDate}
                onClick={() => void start.run({ depot: depot!, runDate: scope.runDate! })}>
                <Ic n="sparkle-plus" />Draft {DEPOT_NAME[depot ?? ''] ?? depot} with the agent
              </Btn>
            </Empty>
          )}
          {runId && (
            <div className="ag-split">
              <div className="ag-board">
                <div className="x-lanehead"><span style={{ width: '128px' }}>{"Vehicle · min"}</span><span style={{ flex: '1' }}>{"Trip 1"}</span><span style={{ flex: '1' }}>{"Trip 2 · max 2 trips a day"}</span></div>
                {board.loading && <Skeleton rows={3} />}
                {board.lanes.slice(0, 5).map(([id, cs]) => <Lane key={id} vehicleId={id} cards={cs} v={board.vehicles.get(id)} />)}
                {deferrals.length > 0 && (
                  <div className="ag-defrow">
                    <div className="ag-deflabel"><b>{"Deferrals"}</b><span>suggested · {fmtNum(deferrals.reduce((s, d) => s + d.m3, 0), 1)} m³</span></div>
                    {deferrals.slice(0, 3).map(d => (
                      <div key={d.orderId} className="ag-def ag-ref">
                        <div className="ag-def__main">
                          <span className="ag-def__t">{d.orderId}<span className="id" style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-2)' }}>{d.outletId}</span></span>
                          <span className="ag-def__m">{d.reason} · {fmtNum(d.m3, 1)} m³</span>
                        </div>
                        <div className="x-score"><b>{d.score}</b><span>{"score"}</span></div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="spacer" />
                <div className="x-boardfoot"><Ic n="chevron-down" className="ic ic--sm" /><span>{board.lanes.length} vehicles in the draft</span></div>
              </div>
              {run.data ? (
                <AskAgent run={run.data} mode={mode} subtitle={`Draft v${version ?? ''} · ${DEPOT_NAME[run.data.depot] ?? run.data.depot} · ${scope.runDate ? fmtRunDate(scope.runDate) : ''}`} />
              ) : (
                <div className="ag-panel"><Skeleton rows={3} /></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
