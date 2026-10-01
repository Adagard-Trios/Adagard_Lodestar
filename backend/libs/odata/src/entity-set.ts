import 'reflect-metadata';
import type { AbacRules, Principal, Role, Where } from '@lodestar/security';

/**
 * Declaring entity sets
 * ─────────────────────
 * Each service declares its OData surface with classes:
 *
 *   @EntitySet({ name: 'Plans', model: 'Plan', read: [...], abac: {...} })
 *   export class PlansSet extends ODataEntitySet {
 *     constructor(prisma: PrismaService, private planning: PlanningService) { super(prisma); }
 *
 *     @ODataAction({ name: 'Approve', binding: 'entity', roles: [Roles.Dispatcher] })
 *     approve(ctx: OperationContext) { ... }
 *   }
 *
 * and registers them with ODataModule.forRoot({ service: 'planning', entitySets: [PlansSet] }).
 * The generic controller then serves collection/entity reads, POST/PATCH,
 * $metadata and the Lodestar.* operations with RBAC, ABAC, ETags and audit.
 */

export const ENTITY_SET_KEY = 'odata:entity-set';
export const OPERATIONS_KEY = 'odata:operations';

export interface EntitySetOptions {
  /** Entity set name (PascalCase plural), e.g. Orders */
  name: string;
  /** Prisma model name, e.g. Order */
  model: string;
  /** Roles that may read (GET). */
  read: Role[];
  /** Roles that may POST new entities (omit = read-only set). */
  create?: Role[];
  /** Roles that may PATCH (omit = no PATCH). */
  update?: Role[];
  /** Row-level filters from token claims, ANDed into every query. */
  abac: AbacRules;
  /** Navigation properties that may be expanded / used in filters. */
  navigation?: string[];
  /** Fields searched by $search. */
  search?: string[];
  /** Fields never exposed (in addition to the global hidden list). */
  hidden?: string[];
  /** Fields a client may set on POST. */
  insertable?: string[];
  /** Fields a client may change on PATCH. */
  updatable?: string[];
  /** Default $orderby, e.g. 'runDate desc,id' */
  defaultOrderBy?: string;
}

export interface ParamSpec {
  type: string; // Edm.String, Edm.Int32, Edm.Double, Edm.Boolean, Edm.Date, Edm.DateTimeOffset, Lodestar.<Enum>, Collection(...), Edm.Untyped
  required?: boolean;
}

export interface OperationOptions {
  name: string;
  binding: 'entity' | 'collection' | 'unbound';
  roles: Role[];
  params?: Record<string, string | ParamSpec>;
  /** EDM return type: Lodestar.Plan, Collection(Lodestar.Order), Lodestar.ChainCheck, Edm.String… */
  returns?: string;
}

export interface OperationMeta extends OperationOptions {
  kind: 'action' | 'function';
  method: string | symbol;
}

/** What an operation handler receives. */
export interface OperationContext<E = any> {
  principal: Principal;
  params: Record<string, any>;
  /** Entity-bound operations: the key and the entity, loaded through the caller's row filter */
  key?: Record<string, unknown>;
  entity?: E;
  /** Collection-bound operations: the caller's ABAC row filter for the binding set */
  rowFilter?: Where;
  headers: Record<string, string | string[] | undefined>;
}

/** Context for write hooks. */
export interface WriteContext {
  principal: Principal;
  headers: Record<string, string | string[] | undefined>;
}

export function EntitySet(options: EntitySetOptions): ClassDecorator {
  return (target) => Reflect.defineMetadata(ENTITY_SET_KEY, options, target);
}

function operation(kind: 'action' | 'function', options: OperationOptions): MethodDecorator {
  return (target, method) => {
    const ctor = target.constructor;
    const list: OperationMeta[] = [...(Reflect.getMetadata(OPERATIONS_KEY, ctor) ?? [])];
    list.push({ ...options, kind, method });
    Reflect.defineMetadata(OPERATIONS_KEY, list, ctor);
  };
}

/** A Lodestar.* action (POST). */
export const ODataAction = (options: OperationOptions) => operation('action', options);

/** A Lodestar.* function (GET, no side effects). */
export const ODataFunction = (options: OperationOptions) => operation('function', options);

export function entitySetOptions(cls: Function): EntitySetOptions | undefined {
  return Reflect.getMetadata(ENTITY_SET_KEY, cls);
}

export function operationsOf(cls: Function): OperationMeta[] {
  return Reflect.getMetadata(OPERATIONS_KEY, cls) ?? [];
}

/** Minimal shape of a Prisma model delegate used by the default handler. */
export interface ModelDelegate {
  findMany(args: any): Promise<any[]>;
  findFirst(args: any): Promise<any | null>;
  count(args: any): Promise<number>;
  create(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
}

/**
 * Base class of an entity set: Prisma-backed data access plus write hooks.
 * Override the hooks for domain rules (defaults, ABAC on create, validation),
 * or the data methods for sets backed by something else.
 */
export class ODataEntitySet {
  constructor(protected readonly prisma: any) {}

  get options(): EntitySetOptions {
    return entitySetOptions(this.constructor)!;
  }

  protected get delegate(): ModelDelegate {
    const m = this.options.model;
    const d = this.prisma?.[m.charAt(0).toLowerCase() + m.slice(1)];
    if (!d) throw new Error(`Prisma delegate for model ${m} not found`);
    return d;
  }

  findMany(args: { where?: Where; select?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]> {
    return this.delegate.findMany(args);
  }

  findFirst(args: { where?: Where; select?: any }): Promise<any | null> {
    return this.delegate.findFirst(args);
  }

  count(where?: Where): Promise<number> {
    return this.delegate.count({ where });
  }

  /** Called with validated POST data; return the data to insert. Throw ODataError to reject. */
  async beforeCreate(data: Record<string, any>, _ctx: WriteContext): Promise<Record<string, any>> {
    return data;
  }

  /** Inserts; must return the created row (at least its key fields). */
  async create(data: Record<string, any>, _ctx: WriteContext): Promise<any> {
    return this.delegate.create({ data });
  }

  /** Called with validated PATCH data and the current row; return the data to write. */
  async beforeUpdate(patch: Record<string, any>, _current: any, _ctx: WriteContext): Promise<Record<string, any>> {
    return patch;
  }

  /** Conditional update (key + ETag in `where`); returns the number of rows changed. */
  async updateWhere(where: Where, data: Record<string, any>): Promise<number> {
    return (await this.delegate.updateMany({ where, data })).count;
  }
}
