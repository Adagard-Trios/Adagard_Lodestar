/**
 * The weekly fuel quota on a real database (fleet service): litres recorded by RecordFuel count against the
 * week they were burnt in, and the count starts again at 0 on Monday 00:00 Asia/Colombo, lazily, the first
 * time fleet reads or writes the vehicle in a new week. Only Date is faked.
 *
 * Wed 7 Oct 2026 12:00 Colombo; its week started Mon 5 Oct 00:00 Colombo = Sun 4 Oct 18:30Z.
 */
import { AppModule } from '../../apps/fleet/src/app.module';
import { bootService, resetDatabase, Service, TokenSigner } from './harness';
import { CLAIMS, seedReference, VEH } from './fixtures';

const WEDNESDAY = new Date('2026-10-07T06:30:00Z');
const THIS_MONDAY = new Date('2026-10-04T18:30:00.000Z');
const LAST_MONDAY = new Date('2026-09-27T18:30:00.000Z');

let svc: Service;
let signer: TokenSigner;
let token: string;

beforeAll(async () => {
  jest.useFakeTimers({
    now: WEDNESDAY,
    doNotFake: ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
      'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
  });
  signer = await TokenSigner.create();
  svc = await bootService(AppModule, signer);
  token = await signer.sign(CLAIMS.dispatcherKandy);
});

afterAll(async () => {
  await svc?.close();
  jest.useRealTimers();
});

beforeEach(async () => {
  await resetDatabase(svc.prisma);
  await seedReference(svc.prisma);
});

const used = async (id: string) => (await svc.prisma.vehicle.findUniqueOrThrow({ where: { id } })).usedLThisWeek;

describe('weekly fuel quota (fleet service, real Postgres)', () => {
  it('a vehicle last counted in an earlier week reads 0 L this week', async () => {
    await svc.prisma.vehicle.update({ where: { id: VEH.K1 }, data: { usedLThisWeek: 120, fuelWeekStart: LAST_MONDAY } });
    await svc.prisma.vehicle.update({ where: { id: VEH.K2 }, data: { usedLThisWeek: 40, fuelWeekStart: THIS_MONDAY } });

    const res = await svc.as(token).get(`Vehicles?$filter=depot eq 'KANDY'&$select=id,usedLThisWeek,fuelWeekStart&$orderby=id`);
    expect(res.status).toBe(200);
    expect(res.body.value.map((v: any) => [v.id, v.usedLThisWeek])).toEqual([[VEH.K1, 0], [VEH.K2, 40]]);
    expect(new Date(res.body.value[0].fuelWeekStart).toISOString()).toBe(THIS_MONDAY.toISOString());
  });

  it('RecordFuel adds to this week, and starts a new week from 0', async () => {
    await svc.prisma.vehicle.update({ where: { id: VEH.K1 }, data: { usedLThisWeek: 50, fuelWeekStart: THIS_MONDAY } });
    await svc.prisma.vehicle.update({ where: { id: VEH.K2 }, data: { usedLThisWeek: 300, fuelWeekStart: LAST_MONDAY } });

    expect((await svc.as(token).post(`Vehicles('${VEH.K1}')/Lodestar.RecordFuel`, { litres: 12.4 })).status).toBe(200);
    expect((await svc.as(token).post(`Vehicles('${VEH.K2}')/Lodestar.RecordFuel`, { litres: 7 })).status).toBe(200);
    expect(await used(VEH.K1)).toBe(62);
    expect(await used(VEH.K2)).toBe(7);
  });
});
