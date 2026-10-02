// Freezes Date (and only Date) for live-screen tests: timers, promises and RTL's polling keep running for real,
// so findBy/waitFor work unchanged while every "now", countdown and "days ago" filter is deterministic.
export const REAL_TIMERS: Array<'nextTick' | 'setImmediate' | 'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval' | 'queueMicrotask' | 'requestAnimationFrame' | 'cancelAnimationFrame' | 'requestIdleCallback' | 'cancelIdleCallback' | 'hrtime' | 'performance' | 'clearImmediate'> = [
  'nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'hrtime', 'performance',
];

export function freezeDate(iso: string) {
  jest.useFakeTimers({ now: new Date(iso), doNotFake: REAL_TIMERS });
}

export function unfreeze() {
  jest.useRealTimers();
}
