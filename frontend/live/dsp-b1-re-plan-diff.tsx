'use client';
// DSP-B1 Re-plan diff, live. Markup and classes from the generated design (frontend/screens/dsp-b1-re-plan-diff.tsx).
// Reefer down: the dock reports a vehicle that can't depart (Trips('…')/Lodestar.ReportVehicleFault): fleet puts it
// in the WORKSHOP and the depot's dispatchers get a VEHICLE_FAULT notice (fault, reefer temperature, bay, note, the
// trip's orders and outlets; vehicle_fault arrives over the socket). The screen opens on the newest such notice
// whose vehicle is still in the workshop (or the vehicle in focus), else on any workshop vehicle that still has
// trips to run on the run date. The re-plan is a planning-agent draft for the depot and run date (AgentRuns;
// the agent only plans with AVAILABLE vehicles): "Draft the re-plan" puts the vehicle's LOADING trips back to
// PLANNED (Trips('…')/Lodestar.SetStatus, the goods go back to the cold room) and starts the draft. The diff shows
// where each of the vehicle's orders went in the draft (merged into another trip, a whole trip moved, or
// deferred), with the receiving trips' minutes, weight and chilled volume against their limits.
// "Approve & send" publishes the draft as on DSP-12 (AgentRuns('…')/Lodestar.Resume {decision: 'approve'}, with an
// override reason when the draft breaks a hard rule) and marks the fault notice handled: the dock, the drivers and
// the stores are told by planning. "Discard" rejects it; "Edit manually" opens the plan board.
// Not shown: the agent's alternative options for one order (A/B) and its rejected moves: a draft has neither.
import { useMemo, useState } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import Btn from '@/components/live/Btn';
import { budget } from '@/components/live/board';
import { PlanSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { useAgentRun, usePlanScope, useStartAgentRun } from '@/components/live/plan-data';
import { useAgentConfig } from '@/components/live/settings-data';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { DEPOT_NAME, fmtClock, fmtNum, title } from '@/lib/format';
import { useAction, useQuery } from '@/lib/odata/hooks';
import type { AgentRun, AgentTrip, Notification, Trip, TripStop, Vehicle } from '@/lib/odata/types';
import { depotFilter, useAgentRunId, useFocusId } from '@/lib/workday';

type DraftTrip = AgentTrip & { stops?: Array<{ orderId: string; arrive?: string | null; lateRiskPct?: number | null }> };
type Change =
  | { kind: 'merge' | 'move'; to: DraftTrip; from: Trip[]; moved: TripStop[]; before?: Trip }
  | { kind: 'defer'; stop: TripStop; reason?: string; score?: number };

const tripKey = (v: string, n: number) => `${v}#${n}`;
const FAULT: Record<string, string> = { NOT_COOLING: 'reefer not cooling', ENGINE: 'engine fault', DOOR_SEAL: 'door seal fault', OTHER: 'vehicle fault' };
interface FaultPayload { tripId?: string; vehicleId?: string; bay?: string | null; fault?: string; reeferTempC?: number | null; note?: string | null; orderIds?: string[]; outlets?: string[] }
const bar = (p: number) => (p > 100 ? 'linear-gradient(90deg,#F97066,#D92D20)' : p >= 90 ? 'linear-gradient(90deg,#FFD37A,#F5B83D)' : 'linear-gradient(90deg,#10B981,#047857)');

function Cap({ label, used, cap, unit, digits = 0 }: { label: string; used: number; cap: number | undefined; unit: string; digits?: number }) {
  const p = cap ? Math.round((used / cap) * 100) : 0;
  return (
    <div className="g-cap" style={{ flex: '1' }}>
      <div className="g-cap__h"><span>{label}</span><b>{fmtNum(used, digits)} / {fmtNum(cap, digits)}{unit}</b></div>
      <div className="g-bar"><div style={{ width: `${Math.min(100, p)}%`, background: bar(p) }} /></div>
    </div>
  );
}

export default function LiveDspB1RePlanDiff() {
  const nav = useScreenNav();
  const { runDate, active, tripsFilter } = usePlanScope();
  const [focus] = useFocusId('vehicle');
  const [runId, setRunId] = useAgentRunId();
  const run = useAgentRun(runId);
  const limits = useAgentConfig().data?.limits;

  const down = useQuery<Vehicle[]>(`b1-down:${active.join(',')}`, c =>
    c.all<Vehicle>('Vehicles', { filter: ["status eq 'WORKSHOP'", depotFilter('depot', active)].filter(Boolean).join(' and '), orderby: 'updatedAt desc' }),
  { refreshOn: ['notification', 'vehicle_fault'] });
  const faults = useQuery<Notification[]>('b1-faults', c =>
    c.list<Notification>('Notifications', { filter: "type eq 'VEHICLE_FAULT'", orderby: 'sentAt desc', top: 10 }).then(r => r.value),
  { refreshOn: ['notification', 'vehicle_fault'] });
  const trips = useQuery<Trip[]>(tripsFilter ? `b1-trips:${tripsFilter}` : null, c =>
    c.all<Trip>('Trips', { filter: tripsFilter, expand: 'stops($expand=outlet($select=id,name,windowClose),order($select=id,m3,kg,tempClass,deferredYesterday,deferralScore)),vehicle', orderby: 'vehicleId,tripNumber' }),
  { refreshOn: ['plan_published', 'notification'] });

  const all = useMemo(() => trips.data ?? [], [trips.data]);
  const open = (t: Trip) => t.status === 'PLANNED' || t.status === 'LOADING';
  const affected = (down.data ?? []).filter(v => all.some(t => t.vehicleId === v.id && open(t)));
  const faultOf = (id: string) => (faults.data ?? []).find(n => (n.payload as FaultPayload | null)?.vehicleId === id);
  const workshop = down.data ?? [];
  const newestFault = (faults.data ?? []).map(n => workshop.find(v => v.id === (n.payload as FaultPayload | null)?.vehicleId)).find(Boolean);
  const vehicle = [...affected, ...workshop.filter(v => faultOf(v.id))].find(v => v.id === focus) ?? newestFault ?? affected[0];
  const notice = vehicle ? faultOf(vehicle.id) : undefined;
  const fault = (notice?.payload ?? {}) as FaultPayload;
  const [reason, setReason] = useState('');
  const vTrips = all.filter(t => vehicle && t.vehicleId === vehicle.id && open(t));
  const moved = vTrips.flatMap(t => t.stops ?? []);
  const chilled = moved.filter(s => s.order?.tempClass === 'CHILLED').length;
  const movedM3 = moved.reduce((n, s) => n + (s.order?.m3 ?? 0), 0);

  // a draft counts as this re-plan when it is for the same depot and day, was asked for after the vehicle went down
  const r = run.data;
  const draft = r && vehicle && r.depot === vehicle.depot && runDate && r.runDate.slice(0, 10) === runDate.slice(0, 10)
    && (!vehicle.updatedAt || r.createdAt >= vehicle.updatedAt) ? r : null;
  const ready = draft?.status === 'NEEDS_APPROVAL' ? draft : null;
  const draftTrips = (ready?.detail?.plan?.trips ?? []) as DraftTrip[];

  const changes = ((): Change[] => {
    if (!ready || !vehicle) return [];
    const byOrder = new Map<string, DraftTrip>();
    draftTrips.forEach(t => t.orderIds.forEach(o => byOrder.set(o, t)));
    const current = new Map(all.filter(t => t.vehicleId !== vehicle.id).map(t => [tripKey(t.vehicleId, t.tripNumber), t]));
    const groups = new Map<string, Change & { kind: 'merge' | 'move' }>();
    const out: Change[] = [];
    for (const s of moved) {
      const to = byOrder.get(s.orderId);
      if (!to) {
        const d = ready.detail?.deferrals?.find(x => x.orderId === s.orderId);
        out.push({ kind: 'defer', stop: s, reason: d?.reason ?? ready.detail?.plan?.unassigned?.find(x => x.orderId === s.orderId)?.reason, score: d?.score });
        continue;
      }
      const k = tripKey(to.vehicleId, to.tripNo);
      const g = groups.get(k) ?? { kind: 'merge' as const, to, from: [], moved: [], before: current.get(k) };
      g.moved.push(s);
      const from = vTrips.find(t => t.id === s.tripId);
      if (from && !g.from.includes(from)) g.from.push(from);
      groups.set(k, g);
    }
    for (const g of groups.values()) {
      const whole = g.from.length === 1 && g.to.orderIds.length === g.moved.length && (g.from[0].stops ?? []).length === g.moved.length;
      out.unshift({ ...g, kind: whole ? 'move' : 'merge' });
    }
    return out;
  })();

  const served = changes.reduce((n, c) => n + (c.kind === 'defer' ? 0 : c.moved.length), 0);
  const deferred = changes.filter(c => c.kind === 'defer').length;
  const checks = ready?.detail?.ruleChecks ?? [];
  const failing = checks.filter(c => !c.passed);
  const violations = ready?.detail?.violations ?? [];
  const vehicles = new Map(all.map(t => [t.vehicleId, t.vehicle]).filter((x): x is [string, Vehicle] => Boolean(x[1])));
  const receiving = changes.filter((c): c is Extract<Change, { kind: 'merge' | 'move' }> => c.kind !== 'defer');
  const stores = new Set(moved.map(s => s.outletId)).size;

  const start = useStartAgentRun(r2 => setRunId(r2.id));
  const draftIt = useAction<void, unknown>(async c => {
    for (const t of vTrips.filter(x => x.status === 'LOADING')) await c.action('Trips', t.id, 'SetStatus', { status: 'PLANNED' });
    await start.run({ depot: vehicle!.depot, runDate: runDate!.slice(0, 10) });
  }, { onSuccess: () => void trips.refresh() });
  const needsReason = violations.length > 0 && !reason.trim();
  const decide = useAction<'approve' | 'reject', AgentRun>(
    async (c, decision) => {
      const r2 = await c.action<AgentRun>('AgentRuns', ready!.id, 'Resume', {
        decision, comment: reason.trim() || undefined, overrideReason: decision === 'approve' && violations.length ? reason.trim() : undefined,
      });
      if (decision === 'approve' && notice && !notice.readAt) await c.action('Notifications', notice.id, 'MarkRead');
      return r2;
    },
    { onSuccess: (_r, d) => { void run.refresh(); void trips.refresh(); void faults.refresh(); if (d === 'approve') nav.go('L32'); else setRunId(null); } },
  );

  const loading = (!down.data && !down.error) || (Boolean(tripsFilter) && !trips.data && !trips.error);
  const drafting = start.pending || draftIt.pending || run.drafting;
  const changeNo = (c: Change) => changes.indexOf(c) + 1;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="DSP-B1 Re-plan diff">
      <div className="d-app">
        <PlanSide active="N2" />
        <div className="d-main">
          {loading ? <Skeleton rows={4} /> : !vehicle ? (
            <>
              <ErrorBanner error={down.error ?? trips.error} onRetry={() => { void down.refresh(); void trips.refresh(); }} />
              <Empty icon="thermometer" title="No vehicle is down" text="When a vehicle is flagged to the workshop with trips still to run, its re-plan shows here." />
            </>
          ) : (
            <>
              <div className="d-head">
                <div className="d-head__txt">
                  <div className="d-eyebrow">
                    {ready ? <span className="m-tag m-tag--brand"><Ic n="sparkle" />Planning agent drafted this re-plan at {fmtClock(ready.updatedAt ?? ready.createdAt)}</span>
                      : <span className="m-tag m-tag--warn"><Ic n="sparkle" />{drafting ? 'Planning agent drafting the re-plan…' : 'No re-plan drafted yet'}</span>}
                    <span className="m-sep" />{" approve to send "}<span className="m-sep" />{` ${DEPOT_NAME[vehicle.depot] ?? vehicle.depot}`}
                  </div>
                  <div className="d-h1" data-testid="b1-title">
                    Re-plan for {vehicle.id}{ready ? `: ${changes.length} change${changes.length === 1 ? '' : 's'}, ${moved.length} order${moved.length === 1 ? '' : 's'}` : ''}
                  </div>
                  {ready && <div className="d-sub">{`${served} of ${moved.length} orders served · ${deferred} deferral${deferred === 1 ? '' : 's'}`}</div>}
                </div>
                {ready && <Btn className="d-btn d-btn--ghost" busy={decide.pending} onClick={() => void decide.run('reject')}>{"Discard"}</Btn>}
                <span className="d-btn" data-lk="L50">{"Edit manually"}</span>
                {ready ? (
                  <Btn className="d-btn d-btn--primary" testId="approve-send" busy={decide.pending} disabled={needsReason}
                    title={needsReason ? 'The draft breaks a hard rule: give a reason to override it' : undefined}
                    onClick={() => void decide.run('approve')}>
                    <Ic n="send" />{"Approve & send"}
                  </Btn>
                ) : (
                  <Btn className="d-btn d-btn--primary" testId="draft-replan" busy={drafting} disabled={!runDate} onClick={() => void draftIt.run()}>
                    <Ic n="sparkle-plus" />{"Draft the re-plan"}
                  </Btn>
                )}
              </div>
              <div className="g-dbanner g-dbanner--bad" data-p="1" style={{ paddingRight: '44px' }}>
                <Ic n="thermometer" />
                <span><b>{`${vehicle.id} can't depart`}</b>{notice
                  ? ` · ${[fault.fault ? FAULT[fault.fault] ?? fault.fault.toLowerCase() : null, fault.reeferTempC !== null && fault.reeferTempC !== undefined ? `reefer ${fault.reeferTempC} °C` : null].filter(Boolean).join(' · ')}${fault.bay ? ` · flagged at Bay ${fault.bay}, ${fmtClock(notice.sentAt)}` : ` · flagged ${fmtClock(notice.sentAt)}`}${fault.note ? ` · ${fault.note}` : ''}`
                  : ` · ${vehicle.workshopNote ?? 'in the workshop'}${vehicle.updatedAt ? ` · flagged ${fmtClock(vehicle.updatedAt)}` : ''}`}</span>
                <div className="spacer" />
                <b style={{ color: 'var(--st-exception-fg)', whiteSpace: 'nowrap' }}>{`${chilled ? `${chilled} chilled` : moved.length} order${(chilled || moved.length) === 1 ? '' : 's'} · ${vTrips.length} trip${vTrips.length === 1 ? '' : 's'} · ${fmtNum(movedM3, 1)} m³`}</b>
              </div>
              <ErrorBanner error={trips.error ?? run.error ?? start.error ?? draftIt.error ?? decide.error} />
              {!ready ? (
                drafting ? <Skeleton rows={3} label="The planning agent is drafting the re-plan…" /> : (
                  <Empty icon="sparkle-plus" title={draft?.status === 'FAILED' ? 'The draft failed' : 'No re-plan yet'} text={`Draft the re-plan: the planning agent moves ${vehicle.id}'s orders onto the vehicles still available, and you approve before anyone is told.`} />
                )
              ) : (
                <div className="d-split">
                  <div className="vstack" style={{ gap: '12px', flex: '1', minWidth: '0' }}>
                    {changes.map(c => c.kind === 'defer' ? (
                      <div key={c.stop.id} className="d-card" style={{ boxShadow: '0 0 0 1.5px var(--st-deferred-bd), 0 4px 14px rgba(15,20,50,.04)' }} data-p="3">
                        <div className="g-chg">
                          <div className="g-chg__h">
                            <span className="g-num">{changeNo(c)}</span>
                            <span className="g-chg__t">{`${c.stop.outletId} ${c.stop.outlet?.name ?? ''}`}</span>
                            <span className="id t-3" style={{ fontSize: '13px' }}>{c.stop.orderId}</span>
                            {c.stop.order?.tempClass === 'CHILLED' && <span className="m-tag m-tag--cold"><span className="dot" />Chilled {fmtNum(c.stop.order.m3, 1)} m³</span>}
                            <div className="spacer" />
                            <span className="m-pill m-pill--warn" style={{ height: '26px' }}>Deferred{c.reason ? ` · ${c.reason.replace('_', '-')}` : ''}</span>
                          </div>
                          {c.score !== undefined && <div className="g-diff"><span className="t-3" style={{ fontWeight: '500' }}>Deferral score {c.score}{c.stop.order?.deferredYesterday ? ' · protected' : ' · allowed, not protected'}</span></div>}
                        </div>
                      </div>
                    ) : (
                      <div key={tripKey(c.to.vehicleId, c.to.tripNo)} className="d-card" data-p="2">
                        <div className="g-chg">
                          <div className="g-chg__h">
                            <span className="g-num">{changeNo(c)}</span>
                            <span className="g-chg__t">
                              {c.kind === 'move' ? `Move ${vehicle.id} Trip ${c.from[0].tripNumber} · ${title(c.from[0].brand)} · ${c.from[0].district}, whole` : <>{"Merge into "}<span className="id">{c.to.vehicleId}</span>{` Trip ${c.to.tripNo} · ${title(c.to.brand)} · ${c.to.district}`}</>}
                            </span>
                            {c.kind === 'move' && <span className="d-sub" style={{ fontSize: '13px', color: 'var(--text-3)' }}>{`${c.moved.length} order${c.moved.length === 1 ? '' : 's'} · ${fmtNum(c.to.m3, 1)} m³ · ${c.to.minutes} min`}</span>}
                            <div className="spacer" />
                            <span className={`m-pill ${c.to.minutes > (budget(c.to.brand, limits) ?? Infinity) ? 'm-pill--bad' : 'm-pill--ok'}`} style={{ height: '26px' }}>
                              {c.kind === 'move' ? `${c.to.vehicleId} · ${c.to.minutes}/${budget(c.to.brand, limits) ?? '—'}` : `${c.before?.planMinutes ?? '—'} → ${c.to.minutes} min · ${c.to.minutes}/${budget(c.to.brand, limits) ?? '—'}`}
                            </span>
                          </div>
                          {c.kind === 'merge' && c.moved.map(s => {
                            const at = c.to.stops?.find(x => x.orderId === s.orderId)?.arrive;
                            return (
                              <div key={s.id} className="g-ord">
                                <b>{`${s.outletId} ${s.outlet?.name ?? ''}`}</b>
                                <span className="id t-3">{s.orderId}</span>
                                {s.order?.tempClass === 'CHILLED' && <span className="m-tag m-tag--cold"><span className="dot" />{fmtNum(s.order.m3, 1)} m³</span>}
                                {s.order?.deferredYesterday && <span className="m-tag m-tag--brand"><Ic n="shield" />Protected{s.order.deferralScore ? ` · score ${s.order.deferralScore}` : ''}</span>}
                                <div className="spacer" />
                                {(at || s.outlet?.windowClose) && <b style={{ color: 'var(--st-delivered-fg)', fontSize: '13px' }}>{[at ? `~${at}` : null, s.outlet?.windowClose ? `closes ${s.outlet.windowClose}` : null].filter(Boolean).join(' · ')}</b>}
                              </div>
                            );
                          })}
                          <div className="g-diff">
                            <s>{c.from.map(f => `${vehicle.id} Trip ${f.tripNumber}`).join(' + ')}</s>
                            <Ic n="arrow-right" />
                            <b>{`${c.to.vehicleId} Trip ${c.to.tripNo}${c.kind === 'merge' ? ` (now ${c.to.orderIds.length} orders)` : ''}`}</b>
                            <span className="t-3" style={{ fontWeight: '500' }}>
                              {c.kind === 'merge' && c.from.every(f => f.brand === c.to.brand && f.district === c.to.district) ? 'same brand + district · ' : ''}
                              {fmtNum(c.moved.reduce((n, s) => n + (s.order?.m3 ?? 0), 0), 1)} m³
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {changes.length === 0 && <Empty title="Nothing to move" text={`${vehicle.id} has no orders left in this draft.`} />}
                  </div>
                  <div className="d-panel" data-p="4">
                    <div className="d-card">
                      <div className="d-card__head">
                        <span className="d-card__title">{"Rules the agent checked"}</span>
                        <div className="spacer" />
                        {checks.length > 0 && (failing.length
                          ? <span className="m-tag m-tag--bad"><Ic n="alert" />{failing.length} fail</span>
                          : <span className="m-tag m-tag--ok"><Ic n="check" />{"All pass"}</span>)}
                      </div>
                      {receiving.map(c => {
                        const v = vehicles.get(c.to.vehicleId);
                        return (
                          <div key={tripKey(c.to.vehicleId, c.to.tripNo)} className="g-sect" style={{ paddingTop: '12px', gap: '8px' }}>
                            <span className="g-lbl"><span className="id">{c.to.vehicleId}</span>{` · Trip ${c.to.tripNo} · ${c.to.district}${c.before ? ` · ${(c.before.stops ?? []).length} → ${c.to.orderIds.length} orders` : ` (from ${vehicle.id})`}`}</span>
                            <Cap label={`${title(c.to.brand)} minutes`} used={c.to.minutes} cap={budget(c.to.brand, limits)} unit="" />
                            {v && (
                              <div className="hstack" style={{ gap: '16px' }}>
                                <Cap label="Weight" used={c.to.kg} cap={v.capacityKg} unit=" kg" />
                                <Cap label={c.to.chilled ? 'Chilled' : 'Volume'} used={c.to.m3} cap={v.capacityM3} unit=" m³" digits={1} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {failing.map(f => <div key={f.rule} className="g-sect"><span className="g-lbl" style={{ color: 'var(--st-exception-fg)' }}>{f.label} · {f.violations} violation{f.violations === 1 ? '' : 's'}</span></div>)}
                      {violations.length > 0 && (
                        <div className="g-sect" style={{ gap: '6px' }}>
                          <input className="g-input lv-input" aria-label="Reason to override" placeholder="Reason to override the rule (required)" value={reason} onChange={e => setReason(e.target.value)} data-testid="override-reason" />
                        </div>
                      )}
                    </div>
                    <div className="d-card" style={{ flex: '1' }}>
                      <div className="d-card__head"><span className="d-card__title">{"On approval, not before"}</span></div>
                      <div className="vstack" style={{ gap: '8px', padding: '0 18px 16px' }}>
                        <div className="g-li" style={{ fontSize: '13px' }}><span className="g-mark g-mark--ok"><Ic n="check" /></span><span><b>{receiving.map(c => c.to.vehicleId).filter((x, i, a) => a.indexOf(x) === i).join(' · ')}:</b>{` updated load sheets at the dock${vTrips.length ? ` · ${vehicle.id} trips replaced` : ''}`}</span></div>
                        <div className="g-li" style={{ fontSize: '13px' }}><span className="g-mark g-mark--ok"><Ic n="check" /></span><span><b>{`${stores} store${stores === 1 ? '' : 's'} told`}</b>{" their new times"}</span></div>
                        <div className="g-li" style={{ fontSize: '13px' }}><span className="g-mark g-mark--ok"><Ic n="check" /></span><span><b>{"Drivers told"}</b>{" the trips they now run"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

