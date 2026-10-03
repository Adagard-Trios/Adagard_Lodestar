/**
 * Writes the demo delivery day (seed/demo-day.ts) on top of the reference data and the scenario.
 *
 * - Calendar: rows a week either side of the demo day and four weeks after are created when the loaded
 *   calendar lacks them (Sundays closed), so planning and deferral roll-forward work on any real date.
 * - Fleet: every vehicle is available except the demo day's workshop list. Set when the day is first
 *   seeded only, so a vehicle the dispatcher sends to the workshop later stays there.
 * - Drivers: one roster driver per vehicle (no sign-in) so every planned trip has a driver; Ruwan keeps VEH057.
 * - Orders: created once and never overwritten, so re-running the seed (every `compose up`) does not
 *   undo a plan the dispatcher already approved. Trips are NOT seeded: the day starts at planning.
 */
import { DeferralReason, DeferralStatus, OrderStatus, Role } from '@prisma/client';
import type { ScenarioDb } from '../scenario';
import { PEOPLE } from '../scenario';
import { DemoDay, DemoVehicle, addDays, vehicleStatusFor } from './demo-day';

export interface DemoSummary {
  date: string;
  ordersCreated: number;
  ordersKept: number;
  /** vehicles sent to the workshop by this run (empty when the day was already seeded) */
  workshop: string[];
  drivers: number;
  calendarAdded: string[];
}

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export async function writeDemoDay(db: ScenarioDb, demo: DemoDay, vehicles: DemoVehicle[]): Promise<DemoSummary> {
  const s: DemoSummary = { date: demo.date, ordersCreated: 0, ordersKept: 0, workshop: [], drivers: 0, calendarAdded: [] };

  // 1. Calendar around the demo day.
  for (let i = -7; i <= 28; i++) {
    const d = addDays(demo.date, i);
    if (await db.calendar.findUnique({ where: { date: day(d) } })) continue;
    const isOperating = i === 0 || day(d).getUTCDay() !== 0;
    await db.calendar.create({ data: { date: day(d), isOperating, note: i === 0 ? 'Demo day' : 'demo calendar' } });
    s.calendarAdded.push(d);
  }

  // 2. Fleet status for the day (a new day only).
  const fresh = demo.orders.length > 0 && !(await db.order.findUnique({ where: { id: demo.orders[0].id } }));
  for (const v of fresh ? vehicles : []) {
    const st = vehicleStatusFor(demo, v.id);
    await db.vehicle.update({ where: { id: v.id }, data: st });
    if (st.workshopNote) s.workshop.push(v.id);
  }

  // 3. A driver for every vehicle the personas do not drive.
  const driven = new Set(PEOPLE.map((p) => p.vehicleId).filter(Boolean));
  for (const v of vehicles) {
    if (driven.has(v.id)) continue;
    const id = `drv-${v.id.toLowerCase()}`;
    const row = {
      email: `driver.${v.id.toLowerCase()}@waypoint.lk`, name: `Driver ${v.id}`, role: Role.DRIVER, depot: v.depot as string,
      vehicleId: v.id, isActive: true, passwordHash: null,
    };
    await db.user.upsert({ where: { id }, create: { id, ...row }, update: row });
    s.drivers++;
  }

  // 4. The day's orders, create-only.
  const yesterdayEvening = new Date(Date.parse(`${addDays(demo.date, -1)}T18:40:00+05:30`));
  for (const o of demo.orders) {
    if (await db.order.findUnique({ where: { id: o.id } })) { s.ordersKept++; continue; }
    const { lineItems, source: _source, ...order } = o;
    await db.order.create({
      data: {
        ...order,
        runDate: day(demo.date),
        status: OrderStatus.RECEIVED,
        notes: o.deferredYesterday ? 'Skipped yesterday (capacity): protected today' : null,
      },
    });
    for (const [i, li] of lineItems.entries()) {
      await db.orderLineItem.create({ data: { id: `OLI-${o.id}-${String(i + 1).padStart(2, '0')}`, orderId: o.id, ...li } });
    }
    if (o.deferredYesterday) {
      // yesterday's plan left this outlet out: the log tells the store why and when (SM-17)
      await db.deferralLog.create({
        data: {
          id: `DFL-${o.id}`, orderId: o.id, reason: DeferralReason.CAP_REEFER, score: 80 + Math.min(o.daysSince, 5) * 2,
          status: DeferralStatus.CONFIRMED, confirmedAt: yesterdayEvening, rescheduledDate: day(demo.date),
          notes: `Deferred on ${addDays(demo.date, -1)} (capacity); protected on ${demo.date}`,
        },
      });
    }
    s.ordersCreated++;
  }
  return s;
}
