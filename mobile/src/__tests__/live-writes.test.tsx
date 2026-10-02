/* eslint-disable @typescript-eslint/no-require-imports */
// Writes from the Dock, Run, Store and Plan live screens against a mocked OData client.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { network } from '@/offline/network';
import { client, queue, routes, signInAs } from './fake-platform';

jest.mock('@/model/platform', () => require('./fake-platform'));
jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
  makeRedirectUri: () => 'lodestar://auth/callback',
  ResponseType: { Code: 'code' },
  Prompt: { Login: 'login' },
}));

const params = (require('expo-router') as { __params: Record<string, string> }).__params;
const push = router.push as jest.Mock;

const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', windowOpen: '05:30', windowClose: '08:00' };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: '2026-04-07T00:00:00.000Z', brand: 'FRESH', district: 'Hills', status: 'LOADING', planVersion: 3, tripNumber: 1, bay: 'B2',
  vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED' }, driver: { id: 'u-d', name: 'Test Driver' }, loadRecord: { id: 'LR-1', tripId: 'T-1', bay: 'B2', reeferTempC: 3, shortfalls: [] },
};
const stop = { id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'PLANNED', outlet, order: { id: 'O-1', units: 4, tempClass: 'CHILLED', status: 'PLANNED' }, pod: null };

beforeEach(() => {
  routes.clear();
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  client.action.mockReset();
  client.action.mockResolvedValue({});
  network.set({ online: true, since: new Date().toISOString() });
});

describe('LD-04 release vehicle', () => {
  it('queues Trips Release with the seal and opens the handover', async () => {
    await signInAs({ sub: 'u-ld04', name: 'Test Loader', realm_access: { roles: ['loader'] }, depot: ['KANDY'] });
    params.trip = 'T-1';
    routes.set("Trips('T-1')", trip);
    routes.set('TripStops', [stop]);
    routes.set('OrderLineItems', [{ id: 'L-1', orderId: 'O-1', name: 'Milk', qty: 4, kg: 4, tempClass: 'CHILLED' }]);
    const Screen = require('@/live/ld-04-release-vehicle').default;
    await render(<Screen />);
    await fireEvent.changeText(await screen.findByTestId('seal-input'), 'SEAL-TEST-1');
    await fireEvent.press(screen.getByTestId('lk-L10'));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'ld-15-handover-confirmed', trip: 'T-1' } }));
    const rel = queue.list().find(i => i.sub === 'u-ld04' && i.kind === 'RELEASE');
    expect(rel).toMatchObject({ tripId: 'T-1', payload: { tripId: 'T-1', sealNumber: 'SEAL-TEST-1', bay: 'B2' } });
  });
});

describe('DR-A3 sync queue', () => {
  it('lists the outbox and "Send now" pushes it through OfflineEvents/Lodestar.PushBatch', async () => {
    await signInAs({ sub: 'u-dra3', name: 'Test Driver', realm_access: { roles: ['driver'] }, vehicle_id: 'VAN-T9' });
    const a = await queue.enqueue('ARRIVAL', { sub: 'u-dra3', tripId: 'T-1', ref: 'S-1', label: 'Arrival · Hill Store', payload: { stopSeq: 1, time: new Date().toISOString(), stopId: 'S-1' } });
    const p = await queue.enqueue('POD_SAVE', { sub: 'u-dra3', tripId: 'T-1', ref: 'S-1', label: 'POD · O-1', payload: { orderId: 'O-1', units: 4, unitsOrdered: 4, stopId: 'S-1' } });
    client.action.mockImplementation(async (path: string, body?: any) =>
      path === 'OfflineEvents/Lodestar.PushBatch' ? { results: body.events.map((e: any) => ({ id: e.id, eventType: e.eventType, status: 'APPLIED' })) } : {},
    );
    const Screen = require('@/live/dr-a3-sync-queue').default;
    await render(<Screen />);
    expect(screen.getByTestId('outbox-waiting').props.children).toBe('2 waiting');
    expect(screen.getByTestId('outbox-row-0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('send-now'));
    await waitFor(() => expect(screen.getByTestId('outbox-waiting').props.children).toBe('0 waiting'));
    const [path, body] = client.action.mock.calls[0] as [string, { events: { id: string }[] }];
    expect(path).toBe('OfflineEvents/Lodestar.PushBatch');
    expect(body.events.map(e => e.id)).toEqual([a.id, p.id]);
  });
});

describe('SM-03 confirm receipt', () => {
  it('queues the counted receipt for the order (Orders ConfirmReceipt)', async () => {
    await signInAs({ sub: 'u-sm03', name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
    params.order = 'O-1';
    const order = { id: 'O-1', outletId: 'OUT-T1', runDate: '2026-04-07T00:00:00.000Z', orderedAt: '2026-04-06T09:00:00.000Z', brand: 'FRESH', tempClass: 'CHILLED', units: 4, kg: 4, m3: 0.1, status: 'DELIVERED', lineItems: [], tripStop: null };
    routes.set("Orders('O-1')", order);
    routes.set('Orders', [order]);
    routes.set("Outlets('OUT-T1')", outlet);
    const Screen = require('@/live/sm-03-confirm-receipt-count').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('count-0').props.children).toBe('4'));
    await fireEvent.press(screen.getByTestId('count-0-minus'));
    await fireEvent.press(screen.getByTestId('lk-L17'));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'sm-03-receipt-confirmed', order: 'O-1' } }));
    expect(queue.list().find(i => i.sub === 'u-sm03')).toMatchObject({ kind: 'RECEIPT', payload: { orderId: 'O-1', unitsReceived: 3, unitsExpected: 4 } });
  });
});

