// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-21 Messages · phone (P1, phone)
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';
import { addDays, colomboDate, dayLabel, hm } from '@/lib/time';
import { titleCase } from '@/lodestar/live';
import * as api from '@/model/api';
import { useClaims, useNotifications, useOnline } from '@/model/hooks';
import { bumpRevision, client } from '@/model/platform';
import { notices } from '@/realtime/notices';
import { rePlanNoticeIds, useNow } from '@/model/store-face';
import { Frame, Icon, Scroll, Tap, type ScreenNav, type Target } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L100":{"to":"sm-20-credit-note-detail","kind":"go"},"L101":{"to":"sm-16-why-this-window-sheet","kind":"go"},"N0":{"to":"sm-11-today-order-day","kind":"nav"},"N1":{"to":"sm-12-orders","kind":"nav"},"N2":{"to":"sm-19-receipts-and-credit-notes","kind":"nav"}}};

type Message = { id: string; type: string; at: string; payload: Record<string, unknown>; read: boolean; server: boolean };

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

function body(m: Message): { main: string; sub: string } {
  const p = m.payload;
  const main = str(p.message) || str(p.text) || str(p.body) || str(p.title);
  const eta = str(p.eta) || str(p.etaModel);
  const facts = [
    eta ? `ETA ${hm(eta) || eta}` : '',
    str(p.orderId) ? `Order ${str(p.orderId)}` : '',
    str(p.creditNoteId) ? `Credit note ${str(p.creditNoteId)}` : '',
    str(p.vehicleId) || '',
    str(p.reason),
  ].filter(Boolean);
  return main ? { main, sub: facts.join(' · ') } : { main: facts[0] ?? titleCase(m.type), sub: facts.slice(1).join(' · ') };
}

/** Icon tile and where a tap leads, by notice type (`replans`: plan notices that moved an order already planned). */
function kind(m: Message, replans: Set<string>): { tile: 'ok' | 'info' | 'warn' | 'note'; to: Target | null } {
  const t = m.type;
  const order = str(m.payload.orderId) || firstOrder(m.payload);
  const trip = str(m.payload.tripId);
  const pod = str(m.payload.podId);
  const status: Target = order ? { to: 'sm-02-order-status-and-eta', params: { order } } : { to: 'sm-02-order-status-and-eta' };
  if (/DEFER/.test(t)) return { tile: 'warn', to: { to: 'sm-17-deferral-notice-out027', params: order ? { order } : undefined } };
  // dead zone (SM-A1): the van lost signal, then a proof of delivery recorded with no signal
  if (t === 'POD_RECORDED_OFFLINE') return { tile: 'ok', to: { to: 'sm-a1-store-recorded-offline', params: order ? { order } : undefined } };
  if (t === 'SIGNAL_LOST' || t === 'BLACKOUT_DETECTED') return { tile: 'info', to: { to: 'sm-a1-store-in-progress-low-signal', params: { ...(order ? { order } : {}), ...(trip ? { trip } : {}) } } };
  // reefer down (SM-B1): a re-plan moved an order that was already planned
  if (t === 'PLAN_PUBLISHED' && replans.has(m.id)) return { tile: 'warn', to: { to: 'sm-b1-store-later-arrival-notice', params: { notice: m.id, ...(order ? { order } : {}) } } };
  if (/CREDIT|POD|MATCH|RECEIPT/.test(t)) return { tile: 'ok', to: pod ? { to: 'sm-20-credit-note-detail', params: { pod } } : { to: 'sm-19-receipts-and-credit-notes' } };
  if (/SHORT|DEFER|LATE|EXCEPTION|REEFER/.test(t)) return { tile: 'warn', to: status };
  if (/ETA|ARRIV|WINDOW|TRIP|SIGNAL|DELIVER/.test(t)) return { tile: 'info', to: { to: 'sm-16-why-this-window-sheet', params: order ? { order } : undefined } };
  if (/PLAN/.test(t)) return { tile: 'info', to: status };
  return { tile: 'note', to: null };
}

