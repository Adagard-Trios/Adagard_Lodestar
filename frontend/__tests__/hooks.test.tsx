import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createUserManager } from '@/lib/auth/oidc';
import { resolveConfig } from '@/lib/config';
import { ApiContext, useAction, useEntity, useEntitySet, useQuery, useRealtime } from '@/lib/odata/hooks';
import { createRealtime, roomsFor } from '@/lib/realtime';
import { DESIGN_KEY, isDesignMode } from '@/lib/mode';
import { fakeHub, mockApi, page, SESSIONS } from './helpers/live';

function wrap(handler: Parameters<typeof mockApi>[0]) {
  const api = mockApi(handler);
  const hub = fakeHub();
  const wrapper = ({ children }: { children: ReactNode }) => <ApiContext.Provider value={{ client: api.client, realtime: hub }}>{children}</ApiContext.Provider>;
  return { ...api, hub, wrapper };
}

describe('useEntitySet', () => {
  it('loads a page, reports the count, and loads more through nextLink', async () => {
    const { wrapper, calls } = wrap(req =>
      req.query.$skiptoken ? page([{ id: 'C' }]) : page([{ id: 'A' }, { id: 'B' }], 3, 'http://localhost/odata/v4/Orders?$skiptoken=2'),
    );
    const { result } = renderHook(() => useEntitySet<{ id: string }>('Orders', { filter: "status eq 'RECEIVED'", top: 2, count: true }), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data?.map(r => r.id)).toEqual(['A', 'B']));
    expect(result.current.count).toBe(3);
    expect(result.current.hasMore).toBe(true);
    await act(() => result.current.loadMore());
    expect(result.current.data?.map(r => r.id)).toEqual(['A', 'B', 'C']);
    expect(result.current.hasMore).toBe(false);
    expect(calls[0].query.$filter).toBe("status eq 'RECEIVED'");
  });

  it('waits while the query is null', async () => {
    const { wrapper, fetch } = wrap(() => page([]));
    const { result } = renderHook(() => useEntitySet('Orders', null), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the OData error for the UI', async () => {
    const { wrapper } = wrap(() => ({ status: 403, body: { error: { code: 'Forbidden', message: 'Not your depot' } } }));
    const { result } = renderHook(() => useEntitySet('Plans', {}), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ status: 403, message: 'Not your depot' }));
    expect(result.current.loading).toBe(false);
  });

  it('reloads when a subscribed realtime event arrives', async () => {
    let n = 0;
    const { wrapper, hub } = wrap(() => page([{ id: `v${++n}` }]));
    const { result } = renderHook(() => useEntitySet<{ id: string }>('Notifications', {}, { refreshOn: ['notification'] }), { wrapper });
    await waitFor(() => expect(result.current.data?.[0].id).toBe('v1'));
    act(() => hub.emit('eta_update'));
    act(() => hub.emit('notification', { id: 'n' }));
    await waitFor(() => expect(result.current.data?.[0].id).toBe('v2'));
  });
});

describe('useQuery', () => {
  it('ignores a stale response that finishes after a newer one', async () => {
    const { wrapper } = wrap(() => page([]));
    const resolvers: Array<(v: string) => void> = [];
    const { result, rerender } = renderHook(({ k }) => useQuery(k, () => new Promise<string>(r => resolvers.push(r))), { wrapper, initialProps: { k: 'a' } });
    rerender({ k: 'b' });
    await waitFor(() => expect(resolvers).toHaveLength(2));
    await act(async () => resolvers[1]('fresh'));
    await act(async () => resolvers[0]('stale'));
    expect(result.current.data).toBe('fresh');
  });
});

describe('useEntity', () => {
  it('reads one entity by key with its ETag', async () => {
    const { wrapper, calls } = wrap(() => ({ status: 200, body: { id: 'OUT1' }, headers: { ETag: 'W/"5"' } }));
    const { result } = renderHook(() => useEntity<{ id: string }>('Outlets', 'OUT1'), { wrapper });
    await waitFor(() => expect(result.current.data?.['@odata.etag']).toBe('W/"5"'));
    expect(calls[0].path).toBe("Outlets('OUT1')");
  });
});

