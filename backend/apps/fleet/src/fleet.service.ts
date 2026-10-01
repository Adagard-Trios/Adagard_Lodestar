import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Prisma, VehicleStatus } from '@prisma/client';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  async updateStatus(id: string, status: VehicleStatus, workshopNote?: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        status,
        // Leaving the workshop clears the note; entering it may set one.
        ...(workshopNote ? { workshopNote } : status !== VehicleStatus.WORKSHOP ? { workshopNote: null } : {}),
      },
    });
  }

  async updateFuelUsage(id: string, litresUsed: number) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { usedLThisWeek: { increment: Math.round(litresUsed) } },
    });
  }

  /** Fleet board summary: counts by depot and status, within the caller's scope. */
  async getSummary(scope?: Prisma.VehicleWhereInput) {
    const where = scope ?? {};
    const [total, byDepot, workshop, enroute] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.groupBy({ by: ['depot', 'tempClass'], where, _count: { id: true } }),
      this.prisma.vehicle.count({ where: { AND: [where, { status: VehicleStatus.WORKSHOP }] } }),
      this.prisma.vehicle.count({ where: { AND: [where, { status: VehicleStatus.ENROUTE }] } }),
    ]);
    return {
      total,
      byDepot: byDepot.map((g) => ({ depot: g.depot, tempClass: g.tempClass, count: g._count.id })),
      workshop,
      enroute,
      available: total - workshop - enroute,
    };
  }
}
