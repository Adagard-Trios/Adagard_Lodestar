// The 4:00 PM order cut-off (Asia/Colombo): an order for a run date must be placed before 16:00 on
// the day before. A store order placed after it is accepted into the following run; dispatch may
// instead log a late phone order for the closed run (DSP-10) with a reason, which planning flags. An order saved on a store phone before the cut-off but synced after it (no
// signal) still counts, within a grace window, because the store did order in time.
import { ODataError } from '@lodestar/odata';
import { businessDate, isBeforeOrderCutoff, nextOrderableRunDate, orderCutoffFor, toBusinessDate } from '@lodestar/platform';
import { Roles } from '@lodestar/security';

export interface CutoffSettings {
  /** ENFORCE_ORDER_CUTOFF (default true) */
  enforce: boolean;
  /** ORDER_OFFLINE_GRACE_HOURS (default 6): how late an order saved offline before the cut-off may arrive */
  graceHours: number;
}

export function cutoffSettings(env: NodeJS.ProcessEnv = process.env): CutoffSettings {
  const off = /^(false|0|no|off)$/i.test((env.ENFORCE_ORDER_CUTOFF ?? '').trim());
  const grace = Number(env.ORDER_OFFLINE_GRACE_HOURS);
  return { enforce: !off, graceHours: Number.isFinite(grace) && grace >= 0 ? grace : 6 };
}

export interface CutoffInput {
  roles: string[];
  runDate: string | Date;
  /** server receipt time */
  now: Date;
  /** when the phone saved the order (client clock), if sent */
  clientOrderedAt?: string | Date | null;
  lateReason?: string | null;
}

export interface CutoffDecision {
  orderedAt: Date;
  latePhone: boolean;
  lateReason: string | null;
  /** a store order after the cut-off: the run it asked for (closed) and the earliest run still open */
  moved?: { from: string; earliest: string };
}

/** a run date as YYYY-MM-DD */
const day = (d: string | Date) => toBusinessDate(d);

/** Decide how an order placed now is taken: orderedAt, late flags, and whether it moves to a later run. */
export function decideCutoff(input: CutoffInput, settings: CutoffSettings): CutoffDecision {
  const { roles, runDate, now } = input;
  const reason = (input.lateReason ?? '').trim();
  const clientAt = input.clientOrderedAt ? new Date(input.clientOrderedAt) : null;
  if (clientAt && Number.isNaN(clientAt.getTime())) throw ODataError.badRequest('orderedAt must be an ISO date-time', 'orderedAt');

  const cutoff = orderCutoffFor(runDate);
  // a phone clock ahead of the server is not trusted; anything later than "now" falls back to now
  const savedAt = clientAt && clientAt.getTime() <= now.getTime() ? clientAt : null;

  if (!settings.enforce || isBeforeOrderCutoff(runDate, now)) {
    return { orderedAt: savedAt ?? now, latePhone: false, lateReason: null };
  }

  // saved on the phone before the cut-off, arrived within the grace window: it was ordered in time
  const graceEnd = cutoff.getTime() + settings.graceHours * 3_600_000;
  if (savedAt && savedAt.getTime() < cutoff.getTime() && now.getTime() <= graceEnd) {
    return { orderedAt: savedAt, latePhone: false, lateReason: null };
  }

  const dispatch = roles.includes(Roles.Dispatcher) || roles.includes(Roles.Admin);
  if (dispatch) {
    if (!reason) {
      throw ODataError.unprocessable(
        'LateReasonRequired',
        `Orders for ${day(runDate)} closed at 4:00 PM on ${businessDate(cutoff)}. A late phone order needs lateReason.`,
        'lateReason',
      );
    }
    return { orderedAt: now, latePhone: true, lateReason: reason.slice(0, 500) };
  }

  // a store order after the cut-off goes to the following run (the caller skips non-operating days)
  return { orderedAt: now, latePhone: false, lateReason: null, moved: { from: day(runDate), earliest: nextOrderableRunDate(now) } };
}

/** The note a moved order carries, so the store sees why its run date changed. */
export function movedNote(from: string, to: string): string {
  return `Placed after the 4:00 PM cut-off for ${from}; moved to the ${to} run.`;
}

/** The note an order asked for a closed day carries. */
export function closedDayNote(from: string, to: string): string {
  return `${from} is not an operating day; moved to the ${to} run.`;
}

/** A store may only change an order (or move it to another run) before the cut-off of both run dates. */
export function assertStoreMayEdit(roles: string[], currentRunDate: string | Date, newRunDate: string | Date | undefined, now: Date, settings: CutoffSettings) {
  if (!settings.enforce) return;
  if (roles.includes(Roles.Dispatcher) || roles.includes(Roles.Admin) || roles.includes(Roles.Service)) return;
  for (const rd of [currentRunDate, newRunDate]) {
    if (rd !== undefined && !isBeforeOrderCutoff(rd, now)) {
      throw ODataError.unprocessable('OrderCutoffPassed', `Orders for ${day(rd)} closed at 4:00 PM on ${businessDate(orderCutoffFor(rd))}; this order can no longer be changed.`, 'runDate');
    }
  }
}
