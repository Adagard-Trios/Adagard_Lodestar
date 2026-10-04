import { deciderOf, deferredFrom } from '@/live/dsp-17-deferral-log';
import type { Deferral } from '@/lib/odata/types';

const plan = { id: 'PLK-2026-10-07-v1', runDate: '2026-10-07T00:00:00.000Z', approvedBy: 'nilanthi' } as Deferral['plan'];
const order = { runDate: '2026-10-08T00:00:00.000Z' } as Deferral['order'];

describe('DSP-17 deferral log rows', () => {
  it('names the dispatcher who approved the plan when the plan confirmed the deferral', () => {
    expect(deciderOf({ resolvedBy: null, plan })).toBe('nilanthi');
    expect(deciderOf({ resolvedBy: 'kandy-dispatcher', plan })).toBe('kandy-dispatcher');
    expect(deciderOf({ resolvedBy: null })).toBeNull();
  });
  it("shows the run the order was deferred from, not the run it moved to", () => {
    expect(deferredFrom({ plan, order })).toBe('2026-10-07T00:00:00.000Z');
    expect(deferredFrom({ order })).toBe('2026-10-08T00:00:00.000Z');
  });
});
