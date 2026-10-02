import { createElement, type ComponentType } from 'react';
import { Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { SCREENS } from '@/screens/registry';
import { themedKey, useSettings } from '@/lib/settings';

// Screens are loaded once and kept, so a screen's component identity is stable across renders.
const loaded = new Map<string, ComponentType>();
function screenFor(key: string): ComponentType | undefined {
  const load = SCREENS[key];
  if (!load) return undefined;
  if (!loaded.has(key)) loaded.set(key, load());
  return loaded.get(key);
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
  return createElement(screen);
}

// Static web export: pre-render every screen route.
export async function generateStaticParams(): Promise<{ key: string }[]> {
  return Object.keys(SCREENS).map(key => ({ key }));
}
