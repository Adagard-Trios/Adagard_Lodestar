// "Allow notifications" (SM-10, DR-08): the browser's Notification permission on the web build,
// expo-notifications on phones. Realtime notices arrive over the app's WebSocket either way; this only
// lets the OS show them.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type NotifyPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function notificationPermission(): Promise<NotifyPermission> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
      const p = window.Notification.permission;
      return p === 'default' ? 'undetermined' : p;
    }
    const r = await Notifications.getPermissionsAsync();
    return r.granted ? 'granted' : r.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unsupported';
  }
}

/** Asks the OS / browser. Resolves to the outcome (never throws). */
export async function requestNotifications(): Promise<NotifyPermission> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
      const p = await window.Notification.requestPermission();
      return p === 'default' ? 'undetermined' : p;
    }
    const r = await Notifications.requestPermissionsAsync();
    return r.granted ? 'granted' : r.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unsupported';
  }
}
