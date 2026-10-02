import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { Depot, OrderStatus, Prisma, TripStatus } from '@prisma/client';
import { runDateRange } from '@lodestar/platform';
import { announceStopIssue, depotDispatchers, NOTIFY, NotifyClient, podOutcome, storeManagers } from '@lodestar/security';
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

/** One dock flag on a load record (LD-03): a line loaded short. */
export interface Shortfall {
  item: string;
  qtyOrdered: number;
  qtyLoaded: number;
  reason?: string;
  orderId?: string;
}

const isShortfall = (x: unknown): x is Shortfall =>
  !!x && typeof x === 'object' && typeof (x as Shortfall).item === 'string' && Number.isFinite((x as Shortfall).qtyOrdered) && Number.isFinite((x as Shortfall).qtyLoaded);

/** Flags in `current` that are new or changed since `previous` (the loader sends the trip's whole list each time). */
export function newShortfalls(previous: unknown, current: unknown): Shortfall[] {
  const key = (s: Shortfall) => `${s.item}|${s.orderId ?? ''}|${s.qtyLoaded}|${s.reason ?? ''}`;
  const seen = new Set((Array.isArray(previous) ? previous : []).filter(isShortfall).map(key));
  return (Array.isArray(current) ? current : []).filter(isShortfall).filter((s) => s.qtyLoaded < s.qtyOrdered && !seen.has(key(s)));
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
    const stop = await this.prisma.$transaction(async (tx) => {
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
    await this.announcePod(stopId, podData);
    return stop;
  }

  /** A failed stop or a POD exception reaches the depot's dispatchers and the store (DSP-13, DSP-04, SM-21). */
  private async announcePod(stopId: string, pod: Omit<PodInput, 'arrivalActual' | 'leaveActual'>) {
    const type = podOutcome(pod);
    if (!type) return;
    const stop = await this.prisma.tripStop.findUnique({
      where: { id: stopId },
      select: { id: true, tripId: true, stopSeq: true, orderId: true, outletId: true, trip: { select: { depot: true, vehicleId: true } } },
    });
    if (!stop) return;
    const short = pod.unitsOrdered - pod.unitsDelivered;
    await announceStopIssue(this.prisma, this.notify, type, {
      tripId: stop.tripId, stopId: stop.id, stopSeq: stop.stopSeq, orderId: stop.orderId, outletId: stop.outletId, depot: stop.trip.depot, vehicleId: stop.trip.vehicleId,
    }, {
      title: type === 'STOP_FAILED' ? `${stop.outletId}: nothing delivered` : `${stop.orderId}: ${pod.unitsDelivered} of ${pod.unitsOrdered} delivered`,
      unitsDelivered: pod.unitsDelivered,
      unitsOrdered: pod.unitsOrdered,
      short,
      exceptions: Array.isArray(pod.exceptions) ? pod.exceptions : [],
      ...(pod.creditNoteId ? { creditNoteId: pod.creditNoteId } : {}),
    });
  }

  /** Blackout: update late risk for a stop (DSP-A1) */
  async updateLateRisk(stopId: string, lateRiskPct: number) {
    return this.prisma.tripStop.update({ where: { id: stopId }, data: { lateRiskPct } });
  }

  async updateShortfalls(tripId: string, shortfalls: unknown[], flaggedBy?: string) {
    const before = await this.prisma.loadRecord.findUnique({ where: { tripId }, select: { shortfalls: true } });
    const record = await this.prisma.loadRecord.update({ where: { tripId }, data: { shortfalls: shortfalls as Prisma.InputJsonValue } });
    await this.announceShortfalls(tripId, before?.shortfalls, shortfalls, flaggedBy ?? record.loaderId);
    return record;
  }

  /**
   * New or changed dock flags (LD-03 "Flag sent to dispatch, store and driver"): a SHORTFALL_FLAGGED notice to
   * the depot's dispatchers (DSP-13, where marking it handled acknowledges it), to the managers of the store
   * whose order is short, and to the trip's driver.
   */
  async announceShortfalls(tripId: string, previous: unknown, current: unknown, loaderId?: string | null) {
    const fresh = newShortfalls(previous, current);
    if (!fresh.length) return;
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { depot: true, vehicleId: true, bay: true, driverId: true, stops: { select: { orderId: true, outletId: true } } },
    });
    if (!trip) return;
    const outletOf = new Map(trip.stops.map((st) => [st.orderId, st.outletId]));
    const dispatchers = await depotDispatchers(this.prisma, trip.depot);
    const managers = await storeManagers(this.prisma, fresh.flatMap((f) => (f.orderId && outletOf.get(f.orderId)) || []));
    for (const f of fresh) {
      const outletId = f.orderId ? outletOf.get(f.orderId) : undefined;
      const payload = {
        tripId, vehicleId: trip.vehicleId, depot: trip.depot, bay: trip.bay, loaderId: loaderId ?? null,
        item: f.item, orderId: f.orderId ?? null, outletId: outletId ?? null,
        qtyOrdered: f.qtyOrdered, qtyLoaded: f.qtyLoaded, short: f.qtyOrdered - f.qtyLoaded, reason: f.reason ?? null,
        title: `Shortfall: ${f.item} ${f.qtyLoaded} of ${f.qtyOrdered}`,
      };
      const notice = { type: 'SHORTFALL_FLAGGED', tripId, payload };
      for (const recipientId of dispatchers) await this.notify.notice({ ...notice, recipientId });
      for (const m of managers.filter((x) => x.outletId === outletId)) await this.notify.notice({ ...notice, recipientId: m.id, outletId: m.outletId });
      if (trip.driverId) await this.notify.notice({ ...notice, recipientId: trip.driverId });
    }
  }
}
