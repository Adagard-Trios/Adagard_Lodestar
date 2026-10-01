// Keycloak returns here after sign-in. On the web this page runs in the sign-in popup and hands the
// result back to the app window; on a phone the deep link lodestar://auth/callback lands here briefly.
import { useEffect } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useStore } from '@/lib/store';
import { goHome } from '@/auth/use-sign-in';
import { session } from '@/model/platform';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const s = useStore(session.state);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (s.status === 'signed-in' && s.claims) {
      goHome(s.claims, width);
      return;
    }
    // not completed by this window (the app window finishes the exchange): go back to the start
    const t = setTimeout(() => {
      if (typeof window !== 'undefined' && window.opener) return;
      router.replace('/');
    }, 4000);
    return () => clearTimeout(t);
  }, [s.status, s.claims, width]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#0B1020' }}>
      <ActivityIndicator color="#F5B83D" />
      <Text style={{ color: '#F2F4FA', fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Signing you in…</Text>
    </View>
  );
}
