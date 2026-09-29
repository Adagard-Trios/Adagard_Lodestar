import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { LoadRecordService } from './load-record.service';

@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [TripsService, LoadRecordService],
})
export class AppModule {}
