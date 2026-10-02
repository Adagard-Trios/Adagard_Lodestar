// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-11 Today · order day · phone (P1, phone)
import { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import { today, useClaims, useOutbox } from '@/model/hooks';
import { byClass, cutoffFor, initials, left, nextRunDate, receiptFor, totals, useDelivery, useNow, useOrderDraft } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, openScreen, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L78":{"to":"sm-13-new-order","kind":"go"},"L80":{"to":"sm-22-profile-and-settings","kind":"go"},"N1":{"to":"sm-12-orders","kind":"nav"},"N2":{"to":"sm-19-receipts-and-credit-notes","kind":"nav"},"N3":{"to":"sm-21-messages","kind":"nav"}}};

export default function ScreenSm11TodayOrderDay() {
  const claims = useClaims();
  const { outlet, delivery, isToday, loading, error, data } = useDelivery();
  // no order for today: the Today tab is "No delivery today" (SM-24)
  const noDelivery = !!claims && data !== undefined && !isToday;
  useEffect(() => {
    if (noDelivery) openScreen('sm-24-no-delivery-today', undefined, 'nav');
  }, [noDelivery]);
  const { draft, template } = useOrderDraft();
  const { items } = useOutbox();
  const now = useNow();
  const runDate = nextRunDate(now);
  const cutoff = cutoffFor(runDate);
  const remaining = left(cutoff, now);
  const pct = Math.max(4, Math.min(100, Math.round((1 - (cutoff - now) / 86_400_000) * 100)));
  const lines = draft?.lines ?? template.data?.lines ?? [];
  const { dry, chilled } = byClass(lines);
  const tDry = totals(dry);
  const tChilled = totals(chilled);
  const fromDay = draft ? 'your draft' : template.data?.runDate ? `from ${dayLabel(template.data.runDate)}` : '';
  const dOrders = delivery?.orders ?? [];
  const dUnits = dOrders.reduce((n, o) => n + o.units, 0);
  const first = dOrders[0];
  const receipts = dOrders.map(o => receiptFor(items, o.id)).filter(Boolean);
  const received = receipts.reduce((n, r) => n + Number(r!.payload.unitsReceived ?? 0), 0);
  const arrived = dOrders.map(o => o.tripStop?.arrivalActual).find(Boolean);
  const eta = dOrders.map(o => o.tripStop?.etaModel).find(Boolean);
  const delivered = dOrders.length > 0 && dOrders.every(o => o.status === 'DELIVERED');
  const status = !claims ? 'Sign in to see your store' : loading && !delivery ? 'Loading…' : error && !delivery ? 'No signal · nothing saved yet' : '';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v53}>
        <View style={s.v8}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{`Today · ${dayLabel(today())}`}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1} testID="store-outlet">{outlet ? `${outlet.name} · ${outlet.id}` : claims?.outletId ?? status ?? '—'}</Text>
            </View>
          </View>
          <Tap lk="L80" style={s.v7}>
            <Text style={s.t6}>{initials(claims?.name)}</Text>
          </Tap>
        </View>
        <Scroll style={s.v44} contentStyle={s.v45}>
          <View style={s.v18}>
            <Grad g={G0} style={s.v9} />
            <View>
              <Text style={s.t10}>{`Order for ${dayLabel(runDate)} closes at 4:00 PM`}</Text>
            </View>
            <View>
              <Text style={s.t12} testID="cutoff-left">{remaining || 'Closed'}<Text style={s.t11}>{remaining ? 'left' : ''}</Text></Text>
            </View>
            <View style={s.v15}>
              <View style={[s.v14, { width: `${pct}%` }]}>
                <Grad g={G1} style={s.v13} />
              </View>
            </View>
            <View>
              <Text style={s.t17}>{"After 4:00 PM it goes to the "}<Text style={s.t16}>{dayLabel(nextRunDate(cutoff + 60_000))}</Text>{" run"}</Text>
            </View>
          </View>
          <View style={s.v35}>
            <View style={s.v22}>
              <View style={s.v20}>
                <Text style={s.t19}>{"Ready for you"}</Text>
              </View>
              <View style={s.v20}>
                <Text style={s.t21}>{fromDay}</Text>
              </View>
            </View>
            <View style={s.v34}>
              <View style={s.v31}>
                <View style={s.v23}>
                  <Icon xml={X1} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v28}>
                  <View>
                    <Text style={s.t24}>{"Dry order"}</Text>
                  </View>
                  <View style={s.v27}>
                    <Text style={s.t25}>{plural(tDry.lines, 'line')}</Text>
                    <View style={s.v26} />
                    <Text style={s.t25}>{`${tDry.kg} kg`}</Text>
                  </View>
                </View>
                <View style={s.v30}>
                  <View>
                    <Text style={s.t29}>{String(tDry.units)}</Text>
                  </View>
                  <View>
                    <Text style={s.t4}>{"units"}</Text>
                  </View>
                </View>
              </View>
              <View style={s.v33}>
                <View style={s.v32}>
                  <Icon xml={X2} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v28}>
                  <View>
                    <Text style={s.t24}>{"Chilled order"}</Text>
                  </View>
                  <View style={s.v27}>
                    <Text style={s.t25}>{plural(tChilled.lines, 'line')}</Text>
                    <View style={s.v26} />
                    <Text style={s.t25}>{`${tChilled.kg} kg`}</Text>
                  </View>
                </View>
                <View style={s.v30}>
                  <View>
                    <Text style={s.t29}>{String(tChilled.units)}</Text>
                  </View>
                  <View>
                    <Text style={s.t4}>{"units"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          {draft ? (
            <View style={s.v40} testID="draft-banner">
              <Icon xml={X3} width={20} height={20} style={s.v36} />
              <View style={s.v39}>
                <View>
                  <Text style={s.t37}>{`Draft for ${dayLabel(draft.runDate)} saved on this phone`}</Text>
                </View>
                <View>
                  <Text style={s.t38}>{`${plural(totals(draft.lines).units, 'unit')} · saved ${hm(draft.savedAt)}. Send it before 4:00 PM.`}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v35}>
            <View style={s.v22}>
              <View style={s.v20}>
                <Text style={s.t19}>{delivery ? (isToday ? 'This morning' : delivery.date > today() ? 'Next delivery' : 'Last delivery') : 'Deliveries'}</Text>
              </View>
              <View style={s.v20}>
                <Text style={s.t21}>{delivery ? dayLabel(delivery.date) : ''}</Text>
              </View>
            </View>
            <View style={s.v34}>
              <Tap style={s.v31} testID="delivery-card" to={first ? { to: 'sm-02-order-status-and-eta', params: { order: first.id } } : null}>
                <View style={s.v41}>
                  <Icon xml={X4} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v28}>
                  <View>
                    <Text style={s.t24}>{!delivery ? (status || 'No deliveries yet') : receipts.length ? `Received ${received} of ${dUnits}` : delivered ? `Delivered · ${plural(dUnits, 'unit')}` : `${titleCase(first?.status)} · ${plural(dUnits, 'unit')}`}</Text>
                  </View>
                  <View style={s.v27}>
                    <Text style={s.t25}>{arrived ? `Arrived ${hm(arrived)}` : eta ? `ETA ~${hm(eta)}` : delivery ? plural(dOrders.length, 'order') : ''}</Text>
                    {delivery ? <View style={s.v26} /> : null}
                    {delivery ? (
                      <View style={s.v43}>
                        <Text style={s.t42} numberOfLines={1}>{receipts.length ? (received === dUnits ? 'Matched' : `${dUnits - received} short`) : titleCase(first?.status)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Icon xml={X5} width={18} height={18} style={s.v1} />
              </Tap>
            </View>
          </View>
        </Scroll>
        <View style={s.v49}>
          <Tap lk="L78" style={s.v48}>
            <Grad g={G2} style={s.v46} />
            <Text style={s.t47}>{`${draft ? 'Continue' : 'Start'} ${dayLabel(draft?.runDate ?? runDate)} order`}</Text>
          </Tap>
        </View>
        <View style={s.v52}>
          <View style={s.v51}>
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t50}>{"Today"}</Text>
          </View>
          <Tap lk="N1" style={s.v51}>
            <Icon xml={X7} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Orders"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v51}>
            <Icon xml={X8} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Receipts"}</Text>
          </Tap>
          <Tap lk="N3" style={s.v51}>
            <Icon xml={X9} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Messages"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7a4b00\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z\" fill=\"none\" stroke=\"#7a4b00\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 3v4M17 5h4\" fill=\"none\" stroke=\"#7a4b00\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#1e2766","p":0},{"c":"#141b4d","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":90,"at":null,"repeat":false,"stops":[{"c":"#ffd37a","p":0},{"c":"#f5b83d","p":1}]}];
const G2: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t6: {"color":"#1a1300","fontSize":14,"lineHeight":21,"fontFamily":"Inter_800ExtraBold"},
  v7: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#f5b83d","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v9: {"borderRadius":24},
  t10: {"color":"#b9c0e6","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  t11: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t12: {"color":"#ffffff","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v13: {"borderRadius":4},
  v14: {"flexShrink":1,"width":"70%","borderRadius":4},
  v15: {"flexDirection":"row","alignItems":"stretch","flexShrink":1,"height":8,"backgroundColor":"rgba(255, 255, 255, 0.14)","borderRadius":4,"overflow":"hidden"},
  t16: {"color":"#ffffff","fontFamily":"Inter_700Bold"},
  t17: {"color":"#b9c0e6","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v18: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"borderRadius":24,"boxShadow":"rgba(20, 27, 77, 0.28) 0px 12px 32px 0px"},
  t19: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexShrink":1},
  t21: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v22: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v23: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#eff1f7","borderRadius":14},
  t24: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t25: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v26: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  v27: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v28: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t29: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v30: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v31: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  v32: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f7fb","borderRadius":14},
  v33: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v34: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v36: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t37: {"color":"#7a4b00","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t38: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v39: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v40: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#fff6e0","borderRadius":18},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  t42: {"color":"#047857","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v43: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v44: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v45: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v46: {"borderRadius":18},
  t47: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v48: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v49: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  t50: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v51: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  v52: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":6,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v53: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
