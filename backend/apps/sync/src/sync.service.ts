import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { isPrivileged, Principal } from '@lodestar/security';
import { DeferralStatus, OrderStatus, Prisma } from '@prisma/client';

export const EVENT_TYPES = ['ARRIVAL', 'LEAVE', 'POD_SAVE', 'PHOTO', 'STATUS_CHANGE'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface OfflineEventInput {
  /** Client-generated id; makes replays idempotent (a retried batch is not applied twice). */
  id?: string;
  tripId?: string;
  eventType: EventType;
  payload: any;
  savedAt: string;
}

export interface EventResult {
  id?: string;
  eventType: string;
  status: 'APPLIED' | 'DUPLICATE' | 'REJECTED';
  conflict?: string | null;
  reason?: string;
}

const MAX_BATCH = 200;

/**
 * Offline Sync Service — handles Driver app reconnect batch sync.
 *
 * Hero scenario (Degradation A):
 *   - Signal lost 4:38 AM above Ramboda
 *   - 7 records queued on device (2 arrivals, 3 PODs, 2 photos)
 *   - Signal back 8:40 AM near Pussellawa
 *   - Conflict: provisional deferral of OUT108 must be reversed
 *   - Rule: "field evidence wins"
 *
 * Zero trust: the driver is the token subject (never a body field) and every
 * event must belong to a trip of the vehicle in the driver's token.
 */
@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  validate(raw: unknown[]): OfflineEventInput[] {
    if (raw.length > MAX_BATCH) throw ODataError.badRequest(`A batch holds at most ${MAX_BATCH} events`, 'events');
    return raw.map((e: any, i) => {
      if (!e || typeof e !== 'object') throw ODataError.badRequest(`events[${i}] must be an object`, 'events');
      if (!EVENT_TYPES.includes(e.eventType)) throw ODataError.badRequest(`events[${i}].eventType must be one of ${EVENT_TYPES.join(', ')}`, 'events');
      if (typeof e.savedAt !== 'string' || Number.isNaN(Date.parse(e.savedAt))) {
        throw ODataError.badRequest(`events[${i}].savedAt must be a date-time`, 'events');
      }
      if (e.id !== undefined && (typeof e.id !== 'string' || !/^[\w-]{8,64}$/.test(e.id))) {
        throw ODataError.badRequest(`events[${i}].id must be 8-64 letters, digits, - or _`, 'events');
      }
      const payload = e.payload ?? {};
      const bad = (what: string) => ODataError.badRequest(`events[${i}].payload.${what}`, 'events');
      if ((e.eventType === 'ARRIVAL' || e.eventType === 'LEAVE') && !Number.isInteger(payload.stopSeq)) throw bad('stopSeq must be an integer');
      if (e.eventType === 'POD_SAVE') {
        if (typeof payload.orderId !== 'string' || !payload.orderId) throw bad('orderId is required');
        if (!Number.isInteger(payload.units) || payload.units < 0) throw bad('units must be a non-negative integer');
        if (payload.unitsOrdered !== undefined && (!Number.isInteger(payload.unitsOrdered) || payload.units > payload.unitsOrdered)) {
          throw bad('units cannot exceed unitsOrdered');
        }
      }
      return { id: e.id, tripId: e.tripId, eventType: e.eventType, payload, savedAt: e.savedAt };
    });
  }

  /** Receive a batch of offline events from the driver device (in saved order). */
  async pushBatch(principal: Principal, events: OfflineEventInput[]) {
    const results: EventResult[] = [];
    const sorted = [...events].sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));

    for (const evt of sorted) {
      if (evt.id && (await this.prisma.offlineEvent.findUnique({ where: { id: evt.id }, select: { id: true } }))) {
        results.push({ id: evt.id, eventType: evt.eventType, status: 'DUPLICATE' });
        continue;
      }
      const denied = await this.checkTrip(principal, evt.tripId);
      if (denied) {
        results.push({ id: evt.id, eventType: evt.eventType, status: 'REJECTED', reason: denied });
        continue;
      }

      // Apply first, then record: if applying fails the event is not stored,
      // so the device's retry is applied instead of being skipped as a duplicate.
      // Applying is idempotent (updates and upserts), so a retry after a
      // failed record is safe too.
      const conflict = await this.applyEvent(evt);
      const saved = await this.prisma.offlineEvent.create({
        data: {
          ...(evt.id ? { id: evt.id } : {}),
          driverId: principal.sub,
          tripId: evt.tripId,
          eventType: evt.eventType,
          payload: evt.payload as Prisma.InputJsonValue,
          savedAt: new Date(evt.savedAt),
          syncedAt: new Date(),
          ...(conflict ? { conflictResolved: true, conflictNote: conflict } : {}),
        },
      });
      results.push({ id: saved.id, eventType: evt.eventType, status: 'APPLIED', conflict });
    }

    return {
      synced: results.filter((r) => r.status === 'APPLIED').length,
      duplicates: results.filter((r) => r.status === 'DUPLICATE').length,
      rejected: results.filter((r) => r.status === 'REJECTED').length,
      conflicts: results.filter((r) => r.conflict).length,
      results,
    };
  }

  /** A driver may only report events for trips of the vehicle in their token. */
  private async checkTrip(principal: Principal, tripId?: string): Promise<string | undefined> {
    if (!tripId) return 'tripId is required';
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { vehicleId: true } });
    if (!trip) return 'Unknown trip';
    if (!isPrivileged(principal) && trip.vehicleId !== principal.vehicleId) return 'Trip is not assigned to your vehicle';
    return undefined;
  }

  private async applyEvent(evt: OfflineEventInput): Promise<string | null> {
    switch (evt.eventType) {
      case 'ARRIVAL': {
        const stop = await this.prisma.tripStop.findFirst({
          where: { tripId: evt.tripId, stopSeq: evt.payload.stopSeq },
        });
        if (stop) {
          await this.prisma.tripStop.update({
            where: { id: stop.id },
            data: { arrivalActual: new Date(evt.payload.time ?? evt.savedAt), status: OrderStatus.ENROUTE },
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
            data: { leaveActual: new Date(evt.payload.time ?? evt.savedAt), status: OrderStatus.DELIVERED },
          });
        }
        return null;
      }
      case 'POD_SAVE': {
        // The stop must be on the event's trip (not just any stop for the order).
        const stop = await this.prisma.tripStop.findFirst({
          where: { orderId: evt.payload.orderId, tripId: evt.tripId },
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
            tripStopId: stop.id,
            unitsDelivered: evt.payload.units,
            unitsOrdered: evt.payload.unitsOrdered ?? evt.payload.units,
            savedOffline: true,
            savedAt: new Date(evt.payload.savedAt ?? evt.savedAt),
            syncedAt: new Date(),
          },
        });

        await this.prisma.tripStop.update({
          where: { id: stop.id },
          data: { status: OrderStatus.DELIVERED, leaveActual: stop.leaveActual ?? new Date(evt.savedAt) },
        });
        await this.prisma.order.update({
          where: { id: evt.payload.orderId },
          data: { status: OrderStatus.DELIVERED },
        });

        if (deferral?.isProvisional && deferral.status !== DeferralStatus.REVERSED) {
          // Reverse provisional deferral — field evidence wins (records are never deleted)
          await this.prisma.deferralLog.update({
            where: { orderId: evt.payload.orderId },
            data: { status: DeferralStatus.REVERSED, notes: 'Reversed by offline sync: delivery confirmed in the field' },
          });
          return 'Provisional deferral reversed — field evidence wins; delivery confirmed offline';
        }
        return null;
      }
      default:
        return null;
    }
  }

  async getSyncStatus(tripId: string, scope?: Prisma.OfflineEventWhereInput) {
    const events = await this.prisma.offlineEvent.findMany({
      where: { AND: [{ tripId }, scope ?? {}] },
      orderBy: { savedAt: 'asc' },
    });
    const synced = events.filter((e) => e.syncedAt);
    return {
      total: events.length,
      synced: synced.length,
      pending: events.length - synced.length,
      conflicts: events.filter((e) => e.conflictResolved).length,
      lastSyncedAt: synced.at(-1)?.syncedAt ?? null,
    };
  }
}
