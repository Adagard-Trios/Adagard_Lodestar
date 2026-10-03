// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-17 Deferral notice (P1, phone)
// The store's moved orders: Orders of the outlet with their deferralLog (reason code, new date, dispatch's note).
// Route param `order` opens that order (SM-21 opens it from the ORDER_DEFERRED notice); else the newest moved
// order, and a tap on the order line steps to the next one. "Acknowledge" marks the order's ORDER_DEFERRED
// notices read (Notifications('…')/Lodestar.MarkRead) and opens the messages.
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { callDispatcher, titleCase, useDispatcher } from '@/lodestar/live';
import * as api from '@/model/api';
import { useClaims, useNotifications, useParam, useStoreDay } from '@/model/hooks';
import { bumpRevision, client } from '@/model/platform';
import { useQuery } from '@/model/query';
import type { Order } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L92":{"to":"sm-21-messages","kind":"go"},"L93":{"to":"sm-39-deferral-notice-speaking","kind":"go"},"B":{"to":"sm-02-order-status-and-eta","kind":"back"}}};

/** The deferral reason codes in the store's words. */
const REASON: Record<string, string> = {
  CAP_REEFER: 'Reefer space full',
  CAP_TIME: 'No time left on the trip',
  ACCESS: 'Store access',
  WINDOW: 'Outside the delivery window',
  FUEL: 'Vehicle fuel quota',
  VEH_DOWN: 'Vehicle down',
};

const moved = (o: Order) => !!o.deferralLog && o.deferralLog.status !== 'DISMISSED' && o.deferralLog.status !== 'REVERSED';
const weekday = (input?: string | null) => dayLabel(input).split(' ')[0] || '·';

