// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-26 Sign in · phone (P2, phone). Fingerprint unlock, as designed: the dispatcher's session is stored on the
// phone (refresh token in the secure store); the splash (DSP-25) stops here while the phone has a fingerprint
// enrolled, and "Unlock with fingerprint" (L179) asks the OS sensor (expo-local-authentication) before the plan
// opens. No stored session, no sensor, or the web build: the design's fallback "Use work password" (L60, DSP-37).
import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { biometricAvailable, unlockWithBiometrics } from '@/auth/biometric';
import { goHome } from '@/auth/use-sign-in';
import { session } from '@/model/platform';
import { depotsLabel } from '@/model/plan';
import { useDepots } from '@/model/depots';
import { useAccessProblem } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L60":{"to":"dsp-37-can-t-sign-in","kind":"go"},"L179":{"to":"dsp-28-approve-re-plan","kind":"go"}}};

export default function ScreenDsp26SignIn() {
  useDepots(); // depot names for depotsLabel
  const problem = useAccessProblem();
  const st = useStore(session.state);
  const { width } = useWindowDimensions();
  const [sensor, setSensor] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    void biometricAvailable().then(v => live && setSensor(v));
    return () => {
      live = false;
    };
  }, []);

  const claims = st.status === 'signed-in' ? st.claims : null;
  const first = claims?.name?.split(/\s+/)[0];
  const depots = depotsLabel(claims?.depots);
  const canUnlock = Boolean(claims) && sensor === true;

  const unlock = async () => {
    if (!claims || !sensor) return false;
    setBusy(true);
    setError(null);
    const r = await unlockWithBiometrics('Unlock Lodestar Plan');
    setBusy(false);
    if (r.ok) goHome(claims, width);
    else setError(r.message);
    return false; // the plan opens through goHome
  };

  const hint =
    sensor === null ? 'Checking this phone…'
      : !sensor ? 'Fingerprint unlock works in the Lodestar app on a phone with a fingerprint set up. Use your work password.'
        : !claims ? 'Sign in once with your work password, then unlock with your fingerprint.'
          : 'Touch the sensor to unlock';

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v23}>
        <Scroll style={s.v15} contentStyle={s.v16}>
          <View style={s.v5}>
            <View style={s.v2}>
              <Icon xml={X0} width={56} height={56} style={s.v1} />
            </View>
            <View>
              <Text style={s.t3}>{first ? `Welcome back, ${first}` : "Lodestar Plan"}</Text>
            </View>
            <View>
              <Text style={s.t4}>{depots ? `On call · ${depots}` : "On call for your depots"}</Text>
            </View>
          </View>
          <View style={s.v10}>
            <Icon xml={X1} width={20} height={20} style={s.v6} />
            <View style={s.v9}>
              <View>
                <Text style={s.t7}>{"Alerts and re-plans wait for you"}</Text>
              </View>
              <View>
                <Text style={s.t8} testID="sign-in-note">{error ?? problem?.message ?? "Unlock to review the agent's re-plans. Nothing is sent until you approve."}</Text>
              </View>
            </View>
          </View>
          <View style={s.v14}>
            <View style={[s.v12, canUnlock ? null : { opacity: 0.45 }]}>
              <Icon xml={X2} width={64} height={64} style={s.v11} />
            </View>
            <View>
              <Text style={s.t13} testID="unlock-hint">{hint}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v22}>
          <Tap lk="L179" style={s.v19} onPress={unlock} disabled={!canUnlock || busy}>
            <Grad g={G0} style={s.v17} />
            <Icon xml={X3} width={22} height={22} style={s.v11} />
            <Text style={s.t18}>{busy ? "Unlocking…" : "Unlock with fingerprint"}</Text>
          </Tap>
          <Tap lk="L60" style={s.v21}>
            <Text style={s.t20}>{"Use work password"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg width=\"56\" height=\"56\" viewBox=\"0 0 32 32\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#3b4cca\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"64\" height=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M14 13.12c0 2.38 0 6.38-1 8.88\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M17.29 21.02c.12-.6.43-2.3.5-3.02\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M2 12a10 10 0 0 1 18-6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M2 16h.01\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21.8 16c.2-2 .131-5.354 0-6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M8.65 22c.21-.66.45-1.32.57-2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M9 6.8a6 6 0 0 1 9 5.2v2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M14 13.12c0 2.38 0 6.38-1 8.88\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M17.29 21.02c.12-.6.43-2.3.5-3.02\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M2 12a10 10 0 0 1 18-6\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M2 16h.01\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21.8 16c.2-2 .131-5.354 0-6\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M8.65 22c.21-.66.45-1.32.57-2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M9 6.8a6 6 0 0 1 9 5.2v2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":1,"overflow":"hidden"},
  v2: {"flexDirection":"row","alignItems":"stretch","width":56,"height":56},
  t3: {"color":"#0f1422","fontSize":28,"lineHeight":31.4,"letterSpacing":-0.7,"textAlign":"center","fontFamily":"PlusJakartaSans_800ExtraBold"},
  t4: {"color":"#4a5467","fontSize":15,"lineHeight":21.8,"textAlign":"center","fontFamily":"Inter_400Regular"},
  v5: {"flexDirection":"column","alignItems":"center","rowGap":10,"columnGap":10,"paddingRight":24,"paddingLeft":24},
  v6: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t7: {"color":"#b42318","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t8: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v9: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v10: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#feeeec","borderRadius":18},
  v11: {"flexShrink":0,"overflow":"hidden"},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":132,"height":132,"backgroundColor":"#eef0ff","borderRadius":66,"boxShadow":"rgba(59, 76, 202, 0.06) 0px 0px 0px 12px"},
  t13: {"color":"#4a5467","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_600SemiBold"},
  v14: {"flexDirection":"column","alignItems":"center","rowGap":14,"columnGap":14,"marginTop":18},
  v15: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":22,"columnGap":22,"paddingTop":28,"paddingBottom":12},
  v17: {"borderRadius":18},
  t18: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v19: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t20: {"color":"#4a5467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v22: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v23: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
