import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { TripStatus, OrderStatus, Depot } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { depot?: Depot; driverId?: string; runDate?: string; status?: TripStatus }) {
    const { depot, driverId, runDate, status } = params;
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf   = new Date(new Date(date).setDate(date.getDate() + 1));

    return this.prisma.trip.findMany({
      where: {
        runDate: { gte: startOf, lt: endOf },
        ...(depot    ? { depot }    : {}),
        ...(driverId ? { driverId } : {}),
        ...(status   ? { status }   : {}),
      },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true } },
        stops: {
          include: {
            outlet: true,
            order: { select: { id: true, units: true, kg: true, m3: true, tempClass: true, status: true } },
            pod: true,
          },
          orderBy: { stopSeq: 'asc' },
        },
        loadRecord: { include: { loader: { select: { id: true, name: true } } } },
      },
      orderBy: [{ brand: 'asc' }, { district: 'asc' }, { tripNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true } },
        stops: {
          include: { outlet: true, order: { include: { lineItems: true } }, pod: true },
          orderBy: { stopSeq: 'asc' },
        },
        loadRecord: { include: { loader: { select: { id: true, name: true } } } },
        offlineEvents: { orderBy: { savedAt: 'asc' } },
      },
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);

    // Compute totals
    const totalKg = trip.stops.reduce((s, st) => s + (st.order?.kg ?? 0), 0);
    const totalM3 = trip.stops.reduce((s, st) => s + (st.order?.m3 ?? 0), 0);
    const loadPct = trip.vehicle ? Math.round((totalKg / trip.vehicle.capacityKg) * 100) : 0;

    return { ...trip, totalKg, totalM3, loadPct };
  }

  /** Driver: get active trip for today */
  async getDriverTrip(driverId: string, runDate?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf   = new Date(new Date(date).setDate(date.getDate() + 1));

    const trip = await this.prisma.trip.findFirst({
      where: { driverId, runDate: { gte: startOf, lt: endOf } },
      include: {
        vehicle: true,
        stops: {
          include: { outlet: true, order: { include: { lineItems: true } }, pod: true },
          orderBy: { stopSeq: 'asc' },
        },
      },
    });
    if (!trip) return null;

    const totalKg = trip.stops.reduce((s, st) => s + (st.order?.kg ?? 0), 0);
    const totalM3 = trip.stops.reduce((s, st) => s + (st.order?.m3 ?? 0), 0);
    return { ...trip, totalKg, totalM3 };
  }

  /** Loader: get trips for a bay (by depot, runDate) */
  async getBayQueue(depot: Depot, runDate?: string) {
    const date = runDate ? new Date(runDate) : new Date('2026-04-07');
    const startOf = new Date(date.toDateString());
    const endOf   = new Date(new Date(date).setDate(date.getDate() + 1));

    return this.prisma.trip.findMany({
      where: { depot, runDate: { gte: startOf, lt: endOf } },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true } },
        stops: { select: { stopSeq: true, outletId: true, status: true, etaModel: true } },
        loadRecord: true,
      },
      orderBy: [{ bay: 'asc' }, { departTime: 'asc' }],
    });
  }

  async updateStatus(id: string, status: TripStatus, departTime?: Date) {
    return this.prisma.trip.update({
      where: { id },
      data: { status, ...(departTime ? { departTime } : {}) },
    });
  }

  async updateStopStatus(stopId: string, status: OrderStatus, arrivalActual?: Date, leaveActual?: Date) {
    return this.prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status,
        ...(arrivalActual ? { arrivalActual } : {}),
        ...(leaveActual   ? { leaveActual }   : {}),
      },
    });
  }

  async savePOD(stopId: string, data: {
    unitsDelivered: number;
    unitsOrdered: number;
    photoUrl?: string;
    receiverName?: string;
    signature?: string;
    exceptions?: any[];
    creditNoteId?: string;
    savedOffline?: boolean;
  }) {
    return this.prisma.pOD.upsert({
      where: { tripStopId: stopId },
      update: { ...data, syncedAt: data.savedOffline ? undefined : new Date() },
      create: { tripStopId: stopId, ...data, savedAt: new Date() },
    });
  }

  /** Blackout: update late risk for a stop (DSP-A1) */
  async updateLateRisk(stopId: string, lateRiskPct: number) {
    return this.prisma.tripStop.update({ where: { id: stopId }, data: { lateRiskPct } });
  }
}
