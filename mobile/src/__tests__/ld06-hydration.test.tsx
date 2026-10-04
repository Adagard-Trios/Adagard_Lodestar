// LD-06 is the first page the dock phone loads; the web build pre-renders it at build time. Anything that
// depends on the clock must wait for the mount, or hydration on a later day fails (React #418).
import { createElement } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { shiftLabel, useShiftLabel } from '@/live/ld-06-sign-in';

// react-dom ships no types in this package (web build only): the one call used here
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (el: unknown) => string };

function Label() {
  return createElement('span', null, useShiftLabel());
}

describe('LD-06 shift label', () => {
  it('is empty in the pre-rendered HTML (no clock text to mismatch on hydration)', () => {
    expect(renderToStaticMarkup(createElement(Label))).toBe('<span></span>');
  });
  it('shows the phone clock\'s shift once mounted', async () => {
    const { result } = await renderHook(() => useShiftLabel());
    await act(async () => undefined);
    expect(result.current).toBe(shiftLabel());
    expect(result.current).toMatch(/^(Night|Day) shift · /);
  });
});
