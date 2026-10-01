// PLATFORM.md §3 actions and §4 planning agent: humans approve, the agent only drafts.
import { expect as pwExpect } from '@playwright/test';
import { serviceToken } from '../../lib/auth';
import { SEED_DEPOT, SEED_PLAN_ID, SEED_RUN_DATE } from '../../lib/env';
import { OData, expect, expectODataError, expectStatus, requireStack, test } from '../../lib/fixtures';

const AGENT_CLIENT_ID = process.env.E2E_AGENT_CLIENT_ID || 'svc-agent';
const AGENT_CLIENT_SECRET = process.env.E2E_AGENT_CLIENT_SECRET;

type AgentRun = { id: string; status: string; planId?: string; [k: string]: unknown };

async function waitForStatus(d: OData, id: string, want: string, timeout = 90_000): Promise<AgentRun> {
  let run: AgentRun | undefined;
  await pwExpect
    .poll(async () => {
      run = await d.json<AgentRun>(`AgentRuns('${id}')`);
      return run.status;
    }, { timeout, intervals: [500, 1000, 2000] })
    .toBe(want);
  return run!;
}

test.describe('Actions · Plans Approve', { tag: '@stack' }, () => {
  requireStack();

  test('non-dispatchers get 403 (covered per role in zero-trust.spec), the dispatcher succeeds', async ({ as }) => {
    const d = await as('dispatcher');
    const res = await d.post(`Plans('${SEED_PLAN_ID}')/Lodestar.Approve`);
    // 409 when an earlier run of this suite already approved the seeded plan
    await expectStatus(res, [200, 204, 409]);
    if (res.status() === 409) await expectODataError(res, 409);

    const plan = await d.json<Record<string, unknown>>(`Plans('${SEED_PLAN_ID}')`);
    expect(String(plan.status ?? '')).toMatch(/APPROVED|LIVE|PUBLISHED/i);
  });

  test('approving an unknown plan -> 404', async ({ as }) => {
    await expectODataError(await (await as('dispatcher')).post(`Plans('PLG-E2E-NOPE')/Lodestar.Approve`), 404);
  });
});

test.describe('Actions · the agent cannot publish', { tag: '@stack' }, () => {
  requireStack();

  test('svc-agent service identity is refused on Approve and Resume', async ({ api }) => {
    test.skip(!AGENT_CLIENT_SECRET, 'set E2E_AGENT_CLIENT_SECRET to test the svc-agent identity');
    const agent = new OData(api, await serviceToken(AGENT_CLIENT_ID, AGENT_CLIENT_SECRET!, api));
    await expectODataError(await agent.post(`Plans('${SEED_PLAN_ID}')/Lodestar.Approve`), 403);
    await expectODataError(await agent.post(`AgentRuns('any')/Lodestar.Resume`, { decision: 'approve' }), 403);
  });
});

test.describe('Actions · AgentRuns human-in-the-loop', { tag: '@stack' }, () => {
  requireStack();
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  let runId: string;

  test('a dispatcher starts a draft run', async ({ as }) => {
    const d = await as('dispatcher');
    const res = await d.post('AgentRuns', { depot: SEED_DEPOT, runDate: SEED_RUN_DATE });
    await expectStatus(res, [200, 201]);
    const run = (await res.json()) as AgentRun;
    expect(run.id).toBeTruthy();
    expect(typeof run.status).toBe('string');
    runId = run.id;
  });

  test('the run stops at NEEDS_APPROVAL and publishes nothing', async ({ as }) => {
    const d = await as('dispatcher');
    const run = await waitForStatus(d, runId, 'NEEDS_APPROVAL');
    if (run.planId) {
      const plan = await d.json<Record<string, unknown>>(`Plans('${run.planId}')`);
      expect(String(plan.status ?? '')).not.toMatch(/APPROVED|LIVE|PUBLISHED/i);
    }
  });

  test('only a dispatcher can resume it', async ({ as }) => {
    for (const who of ['storeManager', 'loader', 'driver', 'admin'] as const) {
      const res = await (await as(who)).post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'approve' });
      await expectODataError(res, 403);
    }
    const d = await as('dispatcher');
    expect((await d.json<AgentRun>(`AgentRuns('${runId}')`)).status).toBe('NEEDS_APPROVAL');
  });

  test('an invalid decision is rejected', async ({ as }) => {
    const res = await (await as('dispatcher')).post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'publish-it-yourself' });
    await expectODataError(res, 400);
  });

  test('Resume approve by the dispatcher completes the run', async ({ as }) => {
    const d = await as('dispatcher');
    const res = await d.post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'approve' });
    await expectStatus(res, [200, 202, 204]);
    await pwExpect
      .poll(async () => (await d.json<AgentRun>(`AgentRuns('${runId}')`)).status, { timeout: 60_000 })
      .toMatch(/APPROVED|COMPLETED|DONE|PUBLISHED/i);
  });

  test('a finished run cannot be resumed again', async ({ as }) => {
    const res = await (await as('dispatcher')).post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'approve' });
    await expectODataError(res, 409);
  });
});
