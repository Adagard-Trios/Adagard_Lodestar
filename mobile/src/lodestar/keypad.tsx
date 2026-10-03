// The numeric keypad the sign-in designs draw under the form (SM-05/06, DR-06/07, LD-06): rendered with the
// screen's own generated styles and made to type. On the web build a hardware keyboard types too (digits,
// Backspace, Enter), so the screens work the same in a desktop browser.
import { useEffect, useRef } from 'react';
import { Platform, Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Icon } from './runtime';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'back' | 'clear' | 'enter';

export function Keypad({
  onKey,
  wrap,
  row,
  keyStyle,
  blank,
  text,
  back,
  clear,
}: {
  onKey: (k: KeypadKey) => void;
  wrap: StyleProp<ViewStyle>;
  row: StyleProp<ViewStyle>;
  keyStyle: StyleProp<ViewStyle>;
  /** The empty/backspace cell style. */
  blank: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  back: { xml: string; size: number; style?: StyleProp<ViewStyle> };
  /** LD-06 draws "Clear" bottom left. */
  clear?: { label: string; style: StyleProp<TextStyle> };
}) {
  const cb = useRef(onKey);
  useEffect(() => {
    cb.current = onKey;
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (/^[0-9]$/.test(e.key)) cb.current(e.key as KeypadKey);
      else if (e.key === 'Backspace') cb.current('back');
      else if (e.key === 'Enter') cb.current('enter');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const digit = (d: KeypadKey) => (
    <Pressable key={d} testID={`key-${d}`} accessibilityRole="button" accessibilityLabel={d} style={({ pressed }) => [keyStyle as ViewStyle, pressed && { opacity: 0.6 }]} onPress={() => onKey(d)}>
      <Text style={text}>{d}</Text>
    </Pressable>
  );
  return (
    <View style={wrap}>
      <View style={row}>{(['1', '2', '3'] as const).map(digit)}</View>
      <View style={row}>{(['4', '5', '6'] as const).map(digit)}</View>
      <View style={row}>{(['7', '8', '9'] as const).map(digit)}</View>
      <View style={row}>
        {clear ? (
          <Pressable testID="key-clear" accessibilityRole="button" accessibilityLabel={clear.label} style={blank} onPress={() => onKey('clear')}>
            <Text style={clear.style}>{clear.label}</Text>
          </Pressable>
        ) : (
          <View style={blank} />
        )}
        {digit('0')}
        <Pressable testID="key-back" accessibilityRole="button" accessibilityLabel="Delete" style={blank} onPress={() => onKey('back')}>
          <Icon xml={back.xml} width={back.size} height={back.size} style={back.style} />
        </Pressable>
      </View>
    </View>
  );
}

/** Applies a key to a digits value of at most `max` digits. */
export function typeKey(value: string, k: KeypadKey, max: number): string {
  if (k === 'back') return value.slice(0, -1);
  if (k === 'clear') return '';
  if (k === 'enter') return value;
  return value.length >= max ? value : value + k;
}
