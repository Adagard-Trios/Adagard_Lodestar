// Field writes. Each one is saved in the outbox first (client UUID + time saved on the phone) and sent by
// the sync engine as soon as there is signal, so it works the same with and without coverage.
import { network } from '@/offline/network';
import type { QueueItem } from '@/offline/queue';
import { queue, session } from './platform';
import type { NewOrderLine } from './api';
import { orderBodies } from './api';
import type { Order, Outlet, Shortfall, Trip, TripStatus, TripStop } from './types';

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

/**
 * A proof-of-delivery photo of the stop (DR-20 / DR-03), as a POD_PHOTO write: kept on the phone until there is
 * signal, then uploaded to /media/pod-photos (the server links it to the stop's POD whichever arrives first).
 */
export async function queuePodPhoto(stop: TripStop, photo: { dataBase64: string; mime: string; bytes: number; takenAt: string }) {
  return queue.enqueue('POD_PHOTO', {
    sub: sub(),
    tripId: stop.tripId,
    ref: stop.id,
    label: `Photo · ${stop.orderId}`,
    payload: { stopId: stop.id, orderId: stop.orderId, mime: photo.mime, dataBase64: photo.dataBase64, bytes: photo.bytes, takenAt: photo.takenAt },
    savedAt: photo.takenAt,
  });
}

// ---------------------------------------------------------------- trip status (driver)

const STATUS_ORDER: TripStatus[] = ['PLANNED', 'LOADING', 'ENROUTE', 'COMPLETE'];

/** The signed-in user's own outbox (the sync engine only sends these; the screens read the same through useOutbox). */
const myItems = (): QueueItem[] => {
  const me = session.claims?.sub;
  return me ? queue.list().filter(i => i.sub === me) : [];
};

/** The trip's status as this phone knows it: the server's, moved on by a TRIP_STATUS write still on the phone. */
export function tripStatusOf(trip: Pick<Trip, 'id' | 'status'>, items: QueueItem[] = myItems()): TripStatus {
  let st = trip.status;
  for (const i of items) {
    if (i.kind !== 'TRIP_STATUS' || i.tripId !== trip.id || i.status === 'rejected' || i.status === 'conflict') continue;
    const s = i.payload.status as TripStatus;
    if (STATUS_ORDER.indexOf(s) > STATUS_ORDER.indexOf(st)) st = s;
  }
  return st;
}

// a trip being finished right now (a screen may ask twice while the first write is still being saved)
const finishing = new Set<string>();

/**
 * DR-01 Start trip: Trips SetStatus ENROUTE through the outbox, unless the trip is en route already (the dock's
 * release sets it) or complete. Resolves to the queued write, or null when nothing was needed.
 */
export async function startTrip(trip: Pick<Trip, 'id' | 'status' | 'vehicleId'>, at: Date = new Date()) {
  const st = tripStatusOf(trip);
  if (st === 'ENROUTE' || st === 'COMPLETE') return null;
  return queue.enqueue('TRIP_STATUS', {
    sub: sub(),
    tripId: trip.id,
    ref: trip.id,
    label: `Trip started · ${trip.vehicleId}`,
    payload: { tripId: trip.id, status: 'ENROUTE' },
    savedAt: at.toISOString(),
  });
}

/**
 * DR-04 / DR-28: the driver finished the trip. Trips SetStatus COMPLETE through the outbox (the server records
 * the return time and the fuel used); a trip that never went en route is first set ENROUTE (the server only
 * completes an en-route trip). No client sets COMPLETE any other way. Null when it is complete already.
 */
export async function finishTrip(trip: Pick<Trip, 'id' | 'status' | 'vehicleId' | 'tripNumber'>, at: Date = new Date()) {
  if (finishing.has(trip.id) || tripStatusOf(trip) === 'COMPLETE') return null;
  finishing.add(trip.id);
  try {
    await startTrip(trip, new Date(at.getTime() - 1));
    return await queue.enqueue('TRIP_STATUS', {
      sub: sub(),
      tripId: trip.id,
      ref: trip.id,
      label: `Trip ${trip.tripNumber} complete · ${trip.vehicleId}`,
      payload: { tripId: trip.id, status: 'COMPLETE' },
      savedAt: at.toISOString(),
    });
  } finally {
    finishing.delete(trip.id);
  }
}

/** Finishes every trip of the run whose stops are all delivered (DR-04 on the last stop, DR-28 Close shift). */
export async function finishDeliveredTrips(trips: Pick<Trip, 'id' | 'status' | 'vehicleId' | 'tripNumber'>[], stops: Pick<TripStop, 'tripId' | 'status'>[]) {
  const done = trips.filter(t => {
    const own = stops.filter(s => s.tripId === t.id);
    return own.length > 0 && own.every(s => s.status === 'DELIVERED');
  });
  const out = [];
  for (const t of done) {
    const w = await finishTrip(t);
    if (w) out.push(w);
  }
  return out;
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

/**
 * POST Orders (a store's order for its next delivery day): one write per temperature class, so the dry and the
 * chilled order each get their own order number and travel apart. The server may move an order placed after the
 * cut-off to a later operating run; the screens then show the run date it returned.
 */
export async function placeOrder(outlet: Pick<Outlet, 'id' | 'brand'>, runDate: string, lines: NewOrderLine[], notes?: string, m3PerKg?: number) {
  const orders = orderBodies(outlet, runDate, lines, notes, m3PerKg);
  if (!orders.length) throw new Error('Add at least one line');
  const out = [];
  for (const order of orders) {
    out.push(await queue.enqueue('ORDER', {
      sub: sub(),
      ref: `order-${runDate}-${order.tempClass}`,
      label: `Order · ${runDate} · ${order.tempClass === 'CHILLED' ? 'chilled' : 'dry'} · ${order.units} units`,
      payload: { order },
    }));
  }
  return out;
}
