import { anything, instance, mock, verify, when } from 'ts-mockito';
import { personas } from '../../../libs/security/test/principals';
import { minutesOf, OutletsService } from './outlets.service';
import { OutletsSet, ServiceAllowancesSet } from './outlets.sets';


describe('OutletsSet', () => {
  let set: OutletsSet;

  beforeEach(() => {
    set = new OutletsSet({} as any, new OutletsService());
  });

  describe('beforeCreate', () => {
    it('accepts a valid window', async () => {
      const data = { id: 'OUT200', windowOpen: '05:30', windowClose: '08:00' };
      await expect(set.beforeCreate(data)).resolves.toBe(data);
    });

    it.each([
      ['08:00', '05:30'],
      ['08:00', '08:00'],
      ['5:30', '08:00'],
      ['05:30', '24:00'],
      ['05:60', '08:00'],
      [undefined, '08:00'],
    ])('rejects window %p–%p with 400', async (open, close) => {
      await expect(set.beforeCreate({ windowOpen: open, windowClose: close })).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('beforeUpdate', () => {
    const current = { id: 'OUT106', windowOpen: '05:30', windowClose: '08:00' };

    it('validates a partial window change against the current values', async () => {
      await expect(set.beforeUpdate({ windowClose: '09:00' }, current)).resolves.toEqual({ windowClose: '09:00' });
      await expect(set.beforeUpdate({ windowClose: '05:00' }, current)).rejects.toMatchObject({ status: 400 });
      await expect(set.beforeUpdate({ windowOpen: '08:30' }, current)).rejects.toMatchObject({ status: 400 });
    });

    it('accepts a mall delivery window "HH:mm-HH:mm" or null, and nothing else', async () => {
      await expect(set.beforeUpdate({ mallWindow: '09:15-11:45' }, current)).resolves.toEqual({ mallWindow: '09:15-11:45' });
      await expect(set.beforeUpdate({ mallWindow: null }, current)).resolves.toEqual({ mallWindow: null });
      for (const bad of ['11:45-09:15', '09:15', '9-11', '09:15-10:00-11:00']) {
        await expect(set.beforeUpdate({ mallWindow: bad }, current)).rejects.toMatchObject({ status: 400, target: 'mallWindow' });
      }
    });

    it('skips validation when the window is untouched', async () => {
      await expect(set.beforeUpdate({ name: 'New name' }, current)).resolves.toEqual({ name: 'New name' });
    });
  });

  it('IsWindowOpen delegates with the bound entity', () => {
    const outlets = mock(OutletsService);
    const s = new OutletsSet({} as any, instance(outlets));
    const entity = { id: 'OUT106', windowOpen: '05:30', windowClose: '08:00' };
    when(outlets.isWindowOpen(anything())).thenReturn(true);
    expect(s.isWindowOpen({ principal: personas.fathima, params: {}, entity, headers: {} })).toBe(true);
    verify(outlets.isWindowOpen(entity)).once();
  });
});

describe('ServiceAllowancesSet.beforeUpdate', () => {
  it('bounds minutes to 1..240', async () => {
    const set = new ServiceAllowancesSet({} as any);
    await expect(set.beforeUpdate({ minutes: 20 })).resolves.toEqual({ minutes: 20 });
    await expect(set.beforeUpdate({ minutes: 0 })).rejects.toMatchObject({ status: 400 });
    await expect(set.beforeUpdate({ minutes: 241 })).rejects.toMatchObject({ status: 400 });
  });
});

describe('OutletsService', () => {
  const service = new OutletsService();
  const outlet = { windowOpen: '05:30', windowClose: '08:00' };

  it('minutesOf parses HH:mm', () => {
    expect(minutesOf('05:30')).toBe(330);
    expect(minutesOf('23:59')).toBe(1439);
  });

  describe('isWindowOpen (Sri Lanka time, UTC+5:30)', () => {
    it('is open at 05:30 local = 00:00 UTC', () => {
      expect(service.isWindowOpen(outlet, new Date('2026-04-07T00:00:00.000Z'))).toBe(true);
    });

    it('is open at 08:00 local (inclusive close) = 02:30 UTC', () => {
      expect(service.isWindowOpen(outlet, new Date('2026-04-07T02:30:00.000Z'))).toBe(true);
    });

    it('is closed at 05:29 local = 23:59 UTC the previous day', () => {
      expect(service.isWindowOpen(outlet, new Date('2026-04-06T23:59:00.000Z'))).toBe(false);
    });

    it('is closed at 08:01 local = 02:31 UTC', () => {
      expect(service.isWindowOpen(outlet, new Date('2026-04-07T02:31:00.000Z'))).toBe(false);
    });

    it('does not use UTC wall-clock time', () => {
      // 06:00 UTC is inside a 05:30–08:00 window only if read as UTC; it is 11:30 in Colombo.
      expect(service.isWindowOpen(outlet, new Date('2026-04-07T06:00:00.000Z'))).toBe(false);
    });

    it('defaults to now', () => {
      jest.useFakeTimers({ now: new Date('2026-04-07T01:00:00.000Z') });
      try {
        expect(service.isWindowOpen(outlet)).toBe(true);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('validWindow', () => {
    it('requires HH:mm with open before close', () => {
      expect(service.validWindow('05:30', '08:00')).toBe(true);
      expect(service.validWindow('00:00', '23:59')).toBe(true);
      expect(service.validWindow('08:00', '05:30')).toBe(false);
      expect(service.validWindow('08:00', '08:00')).toBe(false);
      expect(service.validWindow('8:00', '09:00')).toBe(false);
      expect(service.validWindow('07:00', '24:00')).toBe(false);
      expect(service.validWindow('07:00', '09:75')).toBe(false);
      expect(service.validWindow('07:00 ', '09:00')).toBe(false);
    });
  });
});
