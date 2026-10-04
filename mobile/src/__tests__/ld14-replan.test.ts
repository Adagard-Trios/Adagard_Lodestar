import { movedOrders, previousPlan } from '@/model/dock';

describe('LD-14 re-plan: the changed lines', () => {
  it('compares with the version that was in effect before, not a rejected draft', async () => {
    const list = jest.fn().mockResolvedValue({ value: [{ id: 'PLK-2026-10-05-v2' }] });
    const prev = await previousPlan({ list } as any, { depot: 'KANDY', runDate: '2026-10-05T00:00:00Z', version: 4 } as any);
    expect(prev?.id).toBe('PLK-2026-10-05-v2');
    expect(list.mock.calls[0][1].filter).toContain("version lt 4 and status eq 'SUPERSEDED'");
    expect(await previousPlan({ list } as any, { depot: 'KANDY', runDate: '2026-10-05', version: 1 } as any)).toBeNull();
  });

  it("takes the orders the vehicle that can't depart had in that version", () => {
    const prev = { summary: { plan: { trips: [
      { vehicleId: 'VEH039', orderIds: ['O1'] }, { vehicleId: 'VEH039', orderIds: ['O2', 'O3'] }, { vehicleId: 'VEH042', orderIds: ['O4'] },
    ] } } };
    expect(movedOrders(prev as any, [{ id: 'VEH039' }])).toEqual(['O1', 'O2', 'O3']);
    expect(movedOrders(null, [{ id: 'VEH039' }])).toEqual([]);
  });
});
