import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataAction, ODataEntitySet, ODataError, ODataFunction, OperationContext, WriteContext } from '@lodestar/odata';
import { ALL_ROLES, isPrivileged, Roles } from '@lodestar/security';
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
  insertable: ['id', 'email', 'name', 'role', 'depot', 'outletId', 'phone'],
  updatable: ['name', 'role', 'depot', 'outletId', 'phone', 'isActive'],
  defaultOrderBy: 'name',
})
export class UsersSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly auth: AuthService,
  ) {
    super(prisma);
  }

  async beforeCreate(data: Record<string, any>) {
    for (const f of ['email', 'name', 'role']) if (!data[f]) throw ODataError.badRequest(`${f} is required`, f);
    // role is an enum already validated by the OData body coercion; guard the REALM_ROLE mapping too.
    if (!REALM_ROLE[data.role as keyof typeof REALM_ROLE]) throw ODataError.badRequest('Unknown role', 'role');
    if (data.role === 'STORE_MANAGER' && !data.outletId) throw ODataError.badRequest('A store manager needs an outletId', 'outletId');
    return { ...data, id: await this.auth.createIdentity(data) };
  }

  async beforeUpdate(patch: Record<string, any>, current: any) {
    if (patch.isActive !== undefined && patch.isActive !== current.isActive) {
      await this.auth.setIdentityEnabled(current.id, patch.isActive);
    }
    return patch;
  }

  /** GET /odata/v4/Me() — session helper: claims plus directory row. */
  @ODataFunction({ name: 'Me', binding: 'unbound', roles: ALL_ROLES, returns: 'Edm.Untyped' })
  me(ctx: OperationContext) {
    return this.auth.me(ctx.principal);
  }
}

/**
 * Devices: field-app device registry (device posture). Users see and register
 * their own devices (PENDING until an admin activates them); admins see all
 * and revoke lost phones (ADM-06/07).
 */
@Injectable()
@EntitySet({
  name: 'Devices',
  model: 'Device',
  read: [Roles.Admin, Roles.Dispatcher, Roles.Loader, Roles.Driver],
  create: [Roles.Admin, Roles.Loader, Roles.Driver],
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
    if (!data.id || !/^[A-Za-z0-9-]{4,64}$/.test(data.id)) throw ODataError.badRequest('id must be 4-64 letters, digits or dashes', 'id');
    const admin = isPrivileged(ctx.principal);
    return {
      ...data,
      // People register only their own device, and it waits for an admin.
      userId: admin ? (data.userId ?? ctx.principal.sub) : ctx.principal.sub,
      status: admin ? DeviceStatus.ACTIVE : DeviceStatus.PENDING,
    };
  }

  /** POST Devices('DEV-RB-01')/Lodestar.Revoke {reason?} — lost phone (ADM-07). */
  @ODataAction({ name: 'Revoke', binding: 'entity', roles: [Roles.Admin], params: { reason: 'Edm.String' }, returns: 'Lodestar.Device' })
  revoke(ctx: OperationContext) {
    if (ctx.entity.status === DeviceStatus.REVOKED) throw ODataError.conflict('The device is already revoked');
    return this.auth.revokeDevice(ctx.entity.id, ctx.principal.sub, ctx.params.reason);
  }

  /** POST Devices('…')/Lodestar.Activate — approve a registered device. */
  @ODataAction({ name: 'Activate', binding: 'entity', roles: [Roles.Admin], returns: 'Lodestar.Device' })
  activate(ctx: OperationContext) {
    return this.auth.activateDevice(ctx.entity.id);
  }
}
