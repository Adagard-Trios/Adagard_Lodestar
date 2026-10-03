// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-39 Deferral notice · speaking (P1, phone)
// The same moved order as SM-17 (route param `order`, else the newest moved order of the outlet, with its
// deferralLog), read aloud with the phone's voice in the app language (expo-speech). It speaks by itself on open
// when read aloud is on; a tap on the speaking card replays it, the speaking bar stops it and goes back to the
// notice. The words are the notice's own (English text, spoken in the chosen language's voice).
// "Acknowledge" marks the order's ORDER_DEFERRED notices read, as on SM-17.
import { useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSettings, LANGUAGE_NAMES } from '@/lib/settings';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { callDispatcher, titleCase, useDispatcher } from '@/lodestar/live';
import { speakIn, stopSpeaking, useSpeaking, useVoiceCheck } from '@/lodestar/voice';
import * as api from '@/model/api';
import { useClaims, useNotifications, useParam, useStoreDay } from '@/model/hooks';
import { bumpRevision, client } from '@/model/platform';
import { useQuery } from '@/model/query';
import type { Order } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L120":{"to":"sm-17-deferral-notice-out027","kind":"go"},"L121":{"to":"sm-21-messages","kind":"go"},"B":{"to":"sm-17-deferral-notice-out027","kind":"back"}}};

/** The deferral reason codes in the store's words (as SM-17). */
const REASON: Record<string, string> = {
  CAP_REEFER: 'Reefer space full',
  CAP_TIME: 'No time left on the trip',
  ACCESS: 'Store access',
  WINDOW: 'Outside the delivery window',
  FUEL: 'Vehicle fuel quota',
  VEH_DOWN: 'Vehicle down',
};

const moved = (o: Order) => !!o.deferralLog && o.deferralLog.status !== 'DISMISSED' && o.deferralLog.status !== 'REVERSED';

