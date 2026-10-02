'use client';
// ADM-13 Calendar, live. Markup and classes from the generated design (frontend/screens/adm-13-calendar.tsx).
// Data: Calendar (one row per day: isOperating, festivalName, festivalRamp, isPayday, monsoon). The month grid is
// the chosen month (default: this month, inside the calendar's range); "Coming up" lists the festivals, paydays,
// the monsoon run and the calendar's end from today on.
// "Replace calendar.csv" opens ADM-14 data imports.
import { useState, type CSSProperties } from 'react';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { addDays, isoDay, TIME_ZONE } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';

interface CalendarDay {
  date: string;
  isOperating: boolean;
  isPayday: boolean;
  festivalRamp: number;
  monsoon: number;
  festivalName?: string | null;
  note?: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const weekday = (day: string) => WEEKDAYS[utc(day).getUTCDay()];
/** "13 Apr" */
const dm = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`;
/** "1 Jan 2024" */
const dmy = (day: string) => `${dm(day)} ${day.slice(0, 4)}`;
const at = (day: string) => `${day}T00:00:00Z`;
const ramp = (v: number) => v.toFixed(1);

/** ISO week number (W14). */
function isoWeek(day: string): number {
  const d = utc(day);
  const thu = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 86_400_000);
  const jan1 = Date.UTC(thu.getUTCFullYear(), 0, 1);
  return Math.floor((thu.getTime() - jan1) / 86_400_000 / 7) + 1;
}

/** Today in the depots' time zone, YYYY-MM-DD. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Months (YYYY-MM) from the first to the last calendar day. */
function monthsBetween(first: string, last: string): string[] {
  const out: string[] = [];
  let y = Number(first.slice(0, 4));
  let m = Number(first.slice(5, 7));
  const ly = Number(last.slice(0, 4));
  const lm = Number(last.slice(5, 7));
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const monthLabel = (ym: string) => `${MONTHS_LONG[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/** The Monday-first weeks covering a month. */
function gridWeeks(ym: string): string[][] {
  const first = `${ym}-01`;
  const start = addDays(first, -((utc(first).getUTCDay() + 6) % 7));
  const weeks: string[][] = [];
  for (let d = start; d.slice(0, 7) <= ym; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
  }
  return weeks;
}

type Tone = 'bad' | 'ok' | 'warn' | 'info';
const TONE: Record<Tone, CSSProperties> = {
  bad: { background: 'var(--tint-bad)', color: 'var(--st-exception-fg)' },
  ok: { background: 'var(--tint-ok)', color: 'var(--st-delivered-fg)' },
  warn: { background: 'var(--tint-warn)', color: 'var(--st-deferred-fg)' },
  info: { background: 'var(--tint-info)', color: 'var(--st-enroute-fg)' },
};

interface Event {
  day: string;
  /** Last day (a festival can span days). */
  end: string;
  tone: Tone;
  title: string;
  text: string;
}

/** "Mon 13 and Tue 14", "Mon 13, Tue 14 and Wed 15" */
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Festivals and paydays in `rows` (ordered by date) not over before `from`, with the ramp-up before each festival. */
function upcomingEvents(rows: CalendarDay[], from: string): Event[] {
  const days = rows.map(r => ({ ...r, day: isoDay(r.date) }));
  const events: Event[] = [];
  for (let i = 0; i < days.length; i++) {
    const r = days[i];
    if (r.festivalName) {
      let j = i;
      while (j + 1 < days.length && days[j + 1].festivalName === r.festivalName && days[j + 1].day === addDays(days[j].day, 1)) j++;
      const group = days.slice(i, j + 1);
      let k = i;
      while (k - 1 >= 0 && days[k - 1].festivalRamp > 0 && days[k - 1].day === addDays(days[k].day, -1)) k--;
      const closed = group.filter(g => !g.isOperating);
      const parts = [
        closed.length > 1 ? `${andList(closed.map(g => `${weekday(g.day)} ${Number(g.day.slice(8, 10))}`))} closed`
          : `${weekday(r.day)} · ${closed.length ? 'closed' : 'operating'}`,
      ];
      if (k < i) parts.push(`ramp from ${dm(days[k].day)}`);
      events.push({
        day: r.day,
        end: days[j].day,
        tone: closed.length ? 'bad' : 'warn',
        title: group.some(g => g.isPayday) ? `${r.festivalName} and payday` : r.festivalName,
        text: parts.join(' · '),
      });
      i = j;
    } else if (r.isPayday) {
      events.push({
        day: r.day,
        end: r.day,
        tone: 'ok',
        title: 'Payday',
        text: [weekday(r.day), r.isOperating ? 'operating' : 'closed', ...(r.festivalRamp > 0 ? [`ramp ${ramp(r.festivalRamp)}`] : [])].join(' · '),
      });
    }
  }
  return events.filter(e => e.end >= from);
}

function DayCell({ day, row, inMonth, today }: { day: string; row: CalendarDay | undefined; inMonth: boolean; today: boolean }) {
  const sun = utc(day).getUTCDay() === 0;
  const n = Number(day.slice(8, 10));
  if (!inMonth || !row) {
    return (
      <div className="adm-day adm-day--out" data-day={day}>
        <span className="adm-day__n">{n}</span>
        <span className="adm-day__t">{row && sun && !row.isOperating ? 'Sun · closed' : MONTHS[Number(day.slice(5, 7)) - 1]}</span>
      </div>
    );
  }
  const holiday = !row.isOperating && Boolean(row.festivalName);
  const cls = ['adm-day', sun ? 'adm-day--sun' : '', holiday && !sun ? 'adm-day--hol' : '', today ? 'adm-day--today' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls} data-day={day}>
      <span className="adm-day__n">{today ? <>{`${n} `}<span className="adm-today">{"Today"}</span></> : n}</span>
      {row.festivalName && (
        <span className="adm-day__t" style={{ color: row.isOperating ? 'var(--st-deferred-fg)' : 'var(--st-exception-fg)', fontWeight: '700' }}>{row.festivalName}</span>
      )}
      {!row.isOperating && (sun && !row.festivalName
        ? <span className="adm-day__t">{"Sun · closed"}</span>
        : <span className="adm-day__t" style={{ color: 'var(--st-exception-fg)' }}>{"Closed"}</span>)}
      {row.isPayday && <span className="adm-day__t" style={{ color: 'var(--st-delivered-fg)', fontWeight: '700' }}>{"Payday"}</span>}
      {row.festivalRamp > 0 && (
        <>
          <div className="adm-ramp"><div style={{ width: `${Math.round(Math.min(1, row.festivalRamp) * 100)}%` }} /></div>
          <span className="adm-day__r">{`ramp ${ramp(row.festivalRamp)}`}</span>
        </>
      )}
    </div>
  );
}

export default function LiveAdm13Calendar() {
  const today = todayIso();
  const range = useQuery<{ first: string; last: string } | null>('adm-cal-range', async c => {
    const [a, z] = await Promise.all([
      c.list<CalendarDay>('Calendar', { select: 'date', orderby: 'date', top: 1 }),
      c.list<CalendarDay>('Calendar', { select: 'date', orderby: 'date desc', top: 1 }),
    ]);
    return a.value[0] && z.value[0] ? { first: isoDay(a.value[0].date), last: isoDay(z.value[0].date) } : null;
  });
  const r = range.data;
  const months = r ? monthsBetween(r.first, r.last) : [];
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked ?? (r ? (today < r.first ? r.first : today > r.last ? r.last : today).slice(0, 7) : null);
  const weeks = month ? gridWeeks(month) : [];
  const grid = useQuery<CalendarDay[]>(month ? `adm-cal:${month}` : null, c =>
    c.all<CalendarDay>('Calendar', { filter: `date ge ${at(weeks[0][0])} and date lt ${at(addDays(weeks[weeks.length - 1][6], 1))}`, orderby: 'date' }));
  const byDay = new Map((grid.data ?? []).map(d => [isoDay(d.date), d]));
  const inMonth = (grid.data ?? []).filter(d => isoDay(d.date).startsWith(month ?? '-'));
  const monsoonDays = inMonth.filter(d => d.monsoon).length;

  // Coming up: the next ten weeks from today (inside the calendar), read from two weeks earlier so a festival's
  // ramp-up shows where it started; the monsoon run is the one around its first day from today on.
  const from = r ? (today < r.first ? r.first : today) : null;
  const ahead = useQuery<CalendarDay[]>(r && from && from <= r.last ? `adm-cal-ahead:${from}` : null, c =>
    c.all<CalendarDay>('Calendar', { filter: `date ge ${at(addDays(from!, -14))} and date lt ${at(addDays(from!, 70))}`, orderby: 'date' }));
  const wet = ahead.data?.find(d => d.monsoon && isoDay(d.date) >= from!);
  const wetDay = wet ? isoDay(wet.date) : null;
  const monsoon = useQuery<{ start: string; end: string }>(wetDay && r ? `adm-cal-monsoon:${wetDay}` : null, async c => {
    const [before, after] = await Promise.all([
      c.list<CalendarDay>('Calendar', { select: 'date', filter: `monsoon eq 0 and date lt ${at(wetDay!)}`, orderby: 'date desc', top: 1 }),
      c.list<CalendarDay>('Calendar', { select: 'date', filter: `monsoon eq 0 and date gt ${at(wetDay!)}`, orderby: 'date', top: 1 }),
    ]);
    return {
      start: before.value[0] ? addDays(isoDay(before.value[0].date), 1) : r!.first,
      end: after.value[0] ? addDays(isoDay(after.value[0].date), -1) : r!.last,
    };
  });
  const events = from ? upcomingEvents(ahead.data ?? [], from).slice(0, 5) : [];
  if (monsoon.data) events.push({ day: monsoon.data.start, end: monsoon.data.end, tone: 'info', title: 'Monsoon flag on', text: `Every day to ${dm(monsoon.data.end)}. Hill runs use monsoon speeds` });
  if (r) {
    events.push(r.last < today
      ? { day: r.last, end: r.last, tone: 'warn', title: 'Calendar ended', text: `Load W${isoWeek(addDays(r.last, 1))} onward` }
      : { day: r.last, end: r.last, tone: 'warn', title: 'Calendar ends', text: `Load W${isoWeek(addDays(r.last, 1))} onward` });
  }

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-13 Calendar · desktop">
      <div className="d-app">
        <AdminSide active="N7" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">
                {"Calendar "}<span className="m-sep" />{" from calendar.csv"}
                {r && <><span className="m-sep" />{` ${dmy(r.first)} to ${dmy(r.last)}`}</>}
              </div>
              <div className="d-h1">{"Calendar"}</div>
              <div className="d-sub">{"Operating days, holidays, festival ramps, paydays and monsoon flags. The planning agent and the capacity outlook both read it."}</div>
            </div>
            {months.length > 0 && month && (
              <span className="d-filter" style={{ height: '40px' }}>
                <select className="lv-input" aria-label="Month" value={month} onChange={e => setPicked(e.target.value)} style={{ width: 'auto' }}>
                  {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </select>
              </span>
            )}
            <span className="d-btn" data-lk="L66"><Ic n="upload" />{"Replace calendar.csv"}</span>
          </div>
          <ErrorBanner error={range.error ?? grid.error ?? ahead.error ?? monsoon.error} onRetry={() => { void range.refresh(); void grid.refresh(); void ahead.refresh(); }} />
          {r === null && <Empty title="No calendar yet" text="Lodestar has no calendar days." icon="calendar" />}
          {r !== null && (
            <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
              <div className="dx-card" style={{ flex: '1' }} data-testid="calendar-month">
                <div className="dx-card__head">
                  <span className="dx-card__title">{month ? monthLabel(month) : ''}</span>
                  <span className="spacer" />
                  <div className="x-legend">
                    <span><i className="x-sw" style={{ background: '#F5B83D' }} />{"Festival ramp"}</span>
                    <span><i className="x-sw" style={{ background: 'var(--st-exception-fg)' }} />{"Closed"}</span>
                    {monsoonDays > 0 && (
                      <span><i className="x-sw" style={{ background: 'var(--chilled-fg)' }} />{monsoonDays === inMonth.length ? 'Monsoon all month' : `Monsoon ${monsoonDays} days`}</span>
                    )}
                  </div>
                </div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  {!grid.data && !grid.error ? <Skeleton rows={5} /> : (
                    <div className="adm-cal">
                      <div className="adm-cal__h">
                        <span className="adm-cal__w">{"Wk"}</span>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                      </div>
                      {weeks.map(w => (
                        <div key={w[0]} className="adm-cal__row">
                          <span className="adm-cal__w">{`W${isoWeek(w[0])}`}</span>
                          {w.map(d => <DayCell key={d} day={d} row={byDay.get(d)} inMonth={d.startsWith(month!)} today={d === today} />)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="dx-card" style={{ width: '350px', flexShrink: '0' }} data-testid="coming-up">
                <div className="dx-card__head"><span className="dx-card__title">{"Coming up"}</span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  {(!r || (from! <= r.last && !ahead.data && !ahead.error)) ? <Skeleton rows={4} /> : events.map(e => (
                    <div key={`${e.day}-${e.title}`} className="dx-kv" style={{ minHeight: '58px', justifyContent: 'flex-start', gap: '12px' }}>
                      <span className="adm-date" style={TONE[e.tone]}>{dm(e.day)}</span>
                      <span className="dx-td2" style={{ minWidth: '0' }}>
                        <b>{e.title}</b>
                        <span style={{ whiteSpace: 'normal' }}>{e.text}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

