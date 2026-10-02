// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-07 Onboarding 1 · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { useStoreDay } from '@/model/hooks';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L72":{"to":"sm-08-onboarding-2","kind":"go"},"L73":{"to":"sm-10-allow-notifications","kind":"go"}}};

export default function ScreenSm07Onboarding1() {
  const outlet = useStoreDay().data?.outlet ?? null;
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v20}>
        <Scroll style={s.v14} contentStyle={s.v15}>
          <View style={s.v4}>
            <View style={s.v2}>
              <Text style={s.t1}>{"1 of 3"}</Text>
            </View>
            <Tap lk="L73" style={s.v2}>
              <Text style={s.t3}>{"Skip"}</Text>
            </Tap>
          </View>
          <View style={s.v7}>
            <Grad g={G0} style={s.v5} />
            <Icon xml={X0} width={326} height={300} style={s.v6} />
          </View>
          <View style={s.v10}>
            <View style={s.v8} />
            <View style={s.v9} />
            <View style={s.v9} />
          </View>
          <View style={s.v13}>
            <View>
              <Text style={s.t11}>{"Order before 4 PM"}</Text>
            </View>
            <View>
              <Text style={s.t12}>{outlet ? `Orders for ${outlet.name} placed by 4:00 PM arrive the next morning, in your ${outlet.windowOpen}–${outlet.windowClose} window. Quantities start from your last order.` : "Orders placed by 4:00 PM arrive the next morning, before you open. Quantities start from your last order."}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v19}>
          <Tap lk="L72" style={s.v18}>
            <Grad g={G1} style={s.v16} />
            <Text style={s.t17}>{"Next"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 326 300\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"326\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\"> <circle cx=\"124\" cy=\"150\" r=\"106\" fill=\"#ffffff\" fill-opacity=\"0.06\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <circle cx=\"124\" cy=\"150\" r=\"84\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <circle cx=\"124\" cy=\"150\" r=\"76\" fill=\"none\" stroke=\"#f5b83d\" stroke-width=\"10\" stroke-linecap=\"round\" stroke-dasharray=\"54, 424\" transform=\"rotate(-11 124 150)\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <path d=\"M124 84v8M190 150h-8M124 216v-8M58 150h8\" stroke=\"#c3cafa\" stroke-width=\"4\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M124 150 L124 100\" stroke=\"#141b4d\" stroke-width=\"5\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M124 150 L155 168\" stroke=\"#141b4d\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <circle cx=\"124\" cy=\"150\" r=\"7\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle> <rect x=\"80\" y=\"246\" width=\"88\" height=\"32\" rx=\"16\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <text x=\"124\" y=\"267\" text-anchor=\"middle\" font-family=\"Plus Jakarta Sans\" font-size=\"15\" font-weight=\"800\" fill=\"#1a1300\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\">4:00 PM</text> <rect x=\"214\" y=\"72\" width=\"96\" height=\"124\" rx=\"16\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"234\" cy=\"100\" r=\"8\" fill=\"#10b981\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M230 100l3 3 5-5\" stroke=\"#ffffff\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"248\" y=\"96\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"234\" cy=\"134\" r=\"8\" fill=\"#10b981\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M230 134l3 3 5-5\" stroke=\"#ffffff\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"248\" y=\"130\" width=\"38\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <circle cx=\"234\" cy=\"168\" r=\"8\" fill=\"#e3f7fb\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M234 162v12M229 165l10 6M229 171l10-6\" stroke=\"#0e7490\" stroke-width=\"1.8\" stroke-linecap=\"round\" fill=\"#000000\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><rect x=\"248\" y=\"164\" width=\"44\" height=\"8\" rx=\"4\" fill=\"#e0e4ff\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect> <path d=\"M288 30 L290.4 37.6 L298 40 L290.4 42.4 L288 50 L285.6 42.4 L278 40 L285.6 37.6 Z\" fill=\"#f5b83d\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> <path d=\"M36 50 L37.6 55 L42.6 56.6 L37.6 58.2 L36 63.2 L34.4 58.2 L29.4 56.6 L34.4 55 Z\" fill=\"#ffcb5c\" fill-opacity=\"0.8\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path> </svg>";
const G0: GradSpec[] = [{"type":"linear","angle":160,"at":null,"repeat":false,"stops":[{"c":"#141b4d","p":0},{"c":"#2a3590","p":0.6},{"c":"#3b4cca","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  t1: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v2: {"flexShrink":1},
  t3: {"color":"#3b4cca","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v4: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","flexShrink":0,"paddingRight":20,"paddingLeft":20,"height":44},
  v5: {"borderRadius":28},
  v6: {"flexShrink":1,"overflow":"hidden"},
  v7: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"marginRight":16,"marginLeft":16,"height":330,"borderRadius":28,"overflow":"hidden"},
  v8: {"flexShrink":1,"width":24,"height":8,"backgroundColor":"#3b4cca","borderRadius":4},
  v9: {"flexShrink":1,"width":8,"height":8,"backgroundColor":"#d3d8e3","borderRadius":4},
  v10: {"flexDirection":"row","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t11: {"color":"#101828","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t12: {"color":"#475467","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v13: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingRight":20,"paddingLeft":20},
  v14: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v15: {"flexDirection":"column","alignItems":"stretch","rowGap":22,"columnGap":22,"paddingBottom":8},
  v16: {"borderRadius":18},
  t17: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v18: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v19: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v20: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
