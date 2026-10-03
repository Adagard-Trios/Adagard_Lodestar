import { ODataError } from '@lodestar/odata';
import { AgentClient } from './agent.client';
// the client reads its address from configuration only
process.env.AGENT_URL = process.env.AGENT_URL || 'http://agent.test:8000';

describe('AgentClient.config / AgentRuns AgentConfig (DSP-16, ADM-17)', () => {
  it('reads GET /config with the caller’s token', async () => {
    const fetchImpl = jest.fn(async () => new Response(JSON.stringify({ humanApproval: true, canPublish: false }), { status: 200 }));
    const client = new AgentClient(fetchImpl as any);
    await expect(client.config('Bearer t')).resolves.toEqual({ humanApproval: true, canPublish: false });
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringMatching(/\/config$/), expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer t' }) }));
  });

  it('maps an unreachable agent to 503 and a missing token to 403', async () => {
    const down = new AgentClient((async () => { throw new Error('ECONNREFUSED'); }) as any);
    await expect(down.config('Bearer t')).rejects.toMatchObject({ status: 503 });
    await expect(new AgentClient(jest.fn() as any).config('')).rejects.toBeInstanceOf(ODataError);
  });
});
