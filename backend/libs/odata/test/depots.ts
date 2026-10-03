/** A Prisma `depot` delegate for unit tests: the two seeded depots, both active (ADM-21 registry). */
export const depotDelegate = (codes: string[] = ['PELIYAGODA', 'KANDY']) => ({
  findUnique: async ({ where }: { where: { code: string } }) => (codes.includes(where.code) ? { code: where.code, isActive: true } : null),
});
