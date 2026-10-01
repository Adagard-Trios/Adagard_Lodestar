import { Module } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { AUDIT_SINK } from '@lodestar/security';
import { AuditChainService } from './audit-chain.service';
import { AuditEntriesSet, CHAIN_CHECK_TYPE } from './audit-entries.set';
import { LocalAuditSink } from './local-audit.sink';

@Module({
  imports: [
    PlatformModule.forService('audit', {
      auditSink: {
        provide: AUDIT_SINK,
        useFactory: (prisma: PrismaService) => new LocalAuditSink(new AuditChainService(prisma)),
        inject: [PrismaService],
      },
    }),
    ODataModule.forRoot({
      service: 'audit',
      entitySets: [AuditEntriesSet],
      providers: [AuditChainService],
      complexTypes: { ChainCheck: CHAIN_CHECK_TYPE },
    }),
  ],
})
export class AppModule {}
