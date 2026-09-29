import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';

@Injectable()
export class LoadRecordService {
  constructor(private prisma: PrismaService) {}

  async create(data: { tripId: string; vehicleId: string; loaderId: string; bay: string; reeferTempC?: number; shortfalls?: any[] }) {
    return this.prisma.loadRecord.upsert({
      where: { tripId: data.tripId },
      update: {},
      create: { ...data, loadedAt: new Date() },
    });
  }

  async release(tripId: string, sealNumber: string) {
    return this.prisma.loadRecord.update({
      where: { tripId },
      data: { sealNumber, releasedAt: new Date() },
    });
  }

  async updateShortfalls(tripId: string, shortfalls: any[]) {
    return this.prisma.loadRecord.update({ where: { tripId }, data: { shortfalls } });
  }
}
