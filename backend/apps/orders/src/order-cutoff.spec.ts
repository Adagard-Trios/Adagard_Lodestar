import { ODataError } from '@lodestar/odata';
import { Roles } from '@lodestar/security';
import { assertStoreMayEdit, cutoffSettings, decideCutoff, movedNote } from './order-cutoff';

// Run Tue 7 Apr 2026 closes at Mon 6 Apr 16:00 Colombo = 10:30 UTC.
const RUN = '2026-04-07';
const at = (iso: string) => new Date(iso);
const ON = { enforce: true, graceHours: 6 };
const store = [Roles.StoreManager];
const dispatch = [Roles.Dispatcher];

function code(fn: () => unknown): string | undefined {
  try { fn(); } catch (e) { return e instanceof ODataError ? e.code : String(e); }
  return undefined;
}

describe('4:00 PM order cut-off', () => {
  it('accepts a store order before the cut-off and stamps the server time', () => {
    const now = at('2026-04-06T10:29:00Z'); // 3:59 PM Colombo
    expect(decideCutoff({ roles: store, runDate: RUN, now }, ON)).toEqual({ orderedAt: now, latePhone: false, lateReason: null });
  });

  it('accepts a store order after the cut-off into the following run', () => {
    const now = at('2026-04-06T10:31:00Z'); // 4:01 PM Colombo
    expect(decideCutoff({ roles: store, runDate: RUN, now }, ON)).toEqual({
      orderedAt: now, latePhone: false, lateReason: null,
      moved: { from: '2026-04-07', earliest: '2026-04-08' }, // the next run still open at 4:01 PM Mon
    });
    expect(movedNote('2026-04-07', '2026-04-08')).toBe('Placed after the 4:00 PM cut-off for 2026-04-07; moved to the 2026-04-08 run.');
  });

  it('cuts off on Colombo time whatever the server time zone', () => {
    // 10:30 UTC is exactly 16:00 Colombo: closed
    expect(decideCutoff({ roles: store, runDate: RUN, now: at('2026-04-06T10:30:00Z') }, ON).moved?.from).toBe(RUN);
    expect(decideCutoff({ roles: store, runDate: RUN, now: at('2026-04-06T10:29:59Z') }, ON).moved).toBeUndefined();
  });

  it('honours an order saved offline before the cut-off when it arrives within the grace window', () => {
    const saved = at('2026-04-06T10:00:00Z'); // 3:30 PM, no signal
    const now = at('2026-04-06T14:00:00Z'); // synced 7:30 PM
    expect(decideCutoff({ roles: store, runDate: RUN, now, clientOrderedAt: saved.toISOString() }, ON))
      .toEqual({ orderedAt: saved, latePhone: false, lateReason: null });
  });

  it('moves an offline order that arrives after the grace window to the following run', () => {
    const saved = '2026-04-06T10:00:00Z';
    const now = at('2026-04-06T17:00:00Z'); // 10:30 PM Mon Colombo
    expect(decideCutoff({ roles: store, runDate: RUN, now, clientOrderedAt: saved }, ON))
      .toEqual({ orderedAt: now, latePhone: false, lateReason: null, moved: { from: RUN, earliest: '2026-04-08' } });
  });

  it('does not trust a phone clock ahead of the server', () => {
    const now = at('2026-04-06T11:00:00Z'); // after the cut-off
    expect(decideCutoff({ roles: store, runDate: RUN, now, clientOrderedAt: '2026-04-06T12:00:00Z' }, ON)).toMatchObject({ orderedAt: now, moved: { from: RUN } });
    const early = at('2026-04-06T09:00:00Z');
    expect(decideCutoff({ roles: store, runDate: RUN, now: early, clientOrderedAt: '2026-04-06T12:00:00Z' }, ON).orderedAt).toEqual(early);
  });

  it('rejects a malformed orderedAt', () => {
    expect(code(() => decideCutoff({ roles: store, runDate: RUN, now: at('2026-04-06T09:00:00Z'), clientOrderedAt: 'yesterday' }, ON))).toBe('BadRequest');
  });

  it('lets dispatch log a late phone order with a reason, and flags it', () => {
    const now = at('2026-04-06T12:00:00Z');
    expect(code(() => decideCutoff({ roles: dispatch, runDate: RUN, now }, ON))).toBe('LateReasonRequired');
    expect(code(() => decideCutoff({ roles: dispatch, runDate: RUN, now, lateReason: '   ' }, ON))).toBe('LateReasonRequired');
    expect(decideCutoff({ roles: dispatch, runDate: RUN, now, lateReason: ' Store phoned at 4:20, festival stock ' }, ON))
      .toEqual({ orderedAt: now, latePhone: true, lateReason: 'Store phoned at 4:20, festival stock' });
  });

  it('can be switched off with ENFORCE_ORDER_CUTOFF=false', () => {
    const off = cutoffSettings({ ENFORCE_ORDER_CUTOFF: 'false' } as NodeJS.ProcessEnv);
    expect(off.enforce).toBe(false);
    expect(decideCutoff({ roles: store, runDate: RUN, now: at('2026-04-07T00:00:00Z') }, off).latePhone).toBe(false);
  });

  it('reads the grace window from ORDER_OFFLINE_GRACE_HOURS (default 6)', () => {
    expect(cutoffSettings({} as NodeJS.ProcessEnv)).toEqual({ enforce: true, graceHours: 6 });
    expect(cutoffSettings({ ORDER_OFFLINE_GRACE_HOURS: '2' } as NodeJS.ProcessEnv).graceHours).toBe(2);
    expect(cutoffSettings({ ORDER_OFFLINE_GRACE_HOURS: 'x' } as NodeJS.ProcessEnv).graceHours).toBe(6);
  });

  describe('editing', () => {
    it('lets a store edit before the cut-off only, including when moving to another run', () => {
      expect(() => assertStoreMayEdit(store, RUN, undefined, at('2026-04-06T10:00:00Z'), ON)).not.toThrow();
      expect(code(() => assertStoreMayEdit(store, RUN, undefined, at('2026-04-06T11:00:00Z'), ON))).toBe('OrderCutoffPassed');
      expect(code(() => assertStoreMayEdit(store, '2026-04-08', RUN, at('2026-04-06T11:00:00Z'), ON))).toBe('OrderCutoffPassed');
    });

    it('does not hold dispatch to the store cut-off', () => {
      expect(() => assertStoreMayEdit(dispatch, RUN, undefined, at('2026-04-07T00:00:00Z'), ON)).not.toThrow();
    });
  });
});
