import { ODataError } from '@/lib/odata';
import { memoryQueueStorage, OfflineQueue } from '@/offline/queue';
import { base64ToBytes, SyncEngine } from '@/offline/sync';

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
let now = Date.parse('2026-04-07T04:40:00Z');
const clock = () => (now += 1000);

// a tiny "JPEG": the magic bytes and a body
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xfe]);
const JPEG_B64 = '/9j/4AAQSkZJRgAB/g==';

async function setup() {
  const storage = memoryQueueStorage();
  const queue = new OfflineQueue(storage, uuid, clock);
  await queue.ready();
  const client = { action: jest.fn(), create: jest.fn(), list: jest.fn(), request: jest.fn(async () => ({ status: 201, data: { id: 'p1' } as Record<string, unknown> })) };
  let online = false;
  const engine = new SyncEngine(queue, client as any, { sub: () => 'u-1', online: () => online, now: clock });
  return { storage, queue, client, engine, setOnline: (v: boolean) => (online = v) };
}

const photo = (q: OfflineQueue) =>
  q.enqueue('POD_PHOTO', {
    sub: 'u-1', tripId: 'T1', ref: 'S1', label: 'Photo · ORD1',
    payload: { stopId: 'S1', orderId: 'ORD1', mime: 'image/jpeg', dataBase64: JPEG_B64, bytes: JPEG.length, takenAt: '2026-04-07T04:45:00.000Z' },
  });

describe('POD photos in the outbox', () => {
  it('decodes base64 (and data: URLs) to the same bytes', () => {
    expect(Array.from(base64ToBytes(JPEG_B64))).toEqual(Array.from(JPEG));
    expect(Array.from(base64ToBytes(`data:image/jpeg;base64,${JPEG_B64}`))).toEqual(Array.from(JPEG));
    expect(Array.from(base64ToBytes('AQIDBAU='))).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the photo on the phone with no signal, then uploads the bytes once online and drops them from storage', async () => {
    const { queue, client, engine, storage, setOnline } = await setup();
    const item = await photo(queue);

    const offline = await engine.flush();
    expect(offline.offline).toBe(true);
    expect(client.request).not.toHaveBeenCalled();
    expect(queue.list()[0]).toMatchObject({ kind: 'POD_PHOTO', status: 'pending' });

    setOnline(true);
    const r = await engine.flush();
    expect(r).toMatchObject({ attempted: 1, synced: 1 });
    expect(client.request).toHaveBeenCalledTimes(1);
    const [method, path, opts] = (client.request.mock.calls[0] as unknown) as [string, string, any];
    expect(method).toBe('POST');
    expect(path).toBe(`/media/pod-photos?stopId=S1&takenAt=${encodeURIComponent('2026-04-07T04:45:00.000Z')}&eventId=${item.id}`);
    expect(Array.from(opts.raw as Uint8Array)).toEqual(Array.from(JPEG));
    expect(opts.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(opts.idempotencyKey).toBe(item.id);

    const sent = queue.list()[0];
    expect(sent.status).toBe('synced');
    expect(sent.payload.dataBase64).toBeUndefined();
    expect(sent.payload.bytes).toBe(JPEG.length);
    expect(storage.rows.get(item.id)?.payload.dataBase64).toBeUndefined();

    // nothing left to send
    await engine.flush();
    expect(client.request).toHaveBeenCalledTimes(1);
  });

  it('retries after a dropped connection and shows a refused photo', async () => {
    const { queue, client, engine, setOnline } = await setup();
    setOnline(true);
    await photo(queue);
    client.request.mockRejectedValueOnce(new ODataError(0, 'NetworkError', 'No connection to the server'));
    expect((await engine.flush()).offline).toBe(true);
    expect(queue.list()[0]).toMatchObject({ status: 'pending', attempts: 1 });
    expect((await engine.flush()).synced).toBe(1);

    const bad = await photo(queue);
    client.request.mockRejectedValueOnce(new ODataError(415, 'UnsupportedMediaType', 'Only JPEG, PNG or WebP photos are accepted'));
    expect((await engine.flush()).rejected).toBe(1);
    expect(queue.list().find(i => i.id === bad.id)).toMatchObject({ status: 'rejected', conflict: 'Only JPEG, PNG or WebP photos are accepted' });
  });

  it('sends the POD first (PushBatch), then the photo', async () => {
    const { queue, client, engine, setOnline } = await setup();
    await photo(queue);
    const pod = await queue.enqueue('POD_SAVE', { sub: 'u-1', tripId: 'T1', ref: 'S1', label: 'POD', payload: { orderId: 'ORD1', units: 3, unitsOrdered: 3, stopId: 'S1' } });
    const order: string[] = [];
    client.action.mockImplementation(async () => {
      order.push('pod');
      return { synced: 1, duplicates: 0, rejected: 0, conflicts: 0, results: [{ id: pod.id, eventType: 'POD_SAVE', status: 'APPLIED' }] };
    });
    client.request.mockImplementation(async () => {
      order.push('photo');
      return { status: 201, data: {} };
    });
    setOnline(true);
    await engine.flush();
    expect(order).toEqual(['pod', 'photo']);
  });
});
