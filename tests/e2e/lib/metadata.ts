// Minimal CSDL (OData v4 $metadata) reader, so the conformance tests follow whatever properties the
// services declare instead of hard-coding them.
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type EntityType = {
  name: string;
  namespace: string;
  key: string[];
  properties: Record<string, { type: string; nullable: boolean }>;
  navigation: Record<string, { type: string; collection: boolean }>;
};

export type Csdl = {
  version: string;
  namespaces: string[];
  entitySets: Record<string, string>; // set name -> qualified entity type
  entityTypes: Record<string, EntityType>; // qualified name -> type
  actions: string[]; // qualified
  functions: string[]; // qualified
};

const arr = <T>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

export function validateXml(xml: string): true | string {
  const r = XMLValidator.validate(xml);
  return r === true ? true : `${r.err.code}: ${r.err.msg} (line ${r.err.line})`;
}

type Node = Record<string, unknown>;

export function parseCsdl(xml: string): Csdl {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true });
  const doc = parser.parse(xml) as Node;
  const edmx = doc.Edmx as Node | undefined;
  if (!edmx) throw new Error('root element is not edmx:Edmx');
  const ds = edmx.DataServices as Node | undefined;
  if (!ds) throw new Error('edmx:DataServices missing');

  const out: Csdl = { version: String(edmx['@Version']), namespaces: [], entitySets: {}, entityTypes: {}, actions: [], functions: [] };
  for (const schema of arr(ds.Schema as Node | Node[])) {
    const ns = String(schema['@Namespace']);
    out.namespaces.push(ns);
    for (const et of arr(schema.EntityType as Node | Node[])) {
      const name = String(et['@Name']);
      const key = arr((et.Key as Node | undefined)?.PropertyRef as Node | Node[]).map(r => String(r['@Name']));
      const properties: EntityType['properties'] = {};
      for (const p of arr(et.Property as Node | Node[])) properties[String(p['@Name'])] = { type: String(p['@Type']), nullable: p['@Nullable'] !== 'false' };
      const navigation: EntityType['navigation'] = {};
      for (const n of arr(et.NavigationProperty as Node | Node[])) {
        const t = String(n['@Type']);
        const m = t.match(/^Collection\((.+)\)$/);
        navigation[String(n['@Name'])] = { type: m ? m[1] : t, collection: Boolean(m) };
      }
      out.entityTypes[`${ns}.${name}`] = { name, namespace: ns, key, properties, navigation };
    }
    for (const a of arr(schema.Action as Node | Node[])) out.actions.push(`${ns}.${a['@Name']}`);
    for (const f of arr(schema.Function as Node | Node[])) out.functions.push(`${ns}.${f['@Name']}`);
    for (const c of arr(schema.EntityContainer as Node | Node[])) {
      for (const s of arr(c.EntitySet as Node | Node[])) out.entitySets[String(s['@Name'])] = String(s['@EntityType']);
    }
  }
  return out;
}

export function entityTypeOf(csdl: Csdl, set: string): EntityType {
  const qn = csdl.entitySets[set];
  if (!qn) throw new Error(`entity set ${set} not in $metadata`);
  const t = csdl.entityTypes[qn] ?? Object.values(csdl.entityTypes).find(e => qn.endsWith(`.${e.name}`));
  if (!t) throw new Error(`entity type ${qn} not in $metadata`);
  return t;
}

/** OData URL literal for a key/property value. */
export function literal(type: string, value: unknown): string {
  if (value === null || value === undefined) return 'null';
  const quoted = () => `'${String(value).replace(/'/g, "''")}'`;
  if (type === 'Edm.String') return quoted();
  if (type.startsWith('Edm.')) return String(value); // numbers, booleans, Guid, Date, DateTimeOffset
  return quoted(); // enums are compared as strings (PLATFORM.md §3)
}
