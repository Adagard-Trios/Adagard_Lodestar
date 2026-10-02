// Finding and activating the interactive controls of a screen (every-control.spec.ts).
//
// A control is any visible: button, a[href], [role=button|link|tab|menuitem|checkbox|switch|radio|option],
// [data-lk] (desk design links), [data-testid^="lk-"] (field design taps), input, textarea, select, summary,
// a focusable element ([tabindex] ≥ 0: react-native-web Pressables), [onclick]; on live desk screens also the
// design's button-looking elements (.d-btn, .x-link, …), so a button drawn but never wired is caught.
// Each control gets a stable id: lk:<code> | testid:<id> | <role>:<accessible name> (digits as #, so counts and
// times don't change it between loads) plus its occurrence number among controls with the same id.
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { ClickSession, Effect, Problem } from './browser';
import { EFFECT_MS, pathOf } from './browser';

export type Control = {
  id: string;
  nth: number;
  tag: string;
  type: string;
  role: string;
  name: string;
  disabled: boolean;
  inChrome: boolean;
  href: string;
};

const CONTROL_SELECTOR = [
  'button', 'a[href]', '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[role="checkbox"]', '[role="switch"]',
  '[role="radio"]', '[role="option"]', '[data-lk]', '[data-testid^="lk-"]', 'input:not([type="hidden"])', 'textarea', 'select', 'summary',
  '[tabindex]:not([tabindex="-1"])', '[onclick]',
].join(', ');
/** Desk design classes that look like buttons or links (frontend/app/styles). Live screens only. */
const LOOKS_CLICKABLE = '.d-btn, .x-link, .dx-bigbtn, .d-iconbtn, .m-iconbtn, .m-seg__i, .d-tab, .m-chip';
/** Shared desk chrome: crawled on each face's home screen only (E2E_CLICKS_FULL=1: everywhere). */
const CHROME = '.d-side, .s-top';

type ScanArgs = { root: string; selector: string; chrome: string; want: { id: string; nth: number } | null };

/** Runs in the page: lists the controls, or marks the wanted one with data-e2e-ctl. */
function scan({ root, selector, chrome, want }: ScanArgs) {
  document.querySelectorAll('[data-e2e-ctl]').forEach(e => e.removeAttribute('data-e2e-ctl'));
  const scope = document.querySelector(root) ?? document.body;
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') return false;
    const anyEl = el as Element & { checkVisibility?: (o?: object) => boolean };
    return anyEl.checkVisibility ? anyEl.checkVisibility({ visibilityProperty: true }) : true;
  };
  const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().replace(/\d/g, '#').slice(0, 60);
  const out: { id: string; nth: number; tag: string; type: string; role: string; name: string; disabled: boolean; inChrome: boolean; href: string }[] = [];
  const seen = new Map<string, number>();
  for (const el of Array.from(scope.querySelectorAll<HTMLElement>(selector))) {
    if (el.closest('[data-e2e-ignore]') || !visible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') ?? '').toLowerCase();
    if (tag === 'input' && type === 'hidden') continue;
    const implicit = tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag === 'select' ? 'combobox' : tag === 'textarea' ? 'textbox'
      : tag === 'input' ? (type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : type === 'file' ? 'file' : 'textbox') : '';
    const role = el.getAttribute('role') ?? implicit;
    const field = tag === 'input' || tag === 'textarea' || tag === 'select';
    const name = norm(el.getAttribute('aria-label') ?? (field ? el.getAttribute('placeholder') ?? el.getAttribute('name') ?? el.id : el.innerText) ?? el.getAttribute('title'));
    const lk = el.getAttribute('data-lk');
    const tid = el.getAttribute('data-testid');
    const id = lk ? `lk:${lk}` : tid ? `testid:${tid}` : `${role || tag}:${name || '(no name)'}`;
    const nth = seen.get(id) ?? 0;
    seen.set(id, nth + 1);
    const input = el as HTMLInputElement;
    const disabled = el.matches(':disabled, [aria-disabled="true"]') || (field && (input.readOnly === true));
    if (want) {
      if (want.id === id && want.nth === nth) { el.setAttribute('data-e2e-ctl', '1'); return [{ id, nth, tag, type, role, name, disabled, inChrome: false, href: '' }]; }
      continue;
    }
    out.push({ id, nth, tag, type, role, name, disabled, inChrome: chrome ? Boolean(el.closest(chrome)) : false, href: el.getAttribute('href') ?? '' });
  }
  return want ? [] : out;
}

const argsFor = (s: ClickSession, want: ScanArgs['want']): ScanArgs => ({
  root: s.screen.app === 'desk' ? '.web-screen' : 'body',
  selector: s.screen.app === 'desk' && s.screen.live ? `${CONTROL_SELECTOR}, ${LOOKS_CLICKABLE}` : CONTROL_SELECTOR,
  chrome: s.screen.app === 'desk' ? CHROME : '',
  want,
});

export const listControls = (s: ClickSession): Promise<Control[]> => s.page.evaluate(scan, argsFor(s, null));

