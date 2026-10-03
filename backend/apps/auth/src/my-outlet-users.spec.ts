import { mock, instance } from 'ts-mockito';
import { principal, personas } from '../../../libs/security/test/principals';
import { AuthService } from './auth.service';
import { UsersSet } from './auth.sets';

// SM-30 "Users & access": the store sees the active sign-ins of its own outlet, from the directory.
describe('UsersSet.MyOutletUsers', () => {
  const rows = [
    { id: 'ilyas', name: 'M. Ilyas', role: 'STORE_MANAGER' },
    { id: 'fathima', name: 'Fathima Rizwan', role: 'STORE_MANAGER' },
  ];
  let findMany: jest.Mock;
  let set: UsersSet;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue(rows);
    set = new UsersSet({ user: { findMany } } as any, instance(mock(AuthService)));
  });

  it("reads only the caller's outlet, active users, name and role", async () => {
    await set.myOutletUsers({ principal: personas.fathima, params: {}, headers: {} } as any);
    expect(findMany).toHaveBeenCalledWith({
      where: { outletId: 'OUT106', isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  });

  it('puts the caller first and marks them', async () => {
    const out = await set.myOutletUsers({ principal: personas.fathima, params: {}, headers: {} } as any);
    expect(out).toEqual([
      { id: 'fathima', name: 'Fathima Rizwan', role: 'STORE_MANAGER', self: true },
      { id: 'ilyas', name: 'M. Ilyas', role: 'STORE_MANAGER', self: false },
    ]);
  });

  it('is empty without an outlet on the token, and never reads the directory', async () => {
    const out = await set.myOutletUsers({ principal: principal({ sub: 'x', roles: ['store_manager'] }), params: {}, headers: {} } as any);
    expect(out).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
