import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@lodestar/prisma';
import type { AuditEvent } from '@lodestar/security';
import { ChainCheck, ChainedEntry, ChainVerifier, computeHash, GENESIS_HASH } from './hash-chain';

/** Arbitrary constant key for the Postgres advisory lock that serialises appends. */
const CHAIN_LOCK_KEY = 7_311_2026;
const VERIFY_BATCH = 1000;

/**
 * Append-only, hash-chained audit log. Appends are serialised with a
 * transaction-scoped advisory lock so every entry links to exactly one
 * predecessor; the database rejects UPDATE/DELETE on AuditEntry (trigger).
 */
@Injectable()
export class AuditChainService {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AuditEvent, service: string): Promise<ChainedEntry> {
    return this.prisma.$transaction(async (tx) => {
      // $executeRaw: the lock function returns void, which $queryRaw cannot deserialize.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK_KEY}::bigint)`;
      const last = await tx.auditEntry.findFirst({ orderBy: { seq: 'desc' }, select: { seq: true, hash: true } });
      const entry = {
        seq: (last?.seq ?? 0) + 1,
        at: new Date(event.at ?? Date.now()),
        actor: event.actor,
        actorRoles: event.actorRoles ?? [],
        client: event.client ?? '',
        service,
        action: event.action,
        entitySet: event.entitySet ?? null,
        entityKey: event.entityKey ?? null,
        outcome: event.outcome ?? 'SUCCESS',
        payload: (event.payload ?? null) as any,
        prevHash: last?.hash ?? GENESIS_HASH,
      };
      const hash = computeHash(entry.prevHash, entry);
      // A missing payload is hashed as null and stored as SQL NULL (Prisma needs DbNull for Json columns).
      const payload = entry.payload === null ? Prisma.DbNull : entry.payload;
      return (await tx.auditEntry.create({ data: { ...entry, payload, hash } })) as unknown as ChainedEntry;
    });
  }

  /** Recomputes the whole chain in seq order, in batches. */
  async verify(): Promise<ChainCheck> {
    const verifier = new ChainVerifier();
    let after = 0;
    for (;;) {
      const batch = (await this.prisma.auditEntry.findMany({
        where: { seq: { gt: after } },
        orderBy: { seq: 'asc' },
        take: VERIFY_BATCH,
      })) as unknown as ChainedEntry[];
      if (!batch.length) break;
      if (!verifier.push(batch)) break;
      after = batch[batch.length - 1].seq;
      if (batch.length < VERIFY_BATCH) break;
    }
    return verifier.result();
  }
}
