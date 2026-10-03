// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DR-15 Route overview · phone · daylight (P4, phone)
// The run's trip in stop order from the cached run (works offline). Route distance, the road class chip and the
// known signal-loss rows are not in the data the driver reads: left out. "Open in Google Maps" hands the stops
// (coordinates, else addresses) to Google Maps.
// Same screen as the night one (Dr15Body): only the colours and the back link below differ (the night icons and
// styles, recoloured).
import type { GradSpec, ScreenNav } from '@/lodestar/runtime';
import { recolor, restyle } from '@/lodestar/theme';
import { Dr15Body, night, type Dr15Theme } from './dr-15-route-overview';

const nav: ScreenNav = {"links":{"L39":{"to":"dr-01-today-s-run-daylight","kind":"go"}}};

export default function ScreenDr15RouteOverviewDaylight() {
  return <Dr15Body t={day} />;
}

const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = restyle(night.s, {
  v0: { backgroundColor: '#ffffff' },
  v2: { backgroundColor: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.06) 0px 1px 2px 0px' },
  t3: { color: '#0a0f1a' },
  t5: { color: '#047857' },
  v6: { backgroundColor: '#e3f6ec' },
  t8: { color: '#4a5467' },
  t10: { color: '#0a0f1a' },
  v12: { backgroundColor: '#344054' },
  t13: { color: '#344054' },
  v14: { backgroundColor: '#e9ecf2' },
  t16: { color: '#344054' },
  v17: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px' },
  v18: { backgroundColor: '#e9ecf2' },
  v19: { backgroundColor: '#8f98aa' },
  t21: { color: '#0a0f1a' },
  t22: { color: '#344054' },
  t24: { color: '#0a0f1a' },
  t25: { color: '#4a5467' },
  v28: { borderColor: '#a8a29e' },
  v29: { borderLeftColor: '#a8a29e' },
  t30: { color: '#ffffff' },
  v31: { backgroundColor: '#141b4d' },
  t33: { color: '#344054' },
  v35: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px' },
  t38: { color: '#ffffff' },
  v39: { boxShadow: 'rgba(20, 27, 77, 0.25) 0px 8px 20px 0px' },
  t40: { color: '#4a5467' },
  v42: { backgroundColor: '#f2f4f8' },
  v43: { backgroundColor: '#f2f4f8' },
});

const day: Dr15Theme = {
  bg: '#f2f4f8', nav, back: 'L39', cta: G0, s,
  X0: recolor(night.X0, '#f2f4fa', '#0a0f1a'),
  X1: recolor(night.X1, '#5ee0a8', '#047857'),
  X2: recolor(night.X2, '#b5bdd1', '#344054'),
  X4: recolor(night.X4, '#111522', '#ffffff'),
};
