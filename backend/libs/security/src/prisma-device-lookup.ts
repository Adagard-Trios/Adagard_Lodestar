import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { DeviceLookup, DeviceRecord } from './device-posture.service';

/** DeviceLookup backed by the Device table owned by the auth service. */
@Injectable()
export class PrismaDeviceLookup implements DeviceLookup {
  constructor(private readonly prisma: PrismaService) {}

  findDevice(id: string): Promise<DeviceRecord | null> {
    return this.prisma.device.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
  }
}
