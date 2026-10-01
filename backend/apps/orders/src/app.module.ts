import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { OrdersService } from './orders.service';
import { OrderLineItemsSet, ORDERS_SUMMARY_TYPE, OrdersSet } from './orders.sets';

@Module({
  imports: [
    PlatformModule.forService('orders'),
    ODataModule.forRoot({
      service: 'orders',
      entitySets: [OrdersSet, OrderLineItemsSet],
      providers: [OrdersService],
      complexTypes: { OrdersSummary: ORDERS_SUMMARY_TYPE },
      idempotency: { model: 'ordersIdempotencyKey' },
    }),
  ],
})
export class AppModule {}
