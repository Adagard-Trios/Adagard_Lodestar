import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { OIDC_CONFIG, OidcConfig } from './config';
import { Principal } from './principal';

export interface DeviceRecord {
  id: string;
  userId: string;
  status: string; // PENDING | ACTIVE | REVOKED
}

/** Looks a device up by id. The default implementation reads the Device table. */
export interface DeviceLookup {
  findDevice(id: string): Promise<DeviceRecord | null>;
}

export const DEVICE_LOOKUP = Symbol('DEVICE_LOOKUP');

const CACHE_TTL_MS = 30_000;

/**
 * Device posture (PLATFORM.md §2.6): tokens issued to the field client are
 * bound to a registered device via the `device_id` claim. The device must be
 * ACTIVE and belong to the token's subject. A lost phone revoked from ADM-07
 * stops working within the cache TTL even before its token expires.
 */
@Injectable()
export class DevicePostureService {
  private readonly cache = new Map<string, { device: DeviceRecord | null; until: number }>();

  constructor(
    @Inject(OIDC_CONFIG) private readonly config: OidcConfig,
    @Optional() @Inject(DEVICE_LOOKUP) private readonly lookup?: DeviceLookup,
    @Optional() @Inject('NOW') private readonly now: () => number = Date.now,
  ) {}

  /** Throws 401 when a field token is not bound to an active device of its user. */
  async check(p: Principal): Promise<void> {
    if (p.clientId !== this.config.fieldClientId) return;
    if (!p.deviceId) throw new UnauthorizedException('Field token is not bound to a device');
    if (!this.lookup) throw new UnauthorizedException('Device registry unavailable');

    const device = await this.find(p.deviceId);
    if (!device) throw new UnauthorizedException('Device is not registered');
    if (device.status !== 'ACTIVE') throw new UnauthorizedException(`Device is ${device.status.toLowerCase()}`);
    if (device.userId !== p.sub) throw new UnauthorizedException('Device belongs to another user');
  }

  /** Called after a revocation so the change applies immediately in this process. */
  invalidate(deviceId: string): void {
    this.cache.delete(deviceId);
  }

  private async find(id: string): Promise<DeviceRecord | null> {
    const hit = this.cache.get(id);
    if (hit && hit.until > this.now()) return hit.device;
    const device = await this.lookup!.findDevice(id);
    this.cache.set(id, { device, until: this.now() + CACHE_TTL_MS });
    return device;
  }
}
