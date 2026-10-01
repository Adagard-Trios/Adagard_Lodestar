import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { NotificationChannel, Prisma } from '@prisma/client';
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
        if (params.depot) this.gateway.blackout(params.depot, params.payload);
        break;
      case 'SIGNAL_BACK':
        if (params.depot) this.gateway.blackoutResolved(params.depot, params.payload);
        break;
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

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
