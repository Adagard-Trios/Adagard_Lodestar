import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { LoadRecordService } from './load-record.service';
import { TripStatus, OrderStatus, Depot } from '@prisma/client';

@Controller()
export class TripsController {
  constructor(private tripsService: TripsService, private loadRecordService: LoadRecordService) {}

  @Get('health') health() { return { status: 'ok', service: 'trips' }; }

  @Get()
  findAll(@Query('depot') depot?: Depot, @Query('driverId') driverId?: string,
    @Query('runDate') runDate?: string, @Query('status') status?: TripStatus) {
    return this.tripsService.findAll({ depot, driverId, runDate, status });
  }

  @Get('driver/:driverId')
  getDriverTrip(@Param('driverId') driverId: string, @Query('runDate') runDate?: string) {
    return this.tripsService.getDriverTrip(driverId, runDate);
  }

  @Get('bay-queue')
  getBayQueue(@Query('depot') depot: Depot, @Query('runDate') runDate?: string) {
    return this.tripsService.getBayQueue(depot || Depot.KANDY, runDate);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.tripsService.findOne(id); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: TripStatus; departTime?: string }) {
    return this.tripsService.updateStatus(id, body.status, body.departTime ? new Date(body.departTime) : undefined);
  }

  @Patch('stops/:stopId/status')
  updateStopStatus(@Param('stopId') stopId: string, @Body() body: { status: OrderStatus; arrivalActual?: string; leaveActual?: string }) {
    return this.tripsService.updateStopStatus(stopId, body.status,
      body.arrivalActual ? new Date(body.arrivalActual) : undefined,
      body.leaveActual   ? new Date(body.leaveActual)   : undefined);
  }

  @Patch('stops/:stopId/late-risk')
  updateLateRisk(@Param('stopId') stopId: string, @Body() body: { lateRiskPct: number }) {
    return this.tripsService.updateLateRisk(stopId, body.lateRiskPct);
  }

  @Post('stops/:stopId/pod')
  savePOD(@Param('stopId') stopId: string, @Body() body: any) {
    return this.tripsService.savePOD(stopId, body);
  }

  // Load record endpoints (Loader app)
  @Post(':tripId/load-record')
  createLoadRecord(@Param('tripId') tripId: string, @Body() body: any) {
    return this.loadRecordService.create({ ...body, tripId });
  }

  @Patch(':tripId/load-record/release')
  releaseTrip(@Param('tripId') tripId: string, @Body() body: { sealNumber: string }) {
    return this.loadRecordService.release(tripId, body.sealNumber);
  }

  @Patch(':tripId/load-record/shortfalls')
  updateShortfalls(@Param('tripId') tripId: string, @Body() body: { shortfalls: any[] }) {
    return this.loadRecordService.updateShortfalls(tripId, body.shortfalls);
  }
}
