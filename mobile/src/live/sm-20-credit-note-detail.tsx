// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-20 Credit note detail · phone (P1, phone)
// The credit of one order (route param `order`, or `pod` from older links): the order's own credit note when
// the store counted short (it exists before the driver's record syncs), else the driver's POD's. "Download PDF"
// prints the note on the web (save as PDF); a phone shares it.
import { Image, Platform, Share, Text, View, StyleSheet } from 'react-native';
import { dayLabel, hm } from '@/lib/time';
import { plural, titleCase } from '@/lodestar/live';
import { useClaims, useOutbox, useParam } from '@/model/hooks';
import { receiptFor, useStoreReceipts, type StoreReceipt } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ESC[c]);

/** The credit note as plain lines (shared from a phone, printed on the web). */
function noteLines(r: StoreReceipt, outlet: string): string[] {
  const ex = r.pod?.exceptions ?? [];
  return [
    `Credit note ${r.creditNoteId ?? '(pending)'}`,
    outlet,
    `Order ${r.orderId}${r.runDate ? ` · delivery ${dayLabel(r.runDate)}` : ''}`,
    `Credited: ${plural(r.credited, 'unit')}`,
    `Ordered ${r.ordered}${r.counted !== null ? ` · store count ${r.counted}` : ''}${r.delivered !== null ? ` · driver's record ${r.delivered}` : ''}`,
    ...ex.map(e => `${e.qty ?? e.unitsShort ?? ''} ${e.item ?? titleCase(e.type)}${e.description ? ` · ${e.description}` : ''}`.trim()),
    ...(r.order?.receiptNote ? [`Store note: ${r.order.receiptNote}`] : []),
  ].filter(Boolean);
}

