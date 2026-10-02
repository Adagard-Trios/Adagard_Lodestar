// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-09 Onboarding 3 · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L76":{"to":"sm-10-allow-notifications","kind":"go"}}};

export default function ScreenSm09Onboarding3() {
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v19}>
        <Scroll style={s.v13} contentStyle={s.v14}>
          <View style={s.v3}>
            <View style={s.v2}>
              <Text style={s.t1}>{"3 of 3"}</Text>
            </View>
            <View style={s.v2} />
          </View>
          <View style={s.v6}>
            <Grad g={G0} style={s.v4} />
            <Icon xml={X0} width={326} height={300} style={s.v5} />
          </View>
          <View style={s.v9}>
            <View style={s.v7} />
            <View style={s.v7} />
            <View style={s.v8} />
          </View>
          <View style={s.v12}>
            <View>
              <Text style={s.t10}>{"Confirm what arrived"}</Text>
            </View>
            <View>
              <Text style={s.t11}>{"Count at the dock, report anything short or damaged with a photo, and the credit note is raised for you."}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v18}>
          <Tap lk="L76" style={s.v17}>
            <Grad g={G1} style={s.v15} />
            <Text style={s.t16}>{"Get started"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 326 300\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"326\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\"> <circle cx=\"163\" cy=\"150\" r=\"118\" fill=\"#ffffff\" fill-opacity=\"0.05\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <rect x=\"30\" y=\"250\" width=\"272\" height=\"4\" rx=\"2\" fill=\"#ffffff\" fill-opacity=\"0.18\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <rect x=\"40\" y=\"172\" width=\"94\" height=\"78\" rx=\"8\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"79\" y=\"172\" width=\"16\" height=\"78\" fill=\"#ffd37a\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <rect x=\"54\" y=\"106\" width=\"74\" height=\"66\" rx=\"8\" fill=\"#ffcb5c\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"83\" y=\"106\" width=\"16\" height=\"66\" fill=\"#ffe3a3\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <rect x=\"136\" y=\"192\" width=\"66\" height=\"58\" rx=\"8\" fill=\"#9ee3f0\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M169 208v26M157.8 214.5l22.4 13M157.8 227.5l22.4-13\" stroke=\"#0e7490\" stroke-width=\"2.6\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <rect x=\"200\" y=\"58\" width=\"100\" height=\"136\" rx=\"14\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"230\" y=\"50\" width=\"40\" height=\"16\" rx=\"6\" fill=\"#c3cafa\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"220\" cy=\"96\" r=\"8\" fill=\"#10b981\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M216 96l3 3 5-5\" stroke=\"#ffffff\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"234\" y=\"92\" width=\"52\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"220\" cy=\"126\" r=\"8\" fill=\"#10b981\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M216 126l3 3 5-5\" stroke=\"#ffffff\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"234\" y=\"122\" width=\"42\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"220\" cy=\"156\" r=\"8\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M216 156h8\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"234\" y=\"152\" width=\"46\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"272\" cy=\"214\" r=\"28\" fill=\"#10b981\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M260 214l8 8 16-16\" stroke=\"#ffffff\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M30 60 L32 66.5 L38.5 68.5 L32 70.5 L30 77 L28 70.5 L21.5 68.5 L28 66.5 Z\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> </svg>";
const G0: GradSpec[] = [{"type":"linear","angle":160,"at":null,"repeat":false,"stops":[{"c":"#141b4d","p":0},{"c":"#2a3590","p":0.6},{"c":"#3b4cca","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  t1: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v2: {"flexShrink":1},
  v3: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","flexShrink":0,"paddingRight":20,"paddingLeft":20,"height":44},
  v4: {"borderRadius":28},
  v5: {"flexShrink":1,"overflow":"hidden"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"marginRight":16,"marginLeft":16,"height":330,"borderRadius":28,"overflow":"hidden"},
  v7: {"flexShrink":1,"width":8,"height":8,"backgroundColor":"#d3d8e3","borderRadius":4},
  v8: {"flexShrink":1,"width":24,"height":8,"backgroundColor":"#3b4cca","borderRadius":4},
  v9: {"flexDirection":"row","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t10: {"color":"#101828","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t11: {"color":"#475467","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v12: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingRight":20,"paddingLeft":20},
  v13: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":22,"columnGap":22,"paddingBottom":8},
  v15: {"borderRadius":18},
  t16: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v17: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v18: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v19: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
