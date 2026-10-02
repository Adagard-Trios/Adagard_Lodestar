// Cross-role flow helpers (specs/flows): each spec works on its own future run date, with its own orders, so
// specs never share state and nothing is reseeded. Each role works in its own browser context:
//   desk (store manager, dispatcher, admin): Desktop Chrome 1440×900, signed in through Keycloak's form;
//   field (driver, loader, store phone): 390×844 on /field/, signed in through the app's Keycloak popup, with the
//   browser clock set to the run date (the field app's "today" is the phone's clock: mobile/src/model/hooks.ts).
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { loginViaUi } from './auth';
import { PERSONAS, WEB_URL, type PersonaKey } from './env';
import { expectStatus, type OData } from './fixtures';

export type Row = Record<string, any>;

export const DEPOT = 'KANDY';
export const STORE = PERSONAS.storeManager.outletId!; // OUT106, Fresh Nuwara Eliya
export const VAN = PERSONAS.driver.vehicleId!; // VEH057, ruwan's chilled van

const COLOMBO_MS = 330 * 60_000;
const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => day(new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000));

/** Today in Asia/Colombo (the server's business day), from the machine clock. */
export const colomboToday = () => day(new Date(Date.now() + COLOMBO_MS));

/** The instant `hh:mm` Colombo time on `iso`. */
export const colomboAt = (iso: string, hhmm = '03:00') => new Date(`${iso}T${hhmm}:00+05:30`);

/**
 * A run date of this spec's own: the first operating day (not a Sunday, open in the calendar) after every run
 * date that already has orders, and at least today+3 (orders close 4:00 PM Colombo the day before, by server
 * time). Being the latest run, it is what the store's screens show first (SM-02, SM-27), whatever earlier runs
 * left behind. Specs run one after another, so each one gets a later day than the last.
 */
export async function freeRunDate(d: OData): Promise<string> {
  const latest = (await d.json<{ value: Row[] }>(`Orders?$select=runDate&$orderby=runDate desc&$top=1`)).value[0];
  const floor = addDays(colomboToday(), 3);
  let iso = latest && String(latest.runDate).slice(0, 10) >= floor ? addDays(String(latest.runDate).slice(0, 10), 1) : floor;
  const cal = (await d.json<{ value: Row[] }>(`Calendar?$filter=date ge ${iso}T00:00:00Z and date le ${addDays(iso, 14)}T00:00:00Z`)).value;
  const closed = new Set(cal.filter(c => c.isOperating === false).map(c => String(c.date).slice(0, 10)));
  while (new Date(`${iso}T00:00:00Z`).getUTCDay() === 0 || closed.has(iso)) iso = addDays(iso, 1);
  return iso;
}

export type OrderSpec = { outletId: string; brand: string; tempClass: 'AMBIENT' | 'CHILLED'; units: number; kg: number; m3: number; name?: string };

/** POST Orders with one line, as `client` (store manager for her outlet, dispatcher for any of her depots). */
export async function placeOrder(client: OData, runDate: string, o: OrderSpec): Promise<Row> {
  const res = await client.post('Orders', {
    outletId: o.outletId, runDate: `${runDate}T00:00:00Z`, brand: o.brand, tempClass: o.tempClass, units: o.units, kg: o.kg, m3: o.m3,
    lineItems: [{ name: o.name ?? `flow ${o.tempClass.toLowerCase()} case`, qty: o.units, kg: o.kg, tempClass: o.tempClass }],
  });
  await expectStatus(res, 201, `order for ${o.outletId} on ${runDate}`);
  return res.json();
}

/**
 * The rest of the depot's day, so the plan has to defer: one big chilled order per outlet, each about a reefer
 * truck's load, on more outlets than the depot's reefers can carry in two trips each. None for the store's
 * own district, so the store's orders stay a trip of their own.
 */
