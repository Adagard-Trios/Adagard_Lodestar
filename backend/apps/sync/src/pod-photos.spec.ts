import { createHash } from 'crypto';
import { ODataError } from '@lodestar/odata';
import { NotifyClient, Principal } from '@lodestar/security';
import { canReadPhoto, canUploadPhoto, MAX_PHOTO_BYTES, PhotoStop, PodPhotoService, sniffMime, validatePhoto } from './pod-photos';
import { PodPhotosController } from './pod-photos.controller';
import { SyncService } from './sync.service';

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('a small jpeg body')]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('png')]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

const principal = (over: Partial<Principal>): Principal => ({ sub: 'u1', roles: [], scopes: [], depots: [], isService: false, claims: {}, ...over }) as Principal;
const driver = principal({ sub: 'kasun', roles: ['driver'], vehicleId: 'VEH057' });
const otherDriver = principal({ sub: 'other', roles: ['driver'], vehicleId: 'VEH099' });
const dispatcher = principal({ sub: 'nilanthi', roles: ['dispatcher'], depots: ['KANDY'] });
const otherDispatcher = principal({ sub: 'x', roles: ['dispatcher'], depots: ['PELIYAGODA'] });
const manager = principal({ sub: 'fathima', roles: ['store_manager'], outletId: 'OUT106' });
const otherManager = principal({ sub: 'y', roles: ['store_manager'], outletId: 'OUT107' });
const loader = principal({ sub: 'z', roles: ['loader'], depots: ['KANDY'] });

const STOP: PhotoStop = { id: 'S1', tripId: 'T1', orderId: 'ORD1', outletId: 'OUT106', trip: { depot: 'KANDY', vehicleId: 'VEH057' } };

/** In-memory trips.PodPhoto / TripStop / POD, enough for the photo service. */
function fakePrisma() {
  const photos: any[] = [];
  const pods: any[] = [];
  let n = 0;
  const match = (row: any, where: any): boolean =>
    Object.entries(where ?? {}).every(([k, v]) => (k === 'OR' ? (v as any[]).some((w) => match(row, w)) : row[k] === v));
  const pick = (row: any, select: any) => (select ? Object.fromEntries(Object.keys(select).filter((k) => k !== 'tripStop').map((k) => [k, row[k]])) : row);
  const prisma: any = {
    tripStop: {
      findFirst: jest.fn(async ({ where }: any) => (match(STOP, where) || (where.stopSeq === 1 && where.tripId === 'T1') ? STOP : null)),
    },
    pOD: {
      findUnique: jest.fn(async ({ where }: any) => pods.find((p) => p.tripStopId === where.tripStopId) ?? null),
      update: jest.fn(async ({ where, data }: any) => Object.assign(pods.find((p) => p.id === where.id), data)),
    },
    podPhoto: {
      findFirst: jest.fn(async ({ where, select }: any) => {
        const r = photos.find((p) => match(p, where));
        return r ? pick(r, select) : null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const r = photos.find((p) => p.id === where.id);
        return r ? { ...r, tripStop: STOP } : null;
      }),
      findMany: jest.fn(async ({ where, select }: any) => photos.filter((p) => match(p, where)).reverse().map((r) => pick(r, select))),
      create: jest.fn(async ({ data, select }: any) => {
        if (photos.some((p) => (p.tripStopId === data.tripStopId && p.sha256 === data.sha256) || (data.eventId && p.eventId === data.eventId))) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const row = { id: `photo${++n}xxxxxxxx`, createdAt: new Date(), podId: null, ...data };
        photos.push(row);
        return pick(row, select);
      }),
      updateMany: jest.fn(async ({ where, data }: any) => photos.filter((p) => match(p, where)).forEach((p) => Object.assign(p, data))),
    },
  };
  return { prisma, photos, pods };
}

