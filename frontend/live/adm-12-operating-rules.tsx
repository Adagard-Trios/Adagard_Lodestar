'use client';
// ADM-12 Operating rules, live. Markup and classes from the generated design (frontend/screens/adm-12-operating-rules.tsx).
// Data: ServiceAllowances (minutes per stop, brand × dock type). The locked rules on the left are the ones the
// planner enforces in code (order cutoff 16:00 in libs/platform; 270/480 minute budgets, 2 trips, one brand and
// one district per trip, protected deferrals, weight and volume, reefer-only chilled lines in the agent's
// heuristics/planner): they have no endpoint and cannot be changed here, which is what the lock shows.
// The design's banner (L299, to DSP-20 settings) says how rules change: Lodestar keeps no rule versions, so it
// states the real process instead of a pending "v8". Not drawn: the "Proposed v8" card, "Version history",
// "Propose a change" and "Loading starts" (no rule versions and no loading-start setting).
import type { ReactNode } from 'react';
import { AdminSide } from '@/components/live/chrome';
import { Ic } from '@/components/live/icons';
import { Empty, ErrorBanner, Skeleton } from '@/components/live/states';
import { BRAND_LETTER, title } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { Brand } from '@/lib/odata/types';

interface Allowance {
  brand: Brand;
  dockType: 'REAR_DOCK' | 'STREET' | 'MALL_BAY';
  minutes: number;
}

const BRANDS: Brand[] = ['FRESH', 'STYLE', 'TECH'];
const DOCKS: Array<[Allowance['dockType'], string]> = [['REAR_DOCK', 'rear_dock'], ['STREET', 'street'], ['MALL_BAY', 'mall_bay']];

function Rule({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="dx-kv" style={{ minHeight: '46px' }}>
      <span>{label}</span>
      <span className="hstack" style={{ gap: '8px' }}>
        <b>{children}</b>
        <span className="adm-lock"><Ic n="lock" /></span>
      </span>
    </div>
  );
}

export default function LiveAdm12OperatingRules() {
  const allowances = useQuery<Allowance[]>('adm-allowances', c => c.all<Allowance>('ServiceAllowances', { orderby: 'brand,dockType' }));
  const minutes = (b: Brand, d: Allowance['dockType']) => allowances.data?.find(a => a.brand === b && a.dockType === d)?.minutes;

  return (
    <div className="frame frame--desktop mode-dispatcher" data-name="ADM-12 Operating rules · desktop">
      <div className="d-app">
        <AdminSide active="N6" />
        <div className="dx-main">
          <div className="d-head">
            <div className="d-head__txt">
              <div className="d-eyebrow">{"Operating rules"}</div>
              <div className="d-h1">{"Operating rules"}</div>
            </div>
          </div>
          <div className="dx-banner dx-banner--warn" data-lk="L299">
            <Ic n="branch" />
            <span><b>{"Rule changes need a release and a second approver."}</b>{" The planner and the planning agent enforce these rules in code, so nobody can change them from a screen. A dispatcher's own alert rules and on-call hours live in Lodestar Plan settings."}</span>
            <span className="spacer" />
            <span className="d-btn" style={{ height: '34px' }}><Ic n="eye" />{"Plan settings"}</span>
          </div>
          <div className="dx-hrow" style={{ flex: '1', minHeight: '0' }}>
            <div className="dx-col" style={{ flex: '1' }}>
              <div className="dx-card">
                <div className="dx-card__head"><span className="dx-card__title">{"Day and trips"}</span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  <Rule label="Order cutoff">{"4:00 PM the day before"}</Rule>
                  <Rule label="Fresh trip window">{"3:30 to 8:00 · 270 min"}</Rule>
                  <Rule label="Style and Tech trip day">{"480 min"}</Rule>
                  <Rule label="Trips per vehicle">{"Max 2 a day"}</Rule>
                  <Rule label="One trip carries">{"One brand, one district"}</Rule>
                  <Rule label="Outlet deferred on the previous run">{"Protected next run"}</Rule>
                </div>
              </div>
              <div className="dx-card">
                <div className="dx-card__head"><span className="dx-card__title">{"Capacity"}</span></div>
                <div className="dx-card__body" style={{ gap: '0' }}>
                  <Rule label="A load must fit">{"Weight "}<span style={{ color: 'var(--brand-600)' }}>{"and"}</span>{" volume"}</Rule>
                  <Rule label="Chilled lines">{"Reefer vehicles only"}</Rule>
                </div>
              </div>
            </div>
            <div className="dx-col" style={{ flex: '1.05' }}>
              <div className="dx-card" data-testid="service-allowances">
                <div className="dx-card__head">
                  <span className="dx-card__title">{"Service allowances"}</span>
                  <span className="spacer" />
                  <span className="dx-t13">{"from service_allowance.csv"}</span>
                </div>
                <div className="dx-card__body">
                  <ErrorBanner error={allowances.error} onRetry={allowances.refresh} />
                  {!allowances.data && !allowances.error && <Skeleton rows={3} />}
                  {allowances.data?.length === 0 && <Empty title="No service allowances" text="Lodestar has no minutes per stop yet." icon="clock" />}
                  {Boolean(allowances.data?.length) && (
                    <div className="adm-mx">
                      <div className="adm-mx__r adm-mx__r--h">
                        <span>{"Minutes per stop"}</span>
                        {DOCKS.map(([k, l]) => <span key={k}>{l}</span>)}
                      </div>
                      {BRANDS.map(b => (
                        <div key={b} className="adm-mx__r" data-brand={b}>
                          <span><span className={`bb bb--${b.toLowerCase()} dx-bb`}>{BRAND_LETTER[b]}</span>{` ${title(b)}`}</span>
                          {DOCKS.map(([d]) => <b key={d}>{minutes(b, d) ?? '—'}</b>)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
