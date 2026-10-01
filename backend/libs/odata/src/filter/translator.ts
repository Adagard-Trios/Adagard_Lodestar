import { EdmEntityType, EdmModel, EdmProperty } from '../edm/model';
import { ODataError } from '../errors';
import { CallNode, ComparisonOp, FilterNode, LambdaNode, LiteralNode, MemberNode } from './ast';

export type Where = Record<string, any>;

/** Prisma: an empty OR matches no rows. */
export const nothing = (): Where => ({ OR: [] });

/** Policy hooks so a set can restrict what may be traversed or seen. */
export interface TranslatePolicy {
  /** May a filter/expand traverse `nav` from `from`? Default: yes. */
  canNavigate?: (from: EdmEntityType, nav: string) => boolean;
  /** Is `prop` hidden on `type` (never readable, so never filterable)? */
  isHidden?: (type: EdmEntityType, prop: string) => boolean;
}

interface Scope {
  type: EdmEntityType;
  /** lambda variables → their entity type */
  vars: Map<string, EdmEntityType>;
  inLambda: boolean;
}

interface Operand {
  /** to-one relation names to traverse before reaching the property */
  relPath: string[];
  prop: EdmProperty;
  transform?: 'lower' | 'upper';
}

const PRISMA_OP: Record<Exclude<ComparisonOp, 'eq' | 'ne'>, string> = { gt: 'gt', ge: 'gte', lt: 'lt', le: 'lte' };
const FLIP: Record<ComparisonOp, ComparisonOp> = { eq: 'eq', ne: 'ne', gt: 'lt', ge: 'le', lt: 'gt', le: 'ge' };
const STRING_FNS: Record<string, string> = { contains: 'contains', startswith: 'startsWith', endswith: 'endsWith' };

/**
 * Translates a $filter AST into a Prisma `where` object for one entity type.
 * Literals are coerced to the property's type (dates, enums, numbers) and
 * validated, so type errors surface as OData 400s rather than database errors.
 */
export class FilterTranslator {
  constructor(
    private readonly model: EdmModel,
    private readonly policy: TranslatePolicy = {},
  ) {}

  translate(ast: FilterNode, type: EdmEntityType): Where {
    return this.toWhere(ast, { type, vars: new Map(), inLambda: false });
  }

  // ── boolean expressions ─────────────────────────────────

  private toWhere(node: FilterNode, scope: Scope): Where {
    switch (node.kind) {
      case 'and':
      case 'or': {
        const key = node.kind === 'and' ? 'AND' : 'OR';
        const parts = [this.toWhere(node.left, scope), this.toWhere(node.right, scope)].flatMap((w) =>
          Object.keys(w).length === 1 && Array.isArray(w[key]) && w[key].length > 0 ? w[key] : [w],
        );
        return { [key]: parts };
      }
      case 'not':
        return { NOT: this.toWhere(node.operand, scope) };
      case 'compare':
        return this.compare(node.op, node.left, node.right, scope);
      case 'in':
        return this.inList(node.left, node.values, scope);
      case 'call':
        return this.booleanCall(node, scope);
      case 'lambda':
        return this.lambda(node, scope);
      case 'member': {
        const o = this.resolveMember(node, scope);
        if (o.prop.type !== 'Boolean') throw ODataError.invalidQuery('$filter', `'${node.path.join('/')}' is not a boolean expression`);
        return this.nest(o.relPath, { [o.prop.name]: true });
      }
      case 'literal':
        if (node.type === 'boolean') return node.value ? {} : nothing();
        throw ODataError.invalidQuery('$filter', 'A literal is not a boolean expression');
    }
  }

