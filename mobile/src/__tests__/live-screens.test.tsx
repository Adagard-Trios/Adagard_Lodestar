/* eslint-disable @typescript-eslint/no-require-imports */
// Live screens against a mocked OData client: real data in the design layout, writes queued in the
// outbox, prototype links still navigating.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { network } from '@/offline/network';
import { client, queue, routes, session, signInAs } from './fake-platform';
import { draw } from './signature-draw';

jest.mock('@/model/platform', () => require('./fake-platform'));
jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [{ codeVerifier: 'v' }, null, jest.fn(async () => ({ type: 'dismiss' }))],
  makeRedirectUri: () => 'lodestar://auth/callback',
  exchangeCodeAsync: jest.fn(),
  ResponseType: { Code: 'code' },
  Prompt: { Login: 'login' },
}));

const params = (require('expo-router') as { __params: Record<string, string> }).__params;
const push = router.push as jest.Mock;

// Synthetic fixtures (not competition data).
const outletA = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', accessNote: 'Use the side lane' };
const outletB = { ...outletA, id: 'OUT-T2', name: 'Lake Store', windowOpen: '04:00', windowClose: '07:45' };
const trip = { id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: '2026-04-07T00:00:00.000Z', brand: 'FRESH', district: 'Hills', status: 'ENROUTE', planVersion: 3, tripNumber: 1, bay: 'B2', departTime: '2026-04-06T22:10:00.000Z', loadRecord: { id: 'LR-1', tripId: 'T-1', bay: 'B2', shortfalls: [] }, vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED' } };
const stops = [
  { id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'ENROUTE', etaModel: '2026-04-07T01:05:00.000Z', etaPlan: '2026-04-07T00:01:00.000Z', lateRiskPct: 10, outlet: outletA, order: { id: 'O-1', units: 34, tempClass: 'CHILLED', status: 'ENROUTE' }, pod: null },
  { id: 'S-2', tripId: 'T-1', orderId: 'O-2', outletId: 'OUT-T2', stopSeq: 2, status: 'PLANNED', etaModel: '2026-04-07T01:55:00.000Z', outlet: outletB, order: { id: 'O-2', units: 20, tempClass: 'AMBIENT', status: 'PLANNED' }, pod: null },
];
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9', device_id: 'DEV-T' });

beforeEach(() => {
  routes.clear();
  routes.set('Trips', [trip]);
  routes.set('TripStops', stops);
  routes.set('OrderLineItems', [{ id: 'L-1', orderId: 'O-1', name: 'Yoghurt cups', qty: 24, kg: 2, tempClass: 'CHILLED' }]);
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  client.action.mockClear();
  network.set({ online: true, since: new Date().toISOString() });
});

describe('DR-01 today\'s run', () => {
  it('shows the driver\'s trip and stops from Trips + TripStops', async () => {
    await signInAs(driver('u-dr01'));
    const Screen = require('@/live/dr-01-today-s-run').default;
    await render(<Screen />);
    expect(await screen.findByText('Hill Store')).toBeTruthy();
    expect(screen.getByText('Lake Store')).toBeTruthy();
    expect(screen.getByTestId('run-day').props.children).toContain('VAN-T9');
    expect(screen.getByText('Trip 1 · Fresh · Hills')).toBeTruthy();
    expect(screen.getByText(/Test/)).toBeTruthy(); // greeting with the first name
    // the trip filter is the run day, scoped by the token (no vehicle filter in the client)
    const tripsQuery = client.all.mock.calls.find(c => c[0] === 'Trips')?.[1] as { filter: string };
    expect(tripsQuery.filter).toMatch(/runDate ge \d{4}-\d{2}-\d{2}T00:00:00Z/);
    // the prototype links stay
    expect(screen.getByTestId('lk-L12')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('stop-2'));
    expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'dr-02-stop-arrival', stop: 'S-2' } });
  });

  it('renders without a session (design preview) and keeps prototype navigation', async () => {
    await act(() => session.signOut());
    const Screen = require('@/live/dr-01-today-s-run').default;
    await render(<Screen />);
    expect(screen.getByText('Sign in to see your run')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L12'));
    expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'dr-36-en-route-driving-mode' } });
  });
});

describe('DR-02 stop arrival', () => {
  it('reads the stop aloud from real data and queues the arrival (TripStops Arrive)', async () => {
    await signInAs(driver('u-dr02'));
    params.stop = 'S-1';
    const Screen = require('@/live/dr-02-stop-arrival').default;
    await render(<Screen />);
    expect(await screen.findByText('Hill Store')).toBeTruthy();
    expect(screen.getByText('Stop 1 of 2')).toBeTruthy();
    const speech = require('expo-speech');
    await fireEvent.press(screen.getByTestId('lk-L252'));
    expect(speech.speak.mock.calls.at(-1)[0]).toContain('Hill Store, OUT-T1');
    await fireEvent.press(screen.getByTestId('lk-L14'));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'dr-03-proof-of-delivery', stop: 'S-1' } }));
    const arrival = queue.list().find(i => i.kind === 'ARRIVAL' && i.ref === 'S-1' && i.sub === 'u-dr02');
    expect(arrival).toMatchObject({ tripId: 'T-1', payload: { stopSeq: 1 } });
  });
});

