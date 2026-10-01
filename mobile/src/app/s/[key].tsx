import { Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { SCREENS } from '@/screens/registry';

// Any Lodestar screen by its key, e.g. /s/dr-02-stop-arrival
export default function ScreenRoute() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const load = key ? SCREENS[key] : undefined;
  if (!load) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0B1020' }}>
        <Text style={{ color: '#F2F4FA', fontFamily: 'Inter_700Bold', fontSize: 18 }}>Screen not found</Text>
        <Link href="/" style={{ color: '#F5B83D', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Back to Lodestar</Link>
      </View>
    );
  }
  const Screen = load();
  return <Screen />;
}

// Static web export: pre-render every screen route.
export async function generateStaticParams(): Promise<{ key: string }[]> {
  return Object.keys(SCREENS).map(key => ({ key }));
}
