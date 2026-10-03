import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { MlClient, PlatformModule } from '@lodestar/platform';
import { AgentClient } from './agent.client';
import { CapacityService } from './capacity.service';
import { DeferralScoringService } from './deferral-scoring.service';
import { EtaService } from './eta.service';
import { PlanningService } from './planning.service';
import { AgentRunsSet, DeferralsSet, PlansSet } from './planning.sets';

@Module({
  imports: [
    PlatformModule.forService('planning'),
    ODataModule.forRoot({
      service: 'planning',
      entitySets: [PlansSet, DeferralsSet, AgentRunsSet],
      providers: [PlanningService, DeferralScoringService, CapacityService, EtaService, AgentClient, MlClient],
    }),
  ],
})
export class AppModule {}