describe('SM-17 deferral notice', () => {
  const moved = {
    id: 'O-7', outletId: 'OUT-T1', runDate: '2026-04-08T00:00:00.000Z', orderedAt: '2026-04-06T03:00:00.000Z', brand: 'FRESH', tempClass: 'CHILLED', units: 6, kg: 6, m3: 1.6, status: 'DEFERRED', tripStop: null, outlet,
    deferralLog: { id: 'D-7', orderId: 'O-7', reason: 'CAP_REEFER', score: 22, status: 'CONFIRMED', isProvisional: false, rescheduledDate: '2026-04-08T00:00:00.000Z', notes: 'First slot on Wed', createdAt: '2026-04-06T13:10:00.000Z' },
  };
  const notice = { id: 'N-7', recipientId: 'u-sm17', type: 'ORDER_DEFERRED', channel: 'WEBSOCKET', sentAt: '2026-04-06T13:10:00.000Z', readAt: null, payload: { orderId: 'O-7', reason: 'CAP_REEFER', from: '2026-04-07', rescheduledDate: '2026-04-08' } };
  beforeEach(async () => {
    await signInAs({ sub: 'u-sm17', name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
    routes.set('Orders', [{ ...moved, id: 'O-8', status: 'PLANNED', deferralLog: null }, moved]);
    routes.set("Orders('O-7')", moved);
    routes.set("Outlets('OUT-T1')", outlet);
    routes.set('Notifications', [notice]);
  });

  it('shows the store\'s moved order with its reason, new date and dispatch\'s note, and acknowledges the notice', async () => {
    const Screen = require('@/live/sm-17-deferral-notice-out027').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('deferral-date').props.children).toBe('Wed 8 Apr'));
    expect(screen.getByTestId('deferral-title').props.children).toBe('Chilled order moved');
    expect(screen.getByText(/Reefer space full on Tue 7 Apr/)).toBeTruthy();
    expect(screen.getByText('CAP-REEFER')).toBeTruthy();
    expect(screen.getByText('"First slot on Wed" · dispatch')).toBeTruthy();
    expect(screen.getByText(/1.6 m³ · window 05:30–08:00/)).toBeTruthy();
    expect(client.get).toHaveBeenCalledWith('Orders', 'O-7', { expand: 'lineItems,tripStop,deferralLog,outlet' });
    await fireEvent.press(screen.getByTestId('lk-L92'));
    await waitFor(() => expect(client.action).toHaveBeenCalledWith("Notifications('N-7')/Lodestar.MarkRead", {}));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'sm-21-messages' } }));
  });

  it('a provisional deferral is "at risk", not moved', async () => {
    routes.set("Orders('O-7')", { ...moved, deferralLog: { ...moved.deferralLog, status: 'SUGGESTED', isProvisional: true } });
    const Screen = require('@/live/sm-17-deferral-notice-out027').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('deferral-title').props.children).toBe('Chilled order at risk'));
    expect(screen.getByText('At risk, not cancelled: dispatch will confirm the new day.')).toBeTruthy();
  });

  it('SM-21 opens the deferral notice for the order', async () => {
    const Messages = require('@/live/sm-21-messages').default;
    await render(<Messages />);
    await waitFor(() => expect(screen.getAllByText(/Order O-7/).length).toBeGreaterThan(0));
    await fireEvent.press(screen.getAllByText(/Order O-7/)[0]);
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'sm-17-deferral-notice-out027', order: 'O-7' } }));
  });
});

