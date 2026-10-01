import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import {
  Depot, OrderStatus, TempClass, DeferralReason, DeferralStatus, PlanSource, PlanStatus, Prisma,
} from '@prisma/client';
import { DeferralScoringService } from './deferral-scoring.service';
import { CapacityService } from './capacity.service';

/** Plan id prefix per depot: PLG-2026-04-07-v3 (Peliyagoda), PLK-… (Kandy). */
export const PLAN_PREFIX: Record<Depot, string> = { PELIYAGODA: 'PLG', KANDY: 'PLK' };

/** Plans a human may still approve or reject. */
export const OPEN_PLAN_STATUSES: PlanStatus[] = [PlanStatus.DRAFT, PlanStatus.NEEDS_APPROVAL];

export function dayRange(runDate: string | Date) {
  const start = new Date(typeof runDate === 'string' ? `${runDate.slice(0, 10)}T00:00:00.000Z` : runDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end, iso: start.toISOString().slice(0, 10) };
}

/**
 * Planning Service — the core auto-plan engine.
 *
 * Auto-plan logic (from STORY.md Peliyagoda planning picture):
 *  1. Group orders by depot, brand, district
 *  2. Check reefer capacity → if short, score orders for deferral
 *  3. Move dry Fresh off reefers onto dry trucks if possible
 *  4. Assign vehicles: one brand + one district per trip
 *  5. Validate window, access, fuel constraints
 *  6. Flag van_only outlets (vans only)
 *  7. Return a plan draft with suggested deferrals — a human dispatcher approves it
 */
@Injectable()
export class PlanningService {
  constructor(
    private prisma: PrismaService,
    private deferralScoring: DeferralScoringService,
    private capacity: CapacityService,
  ) {}

