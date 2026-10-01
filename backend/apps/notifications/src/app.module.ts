import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsSet } from './notifications.set';

@Module({
  imports: [
    PlatformModule.forService('notifications'),
    ODataModule.forRoot({
      service: 'notifications',
      entitySets: [NotificationsSet],
      providers: [NotificationsService, NotificationsGateway],
    }),
  ],
})
export class AppModule {}
