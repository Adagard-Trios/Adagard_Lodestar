import { AsyncLocalStorage } from 'async_hooks';
import type { Principal } from '@lodestar/security';

/** The caller of the OData request being processed. */
export interface ODataRequestContext {
  principal: Principal;
  headers: Record<string, string | string[] | undefined>;
}

const storage = new AsyncLocalStorage<ODataRequestContext>();

/** Runs `fn` with the given request context (the engine does this per request). */
export function runWithRequestContext<T>(ctx: ODataRequestContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

/** The current request's context, e.g. inside a data-access override that has no ctx parameter. */
export function currentRequest(): ODataRequestContext | undefined {
  return storage.getStore();
}

/**
 * The caller's own `Authorization: Bearer …` header, for calls made on the
 * user's behalf to services that accept only human tokens (the planning agent).
 */
export function callerAuthorization(headers?: Record<string, string | string[] | undefined>): string | undefined {
  const raw = (headers ?? currentRequest()?.headers)?.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && /^Bearer\s+\S+$/i.test(value.trim()) ? value.trim() : undefined;
}
