/// <reference types="cypress" />
// Interactive forms of the desk faces, live screens against a stubbed API (no stack needed):
//  - SM-02 confirm receipt with a count and a reported issue (Orders(…)/Lodestar.ConfirmReceipt), empty state
//  - DSP-01 cutoff queue error and empty states, DSP-03 deferral decision form (date, note, Confirm)
//  - ADM-05 access requests: decline needs a reason (Devices(…)/Lodestar.Revoke), approve (Lodestar.Activate)
import { apiError, openAs, page, stubApi, type ApiRequest } from '../../support/stub';

const DAY = '2026-04-07T00:00:00.000Z';
const OUTLET = { id: 'OUTT01', name: 'Outlet T01', brand: 'FRESH', district: 'District T', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', isActive: true };
const order = (id: string, over = {}) => ({ id, outletId: 'OUTT01', runDate: DAY, orderedAt: DAY, brand: 'FRESH', tempClass: 'AMBIENT', units: 10, kg: 100, m3: 1, status: 'DELIVERED', deferredYesterday: false, daysSince: 1, unitsReceived: null, ...over });
const counts = (req: ApiRequest) => (req.query.$top === '0' ? page([], 0) : undefined);

describe('SM-02 Deliveries · confirm receipt (live, stubbed API)', () => {
  const stop = (id: string, o: { id: string }) => ({ id, tripId: 'TRT1', orderId: o.id, outletId: 'OUTT01', stopSeq: 1, status: 'DELIVERED', etaPlan: DAY, arrivalActual: '2026-04-07T00:40:00.000Z', order: o, trip: { id: 'TRT1', vehicleId: 'VEHT1', status: 'ENROUTE', runDate: DAY } });

  it('counts each order, reports an issue and confirms the receipt', () => {
    stubApi(req => counts(req) ?? (req.path === "Outlets('OUTT01')" ? OUTLET
      : req.path === 'TripStops' ? page([stop('STT1', order('ORDT1', { units: 10 })), stop('STT2', order('ORDT2', { units: 6, tempClass: 'CHILLED' }))])
        : page([])));
    cy.intercept('POST', /\/odata\/v4\/Orders\('ORDT\d'\)\/Lodestar\.ConfirmReceipt$/, { statusCode: 200, body: {} }).as('confirm');
    openAs('store', '/store/sm-02-deliveries');

    cy.get('[data-testid="eta"]').should('have.text', '6:10');
    cy.get('[data-testid="receipt"]').should('be.visible');
    cy.get('[title="One less for ORDT2"]').click();
    cy.get('[title="One less for ORDT2"]').click();
    cy.get('[title="One more for ORDT1"]').click(); // already the full count: stays at 10
    cy.get('[data-testid="receipt-count-ORDT1"]').should('have.text', '10');
    cy.get('[data-testid="receipt-count-ORDT2"]').should('have.text', '4');
    cy.get('[data-testid="confirm-receipt"]').should('have.text', 'Confirm · 2 to credit');

    cy.get('[data-testid="report-issue"]').click();
    cy.get('[aria-label="Order with the issue"]').select('ORDT2');
    cy.contains('[role="radio"]', 'Temperature').click().should('have.attr', 'aria-checked', 'true');
    cy.get('[aria-label="Note for Kandy Hub"]').type('Warm on arrival');
    cy.get('[data-testid="confirm-receipt"]').click();

    cy.wait('@confirm').its('request').should(req => {
      expect(req.url).to.match(/Orders\('ORDT1'\)\/Lodestar\.ConfirmReceipt$/);
      expect(req.body).to.include({ unitsReceived: 10, unitsExpected: 10 });
      expect(req.body).not.to.have.property('note');
    });
    cy.wait('@confirm').its('request').should(req => {
      expect(req.url).to.match(/Orders\('ORDT2'\)\/Lodestar\.ConfirmReceipt$/);
      expect(req.body).to.include({ unitsReceived: 4, unitsExpected: 6, note: '2 short at receipt · Temperature: Warm on arrival' });
    });
  });

  it('with no delivery yet shows the empty states', () => {
    stubApi(req => counts(req) ?? (req.path === "Outlets('OUTT01')" ? OUTLET : page([])));
    openAs('store', '/store/sm-02-deliveries');
    cy.contains('No deliveries yet').should('be.visible');
    cy.contains('No orders in this period').should('be.visible');
    cy.contains('Nothing needs your attention').should('be.visible');
    cy.get('[data-testid="receipt"]').should('not.exist');
  });
});

describe('Plan · cutoff queue states and the deferral decision form (live, stubbed API)', () => {
  const plans = (req: ApiRequest) => (req.path === 'Plans' && req.query.$select === 'runDate' ? page([{ runDate: DAY }]) : undefined);

  it('DSP-01 shows the API error, then an empty queue after “Try again”', () => {
    let fail = true;
    stubApi(req => counts(req) ?? plans(req) ?? (req.path === 'Orders' && fail ? apiError(503, 'The orders service is not reachable') : page([], 0)));
    openAs('dispatcher', '/plan/dsp-01-cutoff-queue');
    cy.contains('[role="alert"]', 'The orders service is not reachable').should('be.visible');
    cy.then(() => { fail = false; });
    cy.contains('[role="alert"] button', 'Try again').click();
    cy.contains('No orders for this run date yet.').should('be.visible');
    cy.get('[role="alert"]').should('not.exist');
  });

  it('DSP-03 confirms the ticked deferrals with the chosen date and the note to the store', () => {
    const deferral = (id: string, orderId: string, score: number) => ({ id, orderId, reason: 'CAP_REEFER', score, status: 'SUGGESTED', isProvisional: false, createdAt: DAY, order: order(orderId, { status: 'RECEIVED', tempClass: 'CHILLED', m3: 1.5 }) });
    stubApi(req => counts(req) ?? plans(req) ?? (req.path === 'Deferrals' ? page([deferral('DT1', 'ORDT1', 18), deferral('DT2', 'ORDT2', 25)])
      : req.path === 'Outlets' ? page([OUTLET]) : page([])));
    cy.intercept('POST', /\/odata\/v4\/Deferrals\('DT\d'\)\/Lodestar\.Confirm$/, { statusCode: 200, body: {} }).as('confirm');
    openAs('dispatcher', '/plan/dsp-03-deferral-decision');

    cy.contains('Defer 2 orders to Wed').should('be.visible');
    cy.get('[data-deferral="DT2"] [role="checkbox"]').click().should('have.attr', 'aria-checked', 'false');
    cy.get('[data-deferral="DT1"]').click();
    cy.get('[aria-label="Rescheduled date"]').should('have.value', '2026-04-08').clear().type('2026-04-09');
    cy.get('[aria-label="Note to store"]').type('Covered till Thursday');
    cy.get('[data-testid="confirm-all"]').click();
    cy.wait('@confirm').its('request').should(req => {
      expect(req.url).to.match(/Deferrals\('DT1'\)\/Lodestar\.Confirm$/);
      expect(req.body).to.deep.eq({ notes: 'Covered till Thursday', rescheduledDate: '2026-04-09' });
    });
    cy.get('@confirm.all').should('have.length', 1);
  });
});

describe('ADM-05 Access requests (live, stubbed API)', () => {
  const pending = { id: 'DEVP1', userId: 'u7', label: 'Driver phone', platform: 'android', model: 'Pixel 7', status: 'PENDING', registeredAt: '2026-04-06T03:00:00.000Z', user: { id: 'u7', name: 'Driver T', email: 'driver.t@example.test', role: 'DRIVER', depot: 'KANDY', isActive: true } };

  it('decline needs a reason, which goes with Devices(…)/Lodestar.Revoke', () => {
    stubApi(req => counts(req) ?? (req.path === 'Devices' && req.query.$filter === "status eq 'PENDING'" ? page([pending]) : page([])));
    cy.intercept('POST', /\/odata\/v4\/Devices\('DEVP1'\)\/Lodestar\.Revoke$/, { statusCode: 200, body: { ...pending, status: 'REVOKED' } }).as('revoke');
    cy.intercept('POST', /\/odata\/v4\/Devices\('DEVP1'\)\/Lodestar\.Activate$/, { statusCode: 200, body: { ...pending, status: 'ACTIVE' } }).as('activate');
    openAs('admin', '/admin/adm-05-access-requests');

    cy.contains('Driver phone for Driver T').should('be.visible');
    cy.get('[data-testid="decline"]').should('have.attr', 'aria-disabled', 'true');
    cy.get('[aria-label="Decision note"]').type('   ');
    cy.get('[data-testid="decline"]').should('have.attr', 'aria-disabled', 'true').and('have.css', 'pointer-events', 'none');
    cy.get('@revoke.all').should('have.length', 0);
    cy.get('[aria-label="Decision note"]').clear().type('Not a company phone');
    cy.get('[data-testid="decline"]').should('not.have.attr', 'aria-disabled');
    cy.get('[data-testid="decline"]').click();
    cy.wait('@revoke').its('request.body').should('deep.eq', { reason: 'Not a company phone' });
    cy.get('@activate.all').should('have.length', 0);
  });

  it('shows why an approval was refused', () => {
    stubApi(req => counts(req) ?? (req.path === 'Devices' && req.query.$filter === "status eq 'PENDING'" ? page([pending]) : page([])));
    cy.intercept('POST', /\/odata\/v4\/Devices\('DEVP1'\)\/Lodestar\.Activate$/, { statusCode: 409, body: { error: { code: 'Conflict', message: 'Device already revoked' } } }).as('activate');
    openAs('admin', '/admin/adm-05-access-requests');
    cy.get('[data-testid="approve-device"]').click();
    cy.wait('@activate');
    cy.contains('[role="alert"]', 'Device already revoked').should('be.visible');
  });
});
