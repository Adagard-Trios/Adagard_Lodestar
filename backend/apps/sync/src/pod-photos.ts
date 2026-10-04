import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import { canAccessDepot, isPrivileged, linkPodPhotos, podPhotoUrl, Principal, Roles } from '@lodestar/security';

/** Largest photo the server keeps (the phone compresses well below this). */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PhotoMime = (typeof PHOTO_MIMES)[number];

/** What an upload is: the photo of the drop, or the receiver's signature (an SVG drawn on the phone, DR-03 / DR-20). */
export const POD_MEDIA_KINDS = ['PHOTO', 'SIGNATURE'] as const;
export type PodMediaKind = (typeof POD_MEDIA_KINDS)[number];
export const SIGNATURE_MIME = 'image/svg+xml';
/** Largest signature SVG accepted (a few strokes of path data are a few KB). */
export const MAX_SIGNATURE_BYTES = 64 * 1024;
const MAX_SIGNATURE_PATHS = 64;

/** The kind named by the client (absent = PHOTO); anything else is a 400. */
export function podMediaKind(raw?: string | null): PodMediaKind {
  if (raw === undefined || raw === null || raw === '') return 'PHOTO';
  const k = String(raw).toUpperCase();
  if (!(POD_MEDIA_KINDS as readonly string[]).includes(k)) throw ODataError.badRequest(`kind must be one of ${POD_MEDIA_KINDS.join(', ')}`, 'kind');
  return k as PodMediaKind;
}

const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`;
/** Path data with only move / line / curve / close commands and numbers: nothing that can reference or script. */
const PATH_DATA = /^[MLHVCSQTZmlhvcsqtz0-9eE.,\s+-]{1,20000}$/;
const VIEWBOX = new RegExp(String.raw`^\s*(${NUM})[\s,]+(${NUM})[\s,]+(${NUM})[\s,]+(${NUM})\s*$`, 'i');

/**
 * Checks a signature SVG and rebuilds it from scratch: only the viewBox numbers and the `d` of each <path> are
 * kept (each matched against a strict pattern); every other element, attribute, entity, script, style, link or
 * foreign content is dropped. What is stored is the server's own markup, never the client's.
 */
export function sanitizeSignatureSvg(bytes: unknown, declared?: string | null): { bytes: Buffer; mime: typeof SIGNATURE_MIME; sha256: string } {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    throw new ODataError(415, 'UnsupportedMediaType', `Send the signature as the request body with Content-Type ${SIGNATURE_MIME}`);
  }
  const said = declared?.split(';')[0].trim().toLowerCase();
  if (said && said !== SIGNATURE_MIME) throw new ODataError(415, 'UnsupportedMediaType', `A signature is ${SIGNATURE_MIME}, not ${said}`);
  if (bytes.length > MAX_SIGNATURE_BYTES) throw new ODataError(413, 'PayloadTooLarge', `A signature may be at most ${MAX_SIGNATURE_BYTES / 1024} KB`);
  const text = bytes.toString('utf8');
  const root = /^\s*(?:<\?xml[^>]*\?>\s*)?<svg(\s[^>]*)?>/i.exec(text);
  if (!root || !/<\/svg>\s*$/i.test(text)) throw new ODataError(415, 'UnsupportedMediaType', 'The signature is not an SVG');
  const vb = /\sviewBox\s*=\s*"([^"]*)"/i.exec(root[1] ?? '');
  const box = vb ? VIEWBOX.exec(vb[1]) : null;
  const [x, y, w, h] = box ? box.slice(1, 5).map(Number) : [0, 0, 280, 84];
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0 || w > 4096 || h > 4096) throw ODataError.badRequest('The signature viewBox is not valid', 'body');
  const paths: string[] = [];
  for (const m of text.matchAll(/<path\s(?:[^>]*?\s)?d\s*=\s*"([^"]*)"[^>]*>/gi)) {
    const d = m[1].trim();
    if (!PATH_DATA.test(d)) throw ODataError.badRequest('The signature holds something other than strokes', 'body');
    paths.push(d.replace(/\s+/g, ' '));
  }
  if (!paths.length) throw ODataError.badRequest('The signature is empty', 'body');
  if (paths.length > MAX_SIGNATURE_PATHS) throw ODataError.badRequest(`A signature may have at most ${MAX_SIGNATURE_PATHS} strokes`, 'body');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">` +
    `<g fill="none" stroke="#111522" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` +
    paths.map(d => `<path d="${d}"/>`).join('') +
    `</g></svg>`;
  const out = Buffer.from(svg, 'utf8');
  return { bytes: out, mime: SIGNATURE_MIME, sha256: createHash('sha256').update(out).digest('hex') };
}

