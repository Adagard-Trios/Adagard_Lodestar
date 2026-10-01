import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { DevicePostureService, ServiceTokenClient } from '@lodestar/security';
import { personas, principal } from '../../../libs/security/test/principals';
import { AuthService } from './auth.service';
import { DevicesSet, UsersSet } from './auth.sets';
import { KeycloakAdminClient } from './keycloak-admin.client';

interface FindUniqueDelegate {
  findUnique(a: any): Promise<any>;
}
interface UpdateDelegate {
  update(a: any): Promise<any>;
}

const w = (p = personas.admin) => ({ principal: p, headers: {} });

describe('UsersSet', () => {
  let auth: AuthService;
  let set: UsersSet;

  beforeEach(() => {
    auth = mock(AuthService);
    set = new UsersSet({} as any, instance(auth));
    when(auth.createIdentity(anything())).thenResolve('kc-123');
  });

  describe('beforeCreate', () => {
    const body = { email: 'a@b.lk', name: 'Amal Perera', role: 'DISPATCHER', depot: 'KANDY' };

    it.each(['email', 'name', 'role'])('requires %s', async (field) => {
      await expect(set.beforeCreate({ ...body, [field]: '' })).rejects.toMatchObject({ status: 400, target: field });
      verify(auth.createIdentity(anything())).never();
    });

    it('requires an outletId for a store manager', async () => {
      await expect(set.beforeCreate({ ...body, role: 'STORE_MANAGER' })).rejects.toMatchObject({ status: 400, target: 'outletId' });
      await expect(set.beforeCreate({ ...body, role: 'STORE_MANAGER', outletId: 'OUT106' })).resolves.toMatchObject({ outletId: 'OUT106' });
    });

    it('takes the id from the identity provider, not the client', async () => {
      const data = await set.beforeCreate({ ...body, id: 'client-chosen' });
      expect(data.id).toBe('kc-123');
      verify(auth.createIdentity(deepEqual({ ...body, id: 'client-chosen' }))).once();
    });
  });

  describe('beforeUpdate', () => {
    it('syncs isActive to the identity provider only when it changes', async () => {
      when(auth.setIdentityEnabled(anything(), anything())).thenResolve();
      await set.beforeUpdate({ isActive: false }, { id: 'u1', isActive: true });
      verify(auth.setIdentityEnabled('u1', false)).once();
      await set.beforeUpdate({ isActive: true }, { id: 'u1', isActive: true });
      await set.beforeUpdate({ name: 'x' }, { id: 'u1', isActive: true });
      verify(auth.setIdentityEnabled(anything(), anything())).once();
    });
  });

  it('Me delegates with the caller principal', async () => {
    when(auth.me(anything())).thenResolve({ sub: 'ruwan' } as any);
    await set.me({ principal: personas.ruwan, params: {}, headers: {} });
    expect(capture(auth.me).last()[0]).toBe(personas.ruwan);
  });
});

describe('DevicesSet', () => {
  let auth: AuthService;
  let set: DevicesSet;

  beforeEach(() => {
    auth = mock(AuthService);
    set = new DevicesSet({} as any, instance(auth));
  });

  describe('beforeCreate', () => {
    it('registers a non-admin device as PENDING for the caller, ignoring userId', async () => {
      const data = await set.beforeCreate({ id: 'DEV-RB-02', userId: 'kasun', label: 'Phone' }, w(personas.ruwan));
      expect(data).toEqual({ id: 'DEV-RB-02', userId: 'ruwan', label: 'Phone', status: 'PENDING' });
    });

    it('lets an admin register an ACTIVE device for someone', async () => {
      await expect(set.beforeCreate({ id: 'DEV-RB-02', userId: 'ruwan' }, w())).resolves.toMatchObject({ userId: 'ruwan', status: 'ACTIVE' });
      await expect(set.beforeCreate({ id: 'DEV-AD-01' }, w())).resolves.toMatchObject({ userId: 'admin', status: 'ACTIVE' });
    });

    it.each([undefined, 'abc', 'DEV_01!', 'x'.repeat(65)])('rejects id %p with 400', async (id) => {
      await expect(set.beforeCreate({ id }, w(personas.ruwan))).rejects.toMatchObject({ status: 400, target: 'id' });
    });
  });

  describe('Revoke', () => {
    it('409 when already revoked', () => {
      expect(() => set.revoke({ principal: personas.admin, params: {}, entity: { id: 'DEV-RB-01', status: 'REVOKED' }, headers: {} })).toThrow(
        expect.objectContaining({ status: 409 }),
      );
      verify(auth.revokeDevice(anything(), anything(), anything())).never();
    });

    it('delegates with the admin and reason', async () => {
      when(auth.revokeDevice(anything(), anything(), anything())).thenResolve({ id: 'DEV-RB-01' } as any);
      await set.revoke({ principal: personas.admin, params: { reason: 'lost' }, entity: { id: 'DEV-RB-01', status: 'ACTIVE' }, headers: {} });
      verify(auth.revokeDevice('DEV-RB-01', 'admin', 'lost')).once();
    });
  });

  it('Activate delegates', async () => {
    when(auth.activateDevice('DEV-1')).thenResolve({ id: 'DEV-1' } as any);
    await set.activate({ principal: personas.admin, params: {}, entity: { id: 'DEV-1' }, headers: {} });
    verify(auth.activateDevice('DEV-1')).once();
  });
});

