// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-15 Handover confirmed · phone (P3, phone)
import { Text, View, StyleSheet } from 'react-native';
import { hm } from '@/lib/time';
import { ackFor, reeferOf, shortfallFor, useTicks } from '@/model/dock';
import { useClaims, useLoadSheet, useNotifications } from '@/model/hooks';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L11":{"to":"dr-01-today-s-run","kind":"go"},"L207":{"to":"ld-19-empty-queue","kind":"go"}}};

export default function ScreenLd15HandoverConfirmed() {
  const claims = useClaims();
  const sheet = useLoadSheet();
  const notes = useNotifications();
  const data = sheet.data;
  const trip = data?.trip;
  const lr = data?.loadRecord;
  const rel = sheet.released;
  const t = useTicks(sheet.tripId);
  const lines = data?.lines ?? [];
  const short = lines.filter(l => !!shortfallFor(sheet.shortfalls, l)).length;
  const ticked = lines.filter(l => t.isTicked(l.id) && !shortfallFor(sheet.shortfalls, l)).length;
  const acked = trip ? sheet.shortfalls.filter(sf => ackFor(notes.data, trip.id, sf.item)).length : 0;
  const stops = [...(data?.stops ?? [])].sort((a, b) => a.stopSeq - b.stopSeq);
  const first = stops[0];
  const driver = trip?.driver?.name ?? null;
  const who = driver ? driver.split(' ')[0] : 'The driver';
  const unsent = rel ? rel.status === 'pending' || rel.status === 'sending' : false;
  const sent = rel?.status === 'synced' || trip?.status === 'ENROUTE' || trip?.status === 'COMPLETE';
  const seal: string | undefined = (typeof rel?.payload.sealNumber === 'string' ? rel.payload.sealNumber : undefined) ?? trip?.sealNumber ?? lr?.sealNumber ?? undefined;
  const temp = typeof rel?.payload.reeferTempC === 'number' ? (rel.payload.reeferTempC as number) : reeferOf(trip, lr);
  const releasedAt = rel?.syncedAt ?? rel?.savedAt ?? lr?.releasedAt ?? undefined;
  const moreTrips = (sheet.bay.data?.trips ?? []).some(x => x.id !== trip?.id && (x.status === 'PLANNED' || x.status === 'LOADING'));
  const empty = !claims ? 'Sign in to see the handover' : sheet.loading && !data ? 'Loading…' : 'No release on this phone yet';

  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v43}>
        <View style={s.v7}>
          <View style={s.v1} />
          <View style={s.v3}>
            <Text style={s.t2}>{trip?.bay ? `Bay ${trip.bay}` : "Bay —"}</Text>
          </View>
          <View style={s.v6}>
            <View style={s.v4} />
            <Text style={s.t5} numberOfLines={1} testID="release-state">{unsent ? (rel?.status === "sending" ? "Sending" : "On this phone") : sent ? "En route" : rel ? "Needs a look" : "Not released"}</Text>
          </View>
        </View>
        <Scroll style={s.v3} contentStyle={s.v38}>
          <View style={s.v13}>
            <View style={s.v9}>
              <Icon xml={X0} width={42} height={42} style={s.v8} />
            </View>
            <Tap lk="L11" to={sent ? { app: 'Lodestar Run', screen: "DR-01 Today's run" } : null}>
              <Text style={s.t10}>{trip ? (sent ? `${who} has the run` : unsent ? "Release saved" : `${trip.vehicleId} not released yet`) : "Handover"}</Text>
            </Tap>
            <View>
              {trip ? (
                <Text style={s.t12}>
                  {sent
                    ? `Sent${releasedAt ? ` at ${hm(releasedAt)}` : ""} to ${driver ? `${who}'s` : "the driver's"} phone. `
                    : unsent
                      ? `Saved on this phone${rel ? ` at ${hm(rel.savedAt)}` : ""}; it goes to ${driver ? `${who}'s` : "the driver's"} phone when there is signal. `
                      : "Release it from the load sheet. "}
                  <Text style={s.t11}>{trip.vehicleId}</Text>
                  {` · ${stops.length} ${stops.length === 1 ? "stop" : "stops"} in ${trip.district}.`}
                </Text>
              ) : (
                <Text style={s.t12}>{empty}</Text>
              )}
            </View>
          </View>
          <View style={s.v28}>
            <View style={s.v27}>
              <View style={s.v26}>
                <View style={s.v17}>
                  <View style={s.v14}>
                    <Icon xml={X1} width={12} height={12} style={s.v8} />
                  </View>
                  <View>
                    <Text style={s.t15} numberOfLines={1}>{"Received"}</Text>
                  </View>
                  <View>
                    <Text style={s.t16} numberOfLines={1}>{"·"}</Text>
                  </View>
                </View>
                <View style={s.v18} />
                <View style={s.v17}>
                  <View style={s.v14}>
                    <Icon xml={X1} width={12} height={12} style={s.v8} />
                  </View>
                  <View>
                    <Text style={s.t15} numberOfLines={1}>{"Planned"}</Text>
                  </View>
                  <View>
                    <Text style={s.t16} numberOfLines={1}>{trip ? `v${trip.planVersion}` : "·"}</Text>
                  </View>
                </View>
                <View style={s.v18} />
                <View style={s.v17}>
                  <View style={s.v19}>
                    <Icon xml={X2} width={12} height={12} style={s.v8} />
                  </View>
                  <View>
                    <Text style={s.t20} numberOfLines={1}>{short ? `Loaded −${short}` : "Loaded"}</Text>
                  </View>
                  <View>
                    <Text style={s.t16} numberOfLines={1}>{hm(lr?.loadedAt) || "·"}</Text>
                  </View>
                </View>
                <View style={s.v18} />
                <View style={s.v17}>
                  <View style={s.v21}>
                    <Icon xml={X3} width={12} height={12} style={s.v8} />
                  </View>
                  <View>
                    <Text style={s.t22} numberOfLines={1}>{"En route"}</Text>
                  </View>
                  <View>
                    <Text style={s.t16} numberOfLines={1}>{hm(releasedAt) || hm(trip?.departTime) || "·"}</Text>
                  </View>
                </View>
                <View style={s.v23} />
                <View style={s.v17}>
                  <View style={s.v24} />
                  <View>
                    <Text style={s.t25} numberOfLines={1}>{"Delivered"}</Text>
                  </View>
                  <View>
                    <Text style={s.t16} numberOfLines={1}>{hm(first?.etaModel ?? first?.etaPlan) ? `ETA ~${hm(first?.etaModel ?? first?.etaPlan)}` : "·"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={s.v28}>
            <View style={s.v33}>
              <View style={s.v30}>
                <Text style={s.t29}>{"Seal"}</Text>
              </View>
              <View style={s.v32}>
                <Icon xml={X4} width={13} height={13} style={s.v8} />
                <Text style={s.t31} testID="seal">{seal ?? "—"}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v30}>
                <Text style={s.t29}>{"Lines"}</Text>
              </View>
              <View style={s.v30}>
                <Text style={s.t34}>{data ? `${ticked} loaded · ${short} short${short ? (acked >= short ? ", ack'd" : ", waiting for dispatch") : ""}` : "—"}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v30}>
                <Text style={s.t29}>{"Reefer at release"}</Text>
              </View>
              <View style={s.v30}>
                <Text style={s.t36}>{temp !== undefined ? `${temp} °C` : "—"}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v30}>
                <Text style={s.t29}>{"Driver"}</Text>
              </View>
              <View style={s.v30}>
                <Text style={s.t34}>{driver ?? (trip ? "Not assigned" : "—")}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v30}>
                <Text style={s.t29}>{"Departure"}</Text>
              </View>
              <View style={s.v30}>
                <Text style={s.t34}>{hm(trip?.departTime) || "—"}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v30}>
                <Text style={s.t29}>{"First stop"}</Text>
              </View>
              <View style={s.v30}>
                {first ? (
                  <Text style={s.t34}><Text style={s.t37}>{first.outletId}</Text>{`${hm(first.etaModel) ? ` · ETA ~${hm(first.etaModel)}` : ""}${hm(first.etaPlan) ? ` (plan ${hm(first.etaPlan)})` : ""} · ${stops.length} ${stops.length === 1 ? "stop" : "stops"}`}</Text>
                ) : (
                  <Text style={s.t34}>{"—"}</Text>
                )}
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v42}>
          <Tap lk="L207" style={s.v41} to={moreTrips ? { to: "ld-01-dock-queue", kind: "nav" } : { to: "ld-19-empty-queue", kind: "nav" }}>
            <Grad g={G0} style={s.v39} />
            <Icon xml={X5} width={22} height={22} style={s.v8} />
            <Text style={s.t40}>{"Back to the dock"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"42\" height=\"42\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 8v5M12 17h.01\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"13\" height=\"13\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 21V8l9-5 9 5v13\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 21v-8h10v8M7 17h10\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"width":40},
  t2: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v3: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v4: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#0369a1","borderRadius":3.5},
  t5: {"color":"#0369a1","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e2f0fa","borderRadius":14},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v8: {"flexShrink":0,"overflow":"hidden"},
  v9: {"flexDirection":"row","justifyContent":"center","alignItems":"center","marginBottom":10,"width":84,"height":84,"backgroundColor":"#047857","borderRadius":42,"boxShadow":"rgb(227, 246, 236) 0px 0px 0px 10px"},
  t10: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"textAlign":"center","fontFamily":"PlusJakartaSans_800ExtraBold"},
  t11: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t12: {"color":"#344054","fontSize":15,"lineHeight":21.8,"textAlign":"center","fontFamily":"Inter_400Regular"},
  v13: {"flexDirection":"column","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":8,"paddingRight":28,"paddingLeft":28},
  v14: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t15: {"color":"#0a0f1a","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t16: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v17: {"flexDirection":"column","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1,"width":62},
  v18: {"flexShrink":0,"marginTop":10,"marginRight":-16,"marginLeft":-16,"width":36,"height":2,"backgroundColor":"#047857"},
  v19: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#b45309","borderWidth":2,"borderColor":"#b45309","borderRadius":11},
  t20: {"color":"#b45309","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_800ExtraBold"},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#0369a1","borderWidth":2,"borderColor":"#0369a1","borderRadius":11,"boxShadow":"rgb(230, 244, 252) 0px 0px 0px 5px, rgba(3, 105, 161, 0.3) 0px 4px 10px 0px"},
  t22: {"color":"#0369a1","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_800ExtraBold"},
  v23: {"flexShrink":0,"marginTop":10,"marginRight":-16,"marginLeft":-16,"width":36,"height":2,"backgroundColor":"#8f98aa"},
  v24: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#ffffff","borderWidth":2,"borderColor":"#8f98aa","borderRadius":11},
  t25: {"color":"#4a5467","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v26: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":16,"paddingRight":8,"paddingBottom":14,"paddingLeft":8},
  v28: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t29: {"color":"#344054","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_400Regular"},
  v30: {"flexShrink":1},
  t31: {"color":"#344054","fontSize":13,"lineHeight":19.5,"fontFamily":"JetBrainsMono_700Bold"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":9,"paddingLeft":9,"height":26,"backgroundColor":"#e9ecf2","borderRadius":8},
  v33: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48},
  t34: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v35: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  t36: {"color":"#0e7490","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  t37: {"color":"#344054","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v38: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v39: {"borderRadius":18},
  t40: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v43: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
