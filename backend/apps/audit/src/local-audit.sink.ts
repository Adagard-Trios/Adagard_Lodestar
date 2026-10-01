import { Logger } from '@nestjs/common';
import type { AuditEvent, AuditSink } from '@lodestar/security';
import { AuditChainService } from './audit-chain.service';

/**
 * The audit service records its own write events directly in the chain.
 * Creating an AuditEntry is itself the record, so it is not audited again.
 */
export class LocalAuditSink implements AuditSink {
  private readonly logger = new Logger(LocalAuditSink.name);

  constructor(private readonly chain: AuditChainService) {}

  async record(event: AuditEvent): Promise<void> {
    if (event.entitySet === 'AuditEntries' && event.action === 'AuditEntries.Create') return;
    try {
      await this.chain.append(event, 'audit');
    } catch (err) {
      this.logger.error(`Could not record ${event.action}: ${(err as Error).message}`);
    }
  }
}
