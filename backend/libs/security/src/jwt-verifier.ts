import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, errors, jwtVerify, JWTVerifyGetKey } from 'jose';
import { OIDC_CONFIG, OidcConfig } from './config';
import { Principal, principalFromClaims } from './principal';

/**
 * Verifies RS256 access tokens against the issuer's JWKS (zero trust: every
 * service verifies every token itself; the gateway never grants access).
 * Checks signature, algorithm, issuer, audience, expiry and not-before.
 */
@Injectable()
export class JwtVerifier {
  private readonly logger = new Logger(JwtVerifier.name);
  private keys?: JWTVerifyGetKey;

  constructor(@Inject(OIDC_CONFIG) private readonly config: OidcConfig) {}

  /** Test seam: use a local key set instead of fetching the remote JWKS. */
  useKeySet(keys: JWTVerifyGetKey): this {
    this.keys = keys;
    return this;
  }

  private keySet(): JWTVerifyGetKey {
    if (!this.keys) {
      if (!this.config.jwksUri) throw new UnauthorizedException('Token verification is not configured');
      // jose caches keys and refetches on an unknown `kid` (key rotation), with a cooldown.
      this.keys = createRemoteJWKSet(new URL(this.config.jwksUri), {
        cooldownDuration: 30_000,
        timeoutDuration: 5_000,
      });
    }
    return this.keys;
  }

  async verify(token: string): Promise<Principal> {
    if (!this.config.issuers.length) {
      // Fail closed: a service without an issuer configured accepts nobody.
      this.logger.error('OIDC_ISSUER is not set; rejecting all tokens');
      throw new UnauthorizedException('Token verification is not configured');
    }
    try {
      const { payload } = await jwtVerify(token, this.keySet(), {
        algorithms: ['RS256'],
        issuer: this.config.issuers,
        audience: this.config.audience,
        requiredClaims: ['exp', 'iat', 'sub'],
        clockTolerance: 5,
      });
      return principalFromClaims(payload);
    } catch (err) {
      const reason =
        err instanceof errors.JWTExpired
          ? 'Token expired'
          : err instanceof errors.JWTClaimValidationFailed
            ? `Invalid token claim: ${err.claim}`
            : 'Invalid token';
      throw new UnauthorizedException(reason);
    }
  }
}