/** The first order of a plan notice ({orders: [{orderId}]}). */
function firstOrder(p: Record<string, unknown>): string {
  const list = Array.isArray(p.orders) ? (p.orders as Record<string, unknown>[]) : [];
  return str(list[0]?.orderId);
}

export default function ScreenSm21Messages() {
  const claims = useClaims();
  const online = useOnline();
  const q = useNotifications();
  const live = useStore(notices);
  const now = useNow();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const server: Message[] = (q.data ?? []).map(n => ({ id: n.id, type: n.type, at: n.sentAt, payload: n.payload ?? {}, read: !!n.readAt, server: true }));
  const socket: Message[] = live.filter(n => !server.some(x => x.id === n.id)).map(n => ({ id: n.id, type: n.type, at: n.at, payload: n.payload, read: false, server: false }));
  const all = [...socket, ...server].sort((a, b) => b.at.localeCompare(a.at));
  const replans = rePlanNoticeIds(all);
  const unread = all.filter(m => !m.read).length;
  const list = unreadOnly ? all.filter(m => !m.read) : all;
  const groups: { date: string; items: Message[] }[] = [];
  for (const m of list) {
    const d = colomboDate(Date.parse(m.at) || now);
    const g = groups.at(-1);
    if (g && g.date === d) g.items.push(m);
    else groups.push({ date: d, items: [m] });
  }
  const t = colomboDate(now);
  const label = (d: string) => (d === t ? 'Today' : d === addDays(t, -1) ? 'Yesterday' : 'Earlier');
  const empty = !claims ? 'Sign in to see your messages' : q.loading && !q.data ? 'Loading…' : q.error && !q.data ? 'No signal · nothing saved yet' : unreadOnly ? 'Nothing needs action' : 'No messages yet';

  const open = (m: Message) => {
    if (m.server && !m.read && online) {
      void api.markRead(client, m.id).then(bumpRevision).catch(() => undefined);
    }
    if (!m.server) notices.set(xs => xs.filter(x => x.id !== m.id));
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v40}>
        <View style={s.v7}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Messages"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{claims?.outletId ? `Notices for ${claims.outletId}` : 'Notices for your store'}</Text>
            </View>
          </View>
          <View style={s.v6}>
            <Icon xml={X1} width={20} height={20} style={s.v1} />
          </View>
        </View>
        <Scroll style={s.v33} contentStyle={s.v34}>
          <View style={s.v12}>
            <Tap style={unreadOnly ? s.v11 : s.v9} testID="tab-all" to={null} onPress={() => setUnreadOnly(false)}>
              <Text style={unreadOnly ? s.t10 : s.t8}>{"All"}</Text>
            </Tap>
            <Tap style={unreadOnly ? s.v9 : s.v11} testID="tab-unread" to={null} onPress={() => setUnreadOnly(true)}>
              <Text style={unreadOnly ? s.t8 : s.t10}>{`Needs action · ${unread}`}</Text>
            </Tap>
          </View>
          {groups.map(g => (
            <View key={g.date} style={s.v30}>
              <View style={s.v16}>
                <View style={s.v14}>
                  <Text style={s.t13}>{label(g.date)}</Text>
                </View>
                <View style={s.v14}>
                  <Text style={s.t15}>{dayLabel(g.date)}</Text>
                </View>
              </View>
              <View style={s.v29}>
                {g.items.map((m, i) => {
                  const n = list.indexOf(m);
                  const k = kind(m, replans);
                  const b = body(m);
                  const style = m.read ? (i === 0 ? s.v31 : s.v28) : i === 0 ? s.v24 : s.v26;
                  const tile = k.tile === 'ok' ? s.v17 : k.tile === 'warn' ? s.v27 : k.tile === 'info' ? s.v25 : s.v32;
                  const icon = k.tile === 'ok' ? X2 : k.tile === 'warn' ? X4 : k.tile === 'info' ? X5 : X6;
                  return (
                    <Tap key={m.id} lk={n === 0 ? 'L100' : n === 1 ? 'L101' : undefined} testID={n > 1 ? `message-row-${n}` : undefined} style={style} to={k.to} onPress={() => open(m)}>
                      <View style={tile}>
                        <Icon xml={icon} width={20} height={20} style={s.v1} />
                      </View>
                      <View style={s.v23}>
                        <View style={s.v20}>
                          <View style={s.v14}>
                            <Text style={s.t15}>{titleCase(m.type)}</Text>
                          </View>
                          <View style={s.v19}>
                            <Text style={s.t15}>{hm(m.at)}</Text>
                            {m.read ? null : <View style={s.v18} />}
                          </View>
                        </View>
                        <View>
                          <Text style={s.t21}>{b.main}</Text>
                        </View>
                        {b.sub ? (
                          <View>
                            <Text style={s.t22}>{b.sub}</Text>
                          </View>
                        ) : null}
                      </View>
                    </Tap>
                  );
                })}
              </View>
            </View>
          ))}
          {list.length < 2 ? (
            <View style={s.v30}>
              <View style={s.v29}>
                {list.length === 0 ? (
                  <Tap lk="L100" style={s.v31} to={claims ? null : undefined}>
                    <View style={s.v23}>
                      <Text style={s.t21}>{empty}</Text>
                    </View>
                  </Tap>
                ) : null}
                <Tap lk="L101" style={list.length === 0 ? s.v28 : s.v31}>
                  <View style={s.v25}>
                    <Icon xml={X5} width={20} height={20} style={s.v1} />
                  </View>
                  <View style={s.v23}>
                    <Text style={s.t21}>{"About your arrival window"}</Text>
                    <Text style={s.t22}>{"How the delivery time is worked out"}</Text>
                  </View>
                </Tap>
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v39}>
          <Tap lk="N0" style={s.v35}>
            <Icon xml={X7} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Today"}</Text>
          </Tap>
          <Tap lk="N1" style={s.v35}>
            <Icon xml={X8} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Orders"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v35}>
            <Icon xml={X9} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Receipts"}</Text>
          </Tap>
          <View style={s.v35}>
            <Icon xml={X10} width={22} height={22} style={s.v1} />
            <Text style={s.t36}>{"Messages"}</Text>
            {unread ? (
              <View style={s.v38}>
                <Text style={s.t37}>{String(unread)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m9 12 2 2 4-4\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M12 9v4M12 17h.01\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#1a1300\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z\" fill=\"none\" stroke=\"#1a1300\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X10 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#101828","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v9: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"backgroundColor":"#ffffff","borderRadius":10,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 3px 0px"},
  t10: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v11: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"borderRadius":10},
  v12: {"flexDirection":"row","alignItems":"stretch","rowGap":4,"columnGap":4,"flexShrink":0,"paddingTop":4,"paddingRight":4,"marginRight":16,"paddingBottom":4,"paddingLeft":4,"marginLeft":16,"backgroundColor":"#eff1f7","borderRadius":14},
  t13: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v14: {"flexShrink":1},
  t15: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v17: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#e8f8f0","borderRadius":13},
  v18: {"flexShrink":0,"width":8,"height":8,"backgroundColor":"#3b4cca","borderRadius":4},
  v19: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":8,"columnGap":8},
  t21: {"color":"#101828","fontSize":15,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t22: {"color":"#475467","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v23: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v24: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16,"backgroundColor":"#f7f8ff"},
  v25: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#eef0ff","borderRadius":13},
  v26: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16,"backgroundColor":"#f7f8ff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#fff4e0","borderRadius":13},
  v28: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v29: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v31: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16},
  v32: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#f5b83d","borderRadius":13},
  v33: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v35: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  t36: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t37: {"color":"#ffffff","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_800ExtraBold"},
  v38: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":5,"paddingLeft":5,"marginLeft":6,"position":"absolute","top":-2,"right":20.8,"bottom":34.5,"left":46.8,"height":20,"minWidth":20,"backgroundColor":"#b42318","borderRadius":10},
  v39: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":6,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v40: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
