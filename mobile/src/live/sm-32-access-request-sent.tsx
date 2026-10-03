// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-32 Access request sent · phone (P1, phone)
// The phone is not bound to the signed-in user yet: it asked for access (POST Devices, PENDING) and waits
// here until the depot approves it on the desk (ADM-05 Access requests). Used by every face of the field app.
import { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useStore } from '@/lib/store';
import { hm } from '@/lib/time';
import { enrollment } from '@/auth/device-access';
import { hubName, type EnrollmentStatus } from '@/auth/enrollment';
import { SIGN_IN } from '@/auth/roles';
import { enterApp } from '@/auth/use-sign-in';
import { session } from '@/model/platform';
import { signOutTo, useDeviceId, useSignIn } from '@/lodestar/live';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';
import { useDepots } from '@/model/depots';

const nav: ScreenNav = {"links":{"L112":{"to":"sm-05-sign-in","kind":"go"},"C":{"to":"sm-31-can-t-sign-in","kind":"back"}}};

const ROLE_LABEL: Record<string, string> = { store_manager: 'store manager', dispatcher: 'dispatcher', loader: 'loader', driver: 'driver', admin: 'admin' };

const PILL: Record<EnrollmentStatus, { text: string; tone: 'ok' | 'wait' | 'bad' }> = {
  idle: { text: 'Checking', tone: 'wait' },
  sending: { text: 'Sending', tone: 'wait' },
  pending: { text: 'Sent', tone: 'ok' },
  checking: { text: 'Checking', tone: 'wait' },
  approved: { text: 'Approved', tone: 'ok' },
  signin: { text: 'Sign in', tone: 'ok' },
  revoked: { text: 'Removed', tone: 'bad' },
  conflict: { text: 'Not yours', tone: 'bad' },
  error: { text: 'Not sent', tone: 'bad' },
};

function title(status: EnrollmentStatus, hub: string): string {
  switch (status) {
    case 'sending':
    case 'idle':
      return 'Sending your access request';
    case 'signin':
      return 'Sign in again to continue';
    case 'approved':
      return 'Phone approved';
    case 'revoked':
      return 'This phone was removed';
    case 'conflict':
      return 'This phone is registered to someone else';
    case 'error':
      return 'Access request not sent yet';
    default:
      return `Access request sent to ${hub}`;
  }
}

function body(status: EnrollmentStatus, hub: string): string {
  switch (status) {
    case 'signin':
      return `Your session ended. If ${hub} approved this phone, Lodestar opens after you sign in.`;
    case 'revoked':
      return `Ask ${hub} to register this phone again, or use your registered phone.`;
    case 'conflict':
      return `Ask ${hub} to remove it from the other account first.`;
    case 'error':
      return 'Lodestar could not take the request. Check again when you have signal.';
    default:
      return `For security, ${hub} approves every new phone. Ask them to approve the ID below, then tap Check again.`;
  }
}

