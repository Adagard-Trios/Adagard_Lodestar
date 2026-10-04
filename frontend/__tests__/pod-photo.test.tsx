import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import PodPhoto, { podPhotoPath, PodSignature, podSignaturePath } from '@/components/live/PodPhoto';
import { ODataClient } from '@/lib/odata/client';
import { ApiContext } from '@/lib/odata/hooks';
import { tokens } from './helpers/live';

const PHOTO = '/media/pod-photos/cmphoto0001';

function setup(reply: (url: string, init: RequestInit) => { status: number; blob?: Blob }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = jest.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const r = reply(url, init);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: { get: () => null },
      blob: async () => r.blob ?? new Blob([]),
      json: async () => ({ error: { code: 'NotFound', message: 'Unknown photo' } }),
      text: async () => '',
    } as unknown as Response;
  });
  const client = new ODataClient({ baseUrl: 'http://localhost/odata/v4', tokens: tokens(), fetchImpl: fetchImpl as unknown as typeof fetch });
  const Wrapper = ({ children }: { children: ReactNode }) => <ApiContext.Provider value={{ client, realtime: null }}>{children}</ApiContext.Provider>;
  return { calls, Wrapper };
}

describe('PodPhoto', () => {
  const created: string[] = [];
  beforeEach(() => {
    created.length = 0;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = jest.fn((b: Blob) => {
      const u = `blob:http://localhost/${created.length + 1}-${b.size}`;
      created.push(u);
      return u;
    });
    (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = jest.fn();
  });

  it('only fetches photos the server holds', () => {
    expect(podPhotoPath({ photoUrl: PHOTO, photoCount: 1 })).toBe(PHOTO);
    expect(podPhotoPath({ photoUrl: 'https://elsewhere.example/p.jpg' })).toBeNull();
    expect(podPhotoPath(null)).toBeNull();
  });

  it('shows the empty state without a photo (no request)', () => {
    const { calls, Wrapper } = setup(() => ({ status: 200 }));
    render(<PodPhoto pod={{ photoUrl: null, photoCount: 0 }} />, { wrapper: Wrapper });
    expect(screen.getByTestId('pod-photo')).toHaveAttribute('data-state', 'empty');
    expect(calls).toHaveLength(0);
  });

  it('fetches the photo with the bearer token, shows it from a blob: URL and opens it full size', async () => {
    const { calls, Wrapper } = setup(() => ({ status: 200, blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }) }));
    const view = render(<PodPhoto pod={{ photoUrl: PHOTO, photoCount: 2 }} label="the drop at OUT106" />, { wrapper: Wrapper });
    expect(screen.getByTestId('pod-photo')).toHaveAttribute('data-state', 'loading');

    await waitFor(() => expect(screen.getByTestId('pod-photo')).toHaveAttribute('data-state', 'ready'));
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`http://localhost${PHOTO}`);
    expect((calls[0].init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
    expect(calls[0].init.credentials).toBe('omit');
    const img = screen.getByAltText('Photo of the drop at OUT106');
    expect(img).toHaveAttribute('src', created[0]);
    expect(screen.getByTestId('pod-photo')).toHaveAccessibleName(/newest of 2/);

    fireEvent.click(screen.getByTestId('pod-photo'));
    expect(screen.getByTestId('pod-photo-full')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByTestId('pod-photo-full')).toBeNull();

    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(created[0]);
  });

  it('shows "unavailable" when the photo cannot be read', async () => {
    const { Wrapper } = setup(() => ({ status: 404 }));
    render(<PodPhoto pod={{ photoUrl: PHOTO, photoCount: 1 }} />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('pod-photo')).toHaveAttribute('data-state', 'error'));
  });
});

describe('PodSignature', () => {
  const SIG = '/media/pod-photos/cmsign0001';
  beforeEach(() => {
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = jest.fn((b: Blob) => `blob:http://localhost/sig-${b.type}`);
    (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = jest.fn();
  });

  it('renders nothing for an unsigned POD (no request)', () => {
    const { calls, Wrapper } = setup(() => ({ status: 200 }));
    const view = render(<PodSignature pod={{ signatureUrl: null, receiverName: 'M. Ilyas' }} />, { wrapper: Wrapper });
    expect(view.container).toBeEmptyDOMElement();
    expect(podSignaturePath({ signatureUrl: 'https://elsewhere.example/s.svg' })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('fetches the signature with the bearer token and shows it as an image with who signed and when', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 84"><g><path d="M1 2 L3 4"/></g></svg>';
    const { calls, Wrapper } = setup(() => ({ status: 200, blob: new Blob([svg], { type: 'image/svg+xml' }) }));
    render(<PodSignature pod={{ signatureUrl: SIG, signedAt: '2026-04-07T01:28:00Z', receiverName: 'M. Ilyas' }} />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('pod-signature')).toHaveAttribute('data-state', 'ready'));
    expect(calls[0].url).toContain(SIG);
    expect(new Headers(calls[0].init.headers).get('Authorization')).toMatch(/^Bearer /);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'blob:http://localhost/sig-image/svg+xml');
    expect(img.getAttribute('alt')).toMatch(/^Signature: Signed by M\. Ilyas · Signed \d{1,2}:\d{2}/);
    expect(screen.getByText(/Signed by M\. Ilyas · Signed/)).toBeInTheDocument();
  });
});
