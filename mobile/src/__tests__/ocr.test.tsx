/* eslint-disable @typescript-eslint/no-require-imports */
// "Read from photo · confirm": lodestar/ocr.ts readPhoto (POST /ocr/read) and camera.tsx useCamera().read(kind).
// fetch is mocked; any failure is null so the screen keeps its manual entry. Synthetic fixtures only.
import { act, renderHook } from '@testing-library/react-native';
import { readPhoto } from '@/lodestar/ocr';
import { useCamera } from '@/lodestar/camera';
import { signInAs } from './fake-platform';

jest.mock('@/model/platform', () => require('./fake-platform'));
// a phone that granted the camera (the shared setup's camera has no permission)
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true, canAskAgain: true, status: 'granted' }, jest.fn(async () => ({ granted: true })), jest.fn()],
}));

const realFetch = globalThis.fetch;
const fetchMock = jest.fn();
const answer = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

beforeAll(async () => {
  await signInAs({ sub: 'u-ocr', name: 'Test Driver', realm_access: { roles: ['driver'] }, depot: ['KANDY'] });
});
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('readPhoto', () => {
  it('posts the photo and kind with the bearer token and returns the value read', async () => {
    fetchMock.mockResolvedValue(answer(200, { value: ' 3.5 ', text: 'REEFER 3.5 C', confidence: 0.91 }));
    expect(await readPhoto('data:image/jpeg;base64,AAA', 'temperature')).toEqual({ value: '3.5', text: 'REEFER 3.5 C', confidence: 0.91 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/ocr\/read$/);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
    expect((init.headers as Record<string, string>)['X-Device-Id']).toBe('DEV-TEST-0001');
    expect(JSON.parse(init.body as string)).toEqual({ image: 'data:image/jpeg;base64,AAA', kind: 'temperature' });
  });

  it('is null when the service fails, cannot be reached, or read nothing', async () => {
    fetchMock.mockResolvedValueOnce(answer(503, { error: 'busy' }));
    expect(await readPhoto('data:image/jpeg;base64,AAA', 'temperature')).toBeNull();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await readPhoto('data:image/jpeg;base64,AAA', 'seal')).toBeNull();
    fetchMock.mockResolvedValueOnce(answer(200, { value: null, text: '', confidence: 0 }));
    expect(await readPhoto('data:image/jpeg;base64,AAA', 'code')).toBeNull();
  });

  it('sends nothing without a photo', async () => {
    expect(await readPhoto('', 'temperature')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('useCamera().read', () => {
  const mounted = async () => {
    const takePictureAsync = jest.fn(async () => ({ uri: 'file:///photo.jpg', base64: 'QkFTRTY0' }));
    const hook = await renderHook(() => useCamera());
    await act(async () => {
      hook.result.current.setView({ takePictureAsync } as never);
      hook.result.current.setReady(true);
    });
    return { hook, takePictureAsync };
  };

  it('photographs with base64 and fills the value the service read', async () => {
    fetchMock.mockResolvedValue(answer(200, { value: '4', text: '4.0', confidence: 0.8 }));
    const { hook, takePictureAsync } = await mounted();
    let read: unknown;
    await act(async () => {
      read = await hook.result.current.read('temperature');
    });
    expect(read).toEqual({ value: '4', text: '4.0', confidence: 0.8 });
    expect(takePictureAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: true }));
    expect(JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)).toEqual({ image: 'data:image/jpeg;base64,QkFTRTY0', kind: 'temperature' });
    expect(hook.result.current.reading).toBe(false);
  });

  it('returns null when the read fails (the person types it instead)', async () => {
    fetchMock.mockResolvedValue(answer(500, {}));
    const { hook } = await mounted();
    let read: unknown = 'unset';
    await act(async () => {
      read = await hook.result.current.read('temperature');
    });
    expect(read).toBeNull();
    expect(hook.result.current.reading).toBe(false);
  });

  it('returns null before the camera is ready, without a photo or a call', async () => {
    const hook = await renderHook(() => useCamera());
    let read: unknown = 'unset';
    await act(async () => {
      read = await hook.result.current.read('temperature');
    });
    expect(read).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
