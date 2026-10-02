import { AGENT_TIMEOUT_MS, AgentClient } from './agent.client';

const AUTH = 'Bearer dispatcher-token';

function response(status: number, body: unknown = {}): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(status === 204 ? null : text, { status, headers: { 'Content-Type': 'application/json' } });
}

describe('AgentClient', () => {
  const saved = process.env.AGENT_URL;
  let calls: { url: string; init: RequestInit }[];
  let next: () => Promise<Response>;
  let client: AgentClient;

  beforeEach(() => {
    process.env.AGENT_URL = 'http://agent.test:8000/';
    calls = [];
    next = async () => response(200, { id: 'run-1', status: 'DRAFTING' });
    const fake = (async (url: any, init: any) => {
      calls.push({ url: String(url), init });
      return next();
    }) as typeof fetch;
    client = new AgentClient(fake);
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.AGENT_URL;
    else process.env.AGENT_URL = saved;
  });

  it('starts a run with the caller token and JSON body', async () => {
    await expect(client.startRun('KANDY', '2026-04-07', AUTH)).resolves.toEqual({ id: 'run-1', status: 'DRAFTING' });
    expect(calls[0].url).toBe('http://agent.test:8000/runs');
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as any).Authorization).toBe(AUTH);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ depot: 'KANDY', runDate: '2026-04-07' });
  });

  it('encodes ids and only sends edits/comment when given', async () => {
    await client.getRun('a/b', AUTH);
    expect(calls[0].url).toBe('http://agent.test:8000/runs/a%2Fb');
    expect(calls[0].init.body).toBeUndefined();
    await client.resume('run-1', AUTH, 'approve');
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ decision: 'approve' });
    await client.resume('run-1', AUTH, 'edit', [{ op: 'x' }], 'c');
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ decision: 'edit', edits: [{ op: 'x' }], comment: 'c' });
    await client.ask('run-1', 'why?', AUTH);
    expect(calls[3].url).toBe('http://agent.test:8000/ask');
  });

  it('refuses to call without an authorization header (403)', async () => {
    await expect(client.getRun('run-1', '')).rejects.toMatchObject({ status: 403 });
    expect(calls).toHaveLength(0);
  });

  it.each([
    [401, 401],
    [403, 403],
    [404, 404],
    [400, 409],
    [409, 409],
    [422, 409],
    [500, 502],
    [503, 502],
  ])('maps agent HTTP %p to ODataError %p', async (status, expected) => {
    next = async () => response(status, { detail: 'nope' });
    await expect(client.getRun('run-1', AUTH)).rejects.toMatchObject({ status: expected });
  });

  it('uses the agent error message in a conflict', async () => {
    next = async () => response(409, { error: { message: 'run is APPROVED' } });
    await expect(client.resume('run-1', AUTH, 'approve')).rejects.toThrow(/run is APPROVED/);
  });

  it('waits up to 120 s for a draft and turns a timeout into a 504 AgentTimeout the screen can explain', async () => {
    next = async () => { throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }); };
    await expect(client.startRun('PELIYAGODA', '2026-10-05', AUTH)).rejects.toMatchObject({ status: 504, code: 'AgentTimeout' });
    expect(AGENT_TIMEOUT_MS).toBe(120_000);
  });

  it('maps a network failure to 503', async () => {
    next = async () => {
      throw new Error('ECONNREFUSED');
    };
    await expect(client.getRun('run-1', AUTH)).rejects.toMatchObject({ status: 503 });
  });
});