describe('AuthService', () => {
  let user: FindUniqueDelegate;
  let device: UpdateDelegate;
  let keycloak: KeycloakAdminClient;
  let posture: DevicePostureService;
  let service: AuthService;

  beforeEach(() => {
    user = mock<FindUniqueDelegate>();
    device = mock<UpdateDelegate>();
    keycloak = mock(KeycloakAdminClient);
    posture = mock(DevicePostureService);
    service = new AuthService({ user: instance(user), device: instance(device) } as any, instance(keycloak), instance(posture));
    when(device.update(anything())).thenCall(async (a: any) => ({ id: a.where.id, userId: 'ruwan', ...a.data }));
  });

  describe('revokeDevice', () => {
    it('sets REVOKED, invalidates the posture cache and logs the user out', async () => {
      when(keycloak.configured).thenReturn(true);
      when(keycloak.logoutUser('ruwan')).thenResolve(true);
      const res = await service.revokeDevice('DEV-RB-01', 'admin', 'lost on bus');
      const [args] = capture(device.update).last();
      expect(args.where).toEqual({ id: 'DEV-RB-01' });
      expect(args.data).toMatchObject({ status: 'REVOKED', revokedBy: 'admin', revokeReason: 'lost on bus' });
      expect(args.data.revokedAt).toBeInstanceOf(Date);
      verify(posture.invalidate('DEV-RB-01')).once();
      verify(keycloak.logoutUser('ruwan')).once();
      expect(res).toMatchObject({ status: 'REVOKED', sessionsRevoked: true });
    });

    it('defaults the reason and survives a Keycloak failure', async () => {
      when(keycloak.configured).thenReturn(true);
      when(keycloak.logoutUser(anything())).thenReject(new Error('boom'));
      const res = await service.revokeDevice('DEV-RB-01', 'admin');
      expect(res).toMatchObject({ status: 'REVOKED', revokeReason: 'Reported lost', sessionsRevoked: false });
      verify(posture.invalidate('DEV-RB-01')).once();
    });

    it('does not call Keycloak when it is not configured', async () => {
      when(keycloak.configured).thenReturn(false);
      const res = await service.revokeDevice('DEV-RB-01', 'admin');
      expect(res.sessionsRevoked).toBe(false);
      verify(keycloak.logoutUser(anything())).never();
    });
  });

  it('activateDevice clears the revocation and invalidates the cache', async () => {
    const res = await service.activateDevice('DEV-1');
    expect(res).toMatchObject({ status: 'ACTIVE', revokedAt: null, revokedBy: null, revokeReason: null });
    verify(posture.invalidate('DEV-1')).once();
  });

  describe('createIdentity', () => {
    it('without Keycloak requires and returns the given id', async () => {
      when(keycloak.configured).thenReturn(false);
      await expect(service.createIdentity({ email: 'a@b', name: 'A', role: 'DRIVER' })).rejects.toMatchObject({ status: 400, target: 'id' });
      await expect(service.createIdentity({ id: 'sub-1', email: 'a@b', name: 'A', role: 'DRIVER' })).resolves.toBe('sub-1');
      verify(keycloak.createUser(anything())).never();
    });

    it('with Keycloak creates the user with realm role and ABAC attributes', async () => {
      when(keycloak.configured).thenReturn(true);
      when(keycloak.createUser(anything())).thenResolve('kc-9');
      const id = await service.createIdentity({ email: 'f@x.lk', name: 'Fathima Rizvi Mohamed', role: 'STORE_MANAGER', outletId: 'OUT106', depot: 'KANDY' });
      expect(id).toBe('kc-9');
      expect(capture(keycloak.createUser).last()[0]).toEqual({
        email: 'f@x.lk',
        firstName: 'Fathima',
        lastName: 'Rizvi Mohamed',
        role: 'store_manager',
        attributes: { depot: ['KANDY'], outlet_id: ['OUT106'] },
      });
    });
  });

  it('setIdentityEnabled calls Keycloak only when configured', async () => {
    when(keycloak.configured).thenReturn(false);
    await service.setIdentityEnabled('u1', false);
    verify(keycloak.setEnabled(anything(), anything())).never();
    when(keycloak.configured).thenReturn(true);
    when(keycloak.setEnabled(anything(), anything())).thenResolve();
    await service.setIdentityEnabled('u1', false);
    verify(keycloak.setEnabled('u1', false)).once();
  });

  describe('me', () => {
    it('merges token claims with the directory row (claims win)', async () => {
      const row = { id: 'ruwan', email: 'ruwan@dir.lk', name: 'Ruwan (dir)', role: 'DRIVER', depot: 'KANDY', outletId: null, phone: null, isActive: true };
      when(user.findUnique(anything())).thenResolve(row);
      const p = { ...personas.ruwan, name: 'Ruwan Bandara' };
      const me = await service.me(p);
      expect(me).toEqual({
        sub: 'ruwan',
        name: 'Ruwan Bandara',
        email: 'ruwan@dir.lk',
        roles: ['driver'],
        depots: ['KANDY'],
        outletId: null,
        vehicleId: 'VEH057',
        deviceId: 'DEV-RB-01',
        clientId: 'lodestar-field',
        user: row,
      });
      expect(capture(user.findUnique).last()[0].where).toEqual({ id: 'ruwan' });
    });

    it('works without a directory row', async () => {
      when(user.findUnique(anything())).thenResolve(null);
      const me = await service.me(principal({ sub: 'svc', roles: ['svc'] }));
      expect(me).toMatchObject({ sub: 'svc', name: null, email: null, clientId: null, user: null });
    });
  });
});

