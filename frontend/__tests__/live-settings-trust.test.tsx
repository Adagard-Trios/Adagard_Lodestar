// Settings and trust screens made live: SM-30 and DSP-20 settings (own preferences), DSP-07 2-step verification,
// DSP-15 late-risk explainer, DSP-16 models and fallbacks, ADM-14/15 data imports, ADM-17 agent guardrails; plus the
// design links restored on the sidebars. Real ODataClient over a fake fetch. Written, not run (tests paused).
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AdminSide, PlanSide } from '@/components/live/chrome';
import { type DataImport, importFileOf, type Preferences, readText } from '@/components/live/settings-data';
import Imports from '@/live/adm-14-data-imports';
import ImportFailed, { rejectedCsv } from '@/live/adm-15-import-check-failed';
import AuditLog from '@/live/adm-16-audit-log';
import Guardrails from '@/live/adm-17-planning-agent-guardrails';
import TwoStep, { accountSecurityUrl } from '@/live/dsp-07-2-step-verification';
import LateRisk, { explainRisk } from '@/live/dsp-15-late-risk-explainer';
import Models from '@/live/dsp-16-models-and-fallbacks';
import PlanSettings from '@/live/dsp-20-settings';
import StoreSettings from '@/live/sm-30-settings';
import { freezeDate, unfreeze } from './helpers/clock';
import type { FakeRequest } from './helpers/live';
import { page, renderLive, SESSIONS } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/plan' }));

const CONFIG = {
  model: { setting: 'mock', provider: 'mock', label: 'Deterministic built-in model', configured: true, deployment: null, endpointHost: null, missing: [] },
  fallback: 'Manual plan board', humanApproval: true, canPublish: false, maxRedrafts: 3, firstDeparture: '03:30',
  limits: { maxTripsPerVehicle: 2, freshMinutesBudget: 270, otherMinutesBudget: 480, protectedScore: 91, deferralCandidateBelow: 30, defaultServiceMin: 15 },
  rules: [{ rule: 'weight', label: 'Weight' }, { rule: 'volume', label: 'Volume' }],
  reasonCodes: ['CAP_REEFER', 'CAP_TIME', 'ACCESS', 'WINDOW', 'FUEL', 'VEH_DOWN'],
  reads: ['Calendar', 'DistrictTravel', 'Orders', 'Outlets', 'ServiceAllowances', 'Vehicles'],
  askTools: [], decisions: ['approve', 'edit', 'reject'], decidedBy: 'dispatcher',
};
const failed = {
  id: 'imp-9', file: 'outlets', fileName: 'outlets_2026-04-07.csv', rows: 120, passed: 118, applied: false, created: 0, updated: 0,
  problems: [{ row: 89, key: 'OUT088', column: 'parking_constraint', value: 'vans', reason: 'Lodestar reads only normal, van_only or mall_dock (with an underscore).' }],
  checks: [{ label: 'Every outlet_id appears once', passed: true, detail: '120 distinct' }], importedBy: 'u-a', byName: 'Ada Admin', importedAt: '2026-04-06T04:55:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/plan');
  freezeDate('2026-04-06T08:00:00.000Z');
});
afterEach(unfreeze);

type SaveBody = { preferences: Preferences & { notifications: Record<string, unknown>; alerts: Record<string, unknown> } };

const fallback = (req: FakeRequest) => (req.query.$top === '0' ? page([], 0) : page([]));

describe('sidebars carry the designed links again', () => {
  it('Plan has N8 Intelligence and N9 Settings; Admin has N8 Data imports and N10 Planning agent', () => {
    renderLive(<><PlanSide active="N0" /><AdminSide active="N0" /></>, { handler: fallback });
    expect(screen.getByText('Intelligence').closest('[data-lk]')).toHaveAttribute('data-lk', 'N8');
    expect(screen.getByText('Settings').closest('[data-lk]')).toHaveAttribute('data-lk', 'N9');
    expect(screen.getByText('Data imports').closest('[data-lk]')).toHaveAttribute('data-lk', 'N8');
    expect(screen.getByText('Planning agent').closest('[data-lk]')).toHaveAttribute('data-lk', 'N10');
  });
});

