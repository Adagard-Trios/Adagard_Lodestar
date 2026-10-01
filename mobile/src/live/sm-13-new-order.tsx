// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-13 New order · phone (P1, phone)
import { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { useClaims } from '@/model/hooks';
import { byClass, cutoffFor, left, lineKg, totals, updateDraft, useNow, useOrderDraft, type DraftLine } from '@/model/store-face';
import type { TempClass } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L81":{"to":"sm-14-review-and-submit","kind":"go"},"L82":{"to":"sm-11-today-order-day","kind":"go"}}};

const setQty = (index: number, qty: number) =>
  updateDraft(d => ({ ...d, lines: d.lines.map((l, i) => (i === index ? { ...l, qty: Math.max(0, qty) } : l)) }));

export default function ScreenSm13NewOrder() {
  const claims = useClaims();
  const { draft, runDate, template } = useOrderDraft();
  const [tab, setTab] = useState<TempClass>('AMBIENT');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kg, setKg] = useState('');
  const lines = draft?.lines ?? [];
  const { dry, chilled } = byClass(lines);
  const shown = lines.map((l, i) => ({ l, i })).filter(x => x.l.tempClass === tab);
  const tTab = totals(tab === 'AMBIENT' ? dry : chilled);
  const tChilled = totals(chilled);
  const orders = [totals(dry).units, tChilled.units].filter(n => n > 0).length;
  const now = useNow();
  const remaining = left(cutoffFor(runDate), now);
  const from = draft?.fromRunDate ?? template.data?.runDate;
  const empty = !claims ? 'Sign in to start an order' : template.loading && !draft ? 'Loading your last order…' : `No ${tab === 'AMBIENT' ? 'dry' : 'chilled'} lines yet`;

  const addLine = async () => {
    const n = name.trim();
    const perUnit = Number(kg.replace(',', '.'));
    if (!n) throw new Error('Enter the item name');
    if (!(perUnit > 0)) throw new Error('Enter the weight of one unit in kg');
    const line: DraftLine = { name: n, qty: 1, kgPerUnit: perUnit, tempClass: tab };
    await updateDraft(d => ({ ...d, lines: [...d.lines, line] }));
    setName('');
    setKg('');
    setAdding(false);
    return false;
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v54}>
        <View style={s.v9}>
          <Tap lk="L82" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"New order"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{`${dayLabel(runDate)}${from ? ` · from ${dayLabel(from)}` : ''}`}</Text>
            </View>
          </View>
          <View style={s.v8} testID="draft-chip">
            <View style={s.v6} />
            <Text style={s.t7} numberOfLines={1}>{draft ? `Draft · ${hm(draft.savedAt)}` : 'Draft'}</Text>
          </View>
        </View>
        <Scroll style={s.v45} contentStyle={s.v46}>
          <View style={s.v14}>
            <View style={s.v11}>
              <Icon xml={X1} width={18} height={18} style={s.v1} />
              <Text style={s.t10}>{remaining ? 'Orders close at 4:00 PM' : 'Orders for this day are closed'}</Text>
            </View>
            <View style={s.v13}>
              <Text style={s.t12}>{remaining || '—'}</Text>
            </View>
          </View>
          <View style={s.v20}>
            <Tap style={tab === 'AMBIENT' ? s.v16 : s.v19} testID="tab-dry" to={null} onPress={() => setTab('AMBIENT')}>
              <Text style={tab === 'AMBIENT' ? s.t15 : s.t18}>{`Dry · ${plural(dry.length, 'line')}`}</Text>
            </Tap>
            <Tap style={tab === 'CHILLED' ? s.v16 : s.v19} testID="tab-chilled" to={null} onPress={() => setTab('CHILLED')}>
              <Icon xml={X2} width={14} height={14} style={s.v17} />
              <Text style={tab === 'CHILLED' ? s.t15 : s.t18}>{`Chilled · ${plural(chilled.length, 'line')}`}</Text>
            </Tap>
          </View>
          <View style={s.v40}>
            <View style={s.v23}>
              <View style={s.v13}>
                <Text style={s.t21}>{tab === 'AMBIENT' ? 'Dry order · ambient' : 'Chilled order · reefer'}</Text>
              </View>
              <View style={s.v13}>
                <Text style={s.t22}>{from ? `from ${dayLabel(from)}` : ''}</Text>
              </View>
            </View>
            <View style={s.v39}>
              {shown.length ? shown.map(({ l, i }, n) => (
                <View key={`${l.name}-${i}`} style={n === 0 ? s.v33 : s.v34}>
                  <View style={s.v28}>
                    <View>
                      <Text style={s.t24}>{l.name}</Text>
                    </View>
                    <View style={s.v27}>
                      <Text style={s.t25}>{`${lineKg(l)} kg`}</Text>
                      <View style={s.v26} />
                      {l.lastQty !== undefined ? (
                        <Text style={s.t25}>{`last ${l.lastQty}`}</Text>
                      ) : (
                        <View style={s.v36}>
                          <Icon xml={X5} width={13} height={13} style={s.v1} />
                          <Text style={s.t35} numberOfLines={1}>{"Added"}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={s.v32}>
                    <Tap style={s.v29} testID={`line-${i}-minus`} to={null} onPress={() => setQty(i, l.qty - 1)} disabled={l.qty <= 0}>
                      <Icon xml={X3} width={14} height={14} style={s.v1} />
                    </Tap>
                    <View style={s.v31}>
                      <Text style={s.t30} testID={`line-${i}-qty`}>{String(l.qty)}</Text>
                    </View>
                    <Tap style={s.v29} testID={`line-${i}-plus`} to={null} onPress={() => setQty(i, l.qty + 1)}>
                      <Icon xml={X4} width={14} height={14} style={s.v1} />
                    </Tap>
                  </View>
                </View>
              )) : (
                <View style={s.v33}>
                  <View style={s.v28}>
                    <Text style={s.t25}>{empty}</Text>
                  </View>
                </View>
              )}
              {adding ? (
                <View style={s.v34}>
                  <View style={s.v28}>
                    <TextInput style={[s.t24, x.input]} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor="#98a2b3" testID="add-name" autoFocus />
                    <TextInput style={[s.t25, x.input]} value={kg} onChangeText={setKg} placeholder="kg per unit" placeholderTextColor="#98a2b3" keyboardType="decimal-pad" testID="add-kg" />
                  </View>
                  <Tap style={s.v36} testID="add-save" to={null} onPress={addLine}>
                    <Text style={s.t37}>{"Add"}</Text>
                  </Tap>
                </View>
              ) : null}
              <Tap style={s.v38} testID="add-item" to={null} disabled={!draft} onPress={() => setAdding(a => !a)}>
                <Icon xml={X6} width={18} height={18} style={s.v1} />
                <Text style={s.t37}>{adding ? 'Cancel' : 'Add item'}</Text>
              </Tap>
            </View>
          </View>
          <View style={s.v44}>
            <View style={s.v42}>
              <View>
                <Text style={s.t41}>{String(tTab.units)}</Text>
              </View>
              <View>
                <Text style={s.t4}>{"units"}</Text>
              </View>
            </View>
            <View style={s.v43}>
              <View>
                <Text style={s.t41}>{String(tTab.kg)}</Text>
              </View>
              <View>
                <Text style={s.t4}>{"kg"}</Text>
              </View>
            </View>
            <View style={s.v43}>
              <View>
                <Text style={s.t41}>{String(tTab.m3)}</Text>
              </View>
              <View>
                <Text style={s.t4}>{"m³"}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v53}>
          <Tap lk="L81" style={s.v49} onPress={draft ? () => { if (!orders) throw new Error('Add at least one line'); } : undefined}>
            <Grad g={G0} style={s.v47} />
            <Text style={s.t48}>{draft ? `Review ${plural(orders, 'order')}` : 'Review order'}</Text>
            <Icon xml={X7} width={22} height={22} style={s.v1} />
          </Tap>
          <View style={s.v52}>
            <Text style={s.t51}>{"Chilled: "}<Text style={s.t50}>{plural(tChilled.units, 'unit')}</Text>{` · ${tChilled.kg} kg · ${tChilled.m3} m³`}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  input: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 8, backgroundColor: '#ffffff' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 6 6 18M6 6l12 12\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 5v14M5 12h14\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#9a6400\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z\" fill=\"none\" stroke=\"#9a6400\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 5v14M5 12h14\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#475467","borderRadius":3.5},
  t7: {"color":"#475467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#eff1f7","borderRadius":14},
  v9: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t10: {"color":"#3b4cca","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v11: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t12: {"color":"#3b4cca","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v13: {"flexShrink":1},
  v14: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":12,"paddingRight":16,"marginRight":16,"paddingBottom":12,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#eef0ff","borderRadius":18},
  t15: {"color":"#101828","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"backgroundColor":"#ffffff","borderRadius":10,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 3px 0px"},
  v17: {"flexShrink":0,"marginRight":6,"overflow":"hidden"},
  t18: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v19: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"borderRadius":10},
  v20: {"flexDirection":"row","alignItems":"stretch","rowGap":4,"columnGap":4,"flexShrink":0,"paddingTop":4,"paddingRight":4,"marginRight":16,"paddingBottom":4,"paddingLeft":4,"marginLeft":16,"backgroundColor":"#eff1f7","borderRadius":14},
  t21: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t22: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v23: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t24: {"color":"#101828","fontSize":15,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t25: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v26: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  v27: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v28: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"width":28,"height":28,"backgroundColor":"#ffffff","borderRadius":14,"boxShadow":"rgba(15, 20, 50, 0.08) 0px 1px 2px 0px"},
  t30: {"color":"#101828","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v31: {"flexShrink":1,"minWidth":38},
  v32: {"flexDirection":"row","alignItems":"center","flexShrink":0,"paddingTop":2,"paddingRight":2,"paddingBottom":2,"paddingLeft":2,"height":32,"backgroundColor":"#eff1f7","borderRadius":16},
  v33: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"paddingTop":8,"paddingRight":12,"paddingBottom":8,"paddingLeft":16,"minHeight":56},
  v34: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"paddingTop":8,"paddingRight":12,"paddingBottom":8,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t35: {"color":"#9a6400","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_700Bold"},
  v36: {"flexDirection":"row","alignItems":"center","rowGap":4,"columnGap":4,"flexShrink":1},
  t37: {"color":"#3b4cca","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v38: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"paddingRight":16,"paddingLeft":16,"minHeight":48,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v39: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v40: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  t41: {"color":"#101828","fontSize":24,"lineHeight":36,"letterSpacing":-0.5,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":4,"columnGap":4,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":4,"columnGap":4,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":14,"paddingRight":16,"paddingBottom":14,"paddingLeft":16,"borderLeftWidth":1,"borderLeftColor":"#eceef3"},
  v44: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"overflow":"hidden"},
  v45: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v46: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v47: {"borderRadius":18},
  t48: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v49: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t50: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t51: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"textAlign":"center","fontFamily":"Inter_400Regular"},
  v52: {"paddingBottom":2},
  v53: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v54: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
