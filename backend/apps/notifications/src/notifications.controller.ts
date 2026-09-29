import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}
  @Get('health') health() { return { status: 'ok', service: 'notifications' }; }
  @Post('send') send(@Body() body: any) { return this.notificationsService.send(body); }
  @Get('user/:userId') getForUser(@Param('userId') userId: string, @Query('unread') unread?: string) {
    return this.notificationsService.getForUser(userId, unread === 'true');
  }
  @Patch(':id/read') markRead(@Param('id') id: string) { return this.notificationsService.markRead(id); }
}