describe('SM-18 report issue', () => {
  it('saves the issue on the phone; SM-03 credits it and sends it as the receipt note', async () => {
    const { receiptIssues } = require('@/model/store-face');
    receiptIssues.set({});
    await signInAs({ sub: 'u-sm18', name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
    params.order = 'O-2';
    const order = { id: 'O-2', outletId: 'OUT-T1', runDate: '2026-04-07T00:00:00.000Z', orderedAt: '2026-04-06T09:00:00.000Z', brand: 'FRESH', tempClass: 'CHILLED', units: 6, kg: 6, m3: 0.1, status: 'DELIVERED', lineItems: [], tripStop: null };
    routes.set("Orders('O-2')", order);
    routes.set('Orders', [order]);
    routes.set('OrderLineItems', [{ id: 'L-1', orderId: 'O-2', name: 'Whole chicken 1 kg', qty: 6, kg: 6, tempClass: 'CHILLED' }]);
    routes.set("Outlets('OUT-T1')", outlet);

    const Issue = require('@/live/sm-18-report-issue').default;
    const view = await render(<Issue />);
    await waitFor(() => expect(screen.getByTestId('issue-summary').props.children).toBe('1 unit damaged'));
    await fireEvent.press(screen.getByTestId('issue-temperature'));
    await fireEvent.press(screen.getByTestId('issue-plus'));
    await fireEvent.changeText(screen.getByTestId('issue-note'), 'Warm on arrival');
    expect(screen.getByTestId('issue-summary').props.children).toBe('2 units temperature');
    await fireEvent.press(screen.getByTestId('lk-L95'));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'sm-03-confirm-receipt-count', order: 'O-2' } }));
    expect(receiptIssues.get()['O-2']).toEqual({ orderId: 'O-2', kind: 'TEMPERATURE', units: 2, note: 'Warm on arrival' });
    await view.unmount();

    const Count = require('@/live/sm-03-confirm-receipt-count').default;
    await render(<Count />);
    await waitFor(() => expect(screen.getByTestId('count-0').props.children).toBe('4'));
    await fireEvent.press(screen.getByTestId('lk-L17'));
    await waitFor(() => expect(queue.list().find(i => i.sub === 'u-sm18')).toBeTruthy());
    expect(queue.list().find(i => i.sub === 'u-sm18')).toMatchObject({
      kind: 'RECEIPT',
      payload: { orderId: 'O-2', unitsReceived: 4, unitsExpected: 6, note: '2 short at receipt · Temperature · 2 units: Warm on arrival' },
    });
    expect(receiptIssues.get()['O-2']).toBeUndefined();
  });
});

describe('DSP-28 approve re-plan', () => {
  const plan = { id: 'PLAN-T-v4', depot: 'KANDY', runDate: '2026-04-07T00:00:00.000Z', version: 4, status: 'NEEDS_APPROVAL', source: 'AGENT', createdAt: '2026-04-06T22:00:00.000Z', summary: null };

  it('approves with Plans Approve (a human dispatcher, online only)', async () => {
    await signInAs({ sub: 'u-dsp28', name: 'Test Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });
    routes.set('Plans', [plan]);
    routes.set("Plans('PLAN-T-v4')", plan);
    const Screen = require('@/live/dsp-28-approve-re-plan').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('plan-title').props.children).toContain('v4'));
    await fireEvent.press(screen.getByTestId('lk-L180'));
    await waitFor(() => expect(client.action).toHaveBeenCalledWith("Plans('PLAN-T-v4')/Lodestar.Approve", {}));
  });

  it('a plan with rule violations needs an override reason, sent as overrideReason', async () => {
    await signInAs({ sub: 'u-dsp28c', name: 'Test Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });
    const bad = { ...plan, summary: { violations: [{ rule: 'weight', tripId: 'T-1', vehicleId: 'VAN-T9', orderIds: ['O-1'], reason: 'Over weight' }] } };
    routes.set('Plans', [bad]);
    routes.set("Plans('PLAN-T-v4')", bad);
    const Screen = require('@/live/dsp-28-approve-re-plan').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('plan-title').props.children).toContain('v4'));
    expect(screen.getByText('1 rule violation')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('override-reason'), '  ');
    await fireEvent.press(screen.getByTestId('lk-L180'));
    expect(await screen.findByText('Give a reason to override the rule violations')).toBeTruthy();
    expect(client.action).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('override-reason'), 'Scale reads high ');
    await fireEvent.press(screen.getByTestId('lk-L180'));
    await waitFor(() => expect(client.action).toHaveBeenCalledWith("Plans('PLAN-T-v4')/Lodestar.Approve", { overrideReason: 'Scale reads high' }));
  });

  it('refuses to approve without signal', async () => {
    await signInAs({ sub: 'u-dsp28b', name: 'Test Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });
    routes.set('Plans', [plan]);
    routes.set("Plans('PLAN-T-v4')", plan);
    const Screen = require('@/live/dsp-28-approve-re-plan').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('plan-title').props.children).toContain('v4'));
    await act(async () => network.set({ online: false, since: new Date().toISOString() }));
    await fireEvent.press(screen.getByTestId('lk-L180'));
    expect(await screen.findByText('Approving needs signal')).toBeTruthy();
    expect(client.action).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