  private compare(op: ComparisonOp, left: FilterNode, right: FilterNode, scope: Scope): Where {
    // contains(x,'a') eq true / eq false
    if (this.isBooleanCall(right) && isBool(left)) [left, right] = [right, left];
    if (this.isBooleanCall(left) && isBool(right)) {
      if (op !== 'eq' && op !== 'ne') throw ODataError.invalidQuery('$filter', `Operator '${op}' is not valid for booleans`);
      const w = this.booleanCall(left as CallNode, scope);
      const positive = (op === 'eq') === (right as LiteralNode).value;
      return positive ? w : { NOT: w };
    }

    // Normalise to "property op literal".
    if (left.kind === 'literal' && right.kind !== 'literal') {
      [left, right] = [right, left];
      op = FLIP[op];
    }
    if (left.kind === 'literal') throw ODataError.invalidQuery('$filter', 'A comparison needs a property on one side');
    if (right.kind !== 'literal') {
      throw ODataError.notImplemented('Comparing two properties is not supported', '$filter');
    }

    const operand = this.operand(left, scope);
    const value = this.coerce(right, operand.prop);
    return this.nest(operand.relPath, this.leaf(op, operand, value));
  }

  private leaf(op: ComparisonOp, o: Operand, value: unknown): Where {
    const f = o.prop.name;
    const nullable = !o.prop.isRequired;

    if (value === null) {
      // a required property is never null: eq null matches nothing, ne null everything
      // (Prisma rejects a null comparison on a non-nullable column)
      if (op === 'eq') return nullable ? { [f]: null } : nothing();
      if (op === 'ne') return nullable ? { [f]: { not: null } } : {};
      throw ODataError.invalidQuery('$filter', `null can only be compared with eq or ne`);
    }

    if (o.transform) {
      const s = value as string;
      const expected = o.transform === 'lower' ? s.toLowerCase() : s.toUpperCase();
      if (op !== 'eq' && op !== 'ne') {
        throw ODataError.notImplemented(`'${op}' on to${o.transform}() is not supported`, '$filter');
      }
      // tolower(x) can never equal a string that isn't lower-case.
      if (s !== expected) return op === 'eq' ? nothing() : {};
      if (op === 'eq') return { [f]: { equals: s, mode: 'insensitive' } };
      const ne = { [f]: { not: s, mode: 'insensitive' } };
      return nullable ? { OR: [ne, { [f]: null }] } : ne;
    }

    if (op === 'eq') return { [f]: { equals: value } };
    if (op === 'ne') {
      // OData: null ne 'x' is true, SQL: NULL <> 'x' is unknown → include nulls explicitly.
      const ne = { [f]: { not: value } };
      return nullable ? { OR: [ne, { [f]: null }] } : ne;
    }
    if (o.prop.type === 'Boolean' || o.prop.kind === 'enum' || o.prop.type === 'Json') {
      throw ODataError.invalidQuery('$filter', `Operator '${op}' is not supported for ${o.prop.name}`);
    }
    return { [f]: { [PRISMA_OP[op]]: value } };
  }

  private inList(left: FilterNode, values: LiteralNode[], scope: Scope): Where {
    const o = this.operand(left, scope);
    if (o.transform) throw ODataError.notImplemented(`'in' on to${o.transform}() is not supported`, '$filter');
    const coerced = values.map((v) => this.coerce(v, o.prop));
    const nonNull = coerced.filter((v) => v !== null);
    const f = o.prop.name;
    const w: Where =
      nonNull.length === coerced.length
        ? { [f]: { in: nonNull } }
        : nonNull.length
          ? { OR: [{ [f]: { in: nonNull } }, { [f]: null }] }
          : { [f]: null };
    return this.nest(o.relPath, w);
  }

  private isBooleanCall(n: FilterNode): n is CallNode {
    return n.kind === 'call' && n.name in STRING_FNS;
  }

  private booleanCall(node: CallNode, scope: Scope): Where {
    const fn = STRING_FNS[node.name];
    if (!fn) {
      if (node.name === 'tolower' || node.name === 'toupper') {
        throw ODataError.invalidQuery('$filter', `${node.name}() is not a boolean expression`);
      }
      throw ODataError.notImplemented(`Function '${node.name}' is not supported`, '$filter');
    }
    if (node.args.length !== 2) throw ODataError.invalidQuery('$filter', `${node.name}() takes 2 arguments`);
    const [target, needle] = node.args;
    const o = this.operand(target, scope);
    if (o.prop.type !== 'String' || o.prop.kind !== 'scalar') {
      throw ODataError.invalidQuery('$filter', `${node.name}() needs a string property`);
    }
    if (needle.kind !== 'literal' || needle.type !== 'string') {
      throw ODataError.invalidQuery('$filter', `${node.name}() needs a string literal as its second argument`);
    }
    let text = needle.value as string;
    const cond: Where = { [fn]: text };
    if (o.transform) {
      const expected = o.transform === 'lower' ? text.toLowerCase() : text.toUpperCase();
      if (expected !== text) return nothing();
      text = expected;
      cond.mode = 'insensitive';
    }
    return this.nest(o.relPath, { [o.prop.name]: cond });
  }

