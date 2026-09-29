import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Depot, VehicleStatus, TempClass } from '@prisma/client';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  async findAll(depot?: Depot, status?: VehicleStatus, tempClass?: TempClass) {
    return this.prisma.vehicle.findMany({
      where: {
        ...(depot     ? { depot }     : {}),
        ...(status    ? { status }    : {}),
        ...(tempClass ? { tempClass } : {}),
      },
      include: {
        trips: {
          where: { status: { in: ['PLANNED', 'LOADING', 'ENROUTE'] } },
          select: { id: true, status: true, brand: true, district: true, bay: true, runDate: true },
        },
      },
      orderBy: [{ depot: 'asc' }, { tempClass: 'desc' }, { id: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { trips: { orderBy: { runDate: 'desc' }, take: 10 }, loadRecords: { take: 5 } },
    });
  }

  async updateStatus(id: string, status: VehicleStatus, workshopNote?: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { status, ...(workshopNote ? { workshopNote } : {}) },
    });
  }

  async updateFuelUsage(id: string, litresUsed: number) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { usedLThisWeek: { increment: litresUsed } },
    });
  }

  /** Fleet board summary: counts by depot and status */
  async getSummary() {
    const [total, byDepot, workshop, enroute] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.groupBy({ by: ['depot', 'tempClass'], _count: { id: true } }),
      this.prisma.vehicle.count({ where: { status: VehicleStatus.WORKSHOP } }),
      this.prisma.vehicle.count({ where: { status: VehicleStatus.ENROUTE } }),
    ]);
    return { total, byDepot, workshop, enroute, available: total - workshop - enroute };
  }
}