export async function overloadReefers(d: OData, runDate: string, count = 12): Promise<Row[]> {
  const outlets = (await d.json<{ value: Row[] }>(`Outlets?$filter=depot eq '${DEPOT}' and isActive eq true and id ne '${STORE}'&$orderby=id&$top=200`)).value
    .filter(o => o.district !== 'Nuwara Eliya' && o.parking !== 'VAN_ONLY' && o.dockType !== 'MALL_BAY');
  expect(outlets.length, 'Kandy outlets to overload the reefers with').toBeGreaterThanOrEqual(count);
  const placed: Row[] = [];
  for (const o of outlets.slice(0, count)) {
    placed.push(await placeOrder(d, runDate, { outletId: o.id, brand: o.brand, tempClass: 'CHILLED', units: 40, kg: 3300, m3: 3, name: 'flow chilled pallet' }));
  }
  return placed;
}

/** POST AgentRuns and wait until the draft waits for a human. */
export async function draft(d: OData, runDate: string): Promise<Row> {
  const start = await d.post('AgentRuns', { depot: DEPOT, runDate });
  await expectStatus(start, [200, 201], 'start agent run');
  return waitForDraft(d, (await start.json()).id);
}

export async function waitForDraft(d: OData, runId: string): Promise<Row> {
  await expect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).status, { timeout: 180_000, intervals: [1000, 2000, 3000] }).toBe('NEEDS_APPROVAL');
  return d.json<Row>(`AgentRuns('${runId}')`);
}

/** The draft's trip that carries `orderId`, if any. */
export const tripOf = (run: Row, orderId: string): Row | undefined => (run.detail?.plan?.trips ?? []).find((t: Row) => (t.orderIds ?? []).includes(orderId));

/**
 * Edits for the draft so the store's orders ride ruwan's van (the persona driver sees only VEH057's trips):
 * a move to VEH057, on a trip of its own unless the van's trip already serves the same brand and district.
 */
export function moveToVan(run: Row, orderIds: string[]): Row[] {
  const trips: Row[] = run.detail?.plan?.trips ?? [];
  const vanTrips = trips.filter(t => t.vehicleId === VAN);
  const mine = vanTrips.find(t => orderIds.some(o => t.orderIds.includes(o)));
  const free = mine?.tripNo ?? ([1, 2].find(n => !vanTrips.some(t => t.tripNo === n && t.orderIds.some((o: string) => !orderIds.includes(o)))) ?? 1);
  return orderIds.filter(o => tripOf(run, o)?.vehicleId !== VAN || tripOf(run, o)?.tripNo !== free).map(orderId => ({ op: 'move', orderId, vehicleId: VAN, tripNo: free }));
}

// ---------------------------------------------------------------- browsers

/** A desk browser (1440×900) signed in as `who` at `path` (FaceGate sends an anonymous visit to Keycloak). */
export async function deskPage(browser: Browser, who: PersonaKey, path: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(`${WEB_URL}${path}`);
  await loginViaUi(page, who);
  await expect(page.locator('.web-screen .frame')).toBeVisible({ timeout: 30_000 });
  return { context, page };
}

/**
 * A phone (390×844) on the field app, its clock at `hhmm` Colombo on the run date, signed in as `who` from the
 * role's sign-in screen. The persona's shared demo phone is adopted after sign-in (no device setup).
 */
export async function fieldPage(browser: Browser, who: PersonaKey, signInScreen: string, button: string, runDate: string, hhmm = '03:00') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
  await context.clock.install({ time: colomboAt(runDate, hhmm) });
  const page = await context.newPage();
  await page.goto(`${WEB_URL}/field/s/${signInScreen}`);
  await signInFrom(page, button, who);
  return { context, page };
}

/** Taps a field control that opens the Keycloak sign-in window, and signs in there as `who`. */
export async function signInFrom(page: Page, button: string, who: PersonaKey) {
  const cta = onScreen(page, button);
  await expect(cta).toBeEnabled({ timeout: 30_000 });
  // the PKCE request is prepared after the screen renders: tap again only if no window opened
  let popup: Page | undefined;
  for (let i = 0; i < 3 && !popup; i++) {
    [popup] = await Promise.all([page.context().waitForEvent('page', { timeout: 20_000 }).catch(() => undefined), cta.click()]);
  }
  if (!popup) throw new Error('the sign-in window did not open');
  await signInPopup(popup, who);
}