/** Marks the control on the current page; false when it is not there (any more). */
export async function markControl(s: ClickSession, c: Pick<Control, 'id' | 'nth'>): Promise<boolean> {
  const found = await s.page.evaluate(scan, argsFor(s, { id: c.id, nth: c.nth }));
  return found.length > 0;
}

export const marked = (page: Page) => page.locator('[data-e2e-ctl="1"]').first();

/** Everything the DOM shows (markup + form values), as a short signature. */
const signature = (page: Page) => page.evaluate(() => {
  const html = document.body.innerHTML;
  let h = 0;
  for (let i = 0; i < html.length; i++) h = (h * 31 + html.charCodeAt(i)) | 0;
  const values = Array.from(document.querySelectorAll<HTMLInputElement>('input, textarea, select'))
    .map(e => (e.type === 'checkbox' || e.type === 'radio' ? String(e.checked) : e.value)).join('\u0001');
  return `${h}:${html.length}:${values}`;
}).catch(() => 'gone');

export type Outcome = {
  control: Control;
  action: string;
  effects: Effect[];
  domChanged: boolean;
  urlChanged: boolean;
  valueChanged: boolean;
  problems: Problem[];
  warnings: string[];
  error?: string;
};

const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

/**
 * Activates one control (already marked) and waits up to EFFECT_MS for something observable:
 * a navigation, a popup, a dialog, a file chooser, a download, an API call (writes are mocked), a DOM change
 * or, for form fields, the value taking. Returns what happened; the caller decides pass/fail.
 */
export async function activate(s: ClickSession, c: Control): Promise<Outcome> {
  const { page, rec } = s;
  const el = marked(page);
  const mark = rec.mark();
  const urlBefore = page.url();
  const sigBefore = await signature(page);
  const valueBefore = await el.evaluate(e => (e as HTMLInputElement).value ?? null).catch(() => null);
  let action = 'click';
  let error: string | undefined;
  try {
    if (c.tag === 'select') {
      const values = await el.evaluate(e => Array.from((e as HTMLSelectElement).options).filter(o => !o.disabled).map(o => o.value));
      const pick = values.find(v => v !== valueBefore) ?? values[0];
      action = `select "${pick}"`;
      await el.selectOption(pick, { timeout: 5_000 });
    } else if (c.tag === 'input' && c.type === 'file') {
      action = 'attach a 1×1 PNG';
      await el.setInputFiles({ name: 'e2e.png', mimeType: 'image/png', buffer: TINY_PNG }, { timeout: 5_000 });
    } else if ((c.tag === 'input' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color'].includes(c.type)) || c.tag === 'textarea') {
      const numeric = await el.evaluate(e => {
        const i = e as HTMLInputElement;
        return i.type === 'number' || /numeric|decimal/.test(i.inputMode ?? '') || /\\d|\[0-9\]/.test(i.pattern ?? '');
      });
      const text = numeric ? '7' : 'E2E check';
      action = `type "${text}"`;
      await el.fill(text, { timeout: 5_000 });
    } else {
      action = c.tag === 'input' ? `toggle ${c.type}` : 'click';
      await el.click({ timeout: 5_000 });
    }
  } catch (e) {
    error = String(e).split('\n')[0].slice(0, 300);
  }
  let domChanged = false;
  let urlChanged = false;
  let valueChanged = false;
  if (!error) {
    await expect.poll(async () => {
      urlChanged = page.url() !== urlBefore;
      if (rec.effectsSince(mark).length > 0 || urlChanged) return true;
      if (valueBefore !== null) {
        const v = await el.evaluate(e => (e as HTMLInputElement).value ?? null).catch(() => valueBefore);
        valueChanged = v !== valueBefore;
        if (valueChanged) return true;
      }
      domChanged = (await signature(page)) !== sigBefore;
      return domChanged;
    }, { timeout: EFFECT_MS, intervals: [100, 150, 250, 400] }).toBe(true).catch(() => undefined);
    // let what was started finish (API calls in flight), so its errors are attributed to this control
    await expect.poll(() => rec.inflight, { timeout: 10_000, intervals: [100, 250, 500] }).toBe(0).catch(() => undefined);
  }
  return {
    control: c, action, effects: rec.effectsSince(mark), domChanged, urlChanged, valueChanged,
    problems: rec.problemsSince(mark), warnings: rec.warningsSince(mark), error,
  };
}

export const observable = (o: Outcome) => o.effects.length > 0 || o.domChanged || o.urlChanged || o.valueChanged;

export function describe(o: Outcome): string {
  const kinds = [...new Set(o.effects.map(e => e.kind))];
  const parts = [
    ...kinds.map(k => `${k}${k === 'navigation' ? ` → ${o.effects.filter(e => e.kind === k).map(e => pathOf(e.detail)).at(-1)}` : k === 'write' ? `: ${o.effects.filter(e => e.kind === 'write').map(e => e.detail).join(', ')}` : ''}`),
    ...(o.domChanged ? ['DOM changed'] : []),
    ...(o.valueChanged ? ['value took'] : []),
  ];
  return parts.join(' · ') || 'nothing happened';
}
