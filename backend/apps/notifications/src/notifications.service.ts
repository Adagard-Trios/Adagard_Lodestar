import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { Notification, NotificationChannel, OrderStatus, Prisma } from '@prisma/client';
import { canonicalRoom, NotificationsGateway } from './notifications.gateway';

export interface SendParams {
  recipientId: string;
  tripId?: string;
  type: string;
  payload?: any;
  depot?: string;
  outletId?: string;
  creditNoteId?: string;
}

/**
 * Notification types from STORY.md:
 *  DEFERRAL_SUGGESTED | BLACKOUT_DETECTED | SIGNAL_BACK | POD_MATCHED |
 *  SHORTFALL_ACK | REEFER_FAIL | CREDIT_NOTE_ISSUED | ETA_UPDATE
 */
@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async send(params: SendParams) {
    const notif = await this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        tripId: params.tripId,
        type: params.type,
        channel: NotificationChannel.WEBSOCKET,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Always deliver to the recipient's personal room…
    this.gateway.emit(`user:${params.recipientId}`, 'notification', notif);

    // …and route typed events to the operational rooms.
    switch (params.type) {
      case 'BLACKOUT_DETECTED':
      case 'SIGNAL_BACK': {
        // The depot's dispatchers, and the stores still waiting on the trip (SM-A1 "in progress, low signal").
        const stores = await this.waitingStores(params.tripId);
        if (params.depot || stores.length) {
          if (params.type === 'BLACKOUT_DETECTED') this.gateway.blackout(params.depot, params.payload, stores);
          else this.gateway.blackoutResolved(params.depot, params.payload, stores);
        }
        break;
      }
      case 'CREDIT_NOTE_ISSUED':
        if (params.outletId && params.creditNoteId)
          this.gateway.creditNoteIssued(params.outletId, params.creditNoteId, params.payload);
        break;
      case 'ETA_UPDATE':
        if (params.tripId && params.outletId) this.gateway.etaUpdate(params.tripId, params.outletId, params.payload);
        break;
      default:
        if (params.depot) this.gateway.dispatcherAlert(params.depot, params.type, params.payload);
    }

    return notif;
  }

  /** Realtime only (nothing stored): an operational event to rooms, e.g. plan_published to dispatcher:KANDY. */
  publish(event: string, rooms: string[], payload: unknown) {
    for (const room of new Set(rooms)) this.gateway.emit(canonicalRoom(room), event, payload);
    return { event, rooms: [...new Set(rooms)].map(canonicalRoom) };
  }

  /**
   * A dispatcher handled a dock flag (DSP-13): the loader who flagged it gets SHORTFALL_ACK (LD-03
   * "Acknowledged by …", LD-13), and the depot's loaders and the trip's room get shortfall_ack.
   */
  async acknowledgeShortfall(flag: Notification, by: { sub: string; name?: string }) {
    const p = (flag.payload ?? {}) as Record<string, any>;
    const tripId = flag.tripId ?? (typeof p.tripId === 'string' ? p.tripId : undefined);
    const ack = {
      tripId: tripId ?? null, item: p.item ?? null, orderId: p.orderId ?? null, outletId: p.outletId ?? null, vehicleId: p.vehicleId ?? null,
      by: by.name ?? null, byId: by.sub, at: new Date().toISOString(),
    };
    // Every dispatcher of the depot got their own copy of the flag: one acknowledgement handles it for all.
    const siblings = await this.resolveSiblingFlags(flag);
    if (typeof p.loaderId === 'string' && p.loaderId) {
      await this.send({ recipientId: p.loaderId, type: 'SHORTFALL_ACK', ...(tripId ? { tripId } : {}), payload: ack });
    }
    const rooms = [
      ...(typeof p.depot === 'string' ? [`loader:${p.depot}`, `dispatcher:${p.depot}`] : []),
      ...(tripId ? [`trip:${tripId}`] : []),
      ...siblings.recipients.map((r) => `user:${r}`),
    ];
    if (rooms.length) this.publish('shortfall_ack', rooms, { ...ack, flagIds: [flag.id, ...siblings.ids] });
  }

  /**
   * The other dispatchers' unread copies of the same dock flag (same trip, item, order and quantities) are
   * marked read, so the flag leaves every DSP-13 inbox. Store and driver copies are information and stay.
   * Returns the copies resolved and their dispatchers.
   */
  private async resolveSiblingFlags(flag: Notification): Promise<{ ids: string[]; recipients: string[] }> {
    const p = (flag.payload ?? {}) as Record<string, any>;
    const candidates = await this.prisma.notification.findMany({
      where: { type: 'SHORTFALL_FLAGGED', tripId: flag.tripId, readAt: null, id: { not: flag.id }, recipient: { role: 'DISPATCHER' } },
      select: { id: true, recipientId: true, payload: true },
    });
    const same = (q: Record<string, any>) =>
      (['item', 'orderId', 'qtyOrdered', 'qtyLoaded', 'reason'] as const).every((k) => (q?.[k] ?? null) === (p[k] ?? null));
    const siblings = (candidates ?? []).filter((n) => same((n.payload ?? {}) as Record<string, any>));
    if (!siblings.length) return { ids: [], recipients: [] };
    await this.prisma.notification.updateMany({ where: { id: { in: siblings.map((n) => n.id) }, readAt: null }, data: { readAt: new Date() } });
    return { ids: siblings.map((n) => n.id), recipients: [...new Set(siblings.map((n) => n.recipientId))] };
  }

  /** Outlets of a trip's stops not delivered yet. */
  private async waitingStores(tripId?: string): Promise<string[]> {
    if (!tripId) return [];
    const stops = await this.prisma.tripStop.findMany({
      where: { tripId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } },
      select: { outletId: true },
    });
    return [...new Set(stops.map((s) => s.outletId))];
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
