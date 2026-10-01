// Link hotspot finder, run inside the design page. A port of findHotspot in the Figma plugin
// (Designing/figma-plugin/code.js) so the apps click through exactly like the prototype.
// Needs `col` and `px` from the page code.
function installHotspots(col, px) {
  const cls = el => (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '');
  const nrm = s => (s || '').toLowerCase().replace(/[“”"'’]/g, '').replace(/\s+/g, ' ').trim();
  const GENERIC = new Set(['tabs', 'tab bar', 'nav', 'sidebar', 'tap', 'auto', 'after delay', '*', 'any', 'click', 'row', 'card', 'continue or skip']);
  const CLICKABLE = /btn|button|tab|item|row|chip|card|pill|link|opt|toggle|key|(^|\s)tr(\s|$)|iconbtn|close|cta|action/i;
  const NAV_ONLY = /(^|\s)(m-tabbar|tabbar|[a-z]+-tabbar|d-side|dx-side|s-side|side-nav|topnav|s-top|sx-top|x-top|ld-tnav)(\s|$)/;
  const NAV_CONTAINER = /(^|\s)(m-tabbar|tabbar|[a-z]+-tabbar|d-side|dx-side|s-side|side-nav|topnav|s-top|sx-top|x-top|ld-tnav|m-actionbar|d-card__head)(\s|$)/;
  const BIG = /(^|\s)(m-body|m-screen|d-main|d-app|dx-mbody|ld-tbody|s-shell|s-main)(\s|$)/;
  const inNav = (el, frame) => { for (let n = el.parentElement; n && n !== frame; n = n.parentElement) if (NAV_ONLY.test(cls(n))) return true; return false; };
  const rel = (el, frame) => { const r = el.getBoundingClientRect(), f = frame.getBoundingClientRect(); return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height }; };
  const painted = el => {
    const cs = getComputedStyle(el);
    return !!(col(cs.backgroundColor) || (cs.backgroundImage && cs.backgroundImage !== 'none') ||
      (cs.borderTopStyle !== 'none' && px(cs.borderTopWidth) > 0 && col(cs.borderTopColor)) || (cs.boxShadow && cs.boxShadow !== 'none'));
  };
  const btnCount = el => [...el.querySelectorAll('*')].filter(c => /btn|button/i.test(cls(c)) || c.tagName === 'BUTTON').length;

  function visibleAt(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const x = Math.min(Math.max(r.left + Math.min(r.width / 2, 30), 0), innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const hit = document.elementFromPoint(x, y);
    return !!hit && (el.contains(hit) || hit.contains(el));
  }
  function textEls(frame) {
    return [...frame.querySelectorAll('*')].filter(e => {
      if (e.closest('svg') || e.closest('.statusbar,.browserbar,.homebar')) return false;
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) return false;
      const cs = getComputedStyle(e);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
  }
  function climb(node, frame) {
    let n = node, cand = node;
    const f = frame.getBoundingClientRect(), full = f.width * f.height;
    for (let i = 0; i < 6 && n.parentElement && n.parentElement !== frame; i++) {
      n = n.parentElement;
      const r = n.getBoundingClientRect();
      if (NAV_CONTAINER.test(cls(n)) || BIG.test(cls(n)) || r.height > 180 || r.width * r.height > full * 0.2) break;
      if (btnCount(n) >= 2) break;
      const p = painted(n);
      if (p || CLICKABLE.test(cls(n)) || /^(BUTTON|A|TR)$/.test(n.tagName)) { cand = n; if (p) break; }
    }
    return cand;
  }
  function iconHotspot(frame, kind) {
    const W = frame.getBoundingClientRect().width;
    const nodes = [...frame.querySelectorAll('svg, [class*="iconbtn"], [class*="close"], [class*="back"], [class*="avatar"], [class*="bell"], [class*="d-av"], [class*="m-av"]')]
      .filter(n => !n.closest('.statusbar,.browserbar,.homebar') && !(n.parentElement && n.parentElement.closest('svg')))
      .map(n => ({ n, p: rel(n, frame) }))
      .filter(o => o.p.w < 90 && o.p.h < 90 && o.p.w > 4 && visibleAt(o.n));
    let pick = null;
    if (kind === 'back') pick = nodes.filter(o => o.p.y < 170 && o.p.x < 110).sort((x, y) => x.p.x - y.p.x)[0];
    if (kind === 'close') pick = nodes.filter(o => /close/i.test(cls(o.n)))[0] || nodes.filter(o => o.p.y < 170 && (o.p.x < 110 || o.p.x > W - 110)).sort((x, y) => x.p.y - y.p.y)[0];
    if (kind === 'avatar') {
      const t = textEls(frame).filter(e => /^[A-Z]{2}$/.test(e.textContent.trim())).map(n => ({ n, p: rel(n, frame) })).filter(o => o.p.y < 180 && o.p.x > W * 0.6)[0];
      if (t) return climb(t.n, frame);
      pick = nodes.filter(o => o.p.y < 170 && o.p.x > W - 120).sort((x, y) => y.p.x - x.p.x)[0];
    }
    if (kind === 'bell') pick = nodes.filter(o => /bell/i.test(cls(o.n)))[0] || nodes.filter(o => o.p.y < 170 && o.p.x > W - 160)[0];
    if (!pick) return null;
    return climb(pick.n, frame);
  }
  function rowHotspot(frame) {
    const fw = frame.getBoundingClientRect().width;
    const rows = [...frame.querySelectorAll('*')]
      .filter(n => (/(^|[\s_-])(row|tr|card|item|stop|hrow|lrow|mrow)(\s|$)|__r(\s|$)|__row(\s|$)|__card(\s|$)/.test(cls(n)) || n.tagName === 'TR') && !/head|--h\b|grp/.test(cls(n)))
      .map(n => ({ n, p: rel(n, frame) }))
      .filter(o => o.p.y > 120 && o.p.w > fw * 0.3 && o.p.h < 160 && o.p.h > 20 && visibleAt(o.n) && !inNav(o.n, frame));
    rows.sort((x, y) => x.p.y - y.p.y || x.p.x - y.p.x);
    const data = rows.find(o => /\d/.test(o.n.textContent) && !o.n.querySelector('th'));
    return (data || rows[0] || {}).n || null;
  }
  function findHotspot(frame, label) {
    if (/^card:/i.test(label)) {
      const want = nrm(label.slice(5));
      const t = textEls(frame).find(n => nrm(n.textContent).startsWith(want) && visibleAt(n));
      if (!t) return null;
      const fh = frame.getBoundingClientRect().height;
      let n = t, best = t;
      for (let i = 0; i < 8 && n.parentElement && n.parentElement !== frame; i++) {
        n = n.parentElement;
        if (n.getBoundingClientRect().height > fh * 0.5) break;
        if (painted(n)) { best = n; break; }
      }
      return best;
    }
    const raw = nrm(label);
    if (/^(back|back arrow|←|arrow)$/.test(raw)) return iconHotspot(frame, 'back');
    if (/^(close|x|×|dismiss drawer)$/.test(raw)) return iconHotspot(frame, 'close');
    if (/^(avatar|profile|me)$/.test(raw)) return iconHotspot(frame, 'avatar');
    if (/^(bell|notifications bell)$/.test(raw)) return iconHotspot(frame, 'bell');
    if (/^(row|any row|a row|list row|card)$/.test(raw)) return rowHotspot(frame);
    if (/^(star|logo|brand)$/.test(raw)) return iconHotspot(frame, 'back');
    if (/^(\+|plus)$/.test(raw)) { const t = textEls(frame).find(n => n.textContent.trim() === '+'); return t ? climb(t, frame) : iconHotspot(frame, 'avatar'); }
    if (/^(pause|stop speaking)$/.test(raw)) { const t = textEls(frame).find(n => /^speaking/i.test(n.textContent.trim())); return t ? climb(t, frame) : null; }
    if (/^(hero|hero card|summary card)$/.test(raw)) return [...frame.querySelectorAll('[class*="hero"]')].find(e => visibleAt(e)) || null;
    if (/ or |\//.test(raw)) { for (const alt of raw.split(/ or |\//)) { const h = findHotspot(frame, alt.trim()); if (h) return h; } return null; }
    const L = raw.replace(/^(tap|click|choose|the|pick)\s+/, '').replace(/\s*\(.*\)$/, '').replace(/\s+(hint|note|button|tab|row|card|chip|link|pill)$/, '');
    if (!L || GENERIC.has(L)) return null;
    const wantsRow = / (row|card|item)$/.test(raw);
    const texts = textEls(frame).filter(n => !inNav(n, frame) && (!wantsRow || rel(n, frame).y > 150) && visibleAt(n));
    let best = null, score = 0;
    for (const t of texts) {
      const c = nrm(t.textContent);
      if (!c) continue;
      let sc = 0;
      const wbAt = i => i >= 0 && (i === 0 || /[^a-z0-9]/.test(c[i - 1])) && (i + L.length === c.length || /[^a-z0-9]/.test(c[i + L.length]));
      if (c === L) sc = 100;
      else if (c.startsWith(L) && wbAt(0)) sc = 80 - Math.min(30, c.length - L.length);
      else if (wbAt(c.indexOf(L))) sc = 60 - Math.min(30, c.length - L.length);
      else if (L.includes(c) && c.length >= 4) sc = 40 - Math.min(20, L.length - c.length);
      else {
        const w = L.split(' ').filter(x => x.length > 2);
        if (w.length && w.every(x => c.includes(x))) sc = 30;
        else if (w.length > 1 && w.filter(x => c.includes(x)).length >= Math.ceil(w.length * 0.6)) sc = 26;
      }
      if (sc) {
        let inBtn = false, inTitle = false;
        for (let m = t; m && m !== frame; m = m.parentElement) {
          const k = cls(m);
          if (/btn|button|cta|actionbar/i.test(k) || m.tagName === 'BUTTON') { inBtn = true; break; }
          if (/(^|\s)(m-nav|statusbar|x-head|d-head|page-head|d-h1|dx-mnav)(\s|$)|__head(\s|$)|-title(\s|$)/.test(k)) { inTitle = true; break; }
        }
        if (inBtn) sc += 25;
        if (inTitle) sc -= 60;
        if (t.closest('[data-lk]')) sc -= 200;
      }
      if (sc > score) { score = sc; best = t; }
    }
    if (!best || score < 25) return wantsRow ? rowHotspot(frame) : null;
    return climb(best, frame);
  }
  return { findHotspot, climb, visibleAt, nrm, cls, GENERIC };
}
module.exports = installHotspots;
