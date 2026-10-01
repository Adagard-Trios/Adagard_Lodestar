import { edmTypeName, EdmModel, navigationProperties, structuralProperties } from './model';

/** Operation (action/function) as it appears in $metadata. */
export interface CsdlOperation {
  name: string;
  kind: 'action' | 'function';
  binding: 'entity' | 'collection' | 'unbound';
  /** Entity type name the operation is bound to (for bound operations) */
  bindingType?: string;
  params: Record<string, { type: string; required?: boolean }>;
  /** EDM type name, e.g. Lodestar.Plan, Collection(Lodestar.Deferral), Edm.String */
  returns?: string;
}

export interface CsdlEntitySet {
  name: string;
  entityType: string;
}

export interface CsdlOptions {
  entitySets: CsdlEntitySet[];
  operations: CsdlOperation[];
  /** Complex types used as operation results: name → { property: EDM type } */
  complexTypes?: Record<string, Record<string, string>>;
  isHidden?: (typeName: string, prop: string) => boolean;
  containerName?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Generates CSDL XML ($metadata) from the EDM model. Every entity type of the
 * Prisma schema is declared (so navigation types always resolve); only the
 * given entity sets appear in the container.
 */
export function generateCsdl(model: EdmModel, opts: CsdlOptions): string {
  const ns = model.namespace;
  const hidden = opts.isHidden ?? (() => false);
  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="utf-8"?>');
  out.push('<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">');
  out.push('  <edmx:DataServices>');
  out.push(`    <Schema Namespace="${ns}" xmlns="http://docs.oasis-open.org/odata/ns/edm">`);

  for (const [name, values] of model.enums) {
    out.push(`      <EnumType Name="${esc(name)}">`);
    values.forEach((v, i) => out.push(`        <Member Name="${esc(v)}" Value="${i}"/>`));
    out.push('      </EnumType>');
  }

  for (const type of model.entityTypes.values()) {
    out.push(`      <EntityType Name="${esc(type.name)}">`);
    out.push('        <Key>');
    for (const k of type.keys) out.push(`          <PropertyRef Name="${esc(k)}"/>`);
    out.push('        </Key>');
    for (const p of structuralProperties(type)) {
      if (hidden(type.name, p.name)) continue;
      const nullable = p.isRequired ? ' Nullable="false"' : '';
      out.push(`        <Property Name="${esc(p.name)}" Type="${edmTypeName(p, ns)}"${nullable}/>`);
    }
    for (const p of navigationProperties(type)) {
      if (hidden(type.name, p.name)) continue;
      const nullable = !p.isList && p.isRequired ? ' Nullable="false"' : '';
      out.push(`        <NavigationProperty Name="${esc(p.name)}" Type="${edmTypeName(p, ns)}"${nullable}/>`);
    }
    out.push('      </EntityType>');
  }

  for (const [name, props] of Object.entries(opts.complexTypes ?? {})) {
    out.push(`      <ComplexType Name="${esc(name)}">`);
    for (const [p, t] of Object.entries(props)) out.push(`        <Property Name="${esc(p)}" Type="${esc(t)}"/>`);
    out.push('      </ComplexType>');
  }

  for (const op of opts.operations) {
    const tag = op.kind === 'action' ? 'Action' : 'Function';
    const bound = op.binding !== 'unbound';
    out.push(`      <${tag} Name="${esc(op.name)}" IsBound="${bound}">`);
    if (bound) {
      const t = `${ns}.${op.bindingType}`;
      out.push(`        <Parameter Name="bindingParameter" Type="${op.binding === 'collection' ? `Collection(${t})` : t}" Nullable="false"/>`);
    }
    for (const [p, spec] of Object.entries(op.params)) {
      out.push(`        <Parameter Name="${esc(p)}" Type="${esc(spec.type)}"${spec.required ? ' Nullable="false"' : ''}/>`);
    }
    if (op.returns) out.push(`        <ReturnType Type="${esc(op.returns)}"/>`);
    out.push(`      </${tag}>`);
  }

  out.push(`      <EntityContainer Name="${esc(opts.containerName ?? 'Container')}">`);
  const setByType = new Map(opts.entitySets.map((s) => [s.entityType, s.name]));
  for (const set of opts.entitySets) {
    const type = model.entityTypes.get(set.entityType);
    const bindings = type
      ? navigationProperties(type)
          .filter((p) => setByType.has(p.type) && !hidden(type.name, p.name))
          .map((p) => `          <NavigationPropertyBinding Path="${esc(p.name)}" Target="${esc(setByType.get(p.type)!)}"/>`)
      : [];
    if (!bindings.length) out.push(`        <EntitySet Name="${esc(set.name)}" EntityType="${ns}.${esc(set.entityType)}"/>`);
    else {
      out.push(`        <EntitySet Name="${esc(set.name)}" EntityType="${ns}.${esc(set.entityType)}">`);
      out.push(...bindings);
      out.push('        </EntitySet>');
    }
  }
  for (const op of opts.operations.filter((o) => o.binding === 'unbound')) {
    out.push(
      op.kind === 'action'
        ? `        <ActionImport Name="${esc(op.name)}" Action="${ns}.${esc(op.name)}"/>`
        : `        <FunctionImport Name="${esc(op.name)}" Function="${ns}.${esc(op.name)}" IncludeInServiceDocument="true"/>`,
    );
  }
  out.push('      </EntityContainer>');
  out.push('    </Schema>');
  out.push('  </edmx:DataServices>');
  out.push('</edmx:Edmx>');
  return out.join('\n') + '\n';
}

/** OData service document: the entity sets (and function imports) of a service. */
export function serviceDocument(baseUrl: string, sets: string[], functionImports: string[] = []) {
  return {
    '@odata.context': `${baseUrl}/$metadata`,
    value: [
      ...sets.map((name) => ({ name, kind: 'EntitySet', url: name })),
      ...functionImports.map((name) => ({ name, kind: 'FunctionImport', url: name })),
    ],
  };
}
