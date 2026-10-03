import { act, render, screen, waitFor } from '@testing-library/react';
import type { User } from 'oidc-client-ts';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import type { UserManagerLike } from '@/lib/auth/oidc';
import { canUseFace, decodeJwt, faceFor, fieldAppFor, isEntryPath, landingFor, returnPath, rolesOf, sessionFrom } from '@/lib/auth/session';
import FaceGate, { decideGate } from '@/components/live/FaceGate';
import { resolveConfig } from '@/lib/config';
import { AuthTestContext } from '@/lib/auth/AuthProvider';
import { authValue, SESSIONS } from './helpers/live';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
let pathname = '/plan/dsp-02-plan-board';
jest.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => pathname }));
let design: boolean | null = false;
jest.mock('@/lib/mode', () => ({ useDesignMode: () => design }));

const b64 = (o: object) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims: object) => `${b64({ alg: 'RS256' })}.${b64(claims)}.sig`;

beforeEach(() => {
  jest.clearAllMocks();
  design = false;
  pathname = '/plan/dsp-02-plan-board';
});

describe('session · claims and roles', () => {
  it('decodes a JWT payload (base64url, UTF-8)', () => {
    expect(decodeJwt(jwt({ sub: 'a', name: 'Nilanthi Perera ශ්‍රී' }))).toEqual({ sub: 'a', name: 'Nilanthi Perera ශ්‍රී' });
    expect(decodeJwt('not-a-jwt')).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
  });

  it('reads Keycloak realm roles and Entra-style roles', () => {
    expect(rolesOf({ realm_access: { roles: ['dispatcher', 'offline_access'] } })).toEqual(['dispatcher', 'offline_access']);
    expect(rolesOf({ roles: ['admin'] })).toEqual(['admin']);
  });

  it('builds the session from the access token claims', () => {
    const token = jwt({ sub: 's1', realm_access: { roles: ['store_manager'] }, depot: 'kandy', outlet_id: 'OUT9', exp: 99 });
    expect(sessionFrom(token, { name: 'Fathima', preferred_username: 'fathima' })).toEqual({
      sub: 's1', name: 'Fathima', username: 'fathima', email: undefined, roles: ['store_manager'], depots: ['KANDY'], outletId: 'OUT9', expiresAt: 99,
    });
  });
});

describe('role landing', () => {
  it.each([
    [['dispatcher'], '/plan'],
    [['store_manager'], '/store'],
    [['admin'], '/admin'],
    [['dispatcher', 'admin'], '/plan'],
    [['driver'], '/no-access'],
    [[], '/no-access'],
  ])('%j lands on %s', (roles, path) => {
    expect(landingFor(roles)).toBe(path);
  });

  it.each([
    [['loader'], '/field/s/ld-06-sign-in'],
    [['driver'], '/field/s/dr-06-sign-in'],
    [[], '/field/'],
  ])('%j without a desk role is sent to %s in the field app', (roles, path) => {
    expect(fieldAppFor(roles)).toBe(path);
  });

  it('maps faces to roles', () => {
    expect(canUseFace(['dispatcher'], 'plan')).toBe(true);
    expect(canUseFace(['dispatcher'], 'admin')).toBe(false);
    expect(faceFor(['loader'])).toBeNull();
  });

  it('honours a deep link only inside a face the user may use', () => {
    expect(returnPath('/plan/dsp-17-deferral-log', ['dispatcher'])).toBe('/plan/dsp-17-deferral-log');
    expect(returnPath('/admin/adm-16-audit-log', ['dispatcher'])).toBe('/plan');
    expect(returnPath('//evil.example/x', ['dispatcher'])).toBe('/plan');
    expect(returnPath('https://evil.example', ['admin'])).toBe('/admin');
    expect(returnPath('/plan/dsp-06-sign-in', ['dispatcher'])).toBe('/plan');
    expect(returnPath(null, ['store_manager'])).toBe('/store');
  });

  it('knows the entry screens that need no session', () => {
    expect(isEntryPath('/plan/dsp-06-sign-in')).toBe(true);
    expect(isEntryPath('/store/sm-26-sign-in')).toBe(true);
    expect(isEntryPath('/admin/adm-01-sign-in')).toBe(true);
    expect(isEntryPath('/admin/adm-16-audit-log')).toBe(false);
  });
});

