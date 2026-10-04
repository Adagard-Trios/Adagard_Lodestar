/** Public path of a stored proof-of-delivery photo behind the gateway (GET with a bearer token). */
export const podPhotoUrl = (id: string) => `/media/pod-photos/${id}`;

type LinkPrisma = {
  pOD: { findUnique(a: any): Promise<{ id: string } | null>; update(a: any): Promise<unknown> };
  podPhoto: { findMany(a: any): Promise<{ id: string; kind?: string | null; takenAt?: Date | null; createdAt?: Date }[]>; updateMany(a: any): Promise<unknown> };
};

/**
 * Links a stop's photos (trips.PodPhoto) to its POD once both exist: podId on each photo, and on the POD the
 * number of photos and the newest one's URL, and the newest receiver signature (kind SIGNATURE) as signatureUrl and
 * signedAt. Photos and PODs reach the server in either order (offline outbox), so both writers call this.
 */
export async function linkPodPhotos(prisma: LinkPrisma, tripStopId: string): Promise<void> {
  const pod = await prisma.pOD.findUnique({ where: { tripStopId }, select: { id: true } });
  if (!pod) return;
  const all = await prisma.podPhoto.findMany({ where: { tripStopId }, select: { id: true, kind: true, takenAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  if (!all.length) return;
  await prisma.podPhoto.updateMany({ where: { tripStopId, podId: null }, data: { podId: pod.id } });
  const photos = all.filter(r => (r.kind ?? 'PHOTO') !== 'SIGNATURE');
  const signature = all.find(r => r.kind === 'SIGNATURE');
  await prisma.pOD.update({
    where: { id: pod.id },
    data: {
      ...(photos.length ? { photoCount: photos.length, photoUrl: podPhotoUrl(photos[0].id) } : {}),
      ...(signature ? { signatureUrl: podPhotoUrl(signature.id), signedAt: signature.takenAt ?? signature.createdAt ?? new Date() } : {}),
    },
  });
}
