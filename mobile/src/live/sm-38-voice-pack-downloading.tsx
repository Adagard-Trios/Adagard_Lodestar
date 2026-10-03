// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-38 Voice pack downloading · phone (P1, phone)
// The app downloads no voice: read-aloud uses the phone's own voices (expo-speech). So this screen checks the
// phone for a voice in the language (route param `lang`, else the app language): checking → found (voice name)
// or none, with the designed fallback "text still works". The design's progress bar maps to checking → done.
import { Text, View, StyleSheet } from 'react-native';
import { useSettings, LANGUAGE_NAMES, type AppLanguage } from '@/lib/settings';
import { useParam } from '@/model/hooks';
import { speakIn, useVoiceCheck } from '@/lodestar/voice';
import { useArrivalLine } from '@/model/store-face';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L118":{"to":"sm-11-today-order-day","kind":"go"},"L119":{"to":"sm-37-voice-and-language","kind":"go"}}};

const ENGLISH_NAME: Record<AppLanguage, string> = { en: 'English', si: 'Sinhala', ta: 'Tamil' };
const isLang = (v?: string): v is AppLanguage => v === 'en' || v === 'si' || v === 'ta';

export default function ScreenSm38VoicePackDownloading() {
  const sampleLine = useArrivalLine();
  const settings = useSettings();
  const param = useParam('lang');
  const lang: AppLanguage = isLang(param) ? param : settings.language;
  const voice = useVoiceCheck(lang);
  const state = voice.checking ? 'checking' : voice.available ? 'ready' : 'none';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v45}>
        <View style={s.v7}>
          <Tap lk="L119" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v5}>
            <View>
              <Text style={s.t3}>{"Voice pack"}</Text>
            </View>
            <View>
              <Text style={s.t4} numberOfLines={1}>{"Voice & language"}</Text>
            </View>
          </View>
          <View style={s.v6} />
        </View>
        <Scroll style={s.v37} contentStyle={s.v38}>
          <View style={s.v19}>
            <View style={s.v12}>
              <View style={s.v8}>
                <Icon xml={X1} width={14} height={14} style={s.v1} />
                <Text style={s.t4}>{state === 'checking' ? 'Checking this phone' : state === 'ready' ? 'On this phone' : 'Not on this phone'}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t10}><Text><Text style={x[lang]}>{LANGUAGE_NAMES[lang]}</Text></Text>{" voice"}</Text>
              </View>
            </View>
            <View>
              <Text style={s.t14} testID="voice-state">{state === 'checking' ? 'Checking' : state === 'ready' ? 'Ready' : 'None'}<Text style={s.t13}>{""}</Text></Text>
            </View>
            <View style={s.v17}>
              <View style={[s.v16, { width: state === 'checking' ? '30%' : '100%' }]}>
                <Grad g={G0} style={s.v15} />
              </View>
            </View>
            <View>
              <Text style={s.t18} testID="voice-name">{state === 'checking' ? 'Looking for a voice on this phone…' : state === 'ready' ? `${voice.voiceName ?? 'Phone voice'} · works offline` : `${voice.count} voices on this phone, none for ${ENGLISH_NAME[lang]}`}</Text>
            </View>
          </View>
          <View style={s.v23}>
            <Icon xml={X2} width={20} height={20} style={s.v20} />
            <View style={s.v22}>
              <View>
                <Text style={s.t21}>{"Everything works without it; text is always shown"}</Text>
              </View>
              <View>
                <Text style={s.t18}>{"Orders, arrival windows and notices read the same on screen with or without a voice."}</Text>
              </View>
            </View>
          </View>
          <View style={s.v29}>
            <View style={s.v26}>
              <View style={s.v11}>
                <Text style={s.t24}>{"Downloads"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t25}>{"None, voices come with the phone"}</Text>
              </View>
            </View>
            <View style={s.v27}>
              <View style={s.v11}>
                <Text style={s.t24}>{"Mobile data"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t25}>{"Not used"}</Text>
              </View>
            </View>
            <View style={s.v27}>
              <View style={s.v11}>
                <Text style={s.t24}>{"After that"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t28}>{"Works with no signal"}</Text>
              </View>
            </View>
          </View>
          <View style={s.v36}>
            <View style={s.v32}>
              <View style={s.v11}>
                <Text style={s.t30}>{state === 'ready' ? 'Read aloud' : "Until it's ready"}</Text>
              </View>
              <View style={s.v11}>
                <Text style={s.t31}>{`in ${ENGLISH_NAME[lang]}`}</Text>
              </View>
            </View>
            <View style={s.v35}>
              <View style={s.v34}>
                <Icon xml={X3} width={20} height={20} style={s.v1} />
                <Text style={s.t33} numberOfLines={1}>{state === 'ready' ? 'Voice on this phone, text shown too' : 'Voice not downloaded, text still works'}</Text>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v44}>
          <Tap lk="L118" style={s.v41}>
            <Grad g={G0} style={s.v39} />
            <Text style={s.t40}>{"Keep using the app"}</Text>
          </Tap>
          <Tap to={null} onPress={() => { speakIn(sampleLine, lang); return false; }} disabled={state === 'checking'} style={s.v43} testID="voice-test">
            <Text style={s.t42}>{"Try the voice"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  en: { fontFamily: 'Inter_700Bold' },
  si: { fontFamily: 'NotoSansSinhala_700Bold' },
  ta: { fontFamily: 'NotoSansTamil_700Bold' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 16v-4M12 8h.01\" fill=\"none\" stroke=\"#0369a1\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M22 9l-6 6M16 9l6 6\" fill=\"none\" stroke=\"#57534e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#4f5fe0","p":0},{"c":"#3b4cca","p":0.55},{"c":"#2f3cb0","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  t4: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v5: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v6: {"flexShrink":0,"width":40},
  v7: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1},
  t9: {"fontFamily":"NotoSansSinhala_600SemiBold"},
  t10: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"NotoSansSinhala_600SemiBold"},
  v11: {"flexShrink":1},
  v12: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12},
  t13: {"fontSize":20,"lineHeight":20,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_700Bold"},
  t14: {"color":"#101828","fontSize":48,"lineHeight":48,"letterSpacing":-1.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v15: {"borderRadius":4},
  v16: {"flexShrink":1,"width":"64%","borderRadius":4},
  v17: {"flexDirection":"row","alignItems":"stretch","flexShrink":1,"height":8,"backgroundColor":"#eff1f7","borderRadius":4,"overflow":"hidden"},
  t18: {"color":"#475467","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v19: {"flexDirection":"column","alignItems":"stretch","rowGap":10,"columnGap":10,"flexShrink":0,"paddingTop":20,"paddingRight":20,"marginRight":16,"paddingBottom":20,"paddingLeft":20,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  v20: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t21: {"color":"#0369a1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v22: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v23: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"flexShrink":0,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#e6f3fb","borderRadius":18},
  t24: {"color":"#475467","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_400Regular"},
  t25: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v26: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48},
  v27: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":48,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  t28: {"color":"#047857","fontSize":15,"lineHeight":22.5,"fontVariant":["tabular-nums"],"fontFamily":"Inter_700Bold"},
  v29: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t30: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  t31: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v32: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t33: {"color":"#57534e","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v34: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8,"flexShrink":0,"paddingRight":16,"paddingLeft":14,"height":44,"borderWidth":1,"borderColor":"#a8a29e","borderStyle":"dashed","borderRadius":22},
  v35: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"paddingRight":16,"paddingLeft":16},
  v36: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v37: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v38: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v39: {"borderRadius":18},
  t40: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v41: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(59, 76, 202, 0.28) 0px 8px 20px 0px"},
  t42: {"color":"#475467","fontSize":15,"lineHeight":22.5,"letterSpacing":-0.1,"fontFamily":"Inter_700Bold"},
  v43: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":44,"borderRadius":18},
  v44: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f4f5f9"},
  v45: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
