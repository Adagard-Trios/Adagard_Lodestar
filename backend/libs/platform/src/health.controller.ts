import { Controller, Get, HttpCode, Inject, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { NoAudit, Public, SERVICE_NAME } from '@lodestar/security';

/**
 * Plain health endpoints (PLATFORM.md §3): unauthenticated, reachable only on
 * the `app` network (the gateway never routes them).
 *   GET /health → liveness
 *   GET /ready  → the database answers
 */
@Controller()
@NoAudit()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SERVICE_NAME) private readonly service: string,
  ) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: this.service };
  }

  @Public()
  @Get('ready')
  @HttpCode(200)
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', service: this.service };
    } catch {
      throw new ServiceUnavailableException('Database is not reachable');
    }
  }
}
