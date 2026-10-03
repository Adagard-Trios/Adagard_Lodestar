// Entity shapes as the OData API returns them (backend/prisma/schema.prisma, backend/apps/*/src/*.sets.ts).
// Dates come back as ISO strings.

/** A depot code (PELIYAGODA, KANDY, …): depots are rows of the Depots registry (ADM-21), not a fixed list. */
export type Depot = string;

/** A depot as the registry (OData Depots) holds it; names shown on the phone come from here. */
export interface DepotRow {
  code: string;
  name: string;
  district: string;
  address?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
}
export type Brand = 'FRESH' | 'STYLE' | 'TECH';
export type TempClass = 'CHILLED' | 'AMBIENT';
export type OrderStatus = 'RECEIVED' | 'PLANNED' | 'LOADED' | 'ENROUTE' | 'DELIVERED' | 'DEFERRED' | 'EXCEPTION' | 'CANCELLED';
export type TripStatus = 'PLANNED' | 'LOADING' | 'ENROUTE' | 'COMPLETE';
export type PlanStatus = 'DRAFT' | 'NEEDS_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUPERSEDED';

type Etag = { '@odata.etag'?: string };

export type Outlet = Etag & {
  id: string;
  name: string;
  brand: Brand;
  district: string;
  depot: Depot;
  dockType?: string;
  parking?: string;
  windowOpen: string;
  windowClose: string;
  address?: string | null;
  accessNote?: string | null;
  /** mall_dock outlets: the mall's delivery window "HH:mm-HH:mm". */
  mallWindow?: string | null;
};

export type OrderLineItem = Etag & { id: string; orderId: string; name: string; qty: number; kg: number; tempClass: TempClass };

export type Order = Etag & {
  id: string;
  outletId: string;
  runDate: string;
  orderedAt: string;
  brand: Brand;
  tempClass: TempClass;
  units: number;
  kg: number;
  m3: number;
  status: OrderStatus;
  notes?: string | null;
  /** The store's count (Orders ConfirmReceipt); null until the receipt is confirmed. */
  unitsReceived?: number | null;
  unitsExpected?: number | null;
  receiptNote?: string | null;
  receiptSavedAt?: string | null;
  receivedAt?: string | null;
  /** CN-YYMM-NNNN when the store's count was short (same id as the POD's credit note). */
  creditNoteId?: string | null;
  outlet?: Outlet;
  lineItems?: OrderLineItem[];
  tripStop?: TripStop | null;
  deferralLog?: Deferral | null;
};

export type POD = Etag & {
  id: string;
  tripStopId: string;
  unitsDelivered: number;
  unitsOrdered: number;
  receiverName?: string | null;
  photoUrl?: string | null;
  exceptions?: { type?: string; description?: string; item?: string; qty?: number; unitsShort?: number; source?: string; note?: string | null }[] | null;
  creditNoteId?: string | null;
  savedOffline: boolean;
  savedAt: string;
  syncedAt?: string | null;
  tripStop?: TripStop;
};

export type TripStop = Etag & {
  id: string;
  tripId: string;
  orderId: string;
  outletId: string;
  stopSeq: number;
  etaPlan?: string | null;
  etaModel?: string | null;
  etaModelBandEarly?: string | null;
  etaModelBandLate?: string | null;
  lateRiskPct?: number | null;
  serviceMinPredicted?: number | null;
  arrivalActual?: string | null;
  leaveActual?: string | null;
  status: OrderStatus;
  outlet?: Outlet;
  order?: Order;
  pod?: POD | null;
  trip?: Trip;
};

export type Shortfall = { item: string; qtyOrdered: number; qtyLoaded: number; reason: string; orderId?: string; at?: string };

export type LoadRecord = Etag & {
  id: string;
  tripId: string;
  vehicleId: string;
  loaderId: string;
  bay: string;
  sealNumber?: string | null;
  reeferTempC?: number | null;
  loadedAt?: string | null;
  releasedAt?: string | null;
  shortfalls?: Shortfall[] | null;
  notes?: string | null;
};

export type Vehicle = Etag & {
  id: string;
  depot: Depot;
  type: 'TRUCK' | 'VAN';
  tempClass: TempClass;
  capacityKg: number;
  capacityM3: number;
  status: 'AVAILABLE' | 'WORKSHOP' | 'ENROUTE';
  workshopNote?: string | null;
};

export type Trip = Etag & {
  id: string;
  vehicleId: string;
  driverId?: string | null;
  depot: Depot;
  runDate: string;
  brand: Brand;
  district: string;
  status: TripStatus;
  planVersion: number;
  tripNumber: number;
  departTime?: string | null;
  returnTime?: string | null;
  planMinutes?: number | null;
  actualMinutes?: number | null;
  sealNumber?: string | null;
  reeferTempC?: number | null;
  bay?: string | null;
  planId?: string | null;
  vehicle?: Vehicle;
  driver?: { id: string; name: string } | null;
  stops?: TripStop[];
  loadRecord?: LoadRecord | null;
};

export type Notification = Etag & {
  id: string;
  recipientId: string;
  tripId?: string | null;
  type: string;
  channel: string;
  payload: Record<string, any> | null;
  sentAt: string;
  readAt?: string | null;
};

export type Plan = Etag & {
  id: string;
  depot: Depot;
  runDate: string;
  version: number;
  status: PlanStatus;
  source: 'MANUAL' | 'AUTOPLAN' | 'AGENT';
  summary?: Record<string, any> | null;
  explanation?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  notes?: string | null;
};

export type Deferral = Etag & {
  id: string;
  orderId: string;
  reason: string;
  score: number;
  notes?: string | null;
  rescheduledDate?: string | null;
  isProvisional: boolean;
  status: 'SUGGESTED' | 'CONFIRMED' | 'DISMISSED' | 'REVERSED';
  createdAt: string;
};

export type OfflineEventRow = { id: string; tripId?: string | null; eventType: string; payload: any; savedAt: string; syncedAt?: string | null; conflictResolved: boolean; conflictNote?: string | null };
