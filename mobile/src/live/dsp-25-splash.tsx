// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-25 Splash · phone (P2, phone)
import { Text, View, StyleSheet } from 'react-native';
import { useSplash } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

// No timed hop here: useSplash() opens the role's first screen when signed in, else the sign-in screen.
const nav: ScreenNav = {"links":{}};

export default function ScreenDsp25Splash() {
  useSplash('dsp-26-sign-in');
  return (
    <Frame bg="#ffffff" nav={nav} style={s.v0}>
      <View style={s.v11}>
        <Grad g={G0} />
        <Scroll style={s.v4} contentStyle={s.v5}>
          <Icon xml={X0} width={300} height={220} style={s.v1} />
          <View>
            <Text style={s.t2}>{"Lodestar Plan"}</Text>
          </View>
          <View>
            <Text style={s.t3}>{"On call for both depots"}</Text>
          </View>
        </Scroll>
        <View style={s.v10}>
          <View style={s.v8}>
            <View style={s.v6} />
            <View style={s.v7} />
            <View style={s.v7} />
          </View>
          <View>
            <Text style={s.t9}>{"Waypoint Group · every order, one thread"}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg width=\"300\" height=\"220\" viewBox=\"0 0 300 220\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"> <circle cx=\"150\" cy=\"96\" r=\"92\" fill=\"#f5b83d\" opacity=\"0.07\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"150\" cy=\"96\" r=\"62\" fill=\"#f5b83d\" opacity=\"0.1\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <rect x=\"104\" y=\"50\" width=\"92\" height=\"92\" rx=\"24\" fill=\"#141b4d\" stroke=\"#2a3590\" stroke-width=\"2\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <path d=\"M150 62 L157.5 88.5 L184 96 L157.5 103.5 L150 130 L142.5 103.5 L116 96 L142.5 88.5 Z\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <circle cx=\"150\" cy=\"96\" r=\"5\" fill=\"#141b4d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <path d=\"M20 206 C 70 176 110 190 150 170 S 240 150 280 160\" stroke=\"#f5b83d\" stroke-width=\"2.5\" fill=\"none\" stroke-dasharray=\"1, 9\" stroke-linecap=\"round\" opacity=\"0.8\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> </svg>";
const G0: GradSpec[] = [{"type":"linear","angle":170,"at":null,"repeat":false,"stops":[{"c":"#1e2766","p":0},{"c":"#141b4d","p":0.5},{"c":"#0a0f2e","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":1,"overflow":"hidden"},
  t2: {"color":"#ffffff","fontSize":34,"lineHeight":51,"letterSpacing":-1,"textAlign":"center","fontFamily":"PlusJakartaSans_800ExtraBold"},
  t3: {"color":"#b9c0e6","fontSize":16,"lineHeight":24,"textAlign":"center","fontFamily":"Inter_400Regular"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexDirection":"column","justifyContent":"center","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":12},
  v6: {"flexShrink":1,"width":22,"height":6,"backgroundColor":"#f5b83d","borderRadius":3},
  v7: {"flexShrink":1,"width":6,"height":6,"backgroundColor":"#3b4cca","borderRadius":3},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t9: {"color":"#8e97c4","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  v10: {"flexDirection":"column","alignItems":"center","rowGap":14,"columnGap":14,"paddingBottom":26},
  v11: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
});
