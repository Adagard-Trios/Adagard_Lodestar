// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-02 Order status & ETA · phone (P1, phone)
import { Fragment } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import { today, useClaims, useOrder } from '@/model/hooks';
import { STEPS, timeline } from '@/model/store-face';
import { Frame, Icon, Scroll, Tap, type ScreenNav } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L16":{"to":"sm-03-confirm-receipt-count","kind":"go"},"L52":{"to":"sm-16-why-this-window-sheet","kind":"go"},"L53":{"to":"sm-15-order-detail","kind":"go"},"N0":{"to":"sm-11-today-order-day","kind":"nav"},"N1":{"to":"sm-12-orders","kind":"nav"},"N2":{"to":"sm-19-receipts-and-credit-notes","kind":"nav"},"N3":{"to":"sm-21-messages","kind":"nav"}}};

export default function ScreenSm02OrderStatusAndEta() {
  const claims = useClaims();
  const q = useOrder();
  const day = q.day.data;
  const order = q.data ?? day?.orders.find(o => o.id === q.id) ?? null;
  const outlet = order?.outlet ?? day?.outlet ?? null;
  const st = order?.tripStop ?? null;
  const date = isoDay(order?.runDate);
  const sameDay = (day?.orders ?? []).filter(o => isoDay(o.runDate) === date);
  const chilled = sameDay.find(o => o.tempClass === 'CHILLED');
  const def = order?.deferralLog ?? null;
  const late = (st?.lateRiskPct ?? 0) >= 50;
  const band = st?.etaModelBandEarly && st.etaModelBandLate ? `${hm(st.etaModelBandEarly)}–${hm(st.etaModelBandLate)}` : '';
  const { reached, times } = timeline(order);
  const delivered = order?.status === 'DELIVERED';
  const heading = !order ? (!claims ? 'Sign in to see your delivery' : q.loading || q.day.loading ? 'Loading…' : 'No order yet') : st?.arrivalActual ? `Arrived ${hm(st.arrivalActual)} · you're stop ${st.stopSeq}` : st ? `Arriving · you're stop ${st.stopSeq}` : `${titleCase(order.status)} · not on a trip yet`;
  const etaLine = st?.etaModel ? `ETA ~${hm(st.etaModel)}` : 'ETA —';
  const planLine = st?.etaPlan ? ` · plan ${hm(st.etaPlan)}` : '';
  const riskLine = st?.lateRiskPct !== undefined && st?.lateRiskPct !== null ? ` · late risk ${st.lateRiskPct}%` : '';
  const updated = q.updatedAt ? `${q.fromCache ? 'Saved on this phone' : 'Updated'} ${hm(new Date(q.updatedAt).toISOString())}` : '';
  const say = order ? [heading, band ? `window ${band}` : '', `${etaLine}${planLine}`, st?.etaModel ? (late ? 'running late' : 'on time') : '', riskLine.replace(' · ', ''), def ? `Deferred: ${def.reason}` : '', `Status ${titleCase(order.status)}`].filter(Boolean).join('. ') : 'No order to read yet';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v59}>
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
            <Text style={s.t7} numberOfLines={1} testID="order-status">{order ? titleCase(order.status) : '—'}</Text>
          </View>
        </View>
        <Scroll style={s.v55} contentStyle={s.v56}>
          <View style={s.v20}>
            <View>
              <Text style={s.t4}>{heading}</Text>
            </View>
            <Tap lk="L52">
              <Text style={s.t10} testID="eta-band">{band || (st?.etaModel ? `~${hm(st.etaModel)}` : '—')}</Text>
            </Tap>
            <View>
              <Text style={s.t13}>{etaLine.startsWith('ETA ~') ? 'ETA ' : etaLine}{st?.etaModel ? <Text style={s.t11}>{`~${hm(st.etaModel)}`}</Text> : null}{planLine}{st?.etaModel ? ' · ' : ''}{st?.etaModel ? <Text style={s.t12}>{late ? 'running late' : 'on time'}</Text> : null}{riskLine}</Text>
            </View>
            {updated ? (
              <View style={s.v15}>
                <Icon xml={X1} width={14} height={14} style={s.v1} />
                <Text style={s.t14} numberOfLines={1}>{updated}</Text>
              </View>
            ) : null}
            <Tap say={say} style={s.v19}>
              <View style={s.v17}>
                <Icon xml={X2} width={20} height={20} style={s.v1} />
                <Text style={s.t16} numberOfLines={1}>{"Read aloud"}</Text>
              </View>
              <View style={s.v18}>
                <Text style={s.t4}>{"English · works offline"}</Text>
              </View>
            </Tap>
          </View>
          <View style={s.v37}>
            <View style={s.v25}>
              <View style={s.v18}>
                <Text style={s.t22}>{"Get ready to receive"}</Text>
              </View>
              <Tap lk="L16" style={s.v24} to={order ? { to: 'sm-03-confirm-receipt-count', params: { order: order.id } } : undefined}>
                <Text style={s.t23} numberOfLines={1}>{"Start count"}</Text>
                <Icon xml={X3} width={14} height={14} style={s.v1} />
              </Tap>
            </View>
            <View style={s.v36}>
              <View style={s.v29}>
                <View style={s.v26}>
                  <Icon xml={X4} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v28}>
                  <View>
                    <Text style={s.t27}>{st?.etaModelBandEarly ? `Staff at the door from ${hm(st.etaModelBandEarly)}` : outlet ? `Staff at the door from ${outlet.windowOpen}` : 'Staff at the door for the window'}</Text>
                  </View>
                </View>
              </View>
              {chilled ? (
                <View style={s.v34}>
                  <View style={s.v30} />
                  <View style={s.v28}>
                    <View>
                      <Text style={s.t27}>{"Chilled first, to the cold room"}</Text>
                    </View>
                    <View style={s.v33}>
                      <View style={s.v32}>
                        <Icon xml={X5} width={14} height={14} style={s.v1} />
                        <Text style={s.t31} numberOfLines={1}>{chilled.id}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
              <View style={s.v34}>
                <View style={s.v30} />
                <View style={s.v28}>
                  <View>
                    <Text style={s.t27}>{outlet?.dockType ? `${titleCase(outlet.dockType)} dock open` : 'Dock open'}</Text>
                  </View>
                  {outlet?.accessNote || outlet?.parking ? (
                    <View style={s.v33}>
                      <Text style={s.t35}>{outlet.accessNote ?? outlet.parking}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
          {def ? (
            <View style={s.v41} testID="deferral">
              <Icon xml={X6} width={20} height={20} style={s.v38} />
              <View style={s.v40}>
                <View>
                  <Text style={s.t39}>{`${titleCase(def.status)} deferral · ${def.reason}`}</Text>
                </View>
                <View>
                  <Text style={s.t13}>{[def.rescheduledDate ? `moved to ${dayLabel(isoDay(def.rescheduledDate))}` : '', def.notes ?? ''].filter(Boolean).join(' · ') || 'Dispatch will confirm the new day'}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <Tap lk="L53" style={s.v54} to={order ? { to: 'sm-15-order-detail', params: { order: order.id } } : undefined}>
            <View style={s.v53}>
              <View style={s.v52}>
                {STEPS.map((step, i) => {
                  const done = i < reached || (i === reached && delivered);
                  const current = i === reached && !done;
                  return (
                    <Fragment key={step.status}>
                      {i > 0 ? <View style={i <= reached ? s.v46 : s.v49} /> : null}
                      <View style={s.v45}>
                        {done ? (
                          <View style={s.v42}>
                            <Icon xml={X7} width={12} height={12} style={s.v1} />
                          </View>
                        ) : current ? (
                          <View style={s.v47}>
                            <Icon xml={X8} width={12} height={12} style={s.v1} />
                          </View>
                        ) : (
                          <View style={s.v50} />
                        )}
                        <View>
                          <Text style={done ? s.t43 : current ? s.t48 : s.t51}>{step.label}</Text>
                        </View>
                        <View>
                          <Text style={s.t44}>{times[i] || ' '}</Text>
                        </View>
                      </View>
                    </Fragment>
                  );
                })}
              </View>
            </View>
          </Tap>
        </Scroll>
        <View style={s.v58}>
          <Tap lk="N0" style={s.v57}>
            <Icon xml={X9} width={22} height={22} style={s.v1} />
            <Text style={s.t23}>{"Today"}</Text>
          </Tap>
          <Tap lk="N1" style={s.v57}>
            <Icon xml={X10} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Orders"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v57}>
            <Icon xml={X11} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Receipts"}</Text>
          </Tap>
          <Tap lk="N3" style={s.v57}>
            <Icon xml={X12} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Messages"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M12 9v4M12 17h.01\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"7\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"17\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X10 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X11 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X12 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

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
  t10: {"color":"#101828","fontSize":46,"lineHeight":46,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t11: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t12: {"color":"#047857","fontFamily":"Inter_700Bold"},
  t13: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  t14: {"color":"#57534e","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v15: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5},
  t16: {"color":"#3b4cca","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v17: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":16,"paddingLeft":14,"height":44,"backgroundColor":"#eef0ff","borderRadius":22},
  v18: {"flexShrink":1},
  v19: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10},
  v20: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":16,"paddingRight":20,"marginRight":16,"paddingBottom":16,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t21: {"color":"#636c80","fontFamily":"Inter_600SemiBold"},
  t22: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t23: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v24: {"flexDirection":"row","alignItems":"center","rowGap":4,"columnGap":4,"flexShrink":1,"paddingRight":10,"paddingLeft":12,"height":30,"backgroundColor":"#eef0ff","borderRadius":15},
  v25: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v26: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  t27: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  v28: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v29: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":56},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"borderRadius":14,"boxShadow":"rgb(211, 216, 227) 0px 0px 0px 2.5px inset"},
  t31: {"color":"#0e7490","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v33: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v34: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t35: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v36: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v37: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v38: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t39: {"color":"#b45309","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v40: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v41: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#fff4e0","borderRadius":18},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t43: {"color":"#101828","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t44: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v45: {"flexDirection":"column","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"width":66},
  v46: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#047857"},
  v47: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#0369a1","borderWidth":2,"borderColor":"#0369a1","borderRadius":11,"boxShadow":"rgb(230, 244, 252) 0px 0px 0px 5px, rgba(3, 105, 161, 0.3) 0px 4px 10px 0px"},
  t48: {"color":"#0369a1","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_800ExtraBold"},
  v49: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#d3d8e3"},
  v50: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#d3d8e3","borderRadius":11},
  t51: {"color":"#636c80","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v52: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1},
  v53: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":16,"paddingRight":10,"paddingBottom":14,"paddingLeft":10},
  v54: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v55: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v56: {"flexDirection":"column","alignItems":"stretch","rowGap":12,"columnGap":12,"paddingTop":4,"paddingBottom":10},
  v57: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  v58: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":6,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v59: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
