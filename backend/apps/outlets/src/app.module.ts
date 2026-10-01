import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { OutletsService } from './outlets.service';
import { CalendarSet, DistrictTravelSet, OutletsSet, ServiceAllowancesSet } from './outlets.sets';

@Module({
  imports: [
    PlatformModule.forService('outlets'),
    ODataModule.forRoot({
      service: 'outlets',
      entitySets: [OutletsSet, CalendarSet, DistrictTravelSet, ServiceAllowancesSet],
      providers: [OutletsService],
    }),
  ],
})
export class AppModule {}
