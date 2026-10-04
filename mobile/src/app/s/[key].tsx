import { createElement, type ComponentType, type ReactNode } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { FACES, SCREENS } from '@/screens/registry';
import { themedKey, useSettings } from '@/lib/settings';

// Screens are loaded once and kept, so a screen's component identity is stable across renders.
const loaded = new Map<string, ComponentType>();
function screenFor(key: string): ComponentType | undefined {
  const load = SCREENS[key];
  if (!load) return undefined;
  if (!loaded.has(key)) loaded.set(key, load());
  return loaded.get(key);
}

// A browser window at tablet/desktop width shows a phone screen as a phone-sized card centred on the desk background
// (as the field sign-in screens do, lodestar/desk-auth.tsx). Tablet screens fill the window; the sign-in family draws
// its own desk layout.
const TABLET = new Set(FACES.filter(f => f.device === 'tablet').flatMap(f => f.screens.map(s => s.key)));
const OWN_DESK_LAYOUT = /sign-in|verify-code/;
function PhoneColumn({ screen, children }: { screen: string; children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 768 || TABLET.has(screen) || OWN_DESK_LAYOUT.test(screen)) return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F4F5F9' }}>
      <View
        testID="phone-column"
        style={{
          width: 420, maxWidth: '100%', height: Math.min(880, height - 48), borderRadius: 28, overflow: 'hidden',
          backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px rgba(15,20,50,.04), 0 16px 48px rgba(15,20,50,.08)',
        }}
      >
        {children}
      </View>
    </View>
  );
}

// Any Lodestar screen by its key, e.g. /s/dr-02-stop-arrival (live screens read extra params, e.g. ?stop=…)
export default function ScreenRoute() {
  const { key: asked } = useLocalSearchParams<{ key: string }>();
  // Night or day screen (DR-24): the driver's run, route and summary have designed daylight variants.
  const { theme } = useSettings();
  const key = asked ? themedKey(asked, theme) : asked;
  const screen = key ? screenFor(key) : undefined;
  if (!screen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0B1020' }}>
        <Text style={{ color: '#F2F4FA', fontFamily: 'Inter_700Bold', fontSize: 18 }}>Screen not found</Text>
        <Link href="/" style={{ color: '#F5B83D', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Back to Lodestar</Link>
      </View>
    );
  }
  return <PhoneColumn screen={key!}>{createElement(screen)}</PhoneColumn>;
}

// Static web export: pre-render every screen route.
export async function generateStaticParams(): Promise<{ key: string }[]> {
  return Object.keys(SCREENS).map(key => ({ key }));
}
