// PLATFORM.md §2 · zero trust: identity on every call, least privilege (RBAC + ABAC), no trusted callers.
import { decodeJwt, expiredToken, tamper, tokenFor, unsigned } from '../../lib/auth';
import { AUDIENCE, ISSUER, OTHER_OUTLET, PERSONAS, SEED_PLAN_ID } from '../../lib/env';
import { OData, entityPath, expect, expectODataError, expectStatus, requireStack, test, type ODataCollection } from '../../lib/fixtures';

const OUTLET_PROP = process.env.E2E_ORDER_OUTLET_PROP || 'outletId';

// A GET on every entity set named in the contract.
const ENTITY_SETS = [
  'Orders', 'OrderLineItems', 'Plans', 'Deferrals', 'Vehicles', 'Outlets', 'Calendar', 'DistrictTravel',
  'ServiceAllowances', 'Trips', 'TripStops', 'PODs', 'LoadRecords', 'OfflineEvents', 'Notifications',
  'AuditEntries', 'Users', 'Devices', 'AgentRuns',
];

test.describe('Zero trust · identity on every call', { tag: '@stack' }, () => {
  requireStack();

  for (const set of ENTITY_SETS) {
    test(`no token -> 401 on ${set}`, async ({ anon }) => {
      const res = await anon.get(`${set}?$top=1`);
      await expectODataError(res, 401);
      expect(res.headers()['www-authenticate'] ?? '').toMatch(/Bearer/i);
    });
  }

  test('no token -> 401 on $metadata and the service document', async ({ anon }) => {
    await expectStatus(await anon.get('$metadata'), 401);
    await expectStatus(await anon.get(''), 401);
  });

  test('no token -> 401 on an action', async ({ anon }) => {
    await expectODataError(await anon.post(`Plans('${SEED_PLAN_ID}')/Lodestar.Approve`), 401);
  });

  test('malformed and non-bearer credentials -> 401', async ({ api }) => {
    for (const auth of ['Bearer', 'Bearer not-a-jwt', 'Basic ZGlzcGF0Y2hlcjpwYXNz', 'Bearer a.b.c']) {
      const res = await api.get(new OData(api).url('Orders?$top=1'), { headers: { Authorization: auth, Accept: 'application/json' }, failOnStatusCode: false });
      expect(res.status(), auth).toBe(401);
    }
  });

  test('expired token -> 401', async ({ api }) => {
    const { token, genuine } = await expiredToken(api);
    test.info().annotations.push({ type: 'expired-token', description: genuine ? 'captured Keycloak token (valid signature)' : 'back-dated exp (signature also invalid); set E2E_EXPIRED_TOKEN for a genuine one' });
    const res = await new OData(api, token).get('Orders?$top=1');
    await expectODataError(res, 401);
  });

  test('tampered token (payload changed, signature kept) -> 401', async ({ api }) => {
    const real = await tokenFor('storeManager', api);
    // try to escalate: add the dispatcher role and drop the outlet restriction
    const forged = tamper(real, { realm_access: { roles: ['dispatcher', 'admin'] }, outlet_id: undefined });
    await expectODataError(await new OData(api, forged).get('Orders?$top=1'), 401);
  });

  test('unsigned token (alg none) -> 401', async ({ api }) => {
    const real = await tokenFor('dispatcher', api);
    await expectODataError(await new OData(api, unsigned(real)).get('Orders?$top=1'), 401);
  });
});

test.describe('Zero trust · tokens carry what services verify', { tag: '@stack' }, () => {
  requireStack();

  test('RS256, issuer, audience lodestar-api, roles and ABAC claims', async ({ api }) => {
    for (const [key, p] of Object.entries(PERSONAS)) {
      const { header, payload } = decodeJwt(await tokenFor(key as keyof typeof PERSONAS, api));
      expect(header.alg, key).toBe('RS256');
      expect(payload.iss, key).toBe(ISSUER);
      expect([payload.aud].flat(), key).toContain(AUDIENCE);
      expect((payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [], key).toContain(p.role);
      expect(Number(payload.exp), key).toBeGreaterThan(Date.now() / 1000);
      if (p.role === 'store_manager') expect(payload.outlet_id, key).toBe(p.outletId);
      if (p.role === 'dispatcher') expect([payload.depot].flat().sort(), key).toEqual(['KANDY', 'PELIYAGODA']);
    }
  });
});

test.describe('Zero trust · least privilege (RBAC)', { tag: '@stack' }, () => {
  requireStack();

  for (const who of ['storeManager', 'loader', 'driver', 'admin'] as const) {
    test(`${who} cannot approve a plan -> 403`, async ({ as }) => {
      const res = await (await as(who)).post(`Plans('${SEED_PLAN_ID}')/Lodestar.Approve`);
      await expectODataError(res, 403);
    });
  }
});

test.describe('Zero trust · row filters (ABAC)', { tag: '@stack' }, () => {
  requireStack();

  test("a store manager only ever sees their own outlet's Orders", async ({ as }) => {
    const me = PERSONAS.storeManager.outletId!;
    const sm = await as('storeManager');

    const all = await sm.json<ODataCollection>(`Orders?$count=true&$top=500`);
    expect(all.value.length, 'the seeded scenario has orders for the store manager').toBeGreaterThan(0);
    for (const o of all.value) expect(o[OUTLET_PROP]).toBe(me);

    // asking for another outlet explicitly returns nothing, not an error that leaks existence
    const other = await sm.json<ODataCollection>(`Orders?$filter=${OUTLET_PROP} eq '${OTHER_OUTLET}'&$count=true`);
    expect(other.value).toHaveLength(0);
    expect(other['@odata.count'] ?? 0).toBe(0);

    // trying to widen the filter with `or` still cannot escape the row filter
    const widened = await sm.json<ODataCollection>(`Orders?$filter=${OUTLET_PROP} eq '${OTHER_OUTLET}' or ${OUTLET_PROP} ne '${OTHER_OUTLET}'&$top=500`);
    for (const o of widened.value) expect(o[OUTLET_PROP]).toBe(me);
  });

  test("a store manager cannot open another outlet's order by key", async ({ as }) => {
    const dispatcher = await as('dispatcher');
    const theirs = await dispatcher.json<ODataCollection>(`Orders?$filter=${OUTLET_PROP} eq '${OTHER_OUTLET}'&$top=1`);
    test.skip(theirs.value.length === 0, `no orders for ${OTHER_OUTLET} in the seed`);
    const sm = await as('storeManager');
    const res = await sm.get(await entityPath(dispatcher, 'Orders', theirs.value[0]));
    expect([403, 404]).toContain(res.status());
    await expectODataError(res, res.status());
  });

  test('the dispatcher sees orders from more than one outlet', async ({ as }) => {
    const d = await as('dispatcher');
    const page = await d.json<ODataCollection>(`Orders?$select=${OUTLET_PROP}&$top=500`);
    expect(new Set(page.value.map(o => o[OUTLET_PROP])).size).toBeGreaterThan(1);
  });
});
