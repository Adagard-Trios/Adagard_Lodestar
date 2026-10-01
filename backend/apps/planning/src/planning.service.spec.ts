import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { CapacityService } from './capacity.service';
import { DeferralScoringService } from './deferral-scoring.service';
import { EtaService } from './eta.service';
import { dayRange, PlanningService } from './planning.service';

interface PlanDelegate {
  findUnique(args: any): Promise<any>;
  findFirst(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
  update(args: any): Promise<any>;
}

describe('dayRange', () => {
  it('normalises strings and dates to a UTC day', () => {
    const r = dayRange('2026-04-07T18:45:00+05:30');
    expect(r.iso).toBe('2026-04-07');
    expect(r.start.toISOString()).toBe('2026-04-07T00:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-04-08T00:00:00.000Z');
    expect(dayRange(new Date('2026-04-07T13:00:00.000Z')).iso).toBe('2026-04-07');
  });
});

describe('PlanningService', () => {
  let plan: PlanDelegate;
  let txPlan: PlanDelegate;
  let capacity: CapacityService;
  let scoring: DeferralScoringService;
  let service: PlanningService;

  beforeEach(() => {
    plan = mock<PlanDelegate>();
    txPlan = mock<PlanDelegate>();
    capacity = mock(CapacityService);
    scoring = new DeferralScoringService();
    const tx = { plan: instance(txPlan) };
    const prisma = { plan: instance(plan), $transaction: async (cb: (t: any) => any) => cb(tx) };
    service = new PlanningService(prisma as any, scoring, instance(capacity));
  });

  describe('approvePlan', () => {
    const open = { id: 'PLK-2026-04-07-v2', depot: 'KANDY', runDate: new Date('2026-04-07T00:00:00.000Z'), status: 'NEEDS_APPROVAL' };

    it('supersedes other published versions and publishes this one', async () => {
      when(txPlan.findUnique(anything())).thenResolve(open);
      when(txPlan.updateMany(anything())).thenResolve({ count: 1 });
      when(txPlan.update(anything())).thenCall(async (a: any) => ({ id: a.where.id, ...a.data }));

      const res = await service.approvePlan(open.id, 'nilanthi', 'looks good');

      const [many] = capture(txPlan.updateMany).last();
      expect(many).toEqual({
        where: { depot: 'KANDY', runDate: open.runDate, status: 'PUBLISHED', id: { not: open.id } },
        data: { status: 'SUPERSEDED' },
      });
      const [upd] = capture(txPlan.update).last();
      expect(upd.where).toEqual({ id: open.id });
      expect(upd.data).toMatchObject({ status: 'PUBLISHED', approvedBy: 'nilanthi', notes: 'looks good' });
      expect(upd.data.approvedAt).toBeInstanceOf(Date);
      expect(upd.data.publishedAt).toBe(upd.data.approvedAt);
      expect(res.status).toBe('PUBLISHED');
    });

    it('omits notes when no note is given', async () => {
      when(txPlan.findUnique(anything())).thenResolve({ ...open, status: 'DRAFT' });
      when(txPlan.updateMany(anything())).thenResolve({ count: 0 });
      when(txPlan.update(anything())).thenCall(async (a: any) => a.data);
      const data = await service.approvePlan(open.id, 'nilanthi');
      expect(data).not.toHaveProperty('notes');
    });

    it('refuses a plan that is not open with 409', async () => {
      when(txPlan.findUnique(anything())).thenResolve({ ...open, status: 'PUBLISHED' });
      await expect(service.approvePlan(open.id, 'nilanthi')).rejects.toMatchObject({ status: 409 });
      verify(txPlan.updateMany(anything())).never();
      verify(txPlan.update(anything())).never();
    });

    it('404 when the plan does not exist', async () => {
      when(txPlan.findUnique(anything())).thenResolve(null);
      await expect(service.approvePlan('nope', 'nilanthi')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('rejectPlan', () => {
    it('rejects open plans only', async () => {
      when(plan.findUnique(anything())).thenResolve({ id: 'P', status: 'DRAFT' });
      when(plan.update(anything())).thenCall(async (a: any) => a.data);
      await expect(service.rejectPlan('P', 'no')).resolves.toEqual({ status: 'REJECTED', notes: 'no' });
      when(plan.findUnique(anything())).thenResolve({ id: 'P', status: 'SUPERSEDED' });
      await expect(service.rejectPlan('P')).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('nextPlanId', () => {
    it('uses the PLG prefix for Peliyagoda and starts at v1', async () => {
      when(plan.findFirst(anything())).thenResolve(null);
      const next = await service.nextPlanId('PELIYAGODA', '2026-04-07');
      expect(next).toEqual({ id: 'PLG-2026-04-07-v1', version: 1, runDate: new Date('2026-04-07T00:00:00.000Z') });
      const [args] = capture(plan.findFirst).last();
      expect(args).toMatchObject({ where: { depot: 'PELIYAGODA', runDate: new Date('2026-04-07T00:00:00.000Z') }, orderBy: { version: 'desc' } });
    });

    it('uses the PLK prefix for Kandy and increments the last version', async () => {
      when(plan.findFirst(anything())).thenResolve({ version: 3 });
      const next = await service.nextPlanId('KANDY', '2026-04-07T00:00:00.000Z');
      expect(next.id).toBe('PLK-2026-04-07-v4');
      expect(next.version).toBe(4);
    });
  });

  describe('createAgentPlan', () => {
    interface CreateDelegate {
      create(a: any): Promise<any>;
    }

    it('stores the agent draft as a NEEDS_APPROVAL AGENT plan version', async () => {
      const create = mock<CreateDelegate>();
      when(create.create(anything())).thenCall(async (a: any) => a.data);
      when(plan.findFirst(anything())).thenResolve({ version: 2 });
      const prisma = { plan: Object.assign(instance(plan), { create: instance(create).create }) };
      const svc = new PlanningService(prisma as any, scoring, instance(capacity));

      const run = { id: 'run-1', depot: 'KANDY' as const, runDate: new Date('2026-04-07T00:00:00.000Z') };
      const data = await svc.createAgentPlan(run, { id: 'run-1', status: 'APPROVED', plan: { trips: 3 }, explanation: { why: 'x' }, violations: [] }, 'nilanthi');

      expect(data).toMatchObject({
        id: 'PLK-2026-04-07-v3',
        version: 3,
        depot: 'KANDY',
        status: 'NEEDS_APPROVAL',
        source: 'AGENT',
        agentRunId: 'run-1',
        createdBy: 'nilanthi',
        explanation: '{"why":"x"}',
        summary: { plan: { trips: 3 }, contextSummary: null, ruleChecks: null, violations: [], deferrals: null, needsReview: null },
      });

      const plain = await svc.createAgentPlan(run, { explanation: 'because' }, 'nilanthi');
      expect(plain.explanation).toBe('because');
      const none = await svc.createAgentPlan(run, {}, 'nilanthi');
      expect(none.explanation).toBeNull();
    });
  });

  describe('suggestDeferrals', () => {
    const order = (id: string, computedScore: number, m3: number, extra: Record<string, any> = {}) => ({
      id,
      computedScore,
      m3,
      daysSince: 1,
      tempClass: 'CHILLED',
      isProtected: false,
      ...extra,
    });

    function stubPlan(shortM3: number, orders: any[]) {
      jest.spyOn(service, 'getPlan').mockResolvedValue({ summary: { chilled: { shortM3 } }, trips: [], orders } as any);
    }

    it('picks the lowest-scoring unprotected chilled orders until the shortfall is covered', async () => {
      stubPlan(5, [
        order('A', 40, 3),
        order('B', 10, 3),
        order('C', 95, 10, { isProtected: true }),
        order('D', 20, 3),
        order('E', 5, 10, { tempClass: 'AMBIENT' }),
      ]);
      const { suggestions } = await service.suggestDeferrals('PELIYAGODA', '2026-04-07');
      expect(suggestions.map((s) => s.orderId)).toEqual(['B', 'D']);
      expect(suggestions[0]).toMatchObject({ reason: 'CAP_REEFER', score: 10 });
      expect(suggestions[0].notes).toContain('Chilled short 5.0');
    });

    it('never suggests protected orders even if nothing else is left', async () => {
      stubPlan(50, [order('C', 95, 10, { isProtected: true }), order('X', 12, 1)]);
      const { suggestions } = await service.suggestDeferrals('PELIYAGODA', '2026-04-07');
      expect(suggestions.map((s) => s.orderId)).toEqual(['X']);
    });

    it('suggests nothing without a shortfall', async () => {
      stubPlan(0, [order('A', 1, 1)]);
      await expect(service.suggestDeferrals('KANDY', '2026-04-07')).resolves.toMatchObject({ suggestions: [] });
    });
  });
});

describe('DeferralScoringService', () => {
  const s = new DeferralScoringService();
  const base = { deferredYesterday: false, daysSince: 0, tempClass: 'AMBIENT' as any, brand: 'STYLE' as any, windowOpen: '09:00', nextRunWithin24h: false };

  it('applies each term of the formula', () => {
    expect(s.computeScore(base)).toBe(0);
    expect(s.computeScore({ ...base, deferredYesterday: true })).toBe(40);
    expect(s.computeScore({ ...base, daysSince: 2 })).toBe(24);
    expect(s.computeScore({ ...base, tempClass: 'CHILLED' as any })).toBe(15);
    expect(s.computeScore({ ...base, brand: 'FRESH' as any, windowOpen: '05:30' })).toBe(10);
    expect(s.computeScore({ ...base, brand: 'FRESH' as any, windowOpen: '08:00' })).toBe(0);
    expect(s.computeScore({ ...base, daysSince: 3, nextRunWithin24h: true })).toBe(26);
    expect(s.computeScore({ ...base, daysSince: 5, stockCoverDays: 10 })).toBe(40); // cover capped at -20
    expect(s.computeScore({ ...base, daysSince: 5, stockCoverDays: 2 })).toBe(50);
  });

  it('never goes below zero', () => {
    expect(s.computeScore({ ...base, nextRunWithin24h: true, stockCoverDays: 10 })).toBe(0);
  });

  it('combines to a protected score', () => {
    const score = s.computeScore({ ...base, deferredYesterday: true, daysSince: 3, tempClass: 'CHILLED' as any, brand: 'FRESH' as any, windowOpen: '05:30' });
    expect(score).toBe(101);
    expect(s.isProtected(score)).toBe(true);
  });

  it('isProtected / isDeferralCandidate thresholds', () => {
    expect(s.isProtected(90)).toBe(false);
    expect(s.isProtected(91)).toBe(true);
    expect(s.isDeferralCandidate(29)).toBe(true);
    expect(s.isDeferralCandidate(30)).toBe(false);
  });
});

describe('EtaService.computeModelEta', () => {
  const eta = new EtaService({} as any);
  // Local-time dates: computeModelEta compares with getHours() (server local time).
  const at = (h: number, m = 0) => new Date(2026, 3, 7, h, m, 0, 0);
  const minutesBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60000);

  it('hill road in monsoon before 6 AM: speed index 64 → +29 min, ±20 band, 20% risk', () => {
    const r = eta.computeModelEta({ etaPlan: at(5), roadClass: 'hill', isMonsoon: true, plannedHour: 5, windowClose: '08:00' });
    expect(minutesBetween(at(5), r.etaModel)).toBe(29);
    expect(minutesBetween(r.bandEarly, r.etaModel)).toBe(20);
    expect(minutesBetween(r.etaModel, r.bandLate)).toBe(20);
    expect(r.lateRiskPct).toBe(20);
  });

  it('hill road in monsoon at 7 AM: speed index 48 → +42 min, near window close adds 30%', () => {
    const r = eta.computeModelEta({ etaPlan: at(7), roadClass: 'hill', isMonsoon: true, plannedHour: 7, windowClose: '08:00' });
    expect(minutesBetween(at(7), r.etaModel)).toBe(42);
    expect(r.lateRiskPct).toBe(83);
  });

  it('urban roads: no delay before 6 AM, +10 after, 15-min band, 8% risk', () => {
    const early = eta.computeModelEta({ etaPlan: at(5), roadClass: 'urban', isMonsoon: true, plannedHour: 5, windowClose: '08:00' });
    expect(early.etaModel.getTime()).toBe(at(5).getTime());
    expect(minutesBetween(early.bandEarly, early.etaModel)).toBe(15);
    expect(early.lateRiskPct).toBe(8);
    const later = eta.computeModelEta({ etaPlan: at(7), roadClass: 'urban', isMonsoon: false, plannedHour: 7, windowClose: '08:00' });
    expect(minutesBetween(at(7), later.etaModel)).toBe(10);
    expect(later.lateRiskPct).toBe(8);
  });

  it('hill road outside monsoon is treated like an unknown road class', () => {
    const r = eta.computeModelEta({ etaPlan: at(5), roadClass: 'hill', isMonsoon: false, plannedHour: 5, windowClose: '08:00' });
    expect(r.etaModel.getTime()).toBe(at(5).getTime());
    expect(r.lateRiskPct).toBe(5);
  });

  it('getServiceMin falls back to 15 minutes', async () => {
    interface SaDelegate {
      findUnique(a: any): Promise<any>;
    }
    const sa = mock<SaDelegate>();
    when(sa.findUnique(anything())).thenResolve(null, { minutes: 25 });
    const svc = new EtaService({ serviceAllowance: instance(sa) } as any);
    await expect(svc.getServiceMin('FRESH', 'STREET')).resolves.toBe(15);
    await expect(svc.getServiceMin('FRESH', 'STREET')).resolves.toBe(25);
  });
});
