/* eslint-disable @typescript-eslint/no-require-imports */
// WP7: the daylight driver screens (DR-01, DR-15, DR-28), the night/day setting on DR-24, the store's
// "why this window" sheet (SM-16), the dispatcher's call/SMS sheet (DSP-31) and the connection banner (DR-25).
// Synthetic fixtures only.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { settings } from '@/lib/settings';
import { network } from '@/offline/network';
import { notices } from '@/realtime/notices';
import { routes, signInAs } from './fake-platform';

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
const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', dockType: 'REAR', parking: 'Lane behind the shop', windowOpen: '05:30', windowClose: '08:00', lat: 7.1, lng: 80.7, accessNote: 'Ring the back bell' };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', driverId: 'u-drv', driver: { id: 'u-drv', name: 'Test Driver' }, depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, brand: 'FRESH', district: 'Hills', status: 'ENROUTE', planVersion: 2, tripNumber: 1, bay: 'B2',
  departTime: `${RUN}T00:10:00.000Z`, vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED', usedLThisWeek: 120, weeklyLFuel: 400 },
  loadRecord: { id: 'LR-1', tripId: 'T-1', loaderId: 'u-ld', bay: 'B2', shortfalls: [] },
};
const stop = { id: 'S-1', tripId: 'T-1', orderId: 'O-1', outletId: 'OUT-T1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z`, etaPlan: `${RUN}T00:50:00.000Z`, outlet, order: { id: 'O-1', units: 10, m3: 0.4, kg: 20, tempClass: 'CHILLED', status: 'ENROUTE' }, pod: null };
const order = {
  id: 'O-1', outletId: 'OUT-T1', runDate: `${RUN}T00:00:00.000Z`, orderedAt: `${RUN}T09:00:00.000Z`, brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 20, m3: 0.4, status: 'ENROUTE', outlet,
  tripStop: { id: 'S-1', tripId: 'T-1', stopSeq: 1, status: 'ENROUTE', etaModel: `${RUN}T01:05:00.000Z`, etaPlan: `${RUN}T00:50:00.000Z`, etaModelBandEarly: `${RUN}T00:45:00.000Z`, etaModelBandLate: `${RUN}T01:25:00.000Z`, lateRiskPct: 12, serviceMinPredicted: 12 },
};
const vehicle = { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED', status: 'ACTIVE', depot: 'KANDY', capacityKg: 1000, capacityM3: 7 };
const store = (sub: string) => ({ sub, name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9' });
const dispatcher = (sub: string) => ({ sub, name: 'Nimal Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });

beforeEach(() => {
  routes.clear();
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  replace.mockClear();
  notices.set([]);
  network.set({ online: true, since: new Date().toISOString() });
  settings.set({ language: 'en', readAloud: true, theme: 'auto' });
});

describe('Daylight driver screens', () => {
  beforeEach(() => {
    routes.set('Trips', [trip]);
    routes.set('TripStops', [stop]);
  });

  it('DR-01 daylight: the run and its stops; the first-stop card opens the daylight route', async () => {
    await signInAs(driver('u-dr01d'));
    const Screen = require('@/live/dr-01-today-s-run-daylight').default;
    await render(<Screen />);
    expect(await screen.findByTestId('stop-1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L38'));
    expect(push).toHaveBeenCalledWith(opened('dr-15-route-overview-daylight'));
  });

  it('DR-15 daylight: the trip\'s stops; back goes to the daylight run', async () => {
    await signInAs(driver('u-dr15d'));
    const Screen = require('@/live/dr-15-route-overview-daylight').default;
    await render(<Screen />);
    expect((await screen.findByTestId('route-trip')).props.children).toBe('Trip 1 · Fresh · Hills');
    await fireEvent.press(screen.getByTestId('lk-L39'));
    expect(push).toHaveBeenCalledWith(opened('dr-01-today-s-run-daylight'));
  });

  it('DR-28 daylight: stops and the vehicle\'s fuel this week', async () => {
    await signInAs(driver('u-dr28d'));
    const Screen = require('@/live/dr-28-end-of-shift-summary-daylight').default;
    await render(<Screen />);
    expect((await screen.findByTestId('shift-stops')).props.children).toBe('1');
    expect(screen.getByText('120 / 400 L')).toBeTruthy();
    expect(screen.getByTestId('lk-L22')).toBeTruthy();
  });
});

describe('DR-24 settings', () => {
  it('night or day: Night saves and stays, Day saves and opens the daylight run; language and version shown', async () => {
    await signInAs(driver('u-dr24'));
    settings.set({ language: 'si', readAloud: false, theme: 'auto' });
    const Screen = require('@/live/dr-24-settings-me').default;
    await render(<Screen />);
    expect(screen.getByTestId('me-language').props.children).toBe('සිංහල');
    expect(screen.getByText('Read aloud at stops · off')).toBeTruthy();
    expect(screen.getByTestId('app-version').props.children).toMatch(/^Lodestar Run .+ · works offline$/);
    await fireEvent.press(screen.getByTestId('theme-night'));
    await waitFor(() => expect(settings.get().theme).toBe('night'));
    expect(push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('lk-L35'));
    await waitFor(() => expect(settings.get().theme).toBe('day'));
    expect(push).toHaveBeenCalledWith(opened('dr-01-today-s-run-daylight'));
  });
});

describe('SM-16 why this window', () => {
  it('the order\'s ETA band and the outlet\'s window; Got it returns to SM-02 with the order', async () => {
    await signInAs(store('u-sm16'));
    params.order = 'O-1';
    routes.set("Outlets('OUT-T1')", outlet);
    routes.set('Orders', [order]);
    routes.set("Orders('O-1')", order);
    const Screen = require('@/live/sm-16-why-this-window-sheet').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('why-band').props.children).toBe('Why 6:15–6:55?'));
    expect(screen.getByText('Receiving hours 5:30–8:00')).toBeTruthy();
    expect(screen.getByText('Typical unload 12 min')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L91'));
    expect(push).toHaveBeenCalledWith(opened('sm-02-order-status-and-eta', { order: 'O-1' }));
  });
});

describe('DSP-31 call or SMS driver', () => {
  it('calls and texts the trip\'s driver from the Users phone; Send SMS returns to the vehicle', async () => {
    await signInAs(dispatcher('u-dsp31'));
    params.vehicle = 'VAN-T9';
    routes.set("Vehicles('VAN-T9')", vehicle);
    routes.set('Trips', [trip]);
    routes.set('TripStops', [stop]);
    routes.set("Users('u-drv')", { id: 'u-drv', name: 'Test Driver', phone: '0772344521' });
    const { Linking } = require('react-native');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const Screen = require('@/live/dsp-31-call-or-sms-driver').default;
    await render(<Screen />);
    await waitFor(() => expect(screen.getByText('Mobile · 077 ••• 4521')).toBeTruthy());
    expect(screen.getByTestId('reach-driver').props.children).toBe('Reach Test Driver');
    await fireEvent.press(screen.getByTestId('call-driver'));
    expect(open).toHaveBeenCalledWith('tel:0772344521');
    await fireEvent.press(screen.getByTestId('sms-template-1'));
    await fireEvent.press(screen.getByTestId('lk-L182'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(`sms:0772344521?body=${encodeURIComponent('Test, please call me when you can. Nimal')}`));
    expect(push).toHaveBeenCalledWith(opened('dsp-30-vehicle-detail', { vehicle: 'VAN-T9' }));
    open.mockRestore();
  });
});

describe('DR-25 connection banner', () => {
  it('each designed state from the real component, plus the live banner and pill', async () => {
    await signInAs(driver('u-dr25'));
    network.set({ online: false, since: new Date().toISOString() });
    const Screen = require('@/live/dr-25-connection-banner-states-components').default;
    await render(<Screen />);
    expect(screen.getByTestId('banner-now')).toBeTruthy();
    expect(screen.getAllByText('No signal · keep going').length).toBe(2); // the forced state and the live banner
    expect(screen.getByText('They send by themselves when signal returns.')).toBeTruthy();
    expect(screen.getByTestId('connection-banner-sending')).toBeTruthy();
    expect(screen.getByTestId('connection-pill-online')).toBeTruthy();
    expect(screen.getAllByText('Saved on phone').length).toBe(2);
  });
});