describe('DR-03 proof of delivery', () => {
  it('completes the stop with the POD while offline: queued, then the offline POD screen', async () => {
    await signInAs(driver('u-dr03'));
    params.stop = 'S-1';
    const Screen = require('@/live/dr-03-proof-of-delivery').default;
    await render(<Screen />);
    expect(await screen.findByText('Yoghurt cups')).toBeTruthy();
    await act(async () => network.set({ online: false, since: new Date().toISOString() }));
    await fireEvent.press(screen.getByTestId('units-minus'));
    await fireEvent.changeText(screen.getByTestId('receiver-name'), 'R. Receiver');
    // Complete stop waits for the receiver's signature (or the store code, DR-16)
    push.mockClear();
    await fireEvent.press(screen.getByTestId('lk-L15'));
    expect(await screen.findByText(/Ask the receiver to sign/)).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect(queue.list().filter(i => i.sub === 'u-dr03')).toHaveLength(0);
    await draw('signature-pad', [[20, 50], [60, 20], [120, 55], [200, 30]]);
    await fireEvent.press(screen.getByTestId('lk-L15'));
    await waitFor(() => expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'dr-a2-pod-saved-offline', stop: 'S-1' } }));
    const sig = queue.list().find(i => i.sub === 'u-dr03' && i.kind === 'POD_PHOTO')!;
    expect(sig.payload).toMatchObject({ kind: 'SIGNATURE', stopId: 'S-1', mime: 'image/svg+xml', signedBy: 'R. Receiver' });
    const mine = queue.list().filter(i => i.sub === 'u-dr03' && i.kind !== 'POD_PHOTO');
    // no arrival was recorded for S-1 yet, so it is saved first; all three wait for signal
    expect(mine.map(i => i.kind)).toEqual(['ARRIVAL', 'POD_SAVE', 'LEAVE']);
    expect(mine.every(i => i.status === 'pending')).toBe(true);
    // saved with no signal: the store is told it was recorded offline when it syncs (SM-A1)
    expect(mine[1].payload).toMatchObject({ orderId: 'O-1', units: 33, unitsOrdered: 34, receiverName: 'R. Receiver', offline: true });
    expect(client.action).not.toHaveBeenCalled();
  });

  it('a POD saved with signal is not marked offline', async () => {
    await signInAs(driver('u-dr03b'));
    const { completeStop } = require('@/model/actions');
    await completeStop({ ...stops[0], arrivalActual: '2026-04-07T01:00:00.000Z' }, { unitsDelivered: 34, unitsOrdered: 34 });
    const pod = queue.list().find(i => i.sub === 'u-dr03b' && i.kind === 'POD_SAVE')!;
    expect(pod.payload).toMatchObject({ orderId: 'O-1', units: 34 });
    expect(pod.payload).not.toHaveProperty('offline');
  });
});

describe('LD-01 dock queue', () => {
  it('lists the bay queue from Trips/Lodestar.BayQueue for the loader\'s depot', async () => {
    await signInAs({ sub: 'u-ld01', name: 'Test Loader', realm_access: { roles: ['loader'] }, depot: ['KANDY'], device_id: 'DEV-L' });
    routes.set('Trips/Lodestar.BayQueue', [{ ...trip, status: 'LOADING', stops: [{ stopSeq: 1 }, { stopSeq: 2 }] }, { ...trip, id: 'T-2', vehicleId: 'TRK-T4', bay: 'B3', status: 'PLANNED', stops: [] }]);
    const Screen = require('@/live/ld-01-dock-queue').default;
    await render(<Screen />);
    expect(await screen.findByText('Kandy Hub')).toBeTruthy(); // the depot's name from the registry (Depots)
    expect(screen.getByTestId('next-vehicle').props.children).toBe('VAN-T9');
    expect(screen.getByText('TRK-T4')).toBeTruthy();
    expect(client.fn.mock.calls.some(c => /^Trips\/Lodestar\.BayQueue\(depot='KANDY',runDate=\d{4}-\d{2}-\d{2}\)$/.test(c[0]))).toBe(true);
    await fireEvent.press(screen.getByTestId('bay-row-1'));
    expect(push).toHaveBeenCalledWith({ pathname: '/s/[key]', params: { key: 'ld-02-load-sheet', trip: 'T-2' } });
  });
});

describe('Sign-in entry and access problems', () => {
  it('DR-06 shows this phone\'s device id and why the last session ended', async () => {
    await signInAs(driver('u-dr06'));
    await act(() => session.handleUnauthorized({ message: 'Device is revoked' }));
    const Screen = require('@/live/dr-06-sign-in').default;
    await render(<Screen />);
    expect((await screen.findByTestId('device-id')).props.children).toContain('DEV-TEST-0001');
    expect(screen.getByTestId('sign-in-note').props.children).toMatch(/removed from Lodestar/);
    expect(screen.getByTestId('lk-L229')).toBeTruthy();
  });
});
