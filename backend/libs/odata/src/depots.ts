import { ODataError } from './errors';

/** The slice of the Prisma client the depot checks need (any service's client reaches outlets.Depot). */
interface DepotLookup {
  depot: { findUnique(args: { where: { code: string }; select: { code: true; isActive: true } }): Promise<{ code: string; isActive: boolean } | null> };
}

/** A depot code as stored: upper-case letters, digits and _ (PELIYAGODA, KANDY, GALLE_2). */
export const DEPOT_CODE = /^[A-Z][A-Z0-9_]{1,31}$/;

/**
 * Checks a depot code given as input against the Depots registry (ADM-21) and returns it normalised to
 * upper case. `active` (default) also refuses a deactivated depot: new outlets, vehicles, people and plans
 * go only to depots in service, while reads of past days may name a depot that has since closed.
 */
export async function assertDepotCode(prisma: DepotLookup, value: unknown, opts: { field?: string; active?: boolean } = {}): Promise<string> {
  const field = opts.field ?? 'depot';
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!DEPOT_CODE.test(code)) throw ODataError.badRequest(`${field} must be a depot code`, field);
  const row = await prisma.depot.findUnique({ where: { code }, select: { code: true, isActive: true } });
  if (!row) throw ODataError.badRequest(`Unknown depot '${code}'`, field);
  if ((opts.active ?? true) && !row.isActive) throw ODataError.badRequest(`Depot '${code}' is deactivated`, field);
  return code;
}
