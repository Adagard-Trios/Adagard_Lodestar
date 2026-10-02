// Field writes. Each one is saved in the outbox first (client UUID + time saved on the phone) and sent by
// the sync engine as soon as there is signal, so it works the same with and without coverage.
import { network } from '@/offline/network';
import { queue, session } from './platform';
import type { NewOrderLine } from './api';
import { orderBody } from './api';
import type { Order, Outlet, Shortfall, Trip, TripStop } from './types';

function sub(): string {
  const s = session.claims?.sub;
  if (!s) throw new Error('Sign in to save this');
  return s;
}

const outletName = (s: TripStop) => s.outlet?.name ?? s.outletId;

/** TripStops Arrive, as an ARRIVAL event. */
export async function arriveAtStop(stop: TripStop, at: Date = new Date()) {
  return queue.enqueue('ARRIVAL', {
    sub: sub(),
    tripId: stop.tripId,
    ref: stop.id,
    label: `Arrival · ${outletName(stop)}`,
    payload: { stopSeq: stop.stopSeq, time: at.toISOString(), stopId: stop.id },
    savedAt: at.toISOString(),
  });
}

export type PodInput = { unitsDelivered: number; unitsOrdered: number; receiverName?: string; exceptions?: { type: string; description: string }[] };

/**
 * TripStops CompleteStop with the POD, as POD_SAVE + LEAVE events (plus ARRIVAL when not recorded yet).
 * For a stop that is already delivered this is a POD correction: only POD_SAVE is sent. A POD saved with no
 * signal says so (`offline`), so the store is told it was recorded offline when it syncs (SM-A1).
 */
export async function completeStop(stop: TripStop, pod: PodInput, at: Date = new Date()) {
  const s = sub();
  const time = at.toISOString();
  const correction = stop.status === 'DELIVERED';
  if (!stop.arrivalActual && !correction) await arriveAtStop(stop, new Date(at.getTime() - 1000));
  const saved = await queue.enqueue('POD_SAVE', {
    sub: s,
    tripId: stop.tripId,
    ref: stop.id,
    label: `POD · ${stop.orderId}`,
    payload: {
      orderId: stop.orderId,
      units: Math.max(0, Math.min(pod.unitsDelivered, pod.unitsOrdered)),
      unitsOrdered: pod.unitsOrdered,
      ...(pod.receiverName ? { receiverName: pod.receiverName } : {}),
      ...(pod.exceptions?.length ? { exceptions: pod.exceptions } : {}),
      ...(network.get().online ? {} : { offline: true }),
      savedAt: time,
      stopId: stop.id,
    },
    savedAt: time,
  });
  if (correction) return saved;
  await queue.enqueue('LEAVE', {
    sub: s,
    tripId: stop.tripId,
    ref: stop.id,
    label: `Left · ${outletName(stop)}`,
    payload: { stopSeq: stop.stopSeq, time: new Date(at.getTime() + 1).toISOString(), stopId: stop.id },
    savedAt: new Date(at.getTime() + 1).toISOString(),
  });
  return saved;
}

/** LoadRecords RecordShortfalls: the queued write carries the trip's full shortfall list. */
export async function recordShortfall(trip: Pick<Trip, 'id' | 'bay' | 'vehicleId'>, loadRecordId: string | undefined, current: Shortfall[], add: Shortfall) {
  const shortfalls = [...current.filter(s => s.item !== add.item), { ...add, at: new Date().toISOString() }];
  return queue.enqueue('SHORTFALL', {
    sub: sub(),
    tripId: trip.id,
    ref: trip.id,
    label: `Shortfall · ${add.item} ${add.qtyLoaded}/${add.qtyOrdered}`,
    payload: { tripId: trip.id, loadRecordId, bay: trip.bay ?? undefined, shortfalls },
  });
}

/** Trips Release (seal and reefer temperature). */
export async function releaseVehicle(trip: Pick<Trip, 'id' | 'bay' | 'vehicleId'>, sealNumber: string, reeferTempC?: number) {
  if (!sealNumber.trim()) throw new Error('Enter the seal number');
  return queue.enqueue('RELEASE', {
    sub: sub(),
    tripId: trip.id,
    ref: trip.id,
    label: `Release · ${trip.vehicleId}`,
    payload: { tripId: trip.id, bay: trip.bay ?? undefined, sealNumber: sealNumber.trim(), ...(reeferTempC !== undefined ? { reeferTempC } : {}) },
  });
}

/** Store receipt count (Orders ConfirmReceipt). */
export async function confirmReceipt(order: Pick<Order, 'id' | 'units'>, unitsReceived: number, note?: string) {
  return queue.enqueue('RECEIPT', {
    sub: sub(),
    ref: order.id,
    label: `Receipt · ${order.id} ${unitsReceived}/${order.units}`,
    payload: { orderId: order.id, unitsReceived, unitsExpected: order.units, ...(note ? { note } : {}) },
  });
}

/** POST Orders (a store's order for its next delivery day). */
export async function placeOrder(outlet: Pick<Outlet, 'id' | 'brand'>, runDate: string, lines: NewOrderLine[], notes?: string) {
  const order = orderBody(outlet, runDate, lines, notes);
  if (!order.lineItems.length) throw new Error('Add at least one line');
  return queue.enqueue('ORDER', {
    sub: sub(),
    ref: `order-${runDate}`,
    label: `Order · ${runDate} · ${order.units} units`,
    payload: { order },
  });
}
