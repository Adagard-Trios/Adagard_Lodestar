import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';

/**
 * Offline Sync Service — handles Driver app reconnect batch sync.
 *
 * Hero scenario (Degradation A):
 *   - Signal lost 4:38 AM above Ramboda
 *   - 7 records queued on device (2 arrivals, 3 PODs, 2 photos)
 *   - Signal back 8:40 AM near Pussellawa
 *   - Conflict: provisional deferral of OUT108 must be reversed
 *   - Rule: "field evidence wins"
 */
@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  /** Receive a batch of offline events from the driver device */
  async pushBatch(events: Array<{
    driverId: string;
    tripId: string;
    eventType: string;
    payload: any;
    savedAt: string;
  }>) {
    const results: any[] = [];

    for (const evt of events) {
      const saved = await this.prisma.offlineEvent.create({
        data: {
          driverId: evt.driverId,
          tripId:   evt.tripId,
          eventType: evt.eventType,
          payload:   evt.payload,
          savedAt:   new Date(evt.savedAt),
          syncedAt:  new Date(),
        },
      });

      // Apply each event to the live DB
      const conflict = await this.applyEvent(evt);
      if (conflict) {
        await this.prisma.offlineEvent.update({
          where: { id: saved.id },
          data: { conflictResolved: true, conflictNote: conflict },
        });
      }
      results.push({ id: saved.id, eventType: evt.eventType, conflict });
    }

    return {
      synced: results.length,
      conflicts: results.filter(r => r.conflict).length,
      results,
    };
  }

  private async applyEvent(evt: { driverId: string; tripId: string; eventType: string; payload: any }) {
    switch (evt.eventType) {
      case 'ARRIVAL': {
        const stop = await this.prisma.tripStop.findFirst({
          where: { tripId: evt.tripId, stopSeq: evt.payload.stopSeq },
        });
        if (stop) {
          await this.prisma.tripStop.update({
            where: { id: stop.id },
            data: { arrivalActual: new Date(evt.payload.time), status: 'ENROUTE' },
          });
        }
        return null;
      }
      case 'LEAVE': {
        const stop = await this.prisma.tripStop.findFirst({
          where: { tripId: evt.tripId, stopSeq: evt.payload.stopSeq },
        });
        if (stop) {
          await this.prisma.tripStop.update({
            where: { id: stop.id },
            data: { leaveActual: new Date(evt.payload.time), status: 'DELIVERED' },
          });
        }
        return null;
      }
      case 'POD_SAVE': {
        const stop = await this.prisma.tripStop.findFirst({
          where: { orderId: evt.payload.orderId },
        });
        if (!stop) return null;

        // Check for conflict: was there a provisional deferral for this order?
        const deferral = await this.prisma.deferralLog.findUnique({
          where: { orderId: evt.payload.orderId },
        });

        await this.prisma.pOD.upsert({
          where: { tripStopId: stop.id },
          update: { unitsDelivered: evt.payload.units, syncedAt: new Date() },
          create: {
            tripStopId:    stop.id,
            unitsDelivered: evt.payload.units,
            unitsOrdered:  evt.payload.unitsOrdered ?? evt.payload.units,
            savedOffline:  true,
            savedAt:       new Date(evt.payload.savedAt ?? Date.now()),
            syncedAt:      new Date(),
          },
        });

        await this.prisma.tripStop.update({
          where: { id: stop.id },
          data: { status: 'DELIVERED', leaveActual: new Date() },
        });
        await this.prisma.order.update({
          where: { id: evt.payload.orderId },
          data: { status: 'DELIVERED' },
        });

        if (deferral?.isProvisional) {
          // Reverse provisional deferral — field evidence wins
          await this.prisma.deferralLog.delete({ where: { orderId: evt.payload.orderId } });
          return 'Provisional deferral reversed — field evidence wins; delivery confirmed offline';
        }
        return null;
      }
      default:
        return null;
    }
  }

  async getSyncStatus(tripId: string) {
    const events = await this.prisma.offlineEvent.findMany({
      where: { tripId },
      orderBy: { savedAt: 'asc' },
    });
    const unsynced = events.filter(e => !e.syncedAt);
    return {
      total: events.length,
      synced: events.filter(e => e.syncedAt).length,
      pending: unsynced.length,
      conflicts: events.filter(e => e.conflictResolved).length,
      lastSyncedAt: events.filter(e => e.syncedAt).at(-1)?.syncedAt ?? null,
    };
  }
}
