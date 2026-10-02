// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-28 Voice and language · phone (P3, phone)
// The voice language is the app language setting (@/lib/settings, this phone); "Read next line" is the read-aloud
// setting. The voice pack row is the phone's own voice for that language (Speech.getAvailableVoicesAsync) and
// "Test line" speaks a sample in it (expo-speech, offline). Screen text stays English.
import { Text, View, StyleSheet } from 'react-native';
import { setSettings, useSettings, LANGUAGE_NAMES, type AppLanguage } from '@/lib/settings';
import { useClaims, useParam } from '@/model/hooks';
import { speakIn, useVoiceCheck } from '@/lodestar/voice';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L217":{"to":"ld-02-load-sheet","kind":"go"},"B":{"to":"ld-02-load-sheet","kind":"back"}}};

/** "Can you hear this clearly?" in each language. */
const TEST_LINE: Record<AppLanguage, string> = {
  en: 'Can you hear this clearly?',
  si: 'මෙම හඬ පැහැදිලිව ඇසෙනවාද?',
  ta: 'இந்தக் குரல் தெளிவாகக் கேட்கிறதா?',
};

export default function ScreenLd28VoiceAndLanguage() {
  const claims = useClaims();
  const trip = useParam('trip');
  const { language, readAloud } = useSettings();
  const voice = useVoiceCheck(language);
  const name = claims?.name ?? claims?.username ?? '';
  const back = (kind: 'go' | 'back') => (trip ? { to: 'ld-02-load-sheet', params: { trip }, kind } : undefined);
  const pick = (l: AppLanguage) => () => {
    void setSettings({ language: l });
    return false;
  };
  const card = (l: AppLanguage) => (language === l ? s.v24 : s.v18);
  const code = (l: AppLanguage) => (language === l ? s.t23 : s.t17);
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v62}>
        <View style={s.v7}>
          <Tap lk="B" style={s.v2} to={back('back')}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <Text style={s.t3}>{"Voice"}</Text>
          </View>
          <View style={s.v6}>
            <Text style={s.t5} numberOfLines={1}>{"Works offline"}</Text>
          </View>
        </View>
        <Scroll style={s.v4} contentStyle={s.v51}>
          <View style={s.v11}>
            <View style={s.v9}>
              <Text style={s.t8}>{['Settings', name, 'this phone'].filter(Boolean).join(' · ')}</Text>
            </View>
            <View>
              <Text style={s.t10}>{"Read aloud"}</Text>
            </View>
          </View>
          <View style={s.v26}>
            <View style={s.v15}>
              <View style={s.v13}>
                <Text style={s.t12}>{"Language of the voice"}</Text>
              </View>
              <View style={s.v13}>
                <Text style={s.t14}>{"screen text stays"}</Text>
              </View>
            </View>
            <View style={s.v25}>
              <Tap to={null} onPress={pick('en')} style={card('en')} testID="lang-en">
                <View>
                  <Text style={[s.t16, language === 'en' && x.on]}>{"English"}</Text>
                </View>
                <View>
                  <Text style={code('en')}>{"EN"}</Text>
                </View>
              </Tap>
              <Tap to={null} onPress={pick('si')} style={card('si')} testID="lang-si">
                <View>
                  <Text style={[s.t20, language === 'si' && x.on]}><Text style={s.t19}>{"සිංහල"}</Text></Text>
                </View>
                <View>
                  <Text style={code('si')}>{"SI"}</Text>
                </View>
              </Tap>
              <Tap to={null} onPress={pick('ta')} style={card('ta')} testID="lang-ta">
                <View>
                  <Text style={[s.t22, language !== 'ta' && x.off]}><Text style={s.t21}>{"தமிழ்"}</Text></Text>
                </View>
                <View>
                  <Text style={code('ta')}>{"TA"}</Text>
                </View>
              </Tap>
            </View>
          </View>
          <View style={s.v50}>
            <Tap to={null} onPress={() => { void setSettings({ readAloud: !readAloud }); return false; }} style={s.v34} testID="read-aloud-toggle">
              <View style={s.v27}>
                <Icon xml={X1} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v31}>
                <View>
                  <Text style={s.t28}>{"Read next line"}</Text>
                </View>
                <View style={s.v30}>
                  <Text style={s.t29}>{readAloud ? "Speaks the highlighted line" : "Off · lines are not spoken"}</Text>
                </View>
              </View>
              <View style={[s.v33, !readAloud && x.toggleOff]} testID={readAloud ? 'read-aloud-on' : 'read-aloud-off'}>
                <View style={s.v32} />
              </View>
            </Tap>
            <View style={s.v40}>
              <View style={s.v35}>
                <Icon xml={X2} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v31}>
                <View>
                  <Text style={s.t28}>{"Earpiece"}</Text>
                </View>
                <View style={s.v30}>
                  <View style={s.v38}>
                    <View style={s.v36} />
                    <Text style={s.t37} numberOfLines={1}>{"Phone audio"}</Text>
                  </View>
                  <View style={s.v39} />
                  <Text style={s.t29}>{"an earpiece takes it when connected"}</Text>
                </View>
              </View>
            </View>
            <View style={s.v40}>
              <View style={s.v27}>
                <Icon xml={X3} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v31}>
                <View>
                  <Text style={s.t28}>{"Speed"}</Text>
                </View>
                <View style={s.v30}>
                  <Text style={s.t29}>{"Slower is clearer"}</Text>
                </View>
              </View>
              <View style={s.v45}>
                <View style={s.v42}>
                  <Text style={s.t41} numberOfLines={1}>{"Slow"}</Text>
                </View>
                <View style={s.v44}>
                  <Text style={s.t43} numberOfLines={1}>{"Normal"}</Text>
                </View>
              </View>
            </View>
            <View style={s.v40}>
              <View style={voice.available ? s.v35 : s.v27}>
                <Icon xml={X4} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v31}>
                <View>
                  <Text style={[s.t47, x[language]]} testID="voice-pack"><Text>{LANGUAGE_NAMES[language]}</Text>{" voice pack"}</Text>
                </View>
                <View style={s.v30}>
                  <Text style={s.t29}>{voice.checking ? 'Checking this phone…' : voice.available ? (voice.voiceName ?? 'On this phone') : 'Not on this phone'}</Text>
                  <View style={s.v39} />
                  <Text style={s.t29}>{voice.checking ? '' : voice.available ? 'works offline' : 'text still works'}</Text>
                </View>
              </View>
              <View style={s.v49}>
                <View>
                  <Text style={s.t48}>{voice.checking ? '—' : String(voice.count)}</Text>
                </View>
                <View>
                  <Text style={s.t8}>{"voices"}</Text>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v61}>
          <View style={s.v57}>
            <Tap to={null} onPress={() => { speakIn(TEST_LINE[language], language); return false; }} style={s.v53} testID="voice-test">
              <Icon xml={X5} width={22} height={22} style={s.v1} />
              <Text style={s.t52} numberOfLines={1}>{"Test line"}</Text>
            </Tap>
            <View style={s.v56}>
              <View>
                <Text style={[s.t54, x[language]]}>{TEST_LINE[language]}</Text>
              </View>
              <View>
                <Text style={s.t55}>{language === 'en' ? '' : `"${TEST_LINE.en}"`}</Text>
              </View>
            </View>
          </View>
          <Tap lk="L217" style={s.v60} to={back('go')}>
            <Grad g={G0} style={s.v58} />
            <Icon xml={X6} width={22} height={22} style={s.v1} />
            <Text style={s.t59}>{"Done"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const x = StyleSheet.create({
  on: { color: '#ffcb5c' },
  off: { color: '#0a0f1a' },
  toggleOff: { justifyContent: 'flex-start', backgroundColor: '#c9cfe8' },
  en: { fontFamily: 'Inter_700Bold' },
  si: { fontFamily: 'NotoSansSinhala_700Bold' },
  ta: { fontFamily: 'NotoSansTamil_700Bold' },
});

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#0a0f1a\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m12 14 4-4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M3.34 19a10 10 0 1 1 17.32 0\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#047857\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#141b4d\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 5 6 9H2v6h4l5 4V5Z\" fill=\"none\" stroke=\"#141b4d\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\" stroke=\"#141b4d\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
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
  v9: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t10: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  t12: {"color":"#0a0f1a","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v13: {"flexShrink":1},
  t14: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v15: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t16: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t17: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v18: {"flexDirection":"column","justifyContent":"center","alignItems":"center","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":80,"backgroundColor":"#ffffff","borderRadius":18,"boxShadow":"rgba(15, 20, 50, 0.06) 0px 1px 2px 0px"},
  t19: {"fontFamily":"NotoSansSinhala_800ExtraBold"},
  t20: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"fontFamily":"NotoSansSinhala_800ExtraBold"},
  t21: {"fontFamily":"NotoSansTamil_800ExtraBold"},
  t22: {"color":"#ffcb5c","fontSize":20,"lineHeight":30,"fontFamily":"NotoSansTamil_800ExtraBold"},
  t23: {"color":"#c9cfe8","fontSize":13,"lineHeight":19.5,"letterSpacing":-0.1,"fontFamily":"JetBrainsMono_600SemiBold"},
  v24: {"flexDirection":"column","justifyContent":"center","alignItems":"center","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":80,"backgroundColor":"#141b4d","borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 6px 16px 0px"},
  v25: {"flexDirection":"row","alignItems":"stretch","rowGap":10,"columnGap":10,"marginRight":16,"marginLeft":16},
  v26: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v27: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e6e9f8","borderRadius":14},
  t28: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t29: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v30: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v32: {"flexShrink":1,"width":28,"height":28,"backgroundColor":"#ffffff","borderRadius":14,"boxShadow":"rgba(0, 0, 0, 0.2) 0px 1px 3px 0px"},
  v33: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":56,"height":34,"backgroundColor":"#141b4d","borderRadius":17},
  v34: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64},
  v35: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e3f6ec","borderRadius":14},
  v36: {"flexShrink":1,"width":7,"height":7,"backgroundColor":"#047857","borderRadius":3.5},
  t37: {"color":"#047857","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_600SemiBold"},
  v38: {"flexDirection":"row","alignItems":"center","rowGap":5,"columnGap":5,"flexShrink":1},
  v39: {"flexShrink":1,"width":3,"height":3,"backgroundColor":"#4a5467","borderRadius":1.5,"opacity":0.6},
  v40: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":64,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  t41: {"color":"#344054","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":10,"paddingLeft":10,"height":40,"borderRadius":20},
  t43: {"color":"#ffffff","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v44: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":1,"paddingRight":10,"paddingLeft":10,"height":40,"backgroundColor":"#141b4d","borderRadius":20},
  v45: {"flexDirection":"row","alignItems":"stretch","rowGap":4,"columnGap":4,"flexShrink":0,"paddingTop":4,"paddingRight":4,"paddingBottom":4,"paddingLeft":4,"backgroundColor":"#e9ecf2","borderRadius":24},
  t46: {"fontFamily":"NotoSansTamil_700Bold"},
  t47: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"NotoSansTamil_700Bold"},
  t48: {"color":"#0a0f1a","fontSize":20,"lineHeight":30,"letterSpacing":-0.4,"fontVariant":["tabular-nums"],"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v49: {"flexDirection":"column","alignItems":"flex-end","rowGap":2,"columnGap":2,"flexShrink":0},
  v50: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v51: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  t52: {"color":"#141b4d","fontSize":16,"lineHeight":24,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v53: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":22,"paddingLeft":18,"height":56,"backgroundColor":"#ffffff","borderRadius":28,"boxShadow":"rgb(20, 27, 77) 0px 0px 0px 2px inset"},
  t54: {"color":"#344054","fontSize":13,"lineHeight":16.9,"fontFamily":"NotoSansTamil_700Bold"},
  t55: {"color":"#4a5467","fontSize":13,"lineHeight":16.9,"fontFamily":"Inter_600SemiBold"},
  v56: {"flexDirection":"column","alignItems":"stretch","rowGap":1,"columnGap":1,"flexShrink":1},
  v57: {"flexDirection":"row","alignItems":"center","rowGap":12,"columnGap":12},
  v58: {"borderRadius":18},
  t59: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v60: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v61: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingTop":8,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v62: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
