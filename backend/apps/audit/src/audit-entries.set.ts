import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { EntitySet, ODataEntitySet, ODataError, ODataFunction, WriteContext } from '@lodestar/odata';
import { AuditEvent, AuditOutcome, Roles, serviceName } from '@lodestar/security';
import { AuditChainService } from './audit-chain.service';

const OUTCOMES: AuditOutcome[] = ['SUCCESS', 'FAILED', 'DENIED'];

/**
 * AuditEntries: services POST events with their own service token; admins
 * read the log (ADM-16/19/20). No PATCH, no DELETE, ever.
 */
@Injectable()
@EntitySet({
  name: 'AuditEntries',
  model: 'AuditEntry',
  read: [Roles.Admin, Roles.Service],
  create: [Roles.Service],
  abac: {}, // only privileged roles can read at all
  search: ['action', 'actor', 'entityKey'],
  insertable: ['at', 'actor', 'actorRoles', 'client', 'action', 'entitySet', 'entityKey', 'outcome', 'payload'],
  defaultOrderBy: 'seq desc',
})
export class AuditEntriesSet extends ODataEntitySet {
  constructor(
    prisma: PrismaService,
    private readonly chain: AuditChainService,
  ) {
    super(prisma);
  }

  async beforeCreate(data: Record<string, any>) {
    if (!data.actor || !data.action) throw ODataError.badRequest('actor and action are required');
    if (data.outcome && !OUTCOMES.includes(data.outcome)) throw ODataError.badRequest(`outcome must be one of ${OUTCOMES.join(', ')}`);
    return data;
  }

  /** The reporting service is taken from the token (azp), never from the body. */
  async create(data: Record<string, any>, ctx: WriteContext) {
    const service = serviceName(ctx.principal) ?? ctx.principal.clientId ?? 'unknown';
    const event: AuditEvent = {
      at: (data.at instanceof Date ? data.at : new Date()).toISOString(),
      actor: data.actor,
      actorRoles: data.actorRoles ?? [],
      client: data.client,
      action: data.action,
      entitySet: data.entitySet,
      entityKey: data.entityKey,
      outcome: data.outcome ?? 'SUCCESS',
      payload: data.payload,
    };
    return this.chain.append(event, service);
  }

  /** GET /odata/v4/AuditEntries/Lodestar.VerifyChain() */
  @ODataFunction({ name: 'VerifyChain', binding: 'collection', roles: [Roles.Admin, Roles.Service], returns: 'Lodestar.ChainCheck' })
  verifyChain() {
    return this.chain.verify();
  }
}

/** EDM shape of VerifyChain's result. */
export const CHAIN_CHECK_TYPE = {
  valid: 'Edm.Boolean',
  checked: 'Edm.Int32',
  headSeq: 'Edm.Int32',
  headHash: 'Edm.String',
  firstInvalidSeq: 'Edm.Int32',
  reason: 'Edm.String',
};
