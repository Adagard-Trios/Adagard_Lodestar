// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-33 Me and alert rules · phone (P2, phone)
// Alert rules and on-call hours are the user's own settings (Users/Lodestar.MyPreferences, saved with
// SaveMyPreferences), the same record the desk's DSP-20 edits. Tapping a rule saves it.
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { signOutTo, titleCase, useDeviceId } from '@/lodestar/live';
import { useClaims } from '@/model/hooks';
import { depotsLabel, useAlertCount } from '@/model/plan';
import { alertRules, clock12, DEFAULT_ALERTS, LATE_RISK_PCT, onCallNow, savePreferences, SMS_UNAVAILABLE, useDeliveryChannels, usePreferences, type Preferences } from '@/model/preferences';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';
import { useDepots } from '@/model/depots';

const nav: ScreenNav = {"links":{"N0":{"to":"dsp-27-alerts","kind":"nav"},"N1":{"to":"dsp-29-live-routes","kind":"nav"},"N2":{"to":"dsp-32-plans","kind":"nav"}}};

const initials = (name?: string) =>
  name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]!.toUpperCase())
        .join('')
    : '—';

type RuleRow = { key: string; icon: string; tile: StyleProp<ViewStyle>; title: string; sub: string; on: boolean; set: (v: boolean) => Preferences['alerts'] };

export default function ScreenDsp33MeAndAlertRules() {
  useDepots(); // re-render when the depot names (depotsLabel) arrive
  const claims = useClaims();
  const device = useDeviceId();
  const alertCount = useAlertCount();
  const prefs = usePreferences();
  // SMS only when the deployment sends it; there is no call channel (no voice provider)
  const sms = useDeliveryChannels().data?.sms === true;
  const name = claims?.name ?? claims?.username;
  const role = claims ? (claims.roles.includes('dispatcher') ? 'Dispatcher' : titleCase(claims.roles[0])) : '';
  const depots = depotsLabel(claims?.depots);
  const a = alertRules(prefs.data);
  const onCall = prefs.data?.onCall;
  const from = onCall?.from && clock12(onCall.from);
  const to = onCall?.to && clock12(onCall.to);
  const now = !!(from && to) && onCallNow(onCall);
  const rows: RuleRow[] = [
    { key: 'vehicleFault', icon: X0, tile: s.v22, title: "Vehicle can't depart", sub: sms ? [a.vehicleFault.push && 'Push', a.vehicleFault.sms && 'SMS'].filter(Boolean).join(' and ') || 'Off' : `${a.vehicleFault.push ? 'Push' : 'Off'} · ${SMS_UNAVAILABLE}`, on: !!(a.vehicleFault.push || (sms && a.vehicleFault.sms)), set: v => ({ ...a, vehicleFault: sms ? { push: v, sms: v } : { ...a.vehicleFault, push: v } }) },
    { key: 'lateRisk', icon: X1, tile: s.v28, title: `Late risk ${a.lateRisk.threshold ?? LATE_RISK_PCT}% or more`, sub: a.lateRisk.risingOnly ? 'Push · rising risk only' : 'Push', on: !!a.lateRisk.push, set: v => ({ ...a, lateRisk: { ...a.lateRisk, push: v } }) },
    { key: 'flags', icon: X2, tile: s.v28, title: 'Loader and store flags', sub: 'Push · shortfalls, blocked docks', on: !!a.flags.push, set: v => ({ ...a, flags: { push: v } }) },
    { key: 'silence', icon: X3, tile: s.v22, title: `Silent ${a.silence.minutes ?? DEFAULT_ALERTS.silence.minutes} min, unknown place`, sub: a.silence.push ? 'Push' : 'Off', on: !!a.silence.push, set: v => ({ ...a, silence: { ...a.silence, push: v } }) },
    { key: 'signalZones', icon: X4, tile: s.v30, title: 'Known signal-loss zones', sub: a.signalZones.alert ? 'Alert when a van goes quiet there' : 'Show as predicted, no alert', on: !!a.signalZones.alert, set: v => ({ ...a, signalZones: { alert: v } }) },
  ];
  const onCount = rows.filter(r => r.on).length;
  const big = now ? to : from;
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v41}>
        <Scroll style={s.v10} contentStyle={s.v35}>
          <View style={s.v6}>
            <View style={s.v2}>
              <Text style={s.t1}>{initials(name)}</Text>
            </View>
            <View style={s.v5}>
              <View>
                <Text style={s.t3} testID="me-name">{name ?? "Not signed in"}</Text>
              </View>
              <View>
                <Text style={s.t4}>{claims ? [role, depots].filter(Boolean).join(' · ') : "Sign in to get alerts on this phone"}</Text>
              </View>
            </View>
          </View>
          <View style={s.v17} testID="on-call">
            <Grad g={G0} style={s.v7} />
            <View style={s.v13}>
              <View style={s.v9}>
                <Text style={s.t8}>{!(from && to) ? "On-call hours" : now ? "On call now" : "Off call now"}</Text>
              </View>
              <View style={s.v10} />
              {from && to ? (
                <View style={now ? s.v12 : s.v31}>
                  <View style={s.v11} />
                </View>
              ) : null}
            </View>
            {from && to && big ? (
              <>
                <View>
                  <Text style={s.t15}>{`${now ? 'until' : 'from'} ${big.slice(0, -3)}`}<Text style={s.t14}>{big.slice(-2)}</Text></Text>
                </View>
                <View>
                  <Text style={s.t16}>{`${from} to ${to}, set on the desk in Settings.`}</Text>
                </View>
              </>
            ) : (
              <View>
                <Text style={s.t16}>{prefs.data ? "Not set yet. Set your on-call hours on the desk in Settings." : prefs.error ? "Couldn't load your settings." : "Loading…"}</Text>
              </View>
            )}
          </View>
          <View style={s.v33}>
            <View style={s.v20}>
              <View style={s.v9}>
                <Text style={s.t18}>{"What wakes me"}</Text>
              </View>
              <View style={s.v9}>
                <Text style={s.t19} testID="rules-on">{`${onCount} of ${rows.length} on`}</Text>
              </View>
            </View>
            <View style={s.v32}>
              {rows.map((r, i) => (
                <Tap key={r.key} style={i === 0 ? s.v27 : s.v29} testID={`rule-${r.key}`} disabled={!claims} onPress={() => savePreferences({ alerts: r.set(!r.on) })}>
                  <View style={r.tile}>
                    <Icon xml={r.icon} width={21} height={21} style={s.v21} />
                  </View>
                  <View style={s.v25}>
                    <View>
                      <Text style={s.t23}>{r.title}</Text>
                    </View>
                    <View>
                      <Text style={s.t24}>{r.sub}</Text>
                    </View>
                  </View>
                  <View style={s.v26}>
                    <View style={r.on ? s.v12 : s.v31} accessibilityRole="switch" accessibilityState={{ checked: r.on }}>
                      <View style={s.v11} />
                    </View>
                  </View>
                </Tap>
              ))}
            </View>
          </View>
          <View style={s.v33}>
            <View style={s.v20}>
              <View style={s.v9}>
                <Text style={s.t18}>{"Account"}</Text>
              </View>
              <View style={s.v9} />
            </View>
            <View style={s.v32}>
              <View style={s.v27}>
                <View style={s.v34}>
                  <Icon xml={X12} width={21} height={21} style={s.v21} />
                </View>
                <View style={s.v25}>
                  <View>
                    <Text style={s.t23}>{"This phone"}</Text>
                  </View>
                  <View>
                    <Text style={s.t24} testID="device-id">{device ?? "…"}</Text>
                  </View>
                </View>
              </View>
              <Tap style={s.v29} testID="sign-out" onPress={() => signOutTo('dsp-26-sign-in')}>
                <View style={s.v22}>
                  <Icon xml={X8} width={21} height={21} style={s.v21} />
                </View>
                <View style={s.v25}>
                  <View>
                    <Text style={s.t23}>{"Sign out"}</Text>
                  </View>
                  <View>
                    <Text style={s.t24}>{"Alerts stop on this phone"}</Text>
                  </View>
                </View>
              </Tap>
            </View>
          </View>
        </Scroll>
        <View style={s.v40}>
          <Tap lk="N0" style={s.v38}>
            <Icon xml={X9} width={24} height={24} style={s.v21} />
            <Text style={s.t19}>{"Alerts"}</Text>
            {alertCount ? (
              <View style={s.v37}>
                <Text style={s.t36}>{String(alertCount)}</Text>
              </View>
            ) : null}
          </Tap>
          <Tap lk="N1" style={s.v38}>
            <Icon xml={X10} width={24} height={24} style={s.v21} />
            <Text style={s.t19}>{"Live"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v38}>
            <Icon xml={X11} width={24} height={24} style={s.v21} />
            <Text style={s.t19}>{"Plans"}</Text>
          </Tap>
          <View style={s.v38}>
            <Icon xml={X12} width={24} height={24} style={s.v21} />
            <Text style={s.t39}>{"Me"}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X10 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m3 11 19-9-9 19-2-8-8-2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X11 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></svg>";
