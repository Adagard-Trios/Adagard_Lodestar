import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationChannel } from '@prisma/client';

/**
 * Notification types from STORY.md:
 *  DEFERRAL_SUGGESTED | BLACKOUT_DETECTED | SIGNAL_BACK | POD_MATCHED |
 *  SHORTFALL_ACK | REEFER_FAIL | CREDIT_NOTE_ISSUED
 */
@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async send(params: {
    recipientId: string;
    tripId?: string;
    type: string;
    payload: any;
    depot?: string;
    outletId?: string;
    creditNoteId?: string;
  }) {
    const notif = await this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        tripId:      params.tripId,
        type:        params.type,
        channel:     NotificationChannel.WEBSOCKET,
        payload:     params.payload,
      },
    });

    // Route via WebSocket
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
        if (params.tripId && params.outletId)
          this.gateway.etaUpdate(params.tripId, params.outletId, params.payload);
        break;
      default:
        if (params.depot) this.gateway.dispatcherAlert(params.depot, params.type, params.payload);
    }

    return notif;
  }

  async getForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
