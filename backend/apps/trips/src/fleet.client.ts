import { Injectable, Logger } from '@nestjs/common';
import { ServiceTokenClient } from '@lodestar/security';

const REQUEST_TIMEOUT_MS = 5_000;

/**
 * The fleet service owns Vehicle: trips records fuel through Vehicles('…')/Lodestar.RecordFuel with its own
 * service token (svc-trips). Best effort, like notices: the trip completion has already committed, so a
 * failure is logged (WARN, with the trip it was for) and never undoes it.
 */
@Injectable()
export class FleetClient {
  private readonly logger = new Logger(FleetClient.name);
  // the fleet service's address comes from configuration (FLEET_URL), never from code
  private readonly baseUrl = (process.env.FLEET_URL ?? '').replace(/\/$/, '');

  constructor(private readonly tokens: ServiceTokenClient) {}

  /** Vehicles('…')/Lodestar.SetStatus with the svc-trips token; the caller decides what a failure means. */
  setStatus(vehicleId: string, status: 'AVAILABLE' | 'WORKSHOP' | 'ENROUTE', workshopNote?: string, tripId?: string): Promise<boolean> {
    return this.post(vehicleId, 'SetStatus', { status, ...(workshopNote ? { workshopNote } : {}) }, `SetStatus ${status} → ${vehicleId}`, tripId);
  }

  /** A completed trip's litres against its vehicle's weekly quota. */
  recordFuel(vehicleId: string, litres: number, tripId?: string): Promise<boolean> {
    return this.post(vehicleId, 'RecordFuel', { litres }, `RecordFuel ${litres} L → ${vehicleId}`, tripId);
  }

  private async post(vehicleId: string, action: string, body: unknown, what: string, tripId?: string): Promise<boolean> {
    const forTrip = tripId ? ` for trip ${tripId}` : '';
    if (!this.baseUrl) {
      this.logger.warn(`${what} skipped: FLEET_URL is not configured`);
      return false;
    }
    if (!this.tokens.configured) {
      this.logger.warn(`${what}${forTrip} skipped: no fleet service credentials configured (the vehicle record was not updated)`);
      return false;
    }
    try {
      const key = vehicleId.replace(/'/g, "''");
      const res = await this.tokens.fetch(`${this.baseUrl}/odata/v4/Vehicles('${key}')/Lodestar.${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) this.logger.warn(`${what}${forTrip} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return res.ok;
    } catch (e) {
      this.logger.warn(`${what}${forTrip} failed: ${(e as Error).message}`);
      return false;
    }
  }
}
