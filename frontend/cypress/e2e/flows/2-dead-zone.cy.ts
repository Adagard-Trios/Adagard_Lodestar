/// <reference types="cypress" />
// Demo flow 2 · Dead zone, desk part.
// 5:50 AM: VEH057 (reefer van, Ruwan) has been silent since 4:38 above Ramboda. Live ops shows a predicted
// position instead of pretending, and at 6:10 Nilanthi makes a provisional deferral for OUT108.
//   DSP-A1 -> DSP-A1b

describe('Flow 2 · Dead zone (desk part)', () => {
  it('blackout view to provisional deferral', () => {
    // DSP-A1 Blackout view
    cy.openScreen('/plan/dsp-a1-blackout-view');
    cy.contains('Predicted, not live').should('exist');
    cy.contains('Unknown since 4:38').should('exist');
    cy.contains('61%').should('exist');
    cy.tapLink('L25', 'VEH057');

    // DSP-A1b Provisional deferral
    cy.shouldBeOn('/plan/dsp-a1b-provisional-deferral');
    cy.waitForHydration();
    cy.contains('Defer ORD0104209 to Wed 8 Apr?').should('exist');
    cy.contains('Make provisional deferral').should('exist');
  });

  it('the route row opens the same decision', () => {
    cy.openScreen('/plan/dsp-a1-blackout-view');
    cy.tapLink('L46', 'Nuwara Eliya');
    cy.shouldBeOn('/plan/dsp-a1b-provisional-deferral');
  });
});
