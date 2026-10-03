// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-27 Alerts · phone (P2, phone)
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { today, useClaims } from '@/model/hooks';
import { depotsLabel, LIVE_POLL_MS, useAlerts, useEvery, type AlertRow } from '@/model/plan';
import { clock12, onCallNow, usePreferences } from '@/model/preferences';
import { Frame, Icon, Scroll, Tap, type ScreenNav, type Target } from '@/lodestar/runtime';
import { useDepots } from '@/model/depots';

const nav: ScreenNav = {"links":{"L61":{"to":"dsp-28-approve-re-plan","kind":"go"},"N1":{"to":"dsp-29-live-routes","kind":"nav"},"N2":{"to":"dsp-32-plans","kind":"nav"},"N3":{"to":"dsp-33-me-and-alert-rules","kind":"nav"}}};

const targetOf = (r: AlertRow): Target | undefined =>
  r.plan ? { to: 'dsp-28-approve-re-plan', params: { plan: r.plan } } : r.vehicle ? { to: 'dsp-30-vehicle-detail', params: { vehicle: r.vehicle } } : undefined;

export default function ScreenDsp27Alerts() {
  useDepots(); // re-render when the depot names (depotsLabel) arrive
  const claims = useClaims();
  const { needs, handled, signedIn, loading, hasData, date, refresh } = useAlerts();
  useEvery(LIVE_POLL_MS, refresh);
  const all = [...needs, ...handled];
  // L61 opens the re-plan: on the first row about a plan, else the first row, else the empty row
  const lkRow = all.find(r => r.plan) ?? all[0];
  const depots = depotsLabel(claims?.depots);
  // quiet hours: outside the on-call hours the dispatcher set (MyPreferences onCall); hidden when none are set
  const onCall = usePreferences().data?.onCall;
  const quiet = onCall?.from && onCall.to && !onCallNow(onCall) ? clock12(onCall.from) : '';
  const heading = !signedIn ? 'Sign in to see alerts' : !hasData && loading ? 'Loading alerts…' : needs.length ? `${plural(needs.length, 'alert')} need${needs.length === 1 ? 's' : ''} you` : 'Nothing needs you';

  const row = (r: AlertRow, i: number, style: StyleProp<ViewStyle>) => {
    const to = targetOf(r);
    const body = (
      <>
        {r.tone === 'late' ? (
          <View style={s.v10}>
            <Icon xml={X0} width={21} height={21} style={s.v9} />
          </View>
        ) : r.tone === 'signal' ? (
          <View style={s.v19}>
            <Icon xml={X2} width={21} height={21} style={s.v9} />
          </View>
        ) : (
          <View style={s.v21}>
            <Icon xml={X3} width={21} height={21} style={s.v9} />
          </View>
        )}
        <View style={s.v13}>
          <View>
            <Text style={s.t11}>{r.title}</Text>
          </View>
          {r.meta || r.code ? (
            <View>
              <Text style={s.t12}>{r.code ? <Text style={s.t23}>{r.code}</Text> : null}{r.code && r.meta ? ' · ' : ''}{r.meta}</Text>
            </View>
          ) : null}
        </View>
        <View style={s.v15}>
          <View>
            <Text style={s.t14}>{hm(r.at)}</Text>
          </View>
        </View>
        {to || r === lkRow ? <Icon xml={X1} width={18} height={18} style={s.v9} /> : null}
      </>
    );
    if (r === lkRow) return <Tap key={r.id} lk="L61" style={style} to={to}>{body}</Tap>;
    if (to) return <Tap key={r.id} style={style} to={to} testID={`alert-row-${i}`}>{body}</Tap>;
    return <View key={r.id} style={style}>{body}</View>;
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v36}>
        <Scroll style={s.v29} contentStyle={s.v30}>
          <View style={s.v4}>
            <View style={s.v2}>
              <Text style={s.t1}>{`${dayLabel(date ?? today())}${depots ? ` · ${depots}` : ''}`}</Text>
            </View>
            <View>
              <Text style={s.t3} testID="alerts-heading">{heading}</Text>
            </View>
          </View>
          <View style={s.v18}>
            <View style={s.v8}>
              <View style={s.v6}>
                <Text style={s.t5}>{"Needs you"}</Text>
              </View>
              <View style={s.v6}>
                <Text style={s.t7}>{"newest first"}</Text>
              </View>
            </View>
            <View style={s.v17}>
              {needs.length ? (
                needs.map((r, i) => row(r, i, i === 0 ? s.v16 : [s.v22, s.v16]))
              ) : lkRow ? (
                <View style={s.v20}>
                  <View style={s.v21}>
                    <Icon xml={X3} width={21} height={21} style={s.v9} />
                  </View>
                  <View style={s.v13}>
                    <View>
                      <Text style={s.t11}>{"Nothing needs you"}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Tap lk="L61" style={s.v20}>
                  <View style={s.v19}>
                    <Icon xml={X2} width={21} height={21} style={s.v9} />
                  </View>
                  <View style={s.v13}>
                    <View>
                      <Text style={s.t11}>{heading}</Text>
                    </View>
                    <View>
                      <Text style={s.t12}>{signedIn ? "Re-plans, late risk and signal loss show here" : "Alerts and re-plans wait for you"}</Text>
                    </View>
                  </View>
                  <Icon xml={X1} width={18} height={18} style={s.v9} />
                </Tap>
              )}
            </View>
          </View>
          {handled.length ? (
            <View style={s.v18}>
              <View style={s.v8}>
                <View style={s.v6}>
                  <Text style={s.t5}>{"Handled"}</Text>
                </View>
                <View style={s.v6}>
                  <Text style={s.t7}>{String(handled.length)}</Text>
                </View>
              </View>
              <View style={s.v17}>
                {handled.map((r, i) => row(r, needs.length + i, i === 0 ? s.v20 : s.v22))}
              </View>
            </View>
          ) : null}
          {quiet ? (
            <View style={s.v28} testID="quiet-hours">
              <Icon xml={X4} width={20} height={20} style={s.v24} />
              <View style={s.v27}>
                <View>
                  <Text style={s.t25}>{`Quiet hours · on call from ${quiet}`}</Text>
                </View>
                <View>
                  <Text style={s.t26}>{"Store messages and plan edits wait. Only your alert rules wake you."}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v35}>
          <View style={s.v34}>
            <Icon xml={X5} width={24} height={24} style={s.v9} />
            <Text style={s.t31}>{"Alerts"}</Text>
            {needs.length ? (
              <View style={s.v33}>
                <Text style={s.t32}>{String(needs.length)}</Text>
              </View>
            ) : null}
          </View>
          <Tap lk="N1" style={s.v34}>
            <Icon xml={X6} width={24} height={24} style={s.v9} />
            <Text style={s.t7}>{"Live"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v34}>
            <Icon xml={X7} width={24} height={24} style={s.v9} />
            <Text style={s.t7}>{"Plans"}</Text>
          </Tap>
          <Tap lk="N3" style={s.v34}>
            <Icon xml={X8} width={24} height={24} style={s.v9} />
            <Text style={s.t7}>{"Me"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m3 11 19-9-9 19-2-8-8-2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  t1: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v2: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t3: {"color":"#0f1422","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v4: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t5: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v6: {"flexShrink":1},
  t7: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v8: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v9: {"flexShrink":0,"overflow":"hidden"},
  v10: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#fff4e0","borderRadius":14},
  t11: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t12: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v13: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t14: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v15: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v16: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"backgroundColor":"#fff4e0"},
  v17: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v18: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  v19: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  v20: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#e8f8f0","borderRadius":14},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t23: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v24: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t25: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t26: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v27: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v28: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v29: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":10,"paddingBottom":12},
  t31: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t32: {"color":"#ffffff","fontSize":11,"lineHeight":16.5,"fontFamily":"Inter_800ExtraBold"},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":5,"paddingLeft":5,"marginLeft":6,"position":"absolute","top":0,"right":19.8,"bottom":36.5,"left":43.8,"height":18,"minWidth":18,"backgroundColor":"#b42318","borderRadius":9},
  v34: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  v35: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":8,"paddingRight":12,"paddingBottom":2,"paddingLeft":12,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v36: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
