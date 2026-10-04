// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-06 Verify code · phone (P1, phone). The 6-digit SMS code for the number typed on SM-05, typed on the drawn
// keypad; "Verify" (L69) posts it to the token endpoint and opens the store (onboarding first, as before).
// "Resend code in 0:24" (L71) opens SM-31 as designed (a new code, voice call, other ways in).
import { Text, View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { clock, fullNumber, phoneSignIn } from '@/auth/direct';
import { useCountdown } from '@/auth/countdown';
import { useAccessProblem, useDirectSignIn } from '@/lodestar/live';
import { Keypad, typeKey } from '@/lodestar/keypad';
import { Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';
import { DeskButton, DeskField, DeskFrame, DeskHead, DeskLink, DeskOr, DeskSmall, ICONS } from '@/lodestar/desk-auth';

const nav: ScreenNav = {"links":{"L69":{"to":"sm-07-onboarding-1","kind":"go"},"L70":{"to":"sm-05-sign-in","kind":"go"},"L71":{"to":"sm-31-can-t-sign-in","kind":"go"}}};

export default function ScreenSm06VerifyCode() {
  const flow = useDirectSignIn('store');
  const problem = useAccessProblem();
  const p = useStore(phoneSignIn);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const left = useCountdown(p.resendAt);

  const verify = async (value = code) => {
    if (!p.digits) {
      setError('Send a code from the sign-in screen first.');
      return false;
    }
    if (value.length !== 6) {
      setError('Enter all 6 digits.');
      return false;
    }
    setError(null);
    const r = await flow.verifyCode(value);
    if (!r.ok) {
      setCode('');
      setError(r.description);
    }
    return false; // the store opens through enterApp
  };

  const onKey = (k: Parameters<typeof typeKey>[1]) => {
    if (k === 'enter') return void verify();
    const next = typeKey(code, k, 6);
    setCode(next);
    if (next.length === 6 && code.length === 5) void verify(next);
  };

  // Desktop/tablet browser: the DSP-06 desk sign-in card (desk-auth.tsx), the code typed in a field.
  const desk = (
    <>
      <DeskHead
        app="store" title="Enter the code" error={error} note={problem?.message}
        sub={`${p.step?.method === 'voice' ? 'Calling' : 'Sent by SMS to'} ${p.digits ? fullNumber(p.digits) : 'your phone'}.`}
      />
      <DeskField
        label="6-digit code" icon={ICONS.key} testID="code-input" value={code} placeholder="000000" keyboardType="number-pad" maxLength={6}
        autoFocus autoComplete="one-time-code" onSubmitEditing={() => void verify()}
        onChangeText={v => {
          const next = v.replace(/\D/g, '').slice(0, 6);
          setCode(next);
          if (next.length === 6 && code.length < 6) void verify(next);
        }}
        right={<DeskLink lk="L71" label={left > 0 ? `Resend in ${clock(left)}` : 'Resend code'} />}
      />
      {p.step?.demoCode ? <DeskSmall testID="demo-code">{`Demo: your code is ${p.step.demoCode}`}</DeskSmall> : null}
      <DeskButton lk="L69" label={flow.busy ? 'Checking…' : 'Verify'} onPress={() => verify()} disabled={flow.busy} />
      <DeskOr />
      <DeskButton lk="L70" secondary icon={ICONS.back} label="Use a different number" />
    </>
  );

  return (
    <DeskFrame app="store" bg="#f4f5f9" nav={nav} style={s.v0} desk={desk}>
      <View style={s.v31}>
        <View style={s.v6}>
          <Tap lk="L70" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <View>
              <Text style={s.t3}>{"Verify"}</Text>
            </View>
          </View>
          <View style={s.v5} />
        </View>
        <Scroll style={s.v20} contentStyle={s.v21}>
          <View style={s.v10}>
            <View>
              <Text style={s.t7}>{"Enter the code"}</Text>
            </View>
            <View>
              <Text style={[s.t9, error ? { color: '#b42318' } : null]} testID="sign-in-note">
                {error ?? problem?.message ?? <>{"Sent by SMS to "}<Text style={s.t8}>{p.digits ? fullNumber(p.digits) : "your phone"}</Text></>}
              </Text>
            </View>
          </View>
          <View style={s.v15} testID="code-boxes">
            {Array.from({ length: 6 }, (_, i) =>
              i === code.length ? (
                <View key={i} style={s.v14}><View style={s.v13} /></View>
              ) : (
                <View key={i} style={s.v12}><Text style={s.t11}>{code[i] ?? ''}</Text></View>
              ),
            )}
          </View>
          {p.step?.demoCode ? (
            <View style={s.v19}>
              <Text style={s.t17} testID="demo-code">{"Demo: your code is "}<Text style={s.t8}>{p.step.demoCode}</Text></Text>
            </View>
          ) : null}
          <View style={s.v19}>
            <Icon xml={X1} width={14} height={14} style={s.v16} />
            <Tap lk="L71" style={s.v18}>
              <Text style={s.t17}>{left > 0 ? <>{"Resend code in "}<Text style={s.t8}>{clock(left)}</Text></> : "Didn't get it? Resend code"}</Text>
            </Tap>
          </View>
        </Scroll>
        <View style={s.v25}>
          <Tap lk="L69" style={s.v24} onPress={() => verify()} disabled={flow.busy}>
            <Grad g={G0} style={s.v22} />
            <Text style={s.t23}>{flow.busy ? "Checking…" : "Verify"}</Text>
          </Tap>
        </View>
        <Keypad wrap={s.v30} row={s.v28} keyStyle={s.v27} blank={s.v29} text={s.t26} back={{ xml: X2, size: 24, style: s.v1 }} onKey={onKey} />
      </View>
    </DeskFrame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0f1422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z\" fill=\"none\" stroke=\"#0f1422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m18 9-6 6M12 9l6 6\" fill=\"none\" stroke=\"#0f1422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v4: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexShrink":0,"width":40},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#101828","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t8: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t9: {"color":"#475467","fontSize":15,"lineHeight":21.8,"fontFamily":"Inter_400Regular"},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t11: {"color":"#101828","fontSize":26,"lineHeight":39,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":62,"backgroundColor":"#ffffff","borderRadius":14,"boxShadow":"rgb(211, 216, 227) 0px 0px 0px 1px inset"},
  v13: {"flexShrink":0,"width":2,"height":26,"backgroundColor":"#3b4cca","borderRadius":1},
  v14: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":62,"backgroundColor":"#ffffff","borderRadius":14,"boxShadow":"rgb(59, 76, 202) 0px 0px 0px 2px inset, rgb(238, 240, 255) 0px 0px 0px 4px"},
  v15: {"flexDirection":"row","alignItems":"stretch","rowGap":8,"columnGap":8,"marginRight":20,"marginLeft":20},
  v16: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t17: {"color":"#636c80","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v18: {"flexShrink":1},
  v19: {"flexDirection":"row","alignItems":"flex-start","rowGap":8,"columnGap":8,"paddingRight":20,"paddingLeft":20},
  v20: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v21: {"flexDirection":"column","alignItems":"stretch","rowGap":22,"columnGap":22,"paddingBottom":12},
  v22: {"borderRadius":18},
  t23: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v24: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  t26: {"color":"#0f1422","fontSize":24,"lineHeight":36,"fontFamily":"Inter_500Medium"},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":48,"backgroundColor":"#ffffff","borderRadius":8,"boxShadow":"rgba(0, 0, 0, 0.22) 0px 1px 0px 0px"},
  v28: {"flexDirection":"row","alignItems":"stretch","rowGap":6,"columnGap":6},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":48,"borderRadius":8},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":8,"paddingRight":6,"paddingBottom":4,"paddingLeft":6,"backgroundColor":"#d3d7e0"},
  v31: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
