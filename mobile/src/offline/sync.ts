// Sends the outbox when there is signal.
//   Driver events (ARRIVAL, LEAVE, POD_SAVE) → POST OfflineEvents/Lodestar.PushBatch {events}, oldest first,
//     each with its client UUID as `id` (the server answers DUPLICATE for a replay: idempotent).
//   Loader / store writes → their own OData call, with the client UUID as Idempotency-Key:
//     SHORTFALL → LoadRecords('…')/Lodestar.RecordShortfalls (or POST LoadRecords when none exists yet)
//     RELEASE   → Trips('…')/Lodestar.Release (records the load first if the server asks for it)
//     RECEIPT   → Orders('…')/Lodestar.ConfirmReceipt
//     ORDER     → POST Orders
// Outcomes: applied → synced (a server conflict note is kept and shown); 409/412 → conflict;
// other 4xx → rejected (shown, the user can discard); network / 5xx / 429 → stays pending.
import { Store } from '@/lib/store';
import { key, lit, ODataError, type ODataClient } from '@/lib/odata';
import { BATCH_KINDS, type OfflineQueue, type QueueItem } from './queue';

export type FlushResult = { attempted: number; synced: number; conflicts: number; rejected: number; offline: boolean };

type PushResult = {
  synced: number;
  duplicates: number;
  rejected: number;
  conflicts: number;
  results: { id?: string; eventType: string; status: 'APPLIED' | 'DUPLICATE' | 'REJECTED'; conflict?: string | null; reason?: string }[];
};

type Outcome = { status: 'synced'; conflict?: string | null } | { status: 'conflict' | 'rejected'; reason: string } | { status: 'retry'; reason: string; stop: boolean };

const MAX_BATCH = 200;

export type SyncStatus = { running: boolean; lastRunAt?: string; lastResult?: FlushResult };

export class SyncEngine {
  readonly status = new Store<SyncStatus>({ running: false });
  private inflight: Promise<FlushResult> | null = null;

  constructor(
    private readonly queue: OfflineQueue,
    private readonly client: Pick<ODataClient, 'action' | 'create' | 'list'>,
    private readonly opts: {
      /** Subject of the signed-in user; null when signed out (nothing is sent). */
      sub: () => string | null;
      online: () => boolean;
      now?: () => number;
      onSynced?: (items: QueueItem[]) => void;
    },
  ) {}

