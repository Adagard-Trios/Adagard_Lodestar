import { Logger, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ODataExceptionFilter } from '@lodestar/odata';

/**
 * Starts a Lodestar service: OData error format for every error, JSON bodies
 * up to 2 MB (POD signatures), no X-Powered-By, graceful shutdown.
 * CORS is not enabled: browsers reach services only through the gateway.
 */
export async function bootstrapService(module: Type<unknown>, name: string, defaultPort: number) {
  const app = await NestFactory.create<NestExpressApplication>(module, { bodyParser: false });
  app.useBodyParser('json', { limit: '2mb', type: ['application/json', 'application/*+json'] });
  app.useGlobalFilters(new ODataExceptionFilter());
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback, uniquelocal');
  app.enableShutdownHooks();
  const port = Number(process.env.PORT) || defaultPort;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`${name} service listening on port ${port}`);
  return app;
}
