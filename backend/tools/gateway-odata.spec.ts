import { readFileSync } from 'fs';
import { join } from 'path';
import { ENTITY_SET_OWNERS, entitySetOptions, FUNCTION_IMPORT_OWNERS, LODESTAR_SERVICE_DOCUMENT } from '@lodestar/odata';
import { buildGatewayOData, GATEWAY_ODATA_DIR, SERVICE_SETS } from './gateway-odata';

describe('gateway OData documents', () => {
  const generated = buildGatewayOData();

  it('lists every entity set of PLATFORM.md §3 exactly once', () => {
    const doc = JSON.parse(generated.serviceDocument);
    const sets = doc.value.filter((v: any) => v.kind === 'EntitySet').map((v: any) => v.name);
    expect(sets.sort()).toEqual(
      [
        'Orders', 'OrderLineItems', 'Plans', 'Deferrals', 'Vehicles', 'Depots', 'Outlets', 'Calendar', 'DistrictTravel', 'ServiceAllowances',
        'Trips', 'TripStops', 'PODs', 'LoadRecords', 'OfflineEvents', 'Notifications', 'AuditEntries', 'Users', 'Devices', 'AgentRuns', 'DataImports',
      ].sort(),
    );
    expect(doc.value).toContainEqual({ name: 'Me', kind: 'FunctionImport', url: 'Me' });
    expect(Object.keys(SERVICE_SETS)).toHaveLength(9);
  });

  it('keeps the owner map (routing + auth merged document) in line with the declarations', () => {
    const declared: Record<string, string> = {};
    for (const [service, classes] of Object.entries(SERVICE_SETS)) for (const c of classes) declared[entitySetOptions(c)!.name] = service;
    expect(ENTITY_SET_OWNERS).toEqual(declared);
    expect(FUNCTION_IMPORT_OWNERS).toEqual({ Me: 'auth' });
    expect(JSON.parse(generated.serviceDocument).value).toEqual(expect.arrayContaining(LODESTAR_SERVICE_DOCUMENT));
  });

  it('keeps the NGINX routing map in line with the owner map', () => {
    const conf = readFileSync(join(GATEWAY_ODATA_DIR, '..', 'nginx.conf'), 'utf8');
    const ports: Record<string, number> = { auth: 3001, orders: 3002, planning: 3003, fleet: 3004, outlets: 3005, trips: 3006, sync: 3007, notifications: 3008, audit: 3009 };
    for (const [name, service] of Object.entries({ ...ENTITY_SET_OWNERS, ...FUNCTION_IMPORT_OWNERS })) {
      expect(conf).toMatch(new RegExp(`\\n\\s+${name}\\s+${service}:${ports[service]};`));
    }
  });

  it('declares the Lodestar actions and hides credentials', () => {
    for (const op of ['Approve', 'Confirm', 'Release', 'CompleteStop', 'PushBatch', 'Resume', 'VerifyChain']) {
      expect(generated.metadata).toMatch(new RegExp(`<(Action|Function) Name="${op}"`));
    }
    expect(generated.metadata).not.toContain('passwordHash');
    expect(generated.metadata).toContain('<ComplexType Name="ChainCheck">');
  });

  it('matches the files committed for the gateway (run `npm run gen:gateway`)', () => {
    expect(readFileSync(join(GATEWAY_ODATA_DIR, 'service-document.json'), 'utf8').replace(/\r\n/g, '\n')).toBe(generated.serviceDocument);
    expect(readFileSync(join(GATEWAY_ODATA_DIR, 'metadata.xml'), 'utf8').replace(/\r\n/g, '\n')).toBe(generated.metadata);
  });
});
