// Device self-enrollment (PLATFORM.md §2.6): a field token that is not bound to the phone presenting it
// may only ask for access for that phone (POST Devices), read its own devices and call Me().
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { anything, deepEqual, instance, mock, when } from 'ts-mockito';
import { personas, principal } from '../test/principals';
import { MATCH_NOTHING, rowFilter } from './abac';
import { OidcConfig } from './config';
import { ALLOW_KEY, IS_PUBLIC_KEY, SCOPE_KEY } from './decorators';
import { DeviceLookup, DevicePostureService, isEnrollmentRoute } from './device-posture.service';
import { JwtVerifier } from './jwt-verifier';
import { isPrivileged, Principal } from './principal';
import { ALL_ROLES } from './roles';
import { ZeroTrustGuard } from './zero-trust.guard';

const config: OidcConfig = { issuers: [], audience: 'lodestar-api', fieldClientId: 'lodestar-field', requireDeviceHeader: true };
const NEW_PHONE = 'DEV-3F2A9C1B7D4E4F0A';

/** Ruwan's token still names his old phone (fixed realm attribute); the new phone sends its own id. */
const ruwan = personas.ruwan; // device_id DEV-RB-01
const unbound: Principal = { ...personas.fathima, clientId: 'lodestar-field', deviceId: undefined };

describe('isEnrollmentRoute', () => {
  it.each([
    ['POST', '/odata/v4/Devices'],
    ['POST', '/odata/v4/Devices/'],
    ['GET', '/odata/v4/Devices'],
    ['GET', "/odata/v4/Devices?$filter=status eq 'PENDING'&$expand=user"],
    ['GET', "/odata/v4/Devices('DEV-3F2A9C1B7D4E4F0A')"],
    ['GET', '/odata/v4/Devices(%27DEV-3F2A9C1B7D4E4F0A%27)'],
    ['GET', '/odata/v4/Devices/$count'],
    ['HEAD', '/odata/v4/Devices'],
    ['GET', '/odata/v4/Me()'],
    ['GET', '/odata/v4/Me'],
    ['get', '/api/odata/v4/Me()'],
  ])('%s %s is an enrollment route', (method, url) => {
    expect(isEnrollmentRoute(method, url)).toBe(true);
  });

  it.each([
    ['PATCH', "/odata/v4/Devices('DEV-X')"],
    ['DELETE', "/odata/v4/Devices('DEV-X')"],
    ['POST', "/odata/v4/Devices('DEV-X')/Lodestar.Activate"],
    ['POST', "/odata/v4/Devices('DEV-X')/Lodestar.Revoke"],
    ['GET', "/odata/v4/Devices('DEV-X')/user"],
    ['POST', '/odata/v4/Me()'],
    ['GET', '/odata/v4/Users'],
    ['GET', '/odata/v4/Trips'],
    ['GET', '/odata/v4/DevicesX'],
    ['GET', '/odata/v4/$metadata'],
    ['GET', '/odata/v4/'],
    ['GET', '/Devices'],
    ['GET', '/odata/v4/Devices(%E0%A4%A)'],
    [undefined, '/odata/v4/Devices'],
    ['GET', undefined],
  ])('%s %s is not', (method, url) => {
    expect(isEnrollmentRoute(method as string, url as string)).toBe(false);
  });
});

