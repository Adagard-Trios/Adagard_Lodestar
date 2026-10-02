'use client';
// DSP-24 Offline banner: the desk lost its connection to the Lodestar API (the browser is offline, or calls fail
// with network errors). Drawn with the design's dx-banner--off; numbers on screen stay as they were last loaded
// (the queries keep their data on error), and the banner says since when. While offline the desk asks the API
// again every 15 s; "Retry now" asks at once. Any successful call clears it (lib/desk-status).
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runtimeConfig } from '@/lib/config';
import { downSince, isOffline, probeApi, useDeskStatus } from '@/lib/desk-status';
import { fmtClock } from '@/lib/format';
import Btn from './Btn';
import { Ic } from './icons';

export const OFFLINE_SCREEN = '/plan/dsp-24-offline-banner';
const RETRY_MS = 15_000;

/** The desk's connection, with a retry that asks the API whether it answers again. */
export function useOffline() {
  const s = useDeskStatus();
  const offline = isOffline(s);
  const [retrying, setRetrying] = useState(false);
  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      return await probeApi(runtimeConfig().apiBase);
    } finally {
      setRetrying(false);
    }
  }, []);
  useEffect(() => {
    if (!offline) return;
    const t = setInterval(() => void retry(), RETRY_MS);
    return () => clearInterval(t);
  }, [offline, retry]);
  return { offline, browserOnline: s.browserOnline, since: downSince(s), lastOkAt: s.lastOkAt, failures: s.failures, retry, retrying };
}

/**
 * The banner. It shows only while offline, unless `always` (DSP-24 itself, which then says the connection is
 * back). `lk` keeps the design's link on the banner (DSP-24: back to the live overview).
 */
export function OfflineBanner({ lk, always }: { lk?: string; always?: boolean }) {
  const o = useOffline();
  if (!o.offline && !always) return null;
  const since = o.since ? fmtClock(new Date(o.since)) : null;
  const asAt = o.lastOkAt ? fmtClock(new Date(o.lastOkAt)) : since;
  if (!o.offline) {
    return (
      <div className="dx-banner dx-banner--warn" data-state="online" role="status" {...(lk ? { 'data-lk': lk } : {})}>
        <Ic n="wifi" />
        <div style={{ flex: '1', minWidth: '0' }}>
          <b>{"Connected to Lodestar."}</b>{" "}
          <span>{"Numbers are live again. Open the overview to carry on."}</span>
        </div>
        <span className="d-btn"><Ic n="arrow-right" />{"Open live overview"}</span>
      </div>
    );
  }
  return (
    <div className="dx-banner dx-banner--off" data-state="offline" role="alert" data-testid="offline-banner" {...(lk ? { 'data-lk': lk } : {})}>
      <Ic n="wifi-off" />
      <div style={{ flex: '1', minWidth: '0' }}>
        <b>{o.browserOnline ? 'Lodestar is not answering' : 'This computer is offline'}{since ? ` since ${since}.` : '.'}</b>{" "}
        <span>
          {asAt ? `Showing what Lodestar knew at ${asAt}. ` : 'Showing what was last loaded. '}
          {"Alerts still reach your on-call phone over mobile data. Changes can't be saved until the connection is back."}
        </span>
      </div>
      <Btn className="d-btn" busy={o.retrying} onClick={() => void o.retry()} testId="offline-retry">
        <Ic n="refresh" />{o.retrying ? 'Retrying…' : 'Retry now'}
      </Btn>
    </div>
  );
}

/** The sidebar's offline marker (desk chrome): every Plan screen shows it while offline; it opens DSP-24. */
export function OfflineSideItem() {
  const router = useRouter();
  const o = useOffline();
  if (!o.offline) return null;
  const since = o.since ? fmtClock(new Date(o.since)) : null;
  const open = () => router.push(OFFLINE_SCREEN);
  return (
    <div
      className="d-side__item lv-click"
      style={{ color: 'var(--st-offline-fg)', border: '1.5px dashed var(--st-offline-bd)' }}
      role="button"
      tabIndex={0}
      data-testid="offline-side"
      onClick={e => { e.stopPropagation(); open(); }}
      onKeyDown={e => { if (e.key === 'Enter') open(); }}
    >
      <Ic n="wifi-off" />
      {since ? `Offline since ${since}` : 'Offline'}
    </div>
  );
}
