'use client';
// DSP-16 Models and fallbacks, live. Markup and classes from the generated design (frontend/screens/dsp-16-models-and-fallbacks.tsx).
// Data: the planning agent's model and fallback (AgentRuns/Lodestar.AgentConfig, from the agent's GET /config:
// AGENT_MODEL mock | azure-openai, whether it is configured, the deployment, max redrafts), the calendar's last
// day (the forecast horizon), and the reference rows each estimator reads (ServiceAllowances, DistrictTravel road
// classes, monsoon days). The three estimators run in the planning service (EtaService, CapacityService): the
// cards say what each is computed from. The validation targets keep the design's "target / illustrative until
// Datathon" tag: Lodestar has no scored model metrics. Not drawn: "Change log" (no model registry).
import { PlanSide } from '@/components/live/chrome';
import { Ic, type IconName } from '@/components/live/icons';
import { useAgentConfig } from '@/components/live/settings-data';
import { ErrorBanner } from '@/components/live/states';
import { addDays, fmtNum, fmtRunDate, isoDay, LATE_RISK_PCT } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import { colomboDay } from '@/lib/workday';
import type { ReactNode } from 'react';

/** ISO week number of a YYYY-MM-DD day. */
function isoWeek(day: string): number {
  const d = new Date(`${day}T00:00:00Z`);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 4 - (d.getUTCDay() || 7)));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
}

interface Basis {
  allowances: Array<{ brand: string; dockType: string; minutes: number }>;
  roads: Record<string, number>;
  districts: number;
  monsoonDays: number;
  calendarDays: number;
  lastDay: string | null;
}

function Card({ icon, lead, title, sub, live, children, fallback }: { icon: IconName; lead?: string; title: string; sub: ReactNode; live: boolean | null; children: ReactNode; fallback: ReactNode }) {
  return (
    <div className="dx-card" style={{ width: 'calc(50% - 9px)' }}>
      <div className="dx-card__head" style={{ minHeight: '62px' }}>
        <span className={`dx-lead ${lead ?? ''}`}><Ic n={icon} /></span>
        <div className="vstack" style={{ gap: '0' }}>
          <span className="dx-card__title">{title}</span>
          <span className="dx-t13">{sub}</span>
        </div>
        <span className="spacer" />
        {live === null ? <span className="m-pill"><span className="dot" />{"Checking"}</span>
          : live ? <span className="m-pill m-pill--ok"><span className="dot" />{"Live"}</span>
          : <span className="m-pill m-pill--bad"><span className="dot" />{"Fallback"}</span>}
      </div>
      <div className="dx-card__body" style={{ gap: '0' }}>
        {children}
        <div className="dx-inset" style={{ marginTop: '10px', gap: '4px', padding: '12px 14px' }}>
          <span className="dx-sech"><Ic n="refresh" className="ic ic--sm" />{"If it can't run"}</span>
          <span className="dx-t14">{fallback}</span>
        </div>
      </div>
    </div>
  );
}

const Illustrative = () => <span className="m-tag m-tag--warn" style={{ marginLeft: '6px' }}>{"target / illustrative until Datathon"}</span>;

