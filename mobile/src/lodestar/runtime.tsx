// Runtime for the generated Lodestar screens (src/screens). Each screen is laid out natively from the
// design; this file makes it behave: taps navigate exactly like the Figma prototype, back arrows go back,
// some screens advance by themselves, and "Read aloud" speaks on the device (no network needed).
import { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';

export type Target = { to?: string; kind?: 'go' | 'nav' | 'back'; app?: string; screen?: string };
export type ScreenNav = { links: Record<string, Target>; auto?: Target; whole?: Target; parent?: string };

const NavContext = createContext<{ nav: ScreenNav; notify: (t: Target) => void }>({ nav: { links: {} }, notify: () => {} });

function go(t: Target | undefined, notify: (t: Target) => void) {
  if (!t) return;
  if (t.app) { notify(t); return; }
  if (!t.to) return;
  const href = { pathname: '/s/[key]' as const, params: { key: t.to } };
  if (t.kind === 'back') { if (router.canGoBack()) router.back(); else router.replace(href); }
  else if (t.kind === 'nav') router.replace(href);
  else router.push(href);
}

// Sinhala and Tamil text is spoken with the matching on-device voice.
export function speak(text: string) {
  const language = /[඀-෿]/.test(text) ? 'si-LK' : /[஀-௿]/.test(text) ? 'ta-IN' : 'en-GB';
  Speech.stop();
  Speech.speak(text, { language, rate: 0.95 });
}

const isLight = (c: string) => {
  const m = c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return true;
  const [r, g, b] = m.slice(1).map(h => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};

export function Frame({ bg, nav, children, style }: { bg: string; nav: ScreenNav; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [toast, setToast] = useState<Target | null>(null);
  const ctx = useMemo(() => ({ nav, notify: setToast }), [nav]);
  useEffect(() => {
    if (!nav.auto) return;
    const t = setTimeout(() => go(nav.auto, setToast), 1500);
    return () => clearTimeout(t);
  }, [nav.auto]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => () => { Speech.stop(); }, []);

  const body = <View style={style}>{children}</View>;
  return (
    <NavContext.Provider value={ctx}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar style={isLight(bg) ? 'dark' : 'light'} />
        {nav.whole ? (
          <Pressable style={{ flex: 1 }} onPress={() => go(nav.whole, setToast)}>{body}</Pressable>
        ) : body}
        {toast && (
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 32, alignItems: 'center', pointerEvents: 'box-none' }}>
            <Pressable onPress={() => setToast(null)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#141B4D', boxShadow: '0 12px 32px rgba(10,15,40,0.28)' }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 }}>
                Continues in <Text style={{ color: '#F5B83D', fontFamily: 'Inter_700Bold' }}>{toast.app}</Text>: {toast.screen}
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </NavContext.Provider>
  );
}

// A tappable box. `lk` is the link code the generator put on it; `say` is text to read aloud.
// `group` marks a tappable card that holds other buttons (on the web a button can't contain a button).
export function Tap({ lk, say, group, style, children }: { lk?: string; say?: string; group?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { nav, notify } = useContext(NavContext);
  const target = lk ? nav.links[lk] : undefined;
  return (
    <Pressable
      accessibilityRole={group ? undefined : 'button'}
      testID={lk ? 'lk-' + lk : say ? 'say' : undefined}
      onPress={() => { if (say) speak(say); go(target, notify); }}
      style={({ pressed }) => [style as ViewStyle, pressed && { opacity: 0.72 }]}
    >
      {children}
    </Pressable>
  );
}

// A tappable run of text inside a paragraph.
export function TapText({ lk, style, children }: { lk: string; style?: StyleProp<TextStyle>; children?: ReactNode }) {
  const { nav, notify } = useContext(NavContext);
  return <Text style={style} testID={'lk-' + lk} onPress={() => go(nav.links[lk], notify)} suppressHighlighting>{children}</Text>;
}

// The screen's scrolling body: top bar, action bar and tab bar stay fixed around it.
export function Scroll({ style, contentStyle, children }: { style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <ScrollView style={style} contentContainerStyle={[{ flexGrow: 1 }, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export function Icon({ xml, width, height, style }: { xml: string; width: number; height: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[style, { pointerEvents: 'none' }]}>
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
}

// CSS gradients, drawn with SVG so they look the same on iOS, Android and the web preview.
// Layers are listed top-first, like CSS background-image.
export type GradStop = { c: string; p: number | null; px?: number };
export type GradSpec = { type: 'linear' | 'radial'; angle: number; at: [number, number] | null; repeat?: boolean; stops: GradStop[] };

export function Grad({ g, style }: { g: GradSpec[]; style?: StyleProp<ViewStyle> }) {
  const id = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const stops = (x: GradSpec) => x.stops.map((st, i) => (
    <Stop key={i} offset={String(st.p ?? (x.stops.length === 1 ? 0 : i / (x.stops.length - 1)))} stopColor={st.c} />
  ));
  return (
    <View style={[StyleSheet.absoluteFill, style, { overflow: 'hidden', pointerEvents: 'none' }]}>
      <Svg width="100%" height="100%">
        <Defs>
          {g.map((x, i) => {
            if (x.type === 'radial') {
              const [cx, cy] = x.at ?? [0.5, 0.5];
              return <RadialGradient key={i} id={id + i} cx={cx} cy={cy} r={0.71} fx={cx} fy={cy}>{stops(x)}</RadialGradient>;
            }
            const a = (x.angle * Math.PI) / 180, dx = Math.sin(a) / 2, dy = -Math.cos(a) / 2;
            return <LinearGradient key={i} id={id + i} x1={0.5 - dx} y1={0.5 - dy} x2={0.5 + dx} y2={0.5 + dy}>{stops(x)}</LinearGradient>;
          })}
        </Defs>
        {g.map((_, i) => g.length - 1 - i).map(i => <Rect key={i} x={0} y={0} width="100%" height="100%" fill={`url(#${id + i})`} />)}
      </Svg>
    </View>
  );
}
