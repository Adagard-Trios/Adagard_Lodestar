// Reads every screen frame in Designing/pages/P*.html exactly as Chrome lays it out and
// writes tools/screengen/out/screens.json:
//   desktop frames  -> JSX markup (rendered by the Next.js app with the design's own CSS)
//   phone / tablet  -> a React Native view tree built from computed styles (flexbox maps 1:1)
// Links come from Designing/figma-plugin/data/links.json, the same data that wires the Figma prototype.
// Usage: node extract.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('./puppeteer');

const REPO = path.resolve(__dirname, '..', '..');
const PAGES = path.join(REPO, 'Designing', 'pages');
const LINKS = JSON.parse(fs.readFileSync(path.join(REPO, 'Designing', 'figma-plugin', 'data', 'links.json'), 'utf8'));
const OUT = path.join(__dirname, 'out');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOARDS = ['P1-screens-store', 'P2-screens-dispatcher', 'P3-screens-loader', 'P4-screens-driver', 'P5-screens-degradation', 'P6-screens-admin'];
const ID = /^(SM|DSP|LD|DR|ADM)-([AB]\d+b?|\d+)/;

const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const platOf = w => (w < 600 ? 'phone' : w < 1200 ? 'tablet' : 'desktop');
const APP = { SM: 'store', DSP: 'plan', LD: 'dock', DR: 'run', ADM: 'admin' };

