// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-03 Confirm receipt count · phone (P1, phone)
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import * as api from '@/model/api';
import { confirmReceipt } from '@/model/actions';
import { useClaims, useOrder, usePods } from '@/model/hooks';
import { useQuery } from '@/model/query';
import { podFor } from '@/model/store-face';
import type { POD } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L17":{"to":"sm-03-receipt-confirmed","kind":"go"},"L94":{"to":"sm-18-report-issue","kind":"go"},"B":{"to":"sm-02-order-status-and-eta","kind":"back"}}};

type Exception = NonNullable<POD['exceptions']>[number];

export default function ScreenSm03ConfirmReceiptCount() {
  const claims = useClaims();
  const q = useOrder();
  const pods = usePods();
  const day = q.day.data;
  const base = q.data ?? day?.orders.find(o => o.id === q.id) ?? null;
  const date = isoDay(base?.runDate);
  const orders = base ? [base, ...(day?.orders ?? []).filter(o => o.id !== base.id && isoDay(o.runDate) === date && o.status !== 'CANCELLED')] : [];
  orders.sort((a, b) => (a.tempClass === b.tempClass ? a.id.localeCompare(b.id) : a.tempClass === 'AMBIENT' ? -1 : 1));
  const ids = orders.map(o => o.id);
  const lines = useQuery(ids.length ? `lines.${ids.join(',')}` : null, c => api.orderLines(c, ids), { persist: true });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const podOf = (id: string) => podFor(pods.data, id);
  const countOf = (id: string, units: number) => counts[id] ?? podOf(id)?.unitsDelivered ?? units;
  const bump = (id: string, units: number, d: number) => setCounts(c => ({ ...c, [id]: Math.max(0, Math.min(units, countOf(id, units) + d)) }));
  const hero = orders.find(o => o.tempClass === 'CHILLED') ?? orders[0] ?? null;
  const heroCount = hero ? countOf(hero.id, hero.units) : 0;
  const heroPod = hero ? podOf(hero.id) : undefined;
  const pod = orders.map(o => podOf(o.id)).find(Boolean);
  const exceptions: Exception[] = orders.flatMap(o => podOf(o.id)?.exceptions ?? []);
  const arrived = orders.map(o => o.tripStop?.arrivalActual).find(Boolean);
  const eta = orders.map(o => o.tripStop?.etaModel).find(Boolean);
  const allLines = lines.data ?? [];
  const shownLines = hero ? allLines.filter(l => orders.find(o => o.id === l.orderId)?.tempClass === hero.tempClass) : allLines;
  const short = orders.reduce((n, o) => n + (o.units - countOf(o.id, o.units)), 0);

  const confirm = async () => {
    if (!claims || !orders.length) return true; // design preview: follow the prototype
    for (const o of orders) {
      const n = countOf(o.id, o.units);
      await confirmReceipt(o, n, n < o.units ? `${o.units - n} short at receipt` : undefined);
    }
    return true;
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v82}>
        <View style={s.v7}>
          <Tap lk="B" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Confirm receipt"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{base ? [dayLabel(date), arrived ? `arrived ${hm(arrived)}` : eta ? `ETA ~${hm(eta)}` : titleCase(base.status)].join(' · ') : !claims ? 'Sign in to count a delivery' : q.loading ? 'Loading…' : 'No delivery yet'}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v74} contentStyle={s.v75}>
          <View style={s.v12}>
            <Icon xml={X1} width={20} height={20} style={s.v8} />
            <View style={s.v11}>
              <View>
                <Text style={s.t9}>{pod ? `Driver's record: ${pod.unitsDelivered} of ${pod.unitsOrdered} delivered` : "Driver's record not synced yet"}</Text>
              </View>
              <View>
                <Text style={s.t10}>{pod ? `Saved ${hm(pod.savedAt)}${pod.savedOffline ? ' on the driver\'s phone' : ''}. Confirm your own count; differences are credited.` : "Confirm your own count now, we'll match it later."}</Text>
              </View>
            </View>
          </View>
          <View style={s.v21}>
            <View style={s.v19}>
              <View style={s.v16}>
                <View>
                  <Text style={s.t4}>{hero ? `${hero.tempClass === 'CHILLED' ? 'Chilled' : 'Dry'} received · ` : 'Received'}{hero ? <Text style={s.t13}>{hero.id}</Text> : null}</Text>
                </View>
                <View>
                  <Text style={s.t15} testID="receipt-count">{hero ? String(heroCount) : '—'}<Text style={s.t14}>{hero ? `of ${hero.units}` : ''}</Text></Text>
                </View>
              </View>
              {hero ? (
                <View style={s.v18}>
                  <Text style={s.t17} numberOfLines={1}>{hero.units - heroCount ? `${hero.units - heroCount} to credit` : 'Complete'}</Text>
                </View>
              ) : null}
            </View>
            <View>
              <Text style={s.t10}>{heroPod?.exceptions?.length ? heroPod.exceptions.map(e => `${e.qty ? `${e.qty} ` : ''}${e.item ?? e.type ?? 'item'} ${e.type ? titleCase(e.type).toLowerCase() : ''}`.trim()).join(' + ') + ', credited on confirm.' : short ? `${plural(short, 'unit')} short in your count, credited on confirm.` : 'Count each order, then confirm.'}</Text>
            </View>
          </View>
          <View style={s.v38}>
            <View style={s.v27}>
              <View style={s.v23}>
                <Text style={s.t22}>{"Order"}</Text>
              </View>
              <View style={s.v25}>
                <Text style={s.t24}>{"Ordered"}</Text>
              </View>
              <View style={s.v25}>
                <Text style={s.t24}>{"Driver"}</Text>
              </View>
              <View style={s.v26}>
                <Text style={s.t22}>{"Your count"}</Text>
              </View>
            </View>
            {orders.map((o, i) => {
              const p = podOf(o.id);
              const n = countOf(o.id, o.units);
              return (
                <View key={o.id} style={s.v35}>
                  <View style={s.v23}>
                    <View>
                      <Text style={o.tempClass === 'CHILLED' ? s.t36 : s.t3}>{o.tempClass === 'CHILLED' ? 'Chilled' : 'Dry'}</Text>
                    </View>
                    <View>
                      <Text style={s.t28}>{o.id}</Text>
                    </View>
                  </View>
                  <View style={s.v25}>
                    <Text style={s.t29}>{String(o.units)}</Text>
                  </View>
                  <View style={s.v25}>
                    <Text style={p && p.unitsDelivered < o.units ? s.t37 : s.t29}>{p ? String(p.unitsDelivered) : '—'}</Text>
                  </View>
                  <View style={s.v34}>
                    <View style={s.v33}>
                      <Tap style={s.v30} testID={`count-${i}-minus`} to={null} onPress={() => bump(o.id, o.units, -1)}>
                        <Icon xml={X2} width={14} height={14} style={s.v1} />
                      </Tap>
                      <View style={s.v32}>
                        <Text style={s.t31} testID={`count-${i}`}>{String(n)}</Text>
                      </View>
                      <Tap style={s.v30} testID={`count-${i}-plus`} to={null} onPress={() => bump(o.id, o.units, 1)}>
                        <Icon xml={X3} width={14} height={14} style={s.v1} />
                      </Tap>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={s.v73}>
            <View style={s.v41}>
              <View style={s.v40}>
                <Text style={s.t39}>{hero ? `${hero.tempClass === 'CHILLED' ? 'Chilled' : 'Dry'} lines` : 'Lines'}</Text>
              </View>
              <View style={s.v40}>
                <Text style={s.t22}>{plural(shownLines.length, 'line')}</Text>
              </View>
            </View>
            <View style={s.v72}>
              {exceptions.map((e, i) => (
                <View key={i} style={i === 0 ? s.v51 : s.v55}>
                  <View style={i === 0 ? s.v43 : s.v53}>
                    <Text style={i === 0 ? s.t42 : s.t52}>{e.qty ? `−${e.qty}` : '!'}</Text>
                  </View>
                  <View style={s.v50}>
                    <View>
                      <Text style={s.t44}>{e.item ?? titleCase(e.type) ?? 'Item'}</Text>
                    </View>
                    <View style={s.v49}>
                      <Text style={s.t45}>{e.description ?? ''}</Text>
                      {e.type ? <View style={s.v46} /> : null}
                      {e.type ? (
                        <View style={s.v48}>
                          <Text style={i === 0 ? s.t47 : s.t54} numberOfLines={1}>{titleCase(e.type)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
              <View style={s.v68}>
                <View style={s.v63}>
                  <View style={s.v57}>
                    <Grad g={G0} style={s.v56} />
                    <Icon xml={X4} width={18} height={18} style={s.v1} />
                  </View>
                  <Tap lk="L94" style={s.v62}>
                    <View style={s.v59}>
                      <Text style={s.t58}>{"Short"}</Text>
                    </View>
                    <View style={s.v61}>
                      <Icon xml={X5} width={14} height={14} style={s.v1} />
                      <Text style={s.t60}>{"Damaged"}</Text>
                    </View>
                    <View style={s.v59}>
                      <Text style={s.t58}>{"Temperature"}</Text>
                    </View>
                    <View style={s.v59}>
                      <Text style={s.t58}>{"Wrong item"}</Text>
                    </View>
                  </Tap>
                </View>
              </View>
              <View style={s.v51}>
                <View style={s.v69}>
                  <Icon xml={X7} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v50}>
                  <View>
                    <Text style={s.t44}>{shownLines.length ? plural(shownLines.length, 'line') : lines.loading ? 'Loading lines…' : 'No lines'}</Text>
                  </View>
                  <View style={s.v49}>
                    <Text style={s.t45}>{shownLines.map(l => `${l.name} ×${l.qty}`).join(', ')}</Text>
                  </View>
                </View>
                <View style={s.v71}>
                  <View>
                    <Text style={s.t70}>{hero ? String(heroCount) : '—'}</Text>
                  </View>
                  <View>
                    <Text style={s.t4}>{hero ? `of ${hero.units}` : ''}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v81}>
          <Tap lk="L17" style={s.v78} onPress={confirm} to={base && claims ? { to: 'sm-03-receipt-confirmed', params: { order: base.id } } : undefined}>
            <Grad g={G1} style={s.v76} />
            <Icon xml={X8} width={22} height={22} style={s.v1} />
            <Text style={s.t77}>{"Confirm receipt"}</Text>
          </Tap>
          <View style={s.v80}>
            <Text style={s.t79}>{pod?.receiverName ? 'Received by ' : ''}{pod?.receiverName ? <Text style={s.t20}>{pod.receiverName}</Text> : null}{claims?.name ? `${pod?.receiverName ? ' · ' : ''}confirming as ` : !claims ? 'Sign in to confirm' : ''}{claims?.name ? <Text style={s.t20}>{claims.name}</Text> : null}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 5v14M5 12h14\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"12\" cy=\"13\" r=\"3\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":45,"at":null,"repeat":true,"stops":[{"c":"#eff1f7","p":0},{"c":"#eff1f7","p":null,"px":8},{"c":"#f7f8fc","p":null,"px":8},{"c":"#f7f8fc","p":null,"px":16}]}];
const G1: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

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
  t13: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t14: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t15: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":1},
  t17: {"color":"#b45309","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#fff4e0","borderRadius":14},
  v19: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  t20: {"color":"#101828","fontFamily":"Inter_700Bold"},
  v21: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t22: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v23: {"flexDirection":"column","alignItems":"stretch","rowGap":1,"columnGap":1,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t24: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"textAlign":"center","fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v25: {"flexShrink":0,"width":54},
  v26: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","flexShrink":0,"width":98},
  v27: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"paddingTop":12,"paddingRight":16,"paddingBottom":4,"paddingLeft":16,"minHeight":38},
  t28: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t29: {"color":"#101828","fontSize":18,"lineHeight":27,"textAlign":"center","fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"width":30,"height":30,"backgroundColor":"#ffffff","borderRadius":15,"boxShadow":"rgba(15, 20, 50, 0.08) 0px 1px 2px 0px"},
  t31: {"color":"#101828","fontSize":16,"lineHeight":24,"textAlign":"center","fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v32: {"flexShrink":1,"minWidth":34},
  v33: {"flexDirection":"row","alignItems":"center","flexShrink":0,"paddingTop":2,"paddingRight":2,"paddingBottom":2,"paddingLeft":2,"height":34,"backgroundColor":"#eff1f7","borderRadius":17},
  v34: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"stretch","flexShrink":0,"width":98},
  v35: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t36: {"color":"#0e7490","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t37: {"color":"#b45309","fontSize":18,"lineHeight":27,"textAlign":"center","fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v38: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t39: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v40: {"flexShrink":1},
  v41: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t42: {"color":"#b45309","fontSize":16,"lineHeight":24,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v43: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#fff4e0","borderRadius":14},
  t44: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t45: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v46: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  t47: {"color":"#b45309","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v48: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v49: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v50: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v51: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  t52: {"color":"#b42318","fontSize":16,"lineHeight":24,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v53: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#feeeec","borderRadius":14},
  t54: {"color":"#b42318","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v55: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v56: {"borderRadius":16},
  v57: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":64,"height":64,"borderRadius":16,"overflow":"hidden"},
  t58: {"color":"#475467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v59: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":34,"backgroundColor":"#eff1f7","borderRadius":17},
  t60: {"color":"#ffffff","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v61: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":34,"backgroundColor":"#b42318","borderRadius":17},
  v62: {"flexDirection":"row","flexWrap":"wrap","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":1},
  v63: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12},
  t64: {"color":"#475467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  t65: {"color":"#3b4cca","fontSize":13,"lineHeight":17.6,"fontFamily":"Inter_600SemiBold"},
  t66: {"color":"#3b4cca","fontSize":13,"lineHeight":17.6,"fontFamily":"Inter_800ExtraBold"},
  v67: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"marginTop":-4},
  v68: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"paddingTop":2,"paddingRight":16,"paddingBottom":14,"paddingLeft":16},
  v69: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e8f8f0","borderRadius":14},
  t70: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v71: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v72: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v73: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v74: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v75: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v76: {"borderRadius":18},
  t77: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v78: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t79: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"textAlign":"center","fontFamily":"Inter_400Regular"},
  v80: {"paddingBottom":2},
  v81: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v82: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
