// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-29 Voice pack downloading · phone (P3, phone)
// The app downloads no voice: read-aloud uses the phone's own voices (expo-speech). This screen checks the phone
// for a voice in the app language and lists all three: checking → ready (voice name) or not on this phone, with
// the designed fallback "text still works". The design's progress bar maps to checking → done.
import { Text, View, StyleSheet } from 'react-native';
import { useSettings, LANGUAGE_NAMES, type AppLanguage } from '@/lib/settings';
import { titleCase } from '@/lodestar/live';
import { useClaims } from '@/model/hooks';
import { useVoiceCheck, type VoiceCheck } from '@/lodestar/voice';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L218":{"to":"ld-08-quick-tips","kind":"go"}}};

const ENGLISH_NAME: Record<AppLanguage, string> = { en: 'English', si: 'Sinhala', ta: 'Tamil' };
const status = (v: VoiceCheck) => (v.checking ? 'Checking this phone' : v.available ? 'Ready' : 'Not on this phone');

export default function ScreenLd29VoicePackDownloading() {
  const claims = useClaims();
  const { language } = useSettings();
  const checks: Record<AppLanguage, VoiceCheck> = { en: useVoiceCheck('en'), ta: useVoiceCheck('ta'), si: useVoiceCheck('si') };
  const voice = checks[language];
  const ready = Object.values(checks).filter(v => v.available).length;
  const name = claims?.name ?? claims?.username ?? '';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '—';
  const depot = claims?.depots[0];
  const rowStyle = (l: AppLanguage, first: boolean) => (l === language ? [s.v48, first && x.noBorder] : first ? s.v42 : s.v52);
  const badge = (v: VoiceCheck) => (v.available ? { box: s.v36, icon: X2 } : v.checking ? { box: s.v43, icon: X3 } : { box: s.v49, icon: X4 });
  const row = (l: AppLanguage, first: boolean) => {
    const v = checks[l];
    const b = badge(v);
    return (
      <View style={rowStyle(l, first)} key={l} testID={`voice-${l}`}>
        <View style={b.box}>
          <Icon xml={b.icon} width={22} height={22} style={s.v1} />
        </View>
        <View style={s.v41}>
          <View>
            <Text style={[s.t37, x[l]]}><Text>{LANGUAGE_NAMES[l]}</Text>{l === 'en' ? '' : ` · ${ENGLISH_NAME[l]}`}</Text>
          </View>
          <View style={s.v40}>
            <Text style={s.t38}>{status(v)}</Text>
            {v.checking ? null : <View style={s.v39} />}
            {v.checking ? null : <Text style={s.t38}>{v.available ? (v.voiceName ?? 'works offline') : 'text still works'}</Text>}
          </View>
        </View>
        {l === language ? (
          <View style={s.v47}>
            <View>
              <Text style={s.t46}>{v.checking ? '…' : v.available ? '✓' : '—'}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v62}>
        <View style={s.v11}>
          <View style={s.v2}>
            <Icon xml={X0} width={36} height={36} style={s.v1} />
          </View>
          <View style={s.v4}>
            <Text style={s.t3}>{depot ? titleCase(depot) : '—'}</Text>
          </View>
          <View style={s.v10}>
            <View style={s.v6}>
              <Text style={s.t5}>{initials}</Text>
            </View>
            <View style={s.v9}>
              <View>
                <Text style={s.t7} numberOfLines={1}>{name || '—'}</Text>
              </View>
              <View>
                <Text style={s.t8} numberOfLines={1}>{"Loader"}</Text>
              </View>
            </View>
          </View>
        </View>
        <Scroll style={s.v4} contentStyle={s.v57}>
          <View style={s.v15}>
            <View style={s.v13}>
              <Text style={s.t12}>{"Start of shift · this phone"}</Text>
            </View>
            <View>
              <Text style={s.t14}>{voice.checking ? 'Checking the voice' : voice.available ? 'Voice ready' : 'No voice on this phone'}</Text>
            </View>
          </View>
          <View style={s.v27}>
            <View>
              <Text style={s.t17}><Text><Text style={x[language]}>{LANGUAGE_NAMES[language]}</Text></Text>{" voice · comes with the phone"}</Text>
            </View>
            <View style={s.v23}>
              <View style={s.v20}>
                <Text style={s.t19} testID="voice-state">{voice.checking ? 'Checking' : voice.available ? 'Ready' : 'None'}<Text style={s.t18}>{""}</Text></Text>
              </View>
              <View style={s.v22}>
                <Text style={s.t21} numberOfLines={1} testID="voice-name">{voice.checking ? 'looking…' : voice.available ? (voice.voiceName ?? 'phone voice') : `${voice.count} voices, none for ${ENGLISH_NAME[language]}`}</Text>
              </View>
            </View>
            <View style={s.v26}>
              <View style={[s.v25, { width: voice.checking ? '30%' : '100%' }]}>
                <Grad g={G0} style={s.v24} />
              </View>
            </View>
          </View>
          <View style={s.v32}>
            <Icon xml={X1} width={20} height={20} style={s.v28} />
            <View style={s.v31}>
              <View>
                <Text style={s.t29}>{"Loading works without it"}</Text>
              </View>
              <View>
                <Text style={s.t30}>{"Text is always shown. A phone voice speaks with no network."}</Text>
              </View>
            </View>
          </View>
          <View style={s.v54}>
            <View style={s.v35}>
              <View style={s.v20}>
                <Text style={s.t33}>{"Voices on this phone"}</Text>
              </View>
              <View style={s.v20}>
                <Text style={s.t34}>{`${ready} of 3 ready`}</Text>
              </View>
            </View>
            <View style={s.v53}>
              {row('en', true)}
              {row('ta', false)}
              {row('si', false)}
            </View>
          </View>
          <View style={s.v56}>
            <Icon xml={X5} width={22} height={22} style={s.v1} />
            <Text style={s.t55} numberOfLines={1}>{voice.available ? 'Voice ready, text is shown too' : 'Voice not downloaded, text still works'}</Text>
          </View>
        </Scroll>
        <View style={s.v61}>
          <Tap lk="L218" style={s.v60}>
            <Grad g={G1} style={s.v58} />
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t59}>{"Continue, it finishes by itself"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  noBorder: { borderTopWidth: 0 },
  en: { fontFamily: 'Inter_700Bold' },
  si: { fontFamily: 'NotoSansSinhala_700Bold' },
  ta: { fontFamily: 'NotoSansTamil_700Bold' },
});

const X0 = "<svg viewBox=\"0 0 32 32\" width=\"36\" height=\"36\" fill=\"#000000\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#6d28d9\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></rect><g transform=\"translate(7.36 7.36) scale(0.72)\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.3 7 12 12l8.7-5M12 22V12\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></g></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 10l5 5 5-5M12 15V3\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M7 10l5 5 5-5M12 15V3\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\" stroke=\"#344054\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12h14M12 5l7 7-7 7\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];
const G1: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"borderRadius":20},
  t3: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v4: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t5: {"color":"#ffcb5c","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_800ExtraBold"},
  v6: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":34,"height":34,"backgroundColor":"#141b4d","borderRadius":17},
  t7: {"color":"#0a0f1a","fontSize":13,"lineHeight":15.6,"fontFamily":"Inter_700Bold"},
  t8: {"color":"#4a5467","fontSize":13,"lineHeight":15.6,"fontFamily":"Inter_600SemiBold"},
  v9: {"flexDirection":"column","alignItems":"stretch","flexShrink":1},
  v10: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":12,"paddingLeft":5,"height":44,"backgroundColor":"#ffffff","borderRadius":22,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  v11: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t12: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v13: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t14: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v15: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  t16: {"fontFamily":"NotoSansTamil_600SemiBold"},
  t17: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"NotoSansTamil_600SemiBold"},
  t18: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t19: {"color":"#0a0f1a","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v20: {"flexShrink":1},
  t21: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#e6e9f8","borderRadius":14},
  v23: {"flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","rowGap":12,"columnGap":12},
  v24: {"borderRadius":4},
  v25: {"flexShrink":1,"width":"62%","borderRadius":4},
  v26: {"flexDirection":"row","alignItems":"stretch","flexShrink":1,"height":8,"backgroundColor":"#e9ecf2","borderRadius":4,"overflow":"hidden"},
  v27: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v28: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t29: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t30: {"color":"#344054","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v32: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e2f0fa","borderRadius":18},
  t33: {"color":"#0a0f1a","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t34: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v35: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v36: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f6ec","borderRadius":14},
  t37: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t38: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v39: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#4a5467","borderRadius":1.5,"opacity":0.6},
  v40: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v41: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v42: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":64},
  v43: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e6e9f8","borderRadius":14},
  t44: {"fontFamily":"NotoSansTamil_700Bold"},
  t45: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"NotoSansTamil_700Bold"},
  t46: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v47: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v48: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":64,"backgroundColor":"#e6e9f8","borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v49: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"borderRadius":14,"boxShadow":"rgb(168, 162, 158) 0px 0px 0px 1.5px inset"},
  t50: {"fontFamily":"NotoSansSinhala_700Bold"},
  t51: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"NotoSansSinhala_700Bold"},
  v52: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":8,"paddingRight":16,"paddingBottom":8,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v53: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v54: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  t55: {"color":"#344054","fontSize":14,"lineHeight":21,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v56: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":22,"marginRight":16,"paddingLeft":18,"marginLeft":16,"height":56,"borderWidth":2,"borderColor":"#8f98aa","borderStyle":"dashed","borderRadius":28},
  v57: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"paddingTop":4,"paddingBottom":16},
  v58: {"borderRadius":18},
  t59: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v60: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v61: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v62: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
