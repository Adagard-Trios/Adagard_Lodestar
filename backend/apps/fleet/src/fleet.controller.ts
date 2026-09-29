import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { Depot, VehicleStatus, TempClass } from '@prisma/client';

@Controller()
export class FleetController {
  constructor(private fleetService: FleetService) {}

  @Get('health') health() { return { status: 'ok', service: 'fleet' }; }

  @Get('summary') summary() { return this.fleetService.getSummary(); }

  @Get()
  findAll(
    @Query('depot')     depot?: Depot,
    @Query('status')    status?: VehicleStatus,
    @Query('tempClass') tempClass?: TempClass,
  ) { return this.fleetService.findAll(depot, status, tempClass); }

  @Get(':id') findOne(@Param('id') id: string) { return this.fleetService.findOne(id); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: VehicleStatus; workshopNote?: string }) {
    return this.fleetService.updateStatus(id, body.status, body.workshopNote);
  }

  @Patch(':id/fuel')
  updateFuel(@Param('id') id: string, @Body() body: { litresUsed: number }) {
    return this.fleetService.updateFuelUsage(id, body.litresUsed);
  }
}
