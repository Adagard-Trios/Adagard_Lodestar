// Drawers open over the page they were opened from (lib/overlay.ts, components/live/overlay.tsx): a design link to
// DSP-09 opens the order drawer in place instead of navigating to its route.
import { act, fireEvent, render, screen } from '@testing-library/react';
import ScreenShell from '@/components/ScreenShell';
import { closeOverlay, isOverlayRoute, useOverlay } from '@/lib/overlay';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan/dsp-01-cutoff-queue' }));

function Open() {
  return <span data-testid="open">{useOverlay() ?? 'none'}</span>;
}

const nav = {
  links: {
    L150: { href: '/plan/dsp-09-order-detail-drawer', kind: 'go' },
    L1: { href: '/plan/dsp-02-plan-board', kind: 'go' },
  },
};

afterEach(() => { act(() => closeOverlay()); jest.clearAllMocks(); });

it('knows the drawer routes, with or without a query', () => {
  expect(isOverlayRoute('/plan/dsp-09-order-detail-drawer')).toBe(true);
  expect(isOverlayRoute('/plan/dsp-09-order-detail-drawer?id=ORD1')).toBe(true);
  expect(isOverlayRoute('/plan/dsp-02-plan-board')).toBe(false);
});

it('a link to the order drawer opens it over the page instead of navigating', () => {
  render(<ScreenShell board="P2" nav={nav} live><span data-lk="L150">ORD1</span><Open /></ScreenShell>);
  fireEvent.click(screen.getByText('ORD1'));
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByTestId('open')).toHaveTextContent('/plan/dsp-09-order-detail-drawer');
});

it('any other link still navigates', () => {
  render(<ScreenShell board="P2" nav={nav} live><span data-lk="L1">Board</span><Open /></ScreenShell>);
  fireEvent.click(screen.getByText('Board'));
  expect(router.push).toHaveBeenCalledWith('/plan/dsp-02-plan-board');
  expect(screen.getByTestId('open')).toHaveTextContent('none');
});
