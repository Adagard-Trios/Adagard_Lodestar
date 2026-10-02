// Registers the service worker of the web export (scripts/sw.js, written by scripts/build-sw.js), so the field
// app opens with no signal. Web production builds only: the dev server has no sw.js, and phones do not need one.
import { Platform } from 'react-native';
import { basePath } from '@/lib/config';

type Container = Pick<ServiceWorkerContainer, 'register'>;

export async function registerServiceWorker(
  container: Container | undefined = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  base: string = basePath(),
  enabled: boolean = Platform.OS === 'web' && process.env.NODE_ENV === 'production',
): Promise<ServiceWorkerRegistration | null> {
  if (!enabled || !container) return null;
  try {
    return await container.register(`${base}/sw.js`, { scope: `${base}/` });
  } catch {
    // not a secure context, or storage blocked: the app still works online
    return null;
  }
}
