import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { FACES, FLOWS } from '@/screens/registry';

// One build carries the four field faces for the demo; each opens at its own splash screen.
const COLOR: Record<string, string> = { store: '#047857', plan: '#3B4CCA', dock: '#6D28D9', run: '#0369A1' };
const open = (key: string) => router.push({ pathname: '/s/[key]', params: { key } });

export default function Home() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View style={{ gap: 4, marginBottom: 6 }}>
          <Text style={{ color: '#8F98AA', fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Waypoint Group</Text>
          <Text style={{ color: '#FFFFFF', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, letterSpacing: -0.9 }}>Waypoint Lodestar</Text>
          <Text style={{ color: '#B5BDD1', fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 }}>Every order, one thread. Choose the app to open.</Text>
        </View>

        {FACES.map(face => (
          <View key={face.title} style={{ borderRadius: 18, backgroundColor: '#141B2E', borderWidth: 1, borderColor: '#28314A', overflow: 'hidden' }}>
            <Pressable onPress={() => open(face.start)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, opacity: pressed ? 0.8 : 1 })}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLOR[face.app] ?? '#334155' }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: '#F2F4FA', fontFamily: 'Inter_700Bold', fontSize: 17 }}>{face.title}</Text>
                <Text style={{ color: '#7F89A3', fontFamily: 'Inter_500Medium', fontSize: 13 }}>{face.screens.length} screens · {face.device}</Text>
              </View>
              <Text style={{ color: '#F5B83D', fontFamily: 'Inter_700Bold', fontSize: 14 }}>Open</Text>
            </Pressable>
            <Pressable onPress={() => setExpanded(expanded === face.title ? null : face.title)} style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <Text style={{ color: '#8C98F2', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{expanded === face.title ? 'Hide screens' : 'All screens'}</Text>
            </Pressable>
            {expanded === face.title && face.screens.map(s => (
              <Pressable key={s.key} onPress={() => open(s.key)} style={({ pressed }) => ({ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#1F2740', backgroundColor: pressed ? '#1A2340' : 'transparent' })}>
                <Text style={{ color: '#7F89A3', fontFamily: 'JetBrainsMono_700Bold', fontSize: 12, width: 64 }}>{s.id}</Text>
                <Text style={{ color: '#DCE4F5', fontFamily: 'Inter_500Medium', fontSize: 14, flex: 1 }}>{s.name.replace(/^\S+\s/, '')}</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <Text style={{ color: '#8F98AA', fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginTop: 10 }}>Demo flows</Text>
        {FLOWS.map(f => (
          <Pressable key={f.name} onPress={() => open(f.key)} style={({ pressed }) => ({ padding: 14, borderRadius: 14, backgroundColor: pressed ? '#232C50' : '#1A2340' })}>
            <Text style={{ color: '#F2F4FA', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>{f.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
