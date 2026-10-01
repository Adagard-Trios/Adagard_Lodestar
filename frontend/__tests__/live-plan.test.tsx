// Live Plan screens against a mocked OData API (real ODataClient over a fake fetch).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ScreenShell from '@/components/ScreenShell';
import CutoffQueue from '@/live/dsp-01-cutoff-queue';
import PlanBoard from '@/live/dsp-02-plan-board';
import DeferralDecision from '@/live/dsp-03-deferral-decision';
import ApproveAndGoLive from '@/live/dsp-12-approve-and-go-live';
import AskAgent from '@/live/dsp-39-ask-the-planning-agent';
import SignIn from '@/live/dsp-06-sign-in';
import type { FakeRequest } from './helpers/live';
import { page, renderLive, SESSIONS } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan' }));

const DAY = '2026-04-07T00:00:00.000Z';
const outlet = (id: string, over = {}) => ({ id, name: `Outlet ${id}`, brand: 'FRESH', district: 'District T', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', isActive: true, ...over });
const order = (id: string, over = {}) => ({ id, outletId: 'OUTT01', runDate: DAY, orderedAt: DAY, brand: 'FRESH', tempClass: 'AMBIENT', units: 10, kg: 100, m3: 1, status: 'RECEIVED', deferredYesterday: false, daysSince: 1, outlet: outlet('OUTT01'), ...over });
const vehicle = (id: string, over = {}) => ({ id, depot: 'KANDY', type: 'VAN', tempClass: 'CHILLED', capacityKg: 1000, capacityM3: 7, kmPerLitre: 10, weeklyLFuel: 400, usedLThisWeek: 100, status: 'AVAILABLE', ...over });

/** Common reads every Plan screen makes (sidebar counts, latest run date, fleet). */
function base(req: FakeRequest) {
  if (req.query.$top === '0') return page([], 2);
  if (req.path === 'Plans' && req.query.$select === 'runDate') return page([{ runDate: DAY }]);
  if (req.path === 'Vehicles') return page([vehicle('VEHT1'), vehicle('VEHT2', { status: 'WORKSHOP', tempClass: 'AMBIENT', type: 'TRUCK' })]);
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/plan');
});

const nav = (links: Record<string, string>) => ({ links: Object.fromEntries(Object.entries(links).map(([k, href]) => [k, { href, kind: 'go' }])) });

describe('DSP-01 Cutoff queue', () => {
  it('lists the run date’s orders, filters them, and starts a planning-agent draft', async () => {
    const queue = [order('ORDT1', { deferredYesterday: true, tempClass: 'CHILLED' }), order('ORDT2', { outlet: outlet('OUTT02', { parking: 'VAN_ONLY' }), outletId: 'OUTT02' })];
    const view = renderLive(
      <ScreenShell board="P2" nav={nav({ L1: '/plan/dsp-22-planning-agent-drafting' })} live><CutoffQueue /></ScreenShell>,
      {
        handler: req => base(req) ?? (req.path === 'Orders' ? page(queue, queue.length)
          : req.path === 'AgentRuns' && req.method === 'POST' ? { status: 201, body: { id: 'run-1', status: 'NEEDS_APPROVAL', depot: 'PELIYAGODA', runDate: DAY } }
            : page([])),
      },
    );
    const table = await screen.findByTestId('queue');
    expect(within(table).getByText('ORDT1')).toBeInTheDocument();
    expect(within(table).getByText('ORDT2')).toBeInTheDocument();
    expect(screen.getByText(/Protected · deferred yesterday/)).toBeInTheDocument();
    expect(screen.getByText('Cutoff queue for Tue 7 Apr')).toBeInTheDocument();
    expect(screen.getByTestId('queue-total')).toHaveTextContent('2');
    // the run date and the dispatcher's depots scope the request
    const q = view.calls.find(c => c.path === 'Orders' && c.query.$expand === 'outlet')!;
    expect(q.query.$filter).toContain('runDate ge 2026-04-07T00:00:00.000Z and runDate lt 2026-04-08T00:00:00.000Z');
    expect(q.query.$filter).toContain("outlet/depot in ('PELIYAGODA','KANDY')");

    fireEvent.click(screen.getByRole('button', { name: /^Chilled \d+$/ }));
    await waitFor(() => expect(view.calls.some(c => c.path === 'Orders' && c.query.$filter?.includes("tempClass eq 'CHILLED'"))).toBe(true));

    fireEvent.click(screen.getByTestId('start-agent'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/plan/dsp-22-planning-agent-drafting'));
    const post = view.calls.find(c => c.method === 'POST')!;
    expect(post).toMatchObject({ path: 'AgentRuns', body: { depot: 'PELIYAGODA', runDate: '2026-04-07T00:00:00.000Z' } });
    expect(window.sessionStorage.getItem('lodestar.agentRun')).toBe('run-1');
  });

  it('shows the API error in the design’s banner', async () => {
    renderLive(<CutoffQueue />, { handler: req => base(req) ?? (req.path === 'Orders' ? { status: 503, body: { error: { code: 'ServiceUnavailable', message: 'The owning service is not reachable' } } } : page([])) });
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('The owning service is not reachable');
  });
});

describe('DSP-02 Plan board', () => {
  it('shows the real trips of the run date as vehicle lanes', async () => {
    const trips = [{ id: 'TRPT1', vehicleId: 'VEHT1', depot: 'KANDY', runDate: DAY, brand: 'FRESH', district: 'District T', status: 'ENROUTE', planVersion: 3, tripNumber: 1, planMinutes: 150, departTime: '2026-04-06T22:10:00.000Z', stops: [{ id: 'S1', orderId: 'ORDT1', outletId: 'OUTT01', stopSeq: 1, status: 'PLANNED' }] }];
    const view = renderLive(<PlanBoard />, {
      handler: req => base(req) ?? (req.path === 'Trips' ? page(trips) : req.path === 'Orders' ? page([order('ORDT1', { kg: 300, m3: 2 })])
        : req.path === 'Plans' ? page([{ id: 'PLT-v3', depot: 'KANDY', runDate: DAY, version: 3, status: 'PUBLISHED', source: 'AUTOPLAN', explanation: 'Synthetic explanation' }]) : page([])),
    });
    const board = await screen.findByTestId('board');
    await waitFor(() => expect(board.querySelector('[data-vehicle="VEHT1"]')).not.toBeNull());
    expect(within(board).getByText('Fresh · District T')).toBeInTheDocument();
    expect(within(board).getByText('300 / 1,000')).toBeInTheDocument();
    expect(screen.getByText(/In workshop, unavailable/)).toBeInTheDocument();
    expect(screen.getByText('Synthetic explanation')).toBeInTheDocument();
    expect(view.calls.find(c => c.path === 'Trips')!.query.$expand).toContain('stops');
  });
});

describe('DSP-03 Deferral decision', () => {
  it('confirms the selected deferrals with a note and the next run date', async () => {
    window.sessionStorage.setItem('lodestar.depot', 'KANDY');
    const deferrals = [{ id: 'DT1', orderId: 'ORDT3', reason: 'CAP_REEFER', score: 22, status: 'SUGGESTED', isProvisional: false, createdAt: DAY, order: order('ORDT3', { tempClass: 'CHILLED', m3: 1.5 }) }];
    const view = renderLive(
      <ScreenShell board="P2" nav={nav({ L4: '/plan/dsp-12-approve-and-go-live' })} live><DeferralDecision /></ScreenShell>,
      { handler: req => base(req) ?? (req.path === 'Deferrals' ? page(deferrals) : req.path === 'Outlets' ? page([outlet('OUTT01')]) : req.method === 'POST' ? { id: 'DT1', status: 'CONFIRMED' } : page([])) },
    );
    await screen.findByText('Defer 1 order to Wed');
    fireEvent.change(screen.getByLabelText('Note to store'), { target: { value: 'Covered till Wednesday' } });
    fireEvent.click(screen.getByTestId('confirm-all'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/plan/dsp-12-approve-and-go-live'));
    expect(view.calls.find(c => c.method === 'POST')).toMatchObject({ path: "Deferrals('DT1')/Lodestar.Confirm", body: { notes: 'Covered till Wednesday', rescheduledDate: '2026-04-08' } });
    expect(view.calls.find(c => c.path === 'Deferrals' && c.query.$expand === 'order')!.query.$filter).toContain("order/outlet/depot eq 'KANDY'");
  });
});

describe('DSP-12 Approve and go live', () => {
  const run = {
    id: 'run-9', depot: 'KANDY', runDate: DAY, status: 'NEEDS_APPROVAL', requestedBy: 'u-d', createdAt: DAY,
    detail: { plan: { version: 4, trips: [{ id: 'VEHT1-T1', vehicleId: 'VEHT1', tripNo: 1, brand: 'FRESH', district: 'District T', chilled: true, orderIds: ['ORDT1'], kg: 50, m3: 0.5, minutes: 90 }] }, ruleChecks: [{ rule: 'weight', label: 'Weight', passed: true, violations: 0 }], deferrals: [], needsReview: [] },
  };

  it('a human approves the agent draft with Resume {decision: approve}; it continues to the docks', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'run-9');
    const view = renderLive(
      <ScreenShell board="P2" nav={{ links: { L5: { app: 'Lodestar Dock', screen: 'LD-01 Dock queue', kind: 'go' } } }} live><ApproveAndGoLive /></ScreenShell>,
      { handler: req => base(req) ?? (req.path === "AgentRuns('run-9')" ? run : req.method === 'POST' ? { ...run, status: 'APPROVED', planId: 'PLT-v4' } : page([])) },
    );
    expect(await screen.findByText(/Approve \d+ orders and go live/)).toBeInTheDocument();
    expect(screen.getByText('The agent cannot publish on its own.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Approval note'), { target: { value: 'Checked the reefer gap' } });
    fireEvent.click(screen.getByTestId('approve'));
    expect(await screen.findByText('Plan PLT-v4 is live')).toBeInTheDocument();
    expect(view.calls.find(c => c.method === 'POST')).toMatchObject({ path: "AgentRuns('run-9')/Lodestar.Resume", body: { decision: 'approve', comment: 'Checked the reefer gap' } });
    expect(screen.getByRole('status')).toHaveTextContent('Continues in Lodestar Dock');
  });

  it('approves a plan waiting for approval with Plans(…)/Lodestar.Approve when there is no agent draft', async () => {
    const view = renderLive(<ApproveAndGoLive />, {
      handler: req => base(req) ?? (req.path === 'Plans' ? page([{ id: 'PLT-v5', depot: 'KANDY', runDate: DAY, version: 5, status: 'NEEDS_APPROVAL', source: 'AUTOPLAN' }])
        : req.method === 'POST' ? { id: 'PLT-v5', status: 'PUBLISHED' } : page([])),
    });
    await screen.findByText(/Approve \d+ orders and go live/);
    fireEvent.click(screen.getByTestId('approve'));
    await waitFor(() => expect(view.calls.some(c => c.method === 'POST' && c.path === "Plans('PLT-v5')/Lodestar.Approve")).toBe(true));
  });

  it('with nothing waiting it cannot approve', async () => {
    renderLive(<ApproveAndGoLive />, { handler: req => base(req) ?? page([]) });
    expect(await screen.findByText('Nothing to approve')).toBeInTheDocument();
    expect(screen.getByTestId('approve')).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('DSP-39 Ask the planning agent', () => {
  it('asks a question with AgentRuns(…)/Lodestar.Ask and shows the answer', async () => {
    window.sessionStorage.setItem('lodestar.agentRun', 'run-9');
    const view = renderLive(<AskAgent />, {
      handler: req => base(req) ?? (req.path === "AgentRuns('run-9')" ? { id: 'run-9', depot: 'KANDY', runDate: DAY, status: 'NEEDS_APPROVAL', createdAt: DAY, detail: { plan: { version: 4, trips: [] } } }
        : req.method === 'POST' ? { value: { answer: 'Reefer space is short.\nThe lowest score waits.', toolCalls: [{ name: 'plan_summary' }] } } : page([])),
    });
    await screen.findByTestId('ask-agent');
    fireEvent.change(screen.getByLabelText('Ask about this plan'), { target: { value: 'Why defer this order?' } });
    fireEvent.click(screen.getByTestId('ask-send'));
    expect(await screen.findByText('Reefer space is short.')).toBeInTheDocument();
    expect(screen.getByText('The lowest score waits.')).toBeInTheDocument();
    expect(view.calls.find(c => c.method === 'POST')).toMatchObject({ path: "AgentRuns('run-9')/Lodestar.Ask", body: { question: 'Why defer this order?' } });
  });
});

describe('DSP-06 Sign in', () => {
  it('starts the Keycloak login instead of showing a password form', async () => {
    const view = renderLive(<SignIn />, { handler: () => page([]), session: null });
    fireEvent.click(screen.getByTestId('sign-in'));
    await waitFor(() => expect(view.auth.login).toHaveBeenCalledWith('/plan'));
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('offers to continue when already signed in', () => {
    renderLive(<SignIn />, { handler: () => page([]), session: SESSIONS.dispatcher });
    fireEvent.click(screen.getByTestId('sign-in'));
    expect(router.push).toHaveBeenCalledWith('/plan');
  });
});
