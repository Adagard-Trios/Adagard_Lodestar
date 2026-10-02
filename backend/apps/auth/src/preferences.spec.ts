import { instance, mock, when } from 'ts-mockito';
import { DevicePostureService } from '@lodestar/security';
import { personas } from '../../../libs/security/test/principals';
import { AuthService } from './auth.service';
import { KeycloakAdminClient } from './keycloak-admin.client';
import { mergePreferences, validatePreferences } from './preferences';

describe('preferences (DSP-20, DSP-33, SM-30)', () => {
  it('accepts known sections of plain JSON and rejects anything else', () => {
    expect(validatePreferences({ alerts: { lateRisk: { push: true, threshold: 30 } }, language: 'si' })).toEqual({
      alerts: { lateRisk: { push: true, threshold: 30 } },
      language: 'si',
    });
    expect(() => validatePreferences({ role: 'ADMIN' })).toThrow(/Unknown preference section/);
    expect(() => validatePreferences([])).toThrow(/must be an object/);
    expect(() => validatePreferences({ board: { a: { b: { c: { d: { e: 1 } } } } } })).toThrow(/nested too deeply/);
    expect(() => validatePreferences({ receiving: { note: 'x'.repeat(501) } })).toThrow(/longer than/);
  });

  it('merges section by section; null removes a section', () => {
    expect(mergePreferences({ alerts: { a: 1 }, language: 'en' }, { language: 'ta', alerts: null })).toEqual({ language: 'ta' });
    expect(mergePreferences(null, { onCall: { from: '03:00' } })).toEqual({ onCall: { from: '03:00' } });
  });

  it('reads and writes only the caller’s own row', async () => {
    const rows: Record<string, any> = { [personas.nilanthi.sub]: { preferences: { language: 'en' } } };
    const tx = {
      user: {
        findUnique: jest.fn(async ({ where }: any) => rows[where.id] ?? null),
        update: jest.fn(async ({ where, data }: any) => (rows[where.id] = { ...rows[where.id], ...data })),
      },
    };
    const prisma = { ...tx, $transaction: (fn: any) => fn(tx) };
    const service = new AuthService(prisma as any, instance(mock(KeycloakAdminClient)), instance(mock(DevicePostureService)), { record: jest.fn() } as any);

    await expect(service.myPreferences(personas.nilanthi)).resolves.toEqual({ language: 'en' });
    await expect(service.saveMyPreferences(personas.nilanthi, { alerts: { vehicleFault: { push: true, sms: true } } })).resolves.toEqual({
      language: 'en',
      alerts: { vehicleFault: { push: true, sms: true } },
    });
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: personas.nilanthi.sub } }));
    await expect(service.myPreferences(personas.admin)).rejects.toMatchObject({ status: 404 });
  });

  it('reports 2-step verification from Keycloak, or unavailable without the admin API', async () => {
    const keycloak = mock(KeycloakAdminClient);
    when(keycloak.configured).thenReturn(true);
    when(keycloak.twoFactor(personas.nilanthi.sub)).thenResolve({ otp: [{ label: 'Phone', createdAt: '2026-04-01T00:00:00.000Z' }], setupRequired: false });
    const service = new AuthService({} as any, instance(keycloak), instance(mock(DevicePostureService)), { record: jest.fn() } as any);
    await expect(service.myTwoFactor(personas.nilanthi)).resolves.toMatchObject({ available: true, enabled: true });

    const off = mock(KeycloakAdminClient);
    when(off.configured).thenReturn(false);
    const offline = new AuthService({} as any, instance(off), instance(mock(DevicePostureService)), { record: jest.fn() } as any);
    await expect(offline.myTwoFactor(personas.nilanthi)).resolves.toMatchObject({ available: false, enabled: false });
  });
});
