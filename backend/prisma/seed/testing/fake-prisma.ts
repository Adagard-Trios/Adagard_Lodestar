/**
 * In-memory stand-in for the PrismaClient delegates the seed uses.
 * Test-only. Supports the subset of `where` the seed writes: equality
 * (Dates by value), compound unique keys ({ brand_dockType: {...} }),
 * `in` and `notIn`. No relations or cascades.
 */

type Row = Record<string, any>;

const eq = (a: unknown, b: unknown) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

export function matches(row: Row, where: Row): boolean {
  for (const [k, cond] of Object.entries(where)) {
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond) {
        if (!(cond.in as unknown[]).some((x) => eq(x, row[k]))) return false;
      } else if ('notIn' in cond) {
        if ((cond.notIn as unknown[]).some((x) => eq(x, row[k]))) return false;
      } else if (!matches(row, cond)) {
        return false; // compound unique key
      }
    } else if (!eq(row[k], cond)) {
      return false;
    }
  }
  return true;
}

export class FakeModel {
  rows: Row[] = [];
  private seq = 0;
  /** Set to make the next update() reject (e.g. a failing id change). */
  failNextUpdate: Error | null = null;

  constructor(private readonly name: string) {}

  private find(where: Row) {
    return this.rows.find((r) => matches(r, where));
  }

  async findUnique({ where }: { where: Row }) {
    const r = this.find(where);
    return r ? { ...r } : null;
  }
  async findFirst({ where }: { where: Row }) {
    return this.findUnique({ where });
  }
  async create({ data }: { data: Row }) {
    const row = { id: `${this.name}-cuid-${++this.seq}`, ...data };
    this.rows.push(row);
    return { ...row };
  }
  async update({ where, data }: { where: Row; data: Row }) {
    if (this.failNextUpdate) {
      const e = this.failNextUpdate;
      this.failNextUpdate = null;
      throw e;
    }
    const r = this.find(where);
    if (!r) throw new Error(`${this.name}.update: record not found`);
    Object.assign(r, data);
    return { ...r };
  }
  async upsert({ where, create, update }: { where: Row; create: Row; update: Row }) {
    const r = this.find(where);
    if (r) {
      Object.assign(r, update);
      return { ...r };
    }
    return this.create({ data: create });
  }
  async deleteMany({ where }: { where: Row }) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => !matches(r, where));
    return { count: before - this.rows.length };
  }
}

const MODELS = [
  'user', 'device', 'outlet', 'vehicle', 'calendar', 'districtTravel', 'serviceAllowance', 'plan',
  'order', 'orderLineItem', 'trip', 'tripStop', 'pOD', 'loadRecord', 'offlineEvent', 'deferralLog',
] as const;

export type FakePrisma = Record<(typeof MODELS)[number], FakeModel>;

export function fakePrisma(): FakePrisma {
  const db = {} as FakePrisma;
  for (const m of MODELS) db[m] = new FakeModel(m);
  return db;
}

/** Row counts per model, for idempotency assertions. */
export function counts(db: FakePrisma): Record<string, number> {
  return Object.fromEntries(Object.entries(db).map(([k, m]) => [k, m.rows.length]));
}
