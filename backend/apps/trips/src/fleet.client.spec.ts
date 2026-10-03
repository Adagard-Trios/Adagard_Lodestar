import { Logger } from '@nestjs/common';
import { ServiceTokenClient } from '@lodestar/security';
import { FleetClient } from './fleet.client';
// the client reads its address from configuration only
process.env.FLEET_URL = process.env.FLEET_URL || 'http://fleet.test:3004';

describe('FleetClient (brief item 12: fleet updates are never silently dropped)', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  const tokens = (configured: boolean, fetch = jest.fn()) => ({ configured, fetch }) as unknown as ServiceTokenClient;

  it('without fleet service credentials, RecordFuel logs a WARN naming the trip and the vehicle, and reports false', async () => {
    const fetch = jest.fn();
    const client = new FleetClient(tokens(false, fetch));
    await expect(client.recordFuel('VEH057', 8, 'T-KANDY-1')).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/RecordFuel 8 L → VEH057 for trip T-KANDY-1 skipped: no fleet service credentials/);
  });

  it('SetStatus says which trip too', async () => {
    const client = new FleetClient(tokens(false));
    await expect(client.setStatus('VEH057', 'WORKSHOP', 'Reefer not cooling', 'T-KANDY-1')).resolves.toBe(false);
    expect(warn.mock.calls[0][0]).toMatch(/SetStatus WORKSHOP → VEH057 for trip T-KANDY-1 skipped/);
  });

  it('a failed call is a WARN with the trip id; a good one is not logged', async () => {
    const fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'down' })
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' });
    const client = new FleetClient(tokens(true, fetch));
    await expect(client.recordFuel('VEH057', 8, 'T1')).resolves.toBe(false);
    expect(warn.mock.calls[0][0]).toMatch(/RecordFuel 8 L → VEH057 for trip T1 failed: HTTP 503 down/);
    await expect(client.recordFuel('VEH057', 8, 'T1')).resolves.toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1][0]).toMatch(/\/odata\/v4\/Vehicles\('VEH057'\)\/Lodestar\.RecordFuel$/);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ litres: 8 });
  });
});
