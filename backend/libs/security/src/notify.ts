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
