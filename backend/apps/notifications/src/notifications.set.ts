import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataAction, ODataEntitySet, ODataError, OperationContext } from '@lodestar/odata';
import { canAccessDepot, HUMAN_ROLES, isPrivileged, Roles } from '@lodestar/security';
import { NotificationsService } from './notifications.service';

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

  /** POST Notifications('…')/Lodestar.MarkRead */
  @ODataAction({ name: 'MarkRead', binding: 'entity', roles: HUMAN_ROLES, returns: 'Lodestar.Notification' })
  markRead(ctx: OperationContext) {
    return ctx.entity.readAt ? ctx.entity : this.notifications.markRead(ctx.entity.id);
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
      depot: 'Lodestar.Depot',
      outletId: 'Edm.String',
      creditNoteId: 'Edm.String',
    },
    returns: 'Lodestar.Notification',
  })
  async send(ctx: OperationContext) {
    const recipient = await this.prisma.user.findUnique({ where: { id: ctx.params.recipientId }, select: { id: true, depot: true } });
    if (!recipient) throw ODataError.badRequest('Unknown recipient', 'recipientId');
    // A dispatcher notifies people and depot rooms of their own depots only.
    const p = ctx.principal;
    if (!isPrivileged(p)) {
      if (!canAccessDepot(p, recipient.depot)) throw ODataError.forbidden('The recipient is outside your depots', 'recipientId');
      if (ctx.params.depot && !canAccessDepot(p, ctx.params.depot)) throw ODataError.forbidden('Not your depot', 'depot');
    }
    if (!/^[A-Z][A-Z_]{2,40}$/.test(ctx.params.type)) throw ODataError.badRequest('type must be an UPPER_SNAKE_CASE code', 'type');
    return this.notifications.send(ctx.params as any);
  }
}
