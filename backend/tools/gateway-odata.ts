/**
 * Generates the gateway's merged OData service document and $metadata
 * (backend/apps/gateway/odata/) from every service's entity-set declarations
 * and the Prisma schema, so the edge always matches the services.
 *
 *   npm run gen:gateway          (re-run after changing entity sets or the schema)
 *
 * A unit test fails when the committed files are out of date.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Prisma } from '@prisma/client';
import { buildEdmModel, CsdlOperation, DmmfDatamodel, generateCsdl, ODataEntitySet, ODataRegistry } from '@lodestar/odata';
import { AuditEntriesSet, CHAIN_CHECK_TYPE } from '../apps/audit/src/audit-entries.set';
import { DevicesSet, UsersSet } from '../apps/auth/src/auth.sets';
import { VehiclesSet } from '../apps/fleet/src/vehicles.set';
import { NotificationsSet } from '../apps/notifications/src/notifications.set';
import { OrderLineItemsSet, ORDERS_SUMMARY_TYPE, OrdersSet } from '../apps/orders/src/orders.sets';
import { CalendarSet, DataImportsSet, DistrictTravelSet, OutletsSet, ServiceAllowancesSet } from '../apps/outlets/src/outlets.sets';
import { AgentRunsSet, DeferralsSet, PlansSet } from '../apps/planning/src/planning.sets';
import { OfflineEventsSet } from '../apps/sync/src/offline-events.set';
import { LoadRecordsSet, PODsSet, TripStopsSet, TripsSet } from '../apps/trips/src/trips.sets';

/** Entity sets per owning service — the same table as the gateway routing map. */
export const SERVICE_SETS: Record<string, Function[]> = {
  auth: [UsersSet, DevicesSet],
  orders: [OrdersSet, OrderLineItemsSet],
  planning: [PlansSet, DeferralsSet, AgentRunsSet],
  fleet: [VehiclesSet],
  outlets: [OutletsSet, CalendarSet, DistrictTravelSet, ServiceAllowancesSet, DataImportsSet],
  trips: [TripsSet, TripStopsSet, PODsSet, LoadRecordsSet],
  sync: [OfflineEventsSet],
  notifications: [NotificationsSet],
  audit: [AuditEntriesSet],
};

const COMPLEX_TYPES = { ChainCheck: CHAIN_CHECK_TYPE, OrdersSummary: ORDERS_SUMMARY_TYPE };

export function buildGatewayOData() {
  const model = buildEdmModel(Prisma.dmmf.datamodel as unknown as DmmfDatamodel);
  const registries = Object.entries(SERVICE_SETS).map(
    // Declarations only: instances are created without running constructors.
    ([service, classes]) => new ODataRegistry(service, model, classes.map((c) => Object.create(c.prototype) as ODataEntitySet)),
  );

  const sets = registries.flatMap((r) => [...r.sets.values()]);
  const operations: CsdlOperation[] = registries.flatMap((r) => r.csdlOperations());
  const hidden = registries.reduce<Record<string, string[]>>((acc, r) => {
    for (const [t, f] of Object.entries(r.hiddenFields())) acc[t] = [...new Set([...(acc[t] ?? []), ...f])];
    return acc;
  }, {});

  const metadata = generateCsdl(model, {
    entitySets: sets.map((s) => ({ name: s.options.name, entityType: s.type.name })),
    operations,
    complexTypes: COMPLEX_TYPES,
    isHidden: (t, p) => !!hidden[t]?.includes(p),
  });

  const functionImports = operations.filter((o) => o.binding === 'unbound' && o.kind === 'function').map((o) => o.name);
  const serviceDocument = {
    '@odata.context': '$metadata',
    value: [
      ...sets.map((s) => ({ name: s.options.name, kind: 'EntitySet', url: s.options.name })),
      ...functionImports.map((name) => ({ name, kind: 'FunctionImport', url: name })),
    ],
  };
  return { serviceDocument: JSON.stringify(serviceDocument, null, 2) + '\n', metadata };
}

export const GATEWAY_ODATA_DIR = join(__dirname, '..', 'apps', 'gateway', 'odata');

if (require.main === module) {
  const { serviceDocument, metadata } = buildGatewayOData();
  mkdirSync(GATEWAY_ODATA_DIR, { recursive: true });
  writeFileSync(join(GATEWAY_ODATA_DIR, 'service-document.json'), serviceDocument);
  writeFileSync(join(GATEWAY_ODATA_DIR, 'metadata.xml'), metadata);
  console.log(`Wrote ${GATEWAY_ODATA_DIR}/service-document.json and metadata.xml`);
}
