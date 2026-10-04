import { Injectable, Logger } from '@nestjs/common';

/**
 * Client of the internal ML service (backend/apps/ml): the Adagard datathon models for stop service time and late
 * risk (POST /predict/stops) and weekly demand (POST /forecast/weeks).
 *
 * The models are an improvement, never a dependency: ML_URL unset means disabled, and any failure (timeout,
 * connection refused, 503 "model not loaded", 422 "outside what the model knows") returns null so the caller
 * keeps its heuristic. A failure is logged once per outage (again only after a success), not on every call.
 */

/** One planned stop, as the ML service reads it (Lodestar codes; the service maps them to the training ones). */
export interface MlStop {
  stopId: string;
  /** stops of one route are scored together; seq runs 0..n-1 within it */
  routeId: string;
  seq: number;
  /** run date YYYY-MM-DD */
  date: string;
  orderDate?: string | null;
  deferred?: boolean;
  outletId: string;
  brand: string;
  district: string;
  depot: string;
  dockType: string;
  parking: string;
  mallWindow?: string | null;
  windowOpen: string;
  windowClose: string;
  tempRequirement: string;
  units: number;
  kg: number;
  m3: number;
  vehicleId: string;
  vehicleType: string;
  vehicleTemp: string;
  capacityKg: number;
  capacityM3: number;
  kmPerLitre?: number | null;
  weeklyFuelL?: number | null;
  /** Colombo HH:MM */
  plannedDepart: string;
  plannedArrive: string;
  plannedTravelMin: number;
  distanceKm?: number | null;
  roadClass?: string | null;
  depotToDistrictKm?: number | null;
  depotToDistrictMin?: number | null;
  interStopMin?: number | null;
  serviceAllowanceMin: number;
  monsoon?: number;
  isPayday?: boolean;
  festivalRamp?: number;
}

export interface MlStopPrediction {
  stopId: string;
  serviceMin: number;
  /** P(arrival after the window closes), 0..1 */
  lateProb: number;
  /** simulated median arrival, minutes after midnight (Colombo) */
  etaMin: number | null;
  etaP90Min: number | null;
}

export interface MlWeek {
  depot: string;
  brand: string;
  isoYear: number;
  isoWeek: number;
}

export interface MlCalendarDay {
  date: string;
  isOperating: boolean;
  isPayday?: boolean;
  festivalRamp?: number;
  festivalName?: string | null;
  monsoon?: number;
}

export interface MlWeekForecast extends MlWeek {
  weekStart: string;
  horizon: number;
  totalM3: number;
  chilledM3: number;
  calendarFrom: 'request' | 'history';
}

@Injectable()
export class MlClient {
  private readonly logger = new Logger(MlClient.name);
  /** the ML service's address comes from configuration (ML_URL), never from code; empty = disabled */
  baseUrl = (process.env.ML_URL ?? '').replace(/\/$/, '');
  timeoutMs = Number(process.env.ML_TIMEOUT_MS ?? 8_000);
  private failing = false;

  get enabled(): boolean {
    return !!this.baseUrl;
  }

  /** Model predictions by stopId, or null (disabled or failed: use the heuristic). */
  async predictStops(stops: MlStop[]): Promise<Map<string, MlStopPrediction> | null> {
    if (!stops.length) return null;
    const body = await this.post<{ predictions: MlStopPrediction[] }>('/predict/stops', { stops });
    return body ? new Map(body.predictions.map((p) => [p.stopId, p])) : null;
  }

  /** Weekly forecasts in the order asked, or null (disabled or failed: use the heuristic). */
  async forecastWeeks(weeks: MlWeek[], calendar: MlCalendarDay[]): Promise<MlWeekForecast[] | null> {
    if (!weeks.length) return null;
    const body = await this.post<{ weeks: MlWeekForecast[] }>('/forecast/weeks', { weeks, calendar });
    return body?.weeks ?? null;
  }

  private async post<T>(path: string, payload: unknown): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        const text = (await res.text().catch(() => '')).slice(0, 200);
        return this.fail(`${path}: HTTP ${res.status} ${text}`);
      }
      const json = (await res.json()) as T;
      if (this.failing) this.logger.log(`ML service answering again (${path})`);
      this.failing = false;
      return json;
    } catch (e) {
      return this.fail(`${path}: ${(e as Error).message}`);
    }
  }

  private fail(why: string): null {
    if (!this.failing) this.logger.warn(`ML model not used, heuristic instead: ${why}`);
    this.failing = true;
    return null;
  }
}
