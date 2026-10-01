import { claimsFromToken } from '@/auth/claims';
import { newDeviceId, deviceId, resetDeviceIdCache, DEVICE_ID_RE } from '@/auth/device';
import { OidcError, type OidcClient, type RawTokens } from '@/auth/oidc';
import { accessScreenFor, faceOf, homeFor, problemFrom401 } from '@/auth/roles';
import { memoryStore, type SecretStore } from '@/auth/secure';
import { Session } from '@/auth/session';

import { jwt } from './helpers';

const driver = { sub: 'u-ruwan', name: 'Ruwan Bandara', realm_access: { roles: ['driver', 'offline_access'] }, depot: ['kandy'], vehicle_id: 'VEH-A', device_id: 'DEV-1', exp: 2_000_000_000 };
const tokens = (claims: object, rt = 'rt-1', expires_in = 300): RawTokens => ({ access_token: jwt(claims), refresh_token: rt, expires_in });

function fakeOidc(): OidcClient & { refresh: jest.Mock; logout: jest.Mock } {
  return { refresh: jest.fn(), logout: jest.fn(async () => undefined) };
}

function mapStore(): SecretStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, get: async k => data.get(k) ?? null, set: async (k, v) => void data.set(k, v), remove: async k => void data.delete(k) };
}

describe('claims', () => {
  it('reads roles, depots and ABAC claims like the backend does', () => {
    const c = claimsFromToken(jwt({ ...driver, roles: ['admin'], name: 'Fathima Rizwan ජය' }))!;
    expect(c.roles.sort()).toEqual(['admin', 'driver']);
    expect(c.depots).toEqual(['KANDY']);
    expect(c.vehicleId).toBe('VEH-A');
    expect(c.deviceId).toBe('DEV-1');
    expect(c.name).toBe('Fathima Rizwan ජය');
  });

  it('rejects a token without a subject', () => {
    expect(claimsFromToken('not-a-jwt')).toBeNull();
    expect(claimsFromToken(jwt({ name: 'x' }))).toBeNull();
  });
});

describe('role routing', () => {
  it('sends each role to its face', () => {
    expect(homeFor({ roles: ['driver'] }, 390)).toBe('dr-01-today-s-run');
    expect(homeFor({ roles: ['loader'] }, 390)).toBe('ld-01-dock-queue');
    expect(homeFor({ roles: ['loader'] }, 1024)).toBe('ld-02-load-sheet-tablet');
    expect(homeFor({ roles: ['loader'] }, 899)).toBe('ld-01-dock-queue');
    expect(homeFor({ roles: ['store_manager'] }, 390)).toBe('sm-11-today-order-day');
    expect(homeFor({ roles: ['dispatcher'] }, 390)).toBe('dsp-27-alerts');
    expect(homeFor({ roles: ['admin'] }, 390)).toBeNull();
  });

  it('picks the access screens of the face', () => {
    expect(accessScreenFor(faceOf({ roles: ['driver'] }), 'expired')).toBe('dr-30-session-expired-while-offline');
    expect(accessScreenFor('run', 'revoked')).toBe('dr-29-can-t-sign-in');
    expect(accessScreenFor('dock', 'revoked')).toBe('ld-24-can-t-sign-in');
    expect(accessScreenFor('store', 'expired')).toBe('sm-33-session-expired');
    expect(accessScreenFor('plan', 'unregistered')).toBe('dsp-37-can-t-sign-in');
  });

  it('classifies 401 messages of the posture check', () => {
    expect(problemFrom401('Device is revoked')).toBe('revoked');
    expect(problemFrom401('Field token is not bound to a device')).toBe('unregistered');
    expect(problemFrom401('Device is pending')).toBe('unregistered');
    expect(problemFrom401('"exp" claim timestamp check failed')).toBe('expired');
  });
});

