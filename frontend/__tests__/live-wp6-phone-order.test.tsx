// DSP-10 Log phone order (live) against a mocked OData API: a real ODataClient over a fake fetch, so every
// assertion on a request is at the HTTP level. Covers the outlet picker, validation, the POST /Orders body (before
// and after the 4:00 PM cutoff), the API's error banner, and the design link back to the cutoff queue.
// Date is frozen at Mon 6 Apr 2026 13:30 (Colombo), 2 h 30 m before the cutoff of the Tue 7 Apr run.
import { fireEvent, screen, waitFor } from '@testing-library/react';
import ScreenShell from '@/components/ScreenShell';
import PhoneOrder from '@/live/dsp-10-log-phone-order';
import { freezeDate, unfreeze } from './helpers/clock';
import type { FakeRequest } from './helpers/live';
import { page, renderLive } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan' }));

const NOW = '2026-04-06T08:00:00.000Z';
const DAY = '2026-04-07T00:00:00.000Z';
const outlet = (id: string, over = {}) => ({ id, name: `Outlet ${id.slice(-3)}`, brand: 'FRESH', district: 'District T', depot: 'KANDY', dockType: 'STREET', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', isActive: true, ...over });
const OUTLETS = [outlet('OUTT01'), outlet('OUTT02', { brand: 'STYLE', dockType: 'MALL_BAY', parking: 'MALL_DOCK', windowOpen: '09:00', windowClose: '11:00' })];
const err = (status: number, message: string, code = 'Failed') => ({ status, body: { error: { code, message } } });
const posts = (calls: FakeRequest[]) => calls.filter(c => c.method === 'POST');
const disabled = (el: HTMLElement) => el.getAttribute('aria-disabled') === 'true';
const NAV = { links: { L54: { href: '/plan/dsp-01-cutoff-queue', kind: 'go' } } };

/** Reads the screen makes: sidebar counts, the latest run date, the outlets and the outlet's earlier orders. */
function base(req: FakeRequest) {
  if (req.query.$top === '0') return page([], 0);
  if (req.path === 'Plans' && req.query.$select === 'runDate') return page([{ runDate: DAY }]);
  if (req.path === 'Outlets') return page(OUTLETS);
  if (req.path === 'Orders' && req.method === 'GET') return page([{ id: 'ORDOLD', kg: 100, m3: 0.5 }]);
  return undefined;
}

function show(handler: (req: FakeRequest) => unknown = () => undefined) {
  return renderLive(
    <ScreenShell board="P2" nav={NAV} live>
      <PhoneOrder />
    </ScreenShell>,
    { handler: req => handler(req) ?? base(req) ?? page([]) },
  );
}

/** Fills a complete, valid ambient order for OUTT01 with one line. */
async function fill() {
  await screen.findByRole('option', { name: 'OUTT01 · Outlet T01' });
  fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: 'OUTT01' } });
  fireEvent.change(screen.getByLabelText('Caller'), { target: { value: 'Duty manager' } });
  fireEvent.change(screen.getByLabelText('Item 1'), { target: { value: 'Samba rice 5 kg' } });
  fireEvent.change(screen.getByLabelText('Quantity 1'), { target: { value: '40' } });
  fireEvent.change(screen.getByLabelText('Weight in kg 1'), { target: { value: '200' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Read back to the caller' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/plan');
  freezeDate(NOW);
});
afterEach(unfreeze);

