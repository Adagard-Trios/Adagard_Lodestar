import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { FleetService } from './fleet.service';
import { VehiclesSet } from './vehicles.set';

@Module({
  imports: [
    PlatformModule.forService('fleet'),
    ODataModule.forRoot({ service: 'fleet', entitySets: [VehiclesSet], providers: [FleetService] }),
  ],
})
export class AppModule {}
