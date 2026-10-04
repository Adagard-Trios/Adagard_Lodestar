'use client';
// DSP-03 Deferral decision, live. Markup and classes from the generated design (frontend/screens/dsp-03-deferral-decision.tsx).
// Data: Deferrals SUGGESTED for the run date (with their Order and Outlet), decided one by one or together with
// Deferrals('…')/Lodestar.Confirm {notes, rescheduledDate} and Lodestar.Dismiss. When a planning-agent draft is
// under review, its ranked candidates are shown too (they are recorded when the draft is approved on DSP-12).
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { PLAN_EVENTS, useNextOperatingDay, useReviewRun, usePlanScope } from '@/components/live/plan-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { BRAND_LETTER, dayFilter, fmtDay, fmtNum, fmtRunDate, fmtTime } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { Deferral, Outlet } from '@/lib/odata/types';
import { depotFilter, useFocusId } from '@/lib/workday';
import { openOverlay } from '@/lib/overlay';
import { useDepots } from '@/components/live/depots';

const REASONS: Record<string, string> = {
  CAP_REEFER: 'Reefer capacity', CAP_TIME: 'Time window', ACCESS: 'Access', WINDOW: 'Delivery window', FUEL: 'Fuel quota', VEH_DOWN: 'Vehicle down',
};
const code = (r: string) => r.replace('_', '-');
/** "Wed" for a run date. */
const weekday = (day: string) => fmtRunDate(day).split(' ')[0];

interface Row extends Deferral { outlet?: Outlet }

