// The truck diagram on the load sheets (LD-02, LD-30), drawn from the trip's own load groups: one block per stop
// in loading order from the cab (first loaded sits deepest), chilled lines in the top zone and ambient lines in
// the bottom one, each block as wide as its share of that zone's kg. Loaded stops are green, the stop being
// loaded is amber, the rest dashed. Nothing is drawn when the trip has no lines.
import { ordinal, type LoadGroup } from '@/model/dock';

const W = 302;
const H = 96;
const BOX_X = 36;
const BOX_W = 252;
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n1 = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 1 });

type Tone = { fill: string; stroke: string; text: string; dash?: boolean };
const DONE: Tone = { fill: '#e3f6ec', stroke: '#10b981', text: '#065f46' };
const NOW: Tone = { fill: '#fff1d6', stroke: '#f5b83d', text: '#7a4b00' };
const TODO: Tone = { fill: 'none', stroke: '#a6aebd', text: '#475467', dash: true };

function zone(groups: LoadGroup[], chilled: boolean, y: number, current: number): string {
  const parts = groups
    .map(g => ({ g, kg: g.lines.filter(l => (l.tempClass === 'CHILLED') === chilled).reduce((n, l) => n + l.kg, 0) }))
    .filter(p => p.kg > 0);
  const total = parts.reduce((n, p) => n + p.kg, 0);
  if (!total) {
    return `<text x="${BOX_X + 6}" y="${y + 23}" font-size="12" font-weight="600" fill="#8f98aa" font-family="Inter">${chilled ? 'No chilled lines' : 'No ambient lines'}</text>`;
  }
  const gap = 4;
  const usable = BOX_W - gap * (parts.length - 1);
  let x = BOX_X;
  return parts
    .map(({ g, kg }) => {
      const w = Math.max(18, (kg / total) * usable);
      const tone = g.ticked === g.lines.length ? DONE : g.order === current ? NOW : TODO;
      const label = w >= 84 ? `${ordinal(g.order)} · Stop ${g.stop.stopSeq}` : `S${g.stop.stopSeq}`;
      const sub = w >= 84 ? `${n1(kg)} kg${tone === DONE ? ' ✓' : ''}` : w >= 40 && tone === DONE ? '✓' : '';
      const out =
        `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="37" rx="8" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="1.5"${tone.dash ? ' stroke-dasharray="4, 3"' : ''}></rect>` +
        (w >= 26 ? `<text x="${(x + 7).toFixed(1)}" y="${y + 16}" font-size="12" font-weight="800" fill="${tone.text}" font-family="Inter">${esc(label)}</text>` : '') +
        (sub ? `<text x="${(x + 7).toFixed(1)}" y="${y + 31}" font-size="12" font-weight="600" fill="${tone.text}" font-family="Inter">${esc(sub)}</text>` : '');
      x += w + gap;
      return out;
    })
    .join('');
}

/** The diagram as an SVG string for <Icon xml>, or null when there is nothing to draw. */
export function truckSvg(groups: LoadGroup[]): string | null {
  if (!groups.some(g => g.lines.length)) return null;
  const current = groups.find(g => g.ticked < g.lines.length)?.order ?? -1;
  return (
    `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="22" width="26" height="52" rx="9" fill="#c9cfdb"></rect><rect x="5" y="30" width="9" height="36" rx="3" fill="#8f98aa"></rect>` +
    `<rect x="30" y="1" width="262" height="94" rx="12" fill="#ffffff" stroke="#c9cfdb" stroke-width="1.5"></rect>` +
    `<path d="M31 13 a11 11 0 0 1 11 -11 H280 a11 11 0 0 1 11 11 V47 H31 Z" fill="#ddf4f9"></path>` +
    `<path d="M31 49 H291 V83 a11 11 0 0 1 -11 11 H42 a11 11 0 0 1 -11 -11 Z" fill="#f1efec"></path>` +
    zone(groups, true, 6, current) +
    zone(groups, false, 53, current) +
    `<rect x="293" y="6" width="7" height="38" rx="2" fill="#c9cfdb"></rect><rect x="293" y="52" width="7" height="38" rx="2" fill="#c9cfdb"></rect>` +
    `</svg>`
  );
}
