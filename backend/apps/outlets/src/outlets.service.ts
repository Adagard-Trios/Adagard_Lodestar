import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Brand, Depot, DockType, ParkingType } from '@prisma/client';

@Injectable()
export class OutletsService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { brand?: Brand; depot?: Depot; district?: string; dockType?: DockType; parking?: ParkingType; search?: string }) {
    const { brand, depot, district, dockType, parking, search } = params;
    return this.prisma.outlet.findMany({
      where: {
        ...(brand    ? { brand }    : {}),
        ...(depot    ? { depot }    : {}),
        ...(district ? { district } : {}),
        ...(dockType ? { dockType } : {}),
        ...(parking  ? { parking }  : {}),
        ...(search   ? { name: { contains: search, mode: 'insensitive' } } : {}),
        isActive: true,
      },
      include: { users: { select: { id: true, name: true, role: true } } },
      orderBy: [{ depot: 'asc' }, { district: 'asc' }, { brand: 'asc' }, { id: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.outlet.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, role: true } },
        orders: {
          where: { runDate: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
          orderBy: { runDate: 'desc' },
          take: 20,
        },
      },
    });
  }

  /** Check if current time is within a delivery window */
  isWindowOpen(outlet: { windowOpen: string; windowClose: string }): boolean {
    const now = new Date();
    const [oh, om] = outlet.windowOpen.split(':').map(Number);
    const [ch, cm] = outlet.windowClose.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= oh * 60 + om && nowMin <= ch * 60 + cm;
  }
}
