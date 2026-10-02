// Every screen, every control (@stack): a crawler. One test per screen (desk and field, live and static), one step
// per interactive control (lib/clicks/crawl.ts says what counts as one). Each control is activated in a fresh page
// state (the screen reloaded) as the screen's persona, and something observable must follow within
// E2E_CLICKS_EFFECT_MS (4 s): a navigation, a popup, a dialog, a file chooser, a download, an API call, a DOM change,
// or, for a form field, the value taking. Fails on:
//   dead control        nothing observable happened (unless clicks/inert-allowlist.json `inert` lists it, with a reason)
//   not activatable     the click/fill could not be performed (covered by something, detached, …)
//   errors              an uncaught page error, a console error, or an unexpected 4xx/5xx response
// Not destructive: writes to the API are answered with a mock (and count as the effect), Keycloak logout/revoke are
// mocked, dialogs are dismissed, so it can run again and again on the demo data (lib/clicks/browser.ts).
// Errors that follow a mocked write are reported as notes (the mock is not the backend's real answer).
// Disabled controls are listed, not clicked. Identical repeats (list rows with the same id) are clicked
// E2E_CLICKS_PER_ID times (2); shared desk chrome (sidebar, store top bar) only on each face's home screen
// (E2E_CLICKS_FULL=1 clicks everything everywhere).
//
//   npx playwright test --project=clicks specs/clicks/every-control.spec.ts
//   E2E_CLICKS_ONLY="ld-0[1-4]" npx playwright test --project=clicks specs/clicks/every-control.spec.ts
import { exemption, loadAllowlist } from '../../lib/clicks/allowlist';
import { FACE_HOME, load, openSession, pathOf, type ClickSession } from '../../lib/clicks/browser';
import { activate, describe as describeOutcome, listControls, markControl, observable, type Control, type Outcome } from '../../lib/clicks/crawl';
import { MANIFEST, annotateScreen, screenTags, screenTitle, selectedScreens } from '../../lib/clicks/screens';
import { expect, requireStack, test } from '../../lib/fixtures';

const allow = loadAllowlist();
const screens = selectedScreens();
const PER_ID = Number(process.env.E2E_CLICKS_PER_ID ?? 2);
const MAX = Number(process.env.E2E_CLICKS_MAX ?? 200);
const FULL = /^(1|true|yes)$/i.test(process.env.E2E_CLICKS_FULL ?? '');

const label = (c: Control) => `${c.id}${c.nth ? ` (#${c.nth + 1})` : ''}${c.name && !c.id.endsWith(c.name) ? ` "${c.name}"` : ''}`;

test('allowlist: judge-walkthrough screens have no exemptions', () => {
  const walk = MANIFEST.screens.filter(s => s.walkthrough).map(s => s.key);
  const glob = (k: string) => new RegExp(`^${k.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  const offending = [...Object.keys(allow.inert), ...Object.keys(allow.links)].filter(k => {
    const screenPart = k.split('#')[0];
    return walk.some(w => glob(screenPart).test(w));
  });
  expect(offending, 'clicks/inert-allowlist.json must not exempt anything on the README judge-walkthrough screens').toEqual([]);
});

test.describe('Every screen · every control', { tag: '@stack' }, () => {
  requireStack();

  for (const screen of screens) {
    test(screenTitle(screen, 'every control'), { tag: screenTags(screen) }, async ({ browser }, info) => {
      test.setTimeout(120_000);
      annotateScreen(info, screen);
      const s: ClickSession = await openSession(browser, screen, allow);
      const outcomes: Outcome[] = [];
      try {
        // the screen itself opens without errors
        const before = s.rec.mark();
        await load(s);
        const landed = pathOf(s.page.url());
        if (landed !== pathOf(screen.path)) info.annotations.push({ type: 'redirected', description: `${screen.path} opened as ${landed}` });
        expect.soft(s.rec.problemsSince(before).map(p => p.text), `${screen.id}: errors while opening ${screen.path}`).toEqual([]);

        const all = await listControls(s);
        const chromeSkipped = all.filter(c => c.inChrome && !FULL && !FACE_HOME.has(screen.key));
        const repeats = all.filter(c => c.nth >= PER_ID);
        let controls = all.filter(c => !chromeSkipped.includes(c) && !repeats.includes(c));
        if (controls.length > MAX) {
          info.annotations.push({ type: 'capped', description: `${controls.length} controls; the first ${MAX} were activated (E2E_CLICKS_MAX)` });
          controls = controls.slice(0, MAX);
        }
        info.annotations.push({
          type: 'controls',
          description: `${all.length} found · ${controls.length} activated · ${chromeSkipped.length} shared chrome (crawled on the face home) · ${repeats.length} identical repeats skipped`,
        });
        test.setTimeout(120_000 + controls.length * 25_000);

        let fresh = true;
        for (const c of controls) {
          await test.step(label(c), async () => {
            if (c.disabled) {
              info.annotations.push({ type: 'disabled', description: `${screen.id} ${label(c)}: disabled in this state, not clicked` });
              return;
            }
            if (!fresh) await load(s);
            fresh = false;
            if (!(await markControl(s, c))) {
              info.annotations.push({ type: 'not found after reload', description: `${screen.id} ${label(c)}: gone after reloading (state-dependent)` });
              return;
            }
            const o = await activate(s, c);
            outcomes.push(o);
            const exempt = exemption(allow.inert, screen.key, c.id);
            if (o.error) {
              expect.soft(o.error, `${screen.id} ${label(c)}: could not ${o.action}`).toBeUndefined();
            } else if (!observable(o)) {
              if (exempt) info.annotations.push({ type: 'inert (allowlisted)', description: `${screen.id} ${label(c)}: ${exempt}` });
              else expect.soft(false, `${screen.id} ${label(c)}: dead control — nothing observable after ${o.action} (no navigation, request, dialog or DOM change)`).toBe(true);
            }
            for (const p of o.problems.filter(p => p.afterMockedWrite)) info.annotations.push({ type: 'after mocked write', description: `${screen.id} ${label(c)}: ${p.text}` });
            expect.soft(o.problems.filter(p => !p.afterMockedWrite).map(p => p.text), `${screen.id} ${label(c)}: errors after ${o.action}`).toEqual([]);
            for (const w of o.warnings) info.annotations.push({ type: 'warning', description: `${screen.id} ${label(c)}: ${w}` });
          });
        }
      } finally {
        const rows = outcomes.map(o => ({
          control: label(o.control), action: o.action, result: o.error ? `error: ${o.error}` : describeOutcome(o),
          problems: o.problems.map(p => `${p.afterMockedWrite ? '(after mocked write) ' : ''}${p.text}`),
        }));
        await info.attach('controls.json', { body: JSON.stringify(rows, null, 1), contentType: 'application/json' });
        await info.attach('controls.txt', {
          body: rows.map(r => `${r.result === 'nothing happened' ? 'DEAD ' : r.result.startsWith('error') ? 'ERR  ' : 'ok   '}${r.control} · ${r.action} → ${r.result}${r.problems.length ? `\n       ${r.problems.join('\n       ')}` : ''}`).join('\n') || '(no controls activated)',
          contentType: 'text/plain',
        });
        await s.context.close();
      }
    });
  }
});
