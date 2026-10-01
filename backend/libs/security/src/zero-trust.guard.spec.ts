import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { personas, principal } from '../test/principals';
import { ALLOW_KEY, IS_PUBLIC_KEY, SCOPE_KEY } from './decorators';
import { DevicePostureService } from './device-posture.service';
import { JwtVerifier } from './jwt-verifier';
import { bearerToken, ZeroTrustGuard } from './zero-trust.guard';

const TOKEN = 'aaa.bbb.ccc';

describe('ZeroTrustGuard', () => {
  let reflector: Reflector;
  let verifier: JwtVerifier;
  let posture: DevicePostureService;
  let guard: ZeroTrustGuard;
  let request: any;

  const handler = () => undefined;
  class Controller {}
  const http = (): ExecutionContext =>
    ({
      getType: () => 'http',
      getHandler: () => handler,
      getClass: () => Controller,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const meta = (key: string, value: unknown) => when(reflector.getAllAndOverride(key, deepEqual([handler, Controller]))).thenReturn(value as any);

  beforeEach(() => {
    reflector = mock(Reflector);
    verifier = mock(JwtVerifier);
    posture = mock(DevicePostureService);
    guard = new ZeroTrustGuard(instance(reflector), instance(verifier), instance(posture));
    request = { headers: { authorization: `Bearer ${TOKEN}` } };
    when(verifier.verify(TOKEN)).thenResolve(personas.nilanthi);
    when(posture.check(anything(), anything())).thenResolve();
    meta(IS_PUBLIC_KEY, undefined);
    meta(ALLOW_KEY, ['dispatcher']);
    meta(SCOPE_KEY, undefined);
  });

  it('lets @Public routes through without a token', async () => {
    meta(IS_PUBLIC_KEY, true);
    request.headers = {};
    await expect(guard.canActivate(http())).resolves.toBe(true);
    verify(verifier.verify(anything())).never();
  });

  it('verifies the token, checks device posture and attaches the principal', async () => {
    await expect(guard.canActivate(http())).resolves.toBe(true);
    expect(request.principal).toBe(personas.nilanthi);
    verify(posture.check(personas.nilanthi, undefined)).once();
  });

  it('hands the X-Device-Id header to the posture check', async () => {
    request.headers['x-device-id'] = 'DEV-RB-01';
    when(verifier.verify(TOKEN)).thenResolve(personas.ruwan);
    meta(ALLOW_KEY, ['driver']);
    await expect(guard.canActivate(http())).resolves.toBe(true);
    verify(posture.check(personas.ruwan, 'DEV-RB-01')).once();
  });

  it('401s with DeviceMismatch when the header names another phone (no principal attached)', async () => {
    const real = new DevicePostureService({ issuers: [], audience: 'lodestar-api', fieldClientId: 'lodestar-field' }, {
      findDevice: async (id: string) => ({ id, userId: 'ruwan', status: 'ACTIVE' }),
    });
    guard = new ZeroTrustGuard(instance(reflector), instance(verifier), real);
    when(verifier.verify(TOKEN)).thenResolve(personas.ruwan);
    meta(ALLOW_KEY, ['driver']);

    request.headers['x-device-id'] = 'DEV-STOLEN';
    const err = await guard.canActivate(http()).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.getResponse()).toMatchObject({ code: 'DeviceMismatch' });
    expect(request.principal).toBeUndefined();

    request.headers['x-device-id'] = 'DEV-RB-01';
    await expect(guard.canActivate(http())).resolves.toBe(true);
  });

  it('401s without a bearer token', async () => {
    request.headers = {};
    await expect(guard.canActivate(http())).rejects.toBeInstanceOf(UnauthorizedException);
    request.headers = { authorization: 'Basic abc' };
    await expect(guard.canActivate(http())).rejects.toThrow('Missing bearer token');
  });

  it('propagates verification and posture failures as 401', async () => {
    when(verifier.verify(TOKEN)).thenReject(new UnauthorizedException('Token expired'));
    await expect(guard.canActivate(http())).rejects.toThrow('Token expired');

    when(verifier.verify(TOKEN)).thenResolve(personas.ruwan);
    when(posture.check(anything(), anything())).thenReject(new UnauthorizedException('Device is revoked'));
    await expect(guard.canActivate(http())).rejects.toThrow('Device is revoked');
  });

  it('fails closed when a route declares no @Allow', async () => {
    meta(ALLOW_KEY, undefined);
    await expect(guard.canActivate(http())).rejects.toThrow('No access policy is declared for this route');
  });

  it('403s when the role is not allowed (RBAC)', async () => {
    meta(ALLOW_KEY, ['admin']);
    await expect(guard.canActivate(http())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('403s when a scoped route lacks the claim (ABAC)', async () => {
    meta(ALLOW_KEY, ['store_manager']);
    meta(SCOPE_KEY, ['outlet']);
    when(verifier.verify(TOKEN)).thenResolve(principal({ roles: ['store_manager'] }));
    await expect(guard.canActivate(http())).rejects.toThrow('Token lacks the outlet claim');
    when(verifier.verify(TOKEN)).thenResolve(personas.fathima);
    await expect(guard.canActivate(http())).resolves.toBe(true);
  });

  it('only accepts WebSocket contexts that were authenticated at handshake', async () => {
    const ws = (data: any) =>
      ({ getType: () => 'ws', getHandler: () => handler, getClass: () => Controller, switchToWs: () => ({ getClient: () => ({ data }) }) }) as any;
    await expect(guard.canActivate(ws({ principal: personas.admin }))).resolves.toBe(true);
    await expect(guard.canActivate(ws({}))).resolves.toBe(false);
    const rpc = { getType: () => 'rpc', getHandler: () => handler, getClass: () => Controller } as any;
    await expect(guard.canActivate(rpc)).resolves.toBe(false);
  });
});

describe('bearerToken', () => {
  it('extracts a compact JWS only', () => {
    expect(bearerToken(`Bearer ${TOKEN}`)).toBe(TOKEN);
    expect(bearerToken(`bearer   ${TOKEN}  `)).toBe(TOKEN);
    expect(bearerToken('Bearer abc')).toBeUndefined();
    expect(bearerToken(undefined)).toBeUndefined();
    expect(bearerToken(['x'])).toBeUndefined();
  });
});
