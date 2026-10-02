'use client';
// DSP-03 Deferral decision, live. Markup and classes from the generated design (frontend/screens/dsp-03-deferral-decision.tsx).
// Data: Deferrals SUGGESTED for the run date (with their Order and Outlet), decided one by one or together with
// Deferrals('…')/Lodestar.Confirm {notes, rescheduledDate} and Lodestar.Dismiss. When a planning-agent draft is
// under review, its ranked candidates are shown too (they are recorded when the draft is approved on DSP-12).
import { useMemo, useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { useAgentRun, usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { addDays, BRAND_LETTER, DEPOT_NAME, dayFilter, fmtDay, fmtNum, fmtRunDate, fmtTime } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Deferral, Outlet } from '@/lib/odata/types';
import { depotFilter, useAgentRunId } from '@/lib/workday';

const REASONS: Record<string, string> = {
  CAP_REEFER: 'Reefer capacity', CAP_TIME: 'Time window', ACCESS: 'Access', WINDOW: 'Delivery window', FUEL: 'Fuel quota', VEH_DOWN: 'Vehicle down',
};
const code = (r: string) => r.replace('_', '-');
/** "Wed" for a run date. */
const weekday = (day: string) => fmtRunDate(day).split(' ')[0];

interface Row extends Deferral { outlet?: Outlet }

export default function LiveDsp03DeferralDecision() {
  const nav = useScreenNav();
  const { runDate, active } = usePlanScope();
  const [runId] = useAgentRunId();
  const run = useAgentRun(runId);
  const draftCandidates = run.data?.status === 'NEEDS_APPROVAL' ? run.data.detail?.deferrals ?? [] : [];

  const filter = runDate ? [ "status eq 'SUGGESTED'", dayFilter('order/runDate', runDate), depotFilter('order/outlet/depot', active)].filter(Boolean).join(' and ') : null;
  const list = useQuery<Row[]>(filter ? `deferrals:${filter}` : null, async c => {
    const rows = await c.all<Deferral>('Deferrals', { filter: filter!, expand: 'order', orderby: 'score' });
    const ids = [...new Set(rows.map(r => r.order?.outletId).filter(Boolean))] as string[];
    const outlets = ids.length ? await c.all<Outlet>('Outlets', { filter: `id in (${ids.map(i => `'${i}'`).join(',')})` }) : [];
    const byId = new Map(outlets.map(o => [o.id, o]));
    return rows.map(r => ({ ...r, outlet: byId.get(r.order?.outletId ?? '') }));
  }, { refreshOn: ['notification'] });

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const [selId, setSelId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const sel = rows.find(r => r.id === selId) ?? rows[0];
  const isChecked = (id: string) => checked[id] ?? true;
  const chosen = rows.filter(r => isChecked(r.id));
  const nextDay = runDate ? addDays(runDate, 1) : '';

  const confirm = useAction<Row[], number>(async (c, items) => {
    for (const r of items) {
      await c.action('Deferrals', r.id, 'Confirm', { notes: notes[r.id] ?? r.notes ?? undefined, rescheduledDate: dates[r.id] || nextDay || undefined });
    }
    return items.length;
  }, { onSuccess: () => { void list.refresh(); nav.go('L4'); } });
  const dismiss = useAction<string, unknown>((c, id) => c.action('Deferrals', id, 'Dismiss'), { onSuccess: () => void list.refresh() });

  const m3 = chosen.reduce((s, r) => s + (r.order?.m3 ?? 0), 0);
  const depotName = active.map(d => DEPOT_NAME[d] ?? d).join(' + ');

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-03 Deferral decision">
      <div className="d-app">
        <PlanSide active="N3" />
        <div className="d-main" style={{ gap: '16px' }}>
          <div className="d-head" style={{ alignItems: 'center' }}>
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Plan board "}<Ic n="chevron-right" className="ic ic--sm" />
                {runDate ? ` ${fmtRunDate(runDate)} ` : ' '}<span className="m-sep" />{` ${depotName}`}
              </div>
              <div className="d-h1" style={{ fontSize: '28px' }}>
                {rows.length ? `Defer ${rows.length} order${rows.length === 1 ? '' : 's'} to ${nextDay ? fmtRunDate(nextDay).split(' ')[0] : 'the next run'}` : 'No deferrals to decide'}
              </div>
              <div className="d-sub">{"Ranked lowest score first: safest to defer. Approve or dismiss each, with a note to the store."}</div>
            </div>
            <div className="x-limit">
              <div className="between">
                <span className="x-sect" style={{ color: 'var(--text-2)' }}>{"Selected to defer"}</span>
                <span className="fw8" style={{ fontSize: '14px' }}>{fmtNum(m3, 1)} m³</span>
              </div>
              <div className="x-limit__bar">
                <div style={{ flex: String(Math.max(rows.length - chosen.length, 0) || 0.001), background: 'var(--chilled-fg)' }} />
                <div style={{ flex: String(chosen.length || 0.001), background: 'var(--st-exception-fg)' }} />
              </div>
              <div className="x-limit__cap">
                <span><b className="t-2">{chosen.length}</b> of <b className="t-2">{rows.length}</b> selected</span>
              </div>
            </div>
          </div>
          <ErrorBanner error={list.error ?? confirm.error ?? dismiss.error} onRetry={list.error ? list.refresh : undefined} />
          <div className="d-split" style={{ gap: '18px' }}>
            <div className="x-col" style={{ width: '392px', flexShrink: '0', gap: '12px' }}>
              <div className="x-sect">{"Ranking "}<span className="m-sep" /><span style={{ fontWeight: '600' }}>{"lowest score is safest to defer"}</span></div>
              {!list.data && !list.error && <Skeleton rows={3} />}
              {list.data && rows.length === 0 && draftCandidates.length === 0 && (
                <Empty title="Nothing to decide" text="There are no suggested deferrals for this run date." />
              )}
              {rows.map(r => {
                const o = r.order;
                const prot = Boolean(o?.deferredYesterday);
                return (
                  <div
                    key={r.id}
                    className={`x-cand lv-click${sel?.id === r.id ? ' is-sel' : ''}${prot ? ' x-cand--prot' : ''}`}
                    data-deferral={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); setSelId(r.id); }}
                    onKeyDown={e => { if (e.key === 'Enter') setSelId(r.id); }}
                  >
                    <div className="x-cand__top">
                      <span
                        className="x-chk"
                        role="checkbox"
                        aria-checked={isChecked(r.id)}
                        tabIndex={0}
                        style={isChecked(r.id) ? undefined : { background: 'transparent', color: 'transparent' }}
                        onClick={e => { e.stopPropagation(); setChecked(c => ({ ...c, [r.id]: !isChecked(r.id) })); }}
                        onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); setChecked(c => ({ ...c, [r.id]: !isChecked(r.id) })); } }}
                      >
                        <Ic n="check" />
                      </span>
                      <span className={`bb bb--${(o?.brand ?? 'FRESH').toLowerCase()} x-bb`}>{BRAND_LETTER[o?.brand ?? 'FRESH']}</span>
                      <div className="x-cand__name"><b>{r.outlet?.name ?? o?.outletId}</b><span><span className="id">{o?.outletId}</span> · <span className="id">{r.orderId}</span></span></div>
                      {prot && <span className="m-pill m-pill--warn"><Ic n="shield-check" />{"Protected"}</span>}
                      <div className="x-score"><b>{r.score}</b><span>{"score"}</span></div>
                    </div>
                    <div className="x-meta">
                      {o?.tempClass === 'CHILLED'
                        ? <span className="m-tag m-tag--cold"><Ic n="snow-heavy" />Chilled {fmtNum(o?.m3, 1)} m³</span>
                        : <span className="m-tag"><span className="dot" />Ambient {fmtNum(o?.m3, 1)} m³</span>}
                      {prot && <><span className="m-sep" />{"deferred yesterday"}</>}
                      <span className="m-sep" />
                      {`days since ${o?.daysSince ?? 0}`}
                    </div>
                    <div className="x-sbar"><div style={{ width: `${Math.min(100, r.score)}%`, background: r.score >= 91 ? 'var(--st-exception-fg)' : 'var(--star-500)' }} /></div>
                    <div className="hstack" style={{ gap: '8px' }}>
                      <span className="m-pill m-pill--warn"><span className="dot" />Suggested: defer to {nextDay ? weekday(nextDay) : 'the next run'}</span>
                      <span className="x-code">{code(r.reason)}</span>
                    </div>
                  </div>
                );
              })}
              {draftCandidates.length > 0 && (
                <>
                  <div className="x-sect">{"Agent draft candidates "}<span className="m-sep" /><span style={{ fontWeight: '600' }}>recorded when you approve the draft</span></div>
                  {draftCandidates.map(d => (
                    <div key={d.orderId} className="x-cand">
                      <div className="x-cand__top">
                        <span className="x-chk"><Ic n="sparkle-plus" /></span>
                        <div className="x-cand__name"><b>{d.outletId}</b><span><span className="id">{d.orderId}</span> · rank {d.rank}</span></div>
                        <div className="x-score"><b>{d.score}</b><span>{"score"}</span></div>
                      </div>
                      <div className="x-meta"><span className="m-tag m-tag--cold"><Ic n="snow-heavy" />{fmtNum(d.m3, 1)} m³</span><span className="x-code">{code(d.reason)}</span></div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="d-card" style={{ flex: '1' }}>
              {!sel ? (
                <Empty title="Pick a deferral" text="Select an order on the left to see its thread and decide." icon="list" />
              ) : (
                <>
                  <div className="d-card__head" style={{ minHeight: '74px', gap: '12px' }}>
                    <span className={`bb bb--${(sel.order?.brand ?? 'FRESH').toLowerCase()} bb--lg`}>{BRAND_LETTER[sel.order?.brand ?? 'FRESH']}</span>
                    <div className="vstack" style={{ gap: '2px', minWidth: '0' }}>
                      <span className="d-card__title" style={{ fontSize: '18px' }}>{sel.outlet?.name ?? sel.order?.outletId}</span>
                      <span className="x-meta t-3">
                        <span className="id">{sel.order?.outletId}</span>{" · "}<span className="id">{sel.orderId}</span>
                        {` · ${sel.outlet?.district ?? ''} · ${sel.outlet ? `${sel.outlet.windowOpen}–${sel.outlet.windowClose}` : ''} · ${sel.order?.units ?? 0} units · ${fmtNum(sel.order?.kg)} kg · ${fmtNum(sel.order?.m3, 1)} m³`}
                      </span>
                    </div>
                    <span className="spacer" />
                    <span className="m-pill m-pill--warn"><span className="dot" />{"Suggested"}</span>
                  </div>
                  <div className="d-card__body" style={{ gap: '20px' }}>
                    <div className="hstack" style={{ gap: '18px' }}>
                      <span className="x-sect" style={{ width: '96px', flexShrink: '0' }}>{"Order thread"}</span>
                      <div className="thread">
                        <div className="thread__step is-done"><div className="thread__node"><Ic n="check" /></div><div className="thread__label">{"Received"}</div><div className="thread__time">{fmtDay(sel.order?.orderedAt)}</div></div>
                        <div className="thread__bar is-done" />
                        <div className="thread__step is-done"><div className="thread__node"><Ic n="check" /></div><div className="thread__label">{"Suggested"}</div><div className="thread__time">{fmtTime(sel.createdAt)}</div></div>
                        <div className="thread__bar is-warn" />
                        <div className="thread__step is-warn"><div className="thread__node"><Ic n="exclaim" /></div><div className="thread__label">{"Deferred"}</div><div className="thread__time">{"now"}</div></div>
                        <div className="thread__bar" />
                        <div className="thread__step "><div className="thread__node" /><div className="thread__label">{weekday(dates[sel.id] || nextDay)} run</div><div className="thread__time">{fmtRunDate(dates[sel.id] || nextDay).split(' ').slice(1).join(' ')}</div></div>
                        <div className="thread__bar" />
                        <div className="thread__step "><div className="thread__node" /><div className="thread__label">{"Delivered"}</div><div className="thread__time">{"·"}</div></div>
                      </div>
                    </div>
                    <div className="hstack" style={{ gap: '16px', alignItems: 'stretch' }}>
                      <div className="vstack" style={{ gap: '10px', width: '292px', flexShrink: '0' }}>
                        <span className="x-flabel">{"Reason code"}</span>
                        <div className="x-select">
                          <span className="x-code x-code--dark">{code(sel.reason)}</span>
                          <span className="fw7">{REASONS[sel.reason] ?? sel.reason}</span>
                        </div>
                        <span className="x-flabel" style={{ marginTop: '4px' }}>{"Deliver on"}</span>
                        <div className="x-select">
                          <input className="lv-input" type="date" aria-label="Rescheduled date" value={dates[sel.id] || nextDay} min={nextDay} onChange={e => setDates(d => ({ ...d, [sel.id]: e.target.value }))} />
                        </div>
                        <span className="x-flabel" style={{ marginTop: '4px' }}>{"Note to store "}<span className="t-3" style={{ fontWeight: '500' }}>{"(edit freely)"}</span></span>
                        <div className="x-textarea">
                          <textarea className="lv-input" aria-label="Note to store" value={notes[sel.id] ?? sel.notes ?? ''} onChange={e => setNotes(n => ({ ...n, [sel.id]: e.target.value }))} />
                        </div>
                      </div>
                      <div className="x-conseq">
                        <div className="x-conseq__h" data-lk="L158"><Ic n="info" className="ic ic--sm" />{"What happens if you approve"}</div>
                        <div className="x-conseq__r"><Ic n="calendar" className="ic ic--sm" /><span>Served <b>{fmtRunDate(dates[sel.id] || nextDay)}</b>. {fmtNum(sel.order?.m3, 1)} m³ is reserved on that run.</span></div>
                        <div className="x-conseq__r"><Ic n="message" className="ic ic--sm" /><span>Store manager told <b>when the plan goes live</b>, with the reason and new date.</span></div>
                        <div className="x-conseq__r"><Ic n="shield-check" className="ic ic--sm" /><span>On {weekday(dates[sel.id] || nextDay)}, {sel.order?.outletId} becomes <b>protected</b> (deferred yesterday).</span></div>
                      </div>
                    </div>
                    <div className="hstack" style={{ gap: '10px' }}>
                      <Btn className="d-btn" busy={dismiss.pending} testId="dismiss" onClick={() => void dismiss.run(sel.id)}><Ic n="x" />{"Dismiss, keep on the plan"}</Btn>
                      <Btn className="d-btn d-btn--primary" busy={confirm.pending} testId="confirm-one" onClick={() => void confirm.run([sel])}><Ic n="check" />{"Approve this deferral"}</Btn>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="x-foot">
            <Ic n="lock" className="ic ic--sm" />
            <span>Logged as <b>suggestion + your decision</b>. Stores told when the plan goes live.</span>
            <span className="spacer" />
            <span className="m-tag m-tag--ok"><Ic n="check" />{chosen.length} of {rows.length} have reason codes</span>
            <span className="d-btn" data-lk="N2">{"Back to plan"}</span>
            <Btn className="d-btn d-btn--primary" testId="confirm-all" busy={confirm.pending} disabled={!chosen.length} onClick={() => void confirm.run(chosen)}>
              <Ic n="check" />Approve {chosen.length} deferral{chosen.length === 1 ? '' : 's'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