describe('useAction', () => {
  it('runs the command, keeps the result and calls onSuccess', async () => {
    const { wrapper, calls } = wrap(() => ({ id: 'PLG-1', status: 'PUBLISHED' }));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAction((c, id: string) => c.action('Plans', id, 'Approve', { note: 'go' }), { onSuccess }), { wrapper });
    await act(async () => {
      await result.current.run('PLG-1');
    });
    expect(calls[0]).toMatchObject({ method: 'POST', path: "Plans('PLG-1')/Lodestar.Approve", body: { note: 'go' } });
    expect(onSuccess).toHaveBeenCalledWith({ id: 'PLG-1', status: 'PUBLISHED' }, 'PLG-1');
    expect(result.current.pending).toBe(false);
  });

  it('never throws: the error is kept for the UI', async () => {
    const { wrapper } = wrap(() => ({ status: 403, body: { error: { code: 'Forbidden', message: 'Only a human dispatcher can approve a plan' } } }));
    const { result } = renderHook(() => useAction(c => c.action('Plans', 'P', 'Approve')), { wrapper });
    let out: unknown = 'x';
    await act(async () => {
      out = await result.current.run(undefined);
    });
    expect(out).toBeUndefined();
    expect(result.current.error).toMatchObject({ status: 403, code: 'Forbidden' });
  });
});

describe('useRealtime', () => {
  it('subscribes to events and unsubscribes on unmount', () => {
    const { wrapper, hub } = wrap(() => page([]));
    const seen: unknown[] = [];
    const { unmount } = renderHook(() => useRealtime(['eta_update'], p => seen.push(p)), { wrapper });
    act(() => hub.emit('eta_update', { eta: 1 }));
    unmount();
    act(() => hub.emit('eta_update', { eta: 2 }));
    expect(seen).toEqual([{ eta: 1 }]);
  });
});

describe('realtime client', () => {
  it('joins the rooms the claims allow', () => {
    expect(roomsFor(SESSIONS.dispatcher)).toEqual(['dispatcher:PELIYAGODA', 'dispatcher:KANDY']);
    expect(roomsFor(SESSIONS.store)).toEqual(['store:OUTT01']);
    expect(roomsFor(SESSIONS.admin)).toEqual([]);
  });

  it('connects to /ws/ with the access token and dispatches events', async () => {
    const handlers: Record<string, (...a: unknown[]) => void> = {};
    let anyHandler: (e: string, p: unknown) => void = () => undefined;
    const socket = {
      on: jest.fn((e: string, fn: (...a: unknown[]) => void) => (handlers[e] = fn)),
      onAny: jest.fn(fn => (anyHandler = fn)),
      connect: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn(),
    };
    const io = jest.fn(() => socket);
    const renew = jest.fn(async () => 'new');
    const hub = createRealtime({ origin: 'https://gw', path: '/ws/', rooms: ['store:OUT1'], getToken: async () => 'tok', renew, ioImpl: io as never });
    const [origin, opts] = io.mock.calls[0] as unknown as [string, { path: string; query: object; auth: (cb: (d: object) => void) => void }];
    expect(origin).toBe('https://gw');
    expect(opts.path).toBe('/ws/');
    expect(opts.query).toEqual({ room: 'store:OUT1' });
    const auth = await new Promise(r => opts.auth(r));
    expect(auth).toEqual({ token: 'tok' });

    const got: unknown[] = [];
    hub.on('eta_update', p => got.push(p));
    anyHandler('eta_update', { tripId: 'T' });
    anyHandler('other', {});
    expect(got).toEqual([{ tripId: 'T' }]);

    handlers.connect();
    expect(hub.status()).toBe('connected');
    handlers.unauthorized();
    await waitFor(() => expect(socket.connect).toHaveBeenCalled());
    expect(renew).toHaveBeenCalled();
    hub.close();
    expect(socket.disconnect).toHaveBeenCalled();
  });
});

describe('zero trust in the browser', () => {
  it('keeps tokens and PKCE state in sessionStorage, never localStorage', () => {
    const um = createUserManager(resolveConfig('https://localhost:8443'), window.sessionStorage);
    const s = um.settings as unknown as { userStore: { _store: Storage }; stateStore: { _store: Storage }; response_type: string; client_id: string; redirect_uri: string; monitorSession: boolean };
    expect(s.userStore._store).toBe(window.sessionStorage);
    expect(s.stateStore._store).toBe(window.sessionStorage);
    expect(s.userStore._store).not.toBe(window.localStorage);
    expect(s.response_type).toBe('code');
    expect(s.client_id).toBe('lodestar-web');
    expect(s.redirect_uri).toBe('https://localhost:8443/signin-callback');
    expect(s.monitorSession).toBe(false);
  });
});

describe('design preview switch', () => {
  afterEach(() => window.sessionStorage.removeItem(DESIGN_KEY));
  it('turns on with ?design=1 for the tab and off with ?design=0', () => {
    window.history.pushState({}, '', '/plan?design=1');
    expect(isDesignMode()).toBe(true);
    window.history.pushState({}, '', '/plan/dsp-02-plan-board');
    expect(isDesignMode()).toBe(true);
    window.history.pushState({}, '', '/plan?design=0');
    expect(isDesignMode()).toBe(false);
  });
});
