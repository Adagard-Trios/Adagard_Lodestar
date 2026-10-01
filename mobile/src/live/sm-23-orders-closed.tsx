// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-23 Orders closed · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { addDays, dayLabel, hm } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { today } from '@/model/hooks';
import { nextRunDate, useDelivery, useNow } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L105":{"to":"sm-13-new-order","kind":"go"},"L106":{"to":"sm-11-today-order-day","kind":"go"}}};

// Past the 4:00 PM cut-off (Asia/Colombo): the run that just closed, and the next run an order can still make.
export default function ScreenSm23OrdersClosed() {
  const now = useNow();
  const { outlet, groups } = useDelivery();
  const next = nextRunDate(now);
  const closed = addDays(next, -1);
  const weekday = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const onVan = groups.find(g => g.date === closed)?.orders ?? [];
  const units = onVan.reduce((n, o) => n + o.units, 0);
  const firstAt = onVan.map(o => o.orderedAt).filter(Boolean).sort()[0];
  const window = outlet ? `${outlet.windowOpen}–${outlet.windowClose}` : '';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v43}>
        <View style={s.v7}>
          <Tap lk="L106" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"New order"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{`${dayLabel(today())} · ${hm(new Date(now).toISOString())}`}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v35} contentStyle={s.v36}>
          <View style={s.v12}>
            <View style={s.v8}>
              <Icon xml={X1} width={14} height={14} style={s.v1} />
              <Text style={s.t4}>{`${weekday(closed)}'s orders closed at 4:00 PM`}</Text>
            </View>
            <View>
              <Text style={s.t9}>{dayLabel(next)}</Text>
            </View>
            <View>
              <Text style={s.t11}>{"A new order now goes to the "}<Text style={s.t10}>{dayLabel(next)}</Text>{" run. Same thread, new date, stated before you submit."}</Text>
            </View>
          </View>
          <View style={s.v18}>
            <View style={s.v16}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Delivery"}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t15}>{`${dayLabel(next)}${window ? ` · ${window}` : ''}`}</Text>
              </View>
            </View>
            <View style={s.v17}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Orders close"}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t15}>{`${dayLabel(addDays(next, -1))} · 4:00 PM`}</Text>
              </View>
            </View>
          </View>
          <View style={s.v30}>
            <View style={s.v21}>
              <View style={s.v14}>
                <Text style={s.t19}>{`Already on ${weekday(closed)}'s van`}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t20}>{"not affected"}</Text>
              </View>
            </View>
            <View style={s.v29}>
              <View style={s.v28}>
                <View style={s.v22}>
                  <Icon xml={X2} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t23}>{onVan.length ? `${plural(onVan.length, 'order')}, ${units} units` : 'No orders'}</Text>
                  </View>
                  <View style={s.v26}>
                    <Text style={s.t24}>{firstAt ? `Received ${hm(firstAt)}` : ' '}</Text>
                    <View style={s.v25} />
                    <Text style={s.t24}>{"window by 7 PM"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={s.v34}>
            <Icon xml={X3} width={20} height={20} style={s.v31} />
            <View style={s.v33}>
              <View>
                <Text style={s.t32}>{"Something urgent for tomorrow?"}</Text>
              </View>
              <View>
                <Text style={s.t11}>{"Call Kandy Hub. They add it only if the van has space."}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v42}>
          <Tap lk="L105" style={s.v39}>
            <Grad g={G0} style={s.v37} />
            <Text style={s.t38}>{`Start ${dayLabel(next)} order`}</Text>
          </Tap>
          <View style={s.v41}>
            <Text style={s.t40}>{"Back to Today"}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 6 6 18M6 6l12 12\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
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
  v8: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t9: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t10: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t11: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v12: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":24},
  t13: {"color":"#475467","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_400Regular"},
  v14: {"flexShrink":1},
  t15: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48},
  v17: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v18: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t19: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t20: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v21: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v22: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  t23: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t24: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v25: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  v26: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v27: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v28: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  v29: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v31: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t32: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v33: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v34: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v35: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v37: {"borderRadius":18},
  t38: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v39: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t40: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v43: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
