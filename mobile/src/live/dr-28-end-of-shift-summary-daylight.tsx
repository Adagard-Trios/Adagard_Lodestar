// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DR-28 End of shift summary · phone · daylight (P4, phone)
// Same screen as the night one (Dr28Body): only the colours below differ (the night icons and styles, recoloured).
import type { GradSpec } from '@/lodestar/runtime';
import { recolor, restyle } from '@/lodestar/theme';
import { Dr28Body, night, type Dr28Theme } from './dr-28-end-of-shift-summary';

export default function ScreenDr28EndOfShiftSummaryDaylight() {
  return <Dr28Body t={day} />;
}

const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = restyle(night.s, {
  v0: { backgroundColor: '#ffffff' },
  t3: { color: '#0a0f1a' },
  t5: { color: '#047857' },
  v6: { backgroundColor: '#e3f6ec' },
  v8: { backgroundColor: '#e3f6ec' },
  t9: { color: '#0a0f1a' },
  t12: { color: '#344054' },
  v13: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px' },
  t14: { color: '#0a0f1a' },
  t15: { color: '#4a5467' },
  v17: { borderLeftColor: '#e3e6ed' },
  t18: { color: '#b42318' },
  v19: { backgroundColor: '#ffffff' },
  t20: { color: '#0a0f1a' },
  t22: { color: '#4a5467' },
  t24: { color: '#344054' },
  t25: { color: '#0a0f1a' },
  v27: { borderTopColor: '#e3e6ed' },
  v31: { backgroundColor: '#e9ecf2' },
  v32: { borderTopColor: '#e3e6ed' },
  v33: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px' },
  v35: { backgroundColor: '#e9ecf2' },
  t36: { color: '#0a0f1a' },
  t37: { color: '#344054' },
  v41: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px' },
  t44: { color: '#ffffff' },
  v45: { boxShadow: 'rgba(20, 27, 77, 0.25) 0px 8px 20px 0px' },
  v46: { backgroundColor: '#f2f4f8' },
  v47: { backgroundColor: '#f2f4f8' },
});

const day: Dr28Theme = {
  bg: '#f2f4f8', bar: G0, cta: G0, s,
  X1: recolor(night.X1, '#5ee0a8', '#047857'),
  X2: recolor(night.X2, '#5ee0a8', '#047857'),
  X4: recolor(night.X4, '#111522', '#ffffff'),
};
