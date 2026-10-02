// P5 degradation flows on the desk, made live in WP6: DSP-A1 Blackout view, DSP-A1b Provisional deferral,
// DSP-A2 Reconcile conflict, DSP-B1 Re-plan diff. Real ODataClient over a fake fetch: assertions on requests are
// at the HTTP level. Date is frozen at Mon 6 Apr 2026 13:30 (Colombo); the run date is Tue 7 Apr.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import ScreenShell from '@/components/ScreenShell';
import BlackoutView from '@/live/dsp-a1-blackout-view';
import ProvisionalDeferral from '@/live/dsp-a1b-provisional-deferral';
import Reconcile from '@/live/dsp-a2-reconcile-conflict';
import RePlan from '@/live/dsp-b1-re-plan-diff';
import ExceptionsInbox from '@/live/dsp-13-exceptions-inbox';
import { freezeDate, unfreeze } from './helpers/clock';
import type { FakeRequest } from './helpers/live';
import { agentConfigReply, page, renderLive } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan' }));

const NOW = '2026-04-06T08:00:00.000Z';
const DAY = '2026-04-07T00:00:00.000Z';
const LOST_AT = '2026-04-06T07:00:00.000Z'; // 12:30 in Colombo, 60 min before NOW
const err = (status: number, message: string, code = 'Failed') => ({ status, body: { error: { code, message } } });
const posts = (calls: FakeRequest[]) => calls.filter(c => c.method === 'POST');
const sends = (calls: FakeRequest[]) => posts(calls).filter(c => c.path === 'Notifications/Lodestar.Send');

const stop = (id: string, over = {}) => ({
  id, tripId: 'TRT1', orderId: `ORD${id}`, outletId: 'OUTT06', stopSeq: 1, status: 'PLANNED', etaPlan: '2026-04-06T08:30:00.000Z', etaModel: '2026-04-06T09:05:00.000Z',
  lateRiskPct: 10, serviceMinPredicted: 20, outlet: { id: 'OUTT06', name: 'Outlet T06', windowClose: '08:00' },
  order: { id: `ORD${id}`, units: 20, kg: 200, m3: 1.2, tempClass: 'CHILLED', deferredYesterday: false }, ...over,
});
const silentTrip = (over = {}) => ({
  id: 'TRT1', vehicleId: 'VEHT57', driverId: 'u-drv', depot: 'KANDY', runDate: DAY, brand: 'FRESH', district: 'District N', status: 'ENROUTE',
  planVersion: 3, tripNumber: 1, departTime: '2026-04-06T04:40:00.000Z', reeferTempC: 3,
  vehicle: { id: 'VEHT57', type: 'VAN', tempClass: 'CHILLED', capacityKg: 1040, capacityM3: 7 }, driver: { id: 'u-drv', name: 'Ravi Driver' },
  loadRecord: { loadedAt: '2026-04-06T04:34:00.000Z' },
  stops: [
    stop('S1', { status: 'DELIVERED', arrivalActual: '2026-04-06T06:30:00.000Z' }),
    stop('S2', { orderId: 'ORDT9', outletId: 'OUTT08', stopSeq: 2, lateRiskPct: 61, outlet: { id: 'OUTT08', name: 'Outlet T08', windowClose: '07:45' }, order: { id: 'ORDT9', units: 28, kg: 240, m3: 1.1, tempClass: 'CHILLED', deferredYesterday: false } }),
  ],
  ...over,
});
const liveTrip = { ...silentTrip(), id: 'TRT2', vehicleId: 'VEHT39', driverId: 'u-d2', driver: { id: 'u-d2', name: 'Other Driver' }, stops: [stop('S9', { tripId: 'TRT2', lateRiskPct: 8, arrivalActual: null })] };
const blackout = { id: 'N1', recipientId: 'u-d', tripId: 'TRT1', type: 'BLACKOUT_DETECTED', channel: 'WEBSOCKET', payload: { vehicleId: 'VEHT57', location: 'Above Ramboda' }, sentAt: LOST_AT };

/** Reads every Plan screen makes: sidebar counts and the latest run date. */
function base(req: FakeRequest) {
  if (agentConfigReply(req)) return agentConfigReply(req);
  if (req.query.$top === '0') return page([], 0);
  // no open orders from today on (the test day is past): the desk falls back to the latest plan's run date
  if (req.path === 'Orders' && req.query.$select === 'runDate') return page([]);
  if (req.path === 'Plans' && req.query.$select === 'runDate') return page([{ runDate: DAY }]);
  return undefined;
}

