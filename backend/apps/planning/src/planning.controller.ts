import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { Depot, DeferralReason } from '@prisma/client';

@Controller()
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  @Get('health')
  health() { return { status: 'ok', service: 'planning' }; }

  /** DSP-01: full plan board */
  @Get('plan')
  getPlan(@Query('depot') depot: Depot, @Query('runDate') runDate?: string) {
    return this.planningService.getPlan(depot || Depot.PELIYAGODA, runDate);
  }

  /** Run auto-plan engine */
  @Post('autoplan')
  runAutoPlan(@Body() body: { depot: Depot; runDate?: string; resolvedBy?: string }) {
    return this.planningService.runAutoPlan(body.depot, body.runDate, body.resolvedBy);
  }

  /** Confirm a deferral suggestion */
  @Post('deferrals/confirm')
  confirmDeferral(@Body() body: {
    orderId: string;
    reason: DeferralReason;
    notes: string;
    resolvedBy: string;
    rescheduledDate?: string;
  }) {
    return this.planningService.confirmDeferral(
      body.orderId, body.reason, body.notes, body.resolvedBy, body.rescheduledDate,
    );
  }

  /** DSP-05: 10-week capacity outlook */
  @Get('capacity/outlook')
  outlook(@Query('depot') depot: Depot) {
    return this.planningService.getCapacityOutlook(depot || Depot.PELIYAGODA);
  }
}