export default function LiveDsp16ModelsAndFallbacks() {
  const config = useAgentConfig();
  const today = colomboDay();
  const basis = useQuery<Basis>('dsp16-basis', async c => {
    const [allowances, districts, last, monsoon, days] = await Promise.all([
      c.all<{ brand: string; dockType: string; minutes: number }>('ServiceAllowances', { orderby: 'brand,dockType' }),
      c.all<{ district: string; roadClass: string }>('DistrictTravel', { select: 'district,roadClass' }),
      c.list<{ date: string }>('Calendar', { orderby: 'date desc', top: 1, select: 'date' }),
      c.list('Calendar', { filter: 'monsoon gt 0', top: 0, count: true }),
      c.list('Calendar', { top: 0, count: true }),
    ]);
    const roads: Record<string, number> = {};
    districts.forEach(d => { roads[d.roadClass] = (roads[d.roadClass] ?? 0) + 1; });
    return { allowances, roads, districts: districts.length, monsoonDays: monsoon.count ?? 0, calendarDays: days.count ?? 0, lastDay: last.value[0] ? isoDay(last.value[0].date) : null };
  });
  const b = basis.data;
  const c = config.data;
  const fresh = (dock: string) => b?.allowances.find(a => a.brand === 'FRESH' && a.dockType === dock)?.minutes;
  const horizonPassed = b?.lastDay ? b.lastDay < today : false;
  const horizonNear = b?.lastDay ? b.lastDay < addDays(today, 70) : false;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-16 Models and fallbacks · desktop">
      <div className="d-app">
        <PlanSide active="N8" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Intelligence "}<span className="m-sep" />{" Datathon models "}<span className="m-sep" />{" advisory, you decide"}</div>
              <div className="dx-h1xl">{"3 models + planning agent, each with a fallback"}</div>
            </div>
          </div>
          <ErrorBanner error={config.error ?? basis.error} onRetry={() => { void config.refresh(); void basis.refresh(); }} />
          {b?.lastDay && (
            <div className={`dx-banner ${horizonNear ? 'dx-banner--warn' : ''}`} data-lk="L167" data-testid="horizon">
              <Ic n="calendar" />
              <div style={{ flex: '1', minWidth: '0' }}>
                <b>{`Forecast horizon ${horizonPassed ? 'ended' : 'ends'} ${fmtRunDate(b.lastDay)} ${b.lastDay.slice(0, 4)} (W${isoWeek(b.lastDay)}).`}</b>
                <span>{` Calendar data stops there. Past W${isoWeek(b.lastDay)} the capacity outlook has no operating days to plan from, until the calendar is extended.`}</span>
              </div>
              <span className="d-btn">{"Add calendar rows"}</span>
            </div>
          )}
          <div className="hstack" style={{ gap: '18px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <Card icon="clock" title="Service-time model" sub={b ? `${b.allowances.length} allowances · per brand and dock` : '…'} live={b ? b.allowances.length > 0 : null}
              fallback={<>{"Uses "}<b>{"service_allowance.csv"}</b>{`: Fresh rear dock ${fresh('REAR_DOCK') ?? '—'}, street ${fresh('STREET') ?? '—'}, mall bay ${fresh('MALL_BAY') ?? '—'} min.`}</>}>
              <div className="dx-kv"><span>{"Powers"}</span><b style={{ whiteSpace: 'normal', fontWeight: '600' }}>{"Stop minutes on the plan board, store ETA windows"}</b></div>
              <div className="dx-kv"><span>{"Computed from"}</span><b style={{ fontWeight: '600' }}><b>{b ? fmtNum(b.allowances.length) : '…'}</b>{" brand × dock allowances, the stop's predicted minutes"}</b></div>
              <div className="dx-kv"><span>{"Validation"}</span><b style={{ fontWeight: '600' }}>{"MAE ≤ 4 min a stop "}<Illustrative /></b></div>
            </Card>
            <Card icon="alert" lead="dx-lead--warn" title="Lateness model" sub={b ? `${b.districts} districts · ${Object.keys(b.roads).length} road classes` : '…'} live={b ? b.districts > 0 : null}
              fallback={<><b>{"Plan-only ETA"}</b>{", no risk %, labelled \"risk unavailable\"."}</>}>
              <div className="dx-kv"><span>{"Powers"}</span><b style={{ whiteSpace: 'normal', fontWeight: '600' }}>{`ETA and late risk on live board, alerts at ${LATE_RISK_PCT}%+`}</b></div>
              <div className="dx-kv"><span>{"Computed from"}</span><b style={{ fontWeight: '600', whiteSpace: 'normal', textAlign: 'right' }}>
                {b ? <>{Object.entries(b.roads).map(([k, n]) => `${n} ${k}`).join(', ')}{" districts · "}<b>{fmtNum(b.monsoonDays)}</b>{" monsoon days"}</> : '…'}
              </b></div>
              <div className="dx-kv"><span>{"Validation"}</span><b style={{ fontWeight: '600' }}>{"AUC ≥ 0.80 "}<Illustrative /></b></div>
            </Card>
            <Card icon="chart" lead="dx-lead--cold" title="Demand forecast" sub={b?.lastDay ? `horizon to ${fmtRunDate(b.lastDay)}` : '…'} live={b ? !horizonPassed && b.calendarDays > 0 : null}
              fallback={<>{"Same weeks last year × festival_ramp, marked "}<b>{"fallback"}</b>{"."}</>}>
              <div className="dx-kv"><span>{"Powers"}</span><b style={{ whiteSpace: 'normal', fontWeight: '600' }}>{"Capacity outlook, 10 ISO weeks, peak warnings"}</b></div>
              <div className="dx-kv"><span>{"Computed from"}</span><b style={{ fontWeight: '600' }}><b>{b ? fmtNum(b.calendarDays) : '…'}</b>{" calendar days · festival_ramp, payday, order history"}</b></div>
              <div className="dx-kv"><span>{"Validation"}</span><b style={{ fontWeight: '600' }}>{"WAPE ≤ 12% a week "}<Illustrative /></b></div>
            </Card>
            <Card icon="sparkle-plus" lead="dx-lead--star" title="Planning agent" live={c ? c.model.configured : config.error ? false : null}
              sub={c ? `${c.model.label}${c.model.deployment ? ` · ${c.model.deployment}` : ''} · drafts, you approve` : '…'}
              fallback={<>{"The "}<b>{"manual plan board"}</b>{` with the same rule checks, from the last approved plan.${c && !c.model.configured && c.model.missing.length ? ` Not configured: ${c.model.missing.join(', ')}.` : ''}`}</>}>
              <div className="dx-kv"><span>{"Can do"}</span><b style={{ whiteSpace: 'normal', fontWeight: '600', textAlign: 'right' }}>{`Read ${c ? c.reads.join(', ').toLowerCase() : 'orders and fleet'}, draft plans and re-plans, rank deferrals, explain each step`}</b></div>
              <div className="dx-kv"><span style={{ whiteSpace: 'nowrap' }}>{"Needs your approval"}</span><b style={{ whiteSpace: 'normal', fontWeight: '600', textAlign: 'right' }}>{`Publish, message stores, override protected outlets${c ? ` · up to ${c.maxRedrafts} redrafts` : ''}`}</b></div>
              <div className="dx-kv"><span>{"Validation"}</span><b style={{ fontWeight: '600' }}>{`${c ? `${c.rules.length} hard rules checked, ` : ''}100% must pass `}<Illustrative /></b></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
