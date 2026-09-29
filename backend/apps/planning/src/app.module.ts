import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { DeferralScoringService } from './deferral-scoring.service';
import { CapacityService } from './capacity.service';
import { EtaService } from './eta.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningService, DeferralScoringService, CapacityService, EtaService],
})
export class AppModule {}
