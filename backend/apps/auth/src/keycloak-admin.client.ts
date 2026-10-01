import { Injectable, Logger } from '@nestjs/common';
import { ODataError } from '@lodestar/odata';
import { ServiceTokenClient } from '@lodestar/security';

export interface NewIdentityUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string; // realm role
  attributes: Record<string, string[]>;
}

/**
 * Minimal Keycloak Admin REST client used by the auth service with its own
 * service account (svc-auth has realm-management view/manage/query-users).
 *
 *   KEYCLOAK_ADMIN_URL  e.g. http://identity:8080/auth   (internal URL)
 *   KEYCLOAK_REALM      default lodestar
 */
@Injectable()
export class KeycloakAdminClient {
  private readonly logger = new Logger(KeycloakAdminClient.name);
  private readonly base = process.env.KEYCLOAK_ADMIN_URL?.replace(/\/$/, '');
  private readonly realm = process.env.KEYCLOAK_REALM || 'lodestar';

  constructor(private readonly tokens: ServiceTokenClient) {}

  get configured(): boolean {
    return !!this.base && this.tokens.configured;
  }

  private url(path: string) {
    return `${this.base}/admin/realms/${this.realm}${path}`;
  }

  private async call(method: string, path: string, body?: unknown): Promise<Response> {
    if (!this.configured) throw new ODataError(503, 'ServiceUnavailable', 'The identity provider is not configured');
    try {
      return await this.tokens.fetch(this.url(path), {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      this.logger.warn(`Keycloak ${method} ${path} failed: ${(err as Error).message}`);
      throw new ODataError(503, 'ServiceUnavailable', 'The identity provider is not reachable');
    }
  }

  /** Creates a user with a realm role; returns the Keycloak id (the token `sub`). */
  async createUser(u: NewIdentityUser): Promise<string> {
    const res = await this.call('POST', '/users', {
      username: u.email,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      enabled: true,
      emailVerified: false,
      attributes: u.attributes,
      requiredActions: ['UPDATE_PASSWORD'],
    });
    if (res.status === 409) throw ODataError.conflict('A user with this email already exists in the identity provider', 'email');
    if (!res.ok) throw new ODataError(502, 'BadGateway', `Identity provider answered HTTP ${res.status}`);
    const id = res.headers.get('location')?.split('/').pop();
    if (!id) throw new ODataError(502, 'BadGateway', 'Identity provider returned no user id');

    // A user without their realm role would be locked out of everything: fail loudly.
    const role = await this.call('GET', `/roles/${encodeURIComponent(u.role)}`);
    if (!role.ok) throw new ODataError(502, 'BadGateway', `Identity provider has no realm role '${u.role}'`);
    const mapped = await this.call('POST', `/users/${id}/role-mappings/realm`, [await role.json()]);
    if (!mapped.ok) throw new ODataError(502, 'BadGateway', `Could not grant realm role '${u.role}' (HTTP ${mapped.status})`);
    return id;
  }

  async setEnabled(userId: string, enabled: boolean): Promise<void> {
    const res = await this.call('PUT', `/users/${encodeURIComponent(userId)}`, { enabled });
    if (!res.ok && res.status !== 404) throw new ODataError(502, 'BadGateway', `Identity provider answered HTTP ${res.status}`);
  }

  /** Ends every session of a user (used when a phone is reported lost, ADM-07). */
  async logoutUser(userId: string): Promise<boolean> {
    const res = await this.call('POST', `/users/${encodeURIComponent(userId)}/logout`);
    return res.ok || res.status === 404;
  }
}
