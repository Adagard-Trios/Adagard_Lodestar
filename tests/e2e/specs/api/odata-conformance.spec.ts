// PLATFORM.md §3 · OData v4 conformance through the gateway. Property names are read from $metadata, so the
// tests follow the services' declared model rather than guessing field names.
import { entityTypeOf, literal, parseCsdl, validateXml, type Csdl, type EntityType } from '../../lib/metadata';
import { OData, entityPath, expect, expectODataError, expectStatus, metadata, requireStack, test, type ODataCollection } from '../../lib/fixtures';

const CONTRACT_SETS = [
  'Orders', 'OrderLineItems', 'Plans', 'Deferrals', 'Vehicles', 'Outlets', 'Calendar', 'DistrictTravel',
  'ServiceAllowances', 'Trips', 'TripStops', 'PODs', 'LoadRecords', 'OfflineEvents', 'Notifications',
  'AuditEntries', 'Users', 'Devices', 'AgentRuns',
];
const SET = 'Orders';

type Row = Record<string, unknown>;
const isAnnotation = (k: string) => k.startsWith('@') || k.includes('@odata.');

/** First non-key Edm.String property, useful for string functions in $filter. */
function stringProp(t: EntityType): string | undefined {
  return Object.entries(t.properties).find(([n, p]) => p.type === 'Edm.String' && !t.key.includes(n))?.[0];
}

test.describe('OData · $metadata and service document', { tag: '@stack' }, () => {
  requireStack();

  test('$metadata is well-formed CSDL XML (EDMX 4.0)', async ({ as }) => {
    const d = await as('dispatcher');
    const res = await d.get('$metadata', { Accept: 'application/xml' });
    await expectStatus(res, 200);
    expect(res.headers()['content-type']).toMatch(/application\/xml/);
    expect(res.headers()['odata-version'] ?? '4.0').toMatch(/^4\.0/);
    const xml = await res.text();
    expect(validateXml(xml)).toBe(true);
    expect(xml).toContain('http://docs.oasis-open.org/odata/ns/edmx');
    expect(xml).toContain('http://docs.oasis-open.org/odata/ns/edm');

    const csdl = parseCsdl(xml);
    expect(csdl.version).toBe('4.0');
    for (const set of CONTRACT_SETS) expect(Object.keys(csdl.entitySets), `entity set ${set}`).toContain(set);
    for (const set of CONTRACT_SETS) {
      const t = entityTypeOf(csdl, set);
      expect(t.key.length, `${set} has a key`).toBeGreaterThan(0);
      for (const k of t.key) expect(t.properties[k], `${set} key ${k} is a declared property`).toBeDefined();
    }
  });

  test('$metadata declares the Lodestar actions and functions', async ({ as }) => {
    const csdl: Csdl = await metadata(await as('dispatcher'));
    expect(csdl.namespaces).toContain('Lodestar');
    for (const a of ['Approve', 'Confirm', 'Release', 'CompleteStop', 'PushBatch', 'Resume']) expect(csdl.actions).toContain(`Lodestar.${a}`);
    expect(csdl.functions).toContain('Lodestar.VerifyChain');
  });

  test('the service document lists every entity set', async ({ as }) => {
    const doc = await (await as('dispatcher')).json<{ '@odata.context': string; value: { name: string; url: string; kind?: string }[] }>('');
    expect(doc['@odata.context']).toMatch(/\$metadata$/);
    const names = doc.value.map(v => v.name);
    for (const set of CONTRACT_SETS) expect(names).toContain(set);
  });
});

