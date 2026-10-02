// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-10 Scan a line · phone (P3, phone)
// expo-camera's barcode scanner reads the code; it is matched to a line of the trip's load sheet and the loader
// confirms it (no reading by AI). Confirmed lines are the load sheet's ticks, kept on the phone per trip.
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { CameraBox, useCamera } from '@/lodestar/camera';
import { loadGroups, tempLabel } from '@/model/dock';
import { useClaims, useLoadSheet, useParam } from '@/model/hooks';
import { matchLine, useLineChecks } from '@/model/line-checks';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec, type Target } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L197":{"to":"ld-04-release-vehicle","kind":"go"},"L198":{"to":"ld-11-type-a-code","kind":"go"},"C":{"to":"ld-11-type-a-code","kind":"back"}}};

export default function ScreenLd10ScanALine() {
  const claims = useClaims();
  const sheet = useLoadSheet();
  const data = sheet.data;
  const trip = data?.trip;
  const cam = useCamera();
  const checks = useLineChecks(sheet.tripId, sheet.data?.trip?.status);
  // LD-03 opens the scan on the next line to check (route param `line`)
  const lineParam = useParam('line');
  const [code, setCode] = useState<string | null>(lineParam ?? null);
  const groups = loadGroups(data, l => checks.isChecked(l.id));
  const lines = groups.flatMap(g => g.lines);
  const line = code ? matchLine(lines, code) : undefined;
  const index = line ? lines.indexOf(line) + 1 : 0;
  const stop = line ? groups.find(g => g.stop.orderId === line.orderId)?.stop : undefined;
  const checked = line ? checks.isChecked(line.id) : false;
  const empty = !claims ? 'Sign in to scan' : sheet.loading && !data ? 'Loading the load sheet…' : !data ? 'No trip to load' : lines.length ? '' : 'No lines on this trip';
  const params = trip ? { trip: trip.id } : undefined;
  const toRelease: Target | undefined = params ? { to: 'ld-04-release-vehicle', params } : undefined;
  const toType: Target | undefined = params ? { to: 'ld-11-type-a-code', params } : undefined;

  const onCode = (data: string) => setCode(prev => (prev === data ? prev : data));
  const confirm = () => {
    if (!line) throw new Error(code ? `No line on this trip matches ${code}` : 'Scan a line first');
    checks.check(line.id);
    showToast(`${line.name} checked · ${checks.count + (checked ? 0 : 1)} of ${lines.length}`);
    return true;
  };

  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v36}>
        <Scroll style={s.v34} contentStyle={s.v35}>
          <View style={s.v6}>
            <Tap lk="C" style={s.v2} to={toType ? { ...toType, kind: 'back' } : undefined}>
              <Icon xml={X0} width={20} height={20} style={s.v1} />
            </Tap>
            <View style={s.v5}>
              <Text style={s.t4}>{"Scan · "}<Text style={s.t3}>{trip?.vehicleId ?? "—"}</Text></Text>
            </View>
            <Tap style={s.v2} to={null} onPress={async () => { if (!(await cam.ensure())) showToast('No camera · type the code instead', 'error'); return false; }} testID="camera-on">
              <Icon xml={X1} width={20} height={20} style={s.v1} />
            </Tap>
          </View>
          <CameraBox cam={cam} style={s.v7} onCode={onCode}>
            <View style={x.overlay} pointerEvents="none">
              <View style={x.chip}>
                <Text style={x.chipText} numberOfLines={2} testID="scanned-code">
                  {code ? (line ? `${code} · ${line.name}` : code) : cam.granted ? 'Point at a label' : 'Camera off · tap the camera button'}
                </Text>
              </View>
            </View>
          </CameraBox>
          <View style={s.v33}>
            <View style={s.v12}>
              <View style={s.v9}>
                <Icon xml={X3} width={14} height={14} style={s.v1} />
                <Text style={s.t8} numberOfLines={1} testID="scan-state">{!code ? "Point at a label" : line ? (checked ? "Already checked" : "Matched") : "No match"}</Text>
              </View>
              <View style={s.v10} />
              <Text style={s.t11}>{line ? `Line ${index} of ${lines.length}` : lines.length ? `${checks.count} of ${lines.length} checked` : empty || "—"}</Text>
              <View style={s.v10} />
              <Text style={s.t11}>{stop ? `Stop ${stop.stopSeq}` : "Stop —"}</Text>
            </View>
            <View>
              <Text style={s.t13}>{line?.name ?? (code ? `Code ${code}` : "Scan a line")}</Text>
            </View>
            <View style={s.v19}>
              <View style={s.v16}>
                <Text style={s.t15}>{line ? String(line.qty) : "—"}<Text style={s.t14}>{line ? ` of ${line.qty} on the sheet` : ""}</Text></Text>
              </View>
              <View style={s.v18}>
                <Text style={s.t17} numberOfLines={1}>{line ? (checked ? "Checked" : "Count it, then confirm") : "—"}</Text>
              </View>
            </View>
            <View style={s.v22}>
              <Icon xml={X4} width={14} height={14} style={s.v1} />
              <Text style={s.t20} numberOfLines={1}>{code ? `Read from label · ${code} ·` : "Read from label ·"}</Text>
              <View style={s.v16}>
                <Text style={s.t21} numberOfLines={1}>{"confirm"}</Text>
              </View>
            </View>
            <View style={s.v26}>
              <View style={s.v16}>
                <Text style={s.t23}>{line?.orderId ?? "—"}</Text>
              </View>
              <View style={s.v10} />
              <View style={s.v9}>
                <View style={s.v24} />
                <Text style={s.t25} numberOfLines={1}>{line ? tempLabel(line.tempClass) || "—" : "—"}</Text>
              </View>
            </View>
            <View style={s.v32}>
              <Tap lk="L197" style={s.v29} onPress={confirm} to={toRelease}>
                <Grad g={G0} style={s.v27} />
                <Icon xml={X5} width={22} height={22} style={s.v1} />
                <Text style={s.t28}>{line ? `Confirm ${line.qty} × ${line.name}` : "Confirm"}</Text>
              </Tap>
              <Tap lk="L198" style={s.v31} to={toType}>
                <Icon xml={X6} width={22} height={22} style={s.v1} />
                <Text style={s.t30}>{"Type the code instead"}</Text>
              </Tap>
            </View>
          </View>
        </Scroll>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, alignItems: 'center' },
  chip: { backgroundColor: 'rgba(10, 15, 26, 0.72)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, maxWidth: '100%' },
  chipText: { color: '#ffffff', fontSize: 14, lineHeight: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 6 6 18M6 6l12 12\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 3v4M17 5h4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"2\" y=\"6\" width=\"20\" height=\"12\" rx=\"2\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"rgba(255, 255, 255, 0.14)","borderRadius":20},
  t3: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t4: {"color":"#ffffff","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v7: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","overflow":"hidden"},
  t8: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v9: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v10: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#4a5467","borderRadius":1.5,"opacity":0.6},
  t11: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t13: {"color":"#0a0f1a","fontSize":22,"lineHeight":26.4,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t14: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t15: {"color":"#0a0f1a","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v16: {"flexShrink":1},
  t17: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e3f6ec","borderRadius":14},
  v19: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  t20: {"color":"#3b4cca","fontSize":13,"lineHeight":17.6,"fontFamily":"Inter_600SemiBold"},
  t21: {"color":"#3b4cca","fontSize":13,"lineHeight":17.6,"fontFamily":"Inter_800ExtraBold"},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"marginTop":-4},
  t23: {"color":"#344054","fontSize":13,"lineHeight":18.2,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v24: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#344054","borderRadius":3.5},
  t25: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v26: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v27: {"borderRadius":18},
  t28: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  t30: {"color":"#344054","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v32: {"flexDirection":"column","alignItems":"stretch","rowGap":4,"columnGap":4,"paddingTop":2},
  v33: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"paddingLeft":20,"backgroundColor":"#ffffff","borderTopLeftRadius":28,"borderTopRightRadius":28},
  v34: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#05070d"},
  v35: {"flexDirection":"column","alignItems":"stretch"},
  v36: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