describe('DevicePostureService.enrollmentGrant', () => {
  let lookup: DeviceLookup;
  let auth: DevicePostureService;

  const failure = async (p: Principal, presented?: string) => (await auth.check(p, presented).catch((e) => e)) as unknown;
  const route = (method: string, url: string) => ({ method, url });

  beforeEach(() => {
    lookup = mock<DeviceLookup>();
    when(lookup.findDevice(anything())).thenCall(async (id: string) =>
      id === 'DEV-RB-01' ? { id, userId: 'ruwan', status: 'ACTIVE' } : id === 'DEV-OLD-01' ? { id, userId: 'ruwan', status: 'REVOKED' } : null,
    );
    auth = new DevicePostureService(config, instance(lookup), Date.now, 'auth');
  });

  it('waives DeviceMismatch (token names another phone) on POST Devices', async () => {
    const err = await failure(ruwan, NEW_PHONE);
    expect(auth.enrollmentGrant(err, ruwan, NEW_PHONE, route('POST', '/odata/v4/Devices'))).toEqual({ deviceId: NEW_PHONE, reason: 'DeviceMismatch' });
  });

  it('waives DeviceNotBound (no device_id claim) on GET Devices and Me()', async () => {
    const err = await failure(unbound, NEW_PHONE);
    expect(auth.enrollmentGrant(err, unbound, NEW_PHONE, route('GET', "/odata/v4/Devices('" + NEW_PHONE + "')"))).toEqual({
      deviceId: NEW_PHONE,
      reason: 'DeviceNotBound',
    });
    expect(auth.enrollmentGrant(err, unbound, [NEW_PHONE], route('GET', '/odata/v4/Me()'))).toMatchObject({ deviceId: NEW_PHONE });
  });

  it('refuses every other route', async () => {
    const err = await failure(ruwan, NEW_PHONE);
    for (const [m, u] of [
      ['GET', '/odata/v4/Trips'],
      ['GET', '/odata/v4/Users'],
      ['PATCH', `/odata/v4/Devices('${NEW_PHONE}')`],
      ['POST', `/odata/v4/Devices('${NEW_PHONE}')/Lodestar.Activate`],
    ]) {
      expect(auth.enrollmentGrant(err, ruwan, NEW_PHONE, route(m, u))).toBeNull();
    }
  });

  it('refuses other posture failures: missing header, revoked, unknown or foreign bound device', async () => {
    const post = route('POST', '/odata/v4/Devices');
    expect(auth.enrollmentGrant(await failure(ruwan), ruwan, undefined, post)).toBeNull(); // DeviceHeaderRequired
    const revoked = { ...ruwan, deviceId: 'DEV-OLD-01' };
    expect(auth.enrollmentGrant(await failure(revoked, 'DEV-OLD-01'), revoked, 'DEV-OLD-01', post)).toBeNull(); // DeviceInactive
    const unknown = { ...ruwan, deviceId: 'DEV-GONE-01' };
    expect(auth.enrollmentGrant(await failure(unknown, 'DEV-GONE-01'), unknown, 'DEV-GONE-01', post)).toBeNull(); // DeviceNotRegistered
    expect(auth.enrollmentGrant(new Error('boom'), ruwan, NEW_PHONE, post)).toBeNull();
    expect(auth.enrollmentGrant(new UnauthorizedException('Token expired'), ruwan, NEW_PHONE, post)).toBeNull();
  });

  it('needs a well-formed presented id, a human field token, and the auth service', async () => {
    const err = await failure(ruwan, NEW_PHONE);
    const post = route('POST', '/odata/v4/Devices');
    expect(auth.enrollmentGrant(err, ruwan, 'x', post)).toBeNull();
    expect(auth.enrollmentGrant(err, ruwan, "DEV-'; drop", post)).toBeNull();
    expect(auth.enrollmentGrant(err, ruwan, '   ', post)).toBeNull();
    expect(auth.enrollmentGrant(err, { ...ruwan, clientId: 'lodestar-web' }, NEW_PHONE, post)).toBeNull();
    expect(auth.enrollmentGrant(err, { ...ruwan, isService: true }, NEW_PHONE, post)).toBeNull();
    for (const service of ['orders', undefined]) {
      const other = new DevicePostureService(config, instance(lookup), Date.now, service);
      expect(other.enrollmentGrant(err, ruwan, NEW_PHONE, post)).toBeNull();
    }
  });
});

describe('enrolling principals', () => {
  const rules = { open: '*' as const, self: (p: Principal) => ({ userId: p.sub }) };

  it('are never privileged and see only their own rows', () => {
    const admin: Principal = { ...personas.admin, enrollment: { deviceId: NEW_PHONE, reason: 'DeviceNotBound' } };
    expect(isPrivileged(admin)).toBe(false);
    expect(rowFilter(admin, rules)).toEqual({ userId: 'admin' });
    expect(rowFilter({ ...ruwan, enrollment: { deviceId: NEW_PHONE, reason: 'DeviceMismatch' } }, rules)).toEqual({ userId: 'ruwan' });
    expect(rowFilter({ ...ruwan, enrollment: { deviceId: NEW_PHONE, reason: 'DeviceMismatch' } }, { open: '*' })).toBe(MATCH_NOTHING);
    expect(rowFilter({ ...ruwan, enrollment: { deviceId: NEW_PHONE, reason: 'DeviceMismatch' } })).toBe(MATCH_NOTHING);
  });
});

