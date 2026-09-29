import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller()
export class SyncController {
  constructor(private syncService: SyncService) {}
  @Get('health') health() { return { status: 'ok', service: 'sync' }; }
  @Post('batch') pushBatch(@Body() body: { events: any[] }) { return this.syncService.pushBatch(body.events); }
  @Get('status/:tripId') status(@Param('tripId') tripId: string) { return this.syncService.getSyncStatus(tripId); }
}
