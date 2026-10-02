/* eslint-disable @typescript-eslint/no-require-imports */
// WP7: the voice screens made live (voice and language, voice pack check, deferral notice / load sheet / stop read
// aloud). Speech is expo-speech (mocked in setup: one English voice on the "phone"). Synthetic fixtures only.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { settings } from '@/lib/settings';
import { network } from '@/offline/network';
import { client, routes, signInAs } from './fake-platform';

jest.mock('@/model/platform', () => require('./fake-platform'));
jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
  makeRedirectUri: () => 'lodestar://auth/callback',
  ResponseType: { Code: 'code' },
  Prompt: { Login: 'login' },
}));

const params = (require('expo-router') as { __params: Record<string, string> }).__params;
const push = router.push as jest.Mock;
const speak = Speech.speak as jest.Mock;
const stop = Speech.stop as jest.Mock;
const opened = (key: string, extra: Record<string, string> = {}) => ({ pathname: '/s/[key]', params: { ...extra, key } });

const RUN = '2026-04-07';
const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', dockType: 'REAR', windowOpen: '05:30', windowClose: '08:00' };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, brand: 'FRESH', district: 'Hills', status: 'LOADING', planVersion: 2, tripNumber: 1, bay: 'B2',
  departTime: `${RUN}T00:10:00.000Z`, vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED', capacityKg: 1000, capacityM3: 7 },
  loadRecord: { id: 'LR-1', tripId: 'T-1', loaderId: 'u-ld', bay: 'B2', shortfalls: [] },
};
const stops = [{ id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z`, outlet, order: { id: 'O-1', units: 10, m3: 0.4, kg: 20, tempClass: 'CHILLED', status: 'ENROUTE' }, pod: null }];
const lines = [{ id: 'L-1', orderId: 'O-1', name: 'Yoghurt cups', qty: 6, kg: 6, tempClass: 'CHILLED' }, { id: 'L-2', orderId: 'O-1', name: 'Milk', qty: 4, kg: 14, tempClass: 'CHILLED' }];
const store = (sub: string) => ({ sub, name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9' });
const loader = (sub: string) => ({ sub, name: 'Test Loader', realm_access: { roles: ['loader'] }, depot: ['KANDY'] });

beforeEach(() => {
  routes.clear();
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  speak.mockClear();
  stop.mockClear();
  client.action.mockReset();
  client.action.mockResolvedValue({});
  network.set({ online: true, since: new Date().toISOString() });
  settings.set({ language: 'en', readAloud: true, theme: 'auto' });
  routes.set('Trips/Lodestar.BayQueue', [trip]);
  routes.set('Trips', [trip]);
  routes.set("Trips('T-1')", trip);
  routes.set('TripStops', stops);
  routes.set('OrderLineItems', lines);
});

describe('Voice and language', () => {
  it('SM-37: the language picker and read aloud set the phone settings; Test speaks in that voice', async () => {
    await signInAs(store('u-sm37'));
    const Screen = require('@/live/sm-37-voice-and-language').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lang-ta'));
    expect(settings.get().language).toBe('ta');
    await fireEvent.press(screen.getByTestId('voice-test'));
    expect(speak).toHaveBeenCalledWith('Van arrives between 6:15 and 6:55.', expect.objectContaining({ language: 'ta-IN' }));
    await fireEvent.press(screen.getByTestId('read-aloud-toggle'));
    expect(settings.get().readAloud).toBe(false);
    expect(push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('lk-L116'));
    expect(push).toHaveBeenCalledWith(opened('sm-38-voice-pack-downloading', { lang: 'si' }));
  });

  it('LD-28: picks the voice language, speaks the test line in it, Done returns to the trip\'s load sheet', async () => {
    await signInAs(loader('u-ld28'));
    params.trip = 'T-1';
    const Screen = require('@/live/ld-28-voice-and-language').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lang-si'));
    expect(settings.get().language).toBe('si');
    await fireEvent.press(screen.getByTestId('voice-test'));
    expect(speak).toHaveBeenCalledWith('මෙම හඬ පැහැදිලිව ඇසෙනවාද?', expect.objectContaining({ language: 'si-LK' }));
    await fireEvent.press(screen.getByTestId('lk-L217'));
    expect(push).toHaveBeenCalledWith(opened('ld-02-load-sheet', { trip: 'T-1' }));
  });

  it('DR-33: language and read aloud at stops are saved; the test line opens the stop read aloud', async () => {
    await signInAs(driver('u-dr33'));
    const Screen = require('@/live/dr-33-voice-and-language').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lang-ta'));
    await fireEvent.press(screen.getByTestId('read-aloud-toggle'));
    expect(settings.get()).toMatchObject({ language: 'ta', readAloud: false });
    expect(await screen.findByTestId('read-aloud-off')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L270'));
    expect(push).toHaveBeenCalledWith(opened('dr-35-stop-arrival-speaking'));
  });
});

describe('Voice pack check', () => {
  it('SM-38: checks the phone for the language\'s voice and names it', async () => {
    await signInAs(store('u-sm38'));
    params.lang = 'en';
    const Screen = require('@/live/sm-38-voice-pack-downloading').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('voice-name').props.children).toBe('English (UK) · works offline'));
    expect(screen.getByTestId('voice-state').props.children[0]).toBe('Ready');
    await fireEvent.press(screen.getByTestId('lk-L118'));
    expect(push).toHaveBeenCalledWith(opened('sm-11-today-order-day'));
  });

  it('LD-29: no Tamil voice on the phone: text still works', async () => {
    await signInAs(loader('u-ld29'));
    settings.set(s => ({ ...s, language: 'ta' }));
    const Screen = require('@/live/ld-29-voice-pack-downloading').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('voice-state').props.children[0]).toBe('None'));
    expect(screen.getByText('Voice not downloaded, text still works')).toBeTruthy();
    expect(screen.getByText('1 of 3 ready')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L218'));
    expect(push).toHaveBeenCalledWith(opened('ld-08-quick-tips'));
  });

  it('DR-34: the English voice is ready; skip voice for today turns read aloud off', async () => {
    await signInAs(driver('u-dr34'));
    const Screen = require('@/live/dr-34-voice-pack-downloading').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('voice-state').props.children[0]).toBe('Ready'));
    await fireEvent.press(screen.getByTestId('lk-L280'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-13-saving-run-for-offline')));
    expect(settings.get().readAloud).toBe(false);
  });
});

describe('Read aloud', () => {
  it('SM-39: speaks the moved order\'s notice on open; the speaking bar stops it and returns to the notice', async () => {
    await signInAs(store('u-sm39'));
    const moved = {
      id: 'O-7', outletId: 'OUT-T1', runDate: '2026-04-08T00:00:00.000Z', orderedAt: '2026-04-06T03:00:00.000Z', brand: 'FRESH', tempClass: 'CHILLED', units: 6, kg: 6, m3: 1.6, status: 'DEFERRED', tripStop: null, outlet,
      deferralLog: { id: 'D-7', orderId: 'O-7', reason: 'CAP_REEFER', score: 22, status: 'CONFIRMED', isProvisional: false, rescheduledDate: '2026-04-08T00:00:00.000Z', notes: 'First slot on Wed', createdAt: '2026-04-06T13:10:00.000Z' },
    };
    routes.set('Orders', [moved]);
    routes.set("Orders('O-7')", moved);
    routes.set("Outlets('OUT-T1')", outlet);
    routes.set('Notifications', []);
    params.order = 'O-7';
    const Screen = require('@/live/sm-39-deferral-notice-speaking').default;
    await render(<Screen />);
    await waitFor(() => expect(speak).toHaveBeenCalledWith(expect.stringContaining('your order O-7 is now on Wed 8 Apr'), expect.objectContaining({ language: 'en-GB' })));
    expect(speak.mock.calls[0]![0]).toContain('Reason: Reefer space full');
    await fireEvent.press(screen.getByTestId('lk-L120'));
    expect(stop).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(opened('sm-17-deferral-notice-out027', { order: 'O-7' }));
  });

  it('LD-30: speaks the load sheet (vehicle, bay, lines, next line) and Tick opens the scan for that line', async () => {
    await signInAs(loader('u-ld30'));
    params.trip = 'T-1';
    settings.set(s => ({ ...s, language: 'ta' }));
    const Screen = require('@/live/ld-30-load-sheet-speaking').default;
    await render(<Screen />);
    await waitFor(() => expect(speak).toHaveBeenCalledWith(expect.stringContaining('vehicle VAN-T9, bay B2'), expect.objectContaining({ language: 'ta-IN' })));
    expect(speak.mock.calls[0]![0]).toContain('2 lines for 1 stop');
    await fireEvent.press(screen.getByTestId('lk-L219'));
    expect(push).toHaveBeenCalledWith(opened('ld-10-scan-a-line', { trip: 'T-1', line: 'L-1' }));
  });

  it('DR-35: speaks the current stop on open; Start delivery keeps the stop', async () => {
    await signInAs(driver('u-dr35'));
    params.stop = 'S-1';
    const Screen = require('@/live/dr-35-stop-arrival-speaking').default;
    await render(<Screen />);
    await waitFor(() => expect(speak).toHaveBeenCalledWith(expect.stringContaining('Hill Store, OUT-T1.'), expect.anything()));
    expect(speak.mock.calls[0]![0]).toContain('Window 05:30 to 08:00');
    await fireEvent.press(screen.getByTestId('lk-L282'));
    expect(push).toHaveBeenCalledWith(opened('dr-03-proof-of-delivery', { stop: 'S-1' }));
  });
});
