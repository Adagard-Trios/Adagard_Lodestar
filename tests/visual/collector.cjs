'use strict';
// Shared by tools/qa/design-baselines.mjs (design frames) and tests/e2e/specs/visual/design-conformance.spec.ts
// (live screens). `collect` runs inside the page (page.evaluate), so it must stay self-contained.
//
// Key elements, chosen the same way on both sides:
//   text     every element with its own (direct) text, boxed by the text itself (a Range over its text nodes),
//            so a <button>Submit</button> and a react-native-web <div>Submit</div> inside a Pressable compare equal
//   control  button / a[href] / input / select / textarea / [role=button|link|tab|checkbox|radio|switch|textbox|…],
//            boxed by the element, labelled by aria-label / placeholder / visible text
// Matching key: `${kind}|${rendered text}#${occurrence}` (text-transform applied, whitespace collapsed,
// occurrence = index among equal keys in document order).
// Dynamic entries (text with a digit, a weekday or a month name: times, dates, ids, counts) are never matched;
// their boxes are masked in the screenshot diff instead.

/**
 * @param {{ mode: 'design', frameName: string } | { mode: 'live', rootSelector: string | null }} opts
 */
function collect(opts) {
  const DYN = /\d|\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day|sday|nesday|rsday|urday)?\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?:uary|ruary|ch|il|e|y|ust|ember|ober)?\b/;
  const CONTROL_ROLES = new Set(['button', 'link', 'tab', 'checkbox', 'radio', 'switch', 'textbox', 'combobox', 'menuitem', 'option', 'searchbox', 'slider']);
  const CHROME = '.statusbar, .browserbar, .homebar';
  const norm = s => (s || '').replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
  const transform = (s, tt) => tt === 'uppercase' ? s.toUpperCase() : tt === 'lowercase' ? s.toLowerCase()
    : tt === 'capitalize' ? s.replace(/\b\p{L}/gu, c => c.toUpperCase()) : s;
  const r1 = v => Math.round(v * 10) / 10;

  let root;
  let area; // screen area in viewport coordinates
  const chrome = [];
  if (opts.mode === 'design') {
    root = [...document.querySelectorAll('.frame[data-name]')].find(f => f.getAttribute('data-name') === opts.frameName);
    if (!root) throw new Error('frame not found: ' + opts.frameName);
    const r = root.getBoundingClientRect();
    let top = r.top + root.clientTop;
    let bottom = top + root.clientHeight;
    const left = r.left + root.clientLeft;
    const width = root.clientWidth;
    // Device chrome drawn by the design (phone status bar / home indicator, desktop browser bar) is not part of
    // the app: the live apps run full-window under the real OS / browser chrome.
    for (const c of root.querySelectorAll(CHROME)) {
      const cr = c.getBoundingClientRect();
      if (cr.height === 0) continue;
      if (Math.abs(cr.top - top) < 2 && !c.matches('.homebar')) { top = cr.bottom; chrome.push(c); }
      else if (c.matches('.homebar') && Math.abs(cr.bottom - bottom) < 2) { bottom = cr.top; chrome.push(c); }
    }
    area = { x: left, y: top, w: width, h: bottom - top };
  } else {
    root = opts.rootSelector ? document.querySelector(opts.rootSelector) : document.body;
    if (!root) throw new Error('live root not found: ' + opts.rootSelector);
    if (opts.rootSelector) {
      const r = root.getBoundingClientRect();
      area = { x: r.left + root.clientLeft, y: r.top + root.clientTop, w: root.clientWidth, h: root.clientHeight };
    } else {
      area = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
    }
  }

  const inChrome = el => chrome.some(c => c.contains(el));
  const visible = el => (typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    : getComputedStyle(el).visibility !== 'hidden');
  const rel = b => ({ x: r1(b.left - area.x), y: r1(b.top - area.y), w: r1(b.width), h: r1(b.height) });
  const intersects = b => b.right > area.x && b.left < area.x + area.w && b.bottom > area.y && b.top < area.y + area.h && b.width > 0 && b.height > 0;
  const style = cs => ({
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    borderRadius: cs.borderRadius,
    padding: cs.padding,
    margin: cs.margin,
    gap: cs.gap,
  });

  const out = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('svg') || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue;
    if (chrome.length && inChrome(el)) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';

    // text
    const nodes = [...el.childNodes].filter(n => n.nodeType === 3 && norm(n.textContent));
    if (nodes.length) {
      const text = transform(norm(nodes.map(n => n.textContent).join(' ')), cs.textTransform);
      let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
      for (const n of nodes) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) {
          if (q.width === 0 && q.height === 0) continue;
          L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom);
        }
      }
      if (L < R && T < B) {
        const b = { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T };
        if (opts.mode === 'live' || intersects(b)) {
          out.push({ kind: 'text', text: text.slice(0, 120), tag, role, dynamic: DYN.test(text), box: rel(b), style: style(cs) });
        }
      }
    }

    // control
    const isControl = (tag === 'button' || (tag === 'a' && el.hasAttribute('href')) || tag === 'select' || tag === 'textarea'
      || (tag === 'input' && el.type !== 'hidden') || CONTROL_ROLES.has(role));
    if (isControl) {
      const label = norm(el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.innerText || el.getAttribute('title') || '');
      if (label) {
        const b = el.getBoundingClientRect();
        if (opts.mode === 'live' || intersects(b)) {
          out.push({ kind: 'control', text: label.slice(0, 120), tag, role, dynamic: DYN.test(label), box: rel(b), style: style(cs) });
        }
      }
    }
  }
  const seen = new Map();
  for (const e of out) {
    const k = e.kind + '|' + e.text;
    const n = seen.get(k) || 0;
    seen.set(k, n + 1);
    e.key = k + '#' + n;
  }
  return { area: { x: r1(area.x), y: r1(area.y), w: Math.round(area.w), h: Math.round(area.h) }, elements: out };
}

/** Same typeface and effective weight, whatever the platform calls them ("Inter_700Bold" on react-native-web). */
function typeface(fontFamily, fontWeight) {
  const first = String(fontFamily || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
  const m = first.match(/^([A-Za-z]+?)_(\d{3})/);
  const compact = (m ? m[1] : first).replace(/\s+/g, '').toLowerCase();
  const names = { inter: 'Inter', jetbrainsmono: 'JetBrains Mono', plusjakartasans: 'Plus Jakarta Sans', notosanssinhala: 'Noto Sans Sinhala', notosanstamil: 'Noto Sans Tamil' };
  return { family: names[compact] || first, weight: m ? m[2] : String(fontWeight) };
}

/** The values compared exactly (token-driven), per kind of key element. */
function tokenStyle(kind, s) {
  if (kind === 'text') {
    const t = typeface(s.fontFamily, s.fontWeight);
    return { color: s.color, fontFamily: t.family, fontWeight: t.weight, fontSize: s.fontSize };
  }
  return { backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, padding: s.padding, gap: s.gap };
}

module.exports = { collect, typeface, tokenStyle };
