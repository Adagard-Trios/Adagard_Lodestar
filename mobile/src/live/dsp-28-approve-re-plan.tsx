// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-28 Approve re-plan · phone (P2, phone)
// A human dispatcher approves here (Plans('…')/Lodestar.Approve); the app never approves by itself.
// A plan with rule violations (summary.violations) needs a reason to override them, sent as overrideReason.
import { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import * as api from '@/model/api';
import { useClaims, useOnline } from '@/model/hooks';
import { planSource, readPlan, usePlan } from '@/model/plan';
import { bumpRevision, client } from '@/model/platform';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L180":{"to":"dsp-27-alerts","kind":"go"},"B":{"to":"dsp-27-alerts","kind":"back"}}};

export default function ScreenDsp28ApproveRePlan() {
  const claims = useClaims();
  const online = useOnline();
  const { plan, loading, plans } = usePlan();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const v = readPlan(plan);
  const violations: unknown[] = Array.isArray(plan?.summary?.violations) ? plan.summary.violations : [];
  const open = plan ? plan.status === 'NEEDS_APPROVAL' || plan.status === 'DRAFT' : false;

  const banner = !claims
    ? { title: 'Sign in to review re-plans', body: 'Nothing is sent until you approve.' }
    : !plan
      ? { title: loading || plans.loading ? 'Loading the plan…' : 'No plan waiting for approval', body: 'New re-plans show in Alerts.' }
      : {
          title:
            v.shortM3 && v.shortM3 > 0
              ? `Chilled short ${v.shortM3} m³ · ${titleCase(plan.depot)}`
              : v.rulesTotal !== undefined && v.rulesPassed !== undefined && v.rulesPassed < v.rulesTotal
                ? `${plural(v.rulesTotal - v.rulesPassed, 'rule check')} not passing`
                : `Plan v${plan.version} · ${titleCase(plan.depot)}`,
          body: [`Run ${dayLabel(plan.runDate)}`, titleCase(plan.status), plan.notes].filter(Boolean).join(' · '),
        };

  const facts = plan
    ? [
        plural(v.deferrals, 'deferral'),
        v.trips !== undefined ? plural(v.trips, 'trip') : undefined,
        v.changes.length ? plural(v.changes.length, 'change') : undefined,
        v.rulesTotal !== undefined ? `${v.rulesPassed}/${v.rulesTotal} rules pass` : undefined,
      ].filter(Boolean).join(', ') + (open ? '. Approve to send; nothing is sent before.' : '.')
    : '';

  const approve = async () => {
    if (!claims) return true; // design preview: prototype navigation
    if (!online) throw new Error('Approving needs signal');
    if (!plan) throw new Error('No plan is waiting for approval');
    if (!open) throw new Error(`Plan v${plan.version} is already ${titleCase(plan.status).toLowerCase()}`);
    if (violations.length && !reason.trim()) throw new Error('Give a reason to override the rule violations');
    setBusy(true);
    try {
      const done = await api.approvePlan(client, plan.id, undefined, violations.length ? reason.trim() : undefined);
      bumpRevision();
      showToast(`Plan v${done?.version ?? plan.version} approved and sent`);
      return true;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v50}>
        <View style={s.v6}>
          <View style={s.v3}>
            <Tap lk="B"><Icon xml={X0} width={22} height={22} style={s.v1} /></Tap>
            <Text style={s.t2}>{"Alerts"}</Text>
          </View>
          <View style={s.v5}>
            <Text style={s.t4}>{"Re-plan"}</Text>
          </View>
        </View>
        <Scroll style={s.v42} contentStyle={s.v43}>
          <View style={s.v11}>
            <Icon xml={X1} width={20} height={20} style={s.v7} />
            <View style={s.v10}>
              <View>
                <Text style={s.t8} testID="plan-title">{banner.title}</Text>
              </View>
              <View>
                <Text style={s.t9}>{banner.body}</Text>
              </View>
            </View>
          </View>
          {plan ? (
            <View style={s.v16}>
              <View>
                <Text style={s.t12}>{`${planSource(plan)} drafted v${plan.version} at ${hm(plan.createdAt)}`}</Text>
              </View>
              <View>
                {v.total !== undefined && v.served !== undefined ? (
                  <Text style={s.t14} testID="plan-served">{`${v.served} of ${v.total} `}<Text style={s.t13}>{"served"}</Text></Text>
                ) : (
                  <Text style={s.t14}>{v.trips !== undefined ? `${v.trips} ` : '— '}<Text style={s.t13}>{"trips"}</Text></Text>
                )}
              </View>
              <View>
                <Text style={s.t9}>{v.explanation ? `${v.explanation} ` : ''}{facts}</Text>
              </View>
            </View>
          ) : null}
          {v.changes.length ? (
            <View style={s.v31}>
              <View style={s.v19}>
                <View style={s.v18}>
                  <Text style={s.t17}>{plural(v.changes.length, 'change')}</Text>
                </View>
                <View style={s.v18} />
              </View>
              <View style={s.v30}>
                {v.changes.map((c, i) => (
                  <View key={i} style={i === 0 ? s.v26 : s.v27}>
                    <View style={c.warn ? s.v29 : s.v21}>
                      <View style={s.v18}>
                        <Text style={c.warn ? s.t28 : s.t20}>{String(i + 1)}</Text>
                      </View>
                    </View>
                    <View style={s.v25}>
                      <View>
                        <Text style={s.t22}>{c.title}</Text>
                      </View>
                      {c.meta || c.code ? (
                        <View>
                          <Text style={s.t24}>{c.code ? <Text style={s.t23}>{c.code}</Text> : null}{c.code && c.meta ? ' · ' : ''}{c.meta}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {v.review.length ? (
            <View style={s.v31}>
              <View style={s.v19}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"Your call"}</Text>
                </View>
                <View style={s.v18}>
                  <Text style={s.t32}>{plural(v.review.length, 'order')}</Text>
                </View>
              </View>
              {v.review.map((r, i) => (
                <View key={i} style={s.v41}>
                  <View style={s.v25}>
                    <View>
                      <Text style={s.t34}>{r.title}</Text>
                    </View>
                    <View>
                      <Text style={s.t35}>{r.meta}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {violations.length ? (
            <View style={s.v31}>
              <View style={s.v19}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"Override reason"}</Text>
                </View>
                <View style={s.v18}>
                  <Text style={s.t32}>{plural(violations.length, 'rule violation')}</Text>
                </View>
              </View>
              <View style={s.v41}>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Why you approve despite the violations"
                  placeholderTextColor="#8f98aa"
                  style={[s.t35, x.input]}
                  testID="override-reason"
                />
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v49}>
          <Tap lk="L180" style={s.v46} onPress={approve} disabled={busy}>
            <Grad g={G0} style={s.v44} />
            <Icon xml={X2} width={22} height={22} style={s.v1} />
            <Text style={s.t45}>{busy ? "Approving…" : "Approve & send"}</Text>
          </Tap>
          <View style={s.v48}>
            <Text style={s.t47}>{"Open on desktop"}</Text>
          </View>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" data-lk=\"B\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m15 18-6-6 6-6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m22 2-7 20-4-9-9-4Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M22 2 11 13\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const x = StyleSheet.create({
  input: { flex: 1, paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0 },
});

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  t2: {"color":"#3b4cca","fontSize":16,"lineHeight":24,"fontFamily":"Inter_700Bold"},
  v3: {"flexDirection":"row","alignItems":"center","rowGap":2,"columnGap":2,"flexShrink":1},
  t4: {"color":"#0f1422","fontSize":16,"lineHeight":24,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%","marginRight":58},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v7: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t8: {"color":"#b42318","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t9: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v11: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#feeeec","borderRadius":18},
  t12: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  t13: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t14: {"color":"#0f1422","fontSize":44,"lineHeight":44,"letterSpacing":-1.3,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t15: {"color":"#0f1422","fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t17: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexShrink":1},
  v19: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t20: {"color":"#3b4cca","fontSize":15,"lineHeight":22.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  t22: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t23: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t24: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v26: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v27: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t28: {"color":"#b45309","fontSize":15,"lineHeight":22.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#fff4e0","borderRadius":14},
  v30: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  t32: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v33: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"marginTop":2,"width":22,"height":22,"backgroundColor":"#ffffff","borderRadius":11,"boxShadow":"rgb(59, 76, 202) 0px 0px 0px 7px inset"},
  t34: {"color":"#0f1422","fontSize":15.5,"lineHeight":23.3,"fontFamily":"Inter_700Bold"},
  t35: {"color":"#4a5467","fontSize":13.5,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v36: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#b45309","borderRadius":3.5},
  t37: {"color":"#b45309","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v38: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5},
  v39: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgb(59, 76, 202) 0px 0px 0px 2px, rgba(59, 76, 202, 0.12) 0px 6px 16px 0px"},
  v40: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"marginTop":2,"width":22,"height":22,"backgroundColor":"#ffffff","borderRadius":11,"boxShadow":"rgb(211, 216, 227) 0px 0px 0px 1.5px inset"},
  v41: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgba(15, 20, 50, 0.05) 0px 1px 2px 0px"},
  v42: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":4,"paddingBottom":12},
  v44: {"borderRadius":18},
  t45: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v46: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t47: {"color":"#4a5467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v48: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v49: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v50: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