export default function ScreenSm39DeferralNoticeSpeaking() {
  const claims = useClaims();
  const day = useStoreDay();
  const notes = useNotifications();
  const dispatcher = useDispatcher();
  const param = useParam('order');
  const { language, readAloud } = useSettings();
  const voice = useVoiceCheck(language);
  const speaking = useSpeaking();
  const list = (day.data?.orders ?? []).filter(moved);
  const id = param ?? list[0]?.id;
  const q = useQuery(id ? `order.${id}` : null, c => api.orderDetail(c, id!), { persist: true });
  const order = q.data ?? list.find(o => o.id === id) ?? null;
  const def = order?.deferralLog ?? null;
  const outlet = order?.outlet ?? day.data?.outlet ?? null;
  const notices = (notes.data ?? []).filter(n => n.type === 'ORDER_DEFERRED' && n.payload?.orderId === order?.id);
  const from = notices.find(n => typeof n.payload?.from === 'string')?.payload?.from as string | undefined;
  const newDate = def?.rescheduledDate ? isoDay(def.rescheduledDate) : isoDay(order?.runDate);
  const atRisk = !!def && (def.isProvisional || def.status === 'SUGGESTED');
  const st = order?.tripStop ?? null;
  const empty = !claims ? 'Sign in to see notices' : day.loading || q.loading ? 'Loading…' : 'No order has been moved';
  const reasonWords = def ? `${REASON[def.reason] ?? titleCase(def.reason)}${from ? ` on ${dayLabel(from)}` : ''}` : '';
  const title = !def ? 'Notice' : atRisk ? `${order?.tempClass === 'CHILLED' ? 'Chilled order' : 'Order'} at risk` : `${order?.tempClass === 'CHILLED' ? 'Chilled order' : 'Order'} moved`;
  const where = [
    order ? `${order.m3} m³` : '',
    st ? `stop ${st.stopSeq} on the new trip` : '',
    outlet?.windowOpen && outlet.windowClose ? `window ${outlet.windowOpen}–${outlet.windowClose}` : '',
  ].filter(Boolean).join(' · ');
  const lead = def && order ? `${title}: your order ${order.id} is now on ${dayLabel(newDate)}.` : '';
  const rest = def && order
    ? [
        `Reason: ${reasonWords}.`,
        atRisk ? 'Dispatch will confirm the new day.' : "This order won't be moved again. It's protected.",
        def.notes ? `Dispatch says: ${def.notes}.` : '',
      ].filter(Boolean).join(' ')
    : '';
  const say = def && order ? `${lead} ${rest}` : '';

  // speaks by itself once per order when read aloud is on; stops when the screen closes
  const spokenFor = useRef<string | null>(null);
  useEffect(() => {
    if (!readAloud || !say || !order || spokenFor.current === order.id) return;
    spokenFor.current = order.id;
    speakIn(say, language);
  }, [readAloud, say, order, language]);
  useEffect(() => () => stopSpeaking(), []);

  const acknowledge = async () => {
    stopSpeaking();
    if (!notices.some(n => !n.readAt)) return true;
    await Promise.all(notices.filter(n => !n.readAt).map(n => api.markRead(client, n.id)));
    bumpRevision();
    return true;
  };
  const toNotice = (kind: 'go' | 'back') => (order ? { to: 'sm-17-deferral-notice-out027', params: { order: order.id }, kind } : undefined);

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v58}>
        <View style={s.v7}>
          <Tap lk="B" style={s.v2} to={toNotice('back')} onPress={stopSpeaking}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Notice"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{[outlet?.name, order?.outletId ?? claims?.outletId].filter(Boolean).join(' · ') || '—'}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v19} contentStyle={s.v44}>
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
              <Text style={s.t11}>{def ? dayLabel(newDate) : '—'}</Text>
            </View>
            <View>
              <Text style={s.t13}>{order && def ? <Text style={s.t12}>{order.id}</Text> : null}{order && def ? ` · ${where}` : empty}</Text>
            </View>
          </View>
          {def ? (
            <View style={s.v24}>
              <View style={s.v23}>
                <View style={s.v20}>
                  <View style={s.v16}>
                    <Text style={s.t15}>{"Reason"}</Text>
                  </View>
                  <View style={s.v19}>
                    <Text style={s.t18}>{`${reasonWords} · `}<Text style={s.t17}>{def.reason.replace('_', '-')}</Text></Text>
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
          {def?.notes ? (
            <View style={s.v27}>
              <Icon xml={X1} width={14} height={14} style={s.v25} />
              <View style={s.v9}>
                <Text style={s.t26}>{`"${def.notes}" · dispatch`}</Text>
              </View>
            </View>
          ) : null}
          <Tap to={null} group style={s.v43} disabled={!say} onPress={() => { speakIn(say, language); return false; }} testID="replay">
            <View style={s.v38}>
              <View style={s.v33}>
                {speaking ? (
                  <View style={s.v31}>
                    <View style={s.v28} />
                    <View style={s.v29} />
                    <View style={s.v30} />
                  </View>
                ) : null}
                <Text style={s.t32} testID="speaking-state">{speaking ? 'Now speaking' : say ? 'Tap to read aloud again' : 'Nothing to read'}</Text>
              </View>
              <View style={s.v37}>
                <View style={s.v9}>
                  <Text style={[s.t35, x[language]]} numberOfLines={1}>{LANGUAGE_NAMES[language]}</Text>
                </View>
                <Text style={s.t36} numberOfLines={1}>{voice.checking ? 'voice' : voice.available ? 'voice' : 'no voice · text only'}</Text>
              </View>
            </View>
            <View>
              <Text style={[s.t42, x.body]} testID="spoken-text">{say ? <><Text style={[s.t40, x.bold]}>{lead}</Text>{` ${rest}`}</> : empty}</Text>
            </View>
          </Tap>
        </Scroll>
        <View style={s.v57}>
          <Tap lk="L121" style={s.v47} onPress={acknowledge}>
            <Grad g={G0} style={s.v45} />
            <Text style={s.t46}>{"Acknowledge"}</Text>
          </Tap>
          <Tap lk="L120" style={s.v56} to={toNotice('go')} onPress={stopSpeaking}>
            <View style={s.v53}>
              <Icon xml={X2} width={20} height={20} style={s.v1} />
              <Text style={s.t48} numberOfLines={1}>{speaking ? "Speaking ·" : "Read aloud ·"}</Text>
              <View style={s.v9}>
                <Text style={[s.t49, x[language]]} numberOfLines={1}>{LANGUAGE_NAMES[language]}</Text>
              </View>
              {speaking ? (
                <View style={s.v31}>
                  <View style={s.v50} />
                  <View style={s.v51} />
                  <View style={s.v52} />
                </View>
              ) : null}
            </View>
            <Tap to={null} onPress={() => { stopSpeaking(); return callDispatcher(dispatcher.data); }} style={s.v55} testID="call-dispatcher">
              <Icon xml={X3} width={18} height={18} style={s.v1} />
              <Text style={s.t54} numberOfLines={1}>{"Call dispatcher"}</Text>
            </Tap>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  body: { fontFamily: 'Inter_400Regular' },
  bold: { fontFamily: 'Inter_700Bold' },
  en: { fontFamily: 'Inter_700Bold' },
  si: { fontFamily: 'NotoSansSinhala_700Bold' },
  ta: { fontFamily: 'NotoSansTamil_700Bold' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
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
  t11: {"color":"#101828","fontSize":42,"lineHeight":42,"letterSpacing":-1.3,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t12: {"color":"#101828","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t13: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":16,"paddingRight":20,"marginRight":16,"paddingBottom":16,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#fff4e0","borderRadius":24},
  t15: {"color":"#636c80","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_600SemiBold"},
  v16: {"flexShrink":0,"width":88},
  t17: {"color":"#b45309","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t18: {"color":"#101828","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v19: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v20: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12,"paddingTop":7,"paddingBottom":7},
  v21: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12,"paddingTop":7,"paddingBottom":7,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t22: {"fontFamily":"Inter_700Bold"},
  v23: {"flexDirection":"column","alignItems":"stretch"},
  v24: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"paddingTop":4,"paddingRight":16,"marginRight":16,"paddingBottom":4,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v25: {"flexShrink":0,"marginTop":2,"overflow":"hidden"},
  t26: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_400Regular_Italic"},
  v27: {"flexDirection":"row","alignItems":"flex-start","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v28: {"flexShrink":1,"width":3,"height":6,"backgroundColor":"#3b4cca","borderRadius":1.5},
  v29: {"flexShrink":1,"width":3,"height":13,"backgroundColor":"#3b4cca","borderRadius":1.5},
  v30: {"flexShrink":1,"width":3,"height":9,"backgroundColor":"#3b4cca","borderRadius":1.5},
  v31: {"flexDirection":"row","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0,"height":14},
  t32: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v33: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":1},
  t34: {"fontFamily":"NotoSansTamil_700Bold"},
  t35: {"color":"#475467","fontSize":12,"lineHeight":18,"fontFamily":"NotoSansTamil_700Bold"},
  t36: {"color":"#475467","fontSize":12,"lineHeight":18,"fontFamily":"Inter_700Bold"},
  v37: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":1,"paddingRight":9,"paddingLeft":9,"height":24,"backgroundColor":"#ffffff","borderRadius":12},
  v38: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":10,"columnGap":10},
  t39: {"fontFamily":"NotoSansSinhala_700Bold"},
  t40: {"color":"#2a3590","fontFamily":"NotoSansSinhala_700Bold"},
  t41: {"fontFamily":"NotoSansSinhala_400Regular"},
  t42: {"color":"#101828","fontSize":14,"lineHeight":21.7,"fontFamily":"NotoSansSinhala_400Regular"},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":12,"paddingRight":16,"marginRight":16,"paddingBottom":12,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#eef0ff","borderRadius":18},
  v44: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":4,"paddingBottom":16},
  v45: {"borderRadius":18},
  t46: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v47: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t48: {"color":"#ffffff","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  t49: {"color":"#ffffff","fontSize":14,"lineHeight":21,"fontFamily":"NotoSansSinhala_700Bold"},
  v50: {"flexShrink":1,"width":3,"height":6,"backgroundColor":"#ffffff","borderRadius":1.5},
  v51: {"flexShrink":1,"width":3,"height":13,"backgroundColor":"#ffffff","borderRadius":1.5},
  v52: {"flexShrink":1,"width":3,"height":9,"backgroundColor":"#ffffff","borderRadius":1.5},
  v53: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":14,"paddingLeft":12,"height":44,"backgroundColor":"#3b4cca","borderRadius":22,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 6px 16px 0px"},
  t54: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v55: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":8,"columnGap":8,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":44,"borderRadius":18},
  v56: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  v57: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v58: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