describe('route guard', () => {
  const base = { design: false, status: 'authenticated' as const, roles: ['dispatcher'], face: 'plan' as const, path: '/plan/dsp-02-plan-board' };
  it.each([
    [{ design: null }, 'pending'],
    [{ design: true, status: 'anonymous' as const }, 'render'],
    [{ status: 'anonymous' as const, path: '/plan/dsp-06-sign-in' }, 'render'],
    [{ status: 'loading' as const }, 'pending'],
    [{ status: 'anonymous' as const }, 'login'],
    [{}, 'render'],
    [{ face: 'admin' as const, path: '/admin/adm-02-overview' }, 'redirect'],
    [{ roles: ['driver'] }, 'no-desk-role'],
  ])('%j -> %s', (over, decision) => {
    expect(decideGate({ ...base, ...over })).toBe(decision);
  });

  const renderGate = (auth: ReturnType<typeof authValue>, face: 'plan' | 'admin' = 'plan') =>
    render(
      <AuthTestContext.Provider value={auth}>
        <FaceGate face={face}><p>secret screen</p></FaceGate>
      </AuthTestContext.Provider>,
    );

  it('sends an anonymous visitor to Keycloak, returning to the page afterwards', async () => {
    const auth = authValue(null);
    window.history.pushState({}, '', '/plan/dsp-02-plan-board?x=1');
    renderGate(auth);
    expect(screen.queryByText('secret screen')).not.toBeInTheDocument();
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('/plan/dsp-02-plan-board?x=1'));
    expect(screen.getByText('Taking you to sign in…')).toBeInTheDocument();
  });

  it('shows a retry when the sign-in service cannot be reached', async () => {
    const auth = authValue(null, { login: jest.fn(async () => { throw new Error('discovery failed'); }) });
    renderGate(auth);
    expect(await screen.findByText('Sign-in is not available')).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Try again' }).click());
    await waitFor(() => expect(auth.login).toHaveBeenCalledTimes(2));
  });

  it('renders the screen for the right role', () => {
    renderGate(authValue(SESSIONS.dispatcher));
    expect(screen.getByText('secret screen')).toBeInTheDocument();
  });

  it('sends a user of another role to their own face', async () => {
    pathname = '/admin/adm-02-overview';
    renderGate(authValue(SESSIONS.dispatcher), 'admin');
    expect(screen.queryByText('secret screen')).not.toBeInTheDocument();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/plan'));
  });

  it('tells phone-app users they have no desk access', () => {
    renderGate(authValue({ ...SESSIONS.dispatcher, roles: ['driver'] }));
    expect(screen.getByText('No desk access')).toBeInTheDocument();
  });

  it('lets the design preview through without a session', () => {
    design = true;
    renderGate(authValue(null));
    expect(screen.getByText('secret screen')).toBeInTheDocument();
  });
});

