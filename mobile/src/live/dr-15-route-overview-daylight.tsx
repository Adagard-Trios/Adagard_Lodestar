// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DR-15 Route overview · phone · daylight (P4, phone)
// The run's trip in stop order from the cached run (works offline). Route distance, the road class chip and the
// known signal-loss rows are not in the data the driver reads: left out. "Open in Google Maps" hands the stops
// (coordinates, else addresses) to Google Maps.
import { Linking, Text, View, StyleSheet } from 'react-native';
import { hm } from '@/lib/time';
import { titleCase } from '@/lodestar/live';
import { useClaims, useRun } from '@/model/hooks';
import { depotName } from '@/model/plan';
import type { Outlet, TripStop } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L39":{"to":"dr-01-today-s-run-daylight","kind":"go"}}};

type Place = Outlet & { lat?: number | null; lng?: number | null };

/** "lat,lng" or the address of an outlet, for a Google Maps directions link. */
function where(o?: Place): string {
  if (o && typeof o.lat === 'number' && typeof o.lng === 'number') return `${o.lat},${o.lng}`;
  return o?.address ?? '';
}

/** Google Maps directions through the open stops (last one is the destination). */
function mapsUrl(stops: TripStop[]): string | null {
  const points = stops.map(s => where(s.outlet as Place)).filter(Boolean);
  if (!points.length) return null;
  const dest = encodeURIComponent(points.at(-1)!);
  const via = points.slice(0, -1).map(encodeURIComponent).join('%7C');
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${dest}${via ? `&waypoints=${via}` : ''}`;
}

export default function ScreenDr15RouteOverviewDaylight() {
  const claims = useClaims();
  const run = useRun();
  const v = run.view;
  const trip = v?.trip ?? null;
  const stops = v?.tripStops ?? [];
  const open = stops.filter(st => st.status !== 'DELIVERED');
  const first = open[0] ?? null;
  const url = mapsUrl(open);
  const empty = !claims ? 'Sign in to see your route' : run.loading && !v ? 'Loading…' : 'No trip today';
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v43}>
        <View style={s.v7}>
          <Tap lk="L39" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <Text style={s.t3}>{"Route"}</Text>
          </View>
          {v ? (
            <View style={s.v6}>
              <Icon xml={X1} width={14} height={14} style={s.v1} />
              <Text style={s.t5} numberOfLines={1}>{"Offline-ready"}</Text>
            </View>
          ) : null}
        </View>
        <Scroll style={s.v4} contentStyle={s.v36}>
          <View style={s.v17}>
            <View>
              <Text style={s.t8} testID="route-trip">{trip ? `Trip ${trip.tripNumber} · ${titleCase(trip.brand)} · ${trip.district}` : empty}</Text>
            </View>
            {first?.etaModel ? (
              <View>
                <Text style={s.t16}>{[first.etaPlan ? `Plan ${hm(first.etaPlan)}` : '', `model ~${hm(first.etaModel)}`].filter(Boolean).join(' · ')}</Text>
              </View>
            ) : null}
          </View>
          {trip ? (
            <View style={s.v35}>
              <View style={s.v34}>
                <View style={s.v27}>
                  <View style={s.v20}>
                    <View style={s.v18}>
                      <Icon xml={X2} width={17} height={17} style={s.v1} />
                    </View>
                    <View style={s.v19} />
                  </View>
                  <View style={s.v23}>
                    <View>
                      <Text style={s.t21}>{`${depotName(trip.depot)}${trip.bay ? ` · Bay ${trip.bay}` : ''}`}</Text>
                    </View>
                  </View>
                  {trip.departTime ? (
                    <View style={s.v26}>
                      <View>
                        <Text style={s.t24}>{hm(trip.departTime)}</Text>
                      </View>
                      <View>
                        <Text style={s.t25}>{"leave"}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                {stops.map(st => {
                  const o = st.outlet;
                  const done = st.status === 'DELIVERED';
                  const isNext = st.id === first?.id;
                  const time = done ? hm(st.arrivalActual ?? st.leaveActual) : st.etaModel ? `~${hm(st.etaModel)}` : '';
                  return (
                    <View key={st.id} style={s.v27} testID={`route-stop-${st.stopSeq}`}>
                      <View style={s.v20}>
                        <View style={isNext ? s.v31 : s.v18}>
                          <Text style={isNext ? s.t30 : s.t33}>{String(st.stopSeq)}</Text>
                        </View>
                        <View style={s.v29} />
                      </View>
                      <View style={s.v23}>
                        <View>
                          <Text style={s.t21}>{`${o?.name ?? st.outletId} · `}<Text style={s.t32}>{st.outletId}</Text></Text>
                        </View>
                        {o ? (
                          <View>
                            <Text style={s.t22}>{[o.dockType ? `${titleCase(o.dockType)} dock` : '', `${o.windowOpen}–${o.windowClose}`].filter(Boolean).join(' · ')}</Text>
                          </View>
                        ) : null}
                      </View>
                      {time ? (
                        <View style={s.v26}>
                          <View>
                            <Text style={s.t24}>{time}</Text>
                          </View>
                          <View>
                            <Text style={s.t25}>{done ? 'arrived' : 'ETA'}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                <View style={s.v27}>
                  <View style={s.v20}>
                    <View style={s.v18}>
                      <Icon xml={X2} width={17} height={17} style={s.v1} />
                    </View>
                  </View>
                  <View style={s.v23}>
                    <View>
                      <Text style={s.t21}>{`Back to ${depotName(trip.depot)}`}</Text>
                    </View>
                  </View>
                  {trip.returnTime ? (
                    <View style={s.v26}>
                      <View>
                        <Text style={s.t24}>{hm(trip.returnTime)}</Text>
                      </View>
                      <View>
                        <Text style={s.t25}>{"about"}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </Scroll>
        {url ? (
          <View style={s.v42}>
            <Tap style={s.v39} to={null} onPress={() => Linking.openURL(url)} testID="open-maps">
              <Grad g={G0} style={s.v37} />
              <Icon xml={X4} width={22} height={22} style={s.v1} />
              <Text style={s.t38}>{"Open in Google Maps"}</Text>
            </Tap>
            <View style={s.v41}>
              <Text style={s.t40}>{"Turn-by-turn runs in Google Maps. Your stops stay here."}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"17\" height=\"17\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 21V8l9-5 9 5v13\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 21v-8h10v8M7 17h10\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t5: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e3f6ec","borderRadius":14},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  t9: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t10: {"color":"#0a0f1a","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v11: {"flexShrink":1},
  v12: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#344054","borderRadius":3.5},
  t13: {"color":"#344054","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v14: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e9ecf2","borderRadius":14},
  v15: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  t16: {"color":"#344054","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v18: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":32,"height":32,"backgroundColor":"#e9ecf2","borderRadius":16},
  v19: {"flexGrow":1,"flexBasis":"0%","marginTop":4,"marginBottom":4,"width":3,"minHeight":12,"backgroundColor":"#8f98aa","borderRadius":1.5},
  v20: {"flexDirection":"column","alignItems":"center","flexShrink":0,"width":32},
  t21: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t22: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v23: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":5,"paddingBottom":16},
  t24: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t25: {"color":"#4a5467","fontSize":13,"lineHeight":16,"fontFamily":"Inter_600SemiBold"},
  v26: {"flexDirection":"column","alignItems":"flex-end","rowGap":1,"columnGap":1,"flexShrink":0,"paddingTop":4},
  v27: {"flexDirection":"row","alignItems":"stretch","rowGap":14,"columnGap":14},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":32,"height":32,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":16},
  v29: {"flexGrow":1,"flexBasis":"0%","marginTop":4,"marginBottom":4,"width":0,"minHeight":12,"borderLeftWidth":3,"borderLeftColor":"#a8a29e","borderStyle":"dashed"},
  t30: {"color":"#ffffff","fontSize":15,"lineHeight":22.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v31: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":32,"height":32,"backgroundColor":"#141b4d","borderRadius":16},
  t32: {"letterSpacing":-0.2,"fontFamily":"JetBrainsMono_600SemiBold"},
  t33: {"color":"#344054","fontSize":15,"lineHeight":22.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v34: {"flexDirection":"column","alignItems":"stretch","paddingTop":16,"paddingRight":16,"paddingBottom":2,"paddingLeft":16},
  v35: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v37: {"borderRadius":18},
  t38: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v39: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  t40: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":6,"columnGap":6},
  v42: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v43: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
