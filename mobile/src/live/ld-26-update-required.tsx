// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-26 Update required · phone (P3, phone)
import { Text, View, StyleSheet } from 'react-native';
import { applyUpdate, useVersion } from '@/lib/version';
import { hm } from '@/lib/time';
import { plural } from '@/lodestar/live';
import { useTickCount } from '@/model/dock';
import { useLoadSheet, useOutbox } from '@/model/hooks';
import { Frame, Grad, Icon, Scroll, Tap, showToast, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L215":{"to":"ld-02-load-sheet","kind":"go"},"L216":{"to":"ld-05-splash","kind":"go"},"B":{"to":"ld-01-dock-queue","kind":"back"}}};

export default function ScreenLd26UpdateRequired() {
  const { current, minimum } = useVersion();
  const { data, tripId } = useLoadSheet();
  const { waiting } = useOutbox();
  const ticked = useTickCount(tripId ? [tripId] : []);
  const trip = data?.trip ?? null;
  const veh = trip?.vehicleId ?? '—';
  const sheet = tripId ? { to: 'ld-02-load-sheet', params: { trip: tripId } } : undefined;
  const update = async () => {
    if (await applyUpdate()) return true;
    showToast(`This build (${current}) is still below ${minimum ?? 'the minimum'}. Install the new version to carry on.`, 'error');
    return false;
  };
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v30}>
        <View style={s.v8}>
          <Tap lk="B" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <Text style={s.t4}><Text style={s.t3}>{veh}</Text>{trip?.departTime ? ` · departs ${hm(trip.departTime)}` : ''}</Text>
          </View>
          <View style={s.v7}>
            <Text style={s.t6} numberOfLines={1}>{data ? `${ticked} of ${data.lines.length}` : '—'}</Text>
          </View>
        </View>
        <Scroll style={s.v5} contentStyle={s.v23}>
          <View style={s.v15}>
            <View style={s.v12}>
              <View style={s.v9}>
                <Icon xml={X1} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v11}>
                <Text style={s.t10}>{`Update needed · Lodestar Dock ${minimum ?? '—'}`}</Text>
              </View>
            </View>
            <View>
              <Text style={s.t13}>{trip ? `Finish releasing ${veh} first, update after` : 'Update before your next load'}</Text>
            </View>
            <View>
              <Text style={s.t14}>{`This phone has ${current}; ${minimum ?? 'a newer version'} is needed. Your ticks stay on this phone while it updates.`}</Text>
            </View>
          </View>
          <View style={s.v20}>
            <View style={s.v18}>
              <View style={s.v11}>
                <Text style={s.t16}>{"What's new"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t17}>{`${current} to ${minimum ?? '—'}`}</Text>
              </View>
            </View>
            <View style={s.v19}>
              <View style={s.v11}>
                <Text style={s.t16}>{"Your ticks"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t17}>{`${plural(ticked, 'tick')} saved on this phone`}</Text>
              </View>
            </View>
            <View style={s.v19}>
              <View style={s.v11}>
                <Text style={s.t16}>{"Waiting to send"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t17}>{waiting.length ? plural(waiting.length, 'record') : 'Nothing, all sent'}</Text>
              </View>
            </View>
            <View style={s.v19}>
              <View style={s.v11}>
                <Text style={s.t16}>{"Needed by"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t17}>{"Your next sign-in"}</Text>
              </View>
            </View>
          </View>
          <View style={s.v22}>
            <Icon xml={X2} width={18} height={18} style={s.v1} />
            <View style={s.v11}>
              <Text style={s.t21}>{"The app asks again the next time you sign in"}{trip ? <>{", after you release "}<Text style={s.t3}>{veh}</Text></> : null}{"."}</Text>
            </View>
          </View>
        </Scroll>
        <View style={s.v29}>
          <Tap lk="L215" style={s.v26} to={sheet}>
            <Grad g={G0} style={s.v24} />
            <Icon xml={X3} width={22} height={22} style={s.v1} />
            <Text style={s.t25}>{trip ? `Keep loading ${veh}` : 'Keep loading'}</Text>
          </Tap>
          <Tap lk="L216" style={s.v28} onPress={update}>
            <Icon xml={X4} width={22} height={22} style={s.v1} />
            <Text style={s.t27}>{"Update now"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 10l5 5 5-5M12 15V3\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 10l5 5 5-5M12 15V3\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  t4: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v5: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t6: {"color":"#344054","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e9ecf2","borderRadius":14},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v9: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e6e9f8","borderRadius":14},
  t10: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v11: {"flexShrink":1},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12},
  t13: {"color":"#0a0f1a","fontSize":22,"lineHeight":26.4,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t14: {"color":"#344054","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v15: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t16: {"color":"#344054","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_400Regular"},
  t17: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v18: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48},
  v19: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v20: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t21: {"color":"#344054","fontSize":14,"lineHeight":19.6,"fontFamily":"Inter_600SemiBold"},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"marginRight":20,"marginLeft":20},
  v23: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v24: {"borderRadius":18},
  t25: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v26: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  t27: {"color":"#344054","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v28: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v29: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v30: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
