import { EdmEntityType, EdmModel, etagProperty, structuralProperties } from '../edm/model';
import { ODataError } from '../errors';
import { parseFilter } from '../filter/parser';
import { FilterTranslator, nothing, TranslatePolicy, Where } from '../filter/translator';
import { ExpandItem, OrderByItem, QueryOptions } from './options';

export const MAX_TOP = 500;

/** Per-set policy for query translation (least privilege: explicit allow-lists). */
export interface SetQueryPolicy {
  /** Navigation properties of the root type that may be expanded or traversed in filters */
  navigation: string[];
  /** Properties searched by $search (paths like 'outlet/name' allowed) */
  search: string[];
  /** Hidden properties per entity type name (never selected, filtered or sorted) */
  hidden: Record<string, string[]>;
  /** Default order when $orderby is absent */
  defaultOrderBy?: OrderByItem[];
  maxTop?: number;
}

/** What to keep from each fetched row when writing the response. */
export interface Projection {
  type: EdmEntityType;
  fields: string[];
  etagField?: string;
  expand: Record<string, Projection>;
}

export interface QueryPlan {
  where?: Where;
  select: Record<string, any>;
  orderBy: Record<string, any>[];
  skip: number;
  top?: number;
  projection: Projection;
}

export class QueryBuilder {
  private readonly translator: FilterTranslator;
  private readonly policy: TranslatePolicy;

  constructor(
    private readonly model: EdmModel,
    private readonly root: EdmEntityType,
    private readonly setPolicy: SetQueryPolicy,
  ) {
    this.policy = {
      isHidden: (t, p) => this.isHidden(t, p),
      canNavigate: (from, nav) => from.name === root.name && setPolicy.navigation.includes(nav),
    };
    this.translator = new FilterTranslator(model, this.policy);
  }

  isHidden(type: EdmEntityType, prop: string): boolean {
    return !!this.setPolicy.hidden[type.name]?.includes(prop);
  }

  /** Visible structural (non-navigation) properties of a type. */
  visibleFields(type: EdmEntityType): string[] {
    return structuralProperties(type)
      .map((p) => p.name)
      .filter((n) => !this.isHidden(type, n));
  }

  /** Builds Prisma findMany args (without ABAC; the caller ANDs the row filter in). */
  build(opts: QueryOptions): QueryPlan {
    const maxTop = this.setPolicy.maxTop ?? MAX_TOP;
    if (opts.top !== undefined && opts.top > maxTop) {
      throw ODataError.invalidQuery('$top', `$top may not exceed ${maxTop}; use server paging (@odata.nextLink)`);
    }

    const filterWhere = opts.filter ? this.translator.translate(parseFilter(opts.filter, opts.aliases), this.root) : undefined;
    const searchWhere = opts.search !== undefined ? this.search(opts.search) : undefined;
    const where =
      filterWhere && searchWhere ? { AND: [filterWhere, searchWhere] } : (filterWhere ?? searchWhere);

    const { select, projection } = this.selectFor(this.root, opts.select, '$select');
    for (const item of opts.expand ?? []) this.expand(item, select, projection, maxTop);

    return {
      where,
      select,
      orderBy: this.orderBy(this.root, opts.orderby ?? this.setPolicy.defaultOrderBy ?? [], true),
      skip: opts.skip ?? 0,
      top: opts.top,
      projection,
    };
  }

  /** $select for a type: requested fields plus keys and the ETag field (fetched, not always returned). */
  selectFor(type: EdmEntityType, requested: string[] | undefined, option: string) {
    const visible = this.visibleFields(type);
    let fields: string[];
    if (!requested || requested.includes('*')) fields = visible;
    else {
      for (const f of requested) {
        const p = type.properties.get(f);
        if (p?.kind === 'object') throw ODataError.invalidQuery(option, `'${f}' is a navigation property; use $expand`);
        if (!p || !visible.includes(f)) throw ODataError.invalidQuery(option, `Property '${f}' does not exist on type ${type.name}`);
      }
      fields = [...new Set([...type.keys, ...requested])];
    }
    const etagField = etagProperty(type);
    const select: Record<string, any> = {};
    for (const f of [...fields, ...type.keys, ...(etagField ? [etagField] : [])]) select[f] = true;
    const projection: Projection = { type, fields, etagField, expand: {} };
    return { select, projection };
  }

