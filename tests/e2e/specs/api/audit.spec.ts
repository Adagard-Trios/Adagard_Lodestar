// PLATFORM.md §2.5 · assume breach: every write lands in the append-only, hash-chained audit log.
import { entityPath, expect, expectStatus, requireStack, test, type ODataCollection } from '../../lib/fixtures';

type Verify = { valid?: boolean; value?: { valid?: boolean } | boolean; [k: string]: unknown };
const isValid = (b: Verify) => b.valid ?? (typeof b.value === 'object' ? b.value?.valid : b.value);

test.describe('Audit · hash chain', { tag: '@stack' }, () => {
  requireStack();

  test('VerifyChain() reports a valid chain', async ({ as }) => {
    const admin = await as('admin');
    const res = await admin.get('AuditEntries/Lodestar.VerifyChain()');
    await expectStatus(res, 200);
    const body = (await res.json()) as Verify;
    expect(isValid(body), JSON.stringify(body).slice(0, 400)).toBe(true);
  });

  test('entries carry sha256 hash and prevHash', async ({ as }) => {
    const admin = await as('admin');
    const page = await admin.json<ODataCollection>('AuditEntries?$top=50');
    expect(page.value.length).toBeGreaterThan(0);
    const hashes = new Set<string>();
    for (const e of page.value) {
      expect(String(e.hash)).toMatch(/^[0-9a-f]{64}$/);
      expect(e).toHaveProperty('prevHash');
      if (e.prevHash !== null && e.prevHash !== '') expect(String(e.prevHash)).toMatch(/^[0-9a-f]{64}$/);
      hashes.add(String(e.hash));
    }
    expect(hashes.size).toBe(page.value.length);
  });

  test('the log is append-only over the API', async ({ as, api }) => {
    const admin = await as('admin');
    const row = (await admin.json<ODataCollection>('AuditEntries?$top=1')).value[0];
    const path = admin.url(await entityPath(admin, 'AuditEntries', row));
    const patch = await api.patch(path, { headers: admin.headers({ 'Content-Type': 'application/json', 'If-Match': '*' }), data: { hash: '0'.repeat(64) }, failOnStatusCode: false });
    expect([403, 405]).toContain(patch.status());
    const del = await api.delete(path, { headers: admin.headers(), failOnStatusCode: false });
    expect([403, 405]).toContain(del.status());
    const post = await admin.post('AuditEntries', { action: 'e2e-forged' });
    expect([403, 405]).toContain(post.status());
  });

  test('the chain is still valid after the suite wrote to it', async ({ as }) => {
    const res = await (await as('admin')).get('AuditEntries/Lodestar.VerifyChain()');
    await expectStatus(res, 200);
    expect(isValid((await res.json()) as Verify)).toBe(true);
  });
});
