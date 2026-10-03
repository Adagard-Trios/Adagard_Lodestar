/* eslint-disable @typescript-eslint/no-require-imports */
// WP7: the first-run screens (store SM-07..SM-10, dock LD-07/LD-08, driver DR-08..DR-10) and the update-required
// screens of each face (SM-34, DSP-38, LD-26, DR-31) made live. Synthetic fixtures only.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { onboardingSeen, settings } from '@/lib/settings';
import { versionState } from '@/lib/version';
import { network } from '@/offline/network';
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
const opened = (key: string, extra: Record<string, string> = {}) => ({ pathname: '/s/[key]', params: { ...extra, key } });

const RUN = '2026-04-07';
const outlet = { id: 'OUT-T1', name: 'Hill Store', brand: 'FRESH', district: 'Hills', depot: 'KANDY', windowOpen: '05:30', windowClose: '08:00' };
const trip = {
  id: 'T-1', vehicleId: 'VAN-T9', depot: 'KANDY', runDate: `${RUN}T00:00:00.000Z`, brand: 'FRESH', district: 'Hills', status: 'LOADING', planVersion: 2, tripNumber: 1, bay: 'B2',
  departTime: `${RUN}T00:10:00.000Z`, vehicle: { id: 'VAN-T9', type: 'VAN', tempClass: 'CHILLED' }, loadRecord: null,
};
const store = (sub: string) => ({ sub, name: 'Test Manager', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT-T1' });
const driver = (sub: string) => ({ sub, name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'], vehicle_id: 'VAN-T9' });
const loader = (sub: string) => ({ sub, name: 'Test Loader', realm_access: { roles: ['loader'] }, depot: ['KANDY'] });
const dispatcher = (sub: string) => ({ sub, name: 'Test Dispatcher', realm_access: { roles: ['dispatcher'] }, depot: ['KANDY'] });

const required = () => versionState.set({ current: '1.0.0', minimum: '9.0.0', required: true, checked: true });
const gatewayStillRequires = () => {
  (globalThis as { fetch?: unknown }).fetch = jest.fn(async () => ({ ok: true, text: async () => '{"minAppVersion":"9.0.0"}' }));
};

beforeEach(() => {
  routes.clear();
  for (const k of Object.keys(params)) delete params[k];
  push.mockClear();
  network.set({ online: true, since: new Date().toISOString() });
});

describe('Onboarding', () => {
  it('SM-07: the store window from the outlet; Skip goes to SM-10', async () => {
    await signInAs(store('u-sm07'));
    routes.set("Outlets('OUT-T1')", outlet);
    const Screen = require('@/live/sm-07-onboarding-1').default;
    await render(<Screen />);
    expect(await screen.findByText(/Hill Store placed by 4:00 PM.*05:30–08:00/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L73'));
    expect(push).toHaveBeenCalledWith(opened('sm-10-allow-notifications'));
  });

  it('SM-08: Skip goes to SM-10', async () => {
    await signInAs(store('u-sm08'));
    routes.set("Outlets('OUT-T1')", outlet);
    const Screen = require('@/live/sm-08-onboarding-2').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lk-L75'));
    expect(push).toHaveBeenCalledWith(opened('sm-10-allow-notifications'));
  });

  it('SM-09: Get started goes to SM-10', async () => {
    await signInAs(store('u-sm09'));
    const Screen = require('@/live/sm-09-onboarding-3').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lk-L76'));
    expect(push).toHaveBeenCalledWith(opened('sm-10-allow-notifications'));
  });

  it('SM-10: Allow asks for notifications, marks onboarding seen and opens SM-11', async () => {
    await signInAs(store('u-sm10'));
    const Screen = require('@/live/sm-10-allow-notifications').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lk-L77'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('sm-11-today-order-day')));
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(await onboardingSeen('u-sm10')).toBe(true);
  });

  it('LD-07: the bay queue for the depot; Start shift opens LD-08', async () => {
    await signInAs(loader('u-ld07'));
    routes.set('Trips/Lodestar.BayQueue', [trip]);
    const Screen = require('@/live/ld-07-start-shift').default;
    await render(<Screen />);
    expect(await screen.findByText('Start shift at Bay B2')).toBeTruthy();
    expect(await screen.findByText('Kandy Hub')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L188'));
    expect(push).toHaveBeenCalledWith(opened('ld-08-quick-tips'));
  });

  it('LD-08: Got it marks onboarding seen and opens the dock queue', async () => {
    await signInAs(loader('u-ld08'));
    const Screen = require('@/live/ld-08-quick-tips').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lk-L189'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('ld-01-dock-queue')));
    expect(await onboardingSeen('u-ld08')).toBe(true);
  });

  it('DR-08: location is shown as not used, notifications are really asked for; Continue opens DR-09', async () => {
    await signInAs(driver('u-dr08'));
    const Screen = require('@/live/dr-08-permissions').default;
    await render(<Screen />);
    expect(screen.getByTestId('location-off')).toBeTruthy();
    await fireEvent.press(await screen.findByTestId('allow-notify'));
    await waitFor(() => expect(screen.getByTestId('notify-on')).toBeTruthy());
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('lk-L235'));
    expect(push).toHaveBeenCalledWith(opened('dr-09-language'));
  });

  it('DR-09: picking Sinhala sets the app language; Continue opens DR-10', async () => {
    await signInAs(driver('u-dr09'));
    const Screen = require('@/live/dr-09-language').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lang-si'));
    await waitFor(() => expect(settings.get().language).toBe('si'));
    expect(push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('lk-L236'));
    expect(push).toHaveBeenCalledWith(opened('dr-10-first-run-tips'));
  });

  it('DR-10: Got it marks onboarding seen and opens DR-11', async () => {
    await signInAs(driver('u-dr10'));
    const Screen = require('@/live/dr-10-first-run-tips').default;
    await render(<Screen />);
    await fireEvent.press(screen.getByTestId('lk-L237'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(opened('dr-11-load-handover-received')));
    expect(await onboardingSeen('u-dr10')).toBe(true);
  });
});

describe('Update required', () => {
  beforeEach(() => {
    required();
    gatewayStillRequires();
  });

  it('SM-34: both versions shown; Update now stays while still required; Remind me opens SM-11', async () => {
    await signInAs(store('u-sm34'));
    const Screen = require('@/live/sm-34-update-required').default;
    await render(<Screen />);
    expect(screen.getByText('Version 1.0.0')).toBeTruthy();
    expect(screen.getByText('9.0.0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L114'));
    expect(await screen.findByTestId('toast')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('lk-L115'));
    expect(push).toHaveBeenCalledWith(opened('sm-11-today-order-day'));
  });

  it('DSP-38: the plans waiting and the versions; Update now stays while still required', async () => {
    await signInAs(dispatcher('u-dsp38'));
    // an executable plan waiting (drawn trips); an auto-plan suggestion without trips is not an approval
    routes.set('Plans', [{ id: 'P-1', depot: 'KANDY', runDate: RUN, version: 3, status: 'NEEDS_APPROVAL', source: 'AGENT', createdAt: `${RUN}T00:00:00.000Z`, summary: { plan: { trips: [{ tripId: 'T-1', vehicleId: 'VAN-T9', orderIds: ['O-1'] }] } } }]);
    const Screen = require('@/live/dsp-38-update-required').default;
    await render(<Screen />);
    expect(await screen.findByText('Approvals waiting: 1')).toBeTruthy();
    expect(screen.getByText('1.0.0 to 9.0.0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L185'));
    expect(await screen.findByTestId('toast')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    const { Linking } = require('react-native');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await fireEvent.press(screen.getByTestId('approve-on-desktop'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/plan\/dsp-12-approve-and-go-live$/)));
    open.mockRestore();
  });

  it('DSP-37: the desk address comes from the gateway origin; desktop opens it, Back to sign in goes back', async () => {
    const Screen = require('@/live/dsp-37-can-t-sign-in').default;
    await render(<Screen />);
    expect(screen.queryByText(/plan\.lodestar\.waypoint\.lk/)).toBeNull();
    expect(screen.getByText(/\/plan, if you are at the office$/)).toBeTruthy();
    const { Linking } = require('react-native');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await fireEvent.press(screen.getByTestId('lk-L63'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/plan\/dsp-06-sign-in$/)));
    open.mockRestore();
    await fireEvent.press(screen.getByTestId('back-to-sign-in'));
    expect(router.replace).toHaveBeenCalledWith(opened('dsp-26-sign-in'));
  });

  it('LD-26: the trip being loaded; Keep loading opens its load sheet', async () => {
    await signInAs(loader('u-ld26'));
    params.trip = 'T-1';
    routes.set("Trips('T-1')", trip);
    const Screen = require('@/live/ld-26-update-required').default;
    await render(<Screen />);
    expect(await screen.findByText('Keep loading VAN-T9')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L215'));
    expect(push).toHaveBeenCalledWith(opened('ld-02-load-sheet', { trip: 'T-1' }));
  });

  it('DR-31: the versions; Continue run opens DR-04', async () => {
    await signInAs(driver('u-dr31'));
    const Screen = require('@/live/dr-31-update-required').default;
    await render(<Screen />);
    expect(screen.getByText('Lodestar Run 9.0.0 · this phone has 1.0.0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('lk-L277'));
    expect(push).toHaveBeenCalledWith(opened('dr-04-run-complete'));
  });
});
