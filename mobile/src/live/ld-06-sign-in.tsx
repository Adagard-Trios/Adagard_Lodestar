// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-06 Sign in · phone (P3, phone). As designed: staff ID (remembered on this phone after a sign-in; "Not you?"
// clears it) and the 4-digit Dock PIN on the drawn keypad, posted straight to the token endpoint (auth/direct.ts):
// the realm's direct-grant flow finds the user by the `staff_id` attribute (or username) and checks the PIN, a
// credential of its own (backend/identity/extension, PinCredentialProvider), not the password.
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { kv } from '@/lib/kv';
import { useAccessProblem, useDirectSignIn } from '@/lodestar/live';
import { Keypad, typeKey } from '@/lodestar/keypad';
import { Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';
import { DeskButton, DeskField, DeskFrame, DeskHead, DeskLink, DeskOr, DeskSmall, ICONS } from '@/lodestar/desk-auth';

const nav: ScreenNav = {"links":{"L44":{"to":"ld-24-can-t-sign-in","kind":"go"},"L187":{"to":"ld-07-start-shift","kind":"go"}}};

const STAFF_KEY = 'lodestar.dock.staff-id';
const PIN_LENGTH = 4;

/** "Night shift · Tue 7 Apr" for now (night 6 PM to 6 AM, the dock's loading window). */
export function shiftLabel(d = new Date()): string {
  const h = d.getHours();
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  return `${h >= 18 || h < 6 ? 'Night' : 'Day'} shift · ${day}`;
}

/**
 * The shift label once mounted: the web build is pre-rendered at build time, so a label computed during render
 * would differ from the phone's clock and break hydration (React #418). Empty on the first (pre-rendered) pass.
 */
export function useShiftLabel(): string {
  const [label, setLabel] = useState('');
  // set after mount: the pre-rendered page and the phone must render the same first frame (no hydration mismatch)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLabel(shiftLabel()), []);
  return label;
}

export default function ScreenLd06SignIn() {
  const flow = useDirectSignIn('dock');
  const shift = useShiftLabel();
  const problem = useAccessProblem();
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void kv.get(STAFF_KEY).then(v => v && setStaffId(s => s || v)).catch(() => undefined);
  }, []);

  const signIn = async (value = pin) => {
    const id = staffId.trim().toUpperCase();
    if (!id) {
      setError('Enter your staff ID.');
      return false;
    }
    if (value.length !== PIN_LENGTH) {
      setError('Enter your 4-digit PIN.');
      return false;
    }
    setError(null);
    await kv.set(STAFF_KEY, id).catch(() => undefined);
    const r = await flow.submit({ username: id, pin: value });
    if (!r.ok) {
      setPin('');
      setError(r.description);
    }
    return false; // the dock opens through enterApp
  };

  const onKey = (k: Parameters<typeof typeKey>[1]) => {
    if (k === 'enter') return void signIn();
    const next = typeKey(pin, k, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH && pin.length === PIN_LENGTH - 1) void signIn(next);
  };

  const notYou = async () => {
    setStaffId('');
    setPin('');
    await kv.remove(STAFF_KEY).catch(() => undefined);
    return false;
  };

  // Desktop/tablet browser: the DSP-06 desk sign-in card (desk-auth.tsx), the PIN typed in a field.
  const desk = (
    <>
      <DeskHead app="dock" title="Sign in to load the trucks" sub={`${shift ? `${shift}. ` : ''}Use your staff ID and 4-digit Dock PIN.`} error={error} note={problem?.message} />
      <DeskField
        label="Staff ID" icon={ICONS.user} testID="staff-id-input" value={staffId} onChangeText={v => setStaffId(v.toUpperCase())}
        placeholder="KDY-0000" autoCapitalize="characters" autoCorrect={false} autoFocus={!staffId} onSubmitEditing={() => void signIn()}
        right={staffId ? <DeskLink label="Not you?" onPress={notYou} to={null} testID="not-you" /> : null}
      />
      <DeskField
        label="PIN · 4 digits" icon={ICONS.lock} testID="pin-input" value={pin} secureTextEntry keyboardType="number-pad" maxLength={PIN_LENGTH}
        placeholder="••••" onSubmitEditing={() => void signIn()}
        onChangeText={v => {
          const next = v.replace(/\D/g, '').slice(0, PIN_LENGTH);
          setPin(next);
          if (next.length === PIN_LENGTH && pin.length < PIN_LENGTH) void signIn(next);
        }}
      />
      <DeskButton lk="L187" label={flow.busy ? 'Signing in…' : 'Sign in'} onPress={() => signIn()} disabled={flow.busy} />
      <DeskOr />
      <DeskButton lk="L44" secondary icon={ICONS.key} label="Can't sign in? Get back in" />
      <DeskSmall>{'Your staff ID and Dock PIN come from your shift lead.'}</DeskSmall>
    </>
  );

  return (
    <DeskFrame app="dock" bg="#f2f4f8" nav={nav} style={s.v0} desk={desk}>
      <View style={s.v35}>
        <View style={s.v7}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v4}>
            <Text style={s.t3}>{"Lodestar Dock"}</Text>
          </View>
          <View style={s.v6}>
            <Text style={s.t5} numberOfLines={1}>{"Dock"}</Text>
          </View>
        </View>
        <Scroll style={s.v4} contentStyle={s.v30}>
          <View style={s.v11}>
            <View style={s.v9}>
              <Text style={s.t8}>{shift || ' '}</Text>
            </View>
            <View>
              <Text style={s.t10}>{"Sign in"}</Text>
            </View>
          </View>
          {error || problem ? (
            <Text style={[s.t13, { color: error ? '#b42318' : '#344054' }]} testID="sign-in-note">{error ?? problem?.message}</Text>
          ) : null}
          <View style={s.v23}>
            <View style={s.v19}>
              <View style={s.v12}>
                <Icon xml={X1} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v16}>
                <View style={s.v14}>
                  <Text style={s.t13}>{"Staff ID"}</Text>
                </View>
                <TextInput
                  testID="staff-id-input"
                  style={[s.t15, { padding: 0, margin: 0, borderWidth: 0, outlineStyle: 'none' } as object]}
                  value={staffId}
                  onChangeText={v => setStaffId(v.toUpperCase())}
                  placeholder="KDY-0000"
                  placeholderTextColor="#98a2b3"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  accessibilityLabel="Staff ID"
                />
              </View>
              <Tap style={s.v18} to={null} onPress={notYou} testID="not-you">
                <Text style={s.t17} numberOfLines={1}>{"Not you?"}</Text>
              </Tap>
            </View>
            <Tap lk="L44" style={s.v22}>
              <View style={s.v12}>
                <Icon xml={X2} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v16}>
                <View style={s.v14}>
                  <Text style={s.t13}>{"PIN · 4 digits"}</Text>
                </View>
                <View style={s.v21} testID="pin-dots">
                  {Array.from({ length: PIN_LENGTH }, (_, i) => (
                    <View key={i} style={[s.v20, i < pin.length ? null : { backgroundColor: 'transparent' }]} />
                  ))}
                </View>
              </View>
              <View style={s.v18}>
                <Text style={s.t17} numberOfLines={1}>{"Can't sign in?"}</Text>
              </View>
            </Tap>
          </View>
          <Keypad
            wrap={s.v29} row={s.v26} keyStyle={s.v25} blank={s.v28} text={s.t24}
            back={{ xml: X3, size: 26, style: s.v1 }}
            clear={{ label: 'Clear', style: s.t27 }}
            onKey={onKey}
          />
        </Scroll>
        <View style={s.v34}>
          <Tap lk="L187" style={s.v33} onPress={() => signIn()} disabled={flow.busy}>
            <Grad g={G0} style={s.v31} />
            <Text style={s.t32}>{flow.busy ? "Signing in…" : "Sign in"}</Text>
            <Icon xml={X4} width={22} height={22} style={s.v1} />
          </Tap>
        </View>
      </View>
    </DeskFrame>
  );
}

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#6d28d9\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"26\" height=\"26\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m18 9-6 6M12 9l6 6\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t5: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e6e9f8","borderRadius":14},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v9: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t10: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e6e9f8","borderRadius":14},
  t13: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v14: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  t15: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"letterSpacing":0.4,"fontFamily":"JetBrainsMono_700Bold"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t17: {"color":"#3b4cca","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexDirection":"row","alignItems":"center","flexShrink":0,"paddingRight":4,"paddingLeft":4,"height":44},
  v19: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64},
  v20: {"flexShrink":1,"width":16,"height":16,"backgroundColor":"#141b4d","borderRadius":8,"boxShadow":"rgb(20, 27, 77) 0px 0px 0px 2px inset"},
  v21: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":4},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"backgroundColor":"#e6e9f8","borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v23: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t24: {"color":"#0a0f1a","fontSize":26,"lineHeight":39,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v25: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":64,"backgroundColor":"#ffffff","borderRadius":16,"boxShadow":"rgba(15, 20, 50, 0.08) 0px 1px 2px 0px"},
  v26: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10},
  t27: {"color":"#344054","fontSize":16,"lineHeight":24,"fontFamily":"Inter_700Bold"},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":64,"borderRadius":16},
  v29: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"marginRight":16,"marginLeft":16},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v31: {"borderRadius":18},
  t32: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v35: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
