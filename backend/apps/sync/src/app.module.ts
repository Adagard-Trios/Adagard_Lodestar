import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { OfflineEventsSet } from './offline-events.set';
import { SyncService } from './sync.service';

@Module({
  imports: [
    PlatformModule.forService('sync'),
    ODataModule.forRoot({ service: 'sync', entitySets: [OfflineEventsSet], providers: [SyncService] }),
  ],
})
export class AppModule {}
