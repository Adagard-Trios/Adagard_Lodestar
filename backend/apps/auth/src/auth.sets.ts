import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataAction, ODataEntitySet, ODataError, ODataFunction, OperationContext, WriteContext } from '@lodestar/odata';
import { ALL_ROLES, DEVICE_ID_PATTERN, HUMAN_ROLES, isPrivileged, Roles } from '@lodestar/security';
import { DeviceStatus } from '@prisma/client';
import { AuthService, REALM_ROLE } from './auth.service';

/** Users: the directory (ADM-03/04). Dispatchers see people of their depots. */
@Injectable()
@EntitySet({
  name: 'Users',
  model: 'User',
  read: [Roles.Admin, Roles.Dispatcher, Roles.Service],
  create: [Roles.Admin],
  update: [Roles.Admin],
  abac: { depot: (depots) => ({ depot: { in: depots } }) },
  navigation: ['outlet', 'devices'],
  search: ['name', 'email'],
  // Personal settings are never part of the directory: only the user reads them (MyPreferences).
  hidden: ['preferences'],
  insertable: ['id', 'email', 'name', 'role', 'depot', 'outletId', 'vehicleId', 'phone'],
  updatable: ['name', 'role', 'depot', 'outletId', 'vehicleId', 'phone', 'isActive'],
  defaultOrderBy: 'name',
})
export class UsersSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly auth: AuthService,
  ) {
    super(prisma);
  }

  /** Validation only: the identity is created in create(), next to the row, so it can be compensated. */
  async beforeCreate(data: Record<string, any>) {
    for (const f of ['email', 'name', 'role']) if (!data[f]) throw ODataError.badRequest(`${f} is required`, f);
    // role is an enum already validated by the OData body coercion; guard the REALM_ROLE mapping too.
    if (!REALM_ROLE[data.role as keyof typeof REALM_ROLE]) throw ODataError.badRequest('Unknown role', 'role');
    if (data.role === 'STORE_MANAGER' && !data.outletId) throw ODataError.badRequest('A store manager needs an outletId', 'outletId');
    await this.checkVehicle(data.vehicleId);
    return data;
  }

  /** Keycloak user, then the directory row; a failed insert deletes the Keycloak user again. */
  create(data: Record<string, any>, ctx: WriteContext) {
    return this.auth.createUser(data, ctx.principal);
  }

  async beforeUpdate(patch: Record<string, any>, current: any) {
    const role = patch.role ?? current.role;
    const outletId = 'outletId' in patch ? patch.outletId : current.outletId;
    if (role === 'STORE_MANAGER' && !outletId) throw ODataError.badRequest('A store manager needs an outletId', 'outletId');
    if ('vehicleId' in patch) await this.checkVehicle(patch.vehicleId);
    return patch;
  }

  /** Directory row and Keycloak (role, ABAC attributes, enabled, sessions) together, or neither. */
  updateWhere(where: Record<string, any>, data: Record<string, any>, ctx?: WriteContext) {
    if (!ctx) throw new Error('UsersSet.updateWhere needs the write context');
    return this.auth.updateUser(where, data, ctx.principal);
  }

  private async checkVehicle(vehicleId: unknown) {
    if (vehicleId === undefined || vehicleId === null) return;
    if (typeof vehicleId !== 'string' || !/^[A-Za-z0-9-]{1,32}$/.test(vehicleId)) {
      throw ODataError.badRequest('vehicleId must be 1-32 letters, digits or dashes', 'vehicleId');
    }
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
    if (!vehicle) throw ODataError.badRequest(`Vehicle ${vehicleId} does not exist`, 'vehicleId');
  }

  /** GET /odata/v4/Me() — session helper: claims plus directory row. */
  @ODataFunction({ name: 'Me', binding: 'unbound', roles: ALL_ROLES, returns: 'Edm.Untyped' })
  me(ctx: OperationContext) {
    return this.auth.me(ctx.principal);
  }

  /**
   * GET /odata/v4/Users/Lodestar.MyPreferences() — the caller's own settings (DSP-20, DSP-33, SM-30). Nobody
   * else's, admins included: the row is always the token subject's. Bound to Users so the gateway routes it to
   * auth, but open to every human role (store managers and field roles cannot list Users).
   */
  @ODataFunction({ name: 'MyPreferences', binding: 'collection', roles: HUMAN_ROLES, returns: 'Edm.Untyped' })
  myPreferences(ctx: OperationContext) {
    return this.auth.myPreferences(ctx.principal);
  }

  /** POST /odata/v4/Users/Lodestar.SaveMyPreferences {preferences} — merges sections into the caller's own settings. */
  @ODataAction({
    name: 'SaveMyPreferences',
    binding: 'collection',
    roles: HUMAN_ROLES,
    params: { preferences: { type: 'Edm.Untyped', required: true } },
    returns: 'Edm.Untyped',
  })
  saveMyPreferences(ctx: OperationContext) {
    return this.auth.saveMyPreferences(ctx.principal, ctx.params.preferences);
  }

  /** GET /odata/v4/Users/Lodestar.MyDispatcher() — the dispatcher of the caller's depot to call (SM-17, SM-39). */
  @ODataFunction({ name: 'MyDispatcher', binding: 'collection', roles: HUMAN_ROLES, returns: 'Edm.Untyped' })
  myDispatcher(ctx: OperationContext) {
    return this.auth.myDispatcher(ctx.principal);
  }

  /** GET /odata/v4/Users/Lodestar.MyTwoFactor() — whether the caller has an authenticator app in Keycloak (DSP-07). */
  @ODataFunction({ name: 'MyTwoFactor', binding: 'collection', roles: HUMAN_ROLES, returns: 'Edm.Untyped' })
  myTwoFactor(ctx: OperationContext) {
    return this.auth.myTwoFactor(ctx.principal);
  }

  /**
   * GET /odata/v4/Users/Lodestar.MyOutletUsers() — the active sign-ins of the caller's own outlet (SM-30 "Users &
   * access"): name and role only, the caller first. Store managers cannot list Users; nobody else's outlet is
   * readable. Empty when the token carries no outlet.
   */
  @ODataFunction({ name: 'MyOutletUsers', binding: 'collection', roles: [Roles.StoreManager], returns: 'Edm.Untyped' })
  async myOutletUsers(ctx: OperationContext) {
    const { sub, outletId } = ctx.principal;
    if (!outletId) return [];
    const rows: Array<{ id: string; name: string; role: string }> = await this.prisma.user.findMany({
      where: { outletId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    return rows
      .map(u => ({ id: u.id, name: u.name, role: u.role, self: u.id === sub }))
      .sort((a, b) => Number(b.self) - Number(a.self));
  }
}

/**
 * Devices: field-app device registry (device posture, PLATFORM.md §2.6).
 *  - Every field role registers its own phone (SM-31 "Ask Kandy Hub to add
 *    you"); it waits as PENDING until an admin activates it (ADM-05). A phone
 *    that is not bound to the token yet may still do this: the guard lets the
 *    self-enrollment routes through with `principal.enrollment` set, and the
 *    phone may then register only the id it presents as X-Device-Id.
 *  - People see only their own devices (abac.self); admins see all, activate
 *    (binding the token to the phone) and revoke lost phones (ADM-07).
 *  - `sharedDemo` marks the seeded persona phones. The field app reads its
 *    owner's row (Devices('id'), an enrollment route) and adopts the token's
 *    device_id as its install id only when the row is ACTIVE, sharedDemo and
 *    the caller's own. It is set by the seed only: never insertable or updatable.
 */
@Injectable()
@EntitySet({
  name: 'Devices',
  model: 'Device',
  read: [Roles.Admin, Roles.Dispatcher, Roles.Loader, Roles.Driver, Roles.StoreManager],
  create: [Roles.Admin, Roles.Dispatcher, Roles.Loader, Roles.Driver, Roles.StoreManager],
  update: [Roles.Admin],
  abac: { open: '*', self: (p) => ({ userId: p.sub }) },
  navigation: ['user'],
  search: ['id', 'label', 'model'],
  insertable: ['id', 'userId', 'label', 'platform', 'model'],
  updatable: ['label', 'platform', 'model'],
  defaultOrderBy: 'registeredAt desc',
})
export class DevicesSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly auth: AuthService,
  ) {
    super(prisma);
  }

  async beforeCreate(data: Record<string, any>, ctx: WriteContext) {
    const enrolling = ctx.principal.enrollment;
    if (enrolling) {
      // A phone asks for itself only: the key is the X-Device-Id it presented.
      if (data.id !== undefined && data.id !== enrolling.deviceId) {
        throw ODataError.badRequest('A phone can only ask for access for itself: id must equal its X-Device-Id', 'id');
      }
      data = { ...data, id: enrolling.deviceId };
    }
    if (!data.id || !DEVICE_ID_PATTERN.test(data.id)) throw ODataError.badRequest('id must be 4-64 letters, digits or dashes', 'id');
    const admin = isPrivileged(ctx.principal);
    return {
      ...data,
      // People register only their own device, and it waits for an admin.
      userId: admin ? (data.userId ?? ctx.principal.sub) : ctx.principal.sub,
      status: admin ? DeviceStatus.ACTIVE : DeviceStatus.PENDING,
      // Shared demo phones come from the seed only: no API call, an admin's included, can create one.
      sharedDemo: false,
    };
  }

  /** Admins insert directly; everyone else goes through self-enrollment (idempotent, audited). */
  create(data: Record<string, any>, ctx: WriteContext) {
    if (isPrivileged(ctx.principal)) return super.create(data, ctx);
    return this.auth.enrollDevice({ id: data.id, label: data.label, platform: data.platform, model: data.model }, ctx.principal);
  }

  /** POST Devices('DEV-RB-01')/Lodestar.Revoke {reason?} — lost phone (ADM-07). */
  @ODataAction({ name: 'Revoke', binding: 'entity', roles: [Roles.Admin], params: { reason: 'Edm.String' }, returns: 'Lodestar.Device' })
  revoke(ctx: OperationContext) {
    if (ctx.entity.status === DeviceStatus.REVOKED) throw ODataError.conflict('The device is already revoked');
    return this.auth.revokeDevice(ctx.entity.id, ctx.principal, ctx.params.reason);
  }

  /** POST Devices('…')/Lodestar.Activate — approve a phone (ADM-05) and bind the user's token to it. */
  @ODataAction({ name: 'Activate', binding: 'entity', roles: [Roles.Admin], returns: 'Lodestar.Device' })
  activate(ctx: OperationContext) {
    return this.auth.activateDevice(ctx.entity.id, ctx.principal);
  }
}
