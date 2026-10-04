import { resolveRunDay } from '@/model/api';

// a fake OData client: Trips rows by run date, answering the filters resolveRunDay sends
function client(dates: string[]) {
  return {
    list: async (_set: string, q: { filter?: string; orderby?: string }) => {
      const f = q.filter ?? '';
      let rows = dates.map(d => ({ id: d, runDate: `${d}T00:00:00.000Z` }));
      const ge = /runDate ge (\d{4}-\d{2}-\d{2})T.*runDate lt (\d{4}-\d{2}-\d{2})/.exec(f);
      const gt = /runDate gt (\d{4}-\d{2}-\d{2})/.exec(f);
      if (ge) rows = rows.filter(r => r.runDate.slice(0, 10) >= ge[1] && r.runDate.slice(0, 10) < ge[2]);
      if (gt) rows = rows.filter(r => r.runDate.slice(0, 10) > gt[1]);
      rows.sort((a, b) => (q.orderby?.includes('asc') ? a.runDate.localeCompare(b.runDate) : b.runDate.localeCompare(a.runDate)));
      return { value: rows.slice(0, 1) };
    },
  } as never;
}

describe('resolveRunDay', () => {
  it('opens today when today has trips', async () => {
    expect(await resolveRunDay(client(['2026-10-04', '2026-10-07']), '2026-10-04')).toEqual({ date: '2026-10-04', isToday: true });
  });
  it('on a closed day opens the next planned run, not the latest one', async () => {
    expect(await resolveRunDay(client(['2026-10-01', '2026-10-05', '2026-10-07']), '2026-10-04')).toEqual({ date: '2026-10-05', isToday: false });
  });
  it('falls back to the most recent run when nothing is planned ahead', async () => {
    expect(await resolveRunDay(client(['2026-09-30', '2026-10-01']), '2026-10-04')).toEqual({ date: '2026-10-01', isToday: false });
  });
});
