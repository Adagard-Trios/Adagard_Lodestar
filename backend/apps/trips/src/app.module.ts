import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { MlClient, PlatformModule } from '@lodestar/platform';
import { FleetClient } from './fleet.client';
import { TripsService } from './trips.service';
import { LoadRecordsSet, PODsSet, TripStopsSet, TripsSet } from './trips.sets';

@Module({
  imports: [
    PlatformModule.forService('trips'),
    ODataModule.forRoot({
      service: 'trips',
      entitySets: [TripsSet, TripStopsSet, PODsSet, LoadRecordsSet],
      providers: [TripsService, FleetClient, MlClient],
      idempotency: { model: 'tripsIdempotencyKey' },
    }),
  ],
})
export class AppModule {}
