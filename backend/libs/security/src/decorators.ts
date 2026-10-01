import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role, ScopeKind } from './roles';

export const IS_PUBLIC_KEY = 'lodestar:public';
export const ALLOW_KEY = 'lodestar:allow';
export const SCOPE_KEY = 'lodestar:scope';
export const NO_AUDIT_KEY = 'lodestar:no-audit';

/**
 * Marks a route as unauthenticated. Only the plain health endpoints
 * (`GET /health`, `GET /ready`) may use it (PLATFORM.md §3).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * RBAC: the realm roles allowed to call a route. Routes without @Allow or
 * @Public are rejected (fail closed), so a forgotten decorator never opens a route.
 */
export const Allow = (...roles: Role[]) => SetMetadata(ALLOW_KEY, roles);

/**
 * ABAC: the claims a non-privileged caller must carry for this route,
 * e.g. @Scope('outlet') requires an outlet_id claim for store managers.
 */
export const Scope = (...kinds: ScopeKind[]) => SetMetadata(SCOPE_KEY, kinds);

/** Excludes a write route from audit emission (used only by the audit service itself). */
export const NoAudit = () => SetMetadata(NO_AUDIT_KEY, true);

/** Injects the verified Principal into a handler parameter. */
export const CurrentPrincipal = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.principal;
});
