import { createLocalJWKSet, exportJWK, generateKeyPair, JWTPayload, KeyLike, SignJWT } from 'jose';
import { loadOidcConfig } from './config';
import { JwtVerifier } from './jwt-verifier';

const ISSUER = 'https://localhost:8443/auth/realms/lodestar';

describe('JwtVerifier (RS256 + JWKS)', () => {
  let privateKey: KeyLike;
  let otherKey: KeyLike;
  let verifier: JwtVerifier;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    otherKey = (await generateKeyPair('RS256')).privateKey;
    const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256' };
    verifier = new JwtVerifier(loadOidcConfig({ OIDC_ISSUER: ISSUER })).useKeySet(createLocalJWKSet({ keys: [jwk] }));
  });

  const sign = (claims: JWTPayload, opts: { key?: KeyLike; exp?: string | number; iss?: string; aud?: string | string[]; alg?: string } = {}) =>
    new SignJWT({
      realm_access: { roles: ['dispatcher', 'offline_access'] },
      depot: ['PELIYAGODA', 'KANDY'],
      azp: 'lodestar-web',
      scope: 'openid profile',
      preferred_username: 'nilanthi',
      ...claims,
    })
      .setProtectedHeader({ alg: opts.alg ?? 'RS256', kid: 'k1' })
      .setSubject('8f1c2a10-0001-4c6e-9a01-000000000002')
      .setIssuer(opts.iss ?? ISSUER)
      .setAudience(opts.aud ?? ['lodestar-api', 'account'])
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? '5m')
      .sign(opts.key ?? privateKey);

  it('accepts a valid token and maps the claims to a principal', async () => {
    const p = await verifier.verify(await sign({}));
    expect(p).toMatchObject({
      sub: '8f1c2a10-0001-4c6e-9a01-000000000002',
      username: 'nilanthi',
      roles: ['dispatcher'],
      depots: ['PELIYAGODA', 'KANDY'],
      clientId: 'lodestar-web',
      scopes: ['openid', 'profile'],
      isService: false,
    });
  });

  it('rejects an expired token', async () => {
    await expect(verifier.verify(await sign({}, { exp: Math.floor(Date.now() / 1000) - 60 }))).rejects.toThrow('Token expired');
  });

  it('rejects the wrong issuer and the wrong audience', async () => {
    await expect(verifier.verify(await sign({}, { iss: 'https://evil.example/realms/lodestar' }))).rejects.toThrow(/Invalid token claim: iss/);
    await expect(verifier.verify(await sign({}, { aud: 'lodestar-web' }))).rejects.toThrow(/Invalid token claim: aud/);
  });

  it('rejects a token signed by another key', async () => {
    await expect(verifier.verify(await sign({}, { key: otherKey }))).rejects.toThrow('Invalid token');
  });

  it('rejects garbage', async () => {
    await expect(verifier.verify('not.a.jwt')).rejects.toThrow('Invalid token');
  });

  it('fails closed when no issuer is configured', async () => {
    const quiet = new JwtVerifier(loadOidcConfig({}));
    (quiet as any).logger = { error: jest.fn() };
    await expect(quiet.verify(await sign({}))).rejects.toThrow(/not configured/);
  });

  it('builds a remote JWKS lazily from config', () => {
    const v = new JwtVerifier(loadOidcConfig({ OIDC_ISSUER: ISSUER, OIDC_JWKS_URL: 'http://identity:8080/auth/realms/lodestar/protocol/openid-connect/certs' }));
    expect(typeof (v as any).keySet()).toBe('function');
    const none = new JwtVerifier({ issuers: [ISSUER], audience: 'lodestar-api', fieldClientId: 'lodestar-field' });
    expect(() => (none as any).keySet()).toThrow(/not configured/);
  });
});

describe('loadOidcConfig', () => {
  it('reads the OIDC_CLIENT_* names (SERVICE_CLIENT_* are aliases)', () => {
    expect(loadOidcConfig({ OIDC_ISSUER: ISSUER, OIDC_CLIENT_ID: 'svc-trips', OIDC_CLIENT_SECRET: 'x' })).toMatchObject({ clientId: 'svc-trips', clientSecret: 'x' });
    expect(loadOidcConfig({ OIDC_ISSUER: ISSUER, OIDC_CLIENT_SECRET_FILE: __filename }).clientSecret).toContain('OIDC_CLIENT_SECRET_FILE');
  });

  it('switches to Entra client assertions on AKS workload identity', () => {
    const c = loadOidcConfig({
      OIDC_ISSUER: 'https://login.microsoftonline.com/tid/v2.0',
      AZURE_FEDERATED_TOKEN_FILE: '/var/run/secrets/azure/tokens/azure-identity-token',
      AZURE_CLIENT_ID: 'app-guid',
      AZURE_TENANT_ID: 'tid',
      SVC_TOKEN_SCOPE: 'api://lodestar-api/.default',
      OIDC_JWKS_URI: 'https://login.microsoftonline.com/tid/discovery/v2.0/keys',
    });
    expect(c).toMatchObject({
      clientId: 'app-guid',
      federatedTokenFile: '/var/run/secrets/azure/tokens/azure-identity-token',
      tokenUrl: 'https://login.microsoftonline.com/tid/oauth2/v2.0/token',
      tokenScope: 'api://lodestar-api/.default',
      jwksUri: 'https://login.microsoftonline.com/tid/discovery/v2.0/keys',
    });
    expect(loadOidcConfig({ OIDC_ISSUER: 'https://login.microsoftonline.com/tid/v2.0', AZURE_FEDERATED_TOKEN_FILE: '/f' }).jwksUri).toBe(
      'https://login.microsoftonline.com/tid/v2.0/discovery/v2.0/keys',
    );
  });

  it('derives Keycloak endpoints and accepts several issuers', () => {
    const c = loadOidcConfig({ OIDC_ISSUER: `${ISSUER}/, http://localhost:8180/realms/lodestar`, SERVICE_CLIENT_ID: 'svc-orders', SERVICE_CLIENT_SECRET: 's' });
    expect(c.issuers).toEqual([ISSUER, 'http://localhost:8180/realms/lodestar']);
    expect(c.jwksUri).toBe(`${ISSUER}/protocol/openid-connect/certs`);
    expect(c.tokenUrl).toBe(`${ISSUER}/protocol/openid-connect/token`);
    expect(c).toMatchObject({ audience: 'lodestar-api', clientId: 'svc-orders', clientSecret: 's', fieldClientId: 'lodestar-field' });
  });

  it('prefers explicit internal URLs and *_FILE secrets', () => {
    const c = loadOidcConfig({
      OIDC_ISSUER: ISSUER,
      OIDC_JWKS_URI: 'http://a/certs',
      OIDC_TOKEN_URL: 'http://identity:8080/token',
      SERVICE_CLIENT_SECRET_FILE: __filename,
    });
    expect(c.jwksUri).toBe('http://a/certs');
    expect(c.tokenUrl).toBe('http://identity:8080/token');
    expect(c.clientSecret).toContain('loadOidcConfig');
    expect(loadOidcConfig({ SERVICE_CLIENT_SECRET_FILE: '/nope/missing' }).clientSecret).toBeUndefined();
    expect(loadOidcConfig({}).jwksUri).toBeUndefined();
  });
});