export default function ScreenSm17DeferralNoticeOut027() {
  const claims = useClaims();
  const day = useStoreDay();
  const notes = useNotifications();
  const dispatcher = useDispatcher();
  const param = useParam('order');
  const [picked, setPicked] = useState<string | null>(null);
  const list = (day.data?.orders ?? []).filter(moved);
  const id = picked ?? param ?? list[0]?.id;
  const q = useQuery(id ? `order.${id}` : null, c => api.orderDetail(c, id!), { persist: true });
  const order = q.data ?? list.find(o => o.id === id) ?? null;
  const def = order?.deferralLog ?? null;
  const outlet = order?.outlet ?? day.data?.outlet ?? null;
  const notices = (notes.data ?? []).filter(n => n.type === 'ORDER_DEFERRED' && n.payload?.orderId === order?.id);
  const from = notices.find(n => typeof n.payload?.from === 'string')?.payload?.from as string | undefined;
  const newDate = def?.rescheduledDate ? isoDay(def.rescheduledDate) : isoDay(order?.runDate);
  const atRisk = !!def && (def.isProvisional || def.status === 'SUGGESTED');
  const st = order?.tripStop ?? null;
  const enroute = order?.status === 'ENROUTE' || order?.status === 'DELIVERED';
  const delivered = order?.status === 'DELIVERED';
  const empty = !claims ? 'Sign in to see notices' : day.loading || q.loading ? 'Loading…' : 'No order has been moved';
  const reason = def ? `${REASON[def.reason] ?? titleCase(def.reason)}${from ? ` on ${dayLabel(from)}` : ''} · ` : '';
  const title = !def ? 'Notice' : atRisk ? `${order?.tempClass === 'CHILLED' ? 'Chilled order' : 'Order'} at risk` : `${order?.tempClass === 'CHILLED' ? 'Chilled order' : 'Order'} moved`;
  const where = [
    order ? `${order.m3} m³` : '',
    st ? `stop ${st.stopSeq} on the new trip` : '',
    outlet?.windowOpen && outlet.windowClose ? `window ${outlet.windowOpen}–${outlet.windowClose}` : '',
  ].filter(Boolean).join(' · ');
  const next = list.length > 1 && order ? () => setPicked(list[(list.findIndex(o => o.id === order.id) + 1) % list.length]!.id) : undefined;
  const say = def && order
    ? [title, `${dayLabel(newDate)}`, `${order.id}, ${where}`, `Reason: ${REASON[def.reason] ?? def.reason}`, atRisk ? 'Dispatch will confirm the new day' : "This order won't be moved again. It's protected.", def.notes ?? ''].filter(Boolean).join('. ')
    : empty;

  const acknowledge = async () => {
    if (!notices.some(n => !n.readAt)) return true;
    await Promise.all(notices.filter(n => !n.readAt).map(n => api.markRead(client, n.id)));
    bumpRevision();
    return true;
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v52}>
        <View style={s.v7}>
          <Tap lk="B" style={s.v2} to={order ? { to: 'sm-02-order-status-and-eta', params: { order: order.id }, kind: 'back' } : undefined}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Notice"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{[outlet?.name, order?.outletId ?? claims?.outletId, list.length > 1 && order ? `${list.findIndex(o => o.id === order.id) + 1} of ${list.length}` : ''].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v19} contentStyle={s.v42}>
          <View style={s.v14}>
            <View style={s.v10}>
              <View style={s.v9}>
                <Text style={s.t8} testID="deferral-title">{title}</Text>
              </View>
              <View style={s.v9}>
                <Text style={s.t4}>{def?.createdAt ? `${dayLabel(def.createdAt)} · ${hm(def.createdAt)}` : ''}</Text>
              </View>
            </View>
            <View>
              <Text style={s.t11} testID="deferral-date">{def ? dayLabel(newDate) : '—'}</Text>
            </View>
            <Tap to={null} onPress={next} disabled={!next} testID="deferral-order">
              <Text style={s.t13}>{order && def ? <Text style={s.t12}>{order.id}</Text> : null}{order && def ? ` · ${where}` : empty}</Text>
            </Tap>
          </View>
          {def ? (
            <View style={s.v24}>
              <View style={s.v23}>
                <View style={s.v20}>
                  <View style={s.v16}>
                    <Text style={s.t15}>{"Reason"}</Text>
                  </View>
                  <View style={s.v19}>
                    <Text style={s.t18} testID="deferral-reason">{reason}<Text style={s.t17}>{def.reason.replace('_', '-')}</Text></Text>
                  </View>
                </View>
                <View style={s.v21}>
                  <View style={s.v16}>
                    <Text style={s.t15}>{"Status"}</Text>
                  </View>
                  <View style={s.v19}>
                    <Text style={s.t18}>{atRisk ? 'At risk, not cancelled: dispatch will confirm the new day.' : `Confirmed for ${dayLabel(newDate)}.`}</Text>
                  </View>
                </View>
                <View style={s.v21}>
                  <View style={s.v16}>
                    <Text style={s.t15}>{"Fair to you"}</Text>
                  </View>
                  <View style={s.v19}>
                    <Text style={s.t18}>{"This order "}<Text style={s.t22}>{"won't be moved again"}</Text>{". It's protected."}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          {def ? (
            <View style={s.v38}>
              <View style={s.v37}>
                <View style={s.v36}>
                  <View style={s.v28}>
                    <View style={s.v25}>
                      <Icon xml={X1} width={12} height={12} style={s.v1} />
                    </View>
                    <View>
                      <Text style={s.t26}>{"Received"}</Text>
                    </View>
                    <View>
                      <Text style={s.t27}>{weekday(order?.orderedAt)}</Text>
                    </View>
                  </View>
                  <View style={s.v29} />
                  <View style={s.v28}>
                    <View style={s.v25}>
                      <Icon xml={X1} width={12} height={12} style={s.v1} />
                    </View>
                    <View>
                      <Text style={s.t26}>{"Planned"}</Text>
                    </View>
                    <View>
                      <Text style={s.t27}>{hm(def.createdAt) || '·'}</Text>
                    </View>
                  </View>
                  <View style={s.v30} />
                  <View style={s.v28}>
                    <View style={s.v31}>
                      <Icon xml={X2} width={12} height={12} style={s.v1} />
                    </View>
                    <View>
                      <Text style={s.t32}>{"Moved"}</Text>
                    </View>
                    <View>
                      <Text style={s.t27}>{from ? weekday(from) : '·'}</Text>
                    </View>
                  </View>
                  <View style={enroute ? s.v29 : s.v33} />
                  <View style={s.v28}>
                    {enroute ? <View style={s.v25}><Icon xml={X1} width={12} height={12} style={s.v1} /></View> : <View style={s.v34} />}
                    <View>
                      <Text style={enroute ? s.t26 : s.t35}>{"En route"}</Text>
                    </View>
                    <View>
                      <Text style={s.t27}>{weekday(newDate)}</Text>
                    </View>
                  </View>
                  <View style={delivered ? s.v29 : s.v33} />
                  <View style={s.v28}>
                    {delivered ? <View style={s.v25}><Icon xml={X1} width={12} height={12} style={s.v1} /></View> : <View style={s.v34} />}
                    <View>
                      <Text style={delivered ? s.t26 : s.t35}>{"Delivered"}</Text>
                    </View>
                    <View>
                      <Text style={s.t27}>{weekday(newDate)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          {def?.notes ? (
            <View style={s.v41}>
              <Icon xml={X3} width={14} height={14} style={s.v39} />
              <View style={s.v9}>
                <Text style={s.t40}>{`"${def.notes}" · dispatch`}</Text>
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v51}>
          <Tap lk="L92" style={s.v45} onPress={acknowledge}>
            <Grad g={G0} style={s.v43} />
            <Text style={s.t44}>{"Acknowledge"}</Text>
          </Tap>
          <Tap lk="L93" say={say} style={s.v50}>
            <View style={s.v47}>
              <Icon xml={X4} width={20} height={20} style={s.v1} />
              <Text style={s.t46} numberOfLines={1}>{"Read aloud"}</Text>
            </View>
            <Tap to={null} onPress={() => callDispatcher(dispatcher.data)} style={s.v49} testID="call-dispatcher">
              <Icon xml={X5} width={18} height={18} style={s.v1} />
              <Text style={s.t48} numberOfLines={1}>{"Call dispatcher"}</Text>
            </Tap>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M16 2v4M8 2v4M3 10h18\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
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
  t8: {"color":"#b45309","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v9: {"flexShrink":1},
  v10: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t11: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t12: {"color":"#101828","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t13: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#fff4e0","borderRadius":24},
  t15: {"color":"#636c80","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_600SemiBold"},
  v16: {"flexShrink":0,"width":88},
  t17: {"color":"#b45309","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t18: {"color":"#101828","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v19: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v20: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12,"paddingTop":10,"paddingBottom":10},
  v21: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12,"paddingTop":10,"paddingBottom":10,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t22: {"fontFamily":"Inter_700Bold"},
  v23: {"flexDirection":"column","alignItems":"stretch"},
  v24: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"paddingTop":4,"paddingRight":16,"marginRight":16,"paddingBottom":4,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v25: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t26: {"color":"#101828","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t27: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v28: {"flexDirection":"column","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"width":66},
  v29: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#047857"},
  v30: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#b45309"},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#b45309","borderWidth":2,"borderColor":"#b45309","borderRadius":11},
  t32: {"color":"#b45309","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_800ExtraBold"},
  v33: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#d3d8e3"},
  v34: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#d3d8e3","borderRadius":11},
  t35: {"color":"#636c80","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v36: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1},
  v37: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":16,"paddingRight":10,"paddingBottom":14,"paddingLeft":10},
  v38: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v39: {"flexShrink":0,"marginTop":2,"overflow":"hidden"},
  t40: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_400Regular_Italic"},
  v41: {"flexDirection":"row","alignItems":"flex-start","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v43: {"borderRadius":18},
  t44: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v45: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t46: {"color":"#3b4cca","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v47: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":14,"paddingLeft":12,"height":44,"backgroundColor":"#eef0ff","borderRadius":22},
  t48: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v49: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":8,"columnGap":8,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":44,"borderRadius":18},
  v50: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  v51: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v52: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