const X12 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#1e2766","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  t1: {"color":"#1a1300","fontSize":18,"lineHeight":27,"fontFamily":"Inter_800ExtraBold"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":56,"height":56,"backgroundColor":"#f5b83d","borderRadius":28},
  t3: {"color":"#0f1422","fontSize":22,"lineHeight":26.4,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t4: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v5: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingRight":20,"paddingLeft":20},
  v7: {"borderRadius":24},
  t8: {"color":"#b9c0e6","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v9: {"flexShrink":1},
  v10: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v11: {"flexShrink":1,"width":22,"height":22,"backgroundColor":"#ffffff","borderRadius":11,"boxShadow":"rgba(0, 0, 0, 0.2) 0px 1px 3px 0px"},
  v12: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":46,"height":28,"backgroundColor":"#3b4cca","borderRadius":14},
  v13: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t14: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t15: {"color":"#ffffff","fontSize":40,"lineHeight":40,"letterSpacing":-1.2,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t16: {"color":"#dde1f5","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"borderRadius":24,"boxShadow":"rgba(20, 27, 77, 0.28) 0px 12px 32px 0px"},
  t18: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t19: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v21: {"flexShrink":0,"overflow":"hidden"},
  v22: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#feeeec","borderRadius":14},
  t23: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t24: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v26: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v27: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#fff4e0","borderRadius":14},
  v29: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  v31: {"flexDirection":"row","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":46,"height":28,"backgroundColor":"#d5dae4","borderRadius":14},
  v32: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v33: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  v34: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":10,"paddingBottom":12},
  t36: {"color":"#ffffff","fontSize":11,"lineHeight":16.5,"fontFamily":"Inter_800ExtraBold"},
  v37: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":5,"paddingLeft":5,"marginLeft":6,"position":"absolute","top":0,"right":19.8,"bottom":36.5,"left":43.8,"height":18,"minWidth":18,"backgroundColor":"#b42318","borderRadius":9},
  v38: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  t39: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v40: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":8,"paddingRight":12,"paddingBottom":2,"paddingLeft":12,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v41: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
