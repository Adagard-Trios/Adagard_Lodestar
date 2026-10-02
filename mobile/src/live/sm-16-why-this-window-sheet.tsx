// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-16 Why this window · sheet · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import { today, useClaims, useOrder } from '@/model/hooks';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L91":{"to":"sm-02-order-status-and-eta","kind":"go"},"C":{"to":"sm-02-order-status-and-eta","kind":"back"}}};

/** Minutes after midnight (Colombo) of an instant, or of a "HH:mm" wall-clock time. */
function minutes(v?: string | null): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(/^\d{1,2}:\d{2}/.test(v) ? v : hm(v));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
/** "06:15" → "6:15" */
const wall = (v?: string | null) => (v ? v.replace(/^0(\d)/, '$1') : '');

export default function ScreenSm16WhyThisWindowSheet() {
  const claims = useClaims();
  const q = useOrder();
  const day = q.day.data;
  const order = q.data ?? day?.orders.find(o => o.id === q.id) ?? null;
  const outlet = order?.outlet ?? day?.outlet ?? null;
  const st = order?.tripStop ?? null;
  const date = isoDay(order?.runDate);
  const sameDay = (day?.orders ?? []).filter(o => isoDay(o.runDate) === date);
  const params = order ? { order: order.id } : undefined;
  const early = st?.etaModelBandEarly ?? null;
  const late = st?.etaModelBandLate ?? null;
  const band = early && late ? `${hm(early)}–${hm(late)}` : outlet ? `${wall(outlet.windowOpen)}–${wall(outlet.windowClose)}` : '';
  // the timeline: five half-hour ticks around the window, the band and the ETA marker placed on them
  const a = minutes(early) ?? minutes(outlet?.windowOpen);
  const b = minutes(late) ?? minutes(outlet?.windowClose);
  const eta = minutes(st?.etaModel);
  const lo = Math.min(...[a, b, eta, minutes(st?.etaPlan)].filter((x): x is number => x !== null));
  const start = Number.isFinite(lo) ? Math.floor((lo - 15) / 30) * 30 : null;
  const span = 120;
  const pct = (m: number) => Math.max(0, Math.min(100, ((m - (start ?? 0)) / span) * 100));
  const ticks = start !== null ? [0, 30, 60, 90, 120].map(d => clock((start + d + 1440) % 1440)) : ['—', '—', '—', '—', '—'];
  const bandPos = start !== null && a !== null && b !== null ? { left: `${pct(a)}%` as const, width: `${Math.max(2, pct(b) - pct(a))}%` as const, right: undefined } : null;
  const etaPos = start !== null && eta !== null ? { left: `${pct(eta)}%` as const, right: undefined } : null;
  const plan = hm(st?.etaPlan);
  const model = hm(st?.etaModel);
  const drift = minutes(st?.etaModel) !== null && minutes(st?.etaPlan) !== null ? minutes(st?.etaModel)! - minutes(st?.etaPlan)! : null;
  const access = [outlet?.dockType ? `${titleCase(outlet.dockType)} dock` : '', outlet?.parking ?? ''].filter(Boolean).join(' · ');
  const heading = !order ? (!claims ? 'Sign in to see your delivery' : q.loading || q.day.loading ? 'Loading…' : 'No order yet') : st?.arrivalActual ? `Arrived ${hm(st.arrivalActual)} · you're stop ${st.stopSeq}` : st ? `Arriving · you're stop ${st.stopSeq}` : `${titleCase(order.status)} · not on a trip yet`;
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v56}>
        <Scroll style={s.v54} contentStyle={s.v55}>
          <View style={s.v12}>
            <View style={s.v9}>
              <View style={s.v2}>
                <Icon xml={X0} width={36} height={36} style={s.v1} />
              </View>
              <View style={s.v5}>
                <View>
                  <Text style={s.t3}>{date ? `${date === today() ? 'Today' : 'Delivery'} · ${dayLabel(date)}` : `Today · ${dayLabel(today())}`}</Text>
                </View>
                <View>
                  <Text style={s.t4} numberOfLines={1}>{[order ? plural(sameDay.length || 1, 'order') : '', outlet?.name ?? claims?.outletId ?? ''].filter(Boolean).join(' · ') || '—'}</Text>
                </View>
              </View>
              <View style={s.v8}>
                <View style={s.v6} />
                <Text style={s.t7} numberOfLines={1}>{order ? titleCase(order.status) : '—'}</Text>
              </View>
            </View>
            <View style={s.v10}>
              <View>
                <Text style={s.t4}>{heading}</Text>
              </View>
            </View>
            <View style={s.v11} />
          </View>
          <View style={s.v53}>
            <View style={s.v13} />
            <View style={s.v18}>
              <View style={s.v16}>
                <View>
                  <Text style={s.t14} testID="why-band">{band ? `Why ${band}?` : 'Why this window?'}</Text>
                </View>
                <View>
                  <Text style={s.t15}>{"How Lodestar works it out"}</Text>
                </View>
              </View>
              <Tap lk="C" style={s.v17} to={params ? { to: 'sm-02-order-status-and-eta', kind: 'back', params } : undefined}>
                <Icon xml={X1} width={20} height={20} style={s.v1} />
              </Tap>
            </View>
            <View style={s.v48}>
              <View style={s.v34}>
                <View style={s.v25}>
                  <View style={s.v19} />
                  {bandPos ? (
                    <View style={[s.v21, bandPos]}>
                      <Grad g={G0} style={s.v20} />
                    </View>
                  ) : null}
                  {etaPos ? (
                    <View style={[s.v24, etaPos]}>
                      <View>
                        <Text style={s.t22} numberOfLines={1}>{`ETA ~${model}`}</Text>
                      </View>
                      <View style={s.v23} />
                    </View>
                  ) : null}
                </View>
                <View style={s.v28}>
                  {ticks.map((t, i) => (
                    <View key={i} style={s.v27}>
                      <Text style={s.t26}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.v33}>
                  <View style={s.v32}>
                    <View style={s.v30}>
                      <Grad g={G0} style={s.v29} />
                    </View>
                    <Text style={s.t31}>{"Arrival window"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{plan ? `Plan said ${plan}` : 'No plan time yet'}</Text>
                  </View>
                </View>
              </View>
              <View style={s.v43}>
                <View style={s.v40}>
                  <View style={s.v35}>
                    <Icon xml={X2} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v39}>
                    <View>
                      <Text style={s.t36}>{outlet ? `Receiving hours ${wall(outlet.windowOpen)}–${wall(outlet.windowClose)}` : 'Receiving hours —'}</Text>
                    </View>
                    <View style={s.v38}>
                      <Text style={s.t37}>{outlet?.mallWindow ? `mall delivery window ${outlet.mallWindow}` : `agreed for ${outlet?.id ?? claims?.outletId ?? 'your store'}, the basis of this window`}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.v41}>
                  <View style={s.v35}>
                    <Icon xml={X3} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v39}>
                    <View>
                      <Text style={s.t36}>{st?.serviceMinPredicted ? `Typical unload ${Math.round(st.serviceMinPredicted)} min` : 'Typical unload —'}</Text>
                    </View>
                    <View style={s.v38}>
                      <Text style={s.t37}>{`per stop · you have ${plural(sameDay.length || (order ? 1 : 0), 'order')} ${date === today() ? 'today' : 'that day'}`}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.v41}>
                  <View style={s.v35}>
                    <Icon xml={X4} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v39}>
                    <View>
                      <Text style={s.t36}>{plan || model ? `Plan ${plan || '—'}, model ~${model || '—'}` : 'Not on a trip yet'}</Text>
                    </View>
                    <View style={s.v38}>
                      <Text style={s.t37}>{drift !== null ? (drift > 0 ? `road conditions add about ${drift} min` : drift < 0 ? `about ${-drift} min ahead of plan` : 'on plan') : 'the live ETA starts when the van leaves'}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.v41}>
                  <View style={s.v42}>
                    <Icon xml={X5} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v39}>
                    <View>
                      <Text style={s.t36}>{access || 'Dock details —'}</Text>
                    </View>
                    <View style={s.v38}>
                      <Text style={s.t37}>{outlet?.accessNote || 'No access note on file'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.v47}>
                <Icon xml={X6} width={14} height={14} style={s.v44} />
                <View style={s.v27}>
                  <Text style={s.t46}><Text style={s.t45}>{st?.lateRiskPct !== null && st?.lateRiskPct !== undefined ? `Late risk ${st.lateRiskPct}%, advisory.` : 'Late risk —, advisory.'}</Text>{` Staff from ${early ? hm(early) : wall(outlet?.windowOpen) || '—'}${early && outlet ? `, not ${wall(outlet.windowOpen)}` : ''}. The van's live ETA takes over on the road.`}</Text>
                </View>
              </View>
            </View>
            <View style={s.v52}>
              <Tap lk="L91" style={s.v51} to={params ? { to: 'sm-02-order-status-and-eta', params } : undefined}>
                <Grad g={G0} style={s.v49} />
                <Text style={s.t50}>{"Got it"}</Text>
              </Tap>
            </View>
          </View>
        </Scroll>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 6 6 18M6 6l12 12\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 12a9 9 0 1 0 3-6.7L3 8\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 3v5h5M12 7v5l4 2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M9 17h6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"7\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"17\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4 21 8 3M20 21 16 3M12 5v2M12 11v2M12 17v2\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#0369a1","borderRadius":3.5},
  t7: {"color":"#0369a1","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e6f3fb","borderRadius":14},
  v9: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"marginTop":4,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v11: {"flexShrink":1,"position":"absolute","top":0,"right":0,"bottom":0,"left":0,"backgroundColor":"rgba(10, 15, 46, 0.5)"},
  v12: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"height":128,"backgroundColor":"#f4f5f9","overflow":"hidden"},
  v13: {"flexShrink":0,"marginTop":10,"marginRight":167,"marginBottom":2,"marginLeft":167,"width":40,"height":5,"backgroundColor":"#d3d8e3","borderRadius":2.5},
  t14: {"color":"#101828","fontSize":26,"lineHeight":31.2,"letterSpacing":-0.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t15: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":4,"columnGap":4,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v17: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#eff1f7","borderRadius":20},
  v18: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":8,"paddingRight":20,"paddingLeft":20},
  v19: {"position":"absolute","top":30,"right":0,"bottom":14,"left":0,"height":8,"backgroundColor":"#eff1f7","borderRadius":4},
  v20: {"borderRadius":8},
  v21: {"position":"absolute","top":26,"right":90.5,"bottom":10,"left":116.3,"width":"33.3%","height":16,"borderRadius":8},
  t22: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_800ExtraBold"},
  v23: {"marginTop":2,"width":2,"height":22,"backgroundColor":"#141b4d"},
  v24: {"flexDirection":"column","alignItems":"center","marginLeft":-35,"position":"absolute","top":0,"right":107,"bottom":8.5,"left":168,"width":70},
  v25: {"height":52},
  t26: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v27: {"flexShrink":1},
  v28: {"flexDirection":"row","justifyContent":"space-between","alignItems":"stretch"},
  v29: {"borderRadius":4},
  v30: {"flexShrink":1,"width":14,"height":8,"borderRadius":4},
  t31: {"color":"#475467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1},
  v33: {"flexDirection":"row","alignItems":"stretch","rowGap":14,"columnGap":14},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":12,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#f4f5f9","borderRadius":20},
  v35: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#ffffff","borderRadius":14},
  t36: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t37: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v38: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v39: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v40: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  v41: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  v43: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#f4f5f9","borderRadius":20,"overflow":"hidden"},
  v44: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t45: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t46: {"color":"#636c80","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v47: {"flexDirection":"row","alignItems":"flex-start","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v48: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":14,"paddingBottom":16,"overflow":"hidden"},
  v49: {"borderRadius":18},
  t50: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v51: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v52: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#ffffff"},
  v53: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#ffffff","borderTopLeftRadius":28,"borderTopRightRadius":28,"boxShadow":"rgba(10, 15, 46, 0.25) 0px -8px 30px 0px"},
  v54: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#7f8294"},
  v55: {"flexDirection":"column","alignItems":"stretch"},
  v56: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