  private lambda(node: LambdaNode, scope: Scope): Where {
    const { relPath, nav, target } = this.resolveCollection(node.path, scope);
    if (!node.predicate) return this.nest(relPath, { [nav]: { some: {} } });
    if (scope.vars.has(node.variable!)) {
      throw ODataError.invalidQuery('$filter', `Lambda variable '${node.variable}' is already in use`);
    }
    const inner = this.toWhere(node.predicate, {
      type: target,
      vars: new Map([...scope.vars, [node.variable!, target]]),
      inLambda: true,
    });
    return this.nest(relPath, { [nav]: { [node.op === 'any' ? 'some' : 'every']: inner } });
  }

  // ── operands and paths ──────────────────────────────────

  private operand(node: FilterNode, scope: Scope): Operand {
    if (node.kind === 'member') return this.resolveMember(node, scope);
    if (node.kind === 'call' && (node.name === 'tolower' || node.name === 'toupper')) {
      if (node.args.length !== 1 || node.args[0].kind !== 'member') {
        throw ODataError.invalidQuery('$filter', `${node.name}() takes one property argument`);
      }
      const o = this.resolveMember(node.args[0], scope);
      if (o.prop.type !== 'String' || o.prop.kind !== 'scalar') {
        throw ODataError.invalidQuery('$filter', `${node.name}() needs a string property`);
      }
      return { ...o, transform: node.name === 'tolower' ? 'lower' : 'upper' };
    }
    if (node.kind === 'call') throw ODataError.notImplemented(`Function '${node.name}' is not supported here`, '$filter');
    throw ODataError.invalidQuery('$filter', 'Expected a property');
  }

  /** Resolves the start of a path: a lambda variable or the current type. */
  private start(path: string[], scope: Scope): { type: EdmEntityType; segments: string[] } {
    if (scope.vars.has(path[0])) {
      if (path.length === 1) throw ODataError.notImplemented('Lambdas over primitive collections are not supported', '$filter');
      return { type: scope.vars.get(path[0])!, segments: path.slice(1) };
    }
    if (scope.inLambda) {
      throw ODataError.notImplemented('Inside a lambda, paths must start with the lambda variable', '$filter');
    }
    return { type: scope.type, segments: path };
  }

  private property(type: EdmEntityType, name: string): EdmProperty {
    const p = type.properties.get(name);
    if (!p || this.policy.isHidden?.(type, name)) {
      throw ODataError.invalidQuery('$filter', `Property '${name}' does not exist on type ${type.name}`);
    }
    return p;
  }

  /** Follows to-one navigations; returns the related type. */
  private navigate(type: EdmEntityType, name: string, toMany: boolean): EdmEntityType {
    const p = this.property(type, name);
    if (p.kind !== 'object') throw ODataError.invalidQuery('$filter', `'${name}' is not a navigation property`);
    if (p.isList !== toMany) {
      throw ODataError.invalidQuery(
        '$filter',
        toMany ? `'${name}' is not a collection` : `'${name}' is a collection; use ${name}/any(...) or ${name}/all(...)`,
      );
    }
    if (this.policy.canNavigate && !this.policy.canNavigate(type, name)) {
      throw ODataError.invalidQuery('$filter', `Navigation '${name}' may not be used in filters`);
    }
    const target = this.model.entityTypes.get(p.type);
    if (!target) throw ODataError.invalidQuery('$filter', `Unknown type ${p.type}`);
    return target;
  }

