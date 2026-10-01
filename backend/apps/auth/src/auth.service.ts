import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { DevicePostureService, Principal } from '@lodestar/security';
import { DeviceStatus, Role } from '@prisma/client';
import { KeycloakAdminClient } from './keycloak-admin.client';

/** Directory role (Prisma enum) → realm role (token). */
export const REALM_ROLE: Record<Role, string> = {
  DISPATCHER: 'dispatcher',
  LOADER: 'loader',
  DRIVER: 'driver',
  STORE_MANAGER: 'store_manager',
  ADMIN: 'admin',
};

/**
 * Auth service: session helpers (/Me), the user directory mirrored from the
 * identity provider, and the field-device registry (device posture).
 * Credentials never live here — Keycloak (Entra ID on Azure) owns them.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloak: KeycloakAdminClient,
    private readonly posture: DevicePostureService,
  ) {}

  /** Who am I: token claims plus the directory row (if any). */
  async me(p: Principal) {
    const user = await this.prisma.user.findUnique({
      where: { id: p.sub },
      select: { id: true, email: true, name: true, role: true, depot: true, outletId: true, phone: true, isActive: true },
    });
    return {
      sub: p.sub,
      name: p.name ?? user?.name ?? null,
      email: p.email ?? user?.email ?? null,
      roles: p.roles,
      depots: p.depots,
      outletId: p.outletId ?? null,
      vehicleId: p.vehicleId ?? null,
      deviceId: p.deviceId ?? null,
      clientId: p.clientId ?? null,
      user,
    };
  }

  /** ADM-04: create the identity first, then the directory row with the same id. */
  async createIdentity(data: Record<string, any>): Promise<string> {
    if (!this.keycloak.configured) {
      if (!data.id) throw ODataError.badRequest('id (the identity provider subject) is required when no identity admin API is configured', 'id');
      return data.id;
    }
    const [firstName, ...rest] = String(data.name).split(' ');
    const attributes: Record<string, string[]> = {};
    if (data.depot) attributes.depot = [data.depot];
    if (data.outletId) attributes.outlet_id = [data.outletId];
    return this.keycloak.createUser({
      email: data.email,
      firstName,
      lastName: rest.join(' '),
      role: REALM_ROLE[data.role as Role],
      attributes,
    });
  }

  async setIdentityEnabled(userId: string, enabled: boolean) {
    if (this.keycloak.configured) await this.keycloak.setEnabled(userId, enabled);
  }

  /**
   * ADM-07 lost phone: disable the device (field tokens bound to it stop
   * working at the next posture check) and end the user's sessions.
   */
  async revokeDevice(deviceId: string, revokedBy: string, reason?: string) {
    const device = await this.prisma.device.update({
      where: { id: deviceId },
      data: { status: DeviceStatus.REVOKED, revokedAt: new Date(), revokedBy, revokeReason: reason ?? 'Reported lost' },
    });
    this.posture.invalidate(deviceId);
    let sessionsRevoked = false;
    try {
      sessionsRevoked = this.keycloak.configured ? await this.keycloak.logoutUser(device.userId) : false;
    } catch (err) {
      this.logger.warn(`Could not end sessions of ${device.userId}: ${(err as Error).message}`);
    }
    return { ...device, sessionsRevoked };
  }

  async activateDevice(deviceId: string) {
    const device = await this.prisma.device.update({
      where: { id: deviceId },
      data: { status: DeviceStatus.ACTIVE, revokedAt: null, revokedBy: null, revokeReason: null },
    });
    this.posture.invalidate(deviceId);
    return device;
  }
}
