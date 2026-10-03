// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-32 Plans · phone (P2, phone)
// Read-only on the phone: per depot of the dispatcher, the plan in effect for the run day (Plans) and how far its
// trips are (the day's trips), the orders moved off the day (Deferrals), and the queue for the next run (Orders).
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { depotName, LIVE_POLL_MS, orderCutoff, reasonCode, useAlertCount, useEvery, usePlansBoard } from '@/model/plan';
import { clock12 } from '@/model/preferences';
import { Frame, Icon, Scroll, Tap, type ScreenNav } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L183":{"to":"dsp-29-live-routes","kind":"go"},"N0":{"to":"dsp-27-alerts","kind":"nav"},"N1":{"to":"dsp-29-live-routes","kind":"nav"},"N3":{"to":"dsp-33-me-and-alert-rules","kind":"nav"}}};

export default function ScreenDsp32Plans() {
  const b = usePlansBoard();
  useEvery(LIVE_POLL_MS, b.refresh);
  const alertCount = useAlertCount();
  const running = b.running.filter(r => r.plan);
  const movedTo = b.moved.map(m => isoDay(m.rescheduledDate)).find(Boolean) || b.next;
  const empty = !b.signedIn ? 'Sign in to see the plans' : b.loading && !b.hasData ? 'Loading…' : b.error && !b.hasData ? 'No signal · plans not saved yet' : '';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v35}>
        <Scroll style={s.v28} contentStyle={s.v29}>
          <View style={s.v4}>
            <View style={s.v2}>
              <Text style={s.t1}>{b.date ? `${dayLabel(b.date)} · read-only on phone` : 'Read-only on phone'}</Text>
            </View>
            <View>
              <Text style={s.t3} testID="plans-running">{empty || (running.length === 1 ? '1 plan running' : `${running.length} plans running`)}</Text>
            </View>
          </View>
          {b.running.length ? (
            <View style={s.v19}>
              <View style={s.v7}>
                <View style={s.v6}>
                  <Text style={s.t5}>{"Running today"}</Text>
                </View>
                <View style={s.v6} />
              </View>
              <View style={s.v18}>
                {b.running.map((r, i) => {
                  const sub = r.plan
                    ? [`v${r.base ? r.base.version : r.plan.version}${r.base ? ` + re-plan ${hm(r.plan.approvedAt ?? r.plan.createdAt)}` : ''}`, `${r.orders} orders`, `${r.vehicles} vehicles`].join(' · ')
                    : 'No plan in effect';
                  return (
                    <Tap key={r.depot} lk="L183" style={i === 0 ? s.v16 : s.v17} testID={`plan-${r.depot}`}>
                      <View style={s.v9}>
                        <Icon xml={X0} width={21} height={21} style={s.v8} />
                      </View>
                      <View style={s.v12}>
                        <View>
                          <Text style={s.t10}>{depotName(r.depot)}</Text>
                        </View>
                        <View>
                          <Text style={s.t11}>{sub}</Text>
                        </View>
                      </View>
                      <View style={s.v15}>
                        <View>
                          <Text style={s.t13}>{`${r.delivered}/${r.orders}`}</Text>
                        </View>
                        <View>
                          <Text style={s.t14}>{"delivered"}</Text>
                        </View>
                      </View>
                      <Icon xml={X1} width={18} height={18} style={s.v8} />
                    </Tap>
                  );
                })}
              </View>
            </View>
          ) : null}
          {b.moved.length ? (
            <View style={s.v19}>
              <View style={s.v7}>
                <View style={s.v6}>
                  <Text style={s.t5}>{movedTo ? `Moved to ${dayLabel(movedTo)}` : 'Moved'}</Text>
                </View>
                <View style={s.v6}>
                  <Text style={s.t20}>{String(b.moved.length)}</Text>
                </View>
              </View>
              <View style={s.v18}>
                {b.moved.map((m, i) => {
                  const outletId = m.order?.outletId ?? m.outlet?.id ?? '';
                  return (
                    <View key={m.id} style={i === 0 ? s.v16 : s.v17} testID={`moved-${i}`}>
                      <View style={s.v21}>
                        <Icon xml={X2} width={21} height={21} style={s.v8} />
                      </View>
                      <View style={s.v12}>
                        <View>
                          <Text style={s.t10}>{m.outlet?.name ? `${m.outlet.name} · ` : ''}<Text style={s.t22}>{outletId || m.orderId}</Text></Text>
                        </View>
                        <View>
                          <Text style={s.t11}>{[reasonCode(m.reason), `score ${Math.round(m.score)}`, m.status === 'CONFIRMED' ? 'store told' : 'suggested'].join(' · ')}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
          {b.next && b.queue ? (
            <View style={s.v19}>
              <View style={s.v7}>
                <View style={s.v6}>
                  <Text style={s.t5}>{"Next run"}</Text>
                </View>
                <View style={s.v6} />
              </View>
              <View style={s.v18}>
                <View style={s.v16}>
                  <View style={s.v9}>
                    <Icon xml={X3} width={21} height={21} style={s.v8} />
                  </View>
                  <View style={s.v12}>
                    <View>
                      <Text style={s.t10}>{`Queue open for ${dayLabel(b.next)}`}</Text>
                    </View>
                    <View>
                      <Text style={s.t11}>{[...b.queue.map(q => `${depotName(q.depot)} ${q.orders === 1 ? '1 order' : `${q.orders} orders`}`), `closes ${clock12(hm(new Date(orderCutoff(b.next)).toISOString()))}`].join(' · ')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v27}>
            <Icon xml={X4} width={20} height={20} style={s.v23} />
            <View style={s.v26}>
              <View>
                <Text style={s.t24}>{"Full plans are approved on desktop"}</Text>
              </View>
              <View>
                <Text style={s.t25}>{"From the phone you approve the agent's re-plans and deferrals."}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v34}>
          <Tap lk="N0" style={s.v32}>
            <Icon xml={X5} width={24} height={24} style={s.v8} />
            <Text style={s.t20}>{"Alerts"}</Text>
            {alertCount ? (
              <View style={s.v31}>
                <Text style={s.t30}>{String(alertCount)}</Text>
              </View>
            ) : null}
          </Tap>
          <Tap lk="N1" style={s.v32}>
            <Icon xml={X6} width={24} height={24} style={s.v8} />
            <Text style={s.t20}>{"Live"}</Text>
          </Tap>
          <View style={s.v32}>
            <Icon xml={X7} width={24} height={24} style={s.v8} />
            <Text style={s.t33}>{"Plans"}</Text>
          </View>
          <Tap lk="N3" style={s.v32}>
            <Icon xml={X8} width={24} height={24} style={s.v8} />
            <Text style={s.t20}>{"Me"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 21V8l9-5 9 5v13\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 21v-8h10v8M7 17h10\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 12a9 9 0 1 0 3-6.7L3 8\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 3v5h5M12 7v5l4 2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m3 11 19-9-9 19-2-8-8-2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  t1: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v2: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t3: {"color":"#0f1422","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v4: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t5: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v6: {"flexShrink":1},
  v7: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v8: {"flexShrink":0,"overflow":"hidden"},
  v9: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  t10: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t11: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v12: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t13: {"color":"#0f1422","fontSize":18,"lineHeight":27,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t14: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  v15: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v16: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v17: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v18: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v19: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  t20: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#fff4e0","borderRadius":14},
  t22: {"letterSpacing":-0.2,"fontFamily":"JetBrainsMono_600SemiBold"},
  v23: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t24: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t25: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v26: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v27: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v28: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v29: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":10,"paddingBottom":12},
  t30: {"color":"#ffffff","fontSize":11,"lineHeight":16.5,"fontFamily":"Inter_800ExtraBold"},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":5,"paddingLeft":5,"marginLeft":6,"position":"absolute","top":0,"right":19.8,"bottom":36.5,"left":43.8,"height":18,"minWidth":18,"backgroundColor":"#b42318","borderRadius":9},
  v32: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  t33: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v34: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":8,"paddingRight":12,"paddingBottom":2,"paddingLeft":12,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v35: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