  /** DSP-01: the plan board for a depot and run date. */
  async getPlan(depot: Depot, runDate: string) {
    const { start: startOf, end: endOf, iso } = dayRange(runDate);

    const [trips, orders, reefer, demand, vehiclesInWorkshop] = await Promise.all([
      this.prisma.trip.findMany({
        where: { depot, runDate: { gte: startOf, lt: endOf } },
        include: {
          vehicle: true,
          driver: { select: { id: true, name: true } },
          stops: { include: { outlet: true, order: true, pod: true }, orderBy: { stopSeq: 'asc' } },
          loadRecord: true,
        },
        orderBy: [{ brand: 'asc' }, { district: 'asc' }],
      }),
      this.prisma.order.findMany({
        where: {
          runDate: { gte: startOf, lt: endOf },
          outlet: { depot },
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION, OrderStatus.CANCELLED] },
        },
        include: { outlet: true, deferralLog: true },
      }),
      this.capacity.getReeferCapacity(depot),
      this.capacity.getChilledDemand(depot, startOf),
      this.prisma.vehicle.count({ where: { depot, status: 'WORKSHOP' } }),
    ]);

    const chilledShortM3 = Math.max(0, demand.m3 - reefer.totalM3);

    const summary = {
      depot,
      runDate: iso,
      planVersion: trips[0]?.planVersion ?? 1,
      orders: {
        total: orders.length,
        planned: orders.filter((o) => o.status === OrderStatus.PLANNED).length,
        deferred: orders.filter((o) => o.status === OrderStatus.DEFERRED).length,
        needsReview: orders.filter((o) => o.status === OrderStatus.RECEIVED).length,
      },
      chilled: { demand: demand.m3, capacity: reefer.totalM3, shortM3: chilledShortM3 },
      trips: trips.length,
      vehiclesInWorkshop,
    };

    // Compute deferral scores for unplanned chilled orders
    const scoredOrders = orders.map((o) => {
      const computedScore = this.deferralScoring.computeScore({
        deferredYesterday: o.deferredYesterday,
        daysSince: o.daysSince,
        tempClass: o.tempClass,
        brand: o.brand,
        windowOpen: o.outlet.windowOpen,
        nextRunWithin24h: false,
      });
      return {
        ...o,
        computedScore,
        isProtected: o.deferredYesterday || this.deferralScoring.isProtected(o.deferralScore ?? computedScore),
      };
    });

    return { summary, trips, orders: scoredOrders };
  }

  /** Suggested deferrals for a run: lowest scores first until the chilled shortfall is covered. */
  async suggestDeferrals(depot: Depot, runDate: string) {
    const { summary, orders } = await this.getPlan(depot, runDate);
    const suggestions: { orderId: string; reason: DeferralReason; score: number; notes: string }[] = [];

    if (summary.chilled.shortM3 > 0) {
      // Sort unprotected chilled orders by score ascending (lowest score = best to defer)
      const chilledOrders = orders
        .filter((o) => o.tempClass === TempClass.CHILLED && !o.isProtected)
        .sort((a, b) => a.computedScore - b.computedScore);

      let remainingShort = summary.chilled.shortM3;
      for (const o of chilledOrders) {
        if (remainingShort <= 0) break;
        suggestions.push({
          orderId: o.id,
          reason: DeferralReason.CAP_REEFER,
          score: o.computedScore,
          notes: `Chilled short ${summary.chilled.shortM3.toFixed(1)} m³. days_since ${o.daysSince}, score ${o.computedScore}`,
        });
        remainingShort -= o.m3;
      }
    }
    return { summary, suggestions };
  }

  /** Next plan id and version for a depot and run date. */
  async nextPlanId(depot: Depot, runDate: string) {
    const { start, iso } = dayRange(runDate);
    const last = await this.prisma.plan.findFirst({
      where: { depot, runDate: start },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;
    return { id: `${PLAN_PREFIX[depot]}-${iso}-v${version}`, version, runDate: start };
  }

  /**
   * Auto-plan: computes the capacity picture and deferral suggestions, and
   * stores them as a new plan version awaiting a dispatcher's approval.
   */
  async runAutoPlan(depot: Depot, runDate: string, requestedBy: string) {
    const { summary, suggestions } = await this.suggestDeferrals(depot, runDate);
    const next = await this.nextPlanId(depot, runDate);

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          id: next.id,
          depot,
          runDate: next.runDate,
          version: next.version,
          status: PlanStatus.NEEDS_APPROVAL,
          source: PlanSource.AUTOPLAN,
          summary: { ...summary, suggestions } as unknown as Prisma.InputJsonValue,
          createdBy: requestedBy,
        },
      });
      for (const s of suggestions) {
        // Never overwrite a deferral a dispatcher already decided on.
        await tx.deferralLog.upsert({
          where: { orderId: s.orderId },
          update: {},
          create: {
            orderId: s.orderId,
            reason: s.reason,
            score: s.score,
            notes: s.notes,
            status: DeferralStatus.SUGGESTED,
            planId: plan.id,
          },
        });
      }
      return plan;
    });
  }

  /**
   * Turns an approved planning-agent run into a plan version. The agent only
   * drafts; this row is what a dispatcher's approval then publishes.
   */
  async createAgentPlan(run: { id: string; depot: Depot; runDate: Date }, snapshot: Record<string, any>, createdBy: string) {
    const next = await this.nextPlanId(run.depot, run.runDate.toISOString());
    const explanation = snapshot.explanation;
    return this.prisma.plan.create({
      data: {
        id: next.id,
        depot: run.depot,
        runDate: next.runDate,
        version: next.version,
        status: PlanStatus.NEEDS_APPROVAL,
        source: PlanSource.AGENT,
        agentRunId: run.id,
        createdBy,
        explanation: explanation === undefined ? null : typeof explanation === 'string' ? explanation : JSON.stringify(explanation),
        summary: {
          plan: snapshot.plan ?? null,
          contextSummary: snapshot.contextSummary ?? null,
          ruleChecks: snapshot.ruleChecks ?? null,
          violations: snapshot.violations ?? null,
          deferrals: snapshot.deferrals ?? null,
          needsReview: snapshot.needsReview ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  }

  /** Publishes a plan (dispatcher only). Earlier published versions become SUPERSEDED. */
  async approvePlan(planId: string, approvedBy: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) throw ODataError.notFound(`Plan ${planId} was not found`);
      if (!OPEN_PLAN_STATUSES.includes(plan.status)) {
        throw ODataError.conflict(`Plan ${planId} is ${plan.status} and cannot be approved`);
      }
      await tx.plan.updateMany({
        where: { depot: plan.depot, runDate: plan.runDate, status: PlanStatus.PUBLISHED, id: { not: plan.id } },
        data: { status: PlanStatus.SUPERSEDED },
      });
      const now = new Date();
      return tx.plan.update({
        where: { id: plan.id },
        data: {
          status: PlanStatus.PUBLISHED,
          approvedBy,
          approvedAt: now,
          publishedAt: now,
          ...(note ? { notes: note } : {}),
        },
      });
    });
  }

  async rejectPlan(planId: string, reason?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !OPEN_PLAN_STATUSES.includes(plan.status)) {
      throw ODataError.conflict(`Plan ${planId} cannot be rejected`);
    }
    return this.prisma.plan.update({
      where: { id: planId },
      data: { status: PlanStatus.REJECTED, ...(reason ? { notes: reason } : {}) },
    });
  }

  /** Scores an order for deferral; protected orders are never deferred. */
  async scoreOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { outlet: true } });
    if (!order) throw ODataError.notFound(`Order ${orderId} was not found`);
    const score =
      order.deferralScore ??
      this.deferralScoring.computeScore({
        deferredYesterday: order.deferredYesterday,
        daysSince: order.daysSince,
        tempClass: order.tempClass,
        brand: order.brand,
        windowOpen: order.outlet.windowOpen,
        nextRunWithin24h: false,
      });
    const isProtected = order.deferredYesterday || this.deferralScoring.isProtected(score);
    return { order, score, isProtected };
  }

  /** Confirm a deferral suggestion: the order is deferred to its rescheduled date. */
  async confirmDeferral(deferralId: string, resolvedBy: string, notes?: string, rescheduledDate?: string) {
    return this.prisma.$transaction(async (tx) => {
      const deferral = await tx.deferralLog.findUnique({ where: { id: deferralId } });
      if (!deferral) throw ODataError.notFound(`Deferral ${deferralId} was not found`);
      if (deferral.status !== DeferralStatus.SUGGESTED) {
        throw ODataError.conflict(`Deferral ${deferralId} is ${deferral.status}`);
      }
      await tx.order.update({ where: { id: deferral.orderId }, data: { status: OrderStatus.DEFERRED } });
      return tx.deferralLog.update({
        where: { id: deferralId },
        data: {
          status: DeferralStatus.CONFIRMED,
          confirmedAt: new Date(),
          resolvedBy,
          ...(notes ? { notes } : {}),
          ...(rescheduledDate ? { rescheduledDate: new Date(`${rescheduledDate}T00:00:00.000Z`) } : {}),
        },
      });
    });
  }

  async dismissDeferral(deferralId: string, resolvedBy: string) {
    return this.prisma.deferralLog.update({
      where: { id: deferralId },
      data: { status: DeferralStatus.DISMISSED, resolvedBy },
    });
  }

  /** Reverse a deferral (field evidence wins): the order goes back into the plan. */
  async reverseDeferral(deferralId: string, resolvedBy: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const deferral = await tx.deferralLog.update({
        where: { id: deferralId },
        data: { status: DeferralStatus.REVERSED, resolvedBy, ...(notes ? { notes } : {}) },
      });
      await tx.order.update({ where: { id: deferral.orderId }, data: { status: OrderStatus.PLANNED } });
      return deferral;
    });
  }

  async getCapacityOutlook(depot: Depot) {
    return this.capacity.getCapacityOutlook(depot);
  }
}
