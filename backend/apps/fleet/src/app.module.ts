import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  imports: [PrismaModule],
  controllers: [FleetController],
  providers: [FleetService],
})
export class AppModule {}
