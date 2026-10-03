import { runDateRange } from '@lodestar/platform';
import { EtaService, explainLateRisk } from './eta.service';
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

/** DSP-15: the late-risk parts add up to the stored figure, the same way computeModelEta sets it. */
describe('explainLateRisk', () => {
  const lk = (hhmm: string) => new Date(`2026-04-07T${hhmm}:00+05:30`);

  it('splits a monsoon hill stop into base, window and road parts', () => {
    const r = explainLateRisk({ roadClass: 'hill', isMonsoon: true, plannedHour: 5, etaModel: lk('07:28'), windowClose: '07:45', actual: 61 });
    expect(r.parts.map(p => p.value)).toEqual([20, 30, 11]);
    expect(r.parts.reduce((s, p) => s + p.value, 0)).toBe(61);
    expect(r.planned).toBe(50);
  });

  it('matches computeModelEta for the planned figure', () => {
    const eta = new EtaService({} as any);
    const m = eta.computeModelEta({ etaPlan: lk('07:00'), roadClass: 'hill', isMonsoon: true, windowClose: '08:00' });
    const r = explainLateRisk({ roadClass: 'hill', isMonsoon: true, plannedHour: 7, etaModel: m.etaModel, windowClose: '08:00', actual: m.lateRiskPct });
    expect(r.planned).toBe(m.lateRiskPct);
    expect(r.parts[2].value).toBe(0);
  });

  it('has no parts without a planned arrival or a stored figure', () => {
    expect(explainLateRisk({ roadClass: 'urban', isMonsoon: false, plannedHour: null, etaModel: null, windowClose: '08:00', actual: 8 }).parts).toEqual([]);
  });

  it('reads the stop, its road class and the monsoon flag', async () => {
    const prisma = {
      tripStop: { findUnique: jest.fn().mockResolvedValue({ id: 's2', etaPlan: lk('05:01'), etaModel: lk('07:28'), lateRiskPct: 61, trip: { depot: 'KANDY', runDate: new Date('2026-04-07T00:00:00Z') }, outlet: { district: 'Nuwara Eliya', windowClose: '07:45' } }) },
      districtTravel: { findUnique: jest.fn().mockResolvedValue({ roadClass: 'hill' }) },
      calendar: { findUnique: jest.fn().mockResolvedValue({ monsoon: 1 }) },
    };
    const r = await new EtaService(prisma as any).explainStop('s2');
    expect(r).toMatchObject({ depot: 'KANDY', roadClass: 'hill', monsoon: true, plannedHour: 5, base: 20 });
    expect(r!.parts.map(p => p.value)).toEqual([20, 30, 11]);
  });

  it('returns null for an unknown stop', async () => {
    const prisma = { tripStop: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(new EtaService(prisma as any).explainStop('x')).resolves.toBeNull();
  });
});