/** Public path of a stored photo behind the gateway (GET, bearer token). */
export const photoUrl = podPhotoUrl;

/** The image type from the file's first bytes (never from what the client says), or null. */
export function sniffMime(b: Uint8Array): PhotoMime | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return 'image/png';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/** Checks a photo: present, at most MAX_PHOTO_BYTES, a JPEG/PNG/WebP by its magic bytes, matching the declared type. */
export function validatePhoto(bytes: unknown, declared?: string | null): { bytes: Buffer; mime: PhotoMime; sha256: string } {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    throw new ODataError(415, 'UnsupportedMediaType', `Send the photo as the request body with Content-Type ${PHOTO_MIMES.join(', ')}`);
  }
  if (bytes.length > MAX_PHOTO_BYTES) throw new ODataError(413, 'PayloadTooLarge', `A photo may be at most ${MAX_PHOTO_BYTES / 1024 / 1024} MB`);
  const mime = sniffMime(bytes);
  if (!mime) throw new ODataError(415, 'UnsupportedMediaType', 'Only JPEG, PNG or WebP photos are accepted');
  const said = declared?.split(';')[0].trim().toLowerCase();
  if (said && said !== 'application/octet-stream' && said !== mime) {
    throw new ODataError(415, 'UnsupportedMediaType', `The photo is ${mime}, not ${said}`);
  }
  return { bytes, mime, sha256: createHash('sha256').update(bytes).digest('hex') };
}

/** The stop a photo belongs to, with what the access checks need. */
export interface PhotoStop {
  id: string;
  tripId: string;
  orderId: string;
  outletId: string;
  trip: { depot: string | null; vehicleId: string | null };
}

const STOP_SELECT = { id: true, tripId: true, orderId: true, outletId: true, trip: { select: { depot: true, vehicleId: true } } } as const;

/** The driver of the trip's vehicle (or admin / service) may add photos. */
export function canUploadPhoto(p: Principal, stop: PhotoStop): boolean {
  if (isPrivileged(p)) return true;
  return p.roles.includes(Roles.Driver) && !!p.vehicleId && p.vehicleId === stop.trip.vehicleId;
}

/** Who sees a stop's photos: its driver, the depot's dispatchers, the store's manager (and admin / service). */
export function canReadPhoto(p: Principal, stop: PhotoStop): boolean {
  if (canUploadPhoto(p, stop)) return true;
  if (p.roles.includes(Roles.Dispatcher) && canAccessDepot(p, stop.trip.depot)) return true;
  return p.roles.includes(Roles.StoreManager) && !!p.outletId && p.outletId === stop.outletId;
}

export interface PhotoMeta {
  id: string;
  url: string;
  tripStopId: string;
  mime: string;
  size: number;
  sha256: string;
  takenAt: Date | null;
  createdAt: Date;
  /** PHOTO | SIGNATURE */
  kind: string;
}

const META_SELECT = { id: true, kind: true, tripStopId: true, mime: true, size: true, sha256: true, takenAt: true, createdAt: true } as const;
const meta = (r: Omit<PhotoMeta, 'url'>): PhotoMeta => ({ ...r, url: photoUrl(r.id) });

export interface StorePhotoInput {
  stop: PhotoStop;
  bytes: unknown;
  declaredMime?: string | null;
  takenAt?: string | Date | null;
  /** Client outbox id: the same upload sent twice is stored once. */
  eventId?: string | null;
  uploadedBy: string;
  /** PHOTO (default) or SIGNATURE: a signature must be an SVG, sanitised before it is stored. */
  kind?: PodMediaKind;
}

/**
 * Proof-of-delivery photos: stored in trips.PodPhoto (bytea), one copy per stop and SHA-256 (and per client
 * event id), linked to the stop's POD as soon as it exists (POD.photoCount, POD.photoUrl = the newest photo).
 */
