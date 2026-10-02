// Live Plan screens made live in WP6: DSP-05 Capacity outlook, DSP-09 Order detail drawer, DSP-11 Trip and
// vehicle drawer, DSP-14 Notifications panel, plus the parents passing the opened order (DSP-01, DSP-18). Real
// ODataClient over a fake fetch: assertions on requests are at the HTTP level. Date is frozen at Mon 6 Apr 2026
// 13:30 (Colombo).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ScreenShell from '@/components/ScreenShell';
import CutoffQueue from '@/live/dsp-01-cutoff-queue';
import CapacityOutlook from '@/live/dsp-05-capacity-outlook';
import OrderDrawer from '@/live/dsp-09-order-detail-drawer';
import TripDrawer from '@/live/dsp-11-trip-and-vehicle-drawer';
import NotificationsPanel from '@/live/dsp-14-notifications-panel';
import OutletProfile from '@/live/dsp-18-outlet-profile';
import { freezeDate, unfreeze } from './helpers/clock';
import type { FakeRequest } from './helpers/live';
import { agentConfigReply, page, renderLive } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan' }));

const NOW = '2026-04-06T08:00:00.000Z';
const DAY = '2026-04-07T00:00:00.000Z';
const outlet = (id: string, over = {}) => ({ id, name: `Outlet ${id.slice(-3)}`, brand: 'FRESH', district: 'District T', depot: 'PELIYAGODA', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '03:00', windowClose: '08:00', isActive: true, ...over });
const order = (id: string, over = {}) => ({ id, outletId: 'OUTT01', runDate: DAY, orderedAt: '2026-04-04T08:40:00.000Z', brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 338, m3: 1.5, status: 'RECEIVED', deferredYesterday: false, daysSince: 1, ...over });
const vehicle = (id: string, over = {}) => ({ id, depot: 'PELIYAGODA', type: 'TRUCK', tempClass: 'CHILLED', capacityKg: 3990, capacityM3: 21.1, kmPerLitre: 6, weeklyLFuel: 610, usedLThisWeek: 419, status: 'AVAILABLE', ...over });
const err = (status: number, message: string, code = 'Failed') => ({ status, body: { error: { code, message } } });
const nav = (links: Record<string, string>) => ({ links: Object.fromEntries(Object.entries(links).map(([k, href]) => [k, { href, kind: 'go' }])) });
const posts = (calls: FakeRequest[]) => calls.filter(c => c.method === 'POST');

/** Reads every Plan screen makes: sidebar counts and the latest run date. */
function base(req: FakeRequest) {
  if (agentConfigReply(req)) return agentConfigReply(req);
  if (req.query.$top === '0') return page([], 0);
  // no open orders from today on (the test day is past): the desk falls back to the latest plan's run date
  if (req.path === 'Orders' && req.query.$select === 'runDate') return page([]);
  if (req.path === 'Plans' && req.query.$select === 'runDate') return page([{ runDate: DAY }]);
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/plan');
  freezeDate(NOW);
});
afterEach(unfreeze);

// ------------------------------------------------------------------------------------------------ DSP-05

