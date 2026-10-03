import { Logger } from '@nestjs/common';
import type { AuditSink } from '@lodestar/security';

/**
 * SMS behind a feature flag. The settings screens offer SMS per alert (DSP-20 / DSP-33 vehicle fault, SM-30 store
 * topics); this decides, per notification, whether the recipient asked for it and hands it to a provider.
 *
 *   SMS_ENABLED=false (default)  nothing is sent and the faces hide the SMS options (Notifications/Lodestar.Channels)
 *   SMS_PROVIDER=log (default)   nothing leaves the service: what would be sent is recorded on the notification
 *                                (payload.delivery.sms) and in the audit log
 *   SMS_PROVIDER=http            POST {to, from, body} as JSON to SMS_API_URL with "Authorization: Bearer SMS_API_KEY"
 *                                (a generic webhook / SMS gateway; SMS_FROM is the sender id)
 *
 * Phone calls have no provider: the "call" channel is not offered anywhere (README, Departures).
 */
export interface SmsMessage {
  to: string;
  body: string;
}

export type SmsStatus = 'LOGGED' | 'SENT' | 'FAILED';

export interface SmsResult {
  status: SmsStatus;
  providerId?: string;
  error?: string;
}

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}

/** Records only: the default, and what the demo runs with when SMS is switched on without a gateway. */
export class LogSmsProvider implements SmsProvider {
  readonly name = 'log';
  private readonly logger = new Logger('Sms');

  async send(message: SmsMessage): Promise<SmsResult> {
    this.logger.log(`SMS (not sent, log provider) to ${maskPhone(message.to)}: ${message.body}`);
    return { status: 'LOGGED' };
  }
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

/** A generic HTTP gateway: one JSON POST per message. */
export class HttpSmsProvider implements SmsProvider {
  readonly name = 'http';

  constructor(
    private readonly url: string,
    private readonly apiKey: string | undefined,
    private readonly from: string | undefined,
    private readonly fetchFn: FetchLike = fetch as unknown as FetchLike,
    private readonly timeoutMs = 5_000,
  ) {}

  async send(message: SmsMessage): Promise<SmsResult> {
    try {
      const res = await this.fetchFn(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) },
        body: JSON.stringify({ to: message.to, ...(this.from ? { from: this.from } : {}), body: message.body }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const text = await res.text().catch(() => '');
      if (!res.ok) return { status: 'FAILED', error: `HTTP ${res.status}` };
      let providerId: string | undefined;
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        const id = j.sid ?? j.id ?? j.messageId;
        if (typeof id === 'string') providerId = id;
      } catch {
        /* a gateway may answer with plain text */
      }
      return { status: 'SENT', ...(providerId ? { providerId } : {}) };
    } catch (e) {
      return { status: 'FAILED', error: e instanceof Error ? e.message : String(e) };
    }
  }
}

export interface SmsConfig {
  enabled: boolean;
  provider: SmsProvider;
}

const truthy = (v: string | undefined) => /^(1|true|yes|on)$/i.test((v ?? '').trim());

/** Reads SMS_ENABLED, SMS_PROVIDER, SMS_API_URL, SMS_API_KEY, SMS_FROM. An http provider without a URL falls back to log. */
export function smsConfigFromEnv(env: Record<string, string | undefined> = process.env): SmsConfig {
  const enabled = truthy(env.SMS_ENABLED);
  const kind = (env.SMS_PROVIDER ?? 'log').trim().toLowerCase();
  if (kind === 'http' && env.SMS_API_URL) {
    return { enabled, provider: new HttpSmsProvider(env.SMS_API_URL, env.SMS_API_KEY || undefined, env.SMS_FROM || undefined) };
  }
  if (kind !== 'log') new Logger('Sms').warn(`SMS_PROVIDER=${kind} needs SMS_API_URL; using the log provider`);
  return { enabled, provider: new LogSmsProvider() };
}

/** +94771234567 → •••••••4567 (audit and logs never keep the full number). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, '');
  return digits.length <= 4 ? '••••' : `${'•'.repeat(Math.min(digits.length - 4, 8))}${digits.slice(-4)}`;
}

type Prefs = Record<string, any> | null | undefined;

/**
 * Which notification types can go by SMS, and the setting that asks for it. Defaults match the settings screens
 * (DSP-20 / DSP-33 vehicle fault SMS on; SM-30 arrival window SMS on, the other topics off; "short or moved
 * orders" SMS is locked on).
 */