async function exportNote(r: StoreReceipt, outlet: string) {
  const lines = noteLines(r, outlet);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (!w) throw new Error('Allow pop-ups to save the credit note');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(lines[0])}</title><body style="font:14px/1.5 system-ui,sans-serif;padding:32px"><h1 style="font-size:22px">${esc(lines[0])}</h1>${lines.slice(1).map(l => `<p>${esc(l)}</p>`).join('')}</body>`);
    w.document.close();
    w.focus();
    w.print();
    return;
  }
  await Share.share({ title: lines[0], message: lines.join('\n') });
}

const nav: ScreenNav = {"links":{"L99":{"to":"sm-19-receipts-and-credit-notes","kind":"go"}}};

export default function ScreenSm20CreditNoteDetail() {
  const claims = useClaims();
  const orderParam = useParam('order');
  const podParam = useParam('pod');
  const receipts = useStoreReceipts();
  const list = receipts.list;
  const r = (orderParam ? list.find(x => x.orderId === orderParam) : podParam ? list.find(x => x.pod?.id === podParam) : undefined)
    ?? (orderParam || podParam ? undefined : list.find(x => x.creditNoteId || x.credited > 0) ?? list[0]);
  const pod = r?.pod ?? null;
  const { items } = useOutbox();
  const orderId = r?.orderId;
  const mine = receiptFor(items, orderId);
  const countedAt = r?.order?.receiptSavedAt ?? mine?.savedAt;
  const units = r?.credited ?? 0;
  const ex = pod?.exceptions ?? [];
  const outletName = receipts.day.data?.outlet ? `${receipts.day.data.outlet.name} · ${receipts.day.data.outlet.id}` : (claims?.outletId ?? '');
  const empty = !claims ? 'Sign in to see credit notes' : receipts.loading ? 'Loading…' : 'No credit note selected';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v50}>
        <View style={s.v7}>
          <Tap lk="L99" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Credit note"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{r ? (r.creditNoteId ?? 'Not issued yet') : '—'}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v45} contentStyle={s.v46}>
          <View style={s.v17}>
            <View style={s.v12}>
              <View style={s.v8}>
                <Text style={s.t4}>{r ? `${units ? 'Credited' : 'Delivered'} · ${dayLabel(r.at)}` : empty}</Text>
              </View>
              {r ? (
                <View style={s.v11}>
                  <View style={s.v9} />
                  <Text style={s.t10} numberOfLines={1}>{r.creditNoteId ? 'Issued' : units ? 'Pending' : 'Matched'}</Text>
                </View>
              ) : null}
            </View>
            <View>
              <Text style={s.t14} testID="credit-units">{r ? String(units) : '—'}<Text style={s.t13}>{units === 1 ? 'unit' : 'units'}</Text></Text>
            </View>
            <View>
              <Text style={s.t16}>{r ? 'On ' : ''}{r ? <Text style={s.t15}>{orderId ?? '—'}</Text> : null}{r ? [
                r.counted !== null ? ` · you counted ${r.counted} of ${r.ordered}${countedAt ? ` at ${hm(countedAt)}` : ''}` : mine ? ` · your count ${hm(mine.savedAt)}` : '',
                pod ? ` · delivered ${pod.unitsDelivered} of ${pod.unitsOrdered} · driver's record ${hm(pod.savedAt)}` : " · driver's record not synced yet",
              ].join('') : ''}</Text>
            </View>
          </View>
          <View style={s.v35}>
            <View style={s.v20}>
              <View style={s.v8}>
                <Text style={s.t18}>{"Lines"}</Text>
              </View>
              <View style={s.v8}>
                <Text style={s.t19}>{plural(ex.length, 'line')}</Text>
              </View>
            </View>
            <View style={s.v34}>
              {ex.length ? ex.map((e, i) => (
                <View key={i} style={i === 0 ? s.v30 : s.v33}>
                  <View style={i === 0 ? s.v22 : s.v32}>
                    <Text style={i === 0 ? s.t21 : s.t31}>{(e.qty ?? e.unitsShort) ? `−${e.qty ?? e.unitsShort}` : '!'}</Text>
                  </View>
                  <View style={s.v27}>
                    <View>
                      <Text style={s.t23}>{e.item ?? (titleCase(e.type) || 'Item')}</Text>
                    </View>
                    <View style={s.v26}>
                      <Text style={s.t24}>{titleCase(e.type) || 'Exception'}</Text>
                      {e.description ? <View style={s.v25} /> : null}
                      {e.description ? <Text style={s.t24}>{e.description}</Text> : null}
                    </View>
                  </View>
                  <View style={s.v29}>
                    <View>
                      <Text style={s.t28}>{(e.qty ?? e.unitsShort) !== undefined ? String(e.qty ?? e.unitsShort) : '—'}</Text>
                    </View>
                    <View>
                      <Text style={s.t4}>{(e.qty ?? e.unitsShort) === 1 ? 'unit' : 'units'}</Text>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={s.v30}>
                  <View style={s.v27}>
                    <Text style={s.t24}>{r ? (units ? `${plural(units, 'unit')} short${r.order?.receiptNote ? ` · ${r.order.receiptNote}` : pod ? ", no line detail on the driver's record" : ''}` : 'No exceptions recorded') : empty}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={s.v35}>
            <View style={s.v20}>
              <View style={s.v8}>
                <Text style={s.t18}>{"Evidence"}</Text>
              </View>
              <View style={s.v8}>
                <Text style={s.t19}>{pod?.photoUrl ? 'driver photo' : ''}</Text>
              </View>
            </View>
            <View style={s.v40}>
              <View style={s.v39}>
                <Grad g={G0} style={s.v36} />
                {pod?.photoUrl ? <Image source={{ uri: pod.photoUrl }} style={[StyleSheet.absoluteFill, s.v36]} /> : null}
                <View style={s.v38}>
                  <Text style={s.t37} numberOfLines={1}>{pod ? `Driver ${hm(pod.savedAt)}` : 'Driver'}</Text>
                </View>
              </View>
              <View style={s.v39}>
                <Grad g={G1} style={s.v36} />
                <View style={s.v38}>
                  <Text style={s.t37} numberOfLines={1}>{countedAt ? `You ${hm(countedAt)}` : 'You'}</Text>
                </View>
              </View>
            </View>
          </View>
          {pod?.receiverName ? (
            <View style={s.v44}>
              <Icon xml={X1} width={20} height={20} style={s.v41} />
              <View style={s.v43}>
                <View>
                  <Text style={s.t42}>{`Received by ${pod.receiverName}`}</Text>
                </View>
                <View>
                  <Text style={s.t16}>{pod.syncedAt ? `Driver's record synced ${hm(pod.syncedAt)}` : "Driver's record not synced yet"}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </Scroll>
        <View style={s.v49}>
          <Tap style={s.v48} testID="credit-pdf" to={null} disabled={!r} onPress={async () => { if (r) await exportNote(r, outletName); return false; }}>
            <Icon xml={X2} width={22} height={22} style={s.v1} />
            <Text style={s.t47}>{Platform.OS === 'web' ? 'Download PDF' : 'Share credit note'}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><path d=\"M16 2v4M8 2v4M3 10h18\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":160,"at":null,"repeat":false,"stops":[{"c":"#e8d9c4","p":0},{"c":"#cdb592","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":160,"at":null,"repeat":false,"stops":[{"c":"#dccdb6","p":0},{"c":"#b99e78","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":0,"width":40},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v8: {"flexShrink":1},
  v9: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#047857","borderRadius":3.5},
  t10: {"color":"#047857","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v11: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e8f8f0","borderRadius":14},
  v12: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t13: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t14: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t15: {"color":"#101828","letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t16: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v17: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t18: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t19: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t21: {"color":"#b45309","fontSize":16,"lineHeight":24,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v22: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#fff4e0","borderRadius":14},
  t23: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t24: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v25: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#636c80","borderRadius":1.5,"opacity":0.6},
  v26: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v27: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t28: {"color":"#101828","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v29: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v30: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  t31: {"color":"#b42318","fontSize":16,"lineHeight":24,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v32: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#feeeec","borderRadius":14},
  v33: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v34: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v36: {"borderRadius":16},
  t37: {"color":"#ffffff","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v38: {"alignSelf":"flex-start","paddingTop":2,"paddingRight":7,"paddingBottom":2,"paddingLeft":7,"backgroundColor":"rgba(15, 20, 34, 0.72)","borderRadius":11.8},
  v39: {"flexDirection":"column","justifyContent":"flex-end","alignItems":"stretch","flexShrink":0,"paddingTop":8,"paddingRight":8,"paddingBottom":8,"paddingLeft":8,"width":104,"height":104,"borderRadius":16,"overflow":"hidden"},
  v40: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10,"marginRight":16,"marginLeft":16},
  v41: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t42: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v43: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v44: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  v45: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v46: {"flexDirection":"column","alignItems":"stretch","rowGap":14,"columnGap":14,"paddingTop":4,"paddingBottom":16},
  t47: {"color":"#101828","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v48: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 2px 0px"},
  v49: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v50: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
