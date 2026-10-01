import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildEdmModel, DmmfDatamodel } from './edm/model';
import { ODataEngine } from './engine';
import { ODataEntitySet } from './entity-set';
import { ODataController } from './odata.controller';
import { ODataRegistry } from './registry';
import { ServiceDocumentEntry } from './service-map';

export interface ODataModuleOptions {
  /** Service name; also the prefix of the service scopes (orders.read / orders.write). */
  service: string;
  /** Classes decorated with @EntitySet, extending ODataEntitySet. */
  entitySets: Type<ODataEntitySet>[];
  /** Classes holding unbound @ODataAction/@ODataFunction methods. */
  operations?: Type<object>[];
  /** Domain providers the entity sets depend on (services, clients). */
  providers?: Provider[];
  /** Complex types returned by operations: name → { property: EDM type }. */
  complexTypes?: Record<string, Record<string, string>>;
  /** Serve this list at GET /odata/v4/ instead of the service's own sets (the merged document). */
  serviceDocument?: ServiceDocumentEntry[];
  /** Defaults to the generated Prisma client's DMMF. */
  datamodel?: DmmfDatamodel;
}

/**
 * One call per service wires its OData API:
 *
 *   ODataModule.forRoot({ service: 'orders', entitySets: [OrdersSet], providers: [OrdersService] })
 *
 * serves /odata/v4, /odata/v4/$metadata, the entity sets and their operations.
 */
@Module({})
export class ODataModule {
  static forRoot(options: ODataModuleOptions): DynamicModule {
    const handlers = [...options.entitySets, ...(options.operations ?? [])];
    return {
      module: ODataModule,
      controllers: [ODataController],
      providers: [
        ...(options.providers ?? []),
        ...handlers,
        {
          provide: ODataRegistry,
          useFactory: (...instances: object[]) =>
            new ODataRegistry(
              options.service,
              buildEdmModel(options.datamodel ?? (Prisma.dmmf.datamodel as unknown as DmmfDatamodel)),
              instances.slice(0, options.entitySets.length) as ODataEntitySet[],
              instances.slice(options.entitySets.length),
            ),
          inject: handlers,
        },
        {
          provide: ODataEngine,
          useFactory: (registry: ODataRegistry) => new ODataEngine(registry, options.complexTypes, options.serviceDocument),
          inject: [ODataRegistry],
        },
      ],
      exports: [ODataRegistry, ODataEngine, ...handlers],
    };
  }
}
