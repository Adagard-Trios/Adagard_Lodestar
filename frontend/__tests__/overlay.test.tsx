// Drawers and dialogs open over the page they were opened from (lib/overlay.ts, components/live/overlay.tsx): a
// design link to one opens it in place instead of navigating to its route, in the plan desk and in admin.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ScreenShell from '@/components/ScreenShell';
import OverlayHost, { DRAWERS } from '@/components/live/overlay';
import { useQuery } from '@/lib/odata/hooks';
import { closeOverlay, currentOverlay, isOverlayRoute, openOverlay, OVERLAY_ROUTES, useOverlay } from '@/lib/overlay';
import { freezeDate, unfreeze } from './helpers/clock';
import type { FakeRequest } from './helpers/live';
import { page, renderLive, SESSIONS } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
let mockPath = '/plan/dsp-01-cutoff-queue';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => mockPath }));

function Open() {
  return <span data-testid="open">{useOverlay() ?? 'none'}</span>;
}

const nav = {
  links: {
    L150: { href: '/plan/dsp-09-order-detail-drawer', kind: 'go' },
    L1: { href: '/plan/dsp-02-plan-board', kind: 'go' },
  },
};

beforeEach(() => { mockPath = '/plan/dsp-01-cutoff-queue'; window.sessionStorage.clear(); });
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

it('every overlay route has its drawer, styled by the board of its own face', () => {
  expect(Object.keys(DRAWERS).sort()).toEqual([...OVERLAY_ROUTES].sort());
  for (const [route, d] of Object.entries(DRAWERS)) expect(d.board).toBe(route.startsWith('/admin/') ? 'P6' : 'P2');
  expect(isOverlayRoute('/admin/adm-09-edit-outlet')).toBe(true);
  expect(isOverlayRoute('/admin/adm-21-depots')).toBe(false);
});

describe('OverlayHost', () => {
  beforeEach(() => freezeDate('2026-04-06T08:00:00.000Z'));
  afterEach(unfreeze);

  const note = (id: string, type: string, payload = {}) => ({ id, recipientId: 'u-d', type, channel: 'WEBSOCKET', payload, sentAt: '2026-04-06T05:00:00.000Z', readAt: null });
  const notes = (req: FakeRequest) => (req.path === 'Notifications' ? page([note('N1', 'DOCK_BLOCKED', { title: 'OUTT09 rear dock blocked' })]) : page([]));

  it('shows the notifications panel over the page; Escape, the backdrop and its close button close it; its links open their page', async () => {
    mockPath = '/plan/dsp-08-today-overview';
    act(() => openOverlay('/plan/dsp-14-notifications-panel'));
    renderLive(<OverlayHost />, { handler: notes });
    const dialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(dialog).toHaveClass('b-P2', 'pl-overlay');
    expect(await screen.findByText('OUTT09 rear dock blocked')).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(currentOverlay()).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => openOverlay('/plan/dsp-14-notifications-panel'));
    fireEvent.click(document.querySelector('.pl-overlay .dx-scrim')!);
    expect(currentOverlay()).toBeNull();

    act(() => openOverlay('/plan/dsp-14-notifications-panel'));
    fireEvent.click(document.querySelector('.pl-overlay [data-lk="C"]')!);
    expect(currentOverlay()).toBeNull();
    expect(router.push).not.toHaveBeenCalled();

    act(() => openOverlay('/plan/dsp-14-notifications-panel'));
    const alert = await waitFor(() => { const el = document.querySelector<HTMLElement>('[data-notification="N1"]'); expect(el).not.toBeNull(); return el!; });
    expect(alert).toHaveAttribute('role', 'button');
    fireEvent.click(alert);
    expect(currentOverlay()).toBeNull();
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-13-exceptions-inbox');
  });

  it('an admin drawer saves, closes over the list it was opened from and has the list read again', async () => {
    mockPath = '/admin/adm-08-outlets';
    window.sessionStorage.setItem('lodestar.focus.outlet', 'OUT106');
    const outlet = { id: 'OUT106', name: 'Nuwara Eliya', brand: 'FRESH', district: 'Nuwara Eliya', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', isActive: true };
    let listReads = 0;
    function List() {
      useQuery('outlet-list', async () => { listReads += 1; return listReads; });
      return null;
    }
    act(() => openOverlay('/admin/adm-09-edit-outlet'));
    const view = renderLive(<><List /><OverlayHost /></>, {
      session: SESSIONS.admin,
      handler: req => (req.path === "Outlets('OUT106')" && req.method === 'GET' ? { status: 200, body: outlet, headers: { ETag: 'W/"12"' } }
        : req.method === 'PATCH' ? { ...outlet, windowOpen: '06:00' } : page([])),
    });
    expect(screen.getByRole('dialog', { name: 'Edit outlet' })).toHaveClass('b-P6', 'pl-overlay');
    expect(await screen.findByText('Outlet · OUT106')).toBeInTheDocument();
    await waitFor(() => expect(listReads).toBe(1));
    fireEvent.change(screen.getByLabelText('Window opens'), { target: { value: '06:00' } });
    fireEvent.click(screen.getByTestId('save-window'));
    await waitFor(() => expect(currentOverlay()).toBeNull());
    expect(view.calls.find(c => c.method === 'PATCH')!.body).toEqual({ windowOpen: '06:00', windowClose: '08:00' });
    // already on the list: no navigation, the list reads its rows again and the notice stays
    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() => expect(listReads).toBe(2));
    expect(screen.getByRole('status')).toHaveTextContent('OUT106 delivers 06:00 to 08:00 from now on.');
  });
});
