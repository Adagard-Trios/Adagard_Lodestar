/**
 * Integration-test harness: boots a service's real AppModule (zero-trust guard,
 * OData engine, entity sets, services, the real PrismaService on DATABASE_URL)
 * and signs real RS256 tokens against a local JWKS. Only the outbound edges are
 * replaced with recorders: the audit sink (HTTP to the audit service) and the
 * notify client (HTTP to the notifications service).
 */
import { INestApplication, Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, KeyLike, SignJWT } from 'jose';
import request from 'supertest';
import { PrismaService } from '@lodestar/prisma';
import { ODataExceptionFilter } from '@lodestar/odata';
import { AUDIT_SINK, JwtVerifier, NOTIFY } from '@lodestar/security';
import { PrismaClient } from '@prisma/client';

export const ISSUER = 'https://lodestar.test/auth/realms/lodestar';
export const WEB_CLIENT = 'lodestar-web';
export const FIELD_CLIENT = 'lodestar-field';

process.env.OIDC_ISSUER = ISSUER;
process.env.OIDC_AUDIENCE = 'lodestar-api';
process.env.FIELD_CLIENT_ID = FIELD_CLIENT;
delete process.env.OIDC_JWKS_URL;

// audit is append-only (a trigger rejects TRUNCATE) and these services never write it: the sink is a recorder.
const SCHEMAS = ['auth', 'orders', 'planning', 'fleet', 'outlets', 'trips', 'sync', 'notifications'];

export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL;
  if (!url || !/_test$/.test(new URL(url).pathname.replace(/^\//, ''))) {
    throw new Error('DATABASE_URL must name a database ending in _test');
  }
}

/** Empties every table of the application schemas (the migrations table stays). */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  assertTestDatabase();
  const rows = await prisma.$queryRawUnsafe<{ schemaname: string; tablename: string }[]>(
    `select schemaname, tablename from pg_tables where schemaname = any($1::text[]) and tablename <> '_prisma_migrations'`,
    SCHEMAS,
  );
  if (!rows.length) return;
  const list = rows.map((r) => `"${r.schemaname}"."${r.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export interface TokenClaims {
  sub: string;
  roles: string[];
  depot?: string | string[];
  outlet_id?: string;
  vehicle_id?: string;
  device_id?: string;
  azp?: string;
}

/** Signs access tokens the way Keycloak does (realm_access.roles, azp, ABAC claims). */
export class TokenSigner {
  private constructor(
    private readonly key: KeyLike,
    readonly jwks: ReturnType<typeof createLocalJWKSet>,
  ) {}

  static async create(): Promise<TokenSigner> {
    const pair = await generateKeyPair('RS256');
    const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'int-test', alg: 'RS256' };
    return new TokenSigner(pair.privateKey, createLocalJWKSet({ keys: [jwk] }));
  }

  sign({ roles, azp = WEB_CLIENT, ...claims }: TokenClaims): Promise<string> {
    return new SignJWT({ realm_access: { roles }, azp, ...claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'int-test' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setAudience('lodestar-api')
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(this.key);
  }
}

export interface NotifyRecorder {
  notices: any[];
  publishes: { event: string; rooms: string[]; payload: any }[];
  notice(p: any): Promise<boolean>;
  publish(event: string, rooms: string[], payload: any): Promise<boolean>;
}

export interface Service {
  app: INestApplication;
  prisma: PrismaService;
  audit: any[];
  notify: NotifyRecorder;
  /** supertest agent with the bearer token (and X-Device-Id for field tokens) set */
  as(token: string, deviceId?: string): {
    get(path: string): request.Test;
    post(path: string, body?: unknown, headers?: Record<string, string>): request.Test;
    patch(path: string, body?: unknown): request.Test;
  };
  close(): Promise<void>;
}

export async function bootService(module: Type<unknown>, signer: TokenSigner): Promise<Service> {
  assertTestDatabase();
  const audit: any[] = [];
  const notify: NotifyRecorder = {
    notices: [],
    publishes: [],
    async notice(p) {
      this.notices.push(p);
      return true;
    },
    async publish(event, rooms, payload) {
      this.publishes.push({ event, rooms, payload });
      return true;
    },
  };
  const moduleRef = await Test.createTestingModule({ imports: [module] })
    .overrideProvider(AUDIT_SINK)
    .useValue({ record: async (e: unknown) => void audit.push(e) })
    .overrideProvider(NOTIFY)
    .useValue(notify)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  app.useBodyParser('json', { limit: '2mb', type: ['application/json', 'application/*+json'] });
  app.useGlobalFilters(new ODataExceptionFilter());
  app.get(JwtVerifier).useKeySet(signer.jwks);
  await app.init();
  const http = app.getHttpServer();
  const prisma = app.get(PrismaService);

  const as: Service['as'] = (token, deviceId) => {
    const auth = (t: request.Test) => {
      t.set('Authorization', `Bearer ${token}`);
      if (deviceId) t.set('X-Device-Id', deviceId);
      return t;
    };
    return {
      get: (path) => auth(request(http).get(`/odata/v4/${path}`)),
      post: (path, body = {}, headers = {}) => {
        const t = auth(request(http).post(`/odata/v4/${path}`)).set('Content-Type', 'application/json');
        for (const [k, v] of Object.entries(headers)) t.set(k, v);
        return t.send(JSON.stringify(body));
      },
      patch: (path, body = {}) => auth(request(http).patch(`/odata/v4/${path}`)).set('Content-Type', 'application/json').send(JSON.stringify(body)),
    };
  };

  return { app, prisma, audit, notify, as, close: () => app.close() };
}
