import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ODataError } from '@lodestar/odata';

/** A run view as returned by the agent service (PLATFORM.md §4). */
export interface AgentRunSnapshot {
  id: string;
  status: string; // DRAFTING | NEEDS_APPROVAL | APPROVED | REJECTED | FAILED
  depot?: string;
  runDate?: string;
  plan?: Record<string, unknown>;
  explanation?: unknown;
  [key: string]: unknown;
}

const TIMEOUT_MS = 30_000;

/** Optional DI token to replace fetch (tests). */
export const AGENT_FETCH = Symbol('AGENT_FETCH');

/**
 * Client of the planning agent (LangGraph, backend/apps/agent).
 *
 * The agent has no service bypass: every call carries the *dispatcher's own*
 * bearer token, so the agent applies its own RBAC (dispatcher) and depot ABAC
 * to the human who asked.
 *
 *   POST /runs {depot, runDate}                     → run view
 *   GET  /runs/{id}                                 → run view
 *   POST /runs/{id}/resume {decision, edits?, comment?}
 *   POST /ask {runId, question}
 */
@Injectable()
export class AgentClient {
  private readonly logger = new Logger(AgentClient.name);
  private readonly baseUrl = (process.env.AGENT_URL || 'http://agent:8000').replace(/\/$/, '');

  constructor(@Optional() @Inject(AGENT_FETCH) private readonly fetchImpl: typeof fetch = (input, init) => fetch(input, init)) {}

  startRun(depot: string, runDate: string, authorization: string) {
    return this.call<AgentRunSnapshot>('POST', '/runs', authorization, { depot, runDate });
  }

  getRun(id: string, authorization: string) {
    return this.call<AgentRunSnapshot>('GET', `/runs/${encodeURIComponent(id)}`, authorization);
  }

  resume(id: string, authorization: string, decision: string, edits?: unknown[], comment?: string) {
    const body: Record<string, unknown> = { decision };
    if (edits !== undefined) body.edits = edits;
    if (comment !== undefined) body.comment = comment;
    return this.call<AgentRunSnapshot>('POST', `/runs/${encodeURIComponent(id)}/resume`, authorization, body);
  }

  ask(runId: string, question: string, authorization: string) {
    return this.call<Record<string, unknown>>('POST', '/ask', authorization, { runId, question });
  }

  private async call<T>(method: string, path: string, authorization: string, body?: unknown): Promise<T> {
    if (!authorization) throw ODataError.forbidden('The planning agent needs the calling dispatcher’s token');
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: authorization,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.warn(`Agent ${method} ${path} failed: ${(err as Error).message}`);
      throw new ODataError(503, 'ServiceUnavailable', 'The planning agent is not reachable');
    }
    if (res.ok) return (await res.json()) as T;

    const detail = await res.text().catch(() => '');
    let message = detail.slice(0, 300);
    try {
      const parsed = JSON.parse(detail);
      message = parsed?.error?.message ?? parsed?.detail ?? message;
    } catch {
      /* not JSON */
    }
    if (res.status === 401 || res.status === 403) throw new ODataError(res.status, res.status === 401 ? 'Unauthorized' : 'Forbidden', `Planning agent: ${message || 'access denied'}`);
    if (res.status === 404) throw ODataError.notFound('The planning agent does not know this run');
    if (res.status === 409 || res.status === 400 || res.status === 422) {
      throw ODataError.conflict(`The planning agent rejected the request${message ? `: ${message}` : ''}`);
    }
    throw new ODataError(502, 'BadGateway', `The planning agent answered HTTP ${res.status}`);
  }
}