test.describe('OData · query options', { tag: '@stack' }, () => {
  requireStack();

  let d: OData;
  let t: EntityType;
  let key: string;
  let sample: Row[];

  test.beforeEach(async ({ as }) => {
    d = await as('dispatcher');
    t = entityTypeOf(await metadata(d), SET);
    key = t.key[0];
    sample = (await d.json(`${SET}?$top=20&$orderby=${key}`)).value;
    expect(sample.length, `seeded ${SET}`).toBeGreaterThan(2);
  });

  test('collection response shape', async () => {
    const body = await d.json(`${SET}?$top=2`);
    expect(body['@odata.context']).toMatch(new RegExp(`\\$metadata#${SET}`));
    expect(Array.isArray(body.value)).toBe(true);
  });

  test('single entity by key', async () => {
    const path = await entityPath(d, SET, sample[0]);
    const one = await d.json<Row>(path);
    expect(one[key]).toEqual(sample[0][key]);
    expect(String(one['@odata.context'])).toMatch(new RegExp(`\\$metadata#${SET}/\\$entity`));
  });

  test('$filter: eq, ne, and/or/not, in, parentheses', async () => {
    const [a, b] = [sample[0][key], sample[1][key]];
    const ty = t.properties[key].type;
    const la = literal(ty, a), lb = literal(ty, b);

    const eq = await d.json(`${SET}?$filter=${key} eq ${la}`);
    expect(eq.value.map(r => r[key])).toEqual([a]);

    const ne = await d.json(`${SET}?$filter=${key} ne ${la}&$top=50`);
    expect(ne.value.map(r => r[key])).not.toContain(a);

    const or = await d.json(`${SET}?$filter=(${key} eq ${la} or ${key} eq ${lb})&$orderby=${key}`);
    expect(or.value.map(r => r[key])).toEqual([a, b]);

    const and = await d.json(`${SET}?$filter=${key} eq ${la} and ${key} eq ${lb}`);
    expect(and.value).toHaveLength(0);

    const not = await d.json(`${SET}?$filter=not (${key} eq ${la})&$top=50`);
    expect(not.value.map(r => r[key])).not.toContain(a);

    const inn = await d.json(`${SET}?$filter=${key} in (${la},${lb})&$orderby=${key}`);
    expect(inn.value.map(r => r[key])).toEqual([a, b]);
  });

  test('$filter: string functions and null', async () => {
    const prop = stringProp(t);
    test.skip(!prop, `${SET} has no non-key string property`);
    const row = sample.find(r => typeof r[prop!] === 'string' && (r[prop!] as string).length >= 2);
    test.skip(!row, 'no sample value');
    const v = row![prop!] as string;

    const sw = await d.json(`${SET}?$filter=startswith(${prop},${literal('Edm.String', v.slice(0, 2))})&$top=50`);
    expect(sw.value.length).toBeGreaterThan(0);
    for (const r of sw.value) expect(String(r[prop!]).startsWith(v.slice(0, 2))).toBe(true);

    const ct = await d.json(`${SET}?$filter=contains(tolower(${prop}),${literal('Edm.String', v.slice(-2).toLowerCase())})&$top=50`);
    for (const r of ct.value) expect(String(r[prop!]).toLowerCase()).toContain(v.slice(-2).toLowerCase());

    const ew = await d.json(`${SET}?$filter=endswith(${prop},${literal('Edm.String', v.slice(-1))})&$top=50`);
    for (const r of ew.value) expect(String(r[prop!]).endsWith(v.slice(-1))).toBe(true);

    await expectStatus(await d.get(`${SET}?$filter=${prop} eq null&$top=1`), 200);
  });

  test('$select returns only the selected properties', async () => {
    const prop = stringProp(t) ?? key;
    const body = await d.json(`${SET}?$select=${key},${prop}&$top=5`);
    for (const r of body.value) {
      const fields = Object.keys(r).filter(k => !isAnnotation(k));
      expect(fields.sort()).toEqual([...new Set([key, prop])].sort());
    }
  });

  test('$orderby asc and desc', async () => {
    const asc = (await d.json(`${SET}?$orderby=${key} asc&$top=10&$select=${key}`)).value.map(r => String(r[key]));
    const desc = (await d.json(`${SET}?$orderby=${key} desc&$top=10&$select=${key}`)).value.map(r => String(r[key]));
    const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
    expect(asc).toEqual([...asc].sort(cmp));
    expect(desc).toEqual([...desc].sort(cmp).reverse());
    expect(asc[0]).not.toEqual(desc[0]);
  });

  test('$top and $skip page consistently', async () => {
    const first3 = (await d.json(`${SET}?$orderby=${key}&$top=3`)).value.map(r => r[key]);
    expect(first3).toHaveLength(3);
    const skip1 = (await d.json(`${SET}?$orderby=${key}&$skip=1&$top=2`)).value.map(r => r[key]);
    expect(skip1).toEqual(first3.slice(1));
  });

  test('$top above the 500 maximum is rejected or capped', async () => {
    const res = await d.get(`${SET}?$top=501`);
    if (res.status() === 400) await expectODataError(res, 400);
    else {
      await expectStatus(res, 200);
      expect(((await res.json()) as ODataCollection).value.length).toBeLessThanOrEqual(500);
    }
  });

  test('$count=true returns the total, independent of $top', async () => {
    const body = await d.json(`${SET}?$count=true&$top=1`);
    expect(typeof body['@odata.count']).toBe('number');
    expect(body['@odata.count']!).toBeGreaterThanOrEqual(sample.length);
    const filtered = await d.json(`${SET}?$count=true&$filter=${key} eq ${literal(t.properties[key].type, sample[0][key])}`);
    expect(filtered['@odata.count']).toBe(1);
  });

  test('$expand one level, with nested $select and $filter', async () => {
    const [nav, info] = Object.entries(t.navigation)[0] ?? [];
    test.skip(!nav, `${SET} declares no navigation property`);
    const csdl = await metadata(d);
    const target = csdl.entityTypes[info!.type] ?? Object.values(csdl.entityTypes).find(e => info!.type.endsWith(`.${e.name}`))!;
    const tkey = target.key[0];

    const body = await d.json(`${SET}?$top=3&$expand=${nav}($select=${tkey})`);
    for (const r of body.value) {
      expect(r).toHaveProperty(nav!);
      const expanded = info!.collection ? (r[nav!] as Row[]) : [r[nav!] as Row].filter(Boolean);
      for (const e of expanded) expect(Object.keys(e).filter(k => !isAnnotation(k))).toEqual([tkey]);
    }
    if (info!.collection) {
      const none = await d.json(`${SET}?$top=3&$expand=${nav}($filter=${tkey} eq null)`);
      for (const r of none.value) expect(r[nav!]).toEqual([]);
    }
  });

  test('server-driven paging with @odata.nextLink', async () => {
    // Ask for a small page (standard OData preference); the server must page when there is more.
    const first = await d.get(`OrderLineItems?$count=true`, { Prefer: 'odata.maxpagesize=5' });
    await expectStatus(first, 200);
    let page = (await first.json()) as ODataCollection;
    const total = page['@odata.count']!;
    expect(typeof total).toBe('number');
    if (total > page.value.length) expect(page['@odata.nextLink'], 'more rows than returned, so a nextLink is required').toBeTruthy();
    test.skip(!page['@odata.nextLink'], 'everything fit on one page');

    const seen = page.value.length;
    let pages = 1;
    let count = seen;
    while (page['@odata.nextLink'] && pages < 5) {
      const next = page['@odata.nextLink'];
      expect(next).toMatch(/OrderLineItems/);
      page = await d.json(next);
      expect(page.value.length).toBeGreaterThan(0);
      count += page.value.length;
      pages++;
    }
    expect(count).toBeLessThanOrEqual(total);
    if (!page['@odata.nextLink']) expect(count).toBe(total);
  });

  test('$search (simple) is supported', async () => {
    const res = await d.get(`${SET}?$search=${encodeURIComponent(String(sample[0][key]))}&$top=5`);
    await expectStatus(res, 200);
    expect(Array.isArray(((await res.json()) as ODataCollection).value)).toBe(true);
  });
});

