/* Made-up CSV content only; no competition dataset values. */
import { readCsvRecords } from './csv';
import { deriveOutletName, mapAllowance, mapCalendar, mapDistrict, mapOutlet, mapVehicle } from './mappers';
import {
  parseBool, parseBrand, parseDate, parseDepot, parseDockType, parseNumber, parseParking,
  parseTempClass, parseTime, parseVehicleType, ValueError,
} from './normalize';

/** First record of a one-row CSV. */
const rec = (csv: string) => readCsvRecords(csv).records[0];

describe('normalisers', () => {
  it('booleans', () => {
    for (const t of ['1', 'true', 'TRUE', 'yes', 'Y']) expect(parseBool(t)).toBe(true);
    for (const f of ['0', 'false', 'No', 'n']) expect(parseBool(f)).toBe(false);
    expect(parseBool('')).toBeNull();
    expect(() => parseBool('maybe')).toThrow(ValueError);
  });

  it('enums', () => {
    expect(parseDepot('Peliyagoda')).toBe('PELIYAGODA');
    expect(parseDepot('kandy hub')).toBe('KANDY');
    expect(parseBrand('Fresh')).toBe('FRESH');
    expect(parseDockType('rear_dock')).toBe('REAR_DOCK');
    expect(parseDockType('Rear Dock')).toBe('REAR_DOCK');
    expect(parseDockType('mall-bay')).toBe('MALL_BAY');
    expect(parseDockType('street')).toBe('STREET');
    expect(parseParking('van_only')).toBe('VAN_ONLY');
    expect(parseParking('mall dock')).toBe('MALL_DOCK');
    expect(parseParking('normal')).toBe('NORMAL');
    expect(parseParking('')).toBe('NORMAL');
    expect(parseVehicleType('Truck')).toBe('TRUCK');
    expect(parseVehicleType('van')).toBe('VAN');
    expect(parseTempClass('reefer')).toBe('CHILLED');
    expect(parseTempClass('dry')).toBe('AMBIENT');
    expect(parseTempClass('Ambient')).toBe('AMBIENT');
    expect(() => parseDepot('Galle')).toThrow(ValueError);
    expect(() => parseTempClass('frozen')).toThrow(ValueError);
  });

  it('times, dates, numbers', () => {
    expect(parseTime('5:30')).toBe('05:30');
    expect(parseTime('07:45:00')).toBe('07:45');
    expect(parseTime('0615')).toBe('06:15');
    expect(() => parseTime('7.30am')).toThrow(ValueError);
    expect(parseDate('2031-02-03')?.toISOString()).toBe('2031-02-03T00:00:00.000Z');
    expect(parseDate('2031/2/3')?.toISOString()).toBe('2031-02-03T00:00:00.000Z');
    expect(() => parseDate('2031-02-30')).toThrow(ValueError);
    expect(parseNumber('1,234.5')).toBe(1234.5);
    expect(parseNumber(' ')).toBeNull();
    expect(() => parseNumber('abc')).toThrow(ValueError);
  });
});

describe('mapCalendar', () => {
  it('maps canonical headers', () => {
    const m = mapCalendar(rec(
      'date,dow,dow_name,is_weekend,iso_year,iso_week,is_payday,festival,festival_ramp,is_holiday,monsoon,is_operating\n' +
      '2031-01-06,1,Mon,0,2031,2,1,Test Fest,0.5,0,1,1\n'));
    expect(m).toEqual({
      ok: true,
      row: {
        date: new Date('2031-01-06T00:00:00.000Z'), isOperating: true, isPayday: true,
        festivalRamp: 0.5, monsoon: 1, festivalName: 'Test Fest', note: null,
      },
    });
  });

  it('accepts aliases and blanks', () => {
    const m = mapCalendar(rec('Date,isOperating,isPayday,festivalRamp,monsoon,festival_name\n2031-01-07,false,,,,\n'));
    expect(m.ok && m.row).toMatchObject({ isOperating: false, isPayday: false, festivalRamp: 0, monsoon: 0, festivalName: null });
  });

  it('derives is_operating from weekend/holiday when absent', () => {
    const m = mapCalendar(rec('date,is_weekend,is_holiday\n2031-01-05,1,0\n'));
    expect(m.ok && m.row.isOperating).toBe(false);
  });

  it('skips a row with a bad date', () => {
    const m = mapCalendar(rec('date,is_operating\nnot-a-date,1\n'));
    expect(m.ok).toBe(false);
  });
});

describe('mapDistrict', () => {
  it('maps canonical headers', () => {
    const m = mapDistrict(rec(
      'district,depot,road_class,free_flow_kmh,depot_to_district_km,depot_to_district_freeflow_min,inter_stop_km,inter_stop_freeflow_min\n' +
      'Testville,Kandy,Hill,30,12.5,41.6,2,9\n'));
    expect(m).toEqual({
      ok: true,
      row: { district: 'Testville', depot: 'KANDY', roadClass: 'hill', depotToDistMin: 42, interStopMin: 9, distKm: 12.5 },
    });
  });

  it('accepts old seed aliases', () => {
    const m = mapDistrict(rec('district,depot,roadClass,depot_to_dist_min,interStopMin,dist_km\nTestburg,PELIYAGODA,urban,11,3,\n'));
    expect(m.ok && m.row).toEqual({ district: 'Testburg', depot: 'PELIYAGODA', roadClass: 'urban', depotToDistMin: 11, interStopMin: 3, distKm: null });
  });

  it('skips unknown depot', () => {
    const m = mapDistrict(rec('district,depot,road_class,depot_to_dist_min,inter_stop_min\nX,Moonbase,urban,1,1\n'));
    expect(m).toEqual({ ok: false, reason: 'unknown depot: "Moonbase"' });
  });
});