describe('device id', () => {
  beforeEach(() => resetDeviceIdCache());

  it('is created once per install and kept', async () => {
    const store = mapStore();
    const uuid = jest.fn(() => '0a1b2c3d-4e5f-6789-abcd-ef0123456789');
    const a = await deviceId(store, uuid);
    resetDeviceIdCache();
    const b = await deviceId(store, uuid);
    expect(a).toBe(b);
    expect(uuid).toHaveBeenCalledTimes(1);
    expect(a).toMatch(DEVICE_ID_RE);
    expect(newDeviceId(() => 'x-y')).toBe('DEV-XY');
  });
});

describe('Session', () => {
  let now = 1_000_000;
  const clock = () => now;

  it('signs in, keeps only the refresh token and claims in the secret store', async () => {
    const store = mapStore();
    const s = new Session(store, fakeOidc(), clock);
    await s.signIn(tokens(driver));
    expect(s.state.get().status).toBe('signed-in');
    expect(s.state.get().face).toBe('run');
    expect(store.data.get('lodestar.rt')).toBe('rt-1');
    expect([...store.data.values()].some(v => v.includes(jwt(driver)))).toBe(false);
    expect(await s.accessToken()).toBe(jwt(driver));
  });

  it('refreshes an expiring token once, even for concurrent callers', async () => {
    const oidc = fakeOidc();
    oidc.refresh.mockImplementation(async () => tokens({ ...driver, name: 'new' }, 'rt-2'));
    const s = new Session(mapStore(), oidc, clock);
    await s.signIn(tokens(driver, 'rt-1', 60));
    now += 45_000; // within 30 s of expiry
    const [a, b] = await Promise.all([s.accessToken(), s.accessToken()]);
    expect(oidc.refresh).toHaveBeenCalledTimes(1);
    expect(oidc.refresh).toHaveBeenCalledWith('rt-1');
    expect(a).toBe(b);
    expect(s.claims?.name).toBe('new');
  });

  it('ends with "expired" when the refresh token is refused', async () => {
    const oidc = fakeOidc();
    oidc.refresh.mockRejectedValue(new OidcError('invalid_grant', 'Session not active'));
    const s = new Session(mapStore(), oidc, clock);
    await s.signIn(tokens(driver));
    expect(await s.handleUnauthorized({ message: 'jwt expired' })).toBe(false);
    expect(s.state.get()).toMatchObject({ status: 'signed-out', face: 'run', problem: { kind: 'expired' } });
  });

  it('stays signed in (offline) when the identity provider is unreachable', async () => {
    const oidc = fakeOidc();
    oidc.refresh.mockRejectedValue(new OidcError('network', 'offline'));
    const store = mapStore();
    const first = new Session(store, fakeOidc(), clock);
    await first.signIn(tokens(driver));
    const s = new Session(store, oidc, clock);
    await s.restore();
    expect(s.state.get()).toMatchObject({ status: 'signed-in', offline: true });
    expect(s.claims?.vehicleId).toBe('VEH-A');
  });

  it('signs out and ends the Keycloak session when the device is revoked', async () => {
    const oidc = fakeOidc();
    const store = mapStore();
    const s = new Session(store, oidc, clock);
    await s.signIn(tokens(driver));
    expect(await s.handleUnauthorized({ message: 'Device is revoked' })).toBe(false);
    expect(s.state.get()).toMatchObject({ status: 'signed-out', problem: { kind: 'revoked' } });
    expect(oidc.logout).toHaveBeenCalledWith('rt-1');
    expect(store.data.has('lodestar.rt')).toBe(false);
    expect(await s.accessToken()).toBeNull();
  });

  it('signs out on request without a problem', async () => {
    const oidc = fakeOidc();
    const s = new Session(memoryStore, oidc, clock);
    await s.signIn(tokens(driver));
    await s.signOut();
    expect(s.state.get()).toMatchObject({ status: 'signed-out', problem: null });
    expect(oidc.logout).toHaveBeenCalledTimes(1);
  });
});
