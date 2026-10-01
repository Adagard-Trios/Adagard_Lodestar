import { HttpException, Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { OIDC_CONFIG, OidcConfig, SERVICE_NAME } from './config';
import { DeviceEnrollmentGrant, Principal } from './principal';

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

/** Header the field app sends with its per-install device id. */
export const DEVICE_HEADER = 'x-device-id';

/** OData error codes of posture failures (the error filter uses `code`). */
export const DeviceErrorCodes = {
  NotBound: 'DeviceNotBound',
  HeaderRequired: 'DeviceHeaderRequired',
  Mismatch: 'DeviceMismatch',
  NotRegistered: 'DeviceNotRegistered',
  Inactive: 'DeviceInactive',
  ForeignDevice: 'DeviceNotOwned',
  RegistryUnavailable: 'DeviceRegistryUnavailable',
} as const;

/** Format of a device id (Devices key, X-Device-Id): 4-64 letters, digits or dashes. */
export const DEVICE_ID_PATTERN = /^[A-Za-z0-9-]{4,64}$/;

/** The service that owns the Devices registry; only it serves the self-enrollment routes. */
export const DEVICE_REGISTRY_SERVICE = 'auth';

/**
 * Self-enrollment routes (PLATFORM.md §2.6): the only calls a field token that is
 * not bound to the presenting phone may make. Paths are relative to /odata/v4.
 *   POST Devices                      request access for this phone (PENDING)
 *   GET  Devices, Devices('id'), Devices/$count   the caller's own devices (row filter: self)
 *   GET  Me()                         who am I
 */
const ENROLLMENT_ROUTES: { methods: string[]; path: RegExp }[] = [
  { methods: ['POST'], path: /^\/Devices\/?$/ },
  { methods: ['GET', 'HEAD'], path: /^\/Devices(?:\('[A-Za-z0-9-]{1,64}'\))?(?:\/\$count)?\/?$/ },
  { methods: ['GET', 'HEAD'], path: /^\/Me(?:\(\))?\/?$/ },
];

const ODATA_ROOT = '/odata/v4';

/** True when `method url` is one of the self-enrollment routes (query string ignored). */
export function isEnrollmentRoute(method: string | undefined, url: string | undefined): boolean {
  if (!method || !url) return false;
  const q = url.indexOf('?');
  let path = q < 0 ? url : url.slice(0, q);
  try {
    path = decodeURIComponent(path);
  } catch {
    return false;
  }
  const at = path.indexOf(ODATA_ROOT);
  if (at < 0) return false;
  const rest = path.slice(at + ODATA_ROOT.length);
  const m = method.toUpperCase();
  return ENROLLMENT_ROUTES.some((r) => r.methods.includes(m) && r.path.test(rest));
}

const WAIVABLE: ReadonlySet<string> = new Set(['DeviceNotBound', 'DeviceMismatch']);

function deny(code: string, message: string): UnauthorizedException {
  return new UnauthorizedException({ statusCode: 401, code, message });
}

/** First value of a header that may arrive as a string or a list. */
export function headerValue(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

/**
 * Device posture (PLATFORM.md §2.6): tokens issued to the field client are
 * bound to a registered device via the `device_id` claim. The device must be
 * ACTIVE and belong to the token's subject. A lost phone revoked from ADM-07
 * stops working within the cache TTL even before its token expires.
 *
 * The token is also bound to the phone that presents it: the app sends its
 * device id as `X-Device-Id`, which must equal the `device_id` claim
 * (401 DeviceMismatch). With REQUIRE_DEVICE_HEADER (default true) a field
 * call without the header is refused too (401 DeviceHeaderRequired).
 */
@Injectable()
export class DevicePostureService {
  private readonly cache = new Map<string, { device: DeviceRecord | null; until: number }>();

  constructor(
    @Inject(OIDC_CONFIG) private readonly config: OidcConfig,
    @Optional() @Inject(DEVICE_LOOKUP) private readonly lookup?: DeviceLookup,
    @Optional() @Inject('NOW') private readonly now: () => number = Date.now,
    @Optional() @Inject(SERVICE_NAME) private readonly service?: string,
  ) {}

  /**
   * Self-enrollment (PLATFORM.md §2.6, SM-31/SM-32): a field user whose token is
   * not bound to the presenting phone (DeviceNotBound, DeviceMismatch) may still
   * request access for that phone and read their own devices. Returns the grant
   * when `error` (thrown by check()) may be waived for this route, else null:
   *   - only in the service that owns the registry (auth),
   *   - only for a human field token presenting a well-formed X-Device-Id,
   *   - only on the enrollment routes (isEnrollmentRoute).
   * Every other posture failure (inactive, revoked, foreign device, missing header) stands.
   */
  enrollmentGrant(error: unknown, p: Principal, presentedDeviceId: unknown, route: { method?: string; url?: string }): DeviceEnrollmentGrant | null {
    if (this.service !== DEVICE_REGISTRY_SERVICE) return null;
    if (!(error instanceof HttpException) || error.getStatus() !== 401) return null;
    const code = (error.getResponse() as { code?: unknown })?.code;
    if (typeof code !== 'string' || !WAIVABLE.has(code)) return null;
    if (p.clientId !== this.config.fieldClientId || p.isService || !p.sub) return null;
    const presented = headerValue(presentedDeviceId);
    if (!presented || !DEVICE_ID_PATTERN.test(presented)) return null;
    if (!isEnrollmentRoute(route.method, route.url)) return null;
    return { deviceId: presented, reason: code as DeviceEnrollmentGrant['reason'] };
  }

  /**
   * Throws 401 when a field token is not bound to an active device of its user,
   * or is presented from another device than the one it is bound to.
   * `presentedDeviceId` is the caller's X-Device-Id header (or the WebSocket handshake's deviceId).
   */
  async check(p: Principal, presentedDeviceId?: unknown): Promise<void> {
    if (p.clientId !== this.config.fieldClientId) return;
    if (!p.deviceId) throw deny(DeviceErrorCodes.NotBound, 'Field token is not bound to a device');

    const presented = headerValue(presentedDeviceId);
    if (presented === undefined) {
      if (this.config.requireDeviceHeader !== false) {
        throw deny(DeviceErrorCodes.HeaderRequired, 'Field calls must send the X-Device-Id header');
      }
    } else if (presented !== p.deviceId) {
      throw deny(DeviceErrorCodes.Mismatch, 'X-Device-Id does not match the device the token is bound to');
    }

    if (!this.lookup) throw deny(DeviceErrorCodes.RegistryUnavailable, 'Device registry unavailable');
    const device = await this.find(p.deviceId);
    if (!device) throw deny(DeviceErrorCodes.NotRegistered, 'Device is not registered');
    if (device.status !== 'ACTIVE') throw deny(DeviceErrorCodes.Inactive, `Device is ${device.status.toLowerCase()}`);
    if (device.userId !== p.sub) throw deny(DeviceErrorCodes.ForeignDevice, 'Device belongs to another user');
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
