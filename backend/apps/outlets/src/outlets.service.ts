import { Injectable } from '@nestjs/common';

/** Minutes since midnight for "HH:mm". */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

@Injectable()
export class OutletsService {
  /**
   * Is `at` (default now) within an outlet's delivery window?
   * Windows are local (Sri Lanka, UTC+5:30) wall-clock times.
   */
  isWindowOpen(outlet: { windowOpen: string; windowClose: string }, at: Date = new Date()): boolean {
    const local = new Date(at.getTime() + 330 * 60_000);
    const nowMin = local.getUTCHours() * 60 + local.getUTCMinutes();
    return nowMin >= minutesOf(outlet.windowOpen) && nowMin <= minutesOf(outlet.windowClose);
  }

  /** Validates a "HH:mm" window: both times valid and open before close. */
  validWindow(open: string, close: string): boolean {
    const re = /^([01]\d|2[0-3]):[0-5]\d$/;
    return re.test(open) && re.test(close) && minutesOf(open) < minutesOf(close);
  }
}
