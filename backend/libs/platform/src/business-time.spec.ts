import {
  businessWeekday,
  isOperatingDay,
  addBusinessDays,
  BUSINESS_TIME_ZONE,
  businessDate,
  businessDateTime,
  businessHhmm,
  businessHour,
  businessMinutesOfDay,
  businessParts,
  hhmmOfMinutes,
  isBeforeOrderCutoff,
  isWithinBusinessWindow,
  minutesOfHhmm,
  minutesUntilBusinessTime,
  nextOrderableRunDate,
  orderCutoffFor,
  runDateRange,
  runDateValue,
  startOfBusinessDay,
  startOfBusinessWeek,
  toBusinessDate,
  todayRunDate,
} from './business-time';

/**
 * These tests must pass whatever the process TZ is. CI runs them with
 * TZ=UTC and TZ=America/New_York (see the report / README).
 */
describe('business time (Asia/Colombo)', () => {
  it(`runs under TZ=${process.env.TZ ?? '(unset)'} with offset ${new Date('2026-04-07T00:00:00Z').getTimezoneOffset()} min`, () => {
    expect(BUSINESS_TIME_ZONE).toBe('Asia/Colombo');
  });

  it('reads Colombo wall-clock parts of an instant', () => {
    // 2026-04-07 05:30 in Colombo = 00:00 UTC
    const p = businessParts(new Date('2026-04-07T00:00:00.000Z'));
    expect(p).toEqual({ date: '2026-04-07', hour: 5, minute: 30, minutesOfDay: 330, weekday: 2 });
    expect(businessHour(new Date('2026-04-06T23:59:00Z'))).toBe(5);
    expect(businessMinutesOfDay(new Date('2026-04-07T02:30:00Z'))).toBe(8 * 60);
    expect(businessHhmm(new Date('2026-04-07T02:15:00Z'))).toBe('07:45');
  });

  it('crosses the date line at 18:30 UTC (Colombo midnight), not at UTC or server midnight', () => {
    expect(businessDate(new Date('2026-04-06T18:29:59.999Z'))).toBe('2026-04-06');
    expect(businessDate(new Date('2026-04-06T18:30:00.000Z'))).toBe('2026-04-07');
    // 9 PM in New York on 6 Apr is already 7 Apr in Colombo.
    expect(businessDate(new Date('2026-04-06T21:00:00-04:00'))).toBe('2026-04-07');
  });

  it('agrees with the Intl API for Asia/Colombo across a year (no DST)', () => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    for (let t = Date.UTC(2026, 0, 1, 0, 7); t < Date.UTC(2027, 0, 1); t += 37 * 3_600_000 + 11 * 60_000) {
      const at = new Date(t);
      const parts = Object.fromEntries(fmt.formatToParts(at).map((x) => [x.type, x.value]));
      expect(businessDate(at)).toBe(`${parts.year}-${parts.month}-${parts.day}`);
      expect(businessHhmm(at)).toBe(`${parts.hour}:${parts.minute}`);
    }
  });

  it('turns Colombo wall-clock times into instants', () => {
    expect(businessDateTime('2026-04-07', '05:30').toISOString()).toBe('2026-04-07T00:00:00.000Z');
    expect(businessDateTime('2026-04-07', '08:00').toISOString()).toBe('2026-04-07T02:30:00.000Z');
    expect(businessDateTime('2026-04-07', '04:00').toISOString()).toBe('2026-04-06T22:30:00.000Z');
    expect(startOfBusinessDay('2026-04-07').toISOString()).toBe('2026-04-06T18:30:00.000Z');
    expect(() => businessDateTime('2026-04-07', '25:00')).toThrow(RangeError);
  });

  it('parses and formats HH:mm', () => {
    expect(minutesOfHhmm('05:30')).toBe(330);
    expect(minutesOfHhmm('16:00')).toBe(960);
    expect(hhmmOfMinutes(330)).toBe('05:30');
    expect(hhmmOfMinutes(-30)).toBe('23:30');
    expect(() => minutesOfHhmm('8am')).toThrow(RangeError);
  });

  it('checks delivery windows (05:30–08:00) in Colombo time', () => {
    expect(isWithinBusinessWindow('05:30', '08:00', new Date('2026-04-07T00:00:00Z'))).toBe(true); // 05:30
    expect(isWithinBusinessWindow('05:30', '08:00', new Date('2026-04-07T02:30:00Z'))).toBe(true); // 08:00
    expect(isWithinBusinessWindow('05:30', '08:00', new Date('2026-04-07T02:31:00Z'))).toBe(false); // 08:01
    expect(isWithinBusinessWindow('05:30', '08:00', new Date('2026-04-06T23:59:00Z'))).toBe(false); // 05:29
    expect(isWithinBusinessWindow('22:00', '02:00', new Date('2026-04-06T19:00:00Z'))).toBe(true); // 00:30
    expect(minutesUntilBusinessTime('08:00', new Date('2026-04-07T02:15:00Z'))).toBe(15);
  });

  it('maps run dates to their stored UTC-midnight window', () => {
    const r = runDateRange('2026-04-07');
    expect(r.start.toISOString()).toBe('2026-04-07T00:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-04-08T00:00:00.000Z');
    expect(r.iso).toBe('2026-04-07');
    // A stored run date maps to itself; an instant maps to its Colombo date.
    expect(runDateRange(new Date('2026-04-07T00:00:00Z')).iso).toBe('2026-04-07');
    expect(runDateRange(new Date('2026-04-06T20:00:00Z')).iso).toBe('2026-04-07');
    expect(runDateValue('2026-04-07T10:00:00Z').toISOString()).toBe('2026-04-07T00:00:00.000Z');
    expect(() => toBusinessDate('2026-02-30')).toThrow(RangeError);
    expect(() => toBusinessDate('soon')).toThrow(RangeError);
  });

  it('computes "today" in Colombo', () => {
    expect(todayRunDate(new Date('2026-04-06T19:00:00Z')).toISOString()).toBe('2026-04-07T00:00:00.000Z');
    expect(todayRunDate(new Date('2026-04-06T18:00:00Z')).toISOString()).toBe('2026-04-06T00:00:00.000Z');
    expect(typeof businessDate()).toBe('string');
  });

  it('adds days across month and year ends', () => {
    expect(addBusinessDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addBusinessDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addBusinessDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('closes orders at 4:00 PM Colombo the day before the run date', () => {
    const cutoff = orderCutoffFor('2026-04-07');
    expect(cutoff.toISOString()).toBe('2026-04-06T10:30:00.000Z');
    expect(isBeforeOrderCutoff('2026-04-07', new Date('2026-04-06T10:29:59Z'))).toBe(true); // 3:59:59 PM
    expect(isBeforeOrderCutoff('2026-04-07', new Date('2026-04-06T10:30:00Z'))).toBe(false); // 4:00 PM
    // Mon 2:38 PM Colombo: the order still makes Tuesday's run.
    expect(nextOrderableRunDate(new Date('2026-04-06T14:38:00+05:30'))).toBe('2026-04-07');
    // Mon 4:05 PM Colombo: too late for Tuesday.
    expect(nextOrderableRunDate(new Date('2026-04-06T16:05:00+05:30'))).toBe('2026-04-08');
    // Mon 11 PM Colombo (still Monday afternoon in New York): Wednesday.
    expect(nextOrderableRunDate(new Date('2026-04-06T23:00:00+05:30'))).toBe('2026-04-08');
  });

  it('starts the business week on Monday 00:00 Colombo', () => {
    const monday = '2026-04-05T18:30:00.000Z'; // Mon 6 Apr 00:00 Colombo
    expect(startOfBusinessWeek(new Date('2026-04-07T00:00:00Z')).toISOString()).toBe(monday); // Tue
    expect(startOfBusinessWeek(new Date(monday)).toISOString()).toBe(monday); // the first instant of Monday
    expect(startOfBusinessWeek(new Date('2026-04-12T18:29:59Z')).toISOString()).toBe(monday); // Sun 23:59:59 Colombo
    expect(startOfBusinessWeek(new Date('2026-04-12T18:30:00Z')).toISOString()).toBe('2026-04-12T18:30:00.000Z'); // next Monday
  });
});

describe('operating days', () => {
  it('a date the Calendar is silent about runs Monday to Saturday', () => {
    expect(businessWeekday('2026-10-03')).toBe(6); // Saturday
    expect(isOperatingDay('2026-10-03')).toBe(true);
    expect(isOperatingDay('2026-10-04')).toBe(false); // Sunday
    expect(isOperatingDay('2026-10-05', null)).toBe(true); // Monday
  });

  it('a Calendar row decides either way', () => {
    expect(isOperatingDay('2026-10-04', { isOperating: true })).toBe(true);
    expect(isOperatingDay('2026-10-05', { isOperating: false })).toBe(false);
  });
});
