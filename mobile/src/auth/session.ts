// The signed-in session: tokens, claims, refresh (single flight, Keycloak rotates refresh tokens),
// sign-out, and the reaction to 401s from the API (expired → refresh once; device revoked or not
// registered → end the session and show the design's access screens; token not bound to this phone →
// keep the session and ask for access, see enrollment.ts).
//
// Storage: the refresh token and the (non-secret) claims go to the secret store (expo-secure-store on
// native; memory on web). The access token stays in memory and is refreshed on start.
import { Store } from '@/lib/store';
import type { ODataError } from '@/lib/odata';
import { claimsFromToken, type Claims } from './claims';
import { OidcError, type OidcClient, type RawTokens } from './oidc';
import { faceOf, problemFrom401, problemText, type AccessProblem, type Face, type ProblemKind } from './roles';
import type { SecretStore } from './secure';

export type SessionStatus = 'restoring' | 'signed-out' | 'signed-in';
export type SessionState = {
  status: SessionStatus;
  claims: Claims | null;
  /** Set when the session ended for a reason the user must see. */
  problem: AccessProblem | null;
  /** The face of the last signed-in user (to pick the right access screen). */
  face: Face | null;
  /** True while signed in from stored claims without a fresh token (offline start). */
  offline: boolean;
};

const RT = 'lodestar.rt';
const CLAIMS = 'lodestar.claims';
const EARLY_MS = 30_000;

/** Posture codes that mean "this token is not bound to this phone": the phone may ask for access. */
export const UNBOUND_CODES: readonly string[] = ['DeviceMismatch', 'DeviceNotBound'];

type Tokens = { accessToken: string; refreshToken?: string; expiresAt: number };

export class Session {
  readonly state = new Store<SessionState>({ status: 'restoring', claims: null, problem: null, face: null, offline: false });
  private tokens: Tokens | null = null;
  private refreshing: Promise<boolean> | null = null;
  private now: () => number;
  private deviceUnbound: (() => void) | null = null;

  constructor(
    private readonly store: SecretStore,
    private readonly oidc: OidcClient,
    now?: () => number,
  ) {
    this.now = now ?? Date.now;
  }

  get claims(): Claims | null {
    return this.state.get().claims;
  }

  get signedIn(): boolean {
    return this.state.get().status === 'signed-in';
  }

  /** On app start: signed in again from the stored refresh token (works offline from stored claims). */
  async restore(): Promise<void> {
    if (this.state.get().status !== 'restoring') return;
    const [rt, rawClaims] = await Promise.all([this.store.get(RT).catch(() => null), this.store.get(CLAIMS).catch(() => null)]);
    let claims: Claims | null = null;
    try {
      claims = rawClaims ? (JSON.parse(rawClaims) as Claims) : null;
    } catch {
      claims = null;
    }
    if (!rt || !claims) {
      this.state.set(s => ({ ...s, status: 'signed-out', claims: null }));
      return;
    }
    this.tokens = { accessToken: '', refreshToken: rt, expiresAt: 0 };
    this.state.set(s => ({ ...s, status: 'signed-in', claims, face: faceOf(claims), problem: null, offline: true }));
    await this.refresh();
  }

  /** After the authorization-code exchange. */
  async signIn(raw: RawTokens): Promise<Claims> {
    const claims = claimsFromToken(raw.access_token);
    if (!claims) throw new Error('The identity provider returned an unreadable token');
    await this.accept(raw, claims);
    return claims;
  }

  /** A valid access token, refreshed when it is about to expire; null when signed out or offline. */
  async accessToken(): Promise<string | null> {
    if (!this.tokens) return null;
    if (this.tokens.accessToken && this.tokens.expiresAt - EARLY_MS > this.now()) return this.tokens.accessToken;
    const ok = await this.refresh();
    return ok && this.tokens ? this.tokens.accessToken : null;
  }

