import { network, osConnected, reportReachable } from '@/offline/network';

describe('network: a failed API call vs the OS link', () => {
  it('a failed call marks the app offline but keeps the OS link, so the outbox still retries', () => {
    reportReachable(false);
    expect(network.get().online).toBe(false);
    expect(osConnected()).toBe(true);
    reportReachable(true);
    expect(network.get().online).toBe(true);
  });
});