test.describe('OData · errors', { tag: '@stack' }, () => {
  requireStack();

  test('unknown key -> 404 in the OData error format', async ({ as }) => {
    await expectODataError(await (await as('dispatcher')).get(`${SET}('E2E-DOES-NOT-EXIST')`), 404);
  });

  test('unknown entity set -> 404', async ({ as }) => {
    await expectODataError(await (await as('dispatcher')).get('NoSuchEntitySet'), 404);
  });

  test('invalid $filter -> 400 with a target or message', async ({ as }) => {
    const err = await expectODataError(await (await as('dispatcher')).get(`${SET}?$filter=eq eq eq`), 400);
    expect(err.message.length).toBeGreaterThan(0);
  });

  test('unknown property in $select -> 400', async ({ as }) => {
    await expectODataError(await (await as('dispatcher')).get(`${SET}?$select=noSuchProperty`), 400);
  });

  test('no DELETE on business records', async ({ as, api }) => {
    const d = await as('dispatcher');
    const row = (await d.json(`${SET}?$top=1`)).value[0];
    const res = await api.delete(d.url(await entityPath(d, SET, row)), { headers: d.headers(), failOnStatusCode: false });
    expect([403, 405]).toContain(res.status());
  });
});

test.describe('OData · optimistic concurrency', { tag: '@stack' }, () => {
  requireStack();

  test('entities carry an ETag', async ({ as }) => {
    const d = await as('dispatcher');
    const row = (await d.json(`${SET}?$top=1`)).value[0];
    expect(row['@odata.etag']).toBeTruthy();
    const res = await d.get(await entityPath(d, SET, row));
    await expectStatus(res, 200);
    expect(res.headers()['etag']).toBeTruthy();
  });

  test('PATCH with a stale If-Match -> 412, and the row is unchanged', async ({ as }) => {
    const d = await as('dispatcher');
    const t = entityTypeOf(await metadata(d), SET);
    const row = (await d.json(`${SET}?$top=1`)).value[0];
    const path = await entityPath(d, SET, row);
    const before = await d.json<Row>(path);

    // a no-op change (same value) so a broken precondition check cannot corrupt data
    const prop = stringProp(t);
    const body = prop ? { [prop]: before[prop] } : {};
    const res = await d.patch(path, body, { 'If-Match': 'W/"e2e-stale-etag"' });
    await expectODataError(res, 412);

    const after = await d.json<Row>(path);
    expect(after['@odata.etag']).toEqual(before['@odata.etag']);
  });
});
