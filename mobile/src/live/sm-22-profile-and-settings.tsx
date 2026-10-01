// Live screen (src/live): started from the generated screen of the same key, with real data and actions in the same Frame/Tap runtime.
// SM-22 Profile & settings · phone (P1, phone)
import { Text, View, StyleSheet } from 'react-native';
import { signOutTo, titleCase, useDeviceId } from '@/lodestar/live';
import { useClaims, useStoreDay } from '@/model/hooks';
import { initials } from '@/model/store-face';
import { Frame, Icon, Scroll, Tap, type ScreenNav } from '@/lodestar/runtime';

const nav: ScreenNav = {"links":{"L102":{"to":"sm-11-today-order-day","kind":"go"},"L104":{"to":"sm-05-sign-in","kind":"go"}}};

export default function ScreenSm22ProfileAndSettings() {
  const claims = useClaims();
  const device = useDeviceId();
  const outlet = useStoreDay().data?.outlet ?? null;
  const role = claims?.roles.includes('store_manager') ? 'Store manager' : claims?.roles[0] ? titleCase(claims.roles[0]) : '';
  return (
    <Frame bg="#f4f5f9" nav={nav} style={s.v0}>
      <View style={s.v51}>
        <View style={s.v6}>
          <Tap lk="L102" style={s.v2}>
            <Icon xml={X0} width={20} height={20} style={s.v1} />
          </Tap>
          <View style={s.v4}>
            <View>
              <Text style={s.t3}>{"Profile & settings"}</Text>
            </View>
          </View>
          <View style={s.v5} />
        </View>
        <Scroll style={s.v49} contentStyle={s.v50}>
          <View style={s.v12}>
            <View style={s.v8}>
              <Text style={s.t7}>{initials(claims?.name ?? claims?.username)}</Text>
            </View>
            <View style={s.v11}>
              <View>
                <Text style={s.t9} testID="profile-name">{claims?.name ?? claims?.username ?? 'Not signed in'}</Text>
              </View>
              <View>
                <Text style={s.t10}>{claims ? [role, claims.username].filter(Boolean).join(' · ') : 'Sign in to see your profile'}</Text>
              </View>
            </View>
          </View>
          <View style={s.v24}>
            <View style={s.v16}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Store"}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t15}>{claims?.outletId ?? '—'}</Text>
              </View>
            </View>
            <View style={s.v23}>
              <View style={s.v21}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"Outlet"}</Text>
                </View>
                <View style={s.v14}>
                  <Text style={s.t20}>{outlet?.name ?? '—'}
                    {outlet ? (
                      <View>
                        <Text style={s.t19}>{`supplied from ${titleCase(outlet.depot)} depot`}</Text>
                      </View>
                    ) : null}</Text>
                </View>
              </View>
              <View style={s.v22}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"Dock"}</Text>
                </View>
                <View style={s.v14}>
                  <Text style={s.t20}>{outlet?.dockType ? titleCase(outlet.dockType) : '—'}
                    {outlet?.accessNote || outlet?.parking ? (
                      <View>
                        <Text style={s.t19}>{outlet.accessNote ?? outlet.parking}</Text>
                      </View>
                    ) : null}</Text>
                </View>
              </View>
              <View style={s.v22}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"Delivery window"}</Text>
                </View>
                <View style={s.v14}>
                  <Text style={s.t20}>{outlet ? `${outlet.windowOpen}–${outlet.windowClose}` : '—'}</Text>
                </View>
              </View>
              <View style={s.v22}>
                <View style={s.v18}>
                  <Text style={s.t17}>{"This phone"}</Text>
                </View>
                <View style={s.v14}>
                  <Text style={s.t20} testID="device-id">{device ?? '…'}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={s.v24}>
            <View style={s.v16}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Receiving"}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t15}>{"shown to the driver"}</Text>
              </View>
            </View>
            <View style={s.v23}>
              <View style={s.v30}>
                <View style={s.v25}>
                  <Icon xml={X1} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"At the door from"}</Text>
                  </View>
                </View>
                <View style={s.v29}>
                  <Text style={s.t28} numberOfLines={1}>{outlet?.windowOpen ?? '—'}</Text>
                </View>
              </View>
              <View style={s.v33}>
                <View style={s.v25}>
                  <Icon xml={X2} width={22} height={22} style={s.v1} />
                </View>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"Receiving staff"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{'—'}</Text>
                  </View>
                </View>
                <Icon xml={X3} width={18} height={18} style={s.v1} />
              </View>
            </View>
          </View>
          <View style={s.v24}>
            <View style={s.v16}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Notifications"}</Text>
              </View>
              <View style={s.v14} />
            </View>
            <View style={s.v23}>
              <View style={s.v30}>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"Arrival window"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{"by 7 PM the evening before"}</Text>
                  </View>
                </View>
                <View style={s.v35}>
                  <View style={s.v34} />
                </View>
              </View>
              <View style={s.v33}>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"Van on the way"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{"live updates from departure"}</Text>
                  </View>
                </View>
                <View style={s.v35}>
                  <View style={s.v34} />
                </View>
              </View>
              <View style={s.v33}>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"Short or moved orders"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{"always on"}</Text>
                  </View>
                </View>
                <View style={s.v36}>
                  <View style={s.v34} />
                </View>
              </View>
              <View style={s.v33}>
                <View style={s.v27}>
                  <View>
                    <Text style={s.t26}>{"Cutoff reminder"}</Text>
                  </View>
                  <View style={s.v32}>
                    <Text style={s.t31}>{"3:00 PM if you haven't ordered"}</Text>
                  </View>
                </View>
                <View style={s.v37}>
                  <View style={s.v34} />
                </View>
              </View>
            </View>
          </View>
          <View style={s.v24}>
            <View style={s.v16}>
              <View style={s.v14}>
                <Text style={s.t13}>{"Language"}</Text>
              </View>
              <View style={s.v14}>
                <Text style={s.t38}>{"Voice & read aloud ›"}</Text>
              </View>
            </View>
            <View style={s.v45}>
              <View style={s.v39}>
                <Text style={s.t28}>{"English"}</Text>
              </View>
              <View style={s.v42}>
                <Text style={s.t41}><Text style={s.t40}>{"සිංහල"}</Text></Text>
              </View>
              <View style={s.v42}>
                <Text style={s.t44}><Text style={s.t43}>{"தமிழ்"}</Text></Text>
              </View>
            </View>
          </View>
          <Tap lk="L104" style={s.v48} onPress={() => signOutTo('sm-05-sign-in')}>
            <View style={s.v30}>
              <View style={s.v46}>
                <Icon xml={X4} width={22} height={22} style={s.v1} />
              </View>
              <View style={s.v27}>
                <View>
                  <Text style={s.t26}><Text style={s.t47}>{"Sign out"}</Text></Text>
                </View>
              </View>
            </View>
          </Tap>
        </Scroll>
      </View>
    </Frame>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 12H5M12 19l-7-7 7-7\" fill=\"none\" stroke=\"#101828\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"9\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4\" fill=\"none\" stroke=\"#3b4cca\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"18\" height=\"18\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9 18 6-6-6-6\" fill=\"none\" stroke=\"#636c80\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"22\" height=\"22\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\" fill=\"none\" stroke=\"#b42318\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v0: {"flexDirection":"column","alignItems":"stretch","backgroundColor":"#ffffff","flex":1},
  v1: {"flexShrink":0,"overflow":"hidden"},
  v2: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":40,"height":40,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(0, 0, 0, 0.06) 0px 1px 2px 0px"},
  t3: {"color":"#101828","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_700Bold"},
  v4: {"flexDirection":"column","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v5: {"flexShrink":0,"width":40},
  v6: {"flexDirection":"row","alignItems":"center","rowGap":10,"columnGap":10,"flexShrink":0,"paddingRight":16,"paddingLeft":16,"height":52},
  t7: {"color":"#1a1300","fontSize":22,"lineHeight":33,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  v8: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":60,"height":60,"backgroundColor":"#f5b83d","borderRadius":20},
  t9: {"color":"#101828","fontSize":22,"lineHeight":33,"letterSpacing":-0.4,"fontFamily":"PlusJakartaSans_800ExtraBold"},
  t10: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"Inter_400Regular"},
  v11: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v12: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"flexShrink":0,"paddingTop":18,"paddingRight":18,"marginRight":16,"paddingBottom":18,"paddingLeft":18,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":24,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px, rgba(15, 20, 50, 0.06) 0px 8px 24px 0px"},
  t13: {"color":"#101828","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v14: {"flexShrink":1},
  t15: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v16: {"flexDirection":"row","justifyContent":"space-between","alignItems":"baseline","paddingRight":20,"paddingLeft":20},
  t17: {"color":"#475467","fontSize":15,"lineHeight":22.5,"fontFamily":"Inter_400Regular"},
  v18: {"flexShrink":0},
  t19: {"color":"#636c80","fontSize":13,"lineHeight":19.5,"textAlign":"right","fontFamily":"Inter_500Medium"},
  t20: {"color":"#101828","fontSize":15,"lineHeight":22.5,"textAlign":"right","fontFamily":"Inter_700Bold"},
  v21: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":50},
  v22: {"flexDirection":"row","justifyContent":"space-between","alignItems":"center","rowGap":12,"columnGap":12,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":50,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v23: {"flexDirection":"column","alignItems":"stretch","flexShrink":1,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v24: {"flexDirection":"column","alignItems":"stretch","rowGap":8,"columnGap":8,"flexShrink":0},
  v25: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#eef0ff","borderRadius":14},
  t26: {"color":"#101828","fontSize":16,"lineHeight":20.8,"fontFamily":"Inter_700Bold"},
  v27: {"flexDirection":"column","alignItems":"stretch","rowGap":3,"columnGap":3,"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  t28: {"color":"#101828","fontSize":14,"lineHeight":21,"fontFamily":"Inter_700Bold"},
  v29: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":0,"paddingRight":12,"paddingLeft":12,"height":32,"backgroundColor":"#eff1f7","borderRadius":10},
  v30: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56},
  t31: {"color":"#475467","fontSize":13,"lineHeight":18.2,"fontFamily":"Inter_500Medium"},
  v32: {"flexDirection":"row","flexWrap":"wrap","alignItems":"center","rowGap":6,"columnGap":6},
  v33: {"flexDirection":"row","alignItems":"center","rowGap":14,"columnGap":14,"paddingTop":10,"paddingRight":16,"paddingBottom":10,"paddingLeft":16,"minHeight":56,"borderTopWidth":1,"borderTopColor":"#eceef3"},
  v34: {"flexShrink":1,"width":22,"height":22,"backgroundColor":"#ffffff","borderRadius":11,"boxShadow":"rgba(0, 0, 0, 0.2) 0px 1px 3px 0px"},
  v35: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":48,"height":28,"backgroundColor":"#3b4cca","borderRadius":14},
  v36: {"flexDirection":"row","justifyContent":"flex-end","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":48,"height":28,"backgroundColor":"#3b4cca","borderRadius":14,"opacity":0.5},
  v37: {"flexDirection":"row","alignItems":"center","flexShrink":0,"paddingTop":3,"paddingRight":3,"paddingBottom":3,"paddingLeft":3,"width":48,"height":28,"backgroundColor":"#d3d8e3","borderRadius":14},
  t38: {"color":"#3b4cca","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v39: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"backgroundColor":"#ffffff","borderRadius":10,"boxShadow":"rgba(0, 0, 0, 0.08) 0px 1px 3px 0px"},
  t40: {"fontFamily":"NotoSansSinhala_700Bold"},
  t41: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"NotoSansSinhala_700Bold"},
  v42: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexGrow":1,"flexShrink":1,"flexBasis":"0%","height":36,"borderRadius":10},
  t43: {"fontFamily":"NotoSansTamil_700Bold"},
  t44: {"color":"#475467","fontSize":14,"lineHeight":21,"fontFamily":"NotoSansTamil_700Bold"},
  v45: {"flexDirection":"row","alignItems":"stretch","rowGap":4,"columnGap":4,"paddingTop":4,"paddingRight":4,"marginRight":16,"paddingBottom":4,"paddingLeft":4,"marginLeft":16,"backgroundColor":"#eff1f7","borderRadius":14},
  v46: {"flexDirection":"row","justifyContent":"center","alignItems":"center","flexShrink":0,"width":44,"height":44,"backgroundColor":"#feeeec","borderRadius":14},
  t47: {"color":"#b42318"},
  v48: {"flexDirection":"column","alignItems":"stretch","flexShrink":0,"marginRight":16,"marginLeft":16,"backgroundColor":"#ffffff","borderRadius":20,"boxShadow":"rgba(15, 20, 50, 0.04) 0px 1px 2px 0px","overflow":"hidden"},
  v49: {"flexGrow":1,"flexShrink":1,"flexBasis":"0%"},
  v50: {"flexDirection":"column","alignItems":"stretch","rowGap":16,"columnGap":16,"paddingTop":4,"paddingBottom":16},
  v51: {"flexDirection":"column","alignItems":"stretch","flexGrow":1,"flexShrink":1,"flexBasis":"0%","backgroundColor":"#f4f5f9"},
});
