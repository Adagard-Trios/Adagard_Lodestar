#!/usr/bin/env node
// Generates docs/data-model.md (a Mermaid ER diagram) from backend/prisma/schema.prisma.
//   node tools/docs/erd.mjs            write docs/data-model.md
//   node tools/docs/erd.mjs --check    exit 1 if the file is out of date (CI)
// The image docs/data-model.svg is exported from it with mermaid-cli (see docs/README.md).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// normalise line endings: on a CRLF checkout '.' stops at a carriage return, so '//' and '///' comments would leak
// into the diagram as attributes
const schema = readFileSync(join(root, 'backend/prisma/schema.prisma'), 'utf8').replace(/\r\n?/g, '\n');

const blocks = [...schema.matchAll(/^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm)];
const enums = new Set(blocks.filter(b => b[1] === 'enum').map(b => b[2]));
const models = blocks.filter(b => b[1] === 'model').map(([, , name, body]) => {
  const lines = body.split('\n').map(l => l.replace(/\/\/.*$/, '').trim()).filter(l => l && !l.startsWith('@@'));
  const schemaName = (body.match(/@@schema\("(\w+)"\)/) || [])[1];
  const fields = lines.map(l => {
    const [field, type, ...rest] = l.split(/\s+/);
    return { field, type: type.replace(/[?[\]]/g, ''), list: type.endsWith('[]'), optional: type.endsWith('?'), attrs: rest.join(' ') };
  });
  return { name, schemaName, fields };
});
const modelNames = new Set(models.map(m => m.name));

const out = ['erDiagram'];
for (const m of models) {
  out.push(`  ${m.name} {`);
  for (const f of m.fields) {
    if (modelNames.has(f.type)) continue; // relations are drawn as lines
    const key = f.attrs.includes('@id') ? ' PK' : f.attrs.includes('@unique') ? ' UK' : '';
    const fk = m.fields.some(r => modelNames.has(r.type) && new RegExp(`fields:\\s*\\[[^\\]]*\\b${f.field}\\b`).test(r.attrs)) ? (key ? ',FK' : ' FK') : '';
    const type = enums.has(f.type) ? f.type : f.type.replace('DateTime', 'datetime').replace('String', 'string').replace('Int', 'int').replace('Float', 'float').replace('Boolean', 'bool').replace('Json', 'json');
    out.push(`    ${type}${f.list ? '_list' : ''} ${f.field}${key}${fk}`);
  }
  out.push('  }');
}
// one line per owning side (the field that carries `fields: [...]`)
for (const m of models) {
  for (const f of m.fields) {
    if (!modelNames.has(f.type) || !/fields:\s*\[/.test(f.attrs)) continue;
    const back = models.find(x => x.name === f.type).fields.find(x => x.type === m.name);
    const many = back ? back.list : true;
    const left = f.optional ? '|o' : '||';
    const right = many ? 'o{' : 'o|';
    out.push(`  ${f.type} ${left}--${right} ${m.name} : "${f.field}"`);
  }
}

const bySchema = {};
for (const m of models) (bySchema[m.schemaName || 'public'] ??= []).push(m.name);
const md = `# Data model

Generated from [\`backend/prisma/schema.prisma\`](../backend/prisma/schema.prisma) by \`node tools/docs/erd.mjs\`; do not edit by hand. Image: [data-model.svg](data-model.svg).

One Postgres database with one schema per service; a service reads and writes only its own schema, and other services' data through their OData APIs.

| Schema (owning service) | Tables |
|---|---|
${Object.entries(bySchema).map(([s, ms]) => `| \`${s}\` | ${ms.join(', ')} |`).join('\n')}

\`PK\` primary key · \`UK\` unique · \`FK\` foreign key. Enum-typed columns show the enum name.

\`\`\`mermaid
${out.join('\n')}
\`\`\`
`;

const target = join(root, 'docs/data-model.md');
if (process.argv.includes('--check')) {
  const same = existsSync(target) && readFileSync(target, 'utf8').replace(/\r\n/g, '\n') === md;
  if (!same) { console.error('docs/data-model.md is out of date: run node tools/docs/erd.mjs'); process.exit(1); }
  console.log('docs/data-model.md is up to date');
} else {
  writeFileSync(target, md);
  console.log(`wrote docs/data-model.md: ${models.length} tables, ${enums.size} enums`);
}
