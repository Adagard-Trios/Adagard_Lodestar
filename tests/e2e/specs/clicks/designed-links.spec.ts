// Every screen, every designed link (@stack). One test per screen of the desk website and the field app, one step
// per designed link (lib/clicks/manifest.ts reads them from the repo's generated nav tables):
//   open the screen fresh, as the persona whose face it is (desk 1440×900; field phone 390×844, tablet 1194×834),
//   find the link (desk [data-lk="CODE"], field [data-testid="lk-CODE"]), click it, and check the app reaches the
//   designed destination path, or shows the "Continues in …" notice for a cross-device target. Screen-level targets:
//   `auto` (the static screen advances by itself) and `whole` (tap anywhere).
// A link that is not on the screen fails, except on a live screen whose source names the code (it is shown only in
// some states, with data, or followed in code after an action: reported as a note), or when clicks/inert-allowlist.json
// `links` lists it with a reason. Static mocks (no live screen yet) are clicked too and tagged @static.
// Writes are mocked and the clock is frozen (lib/clicks/browser.ts). Any page error, console error or unexpected
// 4xx/5xx while opening the screen or following a link fails the step.
//
//   npx playwright test --project=clicks specs/clicks/designed-links.spec.ts
//   E2E_CLICKS_ONLY="^dsp-" npx playwright test --project=clicks --grep @walkthrough
import type { TestInfo } from '@playwright/test';
import { exemption, loadAllowlist } from '../../lib/clicks/allowlist';
import { load, openSession, pathOf, type ClickSession } from '../../lib/clicks/browser';
import type { DesignedLink, ScreenEntry } from '../../lib/clicks/manifest';
import { annotateScreen, screenTags, screenTitle, selectedScreens } from '../../lib/clicks/screens';
import { expect, requireStack, test } from '../../lib/fixtures';

const allow = loadAllowlist();
const screens = selectedScreens();

const dest = (l: DesignedLink) => (l.app ? `notice "Continues in ${l.app}" (${l.screen})` : l.to!);
const linkTitle = (l: DesignedLink) => `${l.via === 'link' ? l.code : `[${l.via}]`} (${l.kind}) → ${dest(l)}`;
const note = (info: TestInfo, type: string, description: string) => info.annotations.push({ type, description });

function linkLocator(s: ClickSession, code: string) {
  return s.screen.app === 'desk' ? s.page.locator(`.web-screen [data-lk="${code}"]`) : s.page.getByTestId(`lk-${code}`);
}

