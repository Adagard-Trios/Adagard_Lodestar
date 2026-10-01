// Asia/Colombo is UTC+05:30 all year (no daylight saving), so plain offset arithmetic is exact and
// does not depend on the Intl time-zone data of the JS engine.
const OFFSET_MS = 330 * 60_000;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

function local(input: string | number | Date): Date | null {
  const ms = input instanceof Date ? input.getTime() : typeof input === 'number' ? input : Date.parse(input);
  return Number.isFinite(ms) ? new Date(ms + OFFSET_MS) : null;
}

/** The calendar date in Colombo, YYYY-MM-DD. */
export function colomboDate(now: number | Date = Date.now()): string {
  const d = local(now)!;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** YYYY-MM-DD plus n days. */
export function addDays(date: string, n: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + n * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** OData filter for "runDate falls on this day" (run dates are stored as UTC midnight). */
export function dayFilter(field: string, date: string): string {
  return `${field} ge ${date}T00:00:00Z and ${field} lt ${addDays(date, 1)}T00:00:00Z`;
}

/** 6:35 (Colombo wall clock), or '' for no value. */
export function hm(input?: string | null): string {
  if (!input) return '';
  const d = local(input);
  return d ? `${d.getUTCHours()}:${pad(d.getUTCMinutes())}` : '';
}

/** Tue 7 Apr, for a YYYY-MM-DD or an instant. */
export function dayLabel(input?: string | null): string {
  if (!input) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00Z`) : local(input);
  return d ? `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : '';
}

/** The YYYY-MM-DD part of a run date as the API returns it. */
export function isoDay(input?: string | null): string {
  return input ? input.slice(0, 10) : '';
}

/** "Good morning" etc. by Colombo hour. */
export function greeting(now: number = Date.now()): string {
  const h = local(now)!.getUTCHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** "3 min ago", "2 h ago", or the time for older values. */
export function ago(input?: string | null, now: number = Date.now()): string {
  if (!input) return '';
  const ms = now - Date.parse(input);
  if (!Number.isFinite(ms)) return '';
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  return `${dayLabel(input)} ${hm(input)}`;
}

/** "in 45 min" / "in 2 h" for a time ahead today; '' otherwise. */
export function until(input?: string | null, now: number = Date.now()): string {
  if (!input) return '';
  const ms = Date.parse(input) - now;
  if (!Number.isFinite(ms) || ms < 0 || ms > 12 * 3_600_000) return '';
  return ms < 3_600_000 ? `in ${Math.max(1, Math.round(ms / 60_000))} min` : `in ${Math.round(ms / 3_600_000)} h`;
}
