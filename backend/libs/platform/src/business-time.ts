/**
 * Business time: Waypoint runs in Sri Lanka time (Asia/Colombo, UTC+05:30,
 * no daylight saving since 2006). Containers run in UTC and developers run
 * anywhere, so nothing in the business logic may use the server's local time
 * (getHours(), setDate(), toLocale…() without a zone). Use these helpers.
 *
 * Conventions:
 *  - Wall-clock times ("05:30", "16:00") are Colombo times.
 *  - A business date is "YYYY-MM-DD" in Colombo.
 *  - Run dates are calendar dates; the database stores them as UTC midnight
 *    of that date (2026-04-07 → 2026-04-07T00:00:00.000Z). Because Colombo is
 *    ahead of UTC, the Colombo date of such a value is the same date.
 */

export const BUSINESS_TIME_ZONE = 'Asia/Colombo';
/** Fixed offset of Asia/Colombo from UTC, in minutes (+05:30, no DST). */
export const BUSINESS_UTC_OFFSET_MIN = 330;
/** Orders for a run date close at 4:00 PM (Colombo) the day before. */
export const ORDER_CUTOFF_HHMM = '16:00';

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const OFFSET_MS = BUSINESS_UTC_OFFSET_MIN * MINUTE_MS;
const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

export interface BusinessParts {
  /** YYYY-MM-DD in Colombo */
  date: string;
  hour: number;
  minute: number;
  /** minutes since Colombo midnight */
  minutesOfDay: number;
  /** 0 = Sunday … 6 = Saturday, in Colombo */
  weekday: number;
}

/** "HH:mm" (Colombo wall clock) → minutes since midnight. */
export function minutesOfHhmm(hhmm: string): number {
  const m = HHMM.exec(String(hhmm).trim());
  if (!m) throw new RangeError(`Not a HH:mm time: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes since midnight → "HH:mm". */
export function hhmmOfMinutes(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Colombo wall-clock parts of an instant (independent of the server's TZ). */
export function businessParts(at: Date = new Date()): BusinessParts {
  const t = at.getTime();
  if (Number.isNaN(t)) throw new RangeError('Invalid date');
  // Shift the instant by the fixed offset and read it with the UTC getters.
  const shifted = new Date(t + OFFSET_MS);
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  return {
    date: shifted.toISOString().slice(0, 10),
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    weekday: shifted.getUTCDay(),
  };
}

/** Colombo hour (0–23) of an instant. */
export function businessHour(at: Date = new Date()): number {
  return businessParts(at).hour;
}

/** Minutes since Colombo midnight of an instant. */
export function businessMinutesOfDay(at: Date = new Date()): number {
  return businessParts(at).minutesOfDay;
}

/** The Colombo calendar date of an instant: "today" is businessDate(). */
export function businessDate(at: Date = new Date()): string {
  return businessParts(at).date;
}

/** Normalises "YYYY-MM-DD…" or a Date to a business date string. */
export function toBusinessDate(value: string | Date): string {
  if (value instanceof Date) return businessDate(value);
  const m = ISO_DATE.exec(String(value));
  if (!m) throw new RangeError(`Not a date: ${value}`);
  const d = `${m[1]}-${m[2]}-${m[3]}`;
  // Reject impossible dates such as 2026-02-30.
  if (new Date(`${d}T00:00:00.000Z`).toISOString().slice(0, 10) !== d) throw new RangeError(`Not a date: ${value}`);
  return d;
}

/** Adds whole days to a business date. */
export function addBusinessDays(date: string | Date, days: number): string {
  const d = new Date(`${toBusinessDate(date)}T00:00:00.000Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The instant of a Colombo wall-clock time on a business date ("2026-04-07", "05:30"). */
export function businessDateTime(date: string | Date, hhmm: string): Date {
  const midnightUtc = Date.parse(`${toBusinessDate(date)}T00:00:00.000Z`);
  return new Date(midnightUtc + minutesOfHhmm(hhmm) * MINUTE_MS - OFFSET_MS);
}

/** The instant Colombo midnight starts on a business date. */
export function startOfBusinessDay(date: string | Date = new Date()): Date {
  return businessDateTime(date, '00:00');
}

/**
 * Stored run-date window for a run date: [UTC midnight, next UTC midnight).
 * A string is read as a calendar date; a Date is read as the Colombo date of
 * that instant (a stored run date maps to itself).
 */
export function runDateRange(runDate: string | Date): { start: Date; end: Date; iso: string } {
  const iso = toBusinessDate(runDate);
  const start = new Date(`${iso}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + DAY_MS), iso };
}

/** The stored value (UTC midnight) of a run date. */
export function runDateValue(runDate: string | Date): Date {
  return runDateRange(runDate).start;
}

/** The run date that is "today" in Colombo, as stored. */
export function todayRunDate(at: Date = new Date()): Date {
  return runDateValue(businessDate(at));
}

/** Order cut-off for a run date: 4:00 PM Colombo on the day before. */
export function orderCutoffFor(runDate: string | Date): Date {
  return businessDateTime(addBusinessDays(runDate, -1), ORDER_CUTOFF_HHMM);
}

/** Is `at` (default now) still before the order cut-off of a run date? */
export function isBeforeOrderCutoff(runDate: string | Date, at: Date = new Date()): boolean {
  return at.getTime() < orderCutoffFor(runDate).getTime();
}

/** The earliest run date an order placed at `at` can still make. */
export function nextOrderableRunDate(at: Date = new Date()): string {
  const tomorrow = addBusinessDays(businessDate(at), 1);
  return isBeforeOrderCutoff(tomorrow, at) ? tomorrow : addBusinessDays(tomorrow, 1);
}

/** Is `at` within a Colombo wall-clock window such as 05:30–08:00 (inclusive)? */
export function isWithinBusinessWindow(open: string, close: string, at: Date = new Date()): boolean {
  const now = businessMinutesOfDay(at);
  const o = minutesOfHhmm(open);
  const c = minutesOfHhmm(close);
  // A window that wraps midnight (22:00–02:00).
  return o <= c ? now >= o && now <= c : now >= o || now <= c;
}

/** Minutes from `at` to a window close on the same Colombo day (negative once past). */
export function minutesUntilBusinessTime(hhmm: string, at: Date = new Date()): number {
  return minutesOfHhmm(hhmm) - businessMinutesOfDay(at);
}

/** "05:30"-style Colombo wall-clock label of an instant. */
export function businessHhmm(at: Date = new Date()): string {
  return hhmmOfMinutes(businessMinutesOfDay(at));
}
