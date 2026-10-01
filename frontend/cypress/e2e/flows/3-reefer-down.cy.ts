/// <reference types="cypress" />
// Demo flow 3 · Reefer down, desk part.
// 3:45 AM: VEH006's reefer reads 9 °C at Bay P5. The planning agent drafts a re-plan; the dispatcher approves
// and sends it (the loader sees it on Lodestar Dock) or edits manually on the plan board.
//   DSP-B1 -> (Lodestar Dock) | DSP-02

describe('Flow 3 · Reefer down (desk part)', () => {
  beforeEach(() => {
    cy.openScreen('/plan/dsp-b1-re-plan-diff');
    cy.contains('Re-plan for VEH006').should('exist');
    cy.contains('reefer 9 °C').should('exist');
    cy.contains('6 of 6 orders served').should('exist');
  });

  it('approve & send hands the re-plan to the loader', () => {
    cy.tapLink('L32', 'Approve & send');
    cy.shouldContinueOnPhone('Lodestar Dock', 'LD-14');
  });

  it('edit manually opens the plan board', () => {
    cy.tapLink('L50', 'Edit manually');
    cy.shouldBeOn('/plan/dsp-02-plan-board');
  });
});
