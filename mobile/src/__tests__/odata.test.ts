import { inList, key, lit, ODataClient, ODataError, queryString } from '@/lib/odata';

type Call = { url: string; init: RequestInit };

function reply(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `S${status}`,
    text: async () => text,
    headers: { get: (h: string) => headers[h] ?? headers[h.toLowerCase()] ?? null },
  } as unknown as Response;
}

function setup(responses: Response[], opts: Partial<ConstructorParameters<typeof ODataClient>[0]> = {}) {
  const calls: Call[] = [];
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new TypeError('Network request failed');
    return next;
  });
  const c = new ODataClient({
    baseUrl: 'https://api.test',
    fetch: fetchMock as unknown as typeof fetch,
    getToken: async () => 'tok-1',
    getDeviceId: async () => 'DEV-TEST',
    ...opts,
  });
  return { c, calls, fetchMock };
}

const headers = (c: Call) => c.init.headers as Record<string, string>;

describe('OData literals and query options', () => {
  it('quotes strings with doubled single quotes', () => {
    expect(lit("O'Brien")).toBe("'O''Brien'");
    expect(key('ORD1')).toBe("('ORD1')");
    expect(key(42)).toBe('(42)');
    expect(inList('id', ['a', "b'c"])).toBe("id in ('a','b''c')");
  });

  it('encodes system query options', () => {
    expect(queryString({ filter: "tripId eq 'T 1'", select: ['id', 'bay'], top: 5, count: true, orderby: 'stopSeq' })).toBe(
      '?$filter=tripId%20eq%20\'T%201\'&$select=id%2Cbay&$orderby=stopSeq&$top=5&$count=true',
    );
  });
});

describe('ODataClient', () => {
  it('sends the bearer token, the device id and the idempotency key', async () => {
    const { c, calls } = setup([reply(200, { value: { ok: true } })]);
    await c.action("Trips('T1')/Lodestar.Release", { sealNumber: 'S-1' }, { idempotencyKey: 'u-1' });
    expect(calls[0].url).toBe("https://api.test/odata/v4/Trips('T1')/Lodestar.Release");
    expect(calls[0].init.method).toBe('POST');
    expect(headers(calls[0]).Authorization).toBe('Bearer tok-1');
    expect(headers(calls[0])['X-Device-Id']).toBe('DEV-TEST');
    expect(headers(calls[0])['Idempotency-Key']).toBe('u-1');
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ sealNumber: 'S-1' });
  });

  it('leaves extra headers out where a CORS preflight would refuse them', async () => {
    const { c, calls } = setup([reply(200, { value: [] })], { extraHeaders: () => false });
    await c.list('Trips');
    expect(headers(calls[0])['X-Device-Id']).toBeUndefined();
    expect(headers(calls[0]).Authorization).toBe('Bearer tok-1');
  });

  it('reads collections and follows @odata.nextLink against its own base URL', async () => {
    const { c, calls } = setup([
      reply(200, { '@odata.count': 3, value: [{ id: 1 }, { id: 2 }], '@odata.nextLink': 'https://localhost:8443/odata/v4/Trips?$skip=2' }),
      reply(200, { value: [{ id: 3 }] }),
    ]);
    const all = await c.all<{ id: number }>('Trips', { count: true });
    expect(all.map(r => r.id)).toEqual([1, 2, 3]);
    expect(calls[1].url).toBe('https://api.test/odata/v4/Trips?$skip=2');
  });

  it('keeps the ETag of a single entity and sends If-Match on PATCH', async () => {
    const { c, calls } = setup([reply(200, { id: 'ORD1', units: 3 }, { ETag: 'W/"abc"' }), reply(200, { id: 'ORD1', units: 4 })]);
    const order = await c.get<{ id: string }>('Orders', 'ORD1');
    expect(order['@odata.etag']).toBe('W/"abc"');
    await c.patch('Orders', 'ORD1', { units: 4 }, order['@odata.etag']!);
    expect(calls[1].init.method).toBe('PATCH');
    expect(headers(calls[1])['If-Match']).toBe('W/"abc"');
  });

  it('turns the OData error body into an ODataError', async () => {
    const { c } = setup([reply(409, { error: { code: 'Conflict', message: 'A ENROUTE trip cannot be released', target: null, details: [] } })]);
    await expect(c.action("Trips('T1')/Lodestar.Release", {})).rejects.toMatchObject({ status: 409, code: 'Conflict', message: 'A ENROUTE trip cannot be released' });
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    let token = 'old';
    const onUnauthorized = jest.fn(async () => {
      token = 'new';
      return true;
    });
    const { c, calls } = setup([reply(401, { error: { code: 'Unauthorized', message: 'jwt expired' } }), reply(200, { value: [] })], {
      getToken: async () => token,
      onUnauthorized,
    });
    await c.list('Trips');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(headers(calls[1]).Authorization).toBe('Bearer new');
  });

  it('does not loop on a second 401', async () => {
    const onUnauthorized = jest.fn(async () => true);
    const { c } = setup([reply(401, { error: { code: 'Unauthorized', message: 'Device is revoked' } }), reply(401, { error: { code: 'Unauthorized', message: 'Device is revoked' } })], { onUnauthorized });
    const err = await c.list('Trips').catch(e => e);
    expect(err).toBeInstanceOf(ODataError);
    expect(err.isDeviceProblem).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('reports a network failure as status 0 and tells the network watcher', async () => {
    const onNetwork = jest.fn();
    const { c } = setup([], { onNetwork });
    const err = await c.list('Trips').catch(e => e);
    expect(err).toMatchObject({ status: 0, code: 'NetworkError', isTransient: true });
    expect(onNetwork).toHaveBeenCalledWith(false);
  });

  it('unwraps untyped function results', async () => {
    const { c, calls } = setup([reply(200, { '@odata.context': 'x', value: [{ id: 'T1' }] })]);
    const trips = await c.fn<{ id: string }[]>("Trips/Lodestar.BayQueue(depot='KANDY',runDate=2026-04-07)");
    expect(trips).toEqual([{ id: 'T1' }]);
    expect(calls[0].init.method).toBe('GET');
  });
});
