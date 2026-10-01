import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { Depot, OrderStatus, Prisma, TripStatus } from '@prisma/client';
import { runDateRange } from '@lodestar/platform';

/** Stored window [start, end) of a run date (YYYY-MM-DD, or a Date read in Sri Lanka time). */
export function dayRange(runDate: string | Date) {
  return runDateRange(runDate);
}

export interface PodInput {
  unitsDelivered: number;
  unitsOrdered: number;
  photoUrl?: string;
  receiverName?: string;
  signature?: string;
  exceptions?: unknown[];
  creditNoteId?: string;
  savedOffline?: boolean;
  arrivalActual?: Date;
  leaveActual?: Date;
}

/** Allowed trip status moves: planned → loading → enroute → complete. */
const NEXT_TRIP_STATUS: Record<TripStatus, TripStatus[]> = {
  PLANNED: [TripStatus.LOADING, TripStatus.ENROUTE],
  LOADING: [TripStatus.ENROUTE, TripStatus.PLANNED],
  ENROUTE: [TripStatus.COMPLETE],
  COMPLETE: [],
};

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  /** Loader: trips of a depot and run date in bay order (bay queue). */
  async getBayQueue(depot: Depot, runDate: string, scope?: Prisma.TripWhereInput) {
    const { start, end } = dayRange(runDate);
    return this.prisma.trip.findMany({
      where: { AND: [{ depot, runDate: { gte: start, lt: end } }, scope ?? {}] },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true } },
        stops: { select: { stopSeq: true, outletId: true, status: true, etaModel: true } },
        loadRecord: true,
      },
      orderBy: [{ bay: 'asc' }, { departTime: 'asc' }],
    });
  }

  async updateStatus(id: string, current: TripStatus, status: TripStatus, departTime?: Date) {
    if (current !== status && !NEXT_TRIP_STATUS[current].includes(status)) {
      throw ODataError.conflict(`A ${current} trip cannot move to ${status}`);
    }
    return this.prisma.trip.update({
      where: { id },
      data: {
        status,
        ...(departTime ? { departTime } : {}),
        ...(status === TripStatus.COMPLETE ? { returnTime: new Date() } : {}),
      },
    });
  }

  /** Loader releases a loaded trip: seal, reefer temperature, departure. */
  async release(tripId: string, sealNumber: string, reeferTempC?: number) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId }, select: { status: true } });
      if (!trip || !NEXT_TRIP_STATUS[trip.status].includes(TripStatus.ENROUTE)) {
        throw ODataError.conflict(`A ${trip?.status ?? 'missing'} trip cannot be released`);
      }
      const record = await tx.loadRecord.findUnique({ where: { tripId } });
      if (!record) throw ODataError.conflict('The trip has no load record yet; record the load first');
      const now = new Date();
      await tx.loadRecord.update({
        where: { tripId },
        data: { sealNumber, releasedAt: now, ...(reeferTempC !== undefined ? { reeferTempC } : {}) },
      });
      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.ENROUTE,
          sealNumber,
          departTime: now,
          ...(reeferTempC !== undefined ? { reeferTempC } : {}),
        },
      });
    });
  }

  async arrive(stopId: string, at: Date) {
    return this.prisma.tripStop.update({
      where: { id: stopId },
      data: { arrivalActual: at, status: OrderStatus.ENROUTE },
    });
  }

  /** Driver completes a stop: POD saved, stop and order delivered. */
  async completeStop(stopId: string, orderId: string, pod: PodInput) {
    const { arrivalActual, leaveActual, ...podData } = pod;
    if (!Number.isInteger(podData.unitsDelivered) || !Number.isInteger(podData.unitsOrdered) || podData.unitsDelivered < 0 || podData.unitsDelivered > podData.unitsOrdered) {
      throw ODataError.badRequest('unitsDelivered must be between 0 and unitsOrdered', 'unitsDelivered');
    }
    const data = { ...podData, exceptions: (podData.exceptions ?? undefined) as Prisma.InputJsonValue };
    return this.prisma.$transaction(async (tx) => {
      await tx.pOD.upsert({
        where: { tripStopId: stopId },
        update: { ...data, syncedAt: podData.savedOffline ? undefined : new Date() },
        create: { tripStopId: stopId, ...data, savedAt: new Date() },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.DELIVERED } });
      return tx.tripStop.update({
        where: { id: stopId },
        data: {
          status: OrderStatus.DELIVERED,
          ...(arrivalActual ? { arrivalActual } : {}),
          leaveActual: leaveActual ?? new Date(),
        },
      });
    });
  }

  /** Blackout: update late risk for a stop (DSP-A1) */
  async updateLateRisk(stopId: string, lateRiskPct: number) {
    return this.prisma.tripStop.update({ where: { id: stopId }, data: { lateRiskPct } });
  }

  async updateShortfalls(tripId: string, shortfalls: unknown[]) {
    return this.prisma.loadRecord.update({ where: { tripId }, data: { shortfalls: shortfalls as Prisma.InputJsonValue } });
  }
}
