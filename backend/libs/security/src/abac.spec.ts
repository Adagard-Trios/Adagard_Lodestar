import { personas, principal } from '../test/principals';
import { AbacRules, andWhere, canAccessDepot, canAccessOutlet, MATCH_NOTHING, missingScopes, rowFilter } from './abac';
import { hasAnyRole, isPrivileged, normaliseDepots, principalFromClaims, serviceName } from './principal';

const rules: AbacRules = {
  depot: (d) => ({ depot: { in: d } }),
  outlet: (o) => ({ outletId: o }),
  vehicle: (v) => ({ vehicleId: v }),
};

describe('rowFilter (ABAC)', () => {
  it('does not restrict admins and service identities', () => {
    expect(rowFilter(personas.admin, rules)).toBeUndefined();
    expect(rowFilter(personas.agent, rules)).toBeUndefined();
  });

  it('scopes each role by its claim', () => {
    expect(rowFilter(personas.nilanthi, rules)).toEqual({ depot: { in: ['PELIYAGODA', 'KANDY'] } });
    expect(rowFilter(personas.kasun, rules)).toEqual({ depot: { in: ['KANDY'] } });
    expect(rowFilter(personas.fathima, rules)).toEqual({ outletId: 'OUT106' });
    expect(rowFilter(personas.ruwan, rules)).toEqual({ vehicleId: 'VEH057' });
  });

  it('denies by default: no rules, no rule for the role, or a missing claim', () => {
    expect(rowFilter(personas.fathima, undefined)).toBe(MATCH_NOTHING);
    expect(rowFilter(personas.fathima, { depot: rules.depot })).toEqual({ OR: [] });
    expect(rowFilter(principal({ roles: ['driver'] }), rules)).toEqual({ OR: [] });
    expect(rowFilter(principal({ roles: [] }), rules)).toEqual({ OR: [] });
  });

  it('unions the scopes of several roles', () => {
    const both = principal({ roles: ['dispatcher', 'driver'], depots: ['KANDY'], vehicleId: 'VEH057' });
    expect(rowFilter(both, rules)).toEqual({ OR: [{ depot: { in: ['KANDY'] } }, { vehicleId: 'VEH057' }] });
  });

  it('opens reference data to listed roles or everyone', () => {
    expect(rowFilter(personas.fathima, { ...rules, open: ['store_manager'] })).toBeUndefined();
    expect(rowFilter(personas.fathima, { open: '*' })).toBeUndefined();
  });

  it('ANDs the self rule for every non-privileged caller', () => {
    const self: AbacRules = { open: '*', self: (p) => ({ recipientId: p.sub }) };
    expect(rowFilter(personas.ruwan, self)).toEqual({ recipientId: 'ruwan' });
    expect(rowFilter(personas.admin, self)).toBeUndefined();
    expect(rowFilter(personas.nilanthi, { ...rules, self: (p) => ({ ownerId: p.sub }) })).toEqual({
      AND: [{ depot: { in: ['PELIYAGODA', 'KANDY'] } }, { ownerId: 'nilanthi' }],
    });
  });
});

describe('write-side ABAC helpers', () => {
  it('checks depots and outlets', () => {
    expect(canAccessDepot(personas.nilanthi, 'kandy')).toBe(true);
    expect(canAccessDepot(personas.kasun, 'PELIYAGODA')).toBe(false);
    expect(canAccessDepot(personas.kasun, null)).toBe(false);
    expect(canAccessDepot(personas.admin, 'PELIYAGODA')).toBe(true);
    expect(canAccessOutlet(personas.fathima, 'OUT106')).toBe(true);
    expect(canAccessOutlet(personas.fathima, 'OUT108')).toBe(false);
    expect(canAccessOutlet(personas.nilanthi, 'OUT106')).toBe(false);
    expect(canAccessOutlet(personas.agent, 'OUT106')).toBe(true);
  });

  it('reports missing route scopes for the roles held', () => {
    expect(missingScopes(personas.fathima, ['outlet'])).toEqual([]);
    expect(missingScopes(principal({ roles: ['store_manager'] }), ['outlet', 'depot'])).toEqual(['outlet']);
    expect(missingScopes(principal({ roles: ['auditor' as any] }), ['depot'])).toEqual(['depot']);
    expect(missingScopes(personas.admin, ['vehicle'])).toEqual([]);
    expect(missingScopes(personas.ruwan, [])).toEqual([]);
  });

  it('andWhere drops empty parts', () => {
    expect(andWhere(undefined, {}, null)).toBeUndefined();
    expect(andWhere({ a: 1 }, undefined)).toEqual({ a: 1 });
    expect(andWhere({ a: 1 }, { b: 2 })).toEqual({ AND: [{ a: 1 }, { b: 2 }] });
  });
});

describe('principalFromClaims', () => {
  it('reads Keycloak and Entra ID role layouts and ABAC claims', () => {
    const p = principalFromClaims({
      sub: 's',
      realm_access: { roles: ['driver', 'uma_authorization'] },
      roles: ['svc'],
      azp: 'svc-sync',
      scope: 'trips.read audit.write',
      depot: 'kandy, peliyagoda',
      outlet_id: [' OUT106 '],
      vehicle_id: 'VEH057',
      device_id: '',
      email: 'x@y',
      name: 'X',
    } as any);
    expect(p).toMatchObject({
      roles: ['driver', 'svc'],
      clientId: 'svc-sync',
      scopes: ['trips.read', 'audit.write'],
      depots: ['KANDY', 'PELIYAGODA'],
      outletId: 'OUT106',
      vehicleId: 'VEH057',
      deviceId: undefined,
      isService: true,
    });
    expect(serviceName(p)).toBe('sync');
    expect(isPrivileged(p)).toBe(true);
    expect(hasAnyRole(p, ['admin'])).toBe(false);
  });

  it('reads Entra app roles: realm-style roles and permission scopes', () => {
    const p = principalFromClaims({ sub: 'guid', azp: 'app-guid', roles: ['svc', 'orders.read', 'audit.write'] } as any);
    expect(p).toMatchObject({ roles: ['svc'], scopes: ['orders.read', 'audit.write'], isService: true });
    expect(principalFromClaims({ scp: 'user_impersonation', roles: ['dispatcher'] } as any).scopes).toEqual(['user_impersonation']);
  });

  it('handles Entra-style scp and appid and missing claims', () => {
    const p = principalFromClaims({ appid: 'app', scp: ['a'] } as any);
    expect(p).toMatchObject({ sub: '', roles: [], clientId: 'app', scopes: ['a'], depots: [], isService: false });
    expect(serviceName(p)).toBeUndefined();
    expect(principalFromClaims({ client_id: 'c' } as any).clientId).toBe('c');
    expect(normaliseDepots(42)).toEqual([]);
  });
});