describe('mapAllowance', () => {
  it('maps canonical and alias headers', () => {
    expect(mapAllowance(rec('brand,dock_type,service_allowance_min\nTech,mall bay,33\n')))
      .toEqual({ ok: true, row: { brand: 'TECH', dockType: 'MALL_BAY', minutes: 33 } });
    expect(mapAllowance(rec('Brand,dockType,minutes\nstyle,STREET,17\n')))
      .toEqual({ ok: true, row: { brand: 'STYLE', dockType: 'STREET', minutes: 17 } });
  });

  it('skips unknown brand and missing minutes', () => {
    expect(mapAllowance(rec('brand,dock_type,service_allowance_min\nGadgets,street,5\n')).ok).toBe(false);
    expect(mapAllowance(rec('brand,dock_type,service_allowance_min\nFresh,street,\n'))).toEqual({ ok: false, reason: 'missing service_allowance_min' });
  });
});

describe('mapOutlet', () => {
  const header = 'outlet_id,brand,district,depot,dock_type,parking_constraint,mall_window,window_open_time,window_close_time\n';

  it('maps canonical headers and derives a neutral name', () => {
    const m = mapOutlet(rec(header + 'out901,Fresh,Testville,Kandy,rear_dock,,,5:00,08:15\n'));
    expect(m).toEqual({
      ok: true,
      row: {
        id: 'OUT901', name: 'Waypoint Fresh Testville 901', brand: 'FRESH', district: 'Testville', depot: 'KANDY',
        dockType: 'REAR_DOCK', parking: 'NORMAL', windowOpen: '05:00', windowClose: '08:15', mallWindow: null,
      },
    });
  });

  it('accepts aliases and an explicit name', () => {
    const m = mapOutlet(rec('id,name,brand,district,depot,dockType,parking,windowOpen,windowClose\nOUT902,Test Shop,Style,Testburg,Peliyagoda,Mall Bay,mall_dock,10:00,12:00\n'));
    expect(m.ok && m.row).toMatchObject({ id: 'OUT902', name: 'Test Shop', dockType: 'MALL_BAY', parking: 'MALL_DOCK' });
  });

  it('reads mall_window as the mall delivery window ("HH:mm-HH:mm")', () => {
    const m = mapOutlet(rec(header + 'OUT905,Style,T,Kandy,mall_bay,mall_dock,9:15-11:45,09:15,11:45\n'));
    expect(m.ok && m.row.mallWindow).toBe('09:15-11:45');
    expect(mapOutlet(rec(header + 'OUT906,Style,T,Kandy,mall_bay,mall_dock,soon,09:15,11:45\n'))).toEqual({ ok: false, reason: 'not a time window: "soon"' });
  });

  it('skips unknown dock type and unknown parking', () => {
    expect(mapOutlet(rec(header + 'OUT903,Fresh,T,Kandy,roof,,,05:00,06:00\n'))).toEqual({ ok: false, reason: 'unknown dock type: "roof"' });
    expect(mapOutlet(rec(header + 'OUT904,Fresh,T,Kandy,street,helipad,,05:00,06:00\n')).ok).toBe(false);
  });

  it('deriveOutletName uses the numeric suffix', () => {
    expect(deriveOutletName('OUT007', 'TECH', 'Somewhere')).toBe('Waypoint Tech Somewhere 007');
  });
});

describe('mapVehicle', () => {
  it('maps canonical headers', () => {
    const m = mapVehicle(rec(
      'vehicle_id,type,temp,weight_cap_kg,volume_cap_m3,fuel_type,km_per_l,weekly_fuel_quota_l,depot\n' +
      'veh901,van,reefer,999,5.5,diesel,9.9,321.4,Kandy\n'));
    expect(m).toEqual({
      ok: true,
      row: { id: 'VEH901', depot: 'KANDY', type: 'VAN', tempClass: 'CHILLED', capacityKg: 999, capacityM3: 5.5, kmPerLitre: 9.9, weeklyLFuel: 321 },
    });
  });

  it('accepts old seed aliases', () => {
    const m = mapVehicle(rec('id,depot,type,tempClass,capacityKg,capacityM3,kmPerLitre,weeklyLFuel\nVEH902,PELIYAGODA,TRUCK,AMBIENT,1234,20,5,300\n'));
    expect(m.ok && m.row).toMatchObject({ id: 'VEH902', tempClass: 'AMBIENT', weeklyLFuel: 300, capacityKg: 1234 });
  });

  it('skips unknown vehicle type and bad numbers', () => {
    const h = 'vehicle_id,type,temp,weight_cap_kg,volume_cap_m3,km_per_l,weekly_fuel_quota_l,depot\n';
    expect(mapVehicle(rec(h + 'VEH903,bicycle,dry,1,1,1,1,Kandy\n'))).toEqual({ ok: false, reason: 'unknown vehicle type: "bicycle"' });
    expect(mapVehicle(rec(h + 'VEH904,van,dry,heavy,1,1,1,Kandy\n')).ok).toBe(false);
  });
});
