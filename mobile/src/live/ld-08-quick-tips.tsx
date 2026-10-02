// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// LD-08 Quick tips · phone (P3, phone)
import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { markOnboardingSeen, useSettings } from '@/lib/settings';
import { useClaims } from '@/model/hooks';
import { Frame, Grad, Icon, Scroll, Tap, type ScreenNav, type GradSpec } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L189":{"to":"ld-01-dock-queue","kind":"go"}}};

export default function ScreenLd08QuickTips() {
  const sub = useClaims()?.sub;
  const { width } = useWindowDimensions();
  const { glovesMode } = useSettings();
  // the dock home on a wide tablet is the tablet load sheet; on a phone the designed dock queue
  const home = width >= 900 ? 'ld-02-load-sheet-tablet' : undefined;
  const done = async () => {
    await markOnboardingSeen(sub);
    return true;
  };
  return (
    <Frame bg="#f2f4f8" nav={nav} style={s.v0}>
      <View style={s.v36}>
        <View style={s.v6}>
          <View style={s.v1} />
          <View style={s.v3}>
            <Text style={s.t2}>{"Quick tips"}</Text>
          </View>
          <Tap lk="L189" style={s.v5} onPress={done} to={home} testID="skip">
            <Text style={s.t4} numberOfLines={1}>{"Skip"}</Text>
          </Tap>
        </View>
        <Scroll style={s.v3} contentStyle={s.v31}>
          <View style={s.v10}>
            <View style={s.v8}>
              <Text style={s.t7}>{"Before your first vehicle"}</Text>
            </View>
            <View>
              <Text style={s.t9}>{"Three things to know"}</Text>
            </View>
          </View>
          <View style={s.v21}>
            <View style={s.v17}>
              <View style={s.v12}>
                <Icon xml={X0} width={22} height={22} style={s.v11} />
              </View>
              <View style={s.v16}>
                <View>
                  <Text style={s.t13}>{glovesMode ? "Gloves mode is on" : "Gloves mode is off"}</Text>
                </View>
                <View style={s.v15}>
                  <Text style={s.t14}>{glovesMode ? "Every button fits a gloved thumb. No swipes, no small links." : "Turn it on at the start of your shift for bigger tap areas."}</Text>
                </View>
              </View>
            </View>
            <View style={s.v19}>
              <View style={s.v18}>
                <Icon xml={X1} width={22} height={22} style={s.v11} />
              </View>
              <View style={s.v16}>
                <View>
                  <Text style={s.t13}>{"Flag it, don't phone it"}</Text>
                </View>
                <View style={s.v15}>
                  <Text style={s.t14}>{"Short, damaged or warm? One flag tells dispatch, the store and the driver."}</Text>
                </View>
              </View>
            </View>
            <View style={s.v19}>
              <View style={s.v20}>
                <Icon xml={X2} width={22} height={22} style={s.v11} />
              </View>
              <View style={s.v16}>
                <View>
                  <Text style={s.t13}>{"Watch the plan version"}</Text>
                </View>
                <View style={s.v15}>
                  <Text style={s.t14}>{"Green means latest. Amber means it changed: read it and tap Got it before you load on."}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={s.v30}>
            <View style={s.v24}>
              <View style={s.v23}>
                <Text style={s.t22}>{"A plan change looks like this"}</Text>
              </View>
            </View>
            <View style={s.v29}>
              <Icon xml={X3} width={20} height={20} style={s.v25} />
              <View style={s.v28}>
                <View>
                  <Text style={s.t26}>{"Plan changed · new version · items moved"}</Text>
                </View>
                <View>
                  <Text style={s.t27}>{"Tap to see what moved"}</Text>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
        <View style={s.v35}>
          <Tap lk="L189" style={s.v34} onPress={done} to={home}>
            <Grad g={G0} style={s.v32} />
            <Icon xml={X4} width={22} height={22} style={s.v11} />
            <Text style={s.t33}>{"Got it, show my dock"}</Text>
          </Tap>
        </View>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M12 9v4M12 17h.01\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m12 2 10 5-10 5L2 7z\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m2 17 10 5 10-5M2 12l10 5 10-5\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m12 2 10 5-10 5L2 7z\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"m2 17 10 5 10-5M2 12l10 5 10-5\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const G0: GradSpec[] = [{"type":"linear","angle":135,"at":null,"repeat":false,"stops":[{"c":"#243080","p":0},{"c":"#141b4d","p":1}]}];

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"width":56},
  t2: {"color":"#0a0f1a","fontSize":15,"lineHeight":22.5,"textAlign":"center","fontFamily":"Inter_700Bold"},
  v3: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t4: {"color":"#344054","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v5: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"center","flexShrink":0,"paddingRight":4,"paddingLeft":4,"width":56,"height":44},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#4a5467","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_600SemiBold"},
  v8: {"flexDirection":"row","alignItems":"center","rowGap":8,"columnGap":8},
  t9: {"color":"#0a0f1a","fontSize":30,"lineHeight":33.6,"letterSpacing":-0.7,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v10: {"flexDirection":"column","alignItems":"stretch","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":20,"paddingLeft":20},
  v11: {"flexShrink":0,"overflow":"hidden"},
  v12: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#e6e9f8","borderRadius":14},
  t13: {"color":"#0a0f1a","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  t14: {"color":"#344054","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v15: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v16: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v17: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":76},
  v18: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#fde8e5","borderRadius":14},
  v19: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":12,"paddingRight":16,"paddingBottom":12,"paddingLeft":16,"minHeight":76,"borderTopWidth":1,"borderTopColor":"#e3e6ed"},
  v20: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#fff1d6","borderRadius":14},
  v21: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  t22: {"color":"#0a0f1a","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v23: {"flexShrink":1},
  v24: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  v25: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t26: {"color":"#b45309","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t27: {"color":"#344054","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v28: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v29: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#fff1d6","borderRadius":18},
  v30: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v31: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v32: {"borderRadius":18},
  t33: {"color":"#ffffff","fontSize":17,"lineHeight":25.5,"letterSpacing":-0.2,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v34: {"flexDirection":"row","justifyContent":"center","alignItems":"center","rowGap":10,"columnGap":10,"height":58,"borderRadius":18,"boxShadow":"rgba(20, 27, 77, 0.25) 0px 8px 20px 0px"},
  v35: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0,"paddingTop":12,"paddingRight":16,"paddingBottom":6,"paddingLeft":16,"backgroundColor":"#f2f4f8"},
  v36: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f2f4f8"},
});
