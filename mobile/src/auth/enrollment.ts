// Device enrollment (PLATFORM.md §2.6; design SM-31 "Ask Kandy Hub to add you" → SM-32 "Access request sent",
// approved on the desk in ADM-05).
//
// Every field token carries a `device_id` claim and every call sends this install's id as X-Device-Id; the
// API refuses a call when the two differ. After sign-in the app therefore compares the claim with the
// install id:
//   - equal (or the header cannot be sent at all) → the phone is bound: open the role's home screen;
//   - otherwise → ask for access for this phone (POST Devices, PENDING) and show the access-request screen.
// "Check again" refreshes the token: once an admin has approved the phone the new token names it. The
// approval also ends the user's sessions (so no old token keeps working); the refresh then fails and the
// user signs in once more, which lands on the home screen because the claim now matches.
import { Store } from '@/lib/store';
import type { Claims } from './claims';

export type EnrollmentStatus =
  /** nothing to do: the phone is bound (or no check has run) */
  | 'idle'
  /** sending the access request */
  | 'sending'
  /** the request is recorded and waits for an admin */
  | 'pending'
  /** "Check again" in flight */
  | 'checking'
  /** the token now names this phone: open the app */
  | 'approved'
  /** the session ended (an approval logs the user out): sign in again to continue */
  | 'signin'
  /** an admin revoked this phone */
  | 'revoked'
  /** the phone is registered to someone else */
  | 'conflict'
  /** the request could not be sent or checked (offline, server trouble) */
  | 'error';

export type EnrollmentState = {
  status: EnrollmentStatus;
  /** This install's id (shown so Kandy Hub can find the request). */
  deviceId: string | null;
  /** When the server recorded the request (registeredAt). */
  requestedAt: string | null;
  /** When "Check again" last ran. */
  checkedAt: string | null;
  /** What to tell the user (null: the screen's default copy for the status). */
  message: string | null;
  /** Set each time an unbound phone is detected: the access guard opens the access-request screen once per value. */
  since: string | null;
};

/** The Devices row as the API returns it. */
export type DeviceRow = { id: string; userId?: string; status: 'PENDING' | 'ACTIVE' | 'REVOKED' | string; registeredAt?: string; label?: string | null; sharedDemo?: boolean };

export type DeviceRequestBody = { id: string; platform?: string; model?: string; label?: string };

export interface EnrollmentDeps {
  getDeviceId(): Promise<string>;
  claims(): Claims | null;
  signedIn(): boolean;
  /** Refreshes the token; false when it could not (offline, or the session ended). */
  refresh(): Promise<boolean>;
  /** POST Devices */
  register(body: DeviceRequestBody): Promise<DeviceRow>;
  /** GET Devices('id') */
  read(id: string): Promise<DeviceRow>;
  /** Platform, model and label of this phone for the request. */
  describe(claims: Claims | null): Omit<DeviceRequestBody, 'id'>;
  /** False where the app cannot send X-Device-Id (cross-origin web build): the API cannot check the phone then. */
  sendsDeviceHeader(): boolean;
  /** Adopts `id` as this install's id (a confirmed shared demo phone), or drops an earlier adoption (null). */
  adoptDevice?(id: string | null): Promise<void>;
  now?: () => number;
}

const IDLE: EnrollmentState = { status: 'idle', deviceId: null, requestedAt: null, checkedAt: null, message: null, since: null };

/** Statuses during which the access-request screen is the place to be. */
export const ENROLLING: readonly EnrollmentStatus[] = ['sending', 'pending', 'checking', 'signin', 'revoked', 'conflict', 'error'];

type ErrorLike = { status?: number; code?: string; message?: string };

function describeError(e: unknown): string {
  const err = (e ?? {}) as ErrorLike;
  if (err.status === 0) return 'No connection to Lodestar. Your request goes out when you check again with signal.';
  return err.message || 'Lodestar could not take the request. Try again in a moment.';
}

export class DeviceEnrollment {
  readonly state = new Store<EnrollmentState>(IDLE);
  private readonly now: () => number;
  private inflight: Promise<EnrollmentStatus> | null = null;

  constructor(private readonly deps: EnrollmentDeps) {
    this.now = deps.now ?? Date.now;
  }

  get status(): EnrollmentStatus {
    return this.state.get().status;
  }

  /** True while the user must stay on the access-request screen. */
  get active(): boolean {
    return ENROLLING.includes(this.status);
  }

  /** Is the token bound to this install? (Always true where the header cannot be sent.) */
  async isBound(claims: Claims | null = this.deps.claims()): Promise<boolean> {
    if (!this.deps.sendsDeviceHeader()) return true;
    if (!claims?.deviceId) return false;
    return claims.deviceId === (await this.deps.getDeviceId());
  }

  /**
   * After sign-in (or on start with a stored session): true when the phone is bound and the app may
   * open; otherwise sends the access request (the access guard shows SM-32) and returns false.
   */
  async ensure(claims: Claims | null = this.deps.claims()): Promise<boolean> {
    // not bound as it stands: adopt the token's shared demo phone, or drop an earlier adoption, and look again
    if (!(await this.isBound(claims))) await this.adoptShared(claims);
    if (await this.isBound(claims)) {
      this.reset();
      return true;
    }
    await this.request();
    return false;
  }