// ---------------------------------------------------------------- in-page code
function pageCode() {
  const IDRE = /^(SM|DSP|LD|DR|ADM)-([AB]\d+b?|\d+)/;
  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const canvas = document.createElement('canvas').getContext('2d');
  const col = c => { if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return null; canvas.fillStyle = '#000'; canvas.fillStyle = c; return canvas.fillStyle; };
  const px = v => parseFloat(v) || 0;
  const r1 = v => Math.round(v * 10) / 10;

  // ---------- link hotspots (hotspots.js, injected before this code)
  const H = window.installHotspots(col, px);
  const { climb, visibleAt, nrm, cls, GENERIC } = H;
  const AUTO = /^(auto|after delay|signal returns|when saved|when done|when sent|auto-advance|after \d)/;
  function hotspot(frame, label) {
    const el = H.findHotspot(frame, label);
    if (!el || el.hasAttribute('data-lk') || el.closest('[data-lk]')) return null;
    return el;
  }

  // ---------- frame tree for React Native
  const SI = /[\u0D80-\u0DFF]/, TA = /[\u0B80-\u0BFF]/;
  function family(cs, text) {
    const fams = cs.fontFamily.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    let fam = fams.find(f => ['Inter', 'Plus Jakarta Sans', 'JetBrains Mono', 'Noto Sans Sinhala', 'Noto Sans Tamil'].includes(f)) || 'Inter';
    if (text && SI.test(text)) fam = 'Noto Sans Sinhala';
    else if (text && TA.test(text)) fam = 'Noto Sans Tamil';
    return fam;
  }

  function textStyle(cs, text) {
    const s = {};
    s.color = col(cs.color) || '#000';
    s.fontSize = r1(px(cs.fontSize));
    s.ff = family(cs, text);
    s.fw = parseInt(cs.fontWeight, 10) || 400;
    if (cs.lineHeight !== 'normal') s.lineHeight = r1(px(cs.lineHeight));
    if (cs.letterSpacing !== 'normal' && px(cs.letterSpacing)) s.letterSpacing = r1(px(cs.letterSpacing));
    const ta = cs.textAlign; if (ta === 'center' || ta === 'right' || ta === 'justify') s.textAlign = ta; else if (ta === 'end') s.textAlign = 'right';
    if (cs.textTransform !== 'none') s.textTransform = cs.textTransform;
    const dl = cs.textDecorationLine || ''; if (dl.includes('underline')) s.textDecorationLine = 'underline'; else if (dl.includes('line-through')) s.textDecorationLine = 'line-through';
    if (cs.fontStyle === 'italic') s.fontStyle = 'italic';
    if (/tnum/.test(cs.fontFeatureSettings) || /tabular/.test(cs.fontVariantNumeric)) s.fontVariant = ['tabular-nums'];
    return s;
  }
  function diffText(a, b) { const d = {}; for (const k in a) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) d[k] = a[k]; return d; }

  function explicitSize(el, prop) {
    const before = el.getBoundingClientRect()[prop];
    const old = el.style.getPropertyValue(prop), pri = el.style.getPropertyPriority(prop);
    el.style.setProperty(prop, 'auto', 'important');
    const after = el.getBoundingClientRect()[prop];
    if (old) el.style.setProperty(prop, old, pri); else el.style.removeProperty(prop);
    return Math.abs(before - after) > 0.6;
  }

  function boxStyle(el, cs, parentCs, rect, parentRect) {
    const s = {};
    const pflex = parentCs && /flex/.test(parentCs.display);
    const disp = cs.display;
    if (/flex/.test(disp)) {
      s.flexDirection = cs.flexDirection;
      if (cs.flexWrap !== 'nowrap') s.flexWrap = cs.flexWrap;
      const jc = cs.justifyContent; if (jc !== 'normal' && jc !== 'flex-start' && jc !== 'start') s.justifyContent = jc.replace(/^(start|left)$/, 'flex-start').replace(/^(end|right)$/, 'flex-end');
      const ai = cs.alignItems; s.alignItems = (ai === 'normal' || ai === 'stretch') ? 'stretch' : ai.replace(/^(start|self-start)$/, 'flex-start').replace(/^(end|self-end)$/, 'flex-end').replace('baseline', 'baseline');
      if (cs.rowGap !== 'normal' && px(cs.rowGap)) s.rowGap = r1(px(cs.rowGap));
      if (cs.columnGap !== 'normal' && px(cs.columnGap)) s.columnGap = r1(px(cs.columnGap));
    }
    if (pflex) {
      const g = parseFloat(cs.flexGrow); if (g) s.flexGrow = g;
      // CSS never squeezes a column item below its content (min-height: auto); Yoga would, so only
      // allow shrinking where CSS does: rows (text wraps), or items with min-height 0 / clipped overflow.
      const sh = parseFloat(cs.flexShrink);
      const col = /column/.test(parentCs.flexDirection);
      const canShrink = !col || (cs.minHeight !== 'auto' && px(cs.minHeight) === 0) || cs.overflow !== 'visible';
      if (sh === 0) s.flexShrink = 0; else if (canShrink) s.flexShrink = sh;
      if (cs.flexBasis !== 'auto' && cs.flexBasis !== 'content') { const b = cs.flexBasis.endsWith('%') ? cs.flexBasis : px(cs.flexBasis); s.flexBasis = b; }
      const as = cs.alignSelf; if (as !== 'auto' && as !== 'normal') s.alignSelf = as.replace(/^(start|self-start)$/, 'flex-start').replace(/^(end|self-end)$/, 'flex-end');
    }
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const p = px(cs['padding' + side]); if (p) s['padding' + side] = r1(p);
      const m = cs['margin' + side]; if (m === 'auto') s['margin' + side] = 'auto'; else if (px(m)) s['margin' + side] = r1(px(m));
    }
    // sizes: only those the CSS actually fixes
    const pos = cs.position;
    if (!pflex && parentCs && /^inline-/.test(disp) && pos !== 'absolute' && pos !== 'fixed') {
      // inline-block / inline-flex boxes size to their content and follow the parent's text-align
      const ta = parentCs.textAlign;
      s.alignSelf = ta === 'center' ? 'center' : (ta === 'right' || ta === 'end') ? 'flex-end' : 'flex-start';
    }
    if (pos === 'absolute' || pos === 'fixed') {
      s.position = 'absolute';
      if (el.offsetParent === el.parentElement && pos === 'absolute') {
        for (const k of ['top', 'right', 'bottom', 'left']) if (cs[k] !== 'auto') s[k] = r1(px(cs[k]));
      } else if (parentRect) {
        // React Native positions against the parent, CSS against the nearest positioned ancestor:
        // measure against the parent, keeping the edges the CSS anchors to (bottom sheets stay at the bottom)
        const t = r1(rect.top - parentRect.top - px(parentCs.borderTopWidth)), l = r1(rect.left - parentRect.left - px(parentCs.borderLeftWidth));
        const b = r1(parentRect.bottom - px(parentCs.borderBottomWidth) - rect.bottom), rr = r1(parentRect.right - px(parentCs.borderRightWidth) - rect.right);
        if (cs.top !== 'auto' || cs.bottom === 'auto') s.top = t;
        if (cs.bottom !== 'auto') s.bottom = b;
        if (cs.left !== 'auto' || cs.right === 'auto') s.left = l;
        if (cs.right !== 'auto') s.right = rr;
      }
      if (!('top' in s) && !('bottom' in s) && parentRect) s.top = r1(rect.top - parentRect.top - px(parentCs.borderTopWidth));
      if (!('left' in s) && !('right' in s) && parentRect) s.left = r1(rect.left - parentRect.left - px(parentCs.borderLeftWidth));
    } else if (pos === 'relative') {
      for (const k of ['top', 'left']) if (cs[k] !== 'auto' && px(cs[k])) s[k] = r1(px(cs[k]));
    }
    const abs = s.position === 'absolute';
    // CSS Typed OM gives the declared size ('auto', 56px, 50%), not the laid-out one
    const declared = prop => {
      let v; try { v = el.computedStyleMap().get(prop); } catch (e) { return undefined; }
      if (!v || (typeof CSSKeywordValue !== 'undefined' && v instanceof CSSKeywordValue)) return undefined;
      if (v.unit === 'px') return r1(v.value);
      if (v.unit === 'percent') return r1(v.value) + '%';
      return 'calc';
    };
    const w = declared('width'), h = declared('height');
    if (abs && !('left' in s && 'right' in s)) s.width = r1(rect.width);
    else if (w !== undefined) s.width = w === 'calc' ? r1(rect.width) : w;
    if (abs && !('top' in s && 'bottom' in s)) s.height = r1(rect.height);
    else if (h !== undefined) s.height = h === 'calc' || (typeof h === 'string' && !pflex && parentCs && parentCs.height === 'auto') ? r1(rect.height) : h;
    for (const [k, prop] of [['minHeight', 'min-height'], ['minWidth', 'min-width'], ['maxWidth', 'max-width'], ['maxHeight', 'max-height']]) {
      const v = declared(prop);
      if (v !== undefined && v !== 0 && v !== 'calc') s[k] = v;
    }
    const bg = col(cs.backgroundColor); if (bg) s.backgroundColor = bg;
    if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) s.grad = gradients(cs.backgroundImage);
    // borders
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map(k => (cs['border' + k + 'Style'] === 'none' ? 0 : px(cs['border' + k + 'Width'])));
    const bc = ['Top', 'Right', 'Bottom', 'Left'].map(k => col(cs['border' + k + 'Color']));
    if (bw.some(Boolean)) {
      if (bw.every(v => v === bw[0]) && bc.every(v => v === bc[0])) { s.borderWidth = bw[0]; if (bc[0]) s.borderColor = bc[0]; }
      else ['Top', 'Right', 'Bottom', 'Left'].forEach((k, i) => { if (bw[i]) { s['border' + k + 'Width'] = bw[i]; if (bc[i]) s['border' + k + 'Color'] = bc[i]; } });
      const st = ['Top', 'Right', 'Bottom', 'Left'].map(k => cs['border' + k + 'Style']).find(v => v === 'dashed' || v === 'dotted');
      if (st) s.borderStyle = st;
    }
    const rad = k => { const v = cs[k].split(' ')[0]; return v.endsWith('%') ? Math.min(rect.width, rect.height) * parseFloat(v) / 100 : px(v); };
    const rr = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(k => Math.min(rad(k), Math.min(rect.width, rect.height) / 2));
    if (rr.some(Boolean)) { if (rr.every(v => v === rr[0])) s.borderRadius = r1(rr[0]); else ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].forEach((k, i) => { if (rr[i]) s[k] = r1(rr[i]); }); }
    if (cs.boxShadow && cs.boxShadow !== 'none') s.boxShadow = cs.boxShadow;
    const op = parseFloat(cs.opacity); if (op < 1) s.opacity = op;
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflow === 'clip') s.overflow = 'hidden';
    if (cs.zIndex !== 'auto' && cs.position !== 'static') s.zIndex = parseInt(cs.zIndex, 10);
    const m = cs.transform && cs.transform.match(/matrix\(([^)]+)\)/);
    if (m) {
      const [a, b, , , e, f] = m[1].split(',').map(parseFloat); const t = [];
      if (Math.abs(e) > .1) t.push({ translateX: r1(e) }); if (Math.abs(f) > .1) t.push({ translateY: r1(f) });
      const deg = Math.atan2(b, a) * 180 / Math.PI; if (Math.abs(deg) > .1) t.push({ rotate: r1(deg) + 'deg' });
      const sc = Math.hypot(a, b); if (Math.abs(sc - 1) > .01) t.push({ scale: Math.round(sc * 1000) / 1000 });
      if (t.length) s.transform = t;
    }
    return s;
  }

  // CSS gradient list -> [{ type, angle, stops: [{ c, p }] }] (same parser as the Figma capture)
  function splitTop(v) {
    const out = []; let depth = 0, cur = '';
    for (const ch of v) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function gradients(bgImage) {
    const res = [];
    for (const g of splitTop(bgImage)) {
      const m = g.match(/^(repeating-)?(linear|radial)-gradient\((.*)\)$/s);
      if (!m) continue;
      const parts = splitTop(m[3]);
      let angle = 180, at = null;
      const isColor = t => /^(rgb|#|hsl|color\(|transparent|[a-z]+\s*[\d.]*%?$)/i.test(t) && !!col(t.replace(/\s+[\d.]+(%|px)(\s+[\d.]+(%|px))?$/, ''));
      if (m[2] === 'linear' && parts.length && !isColor(parts[0])) {
        const a = parts.shift();
        if (/deg/.test(a)) angle = parseFloat(a);
        else if (/turn/.test(a)) angle = parseFloat(a) * 360;
        else { const map = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270, 'to top right': 45, 'to right top': 45, 'to bottom right': 135, 'to right bottom': 135, 'to bottom left': 225, 'to left bottom': 225, 'to top left': 315, 'to left top': 315 }; angle = map[a.trim()] ?? 180; }
      } else if (m[2] === 'radial' && parts.length && !isColor(parts[0])) {
        const a = parts.shift(); const pm = a.match(/at\s+([\d.]+)%\s+([\d.]+)%/); if (pm) at = [+pm[1] / 100, +pm[2] / 100];
      }
      const stops = [];
      parts.forEach((p, i) => {
        const cm = p.match(/^(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]+|[a-z]+)/i); if (!cm) return;
        const c = col(cm[1]) || (cm[1] === 'transparent' ? 'rgba(0, 0, 0, 0)' : null); if (!c) return;
        const pm = p.slice(cm[0].length).match(/([\d.]+)(%|px)/);
        stops.push({ c, p: pm ? (pm[2] === '%' ? +pm[1] / 100 : null) : null, px: pm && pm[2] === 'px' ? +pm[1] : undefined });
      });
      stops.forEach((st, i) => { if (st.p === null) st.p = st.px !== undefined ? null : (stops.length === 1 ? 0 : i / (stops.length - 1)); });
      if (stops.length) res.push({ type: m[2], angle, at, repeat: !!m[1], stops });
    }
    return res;
  }

  function svgXml(svg) {
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el), d = dst[i], tag = el.tagName.toLowerCase();
      if (['defs', 'lineargradient', 'radialgradient', 'clippath', 'mask', 'title'].includes(tag)) return;
      if (tag === 'stop') { d.setAttribute('stop-color', col(cs.stopColor) || cs.stopColor); d.setAttribute('stop-opacity', cs.stopOpacity); return; }
      const fix = v => (v && v.startsWith('url(') ? v.replace(/url\(["']?[^#]*#([^"')]+)["']?\)/, 'url(#$1)') : (v === 'none' ? 'none' : col(v) || v));
      if (cs.fill) d.setAttribute('fill', fix(cs.fill));
      if (cs.stroke) d.setAttribute('stroke', fix(cs.stroke));
      [['strokeWidth', 'stroke-width'], ['strokeLinecap', 'stroke-linecap'], ['strokeLinejoin', 'stroke-linejoin'], ['fillOpacity', 'fill-opacity'], ['strokeOpacity', 'stroke-opacity'], ['strokeDasharray', 'stroke-dasharray'], ['fillRule', 'fill-rule']].forEach(([k, a]) => {
        const v = cs[k]; if (v && v !== 'none' && v !== 'normal') d.setAttribute(a, String(v).replace(/px/g, ''));
      });
      if (cs.opacity && cs.opacity !== '1' && i > 0) d.setAttribute('opacity', cs.opacity);
      if (tag === 'text' || tag === 'tspan') { d.setAttribute('font-family', family(cs)); d.setAttribute('font-size', px(cs.fontSize)); d.setAttribute('font-weight', cs.fontWeight); }
      d.removeAttribute('class'); d.removeAttribute('style');
    });
    const r = svg.getBoundingClientRect();
    clone.setAttribute('width', r1(r.width)); clone.setAttribute('height', r1(r.height));
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${r1(r.width)} ${r1(r.height)}`);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return clone.outerHTML.replace(/\s+/g, ' ');
  }

  const isInline = cs => cs.display === 'inline' || cs.display === 'contents';
  const shown = cs => cs.display !== 'none' && cs.visibility !== 'hidden';
  const lk = el => (el.getAttribute && el.getAttribute('data-lk')) || undefined;

  // what "Read aloud" says: the card's own words, without button labels or the control itself
  function speakText(el, skip) {
    const parts = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const p = n.parentElement;
      if (skip && skip.contains(n)) continue;
      if (p.closest('svg') || p.closest('[class*="btn"],[class*="pill"],[class*="tag"]')) continue;
      const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) parts.push(t);
    }
    return parts.join(' ').replace(/\s·\s/g, ', ').replace(/\s+/g, ' ').trim();
  }

  function rnNode(el, parentCs, parentRect) {
    const cs = getComputedStyle(el);
    if (!shown(cs)) return null;
    const c = cls(el);
    if (/(^|\s)(statusbar|homebar)(\s|$)/.test(c)) return null;
    const rect = el.getBoundingClientRect();
    if (el.tagName.toLowerCase() === 'svg') {
      if (rect.width < .5 || rect.height < .5) return null;
      const s = boxStyle(el, cs, parentCs, rect, parentRect);
      s.width = r1(rect.width); s.height = r1(rect.height);
      return { k: 'S', xml: svgXml(el), s, lk: lk(el), cls: c || undefined };
    }
    if (/^(SCRIPT|STYLE|LINK|BR)$/.test(el.tagName)) return null;
    const box = boxStyle(el, cs, parentCs, rect, parentRect);
    const node = { k: 'V', s: box, c: [], lk: lk(el), cls: c ? c.split(/\s+/).slice(0, 2).join(' ') : undefined };
    if (el.hasAttribute('data-scroll')) node.scroll = true;
    if (el.hasAttribute('data-speak')) node.speak = el.getAttribute('data-speak');
    const flex = /flex/.test(cs.display);
    const kids = [...el.childNodes].filter(n => (n.nodeType === 3 && n.nodeValue.trim()) || (n.nodeType === 1 && shown(getComputedStyle(n))));
    const hasInline = kids.some(n => n.nodeType === 3 || (isInline(getComputedStyle(n)) && n.tagName.toLowerCase() !== 'svg'));
    if (flex || !hasInline) {
      const ts = textStyle(cs);
      for (const n of kids) {
        if (n.nodeType === 3) {
          const t = n.nodeValue.replace(/\s+/g, ' ').trim();
          node.c.push({ k: 'T', ts: textStyle(cs, t), c: [t], lines: lines(cs) });
        } else {
          const ch = rnNode(n, cs, rect); if (ch) node.c.push(ch);
        }
      }
      void ts;
      return node;
    }
    // inline formatting context: one Text with nested runs
    const ts = textStyle(cs, el.textContent);
    const t = { k: 'T', ts, c: inlineRuns(el, cs, ts), lines: lines(cs) };
    trimRuns(t);
    // put the text directly on the box
    node.c = [t];
    node.text = true;
    return node;
  }
  function lines(cs) {
    const clamp = parseInt(cs.webkitLineClamp || cs.getPropertyValue('-webkit-line-clamp'), 10);
    if (clamp > 0) return clamp;
    if (cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre') return 1;
    return undefined;
  }
  function inlineRuns(el, cs, ts) {
    const out = [];
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { const v = n.nodeValue.replace(/\s+/g, ' '); if (v) out.push(v); continue; }
      if (n.nodeType !== 1) continue;
      const ccs = getComputedStyle(n);
      if (!shown(ccs)) continue;
      if (n.tagName === 'BR') { out.push('\n'); continue; }
      if (isInline(ccs) && n.tagName.toLowerCase() !== 'svg') {
        const cts = textStyle(ccs, n.textContent);
        const d = diffText(cts, ts);
        const bg = col(ccs.backgroundColor); if (bg) d.backgroundColor = bg;
        out.push({ k: 'T', ts: d, c: inlineRuns(n, ccs, cts), lk: lk(n) });
      } else {
        const ch = rnNode(n, cs, el.getBoundingClientRect()); if (ch) out.push(ch);
      }
    }
    return out;
  }
  function trimRuns(t) {
    // collapse leading/trailing whitespace of the whole run list
    const first = t.c[0], last = t.c[t.c.length - 1];
    if (typeof first === 'string') t.c[0] = first.replace(/^\s+/, '');
    if (typeof last === 'string') t.c[t.c.length - 1] = t.c[t.c.length - 1].replace(/\s+$/, '');
    t.c = t.c.filter(x => x !== '');
  }

  // ---------- JSX for desktop frames
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', colspan: 'colSpan', rowspan: 'rowSpan', readonly: 'readOnly', maxlength: 'maxLength', contenteditable: 'contentEditable', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'xmlns:xlink': 'xmlnsXlink', autocomplete: 'autoComplete', spellcheck: 'spellCheck', checked: 'defaultChecked', value: 'defaultValue', selected: 'defaultValue' };
  const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  function jsx(el, ind) {
    if (el.nodeType === 3) {
      const v = el.nodeValue.replace(/\s+/g, ' ');
      if (!v.trim()) {
        const par = el.parentElement, ps = par && getComputedStyle(par).display;
        if (!v || /flex|grid/.test(ps || '')) return '';
        const blk = n => n && n.nodeType === 1 && !/^inline/.test(getComputedStyle(n).display);
        if (!el.previousSibling || !el.nextSibling || blk(el.previousSibling) || blk(el.nextSibling)) return '';
        return '{" "}';
      }
      return '{' + JSON.stringify(v) + '}';
    }
    if (el.nodeType !== 1) return '';
    const tag = el.tagName.toLowerCase() === el.tagName ? el.tagName : el.tagName.toLowerCase();
    if (/^(script|style|link)$/i.test(tag)) return '';
    if (/(^|\s)browserbar(\s|$)/.test(cls(el))) return '';
    const attrs = [];
    for (const a of el.attributes) {
      let n = a.name, v = a.value;
      if (n === 'style') {
        const parts = [];
        let depth = 0, cur = '';
        const decl = [];
        for (const ch of v) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && !depth) { decl.push(cur); cur = ''; } else cur += ch; }
        decl.push(cur);
        for (const d of decl) {
          const k = d.indexOf(':'); if (k < 0) continue;
          const p = d.slice(0, k).trim(), val = d.slice(k + 1).trim();
          if (!p || !val) continue;
          parts.push(`${JSON.stringify(p.startsWith('--') ? p : camel(p.toLowerCase()))}: ${JSON.stringify(val)}`);
        }
        if (parts.length) attrs.push(`style={{${parts.join(', ')}}}`);
        continue;
      }
      if (n === 'data-lk' || n === 'data-scroll') continue;
      if (n.startsWith('on')) continue;
      if (ATTR[n]) n = ATTR[n];
      else if (!n.startsWith('data-') && !n.startsWith('aria-') && n.includes('-')) n = camel(n);
      else if (n.includes(':')) n = camel(n.replace(':', '-'));
      if (v === '' && /^(disabled|readOnly|defaultChecked|hidden|required|multiple|autoFocus)$/.test(n)) attrs.push(n);
      else attrs.push(`${n}=${JSON.stringify(v)}`);
    }
    const l = lk(el); if (l) attrs.push(`data-lk=${JSON.stringify(l)}`);
    const tname = el.namespaceURI === 'http://www.w3.org/2000/svg' ? el.tagName : tag;
    const open = `<${tname}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    if (VOID.has(tag)) return open + ' />';
    const inner = [...el.childNodes].map(n => jsx(n, ind + 1)).join('');
    if (!inner) return open + ' />';
    return `${open}>${inner}</${tname}>`;
  }

  // ---------- entry points
  window.__frames = () => [...document.querySelectorAll('.frame[data-name]')].filter(f => IDRE.test(f.dataset.name)).map(f => {
    const r = f.getBoundingClientRect();
    return { name: f.dataset.name, w: Math.round(r.width), h: Math.round(r.height), modes: cls(f).split(/\s+/).filter(c => c.startsWith('mode-')) };
  });

  // specs: [{frame, links:[{i,label}], nav:[{i,label}], auto}]
  window.__extract = (specs) => {
    const frames = [...document.querySelectorAll('.frame[data-name]')].filter(f => IDRE.test(f.dataset.name));
    const results = [];
    for (const spec of specs) {
      const frame = frames.find(f => f.dataset.name === spec.frame);
      frame.scrollIntoView({ block: 'start', inline: 'start' });
      const report = [];
      // 1. explicit links, in priority order
      for (const L of spec.links) {
        const lab = nrm(L.label);
        if (L.label === '*' || AUTO.test(lab)) { report.push({ i: L.i, ok: true, auto: true }); continue; }
        const el = hotspot(frame, L.label);
        if (el) { el.setAttribute('data-lk', 'L' + L.i); report.push({ i: L.i, ok: true, text: norm(el.textContent).slice(0, 40), cls: cls(el).split(' ')[0] }); continue; }
        if (/^tabs?$/.test(lab) || / tab$/.test(lab) || L.nav) { report.push({ i: L.i, ok: true, skip: true }); continue; }
        const wiredSame = report.some(r => r.ok && !r.whole && spec.links.find(x => x.i === r.i && nrm(x.label) === lab));
        if (!wiredSame && (L.flow || GENERIC.has(lab) || /^(tap|tap anywhere|anywhere|screen|hero)$/.test(lab))) { report.push({ i: L.i, ok: true, whole: true }); continue; }
        if (wiredSame) { report.push({ i: L.i, ok: true, skip: true }); continue; }
        report.push({ i: L.i, ok: false });
      }
      // 2. tab bars / side bars
      const navItems = [...frame.querySelectorAll('.m-tabbar *, .tabbar *, .d-side *, .s-side *, .ld-tnav *, [class*="tabbar"] *, [class*="-side"] *')].filter(e => /__item|(^|\s)[a-z]+-tab(\s|$)|(^|\s)m-tab(\s|$)|__link|__nav/.test(cls(e)));
      for (const N of spec.nav) {
        const it = navItems.find(e => norm(e.textContent).startsWith(norm(N.label)) && !e.hasAttribute('data-lk') && !e.querySelector('[data-lk]') && visibleAt(e));
        if (it) { it.setAttribute('data-lk', 'N' + N.i); report.push({ nav: N.i, ok: true }); }
      }
      // 3. back arrows and close icons
      const backs = [];
      const fr = frame.getBoundingClientRect();
      frame.querySelectorAll('svg').forEach(svg => {
        const html = svg.innerHTML;
        const kind = /M19 12H5M12 19l-7-7 7-7|m15 18-6-6 6-6|m12 19-7-7 7-7/.test(html) ? 'back' : /M18 6 6 18M6 6l12 12/.test(html) ? 'close' : null;
        if (!kind) return;
        const r = svg.getBoundingClientRect();
        if (r.width > 40 || r.height > 40) return;
        if (svg.closest('[data-lk]') || svg.closest('.browserbar,.statusbar')) return;
        const y = r.top - fr.top;
        const inOverlay = !!svg.closest('[class*="drawer"],[class*="sheet"],[class*="modal"],[class*="dialog"],[class*="popover"],[class*="close"]');
        if (!(y < 240 || inOverlay)) return;
        if (r.width < 15 && y >= 120) return;
        if (!visibleAt(svg, frame)) return;
        let hot = svg;
        for (let e = svg.parentElement, i = 0; e && e !== frame && i < 3; e = e.parentElement, i++) { const rr = e.getBoundingClientRect(); if (rr.width <= 64 && rr.height <= 64) hot = e; else break; }
        if (hot.hasAttribute('data-lk')) return;
        hot.setAttribute('data-lk', kind === 'back' ? 'B' : 'C');
        backs.push(kind);
      });
      // 4. read-aloud controls speak the screen's main content
      // (settings screens have "Read aloud" switches, not play buttons)
      if (!/settings|voice and language|voice pack/i.test(frame.dataset.name)) frame.querySelectorAll('*').forEach(e => {
        const t = norm(e.textContent);
        if (!/^(read aloud|read next line|read again|replay)$/.test(t)) return;
        if ([...e.children].some(c => norm(c.textContent) === t)) return;      // deepest element only
        const hot = climb(e, frame);
        const body = frame.querySelector('.m-body,.dx-mbody,.ld-tbody') || frame;
        const main = /next line/.test(t)
          ? body.querySelector('[class*="--sel"],[class*="is-next"],[class*="--next"]') || body
          : body;
        hot.setAttribute('data-speak', speakText(main, hot).replace(/^(.{0,600})(\s.*)?$/s, '$1'));
      });
      const w = fr.width;
      const plat = w < 600 ? 'phone' : w < 1200 ? 'tablet' : 'desktop';
      const res = { frame: spec.frame, report, backs };
      if (plat === 'desktop') {
        res.jsx = jsx(frame, 0);
      } else {
        // scroll body: the growing child of the screen column
        const screen = frame.querySelector(':scope > .m-screen') || frame;
        const grow = [...screen.children].filter(c => parseFloat(getComputedStyle(c).flexGrow) > 0 && !/statusbar|homebar/.test(cls(c)));
        grow.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height);
        if (grow[0]) grow[0].setAttribute('data-scroll', '1');
        const fcs = getComputedStyle(frame);
        const tree = rnNode(frame, null, null);
        // the device replaces the bezel: drop frame size, border, radius, shadow
        ['width', 'height', 'borderWidth', 'borderColor', 'borderRadius', 'boxShadow', 'overflow'].forEach(k => delete tree.s[k]);
        tree.s.flex = 1;
        const scr = frame.querySelector(':scope > .m-screen');
        res.bg = col(getComputedStyle(scr || frame).backgroundColor) || col(fcs.backgroundColor) || '#ffffff';
        res.tree = tree;
      }
      results.push(res);
    }
    return results;
  };
}

