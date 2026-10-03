// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// DSP-31 Call or SMS driver · phone (P2, phone)
import { useState } from 'react';
import { Linking, Text, TextInput, View, StyleSheet } from 'react-native';
import { firstName } from '@/auth/claims';
import { hm } from '@/lib/time';
import { titleCase } from '@/lodestar/live';
import { useClaims, useVehicle } from '@/model/hooks';
import { useSignalLost, minutesOfBudget, useAgentConfig, useDepotDesk } from '@/model/plan';
import { useQuery } from '@/model/query';
import type { Trip } from '@/model/types';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L182":{"to":"dsp-30-vehicle-detail","kind":"go"}}};

const STATUS: Record<Trip['status'], string> = { PLANNED: 'Planned', LOADING: 'Loading', ENROUTE: 'En route', COMPLETE: 'Complete' };

type DriverContact = { id: string; name: string; phone?: string | null };

/** "0772344521" → "077 ••• 4521" */
function masked(phone: string): string {
  const d = phone.replace(/[^\d+]/g, '');
  return d.length > 7 ? `${d.slice(0, 3)} ••• ${d.slice(-4)}` : d;
}

async function open(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    showToast('This phone cannot open calls or messages', 'error');
    return false;
  }
}

export default function ScreenDsp31CallOrSmsDriver() {
  const cfg = useAgentConfig().data;
  const claims = useClaims();
  const { data, id, loading, error } = useVehicle();
  const lost = useSignalLost();
  const vehicle = data?.vehicle ?? null;
  const trips = data?.trips ?? [];
  const stops = data?.stops ?? [];
  const trip = trips.find(t => t.status === 'ENROUTE') ?? trips.find(t => t.status !== 'COMPLETE') ?? trips.at(-1) ?? null;
  const driverRef = trip?.driver ?? trips.find(t => t.driver)?.driver ?? null;
  const driver = driverRef?.name ?? null;
  const first = driver?.split(' ')[0] ?? '';
  const tripStops = trip ? stops.filter(x => x.tripId === trip.id) : [];
  const done = tripStops.filter(x => x.status === 'DELIVERED').length;
  const next = tripStops.find(x => x.status !== 'DELIVERED') ?? null;
  const lostAt = id ? lost.get(id) : undefined;
  // the driver's phone number, from the user directory
  const driverId = driverRef?.id ?? null;
  const contact = useQuery<DriverContact>(driverId ? `user.${driverId}` : null, c => c.get<DriverContact>('Users', driverId!, { select: ['id', 'name', 'phone'] }), { persist: true });
  const phone = contact.data?.phone?.trim() || null;
  // "Call depot desk": someone else on the depot's desk with a phone, from the user directory
  const depot = trip?.depot ?? vehicle?.depot ?? claims?.depots[0] ?? null;
  const desk = useDepotDesk(depot, claims?.sub);
  const deskPhone = desk.data?.phone?.trim() || null;
  const deskLine = deskPhone ? `${desk.data!.name} · ${masked(deskPhone)}` : desk.loading ? 'Looking up the number…' : 'No desk number on file';
  const back = id ? { to: 'dsp-30-vehicle-detail', params: { vehicle: id } } : undefined;

  const me = firstName(claims);
  const templates = [
    { chip: 'Reply 1 if on plan', text: `${first || 'Hi'}, ${lostAt ? `Lodestar lost your signal at ${hm(lostAt)}` : `checking in on ${id ?? 'your run'}`}. Reply 1 if you are on plan, 2 if you need help.${me ? ` ${me}` : ''}` },
    { chip: 'Call me when you can', text: `${first || 'Hi'}, please call me when you can.${me ? ` ${me}` : ''}` },
  ];
  const [pick, setPick] = useState(0);
  const [edited, setEdited] = useState<string | null>(null);
  const body = edited ?? templates[pick]!.text;

  const kind = vehicle ? `${vehicle.tempClass === 'CHILLED' ? 'Reefer' : 'Ambient'} ${vehicle.type.toLowerCase()}` : '';
  const lead = !claims ? 'Sign in to see this vehicle' : vehicle ? `${kind} · ${driver ?? 'no driver yet'}` : loading ? 'Loading…' : error ? 'No signal · nothing saved yet' : 'Loading…';
  const chip = lostAt ? 'Predicted' : vehicle ? titleCase(vehicle.status) : '—';
  const headline = lostAt
    ? `Unknown since ${hm(lostAt)}`
    : vehicle?.status === 'WORKSHOP'
      ? 'In the workshop'
      : trip
        ? `${STATUS[trip.status]} · ${done}/${tripStops.length}`
        : vehicle
          ? 'No trip today'
          : '—';
  const detail =
    vehicle?.workshopNote ||
    (next
      ? `Next ${next.outlet?.name ?? next.outletId}${next.etaModel ? ` ~${hm(next.etaModel)}` : ''}${next.lateRiskPct !== null && next.lateRiskPct !== undefined ? `, late risk ${next.lateRiskPct}%` : ''}.${lostAt ? ' Never shown as on time until a ping confirms.' : ''}`
      : trip
        ? 'All stops delivered.'
        : '');
  const phoneLine = phone ? `Mobile · ${masked(phone)}` : !driverId ? 'No driver on this trip' : contact.loading ? 'Looking up the number…' : 'No phone number on file';
  const reach = !driverId
    ? 'No driver is assigned to this vehicle today.'
    : !phone && !contact.loading
      ? `No phone number is on file for ${driver ?? 'this driver'}. Add it to the user record to call or text from here.`
      : lostAt
        ? `No data signal since ${hm(lostAt)}. A call may connect on 2G; an SMS waits and lands when the phone is back in coverage.`
        : 'A call goes through the phone network; an SMS waits and lands if the phone is out of coverage.';

  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v41}>
        <View style={s.v6}>
          <View style={s.v3}>
            <Icon xml={X0} width={22} height={22} style={s.v1} />
            <Text style={s.t2}>{"Live"}</Text>
          </View>
          <View style={s.v5}>
            <Text style={s.t4}>{id ?? '—'}</Text>
          </View>
        </View>
        <Scroll style={s.v9} contentStyle={s.v34}>
          <View style={s.v15}>
            <View style={s.v12}>
              <View style={s.v8}>
                <Text style={s.t7}>{lead}</Text>
              </View>
              <View style={s.v9} />
              <View style={s.v11}>
                <Text style={s.t10} numberOfLines={1}>{chip}</Text>
              </View>
            </View>
            <View>
              <Text style={s.t13}>{headline}</Text>
            </View>
            {detail ? (
              <View>
                <Text style={s.t14}>{detail}</Text>
              </View>
            ) : null}
          </View>
          {trips.map(t => {
            const ts = stops.filter(x => x.tripId === t.id);
            return (
              <View key={t.id} style={s.v33}>
                <View style={s.v20}>
                  <View style={s.v8}>
                    <Text style={s.t18}>{`Trip ${t.tripNumber} · ${titleCase(t.brand)} · ${t.district}`}</Text>
                  </View>
                  <View style={s.v8}>
                    <Text style={s.t19}>{minutesOfBudget(t.planMinutes, t.brand, cfg)}</Text>
                  </View>
                </View>
                <View style={s.v32}>
                  <View style={s.v27}>
                    <View style={s.v21}>
                      <Icon xml={X2} width={21} height={21} style={s.v1} />
                    </View>
                    <View style={s.v24}>
                      <View>
                        <Text style={s.t22}>{`${t.departTime ? 'Departed' : 'Leaves'} ${titleCase(t.depot)}`}</Text>
                      </View>
                      <View>
                        <Text style={s.t23}>{`${ts.length} orders · ${STATUS[t.status]}`}</Text>
                      </View>
                    </View>
                    <View style={s.v26}>
                      <View>
                        <Text style={s.t25}>{hm(t.departTime)}</Text>
                      </View>
                    </View>
                  </View>
                  {ts.map(st => (
                    <View key={st.id} style={s.v28}>
                      <View style={s.v30}>
                        <Text style={s.t29}>{String(st.stopSeq)}</Text>
                      </View>
                      <View style={s.v24}>
                        <View>
                          <Text style={s.t22}><Text style={s.t31}>{st.outletId}</Text>{st.outlet?.name ? ` ${st.outlet.name}` : ''}</Text>
                        </View>
                        <View>
                          <Text style={s.t23}>{[titleCase(st.status), st.etaPlan ? `plan ${hm(st.etaPlan)}` : undefined, st.lateRiskPct !== null && st.lateRiskPct !== undefined ? `late risk ${st.lateRiskPct}%` : undefined].filter(Boolean).join(' · ')}</Text>
                        </View>
                      </View>
                      <View style={s.v26}>
                        <View>
                          <Text style={s.t10}>{st.etaModel ? `~${hm(st.etaModel)}` : '—'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </Scroll>
        <View style={s.v40}>
          <View style={s.v37}>
            <Grad g={G0} style={s.v35} />
            <Icon xml={X3} width={22} height={22} style={s.v1} />
            <Text style={s.t36}>{first ? `Call or SMS ${first}` : 'Call or SMS driver'}</Text>
          </View>
          <View style={s.v39}>
            <Text style={s.t38}>{"Warn stores: possible delay"}</Text>
          </View>
        </View>
      </View>
      <View style={s.v42} />
      <View style={s.v55}>
        <View style={s.v43} />
        <View style={s.v45}>
          <View>
            <Text style={s.t44} testID="reach-driver">{driver ? `Reach ${driver}` : 'Reach the driver'}</Text>
          </View>
          <View>
            <Text style={s.t14} testID="reach-note">{reach}</Text>
          </View>
        </View>
        <View style={s.v32}>
          <Tap style={s.v27} to={null} disabled={!phone} onPress={() => (phone ? open(`tel:${phone}`) : false)} testID="call-driver">
            <View style={s.v46}>
              <Icon xml={X4} width={21} height={21} style={s.v1} />
            </View>
            <View style={s.v24}>
              <View>
                <Text style={s.t22}>{first ? `Call ${first}` : 'Call the driver'}</Text>
              </View>
              <View>
                <Text style={s.t23}>{phoneLine}</Text>
              </View>
            </View>
            <View style={s.v26}>
              <View>
                <Text style={s.t47}>{"Voice"}</Text>
              </View>
            </View>
            <Icon xml={X5} width={18} height={18} style={s.v1} />
          </Tap>
          <Tap style={s.v28} to={null} disabled={!deskPhone} onPress={() => (deskPhone ? open(`tel:${deskPhone}`) : false)} testID="call-desk">
            <View style={s.v46}>
              <Icon xml={X6} width={21} height={21} style={s.v1} />
            </View>
            <View style={s.v24}>
              <View>
                <Text style={s.t22}>{`Call ${titleCase(depot) || 'depot'} desk`}</Text>
              </View>
              <View>
                <Text style={s.t23} testID="desk-line">{deskLine}</Text>
              </View>
            </View>
            <View style={s.v26}>
              <View>
                <Text style={s.t47}>{"Voice"}</Text>
              </View>
            </View>
            <Icon xml={X5} width={18} height={18} style={s.v1} />
          </Tap>
        </View>
        <View style={s.v33}>
          <View style={s.v20}>
            <View style={s.v8}>
              <Text style={s.t18}>{"Quick SMS"}</Text>
            </View>
            <View style={s.v8}>
              <Text style={s.t19}>{"edit before sending"}</Text>
            </View>
          </View>
          <View style={s.v51}>
            {templates.map((tpl, i) => (
              <Tap key={tpl.chip} style={i === pick ? s.v49 : s.v50} to={null} onPress={() => { setPick(i); setEdited(null); return false; }} testID={`sms-template-${i}`}>
                {i === pick ? <Icon xml={X7} width={14} height={14} style={s.v1} /> : null}
                <Text style={i === pick ? s.t48 : s.t25} numberOfLines={1}>{tpl.chip}</Text>
              </Tap>
            ))}
          </View>
          <View style={s.v53}>
            <TextInput style={[s.t52, x.input]} value={body} onChangeText={setEdited} multiline testID="sms-body" accessibilityLabel="SMS text" />
          </View>
        </View>
        <View style={s.v54}>
          <Tap lk="L182" style={s.v37} disabled={!phone || !body.trim()} to={back} onPress={() => (phone ? open(`sms:${phone}?body=${encodeURIComponent(body.trim())}`) : false)}>
            <Grad g={G0} style={s.v35} />
            <Icon xml={X8} width={22} height={22} style={s.v1} />
            <Text style={s.t36}>{"Send SMS"}</Text>
          </Tap>
          <Tap style={s.v39} to={back ? { ...back, kind: 'back' } : null} testID="cancel">
            <Text style={s.t38}>{"Cancel"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({ input: { flex: 1, padding: 0, textAlignVertical: 'top' } });

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m15 18-6-6 6-6\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"21\" height=\"21\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 21V8l9-5 9 5v13\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 21v-8h10v8M7 17h10\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m22 2-7 20-4-9-9-4Z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M22 2 11 13\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  t2: {"color":"#3b4cca","fontSize":16,"lineHeight":24,"fontFamily":"Inter_700Bold"},
  v3: {"flexDirection":"row","alignItems":"center","rowGap":2,"columnGap":2,"flexShrink":1},
  t4: {"color":"#0f1422","fontSize":16,"lineHeight":24,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%","marginRight":58},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#57534e","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v8: {"flexShrink":1},
  v9: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t10: {"color":"#57534e","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v11: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t13: {"color":"#0f1422","fontSize":32,"lineHeight":35.8,"letterSpacing":-0.8,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t14: {"color":"#4a5467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v15: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"borderWidth":2,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":24},
  v16: {"overflow":"hidden"},
  v17: {"flexShrink":0,"marginRight":16,"marginLeft":16,"height":150,"backgroundColor":"#dce8f0","borderRadius":20,"overflow":"hidden"},
  t18: {"color":"#0f1422","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t19: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v21: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#e8f8f0","borderRadius":14},
  t22: {"color":"#0f1422","fontSize":15.5,"lineHeight":20.2,"fontFamily":"Inter_700Bold"},
  t23: {"color":"#4a5467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_400Regular"},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t25: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v26: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v27: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64},
  v28: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":11,"paddingRight":16,"paddingBottom":11,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t29: {"color":"#57534e","fontSize":15,"lineHeight":22.5,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":14},
  t31: {"letterSpacing":-0.2,"fontFamily":"JetBrainsMono_600SemiBold"},
  v32: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v33: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8},
  v34: {"flexDirection":"column","alignItems":"stretch","rowGap":18,"columnGap":18,"paddingTop":4,"paddingBottom":12},
  v35: {"borderRadius":18},
  t36: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v37: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t38: {"color":"#4a5467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v39: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v40: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v41: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
  v42: {"flexShrink":1,"position":"absolute","top":0,"right":0,"bottom":0,"left":0,"backgroundColor":"rgba(12, 17, 45, 0.45)"},
  v43: {"alignSelf":"center","width":40,"height":5,"backgroundColor":"#cdd3de","borderRadius":2.5},
  t44: {"color":"#0f1422","fontSize":22,"lineHeight":26.4,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v45: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"paddingRight":20,"paddingLeft":20},
  v46: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":42,"height":42,"backgroundColor":"#eef0ff","borderRadius":14},
  t47: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_400Regular"},
  t48: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v49: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":34,"backgroundColor":"#eef0ff","borderRadius":17},
  v50: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":34,"backgroundColor":"#ffffff","borderRadius":17},
  v51: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":8,"columnGap":8,"paddingRight":16,"paddingLeft":16},
  t52: {"color":"#0f1422","fontSize":14.5,"lineHeight":21,"fontFamily":"Inter_400Regular"},
  v53: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgba(15, 20, 50, 0.05) 0px 1px 2px 0px"},
  v54: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16},
  v55: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"flexShrink":1,"paddingTop":10,"position":"absolute","top":462.2,"right":0,"bottom":0,"left":0,"backgroundColor":"#f4f5f9","borderTopLeftRadius":28,"borderTopRightRadius":28,"boxShadow":"rgba(12, 17, 45, 0.25) 0px -16px 40px 0px"},
});
