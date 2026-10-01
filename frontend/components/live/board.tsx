'use client';
// The plan board's lanes (DSP-02, DSP-12): one lane per vehicle with up to two trip cards, built from real Trips
// or from a planning-agent draft. Markup and classes from the DSP-02 design.
import { useMemo } from 'react';
import { Ic } from './icons';
import { fmtClock, fmtNum, pct, title } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { AgentRunDetail, AgentTrip, Order, Trip, Vehicle } from '@/lib/odata/types';
import { depotFilter } from '@/lib/workday';

export /** One card on the board, from a real trip or from the agent's draft. */
interface Card {
  id: string;
  vehicleId: string;
  tripNo: number;
  brand: string;
  district: string;
  chilled: boolean;
  stops: number;
  firstOutlet?: string;
  kg: number;
  m3: number;
  minutes: number;
  departs?: string | null;
  status?: string;
}

export const budget = (brand: string) => (brand === 'FRESH' ? 270 : 480);

function capClass(used: number, cap: number) {
  const p = cap ? used / cap : 0;
  return p > 1 ? 'bad' : p >= 0.85 ? 'warn' : '';
}

export function TripCard({ c, v }: { c: Card; v?: Vehicle }) {
  const kgCls = capClass(c.kg, v?.capacityKg ?? 0);
  const m3Cls = capClass(c.m3, v?.capacityM3 ?? 0);
  return (
    <div className={`x-trip x-trip--${c.brand.toLowerCase()}`} data-trip={c.id}>
      <div className="x-trip__head">
        <span className="x-trip__t">{title(c.brand)} · {c.district}</span>
        {c.chilled ? <span className="m-tag m-tag--cold"><Ic n="snow" />{"Chilled"}</span> : <span className="m-tag"><span className="dot" style={{ color: '#98A1B3' }} />{"Dry"}</span>}
        <span className="spacer" />
        <span className="x-trip__min"><b>{c.minutes}</b>{c.brand === 'FRESH' ? 'min' : `/ ${budget(c.brand)} min`}</span>
      </div>
      <div className="x-trip__meta">
        <Ic n="pin" />
        {c.stops} stop{c.stops === 1 ? '' : 's'}
        {c.firstOutlet ? <> · <span className="id">{c.firstOutlet}</span>{c.stops > 1 ? ` +${c.stops - 1}` : ''}</> : null}
        {c.departs ? ` · departs ${fmtClock(c.departs)}` : ''}
        {c.status ? ` · ${title(c.status)}` : ''}
      </div>
      <div className="x-caps">
        <div className="x-cap">
          <div className="x-cap__h"><span>{"kg"}</span><b className={kgCls}>{fmtNum(c.kg)} / {fmtNum(v?.capacityKg)}</b></div>
          <div className="x-cap__t"><div className={kgCls} style={{ width: `${pct(c.kg, v?.capacityKg)}%` }} /></div>
        </div>
        <div className="x-cap">
          <div className="x-cap__h"><span>{"m³"}</span><b className={m3Cls}>{fmtNum(c.m3, 1)} / {fmtNum(v?.capacityM3, 1)}</b></div>
          <div className="x-cap__t"><div className={m3Cls} style={{ width: `${pct(c.m3, v?.capacityM3)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

export function Lane({ vehicleId, cards, v }: { vehicleId: string; cards: Card[]; v?: Vehicle }) {
  const minutes = cards.reduce((s, c) => s + c.minutes, 0);
  const max = budget(cards[0]?.brand ?? 'FRESH');
  const reefer = v?.tempClass === 'CHILLED';
  return (
    <div className="x-lane" data-vehicle={vehicleId}>
      <div className="x-veh">
        <div className="x-veh__id"><span className={`x-veh__ic${reefer ? '' : ' x-veh__ic--dry'}`}><Ic n={v?.type === 'VAN' ? 'van' : 'truck'} /></span><span className="id">{vehicleId}</span></div>
        <div className="x-veh__type">{reefer ? 'Reefer' : 'Dry'} {v?.type === 'VAN' ? 'van' : 'truck'} · {fmtNum(v?.capacityM3, 1)} m³</div>
        <div className="x-veh__min"><span>{minutes}<small>/ {max} min</small></span></div>
        <div className="x-veh__bar"><div style={{ width: `${pct(minutes, max)}%` }} /></div>
        {v && <div className="x-veh__fuel"><span className="hstack" style={{ gap: '5px' }}><Ic n="fuel" /><b>{v.usedLThisWeek}</b>/ {v.weeklyLFuel} L</span></div>}
      </div>
      {cards.slice(0, 2).map(c => <TripCard key={c.id} c={c} v={v} />)}
    </div>
  );
}


/** Cards for the board: the agent draft's trips when `draft` is given, else the run date's real trips. */
export function useBoardCards(opts: { draft: AgentRunDetail | null; tripsFilter?: string; ordersFilter?: string; active: readonly string[] }) {
  const { draft, tripsFilter, ordersFilter, active } = opts;
  const trips = useQuery<Trip[]>(tripsFilter ? `board:${tripsFilter}` : null, c =>
    c.all<Trip>('Trips', { filter: tripsFilter, expand: 'stops($select=id,orderId,outletId,stopSeq,status)', orderby: 'vehicleId,tripNumber' }),
  { refreshOn: ['eta_update', 'notification'] });
  const orders = useQuery<Order[]>(ordersFilter ? `sizes:${ordersFilter}` : null, c => c.all<Order>('Orders', { filter: ordersFilter, select: 'id,kg,m3,status' }));
  const fleet = useQuery<Vehicle[]>(`fleet:${active.join(',')}`, c => c.all<Vehicle>('Vehicles', { filter: depotFilter('depot', active) }));
  const vehicles = useMemo(() => new Map((fleet.data ?? []).map(v => [v.id, v])), [fleet.data]);
  const sizes = useMemo(() => new Map((orders.data ?? []).map(o => [o.id, o])), [orders.data]);

  const cards: Card[] = useMemo(() => {
    if (draft?.plan?.trips) {
      return draft.plan.trips.map((t: AgentTrip) => ({
        id: t.id, vehicleId: t.vehicleId, tripNo: t.tripNo, brand: t.brand, district: t.district, chilled: t.chilled,
        stops: t.orderIds.length, firstOutlet: undefined, kg: t.kg, m3: t.m3, minutes: t.minutes, departs: t.departs,
      }));
    }
    return (trips.data ?? []).map(t => {
      const stops = [...(t.stops ?? [])].sort((a, b) => a.stopSeq - b.stopSeq);
      const kg = stops.reduce((s, st) => s + (sizes.get(st.orderId)?.kg ?? 0), 0);
      const m3 = stops.reduce((s, st) => s + (sizes.get(st.orderId)?.m3 ?? 0), 0);
      return {
        id: t.id, vehicleId: t.vehicleId, tripNo: t.tripNumber, brand: t.brand, district: t.district,
        chilled: vehicles.get(t.vehicleId)?.tempClass === 'CHILLED', stops: new Set(stops.map(s => s.outletId)).size,
        firstOutlet: stops[0]?.outletId, kg, m3, minutes: t.planMinutes ?? 0, departs: t.departTime, status: t.status,
      };
    });
  }, [draft, trips.data, sizes, vehicles]);

  const lanes = useMemo(() => {
    const m = new Map<string, Card[]>();
    cards.forEach(c => m.set(c.vehicleId, [...(m.get(c.vehicleId) ?? []), c].sort((a, b) => a.tripNo - b.tripNo)));
    return [...m.entries()];
  }, [cards]);
  const down = (fleet.data ?? []).filter(v => v.status === 'WORKSHOP');
  const idle = (fleet.data ?? []).filter(v => v.status !== 'WORKSHOP' && !lanes.some(([id]) => id === v.id));
  return { trips, orders, fleet, vehicles, cards, lanes, down, idle, loading: !draft && !trips.data && !trips.error };
}
