// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-05 Sign in · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { useAccessProblem, useDeviceId, useSignIn } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L51":{"to":"sm-31-can-t-sign-in","kind":"go"},"L68":{"to":"sm-06-verify-code","kind":"go"}}};

export default function ScreenSm05SignIn() {
  const { signIn, ready, busy } = useSignIn();
  const problem = useAccessProblem();
  const device = useDeviceId();
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v31}>
        <Scroll style={s.v19} contentStyle={s.v20}>
          <View style={s.v5}>
            <Icon xml={X0} width={44} height={44} style={s.v1} />
            <View style={s.v4}>
              <Text style={s.t2}>{"Lodestar Store"}</Text>
              <View>
                <Text style={s.t3}>{"Waypoint Group"}</Text>
              </View>
            </View>
          </View>
          <View style={s.v8}>
            <View>
              <Text style={s.t6}>{"Sign in to your store"}</Text>
            </View>
            <View>
              <Text style={s.t7}>{problem?.message ?? "Use your Waypoint account. The sign-in page opens, then you come straight back to your store."}</Text>
            </View>
          </View>
          <View style={s.v18}>
            <View>
              <Text style={s.t9}>{"This phone"}</Text>
            </View>
            <View style={s.v16}>
              <View style={s.v13}>
                <View style={s.v11}>
                  <Text style={s.t10}>{"ID"}</Text>
                </View>
                <Text style={s.t12}>{""}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t14}>{device ?? "…"}</Text>
              </View>
              <View style={s.v15} />
            </View>
            <Tap lk="L51">
              <Text style={s.t17}>{"Store managers and receiving staff only. Can't sign in? Get help."}</Text>
            </Tap>
          </View>
        </Scroll>
        <View style={s.v24}>
          <Tap lk="L68" style={s.v23} onPress={signIn} disabled={!ready || busy}>
            <Grad g={G0} style={s.v21} />
            <Text style={s.t22}>{busy ? "Signing in…" : "Sign in"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"44\" height=\"44\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":1,"overflow":"hidden"},
  t2: {"color":"#101828","fontSize":17,"lineHeight":25.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t3: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v4: {"flexDirection":"column","alignItems":"stretch","flexShrink":1},
  v5: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingRight":20,"paddingLeft":20},
  t6: {"color":"#101828","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t7: {"color":"#475467","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v8: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t9: {"color":"#475467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t10: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v11: {"flexShrink":1},
  t12: {"color":"#101828","fontSize":17,"lineHeight":25.5,"fontFamily":"Inter_700Bold"},
  v13: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":12,"height":32,"borderRightWidth":1,"borderRightColor":"#e8ebf2"},
  t14: {"color":"#101828","fontSize":21,"lineHeight":31.5,"letterSpacing":0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_700Bold"},
  v15: {"flexShrink":0,"width":2,"height":26,"backgroundColor":"#3b4cca","borderRadius":1},
  v16: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingRight":16,"paddingLeft":16,"height":60,"backgroundColor":"#ffffff","borderRadius":16,"boxShadow":"rgb(59, 76, 202) 0px 0px 0px 2px inset, rgb(238, 240, 255) 0px 0px 0px 4px"},
  t17: {"color":"#636c80","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v18: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"marginRight":20,"marginLeft":20},
  v19: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v20: {"flexDirection":"column","alignItems":"stretch","rowGap":22,"columnGap":22,"paddingTop":8,"paddingBottom":12},
  v21: {"borderRadius":18},
  t22: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v23: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  t25: {"color":"#0f1422","fontSize":24,"lineHeight":36,"fontFamily":"Inter_500Medium"},
  v26: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":48,"backgroundColor":"#ffffff","borderRadius":8,"boxShadow":"rgba(0, 0, 0, 0.22) 0px 1px 0px 0px"},
  v27: {"flexDirection":"row","alignItems":"stretch","rowGap":6,"columnGap":6},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":48,"borderRadius":8},
  v29: {"flexShrink":0,"overflow":"hidden"},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":8,"paddingRight":6,"paddingBottom":4,"paddingLeft":6,"backgroundColor":"#d3d7e0"},
  v31: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