describe('DSP-10 Log phone order', () => {
  it('lists the active outlets of the dispatcher’s depots and describes the one picked', async () => {
    const view = show();
    expect(await screen.findByRole('option', { name: 'OUTT01 · Outlet T01' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'OUTT02 · Outlet T02' })).toBeInTheDocument();
    const q = view.calls.find(c => c.path === 'Outlets')!;
    expect(q.query.$filter).toBe("isActive eq true and depot in ('PELIYAGODA','KANDY')");
    expect(await screen.findByTestId('run-date')).toHaveTextContent('Tue 7 Apr');
    expect(screen.getByTestId('cutoff-pill')).toHaveTextContent('Cutoff in 2 h 30 m');

    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: 'OUTT02' } });
    expect(screen.getByTestId('outlet-line')).toHaveTextContent('District T · mall bay · mall dock access · window 09:00–11:00');
  });

  it('cannot add to the queue until the outlet, caller, a complete line and the read-back are there', async () => {
    const view = show();
    const add = screen.getByTestId('add-to-queue');
    await screen.findByRole('option', { name: 'OUTT01 · Outlet T01' });
    expect(disabled(add)).toBe(true);
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('Choose the outlet.');

    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: 'OUTT01' } });
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('Say who called.');
    fireEvent.change(screen.getByLabelText('Caller'), { target: { value: 'Duty manager' } });
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('Add at least one line.');
    fireEvent.change(screen.getByLabelText('Item 1'), { target: { value: 'Sugar 1 kg' } });
    fireEvent.change(screen.getByLabelText('Quantity 1'), { target: { value: '2.5' } });
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('Every line needs an item, a whole quantity and its weight in kg.');
    fireEvent.change(screen.getByLabelText('Quantity 1'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Weight in kg 1'), { target: { value: '80' } });
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('Read the order back to the caller.');
    expect(disabled(add)).toBe(true);

    fireEvent.click(add);
    expect(posts(view.calls)).toHaveLength(0);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Read back to the caller' }));
    await waitFor(() => expect(disabled(add)).toBe(false));
    // before the cutoff there is nothing to flag
    expect(screen.getByRole('checkbox', { name: 'Flag for a line check (late order)' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('adds lines and totals them with the outlet’s own m³ per kg', async () => {
    show();
    await fill();
    fireEvent.click(screen.getByText('Add line'));
    fireEvent.change(screen.getByLabelText('Item 2'), { target: { value: 'Sugar 1 kg' } });
    fireEvent.change(screen.getByLabelText('Quantity 2'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Weight in kg 2'), { target: { value: '80' } });
    // 280 kg at the outlet's 0.005 m³/kg (100 kg, 0.5 m³ before)
    await waitFor(() => expect(screen.getByTestId('lines-total')).toHaveTextContent('2 lines · 120 units1.4 m³280 kg'));
  });

  it('POSTs the order with its lines for the run in view, and goes back to the cutoff queue', async () => {
    const view = show(req => (req.method === 'POST' ? { status: 201, body: { id: 'ORDT9', runDate: DAY, status: 'RECEIVED' } } : undefined));
    await fill();
    fireEvent.click(screen.getByRole('radio', { name: 'Chilled' }));
    const add = screen.getByTestId('add-to-queue');
    await waitFor(() => expect(disabled(add)).toBe(false));
    fireEvent.click(add);

    await waitFor(() => expect(posts(view.calls)).toHaveLength(1));
    const [post] = posts(view.calls);
    expect(post.path).toBe('Orders');
    expect(post.body).toEqual({
      outletId: 'OUTT01',
      runDate: '2026-04-07T00:00:00.000Z',
      brand: 'FRESH',
      tempClass: 'CHILLED',
      units: 40,
      kg: 200,
      m3: 1,
      notes: 'Phone order from Duty manager',
      lineItems: [{ name: 'Samba rice 5 kg', qty: 40, kg: 200, tempClass: 'CHILLED' }],
    });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/plan/dsp-01-cutoff-queue'));
  });

  it('after the cutoff: must be flagged for a line check and sends a lateReason', async () => {
    freezeDate('2026-04-06T11:00:00.000Z'); // 16:30 in Colombo
    const view = show(req => (req.method === 'POST' ? { status: 201, body: { id: 'ORDT9', runDate: DAY, status: 'RECEIVED' } } : undefined));
    await fill();
    expect(screen.getByTestId('cutoff-pill')).toHaveTextContent('Cutoff passed');
    const add = screen.getByTestId('add-to-queue');
    expect(disabled(add)).toBe(true);
    expect(screen.getByTestId('phone-order-hint')).toHaveTextContent('flag it for a line check');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Flag for a line check (late order)' }));
    await waitFor(() => expect(disabled(add)).toBe(false));
    fireEvent.click(add);
    await waitFor(() => expect(posts(view.calls)).toHaveLength(1));
    expect(posts(view.calls)[0].body).toMatchObject({
      runDate: '2026-04-07T00:00:00.000Z',
      lateReason: 'Late phone order from Duty manager, flagged for a line check',
    });
  });

  it('shows the run the API moved the order to instead of leaving', async () => {
    show(req => (req.method === 'POST'
      ? { status: 201, body: { id: 'ORDT9', runDate: '2026-04-08T00:00:00.000Z', status: 'RECEIVED', notes: 'Placed after the 4:00 PM cut-off for 2026-04-07; moved to the 2026-04-08 run.' } }
      : undefined));
    await fill();
    const add = screen.getByTestId('add-to-queue');
    await waitFor(() => expect(disabled(add)).toBe(false));
    fireEvent.click(add);
    expect(await screen.findByTestId('order-moved')).toHaveTextContent('Received: ORDT9 for Wed 8 Apr');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('keeps the form and shows the API’s reason when the POST is refused', async () => {
    show(req => (req.method === 'POST' ? err(403, 'You cannot place orders for this outlet', 'Forbidden') : undefined));
    await fill();
    const add = screen.getByTestId('add-to-queue');
    await waitFor(() => expect(disabled(add)).toBe(false));
    fireEvent.click(add);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Not allowed');
    expect(alert).toHaveTextContent('You cannot place orders for this outlet');
    expect(screen.getByLabelText('Caller')).toHaveValue('Duty manager');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows the error when the outlets cannot load, and “Try again” asks again', async () => {
    let fail = true;
    const view = show(req => (req.path === 'Outlets' && fail ? err(500, 'Database unavailable') : undefined));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(await screen.findByRole('option', { name: 'OUTT01 · Outlet T01' })).toBeInTheDocument();
    expect(view.calls.filter(c => c.path === 'Outlets')).toHaveLength(2);
  });

  it('Cancel goes back to the cutoff queue without saving', async () => {
    const view = show();
    await screen.findByRole('option', { name: 'OUTT01 · Outlet T01' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-01-cutoff-queue');
    expect(posts(view.calls)).toHaveLength(0);
  });
});