  private resolveMember(node: MemberNode, scope: Scope): Operand {
    const start = this.start(node.path, scope);
    let type = start.type;
    const segments = start.segments;
    const relPath: string[] = [];
    for (const seg of segments.slice(0, -1)) {
      type = this.navigate(type, seg, false);
      relPath.push(seg);
    }
    const prop = this.property(type, segments[segments.length - 1]);
    if (prop.kind === 'object') {
      throw ODataError.invalidQuery('$filter', `'${node.path.join('/')}' is a navigation property and cannot be compared`);
    }
    return { relPath, prop };
  }

  private resolveCollection(path: string[], scope: Scope) {
    const start = this.start(path, scope);
    let type = start.type;
    const segments = start.segments;
    const relPath: string[] = [];
    for (const seg of segments.slice(0, -1)) {
      type = this.navigate(type, seg, false);
      relPath.push(seg);
    }
    const nav = segments[segments.length - 1];
    const target = this.navigate(type, nav, true);
    return { relPath, nav, target };
  }

  /** Wraps a leaf condition in to-one relation filters: outlet/depot → { outlet: { is: {...} } }. */
  private nest(relPath: string[], leaf: Where): Where {
    return relPath.reduceRight<Where>((acc, rel) => ({ [rel]: { is: acc } }), leaf);
  }

  // ── literals ────────────────────────────────────────────

  coerce(lit: LiteralNode, prop: EdmProperty): unknown {
    return coerceLiteral(lit, prop, this.model, '$filter');
  }
}

function isBool(n: FilterNode): n is LiteralNode {
  return n.kind === 'literal' && n.type === 'boolean';
}

/** Parses an OData date (YYYY-MM-DD) as UTC midnight, rejecting impossible dates. */
export function parseDateLiteral(text: string, option: string): Date {
  const d = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== text) {
    throw ODataError.invalidQuery(option, `'${text}' is not a valid date`);
  }
  return d;
}

export function parseDateTimeLiteral(text: string, option: string): Date {
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) throw ODataError.invalidQuery(option, `'${text}' is not a valid date-time`);
  return d;
}

/**
 * Coerces a literal to the Prisma value for a property, validating its type.
 * Shared by $filter, key predicates and function parameters.
 */
export function coerceLiteral(lit: LiteralNode, prop: EdmProperty, model: EdmModel, option: string): unknown {
  if (lit.type === 'null') return null;
  const mismatch = () =>
    ODataError.invalidQuery(option, `Literal ${JSON.stringify(lit.value)} does not match the type of '${prop.name}'`);

  if (prop.kind === 'enum') {
    if (lit.type !== 'string' && lit.type !== 'enum') throw mismatch();
    if (lit.type === 'enum' && lit.enumType && !lit.enumType.endsWith(`.${prop.type}`)) throw mismatch();
    const values = model.enums.get(prop.type) ?? [];
    const raw = String(lit.value);
    const match = values.find((v) => v === raw) ?? values.find((v) => v.toLowerCase() === raw.toLowerCase());
    if (!match) {
      throw ODataError.invalidQuery(option, `'${raw}' is not a valid ${prop.type}; expected one of ${values.join(', ')}`);
    }
    return match;
  }

  switch (prop.type) {
    case 'String':
      if (lit.type !== 'string') throw mismatch();
      return lit.value;
    case 'Int':
      if (lit.type !== 'number' || !Number.isInteger(lit.value)) throw mismatch();
      return lit.value;
    case 'BigInt':
      if (lit.type !== 'number' || !Number.isInteger(lit.value)) throw mismatch();
      return BigInt(lit.value as number);
    case 'Float':
    case 'Decimal':
      if (lit.type !== 'number') throw mismatch();
      return lit.value;
    case 'Boolean':
      if (lit.type !== 'boolean') throw mismatch();
      return lit.value;
    case 'DateTime':
      if (lit.type === 'date') return parseDateLiteral(lit.value as string, option);
      if (lit.type === 'datetime') return parseDateTimeLiteral(lit.value as string, option);
      if (lit.type === 'string') {
        const s = lit.value as string;
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? parseDateLiteral(s, option) : parseDateTimeLiteral(s, option);
      }
      throw mismatch();
    default:
      throw ODataError.invalidQuery(option, `Property '${prop.name}' (${prop.type}) cannot be filtered`);
  }
}
