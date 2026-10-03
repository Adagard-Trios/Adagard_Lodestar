'use client';
// SM-36 Service unavailable · desktop, live. Markup and classes from the generated design
// (frontend/screens/sm-36-service-unavailable.tsx).
// Reached when the store desk cannot reach a working Lodestar server: Submit on SM-01 failed with a network error
// or 5xx, or the desk watch saw the API stop answering (components/live/DeskWatch.tsx). The order draft kept in
// this tab (components/live/order-draft.ts) is shown as "Draft · not sent". Every 30 s the desk asks the server
// again and, the moment it answers, sends the draft (one order per temperature class, never twice); "Try now" does
// it at once and then follows the design's L142 to the orders list. "Keep editing" (L143) goes back to SM-01 with
// the draft. The connection card is the desk's own record (lib/desk-status).
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useScreenNav } from '@/components/ScreenShell';
import { StoreTop } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { clearOrderDraft, hasUnsent, isUnreachable, lineTotals, loadAnyOrderDraft, loadOrderDraft, saveOrderDraft, sendOrderDraft, type OrderDraft } from '@/components/live/order-draft';
import { useDepots } from '@/components/live/depots';
import { useAuth } from '@/lib/auth/AuthProvider';
import { depotLabel, resetOptions, telHref } from '@/lib/auth/reset';
import { runtimeConfig } from '@/lib/config';
import { downSince, isServiceDown, probeApi, useDeskStatus } from '@/lib/desk-status';
import { fmtAgo, fmtDay, fmtRunDate, fmtTime, fmtNum } from '@/lib/format';
import type { ODataError } from '@/lib/odata/client';
import { useODataClient } from '@/lib/odata/hooks';
import { CUTOFF_LABEL, cutoffFor } from '@/lib/workday';

export const RETRY_EVERY_S = 30;

/** "1 h 30 m" until `to`, or null once passed. */
export function leftUntil(to: Date, now: Date): string | null {
  const ms = to.getTime() - now.getTime();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h ? `${h} h ${m} m` : `${m} m`;
}