/** Completes Keycloak's form in the app's sign-in popup (a returning user is only asked for the password). */
export async function signInPopup(popup: Page, who: PersonaKey) {
  const p = PERSONAS[who];
  await popup.waitForURL(/\/realms\/.+\/protocol\/openid-connect\/auth|\/login-actions\//, { timeout: 30_000 });
  await expect(popup.locator('#password')).toBeVisible({ timeout: 30_000 });
  const user = popup.locator('#username');
  if ((await user.count()) && (await user.isEditable({ timeout: 2_000 }).catch(() => false))) await user.fill(p.username);
  await popup.locator('#password').fill(p.password);
  await popup.locator('#kc-login').click();
  await popup.waitForEvent('close', { timeout: 30_000 }).catch(() => undefined);
}

/** Opens a field screen in place (client-side navigation keeps the in-memory session; a reload would sign out). */
export async function openField(page: Page, key: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  await page.evaluate(href => {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, `/field/s/${key}${q ? `?${q}` : ''}`);
  await expect(page).toHaveURL(new RegExp(`/field/s/${key}`));
}

/** No horizontal scroll on a phone screen. */
export async function expectFitsPhone(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

/**
 * A control on the field screen in front: the app's stack keeps earlier screens mounted (hidden), so a testID can
 * match more than once after moving back and forth.
 */
export const onScreen = (page: Page, testId: string) => page.getByTestId(testId).locator('visible=true').last();

/**
 * Precondition for a store's receipt step: counts left open by earlier runs (a delivered or arrived order nobody counted)
 * are confirmed in full, so SM-02 asks about this spec's delivery and nothing else.
 */
export async function settleOpenReceipts(store: OData) {
  // delivered, or still en route after an earlier run stopped half way (arrived, POD never sent)
  const open = (await store.json<{ value: Row[] }>(`Orders?$filter=outletId eq '${STORE}' and status in ('DELIVERED','ENROUTE','EXCEPTION') and unitsReceived eq null&$top=100`)).value;
  for (const o of open) {
    await expectStatus(
      await store.post(`Orders('${o.id}')/Lodestar.ConfirmReceipt`, { unitsReceived: o.units, unitsExpected: o.units, savedAt: new Date().toISOString() }),
      200, `settle the open receipt of ${o.id}`,
    );
  }
}

/**
 * Setup for specs that start later in the day (their own UI steps follow): the agent drafts, the store's orders
 * go on ruwan's van, the dispatcher approves and the plan is published. Returns the van's trip with its stops.
 */
export async function planOntoVan(d: OData, runDate: string, storeOrderIds: string[]): Promise<{ planId: string; runId: string; trip: Row; stops: Row[] }> {
  let run = await draft(d, runDate);
  const edits = moveToVan(run, storeOrderIds);
  if (edits.length) {
    await expectStatus(await d.post(`AgentRuns('${run.id}')/Lodestar.Resume`, { decision: 'edit', edits }), 200, 'move the store orders onto the van');
    run = await waitForDraft(d, run.id);
  }
  await expectStatus(await d.post(`AgentRuns('${run.id}')/Lodestar.Resume`, { decision: 'approve' }), 200, 'approve the draft');
  await expect.poll(async () => (await d.json<Row>(`AgentRuns('${run.id}')`)).planId, { timeout: 120_000 }).toBeTruthy();
  const planId = (await d.json<Row>(`AgentRuns('${run.id}')`)).planId as string;
  await expect.poll(async () => (await d.json<Row>(`Plans('${planId}')`)).status, { timeout: 120_000 }).toBe('PUBLISHED');
  const trip = (await d.json<{ value: Row[] }>(`Trips?$filter=planId eq '${planId}' and vehicleId eq '${VAN}'&$expand=stops`)).value[0];
  expect(trip, 'the van\'s trip').toBeTruthy();
  return { planId, runId: run.id, trip, stops: [...trip.stops].sort((a: Row, b: Row) => a.stopSeq - b.stopSeq) };
}

/** Setup: the dock loads the trip in full and releases it (LoadRecords + Trips('…')/Lodestar.Release). */
export async function loadAndRelease(loader: OData, trip: Row) {
  await expectStatus(await loader.post('LoadRecords', { tripId: trip.id, bay: trip.bay, shortfalls: [] }), 201, 'load record');
  await expectStatus(await loader.post(`Trips('${trip.id}')/Lodestar.Release`, { sealNumber: `SEAL-${trip.id.slice(-12)}`, reeferTempC: 3 }), 200, 'release');
}
