/// <reference types="cypress" />
// Demo flow 1 · Happy path, desk part.
// Fathima (OUT106 Nuwara Eliya) submits Tuesday's orders; Nilanthi watches the cutoff queue, the planning
// agent drafts plan v3, she reviews and approves 2 deferrals, then approves the plan. The agent never publishes.
//   SM-01 -> DSP-01 -> DSP-22 (auto) -> DSP-02 -> DSP-03 -> DSP-12 -> (Lodestar Dock on the phone)

describe('Flow 1 · Happy path (desk part)', () => {
  it('store order to approved plan', () => {
    // SM-01 Place order (Store desk)
    cy.openScreen('/store/sm-01-place-order');
    cy.contains('Waypoint Fresh Nuwara Eliya').should('be.visible');
    cy.contains('2 orders · 92 units').should('exist');
    cy.tapLink('L0', 'Submit 2 orders');

    // DSP-01 Cutoff queue (Plan)
    cy.shouldBeOn('/plan/dsp-01-cutoff-queue');
    cy.waitForHydration();
    cy.contains('Cutoff queue for Tue 7 Apr').should('exist');
    cy.tapLink('L1', 'Agent drafting');

    // DSP-22 Planning agent drafting: advances to the plan board by itself
    cy.shouldBeOn('/plan/dsp-22-planning-agent-drafting');
    cy.contains('Planning agent is drafting').should('exist');
    cy.contains('nothing goes live from here').should('exist');
    cy.location('pathname', { timeout: 10_000 }).should('eq', '/plan/dsp-02-plan-board');

    // DSP-02 Plan board: draft v3 waits for a human
    cy.shouldBeOn('/plan/dsp-02-plan-board');
    cy.waitForHydration();
    cy.contains('waiting for your approval').should('exist');
    cy.tapLink('L3', 'Review deferrals (2)');

    // DSP-03 Deferral decision
    cy.shouldBeOn('/plan/dsp-03-deferral-decision');
    cy.waitForHydration();
    cy.contains('Defer 2 orders to Wed, keep Ja-Ela protected').should('exist');
    cy.tapLink('L4', 'Approve 2 deferrals');

    // DSP-12 Approve and go live
    cy.shouldBeOn('/plan/dsp-12-approve-and-go-live');
    cy.waitForHydration();
    cy.contains('2 deferrals approved').should('exist');
    cy.contains('The agent cannot publish on its own').should('exist');
    cy.tapLink('L5', 'Approve & go live');

    // The run continues on the loader's phone (Lodestar Dock), which the desk site announces.
    cy.shouldContinueOnPhone('Lodestar Dock', 'LD-01');
  });
});
