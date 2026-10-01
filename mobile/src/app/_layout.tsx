import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FONTS } from '@/lodestar/fonts';
import { AccessGuard } from '@/auth/access-guard';
import { startPlatform } from '@/model/platform';
import { startRealtime } from '@/realtime/notices';

SplashScreen.preventAutoHideAsync();
// Web: when this page is the Keycloak sign-in popup coming back, hand the result to the app window.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [loaded, error] = useFonts(FONTS);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Session restore, network watch, outbox sync and realtime notices (client side only).
  useEffect(() => {
    const stopPlatform = startPlatform();
    const stopRealtime = startRealtime();
    return () => {
      stopRealtime();
      stopPlatform();
    };
  }, []);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#0B1020' } }} />
      <AccessGuard />
    </SafeAreaProvider>
  );
}
