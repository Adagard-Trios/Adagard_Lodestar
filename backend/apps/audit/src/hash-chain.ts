import { createHash } from 'crypto';

/** prevHash of the first entry. */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * Canonical JSON: object keys sorted (recursively), no whitespace, Dates as
 * ISO strings, undefined object members dropped. Two structurally equal
 * values always serialise identically — also after a round trip through
 * Postgres jsonb, which reorders keys.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return 'null';
  return JSON.stringify(value);
}

/** The fields of an audit entry covered by its hash (everything but prevHash/hash). */
export interface ChainedFields {
  seq: number;
  at: Date;
  actor: string;
  actorRoles: string[];
  client: string;
  service: string;
  action: string;
  entitySet: string | null;
  entityKey: string | null;
  outcome: string;
  payload: unknown;
}

export interface ChainedEntry extends ChainedFields {
  prevHash: string;
  hash: string;
}

function hashedContent(e: ChainedFields): Record<string, unknown> {
  return {
    seq: e.seq,
    at: e.at instanceof Date ? e.at.toISOString() : e.at,
    actor: e.actor,
    actorRoles: e.actorRoles ?? [],
    client: e.client ?? '',
    service: e.service,
    action: e.action,
    entitySet: e.entitySet ?? null,
    entityKey: e.entityKey ?? null,
    outcome: e.outcome,
    payload: e.payload ?? null,
  };
}

/** hash = sha256(prevHash + canonical JSON of the entry) (PLATFORM.md §2.5). */
export function computeHash(prevHash: string, entry: ChainedFields): string {
  return createHash('sha256').update(prevHash + canonicalJson(hashedContent(entry))).digest('hex');
}

export interface ChainCheck {
  valid: boolean;
  checked: number;
  headSeq: number | null;
  headHash: string | null;
  firstInvalidSeq: number | null;
  reason: string | null;
}

/**
 * Incremental verifier: feed entries in seq order (in batches), then read
 * result(). Detects edited content (hash mismatch), removed or reordered
 * entries (broken prevHash link) and gaps in the sequence.
 */
export class ChainVerifier {
  private prevHash = GENESIS_HASH;
  private prevSeq: number | null = null;
  private checked = 0;
  private failure: { seq: number; reason: string } | null = null;

  push(entries: ChainedEntry[]): boolean {
    for (const e of entries) {
      if (this.failure) return false;
      this.checked++;
      if (this.prevSeq !== null && e.seq !== this.prevSeq + 1) {
        this.failure = { seq: e.seq, reason: `Sequence gap after ${this.prevSeq}` };
      } else if (e.prevHash !== this.prevHash) {
        this.failure = { seq: e.seq, reason: 'prevHash does not match the previous entry' };
      } else if (computeHash(e.prevHash, e) !== e.hash) {
        this.failure = { seq: e.seq, reason: 'Entry content does not match its hash' };
      }
      this.prevHash = e.hash;
      this.prevSeq = e.seq;
    }
    return !this.failure;
  }

  result(): ChainCheck {
    return {
      valid: !this.failure,
      checked: this.checked,
      headSeq: this.prevSeq,
      headHash: this.prevSeq === null ? null : this.prevHash,
      firstInvalidSeq: this.failure?.seq ?? null,
      reason: this.failure?.reason ?? null,
    };
  }
}
