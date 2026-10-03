// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DR-01 Today's run · Daylight (P4, phone)
// Same screen as the night one (Dr01Body): only the colours, the links and the toggle below differ. The icons and
// styles are the night ones recoloured (this one has no route-card icon, so no X3); the theme toggle shows a sun.
import type { GradSpec, ScreenNav } from '@/lodestar/runtime';
import { recolor, restyle } from '@/lodestar/theme';
import { Dr01Body, night, type Dr01Theme } from './dr-01-today-s-run';

const nav: ScreenNav = {"links":{"L12":{"to":"dr-36-en-route-driving-mode","kind":"go"},"L38":{"to":"dr-15-route-overview-daylight","kind":"go"},"L243":{"to":"dr-24-settings-me","kind":"go"},"N1":{"to":"dr-21-records","kind":"nav"},"N2":{"to":"dr-23-dispatch-notices","kind":"nav"}}};

export default function ScreenDr01TodaySRunDaylight() {
  return <Dr01Body t={day} />;
}

const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"4\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = restyle(night.s, {
  v0: { backgroundColor: '#ffffff' },
  t3: { color: '#0a0f1a' },
  t5: { color: '#047857' },
  v6: { backgroundColor: '#e3f6ec' },
  v7: { backgroundColor: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.06) 0px 1px 2px 0px' },
  t9: { color: '#0a0f1a', fontSize: 27, lineHeight: 30.2 },
  t12: { color: '#4a5467' },
  t14: { color: '#0a0f1a' },
  v16: { backgroundColor: '#047857' },
  t18: { color: '#344054' },
  v19: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px' },
  t20: { color: '#0a0f1a' },
  t21: { color: '#4a5467' },
  t25: { color: '#0a0f1a' },
  t26: { color: '#344054' },
  v27: { backgroundColor: '#4a5467' },
  t28: { color: '#0e7490' },
  t32: { color: '#0a0f1a' },
  t33: { color: '#4a5467' },
  t36: { color: '#3b4cca' },
  v37: { backgroundColor: '#e6e9f8' },
  v38: { borderTopColor: '#e3e6ed' },
  v39: { backgroundColor: '#ffffff', boxShadow: 'rgba(15, 20, 50, 0.04) 0px 1px 2px 0px' },
  t42: { color: '#b45309' },
  v44: { backgroundColor: '#fff1d6' },
  t45: { color: '#57534e' },
  v46: { borderColor: '#a8a29e' },
  t49: { color: '#ffffff' },
  v50: { boxShadow: 'rgba(20, 27, 77, 0.25) 0px 8px 20px 0px' },
  v51: { backgroundColor: '#f2f4f8' },
  t52: { color: '#141b4d' },
  v54: { backgroundColor: '#ffffff', borderTopColor: '#e3e6ed' },
  v55: { backgroundColor: '#f2f4f8' },
});

const day: Dr01Theme = {
  bg: '#f2f4f8', nav, route: 'L38', toggle: 'night', cta: G0, s, X2,
  X1: recolor(night.X1, '#5ee0a8', '#047857'),
  X4: recolor(night.X4, '#67e3f9', '#0e7490'),
  X5: recolor(night.X5, '#ffc266', '#b45309'),
  X6: recolor(night.X6, '#d6cfc7', '#57534e'),
  X7: recolor(night.X7, '#111522', '#ffffff'),
  X8: recolor(night.X8, '#f5b83d', '#141b4d'),
  X9: recolor(night.X9, '#7f89a3', '#4a5467'),
  X10: recolor(night.X10, '#7f89a3', '#4a5467'),
};
