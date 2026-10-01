import { anything, instance, mock, verify, when } from 'ts-mockito';
import { DevicePostureService, JwtVerifier } from '@lodestar/security';
import { NotificationsGateway } from './notifications.gateway';
import { attachRedisAdapter, redactUrl, RedisLikeClient } from './redis-adapter';

/** Minimal node-redis stand-in: records connect/disconnect and the 'error' listener. */
class FakeRedis implements RedisLikeClient {
  connected = false;
  disconnected = false;
  errorListener?: (err: Error) => void;
  readonly copies: FakeRedis[] = [];
  constructor(private readonly connectResult: Promise<unknown> = Promise.resolve()) {}
  connect() {
    return this.connectResult.then(() => {
      this.connected = true;
    });
  }
  async disconnect() {
    this.disconnected = true;
  }
  duplicate() {
    const copy = new FakeRedis(this.connectResult);
    this.copies.push(copy);
    return copy;
  }
  on(_event: 'error', listener: (err: Error) => void) {
    this.errorListener = listener;
    return this;
  }
}

const silent = { log: jest.fn(), error: jest.fn() };

describe('attachRedisAdapter (Socket.IO fan-out across replicas)', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([undefined, '', '   '])('keeps the in-memory adapter when REDIS_URL is %p', (url) => {
    const server = { adapter: jest.fn() };
    const clientFactory = jest.fn();
    expect(attachRedisAdapter(server as any, url, clientFactory, jest.fn(), silent)).toBeUndefined();
    expect(clientFactory).not.toHaveBeenCalled();
    expect(server.adapter).not.toHaveBeenCalled();
  });

  it('connects a pub and a duplicated sub client, then installs the Redis adapter', async () => {
    const server = { adapter: jest.fn() };
    const pub = new FakeRedis();
    const clientFactory = jest.fn().mockReturnValue(pub);
    const adapter = function RedisAdapter() {};
    const adapterFactory = jest.fn().mockReturnValue(adapter);

    const handle = attachRedisAdapter(server as any, 'redis://:s3cret@redis:6379', clientFactory, adapterFactory, silent);
    await handle!.ready;

    expect(clientFactory).toHaveBeenCalledWith({ url: 'redis://:s3cret@redis:6379' });
    const sub = pub.copies[0];
    expect(pub.connected && sub.connected).toBe(true);
    expect(adapterFactory).toHaveBeenCalledWith(pub, sub);
    expect(server.adapter).toHaveBeenCalledWith(adapter);
    // the password never reaches the log
    expect(silent.log.mock.calls[0][0]).toContain('redis://redis:6379');
    expect(silent.log.mock.calls[0][0]).not.toContain('s3cret');
  });

  it('handles client errors instead of crashing the process', () => {
    const pub = new FakeRedis(new Promise(() => undefined));
    attachRedisAdapter({ adapter: jest.fn() } as any, 'redis://redis:6379', () => pub, jest.fn(), silent);
    expect(pub.errorListener).toBeDefined();
    expect(pub.copies[0].errorListener).toBeDefined();
    pub.errorListener!(new Error('ECONNREFUSED'));
    expect(silent.error).toHaveBeenCalledWith('Redis pub client: ECONNREFUSED');
  });

  it('does not install the adapter until Redis is reachable, and close() stops the clients', async () => {
    const server = { adapter: jest.fn() };
    const pub = new FakeRedis(new Promise(() => undefined)); // Redis down: connect never settles
    const handle = attachRedisAdapter(server as any, 'redis://redis:6379', () => pub, jest.fn(), silent)!;
    await Promise.resolve();
    expect(server.adapter).not.toHaveBeenCalled();
    await handle.close();
    expect(pub.disconnected && pub.copies[0].disconnected).toBe(true);
  });

  it('redacts credentials from URLs', () => {
    expect(redactUrl('rediss://default:key@lodestar.redis.cache.windows.net:6380')).toBe('rediss://lodestar.redis.cache.windows.net:6380');
    expect(redactUrl('not a url')).toBe('redis');
  });
});

describe('NotificationsGateway Redis wiring', () => {
  const ORIGINAL = process.env.REDIS_URL;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = ORIGINAL;
  });

  function gateway() {
    const verifier = mock(JwtVerifier);
    const posture = mock(DevicePostureService);
    when(verifier.verify(anything())).thenReject(new Error('unused'));
    return { gw: new NotificationsGateway(instance(verifier), instance(posture), {} as any), verifier };
  }

  it('afterInit leaves the server adapter alone without REDIS_URL, and shuts down cleanly', async () => {
    delete process.env.REDIS_URL;
    const { gw, verifier } = gateway();
    const server = { adapter: jest.fn() };
    gw.afterInit(server as any);
    expect(server.adapter).not.toHaveBeenCalled();
    await expect(gw.onModuleDestroy()).resolves.toBeUndefined();
    verify(verifier.verify(anything())).never();
  });
});
