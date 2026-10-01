// Shared labels for the Lodestar Admin screens.
import type { IconName } from './icons';
import type { UserRole } from '@/lib/odata/types';

export const ROLE_INFO: Record<UserRole, { label: string; face: string; icon: IconName }> = {
  DISPATCHER: { label: 'Dispatcher', face: 'Lodestar Plan', icon: 'grid' },
  LOADER: { label: 'Loader', face: 'Lodestar Dock', icon: 'box' },
  DRIVER: { label: 'Driver', face: 'Lodestar Run', icon: 'van' },
  STORE_MANAGER: { label: 'Store manager', face: 'Lodestar Store', icon: 'store' },
  ADMIN: { label: 'Admin', face: 'Lodestar Admin', icon: 'shield' },
};

export const ROLES = Object.keys(ROLE_INFO) as UserRole[];

/** Short display of a hash: 9f3c…a1 */
export const shortHash = (h: string) => (h && h.length > 8 ? `${h.slice(0, 4)}…${h.slice(-2)}` : h);
