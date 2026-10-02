import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataEntitySet, ODataError, ODataFunction, OperationContext } from '@lodestar/odata';
import { HUMAN_ROLES, Roles } from '@lodestar/security';
import { OutletsService } from './outlets.service';

const EVERYONE = [...HUMAN_ROLES, Roles.Service];

/**
 * Outlets: dispatch and loaders see their depots, a store manager their own
 * outlet, a driver the outlets on their vehicle's trips.
 */
@Injectable()
@EntitySet({
  name: 'Outlets',
  model: 'Outlet',
  read: EVERYONE,
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: {
    depot: (depots) => ({ depot: { in: depots } }),
    outlet: (outletId) => ({ id: outletId }),
    vehicle: (vehicleId) => ({ tripStops: { some: { trip: { is: { vehicleId } } } } }),
  },
  search: ['id', 'name', 'district', 'address'],
  insertable: ['id', 'name', 'brand', 'district', 'depot', 'dockType', 'parking', 'windowOpen', 'windowClose', 'mallWindow', 'address', 'accessNote', 'lat', 'lng'],
  updatable: ['name', 'dockType', 'parking', 'windowOpen', 'windowClose', 'mallWindow', 'address', 'accessNote', 'lat', 'lng', 'isActive'],
  defaultOrderBy: 'depot,district,brand,id',
})
export class OutletsSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly outlets: OutletsService,
  ) {
    super(prisma);
  }

  private checkWindow(open: string, close: string) {
    if (!this.outlets.validWindow(open, close)) throw ODataError.badRequest('Delivery window must be HH:mm with open before close');
  }

  /** A mall's delivery window is "HH:mm-HH:mm" (or null). */
  private checkMallWindow(mallWindow: unknown) {
    if (mallWindow === undefined || mallWindow === null) return;
    const [open, close, ...rest] = String(mallWindow).split('-');
    if (rest.length || !this.outlets.validWindow(open, close ?? '')) {
      throw ODataError.badRequest('mallWindow must be "HH:mm-HH:mm" with open before close', 'mallWindow');
    }
  }

  async beforeCreate(data: Record<string, any>) {
    this.checkWindow(data.windowOpen, data.windowClose);
    this.checkMallWindow(data.mallWindow);
    return data;
  }

  async beforeUpdate(patch: Record<string, any>, current: any) {
    if (patch.windowOpen || patch.windowClose) {
      this.checkWindow(patch.windowOpen ?? current.windowOpen, patch.windowClose ?? current.windowClose);
    }
    this.checkMallWindow(patch.mallWindow);
    return patch;
  }

  /** GET Outlets('OUT106')/Lodestar.IsWindowOpen() */
  @ODataFunction({ name: 'IsWindowOpen', binding: 'entity', roles: EVERYONE, returns: 'Edm.Boolean' })
  isWindowOpen(ctx: OperationContext) {
    return this.outlets.isWindowOpen(ctx.entity);
  }
}

/** Operating calendar (ADM-13). Reference data: every authenticated caller may read it. */
@Injectable()
@EntitySet({
  name: 'Calendar',
  model: 'Calendar',
  read: EVERYONE,
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: { open: '*' },
  search: ['festivalName', 'note'],
  insertable: ['date', 'isOperating', 'isPayday', 'festivalRamp', 'monsoon', 'festivalName', 'note'],
  updatable: ['isOperating', 'isPayday', 'festivalRamp', 'monsoon', 'festivalName', 'note'],
  defaultOrderBy: 'date',
})
export class CalendarSet extends ODataEntitySet {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

/** Depot → district travel times (ADM-12 operating rules). */
@Injectable()
@EntitySet({
  name: 'DistrictTravel',
  model: 'DistrictTravel',
  read: EVERYONE,
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: { open: '*' },
  search: ['district'],
  insertable: ['district', 'depot', 'roadClass', 'depotToDistMin', 'interStopMin', 'distKm'],
  updatable: ['roadClass', 'depotToDistMin', 'interStopMin', 'distKm'],
  defaultOrderBy: 'depot,district',
})
export class DistrictTravelSet extends ODataEntitySet {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

/** Service minutes per brand × dock type; composite key ServiceAllowances(brand='FRESH',dockType='REAR_DOCK'). */
@Injectable()
@EntitySet({
  name: 'ServiceAllowances',
  model: 'ServiceAllowance',
  read: EVERYONE,
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: { open: '*' },
  insertable: ['brand', 'dockType', 'minutes'],
  updatable: ['minutes'],
  defaultOrderBy: 'brand,dockType',
})
export class ServiceAllowancesSet extends ODataEntitySet {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async beforeUpdate(patch: Record<string, any>) {
    if (patch.minutes !== undefined && (patch.minutes < 1 || patch.minutes > 240)) {
      throw ODataError.badRequest('minutes must be between 1 and 240', 'minutes');
    }
    return patch;
  }
}
