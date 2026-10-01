// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DR-06 Sign in · phone (P4, phone)
import { Text, View, StyleSheet } from 'react-native';
import { useAccessProblem, useDeviceId, useSignIn } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L229":{"to":"dr-07-verify-code","kind":"go"}}};

export default function ScreenDr06SignIn() {
  const { signIn, ready, busy } = useSignIn();
  const problem = useAccessProblem();
  const device = useDeviceId();
  return (
    <Frame bg="#070b16" nav={nav} style={s.v0}>
      <View style={s.v31}>
        <View style={s.v6}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v4}>
            <Text style={s.t3}>{"Lodestar Run"}</Text>
          </View>
          <View style={s.v5} />
        </View>
        <Scroll style={s.v4} contentStyle={s.v21}>
          <View style={s.v9}>
            <View>
              <Text style={s.t7}>{"Sign in to your run"}</Text>
            </View>
            <View>
              <Text style={s.t8}>{"Use your Waypoint account. The sign-in page opens, then you come straight back to today's run."}</Text>
            </View>
          </View>
          <View style={s.v17}>
            <View style={s.v13}>
              <View style={s.v11}>
                <Text style={s.t10}>{"ID"}</Text>
              </View>
            </View>
            <View style={s.v16}>
              <Text style={s.t14} numberOfLines={1} testID="device-id">{device ?? "…"}</Text>
              <View style={s.v15} />
            </View>
          </View>
          <View style={s.v20}>
            <Icon xml={X1} width={16} height={16} style={s.v18} />
            <View style={s.v11}>
              <Text style={s.t19} testID="sign-in-note">{problem?.message ?? "This phone is checked at every sign-in. Your run stays saved on it without signal."}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v25}>
          <Tap lk="L229" style={s.v24} onPress={signIn} disabled={!ready || busy}>
            <Grad g={G0} style={s.v22} />
            <Text style={s.t23}>{busy ? "Signing in…" : "Sign in"}</Text>
            <Icon xml={X2} width={22} height={22} style={s.v1} />
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#0369a1\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"m3 11 19-9-9 19-2-8-8-2z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7f89a3\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"16\" height=\"16\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#7f89a3\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#111522\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#111522\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#ffd37a","p":0},{"c":"#f5b83d","p":0.6},{"c":"#eda422","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#0a0f1e","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#f2f4fa","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexShrink":1,"width":40},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#f2f4fa","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t8: {"color":"#b5bdd1","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v9: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  t10: {"color":"#7f89a3","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v11: {"flexShrink":1},
  t12: {"color":"#f2f4fa","fontSize":20,"lineHeight":30,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v13: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":64,"backgroundColor":"#121a2e","borderRadius":18},
  t14: {"color":"#f2f4fa","fontSize":22,"lineHeight":33,"letterSpacing":0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v15: {"flexShrink":1,"marginLeft":3,"width":2,"height":26,"backgroundColor":"#f5b83d"},
  v16: {"flexDirection":"row","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingRight":18,"paddingLeft":18,"height":64,"backgroundColor":"#121a2e","borderRadius":18,"boxShadow":"rgb(245, 184, 61) 0px 0px 0px 2px inset"},
  v17: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"marginRight":16,"marginLeft":16},
  v18: {"flexShrink":0,"marginTop":2,"overflow":"hidden"},
  t19: {"color":"#b5bdd1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v20: {"flexDirection":"row","alignItems":"flex-start","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v21: {"flexDirection":"column","alignItems":"stretch","rowGap":20,"columnGap":20,"paddingTop":10,"paddingBottom":16},
  v22: {"borderRadius":18},
  t23: {"color":"#111522","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v24: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(245, 184, 61, 0.22) 0px 8px 24px 0px"},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#070b16"},
  t26: {"color":"#f2f4fa","fontSize":24,"lineHeight":36,"fontFamily":"PlusJakartaSans_700Bold"},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":56,"backgroundColor":"#1a2340","borderRadius":14},
  v28: {"flexDirection":"row","alignItems":"stretch","rowGap":8,"columnGap":8},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":56,"borderRadius":14},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":10,"paddingRight":12,"paddingBottom":4,"paddingLeft":12,"backgroundColor":"#0a0f1e","borderTopWidth":1,"borderTopColor":"#1b2338"},
  v31: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#070b16"},
});