  /** Sends everything pending (one flush at a time; a second call joins the running one). */
  flush(): Promise<FlushResult> {
    this.inflight ??= this.run().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private now() {
    return (this.opts.now ?? Date.now)();
  }

  private async run(): Promise<FlushResult> {
    const result: FlushResult = { attempted: 0, synced: 0, conflicts: 0, rejected: 0, offline: false };
    await this.queue.ready();
    const sub = this.opts.sub();
    if (!sub || !this.opts.online()) return { ...result, offline: !this.opts.online() };
    const pending = this.queue.pending(sub);
    if (!pending.length) return result;

    this.status.set(s => ({ ...s, running: true }));
    const done: QueueItem[] = [];
    try {
      const events = pending.filter(i => BATCH_KINDS.includes(i.kind));
      const commands = pending.filter(i => !BATCH_KINDS.includes(i.kind));

      for (let i = 0; i < events.length && !result.offline; i += MAX_BATCH) {
        await this.pushEvents(events.slice(i, i + MAX_BATCH), result, done);
      }
      for (const item of commands) {
        if (result.offline) break;
        result.attempted++;
        await this.mark(item, 'sending');
        const outcome = await this.sendCommand(item);
        await this.apply(item, outcome, result, done);
      }
    } finally {
      const lastResult = { ...result };
      this.status.set({ running: false, lastRunAt: new Date(this.now()).toISOString(), lastResult });
      if (done.length) this.opts.onSynced?.(done);
    }
    return result;
  }

  private async mark(item: QueueItem, status: QueueItem['status']) {
    await this.queue.update(item.id, { status });
  }

  private async apply(item: QueueItem, o: Outcome, result: FlushResult, done: QueueItem[]) {
    const attempts = item.attempts + 1;
    if (o.status === 'synced') {
      result.synced++;
      if (o.conflict) result.conflicts++;
      await this.queue.update(item.id, { status: 'synced', attempts, conflict: o.conflict ?? null, syncedAt: new Date(this.now()).toISOString(), lastError: undefined });
      done.push(item);
    } else if (o.status === 'retry') {
      if (o.stop) result.offline = true;
      await this.queue.update(item.id, { status: 'pending', attempts, lastError: o.reason });
    } else {
      if (o.status === 'conflict') result.conflicts++;
      else result.rejected++;
      await this.queue.update(item.id, { status: o.status, attempts, conflict: o.reason, lastError: o.reason, acknowledged: false });
      done.push(item);
    }
  }

  private async pushEvents(items: QueueItem[], result: FlushResult, done: QueueItem[]) {
    result.attempted += items.length;
    for (const i of items) await this.mark(i, 'sending');
    let res: PushResult;
    try {
      res = await this.client.action<PushResult>(
        'OfflineEvents/Lodestar.PushBatch',
        { events: items.map(toEvent) },
        { idempotencyKey: items.length === 1 ? items[0].id : undefined },
      );
    } catch (e) {
      const o = classify(e);
      // One malformed event must not hold back the others: retry them one by one.
      if (o.status === 'rejected' && items.length > 1 && (e as ODataError).status === 400) {
        result.attempted -= items.length;
        for (const i of items) {
          await this.pushEvents([{ ...i, status: 'pending' }], result, done);
          if (result.offline) break;
        }
        return;
      }
      for (const i of items) await this.apply(i, o, result, done);
      return;
    }
    const byId = new Map((res?.results ?? []).filter(r => r.id).map(r => [r.id!, r]));
    for (const i of items) {
      const r = byId.get(i.id);
      if (!r) await this.apply(i, { status: 'retry', reason: 'Not confirmed by the server', stop: false }, result, done);
      else if (r.status === 'REJECTED') await this.apply(i, { status: 'rejected', reason: r.reason ?? 'Refused by the server' }, result, done);
      else await this.apply(i, { status: 'synced', conflict: r.conflict ?? null }, result, done);
    }
  }

  private async sendCommand(item: QueueItem): Promise<Outcome> {
    const p = item.payload;
    const idem = { idempotencyKey: item.id };
    try {
      switch (item.kind) {
        case 'SHORTFALL': {
          let lr: string | undefined = p.loadRecordId;
          if (!lr) {
            const found = await this.client.list<{ id: string }>('LoadRecords', { filter: `tripId eq ${lit(p.tripId)}`, select: ['id'], top: 1 });
            lr = found.value[0]?.id;
          }
          if (lr) await this.client.action(`LoadRecords${key(lr)}/Lodestar.RecordShortfalls`, { shortfalls: p.shortfalls }, idem);
          else await this.client.create('LoadRecords', { tripId: p.tripId, bay: p.bay, shortfalls: p.shortfalls }, idem);
          return { status: 'synced' };
        }
        case 'RELEASE': {
          const body = { sealNumber: p.sealNumber, ...(typeof p.reeferTempC === 'number' ? { reeferTempC: p.reeferTempC } : {}) };
          const path = `Trips${key(p.tripId)}/Lodestar.Release`;
          try {
            await this.client.action(path, body, idem);
          } catch (e) {
            // "record the load first": create the load record for this bay, then release
            if (e instanceof ODataError && e.status === 409 && /load record/i.test(e.message) && p.bay) {
              await this.client.create('LoadRecords', { tripId: p.tripId, bay: p.bay }, { idempotencyKey: `${item.id}-lr` });
              await this.client.action(path, body, idem);
            } else throw e;
          }
          return { status: 'synced' };
        }
        case 'RECEIPT': {
          try {
            await this.client.action(`Orders${key(p.orderId)}/Lodestar.ConfirmReceipt`, { unitsReceived: p.unitsReceived, unitsExpected: p.unitsExpected, note: p.note ?? null, savedAt: item.savedAt }, idem);
          } catch (e) {
            // The orders service may not offer the action yet: keep the receipt on the phone and retry later.
            if (e instanceof ODataError && (e.status === 404 || e.status === 405 || e.status === 501) && !/Orders\(/.test(e.message)) {
              return { status: 'retry', reason: 'The server cannot take receipt confirmations yet; kept on this phone', stop: false };
            }
            throw e;
          }
          return { status: 'synced' };
        }
        case 'ORDER': {
          // orderedAt = when the store saved it: an order saved before the 4:00 PM cut-off and sent
          // later (no signal) still counts, within the server's grace window
          await this.client.create('Orders', { ...p.order, orderedAt: item.savedAt }, idem);
          return { status: 'synced' };
        }
        default:
          return { status: 'rejected', reason: `Unknown write ${item.kind}` };
      }
    } catch (e) {
      return classify(e);
    }
  }
}

function toEvent(i: QueueItem) {
  const payload = { ...i.payload };
  delete payload.stopId; // local reference only
  return { id: i.id, tripId: i.tripId, eventType: i.kind, payload, savedAt: i.savedAt };
}

export function classify(e: unknown): Outcome {
  if (!(e instanceof ODataError)) return { status: 'retry', reason: (e as Error)?.message ?? 'Unknown error', stop: false };
  if (e.isNetwork) return { status: 'retry', reason: e.message, stop: true };
  if (e.isTransient) return { status: 'retry', reason: e.message, stop: false };
  if (e.status === 401) return { status: 'retry', reason: 'Sign in again to send', stop: true };
  if (e.status === 409 || e.status === 412) return { status: 'conflict', reason: e.message };
  return { status: 'rejected', reason: e.message };
}

/** Ids of trips mentioned by pending writes (for cache refresh after a sync). */
export function tripsOf(items: QueueItem[]): string[] {
  return [...new Set(items.map(i => i.tripId).filter((t): t is string => !!t))];
}
