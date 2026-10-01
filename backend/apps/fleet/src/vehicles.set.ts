import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataAction, ODataEntitySet, ODataError, ODataFunction, OperationContext } from '@lodestar/odata';
import { Roles } from '@lodestar/security';
import { FleetService } from './fleet.service';

/** Vehicles: dispatchers and loaders see their depots' fleet, drivers their own vehicle. */
@Injectable()
@EntitySet({
  name: 'Vehicles',
  model: 'Vehicle',
  read: [Roles.Dispatcher, Roles.Loader, Roles.Driver, Roles.Admin, Roles.Service],
  create: [Roles.Admin],
  update: [Roles.Dispatcher, Roles.Admin],
  abac: {
    depot: (depots) => ({ depot: { in: depots } }),
    vehicle: (vehicleId) => ({ id: vehicleId }),
  },
  navigation: ['trips'],
  search: ['id', 'workshopNote'],
  insertable: ['id', 'depot', 'type', 'tempClass', 'capacityKg', 'capacityM3', 'kmPerLitre', 'weeklyLFuel', 'status', 'workshopNote'],
  updatable: ['status', 'workshopNote', 'weeklyLFuel'],
  defaultOrderBy: 'depot,tempClass desc,id',
})
export class VehiclesSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly fleet: FleetService,
  ) {
    super(prisma);
  }

  /** POST Vehicles('VEH004')/Lodestar.SetStatus {status, workshopNote?} (ADM-11) */
  @ODataAction({
    name: 'SetStatus',
    binding: 'entity',
    roles: [Roles.Dispatcher, Roles.Admin],
    params: { status: { type: 'Lodestar.VehicleStatus', required: true }, workshopNote: 'Edm.String' },
    returns: 'Lodestar.Vehicle',
  })
  setStatus(ctx: OperationContext) {
    return this.fleet.updateStatus(ctx.entity.id, ctx.params.status, ctx.params.workshopNote);
  }

  /** POST Vehicles('VEH057')/Lodestar.RecordFuel {litres} */
  @ODataAction({
    name: 'RecordFuel',
    binding: 'entity',
    roles: [Roles.Dispatcher, Roles.Driver, Roles.Admin, Roles.Service],
    params: { litres: { type: 'Edm.Double', required: true } },
    returns: 'Lodestar.Vehicle',
  })
  recordFuel(ctx: OperationContext) {
    const litres = ctx.params.litres as number;
    if (!(litres > 0 && litres < 1000)) throw ODataError.badRequest('litres must be between 0 and 1000', 'litres');
    return this.fleet.updateFuelUsage(ctx.entity.id, litres);
  }

  /** GET Vehicles/Lodestar.Summary() — fleet board counts. */
  @ODataFunction({
    name: 'Summary',
    binding: 'collection',
    roles: [Roles.Dispatcher, Roles.Loader, Roles.Admin, Roles.Service],
    returns: 'Edm.Untyped',
  })
  summary(ctx: OperationContext) {
    return this.fleet.getSummary(ctx.rowFilter);
  }
}
