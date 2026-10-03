import { Logger } from '@nestjs/common';
import { ServiceTokenClient } from './service-token.client';

/** A stored notice for one person (Notifications/Lodestar.Send). */
export interface NoticeParams {
  recipientId: string;
  type: string; // UPPER_SNAKE_CASE, e.g. PLAN_PUBLISHED, ORDER_DEFERRED
  payload?: unknown;
  tripId?: string;
  depot?: string;
  outletId?: string;
}

export const NOTIFY = Symbol('NOTIFY');

/** The directory (auth.User), read to address notices. */
export interface NoticeDirectory {
  user: { findMany(args: any): Promise<Array<{ id: string; depot?: string | null; outletId?: string | null }>> };
}

/**
 * The dispatchers a depot's notices go to: the active dispatchers based at the depot, or every active
 * dispatcher when none is (a dispatcher covers more depots through the depot claim of their token,
 * which the directory does not hold: Nilanthi is based at Peliyagoda and covers Kandy).
 */
export async function depotDispatchers(db: NoticeDirectory, depot: string): Promise<string[]> {
  const all = await db.user.findMany({ where: { role: 'DISPATCHER', isActive: true }, select: { id: true, depot: true } });
  const based = all.filter((u) => u.depot === depot);
  return (based.length ? based : all).map((u) => u.id);
}

/** The active store managers of these outlets. */
export async function storeManagers(db: NoticeDirectory, outletIds: string[]): Promise<Array<{ id: string; outletId: string }>> {
  if (!outletIds.length) return [];
  const rows = await db.user.findMany({
    where: { role: 'STORE_MANAGER', isActive: true, outletId: { in: [...new Set(outletIds)] } },
    select: { id: true, outletId: true },
  });
  return rows.map((r) => ({ id: r.id, outletId: r.outletId! }));
}

/** One proof of delivery as the driver saved it. */
export interface PodOutcomeInput {
  unitsDelivered: number;
  unitsOrdered: number;
  exceptions?: unknown[] | null;
}

/**
 * What a saved POD means for dispatch and the store: nothing delivered is a failed stop; a short count or
 * an exception the driver recorded is a POD exception; a full, clean delivery needs nobody.
 */
export function podOutcome(pod: PodOutcomeInput): 'STOP_FAILED' | 'POD_EXCEPTION' | null {
  if (pod.unitsOrdered > 0 && pod.unitsDelivered === 0) return 'STOP_FAILED';
  if (pod.unitsDelivered < pod.unitsOrdered || (Array.isArray(pod.exceptions) && pod.exceptions.length > 0)) return 'POD_EXCEPTION';
  return null;
}

/** The stop a notice is about. */
export interface StopRef {
  tripId: string;
  stopId: string;
  stopSeq: number;
  orderId: string;
  outletId: string;
  depot: string;
  vehicleId: string;
}

/**
 * A stop that needs dispatch (failed, or delivered with an exception): one notice to each of the depot's
 * dispatchers (DSP-13 inbox, DSP-04 exceptions) and to the store's managers. Each notice is pushed to its
 * recipient as `notification`, which those screens refresh on.
 */
export async function announceStopIssue(
  db: NoticeDirectory,
  notify: Pick<NotifyClient, 'notice'>,
  type: 'STOP_FAILED' | 'POD_EXCEPTION',
  stop: StopRef,
  details: { title: string; [k: string]: unknown },
): Promise<void> {
  const payload = { tripId: stop.tripId, stopId: stop.stopId, stopSeq: stop.stopSeq, orderId: stop.orderId, outletId: stop.outletId, vehicleId: stop.vehicleId, ...details };
  for (const recipientId of await depotDispatchers(db, stop.depot)) {
    await notify.notice({ recipientId, type, tripId: stop.tripId, payload });
  }
  for (const m of await storeManagers(db, [stop.outletId])) {
    await notify.notice({ recipientId: m.id, type, tripId: stop.tripId, outletId: m.outletId, payload });
  }
}

const REQUEST_TIMEOUT_MS = 3_000;

/**
 * Tells people and screens about a committed change, through the notifications service and this
 * service's client-credentials token. Notices are best effort: the business write has already
 * committed, so a failure is logged and never undoes it.
 */
export class NotifyClient {
  private readonly logger = new Logger(NotifyClient.name);

  constructor(
    private readonly notificationsUrl: string,
    private readonly tokens: ServiceTokenClient,
  ) {}

  /** Store a notice for one person and push it to them (and to the operational room its type maps to). */
  async notice(params: NoticeParams): Promise<boolean> {
    return this.post('Notifications/Lodestar.Send', params, `${params.type} → ${params.recipientId}`);
  }

  /** Emit a realtime event (e.g. plan_published, trip_released) to rooms; nothing is stored. */
  async publish(event: string, rooms: string[], payload: unknown): Promise<boolean> {
    if (!rooms.length) return true;
    return this.post('Notifications/Lodestar.Publish', { event, rooms, payload }, `${event} → ${rooms.join(', ')}`);
  }

  private async post(path: string, body: unknown, what: string): Promise<boolean> {
    if (!this.notificationsUrl) {
      this.logger.warn(`Notify skipped (NOTIFICATIONS_URL is not configured): ${what}`);
      return false;
    }
    if (!this.tokens.configured) {
      this.logger.warn(`Notify (no service credentials configured): ${what}`);
      return false;
    }
    try {
      const res = await this.tokens.fetch(`${this.notificationsUrl.replace(/\/$/, '')}/odata/v4/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) this.logger.warn(`Notify ${what} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return res.ok;
    } catch (e) {
      this.logger.warn(`Notify ${what} failed: ${(e as Error).message}`);
      return false;
    }
  }
}
