// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-B1 Vehicle can't depart · phone (P5, phone)
// Reefer down (P5): the loader reports the trip's vehicle (route param `trip`) with Trips ReportVehicleFault. The
// vehicle goes to the workshop and the depot's dispatchers are told; when dispatch publishes the re-plan, LD-14
// opens. There is no reefer telemetry: the loader types the reading (no reading history), and the reefer photo
// is not built. The report goes through the field outbox like every field write: sent at once with signal,
// kept on the phone and shown as queued without, and sent when signal is back.
import { useEffect, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { hm } from '@/lib/time';
import { faultReport, reportVehicleFault, useRePlanAlert, useVehicleDockLoad, type VehicleFault } from '@/model/dock';
import { precoolReading } from '@/model/field-reports';
import { useBayQueue, useClaims, useLoadSheet, useOnline, useOutbox } from '@/model/hooks';
import { useNow } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';
import { useDepots } from '@/model/depots';

const nav: ScreenNav = {"links":{"L31":{"app":"Lodestar Plan (desktop)","screen":"DSP-B1 Re-plan diff"},"B":{"to":"ld-09-pre-cool-check","kind":"back"}}};

const MAX_CHILLED_C = 4;
const white = (xml: string) => xml.replace(/#4a5467/g, '#ffffff');
const grey = (xml: string) => xml.replace(/#ffffff/g, '#4a5467');

export default function ScreenLdB1VehicleCanTDepart() {
  const { name: depotName } = useDepots();
  const claims = useClaims();
  const online = useOnline();
  const now = useNow();
  const sheet = useLoadSheet();
  const bay = useBayQueue();
  const trip = sheet.data?.trip ?? null;
  const depot = trip?.depot ?? bay.data?.depot ?? claims?.depots[0];
  useRePlanAlert(depot);
  const onDock = (bay.data?.trips ?? []).filter(t => trip && t.vehicleId === trip.vehicleId && (t.status === 'PLANNED' || t.status === 'LOADING'));
  const tripIds = onDock.length ? onDock.map(t => t.id) : trip ? [trip.id] : [];
  const load = useVehicleDockLoad(tripIds).data ?? [];
  const tripNo = new Map([...onDock, ...(trip ? [trip] : [])].map(t => [t.id, t]));
  const m3 = load.reduce((n, st) => n + (st.order?.m3 ?? 0), 0);
  const chilled = trip?.vehicle?.tempClass === 'CHILLED' || load.some(st => st.order?.tempClass === 'CHILLED');
  const [fault, setFault] = useState<VehicleFault>('NOT_COOLING');
  const [reading, setReading] = useState('');
  // the reading the loader confirmed on LD-09 (kept on this phone) starts the field
  const tripId = trip?.id;
  useEffect(() => {
    if (!tripId) return;
    let live = true;
    void precoolReading(tripId).then(v => {
      if (live && v !== null) setReading(r => (r === '' ? String(v) : r));
    });
    return () => {
      live = false;
    };
  }, [tripId]);
  const { items } = useOutbox();
  const report = faultReport(items, trip?.id);
  // a refused report can be sent again; a queued or sent one locks the form
  const refused = report?.status === 'rejected' || report?.status === 'conflict';
  const sentAt = report && !refused ? report.savedAt : null;
  const queued = report?.status === 'pending' || report?.status === 'sending';
  const button = !report || refused
    ? 'Notify dispatch now'
    : queued
      ? online ? 'Sending to dispatch…' : `Saved ${hm(report.savedAt)} · sends when signal is back`
      : `Dispatch notified ${hm(report.syncedAt ?? report.savedAt)}`;
  const temp = reading.trim() === '' ? undefined : Number(reading.replace(',', '.'));
  const tempOk = temp === undefined || Number.isFinite(temp);
  const options: { k: VehicleFault; label: string; icon: string }[] = [
    { k: 'NOT_COOLING', label: 'Not cooling', icon: X1 },
    { k: 'ENGINE', label: 'Engine', icon: X2 },
    { k: 'DOOR_SEAL', label: 'Door seal', icon: X3 },
    { k: 'OTHER', label: 'Other', icon: X4 },
  ];

  const notify = async () => {
    if (!trip) throw new Error(claims ? 'Open this from a trip on the load sheet' : 'Sign in to report a vehicle');
    if (!tempOk) throw new Error('Enter the reefer reading as a number');
    await reportVehicleFault(trip, fault, temp);
    return true; // the design's cross-device step: "continues in Lodestar Plan: DSP-B1"
  };

  const title = trip?.vehicleId ?? '—';
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v58}>
        <View style={s.v8}>
          <Tap lk="B" style={s.v2} to={trip ? { to: 'ld-09-pre-cool-check', params: { trip: trip.id }, kind: 'back' } : undefined}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <Text style={s.t3}>{"Pre-departure check"}</Text>
          </View>
          <View style={online ? s.v7 : [s.v7, x.offChip]}>
            <View style={online ? s.v5 : [s.v5, x.offDot]} />
            <Text style={online ? s.t6 : [s.t6, x.offText]} numberOfLines={1}>{online ? "Online" : 'Offline'}</Text>
          </View>
        </View>
        <Scroll style={s.v4} contentStyle={s.v51}>
          <View style={s.v14}>
            <View style={s.v11}>
              {[depot ? depotName(depot) : '', trip?.bay ? `Bay ${trip.bay}` : '', hm(new Date(now).toISOString())].filter(Boolean).map((t, i) => (
                <View key={t} style={x.row}>
                  {i > 0 ? <View style={s.v10} /> : null}
                  <Text style={s.t9}>{t}</Text>
                </View>
              ))}
            </View>
            <View>
              <Text style={s.t13} testID="cant-depart"><Text style={s.t12}>{title}</Text>{trip ? " can't depart" : ''}</Text>
            </View>
          </View>
          {chilled ? (
            <View style={s.v25}>
              <View style={s.v20}>
                <View style={s.v17}>
                  <View>
                    <Text style={s.t15}>{"Reefer unit reads"}</Text>
                  </View>
                  <View style={x.row}>
                    <TextInput
                      value={reading}
                      onChangeText={setReading}
                      placeholder="—"
                      placeholderTextColor="#b42318"
                      keyboardType="numbers-and-punctuation"
                      editable={!sentAt}
                      style={[s.t16, x.input]}
                      accessibilityLabel="Reefer reading in °C"
                      testID="reefer-reading"
                    />
                    <Text style={s.t16}>{" °C"}</Text>
                  </View>
                </View>
                <View style={s.v19}>
                  <View>
                    <Text style={s.t9} numberOfLines={1}>{"Needs"}</Text>
                  </View>
                  <View>
                    <Text style={s.t18}>{`≤ ${MAX_CHILLED_C} °C`}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v34}>
            <View style={s.v28}>
              <View style={s.v22}>
                <Text style={s.t26}>{"What's wrong?"}</Text>
              </View>
              <View style={s.v22}>
                <Text style={s.t27}>{"tap one"}</Text>
              </View>
            </View>
            <View style={s.v33}>
              {options.map(o => {
                const on = fault === o.k;
                return (
                  <Tap key={o.k} style={on ? s.v30 : s.v32} to={null} onPress={() => setFault(o.k)} disabled={!!sentAt} testID={`fault-${o.k}`}>
                    <Icon xml={on ? white(o.icon) : grey(o.icon)} width={20} height={20} style={s.v1} />
                    <Text style={on ? s.t29 : s.t31}>{o.label}</Text>
                  </Tap>
                );
              })}
            </View>
          </View>
          {load.length ? (
            <View style={s.v34}>
              <View style={s.v28}>
                <View style={s.v22}>
                  <Text style={s.t26}>{`On the dock · ${new Set(load.map(st => st.orderId)).size} orders · ${tripIds.length} ${tripIds.length === 1 ? 'trip' : 'trips'}`}</Text>
                </View>
                <View style={s.v22}>
                  <Text style={s.t27}>{`${Math.round(m3 * 10) / 10} m³`}</Text>
                </View>
              </View>
              <View style={s.v50}>
                {load.map((st, i) => {
                  const t = tripNo.get(st.tripId);
                  return (
                    <View key={st.id} style={i === 0 ? s.v44 : s.v45}>
                      <View style={s.v36}>
                        <Text style={s.t35}>{`T${t?.tripNumber ?? ''}`}</Text>
                      </View>
                      <View style={s.v41}>
                        <View>
                          <Text style={s.t37}>{st.outlet?.name ?? st.outletId}</Text>
                        </View>
                        <View style={s.v40}>
                          <View style={s.v22}>
                            <Text style={s.t38}>{st.outletId}</Text>
                          </View>
                          {t ? <Text style={s.t39}>{`· Trip ${t.tripNumber} ${t.district}`}</Text> : null}
                        </View>
                      </View>
                      {st.order?.m3 !== undefined ? (
                        <View style={s.v43}>
                          <View>
                            <Text style={s.t42}>{String(Math.round(st.order.m3 * 10) / 10)}</Text>
                          </View>
                          <View>
                            <Text style={s.t9}>{"m³"}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                {chilled ? (
                  <View style={s.v49}>
                    <View style={s.v48}>
                      <Icon xml={X6} width={22} height={22} style={s.v1} />
                    </View>
                    <View style={s.v41}>
                      <View>
                        <Text style={s.t37}>{"Goods back in cold room"}</Text>
                      </View>
                      <View style={s.v40}>
                        <Text style={s.t39}>{"Keeps the cold chain"}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v57}>
          {refused ? (
            <Text style={x.refused} testID="fault-refused">{`Not sent: ${report?.conflict ?? report?.lastError ?? 'refused by the server'}`}</Text>
          ) : null}
          <Tap lk="L31" style={s.v54} onPress={notify} disabled={!!sentAt || !trip} testID="notify-dispatch">
            <Grad g={G0} style={s.v52} />
            <Icon xml={X7} width={22} height={22} style={s.v1} />
            <Text style={s.t53} numberOfLines={1}>{button}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  input: { minWidth: 56, paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0 },
  offChip: { backgroundColor: '#fde8e5' },
  offDot: { backgroundColor: '#b42318' },
  offText: { color: '#b42318' },
  refused: { color: '#b42318', fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m9 4 3 2 3-2M9 20l3-2 3 2\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15 18H9\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><circle cx=\"17\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><circle cx=\"7\" cy=\"18\" r=\"2\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#4a5467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#e0483a","p":0},{"c":"#b42318","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#047857","borderRadius":3.5},
  t6: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e3f6ec","borderRadius":14},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t9: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v10: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#4a5467","borderRadius":1.5,"opacity":0.6},
  v11: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t12: {"color":"#b42318"},
  t13: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v14: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  t15: {"color":"#b42318","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  t16: {"color":"#b42318","fontSize":64,"lineHeight":64,"letterSpacing":-1.9,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":1},
  t18: {"color":"#0a0f1a","fontSize":26,"lineHeight":39,"letterSpacing":-0.5,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v19: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":1},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  t21: {"color":"#344054","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v22: {"flexShrink":1},
  t23: {"color":"#b42318","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_800ExtraBold"},
  v24: {"flexDirection":"row","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":10,"borderTopWidth":1,"borderTopColor":"rgba(180, 35, 24, 0.14)"},
  v25: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#fde8e5","borderRadius":24},
  t26: {"color":"#0a0f1a","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t27: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v28: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t29: {"color":"#ffffff","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v30: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":1,"paddingRight":16,"paddingLeft":16,"width":166,"height":60,"backgroundColor":"#141b4d","borderRadius":16,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 6px 16px 0px"},
  t31: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":1,"paddingRight":16,"paddingLeft":16,"width":166,"height":60,"backgroundColor":"#ffffff","borderRadius":16,"boxShadow":"rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"},
  v33: {"flexDirection":"row","flexWrap":"wrap","alignItems":"stretch","rowGap":10,"columnGap":10,"marginRight":16,"marginLeft":16},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  t35: {"color":"#047857","fontSize":14,"lineHeight":21,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v36: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":36,"height":36,"backgroundColor":"#e3f6ec","borderRadius":12},
  t37: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t38: {"color":"#344054","fontSize":14,"lineHeight":19.6,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t39: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v40: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v41: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t42: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v43: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v44: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":54},
  v45: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":54,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  t46: {"color":"#3b4cca","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v47: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v48: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#047857","borderRadius":14},
  v49: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"backgroundColor":"#e3f6ec","borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v50: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v51: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":4,"paddingBottom":16},
  v52: {"borderRadius":18},
  t53: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v54: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(180, 35, 24, 0.25) 0px 8px 20px 0px"},
  t55: {"color":"#344054","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v56: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v57: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v58: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
