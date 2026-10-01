import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { SecurityModule } from '@lodestar/security';
import { HealthController } from './health.controller';

/**
 * Everything every Lodestar service needs: Prisma, zero-trust security
 * (guard, audit, service tokens) and the health endpoints.
 *
 *   imports: [PlatformModule.forService('orders'), ODataModule.forRoot({...})]
 */
@Module({})
export class PlatformModule {
  static forService(service: string, options: { auditSink?: Provider } = {}): DynamicModule {
    return {
      module: PlatformModule,
      imports: [PrismaModule, SecurityModule.forService(service, options)],
      controllers: [HealthController],
      exports: [PrismaModule, SecurityModule],
    };
  }
}
