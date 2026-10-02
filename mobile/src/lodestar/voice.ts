// Read aloud in the app language (expo-speech, on-device voices; no network). The "voice pack" screens
// check which voices the phone has: a missing Sinhala or Tamil voice means text still works, speech falls
// back to the closest voice the phone has.
import { useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { settings, type AppLanguage } from '@/lib/settings';

export const SPEECH_LANGUAGE: Record<AppLanguage, string> = { en: 'en-GB', si: 'si-LK', ta: 'ta-IN' };

/** Speaks `text` in `lang` (default: the app language). Resolves when done, stopped or failed. */
export function speakIn(text: string, lang: AppLanguage = settings.get().language, opts: { onDone?: () => void } = {}): void {
  void Speech.stop();
  Speech.speak(text, {
    language: SPEECH_LANGUAGE[lang],
    rate: 0.95,
    onDone: opts.onDone,
    onStopped: opts.onDone,
    onError: opts.onDone,
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
}

export type VoiceCheck = { checking: boolean; available: boolean; voiceName?: string; count: number };

/** Whether the phone has a voice for `lang` (Speech.getAvailableVoicesAsync). */
export async function voiceFor(lang: AppLanguage): Promise<VoiceCheck> {
  try {
    const voices = (await Speech.getAvailableVoicesAsync?.()) ?? [];
    const prefix = lang.toLowerCase();
    const v = voices.find(x => (x.language ?? '').toLowerCase().replace('_', '-').startsWith(prefix));
    return { checking: false, available: !!v, voiceName: v?.name, count: voices.length };
  } catch {
    return { checking: false, available: false, count: 0 };
  }
}

export function useVoiceCheck(lang: AppLanguage): VoiceCheck {
  const [result, setResult] = useState<{ lang: AppLanguage; check: VoiceCheck } | null>(null);
  useEffect(() => {
    let live = true;
    void voiceFor(lang).then(check => live && setResult({ lang, check }));
    return () => {
      live = false;
    };
  }, [lang]);
  return result && result.lang === lang ? result.check : { checking: true, available: false, count: 0 };
}

/** True while speaking (polled; expo-speech has no speaking event on every platform). */
export function useSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      Speech.isSpeakingAsync?.()
        .then(setSpeaking)
        .catch(() => undefined);
    }, 500);
    return () => clearInterval(t);
  }, []);
  return speaking;
}