/** The blackout data: trips, the BLACKOUT_DETECTED notice, driver, store managers and the next operating day. */
const blackoutHandler = (opts: { notes?: unknown[]; trips?: unknown[]; over?: (req: FakeRequest) => unknown } = {}) => (req: FakeRequest) =>
  base(req) ?? opts.over?.(req) ?? (
    req.path === 'Trips' ? page(opts.trips ?? [silentTrip(), liveTrip])
      : req.path === 'Notifications' ? page(opts.notes ?? [blackout])
        : req.path === 'OfflineEvents' ? page([])
          : req.path === "Users('u-drv')" ? { id: 'u-drv', name: 'Ravi Driver', phone: '+94770000001' }
            : req.path === 'Users' ? page([{ id: 'u-sm8', name: 'Store Lead', outletId: 'OUTT08' }])
              : req.path === 'Calendar' ? page([{ date: '2026-04-08T00:00:00.000Z', isOperating: true }])
                : req.path === 'Notifications/Lodestar.Send' ? { id: 'N9' }
                  : page([]));

const shell = (ui: ReactElement, links: Record<string, { href?: string; app?: string; screen?: string; kind: string }>) => (
  <ScreenShell board="P5" nav={{ links }} live>{ui}</ScreenShell>
);

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/plan');
  freezeDate(NOW);
});
afterEach(unfreeze);

// ------------------------------------------------------------------------------------------------ DSP-A1