// ---------------------------------------------------------------- node side
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--hide-scrollbars'] });
  const page = await browser.newPage();
  const open = async b => {
    await page.setViewport({ width: 1600, height: 1200 });
    await page.goto('file:///' + path.join(PAGES, b + '.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(`window.installHotspots = ${require('./hotspots.js').toString()}`);
    await page.evaluate(pageCode);
  };

  // pass 1: every frame
  const frames = [];
  for (const b of BOARDS) {
    await open(b);
    for (const f of await page.evaluate(() => window.__frames())) {
      const id = f.name.match(ID)[0];
      frames.push({ ...f, board: b.slice(0, 2), id, plat: platOf(f.w), app: APP[id.split('-')[0]] });
    }
  }
  // unique keys
  const used = new Set();
  for (const f of frames) {
    let k = slug(f.name.replace(/·\s*(phone|desktop|tablet)\b/i, '')) || slug(f.id);
    if (used.has(k)) k = slug(f.name);
    let n = 2; const base = k; while (used.has(k)) k = base + '-' + n++;
    used.add(k); f.key = k;
  }
  const byId = id => frames.filter(f => f.id === id);
  const resolve = (from, to, toName) => {
    let c = byId(to);
    if (toName) { const named = c.filter(f => f.name.startsWith(toName)); if (named.length) c = named; }
    // stay in the same variant (daylight screens link to daylight screens)
    const V = /daylight/i, same = f => V.test(f.name) === V.test(from.name);
    return c.find(f => f.plat === from.plat && f.board === from.board && same(f)) || c.find(f => f.plat === from.plat && f.board === from.board) ||
      c.find(f => f.plat === from.plat) || c.find(f => f.board === from.board) || c[0];
  };

  // links per frame (first link wins; flows first as in links.json order)
  const normL = x => (x || '').toLowerCase().replace(/[\u201C\u201D"'\u2019]/g, '').replace(/\s+/g, ' ').trim();
  const navLabels = new Set(Object.values(LINKS.nav).flatMap(m => Object.keys(m).map(normL)));
  const plat2 = f => (f.plat === 'phone' ? 'phone' : f.plat === 'tablet' ? 'tablet' : 'desktop');
  const specs = new Map(frames.map(f => [f.name + '|' + f.board, { frame: f.name, links: [], nav: [], f }]));
  LINKS.links.forEach((L, i) => {
    for (const f of frames.filter(x => x.id === L.from)) {
      if (L.fromName && !f.name.startsWith(L.fromName)) continue;
      if (L.plat && L.plat !== plat2(f)) continue;
      const t = resolve(f, L.to, L.toName);
      if (!t || t === f) continue;
      specs.get(f.name + '|' + f.board).links.push({ i, label: L.label, to: t.key, flow: L.board === 'flow', nav: navLabels.has(normL(L.label)) });
    }
  });
  const navKey = f => f.id.split('-')[0] + (f.plat === 'phone' ? 'p' : f.plat === 'tablet' ? 't' : 'd');
  for (const s of specs.values()) {
    const map = LINKS.nav[navKey(s.f)] || {};
    Object.entries(map).forEach(([label, id], j) => {
      const t = resolve(s.f, id); if (t && t !== s.f) s.nav.push({ i: j, label, to: t.key });
    });
  }

  // pass 2: extract per board
  const out = [];
  for (const b of BOARDS) {
    await open(b);
    const bs = [...specs.values()].filter(s => s.f.board === b.slice(0, 2));
    const res = await page.evaluate(sp => window.__extract(sp), bs.map(s => ({ frame: s.frame, links: s.links.map(l => ({ i: l.i, label: l.label, flow: l.flow, nav: l.nav })), nav: s.nav.map(n => ({ i: n.i, label: n.label })) })));
    for (const r of res) {
      const s = bs.find(x => x.frame === r.frame);
      const links = {};
      let auto = null, whole = null;
      for (const rep of r.report) {
        if (rep.nav !== undefined) { const n = s.nav.find(x => x.i === rep.nav); links['N' + rep.nav] = { to: n.to, kind: 'nav' }; continue; }
        const L = s.links.find(x => x.i === rep.i);
        if (rep.auto) { if (!auto) auto = L.to; continue; }
        if (rep.skip) continue;
        if (rep.whole) { const t = frames.find(x => x.key === L.to); if (!whole && t && t.plat === s.f.plat) whole = L.to; continue; }
        if (rep.ok) links['L' + rep.i] = { to: L.to, kind: 'go', label: L.label, text: rep.text };
      }
      const missed = r.report.filter(x => x.ok === false).map(x => s.links.find(l => l.i === x.i)).map(l => `${l.label} -> ${l.to}`);
      out.push({ ...s.f, links, auto, whole, backs: r.backs, missed, report: r.report, jsx: r.jsx, tree: r.tree, bg: r.bg });
    }
    console.log(b, res.length, 'screens');
  }

  // back / close targets: the screen that opens this one (same app & platform), else the app home
  const HOME = { SMp: 'SM-11', SMd: 'SM-02', DSPd: 'DSP-08', DSPp: 'DSP-27', LDp: 'LD-01', LDt: 'LD-21', DRp: 'DR-01', ADMd: 'ADM-02' };
  const BACK_TO = { 'SM-17': 'SM-02', 'DSP-28': 'DSP-27', 'LD-04': 'LD-02', 'DSP-A1b': 'DSP-A1', 'LD-18': 'LD-01', 'DR-19': 'DR-36' };
  const incoming = new Map();
  for (const s of out) for (const l of Object.values(s.links)) if (l.kind === 'go') { if (!incoming.has(l.to)) incoming.set(l.to, []); incoming.get(l.to).push(s); }
  for (const s of out) {
    const pre = s.id.split('-')[0];
    let parent = null;
    if (BACK_TO[s.id]) parent = resolve(s, BACK_TO[s.id]);
    if (!parent) { const inc = (incoming.get(s.key) || []).filter(x => x !== s && x.plat === s.plat); parent = inc.find(x => x.id.startsWith(pre + '-')) || inc[0]; }
    if (!parent) parent = resolve(s, HOME[navKey(s)] || s.id);
    s.parent = parent && parent.key !== s.key ? parent.key : null;
    if (s.backs.includes('back')) s.links.B = { to: s.parent, kind: 'back' };
    if (s.backs.includes('close')) s.links.C = { to: s.parent, kind: 'back' };
  }
  fs.writeFileSync(path.join(OUT, 'screens.json'), JSON.stringify({ frames: out.map(({ report, ...x }) => x), starts: LINKS.starts }, null, 0));
  const missed = out.filter(s => s.missed.length);
  console.log(`screens: ${out.length}; links wired: ${out.reduce((n, s) => n + Object.keys(s.links).length, 0)}; not found: ${missed.reduce((n, s) => n + s.missed.length, 0)}`);
  for (const s of missed) console.log('  ', s.name, '|', s.missed.join(' ; '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
