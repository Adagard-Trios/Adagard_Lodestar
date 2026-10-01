import { runDateRange } from '@lodestar/platform';
import { EtaService } from './eta.service';
import { CapacityService } from './capacity.service';
import { dayRange } from './planning.service';

/** ETA and late risk in Sri Lanka time, whatever the server TZ (run with TZ=UTC and TZ=America/New_York). */
describe('EtaService in Asia/Colombo time', () => {
  const eta = new EtaService({} as any);
  const lk = (hhmm: string, date = '2026-04-07') => new Date(`${date}T${hhmm}:00+05:30`);

  it('derives the planned hour from etaPlan in Colombo time', () => {
    // 05:10 Colombo is 23:40 UTC the day before: a UTC server would read hour 23.
    const r = eta.computeModelEta({ etaPlan: lk('05:10'), roadClass: 'hill', isMonsoon: true, windowClose: '08:00' });
    expect(r.lateRiskPct).toBe(20); // before 6 AM, monsoon
    expect(r.etaModel.getTime() - lk('05:10').getTime()).toBe(29 * 60_000);
  });

  it('flags a model ETA within 30 min of the 08:00 window close (Colombo)', () => {
    // 07:00 Colombo + 42 min = 07:42 → past 07:30 → +30 %. On a UTC server getHours() would say 02:12.
    const r = eta.computeModelEta({ etaPlan: lk('07:00'), roadClass: 'hill', isMonsoon: true, windowClose: '08:00' });
    expect(r.etaModel.toISOString()).toBe('2026-04-07T02:12:00.000Z');
    expect(r.lateRiskPct).toBe(83);
  });

  it('does not flag an early ETA even when the server clock is far off Colombo', () => {
    const r = eta.computeModelEta({ etaPlan: lk('05:00'), roadClass: 'urban', isMonsoon: false, windowClose: '08:00' });
    expect(r.lateRiskPct).toBe(8);
  });

  it('plan ETA adds minutes on the instant (no local-time arithmetic)', () => {
    const at = eta.computePlanEta({
      departTime: lk('03:30'), depotToDistMin: 120, priorStopServiceMins: 29, priorInterStopMins: 10, interStopMin: 6, serviceMin: 20,
    });
    expect(at.toISOString()).toBe(lk('06:15').toISOString());
  });

  it('run-date windows are the stored calendar date', () => {
    expect(dayRange('2026-04-07')).toEqual(runDateRange('2026-04-07'));
    expect(dayRange(new Date('2026-04-07T00:00:00Z')).iso).toBe('2026-04-07');
    // An instant late on 6 Apr UTC is already 7 Apr in Colombo.
    expect(dayRange(new Date('2026-04-06T19:00:00Z')).iso).toBe('2026-04-07');
  });

  it('capacity outlook weeks are Mondays as calendar dates', async () => {
    const prisma = {
      calendar: { findMany: jest.fn().mockResolvedValue([]) },
      vehicle: { count: jest.fn().mockResolvedValue(0) },
    };
    const out = await new CapacityService(prisma as any).getCapacityOutlook('KANDY' as any);
    expect(out.weeks[0].weekStart).toBe('2026-04-06');
    expect(out.weeks[9].weekStart).toBe('2026-06-08');
    const firstWhere = prisma.calendar.findMany.mock.calls[0][0].where.date;
    expect(firstWhere.gte.toISOString()).toBe('2026-04-06T00:00:00.000Z');
    expect(firstWhere.lt.toISOString()).toBe('2026-04-13T00:00:00.000Z');
  });
});
