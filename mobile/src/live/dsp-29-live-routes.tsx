// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-29 Live routes · phone (P2, phone)
import type { ReactNode } from 'react';
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { useClaims, useLiveRoutes } from '@/model/hooks';
import { depotsLabel, LATE_RISK, tripProgress, useAlertCount, useSignalLost } from '@/model/plan';
import type { Trip } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L181":{"to":"dsp-30-vehicle-detail","kind":"go"},"N0":{"to":"dsp-27-alerts","kind":"nav"},"N2":{"to":"dsp-32-plans","kind":"nav"},"N3":{"to":"dsp-33-me-and-alert-rules","kind":"nav"}}};

type Kind = 'exception' | 'late' | 'signal' | 'enroute' | 'other';

type Row = { trip: Trip; kind: Kind; title: string; sub: ReactNode; risk: number };

const STATUS: Record<Trip['status'], string> = { PLANNED: 'Planned', LOADING: 'Loading', ENROUTE: 'En route', COMPLETE: 'Complete' };

export default function ScreenDsp29LiveRoutes() {
  const claims = useClaims();
  const { data, loading, error } = useLiveRoutes();
  const lost = useSignalLost();
  const alertCount = useAlertCount();
  const trips = data?.trips ?? [];

  const rows: Row[] = trips.map(t => {
    const p = tripProgress(t);
    const lostAt = lost.get(t.vehicleId);
    const kind: Kind = p.exception ? 'exception' : p.risk >= LATE_RISK ? 'late' : lostAt ? 'signal' : t.status === 'ENROUTE' ? 'enroute' : 'other';
    const count = `${p.done}/${p.stops.length}`;
    const sub: ReactNode =
      kind === 'signal' ? (
        `Last seen ${hm(lostAt)} · ${count} · no signal`
      ) : kind === 'exception' ? (
        <>{`Exception · ${count}`}{p.stops.find(s => s.status === 'EXCEPTION') ? <>{' · '}<Text style={s.t22}>{p.stops.find(s => s.status === 'EXCEPTION')!.outletId}</Text></> : null}</>
      ) : p.next ? (
        <>{`${t.status === 'ENROUTE' ? '' : `${STATUS[t.status]} · `}${count} · next `}<Text style={s.t22}>{p.next.outletId}</Text>{p.next.etaModel ? ` ~${hm(p.next.etaModel)}` : ''}</>
      ) : (
        `${STATUS[t.status]} · ${count}`
      );
    return { trip: t, kind, title: `${t.vehicleId} · ${t.district}`, sub, risk: p.risk };
  });
  const needs = rows.filter(r => r.kind === 'exception' || r.kind === 'late' || r.kind === 'signal');
  const onPlan = rows.filter(r => !needs.includes(r));
  const allStops = trips.flatMap(t => t.stops ?? []);
  const delivered = allStops.filter(x => x.status === 'DELIVERED').length;
  const pct = allStops.length ? Math.round((delivered / allStops.length) * 1000) / 10 : 0;
  const lkRow = needs[0] ?? onPlan[0];
  const status = !claims ? 'Sign in to see live routes' : data ? (trips.length ? `${delivered} of ${allStops.length} delivered` : 'No trips today') : loading ? 'Loading routes…' : error ? 'No signal · nothing saved yet' : 'Loading routes…';

  const row = (r: Row, i: number, style: StyleProp<ViewStyle>) => {
    const [boxStyle, icon]: [StyleProp<ViewStyle>, string] = r.kind === 'exception' ? [s.v20, X0] : r.kind === 'late' ? [s.v29, X2] : r.kind === 'signal' ? [s.v32, X3] : r.kind === 'enroute' ? [s.v37, X4] : [s.v39, X5];
    const riskStyle = r.kind === 'exception' ? s.t25 : r.kind === 'late' ? s.t30 : r.kind === 'signal' ? s.t33 : s.t38;
    const body = (
      <>
        <View style={boxStyle}>
          <Icon xml={icon} width={21} height={21} style={s.v19} />
        </View>
        <View style={s.v24}>
          <View>
            <Text style={s.t21}>{r.title}</Text>
          </View>
          <View>
            <Text style={s.t23}>{r.sub}</Text>
          </View>
        </View>
        <View style={s.v27}>
          <View>
            <Text style={riskStyle}>{`${r.risk}%`}</Text>
          </View>
          <View>
            <Text style={s.t26}>{"late risk"}</Text>
          </View>
        </View>
        <Icon xml={X1} width={18} height={18} style={s.v19} />
      </>
    );
    const to = { to: 'dsp-30-vehicle-detail', params: { vehicle: r.trip.vehicleId } };
    return r === lkRow ? (
      <Tap key={r.trip.id} lk="L181" style={style} to={to}>{body}</Tap>
    ) : (
      <Tap key={r.trip.id} style={style} to={to} testID={`route-row-${i}`}>{body}</Tap>
    );
  };

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v47}>
        <Scroll style={s.v40} contentStyle={s.v41}>
          <View style={s.v10}>
            <View style={s.v5}>
              <View style={s.v3}>
                <View style={s.v1} />
                <Text style={s.t2} numberOfLines={1}>{data && !data.isToday ? `Run ${dayLabel(data.date)}` : `Live ${hm(new Date().toISOString())}`}</Text>
              </View>
              <Text style={s.t4}>{claims?.depots.length ? `· ${depotsLabel(claims.depots)}` : ''}</Text>
            </View>
            <View>
              <Text style={s.t6} testID="routes-status">{status}</Text>
            </View>
            <View style={s.v9}>
              <View style={[s.v8, { width: `${pct}%` }]}>
                <Grad g={G0} style={s.v7} />
              </View>
            </View>
          </View>
          <View style={s.v15}>
            <View style={s.v12}>
              <Text style={s.t11}>{`Needs you · ${needs.length}`}</Text>
            </View>
            <View style={s.v14}>
              <Text style={s.t13}>{`All · ${rows.length}`}</Text>
            </View>
          </View>
          <View style={s.v35}>
            <View style={s.v18}>
              <View style={s.v17}>
                <Text style={s.t16}>{"Needs you"}</Text>
              </View>
              <View style={s.v17} />
            </View>
            <View style={s.v34}>
              {needs.length ? (
                needs.map((r, i) => row(r, i, i === 0 ? s.v28 : s.v31))
              ) : lkRow ? (
                <View style={s.v28}>
                  <View style={s.v24}>
                    <View>
                      <Text style={s.t21}>{"Nothing needs you"}</Text>
                    </View>
                    <View>
                      <Text style={s.t23}>{"No exceptions, late risk or signal loss"}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Tap lk="L181" style={s.v28}>
                  <View style={s.v24}>
                    <View>
                      <Text style={s.t21}>{status}</Text>
                    </View>
                    <View>
                      <Text style={s.t23}>{"Trips of your depots show here"}</Text>
                    </View>
                  </View>
                  <Icon xml={X1} width={18} height={18} style={s.v19} />
                </Tap>
              )}
            </View>
          </View>
          {onPlan.length ? (
            <View style={s.v35}>
              <View style={s.v18}>
                <View style={s.v17}>
                  <Text style={s.t16}>{"On plan"}</Text>
                </View>
                <View style={s.v17}>
                  <Text style={s.t36}>{String(onPlan.length)}</Text>
                </View>
              </View>
              <View style={s.v34}>
                {onPlan.map((r, i) => row(r, needs.length + i, i === 0 ? s.v28 : s.v31))}
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v46}>
          <Tap lk="N0" style={s.v44}>
            <Icon xml={X6} width={24} height={24} style={s.v19} />
            <Text style={s.t36}>{"Alerts"}</Text>
            {alertCount ? (
              <View style={s.v43}>
                <Text style={s.t42}>{String(alertCount)}</Text>
              </View>
            ) : null}
          </Tap>
          <View style={s.v44}>
            <Icon xml={X7} width={24} height={24} style={s.v19} />
            <Text style={s.t45}>{"Live"}</Text>
          </View>
          <Tap lk="N2" style={s.v44}>
            <Icon xml={X8} width={24} height={24} style={s.v19} />
            <Text style={s.t36}>{"Plans"}</Text>
          </Tap>
          <Tap lk="N3" style={s.v44}>
            <Icon xml={X9} width={24} height={24} style={s.v19} />
            <Text style={s.t36}>{"Me"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m3 11 19-9-9 19-2-8-8-2z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":90,"at":null,"repeat":false,"stops":[{"c":"#10b981","p":0},{"c":"#047857","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#047857","borderRadius":3.5},
  t2: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v3: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t6: {"color":"#0f1422","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v7: {"borderRadius":4},
  v8: {"flexShrink":1,"width":"26.6%","borderRadius":4},
  v9: {"flexDirection":"row","alignItems":"stretch","flexShrink":1,"marginTop":6,"height":8,"backgroundColor":"#eef0f6","borderRadius":4,"overflow":"hidden"},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t11: {"color":"#0f1422","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"backgroundColor":"#ffffff","borderRadius":10,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 3px 0px"},
  t13: {"color":"#4a5467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v14: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"borderRadius":10},
  v15: {"flexDirection":"row","alignItems":"stretch","rowGap":4,"columnGap":4,"paddingTop":4,"paddingRight":4,"marginRight":16,"paddingBottom":4,"paddingLeft":4,"marginLeft":16,"backgroundColor":"#eef0f6","borderRadius":14},
  t16: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v17: {"flexShrink":1},
  v18: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v19: {"flexShrink":0,"overflow":"hidden"},
  v20: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#feeeec","borderRadius":14},
  t21: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t22: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t23: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t25: {"color":"#b42318","fontSize":18,"lineHeight":27,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t26: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  v27: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v28: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v29: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#fff4e0","borderRadius":14},
  t30: {"color":"#b45309","fontSize":18,"lineHeight":27,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v31: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v32: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  t33: {"color":"#57534e","fontSize":18,"lineHeight":27,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v34: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  t36: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v37: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#e3f7fb","borderRadius":14},
  t38: {"color":"#047857","fontSize":18,"lineHeight":27,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v39: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  v40: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v41: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":10,"paddingBottom":12},
  t42: {"color":"#ffffff","fontSize":11,"lineHeight":16.5,"fontFamily":"Inter_800ExtraBold"},
  v43: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":5,"paddingLeft":5,"marginLeft":6,"position":"absolute","top":0,"right":19.8,"bottom":36.5,"left":43.8,"height":18,"minWidth":18,"backgroundColor":"#b42318","borderRadius":9},
  v44: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  t45: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v46: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":8,"paddingRight":12,"paddingBottom":2,"paddingLeft":12,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v47: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
