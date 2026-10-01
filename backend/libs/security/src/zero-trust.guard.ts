import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { missingScopes } from './abac';
import { ALLOW_KEY, IS_PUBLIC_KEY, SCOPE_KEY } from './decorators';
import { DevicePostureService } from './device-posture.service';
import { JwtVerifier } from './jwt-verifier';
import { hasAnyRole, Principal } from './principal';
import { Role, ScopeKind } from './roles';

/** Pulls the bearer token out of an Authorization header. */
export function bearerToken(header: unknown): string | undefined {
  if (typeof header !== 'string') return undefined;
  const m = /^Bearer\s+([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+)$/i.exec(header.trim());
  return m?.[1];
}

/**
 * Global guard installed in every service (PLATFORM.md §2):
 *   1. @Public() routes (only /health and /ready) pass.
 *   2. Otherwise a valid RS256 access token is required (401).
 *   3. Field-client tokens must be bound to an active device (401).
 *   4. The route must declare @Allow(roles…) and the caller must hold one (403).
 *   5. @Scope(...) claims must be present for non-privileged callers (403).
 */
@Injectable()
export class ZeroTrustGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: JwtVerifier,
    private readonly posture: DevicePostureService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    // Socket.IO connections are authenticated at handshake (see the notifications gateway).
    if (ctx.getType() === 'ws') return !!ctx.switchToWs().getClient()?.data?.principal;
    if (ctx.getType() !== 'http') return false;

    const req = ctx.switchToHttp().getRequest();
    const token = bearerToken(req.headers?.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    const principal: Principal = await this.verifier.verify(token);
    await this.posture.check(principal);
    req.principal = principal;

    const allowed = this.reflector.getAllAndOverride<Role[]>(ALLOW_KEY, targets);
    if (!allowed) throw new ForbiddenException('No access policy is declared for this route');
    if (!hasAnyRole(principal, allowed)) throw new ForbiddenException('Your role may not call this route');

    const scopes = this.reflector.getAllAndOverride<ScopeKind[]>(SCOPE_KEY, targets) ?? [];
    const missing = missingScopes(principal, scopes);
    if (missing.length) throw new ForbiddenException(`Token lacks the ${missing.join(', ')} claim`);
    return true;
  }
}
