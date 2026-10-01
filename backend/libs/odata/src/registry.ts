import { EdmEntityType, EdmModel } from './edm/model';
import { CsdlOperation } from './edm/csdl';
import { EntitySetOptions, ODataEntitySet, OperationContext, OperationMeta, entitySetOptions, operationsOf } from './entity-set';
import { normaliseSpec } from './params';
import { OrderByItem, splitTopLevel } from './query/options';

export interface RegisteredOperation {
  meta: OperationMeta;
  /** Set the operation is bound to (undefined for unbound) */
  set?: RegisteredSet;
  invoke(ctx: OperationContext): Promise<unknown>;
}

export interface RegisteredSet {
  options: EntitySetOptions;
  type: EdmEntityType;
  handler: ODataEntitySet;
  operations: RegisteredOperation[];
  defaultOrderBy?: OrderByItem[];
}

/** Hidden in every service: credentials never leave the database. */
export const GLOBAL_HIDDEN: Record<string, string[]> = {
  User: ['passwordHash', 'refreshToken'],
};

function parseDefaultOrder(text?: string): OrderByItem[] | undefined {
  if (!text) return undefined;
  return splitTopLevel(text, ',').map((item) => {
    const [path, dir] = item.trim().split(/\s+/);
    return { path: path.split('/'), direction: dir === 'desc' ? 'desc' : 'asc' };
  });
}

/**
 * The entity sets and operations one service exposes, resolved from the
 * decorated classes. Built once at startup by ODataModule.
 */
export class ODataRegistry {
  readonly sets = new Map<string, RegisteredSet>();
  readonly unbound = new Map<string, RegisteredOperation>();

  constructor(
    readonly service: string,
    readonly model: EdmModel,
    handlers: ODataEntitySet[],
    operationProviders: object[] = [],
  ) {
    for (const handler of handlers) {
      const options = entitySetOptions(handler.constructor);
      if (!options) throw new Error(`${handler.constructor.name} is missing @EntitySet`);
      const type = model.entityTypes.get(options.model);
      if (!type) throw new Error(`Entity set ${options.name}: unknown Prisma model ${options.model}`);
      const set: RegisteredSet = {
        options,
        type,
        handler,
        operations: [],
        defaultOrderBy: parseDefaultOrder(options.defaultOrderBy),
      };
      for (const meta of operationsOf(handler.constructor)) {
        const op = this.bind(meta, handler, meta.binding === 'unbound' ? undefined : set);
        if (meta.binding === 'unbound') this.addUnbound(op);
        else set.operations.push(op);
      }
      this.sets.set(options.name, set);
    }
    for (const provider of operationProviders) {
      for (const meta of operationsOf(provider.constructor)) {
        if (meta.binding !== 'unbound') throw new Error(`${meta.name}: only unbound operations may live outside an entity set`);
        this.addUnbound(this.bind(meta, provider));
      }
    }
  }

  /** Hidden fields per type for this service: global list plus each set's own. */
  hiddenFields(): Record<string, string[]> {
    const hidden: Record<string, string[]> = {};
    for (const [t, f] of Object.entries(GLOBAL_HIDDEN)) hidden[t] = [...f];
    for (const s of this.sets.values()) {
      if (s.options.hidden?.length) hidden[s.type.name] = [...(hidden[s.type.name] ?? []), ...s.options.hidden];
    }
    return hidden;
  }

  /** Operations in CSDL form, for $metadata. */
  csdlOperations(): CsdlOperation[] {
    const all = [...[...this.sets.values()].flatMap((s) => s.operations), ...this.unbound.values()];
    return all.map((op) => ({
      name: op.meta.name,
      kind: op.meta.kind,
      binding: op.meta.binding,
      bindingType: op.set?.type.name,
      params: Object.fromEntries(Object.entries(op.meta.params ?? {}).map(([k, v]) => [k, normaliseSpec(v)])),
      returns: op.meta.returns,
    }));
  }

  private addUnbound(op: RegisteredOperation) {
    if (this.unbound.has(op.meta.name)) throw new Error(`Duplicate unbound operation ${op.meta.name}`);
    this.unbound.set(op.meta.name, op);
  }

  private bind(meta: OperationMeta, target: object, set?: RegisteredSet): RegisteredOperation {
    const fn = (target as any)[meta.method];
    if (typeof fn !== 'function') throw new Error(`Operation ${meta.name}: method ${String(meta.method)} missing`);
    return { meta, set, invoke: async (ctx) => fn.call(target, ctx) };
  }
}

export { entitySetOptions };
