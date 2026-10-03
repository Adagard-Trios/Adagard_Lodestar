// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-37 Can't sign in · phone (P2, phone)
import { Text, View, StyleSheet } from 'react-native';
import { desktopUrl, openDesktop, useAccessProblem, useDeviceId, useSignIn } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L63":{"app":"Lodestar Plan (desktop)","screen":"DSP-06 Sign in"},"L184":{"to":"dsp-26-sign-in","kind":"go"},"B":{"to":"dsp-26-sign-in","kind":"back"}}};

const TITLES: Record<string, string> = {
  expired: 'Your session ended',
  revoked: 'This phone was removed',
  unregistered: 'This phone is not registered',
  denied: 'No access to Lodestar Plan',
  failed: "Sign-in didn't finish",
};

export default function ScreenDsp37CanTSignIn() {
  const { signIn, ready, busy } = useSignIn('plan');
  const problem = useAccessProblem();
  const device = useDeviceId();
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v35}>
        <View style={s.v6}>
          <View style={s.v3}>
            <Tap lk="B"><Icon xml={X0} width={22} height={22} style={s.v1} /></Tap>
            <Text style={s.t2}>{"Sign in"}</Text>
          </View>
          <View style={s.v5}>
            <Text style={s.t4}>{"Help"}</Text>
          </View>
        </View>
        <Scroll style={s.v27} contentStyle={s.v28}>
          <View style={s.v10}>
            <View>
              <Text style={s.t7} testID="access-title">{problem ? (TITLES[problem.kind] ?? "Can't sign in?") : "Can't sign in?"}</Text>
            </View>
            <View>
              <Text style={s.t9} testID="access-problem">{problem?.message ?? "Sign in again with your Waypoint account. This phone: "}{problem ? null : <Text style={s.t8}>{device ?? "…"}</Text>}</Text>
            </View>
          </View>
          <View style={s.v15}>
            <Icon xml={X1} width={20} height={20} style={s.v11} />
            <View style={s.v14}>
              <View>
                <Text style={s.t12}>{"Re-plans wait for you"}</Text>
              </View>
              <View>
                <Text style={s.t13}>{"Nothing is sent until you approve it."}</Text>
              </View>
            </View>
          </View>
          <View style={s.v26}>
            <View style={s.v18}>
              <View style={s.v17}>
                <Text style={s.t16}>{"Other ways in"}</Text>
              </View>
              <View style={s.v17} />
            </View>
            <View style={s.v25}>
              <View style={s.v23}>
                <View style={s.v19}>
                  <Icon xml={X2} width={21} height={21} style={s.v1} />
                </View>
                <View style={s.v22}>
                  <View>
                    <Text style={s.t20}>{"Call me with the code"}</Text>
                  </View>
                  <View>
                    <Text style={s.t21}>{"Voice call to your on-call phone"}</Text>
                  </View>
                </View>
                <Icon xml={X3} width={20} height={20} style={s.v1} />
              </View>
              <Tap lk="L63" style={s.v24} to={null} onPress={() => openDesktop('dsp-06-sign-in')}>
                <View style={s.v19}>
                  <Icon xml={X4} width={21} height={21} style={s.v1} />
                </View>
                <View style={s.v22}>
                  <View>
                    <Text style={s.t20}>{"Use the desktop instead"}</Text>
                  </View>
                  <View>
                    <Text style={s.t21}>{`${desktopUrl().replace(/^https?:\/\//, '')}, if you are at the office`}</Text>
                  </View>
                </View>
                <Icon xml={X3} width={20} height={20} style={s.v1} />
              </Tap>
              <View style={s.v24}>
                <View style={s.v19}>
                  <Icon xml={X5} width={21} height={21} style={s.v1} />
                </View>
                <View style={s.v22}>
                  <View>
                    <Text style={s.t20}>{"New phone? Call the IT desk"}</Text>
                  </View>
                  <View>
                    <Text style={s.t21} testID="device-id">{"Give them this phone's id: "}{device ?? "…"}</Text>
                  </View>
                </View>
                <Icon xml={X3} width={20} height={20} style={s.v1} />
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v34}>
          <Tap lk="L184" style={s.v31} onPress={signIn} disabled={!ready || busy}>
            <Grad g={G0} style={s.v29} />
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t30}>{busy ? "Signing in…" : "Sign in again"}</Text>
          </Tap>
          <Tap lk="B" style={s.v33} testID="back-to-sign-in">
            <Text style={s.t32}>{"Back to sign in"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" data-lk=\"B\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m15 18-6-6 6-6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M8 21h8M12 17v4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 16v2a4 4 0 0 1-4 4h-5\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 3v5h-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M8 16H3v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  t2: {"color":"#3b4cca","fontSize":16,"lineHeight":24,"fontFamily":"Inter_700Bold"},
  v3: {"flexDirection":"row","alignItems":"center","rowGap":2,"columnGap":2,"flexShrink":1},
  t4: {"color":"#0f1422","fontSize":16,"lineHeight":24,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%","marginRight":58},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#0f1422","fontSize":28,"lineHeight":31.4,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t8: {"color":"#0f1422","fontFamily":"Inter_700Bold"},
  t9: {"color":"#4a5467","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"paddingRight":20,"paddingLeft":20},
  v11: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t12: {"color":"#b42318","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t13: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v15: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#feeeec","borderRadius":18},
  t16: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v17: {"flexShrink":1},
  v18: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v19: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  t20: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t21: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v22: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v23: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v24: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v25: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v26: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  v27: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v28: {"flexDirection":"column","alignItems":"stretch","rowGap":20,"columnGap":20,"paddingTop":8,"paddingBottom":12},
  v29: {"borderRadius":18},
  t30: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t32: {"color":"#4a5467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v35: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