describe('AuthProvider (oidc-client-ts)', () => {
  function fakeUser(over: Partial<User> = {}): User {
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: jwt({ sub: 'u1', realm_access: { roles: ['admin'] } }),
      id_token: 'id-token',
      refresh_token: 'refresh',
      expires_at: now + 300,
      expired: false,
      profile: { sub: 'u1', name: 'Ada Admin' },
      state: { returnTo: '/admin/adm-16-audit-log' },
      ...over,
    } as unknown as User;
  }
  function fakeManager(user: User | null) {
    return {
      getUser: jest.fn(async () => user),
      signinRedirect: jest.fn(async () => undefined),
      signinRedirectCallback: jest.fn(async () => fakeUser()),
      signinSilent: jest.fn(async () => fakeUser({ access_token: jwt({ sub: 'u1', realm_access: { roles: ['admin'] }, n: 2 }) })),
      signoutRedirect: jest.fn(async () => undefined),
      removeUser: jest.fn(async () => undefined),
      storeUser: jest.fn(async () => undefined),
      events: { addUserLoaded: jest.fn(() => () => undefined), addUserUnloaded: jest.fn(() => () => undefined), addSilentRenewError: jest.fn(() => () => undefined) },
    } satisfies UserManagerLike;
  }
  let api: ReturnType<typeof useAuth>;
  function Probe() {
    api = useAuth();
    return <span>{api.status}:{api.session?.name ?? '-'}</span>;
  }

  it('restores a stored session and exposes roles from the access token', async () => {
    const m = fakeManager(fakeUser());
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    expect(await screen.findByText('authenticated:Ada Admin')).toBeInTheDocument();
    expect(api.session?.roles).toEqual(['admin']);
  });

  it('is anonymous without a stored user', async () => {
    render(<AuthProvider manager={fakeManager(null)}><Probe /></AuthProvider>);
    expect(await screen.findByText('anonymous:-')).toBeInTheDocument();
  });

  it('keeps the code + PKCE redirect for the single sign-on buttons', async () => {
    const m = fakeManager(null);
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('anonymous:-');
    await act(() => api.loginSso!('/plan/dsp-01-cutoff-queue'));
    expect(m.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/plan/dsp-01-cutoff-queue' } });
  });

  it('stores tokens from a designed sign-in screen like the callback does and returns the landing path', async () => {
    const m = fakeManager(null);
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('anonymous:-');
    const access = jwt({ sub: 'u9', name: 'Nila Plan', realm_access: { roles: ['dispatcher'] }, exp: Math.floor(Date.now() / 1000) + 300 });
    const idToken = jwt({ sub: 'u9', name: 'Nila Plan' });
    let next = '';
    await act(async () => {
      next = await api.acceptTokens!({ access_token: access, refresh_token: 'rt-1', id_token: idToken, expires_in: 300, token_type: 'Bearer' }, '/plan/dsp-02-plan-board');
    });
    expect(m.storeUser).toHaveBeenCalledTimes(1);
    const stored = (m.storeUser as jest.Mock).mock.calls[0][0];
    expect(stored.refresh_token).toBe('rt-1');
    expect(stored.profile.sub).toBe('u9');
    expect(next).toBe('/plan/dsp-02-plan-board');
    expect(await screen.findByText('authenticated:Nila Plan')).toBeInTheDocument();
  });

  it('completes the callback once and returns the landing path', async () => {
    const m = fakeManager(null);
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('anonymous:-');
    let next = '';
    await act(async () => {
      const [a, b] = await Promise.all([api.completeLogin('http://localhost/signin-callback?code=x&state=y'), api.completeLogin()]);
      next = a;
      expect(b).toBe(a);
    });
    expect(m.signinRedirectCallback).toHaveBeenCalledTimes(1);
    expect(next).toBe('/admin/adm-16-audit-log');
  });

  it('renews with the refresh token when the access token is about to expire', async () => {
    const soon = fakeUser({ expires_at: Math.floor(Date.now() / 1000) + 10 });
    const m = fakeManager(soon);
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('authenticated:Ada Admin');
    let token: string | null = null;
    await act(async () => {
      token = await api.getAccessToken();
    });
    expect(m.signinSilent).toHaveBeenCalledTimes(1);
    expect(decodeJwt(token)).toMatchObject({ n: 2 });
  });

  it('a failed renewal forgets the session (the next call asks to sign in)', async () => {
    const m = fakeManager(fakeUser());
    (m.signinSilent as jest.Mock).mockRejectedValueOnce(new Error('invalid_grant'));
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('authenticated:Ada Admin');
    await act(async () => {
      expect(await api.renew()).toBeNull();
    });
    expect(m.removeUser).toHaveBeenCalled();
    expect(screen.getByText('anonymous:-')).toBeInTheDocument();
  });

  it('logs out through Keycloak with the id token hint', async () => {
    const m = fakeManager(fakeUser());
    render(<AuthProvider manager={m}><Probe /></AuthProvider>);
    await screen.findByText('authenticated:Ada Admin');
    await act(() => api.logout());
    expect(m.signoutRedirect).toHaveBeenCalledWith({ id_token_hint: 'id-token' });
  });
});

describe('runtime config', () => {
  it('derives every endpoint from the page origin by default', () => {
    expect(resolveConfig('https://localhost:8443', { api: undefined, authority: undefined, clientId: undefined, ws: undefined })).toEqual({
      origin: 'https://localhost:8443',
      apiBase: 'https://localhost:8443/odata/v4',
      authority: 'https://localhost:8443/auth/realms/lodestar',
      clientId: 'lodestar-web',
      wsOrigin: 'https://localhost:8443',
      wsPath: '/ws/',
    });
  });

  it('takes NEXT_PUBLIC_* overrides', () => {
    expect(resolveConfig('https://app.example', { api: 'https://api.example/odata/v4/', authority: 'https://id.example/realms/x', clientId: 'web', ws: 'wss://rt.example/socket' })).toEqual({
      origin: 'https://app.example',
      apiBase: 'https://api.example/odata/v4',
      authority: 'https://id.example/realms/x',
      clientId: 'web',
      wsOrigin: 'https://rt.example',
      wsPath: '/socket/',
    });
  });
});