  /**
   * The token names a shared demo phone (a seeded persona's): this install takes that id ONLY when the
   * registry row is ACTIVE, marked sharedDemo and the signed-in user's own (GET Devices('id') answers with
   * the caller's rows only). Any other token drops an earlier adoption, so this install asks for access
   * with its own id.
   */
  private async adoptShared(claims: Claims | null): Promise<void> {
    const adopt = this.deps.adoptDevice;
    if (!adopt || !this.deps.sendsDeviceHeader()) return;
    const id = claims?.deviceId;
    const row = id ? await this.deps.read(id).catch(() => null) : null;
    const confirmed = !!row && row.id === id && row.sharedDemo === true && row.status === 'ACTIVE' && row.userId === claims?.sub;
    await adopt(confirmed ? row.id : null);
  }

  /** The API said this phone is not bound (DeviceMismatch / DeviceNotBound) in the middle of a session. */
  unbound(): void {
    if (this.active || this.inflight) return;
    void this.request();
  }

  /** POST Devices for this install (idempotent on the server). */
  request(): Promise<EnrollmentStatus> {
    return this.once(async () => {
      const deviceId = await this.deps.getDeviceId();
      const at = new Date(this.now()).toISOString();
      this.state.set(s => ({ ...s, status: 'sending', deviceId, message: null, since: s.since && ENROLLING.includes(s.status) ? s.since : at }));
      try {
        const row = await this.deps.register({ id: deviceId, ...this.deps.describe(this.deps.claims()) });
        if (row?.status === 'ACTIVE') return this.afterApproval(row);
        return this.show(row);
      } catch (e) {
        return this.fail(e);
      }
    });
  }

  /** "Check again": refresh the token; bound → approved. Otherwise read the request to show where it stands. */
  checkAgain(): Promise<EnrollmentStatus> {
    return this.once(async () => {
      const deviceId = this.state.get().deviceId ?? (await this.deps.getDeviceId());
      this.state.set(s => ({ ...s, status: 'checking', deviceId, checkedAt: new Date(this.now()).toISOString() }));
      await this.deps.refresh();
      if (!this.deps.signedIn()) return this.set('signin', null);
      if (await this.isBound()) return this.set('approved', null);
      let row: DeviceRow;
      try {
        row = await this.deps.read(deviceId);
      } catch (e) {
        // Not found (never sent, or removed): ask again.
        if ((e as ErrorLike)?.status === 404) return this.sendAgain();
        return this.fail(e);
      }
      if (row?.status === 'ACTIVE') return this.afterApproval(row);
      return this.show(row);
    });
  }

  /** Back to idle (the phone is bound, or the user signed out). */
  reset(): void {
    this.state.set(IDLE);
  }

  private async sendAgain(): Promise<EnrollmentStatus> {
    try {
      const deviceId = this.state.get().deviceId ?? (await this.deps.getDeviceId());
      const row = await this.deps.register({ id: deviceId, ...this.deps.describe(this.deps.claims()) });
      return this.show(row);
    } catch (e) {
      return this.fail(e);
    }
  }

  /** The row is ACTIVE but this token does not name the phone yet: a fresh sign-in picks the binding up. */
  private afterApproval(row: DeviceRow): EnrollmentStatus {
    this.state.set(s => ({ ...s, requestedAt: row.registeredAt ?? s.requestedAt }));
    return this.set('signin', 'This phone is approved. Sign in again to start.');
  }

  private show(row: DeviceRow | null | undefined): EnrollmentStatus {
    this.state.set(s => ({ ...s, requestedAt: row?.registeredAt ?? s.requestedAt }));
    if (row?.status === 'REVOKED') return this.set('revoked', 'This phone was removed from Lodestar. Ask your depot admin to register it again.');
    return this.set('pending', null);
  }

  private fail(e: unknown): EnrollmentStatus {
    if ((e as ErrorLike)?.status === 409) return this.set('conflict', (e as ErrorLike).message || 'This phone is registered to someone else.');
    return this.set('error', describeError(e));
  }

  private set(status: EnrollmentStatus, message: string | null): EnrollmentStatus {
    this.state.set(s => ({ ...s, status, message }));
    return status;
  }

  /** One request or check at a time (a double tap does not send twice). */
  private once(run: () => Promise<EnrollmentStatus>): Promise<EnrollmentStatus> {
    this.inflight ??= run().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }
}

/**
 * The depot hub that approves phones, for the copy ("waiting for Kandy Hub"): the account's one depot by its
 * registry name (`name`, from useDepots), else the generic "your depot" (never a guessed depot).
 */
export function hubName(depots: readonly string[] | undefined, name: (code: string) => string = (c) => c): string {
  if (depots?.length === 1) return name(depots[0]);
  return 'your depot';
}
