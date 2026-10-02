// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-A1 Store · in progress, low signal · phone (P5, phone)
// Dead zone (P5): the store's delivery in progress while its van has no signal. The server sends signal_lost /
// signal_back only to stores still waiting on that trip; the last one decides the state. "Confirm my receipt" opens
// the store's own count (the design's next step, DR-A3, is on the driver's phone). No phone numbers are in the
// store's data, so "Call driver" / "Call dispatch" are left out.
import { Fragment } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { today, useClaims, useParam } from '@/model/hooks';
import { STEPS, signalByTrip, signalLostFor, timeline, useDelivery, useTrip } from '@/model/store-face';
import { notices } from '@/realtime/notices';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L27":{"to":"sm-03-confirm-receipt-count","kind":"go"}}};

export default function ScreenSmA1StoreInProgressLowSignal() {
  const claims = useClaims();
  const param = useParam('order');
  const tripParam = useParam('trip');
  const d = useDelivery();
  const live = useStore(notices);
  const signals = signalByTrip(live);
  const orders = d.delivery?.orders ?? [];
  const open = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const order = orders.find(o => o.id === param) ?? open.find(o => o.tripStop?.tripId === tripParam) ?? open[0] ?? orders[0] ?? null;
  const st = order?.tripStop ?? null;
  const trip = useTrip(st?.tripId).data ?? null;
  const lost = signalLostFor(signals, st?.tripId);
  const vans = new Set(orders.map(o => o.tripStop?.tripId).filter(Boolean)).size;
  const window = st?.etaModelBandEarly && st.etaModelBandLate ? `${hm(st.etaModelBandEarly)}–${hm(st.etaModelBandLate)}` : d.outlet ? `${d.outlet.windowOpen}–${d.outlet.windowClose}` : '—';
  const { reached, times } = timeline(order);
  const date = isoDay(order?.runDate);
  const stepTime = (i: number) => {
    if (i === 0) return order ? `${dayLabel(order.orderedAt).split(' ')[0]} ${times[0]}` : '·';
    if (i === 3) return lost ? `last ${hm(lost.at)}` : reached >= 3 && trip?.departTime ? hm(trip.departTime) : '·';
    if (i === 4) return times[4] || '·';
    return reached >= i ? '' : '·';
  };
  const heading = !claims ? 'Sign in to see your delivery' : !order ? (d.loading ? 'Loading…' : 'No delivery in progress') : order.status === 'DELIVERED' ? 'Delivered' : 'Delivery in progress';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v50}>
        <View style={s.v7}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v5}>
            <Text style={s.t4}>{d.outlet ? `${d.outlet.district} · ` : ''}<Text style={s.t3}>{d.outlet?.id ?? claims?.outletId ?? ''}</Text></Text>
          </View>
          <View style={s.v6}>
            <Icon xml={X1} width={20} height={20} style={s.v1} />
          </View>
        </View>
        <Scroll style={s.v5} contentStyle={s.v42}>
          <View style={s.v14}>
            <View style={s.v12}>
              <Text style={s.t8}>{date === today() ? 'Today' : date ? dayLabel(date) : 'Today'}</Text>
              {orders.length ? <View style={s.v9} /> : null}
              {orders.map((o, i) => (
                <Fragment key={o.id}>
                  {i > 0 ? <Text style={s.t8}>{"·"}</Text> : null}
                  <View style={s.v11}>
                    <Text style={s.t10}>{o.id}</Text>
                  </View>
                </Fragment>
              ))}
            </View>
            <View>
              <Text style={s.t13} testID="a1-heading">{heading}</Text>
            </View>
          </View>
          {order ? (
            <View style={s.v21}>
              <View style={s.v17}>
                <View style={s.v11}>
                  <Text style={s.t8}>{"Arrival window"}</Text>
                </View>
                {lost ? (
                  <View style={s.v16}>
                    <Icon xml={X2} width={14} height={14} style={s.v1} />
                    <Text style={s.t15} numberOfLines={1} testID="updates-paused">{"Updates paused"}</Text>
                  </View>
                ) : null}
              </View>
              <View>
                <Text style={s.t18}>{window}</Text>
              </View>
              <View>
                <Text style={s.t20}>
                  {st?.etaModel ? `Model ETA ~${hm(st.etaModel)}${st.etaPlan ? ` (plan ${hm(st.etaPlan)})` : ''}. ` : ''}
                  {lost ? 'Last heard ' : ''}
                  {lost ? <Text style={s.t19}>{`${hm(lost.at)}${lost.location ? ` near ${lost.location}` : ''}`}</Text> : null}
                  {lost ? '. The van is in a low-signal area.' : 'The van has signal.'}
                </Text>
              </View>
            </View>
          ) : null}
          {order ? (
            <View style={s.v37}>
              <View style={s.v24}>
                <View style={s.v11}>
                  <Text style={s.t22}>{`${plural(orders.length, 'order')} · ${vans <= 1 ? '1 van' : `${vans} vans`}`}</Text>
                </View>
                {trip ? (
                  <View style={s.v11}>
                    <Text style={s.t23}><Text style={s.t3}>{trip.vehicleId}</Text></Text>
                  </View>
                ) : null}
              </View>
              <View style={s.v36}>
                <View style={s.v35}>
                  <View style={s.v34}>
                    <View style={s.v25} />
                    <View style={s.v26} />
                    {STEPS.map((step, i) => {
                      // en route is the step in progress until the delivery is recorded
                      const done = i < reached || (i === reached && i !== 3);
                      const now = i === 3 && reached === 3;
                      return (
                        <View key={step.status} style={s.v30}>
                          {done ? (
                            <View style={s.v27}>
                              <Icon xml={X3} width={12} height={12} style={s.v1} />
                            </View>
                          ) : now ? (
                            <View style={s.v31}>
                              <Icon xml={X4} width={12} height={12} style={s.v1} />
                            </View>
                          ) : (
                            <View style={s.v33} />
                          )}
                          <View>
                            <Text style={done ? s.t28 : s.t32}>{step.label}</Text>
                          </View>
                          <View>
                            <Text style={s.t29}>{stepTime(i)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v41}>
            <Icon xml={X5} width={20} height={20} style={s.v38} />
            <View style={s.v40}>
              <View>
                <Text style={s.t39}>{"Van already at your door?"}</Text>
              </View>
              <View>
                <Text style={s.t20}>{"Receive and count as normal. Confirm your receipt now, and we'll match it to the driver's record when it syncs."}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v49}>
          <Tap lk="L27" style={s.v45} to={order ? { to: 'sm-03-confirm-receipt-count', params: { order: order.id } } : undefined}>
            <Grad g={G0} style={s.v43} />
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t44}>{"Confirm my receipt"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M9 17h6\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"7\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"17\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M15 5v5h4\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t4: {"color":"#101828","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v9: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  t10: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v11: {"flexShrink":1},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t13: {"color":"#101828","fontSize":22,"lineHeight":26.4,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t15: {"color":"#57534e","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  v17: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t18: {"color":"#101828","fontSize":44,"lineHeight":44,"letterSpacing":-1.3,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t19: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t20: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v21: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#fbfaf9","borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":24},
  t22: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t23: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v24: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v25: {"flexShrink":1,"position":"absolute","top":10,"right":163,"bottom":57.1,"left":32.6,"width":"40%","height":2,"backgroundColor":"#047857","borderRadius":1},
  v26: {"flexShrink":1,"position":"absolute","top":10,"right":32.6,"bottom":57.1,"left":163,"width":"40%","height":0,"borderTopWidth":2,"borderTopColor":"#a8a29e","borderStyle":"dashed","borderRadius":1},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t28: {"color":"#101828","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t29: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_400Regular"},
  v30: {"flexDirection":"column","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":0,"width":"20%","zIndex":1},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#57534e","borderStyle":"dashed","borderRadius":11},
  t32: {"color":"#636c80","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#d3d8e3","borderRadius":11},
  v34: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1,"width":"100%"},
  v35: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":12,"paddingRight":8,"paddingBottom":10,"paddingLeft":8},
  v36: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v37: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  v38: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t39: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v40: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v41: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":4,"paddingBottom":16},
  v43: {"borderRadius":18},
  t44: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v45: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t46: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v47: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":44,"borderRadius":18},
  v48: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10},
  v49: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v50: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
