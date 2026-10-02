/* eslint-disable @typescript-eslint/no-require-imports */
// WP6: the field screens made live from their design boards (store order detail and receipt, route, POD record,
// shift summaries, flag acknowledged, empty queue, plans), the P5 degradation flows (dead zone SM-A1, reefer down
// LD-B1 → LD-14 → SM-B1), and the links to screens that are not built. Synthetic fixtures only.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { network } from '@/offline/network';
import { notices } from '@/realtime/notices';
import { runMarks } from '@/model/run';
import { client, queue, routes, signInAs, sync } from './fake-platform';

jest.mock('@/model/platform', () => require('./fake-platform'));
jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
  makeRedirectUri: () => 'lodestar://auth/callback',
  ResponseType: { Code: 'code' },
  Prompt: { Login: 'login' },
}));

const params = (require('expo-router') as { __params: Record<string, string> }).__params;
const push = router.push as jest.Mock;
const replace = router.replace as jest.Mock;
const opened = (key: string, extra: Record<string, string> = {}) => ({ pathname: '/s/[key]', params: { ...extra, key } });

const RUN = '2026-04-07';
const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', dockType: 'REAR', windowOpen: '05:30', windowClose: '08:00', lat: 7.1, lng: 80.7 };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, brand: 'FRESH', district: 'Hills', status: 'LOADING', planVersion: 2, tripNumber: 1, bay: 'B2',
  departTime: `${RUN}T00:10:00.000Z`, vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED', usedLThisWeek: 120, weeklyLFuel: 400 },
  loadRecord: { id: 'LR-1', tripId: 'T-1', loaderId: 'u-ld', bay: 'B2', shortfalls: [] },
};
const stop = { id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z`, etaPlan: `${RUN}T00:50:00.000Z`, outlet, order: { id: 'O-1', units: 10, m3: 0.4, kg: 20, tempClass: 'CHILLED', status: 'ENROUTE' }, pod: null };
const order = { id: 'O-1', outletId: 'OUT-T1', runDate: `${RUN}T00:00:00.000Z`, orderedAt: `${RUN}T09:00:00.000Z`, brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 20, m3: 0.4, status: 'ENROUTE', tripStop: { id: 'S-1', tripId: 'T-1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z` }, lineItems: [{ id: 'L-1', orderId: 'O-1', name: 'Yoghurt cups', qty: 6, kg: 6, tempClass: 'CHILLED' }, { id: 'L-2', orderId: 'O-1', name: 'Milk', qty: 4, kg: 14, tempClass: 'CHILLED' }] };
const store = (sub: string) => ({ sub, name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9' });
const loader = (sub: string) => ({ sub, name: 'Test Loader', realm_access: { roles: ['loader'] }, depot: ['KANDY'] });
const dispatcher = (sub: string) => ({ sub, name: 'Test Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });

beforeEach(() => {
  routes.clear();
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  replace.mockClear();
  client.action.mockReset();
  client.action.mockResolvedValue({});
  notices.set([]);
  network.set({ online: true, since: new Date().toISOString() });
});

describe('Store', () => {
  beforeEach(() => {
    routes.set("Outlets('OUT-T1')", outlet);
    routes.set('Orders', [order]);
    routes.set("Orders('O-1')", order);
    routes.set("Trips('T-1')", trip);
  });

  it('SM-15 order detail: the order, its trip and the shortfall from SHORTFALL_FLAGGED, no depot call button', async () => {
    await signInAs(store('u-sm15'));
    params.order = 'O-1';
    routes.set('Notifications', [{ id: 'N-1', recipientId: 'u-sm15', type: 'SHORTFALL_FLAGGED', channel: 'WEBSOCKET', sentAt: `${RUN}T00:01:00.000Z`, payload: { orderId: 'O-1', item: 'Yoghurt cups', qtyOrdered: 6, qtyLoaded: 4, short: 2, reason: 'OUT_OF_STOCK' } }]);
    const Screen = require('@/live/sm-15-order-detail').default;
    await render(<Screen />);
    expect((await screen.findByTestId('order-id')).props.children).toContain('O-1');
    await waitFor(() => expect(screen.getByTestId('units').props.children[0]).toBe('8'));
    expect(screen.getByText('On the van · VAN-T9')).toBeTruthy();
    expect(screen.queryByText(/Call /)).toBeNull();
    await fireEvent.press(screen.getByTestId('lk-L90'));
    expect(push).toHaveBeenCalledWith(opened('sm-02-order-status-and-eta', { order: 'O-1' }));
  });

  it('SM-01 received: the run date\'s orders, including one still on the phone', async () => {
    await signInAs(store('u-sm01'));
    params.runDate = RUN;
    network.set({ online: false, since: new Date().toISOString() });
    await queue.enqueue('ORDER', { sub: 'u-sm01', ref: `order-${RUN}`, label: 'Order', payload: { order: { runDate: RUN, tempClass: 'AMBIENT', units: 5, kg: 10, m3: 0.1 } } });
    const Screen = require('@/live/sm-01-received').default;
    await render(<Screen />);
    expect(await screen.findByText('Saved on this phone')).toBeTruthy();
    expect(screen.getByTestId('received-heading').props.children).toMatch(/saved on this phone/);
  });

  it('SM-A1 in progress, low signal: a signal_lost notice for the order\'s trip pauses updates', async () => {
    await signInAs(store('u-sma1'));
    params.order = 'O-1';
    await act(async () => { notices.set([{ id: 'sl-1', event: 'signal_lost', type: 'SIGNAL_LOST', at: `${RUN}T00:40:00.000Z`, payload: { tripId: 'T-1', vehicleId: 'VAN-T9' } }]); });
    const Screen = require('@/live/sm-a1-store-in-progress-low-signal').default;
    await render(<Screen />);
    expect(await screen.findByTestId('updates-paused')).toBeTruthy();
    expect(screen.getByTestId('a1-heading').props.children).toBe('Delivery in progress');
    await fireEvent.press(screen.getByTestId('lk-L27'));
    expect(push).toHaveBeenCalledWith(opened('sm-03-confirm-receipt-count', { order: 'O-1' }));
  });

  it('SM-02 opens SM-A1 while the van of an undelivered order has no signal', async () => {
    await signInAs(store('u-sm02a1'));
    params.order = 'O-1';
    await act(async () => { notices.set([{ id: 'sl-2', event: 'signal_lost', type: 'SIGNAL_LOST', at: `${RUN}T00:40:00.000Z`, payload: { tripId: 'T-1' } }]); });
    const Screen = require('@/live/sm-02-order-status-and-eta').default;
    await render(<Screen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(opened('sm-a1-store-in-progress-low-signal', { order: 'O-1', trip: 'T-1' })));
  });

  it('SM-A1 recorded offline: delivered time from the POD, synced time from POD_RECORDED_OFFLINE', async () => {
    await signInAs(store('u-sma1b'));
    params.order = 'O-1';
    routes.set('Orders', [{ ...order, status: 'DELIVERED' }]);
    routes.set('PODs', [{ id: 'P-1', tripStopId: 'S-1', unitsDelivered: 10, unitsOrdered: 10, savedOffline: true, savedAt: `${RUN}T01:03:00.000Z`, receiverName: 'R. Test', tripStop: { id: 'S-1', orderId: 'O-1', tripId: 'T-1', stopSeq: 1 } }]);
    routes.set('Notifications', [{ id: 'N-2', recipientId: 'u-sma1b', type: 'POD_RECORDED_OFFLINE', channel: 'WEBSOCKET', sentAt: `${RUN}T03:10:00.000Z`, payload: { orderId: 'O-1', savedAt: `${RUN}T01:03:00.000Z`, syncedAt: `${RUN}T03:10:00.000Z` } }]);
    const Screen = require('@/live/sm-a1-store-recorded-offline').default;
    await render(<Screen />);
    expect(await screen.findByText('Recorded offline')).toBeTruthy();
    expect(screen.getByText(/^Synced 8:40\./)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L30'));
    expect(push).toHaveBeenCalledWith(opened('sm-20-credit-note-detail', { order: 'O-1' }));
  });

  it('SM-B1 later arrival: a second plan notice that moves the order is a re-plan', async () => {
    await signInAs(store('u-smb1'));
    routes.set('Notifications', [
      { id: 'N-p2', recipientId: 'u-smb1', type: 'PLAN_PUBLISHED', channel: 'WEBSOCKET', sentAt: `${RUN}T22:17:00.000Z`, payload: { planId: 'PL-2', orders: [{ orderId: 'O-1', tripId: 'T-2', etaModel: `${RUN}T01:50:00.000Z` }] } },
      { id: 'N-p1', recipientId: 'u-smb1', type: 'PLAN_PUBLISHED', channel: 'WEBSOCKET', sentAt: `${RUN}T13:10:00.000Z`, payload: { planId: 'PL-1', orders: [{ orderId: 'O-1', tripId: 'T-1', etaModel: `${RUN}T01:05:00.000Z` }] } },
    ]);
    routes.set("Trips('T-2')", { ...trip, id: 'T-2', vehicleId: 'VAN-T7' });
    params.notice = 'N-p2';
    const Screen = require('@/live/sm-b1-store-later-arrival-notice').default;
    await render(<Screen />);
    expect((await screen.findByTestId('b1-heading')).props.children).toBe('Coming later than usual');
    expect(screen.getByTestId('new-arrival').props.children).toBe('~7:20');
    expect(await screen.findByText('VAN-T7')).toBeTruthy();
  });

  it('SM-21 routes a POD recorded offline to SM-A1', async () => {
    await signInAs(store('u-sm21'));
    routes.set('Notifications', [
      { id: 'N-o', recipientId: 'u-sm21', type: 'POD_RECORDED_OFFLINE', channel: 'WEBSOCKET', sentAt: `${RUN}T03:10:00.000Z`, payload: { orderId: 'O-1' } },
    ]);
    const Screen = require('@/live/sm-21-messages').default;
    await render(<Screen />);
    await fireEvent.press(await screen.findByTestId('lk-L100'));
    expect(push).toHaveBeenCalledWith(opened('sm-a1-store-recorded-offline', { order: 'O-1' }));
  });
});

describe('Run', () => {
  beforeEach(() => {
    routes.set('Trips', [{ ...trip, status: 'ENROUTE' }]);
    routes.set('TripStops', [stop]);
  });

  it('DR-15 route overview: the trip\'s stops in order and a Google Maps link from the outlets', async () => {
    await signInAs(driver('u-dr15'));
    const Screen = require('@/live/dr-15-route-overview').default;
    await render(<Screen />);
    expect((await screen.findByTestId('route-trip')).props.children).toBe('Trip 1 · Fresh · Hills');
    expect(screen.getByTestId('route-stop-1')).toBeTruthy();
    const { Linking } = require('react-native');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await fireEvent.press(screen.getByTestId('open-maps'));
    expect(open.mock.calls[0][0]).toContain('destination=7.1%2C80.7');
  });

  it('DR-22 record detail: one POD with its sync state', async () => {
    await signInAs(driver('u-dr22'));
    params.pod = 'P-9';
    routes.set("PODs('P-9')", { id: 'P-9', tripStopId: 'S-1', unitsDelivered: 9, unitsOrdered: 10, savedOffline: false, savedAt: `${RUN}T01:03:00.000Z`, syncedAt: `${RUN}T01:04:00.000Z`, exceptions: [{ type: 'DAMAGED', qty: 1, description: '1 tray crushed' }], tripStop: { id: 'S-1', orderId: 'O-1', tripId: 'T-1', stopSeq: 1 } });
    const Screen = require('@/live/dr-22-record-detail-pod').default;
    await render(<Screen />);
    expect((await screen.findByTestId('pod-sync')).props.children).toBe('Synced 6:34');
    expect(screen.getByText('1 tray crushed')).toBeTruthy();
  });

  it('DR-28 end of shift: stops, orders and the vehicle\'s fuel this week; no made-up distance', async () => {
    await signInAs(driver('u-dr28'));
    const Screen = require('@/live/dr-28-end-of-shift-summary').default;
    await render(<Screen />);
    expect((await screen.findByTestId('shift-stops')).props.children).toBe('1');
    expect(screen.getByText('120 / 400 L')).toBeTruthy();
    expect(screen.queryByText('Distance')).toBeNull();
  });

});

describe('Dock', () => {
  beforeEach(() => {
    routes.set('Trips/Lodestar.BayQueue', [trip]);
    routes.set('Trips', [trip]);
    routes.set("Trips('T-1')", trip);
    routes.set('TripStops', [stop]);
    routes.set('OrderLineItems', order.lineItems);
  });

  it('LD-16 shift summary: released trips, lines and flags of the night', async () => {
    await signInAs(loader('u-ld16'));
    routes.set('Trips/Lodestar.BayQueue', [{ ...trip, status: 'ENROUTE', loadRecord: { ...trip.loadRecord, releasedAt: `${RUN}T00:05:00.000Z` } }]);
    const Screen = require('@/live/ld-16-shift-summary').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('released-count').props.children[0]).toBe('1'));
    expect(await screen.findByTestId('released-0')).toBeTruthy();
    expect(screen.getByText('on time')).toBeTruthy();
  });

  it('LD-03 flag acknowledged: dispatch\'s SHORTFALL_ACK, and the next line opens the scan (LD-10)', async () => {
    await signInAs(loader('u-ld03a'));
    params.trip = 'T-1';
    params.item = 'Yoghurt cups';
    routes.set("Trips('T-1')", { ...trip, loadRecord: { ...trip.loadRecord, shortfalls: [{ item: 'Yoghurt cups', qtyOrdered: 6, qtyLoaded: 4, reason: 'OUT_OF_STOCK', orderId: 'O-1' }] } });
    routes.set('Notifications', [{ id: 'N-a', recipientId: 'u-ld03a', type: 'SHORTFALL_ACK', channel: 'WEBSOCKET', tripId: 'T-1', sentAt: `${RUN}T00:00:00.000Z`, payload: { tripId: 'T-1', item: 'Yoghurt cups', by: 'Test Dispatcher' } }]);
    const Screen = require('@/live/ld-03-flag-acknowledged').default;
    await render(<Screen />);
    expect((await screen.findByTestId('ack-line')).props.children).toBe('Acknowledged by Test Dispatcher (dispatch) 5:30');
    expect(screen.getByTestId('accounted').props.children[0]).toBe('1');
    await fireEvent.press(screen.getByTestId('tick-next'));
    expect(push).toHaveBeenCalledWith(opened('ld-10-scan-a-line', { trip: 'T-1', line: 'L-2' }));
  });

  it('LD-19 empty queue: other bays still loading, "Help load" opens that trip', async () => {
    await signInAs(loader('u-ld19'));
    routes.set('Trips/Lodestar.BayQueue', [
      { ...trip, status: 'ENROUTE', loadRecord: { ...trip.loadRecord, loaderId: 'u-ld19', releasedAt: `${RUN}T00:05:00.000Z` } },
      { ...trip, id: 'T-3', vehicleId: 'VAN-T3', bay: 'B4', status: 'LOADING', loadRecord: null },
    ]);
    const Screen = require('@/live/ld-19-empty-queue').default;
    await render(<Screen />);
    expect((await screen.findByTestId('queue-empty')).props.children).toBe('Your queue is empty');
    await fireEvent.press(await screen.findByTestId('help-load'));
    expect(push).toHaveBeenCalledWith(opened('ld-18-plan-locked', { trip: 'T-3' }));
  });

  it('LD-B1: the loader reports the reefer through the outbox; it goes as Trips ReportVehicleFault with the reading typed in', async () => {
    await signInAs(loader('u-ldb1'));
    params.trip = 'T-1';
    const Screen = require('@/live/ld-b1-vehicle-can-t-depart').default;
    await render(<Screen />);
    expect(await screen.findByText('VAN-T9')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('reefer-reading'), '9');
    await fireEvent.press(screen.getByTestId('fault-DOOR_SEAL'));
    await fireEvent.press(screen.getByTestId('notify-dispatch'));
    const item = queue.list().find(i => i.sub === 'u-ldb1' && i.kind === 'VEHICLE_FAULT');
    expect(item).toMatchObject({ tripId: 'T-1', payload: { tripId: 'T-1', fault: 'DOOR_SEAL', reeferTempC: 9 } });
    await act(() => sync.flush());
    expect(client.action).toHaveBeenCalledWith("Trips('T-1')/Lodestar.ReportVehicleFault", { fault: 'DOOR_SEAL', reeferTempC: 9 }, { idempotencyKey: item!.id });
    expect(await screen.findByText(/^Dispatch notified /)).toBeTruthy();
  });

  it('LD-B1 with no signal: the report is saved on the phone and shown as queued, nothing is sent yet', async () => {
    await signInAs(loader('u-ldb1o'));
    params.trip = 'T-1';
    const Screen = require('@/live/ld-b1-vehicle-can-t-depart').default;
    await render(<Screen />);
    expect(await screen.findByText('VAN-T9')).toBeTruthy();
    // the dock Wi-Fi drops after the trip opened
    await act(async () => { network.set({ online: false, since: new Date().toISOString() }); });
    await fireEvent.press(screen.getByTestId('notify-dispatch'));
    expect(await screen.findByText(/sends when signal is back/)).toBeTruthy();
    expect(queue.list().find(i => i.sub === 'u-ldb1o' && i.kind === 'VEHICLE_FAULT')).toMatchObject({ status: 'pending', payload: { fault: 'NOT_COOLING' } });
    await act(() => sync.flush());
    expect(client.action).not.toHaveBeenCalled();
  });

  it('LD-01 opens LD-14 when dispatch publishes a re-plan for the depot', async () => {
    await signInAs(loader('u-ld14'));
    const Screen = require('@/live/ld-01-dock-queue').default;
    await render(<Screen />);
    await screen.findByTestId('lk-L190');
    await act(async () => { notices.set([{ id: 'pp-1', event: 'plan_published', type: 'PLAN_PUBLISHED', at: new Date().toISOString(), payload: { planId: 'PLG-T-v2', depot: 'KANDY', supersededTrips: 1 } }]); });
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('ld-14-re-plan-received', { plan: 'PLG-T-v2' })));
  });

  it('LD-14 re-plan received: the vehicle in the workshop and where the goods go', async () => {
    await signInAs(loader('u-ld14b'));
    params.plan = 'PLG-T-v2';
    routes.set("Plans('PLG-T-v2')", { id: 'PLG-T-v2', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, version: 2, status: 'PUBLISHED', source: 'AGENT', createdAt: `${RUN}T22:15:00.000Z`, publishedAt: `${RUN}T22:17:00.000Z` });
    routes.set('Vehicles', [{ id: 'VAN-T9', depot: 'KANDY', status: 'WORKSHOP', workshopNote: 'Not cooling' }]);
    routes.set('Trips', [{ ...trip, id: 'T-2', vehicleId: 'VAN-T7', status: 'PLANNED' }]);
    routes.set('TripStops', [{ ...stop, id: 'S-2', tripId: 'T-2' }]);
    const Screen = require('@/live/ld-14-re-plan-received').default;
    await render(<Screen />);
    expect((await screen.findByTestId('replan-at')).props.children).toBe('Dispatch re-planned 3:47');
    expect(await screen.findByTestId('goes-0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L33'));
    expect(replace).toHaveBeenCalledWith(opened('ld-01-dock-queue'));
  });

});

describe('Plan phone', () => {
  it('DSP-32 plans: the plan in effect per depot with delivered counts, and moved orders', async () => {
    await signInAs(dispatcher('u-dsp32'));
    routes.set('Trips', [{ ...trip, status: 'ENROUTE', stops: [{ ...stop, status: 'DELIVERED' }, { ...stop, id: 'S-x', status: 'ENROUTE' }] }]);
    routes.set('Plans', [{ id: 'PL-1', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, version: 1, status: 'PUBLISHED', source: 'AUTOPLAN', createdAt: `${RUN}T13:00:00.000Z`, approvedAt: `${RUN}T13:10:00.000Z` }]);
    routes.set('Deferrals', [{ id: 'D-1', orderId: 'O-9', reason: 'CAP_REEFER', score: 22, status: 'CONFIRMED', isProvisional: false, createdAt: `${RUN}T13:00:00.000Z`, rescheduledDate: '2026-04-08T00:00:00.000Z', order: { id: 'O-9', outletId: 'OUT-T2' } }]);
    routes.set('Outlets', [{ ...outlet, id: 'OUT-T2', name: 'Lake Store' }]);
    routes.set('Orders', []);
    const Screen = require('@/live/dsp-32-plans').default;
    await render(<Screen />);
    expect((await screen.findByTestId('plans-running')).props.children).toBe('1 plan running');
    expect(await screen.findByText('1/2')).toBeTruthy();
    expect(await screen.findByText('CAP-REEFER · score 22 · store told')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('plan-KANDY'));
    expect(push).toHaveBeenCalledWith(opened('dsp-29-live-routes'));
  });

});

describe('State screens', () => {
  beforeEach(() => {
    routes.set("Outlets('OUT-T1')", outlet);
    routes.set('Trips/Lodestar.BayQueue', [trip]);
    routes.set('Trips', [trip]);
    routes.set("Trips('T-1')", trip);
    routes.set('TripStops', [stop]);
    routes.set('OrderLineItems', order.lineItems);
  });

  it("SM-24 no delivery today: next delivery from the store's orders, ordering stays open", async () => {
    await signInAs(store('u-sm24'));
    routes.set('Orders', [{ ...order, runDate: '2099-01-02T00:00:00.000Z' }]);
    const Screen = require('@/live/sm-24-no-delivery-today').default;
    await render(<Screen />);
    expect((await screen.findByTestId('no-delivery')).props.children).toBe('No delivery today');
    expect(await screen.findByTestId('next-delivery')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L107'));
    expect(push).toHaveBeenCalledWith(opened('sm-13-new-order'));
  });

  it('SM-25 offline draft saved: the orders waiting in the outbox for the run date', async () => {
    await signInAs(store('u-sm25'));
    params.runDate = RUN;
    network.set({ online: false, since: new Date().toISOString() });
    await queue.enqueue('ORDER', { sub: 'u-sm25', ref: `order-${RUN}`, label: 'Order', payload: { order: { runDate: RUN, tempClass: 'CHILLED', units: 7, kg: 9, m3: 0.1 } } });
    const Screen = require('@/live/sm-25-offline-draft-saved').default;
    await render(<Screen />);
    expect(await screen.findByTestId('draft-0')).toBeTruthy();
    expect(screen.getByText('No internet at the store')).toBeTruthy();
  });

  it('LD-12 plan changed: lines whose stop changed between the two versions', async () => {
    await signInAs(loader('u-ld12'));
    params.trip = 'T-1';
    params.plan = 'PL-2';
    routes.set("Plans('PL-2')", { id: 'PL-2', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, version: 3, status: 'PUBLISHED', source: 'MANUAL', createdAt: `${RUN}T22:20:00.000Z`, publishedAt: `${RUN}T22:22:00.000Z` });
    routes.set('Trips', [{ ...trip, id: 'T-1b', planVersion: 3 }]);
    routes.set('TripStops', [{ ...stop, tripId: 'T-1', stopSeq: 1 }, { ...stop, id: 'S-1b', tripId: 'T-1b', stopSeq: 2 }]);
    const Screen = require('@/live/ld-12-plan-changed').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('moved-count').props.children[0]).toBe('2'));
    await fireEvent.press(screen.getByTestId('lk-L202'));
    expect(push).toHaveBeenCalledWith(opened('ld-02-load-sheet', { trip: 'T-1b' }));
  });

  it('LD-18 plan locked: an open re-plan draft locks the sheet', async () => {
    await signInAs(loader('u-ld18'));
    params.trip = 'T-1';
    routes.set('Plans', [{ id: 'PL-3', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, version: 3, status: 'DRAFT', source: 'AGENT', createdAt: `${RUN}T22:21:00.000Z` }]);
    const Screen = require('@/live/ld-18-plan-locked').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('locked-at').props.children).toBe('Sheet locked 3:51'));
  });

  it('LD-23 plan changed (tablet) renders and keeps its designed link', async () => {
    await signInAs(loader('u-ld23'));
    params.trip = 'T-1';
    const Screen = require('@/live/ld-23-plan-changed').default;
    await render(<Screen />);
    expect(await screen.findByTestId('lk-L226')).toBeTruthy();
  });

  it("LD-27 tablet locked: the bay's state while locked", async () => {
    await signInAs(loader('u-ld27'));
    params.trip = 'T-1';
    const Screen = require('@/live/ld-27-tablet-locked').default;
    await render(<Screen />);
    expect((await screen.findByTestId('locked-progress')).props.children).toMatch(/of 2 lines/);
  });

  it('DR-11 load handover: the released trip, and accepting goes on to the vehicle check', async () => {
    await signInAs(driver('u-dr11'));
    params.trip = 'T-1';
    routes.set('Trips', [{ ...trip, status: 'ENROUTE', sealNumber: 'SEAL-T', loadRecord: { ...trip.loadRecord, releasedAt: `${RUN}T00:05:00.000Z` } }]);
    const Screen = require('@/live/dr-11-load-handover-received').default;
    await render(<Screen />);
    expect((await screen.findByTestId('released-line')).props.children).toBe('Released · Bay B2 · 5:35');
    await fireEvent.press(screen.getByTestId('lk-L239'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-12-pre-trip-vehicle-check', { trip: 'T-1' })));
  });

  it('DR-13 saving the run caches run, lines and notices, then opens DR-14', async () => {
    await signInAs(driver('u-dr13'));
    const Screen = require('@/live/dr-13-saving-run-for-offline').default;
    await render(<Screen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(opened('dr-14-run-ready-available-offline', { trip: 'T-1' })));
  });

  it('DR-14 run ready shows what is saved', async () => {
    await signInAs(driver('u-dr14'));
    const Screen = require('@/live/dr-14-run-ready-available-offline').default;
    await render(<Screen />);
    expect((await screen.findByTestId('offline-ready')).props.children).toBe('Available offline');
  });

  it('DR-32 run moved: server records this phone never saved; download opens DR-13', async () => {
    await signInAs(driver('u-dr32'));
    // a new phone: DR-13 above saved T-1 for offline on this (shared, in-memory) device store; the new one has not
    const { kv } = require('@/lib/kv') as typeof import('@/lib/kv');
    await kv.remove('lodestar.run.saved.T-1');
    runMarks.set({});
    routes.set('OfflineEvents', [{ id: 'EV-other', tripId: 'T-1', eventType: 'ARRIVAL', savedAt: `${RUN}T00:30:00.000Z`, syncedAt: `${RUN}T00:36:00.000Z` }]);
    const Screen = require('@/live/dr-32-run-moved-to-a-new-phone').default;
    await render(<Screen />);
    expect((await screen.findByTestId('old-phone')).props.children).toBe('Old phone last synced 6:06');
    await fireEvent.press(screen.getByTestId('lk-L238'));
    expect(push).toHaveBeenCalledWith(opened('dr-13-saving-run-for-offline', { trip: 'T-1' }));
  });
});