describe('SM-30 Settings', () => {
  it('loads the manager’s preferences, toggles SMS for "Van on the way" and saves only own sections', async () => {
    const view = renderLive(<StoreSettings />, {
      session: SESSIONS.store,
      handler: req => req.path.includes('SaveMyPreferences') ? { value: (req.body as { preferences: unknown }).preferences }
        : req.path.includes('MyPreferences') ? { value: { language: 'si' } }
          : req.path.startsWith("Outlets('OUTT01')") ? { id: 'OUTT01', name: 'Waypoint Fresh Test', brand: 'FRESH', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', accessNote: 'Lawson St lane' }
            : fallback(req),
    });
    expect(await screen.findByText('Lawson St lane')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Van on the way SMS'));
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/store/sm-02-deliveries'));
    const save = view.calls.find(c => c.path.includes('SaveMyPreferences'))!;
    expect(save.method).toBe('POST');
    expect((save.body as SaveBody).preferences.notifications.vanOnTheWay).toEqual({ app: true, sms: true });
    expect((save.body as SaveBody).preferences.language).toBe('si');
  });
});

describe('DSP-20 Settings', () => {
  it('shows the agent’s limits and reason codes and saves the dispatcher’s alert rules', async () => {
    const view = renderLive(<PlanSettings />, {
      handler: req => req.path.includes('SaveMyPreferences') ? { value: (req.body as { preferences: unknown }).preferences }
        : req.path.includes('MyPreferences') ? { value: {} }
          : req.path.includes('AgentConfig') ? { value: CONFIG } : fallback(req),
    });
    expect(await screen.findByText('3:30 to 8:00 · 270 min')).toBeInTheDocument();
    expect(screen.getByTestId('reason-codes')).toHaveTextContent('CAP_REEFER');
    fireEvent.click(await screen.findByLabelText('Vehicle fault SMS'));
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/plan/dsp-08-today-overview'));
    const save = view.calls.find(c => c.path.includes('SaveMyPreferences'))!;
    expect((save.body as SaveBody).preferences.alerts.vehicleFault).toEqual({ push: true, sms: false });
  });
});

describe('DSP-07 2-step verification', () => {
  it('shows the Keycloak status and links to the account console', async () => {
    renderLive(<TwoStep />, { handler: req => (req.path.includes('MyTwoFactor') ? { value: { available: true, enabled: true, setupRequired: false, otp: [{ label: 'Pixel', createdAt: '2026-03-01T00:00:00Z' }] } } : fallback(req)) });
    expect(await screen.findByText('2-step verification is on')).toBeInTheDocument();
    expect(screen.getByText('Continue to Lodestar Plan').closest('[data-lk]')).toHaveAttribute('data-lk', 'L146');
    expect(accountSecurityUrl('https://x/auth/realms/lodestar/')).toBe('https://x/auth/realms/lodestar/account/#/security/signingin');
  });
});

describe('DSP-15 Late-risk explainer', () => {
  it('adds up to the stored figure the way the planning service sets it', () => {
    const { parts } = explainRisk({ roadClass: 'hill', monsoon: true, plannedHour: 5, modelMin: 7 * 60 + 28, windowCloseMin: 7 * 60 + 45, actual: 61 });
    expect(parts.map(p => p.value)).toEqual([20, 30, 11]);
    expect(parts.reduce((s, p) => s + p.value, 0)).toBe(61);
  });

  it('explains the riskiest open stop of the run', async () => {
    renderLive(<LateRisk />, {
      handler: req => req.path === 'Plans' ? page([{ runDate: '2026-04-07T00:00:00.000Z' }])
        : req.path === 'Trips' ? page([{ id: 't1', vehicleId: 'VEH057', tripNumber: 1, depot: 'KANDY', stops: [
          { id: 's1', orderId: 'o1', outletId: 'OUT106', stopSeq: 1, status: 'ENROUTE', lateRiskPct: 12, etaPlan: '2026-04-07T00:01:00Z', etaModel: '2026-04-07T01:05:00Z' },
          { id: 's2', orderId: 'o2', outletId: 'OUT108', stopSeq: 2, status: 'ENROUTE', lateRiskPct: 61, etaPlan: '2026-04-06T23:31:00Z', etaModel: '2026-04-07T01:58:00Z', etaModelBandEarly: '2026-04-07T01:40:00Z', etaModelBandLate: '2026-04-07T02:15:00Z' },
        ] }])
          : req.path.startsWith("Outlets('OUT108')") ? { id: 'OUT108', name: 'Waypoint Fresh Hawa Eliya', district: 'Nuwara Eliya', windowOpen: '05:30', windowClose: '07:45' }
            : req.path === 'DistrictTravel' ? page([{ roadClass: 'hill' }])
              : req.path === 'Calendar' ? page([{ monsoon: 1 }]) : fallback(req),
    });
    expect(await screen.findByText('Why OUT108 reads 61%')).toBeInTheDocument();
    expect(await screen.findByText('Base rate')).toBeInTheDocument();
  });
});

describe('DSP-16 Models and fallbacks', () => {
  it('shows the agent model from the config endpoint and the calendar horizon', async () => {
    renderLive(<Models />, {
      handler: req => req.path.includes('AgentConfig') ? { value: CONFIG }
        : req.path === 'Calendar' && req.query.$top === '1' ? page([{ date: '2026-06-28T00:00:00.000Z' }])
          : req.path === 'ServiceAllowances' ? page([{ brand: 'FRESH', dockType: 'REAR_DOCK', minutes: 15 }]) : fallback(req),
    });
    expect(await screen.findByText(/Deterministic built-in model/)).toBeInTheDocument();
    expect(await screen.findByTestId('horizon')).toHaveTextContent('(W26)');
  });
});

describe('ADM-14 Data imports', () => {
  it('lists the files with their row counts and sends a picked CSV to DataImports/Lodestar.Import', async () => {
    const view = renderLive(<Imports />, {
      session: SESSIONS.admin,
      handler: req => req.path.includes('Lodestar.Import') ? { ...failed, applied: true, problems: [], created: 1, updated: 119 }
        : req.path === 'Outlets' && req.query.$top === '0' ? page([], 120) : fallback(req),
    });
    expect(await screen.findByTestId('file-outlets')).toHaveTextContent('120');
    const file = new File(['outlet_id,brand\nOUT1,fresh\n'], 'outlets.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.click(await screen.findByText('Check and import'));
    expect(await screen.findByTestId('import-done')).toHaveTextContent('1 new, 119 updated');
    const call = view.calls.find(c => c.path.includes('Lodestar.Import'))!;
    expect(call.body).toMatchObject({ file: 'outlets', fileName: 'outlets.csv' });
    expect(importFileOf('district_travel_v2.csv')).toBe('district_travel');
  });
});

describe('ADM-14 Data imports · failed file and file reading', () => {
  it('a file whose last import failed opens ADM-15 on that import', async () => {
    renderLive(<Imports />, {
      session: SESSIONS.admin,
      handler: req => (req.path === 'DataImports' && req.query.$filter === "file eq 'outlets'" ? page([failed]) : fallback(req)),
    });
    const row = await screen.findByTestId('file-outlets');
    await waitFor(() => expect(row).toHaveTextContent('Check failed'));
    fireEvent.click(row);
    expect(router.push).toHaveBeenCalledWith('/admin/adm-15-import-check-failed?id=imp-9');
    fireEvent.click(screen.getByTestId('file-vehicles'));
    expect(router.push).toHaveBeenCalledTimes(1); // a clean file has nothing to open
  });

  it('reads a picked file with a FileReader where Blob.text() is missing', async () => {
    const blob = new Blob(['outlet_id\nOUT1\n'], { type: 'text/csv' });
    Object.defineProperty(blob, 'text', { value: undefined });
    await expect(readText(blob)).resolves.toBe('outlet_id\nOUT1\n');
  });
});

describe('ADM-15 Import check failed', () => {
  it('shows the newest failed import’s rejected rows and checks', async () => {
    renderLive(<ImportFailed />, { session: SESSIONS.admin, handler: req => (req.path === 'DataImports' ? page([failed]) : fallback(req)) });
    expect(await screen.findByText('Import check failed')).toBeInTheDocument();
    expect(await screen.findByTestId('rejected-rows')).toHaveTextContent('OUT088');
    expect(rejectedCsv(failed as unknown as DataImport)).toContain('89,OUT088,parking_constraint,vans');
  });
});

describe('ADM-17 Planning agent guardrails', () => {
  it('shows the locked approval guardrail and what the agent reads, from the agent config', async () => {
    renderLive(<Guardrails />, { session: SESSIONS.admin, handler: req => (req.path.includes('AgentConfig') ? { value: CONFIG } : fallback(req)) });
    expect(await screen.findByText("It can never publish a plan without a dispatcher's approval")).toBeInTheDocument();
    expect(await screen.findByTestId('may-do')).toHaveTextContent('up to 3 redrafts');
    expect(screen.getByTestId('may-read')).toHaveTextContent('not read');
  });

  it('“See its last 30 proposals” opens the audit log on the planning agent’s entries', async () => {
    const view = renderLive(<Guardrails />, { session: SESSIONS.admin, handler: req => (req.path.includes('AgentConfig') ? { value: CONFIG } : fallback(req)) });
    fireEvent.click(screen.getByText('See its last 30 proposals'));
    expect(window.sessionStorage.getItem('lodestar.audit.area')).toBe('agent');
    view.unmount();
    const log = renderLive(<AuditLog />, { session: SESSIONS.admin, handler: fallback });
    await waitFor(() => expect(log.calls.some(c => c.path === 'AuditEntries' && c.query.$filter === "entitySet in ('AgentRuns')" && c.query.$top === '30')).toBe(true));
    expect(screen.getByText('Planning agent', { selector: '.d-filter' })).toHaveClass('is-on');
    expect(window.sessionStorage.getItem('lodestar.audit.area')).toBeNull();
  });
});