describe('POD photos', () => {
  describe('validation', () => {
    it('knows JPEG, PNG and WebP by their magic bytes', () => {
      expect(sniffMime(JPEG)).toBe('image/jpeg');
      expect(sniffMime(PNG)).toBe('image/png');
      expect(sniffMime(WEBP)).toBe('image/webp');
      expect(sniffMime(Buffer.from('GIF89a....'))).toBeNull();
    });

    it('refuses an empty body, a non-image, a mislabelled image and anything over 3 MB', () => {
      const status = (fn: () => unknown) => {
        try {
          fn();
        } catch (e) {
          return (e as ODataError).status;
        }
        return 200;
      };
      expect(status(() => validatePhoto(undefined))).toBe(415);
      expect(status(() => validatePhoto({}))).toBe(415);
      expect(status(() => validatePhoto(Buffer.from('<svg onload=alert(1)>'), 'image/jpeg'))).toBe(415);
      expect(status(() => validatePhoto(PNG, 'image/jpeg'))).toBe(415);
      const big = Buffer.alloc(MAX_PHOTO_BYTES + 1);
      JPEG.copy(big);
      expect(status(() => validatePhoto(big, 'image/jpeg'))).toBe(413);
      expect(validatePhoto(JPEG, 'image/jpeg; q=1')).toEqual({ bytes: JPEG, mime: 'image/jpeg', sha256: sha(JPEG) });
      expect(validatePhoto(WEBP, 'application/octet-stream').mime).toBe('image/webp');
    });
  });

  describe('permissions', () => {
    it('only the driver of the trip (or admin) uploads', () => {
      expect(canUploadPhoto(driver, STOP)).toBe(true);
      expect(canUploadPhoto(principal({ roles: ['admin'] }), STOP)).toBe(true);
      for (const p of [otherDriver, dispatcher, manager, loader]) expect(canUploadPhoto(p, STOP)).toBe(false);
    });

    it("the depot's dispatchers and the stop's store manager read; others do not", () => {
      for (const p of [driver, dispatcher, manager]) expect(canReadPhoto(p, STOP)).toBe(true);
      for (const p of [otherDriver, otherDispatcher, otherManager, loader]) expect(canReadPhoto(p, STOP)).toBe(false);
    });
  });

  describe('PodPhotoService', () => {
    it('stores a photo once per stop and SHA-256, links it to the POD, and serves it only to allowed readers', async () => {
      const { prisma, photos, pods } = fakePrisma();
      pods.push({ id: 'POD1', tripStopId: 'S1', photoCount: 0, photoUrl: null });
      const svc = new PodPhotoService(prisma);
      const first = await svc.store({ stop: STOP, bytes: JPEG, declaredMime: 'image/jpeg', eventId: 'evt-photo-1', uploadedBy: 'kasun' });
      expect(first.duplicate).toBe(false);
      expect(first.photo).toMatchObject({ mime: 'image/jpeg', size: JPEG.length, sha256: sha(JPEG), url: `/media/pod-photos/${first.photo.id}` });
      // a replay (same event, or the same bytes under another id) stores nothing new
      expect((await svc.store({ stop: STOP, bytes: JPEG, eventId: 'evt-photo-1', uploadedBy: 'kasun' })).duplicate).toBe(true);
      expect((await svc.store({ stop: STOP, bytes: JPEG, eventId: 'evt-photo-2', uploadedBy: 'kasun' })).duplicate).toBe(true);
      expect(photos).toHaveLength(1);
      expect(photos[0].podId).toBe('POD1');
      expect(pods[0]).toMatchObject({ photoCount: 1, photoUrl: first.photo.url });

      await expect(svc.read(manager, first.photo.id)).resolves.toMatchObject({ mime: 'image/jpeg', bytes: JPEG });
      await expect(svc.read(otherManager, first.photo.id)).rejects.toMatchObject({ status: 404 });
      await expect(svc.read(dispatcher, 'nope')).rejects.toMatchObject({ status: 404 });
      await expect(svc.list(dispatcher, STOP)).resolves.toHaveLength(1);
      await expect(svc.list(otherDispatcher, STOP)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('upload endpoint', () => {
    const req = (body: unknown) => ({ body }) as any;
    const res = () => ({ status: jest.fn(), setHeader: jest.fn() }) as any;

    it("refuses another vehicle's driver and records only metadata for the audit", async () => {
      const { prisma, photos } = fakePrisma();
      const ctl = new PodPhotosController(new PodPhotoService(prisma));
      const r = req(JPEG);
      await expect(ctl.upload(otherDriver, r, res(), { stopId: 'S1' }, 'image/jpeg')).rejects.toMatchObject({ status: 403 });
      expect(Buffer.isBuffer(r.body)).toBe(false);
      expect(r.body).toMatchObject({ stopId: 'S1', bytes: JPEG.length });
      expect(photos).toHaveLength(0);
    });

    it('stores the driver\'s photo (201) and answers a replay with 200 duplicate', async () => {
      const { prisma } = fakePrisma();
      const ctl = new PodPhotosController(new PodPhotoService(prisma));
      const r1 = res();
      const a = await ctl.upload(driver, req(JPEG), r1, { orderId: 'ORD1', takenAt: '2026-04-07T05:10:00Z' }, 'image/jpeg', 'evt-photo-1');
      expect(a).toMatchObject({ duplicate: false, sha256: sha(JPEG) });
      expect(r1.status).not.toHaveBeenCalled();
      const r2 = res();
      const b = await ctl.upload(driver, req(JPEG), r2, { orderId: 'ORD1' }, 'image/jpeg', 'evt-photo-1');
      expect(b).toMatchObject({ duplicate: true, id: a.id });
      expect(r2.status).toHaveBeenCalledWith(200);
    });

    it('rejects a body that is not an image', async () => {
      const { prisma } = fakePrisma();
      const ctl = new PodPhotosController(new PodPhotoService(prisma));
      await expect(ctl.upload(driver, req(Buffer.from('%PDF-1.7')), res(), { stopId: 'S1' }, 'image/jpeg')).rejects.toMatchObject({ status: 415 });
    });
  });

  describe('PHOTO sync events', () => {
    function syncWith() {
      const { prisma, photos, pods } = fakePrisma();
      const events = new Map<string, any>();
      prisma.offlineEvent = {
        findUnique: jest.fn(async ({ where }: any) => events.get(where.id) ?? null),
        create: jest.fn(async ({ data }: any) => {
          events.set(data.id, data);
          return data;
        }),
      };
      prisma.trip = { findUnique: jest.fn(async () => ({ id: 'T1', vehicleId: 'VEH057', depot: 'KANDY' })) };
      const notify = { notice: jest.fn(), publish: jest.fn() } as unknown as NotifyClient;
      const svc = new SyncService(prisma, notify, new PodPhotoService(prisma));
      return { svc, photos, pods, events };
    }
    const photoEvent = (id: string, payload: any) => ({ id, tripId: 'T1', eventType: 'PHOTO' as const, payload, savedAt: '2026-04-07T05:10:00+05:30' });

    it('stores an inline photo once: a replayed batch is a DUPLICATE and the event log keeps no image', async () => {
      const { svc, photos, pods, events } = syncWith();
      pods.push({ id: 'POD1', tripStopId: 'S1', photoCount: 0 });
      const batch = svc.validate([photoEvent('evt-photo-1', { orderId: 'ORD1', mime: 'image/jpeg', dataBase64: `data:image/jpeg;base64,${JPEG.toString('base64')}` })]);
      const a = await svc.pushBatch(driver, batch);
      expect(a).toMatchObject({ synced: 1, duplicates: 0 });
      expect(photos).toHaveLength(1);
      expect(pods[0].photoCount).toBe(1);
      expect(events.get('evt-photo-1').payload).toMatchObject({ sha256: sha(JPEG), photoId: photos[0].id });
      expect(JSON.stringify(events.get('evt-photo-1').payload)).not.toContain(JPEG.toString('base64'));

      const again = await svc.pushBatch(driver, svc.validate([photoEvent('evt-photo-1', { orderId: 'ORD1', dataBase64: JPEG.toString('base64') })]));
      expect(again).toMatchObject({ synced: 0, duplicates: 1 });
      // the same photo under a new event id (re-queued on the phone) is not stored twice either
      await svc.pushBatch(driver, svc.validate([photoEvent('evt-photo-2', { orderId: 'ORD1', dataBase64: JPEG.toString('base64') })]));
      expect(photos).toHaveLength(1);
    });

    it('links an uploaded photo named by its SHA-256, and refuses a bad inline image at validation', async () => {
      const { svc, photos } = syncWith();
      const { svc: upload } = { svc: new PodPhotoService((svc as any).prisma) };
      await upload.store({ stop: STOP, bytes: PNG, uploadedBy: 'kasun' });
      const r = await svc.pushBatch(driver, svc.validate([photoEvent('evt-photo-3', { stopSeq: 1, sha256: sha(PNG) })]));
      expect(r.synced).toBe(1);
      expect(photos).toHaveLength(1);
      expect(() => svc.validate([photoEvent('evt-photo-4', { orderId: 'ORD1', dataBase64: Buffer.from('not an image').toString('base64') })])).toThrow(/dataBase64/);
      expect(() => svc.validate([photoEvent('evt-photo-5', { sha256: 'xyz' })])).toThrow(/sha256/);
    });

    it("refuses a photo for another vehicle's trip", async () => {
      const { svc, photos } = syncWith();
      const r = await svc.pushBatch(otherDriver, svc.validate([photoEvent('evt-photo-6', { orderId: 'ORD1', dataBase64: JPEG.toString('base64') })]));
      expect(r.rejected).toBe(1);
      expect(photos).toHaveLength(0);
    });
  });
});