export default function ScreenSm32AccessRequestSent() {
  const e = useStore(enrollment.state);
  const s = useStore(session.state);
  const installId = useDeviceId();
  const { signIn, ready, busy } = useSignIn();
  const { width } = useWindowDimensions();
  const started = useRef(false);

  // Opened directly (reload, deep link) while signed in: run the binding check once.
  useEffect(() => {
    if (started.current || s.status !== 'signed-in' || !s.claims || e.status !== 'idle') return;
    started.current = true;
    void enterApp(s.claims, width);
  }, [s.status, s.claims, e.status, width]);

  const claims = s.claims;
  const { name: depotName } = useDepots();
  const hub = hubName(claims?.depots, depotName);
  const device = e.deviceId ?? installId;
  const signedOut = s.status === 'signed-out';
  const needsSignIn = e.status === 'signin' || signedOut;
  const working = e.status === 'sending' || e.status === 'checking';
  const pill = PILL[needsSignIn && e.status !== 'signin' ? 'signin' : e.status];
  const approvedStep = e.status === 'signin' || e.status === 'approved';
  const who = [claims?.name ?? claims?.username, claims?.roles.map(r => ROLE_LABEL[r]).filter(Boolean)[0]].filter(Boolean).join(', ');
  const face = s.face ?? 'store';

  async function primary() {
    // Sign-in first, before any await: the web build opens the login popup from this tap.
    if (needsSignIn) return signIn();
    const status = await enrollment.checkAgain();
    if (status === 'approved' && session.claims) await enterApp(session.claims, width);
    return false;
  }

  const primaryText = needsSignIn ? (busy ? 'Signing in…' : 'Sign in again') : e.status === 'checking' ? 'Checking…' : e.status === 'sending' ? 'Sending…' : e.status === 'error' ? 'Try again' : 'Check again';

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s0.v0}>
      <View style={s0.v44}>
        <View style={s0.v7}>
          <Tap lk="C" style={s0.v2}>
            <Icon xml={X0} width={20} height={20} style={s0.v1} />
          </Tap>
          <View style={s0.v5}>
            <View>
              <Text style={s0.t3}>{"Access request"}</Text>
            </View>
            <View>
              <Text style={s0.t4} numberOfLines={1}>{device ? `This phone · ${device}` : 'This phone'}</Text>
            </View>
          </View>
          <View style={s0.v6} />
        </View>
        <Scroll style={s0.v36} contentStyle={s0.v37}>
          <View style={s0.v14}>
            <View style={s0.v11}>
              <View style={s0.v8}>
                <Text style={s0.t4} testID="enroll-requested-at">{e.requestedAt ? `Sent ${hm(e.requestedAt)}` : e.checkedAt ? `Checked ${hm(e.checkedAt)}` : 'Not sent yet'}</Text>
              </View>
              <View style={s0.v10}>
                {pill.tone === 'ok' ? <Icon xml={X1} width={14} height={14} style={s0.v1} /> : null}
                <Text style={[s0.t9, pill.tone === 'wait' && x.wait, pill.tone === 'bad' && x.bad]} numberOfLines={1} testID="enroll-status">{pill.text}</Text>
              </View>
            </View>
            <View>
              <Text style={s0.t12} testID="enroll-title">{title(e.status, hub)}</Text>
            </View>
            <View>
              <Text style={s0.t13} testID="enroll-message">{e.message ?? body(needsSignIn ? 'signin' : e.status, hub)}</Text>
            </View>
          </View>
          <View style={s0.v31}>
            <View style={s0.v16}>
              <View style={s0.v8}>
                <Text style={s0.t15}>{"What happens next"}</Text>
              </View>
            </View>
            <View style={s0.v30}>
              <View style={s0.v29}>
                <View style={s0.v25}>
                  <View style={s0.v19}>
                    {e.requestedAt ? (
                      <View style={s0.v17}>
                        <Icon xml={X2} width={13} height={13} style={s0.v1} />
                      </View>
                    ) : (
                      <View style={s0.v26} />
                    )}
                    <View style={e.requestedAt ? s0.v18 : s0.v27} />
                  </View>
                  <View style={s0.v24}>
                    <View style={s0.v22}>
                      <View style={s0.v8}>
                        <Text style={s0.t3}>{"Request sent"}</Text>
                      </View>
                      <View style={s0.v21}>
                        <Text style={s0.t20} numberOfLines={1}>{e.requestedAt ? hm(e.requestedAt) : '—'}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={s0.t23}>{who ? `For ${who}` : 'For the signed-in account'}</Text>
                    </View>
                  </View>
                </View>
                <View style={s0.v25}>
                  <View style={s0.v19}>
                    {approvedStep ? (
                      <View style={s0.v17}>
                        <Icon xml={X2} width={13} height={13} style={s0.v1} />
                      </View>
                    ) : (
                      <View style={e.requestedAt ? s0.v26 : s0.v28} />
                    )}
                    <View style={approvedStep ? s0.v18 : s0.v27} />
                  </View>
                  <View style={s0.v24}>
                    <View style={s0.v22}>
                      <View style={s0.v8}>
                        <Text style={s0.t3}>{`${hub} approves this phone`}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={s0.t23}>{"An admin checks it's you, then approves the phone"}</Text>
                    </View>
                  </View>
                </View>
                <View style={s0.v25}>
                  <View style={s0.v19}>
                    <View style={approvedStep ? s0.v26 : s0.v28} />
                  </View>
                  <View style={s0.v24}>
                    <View style={s0.v22}>
                      <View style={s0.v8}>
                        <Text style={s0.t3}>{needsSignIn ? 'Sign in again' : 'Check again'}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={s0.t23}>{"Lodestar opens on this phone"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={s0.v35}>
            <Icon xml={X3} width={20} height={20} style={s0.v32} />
            <View style={s0.v34}>
              <View>
                <Text style={s0.t33}>{"This phone's ID"}</Text>
              </View>
              <View>
                <Text style={[s0.t13, x.id]} selectable testID="device-id">{device ?? '…'}</Text>
              </View>
              <View>
                <Text style={s0.t13}>{`Read it out to ${hub} if they ask which phone to approve.`}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s0.v43}>
          <Tap lk="L112" to={null} style={s0.v40} onPress={primary} disabled={working || (needsSignIn && (!ready || busy))} testID="check-again">
            <Grad g={G0} style={s0.v38} />
            <Text style={s0.t39}>{primaryText}</Text>
          </Tap>
          <Tap style={s0.v42} to={null} onPress={() => signOutTo(SIGN_IN[face])} testID="enroll-sign-out">
            <Text style={s0.t41}>{signedOut ? 'Back to sign in' : 'Sign out'}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  wait: { color: '#b45309' },
  bad: { color: '#b42318' },
  id: { color: '#101828', fontFamily: 'Inter_700Bold' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 6 6 18M6 6l12 12\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s0 = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":0,"width":40},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v8: {"flexShrink":1},
  t9: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v10: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v11: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t12: {"color":"#101828","fontSize":24,"lineHeight":28.8,"letterSpacing":-0.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t13: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t15: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v17: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#047857","borderRadius":12},
  v18: {"flexGrow":1,"flexBasis":"0%","marginTop":3,"marginBottom":3,"width":2,"minHeight":10,"backgroundColor":"#047857","borderRadius":1},
  v19: {"flexDirection":"column","alignItems":"center","flexShrink":0,"width":24},
  t20: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v21: {"flexShrink":0},
  v22: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","rowGap":10,"columnGap":10},
  t23: {"color":"#475467","fontSize":13,"lineHeight":18.9,"fontFamily":"Inter_400Regular"},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":1,"paddingBottom":16},
  v25: {"flexDirection":"row","alignItems":"stretch","rowGap":12,"columnGap":12},
  v26: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#0369a1","borderRadius":12,"boxShadow":"rgb(230, 244, 252) 0px 0px 0px 4px"},
  v27: {"flexGrow":1,"flexBasis":"0%","marginTop":3,"marginBottom":3,"width":2,"minHeight":10,"backgroundColor":"#d3d8e3","borderRadius":1},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":24,"height":24,"backgroundColor":"#ffffff","borderRadius":12,"boxShadow":"rgb(211, 216, 227) 0px 0px 0px 2px inset"},
  v29: {"flexDirection":"column","alignItems":"stretch","paddingTop":16,"paddingRight":16,"paddingBottom":4,"paddingLeft":16},
  v30: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v32: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t33: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v35: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v36: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v37: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v38: {"borderRadius":18},
  t39: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v40: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t41: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v44: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
