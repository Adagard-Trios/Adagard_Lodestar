import { Principal } from '../src/principal';
import { Role } from '../src/roles';

/** Builds a Principal for unit tests (as if decoded from a verified token). */
export function principal(overrides: Partial<Principal> & { roles?: Role[] } = {}): Principal {
  const roles = overrides.roles ?? [];
  return {
    sub: 'user-1',
    roles,
    scopes: [],
    depots: [],
    isService: roles.includes('svc'),
    claims: {},
    ...overrides,
  };
}

/** The demo personas (PLATFORM.md / realm export). */
export const personas = {
  fathima: principal({ sub: 'fathima', roles: ['store_manager'], outletId: 'OUT106', depots: ['KANDY'], clientId: 'lodestar-web' }),
  nilanthi: principal({ sub: 'nilanthi', roles: ['dispatcher'], depots: ['PELIYAGODA', 'KANDY'], clientId: 'lodestar-web' }),
  kasun: principal({ sub: 'kasun', roles: ['loader'], depots: ['KANDY'], deviceId: 'DEV-KJ-01', clientId: 'lodestar-field' }),
  ruwan: principal({ sub: 'ruwan', roles: ['driver'], depots: ['KANDY'], vehicleId: 'VEH057', deviceId: 'DEV-RB-01', clientId: 'lodestar-field' }),
  admin: principal({ sub: 'admin', roles: ['admin'], clientId: 'lodestar-web' }),
  agent: principal({ sub: 'svc-agent-sa', roles: ['svc'], clientId: 'svc-agent', scopes: ['planning.read', 'planning.write'] }),
};
