// Daylight screens are their night screen in other colours: a day theme is derived from the night one by
// recolouring its icons and overriding only the style values that differ.
import type { TextStyle, ViewStyle } from 'react-native';

/** The SVG markup with every occurrence of the colour `from` replaced by `to`. */
export function recolor(svg: string, from: string, to: string): string {
  return svg.split(from).join(to);
}

type Styles = Record<string, ViewStyle | TextStyle | undefined>;

/** A copy of the style sheet `base` with the properties in `patch` overriding those of the same style. */
export function restyle<T extends Styles>(base: T, patch: { [K in keyof T]?: Partial<NonNullable<T[K]>> }): T {
  const out: Styles = { ...base };
  for (const [key, over] of Object.entries(patch)) out[key] = { ...base[key], ...over };
  return out as T;
}
