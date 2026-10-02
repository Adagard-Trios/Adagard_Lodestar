import { Injectable, Logger } from '@nestjs/common';
import { ServiceTokenClient } from '@lodestar/security';

const REQUEST_TIMEOUT_MS = 5_000;

/**
 * The fleet service owns Vehicle: trips records fuel through Vehicles('…')/Lodestar.RecordFuel with its own
 * service token (svc-trips). Best effort, like notices: the trip completion has already committed, so a
 * failure is logged and never undoes it.
 */
@Injectable()
export class FleetClient {
  private readonly logger = new Logger(FleetClient.name);
  private readonly baseUrl = (process.env.FLEET_URL || 'http://fleet:3004').replace(/\/$/, '');

  constructor(private readonly tokens: ServiceTokenClient) {}

  /** Vehicles('…')/Lodestar.SetStatus with the svc-trips token; the caller decides what a failure means. */
  async setStatus(vehicleId: string, status: 'AVAILABLE' | 'WORKSHOP' | 'ENROUTE', workshopNote?: string): Promise<boolean> {
    const what = `SetStatus ${status} → ${vehicleId}`;
    if (!this.tokens.configured) {
      this.logger.warn(`${what} skipped: no service credentials configured`);
      return false;
    }
    try {
      const key = vehicleId.replace(/'/g, "''");
      const res = await this.tokens.fetch(`${this.baseUrl}/odata/v4/Vehicles('${key}')/Lodestar.SetStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status, ...(workshopNote ? { workshopNote } : {}) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) this.logger.warn(`${what} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return res.ok;
    } catch (e) {
      this.logger.warn(`${what} failed: ${(e as Error).message}`);
      return false;
    }
  }

  async recordFuel(vehicleId: string, litres: number): Promise<boolean> {
    const what = `RecordFuel ${litres} L → ${vehicleId}`;
    if (!this.tokens.configured) {
      this.logger.warn(`${what} skipped: no service credentials configured`);
      return false;
    }
    try {
      const key = vehicleId.replace(/'/g, "''");
      const res = await this.tokens.fetch(`${this.baseUrl}/odata/v4/Vehicles('${key}')/Lodestar.RecordFuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ litres }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) this.logger.warn(`${what} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return res.ok;
    } catch (e) {
      this.logger.warn(`${what} failed: ${(e as Error).message}`);
      return false;
    }
  }
}
