import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataAction, ODataEntitySet, ODataFunction, OperationContext } from '@lodestar/odata';
import { Roles } from '@lodestar/security';
import { SyncService } from './sync.service';

/** Offline events replayed from field devices (read-only; written by PushBatch). */
@Injectable()
@EntitySet({
  name: 'OfflineEvents',
  model: 'OfflineEvent',
  read: [Roles.Driver, Roles.Dispatcher, Roles.Admin, Roles.Service],
  abac: {
    depot: (depots) => ({ trip: { is: { depot: { in: depots } } } }),
    vehicle: (vehicleId) => ({ trip: { is: { vehicleId } } }),
  },
  navigation: ['trip'],
  search: ['eventType', 'conflictNote'],
  defaultOrderBy: 'savedAt desc',
})
export class OfflineEventsSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly sync: SyncService,
  ) {
    super(prisma);
  }

  /** POST OfflineEvents/Lodestar.PushBatch {events: [...]} — the field app's reconnect replay. */
  @ODataAction({
    name: 'PushBatch',
    binding: 'collection',
    roles: [Roles.Driver],
    params: { events: { type: 'Collection(Edm.Untyped)', required: true } },
    returns: 'Edm.Untyped',
  })
  pushBatch(ctx: OperationContext) {
    return this.sync.pushBatch(ctx.principal, this.sync.validate(ctx.params.events));
  }

  /** GET OfflineEvents/Lodestar.SyncStatus(tripId='…') */
  @ODataFunction({
    name: 'SyncStatus',
    binding: 'collection',
    roles: [Roles.Driver, Roles.Dispatcher, Roles.Admin],
    params: { tripId: { type: 'Edm.String', required: true } },
    returns: 'Edm.Untyped',
  })
  syncStatus(ctx: OperationContext) {
    return this.sync.getSyncStatus(ctx.params.tripId, ctx.rowFilter);
  }
}