describe('DSP-05 Capacity outlook', () => {
  const week = (i: number, over = {}) => ({
    week: `W${15 + i}`, weekStart: `2026-04-${String(6 + i * 7).padStart(2, '0')}`, operatingDays: 6, estimatedChilledDemandM3: 200, estimatedTotalM3: 600,
    reeferVehiclesAvailable: 4, reeferCapacityM3: 100, hasPayday: false, festival: null, ...over,
  });
  const outlooks: Record<string, unknown> = {
    // W15 at Peliyagoda: 400 m³ ÷ 25 m³ a trip = 16 trips needed, 1 reefer × 2 × 6 = 12 available → −4
    PELIYAGODA: { depot: 'PELIYAGODA', weeks: [week(0, { estimatedChilledDemandM3: 400, reeferVehiclesAvailable: 1, reeferCapacityM3: 25, festival: 'New Year' }), week(1, { operatingDays: 4, hasPayday: true })] },
    KANDY: { depot: 'KANDY', weeks: [week(0, { estimatedChilledDemandM3: 100, estimatedTotalM3: 300 }), week(1)] },
  };
  const fnDepot = (path: string) => /^Plans\/Lodestar\.CapacityOutlook\(depot='(\w+)'\)$/.exec(path)?.[1];
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => (req: FakeRequest) => base(req) ?? over(req) ?? (
    fnDepot(req.path) ? outlooks[fnDepot(req.path)!]
      : req.path === 'Vehicles' ? page([{ id: 'VEHT4', depot: 'PELIYAGODA' }])
        : page([]));

  it('asks the planning service for each depot in view and shows the tightest week, the chart and the weekly table', async () => {
    const view = renderLive(<CapacityOutlook />, { handler: handler() });
    const kpi = await screen.findByTestId('peak-week');
    expect(kpi).toHaveTextContent('Peak week · W15 · Peliyagoda');
    expect(kpi).toHaveTextContent('−4trips');
    expect(kpi).toHaveTextContent('16 reefer trips needed vs 12 available (1 × 2 × 6, VEHT4 out).');
    expect(kpi).toHaveTextContent('About 100 m³ chilled would be deferred.');
    expect(view.calls.filter(c => fnDepot(c.path)).map(c => fnDepot(c.path))).toEqual(['PELIYAGODA', 'KANDY']);
    expect(view.calls.find(c => c.path === 'Vehicles')!.query.$filter).toBe("tempClass eq 'CHILLED' and status eq 'WORKSHOP' and depot in ('PELIYAGODA','KANDY')");

    const table = screen.getByTestId('outlook-table');
    expect(table.querySelectorAll('[data-week]')).toHaveLength(4);
    const bad = table.querySelector('[data-week="W15"][data-depot="PELIYAGODA"]') as HTMLElement;
    expect(bad).toHaveClass('is-bad');
    expect(within(bad).getByText('16 / 12')).toBeInTheDocument();
    expect(within(bad).getByText('−4 trips')).toBeInTheDocument();
    expect(within(bad).getByText('New Year')).toBeInTheDocument();
    const short = table.querySelector('[data-week="W16"][data-depot="PELIYAGODA"]') as HTMLElement;
    expect(within(short).getByText('Payday')).toBeInTheDocument();
    expect(within(short).getByText('4 op days')).toBeInTheDocument();

    const chart = screen.getByTestId('outlook-chart');
    expect(within(chart as unknown as HTMLElement).getByText('Peliyagoda reefer trip headroom (available minus needed)')).toBeInTheDocument();
    expect(within(chart as unknown as HTMLElement).getByText('W15')).toHaveAttribute('fill', '#B42318');
    // no brand split, 80% band or hire recommendation: the service has no data for them
    expect(screen.queryByText('Fresh')).not.toBeInTheDocument();
    expect(screen.queryByText('80% band')).not.toBeInTheDocument();
    expect(screen.queryByText('Create hire request')).not.toBeInTheDocument();
  });

  it('the depot chips narrow the outlook to one depot', async () => {
    const view = renderLive(<CapacityOutlook />, { handler: handler() });
    await screen.findByTestId('peak-week');
    fireEvent.click(screen.getAllByRole('button', { name: 'Kandy Hub' }).find(el => el.classList.contains('d-filter'))!);
    await waitFor(() => expect(screen.getByTestId('peak-week')).toHaveTextContent('Peak week · W16 · Kandy Hub'));
    expect(window.sessionStorage.getItem('lodestar.depot')).toBe('KANDY');
    expect(view.calls.filter(c => fnDepot(c.path) === 'KANDY').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('outlook-table').querySelectorAll('[data-week]')).toHaveLength(2);
  });

  it('shows the error when the planning service fails', async () => {
    renderLive(<CapacityOutlook />, { handler: handler(req => (fnDepot(req.path) ? err(503, 'Planning is down') : undefined)) });
    expect(await screen.findByRole('alert')).toHaveTextContent('Planning is down');
    expect(screen.queryByTestId('peak-week')).not.toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------------------------ DSP-09

describe('DSP-09 Order detail drawer', () => {
  const lines = Array.from({ length: 5 }, (_, i) => ({ id: `L${i}`, orderId: 'ORDT1', name: `Line item ${i + 1}`, qty: i + 2, kg: 10, tempClass: i < 4 ? 'CHILLED' : 'AMBIENT' }));
  const theOrder = order('ORDT1', {
    status: 'PLANNED', deferredYesterday: true, deferralScore: 91, outlet: outlet('OUTT01', { name: 'Waypoint Fresh Test', dockType: 'STREET' }), lineItems: lines,
    tripStop: { id: 'S3', tripId: 'TRPT1', orderId: 'ORDT1', outletId: 'OUTT01', stopSeq: 3, status: 'PLANNED', serviceMinPredicted: 16, trip: { id: 'TRPT1', vehicleId: 'VEHT6', tripNumber: 1, planVersion: 3, planId: 'PLANT1' } },
    deferralLog: null,
  });
  const prior = { id: 'D1', orderId: 'ORDT0', reason: 'CAP_REEFER', score: 70, isProvisional: false, status: 'CONFIRMED', createdAt: '2026-04-04T12:18:00.000Z', confirmedAt: '2026-04-04T12:18:00.000Z', order: { runDate: '2026-04-06T00:00:00.000Z' } };
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => (req: FakeRequest) => base(req) ?? over(req) ?? (
    req.path === "Orders('ORDT1')" ? theOrder
      : req.path === "Plans('PLANT1')" ? { id: 'PLANT1', status: 'NEEDS_APPROVAL', version: 3, createdAt: '2026-04-06T10:50:00.000Z' }
        : req.path === 'Deferrals' ? page([prior])
          : req.path === 'Orders' && req.query.$filter?.includes("status eq 'DELIVERED'") ? page([{ id: 'ORDT9', runDate: '2026-04-04T00:00:00.000Z' }])
            : req.path === 'Orders' ? page([{ id: 'ORDT1' }])
              : req.path.startsWith('ServiceAllowances(') ? { brand: 'FRESH', dockType: 'STREET', minutes: 15 }
                : req.path === "DistrictTravel('District T')" ? { district: 'District T', depotToDistMin: 37 }
                  : page([]));
  const shell = (ui: React.ReactElement) => (
    <ScreenShell board="P2" nav={{ links: { ...nav({ L153: '/plan/dsp-02-plan-board', L154: '/plan/dsp-18-outlet-profile' }).links, C: { href: '/plan/dsp-01-cutoff-queue', kind: 'back' } } }} live>{ui}</ScreenShell>
  );

  it('shows the opened order: the skip guard, the order thread, lines, outlet access and history', async () => {
    window.sessionStorage.setItem('lodestar.focus.order', 'ORDT1');
    const view = renderLive(shell(<OrderDrawer />), { handler: handler() });
    const drawer = await screen.findByTestId('order-drawer');
    expect(await within(drawer).findByText('Waypoint Fresh Test')).toBeInTheDocument();
    expect(drawer).toHaveTextContent('ORDT1');
    expect(drawer).toHaveTextContent('Store app');
    const get = view.calls.find(c => c.path === "Orders('ORDT1')")!;
    expect(get.query.$expand).toBe('outlet,lineItems,tripStop($expand=trip),deferralLog');

    const guard = await screen.findByTestId('protected');
    await waitFor(() => expect(guard).toHaveTextContent("Deferred on the Mon 6 Apr run (CAP-REEFER). Deferring again needs a manager's reason."));
    expect(guard).toHaveTextContent('91');
    expect(view.calls.find(c => c.path === 'Deferrals' && c.query.$filter?.includes('order/outletId'))!.query.$filter).toBe("order/outletId eq 'OUTT01' and orderId ne 'ORDT1'");

    const thread = screen.getByTestId('thread');
    await waitFor(() => expect(thread.querySelector('[data-step="Deferred"]')).toHaveAttribute('data-state', 'warn'));
    expect(thread.querySelector('[data-step="Received"]')).toHaveAttribute('data-state', 'ok');
    expect(thread.querySelector('[data-step="Planned"]')).toHaveAttribute('data-state', 'now');
    expect(thread.querySelector('[data-step="Loaded"]')).toHaveAttribute('data-state', 'todo');
    expect(thread.querySelector('[data-step="Delivered"]')).toHaveTextContent('by 08:00');
    expect(await screen.findByText('Planned in draft v3')).toBeInTheDocument();

    // four lines, "All" shows the rest
    expect(screen.getByText('5 lines')).toBeInTheDocument();
    expect(screen.getByTestId('lines').children).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByTestId('lines').children).toHaveLength(5);

    expect(screen.getByText('Street, normal')).toBeInTheDocument();
    expect(screen.getByText('03:00–08:00')).toBeInTheDocument();
    expect(screen.getByText('16 min')).toBeInTheDocument();
    expect(await screen.findByText('37 min')).toBeInTheDocument();
    expect(await screen.findByText('Last delivered Sat 4 Apr')).toBeInTheDocument();
    const history = screen.getByTestId('history');
    expect(history).toHaveTextContent('Planned on VEHT6 Trip 1, stop 3, draft v3');
    expect(history).toHaveTextContent('Deferred from Mon run · CAP-REEFER');
    expect(history).toHaveTextContent('Received from the store app, 5 lines');
    expect(screen.queryByText('Message store')).not.toBeInTheDocument();

    // the outlet profile opens this order's outlet
    fireEvent.click(screen.getByText('Outlet profile'));
    expect(window.sessionStorage.getItem('lodestar.focus.outlet')).toBe('OUTT01');
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-18-outlet-profile');
    fireEvent.click(screen.getByText('Open on plan board'));
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-02-plan-board');
  });

  it('without an opened order it shows the first order of the queue', async () => {
    const view = renderLive(<OrderDrawer />, { handler: handler() });
    expect(await screen.findByText('Waypoint Fresh Test')).toBeInTheDocument();
    const first = view.calls.find(c => c.path === 'Orders' && c.query.$top === '1' && c.query.$select === 'id')!;
    expect(first.query).toMatchObject({ $select: 'id', $orderby: 'deferredYesterday desc,deferralScore desc,id' });
    expect(first.query.$filter).toContain("status ne 'CANCELLED'");
  });

  it('shows the error when the order cannot be read', async () => {
    window.sessionStorage.setItem('lodestar.focus.order', 'ORDT1');
    renderLive(<OrderDrawer />, { handler: handler(req => (req.path === "Orders('ORDT1')" ? err(404, 'Order not found', 'NotFound') : undefined)) });
    expect(await screen.findByRole('alert')).toHaveTextContent('Order not found');
  });

  it('a cutoff queue row and the outlet profile’s order record the order they open', async () => {
    const q = (req: FakeRequest) => base(req) ?? (req.path === 'Orders' ? page([order('ORDT5', { outlet: outlet('OUTT01') })], 1) : page([]));
    const first = renderLive(<ScreenShell board="P2" nav={nav({ L150: '/plan/dsp-09-order-detail-drawer' })} live><CutoffQueue /></ScreenShell>, { handler: q });
    const queue = await screen.findByTestId('queue');
    fireEvent.click(queue.querySelector('[data-order="ORDT5"]')!);
    expect(window.sessionStorage.getItem('lodestar.focus.order')).toBe('ORDT5');
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-09-order-detail-drawer');
    first.unmount();

    window.sessionStorage.setItem('lodestar.focus.outlet', 'OUTT01');
    const p = (req: FakeRequest) => base(req) ?? (
      req.path === "Outlets('OUTT01')" ? outlet('OUTT01')
        : req.path === 'Orders' ? page([order('ORDT7', { status: 'PLANNED' })])
          : page([]));
    renderLive(<ScreenShell board="P2" nav={nav({ L169: '/plan/dsp-09-order-detail-drawer' })} live><OutletProfile /></ScreenShell>, { handler: p });
    fireEvent.click(await screen.findByText('ORDT7'));
    expect(window.sessionStorage.getItem('lodestar.focus.order')).toBe('ORDT7');
  });
});

// ------------------------------------------------------------------------------------------------ DSP-11

describe('DSP-11 Trip and vehicle drawer', () => {
  const stop = (seq: number, outletId: string, over = {}) => ({
    id: `S${seq}`, tripId: 'TRPT1', orderId: `ORD${seq}`, outletId, stopSeq: seq, status: 'PLANNED', serviceMinPredicted: 15,
    etaPlan: `2026-04-06T22:${String(24 + seq * 23).padStart(2, '0')}:00.000Z`, outlet: outlet(outletId), order: { id: `ORD${seq}`, kg: 400, m3: 1.8 }, ...over,
  });
  const trip1 = {
    id: 'TRPT1', vehicleId: 'VEHT2', depot: 'PELIYAGODA', runDate: DAY, brand: 'FRESH', district: 'District T', status: 'PLANNED', planVersion: 3, tripNumber: 1,
    departTime: '2026-04-06T22:00:00.000Z', returnTime: '2026-04-07T00:13:00.000Z', planMinutes: 109, bay: 'P2',
    vehicle: vehicle('VEHT2'), plan: { status: 'NEEDS_APPROVAL', version: 3 },
    stops: [stop(2, 'OUTT06', { outlet: outlet('OUTT06', { dockType: 'STREET' }) }), stop(1, 'OUTT11')],
  };
  const trip2 = { id: 'TRPT2', vehicleId: 'VEHT2', depot: 'PELIYAGODA', runDate: DAY, brand: 'FRESH', district: 'District U', status: 'PLANNED', planVersion: 3, tripNumber: 2, planMinutes: 100, stops: [{ id: 'X1', outletId: 'OUTT20' }, { id: 'X2', outletId: 'OUTT21' }, { id: 'X3', outletId: 'OUTT22' }] };
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => (req: FakeRequest) => base(req) ?? over(req) ?? (
    req.path === "Trips('TRPT1')" ? trip1
      : req.path === "Trips('TRPT2')" ? { ...trip1, ...trip2, vehicle: trip1.vehicle, plan: trip1.plan, stops: [] }
        : req.path === 'Trips' && req.query.$top === '1' ? page([{ id: 'TRPT1' }])
          : req.path === 'Trips' ? page([trip1, trip2])
            : req.path === "DistrictTravel('District T')" ? { district: 'District T', depotToDistMin: 24, interStopMin: 8 }
              : page([]));

  it('shows the opened trip: the vehicle’s minutes, load, fuel, the stops in sequence and the load order', async () => {
    window.sessionStorage.setItem('lodestar.focus.trip', 'TRPT1');
    const view = renderLive(<TripDrawer />, { handler: handler() });
    const drawer = await screen.findByTestId('trip-drawer');
    expect(await within(drawer).findByText('VEHT2 · Trip 1')).toBeInTheDocument();
    expect(drawer).toHaveTextContent('Reefer truck');
    expect(drawer).toHaveTextContent('Fresh · District T');
    expect(drawer).toHaveTextContent('Peliyagoda DC');
    expect(drawer).toHaveTextContent('draft v3');
    expect(view.calls.find(c => c.path === "Trips('TRPT1')")!.query.$expand).toBe('vehicle,plan($select=status,version),stops($expand=outlet,order($select=id,kg,m3))');

    await waitFor(() => expect(screen.getByTestId('minutes')).toHaveTextContent('209/ 270 min'));
    expect(screen.getByText('61 min spare')).toBeInTheDocument();
    expect(view.calls.find(c => c.path === 'Trips' && c.query.$filter?.startsWith("vehicleId eq 'VEHT2'"))).toBeTruthy();
    expect(screen.getByText('800 / 3,990 kg')).toBeInTheDocument();
    expect(screen.getByText('3.6 / 21.1 m³')).toBeInTheDocument();
    expect(screen.getByText('419 / 610 L')).toBeInTheDocument();

    expect(screen.getByText('2 stops in sequence')).toBeInTheDocument();
    expect(await screen.findByText('24 drive + 1 × 8 between + 30 service = 62 min')).toBeInTheDocument();
    const stops = screen.getByTestId('stops');
    expect([...stops.querySelectorAll('[data-stop]')].map(s => s.getAttribute('data-stop'))).toEqual(['S1', 'S2']);
    expect(stops).toHaveTextContent('Peliyagoda DC · bay P2');
    expect(stops).toHaveTextContent('Back at Peliyagoda, reload for Trip 2');
    expect(stops).toHaveTextContent('Trip 2 Fresh · District U, 3 stops, 100 min');
    expect(screen.getByTestId('load-order').textContent).toBe('OUTT06 → OUTT11');
    // the designed footer: "Lock this trip" returns to the plan board (L157)
    expect(screen.getByText('Lock this trip').closest('[data-lk]')).toHaveAttribute('data-lk', 'L157');
    expect(screen.getByText('Swap vehicle')).toBeInTheDocument();
  });

  it('the trip tabs switch to the vehicle’s other trip', async () => {
    window.sessionStorage.setItem('lodestar.focus.trip', 'TRPT1');
    const view = renderLive(<TripDrawer />, { handler: handler() });
    fireEvent.click(await screen.findByRole('tab', { name: 'Trip 2 · District U' }));
    expect(window.sessionStorage.getItem('lodestar.focus.trip')).toBe('TRPT2');
    expect(await screen.findByText('VEHT2 · Trip 2')).toBeInTheDocument();
    expect(view.calls.some(c => c.path === "Trips('TRPT2')")).toBe(true);
  });

  it('without an opened trip it shows the run date’s first departing trip', async () => {
    const view = renderLive(<TripDrawer />, { handler: handler() });
    expect(await screen.findByText('VEHT2 · Trip 1')).toBeInTheDocument();
    const first = view.calls.find(c => c.path === 'Trips' && c.query.$top === '1')!;
    expect(first.query).toMatchObject({ $select: 'id', $orderby: 'departTime,vehicleId,tripNumber' });
  });

  it('says so when the run date has no trips', async () => {
    renderLive(<TripDrawer />, { handler: handler(req => (req.path === 'Trips' ? page([]) : undefined)) });
    expect(await screen.findByText('No trip selected')).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------------------------ DSP-14

describe('DSP-14 Notifications panel', () => {
  const note = (id: string, type: string, over = {}) => ({ id, recipientId: 'u-d', type, channel: 'WEBSOCKET', payload: {}, sentAt: '2026-04-06T05:00:00.000Z', readAt: null, ...over });
  const notes = [
    note('N1', 'DOCK_BLOCKED', { payload: { title: 'OUTT09 rear dock blocked', vehicleId: 'VEHT2' }, sentAt: '2026-04-06T05:35:00.000Z' }),
    note('N2', 'PLAN_PUBLISHED', { payload: { message: 'Plan v3 approved' }, sentAt: '2026-04-06T05:25:00.000Z' }),
    note('N3', 'SIGNAL_LOST', { payload: { vehicleId: 'VEHT7', location: 'Above Ramboda' }, readAt: '2026-04-06T05:10:00.000Z', sentAt: '2026-04-06T05:08:00.000Z' }),
    note('N4', 'SHORTFALL_ACK', { payload: { orderId: 'ORDT4' }, readAt: '2026-04-06T04:00:00.000Z', sentAt: '2026-04-05T13:10:00.000Z' }),
  ];
  const handler = (over: (req: FakeRequest) => unknown = () => undefined) => (req: FakeRequest) => base(req) ?? over(req) ?? (
    req.path === 'Notifications' ? page(notes)
      : req.method === 'POST' ? { id: 'x' } : page([]));
  const shell = (ui: React.ReactElement) => (
    <ScreenShell board="P2" nav={{ links: { ...nav({ L56: '/plan/dsp-13-exceptions-inbox', L57: '/plan/dsp-20-settings' }).links, C: { href: '/plan/dsp-08-today-overview', kind: 'back' } } }} live>{ui}</ScreenShell>
  );

  it('lists the dispatcher’s notifications, new first, with tabs and links to the inbox', async () => {
    const view = renderLive(shell(<NotificationsPanel />), { handler: handler() });
    expect(await screen.findByText('OUTT09 rear dock blocked')).toBeInTheDocument();
    expect(view.calls.find(c => c.path === 'Notifications')!.query).toMatchObject({ $orderby: 'sentAt desc', $top: '50' });
    expect(screen.getByTestId('unread')).toHaveTextContent('2 new');
    expect(screen.getByRole('tab', { name: 'All 4' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Needs you 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Plans 1' })).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Earlier')).toBeInTheDocument();
    expect(screen.getByText('Plan v3 approved')).toBeInTheDocument();
    expect(screen.getByText('VEHT7 · Above Ramboda')).toBeInTheDocument();
    expect(screen.getByText('11:05')).toBeInTheDocument();
    expect(screen.getByText('Sun 6:40 PM')).toBeInTheDocument();

    const alert = document.querySelector('[data-notification="N1"]') as HTMLElement;
    expect(alert).toHaveAttribute('data-lk', 'L56');
    expect(document.querySelector('[data-notification="N2"]')).not.toHaveAttribute('data-lk');
    fireEvent.click(alert);
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-13-exceptions-inbox');

    fireEvent.click(screen.getByRole('tab', { name: 'Needs you 1' }));
    expect(document.querySelectorAll('[data-notification]')).toHaveLength(1);
    // the footer opens the dispatcher's alert rules in DSP-20 (L57)
    fireEvent.click(screen.getByText('Alert rules'));
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-20-settings');
  });

  it('“Mark all read” marks each unread notification read and reloads', async () => {
    const view = renderLive(<NotificationsPanel />, { handler: handler() });
    await screen.findByText('OUTT09 rear dock blocked');
    const before = view.calls.filter(c => c.path === 'Notifications').length;
    fireEvent.click(screen.getByTestId('mark-all-read'));
    await waitFor(() => expect(posts(view.calls).map(c => c.path)).toEqual(["Notifications('N1')/Lodestar.MarkRead", "Notifications('N2')/Lodestar.MarkRead"]));
    await waitFor(() => expect(view.calls.filter(c => c.path === 'Notifications').length).toBeGreaterThan(before));
  });

  it('reloads on a realtime notification', async () => {
    const view = renderLive(<NotificationsPanel />, { handler: handler() });
    await screen.findByText('OUTT09 rear dock blocked');
    const before = view.calls.filter(c => c.path === 'Notifications').length;
    view.hub.emit('notification', {});
    await waitFor(() => expect(view.calls.filter(c => c.path === 'Notifications').length).toBeGreaterThan(before));
  });

  it('empty and error states', async () => {
    const empty = renderLive(<NotificationsPanel />, { handler: handler(req => (req.path === 'Notifications' ? page([]) : undefined)) });
    expect(await screen.findByText('No notifications')).toBeInTheDocument();
    expect(screen.getByTestId('unread')).toHaveTextContent('Nothing new');
    expect(screen.queryByTestId('mark-all-read')).not.toBeInTheDocument();
    empty.unmount();
    renderLive(<NotificationsPanel />, { handler: handler(req => (req.path === 'Notifications' ? err(503, 'Notifications are down') : undefined)) });
    expect(await screen.findByRole('alert')).toHaveTextContent('Notifications are down');
  });
});
