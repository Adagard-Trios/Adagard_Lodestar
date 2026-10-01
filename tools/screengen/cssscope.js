// Prefixes every selector in a stylesheet with a scope class, so each design board's CSS only
// applies to its own screens. html/body/:root selectors become the scope itself.
// @media / @supports blocks are scoped inside; @keyframes / @font-face are kept as they are.
module.exports = function scopeCss(css, scope) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  function block() {
    let out = '';
    while (i < css.length) {
      const close = css.indexOf('}', i), open = css.indexOf('{', i);
      if (close !== -1 && (open === -1 || close < open)) { i = close + 1; return out; }
      if (open === -1) { i = css.length; return out; }
      const head = css.slice(i, open).trim();
      i = open + 1;
      if (/^@(media|supports|container|layer)/.test(head)) { out += `${head} {\n${block()}}\n`; continue; }
      if (/^@(keyframes|-webkit-keyframes|font-face|page)/.test(head)) { out += `${head} {${raw()}}\n`; continue; }
      const body = decls();
      const sel = head.split(',').map(s => s.trim()).filter(Boolean).map(s => {
        if (/^(html|body|:root)$/.test(s)) return scope;
        if (/^(html|body|:root)\s/.test(s)) return s.replace(/^(html|body|:root)/, scope);
        return `${scope} ${s}`;
      }).join(', ');
      if (sel) out += `${sel} {${body}}\n`;
    }
    return out;
  }
  function decls() { const e = css.indexOf('}', i); const b = css.slice(i, e); i = e + 1; return b; }
  function raw() {
    let depth = 1, s = i;
    while (i < css.length && depth) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++; }
    return css.slice(s, i - 1);
  }
  return block();
};
