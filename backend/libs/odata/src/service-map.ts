/**
 * Which service owns each entity set and unbound function (PLATFORM.md §3).
 * The same table drives the NGINX routing map (local) and the merged service
 * document that `auth` serves at GET /odata/v4/ (AKS has no NGINX). A unit
 * test (tools/gateway-odata.spec.ts) fails if it drifts from the declarations.
 */
export const ENTITY_SET_OWNERS: Readonly<Record<string, string>> = {
  Users: 'auth',
  Devices: 'auth',
  Orders: 'orders',
  OrderLineItems: 'orders',
  Plans: 'planning',
  Deferrals: 'planning',
  AgentRuns: 'planning',
  Vehicles: 'fleet',
  Outlets: 'outlets',
  Calendar: 'outlets',
  DistrictTravel: 'outlets',
  ServiceAllowances: 'outlets',
  DataImports: 'outlets',
  Trips: 'trips',
  TripStops: 'trips',
  PODs: 'trips',
  LoadRecords: 'trips',
  OfflineEvents: 'sync',
  Notifications: 'notifications',
  AuditEntries: 'audit',
};

export const FUNCTION_IMPORT_OWNERS: Readonly<Record<string, string>> = {
  Me: 'auth',
};

export interface ServiceDocumentEntry {
  name: string;
  kind: 'EntitySet' | 'FunctionImport';
  url: string;
}

/** Every entity set and function import of the Lodestar API, for the merged service document. */
export const LODESTAR_SERVICE_DOCUMENT: ServiceDocumentEntry[] = [
  ...Object.keys(ENTITY_SET_OWNERS).map((name) => ({ name, kind: 'EntitySet' as const, url: name })),
  ...Object.keys(FUNCTION_IMPORT_OWNERS).map((name) => ({ name, kind: 'FunctionImport' as const, url: name })),
];