  /** Called when the API refuses a call because the token is not bound to this phone (instead of ending the session). */
  onDeviceUnbound(handler: (() => void) | null) {
    this.deviceUnbound = handler;
  }

  /** One refresh at a time: Keycloak rotates refresh tokens and refuses a reused one. */
  refresh(): Promise<boolean> {
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const rt = this.tokens?.refreshToken;
    if (!rt) return false;
    try {
      const raw = await this.oidc.refresh(rt);
      const claims = claimsFromToken(raw.access_token);
      if (!claims) throw new OidcError('server', 'unreadable token');
      await this.accept(raw, claims);
      return true;
    } catch (e) {
      if (e instanceof OidcError && e.kind === 'invalid_grant') {
        await this.end('expired');
      }
      // network or server trouble: keep the session (offline-first), try again later
      return false;
    }
  }

  private async accept(raw: RawTokens, claims: Claims) {
    const expiresAt = this.now() + (raw.expires_in ?? (claims.exp ? claims.exp - this.now() / 1000 : 300)) * 1000;
    this.tokens = { accessToken: raw.access_token, refreshToken: raw.refresh_token ?? this.tokens?.refreshToken, expiresAt };
    if (this.tokens.refreshToken) await this.store.set(RT, this.tokens.refreshToken).catch(() => undefined);
    await this.store.set(CLAIMS, JSON.stringify(claims)).catch(() => undefined);
    this.state.set(s => ({ ...s, status: 'signed-in', claims, face: faceOf(claims), problem: null, offline: false }));
  }

  /**
   * The API answered 401. Expired token: refresh and let the caller retry once.
   * Token not bound to this phone (DeviceMismatch, DeviceNotBound): keep the session, ask for access.
   * Device revoked / not registered: end the session with that problem.
   */
  async handleUnauthorized(err: Pick<ODataError, 'message'> & { code?: string }): Promise<boolean> {
    if (err.code && UNBOUND_CODES.includes(err.code) && this.deviceUnbound && this.signedIn) {
      this.deviceUnbound();
      return false;
    }
    const kind = problemFrom401(err.message);
    if (kind === 'expired') {
      if (this.tokens) this.tokens.expiresAt = 0;
      if (await this.refresh()) return true;
      // invalid_grant already ended the session; without a refresh token there is nothing to try
      if (this.signedIn && !this.tokens?.refreshToken) await this.end('expired');
      return false;
    }
    await this.end(kind, err.message);
    return false;
  }

  /** The session ends for a reason the user must see (the queue of unsent work is kept). */
  async end(kind: ProblemKind, detail?: string) {
    const face = this.state.get().face;
    const rt = this.tokens?.refreshToken;
    this.tokens = null;
    await Promise.all([this.store.remove(RT).catch(() => undefined), this.store.remove(CLAIMS).catch(() => undefined)]);
    // A revoked device must not keep a live SSO session either.
    if (rt && kind === 'revoked') await this.oidc.logout(rt).catch(() => undefined);
    this.state.set({ status: 'signed-out', claims: null, face, offline: false, problem: { kind, message: problemText(kind, detail), at: new Date(this.now()).toISOString() } });
  }

  /** The user signs out: Keycloak session ended, local credentials removed. */
  async signOut() {
    const face = this.state.get().face;
    const rt = this.tokens?.refreshToken;
    this.tokens = null;
    await Promise.all([this.store.remove(RT).catch(() => undefined), this.store.remove(CLAIMS).catch(() => undefined)]);
    if (rt) await this.oidc.logout(rt).catch(() => undefined);
    this.state.set({ status: 'signed-out', claims: null, problem: null, face, offline: false });
  }

  clearProblem() {
    this.state.set(s => ({ ...s, problem: null }));
  }

  /** A sign-in attempt failed before any token was issued. */
  fail(message: string) {
    this.state.set(s => ({ ...s, problem: { kind: 'failed', message: problemText('failed', message), at: new Date(this.now()).toISOString() } }));
  }
}
