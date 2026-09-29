/**
 * Waypoint Lodestar — Prisma Seed
 * "Every order, one thread."  Team Adagard · Tech-Triathlon 2026
 *
 * All data grounded in STORY.md / competition CSVs.
 * Hero thread: VEH057 → OUT106 (Nuwara Eliya) → OUT108 (Hawa Eliya)
 * Scenario day: Tue 7 Apr 2026 (ISO W15, monsoon 1, festival_ramp 0.4)
 */

import { PrismaClient, Role, Depot, Brand, TempClass, DockType, ParkingType,
         VehicleType, VehicleStatus, OrderStatus, TripStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USER_PWD    = process.env.SEED_USER_PASSWORD  || 'lodestar2026';
const ADMIN_PWD   = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const SCENARIO_DAY = new Date('2026-04-07T00:00:00.000Z'); // Tue 7 Apr 2026
const ORDER_CUTOFF = new Date('2026-04-06T10:30:00.000Z'); // Mon 6 Apr 4:00 PM IST = 10:30 UTC
const ORDER_TIME   = new Date('2026-04-06T09:08:00.000Z'); // Mon 6 Apr 2:38 PM IST = 09:08 UTC

async function main() {
  console.log('🌱 Seeding Waypoint Lodestar database...');

  // ─────────────────────────────────────────────────────────
  // 1. REFERENCE DATA: District travel (from district_travel.csv)
  // ─────────────────────────────────────────────────────────
  console.log('  → District travel times...');
  await prisma.districtTravel.createMany({
    skipDuplicates: true,
    data: [
      { district: 'Colombo',    depot: Depot.PELIYAGODA, roadClass: 'urban',    depotToDistMin: 24,  interStopMin: 8,  distKm: 10 },
      { district: 'Gampaha',   depot: Depot.PELIYAGODA, roadClass: 'suburban', depotToDistMin: 37,  interStopMin: 9,  distKm: 18 },
      { district: 'Kalutara',  depot: Depot.PELIYAGODA, roadClass: 'suburban', depotToDistMin: 64,  interStopMin: 12, distKm: 43 },
      { district: 'Galle',     depot: Depot.PELIYAGODA, roadClass: 'highway',  depotToDistMin: 103, interStopMin: 9,  distKm: 116 },
      { district: 'Matara',    depot: Depot.PELIYAGODA, roadClass: 'highway',  depotToDistMin: 137, interStopMin: 10, distKm: 160 },
      { district: 'Kurunegala',depot: Depot.PELIYAGODA, roadClass: 'suburban', depotToDistMin: 127, interStopMin: 19, distKm: 94 },
      { district: 'Puttalam',  depot: Depot.PELIYAGODA, roadClass: 'suburban', depotToDistMin: 173, interStopMin: 24, distKm: 140 },
      { district: 'Kandy',     depot: Depot.KANDY,      roadClass: 'urban',    depotToDistMin: 16,  interStopMin: 6,  distKm: 5 },
      { district: 'Matale',    depot: Depot.KANDY,      roadClass: 'suburban', depotToDistMin: 35,  interStopMin: 11, distKm: 26 },
      { district: 'Nuwara Eliya', depot: Depot.KANDY,   roadClass: 'hill',     depotToDistMin: 111, interStopMin: 20, distKm: 78 },
      { district: 'Badulla',   depot: Depot.KANDY,      roadClass: 'hill',     depotToDistMin: 186, interStopMin: 23, distKm: 140 },
      { district: 'Kegalle',   depot: Depot.KANDY,      roadClass: 'suburban', depotToDistMin: 53,  interStopMin: 13, distKm: 42 },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // 2. SERVICE ALLOWANCES (from service_allowance.csv)
  // ─────────────────────────────────────────────────────────
  console.log('  → Service allowances...');
  await prisma.serviceAllowance.createMany({
    skipDuplicates: true,
    data: [
      { brand: Brand.FRESH, dockType: DockType.REAR_DOCK, minutes: 15 },
      { brand: Brand.FRESH, dockType: DockType.STREET,    minutes: 16 },
      { brand: Brand.FRESH, dockType: DockType.MALL_BAY,  minutes: 18 },
      { brand: Brand.STYLE, dockType: DockType.REAR_DOCK, minutes: 38 },
      { brand: Brand.STYLE, dockType: DockType.STREET,    minutes: 46 },
      { brand: Brand.STYLE, dockType: DockType.MALL_BAY,  minutes: 59 },
      { brand: Brand.TECH,  dockType: DockType.REAR_DOCK, minutes: 43 },
      { brand: Brand.TECH,  dockType: DockType.STREET,    minutes: 55 },
      { brand: Brand.TECH,  dockType: DockType.MALL_BAY,  minutes: 55 },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // 3. CALENDAR (from calendar.csv — W15 to W26)
  // ─────────────────────────────────────────────────────────
  console.log('  → Calendar data...');
  const calDays = [
    // W15 (6–12 Apr)
    { date: '2026-04-06', isOperating: true,  isPayday: false, festivalRamp: 0.3,  monsoon: 1, note: 'Plan published ~6:40 PM' },
    { date: '2026-04-07', isOperating: true,  isPayday: false, festivalRamp: 0.4,  monsoon: 1, note: 'HERO DAY: inter-monsoon rain + hill fog' },
    { date: '2026-04-08', isOperating: true,  isPayday: false, festivalRamp: 0.4,  monsoon: 1 },
    { date: '2026-04-09', isOperating: true,  isPayday: false, festivalRamp: 0.5,  monsoon: 1 },
    { date: '2026-04-10', isOperating: true,  isPayday: false, festivalRamp: 0.55, monsoon: 1 },
    { date: '2026-04-11', isOperating: true,  isPayday: false, festivalRamp: 0.6,  monsoon: 1 },
    { date: '2026-04-12', isOperating: false, isPayday: false, festivalRamp: 0,    monsoon: 1, note: 'Sunday' },
    // W16 — New Year week
    { date: '2026-04-13', isOperating: false, isPayday: false, festivalRamp: 0,    monsoon: 1, festivalName: 'Sinhala & Tamil New Year' },
    { date: '2026-04-14', isOperating: false, isPayday: false, festivalRamp: 0,    monsoon: 1, festivalName: 'Sinhala & Tamil New Year Day 2' },
    { date: '2026-04-15', isOperating: true,  isPayday: false, festivalRamp: 0.2,  monsoon: 1 },
    { date: '2026-04-16', isOperating: true,  isPayday: false, festivalRamp: 0.2,  monsoon: 0 },
    { date: '2026-04-17', isOperating: true,  isPayday: false, festivalRamp: 0.15, monsoon: 0 },
    // Paydays
    { date: '2026-04-25', isOperating: true,  isPayday: true,  festivalRamp: 0.2,  monsoon: 0, note: 'Payday Saturday' },
    { date: '2026-04-30', isOperating: true,  isPayday: true,  festivalRamp: 0.2,  monsoon: 0, note: 'Payday Thursday' },
    // W18 — Vesak
    { date: '2026-05-01', isOperating: false, isPayday: false, festivalRamp: 0,    monsoon: 0, festivalName: 'Vesak Poya' },
    { date: '2026-05-25', isOperating: true,  isPayday: true,  festivalRamp: 0.15, monsoon: 0, note: 'Payday Monday' },
    { date: '2026-05-30', isOperating: true,  isPayday: true,  festivalRamp: 0.15, monsoon: 0, festivalName: 'Poson Poya (also payday Saturday)' },
  ];
  for (const d of calDays) {
    await prisma.calendar.upsert({
      where: { date: new Date(d.date) },
      update: {},
      create: {
        date: new Date(d.date),
        isOperating: d.isOperating,
        isPayday: d.isPayday,
        festivalRamp: d.festivalRamp,
        monsoon: d.monsoon,
        festivalName: d.festivalName ?? null,
        note: d.note ?? null,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. OUTLETS (from outlets.csv — 120 total, key ones explicit)
  // ─────────────────────────────────────────────────────────
  console.log('  → Outlets (120)...');
  const outlets = [
    // ── Colombo Fresh (OUT001–014) ──────────────────────────
    { id:'OUT001', name:'Waypoint Fresh Kotahena',       brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT002', name:'Waypoint Fresh Maligawatte',    brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT003', name:'Waypoint Fresh Slave Island',   brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT004', name:'Waypoint Fresh Nugegoda',       brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT005', name:'Waypoint Fresh Borella',        brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'04:00', windowClose:'07:45' },
    { id:'OUT006', name:'Waypoint Fresh Dematagoda',     brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT007', name:'Waypoint Fresh Grandpass',      brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT008', name:'Waypoint Fresh Wellawatte',     brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT009', name:'Waypoint Fresh Kollupitiya',    brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'04:00', windowClose:'07:45', accessNote:'Rear dock · lorry often blocks morning access' },
    { id:'OUT010', name:'Waypoint Fresh Kirulapone',     brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT011', name:'Waypoint Fresh Mattakkuliya',   brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT012', name:'Waypoint Fresh Narahenpita',    brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT013', name:'Waypoint Fresh Thimbirigasyaya',brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT014', name:'Waypoint Fresh Rajagiriya',     brand:Brand.FRESH, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    // ── Colombo Style/Tech (OUT015–024) ─────────────────────
    { id:'OUT015', name:'Waypoint Style One Galle Face', brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'09:00', windowClose:'11:00' },
    { id:'OUT016', name:'Waypoint Style Crescat',        brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'09:00', windowClose:'11:00' },
    { id:'OUT017', name:'Waypoint Style Majestic City',  brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'10:30', windowClose:'12:30' },
    { id:'OUT018', name:'Waypoint Style Unity Plaza',    brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'10:30', windowClose:'12:30' },
    { id:'OUT019', name:'Waypoint Style Bambalapitiya',  brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT020', name:'Waypoint Style Pettah',         brand:Brand.STYLE, district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT021', name:'Waypoint Tech Marino Mall',     brand:Brand.TECH,  district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'10:30', windowClose:'12:30' },
    { id:'OUT022', name:'Waypoint Tech Liberty Plaza',   brand:Brand.TECH,  district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'10:00', windowClose:'12:00' },
    { id:'OUT023', name:'Waypoint Tech Pettah',          brand:Brand.TECH,  district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT024', name:'Waypoint Tech Maharagama',      brand:Brand.TECH,  district:'Colombo',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    // ── Gampaha Fresh (OUT025–034) ──────────────────────────
    { id:'OUT025', name:'Waypoint Fresh Kadawatha',      brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT026', name:'Waypoint Fresh Ragama',         brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT027', name:'Waypoint Fresh Kiribathgoda',   brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT028', name:'Waypoint Fresh Ja-Ela',         brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00', accessNote:'Protected order: deferred yesterday, days_since 2' },
    { id:'OUT029', name:'Waypoint Fresh Gampaha',        brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT030', name:'Waypoint Fresh Mirigama',       brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT031', name:'Waypoint Fresh Negombo',        brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT032', name:'Waypoint Fresh Katunayake',     brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'04:00', windowClose:'07:45' },
    { id:'OUT033', name:'Waypoint Fresh Minuwangoda',    brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT034', name:'Waypoint Fresh Wattala',        brand:Brand.FRESH, district:'Gampaha',      depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Kalutara Fresh (OUT035–046) ─────────────────────────
    { id:'OUT035', name:'Waypoint Fresh Panadura',       brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT036', name:'Waypoint Fresh Kalutara Town',  brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT037', name:'Waypoint Fresh Matugama',       brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT038', name:'Waypoint Fresh Bandaragama',    brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT039', name:'Waypoint Fresh Wadduwa',        brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT040', name:'Waypoint Fresh Aluthgama',      brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT041', name:'Waypoint Fresh Beruwala',       brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT042', name:'Waypoint Fresh Horana',         brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT043', name:'Waypoint Fresh Horana South',   brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.STREET,    parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT044', name:'Waypoint Fresh Ingiriya',       brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT045', name:'Waypoint Fresh Bulathsinhala',  brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT046', name:'Waypoint Fresh Dodangoda',      brand:Brand.FRESH, district:'Kalutara',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Galle Fresh (OUT047–055) ────────────────────────────
    { id:'OUT047', name:'Waypoint Fresh Galle Fort',     brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT048', name:'Waypoint Fresh Hikkaduwa',      brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT049', name:'Waypoint Fresh Ambalangoda',    brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT050', name:'Waypoint Fresh Baddegama',      brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT051', name:'Waypoint Fresh Elpitiya',       brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT052', name:'Waypoint Fresh Karandeniya',    brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT053', name:'Waypoint Fresh Neluwa',         brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT054', name:'Waypoint Fresh Wanduramba',     brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT055', name:'Waypoint Fresh Imaduwa',        brand:Brand.FRESH, district:'Galle',        depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Matara Fresh (OUT056–062) ───────────────────────────
    { id:'OUT056', name:'Waypoint Fresh Matara Town',    brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT057', name:'Waypoint Fresh Weligama',       brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT058', name:'Waypoint Fresh Mirissa',        brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT059', name:'Waypoint Fresh Dikwella',       brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT060', name:'Waypoint Fresh Tangalle',       brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT061', name:'Waypoint Fresh Akuressa',       brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT062', name:'Waypoint Fresh Deniyaya',       brand:Brand.FRESH, district:'Matara',       depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Kurunegala Fresh (OUT063–069) ───────────────────────
    { id:'OUT063', name:'Waypoint Fresh Kurunegala',     brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT064', name:'Waypoint Fresh Kuliyapitiya',   brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT065', name:'Waypoint Fresh Wariyapola',     brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT066', name:'Waypoint Fresh Mawathagama',    brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT067', name:'Waypoint Fresh Pannala',        brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT068', name:'Waypoint Fresh Narammala',      brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT069', name:'Waypoint Fresh Nikaweratiya',   brand:Brand.FRESH, district:'Kurunegala',   depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Puttalam Fresh (OUT070–075) ─────────────────────────
    { id:'OUT070', name:'Waypoint Fresh Puttalam',       brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT071', name:'Waypoint Fresh Chilaw',         brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT072', name:'Waypoint Fresh Wennappuwa',     brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT073', name:'Waypoint Fresh Anamaduwa',      brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT074', name:'Waypoint Fresh Madurankuliya',  brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT075', name:'Waypoint Fresh Mundel',         brand:Brand.FRESH, district:'Puttalam',     depot:Depot.PELIYAGODA, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Kandy Fresh (OUT076–087) ────────────────────────────
    { id:'OUT076', name:'Waypoint Fresh Kandy City N',   brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT077', name:'Waypoint Fresh Kandy City E',   brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT078', name:'Waypoint Fresh Kandy City S',   brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT079', name:'Waypoint Fresh Kandy City W',   brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT080', name:'Waypoint Fresh Katugastota',    brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT081', name:'Waypoint Fresh Kundasale',      brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT082', name:'Waypoint Fresh Lewella',        brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT083', name:'Waypoint Fresh Ampitiya',       brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT084', name:'Waypoint Fresh Peradeniya',     brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT085', name:'Waypoint Fresh Peradeniya Rd',  brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT086', name:'Waypoint Fresh Gampola',        brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    { id:'OUT087', name:'Waypoint Fresh Pilimathalawa',  brand:Brand.FRESH, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'03:00', windowClose:'08:00' },
    // ── Kandy Style/Tech (OUT088–095) ───────────────────────
    { id:'OUT088', name:'Waypoint Style Kandy Centre',   brand:Brand.STYLE, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT089', name:'Waypoint Style Kandy City Centre',brand:Brand.STYLE,district:'Kandy',       depot:Depot.KANDY, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'10:30', windowClose:'12:30' },
    { id:'OUT090', name:'Waypoint Style Kandy Pavilion', brand:Brand.STYLE, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.MALL_BAY,  parking:ParkingType.MALL_DOCK,windowOpen:'09:00', windowClose:'11:00' },
    { id:'OUT091', name:'Waypoint Style Digana',         brand:Brand.STYLE, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT092', name:'Waypoint Style Wattegama',      brand:Brand.STYLE, district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT093', name:'Waypoint Tech Kandy',           brand:Brand.TECH,  district:'Kandy',        depot:Depot.KANDY, dockType:DockType.STREET,    parking:ParkingType.VAN_ONLY, windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT094', name:'Waypoint Tech Kandy Central',   brand:Brand.TECH,  district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    { id:'OUT095', name:'Waypoint Tech Peradeniya',      brand:Brand.TECH,  district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
    // ── Matale Fresh (OUT096–101) ───────────────────────────
    { id:'OUT096', name:'Waypoint Fresh Matale Town',    brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT097', name:'Waypoint Fresh Dambulla',       brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT098', name:'Waypoint Fresh Galewela',       brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT099', name:'Waypoint Fresh Ukuwela',        brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    { id:'OUT100', name:'Waypoint Fresh Rattota',        brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT101', name:'Waypoint Fresh Naula',          brand:Brand.FRESH, district:'Matale',       depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Nuwara Eliya Fresh (OUT102–109) — HERO OUTLETS ──────
    { id:'OUT102', name:'Waypoint Fresh Nuwara Eliya N', brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT103', name:'Waypoint Fresh Nuwara Eliya S', brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT104', name:'Waypoint Fresh Nuwara Eliya E', brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT105', name:'Waypoint Fresh Nuwara Eliya W', brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:30', windowClose:'08:00' },
    {
      id:'OUT106',
      name:'Waypoint Fresh Nuwara Eliya',
      brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY,
      dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,
      windowOpen:'05:30', windowClose:'08:00',
      accessNote:'Rear dock · normal access · enter via the Lawson St service lane; dock door opens 5:30',
    },
    { id:'OUT107', name:'Waypoint Fresh Kandapola',      brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    {
      id:'OUT108',
      name:'Waypoint Fresh Hawa Eliya',
      brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY,
      dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,
      windowOpen:'04:00', windowClose:'07:45',
      accessNote:'Rear dock · normal access',
    },
    { id:'OUT109', name:'Waypoint Fresh Ambewela',       brand:Brand.FRESH, district:'Nuwara Eliya', depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Badulla Fresh (OUT110–113) ──────────────────────────
    { id:'OUT110', name:'Waypoint Fresh Badulla Town',   brand:Brand.FRESH, district:'Badulla',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT111', name:'Waypoint Fresh Bandarawela',    brand:Brand.FRESH, district:'Badulla',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT112', name:'Waypoint Fresh Haputale',       brand:Brand.FRESH, district:'Badulla',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT113', name:'Waypoint Fresh Welimada',       brand:Brand.FRESH, district:'Badulla',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Kegalle Fresh (OUT114–119) ──────────────────────────
    { id:'OUT114', name:'Waypoint Fresh Kegalle',        brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT115', name:'Waypoint Fresh Mawanella',      brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT116', name:'Waypoint Fresh Rambukkana',     brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT117', name:'Waypoint Fresh Warakapola',     brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT118', name:'Waypoint Fresh Ruwanwella',     brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    { id:'OUT119', name:'Waypoint Fresh Deraniyagala',   brand:Brand.FRESH, district:'Kegalle',      depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'05:00', windowClose:'07:30' },
    // ── Kandy Tech (OUT120) ─────────────────────────────────
    { id:'OUT120', name:'Waypoint Tech Kandy Hub',       brand:Brand.TECH,  district:'Kandy',        depot:Depot.KANDY, dockType:DockType.REAR_DOCK, parking:ParkingType.NORMAL,   windowOpen:'09:00', windowClose:'17:00' },
  ];

  for (const o of outlets) {
    await prisma.outlet.upsert({ where: { id: o.id }, update: {}, create: o });
  }
  console.log(`  → ${outlets.length} outlets created`);

  // ─────────────────────────────────────────────────────────
  // 5. VEHICLES (from vehicles.csv — 60 total)
  // ─────────────────────────────────────────────────────────
  console.log('  → Vehicles (60)...');
  const vehicles = [
    // Peliyagoda reefer trucks (VEH001–007)
    { id:'VEH001', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:6180, capacityM3:29.9, kmPerLitre:5.0, weeklyLFuel:370, status:VehicleStatus.AVAILABLE },
    { id:'VEH002', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:3990, capacityM3:21.1, kmPerLitre:6.1, weeklyLFuel:610, status:VehicleStatus.AVAILABLE },
    { id:'VEH003', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:5510, capacityM3:26.4, kmPerLitre:4.7, weeklyLFuel:380, status:VehicleStatus.AVAILABLE },
    { id:'VEH004', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:6840, capacityM3:33.4, kmPerLitre:4.4, weeklyLFuel:380, status:VehicleStatus.WORKSHOP,   workshopNote:'Reefer compressor failure — in workshop Tue 7 Apr' },
    { id:'VEH005', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:6840, capacityM3:33.4, kmPerLitre:4.4, weeklyLFuel:490, status:VehicleStatus.AVAILABLE },
    { id:'VEH006', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:6840, capacityM3:33.4, kmPerLitre:4.4, weeklyLFuel:380, status:VehicleStatus.AVAILABLE },
    { id:'VEH007', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED,  capacityKg:5510, capacityM3:26.4, kmPerLitre:4.7, weeklyLFuel:400, status:VehicleStatus.AVAILABLE },
    // Peliyagoda dry-box trucks (VEH008–034)
    { id:'VEH008', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH009', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH010', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH011', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH012', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH013', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH014', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH015', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH016', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH017', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH018', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH019', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH020', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH021', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.WORKSHOP,   workshopNote:'Gearbox repair — in workshop Tue 7 Apr' },
    { id:'VEH022', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH023', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH024', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH025', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH026', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH027', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH028', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH029', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH030', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.WORKSHOP,   workshopNote:'Brake service — in workshop Tue 7 Apr' },
    { id:'VEH031', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH032', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH033', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH034', depot:Depot.PELIYAGODA, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT,  capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    // Peliyagoda reefer vans (VEH035–036)
    { id:'VEH035', depot:Depot.PELIYAGODA, type:VehicleType.VAN,   tempClass:TempClass.CHILLED,  capacityKg:1040, capacityM3:7.0,  kmPerLitre:10.3, weeklyLFuel:480, status:VehicleStatus.AVAILABLE },
    { id:'VEH036', depot:Depot.PELIYAGODA, type:VehicleType.VAN,   tempClass:TempClass.CHILLED,  capacityKg:1040, capacityM3:7.0,  kmPerLitre:10.3, weeklyLFuel:480, status:VehicleStatus.AVAILABLE },
    // Peliyagoda ambient vans (VEH037–038)
    { id:'VEH037', depot:Depot.PELIYAGODA, type:VehicleType.VAN,   tempClass:TempClass.AMBIENT,  capacityKg:1100, capacityM3:8.0,  kmPerLitre:11.5, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH038', depot:Depot.PELIYAGODA, type:VehicleType.VAN,   tempClass:TempClass.AMBIENT,  capacityKg:1100, capacityM3:8.0,  kmPerLitre:11.5, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    // Kandy reefer trucks (VEH039–043)
    { id:'VEH039', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED, capacityKg:6180, capacityM3:29.9, kmPerLitre:5.0, weeklyLFuel:370, status:VehicleStatus.AVAILABLE },
    { id:'VEH040', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED, capacityKg:5510, capacityM3:26.4, kmPerLitre:4.7, weeklyLFuel:380, status:VehicleStatus.AVAILABLE },
    { id:'VEH041', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED, capacityKg:3610, capacityM3:19.4, kmPerLitre:6.4, weeklyLFuel:600, status:VehicleStatus.AVAILABLE },
    { id:'VEH042', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED, capacityKg:6180, capacityM3:29.9, kmPerLitre:5.0, weeklyLFuel:370, status:VehicleStatus.AVAILABLE },
    { id:'VEH043', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.CHILLED, capacityKg:5510, capacityM3:26.4, kmPerLitre:4.7, weeklyLFuel:380, status:VehicleStatus.AVAILABLE },
    // Kandy dry trucks (VEH044–056)
    { id:'VEH044', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH045', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH046', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH047', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH048', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH049', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH050', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH051', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH052', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH053', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:6500, capacityM3:34.0, kmPerLitre:4.6, weeklyLFuel:510, status:VehicleStatus.AVAILABLE },
    { id:'VEH054', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:7200, capacityM3:38.0, kmPerLitre:4.9, weeklyLFuel:530, status:VehicleStatus.AVAILABLE },
    { id:'VEH055', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:3800, capacityM3:22.0, kmPerLitre:7.1, weeklyLFuel:580, status:VehicleStatus.AVAILABLE },
    { id:'VEH056', depot:Depot.KANDY, type:VehicleType.TRUCK, tempClass:TempClass.AMBIENT, capacityKg:4200, capacityM3:24.0, kmPerLitre:6.8, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    // Kandy reefer vans (VEH057–058) — HERO VEHICLE
    {
      id:'VEH057', depot:Depot.KANDY, type:VehicleType.VAN, tempClass:TempClass.CHILLED,
      capacityKg:1040, capacityM3:7.0, kmPerLitre:10.3, weeklyLFuel:450,
      usedLThisWeek:298, // 298 L used before hero trip; trip adds ~17 L → 315/450 L
      status:VehicleStatus.AVAILABLE,
    },
    { id:'VEH058', depot:Depot.KANDY, type:VehicleType.VAN, tempClass:TempClass.CHILLED, capacityKg:1040, capacityM3:7.0, kmPerLitre:10.3, weeklyLFuel:550, status:VehicleStatus.AVAILABLE },
    // Kandy ambient vans (VEH059–060)
    { id:'VEH059', depot:Depot.KANDY, type:VehicleType.VAN, tempClass:TempClass.AMBIENT, capacityKg:1100, capacityM3:8.0, kmPerLitre:11.5, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
    { id:'VEH060', depot:Depot.KANDY, type:VehicleType.VAN, tempClass:TempClass.AMBIENT, capacityKg:1100, capacityM3:8.0, kmPerLitre:11.5, weeklyLFuel:340, status:VehicleStatus.AVAILABLE },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { id: v.id }, update: {}, create: v });
  }
  console.log(`  → ${vehicles.length} vehicles created`);

  // ─────────────────────────────────────────────────────────
  // 6. USERS
  // ─────────────────────────────────────────────────────────
  console.log('  → Users...');
  const userHash  = await bcrypt.hash(USER_PWD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PWD, 10);

  const nilanthi = await prisma.user.upsert({
    where: { email: 'nilanthi@waypoint.lk' },
    update: {},
    create: {
      email: 'nilanthi@waypoint.lk',
      name: 'Nilanthi Perera',
      passwordHash: userHash,
      role: Role.DISPATCHER,
      depot: Depot.PELIYAGODA,
      phone: '+94771234567',
    },
  });
  const kasun = await prisma.user.upsert({
    where: { email: 'kasun@waypoint.lk' },
    update: {},
    create: {
      email: 'kasun@waypoint.lk',
      name: 'Kasun Jayawardena',
      passwordHash: userHash,
      role: Role.LOADER,
      depot: Depot.KANDY,
      phone: '+94772345678',
    },
  });
  const ruwan = await prisma.user.upsert({
    where: { email: 'ruwan@waypoint.lk' },
    update: {},
    create: {
      email: 'ruwan@waypoint.lk',
      name: 'Ruwan Bandara',
      passwordHash: userHash,
      role: Role.DRIVER,
      depot: Depot.KANDY,
      phone: '+94773456789',
    },
  });
  const fathima = await prisma.user.upsert({
    where: { email: 'fathima@waypoint.lk' },
    update: {},
    create: {
      email: 'fathima@waypoint.lk',
      name: 'Fathima Rizwan',
      passwordHash: userHash,
      role: Role.STORE_MANAGER,
      outletId: 'OUT106',
      phone: '+94774567890',
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@waypoint.lk' },
    update: {},
    create: {
      email: 'admin@waypoint.lk',
      name: 'Lodestar Admin',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });
  console.log('  → 5 users created');

  // ─────────────────────────────────────────────────────────
  // 7. HERO ORDERS (Fathima orders Mon 6 Apr 2:38 PM)
  // ─────────────────────────────────────────────────────────
  console.log('  → Hero orders + line items...');

  // ORD0104216 — OUT106, ambient dry, 58 units, 452 kg, 2.2 m3
  const ord216 = await prisma.order.upsert({
    where: { id: 'ORD0104216' },
    update: {},
    create: {
      id: 'ORD0104216',
      outletId: 'OUT106',
      runDate: SCENARIO_DAY,
      orderedAt: ORDER_TIME,
      brand: Brand.FRESH,
      tempClass: TempClass.AMBIENT,
      units: 58,
      kg: 452,
      m3: 2.2,
      status: OrderStatus.PLANNED,
    },
  });
  // Line items for ORD0104216 (9 lines)
  await prisma.orderLineItem.createMany({
    skipDuplicates: true,
    data: [
      { orderId: 'ORD0104216', name: 'Samba rice 5 kg', qty: 14, kg: 70,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Soap bars',        qty: 6,  kg: 30,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Red dhal',         qty: 5,  kg: 100, tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Coconut oil',      qty: 6,  kg: 66,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Wheat flour',      qty: 4,  kg: 80,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Sugar',            qty: 2,  kg: 40,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Biscuits',         qty: 10, kg: 36,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Tea',              qty: 5,  kg: 15,  tempClass: TempClass.AMBIENT },
      { orderId: 'ORD0104216', name: 'Noodles',          qty: 6,  kg: 15,  tempClass: TempClass.AMBIENT },
    ],
  });

  // ORD0104217 — OUT106, chilled, 34 units, 296 kg, 1.3 m3
  const ord217 = await prisma.order.upsert({
    where: { id: 'ORD0104217' },
    update: {},
    create: {
      id: 'ORD0104217',
      outletId: 'OUT106',
      runDate: SCENARIO_DAY,
      orderedAt: ORDER_TIME,
      brand: Brand.FRESH,
      tempClass: TempClass.CHILLED,
      units: 34,
      kg: 296,
      m3: 1.3,
      status: OrderStatus.PLANNED,
      notes: 'Shortfall: yoghurt 80g x24 — 2 of 6 cases short (stock), ack 3:24 AM',
    },
  });
  await prisma.orderLineItem.createMany({
    skipDuplicates: true,
    data: [
      { orderId: 'ORD0104217', name: 'Yoghurt 80g',      qty: 6,  kg: 36,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Fresh milk',        qty: 8,  kg: 72,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Whole chicken 1kg', qty: 6,  kg: 60,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Chicken sausages',  qty: 4,  kg: 40,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Butter',            qty: 3,  kg: 18,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Cheese slices',     qty: 3,  kg: 30,  tempClass: TempClass.CHILLED },
      { orderId: 'ORD0104217', name: 'Flavoured milk',    qty: 4,  kg: 40,  tempClass: TempClass.CHILLED },
    ],
  });

  // ORD0104209 — OUT108, chilled, 28 units, 240 kg, 1.1 m3
  const ord209 = await prisma.order.upsert({
    where: { id: 'ORD0104209' },
    update: {},
    create: {
      id: 'ORD0104209',
      outletId: 'OUT108',
      runDate: SCENARIO_DAY,
      orderedAt: ORDER_TIME,
      brand: Brand.FRESH,
      tempClass: TempClass.CHILLED,
      units: 28,
      kg: 240,
      m3: 1.1,
      status: OrderStatus.PLANNED,
    },
  });

  // Suggested deferrals (with scores)
  await prisma.order.upsert({
    where: { id: 'ORD0104188' },
    update: {},
    create: {
      id: 'ORD0104188',
      outletId: 'OUT027', // Kiribathgoda
      runDate: SCENARIO_DAY,
      orderedAt: new Date('2026-04-06T07:00:00.000Z'),
      brand: Brand.FRESH,
      tempClass: TempClass.CHILLED,
      units: 12, kg: 90, m3: 1.6,
      status: OrderStatus.DEFERRED,
      deferredYesterday: false,
      daysSince: 1,
      deferralScore: 22,
    },
  });
  await prisma.order.upsert({
    where: { id: 'ORD0104195' },
    update: {},
    create: {
      id: 'ORD0104195',
      outletId: 'OUT043', // Horana South
      runDate: SCENARIO_DAY,
      orderedAt: new Date('2026-04-06T07:30:00.000Z'),
      brand: Brand.FRESH,
      tempClass: TempClass.CHILLED,
      units: 10, kg: 72, m3: 0.9,
      status: OrderStatus.DEFERRED,
      deferredYesterday: false,
      daysSince: 1,
      deferralScore: 27,
    },
  });
  // Protected order (Ja-Ela, deferred_yesterday 1, protected)
  await prisma.order.upsert({
    where: { id: 'ORD0104173' },
    update: {},
    create: {
      id: 'ORD0104173',
      outletId: 'OUT028', // Ja-Ela
      runDate: SCENARIO_DAY,
      orderedAt: new Date('2026-04-05T09:00:00.000Z'),
      brand: Brand.FRESH,
      tempClass: TempClass.CHILLED,
      units: 15, kg: 120, m3: 1.5,
      status: OrderStatus.PLANNED,
      deferredYesterday: true,
      daysSince: 2,
      deferralScore: 91,
      notes: 'PROTECTED: deferred_yesterday 1, days_since 2 — must deliver today',
    },
  });

  console.log('  → Hero orders created');

  // ─────────────────────────────────────────────────────────
  // 8. HERO TRIP (VEH057, Ruwan, Kandy Hub, Fresh · Nuwara Eliya)
  // ─────────────────────────────────────────────────────────
  console.log('  → Hero trip VEH057...');

  // Times (all UTC — IST = UTC+5:30)
  const t = (h: number, m: number) => {
    const d = new Date(SCENARIO_DAY);
    d.setUTCHours(h - 5, m - 30, 0, 0); // convert IST to UTC
    if (d.getUTCHours() < 0) { d.setUTCDate(d.getUTCDate() - 1); d.setUTCHours(d.getUTCHours() + 24); }
    return d;
  };
  // IST times for hero thread:
  // Departs 3:40 AM → UTC 22:10 prev day
  // Signal lost 4:38 → UTC 23:08 prev day
  // Model ETA OUT106: 6:35, band 6:15-6:55 → UTC 01:05, band 00:45-01:25
  // Actual arrival OUT106: 6:33 → UTC 01:03
  // Signal back 8:40 → UTC 03:10

  const existingTrip = await prisma.trip.findFirst({ where: { vehicleId: 'VEH057', runDate: SCENARIO_DAY } });
  if (!existingTrip) {
    const heroTrip = await prisma.trip.create({
      data: {
        vehicleId: 'VEH057',
        driverId: ruwan.id,
        depot: Depot.KANDY,
        runDate: SCENARIO_DAY,
        brand: Brand.FRESH,
        district: 'Nuwara Eliya',
        status: TripStatus.COMPLETE,
        planVersion: 3, // v3 published Mon 6 Apr 6:40 PM
        tripNumber: 1,
        bay: 'K2',
        sealNumber: 'KDY-57-10413',
        reeferTempC: 3.0,
        planMinutes: 196,
        actualMinutes: 241,
        departTime: new Date('2026-04-06T22:10:00.000Z'), // 3:40 AM IST
        returnTime: new Date('2026-04-07T04:02:00.000Z'), // 9:32 AM IST
      },
    });

    // Stop 1: OUT106 Nuwara Eliya — orders ORD0104216 + ORD0104217
    // Two orders at one outlet → two tripStops with same outlet, different orders
    await prisma.tripStop.create({
      data: {
        tripId: heroTrip.id,
        orderId: 'ORD0104216',
        outletId: 'OUT106',
        stopSeq: 1,
        // Plan ETA 5:31 AM IST
        etaPlan:           new Date('2026-04-07T00:01:00.000Z'),
        // Model ETA 6:35 AM IST (band 6:15–6:55)
        etaModel:          new Date('2026-04-07T01:05:00.000Z'),
        etaModelBandEarly: new Date('2026-04-07T00:45:00.000Z'),
        etaModelBandLate:  new Date('2026-04-07T01:25:00.000Z'),
        lateRiskPct:       12,
        serviceMinPredicted: 29,
        arrivalActual:     new Date('2026-04-07T01:03:00.000Z'), // 6:33 AM IST
        leaveActual:       new Date('2026-04-07T01:32:00.000Z'), // 7:02 AM IST
        status:            OrderStatus.DELIVERED,
        pod: {
          create: {
            unitsDelivered: 58,
            unitsOrdered:   58,
            receiverName:   'M. Ilyas',
            photoUrl:       '/uploads/pod-ord0104216.jpg',
            savedOffline:   false,
            savedAt:        new Date('2026-04-07T01:28:00.000Z'), // 6:58 AM IST
            syncedAt:       new Date('2026-04-07T03:10:00.000Z'), // 8:40 AM IST
          },
        },
      },
    });
    await prisma.tripStop.create({
      data: {
        tripId: heroTrip.id,
        orderId: 'ORD0104217',
        outletId: 'OUT106',
        stopSeq: 1,
        etaPlan:           new Date('2026-04-07T00:01:00.000Z'),
        etaModel:          new Date('2026-04-07T01:05:00.000Z'),
        etaModelBandEarly: new Date('2026-04-07T00:45:00.000Z'),
        etaModelBandLate:  new Date('2026-04-07T01:25:00.000Z'),
        lateRiskPct:       12,
        serviceMinPredicted: 29,
        arrivalActual:     new Date('2026-04-07T01:03:00.000Z'),
        leaveActual:       new Date('2026-04-07T01:32:00.000Z'),
        status:            OrderStatus.DELIVERED,
        pod: {
          create: {
            unitsDelivered: 31,   // 34 ordered — 2 yoghurt short + 1 chicken damaged
            unitsOrdered:   34,
            receiverName:   'M. Ilyas',
            photoUrl:       '/uploads/pod-ord0104217.jpg',
            exceptions:     [
              { type: 'SHORT', description: 'Yoghurt 80g: 2 of 6 cases not loaded (stock shortfall acknowledged 3:24 AM)', photoUrl: null },
              { type: 'DAMAGED', description: 'Whole chicken 1kg tray x1 — packaging damaged, photo taken 6:57 AM', photoUrl: '/uploads/dmg-ord0104217-chicken.jpg' },
            ],
            creditNoteId:   'CN-2604-0441',
            savedOffline:   true,   // saved offline at 6:58 AM (above Ramboda, no signal)
            savedAt:        new Date('2026-04-07T01:28:00.000Z'),
            syncedAt:       new Date('2026-04-07T03:10:00.000Z'), // synced 8:40 AM
          },
        },
      },
    });

    // Stop 2: OUT108 Hawa Eliya — order ORD0104209
    await prisma.tripStop.create({
      data: {
        tripId: heroTrip.id,
        orderId: 'ORD0104209',
        outletId: 'OUT108',
        stopSeq: 2,
        // Plan ETA 6:21 AM IST
        etaPlan:           new Date('2026-04-07T00:51:00.000Z'),
        // Model ETA 7:25 AM IST (window closes 7:45 AM)
        etaModel:          new Date('2026-04-07T01:55:00.000Z'),
        etaModelBandEarly: new Date('2026-04-07T01:45:00.000Z'),
        etaModelBandLate:  new Date('2026-04-07T02:10:00.000Z'),
        lateRiskPct:       61, // 18% normal, 61% during blackout
        serviceMinPredicted: 15,
        arrivalActual:     new Date('2026-04-07T01:56:00.000Z'), // 7:26 AM IST
        leaveActual:       new Date('2026-04-07T02:11:00.000Z'), // 7:41 AM IST
        status:            OrderStatus.DELIVERED,
        pod: {
          create: {
            unitsDelivered: 28,
            unitsOrdered:   28,
            receiverName:   'Store staff',
            photoUrl:       '/uploads/pod-ord0104209.jpg',
            savedOffline:   true,
            savedAt:        new Date('2026-04-07T01:57:00.000Z'), // 7:27 AM IST offline
            syncedAt:       new Date('2026-04-07T03:10:00.000Z'), // 8:40 AM IST
          },
        },
      },
    });

    // Load record for hero trip
    await prisma.loadRecord.create({
      data: {
        tripId:     heroTrip.id,
        vehicleId:  'VEH057',
        loaderId:   kasun.id,
        bay:        'K2',
        sealNumber: 'KDY-57-10413',
        reeferTempC: 3.0,
        loadedAt:   new Date('2026-04-06T22:04:00.000Z'), // 3:34 AM IST (loading done)
        releasedAt: new Date('2026-04-06T22:10:00.000Z'), // 3:40 AM IST (departs)
        shortfalls: [
          {
            item: 'Yoghurt 80g',
            qtyOrdered: 6,
            qtyLoaded: 4,
            reason: 'Stock shortfall — 2 cases unavailable at 3:21 AM, ack 3:24 AM',
          },
        ],
      },
    });

    // Offline events (degradation A — signal lost 4:38 AM, back 8:40 AM)
    await prisma.offlineEvent.createMany({
      skipDuplicates: false,
      data: [
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'STATUS_CHANGE',
          payload:   { status: 'SIGNAL_LOST', location: 'Above Ramboda', note: 'Coverage drops above Ramboda pass' },
          savedAt:   new Date('2026-04-06T23:08:00.000Z'), // 4:38 AM IST
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: false,
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'ARRIVAL',
          payload:   { stopSeq: 1, outletId: 'OUT106', time: '2026-04-07T01:03:00.000Z' },
          savedAt:   new Date('2026-04-07T01:03:00.000Z'),
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: false,
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'POD_SAVE',
          payload:   { orderId: 'ORD0104216', units: 58, offline: true },
          savedAt:   new Date('2026-04-07T01:28:00.000Z'),
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: false,
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'POD_SAVE',
          payload:   { orderId: 'ORD0104217', units: 31, offline: true, exceptions: ['SHORT:yoghurt', 'DAMAGED:chicken'] },
          savedAt:   new Date('2026-04-07T01:28:00.000Z'),
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: true,
          conflictNote: 'Field evidence wins; correction applied to OUT108 provisional deferral',
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'ARRIVAL',
          payload:   { stopSeq: 2, outletId: 'OUT108', time: '2026-04-07T01:56:00.000Z' },
          savedAt:   new Date('2026-04-07T01:56:00.000Z'),
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: true,
          conflictNote: 'Provisional deferral reversed; OUT108 confirmed delivered',
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'POD_SAVE',
          payload:   { orderId: 'ORD0104209', units: 28, offline: true },
          savedAt:   new Date('2026-04-07T01:57:00.000Z'),
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: false,
        },
        {
          driverId:  ruwan.id,
          tripId:    heroTrip.id,
          eventType: 'STATUS_CHANGE',
          payload:   { status: 'SIGNAL_BACK', location: 'Near Pussellawa (descent)', recordsQueued: 7 },
          savedAt:   new Date('2026-04-07T03:10:00.000Z'), // 8:40 AM IST
          syncedAt:  new Date('2026-04-07T03:10:00.000Z'),
          conflictResolved: false,
        },
      ],
    });

    console.log('  → Hero trip + stops + PODs + offline events created');
  }

  // ─────────────────────────────────────────────────────────
  // 9. DEFERRAL LOGS
  // ─────────────────────────────────────────────────────────
  await prisma.deferralLog.upsert({
    where: { orderId: 'ORD0104188' },
    update: {},
    create: {
      orderId: 'ORD0104188',
      reason: 'CAP_REEFER',
      score: 22,
      resolvedBy: nilanthi.id,
      notes: 'Chilled capacity short 8.6 m3 — auto-suggested, Nilanthi confirmed',
      rescheduledDate: new Date('2026-04-08'),
    },
  });
  await prisma.deferralLog.upsert({
    where: { orderId: 'ORD0104195' },
    update: {},
    create: {
      orderId: 'ORD0104195',
      reason: 'CAP_REEFER',
      score: 27,
      resolvedBy: nilanthi.id,
      notes: 'Chilled capacity short — Horana is a lower priority (days_since 1)',
      rescheduledDate: new Date('2026-04-08'),
    },
  });

  // Provisional deferral (set during blackout, reversed after sync)
  const ord209Stop = await prisma.tripStop.findFirst({ where: { orderId: 'ORD0104209' } });
  if (ord209Stop) {
    // No deferral log for OUT108 — it was reversed after sync
  }

  console.log('\n✅ Seed complete!');
  console.log('   Scenario: Tue 7 Apr 2026 (ISO W15, monsoon 1, festival_ramp 0.4)');
  console.log('   Hero thread: VEH057 → OUT106 (6:33 actual) → OUT108 (7:26 actual)');
  console.log('   Offline: 4:38–8:40 (4h 02m) · 7 records synced · CN-2604-0441 issued');
  console.log('\n   Login credentials:');
  console.log(`   Nilanthi (DISPATCHER): nilanthi@waypoint.lk / ${USER_PWD}`);
  console.log(`   Kasun    (LOADER):     kasun@waypoint.lk    / ${USER_PWD}`);
  console.log(`   Ruwan    (DRIVER):     ruwan@waypoint.lk    / ${USER_PWD}`);
  console.log(`   Fathima  (STORE_MGR):  fathima@waypoint.lk  / ${USER_PWD}`);
  console.log(`   Admin:                 admin@waypoint.lk    / ${ADMIN_PWD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