async function checkLink(s: ClickSession, link: DesignedLink, info: TestInfo) {
  const { page, rec, screen } = s;
  const where = `${screen.id} ${link.code}`;
  const exempt = exemption(allow.links, screen.key, link.code);
  const before = rec.mark();
  await load(s);
  const loadProblems = rec.problemsSince(before).filter(p => !p.afterMockedWrite).map(p => p.text);
  expect.soft(loadProblems, `${screen.id}: errors while opening ${screen.path}`).toEqual([]);
  const after = rec.mark();

  if (link.via === 'auto') {
    if (screen.live && screen.app === 'desk') {
      note(info, 'note', `${where}: live desk screens advance on real events, not on the design's timer (ScreenShell).`);
      return;
    }
  } else if (link.via === 'whole') {
    await page.locator(screen.app === 'desk' ? '.web-screen' : 'body').first().click({ position: { x: 6, y: 6 } });
  } else {
    const loc = linkLocator(s, link.code).locator('visible=true').first();
    const shown = await loc.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false);
    if (!shown) {
      const inDom = (await linkLocator(s, link.code).count()) > 0;
      const state = inDom ? 'in the page but hidden' : 'not on the screen';
      if (exempt) { note(info, 'allowlisted', `${where}: ${state} — ${exempt}`); return; }
      if (screen.live && screen.liveCodes.includes(link.code)) {
        note(info, 'not shown', `${where} → ${dest(link)}: ${state} in this state; the live screen shows it only with data or follows it after an action (covered by every-control.spec.ts).`);
        return;
      }
      expect.soft(false, `${where}: designed link → ${dest(link)} is ${state}${screen.live ? ' (the live screen does not render it)' : ''}`).toBe(true);
      return;
    }
    const clicked = await loc.click({ timeout: 10_000 }).then(() => true, e => { expect.soft(false, `${where}: could not click: ${String(e).split('\n')[0]}`).toBe(true); return false; });
    if (!clicked) return;
  }

  if (link.app) {
    const toast = screen.app === 'desk' ? page.locator('.web-toast') : page.getByTestId('toast').locator('visible=true').last();
    const ok = await expect(toast).toContainText(/Continues in/, { timeout: 10_000 }).then(() => true, () => false);
    if (!ok && exempt) note(info, 'allowlisted', `${where}: ${exempt}`);
    else expect.soft(ok, `${where}: no "Continues in ${link.app}" notice after the click`).toBe(true);
  } else {
    const target = pathOf(link.to!);
    const reached = () => pathOf(page.url()) === target || rec.effectsSince(after).some(e => e.kind === 'navigation' && pathOf(e.detail) === target);
    const ok = await expect.poll(reached, { timeout: link.via === 'auto' ? 15_000 : 10_000, intervals: [100, 250, 500] }).toBe(true).then(() => true, () => false);
    const landed = pathOf(page.url());
    if (ok) {
      if (landed !== target) note(info, 'redirected', `${where}: reached ${target}, then the app moved on to ${landed} (e.g. a route guard for another role's face).`);
    } else if (link.kind === 'back' && landed !== pathOf(screen.path)) {
      note(info, 'back', `${where}: "back" returned to ${landed} instead of the design's ${target} (history back).`);
    } else if (exempt) {
      note(info, 'allowlisted', `${where}: ${exempt}`);
    } else if (screen.entry && landed !== pathOf(screen.path)) {
      note(info, 'entry screen', `${where}: the persona is signed in already, so the app skipped the entry flow and went to ${landed}.`);
    } else if (link.via === 'auto' && screen.live) {
      note(info, 'note', `${where}: the live screen advances on real events, not on the design's timer.`);
    } else {
      const happened = rec.effectsSince(after).map(e => `${e.kind} ${e.kind === 'navigation' ? pathOf(e.detail) : e.detail}`).join('; ') || 'nothing';
      expect.soft(ok, `${where}: expected to reach ${target}; stayed on/went to ${landed} (${happened})`).toBe(true);
    }
  }
  // errors caused by the click (after a mocked write they are notes: the mock is not the real answer)
  const caused = rec.problemsSince(after);
  for (const p of caused.filter(p => p.afterMockedWrite)) note(info, 'after mocked write', `${where}: ${p.text}`);
  expect.soft(caused.filter(p => !p.afterMockedWrite).map(p => p.text), `${where}: errors after the click`).toEqual([]);
  for (const w of rec.warningsSince(before)) note(info, 'warning', `${where}: ${w}`);
}

test.describe('Every screen · every designed link', { tag: '@stack' }, () => {
  requireStack();

  for (const screen of screens) {
    const n = screen.links.length;
    test(screenTitle(screen, `${n} designed link${n === 1 ? '' : 's'}`), { tag: screenTags(screen) }, async ({ browser }, info) => {
      test.setTimeout(90_000 + n * 30_000);
      annotateScreen(info, screen as ScreenEntry);
      const s = await openSession(browser, screen, allow);
      try {
        if (!n) {
          await load(s);
          note(info, 'note', 'No designed links on this screen (opened and checked for errors only).');
          expect.soft(s.rec.problems.map(p => p.text), `${screen.id}: errors while opening ${screen.path}`).toEqual([]);
          return;
        }
        for (const link of screen.links) {
          await test.step(linkTitle(link), () => checkLink(s, link, info));
        }
      } finally {
        await s.context.close();
      }
    });
  }
});
