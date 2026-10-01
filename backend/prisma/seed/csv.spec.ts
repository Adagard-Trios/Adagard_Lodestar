import { hasColumn, normalizeHeader, parseCsv, pick, readCsvRecords } from './csv';

describe('parseCsv', () => {
  it('parses simple rows with LF and CRLF endings', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('handles a missing trailing newline and trailing empty field', () => {
    expect(parseCsv('a,b\n1,')).toEqual([['a', 'b'], ['1', '']]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('﻿x,y\n1,2')).toEqual([['x', 'y'], ['1', '2']]);
  });

  it('handles quoted fields with commas, newlines and "" escapes', () => {
    const text = 'name,note\r\n"Alpha, Ltd","said ""hi""\r\nthen left"\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'note'],
      ['Alpha, Ltd', 'said "hi"\r\nthen left'],
    ]);
  });

  it('keeps empty quoted fields and empty unquoted fields', () => {
    expect(parseCsv('a,b,c\n"",,x\n')).toEqual([['a', 'b', 'c'], ['', '', 'x']]);
  });

  it('skips blank lines', () => {
    expect(parseCsv('a\n\n1\n\r\n2\n')).toEqual([['a'], ['1'], ['2']]);
  });

  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('﻿')).toEqual([]);
  });
});

describe('normalizeHeader', () => {
  it.each([
    ['road_class', 'road_class'],
    ['roadClass', 'road_class'],
    ['Road Class', 'road_class'],
    ['  ROAD-CLASS ', 'road_class'],
    ['﻿date', 'date'],
    ['weeklyLFuel', 'weekly_l_fuel'],
    ['capacityM3', 'capacity_m3'],
    ['depotToDistMin', 'depot_to_dist_min'],
    ['window  open -- time', 'window_open_time'],
  ])('%j -> %s', (input, expected) => {
    expect(normalizeHeader(input)).toBe(expected);
  });
});

describe('readCsvRecords / pick / hasColumn', () => {
  it('keys records by normalised header and trims cells', () => {
    const { headers, records } = readCsvRecords('Outlet ID, Brand \n  X1 , Fresh\nX2\n');
    expect(headers).toEqual(['outlet_id', 'brand']);
    expect(records).toEqual([
      { outlet_id: 'X1', brand: 'Fresh' },
      { outlet_id: 'X2', brand: '' },
    ]);
  });

  it('pick returns the first non-blank alias', () => {
    const rec = { a: '', b: '2', c: '3' };
    expect(pick(rec, ['a', 'b', 'c'])).toBe('2');
    expect(pick(rec, ['z'])).toBeUndefined();
  });

  it('hasColumn checks any alias', () => {
    expect(hasColumn(['x', 'y'], ['q', 'y'])).toBe(true);
    expect(hasColumn(['x'], ['q'])).toBe(false);
  });
});
