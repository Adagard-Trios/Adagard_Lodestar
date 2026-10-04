import { Controller, Get, Headers, HttpCode, Param, Post, Query, Req, Res } from '@nestjs/common';
import { raw, type NextFunction, type Request, type Response } from 'express';
import { ODataError } from '@lodestar/odata';
import { Allow, CurrentPrincipal, HUMAN_ROLES, Principal, Roles } from '@lodestar/security';
import { canUploadPhoto, MAX_PHOTO_BYTES, PHOTO_MIMES, PodPhotoService, podMediaKind, SIGNATURE_MIME } from './pod-photos';

/**
 * Raw image bodies for POST /pod-photos only (the JSON parser ignores image types). A little above the limit so
 * the handler answers an oversize photo with the OData 413, not the parser's.
 */
const rawImage = raw({ type: [...PHOTO_MIMES, SIGNATURE_MIME, 'application/octet-stream'], limit: MAX_PHOTO_BYTES + 64 * 1024 });
export function podPhotoBody(req: Request, res: Response, next: NextFunction) {
  rawImage(req, res, (err?: any) => {
    if (err?.type === 'entity.too.large') return next(new ODataError(413, 'PayloadTooLarge', `A photo may be at most ${MAX_PHOTO_BYTES / 1024 / 1024} MB`));
    next(err);
  });
}

/**
 * Proof-of-delivery photos, behind the gateway at /media/pod-photos (nginx strips /media):
 *   POST /pod-photos?stopId=…|orderId=…[&tripId=…]&takenAt=…   body: the JPEG/PNG/WebP (≤ 3 MB), Idempotency-Key: outbox id
 *        &kind=SIGNATURE: the receiver's signature instead, an image/svg+xml (≤ 64 KB) rebuilt from its path data only
 *        → 201 {id, url, sha256, …} (200 with duplicate: true for a photo the stop already has)
 *   GET  /pod-photos/:id      → the image (driver of the trip, the depot's dispatchers, the store's manager)
 *   GET  /pod-photos?stopId=… → {value: [{id, url, mime, size, takenAt, …}]}
 * Uploads are audited (the global audit interceptor; the body is recorded as its size and SHA-256, never the bytes).
 */
@Controller('pod-photos')
export class PodPhotosController {
  constructor(private readonly photos: PodPhotoService) {}

  @Post()
  @Allow(Roles.Driver, Roles.Admin, Roles.Service)
  @HttpCode(201)
  async upload(
    @CurrentPrincipal() p: Principal,
    @Req() req: Request & { auditInfo?: unknown },
    @Res({ passthrough: true }) res: Response,
    @Query() q: Record<string, string | undefined>,
    @Headers('content-type') contentType?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const bytes = req.body;
    // what the audit log keeps of this request: never the image itself
    req.body = { stopId: q.stopId, orderId: q.orderId, tripId: q.tripId, kind: q.kind, contentType, bytes: Buffer.isBuffer(bytes) ? bytes.length : 0 };
    const kind = podMediaKind(q.kind);
    const stop = await this.photos.findStop({ stopId: q.stopId, orderId: q.orderId, tripId: q.tripId });
    if (!canUploadPhoto(p, stop)) throw ODataError.forbidden('Only the driver of this trip can add its photos');
    const { photo, duplicate } = await this.photos.store({
      stop, bytes, declaredMime: contentType, takenAt: q.takenAt, eventId: idempotencyKey ?? q.eventId, uploadedBy: p.sub, kind,
    });
    req.body = { ...(req.body as object), sha256: photo.sha256 };
    req.auditInfo = { action: 'UploadPodPhoto', entitySet: 'PodPhotos', entityKey: photo.id };
    if (duplicate) res.status(200);
    res.setHeader('Location', photo.url);
    return { ...photo, duplicate };
  }

  @Get()
  @Allow(...HUMAN_ROLES, Roles.Service)
  async list(@CurrentPrincipal() p: Principal, @Query('stopId') stopId?: string, @Query('orderId') orderId?: string) {
    const stop = await this.photos.findStop({ stopId, orderId });
    return { value: await this.photos.list(p, stop) };
  }

  @Get(':id')
  @Allow(...HUMAN_ROLES, Roles.Service)
  async read(@CurrentPrincipal() p: Principal, @Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const photo = await this.photos.read(p, id);
    const etag = `"${photo.sha256}"`;
    res.setHeader('Cache-Control', 'private, max-age=86400, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // a signature is SVG: even sanitised, never let it run anything if opened directly
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Content-Disposition', `inline; filename="${id}.${photo.mime.split('/')[1].replace('+xml', '')}"`);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.status(200).type(photo.mime).setHeader('Content-Length', String(photo.size));
    res.end(photo.bytes);
  }
}
