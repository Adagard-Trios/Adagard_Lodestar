// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-01 Received · phone (P1, phone)
// The orders just placed (route param `since`: the moment Submit was pressed on SM-14) on the run date the
// server gave them (a late order moves to the next operating run, with the server's note), else the orders for
// `runDate` (else the next open run); plus the ones still on this phone waiting for signal.
import { Fragment } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, isoDay } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { useClaims, useOutbox, useParam, useStoreDay } from '@/model/hooks';
import { depotName } from '@/model/plan';
import { useNextRun } from '@/model/store-face';
import type { TempClass } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L85":{"to":"sm-12-orders","kind":"go"},"L86":{"to":"sm-13-new-order","kind":"go"}}};

type Row = { key: string; id: string | null; tempClass: TempClass; units: number; kg: number; m3: number; at: string; onPhone: boolean };

/** 2:38 PM → ["2:38", "PM"] (Colombo wall clock). */
function clock12(iso?: string): [string, string] {
  const ms = Date.parse(iso ?? '');
  if (!Number.isFinite(ms)) return ['—', ''];
  const d = new Date(ms + 330 * 60_000);
  const h = d.getUTCHours();
  return [`${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')}`, h < 12 ? 'AM' : 'PM'];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
/** The server's clock may differ a little from the phone's. */
const CLOCK_SLACK_MS = 2 * 60_000;
const STEPS = ['Received', 'Planned', 'Loaded', 'En route', 'Delivered'];

export default function ScreenSm01Received() {
  const claims = useClaims();
  const day = useStoreDay();
  const outlet = day.data?.outlet ?? null;
  const next = useNextRun();
  const asked = useParam('runDate') ?? next;
  const since = useParam('since');
  const { items } = useOutbox();
  const placed = (day.data?.orders ?? []).filter(o => o.status !== 'CANCELLED' && (since ? Date.parse(o.orderedAt) >= Date.parse(since) - CLOCK_SLACK_MS : isoDay(o.runDate) === asked));
  // the run date the server gave the orders (it moves a late order to the next operating run)
  const days = [...new Set(placed.map(o => isoDay(o.runDate)))];
  const runDate = days.length === 1 ? days[0] : asked;
  const moved = placed.find(o => isoDay(o.runDate) !== asked && o.notes)?.notes;
  const server: Row[] = placed
    .map(o => ({ key: o.id, id: o.id, tempClass: o.tempClass, units: o.units, kg: o.kg, m3: o.m3, at: o.orderedAt, onPhone: false }));
  const phone: Row[] = items
    .filter(i => i.kind === 'ORDER' && (i.status === 'pending' || i.status === 'sending') && i.payload.order?.runDate === asked && (!since || i.savedAt >= since))
    .map(i => ({ key: i.id, id: null, tempClass: i.payload.order.tempClass, units: i.payload.order.units, kg: i.payload.order.kg, m3: i.payload.order.m3, at: i.savedAt, onPhone: true }));
  const rows = [...server, ...phone].sort((a, b) => (a.tempClass === b.tempClass ? a.at.localeCompare(b.at) : a.tempClass === 'AMBIENT' ? -1 : 1));
  const latest = rows.map(r => r.at).sort().at(-1);
  const [time, ampm] = clock12(latest);
  const units = rows.reduce((n, r) => n + r.units, 0);
  const waiting = rows.some(r => r.onPhone);
  const what = rows.length === 2 ? 'Both orders' : rows.length === 1 ? 'Order' : plural(rows.length, 'order');
  const heading = !claims ? 'Sign in to see your orders' : !rows.length ? (day.loading ? 'Loading…' : `No orders for ${dayLabel(runDate)} yet`) : waiting ? `${what} saved on this phone` : `${what} received`;
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v54}>
        <View style={s.v7}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Lodestar Store"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{outlet ? `${outlet.district} · ${outlet.id}` : (claims?.outletId ?? '—')}</Text>
            </View>
          </View>
          <View style={s.v6}>
            <Icon xml={X1} width={20} height={20} style={s.v1} />
          </View>
        </View>
        <Scroll style={s.v46} contentStyle={s.v47}>
          <View style={s.v16}>
            <View style={s.v13}>
              <View style={s.v11}>
                <View>
                  <Text style={s.t8} testID="received-heading">{heading}</Text>
                </View>
                {rows.length ? (
                  <View>
                    <Text style={s.t10}>{time}<Text style={s.t9}>{ampm}</Text></Text>
                  </View>
                ) : null}
              </View>
              {rows.length ? (
                <View style={s.v12}>
                  <Icon xml={X2} width={28} height={28} style={s.v1} />
                </View>
              ) : null}
            </View>
            <View>
              <Text style={s.t15}>{waiting ? 'Sends when there is signal, for ' : outlet ? `In ${depotName(outlet.depot)}'s queue for ` : 'In the queue for '}<Text style={s.t14}>{days.length > 1 ? days.map(d => dayLabel(d)).join(' and ') : dayLabel(runDate)}</Text></Text>
            </View>
            {moved ? (
              <View>
                <Text style={s.t15} testID="received-moved">{moved}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.v32}>
            <View style={s.v20}>
              <View style={s.v18}>
                <Text style={s.t17}>{rows.length === 1 ? 'Your order' : "Your orders"}</Text>
              </View>
              <View style={s.v18}>
                <Text style={s.t19}>{plural(units, 'unit')}</Text>
              </View>
            </View>
            <View style={s.v31}>
              {rows.map((r, i) => (
                <View key={r.key} style={i === 0 ? s.v28 : s.v30} testID={`received-${i}`}>
                  <View style={r.tempClass === 'CHILLED' ? s.v29 : s.v21}>
                    <Icon xml={r.tempClass === 'CHILLED' ? X4 : X3} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v25}>
                    <View>
                      <Text style={s.t22}>{r.tempClass === 'CHILLED' ? 'Chilled order' : 'Dry order'}</Text>
                    </View>
                    <View style={s.v24}>
                      <View style={s.v18}>
                        <Text style={s.t23}>{r.id ?? 'Saved on this phone'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.v27}>
                    <View>
                      <Text style={s.t26}>{String(r.units)}</Text>
                    </View>
                    <View>
                      <Text style={s.t4}>{`${round1(r.kg)} kg · ${round1(r.m3)} m³`}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={s.v32}>
            <View style={s.v20}>
              <View style={s.v18}>
                <Text style={s.t17}>{"Order thread"}</Text>
              </View>
              <View style={s.v18}>
                <Text style={s.t19}>{rows.length === 2 ? 'both orders' : rows.length === 1 ? 'your order' : 'your orders'}</Text>
              </View>
            </View>
            <View style={s.v31}>
              <View style={s.v41}>
                <View style={s.v40}>
                  {STEPS.map((label, i) => (
                    <Fragment key={label}>
                      {i > 0 ? <View style={s.v37} /> : null}
                      <View style={s.v36}>
                        {i === 0 && rows.length && !waiting ? (
                          <View style={s.v33}>
                            <Icon xml={X5} width={12} height={12} style={s.v1} />
                          </View>
                        ) : (
                          <View style={s.v38} />
                        )}
                        <View>
                          <Text style={i === 0 && rows.length && !waiting ? s.t34 : s.t39}>{label}</Text>
                        </View>
                        <View>
                          <Text style={s.t35}>{i === 0 ? (rows.length ? `${time} ${ampm}` : '·') : i === 1 ? 'by 7 PM' : i === 4 ? dayLabel(runDate).split(' ')[0] : '·'}</Text>
                        </View>
                      </View>
                    </Fragment>
                  ))}
                </View>
              </View>
            </View>
          </View>
          <View style={s.v45}>
            <Icon xml={X6} width={20} height={20} style={s.v42} />
            <View style={s.v44}>
              <View>
                <Text style={s.t43}>{"Your delivery window by 7 PM tonight"}</Text>
              </View>
              <View>
                <Text style={s.t15}>{"With the van and any changes."}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v53}>
          <Tap lk="L85" style={s.v50}>
            <Grad g={G0} style={s.v48} />
            <Text style={s.t49}>{"Done"}</Text>
          </Tap>
          <Tap lk="L86" style={s.v52}>
            <Icon xml={X7} width={18} height={18} style={s.v1} />
            <Text style={s.t51}>{"Edit orders · open until 4:00 PM"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"28\" height=\"28\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h9\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#047857","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t9: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t10: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":1},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":56,"height":56,"backgroundColor":"#e8f8f0","borderRadius":28},
  v13: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t14: {"fontFamily":"Inter_700Bold"},
  t15: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t17: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexShrink":1},
  t19: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#eff1f7","borderRadius":14},
  t22: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t23: {"color":"#475467","fontSize":13,"lineHeight":18.2,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v24: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t26: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v27: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v28: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f7fb","borderRadius":14},
  v30: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v31: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v32: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t34: {"color":"#101828","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t35: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v36: {"flexDirection":"column","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"width":66},
  v37: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#d3d8e3"},
  v38: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#d3d8e3","borderRadius":11},
  t39: {"color":"#636c80","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v40: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":16,"paddingRight":10,"paddingBottom":14,"paddingLeft":10},
  v42: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t43: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v44: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v45: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v46: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v47: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v48: {"borderRadius":18},
  t49: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v50: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t51: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v52: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v53: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v54: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
