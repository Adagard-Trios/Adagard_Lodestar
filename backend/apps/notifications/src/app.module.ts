import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
})
export class AppModule {}