  private expand(item: ExpandItem, select: Record<string, any>, projection: Projection, maxTop: number) {
    const nav = this.root.properties.get(item.navigation);
    if (!nav || nav.kind !== 'object' || this.isHidden(this.root, item.navigation)) {
      throw ODataError.invalidQuery('$expand', `'${item.navigation}' is not a navigation property of ${this.root.name}`);
    }
    if (!this.setPolicy.navigation.includes(item.navigation)) {
      throw ODataError.invalidQuery('$expand', `Navigation '${item.navigation}' may not be expanded`);
    }
    const target = this.model.entityTypes.get(nav.type)!;
    const o = item.options;
    const nested = this.selectFor(target, o.select, '$expand/$select');
    const args: Record<string, any> = { select: nested.select };

    if (!nav.isList) {
      if (o.filter || o.top !== undefined || o.skip !== undefined || o.orderby) {
        throw ODataError.invalidQuery('$expand', `Only $select is allowed when expanding the single-valued '${item.navigation}'`);
      }
    } else {
      if (o.top !== undefined && o.top > maxTop) throw ODataError.invalidQuery('$expand', `$top may not exceed ${maxTop}`);
      if (o.filter) {
        // Nested filters may not traverse further navigations (one level only).
        const nestedTranslator = new FilterTranslator(this.model, { ...this.policy, canNavigate: () => false });
        args.where = nestedTranslator.translate(parseFilter(o.filter), target);
      }
      args.orderBy = this.orderBy(target, o.orderby ?? [], false);
      args.take = Math.min(o.top ?? maxTop, maxTop);
      if (o.skip) args.skip = o.skip;
    }
    select[item.navigation] = args;
    projection.expand[item.navigation] = nested.projection;
  }

  /** $orderby → Prisma orderBy; keys are appended so paging is stable. */
  orderBy(type: EdmEntityType, items: OrderByItem[], allowNavigation: boolean): Record<string, any>[] {
    const out = items.map((item) => {
      let t = type;
      for (const seg of item.path.slice(0, -1)) {
        const p = t.properties.get(seg);
        if (!allowNavigation || !p || p.kind !== 'object' || p.isList || !this.setPolicy.navigation.includes(seg) || t !== type) {
          throw ODataError.invalidQuery('$orderby', `Cannot order by '${item.path.join('/')}'`);
        }
        t = this.model.entityTypes.get(p.type)!;
      }
      const last = item.path[item.path.length - 1];
      const p = t.properties.get(last);
      if (!p || p.kind === 'object' || p.type === 'Json' || p.isList || this.isHidden(t, last)) {
        throw ODataError.invalidQuery('$orderby', `Cannot order by '${item.path.join('/')}'`);
      }
      return item.path.slice(0, -1).reduceRight<Record<string, any>>((acc, rel) => ({ [rel]: acc }), { [last]: item.direction });
    });
    for (const k of type.keys) {
      if (!items.some((i) => i.path.length === 1 && i.path[0] === k)) out.push({ [k]: 'asc' });
    }
    return out;
  }

  /**
   * $search: whitespace-separated terms (or "quoted phrases"), all required;
   * each term matches any configured field case-insensitively. NOT term excludes.
   */
  search(text: string): Where {
    if (!this.setPolicy.search.length) throw ODataError.notImplemented(`$search is not supported on ${this.root.name}`, '$search');
    const terms = [...text.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]).filter((t) => t && t !== 'AND');
    if (!terms.length) return {};
    const clauses: Where[] = [];
    for (let i = 0; i < terms.length; i++) {
      if (terms[i] === 'OR') throw ODataError.notImplemented('OR in $search is not supported; use $filter', '$search');
      const negate = terms[i] === 'NOT';
      const term = negate ? terms[++i] : terms[i];
      if (term === undefined) throw ODataError.invalidQuery('$search', 'NOT needs a term');
      const any: Where = {
        OR: this.setPolicy.search.map((path) => {
          const segs = path.split('/');
          const leaf = { [segs[segs.length - 1]]: { contains: term, mode: 'insensitive' } };
          return segs.slice(0, -1).reduceRight<Where>((acc, rel) => ({ [rel]: { is: acc } }), leaf);
        }),
      };
      clauses.push(negate ? { NOT: any } : any);
    }
    return clauses.length === 1 ? clauses[0] : { AND: clauses };
  }
}

export { nothing };
