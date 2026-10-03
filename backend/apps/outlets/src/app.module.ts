import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { DataImportService } from './data-import.service';
import { OutletsService } from './outlets.service';
import { CalendarSet, DataImportsSet, DepotsSet, DistrictTravelSet, OutletsSet, ServiceAllowancesSet } from './outlets.sets';

@Module({
  imports: [
    PlatformModule.forService('outlets'),
    ODataModule.forRoot({
      service: 'outlets',
      entitySets: [DepotsSet, OutletsSet, CalendarSet, DistrictTravelSet, ServiceAllowancesSet, DataImportsSet],
      providers: [OutletsService, DataImportService],
    }),
  ],
})
export class AppModule {}
