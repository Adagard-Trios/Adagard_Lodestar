import { fromOs } from '@/lib/notify-permission';

describe('fromOs (notification permission on phones)', () => {
  it('Android 13+ "denied" before the first ask is still askable', () => {
    expect(fromOs({ granted: false, status: 'denied', canAskAgain: true })).toBe('undetermined');
  });
  it('a denial the OS will not ask again is blocked', () => {
    expect(fromOs({ granted: false, status: 'denied', canAskAgain: false })).toBe('denied');
    expect(fromOs({ granted: false, status: 'denied' })).toBe('denied');
  });
  it('granted and undetermined pass through', () => {
    expect(fromOs({ granted: true, status: 'granted', canAskAgain: true })).toBe('granted');
    expect(fromOs({ granted: false, status: 'undetermined', canAskAgain: true })).toBe('undetermined');
  });
});
