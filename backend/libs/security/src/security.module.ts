import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AUDIT_SINK, HttpAuditSink } from './audit';
import { NOTIFY, NotifyClient } from './notify';
import { AuditInterceptor } from './audit.interceptor';
import { loadOidcConfig, OIDC_CONFIG, OidcConfig, SERVICE_NAME } from './config';
import { DEVICE_LOOKUP, DevicePostureService } from './device-posture.service';
import { JwtVerifier } from './jwt-verifier';
import { PrismaDeviceLookup } from './prisma-device-lookup';
import { ServiceTokenClient } from './service-token.client';
import { ZeroTrustGuard } from './zero-trust.guard';

export interface SecurityModuleOptions {
  /** Replaces the HTTP audit sink (the audit service records locally). */
  auditSink?: Provider;
}

/**
 * Zero-trust wiring for one service: global JWT guard (RBAC + scopes + device
 * posture), global audit interceptor, a client-credentials token client and
 * the audit sink. Import once per app: SecurityModule.forService('orders').
 */
@Global()
@Module({})
export class SecurityModule {
  static forService(service: string, options: SecurityModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      { provide: SERVICE_NAME, useValue: service },
      { provide: OIDC_CONFIG, useFactory: () => loadOidcConfig(process.env) },
      JwtVerifier,
      { provide: DEVICE_LOOKUP, useClass: PrismaDeviceLookup },
      DevicePostureService,
      {
        provide: ServiceTokenClient,
        useFactory: (config: OidcConfig) => new ServiceTokenClient(config),
        inject: [OIDC_CONFIG],
      },
      options.auditSink ?? {
        provide: AUDIT_SINK,
        useFactory: (tokens: ServiceTokenClient) =>
          new HttpAuditSink(process.env.AUDIT_URL || 'http://audit:3009', tokens),
        inject: [ServiceTokenClient],
      },
      {
        provide: NOTIFY,
        useFactory: (tokens: ServiceTokenClient) =>
          new NotifyClient(process.env.NOTIFICATIONS_URL || 'http://notifications:3008', tokens),
        inject: [ServiceTokenClient],
      },
      { provide: APP_GUARD, useClass: ZeroTrustGuard },
      { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    ];
    return {
      module: SecurityModule,
      providers,
      exports: [SERVICE_NAME, OIDC_CONFIG, JwtVerifier, DevicePostureService, ServiceTokenClient, AUDIT_SINK, NOTIFY],
    };
  }
}
