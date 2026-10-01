/// <reference types="cypress" />
// Live mode: the desk faces signed in through Keycloak, showing the seeded scenario (backend/prisma/scenario.ts)
// from the real API. Runs only with CYPRESS_LIVE=1 against the stack (docker compose, gateway on :8443):
//   CYPRESS_LIVE=1 CYPRESS_BASE_URL=https://localhost:8443 npm run cy:run -- --spec "cypress/e2e/live/**/*.cy.ts"
// Without it the suite is skipped, so the static click-through run stays self-contained.
//
// Seed values (backend/prisma/scenario.ts): plan PLG-2026-04-07-v3, trip TRP-VEH057-20260407 on VEH057,
// outlets OUT106 (Fathima's) and OUT108, orders for Tue 7 Apr 2026.
const LIVE = Boolean(Cypress.expose('live'));
const SEED = {
  runDate: '2026-04-07',
  planId: 'PLG-2026-04-07-v3',
  tripId: 'TRP-VEH057-20260407',
  vehicle: 'VEH057',
  outlet: 'OUT106',
  otherOutlet: 'OUT108',
};
const day = `runDate=${SEED.runDate}`;

(LIVE ? describe : describe.skip)('Live · dispatcher (Lodestar Plan)', () => {
  beforeEach(() => cy.loginAs('dispatcher'));

  it('signs in and lands on the plan face', () => {
    cy.openLive('/plan');
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/plan/dsp-08-today-overview');
    cy.contains('.d-side__foot', 'Dispatcher').should('exist');
  });

  it('plan board shows the seeded trips as vehicle lanes', () => {
    cy.openLive(`/plan/dsp-02-plan-board?${day}`);
    cy.contains('.d-h1', 'Plan for Tue 7 Apr').should('exist');
    cy.get('[data-testid="board"]').within(() => {
      cy.get(`[data-vehicle="${SEED.vehicle}"]`, { timeout: 30_000 }).should('exist');
    });
    cy.get('[data-state="error"]').should('not.exist');
  });

  it('cutoff queue lists the run date’s orders', () => {
    cy.openLive(`/plan/dsp-01-cutoff-queue?${day}`);
    cy.get('[data-testid="queue"] [data-order]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
    cy.get('[data-testid="queue-total"]').invoke('text').should('match', /^\d+/);
  });

  it('live operations shows the seeded trip and its stops', () => {
    cy.openLive(`/plan/dsp-04-live-operations?${day}`);
    cy.get(`[data-testid="routes"] [data-trip="${SEED.tripId}"]`, { timeout: 30_000 }).click();
    cy.get('[data-testid="route-drawer"]').should('contain.text', SEED.vehicle).and('contain.text', SEED.outlet);
  });

  it('deferral log and outlet profile read real records', () => {
    cy.openLive('/plan/dsp-17-deferral-log');
    cy.get('[data-state="error"]').should('not.exist');
    cy.openLive(`/plan/dsp-18-outlet-profile?id=${SEED.otherOutlet}`);
    cy.contains('.d-h1', SEED.otherOutlet, { timeout: 30_000 }).should('exist');
  });
});

(LIVE ? describe : describe.skip)('Live · store manager (Lodestar Store)', () => {
  beforeEach(() => cy.loginAs('store'));

  it('sees only the orders of the outlet in the token', () => {
    cy.openLive('/store/sm-27-orders-and-history');
    cy.get('[data-testid="orders"] [data-order]', { timeout: 30_000 }).should('have.length.greaterThan', 0)
      .each($row => expect($row.attr('data-outlet')).to.eq(SEED.outlet));
    cy.get(`[data-testid="orders"] [data-outlet="${SEED.otherOutlet}"]`).should('not.exist');
  });

  it('deliveries and receipts show the seeded delivery', () => {
    cy.openLive('/store/sm-02-deliveries');
    cy.get('[data-testid="next-delivery"]', { timeout: 30_000 }).should('contain.text', SEED.vehicle);
    cy.openLive('/store/sm-28-receipts-and-credit-notes');
    cy.get('[data-testid="receipts"] [data-pod]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
  });

  it('cannot open the plan face', () => {
    cy.visit('/plan/dsp-02-plan-board?design=0');
    cy.location('pathname', { timeout: 30_000 }).should('match', /^\/store\//);
  });
});

(LIVE ? describe : describe.skip)('Live · admin (Lodestar Admin)', () => {
  beforeEach(() => cy.loginAs('admin'));

  it('audit log shows hash-chained entries and the chain is intact', () => {
    cy.openLive('/admin/adm-16-audit-log');
    cy.get('[data-testid="audit-log"] [data-seq]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
    cy.get('[data-testid="chain-hero"]', { timeout: 60_000 }).should('contain.text', 'Intact');
  });

  it('chain check reports VerifyChain valid', () => {
    cy.openLive('/admin/adm-20-chain-check-result');
    cy.get('[data-testid="chain-valid"]', { timeout: 60_000 }).should('have.attr', 'data-valid', 'true');
  });

  it('people, devices and outlets come from the directory and master data', () => {
    cy.openLive('/admin/adm-03-people-and-roles');
    cy.get('[data-testid="people"] [data-user]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
    cy.openLive('/admin/adm-06-devices');
    cy.get('[data-testid="devices"] [data-device]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
    cy.openLive('/admin/adm-08-outlets');
    // 30 outlets a page, sorted by id: find the seeded outlet the way an admin would, with the search box
    cy.get('[data-testid="outlets"] [data-outlet]', { timeout: 30_000 }).should('have.length.greaterThan', 0);
    cy.get('input[aria-label="Search outlets"]').type(SEED.outlet);
    cy.get(`[data-testid="outlets"] [data-outlet="${SEED.outlet}"]`, { timeout: 30_000 }).should('exist');
  });
});