const SMS_RULES: Record<string, (p: Prefs) => boolean> = {
  VEHICLE_FAULT: (p) => p?.alerts?.vehicleFault?.sms ?? true,
  REEFER_FAIL: (p) => p?.alerts?.vehicleFault?.sms ?? true,
  PLAN_PUBLISHED: (p) => p?.notifications?.arrivalWindow?.sms ?? true,
  ETA_UPDATE: (p) => p?.notifications?.vanOnTheWay?.sms ?? false,
  CREDIT_NOTE_ISSUED: (p) => p?.notifications?.creditNotes?.sms ?? false,
  ORDER_DEFERRED: () => true,
};

/** True when the recipient's preferences ask for this notification type by SMS. */
export function wantsSms(type: string, preferences: unknown): boolean {
  const rule = SMS_RULES[type];
  return !!rule && rule((preferences ?? null) as Prefs) === true;
}

const TEXT: Record<string, (p: Record<string, any>) => string> = {
  VEHICLE_FAULT: (p) => `Vehicle ${p.vehicleId ?? ''} can't depart${p.tripId ? ` (trip ${p.tripId})` : ''}. Open Lodestar Plan to re-plan.`,
  REEFER_FAIL: (p) => `Reefer fault on ${p.vehicleId ?? 'a vehicle'}${p.tripId ? ` (trip ${p.tripId})` : ''}.`,
  PLAN_PUBLISHED: (p) => `Tomorrow's delivery plan is out${p.runDate ? ` for ${String(p.runDate).slice(0, 10)}` : ''}. See your arrival window in Lodestar Store.`,
  ETA_UPDATE: (p) => `Your van is on the way${p.eta ? `, ETA ${p.eta}` : ''}.`,
  CREDIT_NOTE_ISSUED: (p) => `Credit note ${p.creditNoteId ?? p.number ?? ''} raised for your outlet.`,
  ORDER_DEFERRED: (p) => `Order ${p.orderId ?? ''} moved${p.rescheduledDate ? ` to ${String(p.rescheduledDate).slice(0, 10)}` : ''}.`,
};

/** The SMS text: short, plain, no links (≤ 160 characters). */
export function smsBody(type: string, payload: unknown): string {
  const p = (payload && typeof payload === 'object' ? payload : {}) as Record<string, any>;
  const text = (TEXT[type]?.(p) ?? type.replace(/_/g, ' ').toLowerCase()).replace(/\s+/g, ' ').trim();
  return `Waypoint Lodestar: ${text}`.slice(0, 160);
}

export interface SmsDelivery {
  channel: 'SMS';
  provider: string;
  to: string; // masked
  body: string;
  status: SmsStatus;
  at: string;
  providerId?: string;
  error?: string;
}

/** Sends one SMS for a stored notification when the flag is on, and reports it to the audit log. */
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    readonly config: SmsConfig,
    private readonly audit?: AuditSink,
  ) {}

  get enabled(): boolean {
    return this.config.enabled;
  }

  /** The SMS record for this notification, or null when nothing is to be sent (flag off, not asked, no phone). */
  async deliver(n: { id: string; recipientId: string; type: string; payload: unknown }, recipient: { phone?: string | null; preferences?: unknown } | null): Promise<SmsDelivery | null> {
    if (!this.config.enabled || !recipient?.phone || !wantsSms(n.type, recipient.preferences)) return null;
    const body = smsBody(n.type, n.payload);
    const result = await this.config.provider.send({ to: recipient.phone, body }).catch(
      (e: unknown): SmsResult => ({ status: 'FAILED', error: e instanceof Error ? e.message : String(e) }),
    );
    const delivery: SmsDelivery = {
      channel: 'SMS', provider: this.config.provider.name, to: maskPhone(recipient.phone), body, status: result.status, at: new Date().toISOString(),
      ...(result.providerId ? { providerId: result.providerId } : {}), ...(result.error ? { error: result.error } : {}),
    };
    if (result.status === 'FAILED') this.logger.warn(`SMS for notification ${n.id} failed: ${result.error}`);
    await this.audit
      ?.record({
        at: delivery.at, actor: 'notifications', actorRoles: ['service'], action: 'Notifications.Sms', entitySet: 'Notifications', entityKey: n.id,
        outcome: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS', payload: { recipientId: n.recipientId, type: n.type, ...delivery },
      })
      .catch(() => undefined);
    return delivery;
  }
}