export default function LiveSm36ServiceUnavailable() {
  const nav = useScreenNav();
  const client = useODataClient();
  const { session } = useAuth();
  const { name: depotName } = useDepots();
  const status = useDeskStatus();
  const { supportPhone } = resetOptions();
  const down = isServiceDown(status);
  const since = downSince(status);
  const [draft, setDraft] = useState<OrderDraft | null>(() => (typeof window === 'undefined' ? null : loadOrderDraft(session?.outletId) ?? loadAnyOrderDraft()));
  const [retries, setRetries] = useState(0);
  const [nextIn, setNextIn] = useState(RETRY_EVERY_S);
  const [sending, setSending] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const busy = useRef(false);

  /** Ask the server; when it answers, send what is left of the draft. Resolves true when nothing is left. */
  const attempt = useCallback(async (): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    setSending(true);
    setRetries(r => r + 1);
    try {
      const up = await probeApi(runtimeConfig().apiBase);
      if (!up) return false;
      const d = draft;
      if (!d || !hasUnsent(d)) return true;
      const working: OrderDraft = { ...d, sent: { ...d.sent } };
      try {
        const created = await sendOrderDraft(client, working, (tempClass, order) => {
          working.sent = { ...working.sent, [tempClass]: order.id };
          saveOrderDraft(working);
        });
        clearOrderDraft(d.outletId);
        setDraft(null);
        setDone([...Object.values(d.sent ?? {}), ...created.map(o => o.id)].filter((x): x is string => Boolean(x)));
        return true;
      } catch (e) {
        setDraft(working);
        saveOrderDraft(working);
        if (!isUnreachable(e as ODataError)) setRefused((e as Error).message);
        return false;
      }
    } finally {
      busy.current = false;
      setSending(false);
      setNextIn(RETRY_EVERY_S);
    }
  }, [client, draft]);

  // the automatic retry, with its countdown
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      setNextIn(n => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (nextIn === 0) void attempt();
  }, [nextIn, attempt]);

  const tryNow = async (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRefused(null);
    if (await attempt()) nav.go('L142');
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') void tryNow(e);
  };

  const dry = draft ? lineTotals(draft.dry) : null;
  const chilled = draft ? lineTotals(draft.chilled) : null;
  const left = draft ? leftUntil(cutoffFor(draft.runDate), now) : null;
  const cutoffAt = draft ? cutoffFor(draft.runDate) : null;
  const unsent = hasUnsent(draft);

  const row = (label: string, cls: string, icon: 'box' | 'snow', note: string, t: ReturnType<typeof lineTotals>, sentId?: string) => (
    <div className="ax-orow" data-testid={`draft-${label.split(' ')[0].toLowerCase()}`}>
      <span className={`plan-i__lead ${cls}`}><Ic n={icon} /></span>
      <div className="ax-orow__t"><b>{label}</b><span>{t.lines} line{t.lines === 1 ? '' : 's'} · {note}</span></div>
      <span className="ax-orow__v">{t.units}<small>{"units"}</small></span>
      <span className="ax-orow__kg">{fmtNum(t.kg)} kg</span>
      <span className="ax-orow__st"><span className="sx-dash">{sentId ? `Sent · ${sentId}` : 'Draft · not sent'}</span></span>
    </div>
  );

  return (
    <div className="frame frame--desktop mode-store" data-name="SM-36 Service unavailable · desktop">
      <div className="s-shell">
        <StoreTop
          active="order"
          extra={<span className="sx-dash" data-testid="connection-pill"><Ic n={down ? 'cloud-off' : 'cloud-check'} />{down ? 'Not connected' : 'Connected'}</span>}
        />
        <div className="d-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"New order "}<span className="m-sep" />{draft ? ` ${fmtRunDate(draft.runDate)} run ` : ' no draft '}<span className="m-sep" />{` saved ${draft ? fmtAgo(new Date(draft.savedAt), now) : ''}`}</div>
              <div className="d-h1">{draft ? `Order for ${fmtRunDate(draft.runDate)}` : 'Lodestar Store'}</div>
            </div>
          </div>
          <div className="hstack" style={{ gap: '18px', alignItems: 'stretch' }}>
            <div className="d-card ax-dash" style={{ flex: '1' }}>
              <div className="vstack" style={{ gap: '18px', padding: '28px 32px' }}>
                <div className="hstack" style={{ gap: '14px' }}>
                  <span className="ax-disc ax-disc--off"><Ic n={down ? 'cloud-off' : 'cloud-check'} /></span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: down ? 'var(--st-offline-fg)' : 'var(--st-delivered-fg)' }} data-testid="server-state">
                    {down ? `Lodestar can't reach its server${since ? ` · since ${fmtTime(new Date(since))}` : ''}` : 'Lodestar answers again'}
                  </span>
                </div>
                <div className="vstack" style={{ gap: '8px' }}>
                  <span className="d-h1" style={{ fontSize: '36px' }} data-testid="draft-title">
                    {done ? 'Your order was sent' : draft && unsent ? 'Your order is saved in this browser' : 'No order waiting to be sent'}
                  </span>
                  <span className="d-sub" style={{ fontSize: '15px', lineHeight: '1.5' }}>
                    {done
                      ? `Received: ${done.join(', ')}. It is in your orders and history.`
                      : draft && unsent
                        ? `Nothing is lost and nothing to type again. We retry every ${RETRY_EVERY_S} seconds and send the order${dry?.units && chilled?.units ? 's' : ''} the moment the server answers.`
                        : 'Receipts, deliveries and messages open again once the server answers.'}
                  </span>
                </div>
                {draft && dry && chilled && (
                  <div className="vstack" style={{ gap: '0' }}>
                    {dry.units > 0 && row('Dry order', 'plan-i__lead--plain', 'box', 'ambient', dry, draft.sent?.AMBIENT)}
                    {chilled.units > 0 && row('Chilled order', 'plan-i__lead--cold', 'snow', 'travels in a reefer', chilled, draft.sent?.CHILLED)}
                  </div>
                )}
                {refused && (
                  <div className="lv-banner lv-banner--bad" role="alert"><Ic n="alert" /><div className="lv-banner__txt"><b>{"The server answered but refused the order"}</b><span>{refused} Keep editing to change it.</span></div></div>
                )}
                <div className="hstack" style={{ gap: '16px' }}>
                  <span className="d-btn d-btn--primary sx-dbtn-xl" style={{ padding: '0 22px' }} data-lk="L142" role="button" tabIndex={0} aria-busy={sending} data-testid="try-now" onClick={e => void tryNow(e)} onKeyDown={onKey}>
                    <Ic n="refresh" />{sending ? 'Trying…' : 'Try now'}
                  </span>
                  <span className="d-btn d-btn--ghost" style={{ height: '52px' }} data-lk="L143">{"Keep editing"}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{"Next automatic retry in "}<b style={{ color: 'var(--text)' }}>{`0:${String(nextIn).padStart(2, '0')}`}</b></span>
                </div>
              </div>
            </div>
            <div className="vstack" style={{ gap: '18px', width: '420px', flexShrink: '0' }}>
              <div className="cstate cstate--warn">
                <div className="cstate__top">
                  <span className="cstate__l" style={{ color: 'var(--st-deferred-fg)' }}><Ic n="clock" />{`Orders close at ${CUTOFF_LABEL}`}</span>
                  <span className="cstate__v" style={{ color: 'var(--st-deferred-fg)' }}>{left ?? (draft ? 'Closed' : '—')}</span>
                </div>
                <span className="cstate__s" style={{ fontSize: '14px' }}>
                  {"Still not connected "}{cutoffAt ? `by ${fmtTime(new Date(cutoffAt.getTime() - 30 * 60_000))}` : 'near the cutoff'}{`? Call ${depotLabel(session?.depots, depotName)}`}
                  {supportPhone ? <>{' on '}<a href={telHref(supportPhone)} style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'inherit' }} onClick={e => e.stopPropagation()}>{supportPhone}</a></> : null}
                  {". The dispatcher logs your order into the same thread."}
                </span>
              </div>
              <div className="d-card" style={{ flex: '1' }}>
                <div className="d-card__head"><span className="d-card__title">{"Connection"}</span></div>
                <div className="d-card__body" style={{ gap: '0' }}>
                  <div className="sx-pkv"><span>{"Last successful sync"}</span><b data-testid="last-ok">{status.lastOkAt ? `${fmtTime(new Date(status.lastOkAt))} · ${fmtAgo(new Date(status.lastOkAt), now)}` : 'Not this session'}</b></div>
                  <div className="sx-pkv"><span>{"This PC's internet"}</span><b style={{ color: status.browserOnline ? 'var(--st-delivered-fg)' : 'var(--st-offline-fg)' }}>{status.browserOnline ? 'Working' : 'Offline'}</b></div>
                  <div className="sx-pkv"><span>{"Lodestar server"}</span><b style={{ color: down ? 'var(--st-offline-fg)' : 'var(--st-delivered-fg)' }}>{down ? 'Not answering' : 'Answering'}</b></div>
                  <div className="sx-pkv"><span>{"Automatic retries"}</span><b data-testid="retries">{retries} so far</b></div>
                </div>
              </div>
            </div>
          </div>
          <div className="d-card">
            <div className="d-card__head"><span className="d-card__title">{"While you wait"}</span><span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{"what still works in this browser"}</span></div>
            <div className="hstack" style={{ gap: '24px', alignItems: 'flex-start', padding: '0 18px 20px' }}>
              <div className="ax-wi"><span className="plan-i__lead"><Ic n="pen" /></span><div className="ax-wi__t"><b>{"Keep editing"}</b><span>{"Changes save in this browser as you type"}</span></div></div>
              <div className="ax-wi"><span className="plan-i__lead plan-i__lead--plain"><Ic n="van-2" /></span><div className="ax-wi__t"><b>{"Today's delivery"}</b><span>{`Opens again with the server${status.lastOkAt ? `; last loaded ${fmtDay(new Date(status.lastOkAt))} ${fmtTime(new Date(status.lastOkAt))}` : ''}`}</span></div></div>
              <div className="ax-wi"><span className="plan-i__lead plan-i__lead--plain"><Ic n="message" /></span><div className="ax-wi__t"><b>{"Receipts & messages"}</b><span>{"Open again once the server answers"}</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
