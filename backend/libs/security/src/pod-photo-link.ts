/** Public path of a stored proof-of-delivery photo behind the gateway (GET with a bearer token). */
export const podPhotoUrl = (id: string) => `/media/pod-photos/${id}`;

type LinkPrisma = {
  pOD: { findUnique(a: any): Promise<{ id: string } | null>; update(a: any): Promise<unknown> };
  podPhoto: { findMany(a: any): Promise<{ id: string }[]>; updateMany(a: any): Promise<unknown> };
};

/**
 * Links a stop's photos (trips.PodPhoto) to its POD once both exist: podId on each photo, and on the POD the
 * number of photos and the newest one's URL. Photos and PODs reach the server in either order (offline outbox),
 * so both writers call this.
 */
export async function linkPodPhotos(prisma: LinkPrisma, tripStopId: string): Promise<void> {
  const pod = await prisma.pOD.findUnique({ where: { tripStopId }, select: { id: true } });
  if (!pod) return;
  const photos = await prisma.podPhoto.findMany({ where: { tripStopId }, select: { id: true }, orderBy: { createdAt: 'desc' } });
  if (!photos.length) return;
  await prisma.podPhoto.updateMany({ where: { tripStopId, podId: null }, data: { podId: pod.id } });
  await prisma.pOD.update({ where: { id: pod.id }, data: { photoCount: photos.length, photoUrl: podPhotoUrl(photos[0].id) } });
}
