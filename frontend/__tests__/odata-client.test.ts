import { buildQuery, formatKey, literal, ODataClient, ODataError, valueOf } from '@/lib/odata/client';
import { fakeResponse, mockApi, page, tokens } from './helpers/live';

describe('OData client · URLs', () => {
  it('builds query options in OData syntax, percent-encoded', () => {
    expect(buildQuery({ filter: "status eq 'RECEIVED'", select: ['id', 'kg'], orderby: 'runDate desc', top: 50, skip: 10, count: true, expand: 'outlet', search: 'rice' }))
      .toBe("?$filter=status%20eq%20'RECEIVED'&$select=id%2Ckg&$expand=outlet&$orderby=runDate%20desc&$top=50&$skip=10&$count=true&$search=rice");
    expect(buildQuery()).toBe('');
    expect(buildQuery({ top: 0 })).toBe('?$top=0');
  });

  it('formats keys: quoted strings (quotes doubled), numbers, composite keys', () => {
    expect(formatKey('ORD0001')).toBe("('ORD0001')");
    expect(formatKey("O'Brien")).toBe("('O''Brien')");
    expect(formatKey(42)).toBe('(42)');
    expect(formatKey({ brand: 'FRESH', dockType: 'REAR_DOCK' })).toBe("(brand='FRESH',dockType='REAR_DOCK')");
  });

  it('writes literals: dates unquoted, strings quoted', () => {
    expect(literal('2026-04-07')).toBe('2026-04-07');
    expect(literal('2026-04-07T00:00:00Z')).toBe('2026-04-07T00:00:00Z');
    expect(literal('KANDY')).toBe("'KANDY'");
    expect(literal(3)).toBe('3');
    expect(literal(true)).toBe('true');
    expect(literal(null)).toBe('null');
  });

  it('unwraps {value} of primitive / untyped operation results', () => {
    expect(valueOf({ value: { answer: 'x' } })).toEqual({ answer: 'x' });
    expect(valueOf({ valid: true })).toEqual({ valid: true });
  });
});

describe('OData client · requests', () => {
  it('sends the bearer token, JSON and OData headers; never cookies', async () => {
    const { client, calls, fetch } = mockApi(() => page([{ id: 'A' }], 1));
    const res = await client.list('Orders', { top: 1, count: true });
    expect(res).toEqual({ value: [{ id: 'A' }], count: 1, nextLink: undefined });
    expect(calls[0].headers).toMatchObject({ Authorization: 'Bearer token-1', Accept: 'application/json', 'OData-Version': '4.0' });
    expect((fetch.mock.calls[0][1] as RequestInit).credentials).toBe('omit');
    expect(calls[0].path).toBe('Orders');
    expect(calls[0].query).toEqual({ $top: '1', $count: 'true' });
  });

  it('follows @odata.nextLink pages on the same origin', async () => {
    const { client, calls } = mockApi(req =>
      req.query.$skiptoken ? page([{ id: 'B' }]) : page([{ id: 'A' }], 2, 'http://localhost/odata/v4/Orders?$skiptoken=2'),
    );
    expect((await client.all('Orders')).map(r => (r as { id: string }).id)).toEqual(['A', 'B']);
    expect(calls).toHaveLength(2);
    expect(calls[1].query.$skiptoken).toBe('2');
  });

  it('refuses a nextLink to another origin (the token must not leave the API)', async () => {
    const { client, calls } = mockApi(() => page([{ id: 'A' }], 2, 'https://evil.example/odata/v4/Orders?$skiptoken=2'));
    await expect(client.all('Orders')).rejects.toMatchObject({ code: 'ForeignLink' });
    expect(calls).toHaveLength(1);
  });

  it('reads an entity with its ETag and builds entity paths', async () => {
    const { client, calls } = mockApi(() => ({ status: 200, body: { id: 'OUT1', name: 'X' }, headers: { ETag: 'W/"1"' } }));
    const row = await client.get('Outlets', 'OUT1', { select: 'id,name' });
    expect(calls[0].path).toBe("Outlets('OUT1')");
    expect(row['@odata.etag']).toBe('W/"1"');
  });

  it('PATCH sends If-Match with the ETag you read', async () => {
    const { client, calls } = mockApi(() => ({ id: 'u1', name: 'New' }));
    await client.update('Users', 'u1', { name: 'New' }, 'W/"123"');
    expect(calls[0]).toMatchObject({ method: 'PATCH', path: "Users('u1')", body: { name: 'New' } });
    expect(calls[0].headers['If-Match']).toBe('W/"123"');
  });

  it('PATCH without an ETag reads the current one first', async () => {
    const { client, calls } = mockApi(req => (req.method === 'GET' ? { id: 'u1', '@odata.etag': 'W/"9"' } : { id: 'u1' }));
    await client.update('Users', 'u1', { isActive: false });
    expect(calls.map(c => c.method)).toEqual(['GET', 'PATCH']);
    expect(calls[1].headers['If-Match']).toBe('W/"9"');
  });

  it('calls bound actions and functions with the Lodestar namespace', async () => {
    const { client, calls } = mockApi(() => ({ valid: true, checked: 3 }));
    await client.action('Plans', 'PLG-1', 'Approve', { note: 'ok' });
    await client.action('Notifications', null, 'Send', { recipientId: 'u' });
    await client.fn('AuditEntries', null, 'VerifyChain');
    await client.fn('Plans', null, 'Board', { depot: 'KANDY', runDate: '2026-04-07' });
    expect(calls.map(c => `${c.method} ${c.path}`)).toEqual([
      "POST Plans('PLG-1')/Lodestar.Approve",
      'POST Notifications/Lodestar.Send',
      'GET AuditEntries/Lodestar.VerifyChain()',
      "GET Plans/Lodestar.Board(depot='KANDY',runDate=2026-04-07)",
    ]);
    expect(calls[0].body).toEqual({ note: 'ok' });
  });

  it('creates with POST and Prefer: return=representation', async () => {
    const { client, calls } = mockApi(() => ({ status: 201, body: { id: 'ORD1' } }));
    expect(await client.create('Orders', { units: 1 })).toEqual({ id: 'ORD1' });
    expect(calls[0]).toMatchObject({ method: 'POST', path: 'Orders', body: { units: 1 } });
    expect(calls[0].headers.Prefer).toBe('return=representation');
  });
});

