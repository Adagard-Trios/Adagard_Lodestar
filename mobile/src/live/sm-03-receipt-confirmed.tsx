// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-03 Receipt confirmed · phone (P1, phone)
import { Fragment } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm, isoDay } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { useClaims, useOrder, useOutbox, usePods } from '@/model/hooks';
import { STEPS, isCounted, orderCredit, podFor, receiptFor, receiptState, timeline } from '@/model/store-face';
import { Frame, Icon, Scroll, Tap, type ScreenNav } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L18":{"to":"dr-19-stop-2-arrival-hawa-eliya","kind":"go"},"N0":{"to":"sm-11-today-order-day","kind":"nav"},"N1":{"to":"sm-12-orders","kind":"nav"},"N2":{"to":"sm-19-receipts-and-credit-notes","kind":"nav"},"N3":{"to":"sm-21-messages","kind":"nav"}}};

/** "7:10" + "AM" (Colombo wall clock). */
function clock(iso?: string | null): [string, string] {
  const t = hm(iso);
  if (!t) return ['—', ''];
  const [h, m] = t.split(':').map(Number);
  return [`${h % 12 || 12}:${String(m).padStart(2, '0')}`, h < 12 ? 'AM' : 'PM'];
}

export default function ScreenSm03ReceiptConfirmed() {
  const claims = useClaims();
  const { items } = useOutbox();
  const pods = usePods();
  const latest = items.filter(i => i.kind === 'RECEIPT').at(-1);
  const q = useOrder();
  const day = q.day.data;
  const outlet = day?.outlet ?? null;
  const base = q.data ?? day?.orders.find(o => o.id === q.id) ?? null;
  const date = isoDay(base?.runDate);
  const orders = base ? [base, ...(day?.orders ?? []).filter(o => o.id !== base.id && isoDay(o.runDate) === date && o.status !== 'CANCELLED')] : [];
  orders.sort((a, b) => (a.tempClass === b.tempClass ? a.id.localeCompare(b.id) : a.tempClass === 'AMBIENT' ? -1 : 1));
  const receipt = (base ? receiptFor(items, base.id) : undefined) ?? (orders.some(isCounted) ? undefined : latest);
  const [time, ampm] = clock(receipt?.savedAt ?? orders.map(o => o.receiptSavedAt ?? o.receivedAt).find(Boolean));
  const pod = orders.map(o => podFor(pods.data, o.id)).find(Boolean);
  // the credit note is the order's own (raised when the store's count is short, before or after the driver's
  // record syncs), else the driver's POD's
  const credits = orders.map(o => orderCredit(o, podFor(pods.data, o.id)));
  const creditNote = credits.map(c => c.creditNoteId).find(Boolean);
  const credited = credits.reduce((n, c) => n + c.units, 0);
  // the count: the server's (Orders ConfirmReceipt), else the one waiting on this phone
  const received = orders.map(o => {
    const r = receiptFor(items, o.id);
    return { o, r, n: isCounted(o) ? (o.unitsReceived ?? 0) : r ? Number(r.payload.unitsReceived ?? 0) : null };
  });
  const short = received.reduce((n, { o, n: c }) => n + (c === null ? 0 : Math.max(0, (o.unitsExpected ?? o.units) - c)), 0);
  const confirmedAt = orders.map(o => o.receiptSavedAt).find(Boolean);
  const deferral = orders.map(o => o.deferralLog).find(Boolean);
  const { reached, times } = timeline(base);
  const delivered = base?.status === 'DELIVERED';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v52}>
        <View style={s.v7}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Lodestar Store"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{outlet ? `${outlet.name} · ${outlet.id}` : (claims?.outletId ?? '—')}</Text>
            </View>
          </View>
          <View style={s.v6}>
            <Icon xml={X1} width={20} height={20} style={s.v1} />
          </View>
        </View>
        <Scroll style={s.v47} contentStyle={s.v48}>
          <Tap lk="L18" style={s.v17}>
            <View style={s.v13}>
              <View style={s.v11}>
                <View>
                  <Text style={s.t8}>{receipt ? `Receipt confirmed · ${receiptState(receipt)}` : confirmedAt || received.some(r => r.n !== null) ? 'Receipt confirmed' : 'No receipt saved yet'}</Text>
                </View>
                <View>
                  <Text style={s.t10} testID="receipt-time">{time}<Text style={s.t9}>{ampm}</Text></Text>
                </View>
              </View>
              <View style={s.v12}>
                <Icon xml={X2} width={28} height={28} style={s.v1} />
              </View>
            </View>
            <View>
              {creditNote ? (
                <Text style={s.t16}>{"Credit note "}<Text style={s.t14}>{creditNote}</Text>{" raised for "}<Text style={s.t15}>{plural(credited || short, 'unit')}</Text></Text>
              ) : (
                <Text style={s.t16}>{!claims ? 'Sign in to see your receipts' : short ? `${plural(short, 'unit')} short · credited when the driver's record matches` : receipt || received.some(r => r.n !== null) ? 'Everything received as ordered' : 'Count a delivery to confirm it'}</Text>
              )}
            </View>
          </Tap>
          <View style={s.v33}>
            {received.map(({ o, n }, i) => {
              const gap = n === null ? 0 : (o.unitsExpected ?? o.units) - n;
              return (
                <View key={o.id} style={i === 0 ? s.v29 : s.v32}>
                  <View style={o.tempClass === 'CHILLED' ? s.v30 : s.v18}>
                    <Icon xml={o.tempClass === 'CHILLED' ? X4 : X3} width={22} height={22} style={s.v1} />
                  </View>
                  <View style={s.v26}>
                    <View>
                      <Text style={s.t19}>{o.tempClass === 'CHILLED' ? 'Chilled order' : 'Dry order'}</Text>
                    </View>
                    <View style={s.v25}>
                      <View style={s.v21}>
                        <Text style={s.t20}>{o.id}</Text>
                      </View>
                      <View style={s.v22} />
                      <View style={s.v24}>
                        <Text style={gap > 0 ? s.t31 : s.t23} numberOfLines={1}>{n === null ? 'Not counted' : gap > 0 ? `${gap} credited` : 'Complete'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.v28}>
                    <View>
                      <Text style={s.t27}>{n === null ? '—' : String(n)}</Text>
                    </View>
                    <View>
                      <Text style={s.t4}>{`of ${o.units}`}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          {deferral ? (
            <View style={s.v37}>
              <Icon xml={X5} width={20} height={20} style={s.v34} />
              <View style={s.v36}>
                <View>
                  <Text style={s.t35}>{deferral.rescheduledDate ? `Follow-up on the ${dayLabel(isoDay(deferral.rescheduledDate))} run` : 'Follow-up to be booked'}</Text>
                </View>
                <View>
                  <Text style={s.t16}>{[deferral.reason, deferral.notes].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            </View>
          ) : null}
          {base && !pod ? (
            <View style={s.v39}>
              <Icon xml={X6} width={20} height={20} style={s.v34} />
              <View style={s.v36}>
                <View>
                  <Text style={s.t38}>{"Waiting for the driver's record"}</Text>
                </View>
                <View>
                  <Text style={s.t16}>{"We'll match its POD automatically. Nothing to do."}</Text>
                </View>
              </View>
            </View>
          ) : pod ? (
            <View style={s.v39}>
              <Icon xml={X6} width={20} height={20} style={s.v34} />
              <View style={s.v36}>
                <View>
                  <Text style={s.t38}>{`Driver's record · ${pod.unitsDelivered} of ${pod.unitsOrdered}`}</Text>
                </View>
                <View>
                  <Text style={s.t16}>{[pod.receiverName ? `Received by ${pod.receiverName}` : '', `saved ${hm(pod.savedAt)}`, pod.syncedAt ? `synced ${hm(pod.syncedAt)}` : 'not synced yet'].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <View style={s.v33}>
            <View style={s.v46}>
              <View style={s.v45}>
                {STEPS.map((step, i) => {
                  const done = i < reached || (i === reached && delivered) || (i === reached && i < STEPS.length - 1);
                  return (
                    <Fragment key={step.status}>
                      {i > 0 ? <View style={[s.v44, i > reached && x.dim]} /> : null}
                      <View style={s.v43}>
                        <View style={[s.v40, !done && x.dim]}>
                          <Icon xml={X7} width={12} height={12} style={s.v1} />
                        </View>
                        <View>
                          <Text style={s.t41}>{step.label}</Text>
                        </View>
                        <View>
                          <Text style={s.t42}>{times[i] || ' '}</Text>
                        </View>
                      </View>
                    </Fragment>
                  );
                })}
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v51}>
          <Tap lk="N0" style={s.v49}>
            <Icon xml={X8} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Today"}</Text>
          </Tap>
          <Tap lk="N1" style={s.v49}>
            <Icon xml={X9} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Orders"}</Text>
          </Tap>
          <Tap lk="N2" style={s.v49}>
            <Icon xml={X10} width={22} height={22} style={s.v1} />
            <Text style={s.t50}>{"Receipts"}</Text>
          </Tap>
          <Tap lk="N3" style={s.v49}>
            <Icon xml={X11} width={22} height={22} style={s.v1} />
            <Text style={s.t4}>{"Messages"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({ dim: { opacity: 0.3 } });

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#047857\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"28\" height=\"28\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#475467\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7\" fill=\"none\" stroke=\"#0e7490\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M16 2v4M8 2v4M3 10h18\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X7 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X8 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 9l1.5-5h15L21 9\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M5 13v8h14v-8M10 21v-5h4v5\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X9 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X10 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X11 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t8: {"color":"#047857","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t9: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t10: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":1},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":56,"height":56,"backgroundColor":"#e8f8f0","borderRadius":28},
  v13: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t14: {"color":"#101828","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t15: {"color":"#101828","fontFamily":"Inter_700Bold"},
  t16: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v18: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#eff1f7","borderRadius":14},
  t19: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t20: {"color":"#475467","fontSize":13,"lineHeight":18.2,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v21: {"flexShrink":1},
  v22: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  t23: {"color":"#047857","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v24: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v25: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v26: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t27: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v28: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v29: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64},
  v30: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f7fb","borderRadius":14},
  t31: {"color":"#b45309","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v32: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v33: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v34: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t35: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v37: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  t38: {"color":"#57534e","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v39: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":18},
  v40: {"flexDirection":"row","justifyContent":"center","alignItems":"center","width":22,"height":22,"backgroundColor":"#047857","borderWidth":2,"borderColor":"#047857","borderRadius":11,"boxShadow":"rgba(4, 120, 87, 0.25) 0px 2px 6px 0px"},
  t41: {"color":"#101828","fontSize":13,"lineHeight":15.6,"textAlign":"center","fontFamily":"Inter_600SemiBold"},
  t42: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_600SemiBold"},
  v43: {"flexDirection":"column","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"width":66},
  v44: {"flexShrink":0,"marginTop":10,"marginRight":-12,"marginLeft":-12,"width":22,"height":2,"backgroundColor":"#047857"},
  v45: {"flexDirection":"row","alignItems":"flex-start","flexShrink":1},
  v46: {"flexDirection":"row","justifyContent":"center","alignItems":"stretch","paddingTop":16,"paddingRight":10,"paddingBottom":14,"paddingLeft":10},
  v47: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v48: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  v49: {"flexDirection":"column","alignItems":"center","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","paddingTop":4,"paddingBottom":4},
  t50: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v51: {"flexDirection":"row","alignItems":"stretch","flexShrink":0,"paddingTop":6,"backgroundColor":"#ffffff","borderTopWidth":1,"borderTopColor":"#eceef3"},
  v52: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
