import { OUTLET_ANCHORS, VEHICLE_ANCHORS } from '../scenario';
import {
  SYNTHETIC_TAG, generateSynthetic, prng, syntheticCalendar, withAnchors, withDistrictsFor,
} from './synthetic';

const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

describe('prng', () => {
  it('is deterministic per seed and in [0, 1)', () => {
    const a = prng(42);
    const b = prng(42);
    const xs = Array.from({ length: 100 }, () => a());
    expect(xs).toEqual(Array.from({ length: 100 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(prng(43)()).not.toBe(prng(42)());
  });
});

describe('generateSynthetic', () => {
  const data = generateSynthetic({ seed: 7 });

  it('is deterministic for a seed and differs across seeds', () => {
    expect(generateSynthetic({ seed: 7 })).toEqual(data);
    expect(generateSynthetic({ seed: 8 }).outlets).not.toEqual(data.outlets);
  });

  it('never calls Math.random', () => {
    const spy = jest.spyOn(Math, 'random');
    generateSynthetic({ seed: 1 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('includes every scenario anchor with its story attributes', () => {
    for (const a of OUTLET_ANCHORS) expect(data.outlets).toContainEqual(a);
    for (const a of VEHICLE_ANCHORS) expect(data.vehicles).toContainEqual(a);
  });

  it('has no id collisions', () => {
    expect(dupes(data.outlets.map((o) => o.id))).toEqual([]);
    expect(dupes(data.vehicles.map((v) => v.id))).toEqual([]);
    expect(dupes(data.districts.map((d) => d.district))).toEqual([]);
    expect(dupes(data.calendar.map((c) => c.date.toISOString()))).toEqual([]);
    expect(dupes(data.allowances.map((a) => `${a.brand}/${a.dockType}`))).toEqual([]);
  });

  it('has the expected sizes', () => {
    expect(data.outlets).toHaveLength(30 + OUTLET_ANCHORS.length);
    expect(data.vehicles).toHaveLength(16 + VEHICLE_ANCHORS.length);
    expect(data.allowances).toHaveLength(9);
    expect(data.districts.length).toBeGreaterThanOrEqual(12);
  });

  it('marks generated rows as synthetic', () => {
    const generated = data.outlets.filter((o) => !OUTLET_ANCHORS.some((a) => a.id === o.id));
    expect(generated.every((o) => o.name.startsWith('Synthetic ') && o.address === SYNTHETIC_TAG)).toBe(true);
    expect(data.calendar.every((c) => c.note === SYNTHETIC_TAG)).toBe(true);
  });

  it('has a travel row for every outlet district, with the outlet depot', () => {
    const byName = new Map(data.districts.map((d) => [d.district, d]));
    for (const o of data.outlets) expect(byName.get(o.district)).toBeDefined();
    expect(byName.get('Nuwara Eliya')?.depot).toBe('KANDY');
  });

  it('produces valid HH:mm windows with open < close', () => {
    for (const o of data.outlets) {
      expect(o.windowOpen).toMatch(/^\d{2}:\d{2}$/);
      expect(o.windowClose > o.windowOpen).toBe(true);
    }
  });
});

describe('syntheticCalendar', () => {
  const cal = syntheticCalendar(3);

  it('covers 2026-03-30 .. 2026-06-30 with Sundays closed', () => {
    expect(cal[0].date.toISOString().slice(0, 10)).toBe('2026-03-30');
    expect(cal[cal.length - 1].date.toISOString().slice(0, 10)).toBe('2026-06-30');
    expect(cal).toHaveLength(93);
    for (const d of cal) if (d.date.getUTCDay() === 0) expect(d.isOperating).toBe(false);
  });

  it('keeps the scenario days operating', () => {
    const find = (iso: string) => cal.find((c) => c.date.toISOString().startsWith(iso));
    expect(find('2026-04-06')?.isOperating).toBe(true);
    expect(find('2026-04-07')?.isOperating).toBe(true);
  });

  it('has exactly one synthetic festival and ramps within [0, 1]', () => {
    expect(cal.filter((c) => c.festivalName).length).toBe(1);
    expect(cal.every((c) => c.festivalRamp >= 0 && c.festivalRamp <= 1)).toBe(true);
  });
});

describe('fill helpers', () => {
  it('withAnchors adds only missing ids and never overwrites', () => {
    const existing = [{ id: 'OUT106', name: 'from csv' }] as any[];
    const { rows, added } = withAnchors(existing, OUTLET_ANCHORS as any[]);
    expect(rows.find((r) => r.id === 'OUT106').name).toBe('from csv');
    expect(added).not.toContain('OUT106');
    expect(added).toHaveLength(OUTLET_ANCHORS.length - 1);
  });

  it('withDistrictsFor adds a district row per unknown outlet district', () => {
    const { rows, added } = withDistrictsFor([], [{ district: 'Nowhere', depot: 'KANDY' } as any], 1);
    expect(added).toEqual(['Nowhere']);
    expect(rows[0]).toMatchObject({ district: 'Nowhere', depot: 'KANDY' });
    expect(rows[0].depotToDistMin).toBeGreaterThan(0);
  });
});
