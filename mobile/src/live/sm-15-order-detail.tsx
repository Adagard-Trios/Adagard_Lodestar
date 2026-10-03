// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-15 Order detail · phone (P1, phone)
// "Call <depot>" is left out: no depot phone number is in the data the store can read.
import { Fragment } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import { useClaims, useNotifications, useOrder } from '@/model/hooks';
import { shortfallsFor, timeline, useTrip } from '@/model/store-face';
import { Frame, Icon, Scroll, Tap, type ScreenNav } from '@/lodestar/runtime';
import { useDepots } from '@/model/depots';

const nav: ScreenNav = {"links":{"L90":{"to":"sm-02-order-status-and-eta","kind":"go"}}};

type Step = { label: string; time: string; sub: string; state: 'done' | 'warn' | 'now' | 'next' };

const kg = (n: number) => `${Math.round(n * 10) / 10} kg`;

export default function ScreenSm15OrderDetail() {
  const { name: depotName } = useDepots();
  const claims = useClaims();
  const q = useOrder();
  const order = q.data ?? q.day.data?.orders.find(o => o.id === q.id) ?? null;
  const outlet = order?.outlet ?? q.day.data?.outlet ?? null;
  const st = order?.tripStop ?? null;
  const trip = useTrip(st?.tripId).data ?? null;
  const notes = useNotifications().data;
  const shorts = shortfallsFor(notes, order?.id);
  const shortUnits = shorts.reduce((n, f) => n + (f.short ?? 0), 0);
  const lines = order?.lineItems ?? [];
  const lineKg = lines.reduce((n, l) => n + l.kg, 0);
  const shortNames = new Set(shorts.map(f => f.item));
  const others = lines.filter(l => !shortNames.has(l.name));
  const { reached, times } = timeline(order);
  const loadedYet = reached >= 2 || !!trip?.departTime;
  const empty = !claims ? 'Sign in to see this order' : q.loading || q.day.loading ? 'Loading…' : 'No order selected';
  const window = st?.etaModelBandEarly && st.etaModelBandLate ? `${hm(st.etaModelBandEarly)}–${hm(st.etaModelBandLate)}` : outlet ? `${outlet.windowOpen}–${outlet.windowClose}` : '';
  const reefer = trip?.reeferTempC !== null && trip?.reeferTempC !== undefined ? `reefer at ${trip.reeferTempC} °C` : '';
  const steps: Step[] = order
    ? [
        { label: 'Received', time: times[0] ? `${dayLabel(order.orderedAt)} ${times[0]}` : '', sub: `You submitted ${plural(order.units, 'unit')}${lines.length ? `, ${plural(lines.length, 'line')}` : ''}`, state: 'done' },
        { label: 'Planned', time: '', sub: [trip?.vehicleId ?? '', trip ? `Trip ${trip.tripNumber}` : '', window ? `window ${window}` : ''].filter(Boolean).join(' · ') || 'Not on a trip yet', state: reached >= 1 ? 'done' : 'now' },
        ...shorts.map((f): Step => ({
          label: 'Short at loading',
          time: hm(f.at),
          sub: [`${f.item}${f.qtyLoaded !== undefined && f.qtyOrdered !== undefined ? `, ${f.qtyLoaded} of ${f.qtyOrdered}` : ''}`, f.reason ? titleCase(f.reason) : ''].filter(Boolean).join(' · '),
          state: 'warn',
        })),
        { label: 'Loaded', time: '', sub: trip ? [trip.bay ? `${depotName(trip.depot)} Bay ${trip.bay}` : depotName(trip.depot), reefer, trip.sealNumber ? `seal ${trip.sealNumber}` : ''].filter(Boolean).join(' · ') : '', state: reached >= 2 ? 'done' : reached === 1 ? 'now' : 'next' },
        { label: 'En route', time: reached >= 3 && trip?.departTime ? hm(trip.departTime) : '', sub: st ? [`You're stop ${st.stopSeq}`, st.etaModel ? `ETA ~${hm(st.etaModel)}${st.etaPlan ? ` (plan ${hm(st.etaPlan)})` : ''}` : ''].filter(Boolean).join(' · ') : '', state: reached > 3 ? 'done' : reached === 3 ? 'now' : 'next' },
        { label: 'Delivered', time: times[4], sub: reached >= 4 ? 'Confirm your count' : 'Then confirm your count', state: reached >= 4 ? 'done' : 'next' },
      ]
    : [];
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v58}>
        <View style={s.v9}>
          <Tap lk="L90" style={s.v2} to={order ? { to: 'sm-02-order-status-and-eta', params: { order: order.id } } : undefined}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{order ? `${order.tempClass === 'CHILLED' ? 'Chilled' : 'Dry'} order` : 'Order'}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1} testID="order-id">{order ? `${order.id} · ${dayLabel(isoDay(order.runDate))}` : empty}</Text>
            </View>
          </View>
          {order ? (
            <View style={s.v8}>
              <View style={s.v6} />
              <Text style={s.t7} numberOfLines={1}>{titleCase(order.status)}</Text>
            </View>
          ) : null}
        </View>
        <Scroll style={s.v53} contentStyle={s.v54}>
          <View style={s.v18}>
            <View style={s.v15}>
              <View style={s.v12}>
                <View>
                  <Text style={s.t4}>{trip ? `On the van · ${trip.vehicleId}` : order ? titleCase(order.status) : '—'}</Text>
                </View>
                <View>
                  <Text style={s.t11} testID="units">{order ? String(order.units - shortUnits) : '—'}<Text style={s.t10}>{order ? `of ${order.units}` : ''}</Text></Text>
                </View>
              </View>
              {order ? (
                <View style={s.v14}>
                  <Icon xml={X1} width={14} height={14} style={s.v1} />
                  <Text style={s.t13} numberOfLines={1}>{order.tempClass === 'CHILLED' ? 'Chilled' : 'Dry'}</Text>
                </View>
              ) : null}
            </View>
            {shorts.length ? (
              <View>
                <Text style={s.t17}><Text style={s.t16}>{`${shorts.map(f => `${f.short ?? ''} ${f.item}`.trim()).join(', ')} short`}</Text>{" at loading."}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.v39}>
            <View style={s.v22}>
              <View style={s.v20}>
                <Text style={s.t19}>{"Order thread"}</Text>
              </View>
              <View style={s.v20}>
                <Text style={s.t21}>{"every step, one record"}</Text>
              </View>
            </View>
            <View style={s.v38}>
              <View style={s.v37}>
                {steps.map((step, i) => {
                  const last = i === steps.length - 1;
                  return (
                    <View key={`${step.label}-${i}`} style={s.v31} testID={`step-${i}`}>
                      <View style={s.v25}>
                        {step.state === 'next' ? (
                          <Fragment>
                            <View style={s.v35} />
                            {last ? null : <View style={s.v34} />}
                          </Fragment>
                        ) : (
                          <Fragment>
                            <View style={step.state === 'warn' ? s.v32 : step.state === 'now' ? s.v33 : s.v23}>
                              <Icon xml={step.state === 'warn' ? X3 : step.state === 'now' ? X4 : X2} width={13} height={13} style={s.v1} />
                            </View>
                            {last ? null : <View style={step.state === 'now' ? s.v34 : s.v24} />}
                          </Fragment>
                        )}
                      </View>
                      <View style={last ? s.v36 : s.v30}>
                        <View style={s.v28}>
                          <View style={s.v20}>
                            <Text style={s.t3}>{step.label}</Text>
                          </View>
                          {step.time ? (
                            <View style={s.v27}>
                              <Text style={s.t26} numberOfLines={1}>{step.time}</Text>
                            </View>
                          ) : null}
                        </View>
                        {step.sub ? (
                          <View>
                            <Text style={s.t29}>{step.sub}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={s.v39}>
            <View style={s.v22}>
              <View style={s.v20}>
                <Text style={s.t19}>{"Lines"}</Text>
              </View>
              <View style={s.v20}>
                <Text style={s.t21}>{order ? `${plural(lines.length, 'line')} · ${kg(lineKg || order.kg)}` : '—'}</Text>
              </View>
            </View>
            <View style={s.v38}>
              {shorts.map((f, i) => (
                <View key={f.id} style={i > 0 ? [s.v48, x.border] : s.v48}>
                  <View style={s.v41}>
                    <Text style={s.t40}>{f.short !== undefined ? `−${f.short}` : '!'}</Text>
                  </View>
                  <View style={s.v47}>
                    <View>
                      <Text style={s.t42}>{f.item}</Text>
                    </View>
                    <View style={s.v46}>
                      <Text style={s.t43}>{f.qtyLoaded !== undefined && f.qtyOrdered !== undefined ? `${f.qtyLoaded} of ${f.qtyOrdered}` : 'Short'}</Text>
                      {f.reason ? <View style={s.v44} /> : null}
                      {f.reason ? (
                        <View style={s.v14}>
                          <Text style={s.t45} numberOfLines={1}>{titleCase(f.reason)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
              {others.length ? (
                <View style={shorts.length ? s.v52 : [s.v52, x.first]}>
                  <View style={s.v49}>
                    <Icon xml={X5} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v47}>
                    <View>
                      <Text style={s.t42}>{`${shorts.length ? `${others.length} other ${others.length === 1 ? 'line' : 'lines'}` : plural(others.length, 'line')}${loadedYet ? ', all loaded' : ''}`}</Text>
                    </View>
                    <View style={s.v46}>
                      <Text style={s.t43}>{others.map(l => l.name).join(', ')}</Text>
                    </View>
                  </View>
                  <View style={s.v51}>
                    <View>
                      <Text style={s.t50}>{String(others.reduce((n, l) => n + l.qty, 0))}</Text>
                    </View>
                    <View>
                      <Text style={s.t4}>{"units"}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </Scroll>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({ first: { borderTopWidth: 0 }, border: { borderTopWidth: 1, borderTopColor: '#eceef3' } });

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M12 9v4M12 17h.01\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M9 17h6\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"7\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"17\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#0369a1","borderRadius":3.5},
  t7: {"color":"#0369a1","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e6f3fb","borderRadius":14},
  v9: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t10: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t11: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v12: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":1},
  t13: {"color":"#0e7490","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v14: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v15: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  t16: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t17: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v18: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t19: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexShrink":1},
  t21: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v22: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v23: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#047857","borderRadius":12},
  v24: {"flexGrow":1,"flexBasis":"0%","marginTop":3,"marginBottom":3,"width":2,"minHeight":10,"backgroundColor":"#047857","borderRadius":1},
  v25: {"flexDirection":"column","alignItems":"center","flexShrink":0,"width":24},
  t26: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v27: {"flexShrink":0},
  v28: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","rowGap":10,"columnGap":10},
  t29: {"color":"#475467","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":1,"paddingBottom":16},
  v31: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12},
  v32: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#b45309","borderRadius":12},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#0369a1","borderRadius":12,"boxShadow":"rgb(230, 244, 252) 0px 0px 0px 4px"},
  v34: {"flexGrow":1,"flexBasis":"0%","marginTop":3,"marginBottom":3,"width":2,"minHeight":10,"backgroundColor":"#d3d8e3","borderRadius":1},
  v35: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#ffffff","borderRadius":12,"boxShadow":"rgb(211, 216, 227) 0px 0px 0px 2px inset"},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":1,"paddingBottom":12},
  v37: {"flexDirection":"column","alignItems":"stretch","paddingTop":16,"paddingRight":16,"paddingBottom":4,"paddingLeft":16},
  v38: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v39: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  t40: {"color":"#b45309","fontSize":16,"lineHeight":24,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#fff4e0","borderRadius":14},
  t42: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t43: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v44: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  t45: {"color":"#b45309","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v46: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v47: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v48: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  v49: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  t50: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v51: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v52: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v53: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v54: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  t55: {"color":"#101828","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v56: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 2px 0px"},
  v57: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v58: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
