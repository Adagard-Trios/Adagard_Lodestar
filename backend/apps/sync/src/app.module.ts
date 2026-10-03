import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { OfflineEventsSet } from './offline-events.set';
import { PodPhotoService } from './pod-photos';
import { podPhotoBody, PodPhotosController } from './pod-photos.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    PlatformModule.forService('sync'),
    ODataModule.forRoot({ service: 'sync', entitySets: [OfflineEventsSet], providers: [SyncService, PodPhotoService] }),
  ],
  controllers: [PodPhotosController],
  providers: [PodPhotoService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // POD photos arrive as raw image bodies (the platform parses JSON only)
    consumer.apply(podPhotoBody).forRoutes({ path: 'pod-photos', method: RequestMethod.POST });
  }
}
