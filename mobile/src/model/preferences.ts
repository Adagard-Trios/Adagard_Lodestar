// The signed-in user's own settings, kept on the server (auth Users/Lodestar.MyPreferences, saved with
// SaveMyPreferences). The same record the desk's DSP-20 (alert rules, on-call hours) and SM-30 (store
// notifications, receiving) edit, so a toggle on the phone shows on the desk and the other way round.
import { Store, useStore } from '@/lib/store';
import { client, session } from './platform';
import { useQuery } from './query';

/** Late risk at or above this is shown as at risk and wakes the dispatcher (the desk's default alert rule too). */
export const LATE_RISK_PCT = 30;

/** Alert rules (DSP-20 on the desk, DSP-33 here): what wakes the dispatcher and how. */
export interface AlertRules {
  vehicleFault?: { push?: boolean; sms?: boolean };
  lateRisk?: { push?: boolean; threshold?: number; risingOnly?: boolean };
  flags?: { push?: boolean };
  silence?: { push?: boolean; call?: boolean; minutes?: number };
  signalZones?: { alert?: boolean };
}

export type StoreTopic = 'arrivalWindow' | 'vanOnTheWay' | 'cutoffReminder' | 'creditNotes';
export type Channels = { app?: boolean; sms?: boolean };

export interface Preferences {
  alerts?: AlertRules;
  onCall?: { from?: string; to?: string };
  notifications?: Partial<Record<StoreTopic, Channels>>;
  receiving?: { staffFrom?: string; staff?: { name: string; phone?: string; note?: string }[] };
  language?: 'en' | 'si' | 'ta';
}

/** The desk's defaults (DSP-20), used until the user saves their own. */
export const DEFAULT_ALERTS: Required<AlertRules> = {
  vehicleFault: { push: true, sms: true },
  lateRisk: { push: true, threshold: LATE_RISK_PCT, risingOnly: true },
  flags: { push: true },
  silence: { push: true, call: true, minutes: 15 },
  signalZones: { alert: false },
};

/** The desk's SM-30 defaults per topic. */
export const DEFAULT_TOPICS: Record<StoreTopic, Channels> = {
  arrivalWindow: { app: true, sms: true },
  vanOnTheWay: { app: true, sms: false },
  cutoffReminder: { app: true, sms: false },
  creditNotes: { app: true, sms: false },
};

/** The delivery channels this deployment offers (Notifications/Lodestar.Channels): SMS only with SMS_ENABLED, never a call. */
export interface DeliveryChannels {
  websocket: boolean;
  push: boolean;
  sms: boolean;
  call: boolean;
}

export const SMS_UNAVAILABLE = 'SMS not available in this deployment';

export function useDeliveryChannels() {
  return useQuery<DeliveryChannels>('delivery-channels', c => c.fn<DeliveryChannels>('Notifications/Lodestar.Channels()'), { persist: true });
}

/** Sections saved on this phone but not yet answered by the server (shown at once). */
const pending = new Store<{ sub?: string; p: Preferences }>({ p: {} });

export function usePreferences() {
  const q = useQuery<Preferences>('my-preferences', async c => (await c.fn<Preferences>('Users/Lodestar.MyPreferences()')) ?? {}, { persist: true });
  const sub = useStore(session.state).claims?.sub;
  const mine = useStore(pending);
  const local = sub && mine.sub === sub ? mine.p : {};
  const data = q.data || Object.keys(local).length ? { ...(q.data ?? {}), ...local } : undefined;
  return { ...q, data };
}

/** Saves whole sections (the server merges section by section). Shown at once; rolled back if the save fails. */
export async function savePreferences(patch: Preferences): Promise<void> {
  const before = pending.get();
  const sub = session.claims?.sub;
  pending.set(x => ({ sub, p: { ...(x.sub === sub ? x.p : {}), ...patch } }));
  try {
    await client.action('Users/Lodestar.SaveMyPreferences', { preferences: patch });
  } catch (e) {
    pending.set(before);
    throw e;
  }
}

/** Alert rules with the defaults filled in. */
export function alertRules(p?: Preferences): Required<AlertRules> {
  const a = p?.alerts ?? {};
  return {
    vehicleFault: { ...DEFAULT_ALERTS.vehicleFault, ...a.vehicleFault },
    lateRisk: { ...DEFAULT_ALERTS.lateRisk, ...a.lateRisk },
    flags: { ...DEFAULT_ALERTS.flags, ...a.flags },
    silence: { ...DEFAULT_ALERTS.silence, ...a.silence },
    signalZones: { ...DEFAULT_ALERTS.signalZones, ...a.signalZones },
  };
}

/** "3:00 AM" from "03:00". */
export function clock12(v?: string): string {
  if (!v || !/^\d{1,2}:\d{2}$/.test(v)) return '';
  const [h, m] = v.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** True when `now` (Colombo time) falls inside the on-call hours (which may run past midnight). */
export function onCallNow(onCall: Preferences['onCall'], now: number = Date.now()): boolean {
  if (!onCall?.from || !onCall.to) return false;
  const toMin = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const m = Math.floor(((now + 330 * 60_000) % 86_400_000) / 60_000);
  const a = toMin(onCall.from);
  const b = toMin(onCall.to);
  return a <= b ? m >= a && m < b : m >= a || m < b;
}