describe('ZeroTrustGuard with self-enrollment', () => {
  const TOKEN = 'aaa.bbb.ccc';
  let reflector: Reflector;
  let verifier: JwtVerifier;
  let request: any;
  const handler = () => undefined;
  class Controller {}
  const http = (): ExecutionContext =>
    ({ getType: () => 'http', getHandler: () => handler, getClass: () => Controller, switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
  const meta = (key: string, value: unknown) => when(reflector.getAllAndOverride(key, deepEqual([handler, Controller]))).thenReturn(value as any);

  const guardFor = (service: string) => {
    const lookup = mock<DeviceLookup>();
    when(lookup.findDevice(anything())).thenCall(async (id: string) => (id === 'DEV-RB-01' ? { id, userId: 'ruwan', status: 'ACTIVE' } : null));
    return new ZeroTrustGuard(instance(reflector), instance(verifier), new DevicePostureService(config, instance(lookup), Date.now, service));
  };
  const call = (method: string, url: string, deviceId?: string) => {
    request = { method, originalUrl: url, headers: { authorization: `Bearer ${TOKEN}`, ...(deviceId ? { 'x-device-id': deviceId } : {}) } };
  };
  const code = async (guard: ZeroTrustGuard) => ((await guard.canActivate(http()).catch((e) => e)) as UnauthorizedException).getResponse?.();

  beforeEach(() => {
    reflector = mock(Reflector);
    verifier = mock(JwtVerifier);
    when(verifier.verify(TOKEN)).thenResolve(ruwan);
    meta(IS_PUBLIC_KEY, undefined);
    meta(ALLOW_KEY, ALL_ROLES); // the generic OData controller
    meta(SCOPE_KEY, undefined);
  });

  it('lets a new phone ask for access and read its own devices, marking the principal', async () => {
    const guard = guardFor('auth');
    for (const [m, u] of [
      ['POST', '/odata/v4/Devices'],
      ['GET', `/odata/v4/Devices('${NEW_PHONE}')`],
      ['GET', '/odata/v4/Me()'],
    ]) {
      call(m, u, NEW_PHONE);
      await expect(guard.canActivate(http())).resolves.toBe(true);
      expect(request.principal).toMatchObject({ sub: 'ruwan', deviceId: 'DEV-RB-01', enrollment: { deviceId: NEW_PHONE, reason: 'DeviceMismatch' } });
    }
  });

  it('keeps refusing every other call from that phone with the posture 401', async () => {
    const guard = guardFor('auth');
    call('GET', '/odata/v4/Users', NEW_PHONE);
    expect(await code(guard)).toMatchObject({ code: 'DeviceMismatch' });
    expect(request.principal).toBeUndefined();
    call('POST', `/odata/v4/Devices('${NEW_PHONE}')/Lodestar.Activate`, NEW_PHONE);
    expect(await code(guard)).toMatchObject({ code: 'DeviceMismatch' });
    call('POST', '/odata/v4/Devices'); // no header at all
    expect(await code(guard)).toMatchObject({ code: 'DeviceHeaderRequired' });
  });

  it('other services never waive posture, even on the same paths', async () => {
    const orders = guardFor('orders');
    call('GET', '/odata/v4/Me()', NEW_PHONE);
    expect(await code(orders)).toMatchObject({ code: 'DeviceMismatch' });
    call('GET', '/odata/v4/Trips', NEW_PHONE);
    expect(await code(orders)).toMatchObject({ code: 'DeviceMismatch' });
  });

  it('a bound phone is not marked as enrolling', async () => {
    const guard = guardFor('auth');
    call('POST', '/odata/v4/Devices', 'DEV-RB-01');
    await expect(guard.canActivate(http())).resolves.toBe(true);
    expect(request.principal.enrollment).toBeUndefined();
  });

  it('a token without device_id may enroll too (DeviceNotBound)', async () => {
    when(verifier.verify(TOKEN)).thenResolve(principal({ sub: 'u-new', roles: ['loader'], depots: ['KANDY'], clientId: 'lodestar-field' }));
    const guard = guardFor('auth');
    call('POST', '/odata/v4/Devices', NEW_PHONE);
    await expect(guard.canActivate(http())).resolves.toBe(true);
    expect(request.principal.enrollment).toEqual({ deviceId: NEW_PHONE, reason: 'DeviceNotBound' });
    call('GET', '/odata/v4/Trips', NEW_PHONE);
    expect(await code(guard)).toMatchObject({ code: 'DeviceNotBound' });
  });
});
