import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { assertDepotCode, EntitySet, ODataAction, ODataEntitySet, ODataError, OperationContext } from '@lodestar/odata';
import { canAccessDepot, HUMAN_ROLES, isPrivileged, Roles } from '@lodestar/security';
import { NotificationsService } from './notifications.service';

/** Room names the realtime gateway uses: <kind>:<id>. */
const ROOM = /^(dispatcher|loader|store|driver|user|trip):[A-Za-z0-9_-]{1,64}$/;

/** Notifications: everyone reads only their own (admins and services see all). */
@Injectable()
@EntitySet({
  name: 'Notifications',
  model: 'Notification',
  read: [...HUMAN_ROLES, Roles.Service],
  abac: { open: '*', self: (p) => ({ recipientId: p.sub }) },
  navigation: ['trip'],
  search: ['type'],
  defaultOrderBy: 'sentAt desc',
})
export class NotificationsSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super(prisma);
  }

  /** POST Notifications('…')/Lodestar.MarkRead — a dispatcher marking a dock flag handled acknowledges it. */
  @ODataAction({ name: 'MarkRead', binding: 'entity', roles: HUMAN_ROLES, returns: 'Lodestar.Notification' })
  async markRead(ctx: OperationContext) {
    if (ctx.entity.readAt) return ctx.entity;
    const read = await this.notifications.markRead(ctx.entity.id);
    if (read.type === 'SHORTFALL_FLAGGED' && ctx.principal.roles.includes(Roles.Dispatcher)) {
      await this.notifications.acknowledgeShortfall(read, { sub: ctx.principal.sub, name: ctx.principal.name });
    }
    return read;
  }

  /** POST Notifications/Lodestar.Send {recipientId, type, payload, …} — stored and pushed over WebSocket. */
  @ODataAction({
    name: 'Send',
    binding: 'collection',
    roles: [Roles.Service, Roles.Dispatcher, Roles.Admin],
    params: {
      recipientId: { type: 'Edm.String', required: true },
      type: { type: 'Edm.String', required: true },
      payload: 'Edm.Untyped',
      tripId: 'Edm.String',
      depot: 'Edm.String',
      outletId: 'Edm.String',
      creditNoteId: 'Edm.String',
    },
    returns: 'Lodestar.Notification',
  })
  async send(ctx: OperationContext) {
    const recipient = await this.prisma.user.findUnique({ where: { id: ctx.params.recipientId }, select: { id: true, depot: true } });
    if (!recipient) throw ODataError.badRequest('Unknown recipient', 'recipientId');
    if (ctx.params.depot !== undefined) ctx.params.depot = await assertDepotCode(this.prisma, ctx.params.depot, { active: false });
    // A dispatcher notifies people and depot rooms of their own depots only.
    const p = ctx.principal;
    if (!isPrivileged(p)) {
      if (!canAccessDepot(p, recipient.depot)) throw ODataError.forbidden('The recipient is outside your depots', 'recipientId');
      if (ctx.params.depot && !canAccessDepot(p, ctx.params.depot)) throw ODataError.forbidden('Not your depot', 'depot');
    }
    if (!/^[A-Z][A-Z_]{2,40}$/.test(ctx.params.type)) throw ODataError.badRequest('type must be an UPPER_SNAKE_CASE code', 'type');
    return this.notifications.send(ctx.params as any);
  }

  /**
   * POST Notifications/Lodestar.Publish {event, rooms, payload} — services only. Emits a realtime event the
   * clients listen for (plan_published, trip_released, shortfall_ack, …) to the given rooms; nothing is stored.
   */
  @ODataAction({
    name: 'Publish',
    binding: 'collection',
    roles: [Roles.Service],
    params: {
      event: { type: 'Edm.String', required: true },
      rooms: { type: 'Collection(Edm.String)', required: true },
      payload: 'Edm.Untyped',
    },
    returns: 'Edm.Untyped',
  })
  publish(ctx: OperationContext) {
    const event = String(ctx.params.event);
    if (!/^[a-z][a-z_]{2,40}$/.test(event)) throw ODataError.badRequest('event must be a lower_snake_case name', 'event');
    const rooms = ctx.params.rooms as unknown;
    if (!Array.isArray(rooms) || !rooms.length || rooms.length > 500 || !rooms.every(r => typeof r === 'string' && ROOM.test(r))) {
      throw ODataError.badRequest('rooms must be 1–500 room names like dispatcher:KANDY or store:OUT106', 'rooms');
    }
    return this.notifications.publish(event, rooms as string[], ctx.params.payload ?? {});
  }
}