export default function LiveDsp03DeferralDecision() {
  const { name: depotName } = useDepots();
  const nav = useScreenNav();
  const { runDate, active } = usePlanScope();
  const { run } = useReviewRun();
  const draftCandidates = run.data?.status === 'NEEDS_APPROVAL' ? run.data.detail?.deferrals ?? [] : [];
  // protected outlets (deferred yesterday, or score at the protected line) the draft keeps on the plan: never deferred
  const draftProtected = run.data?.status === 'NEEDS_APPROVAL'
    ? (run.data.detail?.plan?.trips ?? []).flatMap(t => (t.stops ?? []).filter(s => s.protected).map(s => ({ ...s, vehicleId: t.vehicleId, tripNo: t.tripNo })))
    : [];

  const filter = runDate ? [ "status eq 'SUGGESTED'", dayFilter('order/runDate', runDate), depotFilter('order/outlet/depot', active)].filter(Boolean).join(' and ') : null;
  const list = useQuery<Row[]>(filter ? `deferrals:${filter}` : null, async c => {
    const rows = await c.all<Deferral>('Deferrals', { filter: filter!, expand: 'order', orderby: 'score' });
    const ids = [...new Set(rows.map(r => r.order?.outletId).filter(Boolean))] as string[];
    const outlets = ids.length ? await c.all<Outlet>('Outlets', { filter: `id in (${ids.map(i => `'${i}'`).join(',')})` }) : [];
    const byId = new Map(outlets.map(o => [o.id, o]));
    return rows.map(r => ({ ...r, outlet: byId.get(r.order?.outletId ?? '') }));
  }, { refreshOn: PLAN_EVENTS });

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const toDecide = rows.length || draftCandidates.length;
  const [selId, setSelId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  // a draft candidate or protected outlet picked on the left (not recorded yet: shown read-only)
  const [pick, setPick] = useState<{ kind: 'cand' | 'prot'; orderId: string } | null>(null);
  const [, setOrderFocus] = useFocusId('order');
  const router = useRouter();
  const sel = pick ? undefined : rows.find(r => r.id === selId) ?? rows[0];
  const pickCand = pick?.kind === 'cand' ? draftCandidates.find(d => d.orderId === pick.orderId) : undefined;
  const pickProt = pick?.kind === 'prot' ? draftProtected.find(p => p.orderId === pick.orderId) : undefined;
  const openOrder = (orderId: string) => { setOrderFocus(orderId); openOverlay('/plan/dsp-09-order-detail-drawer'); };
  const isChecked = (id: string) => checked[id] ?? true;
  const chosen = rows.filter(r => isChecked(r.id));
  // approval rolls a deferred order to the next operating day (Calendar): a confirmed deferral defaults to the same
  const next = useNextOperatingDay(runDate);
  const nextDay = next.day;

  const confirm = useAction<Row[], number>(async (c, items) => {
    for (const r of items) {
      await c.action('Deferrals', r.id, 'Confirm', { notes: notes[r.id] ?? r.notes ?? undefined, rescheduledDate: dates[r.id] || (next.fromCalendar ? nextDay : undefined) });
    }
    return items.length;
  }, { onSuccess: () => { void list.refresh(); nav.go('L4'); } });
  const dismiss = useAction<string, unknown>((c, id) => c.action('Deferrals', id, 'Dismiss'), { onSuccess: () => void list.refresh() });

  // before the draft is approved nothing is recorded yet: the agent's candidates are what the dispatcher decides on
  const draftMode = rows.length === 0 && draftCandidates.length > 0;
  const [draftChecked, setDraftChecked] = useState<Record<string, boolean>>({});
  const isDraftChecked = (orderId: string) => draftChecked[orderId] ?? true;
  const draftChosen = draftCandidates.filter(d => isDraftChecked(d.orderId));
  const draftKept = draftCandidates.length - draftChosen.length;
  const toggleDraft = (orderId: string) => setDraftChecked(c => ({ ...c, [orderId]: !isDraftChecked(orderId) }));
  const nChosen = draftMode ? draftChosen.length : chosen.length;
  const nTotal = draftMode ? draftCandidates.length : rows.length;
  const nCoded = draftMode ? draftChosen.filter(d => d.reason).length : chosen.length;
  const m3 = draftMode ? draftChosen.reduce((s, d) => s + (d.m3 ?? 0), 0) : chosen.reduce((s, r) => s + (r.order?.m3 ?? 0), 0);
  const depotLine = active.map(d => depotName(d)).join(' + ');

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-03 Deferral decision">
      <div className="d-app">
        <PlanSide active="N3" />
        <div className="d-main" style={{ gap: '16px' }}>
          <div className="d-head" style={{ alignItems: 'center' }}>
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Plan board "}<Ic n="chevron-right" className="ic ic--sm" />
                {runDate ? ` ${fmtRunDate(runDate)} ` : ' '}<span className="m-sep" />{` ${depotLine}`}
              </div>
              <div className="d-h1" style={{ fontSize: '28px' }}>
                {toDecide ? `Defer ${toDecide} order${toDecide === 1 ? '' : 's'} to ${nextDay ? fmtRunDate(nextDay).split(' ')[0] : 'the next run'}` : 'No deferrals to decide'}
              </div>
              <div className="d-sub">{"Ranked lowest score first: safest to defer. Approve or dismiss each, with a note to the store."}</div>
            </div>
            <div className="x-limit">
              <div className="between">
                <span className="x-sect" style={{ color: 'var(--text-2)' }}>{"Selected to defer"}</span>
                <span className="fw8" style={{ fontSize: '14px' }}>{fmtNum(m3, 1)} m³</span>
              </div>
              <div className="x-limit__bar">
                <div style={{ flex: String(Math.max(nTotal - nChosen, 0) || 0.001), background: 'var(--chilled-fg)' }} />
                <div style={{ flex: String(nChosen || 0.001), background: 'var(--st-exception-fg)' }} />
              </div>
              <div className="x-limit__cap">
                <span><b className="t-2">{nChosen}</b> of <b className="t-2">{nTotal}</b> selected</span>
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
                    onClick={e => { e.stopPropagation(); setPick(null); setSelId(r.id); }}
                    onKeyDown={e => { if (e.key === 'Enter') { setPick(null); setSelId(r.id); } }}
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
                      {`days since ${o?.daysSince ?? '—'}`}
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
                    <div key={d.orderId} className={`x-cand lv-click${pick?.orderId === d.orderId ? ' is-on' : ''}`} role="button" tabIndex={0} data-testid="draft-candidate"
                      onClick={() => setPick({ kind: 'cand', orderId: d.orderId })} onKeyDown={e => { if (e.key === 'Enter') setPick({ kind: 'cand', orderId: d.orderId }); }}>
                      <div className="x-cand__top">
                        <span className="x-chk" role="checkbox" aria-checked={isDraftChecked(d.orderId)} aria-label={`Defer ${d.orderId}`} tabIndex={0} data-testid="draft-check"
                          style={isDraftChecked(d.orderId) ? undefined : { background: 'transparent', color: 'transparent' }}
                          onClick={e => { e.stopPropagation(); toggleDraft(d.orderId); }}
                          onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleDraft(d.orderId); } }}><Ic n="check" /></span>
                        <div className="x-cand__name"><b>{d.outletId}</b><span><span className="id">{d.orderId}</span> · rank {d.rank}</span></div>
                        <div className="x-score"><b>{d.score}</b><span>{"score"}</span></div>
                      </div>
                      <div className="x-meta"><span className="m-tag m-tag--cold"><Ic n="snow-heavy" />{fmtNum(d.m3, 1)} m³</span><span className="x-code">{code(d.reason)}</span><span className="t-3">{REASONS[d.reason] ?? d.reason}</span></div>
                    </div>
                  ))}
                </>
              )}
              {draftProtected.length > 0 && (
                <>
                  <div className="x-sect">{"Protected outlets "}<span className="m-sep" /><span style={{ fontWeight: '600' }}>kept on the plan, never deferred</span></div>
                  {draftProtected.map(p => (
                    <div key={p.orderId} className={`x-cand x-cand--prot lv-click${pick?.orderId === p.orderId ? ' is-on' : ''}`} data-testid="protected-outlet" role="button" tabIndex={0}
                      onClick={() => setPick({ kind: 'prot', orderId: p.orderId })} onKeyDown={e => { if (e.key === 'Enter') setPick({ kind: 'prot', orderId: p.orderId }); }}>
                      <div className="x-cand__top">
                        <span className="x-chk"><Ic n="shield-check" /></span>
                        <div className="x-cand__name"><b>{p.outletId}</b><span><span className="id">{p.orderId}</span> · {p.vehicleId} trip {p.tripNo}</span></div>
                        <span className="m-pill m-pill--warn"><Ic n="shield-check" />{"Protected"}</span>
                      </div>
                      <div className="x-meta">{"deferred yesterday: the agent can never defer it"}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="d-card" style={{ flex: '1' }}>
              {pickCand || pickProt ? (
                <div className="vstack" style={{ gap: '14px', padding: '22px 24px' }} data-testid="draft-pick">
                  <div className="d-h1" style={{ fontSize: '24px' }}>{(pickCand ?? pickProt)!.outletId}</div>
                  <span className="x-meta"><span className="id">{(pickCand ?? pickProt)!.orderId}</span><span className="m-sep" />{pickCand ? `rank ${pickCand.rank} · score ${pickCand.score}` : `${pickProt!.vehicleId} trip ${pickProt!.tripNo}`}</span>
                  {pickCand ? (
                    <>
                      <div className="x-meta"><span className="x-code">{code(pickCand.reason)}</span><span>{REASONS[pickCand.reason] ?? pickCand.reason}</span><span className="m-sep" /><span>{fmtNum(pickCand.m3, 1)} m³</span></div>
                      <p className="t-2" style={{ margin: 0 }}>{"The planning agent proposes deferring this order: it is the safest to move (lowest score). It is recorded as a suggestion when you approve the draft on Approve & go live, and the store is told then."}</p>
                    </>
                  ) : (
                    <p className="t-2" style={{ margin: 0 }}>{"This outlet was deferred yesterday, so the consecutive-skip guard keeps it on the plan: the agent can never defer it today."}</p>
                  )}
                  <div className="hstack" style={{ gap: '10px', flexWrap: 'wrap' }}>
                    <Btn className="d-btn" testId="open-order" onClick={() => openOrder((pickCand ?? pickProt)!.orderId)}><Ic n="list" />{"Open the order"}</Btn>
                    <Btn className="d-btn" testId="ask-agent" onClick={() => router.push('/plan/dsp-39-ask-the-planning-agent')}><Ic n="sparkle" />{"Ask the planning agent"}</Btn>
                  </div>
                </div>
              ) : !sel ? (
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
            <span className="m-tag m-tag--ok"><Ic n="check" />{nCoded} of {nChosen} have reason codes</span>
            <span className="d-btn" data-lk="N2">{"Back to plan"}</span>
            {draftMode && draftKept > 0 && (
              <Btn className="d-btn" testId="keep-ask" onClick={() => router.push('/plan/dsp-39-ask-the-planning-agent')}><Ic n="sparkle" />Ask the agent to keep {draftKept}</Btn>
            )}
            {draftMode ? (
              // the deferrals are recorded with the plan: approving the draft (DSP-12) records exactly the agent's candidates
              <Btn className="d-btn d-btn--primary" testId="confirm-all" disabled={!nChosen || draftKept > 0} onClick={() => openOverlay('/plan/dsp-12-approve-and-go-live')}>
                <Ic n="check" />Approve {nChosen} deferral{nChosen === 1 ? '' : 's'}
              </Btn>
            ) : (
              <Btn className="d-btn d-btn--primary" testId="confirm-all" busy={confirm.pending} disabled={!chosen.length} onClick={() => void confirm.run(chosen)}>
                <Ic n="check" />Approve {chosen.length} deferral{chosen.length === 1 ? '' : 's'}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
