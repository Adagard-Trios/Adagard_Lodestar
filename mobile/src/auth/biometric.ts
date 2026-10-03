// Fingerprint / face unlock (DSP-26) through expo-local-authentication. The web build has no sensor: the
// screens show the design's fallback ("Use work password").
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

/** True when this phone has a sensor with a fingerprint or face enrolled. */
export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export type UnlockResult = { ok: true } | { ok: false; message: string };

/** Asks the OS for the fingerprint (or the phone's own PIN as its fallback). */
export async function unlockWithBiometrics(prompt = 'Unlock Lodestar Plan'): Promise<UnlockResult> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: 'Use work password', disableDeviceFallback: false });
    if (r.success) return { ok: true };
    return { ok: false, message: r.error === 'user_cancel' || r.error === 'system_cancel' ? 'Unlock cancelled.' : 'Fingerprint not recognised. Try again or use your work password.' };
  } catch {
    return { ok: false, message: 'Fingerprint unlock is not available on this phone.' };
  }
}
