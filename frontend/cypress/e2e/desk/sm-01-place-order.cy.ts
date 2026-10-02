/// <reference types="cypress" />
// SM-01 Place order, live screen, against a stubbed API (no stack needed; runs in CI against `next start`).
// The store manager starts from the last orders, adjusts quantities, adds and removes lines, and submits one
// POST /Orders per temperature class. Validation, the API's refusal, and the loading and error states.
import { apiError, NOW, openAs, page, stubApi, type ApiRequest } from '../../support/stub';

const DAY = '2026-04-07T00:00:00.000Z';
const OUTLET = { id: 'OUTT01', name: 'Outlet T01', brand: 'FRESH', district: 'District T', depot: 'KANDY', dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:30', windowClose: '08:00', isActive: true };
const order = (id: string, tempClass: string, items: Array<[string, number, number]>) => ({
  id, outletId: 'OUTT01', runDate: DAY, orderedAt: DAY, brand: 'FRESH', tempClass, units: 10, kg: 62, m3: 0.31, status: 'DELIVERED', deferredYesterday: false, daysSince: 1,
  lineItems: items.map(([name, qty, kg], i) => ({ id: `${id}-${i}`, orderId: id, name, qty, kg, tempClass })),
});
const LAST = [order('ORDT1', 'AMBIENT', [['Rice 5 kg', 10, 50]]), order('ORDT2', 'CHILLED', [['Milk 1 L', 10, 12]])];

/** The store's reads: counts, the outlet in the token, the last orders, the calendar. */
const store = (orders: unknown[] = LAST) => (req: ApiRequest) =>
  req.query.$top === '0' ? page([], 0)
    : req.path === "Outlets('OUTT01')" ? OUTLET
      : req.path === 'Orders' ? page(orders)
        : page([]);

const submit = () => cy.get('[data-testid="submit-order"]');
const dry = () => cy.get('[data-testid="lines-ambient"]');
const addButton = () => dry().contains('[role="button"]', /^Add$/);

describe('SM-01 Place order (live, stubbed API)', () => {
  it('starts from the last order, adjusts it, adds and removes lines, and submits POST /Orders', () => {
    stubApi(store());
    let n = 0;
    cy.intercept('POST', '/odata/v4/Orders', req => req.reply({ statusCode: 201, body: { id: `ORDNEW${++n}`, ...req.body } })).as('createOrder');
    openAs('store', '/store/sm-01-place-order');

    cy.contains('.d-h1', 'Order for Tue 7 Apr').should('be.visible');
    cy.contains('2 h 30 m').should('be.visible');
    cy.contains('Delivered in your window 05:30–08:00').should('exist');
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '10');
    cy.get('[data-testid="order-summary"]').should('contain.text', '2 orders · 20 units · 62 kg');

    // one more rice; the milk taken down to zero drops the chilled order
    cy.get('[title="More Rice 5 kg"]').click();
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '11');
    for (let i = 0; i < 10; i++) cy.get('[title="Less Milk 1 L"]').click();
    cy.get('[aria-label="Milk 1 L quantity"]').should('have.text', '0');
    cy.get('[title="Less Milk 1 L"]').click();
    cy.get('[aria-label="Milk 1 L quantity"]').should('have.text', '0');

    // a new dry line
    cy.get('[aria-label="New dry order item"]').type('Dhal 1 kg');
    dry().find('[aria-label="kg per unit"]').type('1');
    addButton().click();
    dry().find('[data-line="Dhal 1 kg"]').should('contain.text', 'new');
    cy.get('[aria-label="New dry order item"]').should('have.value', '');
    cy.get('[data-testid="order-summary"]').should('contain.text', '1 order · 12 units · 56 kg');
    submit().should('contain.text', 'Submit 1 order');

    submit().click();
    cy.wait('@createOrder').then(({ request }) => {
      expect(request.method).to.eq('POST');
      expect(request.body).to.deep.include({ outletId: 'OUTT01', runDate: DAY, brand: 'FRESH', tempClass: 'AMBIENT', units: 12, kg: 56 });
      expect(request.body.lineItems).to.deep.eq([
        { name: 'Rice 5 kg', qty: 11, kg: 55, tempClass: 'AMBIENT' },
        { name: 'Dhal 1 kg', qty: 1, kg: 1, tempClass: 'AMBIENT' },
      ]);
    });
    cy.location('pathname').should('eq', '/store/sm-27-orders-and-history');
    cy.get('@createOrder.all').should('have.length', 1);
  });

  it('validates a new line (name and a positive kg per unit) and never submits an empty order', () => {
    stubApi(store([]));
    cy.intercept('POST', '/odata/v4/Orders', { statusCode: 201, body: { id: 'X' } }).as('createOrder');
    openAs('store', '/store/sm-01-place-order');

    cy.contains('first order').should('exist');
    dry().should('contain.text', 'No lines yet');
    cy.get('[data-testid="order-summary"]').should('contain.text', '0 orders · 0 units');
    // a disabled action takes no pointer events: the user cannot click it
    submit().should('have.attr', 'aria-disabled', 'true').and('contain.text', 'Submit 0 orders').and('have.css', 'pointer-events', 'none');

    addButton().should('have.attr', 'aria-disabled', 'true');
    cy.get('[aria-label="New dry order item"]').type('Rice 5 kg');
    addButton().should('have.attr', 'aria-disabled', 'true');
    for (const bad of ['abc', '0', '-1']) {
      dry().find('[aria-label="kg per unit"]').clear().type(bad);
      addButton().should('have.attr', 'aria-disabled', 'true').click(); // clickable, but adds nothing
      dry().find('[data-line]').should('not.exist');
    }
    dry().find('[aria-label="kg per unit"]').clear().type('5');
    addButton().should('not.have.attr', 'aria-disabled');
    addButton().click();
    dry().find('[data-line="Rice 5 kg"]').should('exist');
    submit().should('not.have.attr', 'aria-disabled');

    // removing the only quantity disables Submit again
    cy.get('[title="Less Rice 5 kg"]').click();
    submit().should('have.attr', 'aria-disabled', 'true').and('have.css', 'pointer-events', 'none');
    cy.get('@createOrder.all').should('have.length', 0);
  });

  it('shows the API’s refusal and keeps the order on screen', () => {
    stubApi(store());
    cy.intercept('POST', '/odata/v4/Orders', { statusCode: 422, body: { error: { code: 'CutoffPassed', message: 'Orders for Tue 7 Apr closed at 4:00 PM on Mon 6 Apr.' } } }).as('createOrder');
    openAs('store', '/store/sm-01-place-order');
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '10');
    submit().click();
    cy.wait('@createOrder');
    cy.get('[role="alert"]').should('be.visible').and('contain.text', 'Orders for Tue 7 Apr closed at 4:00 PM on Mon 6 Apr.').and('contain.text', 'CutoffPassed');
    cy.location('pathname').should('eq', '/store/sm-01-place-order');
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '10');
    submit().should('not.have.attr', 'aria-disabled');
  });

  it('shows a skeleton while the last orders load', () => {
    stubApi(store());
    let release!: () => void;
    const gate = new Promise<void>(r => (release = r));
    cy.intercept({ method: 'GET', pathname: '/odata/v4/Orders' }, req => gate.then(() => req.reply({ body: page(LAST) }))).as('history');
    openAs('store', '/store/sm-01-place-order');
    cy.get('[data-state="loading"]').should('be.visible');
    submit().should('have.attr', 'aria-disabled', 'true');
    cy.then(() => release());
    cy.wait('@history');
    cy.get('[data-state="loading"]').should('not.exist');
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '10');
  });

  it('shows the error when the last orders cannot load, and “Try again” loads them', () => {
    let fail = true;
    stubApi(req => (req.path === 'Orders' && fail ? apiError(503, 'The orders service is not reachable') : store()(req)));
    openAs('store', '/store/sm-01-place-order');
    cy.get('[role="alert"]').should('contain.text', 'The orders service is not reachable');
    cy.then(() => { fail = false; });
    cy.contains('[role="alert"] button', 'Try again').click();
    cy.get('[aria-label="Rice 5 kg quantity"]').should('have.text', '10');
    cy.get('[role="alert"]').should('not.exist');
  });

  // After the 4:00 PM cutoff the API takes the order and moves it to the next open run
  // (backend/apps/orders/src/order-cutoff.ts); the screen says so and shows the run date the API returned.
  it('submits for a run that has closed and shows the later run the API moved it to', () => {
    const note = 'Placed after the 4:00 PM cut-off for 2026-04-07; moved to the 2026-04-08 run.';
    stubApi(store());
    cy.intercept('POST', '/odata/v4/Orders', req => req.reply({ statusCode: 201, body: { ...req.body, id: 'ORDNEW1', runDate: '2026-04-08T00:00:00Z', notes: note } })).as('createOrder');
    openAs('store', '/store/sm-01-place-order', NOW + 3 * 3600_000); // 16:30 in Colombo
    cy.contains('.d-h1', 'Order for Wed 8 Apr').should('be.visible');
    cy.contains('Delivered in your window').should('exist');
    cy.get('[aria-label="Delivery date"]').clear().type('2026-04-07');
    cy.contains('.d-h1', 'Order for Tue 7 Apr').should('be.visible');
    cy.contains('.d-kpi__v', 'Closed').should('be.visible');
    cy.contains('.d-kpi__s', 'Submit now and the order goes to the next open run, Wed 8 Apr').should('be.visible');
    submit().should('not.have.attr', 'aria-disabled');
    submit().click();
    cy.wait('@createOrder').its('request.body.runDate').should('eq', DAY);
    cy.get('[data-testid="order-moved"]').should('be.visible').and('contain.text', 'Received: ORDNEW1 for Wed 8 Apr').and('contain.text', note);
    cy.location('pathname').should('eq', '/store/sm-01-place-order');
    submit().should('have.attr', 'aria-disabled', 'true');
    cy.contains('[data-testid="order-moved"] [role="button"]', 'See your orders').click();
    cy.location('pathname').should('eq', '/store/sm-27-orders-and-history');
    cy.get('@createOrder.all').should('have.length', 1);
  });
});
