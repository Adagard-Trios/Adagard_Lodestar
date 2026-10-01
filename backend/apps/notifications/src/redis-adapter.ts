import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { Server } from 'socket.io';

/** The subset of a node-redis client the adapter wiring needs (mockable in tests). */
export interface RedisLikeClient {
  connect(): Promise<unknown>;
  disconnect(): Promise<unknown>;
  duplicate(): RedisLikeClient;
  on(event: 'error', listener: (err: Error) => void): unknown;
}

export type RedisClientFactory = (options: { url: string }) => RedisLikeClient;

export type AdapterFactory = (pub: RedisLikeClient, sub: RedisLikeClient) => any;

const defaultClientFactory: RedisClientFactory = (options) => createClient(options) as unknown as RedisLikeClient;
const defaultAdapterFactory: AdapterFactory = (pub, sub) => createAdapter(pub as any, sub as any);

/** Pub/sub connections behind the adapter. */
export interface RedisAdapterHandle {
  /** Resolves once both connections are up and the adapter is attached. */
  ready: Promise<void>;
  /** Closes both connections (also while a connect is still retrying). */
  close(): Promise<void>;
}

/**
 * Horizontal scaling for Socket.IO (PLATFORM.md section 9): with REDIS_URL set,
 * every notifications replica publishes room emits to Redis and receives the
 * emits of the others, so a client connected to pod A gets an event raised on
 * pod B. Without REDIS_URL (tests, single-instance local compose) the default
 * in-memory adapter stays, nothing connects to Redis and this returns undefined.
 *
 * node-redis reconnects on its own, so a Redis that is down at boot only delays
 * the attach; until then the replica serves its own clients in memory.
 */
export function attachRedisAdapter(
  server: Pick<Server, 'adapter'>,
  url: string | undefined = process.env.REDIS_URL,
  clientFactory: RedisClientFactory = defaultClientFactory,
  adapterFactory: AdapterFactory = defaultAdapterFactory,
  logger: Pick<Logger, 'log' | 'error'> = new Logger('RedisAdapter'),
): RedisAdapterHandle | undefined {
  const target = url?.trim();
  if (!target) return undefined;

  const pub = clientFactory({ url: target });
  const sub = pub.duplicate();
  // An unhandled 'error' event would crash the process; log and let the client reconnect.
  pub.on('error', (err) => logger.error(`Redis pub client: ${err.message}`));
  sub.on('error', (err) => logger.error(`Redis sub client: ${err.message}`));

  const ready = Promise.all([pub.connect(), sub.connect()]).then(() => {
    server.adapter(adapterFactory(pub, sub));
    logger.log(`Socket.IO Redis adapter attached (${redactUrl(target)})`);
  });

  return {
    ready,
    async close() {
      // disconnect() also stops a reconnect loop; errors (already closed) are irrelevant here.
      await Promise.allSettled([pub, sub].map((c) => Promise.resolve().then(() => c.disconnect())));
    },
  };
}

/** redis://user:secret@host:6380 → redis://host:6380 (never log credentials). */
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'redis';
  }
}