@Injectable()
export class PodPhotoService {
  private readonly logger = new Logger(PodPhotoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** The stop by id, or by order (+ trip), or by trip + stop number. 404 when there is none. */
  async findStop(ref: { stopId?: string | null; orderId?: string | null; tripId?: string | null; stopSeq?: number | null }): Promise<PhotoStop> {
    let where: Record<string, unknown> | null = null;
    if (ref.stopId) where = { id: String(ref.stopId) };
    else if (ref.orderId) where = { orderId: String(ref.orderId), ...(ref.tripId ? { tripId: String(ref.tripId) } : {}) };
    else if (ref.tripId && Number.isInteger(ref.stopSeq)) where = { tripId: String(ref.tripId), stopSeq: ref.stopSeq };
    if (!where) throw ODataError.badRequest('Name the stop: stopId, orderId, or tripId and stopSeq', 'stopId');
    const stop = (await this.prisma.tripStop.findFirst({ where, select: STOP_SELECT })) as PhotoStop | null;
    if (!stop) throw ODataError.notFound('Unknown stop', 'stopId');
    return stop;
  }

  /** Stores a photo (validated) unless this stop already has it; returns its metadata and whether it was a replay. */
  async store(input: StorePhotoInput): Promise<{ photo: PhotoMeta; duplicate: boolean }> {
    const kind = input.kind ?? 'PHOTO';
    const { bytes, mime, sha256 } = kind === 'SIGNATURE' ? sanitizeSignatureSvg(input.bytes, input.declaredMime) : validatePhoto(input.bytes, input.declaredMime);
    const eventId = input.eventId && /^[\w-]{8,64}$/.test(input.eventId) ? input.eventId : null;
    const existing = await this.existing(input.stop.id, sha256, eventId);
    if (existing) return { photo: meta(existing), duplicate: true };
    const takenAt = input.takenAt ? new Date(input.takenAt) : null;
    let row: Omit<PhotoMeta, 'url'>;
    try {
      row = await this.prisma.podPhoto.create({
        data: {
          tripStopId: input.stop.id,
          kind,
          mime,
          bytes,
          size: bytes.length,
          sha256,
          eventId,
          takenAt: takenAt && !Number.isNaN(takenAt.getTime()) ? takenAt : null,
          uploadedBy: input.uploadedBy,
        },
        select: META_SELECT,
      });
    } catch (e) {
      // the same photo arrived twice at once: the other request stored it
      const raced = (e as { code?: string })?.code === 'P2002' ? await this.existing(input.stop.id, sha256, eventId) : null;
      if (raced) return { photo: meta(raced), duplicate: true };
      throw e;
    }
    await this.linkStop(input.stop.id);
    return { photo: meta(row), duplicate: false };
  }

  private existing(tripStopId: string, sha256: string, eventId: string | null) {
    return this.prisma.podPhoto.findFirst({
      where: { OR: [{ tripStopId, sha256 }, ...(eventId ? [{ eventId }] : [])] },
      select: META_SELECT,
    });
  }

  /** A stored photo of this stop by SHA-256 (a PHOTO event that names an uploaded photo). */
  async findBySha(tripStopId: string, sha256: string): Promise<PhotoMeta | null> {
    const r = await this.prisma.podPhoto.findFirst({ where: { tripStopId, sha256 }, select: META_SELECT });
    return r ? meta(r) : null;
  }

  /**
   * Links the stop's photos to its POD (if there is one yet): podId on each photo, the count and the newest
   * photo's URL on the POD. Called after a photo is stored and after a POD is saved.
   */
  linkStop(tripStopId: string): Promise<void> {
    return linkPodPhotos(this.prisma, tripStopId);
  }

  /** Best effort for callers that have already applied their own write. */
  async linkStopQuietly(tripStopId: string): Promise<void> {
    try {
      await this.linkStop(tripStopId);
    } catch (e) {
      this.logger.warn(`POD photos of ${tripStopId} not linked: ${(e as Error).message}`);
    }
  }

  /** The photo's bytes for a caller allowed to see the stop (404 for anyone else: no existence leak). */
  async read(p: Principal, id: string): Promise<{ mime: string; bytes: Buffer; sha256: string; size: number }> {
    if (!/^[\w-]{8,64}$/.test(id)) throw ODataError.notFound('Unknown photo');
    const row = await this.prisma.podPhoto.findUnique({
      where: { id },
      select: { mime: true, bytes: true, sha256: true, size: true, tripStop: { select: STOP_SELECT } },
    });
    if (!row || !canReadPhoto(p, row.tripStop as PhotoStop)) throw ODataError.notFound('Unknown photo');
    return { mime: row.mime, bytes: Buffer.from(row.bytes), sha256: row.sha256, size: row.size };
  }

  /** The stop's photos (metadata, newest first) for a caller allowed to see the stop. */
  async list(p: Principal, stop: PhotoStop): Promise<PhotoMeta[]> {
    if (!canReadPhoto(p, stop)) throw ODataError.notFound('Unknown stop', 'stopId');
    const rows = await this.prisma.podPhoto.findMany({ where: { tripStopId: stop.id }, select: META_SELECT, orderBy: { createdAt: 'desc' } });
    return rows.map(meta);
  }
}