describe('KeycloakAdminClient', () => {
  const saved = { url: process.env.KEYCLOAK_ADMIN_URL, realm: process.env.KEYCLOAK_REALM };
  let tokens: ServiceTokenClient;

  const res = (status: number, init: { location?: string; body?: unknown } = {}) =>
    new Response(init.body !== undefined ? JSON.stringify(init.body) : null, {
      status,
      headers: init.location ? { Location: init.location } : {},
    });

  function build(url: string | null = 'http://identity:8080/auth/') {
    if (url === null) delete process.env.KEYCLOAK_ADMIN_URL;
    else process.env.KEYCLOAK_ADMIN_URL = url;
    delete process.env.KEYCLOAK_REALM;
    return new KeycloakAdminClient(instance(tokens));
  }

  beforeEach(() => {
    tokens = mock(ServiceTokenClient);
    when(tokens.configured).thenReturn(true);
  });

  afterEach(() => {
    if (saved.url === undefined) delete process.env.KEYCLOAK_ADMIN_URL;
    else process.env.KEYCLOAK_ADMIN_URL = saved.url;
    if (saved.realm === undefined) delete process.env.KEYCLOAK_REALM;
    else process.env.KEYCLOAK_REALM = saved.realm;
  });

  const newUser = { email: 'a@b.lk', firstName: 'A', lastName: 'B', role: 'driver', attributes: { depot: ['KANDY'] } };

  it('createUser returns the id from the Location header and maps the realm role', async () => {
    const client = build();
    when(tokens.fetch(anything(), anything())).thenCall(async (url: string, init: RequestInit) => {
      if (init.method === 'POST' && url.endsWith('/users')) return res(201, { location: 'http://identity:8080/auth/admin/realms/lodestar/users/kc-42' });
      if (init.method === 'GET') return res(200, { body: { id: 'role-1', name: 'driver' } });
      return res(204);
    });

    await expect(client.createUser(newUser)).resolves.toBe('kc-42');

    const first = capture(tokens.fetch).first();
    expect(first[0]).toBe('http://identity:8080/auth/admin/realms/lodestar/users');
    expect(JSON.parse(String(first[1].body))).toMatchObject({ username: 'a@b.lk', email: 'a@b.lk', enabled: true, attributes: { depot: ['KANDY'] } });
    expect(capture(tokens.fetch).second()[0]).toBe('http://identity:8080/auth/admin/realms/lodestar/roles/driver');
    const third = capture(tokens.fetch).third();
    expect(third[0]).toBe('http://identity:8080/auth/admin/realms/lodestar/users/kc-42/role-mappings/realm');
    expect(JSON.parse(String(third[1].body))).toEqual([{ id: 'role-1', name: 'driver' }]);
  });

  it('createUser maps 409 to ODataError 409 and other failures to 502', async () => {
    const client = build();
    when(tokens.fetch(anything(), anything())).thenResolve(res(409));
    await expect(client.createUser(newUser)).rejects.toMatchObject({ status: 409, target: 'email' });
    when(tokens.fetch(anything(), anything())).thenResolve(res(500));
    await expect(client.createUser(newUser)).rejects.toMatchObject({ status: 502 });
    when(tokens.fetch(anything(), anything())).thenResolve(res(201));
    await expect(client.createUser(newUser)).rejects.toMatchObject({ status: 502 });
  });

  it('createUser fails with 502 when the realm role is missing or cannot be granted', async () => {
    const client = build();
    const created = () => res(201, { location: 'http://identity:8080/auth/admin/realms/lodestar/users/kc-42' });

    when(tokens.fetch(anything(), anything())).thenCall(async (_url: string, init: RequestInit) =>
      init.method === 'POST' ? created() : res(404),
    );
    await expect(client.createUser(newUser)).rejects.toMatchObject({ status: 502 });

    when(tokens.fetch(anything(), anything())).thenCall(async (url: string, init: RequestInit) => {
      if (init.method === 'GET') return res(200, { body: { id: 'role-1', name: 'driver' } });
      return url.endsWith('/role-mappings/realm') ? res(403) : created();
    });
    await expect(client.createUser(newUser)).rejects.toMatchObject({ status: 502 });
  });

  it('is not configured without a URL or service credentials (503)', async () => {
    const noUrl = build(null);
    expect(noUrl.configured).toBe(false);
    await expect(noUrl.createUser(newUser)).rejects.toMatchObject({ status: 503 });
    await expect(noUrl.logoutUser('u1')).rejects.toMatchObject({ status: 503 });

    when(tokens.configured).thenReturn(false);
    const noCreds = build();
    expect(noCreds.configured).toBe(false);
    verify(tokens.fetch(anything(), anything())).never();
  });

  it('maps a network failure to 503', async () => {
    const client = build();
    when(tokens.fetch(anything(), anything())).thenReject(new Error('ECONNREFUSED'));
    await expect(client.logoutUser('u1')).rejects.toMatchObject({ status: 503 });
  });

  it('logoutUser: 204 and 404 are success, other errors are false', async () => {
    const client = build();
    when(tokens.fetch(anything(), anything())).thenResolve(res(204));
    await expect(client.logoutUser('u 1')).resolves.toBe(true);
    expect(capture(tokens.fetch).last()[0]).toBe('http://identity:8080/auth/admin/realms/lodestar/users/u%201/logout');
    when(tokens.fetch(anything(), anything())).thenResolve(res(404));
    await expect(client.logoutUser('u1')).resolves.toBe(true);
    when(tokens.fetch(anything(), anything())).thenResolve(res(500));
    await expect(client.logoutUser('u1')).resolves.toBe(false);
  });

  it('setEnabled tolerates 404 and fails on other errors', async () => {
    const client = build();
    when(tokens.fetch(anything(), anything())).thenResolve(res(404));
    await expect(client.setEnabled('u1', false)).resolves.toBeUndefined();
    when(tokens.fetch(anything(), anything())).thenResolve(res(500));
    await expect(client.setEnabled('u1', false)).rejects.toMatchObject({ status: 502 });
  });
});
