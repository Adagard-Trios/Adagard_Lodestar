/* eslint-disable @typescript-eslint/no-require-imports */
// WP7: the driver's field reports made live (pre-trip check, store code, report a problem, damaged goods, reefer
// alert, report a delay). Every write is a queued outbox record (STATUS_CHANGE report or POD). Synthetic fixtures only.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
const opened = (key: string, extra: Record<string, string> = {}) => ({ pathname: '/s/[key]', params: { ...extra, key } });

const RUN = '2026-04-07';
const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', dockType: 'REAR', windowOpen: '05:30', windowClose: '08:00' };
const outletB = { ...outlet, id: 'OUT-T2', name: 'Lake Store', windowClose: '07:45' };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, brand: 'FRESH', district: 'Hills', status: 'ENROUTE', planVersion: 2, tripNumber: 1, bay: 'B2',
  departTime: `${RUN}T00:10:00.000Z`, sealNumber: 'SEAL-T1', vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED' },
  loadRecord: { id: 'LR-1', tripId: 'T-1', loaderId: 'u-ld', bay: 'B2', reeferTempC: 3, loadedAt: `${RUN}T00:00:00.000Z`, shortfalls: [] },
};
const stops = [
  { id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z`, outlet, order: { id: 'O-1', units: 10, tempClass: 'CHILLED', status: 'ENROUTE' }, pod: null },
  { id: 'S-2', tripId: 'T-1', orderId: 'O-2', outletId: 'OUT-T2', stopSeq: 2, status: 'PLANNED', etaModel: `${RUN}T01:55:00.000Z`, outlet: outletB, order: { id: 'O-2', units: 6, tempClass: 'CHILLED', status: 'PLANNED' }, pod: null },
];
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9' });
const reports = (sub: string) => queue.list().filter(i => i.sub === sub && i.kind === 'STATUS_CHANGE').map(i => i.payload);

beforeEach(() => {
  routes.clear();
  routes.set('Trips', [trip]);
  routes.set('TripStops', stops);
  routes.set('OrderLineItems', [{ id: 'L-1', orderId: 'O-1', name: 'Yoghurt cups', qty: 6, kg: 6, tempClass: 'CHILLED' }, { id: 'L-2', orderId: 'O-1', name: 'Milk', qty: 4, kg: 14, tempClass: 'CHILLED' }]);
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  client.action.mockReset();
  client.action.mockResolvedValue({});
  network.set({ online: false, since: new Date().toISOString() });
});

describe('Driver reports', () => {
  it('DR-12 pre-trip check: ticks and the reefer reading are queued as VEHICLE_CHECK, then DR-13', async () => {
    await signInAs(driver('u-dr12'));
    const Screen = require('@/live/dr-12-pre-trip-vehicle-check').default;
    await render(<Screen />);
    expect(await screen.findByText('VAN-T9')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('reefer-reading'), '3');
    for (const k of ['reefer', 'seal', 'fuel', 'tyres', 'lights']) await fireEvent.press(screen.getByTestId(`check-${k}`));
    expect(screen.getByTestId('checks-done').props.children).toBe('5 of 5 done');
    await fireEvent.press(screen.getByTestId('lk-L240'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-13-saving-run-for-offline')));
    expect(reports('u-dr12')[0]).toMatchObject({ report: 'VEHICLE_CHECK', ok: true });
  });

  it('DR-16 store code: only today\'s code matches; confirm saves the POD and goes to the next stop', async () => {
    await signInAs(driver('u-dr16'));
    params.stop = 'S-1';
    params.units = '8';
    const { dailyStoreCode } = require('@/model/field-reports');
    const { today } = require('@/model/hooks');
    const code: string = dailyStoreCode('OUT-T1', today());
    const Screen = require('@/live/dr-16-store-code-entry').default;
    await render(<Screen />);
    expect(await screen.findByText('OUT-T1')).toBeTruthy();
    expect(screen.getByText('Offline')).toBeTruthy();
    for (const d of code) await fireEvent.press(screen.getByTestId(`key-${d}`));
    expect(await screen.findByTestId('code-match')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L258'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-19-stop-2-arrival-hawa-eliya', { stop: 'S-2' })));
    const pod = queue.list().find(i => i.sub === 'u-dr16' && i.kind === 'POD_SAVE');
    expect(pod?.payload).toMatchObject({ units: 8, unitsOrdered: 10, receiverName: `Store code ${code}` });
    expect(reports('u-dr16')[0]).toMatchObject({ report: 'STORE_CODE', stopId: 'S-1', code });
  });

  it('DR-17 report a problem: a store closed is queued and the driver is back at the stop', async () => {
    await signInAs(driver('u-dr17'));
    params.stop = 'S-1';
    const Screen = require('@/live/dr-17-report-a-problem').default;
    await render(<Screen />);
    expect(await screen.findByText('Stop 1 · Hill Store')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('problem-STORE_CLOSED'));
    await fireEvent.press(screen.getByTestId('lk-L253'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-02-stop-arrival', { stop: 'S-1' })));
    expect(reports('u-dr17')[0]).toMatchObject({ report: 'PROBLEM', problem: 'STORE_CLOSED', stopId: 'S-1', orderId: 'O-1' });
  });

  it('DR-18 damaged goods: the count is queued and carried back to the POD', async () => {
    await signInAs(driver('u-dr18'));
    params.stop = 'S-1';
    const Screen = require('@/live/dr-18-problem-detail-damaged-goods').default;
    await render(<Screen />);
    expect(await screen.findByText('Yoghurt cups')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('damage-plus'));
    expect(screen.getByTestId('damage-units').props.children).toBe('2');
    await fireEvent.press(screen.getByTestId('lk-L255'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-03-proof-of-delivery', { stop: 'S-1', damaged: '2', item: 'Yoghurt cups', note: '2 × Yoghurt cups damaged' })));
    expect(reports('u-dr18')[0]).toMatchObject({ report: 'PROBLEM', problem: 'DAMAGED_GOODS', units: 2, photo: false });
  });

  it('DR-37 reefer alert: the typed reading is queued as REEFER_TEMP, then driving mode', async () => {
    await signInAs(driver('u-dr37'));
    const Screen = require('@/live/dr-37-reefer-temperature-alert').default;
    await render(<Screen />);
    expect(await screen.findByText('VAN-T9')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('reefer-reading'), '6');
    expect(await screen.findByText('Too warm')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L247'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-36-en-route-driving-mode')));
    expect(reports('u-dr37')[0]).toMatchObject({ report: 'REEFER_TEMP', tempC: 6, action: 'CHECKED_STILL_WARM' });
  });

  it('DR-38 report a delay: reason and minutes for the current stop are queued, then driving mode', async () => {
    await signInAs(driver('u-dr38'));
    const Screen = require('@/live/dr-38-report-a-delay').default;
    await render(<Screen />);
    expect(await screen.findByText('On the way to stop 1 ·')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('reason-TRAFFIC'));
    await fireEvent.press(screen.getByTestId('delay-plus'));
    expect(screen.getByTestId('delay-minutes').props.children).toBe('+15');
    await fireEvent.press(screen.getByTestId('lk-L249'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-36-en-route-driving-mode')));
    expect(reports('u-dr38')[0]).toMatchObject({ report: 'DELAY', reason: 'TRAFFIC', minutes: 15, stopId: 'S-1' });
  });
});
