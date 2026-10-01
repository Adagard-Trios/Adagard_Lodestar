// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-05 Splash · phone (P3, phone)
import { Text, View, StyleSheet } from 'react-native';
import { useSplash } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

// No timed hop here: useSplash() opens the role's first screen when signed in, else the sign-in screen.
const nav: ScreenNav = {"links":{}};

export default function ScreenLd05Splash() {
  useSplash('ld-06-sign-in');
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v16}>
        <Scroll style={s.v14} contentStyle={s.v15}>
          <Grad g={G0} />
          <View style={s.v2}>
            <Icon xml={X0} width={374} height={236} style={s.v1} />
          </View>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Lodestar Dock"}</Text>
            </View>
            <View>
              <Text style={s.t4}>{"Every order, one thread."}</Text>
            </View>
          </View>
          <View style={s.v6} />
          <View style={s.v13}>
            <View style={s.v9}>
              <View style={s.v8}>
                <Grad g={G1} style={s.v7} />
              </View>
            </View>
            <View>
              <Text style={s.t10}>{"Downloading tonight's plan"}</Text>
            </View>
            <View style={s.v12}>
              <Icon xml={X1} width={18} height={18} style={s.v1} />
              <Text style={s.t11}>{"Waypoint Group"}</Text>
            </View>
          </View>
        </Scroll>
      </View>
    </Frame>
  );
}

const X0 = "<svg width=\"374\" height=\"236\" viewBox=\"-37 0 374 236\" data-name=\"Splash illustration\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"> <defs><linearGradient id=\"lxHill\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#3b4cca\" stop-opacity=\"0.55\"></stop><stop offset=\"1\" stop-color=\"#3b4cca\" stop-opacity=\"0\"></stop></linearGradient><linearGradient id=\"lxHill2\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#0a0f2e\" stop-opacity=\"0.6\"></stop><stop offset=\"1\" stop-color=\"#0a0f2e\" stop-opacity=\"0\"></stop></linearGradient></defs> <circle cx=\"150\" cy=\"92\" r=\"88\" fill=\"#3b4cca\" opacity=\"0.16\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <circle cx=\"150\" cy=\"92\" r=\"58\" fill=\"#3b4cca\" opacity=\"0.24\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <circle cx=\"44\" cy=\"40\" r=\"2\" fill=\"#ffffff\" opacity=\"0.7\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"252\" cy=\"30\" r=\"2.5\" fill=\"#ffffff\" opacity=\"0.6\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"270\" cy=\"96\" r=\"1.8\" fill=\"#ffffff\" opacity=\"0.5\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"26\" cy=\"120\" r=\"1.8\" fill=\"#ffffff\" opacity=\"0.5\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"92\" cy=\"18\" r=\"1.5\" fill=\"#ffffff\" opacity=\"0.6\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"214\" cy=\"150\" r=\"1.5\" fill=\"#ffffff\" opacity=\"0.4\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <path d=\"M150 38 L161 81 L204 92 L161 103 L150 146 L139 103 L96 92 L139 81 Z\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <circle cx=\"150\" cy=\"92\" r=\"7\" fill=\"#141b4d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <path d=\"M-37 190 C0 172 46 166 88 170 C110 172 118 178 128 182 C170 200 214 162 300 174 C316 176 328 178 337 180 V236 H-37 Z\" fill=\"url(#lxHill)\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M-37 214 C20 204 120 222 180 210 C230 200 270 206 337 214 V236 H-37 Z\" fill=\"url(#lxHill2)\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M-30 226 H330\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-dasharray=\"10, 9\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <rect x=\"96\" y=\"168\" width=\"78\" height=\"44\" rx=\"7\" fill=\"#e6e9f8\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <path d=\"M174 178 H192 L206 194 V212 H174 Z\" fill=\"#c9cfdb\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M179 183 H190 L199 194 H179 Z\" fill=\"#141b4d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M135 177 V203 M124 183.5 L146 196.5 M124 196.5 L146 183.5\" stroke=\"#22b8cf\" stroke-width=\"2.5\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <circle cx=\"116\" cy=\"213\" r=\"9\" fill=\"#0a0f2e\" stroke=\"#e6e9f8\" stroke-width=\"3\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <circle cx=\"188\" cy=\"213\" r=\"9\" fill=\"#0a0f2e\" stroke=\"#e6e9f8\" stroke-width=\"3\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <rect x=\"204\" y=\"198\" width=\"6\" height=\"5\" rx=\"2\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> </svg>";
const X1 = "<svg viewBox=\"0 0 32 32\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#6d28d9\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":170,"at":null,"repeat":false,"stops":[{"c":"#26318a","p":0},{"c":"#141b4d","p":0.52},{"c":"#0a0f2e","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":90,"at":null,"repeat":false,"stops":[{"c":"#ffd37a","p":0},{"c":"#f5b83d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":1,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","flexShrink":0,"paddingTop":96},
  t3: {"color":"#ffffff","fontSize":38,"lineHeight":57,"letterSpacing":-1.1,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t4: {"color":"#b9c0e6","fontSize":17,"lineHeight":25.5,"fontFamily":"Inter_500Medium"},
  v5: {"flexDirection":"column","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":28},
  v6: {"flexGrow":1,"flexBasis":"0%"},
  v7: {"borderRadius":3},
  v8: {"flexShrink":1,"width":"62%","borderRadius":3},
  v9: {"flexDirection":"row","alignItems":"stretch","flexShrink":1,"width":"100%","height":6,"backgroundColor":"rgba(255, 255, 255, 0.14)","borderRadius":3,"overflow":"hidden"},
  t10: {"color":"#b9c0e6","fontSize":14,"lineHeight":21,"fontFamily":"Inter_600SemiBold"},
  t11: {"color":"#8e97c7","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"paddingTop":10},
  v13: {"flexDirection":"column","alignItems":"center","rowGap":12,"columnGap":12,"flexShrink":0,"paddingRight":56,"paddingBottom":28,"paddingLeft":56},
  v14: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v15: {"flexDirection":"column","alignItems":"stretch"},
  v16: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
