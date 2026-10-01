/// <reference types="cypress" />
// Visits every desktop screen and clicks every wired element (data-lk), checking where it lands:
// the destination path for desk screens, or the "Continues in … on the phone" notice for phone-only screens.
// The link table is built in cypress/plugins/screens.ts from tools/screengen/out/screens.json when present,
// else from the `nav` table in each generated frontend/app/<face>/<screen>/page.tsx.
//
// Narrow a run:  CYPRESS_SCREENS=dsp-0,adm-07 npm run cy:run -- --spec cypress/e2e/clickthrough.cy.ts
import type { ScreenManifest, ScreenLink } from '../support/types';

const manifest = Cypress.expose('screens') as ScreenManifest;
const only = String(Cypress.expose('only') ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const screens = manifest.screens.filter(s => only.length === 0 || only.some(o => s.key.startsWith(o) || s.path.includes(o)));

const describeLink = (l: ScreenLink) =>
  `${l.code}${l.label ? ` "${l.label}"` : ''} (${l.kind}) -> ${l.to ?? `Continues in ${l.app}: ${l.screen ?? ''}`}`;

describe(`Design click-through · ${manifest.source}`, () => {
  it('found the generated desk screens', () => {
    cy.wrap(screens.length, { log: false }).should('be.greaterThan', 0);
    cy.task('log', `${screens.length} screens, ${screens.reduce((n, s) => n + s.links.length, 0)} links`);
  });

  for (const s of screens) {
    // Auto-advancing screens (agent drafting, sync queue) would leave before we click: freeze their timers.
    const freezeTimers = Boolean(s.auto);

    describe(`${s.id} ${s.path}`, () => {
      it('renders and every wired element is on the page', () => {
        cy.openScreen(s.path, { freezeTimers });
        cy.title().should('not.be.empty');
        for (const l of s.links) cy.get(`.web-screen [data-lk="${l.code}"]`).should('exist');
      });

      for (const l of s.links) {
        it(describeLink(l), () => {
          cy.openScreen(s.path, { freezeTimers });
          cy.tapLink(l.code);
          if (l.to) cy.shouldBeOn(l.to);
          else cy.shouldContinueOnPhone(l.app, l.screen);
        });
      }

      if (s.auto) {
        const auto = s.auto;
        it(`auto-advances after 1.5 s -> ${auto.to ?? `Continues in ${auto.app}`}`, () => {
          cy.openScreen(s.path, { freezeTimers: true });
          cy.tick(1400);
          cy.location('pathname').should('eq', s.path);
          cy.tick(200);
          if (auto.to) cy.shouldBeOn(auto.to);
          else cy.shouldContinueOnPhone(auto.app, auto.screen);
        });
      }
    });
  }
});
