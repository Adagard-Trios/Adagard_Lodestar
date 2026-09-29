import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, Brand, TempClass, Depot } from '@prisma/client';

@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('health')
  health() { return { status: 'ok', service: 'orders' }; }

  @Get()
  findAll(
    @Query('runDate')    runDate?: string,
    @Query('status')     status?: OrderStatus,
    @Query('depot')      depot?: Depot,
    @Query('brand')      brand?: Brand,
    @Query('tempClass')  tempClass?: TempClass,
    @Query('outletId')   outletId?: string,
  ) {
    return this.ordersService.findAll({ runDate, status, depot, brand, tempClass, outletId });
  }

  @Get('summary')
  summary(@Query('runDate') runDate?: string) {
    return this.ordersService.getSummary(runDate);
  }

  @Get('deferrals')
  deferrals(@Query('runDate') runDate?: string) {
    return this.ordersService.getDeferralSuggestions(runDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.ordersService.create(body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; notes?: string },
  ) {
    return this.ordersService.updateStatus(id, body.status, body.notes);
  }
}
