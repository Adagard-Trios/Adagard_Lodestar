'use client';
// Data for the settings and trust screens: the signed-in user's own preferences (auth Users/Lodestar.MyPreferences,
// SaveMyPreferences), their 2-step verification status (Users/Lodestar.MyTwoFactor), the planning agent's model
// and guardrails (planning AgentRuns/Lodestar.AgentConfig, from the agent's GET /config) and the reference-data
// imports (outlets DataImports, Lodestar.Import).
import { useCallback } from 'react';
import { valueOf } from '@/lib/odata/client';
import { useAction, useQuery } from '@/lib/odata/hooks';

/** Alert rules (DSP-20, DSP-33 on the phone): what wakes the dispatcher and how. */
export interface AlertRules {
  vehicleFault?: { push?: boolean; sms?: boolean };
  lateRisk?: { push?: boolean; threshold?: number; risingOnly?: boolean };
  flags?: { push?: boolean };
  silence?: { push?: boolean; call?: boolean; minutes?: number };
  signalZones?: { alert?: boolean };
}

/** SM-30 notification topics: app and SMS per topic. */
export type StoreTopic = 'arrivalWindow' | 'vanOnTheWay' | 'cutoffReminder' | 'creditNotes';
export type Channels = { app?: boolean; sms?: boolean };

export interface ReceivingStaff {
  name: string;
  phone?: string;
  note?: string;
}

export interface Preferences {
  alerts?: AlertRules;
  onCall?: { from?: string; to?: string };
  notifications?: Partial<Record<StoreTopic, Channels>>;
  receiving?: { staffFrom?: string; staff?: ReceivingStaff[] };
  language?: 'en' | 'si' | 'ta';
  board?: Record<string, unknown>;
}

export function usePreferences() {
  const q = useQuery<Preferences>('my-preferences', async c => valueOf<Preferences>(await c.fn('Users', null, 'MyPreferences')) ?? {});
  const save = useAction(async (c, patch: Preferences) => valueOf<Preferences>(await c.action('Users', null, 'SaveMyPreferences', { preferences: patch as never })), {
    onSuccess: r => q.setData(r ?? {}),
  });
  return { ...q, save };
}

export interface TwoFactor {
  available: boolean;
  enabled: boolean;
  setupRequired: boolean;
  otp: Array<{ label: string | null; createdAt: string | null }>;
}

export const useTwoFactor = () => useQuery<TwoFactor>('my-two-factor', async c => valueOf<TwoFactor>(await c.fn('Users', null, 'MyTwoFactor')));

export interface AgentConfig {
  model: { setting: string; provider: string; label: string; configured: boolean; deployment: string | null; endpointHost: string | null; missing: string[] };
  fallback: string;
  humanApproval: boolean;
  canPublish: boolean;
  maxRedrafts: number;
  firstDeparture: string;
  limits: { maxTripsPerVehicle: number; freshMinutesBudget: number; otherMinutesBudget: number; protectedScore: number; deferralCandidateBelow: number; defaultServiceMin: number };
  rules: Array<{ rule: string; label: string }>;
  reasonCodes: string[];
  reads: string[];
  askTools: string[];
  decisions: string[];
  decidedBy: string;
}

export const useAgentConfig = () => useQuery<AgentConfig>('agent-config', async c => valueOf<AgentConfig>(await c.fn('AgentRuns', null, 'AgentConfig')));

export type ImportFile = 'outlets' | 'vehicles' | 'calendar' | 'district_travel' | 'service_allowance';

export interface ImportProblem {
  row: number;
  key: string | null;
  column: string | null;
  value: string | null;
  reason: string;
}

export interface DataImport {
  id: string;
  file: ImportFile;
  fileName?: string | null;
  rows: number;
  passed: number;
  applied: boolean;
  created: number;
  updated: number;
  problems: ImportProblem[];
  checks: Array<{ label: string; passed: boolean; detail: string }>;
  importedBy: string;
  byName?: string | null;
  importedAt: string;
}

/** The reference files an admin can replace (ADM-14), in the design's order, with the set that holds their rows. */
export const IMPORT_FILES: Array<{ file: ImportFile; csv: string; what: string; set: string; icon: 'store' | 'truck' | 'calendar' | 'navigate' | 'clock' }> = [
  { file: 'outlets', csv: 'outlets.csv', what: 'Outlet master: dock type, access, windows', set: 'Outlets', icon: 'store' },
  { file: 'vehicles', csv: 'vehicles.csv', what: 'Fleet: type, reefer, capacity, fuel quota', set: 'Vehicles', icon: 'truck' },
  { file: 'calendar', csv: 'calendar.csv', what: 'Operating days, holidays, ramps, monsoon', set: 'Calendar', icon: 'calendar' },
  { file: 'district_travel', csv: 'district_travel.csv', what: 'Depot to district and inter-stop times', set: 'DistrictTravel', icon: 'navigate' },
  { file: 'service_allowance', csv: 'service_allowance.csv', what: 'Minutes per stop by brand and dock', set: 'ServiceAllowances', icon: 'clock' },
];

/** Guesses the import from a file name ("outlets_2026-04-07.csv" → outlets). */
export function importFileOf(name: string): ImportFile | null {
  const n = name.toLowerCase().replace(/[\s-]+/g, '_');
  if (n.includes('service_allowance') || n.includes('allowance')) return 'service_allowance';
  if (n.includes('district')) return 'district_travel';
  if (n.includes('calendar')) return 'calendar';
  if (n.includes('vehicle') || n.includes('fleet')) return 'vehicles';
  if (n.includes('outlet')) return 'outlets';
  return null;
}

/** A picked file's text: Blob.text() where the browser has it, a FileReader otherwise (older engines, jsdom). */
export function readText(f: Blob): Promise<string> {
  if (typeof f.text === 'function') return f.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error ?? new Error('Could not read the file'));
    r.readAsText(f);
  });
}

export function useImportCsv(onDone?: (r: DataImport) => void) {
  const run = useAction(
    async (c, p: { file: ImportFile; csv: string; fileName: string }) => valueOf<DataImport>(await c.action('DataImports', null, 'Import', p)),
    { onSuccess: r => onDone?.(r) },
  );
  /** Reads a picked file in the browser and sends its text; nothing is kept on the client after the call. */
  const upload = useCallback(
    async (f: File, file: ImportFile) => {
      const csv = await readText(f);
      return run.run({ file, csv, fileName: f.name });
    },
    [run],
  );
  return { ...run, upload };
}
