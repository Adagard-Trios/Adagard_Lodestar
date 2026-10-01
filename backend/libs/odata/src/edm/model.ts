/**
 * Entity Data Model (EDM) built from Prisma's DMMF (`Prisma.dmmf.datamodel`).
 * The filter translator, query builder and CSDL generator all work from this
 * model, so the OData surface always matches the Prisma schema.
 */

/** Scalar types Prisma can produce. */
export type PrismaScalar = 'String' | 'Int' | 'BigInt' | 'Float' | 'Decimal' | 'Boolean' | 'DateTime' | 'Json' | 'Bytes';

export interface EdmProperty {
  name: string;
  kind: 'scalar' | 'enum' | 'object';
  /** Prisma scalar, enum name or related model name */
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  hasDefault: boolean;
  isUpdatedAt: boolean;
  /** Foreign-key columns of a relation (only on the owning side) */
  relationFromFields?: string[];
}

export interface EdmEntityType {
  name: string;
  keys: string[];
  properties: Map<string, EdmProperty>;
  documentation?: string;
}

export interface EdmModel {
  namespace: string;
  entityTypes: Map<string, EdmEntityType>;
  enums: Map<string, string[]>;
}

/** The subset of the DMMF datamodel we read (stable across Prisma 4/5). */
export interface DmmfDatamodel {
  models: ReadonlyArray<{
    name: string;
    documentation?: string;
    primaryKey?: { fields: ReadonlyArray<string> } | null;
    fields: ReadonlyArray<{
      name: string;
      kind: string;
      type: string;
      isList: boolean;
      isRequired: boolean;
      isId: boolean;
      hasDefaultValue: boolean;
      isUpdatedAt?: boolean;
      relationFromFields?: ReadonlyArray<string>;
    }>;
  }>;
  enums: ReadonlyArray<{ name: string; values: ReadonlyArray<{ name: string }> }>;
}

export const DEFAULT_NAMESPACE = 'Lodestar';

/** Models documented with this tag (`/// @odata.ignore …`) are internal and never enter the EDM. */
export const ODATA_IGNORE_TAG = '@odata.ignore';

export function isIgnoredModel(m: { documentation?: string }): boolean {
  return !!m.documentation?.includes(ODATA_IGNORE_TAG);
}

export function buildEdmModel(datamodel: DmmfDatamodel, namespace = DEFAULT_NAMESPACE): EdmModel {
  const enums = new Map<string, string[]>();
  for (const e of datamodel.enums) enums.set(e.name, e.values.map((v) => v.name));

  const entityTypes = new Map<string, EdmEntityType>();
  for (const m of datamodel.models) {
    if (isIgnoredModel(m)) continue;
    const properties = new Map<string, EdmProperty>();
    for (const f of m.fields) {
      properties.set(f.name, {
        name: f.name,
        kind: f.kind === 'object' ? 'object' : f.kind === 'enum' ? 'enum' : 'scalar',
        type: f.type,
        isList: f.isList,
        isRequired: f.isRequired,
        isId: f.isId,
        hasDefault: f.hasDefaultValue,
        isUpdatedAt: !!f.isUpdatedAt,
        relationFromFields: f.relationFromFields?.length ? [...f.relationFromFields] : undefined,
      });
    }
    const keys = m.primaryKey?.fields?.length
      ? [...m.primaryKey.fields]
      : m.fields.filter((f) => f.isId).map((f) => f.name);
    entityTypes.set(m.name, { name: m.name, keys, properties, documentation: m.documentation });
  }
  return { namespace, entityTypes, enums };
}

export function entityType(model: EdmModel, name: string): EdmEntityType {
  const t = model.entityTypes.get(name);
  if (!t) throw new Error(`Unknown entity type ${name}`);
  return t;
}

/** Scalar (non-navigation) properties, in schema order. */
export function structuralProperties(t: EdmEntityType): EdmProperty[] {
  return [...t.properties.values()].filter((p) => p.kind !== 'object');
}

export function navigationProperties(t: EdmEntityType): EdmProperty[] {
  return [...t.properties.values()].filter((p) => p.kind === 'object');
}

/** The property used for ETags: an @updatedAt DateTime, if the type has one. */
export function etagProperty(t: EdmEntityType): string | undefined {
  const p = t.properties.get('updatedAt');
  return p && p.type === 'DateTime' ? 'updatedAt' : [...t.properties.values()].find((x) => x.isUpdatedAt)?.name;
}

/** Maps a Prisma type to its EDM type name. */
export function edmTypeName(p: EdmProperty, namespace = DEFAULT_NAMESPACE): string {
  let t: string;
  if (p.kind === 'enum' || p.kind === 'object') t = `${namespace}.${p.type}`;
  else {
    switch (p.type as PrismaScalar) {
      case 'String': t = 'Edm.String'; break;
      case 'Int': t = 'Edm.Int32'; break;
      case 'BigInt': t = 'Edm.Int64'; break;
      case 'Float': t = 'Edm.Double'; break;
      case 'Decimal': t = 'Edm.Decimal'; break;
      case 'Boolean': t = 'Edm.Boolean'; break;
      case 'DateTime': t = 'Edm.DateTimeOffset'; break;
      case 'Bytes': t = 'Edm.Binary'; break;
      case 'Json':
      default: t = 'Edm.Untyped';
    }
  }
  return p.isList ? `Collection(${t})` : t;
}
