// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-11 Type a code · phone (P3, phone)
// The manual fallback to LD-10: the loader types the number under the barcode on the design's keypad, it is
// matched to a line of the trip's load sheet, and confirming checks the line (same per-trip set as LD-10/LD-02).
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { loadGroups } from '@/model/dock';
import { useClaims, useLoadSheet } from '@/model/hooks';
import { matchLine, useLineChecks } from '@/model/line-checks';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec, type Target } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L199":{"to":"ld-04-release-vehicle","kind":"go"},"L200":{"to":"ld-10-scan-a-line","kind":"go"}}};

/** 4792034118052 → "4792 0341 1805 2", as printed under a barcode. */
const grouped = (v: string) => v.replace(/(.{4})/g, '$1 ').trim();

export default function ScreenLd11TypeACode() {
  const claims = useClaims();
  const sheet = useLoadSheet();
  const data = sheet.data;
  const trip = data?.trip;
  const checks = useLineChecks(sheet.tripId, sheet.data?.trip?.status);
  const [code, setCode] = useState('');
  const [countSel, setCount] = useState<number | null>(null);
  const groups = loadGroups(data, l => checks.isChecked(l.id));
  const lines = groups.flatMap(g => g.lines);
  const line = code ? matchLine(lines, code) : undefined;
  const index = line ? lines.indexOf(line) + 1 : 0;
  const stop = line ? groups.find(g => g.stop.orderId === line.orderId)?.stop : undefined;
  const count = countSel ?? line?.qty ?? 0;
  const empty = !claims ? 'Sign in to check lines' : sheet.loading && !data ? 'Loading the load sheet…' : !data ? 'No trip to load' : lines.length ? '' : 'No lines on this trip';
  const params = trip ? { trip: trip.id } : undefined;
  const toRelease: Target | undefined = params ? { to: 'ld-04-release-vehicle', params } : undefined;
  const toScan: Target | undefined = params ? { to: 'ld-10-scan-a-line', params } : undefined;

  const key = (k: string) => {
    setCount(null);
    setCode(c => (k === 'clear' ? '' : k === 'back' ? c.slice(0, -1) : (c + k).slice(0, 24)));
    return false;
  };
  const bump = (d: number) => {
    setCount(Math.max(0, count + d));
    return false;
  };
  const confirm = () => {
    if (!line) throw new Error(code ? `No line on this trip matches ${grouped(code)}` : empty || 'Type the code first');
    if (count !== line.qty) throw new Error(`${count} of ${line.qty} · flag the shortfall on the load sheet instead`);
    const was = checks.isChecked(line.id);
    checks.check(line.id);
    showToast(`${line.name} checked · ${checks.count + (was ? 0 : 1)} of ${lines.length}`);
    return true;
  };
  const keyBtn = (k: string) => (
    <Tap style={s.v27} to={null} onPress={() => key(k)} testID={`key-${k}`}>
      <Text style={s.t26}>{k}</Text>
    </Tap>
  );

  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v37}>
        <View style={s.v5}>
          <Tap lk="L200" style={s.v2} to={toScan}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <Text style={s.t3}>{"Type the code"}</Text>
          </View>
          <View style={s.v2}>
            <Icon xml={X1} width={20} height={20} style={s.v1} />
          </View>
        </View>
        <Scroll style={s.v4} contentStyle={s.v32}>
          <View style={s.v11}>
            <View style={s.v7}>
              <Text style={s.t6}>{"Number under the barcode"}</Text>
            </View>
            <View style={s.v10}>
              <Text style={s.t8} testID="typed-code">{code ? grouped(code) : " "}</Text>
              <View style={s.v9} />
            </View>
          </View>
          <View style={s.v25}>
            <View style={s.v18}>
              <View style={s.v12}>
                {line ? <Icon xml={X2} width={22} height={22} style={s.v1} /> : null}
              </View>
              <View style={s.v17}>
                <View>
                  <Text style={s.t13} testID="matched-line">{line?.name ?? (code ? "No line matches" : empty || "Type the code")}</Text>
                </View>
                <View style={s.v7}>
                  <Text style={s.t6}>{line ? `Line ${index}` : `${checks.count} of ${lines.length} checked`}</Text>
                  <View style={s.v14} />
                  <View style={s.v16}>
                    <Text style={s.t15}>{line?.orderId ?? "—"}</Text>
                  </View>
                  <View style={s.v14} />
                  <Text style={s.t6}>{stop ? `Stop ${stop.stopSeq}` : "Stop —"}</Text>
                </View>
              </View>
            </View>
            <View style={s.v24}>
              <View style={s.v17}>
                <View>
                  <Text style={s.t13}>{"Cases loaded"}</Text>
                </View>
                <View style={s.v7}>
                  <Text style={s.t6}>{line ? `Expected ${line.qty}` : "Expected —"}</Text>
                </View>
              </View>
              <View style={s.v23}>
                <Tap style={s.v20} to={null} onPress={() => bump(-1)} disabled={!line} testID="count-minus">
                  <Text style={s.t19}>{"−"}</Text>
                </Tap>
                <View style={s.v22}>
                  <Text style={s.t21}>{line ? String(count) : "—"}</Text>
                </View>
                <Tap style={s.v20} to={null} onPress={() => bump(1)} disabled={!line} testID="count-plus">
                  <Text style={s.t19}>{"+"}</Text>
                </Tap>
              </View>
            </View>
          </View>
          <View style={s.v31}>
            <View style={s.v28}>
              {keyBtn("1")}
              {keyBtn("2")}
              {keyBtn("3")}
            </View>
            <View style={s.v28}>
              {keyBtn("4")}
              {keyBtn("5")}
              {keyBtn("6")}
            </View>
            <View style={s.v28}>
              {keyBtn("7")}
              {keyBtn("8")}
              {keyBtn("9")}
            </View>
            <View style={s.v28}>
              <Tap style={s.v30} to={null} onPress={() => key('clear')} testID="key-clear">
                <Text style={s.t29}>{"Clear"}</Text>
              </Tap>
              {keyBtn("0")}
              <Tap style={s.v30} to={null} onPress={() => key('back')} testID="key-back">
                <Icon xml={X3} width={26} height={26} style={s.v1} />
              </Tap>
            </View>
          </View>
        </Scroll>
        <View style={s.v36}>
          <Tap lk="L199" style={s.v35} onPress={confirm} to={toRelease}>
            <Grad g={G0} style={s.v33} />
            <Icon xml={X4} width={22} height={22} style={s.v1} />
            <Text style={s.t34}>{line ? `Confirm ${count} × ${line.name}` : "Confirm"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"26\" height=\"26\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m18 9-6 6M12 9l6 6\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t6: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v7: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  t8: {"color":"#0a0f1a","fontSize":26,"lineHeight":39,"letterSpacing":0.5,"fontFamily":"JetBrainsMono_700Bold"},
  v9: {"flexShrink":1,"marginLeft":4,"width":2,"height":28,"backgroundColor":"#3b4cca"},
  v10: {"flexDirection":"row","alignItems":"center","rowGap":2,"columnGap":2},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":14,"paddingRight":18,"marginRight":16,"paddingBottom":16,"paddingLeft":18,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgb(20, 27, 77) 0px 0px 0px 2px inset","overflow":"hidden"},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f6ec","borderRadius":14},
  t13: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  v14: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#4a5467","borderRadius":1.5,"opacity":0.6},
  t15: {"color":"#344054","fontSize":13,"lineHeight":18.2,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v16: {"flexShrink":1},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v18: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"backgroundColor":"#e3f6ec"},
  t19: {"color":"#0a0f1a","fontSize":26,"lineHeight":39,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"width":52,"height":52,"backgroundColor":"#ffffff","borderRadius":14},
  t21: {"color":"#0a0f1a","fontSize":28,"lineHeight":42,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v22: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"minWidth":64},
  v23: {"flexDirection":"row","alignItems":"center","flexShrink":1,"paddingTop":4,"paddingRight":4,"paddingBottom":4,"paddingLeft":4,"backgroundColor":"#e9ecf2","borderRadius":18},
  v24: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v25: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t26: {"color":"#0a0f1a","fontSize":26,"lineHeight":39,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":52,"backgroundColor":"#ffffff","borderRadius":16,"boxShadow":"rgba(15, 20, 50, 0.08) 0px 1px 2px 0px"},
  v28: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10},
  t29: {"color":"#344054","fontSize":16,"lineHeight":24,"fontFamily":"Inter_700Bold"},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":52,"borderRadius":16},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"marginRight":16,"marginLeft":16},
  v32: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v33: {"borderRadius":18},
  t34: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v35: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v37: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
