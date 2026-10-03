/**
 * Small, invented reference data for the integration tests (no dataset values):
 * two Kandy outlets and one Peliyagoda outlet, a vehicle per outlet, one user
 * per role and an ACTIVE field device for each driver.
 */
import { PrismaClient } from '@prisma/client';
import { runDateValue } from '@lodestar/platform';
import { FIELD_CLIENT, TokenClaims } from './harness';

export const OUT = { K1: 'IT-OUT-K1', K2: 'IT-OUT-K2', P1: 'IT-OUT-P1' } as const;
export const VEH = { K1: 'IT-VEH-K1', K2: 'IT-VEH-K2', P1: 'IT-VEH-P1' } as const;
export const DEV = { K1: 'IT-DEV-DRV-K1', K2: 'IT-DEV-DRV-K2' } as const;

export const USERS = {
  dispatcherKandy: 'it-dispatcher-kandy',
  dispatcherPeliyagoda: 'it-dispatcher-peliyagoda',
  loaderKandy: 'it-loader-kandy',
  driverK1: 'it-driver-k1',
  driverK2: 'it-driver-k2',
  storeK1: 'it-store-k1',
  storeK2: 'it-store-k2',
} as const;

/** Token claims of each persona (what Keycloak would mint from the user's attributes). */
export const CLAIMS: Record<string, TokenClaims> = {
  dispatcherKandy: { sub: USERS.dispatcherKandy, roles: ['dispatcher'], depot: 'KANDY' },
  dispatcherPeliyagoda: { sub: USERS.dispatcherPeliyagoda, roles: ['dispatcher'], depot: 'PELIYAGODA' },
  loaderKandy: { sub: USERS.loaderKandy, roles: ['loader'], depot: 'KANDY' },
  driverK1: { sub: USERS.driverK1, roles: ['driver'], vehicle_id: VEH.K1, device_id: DEV.K1, azp: FIELD_CLIENT },
  driverK2: { sub: USERS.driverK2, roles: ['driver'], vehicle_id: VEH.K2, device_id: DEV.K2, azp: FIELD_CLIENT },
  storeK1: { sub: USERS.storeK1, roles: ['store_manager'], outlet_id: OUT.K1 },
  storeK2: { sub: USERS.storeK2, roles: ['store_manager'], outlet_id: OUT.K2 },
};

export async function seedReference(prisma: PrismaClient): Promise<void> {
  // outlets reference the depot registry (Outlet_depot_fkey); a reset database has none
  await prisma.depot.createMany({
    data: [
      { code: 'PELIYAGODA', name: 'Peliyagoda DC', district: 'Gampaha' },
      { code: 'KANDY', name: 'Kandy Hub', district: 'Kandy' },
    ],
    skipDuplicates: true,
  });
  const outlet =(id: string, depot: 'KANDY' | 'PELIYAGODA', district: string) => ({
    id, name: `Integration outlet ${id}`, brand: 'FRESH' as const, district, depot,
    dockType: 'REAR_DOCK' as const, parking: 'NORMAL' as const, windowOpen: '05:00', windowClose: '09:00',
  });
  await prisma.outlet.createMany({ data: [outlet(OUT.K1, 'KANDY', 'Kandy'), outlet(OUT.K2, 'KANDY', 'Kandy'), outlet(OUT.P1, 'PELIYAGODA', 'Colombo')] });

  const vehicle = (id: string, depot: 'KANDY' | 'PELIYAGODA') => ({
    id, depot, type: 'TRUCK' as const, tempClass: 'CHILLED' as const, capacityKg: 3000, capacityM3: 20, kmPerLitre: 6, weeklyLFuel: 400,
  });
  await prisma.vehicle.createMany({ data: [vehicle(VEH.K1, 'KANDY'), vehicle(VEH.K2, 'KANDY'), vehicle(VEH.P1, 'PELIYAGODA')] });

  const user = (id: string, role: any, extra: Record<string, unknown> = {}) => ({ id, email: `${id}@lodestar.test`, name: id, role, ...extra });
  await prisma.user.createMany({
    data: [
      user(USERS.dispatcherKandy, 'DISPATCHER', { depot: 'KANDY' }),
      user(USERS.dispatcherPeliyagoda, 'DISPATCHER', { depot: 'PELIYAGODA' }),
      user(USERS.loaderKandy, 'LOADER', { depot: 'KANDY' }),
      user(USERS.driverK1, 'DRIVER', { depot: 'KANDY', vehicleId: VEH.K1 }),
      user(USERS.driverK2, 'DRIVER', { depot: 'KANDY', vehicleId: VEH.K2 }),
      user(USERS.storeK1, 'STORE_MANAGER', { outletId: OUT.K1 }),
      user(USERS.storeK2, 'STORE_MANAGER', { outletId: OUT.K2 }),
    ],
  });
  await prisma.device.createMany({
    data: [
      { id: DEV.K1, userId: USERS.driverK1, status: 'ACTIVE', platform: 'android' },
      { id: DEV.K2, userId: USERS.driverK2, status: 'ACTIVE', platform: 'android' },
    ],
  });
}

export async function createOrder(
  prisma: PrismaClient,
  id: string,
  outletId: string,
  runDate: string,
  extra: Record<string, unknown> = {},
) {
  return prisma.order.create({
    data: {
      id, outletId, runDate: runDateValue(runDate), orderedAt: new Date(`${runDate}T00:00:00Z`),
      brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 50, m3: 1.5, daysSince: 1, ...extra,
    } as any,
  });
}
