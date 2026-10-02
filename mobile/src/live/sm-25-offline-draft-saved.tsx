// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-25 Offline draft saved · phone (P1, phone)
// SM-14 opens this when the orders are submitted with no signal (route param `runDate`): the ORDER writes waiting
// in the outbox, the cut-off count-down, and "Try sending now" (the outbox sync). Once everything is sent it goes
// on to "Received" (SM-01).
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel } from '@/lib/time';
import { useClaims, useOnline, useOutbox, useParam, useStoreDay } from '@/model/hooks';
import { depotName } from '@/model/plan';
import { sendNow } from '@/model/run';
import { cutoffFor, left, nextRunDate, useNow } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L108":{"to":"sm-01-received","kind":"go"},"L109":{"to":"sm-13-new-order","kind":"go"},"B":{"to":"sm-11-today-order-day","kind":"back"}}};

/** 2:35 PM (Colombo). */
function clock12(iso?: string): string {
  const ms = Date.parse(iso ?? '');
  if (!Number.isFinite(ms)) return '';
  const d = new Date(ms + 330 * 60_000);
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function ScreenSm25OfflineDraftSaved() {
  const claims = useClaims();
  const online = useOnline();
  const now = useNow();
  const runDate = useParam('runDate') ?? nextRunDate(now);
  const day = useStoreDay();
  const outlet = day.data?.outlet ?? null;
  const { items } = useOutbox();
  const drafts = items.filter(i => i.kind === 'ORDER' && (i.status === 'pending' || i.status === 'sending' || i.status === 'conflict') && i.payload.order?.runDate === runDate);
  const units = drafts.reduce((n, i) => n + (i.payload.order.units ?? 0), 0);
  const savedAt = drafts.map(i => i.savedAt).sort().at(-1);
  const cutoff = cutoffFor(runDate);
  const remaining = left(cutoff, now);
  const hub = outlet ? depotName(outlet.depot) : 'the depot';

  const trySend = async () => {
    if (!claims || !drafts.length) return true; // nothing waiting: on to "Received"
    showToast(await sendNow());
    return online; // sent: on to "Received"; no signal: stay with the drafts
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v44}>
        <View style={s.v7}>
          <Tap lk="B" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Review"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{`${dayLabel(runDate)}${outlet ? ` · ${hub} run` : ''}`}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v36} contentStyle={s.v37}>
          {!online ? (
            <View style={s.v12}>
              <Icon xml={X1} width={20} height={20} style={s.v8} />
              <View style={s.v11}>
                <View>
                  <Text style={s.t9}>{"No internet at the store"}</Text>
                </View>
                <View>
                  <Text style={s.t10}>{"Your orders are safe on this phone."}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v19}>
            <View style={s.v16}>
              <View style={s.v13}>
                <Text style={s.t4} testID="draft-saved">{drafts.length ? `Saved as a draft · ${clock12(savedAt)}` : !claims ? 'Sign in to see your orders' : 'Nothing waiting to send'}</Text>
              </View>
              {drafts.length ? (
                <View style={s.v15}>
                  <Icon xml={X2} width={14} height={14} style={s.v1} />
                  <Text style={s.t14} numberOfLines={1}>{"Not sent"}</Text>
                </View>
              ) : null}
            </View>
            <View>
              <Text style={s.t18}>{String(units)}<Text style={s.t17}>{units === 1 ? 'unit' : "units"}</Text></Text>
            </View>
            <View>
              <Text style={s.t10}>{"Sends by itself the moment you're back online."}</Text>
            </View>
          </View>
          {drafts.length ? (
            <View style={s.v30}>
              {drafts.map((i, n) => {
                const o = i.payload.order;
                const chilled = o.tempClass === 'CHILLED';
                return (
                  <View key={i.id} style={n === 0 ? s.v27 : s.v29} testID={`draft-${n}`}>
                    <View style={chilled ? s.v28 : s.v20}>
                      <Icon xml={chilled ? X4 : X3} width={22} height={22} style={s.v1} />
                    </View>
                    <View style={s.v24}>
                      <View>
                        <Text style={s.t21}>{chilled ? 'Chilled order' : "Dry order"}</Text>
                      </View>
                      <View style={s.v23}>
                        <View style={s.v15}>
                          <Text style={s.t22} numberOfLines={1}>{i.status === 'conflict' ? 'Needs a look' : "Draft"}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.v26}>
                      <View>
                        <Text style={s.t25}>{String(o.units)}</Text>
                      </View>
                      <View>
                        <Text style={s.t4}>{`${round1(o.kg)} kg`}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
          <View style={s.v35}>
            <View style={s.v34}>
              <View style={s.v32}>
                <Icon xml={X5} width={18} height={18} style={s.v1} />
                <Text style={s.t31}>{"Orders close at 4:00 PM"}</Text>
              </View>
              <View style={s.v13}>
                <Text style={s.t33}>{remaining || 'closed'}</Text>
              </View>
            </View>
            <View>
              <Text style={s.t10}>{`Still offline at ${clock12(new Date(cutoff - 30 * 60_000).toISOString())}? Call ${hub} and read out the draft.`}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v43}>
          <Tap lk="L108" style={s.v40} onPress={trySend} to={{ to: 'sm-01-received', params: { runDate } }}>
            <Grad g={G0} style={s.v38} />
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t39}>{"Try sending now"}</Text>
          </Tap>
          <Tap lk="L109" style={s.v42}>
            <Text style={s.t41}>{"Keep editing"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M12 12v9M8 16l4-4 4 4\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 12a9 9 0 1 1-3-6.7L21 8\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 3v5h-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":0,"width":40},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v8: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t9: {"color":"#57534e","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t10: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v12: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":18},
  v13: {"flexShrink":1},
  t14: {"color":"#57534e","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v15: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1,"paddingRight":9,"paddingLeft":9,"height":24,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":12},
  v16: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t17: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t18: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v19: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v20: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#eff1f7","borderRadius":14},
  t21: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t22: {"color":"#57534e","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_700Bold"},
  v23: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t25: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v26: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v27: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f7fb","borderRadius":14},
  v29: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v30: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t31: {"color":"#b45309","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":1},
  t33: {"color":"#b45309","fontSize":24,"lineHeight":36,"letterSpacing":-0.5,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v34: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":16,"paddingRight":18,"marginRight":16,"paddingBottom":16,"paddingLeft":18,"marginLeft":16,"backgroundColor":"#fff4e0","borderRadius":18},
  v36: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v37: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v38: {"borderRadius":18},
  t39: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v40: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t41: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v44: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
