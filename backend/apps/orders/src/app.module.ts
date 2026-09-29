import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class AppModule {}
