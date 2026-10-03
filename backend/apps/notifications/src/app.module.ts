import { Module } from '@nestjs/common';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { AUDIT_SINK, type AuditSink } from '@lodestar/security';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsSet } from './notifications.set';
import { SmsService, smsConfigFromEnv } from './sms';

@Module({
  imports: [
    PlatformModule.forService('notifications'),
    ODataModule.forRoot({
      service: 'notifications',
      entitySets: [NotificationsSet],
      providers: [
        NotificationsService,
        NotificationsGateway,
        // SMS behind SMS_ENABLED (sms.ts); records go to the audit log
        { provide: SmsService, useFactory: (audit?: AuditSink) => new SmsService(smsConfigFromEnv(), audit), inject: [{ token: AUDIT_SINK, optional: true }] },
      ],
    }),
  ],
})
export class AppModule {}
