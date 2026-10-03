import { MlClient } from './ml.client';

const client = (url = 'http://ml:8000') => Object.assign(new MlClient(), { baseUrl: url, timeoutMs: 50 });
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) }) as any;

describe('MlClient', () => {
  const fetchSpy = jest.spyOn(global, 'fetch');
  afterEach(() => fetchSpy.mockReset());
  afterAll(() => fetchSpy.mockRestore());

  it('is disabled without ML_URL and never calls out', async () => {
    const c = client('');
    expect(c.enabled).toBe(false);
    expect(await c.predictStops([{ stopId: 'S1' } as any])).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns predictions by stop id', async () => {
    fetchSpy.mockResolvedValue(ok({ predictions: [{ stopId: 'S1', serviceMin: 17.2, lateProb: 0.31, etaMin: 330, etaP90Min: 345 }] }));
    const out = await client().predictStops([{ stopId: 'S1' } as any]);
    expect(out?.get('S1')?.lateProb).toBe(0.31);
    expect(fetchSpy.mock.calls[0][0]).toBe('http://ml:8000/predict/stops');
  });

  it('falls back (null) on 503, on a network error and on a timeout, and logs once per outage', async () => {
    const c = client();
    const warn = jest.spyOn((c as any).logger, 'warn').mockImplementation(() => undefined);
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'task2a model not loaded' } as any);
    expect(await c.forecastWeeks([{ depot: 'KANDY', brand: 'FRESH', isoYear: 2026, isoWeek: 41 }], [])).toBeNull();
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await c.predictStops([{ stopId: 'S1' } as any])).toBeNull();
    fetchSpy.mockImplementationOnce((_u, init: any) => new Promise((_r, reject) => init.signal.addEventListener('abort', () => reject(new Error('timeout')))));
    expect(await c.predictStops([{ stopId: 'S1' } as any])).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    // a success ends the outage; the next failure is logged again
    fetchSpy.mockResolvedValueOnce(ok({ predictions: [] }));
    await c.predictStops([{ stopId: 'S1' } as any]);
    fetchSpy.mockRejectedValueOnce(new Error('ECONNRESET'));
    await c.predictStops([{ stopId: 'S1' } as any]);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
