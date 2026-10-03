import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { assertDepotCode, DEPOT_CODE, EntitySet, ODataAction, ODataEntitySet, ODataError, ODataFunction, OperationContext } from '@lodestar/odata';
import { HUMAN_ROLES, Roles } from '@lodestar/security';
import { DataImportService, ImportFile } from './data-import.service';
import { OutletsService } from './outlets.service';

const EVERYONE = [...HUMAN_ROLES, Roles.Service];

/**
 * Depots (ADM-21): the depot registry every app reads its depot names from. Every signed-in caller reads it
 * (field and store roles see the active depots; admins also the deactivated ones); only admins register, edit
 * or deactivate a depot (PATCH isActive=false), each write audited. A depot's code is its key and never changes.
 */
@Injectable()
@EntitySet({
  name: 'Depots',
  model: 'Depot',
  read: EVERYONE,
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: { open: '*', self: () => ({ isActive: true }) },
  search: ['code', 'name', 'district', 'address'],
  insertable: ['code', 'name', 'address', 'district', 'lat', 'lng', 'phone'],
  updatable: ['name', 'address', 'district', 'lat', 'lng', 'phone', 'isActive'],
  defaultOrderBy: 'name',
})
export class DepotsSet extends ODataEntitySet {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trims text fields and refuses blanks, bad coordinates and phone numbers that are not a number. */
  private check(d: Record<string, any>, creating: boolean) {
    for (const f of ['name', 'district', 'address', 'phone']) {
      if (typeof d[f] === 'string') d[f] = d[f].trim() || (f === 'address' || f === 'phone' ? null : '');
    }
    for (const f of ['name', 'district']) {
      if ((creating || f in d) && !d[f]) throw ODataError.badRequest(`${f} is required`, f);
      if (d[f] && d[f].length > 80) throw ODataError.badRequest(`${f} is at most 80 characters`, f);
    }
    if (d.lat !== undefined && d.lat !== null && (d.lat < -90 || d.lat > 90)) throw ODataError.badRequest('lat must be between -90 and 90', 'lat');
    if (d.lng !== undefined && d.lng !== null && (d.lng < -180 || d.lng > 180)) throw ODataError.badRequest('lng must be between -180 and 180', 'lng');
    if (d.phone && !/^\+?[0-9 ()-]{7,20}$/.test(d.phone)) throw ODataError.badRequest('phone must be a phone number', 'phone');
  }

  async beforeCreate(data: Record<string, any>) {
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
    if (!DEPOT_CODE.test(code)) {
      throw ODataError.badRequest('code must be 2-32 upper-case letters, digits or _ starting with a letter (e.g. GALLE)', 'code');
    }
    if (await this.prisma.depot.findUnique({ where: { code }, select: { code: true } })) {
      throw ODataError.conflict(`Depot ${code} is already registered`, 'code');
    }
    this.check(data, true);
    return { ...data, code };
  }

  /** Deactivating a depot that still has active outlets or vehicles would strand them: move them first. */
  async beforeUpdate(patch: Record<string, any>, current: any) {
    this.check(patch, false);
    if (patch.isActive === false && current.isActive) {
      const [outlets, vehicles] = await Promise.all([
        this.prisma.outlet.count({ where: { depot: current.code, isActive: true } }),
        this.prisma.vehicle.count({ where: { depot: current.code } }),
      ]);
      if (outlets || vehicles) {
        throw ODataError.unprocessable(
          'DepotInUse',
          `${current.name} still has ${outlets} active outlet${outlets === 1 ? '' : 's'} and ${vehicles} vehicle${vehicles === 1 ? '' : 's'}: move them to another depot first`,
          'isActive',
        );
      }
    }
    return patch;
  }
}

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
    data.depot = await assertDepotCode(this.prisma, data.depot);
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

  async beforeCreate(data: Record<string, any>) {
    data.depot = await assertDepotCode(this.prisma, data.depot);
    return data;
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

/**
 * DataImports: reference-data CSV imports (ADM-14 data imports, ADM-15 import check failed). Admins only.
 *  - POST DataImports/Lodestar.Import {file, csv, fileName?} checks the whole file with the seed's row mappers and
 *    file-level checks and applies it only when every row passes (all or nothing, seed-style upserts). The result
 *    (counts, checks, rejected rows with plain-words reasons) is the new row; the CSV itself is never stored.
 *  - file: outlets | vehicles | calendar | district_travel | service_allowance. vehicles.csv writes the fleet
 *    reference columns (never status, workshop note or fuel used), as the seed does.
 */
@Injectable()
@EntitySet({
  name: 'DataImports',
  model: 'DataImport',
  read: [Roles.Admin],
  abac: {}, // admins only
  search: ['file', 'fileName', 'byName'],
  defaultOrderBy: 'importedAt desc',
})
export class DataImportsSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly imports: DataImportService,
  ) {
    super(prisma);
  }

  @ODataAction({
    name: 'Import',
    binding: 'collection',
    roles: [Roles.Admin],
    params: { file: { type: 'Edm.String', required: true }, csv: { type: 'Edm.String', required: true }, fileName: 'Edm.String' },
    returns: 'Lodestar.DataImport',
  })
  import(ctx: OperationContext) {
    return this.imports.import(ctx.params.file as ImportFile, ctx.params.csv as string, ctx.params.fileName as string | undefined, ctx.principal);
  }
}