describe('OData client · errors', () => {
  it('surfaces the OData error body', async () => {
    const { client } = mockApi(() => ({ status: 409, body: { error: { code: 'Conflict', message: 'Order is PLANNED', target: 'status', details: [] } } }));
    const err = (await client.action('Orders', 'O1', 'Cancel').catch(e => e)) as ODataError;
    expect(err).toBeInstanceOf(ODataError);
    expect(err).toMatchObject({ status: 409, code: 'Conflict', message: 'Order is PLANNED', target: 'status' });
  });

  it('falls back to a readable message when the body is not OData', async () => {
    const { client } = mockApi(() => ({ status: 503, body: '<html>down</html>' }));
    await expect(client.list('Orders')).rejects.toMatchObject({ status: 503, code: 'HTTP503', message: 'A Lodestar service is unavailable.' });
  });

  it('reports a network failure as status 0', async () => {
    const client = new ODataClient({ baseUrl: 'http://localhost/odata/v4', tokens: tokens(), fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    await expect(client.list('Orders')).rejects.toMatchObject({ status: 0, code: 'NetworkError' });
  });

  it('on 401 renews the session once and retries with the new token', async () => {
    let n = 0;
    const t = tokens();
    const { client, calls } = mockApi(() => (++n === 1 ? { status: 401, body: { error: { code: 'Unauthorized', message: 'expired' } } } : page([{ id: 'A' }])), t);
    await expect(client.list('Orders')).resolves.toMatchObject({ value: [{ id: 'A' }] });
    expect(calls.map(c => c.headers.Authorization)).toEqual(['Bearer token-1', 'Bearer token-2']);
    expect(t.loginRequired).not.toHaveBeenCalled();
  });

  it('on 401 with no renewable session, sends the user to sign in', async () => {
    const t = tokens({ renew: async () => null });
    const { client } = mockApi(() => ({ status: 401, body: { error: { code: 'Unauthorized', message: 'expired' } } }), t);
    await expect(client.list('Orders')).rejects.toMatchObject({ status: 401 });
    expect(t.loginRequired).toHaveBeenCalledTimes(1);
  });

  it('without any token it does not call the API and asks for sign-in', async () => {
    const t = tokens({ getAccessToken: async () => null });
    const { client, fetch } = mockApi(() => page([]), t);
    await expect(client.list('Orders')).rejects.toMatchObject({ status: 401 });
    expect(fetch).not.toHaveBeenCalled();
    expect(t.loginRequired).toHaveBeenCalled();
  });

  it('treats 204 as an empty success', async () => {
    const client = new ODataClient({ baseUrl: 'http://localhost/odata/v4', tokens: tokens(), fetchImpl: async () => fakeResponse(204) });
    await expect(client.action('Orders', 'O1', 'SetStatus', { status: 'LOADED' })).resolves.toBeUndefined();
  });
});
