import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { Depot, OrderStatus, Prisma, TripStatus } from '@prisma/client';
import { runDateRange } from '@lodestar/platform';
import { NOTIFY, NotifyClient } from '@lodestar/security';
import { FleetClient } from './fleet.client';

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

/** Used when the travel table has no distance (same constants as the planning agent's trip_km). */
const DEPOT_KM_PER_MIN = 0.6;
const INTER_STOP_KM_PER_MIN = 0.5;

/** Litres a trip burns: depot → district and back, plus the hops between its stops, at the vehicle's km/L. */
export function tripLitres(
  travel: { distKm: number | null; depotToDistMin: number; interStopMin: number } | null,
  stops: number,
  kmPerLitre: number,
): number {
  if (!travel || !(kmPerLitre > 0) || stops < 1) return 0;
  const km = 2 * (travel.distKm ?? travel.depotToDistMin * DEPOT_KM_PER_MIN) + travel.interStopMin * INTER_STOP_KM_PER_MIN * (stops - 1);
  return Math.round((km / kmPerLitre) * 10) / 10;
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
  constructor(
    private prisma: PrismaService,
    @Inject(NOTIFY) private notify: NotifyClient,
    private fleet: FleetClient,
  ) {}

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
    const trip = await this.prisma.trip.update({
      where: { id },
      data: {
        status,
        ...(departTime ? { departTime } : {}),
        ...(status === TripStatus.COMPLETE ? { returnTime: new Date() } : {}),
      },
    });
    if (status === TripStatus.COMPLETE && current !== TripStatus.COMPLETE) await this.consumeFuel(id);
    return trip;
  }

  /** A completed trip's fuel counts against its vehicle's weekly quota (recorded by fleet, which owns Vehicle). */
  private async consumeFuel(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { vehicleId: true, district: true, vehicle: { select: { kmPerLitre: true } }, _count: { select: { stops: true } } },
    });
    if (!trip) return;
    const travel = await this.prisma.districtTravel.findUnique({ where: { district: trip.district } });
    const litres = tripLitres(travel, trip._count.stops, trip.vehicle.kmPerLitre);
    if (litres > 0) await this.fleet.recordFuel(trip.vehicleId, litres);
  }

  /**
   * Loader releases a loaded trip: seal, reefer temperature, departure. Its stops and orders go en route,
   * and the driver, the depot and the stores on the trip are told (trip_released).
   */
  async release(tripId: string, sealNumber: string, reeferTempC?: number) {
    const released = await this.prisma.$transaction(async (tx) => {
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
      const open = { tripId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION, OrderStatus.CANCELLED] } };
      const stops = await tx.tripStop.findMany({ where: open, select: { orderId: true } });
      await tx.tripStop.updateMany({ where: open, data: { status: OrderStatus.ENROUTE } });
      await tx.order.updateMany({ where: { id: { in: stops.map((st) => st.orderId) } }, data: { status: OrderStatus.ENROUTE } });
      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.ENROUTE,
          sealNumber,
          departTime: now,
          ...(reeferTempC !== undefined ? { reeferTempC } : {}),
        },
        include: { stops: { select: { outletId: true } } },
      });
    });
    const { stops, ...trip } = released;
    const outlets = [...new Set(stops.map((st) => st.outletId))];
    const event = { tripId, vehicleId: trip.vehicleId, depot: trip.depot, bay: trip.bay, departTime: trip.departTime, sealNumber, outlets };
    if (trip.driverId) await this.notify.notice({ recipientId: trip.driverId, type: 'TRIP_RELEASED', tripId, depot: trip.depot, payload: event });
    await this.notify.publish('trip_released', [
      `trip:${tripId}`, `dispatcher:${trip.depot}`, `loader:${trip.depot}`,
      ...(trip.driverId ? [`driver:${trip.driverId}`] : []),
      ...outlets.map((o) => `store:${o}`),
    ], event);
    return trip;
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
