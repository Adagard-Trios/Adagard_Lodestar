// ADM-21 Depots (the depot registry every app names depots from), the shared useDepots() hook and the Plan
// sidebar's depot list from the registry. Real ODataClient over a fake fetch.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { AdminSide, PlanSide } from '@/components/live/chrome';
import { useDepots } from '@/components/live/depots';
import { deskStatus, resetDeskStatus } from '@/lib/desk-status';
import Depots, { depotProblems } from '@/live/adm-21-depots';
import type { FakeRequest } from './helpers/live';
import { DEPOTS, page, renderLive, SESSIONS } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/admin' }));

const GALLE = { code: 'GALLE', name: 'Galle DC', district: 'Galle', address: 'Wakwella Rd', phone: '+94 91 222 3344', lat: null, lng: null, isActive: true, '@odata.etag': 'W/"7"' };
const OLD = { code: 'OLDTOWN', name: 'Old Town', district: 'Matale', address: null, phone: null, lat: null, lng: null, isActive: false, '@odata.etag': 'W/"3"' };

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  resetDeskStatus();
});

const depotGets = (calls: FakeRequest[]) => calls.filter(c => c.method === 'GET' && c.path === 'Depots');

describe('useDepots()', () => {
  function Names({ codes }: { codes: string[] }) {
    const { name, short } = useDepots();
    return <>{codes.map(c => <span key={c} data-testid={`n-${c}`}>{name(c)}|{short(c)}</span>)}</>;
  }

  it('shows the code until the registry answers, then the name; one request for every component', async () => {
    const view = renderLive(<><Names codes={['KANDY', 'GALLE']} /><Names codes={['PELIYAGODA']} /></>, { handler: () => page([]) });
    expect(screen.getByTestId('n-KANDY')).toHaveTextContent('KANDY|KANDY');
    await waitFor(() => expect(screen.getByTestId('n-KANDY')).toHaveTextContent('Kandy Hub|Kandy'));
    expect(screen.getByTestId('n-PELIYAGODA')).toHaveTextContent('Peliyagoda DC|Peliyagoda');
    expect(screen.getByTestId('n-GALLE')).toHaveTextContent('GALLE|GALLE'); // unknown code: never a made-up name
    expect(depotGets(view.calls)).toHaveLength(1);
  });

  it('asks nothing before sign-in', async () => {
    const view = renderLive(<Names codes={['KANDY']} />, { handler: () => page([]), session: null });
    await new Promise(r => setTimeout(r, 20));
    expect(depotGets(view.calls)).toHaveLength(0);
    expect(screen.getByTestId('n-KANDY')).toHaveTextContent('KANDY|KANDY');
  });
});

describe('Plan sidebar depots', () => {
  it('lists every active depot from the registry; a depot outside the account is locked and opens DSP-36', async () => {
    renderLive(<PlanSide active="N0" />, { handler: req => (req.path === 'Depots' ? page([...DEPOTS, GALLE, OLD]) : page([])) });
    const galle = await screen.findByText('Galle DC');
    expect(screen.getByText('Kandy Hub')).toBeInTheDocument();
    expect(screen.getByText('Peliyagoda DC')).toBeInTheDocument();
    expect(screen.queryByText('Old Town')).not.toBeInTheDocument(); // deactivated
    const item = galle.closest('[data-depot]')!;
    expect(item).toHaveAttribute('title', 'Galle DC is not one of your depots');
    fireEvent.click(item);
    expect(deskStatus().depotDenied).toMatchObject({ depot: 'GALLE' });
  });

  it('Admin sidebar has Depots, linking to ADM-21', async () => {
    renderLive(<AdminSide active="N0" />, { handler: () => page([]), session: SESSIONS.admin });
    fireEvent.click(await screen.findByText('Depots'));
    expect(router.push).toHaveBeenCalledWith('/admin/adm-21-depots');
  });
});

