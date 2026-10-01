import { CallHandler, ExecutionContext, HttpException, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AUDIT_SINK, AuditEvent, AuditOutcome, auditPayload, AuditSink } from './audit';
import { NO_AUDIT_KEY } from './decorators';
import { Principal } from './principal';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Details a handler can attach to the request so the audit entry names the
 * business operation instead of the raw URL (the OData controller does this).
 */
export interface AuditInfo {
  action: string;
  entitySet?: string;
  entityKey?: string;
}

/**
 * Assume breach: every write (success, failure or denial past authentication)
 * is reported to the hash-chained audit log before the response is sent.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUDIT_SINK) private readonly sink: AuditSink,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const skip = this.reflector.getAllAndOverride<boolean>(NO_AUDIT_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (skip || !WRITE_METHODS.has(req.method)) return next.handle();

    return next.handle().pipe(
      // Handlers that already recorded their write (the OData controller) set req.auditDone.
      mergeMap((result) => (req.auditDone ? [result] : from(this.emit(req, 'SUCCESS', 200).then(() => result)))),
      catchError((err) => {
        const status = err instanceof HttpException ? err.getStatus() : (err?.status ?? 500);
        const outcome: AuditOutcome = status === 401 || status === 403 ? 'DENIED' : 'FAILED';
        return from(this.emit(req, outcome, status)).pipe(mergeMap(() => throwError(() => err)));
      }),
    );
  }

  private async emit(req: any, outcome: AuditOutcome, status: number): Promise<void> {
    const principal: Principal | undefined = req.principal;
    const info: AuditInfo | undefined = req.auditInfo;
    const path = String(req.originalUrl ?? req.url ?? '').split('?')[0];
    const event: AuditEvent = {
      at: new Date().toISOString(),
      actor: principal?.sub ?? 'anonymous',
      actorRoles: principal?.roles ?? [],
      client: principal?.clientId,
      action: info?.action ?? `${req.method} ${path}`,
      entitySet: info?.entitySet,
      entityKey: info?.entityKey,
      outcome,
      payload: auditPayload(req.body, { method: req.method, path, status }),
    };
    await this.sink.record(event);
  }
}
