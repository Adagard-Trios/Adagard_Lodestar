import { Controller, Get, Param, Query } from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { Brand, Depot, DockType, ParkingType } from '@prisma/client';

@Controller()
export class OutletsController {
  constructor(private outletsService: OutletsService) {}
  @Get('health') health() { return { status: 'ok', service: 'outlets' }; }
  @Get()
  findAll(
    @Query('brand') brand?: Brand, @Query('depot') depot?: Depot,
    @Query('district') district?: string, @Query('dockType') dockType?: DockType,
    @Query('parking') parking?: ParkingType, @Query('search') search?: string,
  ) { return this.outletsService.findAll({ brand, depot, district, dockType, parking, search }); }
  @Get(':id') findOne(@Param('id') id: string) { return this.outletsService.findOne(id); }
}