describe('ADM-21 Depots', () => {
  const show = (over: (req: FakeRequest) => unknown = () => undefined) =>
    renderLive(<Depots />, {
      session: SESSIONS.admin,
      handler: req => over(req) ?? (req.path === 'Depots' ? page([...DEPOTS, OLD], 3) : page([])),
    });

  it('lists the registry with deactivated depots, and filters', async () => {
    const view = show();
    const table = await screen.findByTestId('depots');
    await waitFor(() => expect(within(table).getByText('Old Town')).toBeInTheDocument());
    expect(within(table).getByText('Kandy Hub')).toBeInTheDocument();
    expect(within(table).getByText('Deactivated', { selector: '.m-tag' })).toBeInTheDocument();
    fireEvent.click(within(table).getByText('Deactivated', { selector: '.d-filter' }));
    await waitFor(() => expect(view.calls.some(c => c.path === 'Depots' && c.query.$filter === 'isActive eq false')).toBe(true));
  });

  it('shows the empty state', async () => {
    // a { status } reply: the helper's default registry answers only a Depots GET the test leaves to it
    show(req => (req.path === 'Depots' && req.query.$count ? { status: 200, body: page([], 0) } : undefined));
    expect(await screen.findByText('No depots')).toBeInTheDocument();
  });

  it('shows why the list could not load', async () => {
    show(req => (req.path === 'Depots' && req.query.$count ? { status: 500, body: { error: { code: 'X', message: 'Depots down' } } } : undefined));
    expect(await screen.findByRole('alert')).toHaveTextContent('Depots down');
  });

  it('registers a depot: checks the form first, then POSTs it and refreshes every depot list', async () => {
    const view = show(req => (req.method === 'POST' ? { status: 201, body: GALLE } : undefined));
    fireEvent.click(await screen.findByTestId('new-depot'));
    fireEvent.click(screen.getByTestId('save-depot'));
    expect(await screen.findByText(/Use 2 to 32 capital letters/)).toBeInTheDocument();
    expect(screen.getByText('A depot needs a name.')).toBeInTheDocument();
    expect(view.calls.some(c => c.method === 'POST')).toBe(false);

    fireEvent.change(screen.getByLabelText('Depot code'), { target: { value: 'galle' } });
    fireEvent.change(screen.getByLabelText('Depot name'), { target: { value: 'Galle DC' } });
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Galle' } });
    fireEvent.change(screen.getByLabelText('Desk phone'), { target: { value: '+94 91 222 3344' } });
    const before = depotGets(view.calls).length;
    fireEvent.click(screen.getByTestId('save-depot'));
    await waitFor(() => expect(view.calls.find(c => c.method === 'POST')).toBeDefined());
    expect(view.calls.find(c => c.method === 'POST')).toMatchObject({
      path: 'Depots',
      body: { code: 'GALLE', name: 'Galle DC', district: 'Galle', phone: '+94 91 222 3344', address: null, lat: null, lng: null },
    });
    await waitFor(() => expect(screen.queryByTestId('depot-form')).not.toBeInTheDocument());
    await waitFor(() => expect(depotGets(view.calls).length).toBeGreaterThan(before + 1)); // the table and the shared registry
  });

  it('shows the API’s refusal (a code already registered) and keeps the form', async () => {
    show(req => (req.method === 'POST' ? { status: 409, body: { error: { code: 'Conflict', message: 'Depot KANDY is already registered', target: 'code' } } } : undefined));
    fireEvent.click(await screen.findByTestId('new-depot'));
    fireEvent.change(screen.getByLabelText('Depot code'), { target: { value: 'KANDY' } });
    fireEvent.change(screen.getByLabelText('Depot name'), { target: { value: 'Kandy 2' } });
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Kandy' } });
    fireEvent.click(screen.getByTestId('save-depot'));
    expect(await screen.findByText('Depot KANDY is already registered')).toBeInTheDocument();
    expect(screen.getByTestId('depot-form')).toBeInTheDocument();
  });

  it('edits a depot with If-Match (the code stays) and deactivates it', async () => {
    const view = show(req => (req.method === 'PATCH' ? { ...DEPOTS[0], ...(req.body as object) } : undefined));
    const row = await screen.findByText('Kandy Hub', { selector: 'b' });
    fireEvent.click(row);
    expect(screen.getByLabelText('Depot code')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Depot name'), { target: { value: 'Kandy Central Hub' } });
    fireEvent.click(screen.getByTestId('save-depot'));
    await waitFor(() => expect(view.calls.find(c => c.method === 'PATCH')).toBeDefined());
    const patch = view.calls.find(c => c.method === 'PATCH')!;
    expect(patch.path).toBe("Depots('KANDY')");
    expect(patch.body).toMatchObject({ name: 'Kandy Central Hub', district: 'Kandy' });
    expect(patch.headers['If-Match']).toBe('W/"1"');

    fireEvent.click(await screen.findByText('Kandy Hub', { selector: 'b' }));
    fireEvent.click(screen.getByTestId('toggle-depot'));
    await waitFor(() => expect(view.calls.filter(c => c.method === 'PATCH')).toHaveLength(2));
    expect(view.calls.filter(c => c.method === 'PATCH')[1].body).toEqual({ isActive: false });
  });

  it('explains why a depot in use cannot be deactivated', async () => {
    show(req => (req.method === 'PATCH' ? { status: 422, body: { error: { code: 'DepotInUse', message: 'Kandy Hub still has 3 active outlets and 1 vehicle: move them to another depot first' } } } : undefined));
    fireEvent.click(await screen.findByText('Kandy Hub', { selector: 'b' }));
    fireEvent.click(screen.getByTestId('toggle-depot'));
    expect(await screen.findByText(/still has 3 active outlets/)).toBeInTheDocument();
  });

  it('validates like the API', () => {
    const ok = { code: 'GALLE', name: 'Galle DC', district: 'Galle', address: '', phone: '', lat: '', lng: '' };
    expect(depotProblems(ok, true)).toEqual({});
    expect(depotProblems({ ...ok, code: '1X' }, true)).toHaveProperty('code');
    expect(depotProblems({ ...ok, code: '1X' }, false)).toEqual({}); // the code is not edited
    expect(depotProblems({ ...ok, lat: '91', lng: '80' }, true)).toHaveProperty('lat');
    expect(depotProblems({ ...ok, lat: '6.05' }, true)).toHaveProperty('lng');
    expect(depotProblems({ ...ok, phone: 'call me' }, true)).toHaveProperty('phone');
  });
});