describe('DSP-A1 Blackout view', () => {
  it('shows the silent trip as predicted, never as on time, with its riskiest stop', async () => {
    const view = renderLive(<BlackoutView />, { handler: blackoutHandler() });
    const hero = await screen.findByTestId('blackout-hero');
    expect(hero).toHaveTextContent('Unknown since 12:30');
    expect(hero).toHaveTextContent('Last seen at Above Ramboda, 60 min without a ping.');
    expect(hero).toHaveTextContent('Ravi Driver');
    expect(within(hero).getByText('61%')).toBeInTheDocument();
    expect(hero).toHaveTextContent('late risk · chilled, window closes 07:45');

    const silent = document.querySelector('[data-trip="TRT1"]') as HTMLElement;
    expect(silent).toHaveAttribute('data-lk', 'L46');
    expect(within(silent).getByText('Unknown · predicted')).toBeInTheDocument();
    expect(silent).toHaveTextContent('12:30 · 60m');
    const live = document.querySelector('[data-trip="TRT2"]') as HTMLElement;
    expect(live).not.toHaveAttribute('data-lk');
    expect(within(live).getByText('En route')).toBeInTheDocument();

    const panel = screen.getByTestId('blackout-panel');
    expect(panel).toHaveTextContent('Last ping at Above Ramboda · reefer 3 °C');
    expect(panel).toHaveTextContent('Predicted · not confirmed');
    expect(screen.getByTestId('call-driver')).toHaveAttribute('href', 'tel:+94770000001');
    expect(view.calls.find(c => c.path === 'Notifications')!.query.$filter).toBe("type in ('BLACKOUT_DETECTED','SIGNAL_LOST','SIGNAL_BACK')");
  });

  it('every vehicle reporting: an empty state instead of the hero', async () => {
    renderLive(<BlackoutView />, { handler: blackoutHandler({ notes: [] }) });
    expect(await screen.findByText('Every vehicle is reporting')).toBeInTheDocument();
    expect(screen.queryByTestId('blackout-hero')).not.toBeInTheDocument();
  });

  it('a synced SIGNAL_LOST offline event also marks the trip silent; a later SIGNAL_BACK clears it', async () => {
    const events = [
      { id: 'E1', driverId: 'u-drv', tripId: 'TRT1', eventType: 'STATUS_CHANGE', payload: { status: 'SIGNAL_LOST', location: 'Pass' }, savedAt: LOST_AT, conflictResolved: false },
    ];
    const view = renderLive(<BlackoutView />, { handler: blackoutHandler({ notes: [], over: req => (req.path === 'OfflineEvents' ? page(events) : undefined) }) });
    expect(await screen.findByTestId('blackout-hero')).toHaveTextContent('Last seen at Pass');
    act(() => view.hub.emit('signal_back', { tripId: 'TRT1' }));
    expect(await screen.findByText('Every vehicle is reporting')).toBeInTheDocument();
  });

  it('"Send SMS to driver" sends the skip notice to the trip\'s driver', async () => {
    const view = renderLive(<BlackoutView />, { handler: blackoutHandler() });
    fireEvent.click(await screen.findByTestId('send-sms'));
    await waitFor(() => expect(sends(view.calls)).toHaveLength(1));
    expect(sends(view.calls)[0].body).toEqual({
      recipientId: 'u-drv', type: 'DISPATCH_NOTICE', tripId: 'TRT1',
      payload: { title: 'Message from dispatch', message: 'Skip OUTT08 if after 7:30', vehicleId: 'VEHT57' },
    });
    expect(await screen.findByTestId('send-sms')).toHaveTextContent('Sent to driver');
  });

  it('"Warn stores" tells the managers of the open stops; a refused send shows the error', async () => {
    const view = renderLive(<BlackoutView />, { handler: blackoutHandler({ over: req => (req.path === 'Notifications/Lodestar.Send' ? err(403, 'The recipient is outside your depots') : undefined) }) });
    await waitFor(() => expect(screen.getByTestId('warn-stores')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('warn-stores'));
    expect(await screen.findByText('The recipient is outside your depots')).toBeInTheDocument();
    expect(sends(view.calls)[0].body).toMatchObject({ recipientId: 'u-sm8', type: 'DISPATCH_NOTICE', outletId: 'OUTT08', payload: { title: 'Chilled order may arrive late', orderId: 'ORDT9' } });
  });

  it('the hero opens DSP-A1b for the riskiest order of the silent trip', async () => {
    renderLive(shell(<BlackoutView />, { L25: { href: '/plan/dsp-a1b-provisional-deferral', kind: 'go' } }), { handler: blackoutHandler() });
    fireEvent.click(await screen.findByTestId('blackout-hero'));
    expect(window.sessionStorage.getItem('lodestar.focus.trip')).toBe('TRT1');
    expect(window.sessionStorage.getItem('lodestar.focus.order')).toBe('ORDT9');
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-a1b-provisional-deferral');
  });

  it('shows the error banner when trips cannot load', async () => {
    renderLive(<BlackoutView />, { handler: blackoutHandler({ over: req => (req.path === 'Trips' ? err(500, 'Trips are unavailable') : undefined) }) });
    expect(await screen.findByText('Trips are unavailable')).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------------------------ DSP-A1b

describe('DSP-A1b Provisional deferral', () => {
  const links = {
    L26: { app: 'Lodestar Store', screen: 'SM-A1 Store · in progress, low signal', kind: 'go' },
    L47: { href: '/plan/dsp-a1-blackout-view', kind: 'go' },
    L48: { href: '/plan/dsp-a1-blackout-view', kind: 'go' },
    C: { href: '/plan/dsp-a1-blackout-view', kind: 'back' },
  };

  beforeEach(() => {
    window.sessionStorage.setItem('lodestar.focus.trip', 'TRT1');
    window.sessionStorage.setItem('lodestar.focus.order', 'ORDT9');
  });

  it('makes a provisional deferral, tells the store "at risk" and the driver, then continues to the store app', async () => {
    const view = renderLive(shell(<ProvisionalDeferral />, links), { handler: blackoutHandler({ over: req => (req.path === 'Deferrals' && req.method === 'POST' ? { id: 'DFL9', orderId: 'ORDT9', status: 'SUGGESTED', isProvisional: true } : undefined) }) });
    const drawer = await screen.findByTestId('provisional-drawer');
    await within(drawer).findByText(/to Wed 8 Apr\?/);
    expect(drawer).toHaveTextContent('Defer ORDT9 to Wed 8 Apr?');
    expect(drawer).toHaveTextContent('This will be provisional');
    expect(drawer).toHaveTextContent('On VEHT57 · stop 2');
    expect(drawer).toHaveTextContent('OUTT08 not deferred yesterday');
    expect(drawer).toHaveTextContent('Chilled order may arrive late');

    await waitFor(() => expect(screen.getByTestId('make-provisional')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('make-provisional'));
    await waitFor(() => expect(sends(view.calls)).toHaveLength(2));
    const create = posts(view.calls).find(c => c.path === 'Deferrals')!;
    expect(create.body).toEqual({
      orderId: 'ORDT9', reason: 'CAP_TIME', notes: 'Vehicle unreachable since 12:30. Chilled goods must not miss the 07:45 window.',
      rescheduledDate: '2026-04-08T00:00:00.000Z', isProvisional: true,
    });
    expect(sends(view.calls)[0].body).toMatchObject({ recipientId: 'u-sm8', outletId: 'OUTT08', payload: { title: 'Chilled order may arrive late', rescheduledDate: '2026-04-08' } });
    expect(sends(view.calls)[1].body).toMatchObject({ recipientId: 'u-drv', payload: { message: 'Skip OUTT08 if after 7:30' } });
    expect(await screen.findByText(/on the phone: SM-A1 Store · in progress, low signal/)).toBeInTheDocument();
    expect(screen.getByTestId('make-provisional')).toHaveTextContent('Provisional deferral made');
  });

  it('the reason, date and note can be changed before confirming', async () => {
    const view = renderLive(<ProvisionalDeferral />, { handler: blackoutHandler() });
    await screen.findByText(/to Wed 8 Apr\?/);
    fireEvent.change(screen.getByTestId('reason'), { target: { value: 'WINDOW' } });
    fireEvent.change(screen.getByTestId('defer-to'), { target: { value: '2026-04-09' } });
    fireEvent.change(screen.getByTestId('note'), { target: { value: 'Driver not answering' } });
    expect(screen.getByTestId('provisional-drawer')).toHaveTextContent('Defer ORDT9 to Thu 9 Apr?');
    await waitFor(() => expect(screen.getByTestId('make-provisional')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('make-provisional'));
    await waitFor(() => expect(posts(view.calls).some(c => c.path === 'Deferrals')).toBe(true));
    expect(posts(view.calls).find(c => c.path === 'Deferrals')!.body).toMatchObject({ reason: 'WINDOW', rescheduledDate: '2026-04-09T00:00:00.000Z', notes: 'Driver not answering' });
  });

  it('a protected order (deferred yesterday) cannot be deferred', async () => {
    const protectedTrip = silentTrip();
    (protectedTrip.stops[1].order as { deferredYesterday: boolean }).deferredYesterday = true;
    const view = renderLive(<ProvisionalDeferral />, { handler: blackoutHandler({ trips: [protectedTrip] }) });
    expect(await screen.findByText(/was deferred yesterday: protected/)).toBeInTheDocument();
    expect(screen.getByTestId('make-provisional')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByTestId('make-provisional'));
    expect(posts(view.calls)).toHaveLength(0);
  });

  it('shows the API refusal and sends no notice', async () => {
    const view = renderLive(<ProvisionalDeferral />, { handler: blackoutHandler({ over: req => (req.path === 'Deferrals' && req.method === 'POST' ? err(409, 'Order ORDT9 is protected and is never deferred') : undefined) }) });
    await screen.findByText(/to Wed 8 Apr\?/);
    await waitFor(() => expect(screen.getByTestId('make-provisional')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('make-provisional'));
    expect(await screen.findByText('Order ORDT9 is protected and is never deferred')).toBeInTheDocument();
    expect(sends(view.calls)).toHaveLength(0);
  });

  it('no silent vehicle: nothing to defer', async () => {
    renderLive(<ProvisionalDeferral />, { handler: blackoutHandler({ notes: [] }) });
    expect(await screen.findByText('No silent vehicle')).toBeInTheDocument();
    expect(screen.queryByTestId('make-provisional')).not.toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------------------------ DSP-A2

describe('DSP-A2 Reconcile conflict', () => {
  const BACK = '2026-04-06T07:40:00.000Z'; // 13:10
  const pod = { id: 'P2', tripStopId: 'S2', unitsDelivered: 28, unitsOrdered: 28, receiverName: 'Store staff', photoUrl: '/uploads/p.jpg', savedOffline: true, savedAt: '2026-04-06T07:27:00.000Z', syncedAt: BACK };
  const trip = silentTrip({
    status: 'COMPLETE',
    stops: [
      stop('S1', { status: 'DELIVERED', arrivalActual: '2026-04-06T06:30:00.000Z', pod: { ...pod, id: 'P1', tripStopId: 'S1', unitsDelivered: 20, unitsOrdered: 20 } }),
      stop('S2', { orderId: 'ORDT9', outletId: 'OUTT08', stopSeq: 2, status: 'DELIVERED', arrivalActual: '2026-04-06T07:26:00.000Z', outlet: { id: 'OUTT08', name: 'Outlet T08', windowClose: '07:45' }, pod }),
    ],
  });
  const ev = (id: string, eventType: string, payload: Record<string, unknown>, savedAt: string, over = {}) =>
    ({ id, driverId: 'u-drv', tripId: 'TRT1', eventType, payload, savedAt, syncedAt: BACK, conflictResolved: false, conflictNote: null, ...over });
  const events = [
    ev('E1', 'STATUS_CHANGE', { status: 'SIGNAL_LOST', location: 'Above Ramboda' }, LOST_AT),
    ev('E2', 'ARRIVAL', { stopSeq: 1, outletId: 'OUTT06' }, '2026-04-06T06:30:00.000Z'),
    ev('E3', 'POD_SAVE', { orderId: 'ORDS1', units: 20 }, '2026-04-06T06:50:00.000Z'),
    ev('E4', 'POD_SAVE', { orderId: 'ORDT9', units: 28 }, '2026-04-06T07:27:00.000Z', { conflictResolved: true, conflictNote: 'Provisional deferral reversed — field evidence wins; delivery confirmed offline' }),
    ev('E5', 'STATUS_CHANGE', { status: 'SIGNAL_BACK', location: 'Near Pussellawa' }, BACK),
  ];
  const deferral = { id: 'DFL9', orderId: 'ORDT9', reason: 'CAP_TIME', score: 30, isProvisional: true, status: 'SUGGESTED', notes: 'Vehicle unreachable', rescheduledDate: '2026-04-08T00:00:00.000Z', createdAt: '2026-04-06T07:10:00.000Z' };
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => blackoutHandler({
    notes: [],
    over: req => over(req) ?? (
      req.path === 'OfflineEvents' && req.query.$filter?.startsWith('conflictNote ne null') ? page([events[3]])
        : req.path === 'OfflineEvents' && req.query.$filter === "tripId eq 'TRT1'" ? page(events)
          : req.path === "OfflineEvents/Lodestar.SyncStatus(tripId='TRT1')" ? { total: 5, synced: 5, pending: 0, conflicts: 1, needsReview: 0, lastSyncedAt: BACK }
            : req.path === "Trips('TRT1')" ? trip
              : req.path === 'Deferrals' && req.method === 'GET' ? page([deferral])
                : req.path === "Deferrals('DFL9')/Lodestar.Dismiss" ? { ...deferral, status: 'DISMISSED' }
                  : undefined),
  });

  it('shows the sync, the dispatcher\'s provisional deferral against the field record, and what was applied', async () => {
    const view = renderLive(<Reconcile />, { handler: handler() });
    expect(await screen.findByTestId('a2-title')).toHaveTextContent('1 conflict needs your decision');
    expect(await screen.findByText(/back online at 13:10/)).toBeInTheDocument();
    expect(screen.getByText(/near Near Pussellawa · 5 records received/)).toBeInTheDocument();
    expect(screen.getByText('Offline 12:30 to 13:10 · 0 h 40 m')).toBeInTheDocument();
    expect(await screen.findByText('Deferred to Wed 8 Apr')).toBeInTheDocument();
    expect(screen.getByText('Delivered at OUTT08 · POD 28/28')).toBeInTheDocument();
    expect(screen.getByText('Recommended: keep the delivery')).toBeInTheDocument();
    // synced without conflict: the arrival and the other POD (status changes are not records)
    expect(screen.getByText('Synced without conflict').closest('.d-card')!.querySelectorAll('.g-li')).toHaveLength(2);
    expect(view.calls.find(c => c.path === 'Deferrals')!.query.$filter).toBe("orderId in ('ORDT9')");
  });

  it('"Resolve: keep the delivery" dismisses the open provisional deferral and tells the store and the driver', async () => {
    const view = renderLive(shell(<Reconcile />, { L29: { app: 'Lodestar Store', screen: 'SM-A1 Store · recorded offline', kind: 'go' } }), { handler: handler() });
    await screen.findByText('Deferred to Wed 8 Apr');
    await waitFor(() => expect(screen.getByTestId('resolve')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('resolve'));
    await waitFor(() => expect(sends(view.calls)).toHaveLength(2));
    expect(posts(view.calls)[0].path).toBe("Deferrals('DFL9')/Lodestar.Dismiss");
    expect(sends(view.calls)[0].body).toMatchObject({ recipientId: 'u-sm8', outletId: 'OUTT08', payload: { title: 'Delivery confirmed', message: 'Delivered 12:56. Please ignore the 12:40 at-risk notice.' } });
    expect(sends(view.calls)[1].body).toMatchObject({ recipientId: 'u-drv' });
    expect(await screen.findByText(/on the phone: SM-A1 Store · recorded offline/)).toBeInTheDocument();
    expect(screen.getByTestId('a2-title')).toHaveTextContent('Conflict resolved: field evidence kept');
  });

  it('a deferral the sync already reversed is not reversed again: only the notices go out', async () => {
    const view = renderLive(<Reconcile />, { handler: handler(req => (req.path === 'Deferrals' && req.method === 'GET' ? page([{ ...deferral, status: 'REVERSED' }]) : undefined)) });
    await screen.findByText('Deferred to Wed 8 Apr');
    await waitFor(() => expect(screen.getByTestId('resolve')).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(screen.getByTestId('resolve'));
    await waitFor(() => expect(sends(view.calls)).toHaveLength(2));
    expect(posts(view.calls).filter(c => c.path.startsWith('Deferrals'))).toHaveLength(0);
  });

  it('no conflict anywhere: nothing to reconcile', async () => {
    renderLive(<Reconcile />, { handler: handler(req => (req.path === 'OfflineEvents' && req.query.$filter?.startsWith('conflictNote') ? page([]) : undefined)) });
    expect(await screen.findByText('Nothing to reconcile')).toBeInTheDocument();
    expect(screen.getByTestId('a2-title')).toHaveTextContent('No sync conflicts');
  });
});

// ------------------------------------------------------------------------------------------------ DSP-B1

describe('DSP-B1 Re-plan diff', () => {
  const v = (id: string, over = {}) => ({ id, depot: 'PELIYAGODA', type: 'TRUCK', tempClass: 'CHILLED', capacityKg: 3990, capacityM3: 21.1, kmPerLitre: 6, weeklyLFuel: 600, usedLThisWeek: 100, status: 'AVAILABLE', ...over });
  const s = (id: string, tripId: string, outletId: string, m3 = 1.5) => ({ id, tripId, orderId: `ORD${id}`, outletId, stopSeq: 1, status: 'PLANNED', outlet: { id: outletId, name: `Outlet ${outletId.slice(-2)}`, windowClose: '08:00' }, order: { id: `ORD${id}`, m3, kg: 100, tempClass: 'CHILLED', deferredYesterday: false } });
  const t = (id: string, vehicleId: string, tripNumber: number, district: string, stops: unknown[], over = {}) =>
    ({ id, vehicleId, depot: 'PELIYAGODA', runDate: DAY, brand: 'FRESH', district, status: 'PLANNED', planVersion: 3, tripNumber, planMinutes: 100, vehicle: v(vehicleId), stops, ...over });
  const trips = [
    t('T61', 'VEHT6', 1, 'Gampaha', [s('A', 'T61', 'OUTTA'), s('B', 'T61', 'OUTTB')]),
    t('T62', 'VEHT6', 2, 'Colombo', [s('C', 'T62', 'OUTTC')], { status: 'LOADING' }),
    t('T22', 'VEHT2', 2, 'Gampaha', [s('X', 'T22', 'OUTTX')]),
  ];
  const down = v('VEHT6', { status: 'WORKSHOP', workshopNote: 'Reefer 9 °C', updatedAt: '2026-04-06T07:45:00.000Z' });
  const run = {
    id: 'RUN1', depot: 'PELIYAGODA', runDate: DAY, status: 'NEEDS_APPROVAL', requestedBy: 'u-d', createdAt: '2026-04-06T07:50:00.000Z', updatedAt: '2026-04-06T07:52:00.000Z',
    detail: {
      plan: { trips: [
        { id: 'd1', vehicleId: 'VEHT2', tripNo: 2, brand: 'FRESH', district: 'Gampaha', chilled: true, orderIds: ['ORDX', 'ORDA', 'ORDB'], kg: 300, m3: 4.5, minutes: 149 },
        { id: 'd2', vehicleId: 'VEHT5', tripNo: 2, brand: 'FRESH', district: 'Colombo', chilled: true, orderIds: ['ORDC'], kg: 100, m3: 1.5, minutes: 85 },
      ] },
      ruleChecks: [{ rule: 'minutes', label: 'Fresh minutes', passed: true, violations: 0 }],
      violations: [],
    },
  };
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => (req: FakeRequest) => base(req) ?? over(req) ?? (
    req.path === 'Vehicles' ? page([down])
      : req.path === 'Trips' ? page(trips)
        : req.path === "AgentRuns('RUN1')" ? run
          : req.path === 'AgentRuns' && req.method === 'POST' ? { ...run, id: 'RUN2', status: 'DRAFTING', detail: null }
            : req.path === "AgentRuns('RUN2')" ? { ...run, id: 'RUN2', status: 'DRAFTING', detail: null }
              : req.path === "AgentRuns('RUN1')/Lodestar.Resume" ? { ...run, status: 'APPROVED' }
                : page([]));
  const links = { L32: { app: 'Lodestar Dock', screen: 'LD-14 Re-plan received · phone', kind: 'go' }, L50: { href: '/plan/dsp-02-plan-board', kind: 'go' } };

  it('no draft yet: the vehicle is down with its trips, and "Draft the re-plan" unloads and asks the agent', async () => {
    const view = renderLive(<RePlan />, { handler: handler() });
    expect(await screen.findByTestId('b1-title')).toHaveTextContent('Re-plan for VEHT6');
    expect(screen.getByText("VEHT6 can't depart")).toBeInTheDocument();
    expect(screen.getByText('3 chilled orders · 2 trips · 4.5 m³')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('draft-replan'));
    await waitFor(() => expect(posts(view.calls).some(c => c.path === 'AgentRuns')).toBe(true));
    expect(posts(view.calls)[0]).toMatchObject({ path: "Trips('T62')/Lodestar.SetStatus", body: { status: 'PLANNED' } });
    expect(posts(view.calls)[1]).toMatchObject({ path: 'AgentRuns', body: { depot: 'PELIYAGODA', runDate: '2026-04-07T00:00:00.000Z' } });
  });

  it('with the agent\'s draft: where each order went, the receiving trips\' limits, and "Approve & send"', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'RUN1');
    const view = renderLive(shell(<RePlan />, links), { handler: handler() });
    expect(await screen.findByText('Re-plan for VEHT6: 2 changes, 3 orders')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 orders served · 0 deferrals')).toBeInTheDocument();
    expect(screen.getByText(/Merge into/).closest('.g-chg')).toHaveTextContent('Merge into VEHT2 Trip 2 · Fresh · Gampaha');
    expect(screen.getByText(/Merge into/).closest('.g-chg')).toHaveTextContent('100 → 149 min · 149/270');
    expect(screen.getByText('Move VEHT6 Trip 2 · Fresh · Colombo, whole')).toBeInTheDocument();
    expect(screen.getByText('All pass')).toBeInTheDocument();
    expect(screen.getByText('3 stores told')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('approve-send'));
    await waitFor(() => expect(posts(view.calls).some(c => c.path === "AgentRuns('RUN1')/Lodestar.Resume")).toBe(true));
    expect(posts(view.calls).find(c => c.path === "AgentRuns('RUN1')/Lodestar.Resume")!.body).toEqual({ decision: 'approve' });
    expect(await screen.findByText(/on the phone: LD-14 Re-plan received · phone/)).toBeInTheDocument();
  });

  it('a draft with hard-rule violations needs a reason, sent as the override reason', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'RUN1');
    const bad = { ...run, detail: { ...run.detail, ruleChecks: [{ rule: 'minutes', label: 'Fresh minutes', passed: false, violations: 1 }], violations: [{ rule: 'minutes', tripId: 'd1', vehicleId: 'VEHT2', orderIds: [], reason: 'CAP_TIME', detail: '285/270' }] } };
    const view = renderLive(<RePlan />, { handler: handler(req => (req.path === "AgentRuns('RUN1')" ? bad : undefined)) });
    expect(await screen.findByText('1 fail')).toBeInTheDocument();
    expect(screen.getByTestId('approve-send')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByTestId('approve-send'));
    expect(posts(view.calls)).toHaveLength(0);
    fireEvent.change(screen.getByTestId('override-reason'), { target: { value: 'Store shelves empty, one extra stop' } });
    fireEvent.click(screen.getByTestId('approve-send'));
    await waitFor(() => expect(posts(view.calls)).toHaveLength(1));
    expect(posts(view.calls)[0].body).toEqual({ decision: 'approve', comment: 'Store shelves empty, one extra stop', overrideReason: 'Store shelves empty, one extra stop' });
  });

  it('opens on the VEHICLE_FAULT notice from the dock and marks it handled when the re-plan is approved', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'RUN1');
    const notice = {
      id: 'NF1', recipientId: 'u-d', tripId: 'T62', type: 'VEHICLE_FAULT', channel: 'WEBSOCKET', sentAt: '2026-04-06T07:45:00.000Z', readAt: null,
      payload: { tripId: 'T62', vehicleId: 'VEHT6', depot: 'PELIYAGODA', bay: 'P5', fault: 'NOT_COOLING', reeferTempC: 9, note: 'Goods back in the cold room', orderIds: ['ORDC'], outlets: ['OUTTC'] },
    };
    const view = renderLive(<RePlan />, { handler: handler(req => (req.path === 'Notifications' ? page([notice]) : req.path === "Notifications('NF1')/Lodestar.MarkRead" ? { ...notice, readAt: NOW } : undefined)) });
    expect(await screen.findByText(/reefer not cooling · reefer 9 °C · flagged at Bay P5, 13:15 · Goods back in the cold room/)).toBeInTheDocument();
    expect(view.calls.find(c => c.path === 'Notifications')!.query.$filter).toBe("type eq 'VEHICLE_FAULT'");
    fireEvent.click(await screen.findByTestId('approve-send'));
    await waitFor(() => expect(posts(view.calls).map(c => c.path)).toEqual(["AgentRuns('RUN1')/Lodestar.Resume", "Notifications('NF1')/Lodestar.MarkRead"]));
  });

  it('a draft asked for before the vehicle went down is not this re-plan', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'RUN1');
    renderLive(<RePlan />, { handler: handler(req => (req.path === "AgentRuns('RUN1')" ? { ...run, createdAt: '2026-04-06T07:00:00.000Z' } : undefined)) });
    expect(await screen.findByTestId('draft-replan')).toBeInTheDocument();
    expect(screen.queryByTestId('approve-send')).not.toBeInTheDocument();
  });

  it('no vehicle down: an empty state', async () => {
    renderLive(<RePlan />, { handler: handler(req => (req.path === 'Vehicles' ? page([]) : undefined)) });
    expect(await screen.findByText('No vehicle is down')).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------------------------ entry points

describe('DSP-13 opens the P5 screens', () => {
  const fault = {
    id: 'NF1', recipientId: 'u-d', tripId: 'T62', type: 'VEHICLE_FAULT', channel: 'WEBSOCKET', sentAt: '2026-04-06T07:45:00.000Z', readAt: null,
    payload: { title: 'VEHT6 cannot depart: reefer not cooling', vehicleId: 'VEHT6', tripId: 'T62', bay: 'P5' },
  };
  const conflict = { id: 'E4', driverId: 'u-drv', tripId: 'TRT1', eventType: 'POD_SAVE', payload: { orderId: 'ORDT9' }, savedAt: LOST_AT, syncedAt: '2026-04-06T07:40:00.000Z', conflictResolved: true, conflictNote: 'Provisional deferral reversed', trip: { vehicleId: 'VEHT57' } };
  const handler = (req: FakeRequest) => base(req) ?? (
    req.path === 'Notifications' && req.query.$filter?.startsWith('readAt eq null') ? page([fault])
      : req.path === 'OfflineEvents' ? page([conflict])
        : page([]));

  it('a vehicle fault opens DSP-B1 on that vehicle; a sync conflict opens DSP-A2 on that trip', async () => {
    const view = renderLive(<ExceptionsInbox />, { handler });
    expect(await screen.findAllByText('VEHT6 cannot depart: reefer not cooling')).not.toHaveLength(0);
    const sync = view.calls.find(c => c.path === 'OfflineEvents')!;
    expect(sync.query.$filter).toContain('conflictNote ne null');
    fireEvent.click(document.querySelector('[data-exception="note:NF1"]')!);
    fireEvent.click(await screen.findByTestId('open-p5'));
    expect(window.sessionStorage.getItem('lodestar.focus.vehicle')).toBe('VEHT6');
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-b1-re-plan-diff');

    fireEvent.click(document.querySelector('[data-exception="sync:TRT1"]')!);
    await waitFor(() => expect(screen.getByTestId('open-p5')).toHaveTextContent('Reconcile'));
    fireEvent.click(screen.getByTestId('open-p5'));
    expect(window.sessionStorage.getItem('lodestar.focus.trip')).toBe('TRT1');
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-a2-reconcile-conflict');
  });
});
