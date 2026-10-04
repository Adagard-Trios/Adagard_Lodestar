'use client';
// The proof-of-delivery photo of a stop (DSP-A2, SM-02): a thumbnail of the newest photo the driver sent, opening the
// full-size image. Photos are served at /media/pod-photos/<id> to a bearer token only, so the image is fetched by the
// API client and shown from a blob: URL (revoked when the thumbnail goes away). States: no photo, loading, unavailable.
// PodSignature: the receiver's signature next to it (DR-03/DR-20 pad, a server-sanitised SVG shown as an <img>, so
// nothing in it can run), with "Signed by … · h:mm".
import { useEffect, useState } from 'react';
import { useODataClient } from '@/lib/odata/hooks';
import type { POD } from '@/lib/odata/types';
import { fmtTime } from '@/lib/format';
import { Ic } from './icons';

const MEDIA = /^\/media\/pod-photos\/[\w-]+$/;

/** The photo path of a POD, or null when the server holds none (an external or old photoUrl is not fetched). */
export function podPhotoPath(pod: Pick<POD, 'photoUrl' | 'photoCount'> | null | undefined): string | null {
  const url = pod?.photoUrl ?? '';
  return MEDIA.test(url) ? url : null;
}

type Props = {
  pod: Pick<POD, 'photoUrl' | 'photoCount'> | null | undefined;
  /** Who / where, for the alt text ("Photo of the drop at OUT106"). */
  label?: string;
  width?: number;
  height?: number;
};

export default function PodPhoto({ pod, label = 'the drop', width = 84, height = 56 }: Props) {
  const client = useODataClient();
  const path = podPhotoPath(pod);
  // the result is kept with the path it belongs to, so a new path shows "loading" without resetting state in the effect
  const [loaded, setLoaded] = useState<{ path: string; src: string | null; failed: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const current = loaded && loaded.path === path ? loaded : null;
  const src = current?.src ?? null;
  const failed = !!current?.failed;

  useEffect(() => {
    if (!path) return;
    let url: string | null = null;
    let live = true;
    client
      .blob(path)
      .then(b => {
        if (!live) return;
        url = URL.createObjectURL(b);
        setLoaded({ path, src: url, failed: false });
      })
      .catch(() => live && setLoaded({ path, src: null, failed: true }));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [client, path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const box = { width: `${width}px`, height: `${height}px`, border: '0', flex: 'none' } as const;
  const alt = `Photo of ${label}`;
  if (!path) {
    return <div className="photo" style={box} data-testid="pod-photo" data-state="empty" title="No photo"><Ic n="camera" /></div>;
  }
  if (failed) {
    return <div className="photo" style={box} data-testid="pod-photo" data-state="error" title="Photo unavailable"><Ic n="alert" /></div>;
  }
  if (!src) {
    return <div className="photo" style={box} data-testid="pod-photo" data-state="loading" aria-busy="true" title="Loading photo" />;
  }
  const count = pod?.photoCount ?? 1;
  return (
    <>
      <button
        type="button"
        className="photo"
        style={{ ...box, padding: 0, overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}
        onClick={() => setOpen(true)}
        data-testid="pod-photo"
        data-state="ready"
        aria-label={`${alt}${count > 1 ? ` (newest of ${count})` : ''}, open full size`}
      >
        {/* a blob: URL of an authenticated fetch: next/image cannot load it */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {count > 1 && (
          <span className="m-pill" style={{ position: 'absolute', right: '4px', bottom: '4px', height: '18px', fontSize: '11px', padding: '0 6px' }}>{count}</span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          data-testid="pod-photo-full"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(12,17,45,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,.4)' }} onClick={e => e.stopPropagation()} />
          <button type="button" className="btn btn--ghost" aria-label="Close photo" onClick={() => setOpen(false)}
            style={{ position: 'fixed', top: '16px', right: '16px', color: '#fff' }}>
            <Ic n="x" />
          </button>
        </div>
      )}
    </>
  );
}

/** The signature path of a POD, or null when it was not signed on the phone. */
export function podSignaturePath(pod: Pick<POD, 'signatureUrl'> | null | undefined): string | null {
  const url = pod?.signatureUrl ?? '';
  return MEDIA.test(url) ? url : null;
}

export function PodSignature({ pod, width = 84, height = 34 }: { pod: Pick<POD, 'signatureUrl' | 'signedAt' | 'receiverName'> | null | undefined; width?: number; height?: number }) {
  const client = useODataClient();
  const path = podSignaturePath(pod);
  const [loaded, setLoaded] = useState<{ path: string; src: string | null } | null>(null);
  const src = loaded && loaded.path === path ? loaded.src : null;
  useEffect(() => {
    if (!path) return;
    let url: string | null = null;
    let live = true;
    client
      .blob(path)
      .then(b => {
        if (!live) return;
        url = URL.createObjectURL(b.type === 'image/svg+xml' ? b : new Blob([b], { type: 'image/svg+xml' }));
        setLoaded({ path, src: url });
      })
      .catch(() => live && setLoaded({ path, src: null }));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [client, path]);
  if (!path) return null;
  const who = pod?.receiverName ? `Signed by ${pod.receiverName}` : 'Signed';
  const at = pod?.signedAt ? fmtTime(pod.signedAt) : '';
  const title = `${who}${at ? ` · Signed ${at}` : ''}`;
  return (
    <span data-testid="pod-signature" data-state={src ? 'ready' : 'loading'} title={title} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', flex: 'none' }}>
      <span style={{ width: `${width}px`, height: `${height}px`, background: '#fff', border: '1px solid var(--line, #e3e6ef)', borderRadius: '6px', overflow: 'hidden', display: 'block' }}>
        {/* a blob: URL of an authenticated fetch; an <img> never runs anything inside an SVG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt={`Signature: ${title}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
      </span>
      <span className="t-3" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{title}</span>
    </span>
  );
}
