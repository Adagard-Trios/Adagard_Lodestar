
import React from 'react';

export default function p1screensstore() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Store manager · complete app screens</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&amp;family=Noto+Sans+Tamil:wght@400;600;700&amp;display=swap">
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/components.css">
<style>
  /* =================== Board-level (page 04) =================== */
  .board { min-width: 2320px; }
  .flow-row { display: flex; gap: 40px; align-items: flex-start; }
  .flow-row .flow-arrow { align-self: flex-start; margin-top: 400px; width: 88px; }

  /* context strip */
  .ctx-row { display: flex; gap: 20px; align-items: stretch; width: 2128px; }
  .persona { display: flex; flex-direction: column; gap: 14px; width: 440px; flex-shrink: 0; padding: 24px; border-radius: 22px; background: linear-gradient(135deg, #1E2766 0%, #141B4D 100%); color: #E8EBF7; box-shadow: 0 12px 32px rgba(20,27,77,.22); }
  .persona__top { display: flex; align-items: center; gap: 14px; }
  .persona__av { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 18px; background: var(--star-500); color: #1A1300; font-family: var(--font-display); font-size: 20px; font-weight: 800; flex-shrink: 0; }
  .persona__name { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.01em; }
  .persona__role { font-size: 14px; color: #B9C0E6; font-weight: 600; }
  .persona__fact { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.45; color: #C9CFE8; }
  .persona__fact svg { color: var(--star-400); margin-top: 1px; }
  .q3 { display: flex; flex-direction: column; gap: 12px; flex: 1; padding: 24px; border-radius: 22px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 8px 24px rgba(15,20,50,.06); }
  .q3__n { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--brand-600); }
  .q3__q { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); line-height: 1.2; }
  .q3__today { font-size: 14px; line-height: 1.5; color: var(--n-600); }
  .q3__today b { color: var(--danger); }
  .q3__ans { display: flex; align-items: flex-start; gap: 10px; padding-top: 12px; border-top: 1px solid #ECEEF3; font-size: 14px; line-height: 1.5; color: var(--n-700); }
  .q3__ans b { color: var(--n-900); }
  .sid { display: inline-flex; align-items: center; height: 22px; padding: 0 7px; border-radius: 6px; background: var(--n-900); color: var(--star-400); font-family: var(--font-mono); font-size: 11px; font-weight: 700; flex-shrink: 0; }

  .step-head { display: flex; align-items: center; gap: 20px; padding: 18px 24px; border-radius: 20px; background: linear-gradient(135deg, #1E2766 0%, #141B4D 100%); color: #E8EBF7; width: 2128px; }
  .step-head__n { display: flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border-radius: 12px; background: var(--star-500); color: #1A1300; font-size: 14px; font-weight: 800; letter-spacing: .06em; flex-shrink: 0; }
  .step-head__time { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--star-400); flex-shrink: 0; }
  .step-head__t { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.015em; color: #FFFFFF; flex-shrink: 0; }
  .step-head__d { font-size: 15px; color: #B9C0E6; }

  .side { display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 24px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 8px 24px rgba(15,20,50,.06); flex-shrink: 0; }
  .side__k { font-size: 13px; font-weight: 700; color: var(--brand-600); }
  .side__t { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--n-900); letter-spacing: -0.015em; line-height: 1.25; }
  .side__p { font-size: 14px; line-height: 1.6; color: var(--n-700); }

  /* =================== Store app · shared =================== */
  .okdisc { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--tint-ok); color: var(--st-delivered-fg); flex-shrink: 0; }
  .okdisc svg { width: 28px; height: 28px; stroke-width: 3; }
  .m-pill.m-pill--loaded { background: var(--st-loaded-bg); color: var(--st-loaded-fg); }
  .m-row.m-row--c { min-height: 56px; padding: 10px 16px; }
  .m-row__lead.m-row__lead--ring { background: transparent; box-shadow: inset 0 0 0 2.5px var(--line-strong); }
  .m-row__lead.m-row__lead--plain { background: var(--surface-3); color: var(--text-2); }
  .m-nav__stack { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; }
  .m-nav__stack b { font-size: 15px; font-weight: 700; color: var(--text); }
  .m-nav__stack span { font-size: 13px; font-weight: 600; color: var(--text-3); white-space: nowrap; }
  .m-body > * { flex-shrink: 0; }
  .m-body.m-body--tight { gap: 16px; }
  .m-body.m-body--xtight { gap: 14px; }
  .mode-store .m-row__unit { font-size: 13px; }
  .note { display: flex; align-items: flex-start; gap: 8px; padding: 0 20px; font-size: 13px; line-height: 1.45; color: var(--text-3); }
  .note svg { margin-top: 1px; }
  .note b { color: var(--text); font-weight: 700; }

  /* Order Thread inside an inset group (phone: 13px floor) */
  .m-thread { display: flex; justify-content: center; padding: 16px 10px 14px; }
  .m-thread .thread__bar { width: 22px; margin-left: -12px; margin-right: -12px; }
  .mode-store .m-thread .thread__step { width: 66px; }
  .mode-store .thread__label { font-size: 13px; }
  .mode-store .thread__time { font-family: var(--font-ui); font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .thread--wide .thread__step { width: 104px; }
  .thread--wide .thread__bar { width: 24px; }

  /* tab bar at 13px */
  .mode-store .tabbar { background: var(--surface); border-top: 1px solid var(--hair); }
  .mode-store .tabbar__item { font-size: 13px; font-weight: 600; }
  .mode-store .tabbar__item.is-active { font-weight: 700; }

  /* quantity stepper (soft pill) */
  .qty { display: flex; align-items: center; height: 32px; padding: 2px; border-radius: 999px; background: var(--surface-3); flex-shrink: 0; }
  .qty__b { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #FFFFFF; color: var(--text-2); box-shadow: 0 1px 2px rgba(15,20,50,.08); }
  .qty__b svg { width: 14px; height: 14px; stroke-width: 2.5; }
  .qty__v { min-width: 38px; text-align: center; font-family: var(--font-display); font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text); }

  /* =================== Store app · desktop =================== */
  .s-shell { display: flex; flex-direction: column; flex: 1; min-height: 0; background: var(--app-bg); }
  .s-top { display: flex; align-items: center; gap: 16px; height: 64px; padding: 0 28px; flex-shrink: 0; background: #FBFBFD; border-bottom: 1px solid var(--hair); }
  .s-top__brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text); white-space: nowrap; }
  .s-top__brand svg { width: 28px; height: 28px; }
  .s-top__outlet { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px 0 8px; border-radius: 999px; background: #FFFFFF; box-shadow: inset 0 0 0 1px var(--hair); font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
  .s-top__outlet .id { color: var(--text-3); font-size: 13px; }
  .s-top__nav { display: flex; gap: 4px; margin-left: 8px; }
  .s-top__i { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-2); white-space: nowrap; }
  .s-top__i svg { width: 18px; height: 18px; }
  .s-top__i.is-on { background: #FFFFFF; color: var(--brand-600); font-weight: 700; box-shadow: 0 1px 2px rgba(15,20,50,.06), 0 2px 8px rgba(15,20,50,.06); }
  .s-top__count { min-width: 22px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--star-500); color: #1A1300; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .s-top__clock { font-size: 13px; font-weight: 600; color: var(--text-3); white-space: nowrap; }
  .s-top .m-iconbtn { width: 36px; height: 36px; }
  .s-top .m-iconbtn svg { width: 18px; height: 18px; }

  /* SM-01 countdown hero */
  .d-kpi__v.cd__v { font-size: 44px; line-height: 1; letter-spacing: -0.03em; color: #FFFFFF; }
  .d-kpi__v.cd__v small { font-size: 18px; opacity: .7; margin-left: 6px; }
  .m-progress.cd__bar { background: rgba(255,255,255,.14); }
  .m-progress.cd__bar > div { background: linear-gradient(90deg, #FFD37A, #F5B83D); }
  .d-kpi.d-kpi--fest { background: #FFF6E0; }
  .d-kpi--fest .d-kpi__l, .d-kpi--fest .d-kpi__v { color: #7A4B00; }
  .d-kpi--fest .d-kpi__s { color: #5A4200; }
  .d-kpi__l { display: flex; align-items: center; gap: 6px; }

  /* order tables */
  .ot-row { display: flex; align-items: center; gap: 14px; min-height: 40px; padding: 0 18px; font-size: 14px; border-top: 1px solid var(--hair); }
  .ot-row--head { min-height: 34px; border-top: none; font-size: 13px; font-weight: 700; color: var(--text-3); background: #FAFBFD; }
  .ot-row--total { margin-top: auto; min-height: 44px; background: #FAFBFD; font-weight: 700; }
  .ot-row--add { color: var(--brand-600); font-weight: 700; }
  .ot-item { display: flex; align-items: baseline; gap: 6px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; }
  .ot-item b { font-weight: 700; color: var(--text); }
  .ot-item span { font-size: 13px; color: var(--text-3); }
  .ot-last { width: 56px; flex-shrink: 0; text-align: right; color: var(--text-3); font-variant-numeric: tabular-nums; }
  .ot-sug { display: flex; align-items: center; justify-content: flex-end; gap: 8px; width: 118px; flex-shrink: 0; font-variant-numeric: tabular-nums; color: var(--text-2); }
  .ot-qty { display: flex; justify-content: center; width: 104px; flex-shrink: 0; }
  .ot-kg { width: 50px; flex-shrink: 0; text-align: right; color: var(--text-2); font-variant-numeric: tabular-nums; }
  .ot-row--total .ot-qty, .ot-row--total .ot-kg { font-family: var(--font-display); font-size: 15px; font-weight: 800; color: var(--text); }
  .fest2 { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: #9A6400; white-space: nowrap; }
  .fest2 svg { width: 13px; height: 13px; }

  /* SM-02 desktop */
  .arr { display: flex; gap: 28px; padding: 20px 24px 22px; }
  .arr__v { font-family: var(--font-display); font-size: 56px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; font-variant-numeric: tabular-nums; color: var(--text); }
  .arr__plan { display: flex; flex-direction: column; gap: 4px; flex: 1; padding-left: 28px; border-left: 1px solid var(--hair); }
  .plan-i { display: flex; align-items: center; gap: 12px; min-height: 48px; font-size: 14px; color: var(--text-2); }
  .plan-i b { color: var(--text); font-weight: 700; }
  .plan-i__lead { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: var(--tint-brand); color: var(--brand-600); flex-shrink: 0; }
  .plan-i__lead--cold { background: var(--tint-cold); color: var(--chilled-fg); }
  .plan-i__lead--plain { background: var(--surface-3); color: var(--text-2); }
  .arr__foot { display: flex; align-items: center; gap: 20px; padding: 14px 24px; margin-top: auto; background: #FAFBFD; border-top: 1px solid var(--hair); }
  .ord-mini { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-2); white-space: nowrap; }
  .panel-h { display: flex; align-items: baseline; justify-content: space-between; padding: 0 4px; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .panel-h b { color: var(--text); }
  .d-card.d-card--warn { background: var(--tint-warn); box-shadow: none; }
  .ncard { display: flex; flex-direction: column; gap: 8px; padding: 18px; }
  .ncard__meta { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--st-deferred-fg); }
  .ncard__t { font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -0.015em; line-height: 1.25; color: var(--text); }
  .ncard__p { font-size: 14px; line-height: 1.5; color: var(--text-2); }
  .ncard__p b { color: var(--text); }
  .wk-row { display: flex; align-items: center; gap: 14px; min-height: 46px; padding: 0 18px; font-size: 14px; border-top: 1px solid var(--hair); }
  .wk-row--head { min-height: 38px; border-top: none; font-size: 13px; font-weight: 700; color: var(--text-3); background: #FAFBFD; }
  .wk-row--sel { background: var(--tint-brand); }
  .wk-row--sel .m-pill { background: #FFFFFF; }
  .wk-row .c { flex-shrink: 0; white-space: nowrap; overflow: hidden; display: flex; align-items: center; gap: 6px; }

  /* SM-03 comparison mini-table */
  .cmp { display: flex; align-items: center; gap: 6px; min-height: 56px; padding: 8px 16px; font-size: 15px; }
  .cmp + .cmp { border-top: 1px solid var(--hair); }
  .cmp--head { min-height: 38px; padding-top: 12px; padding-bottom: 4px; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .cmp__o { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
  .cmp__o b { font-size: 15px; font-weight: 700; color: var(--text); }
  .cmp__o .id { font-size: 13px; color: var(--text-3); }
  .cmp__n { width: 54px; flex-shrink: 0; text-align: center; font-family: var(--font-display); font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text); }
  .cmp--head .cmp__n { font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--text-3); }
  .cmp__c { display: flex; justify-content: flex-end; width: 98px; flex-shrink: 0; }
  .cmp--head .cmp__c { justify-content: center; }
  .cmp .qty { height: 34px; }
  .cmp .qty__b { width: 30px; height: 30px; }
  .cmp .qty__v { min-width: 34px; font-size: 16px; }
  .issue-x { display: flex; flex-direction: column; gap: 8px; padding: 2px 16px 14px 16px; }
  .ichips { display: flex; flex-wrap: wrap; gap: 8px; }
  .ichip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 999px; background: var(--surface-3); font-size: 13px; font-weight: 700; color: var(--text-2); }
  .ichip.is-on { background: var(--st-exception-fg); color: #FFFFFF; }
  .ichip svg { width: 14px; height: 14px; stroke-width: 3; }
  .m-photo.m-photo--sm { width: 64px; height: 64px; align-items: center; justify-content: center; color: var(--text-3); background: repeating-linear-gradient(45deg, var(--surface-3), var(--surface-3) 8px, var(--surface-2) 8px, var(--surface-2) 16px); }
  .m-actionbar__cap { text-align: center; font-size: 13px; color: var(--text-3); padding-bottom: 2px; }
  .m-actionbar__cap b { color: var(--text); font-weight: 700; }

  /* cutoff state component */
  .cstate { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border-radius: 18px; background: var(--app-bg); }
  .cstate--warn { background: var(--tint-warn); }
  .cstate--closed { background: transparent; border: 1.5px dashed var(--st-offline-bd); }
  .cstate__top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
  .cstate__l { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-2); }
  .cstate__v { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .cstate__s { font-size: 13px; line-height: 1.45; color: var(--text-2); }
  .cstate__s b { color: var(--text); }

  /* deferral + match notices (board-side) */
  .notice { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 22px; background: #FFFFFF; box-shadow: 0 2px 4px rgba(15,20,50,.04), 0 12px 32px rgba(15,20,50,.10); }
  .notice__app { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-3); }
  .notice__app svg { width: 20px; height: 20px; }
  .notice__t { font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.015em; line-height: 1.3; color: var(--text); }
  .notice__p { font-size: 14px; line-height: 1.5; color: var(--text-2); }
  .notice__p b { color: var(--text); }
  .kvl { display: flex; flex-direction: column; }
  .kvl__r { display: flex; gap: 12px; padding: 10px 0; font-size: 14px; line-height: 1.45; }
  .kvl__r + .kvl__r { border-top: 1px solid var(--hair); }
  .kvl__r > span:first-child { width: 88px; flex-shrink: 0; font-weight: 600; color: var(--text-3); }
  .kvl__r > span:last-child { flex: 1; color: var(--text); }
  .quote { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; line-height: 1.5; color: var(--text-2); font-style: italic; }
  .quote svg { margin-top: 2px; color: var(--text-3); }

  /* =================== P1 · complete app screens (page-local, "sx-") =================== */
  .sx-board { gap: 72px; }
  .sx-inv { display: flex; gap: 28px; align-items: flex-start; }
  .sx-inv__card { display: flex; flex-direction: column; border-radius: 20px; background: #FFFFFF; box-shadow: var(--shadow-2); overflow: hidden; }
  .sx-inv__title { display: flex; align-items: baseline; gap: 12px; padding: 18px 20px 14px; font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.015em; color: var(--n-900); }
  .sx-inv__title span { font-family: var(--font-ui); font-size: 14px; font-weight: 600; letter-spacing: 0; color: var(--n-500); }
  .sx-inv__r { display: flex; align-items: center; gap: 14px; min-height: 34px; padding: 0 20px; font-size: 14px; color: var(--n-700); border-top: 1px solid #ECEEF3; }
  .sx-inv__r--head { min-height: 32px; background: #FAFBFD; font-size: 12.5px; font-weight: 700; color: var(--n-500); }
  .sx-inv__r--flow { min-height: 30px; background: #F1F3FA; font-size: 12.5px; font-weight: 800; color: var(--brand-700); }
  .sx-inv__id { display: flex; width: 64px; flex-shrink: 0; }
  .sx-inv__name { width: 290px; flex-shrink: 0; font-weight: 700; color: var(--n-900); white-space: nowrap; }
  .sx-inv__plat { width: 104px; flex-shrink: 0; white-space: nowrap; color: var(--n-500); }
  .sx-inv__to { flex: 1; min-width: 0; white-space: nowrap; }
  .sx-inv__to b { color: var(--n-900); }
  .sx-new { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; margin-left: 8px; border-radius: 6px; background: var(--brand-50); color: var(--brand-600); font-size: 11.5px; font-weight: 800; }
  .sx-kept { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; margin-left: 8px; border-radius: 6px; background: #FFF3D6; color: #7A4B00; font-size: 11.5px; font-weight: 800; }

  .sx-plat { display: flex; align-items: center; gap: 20px; padding: 24px 28px; border-radius: 24px; background: linear-gradient(135deg, #1E2766 0%, #141B4D 100%); color: #E8EBF7; box-shadow: 0 12px 32px rgba(20,27,77,.18); }
  .sx-plat__ic { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 18px; background: var(--star-500); color: #1A1300; flex-shrink: 0; }
  .sx-plat__ic svg { width: 28px; height: 28px; }
  .sx-plat__t { font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; }
  .sx-plat__d { font-size: 16px; color: #B9C0E6; }
  .sx-flow { display: flex; flex-direction: column; gap: 28px; }
  .sx-flow__h { display: flex; align-items: baseline; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid #D5DAE5; }
  .sx-flow__n { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--brand-600); }
  .sx-flow__t { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); }
  .sx-flow__d { font-size: 16px; color: var(--n-600); }
  .sx-row { display: flex; gap: 40px; align-items: flex-start; }
  .sx-row .screen-block { gap: 14px; }
  .sx-cap { font-size: 14px; line-height: 1.45; color: var(--n-600); }
  .sx-cap b { color: var(--n-900); font-weight: 700; }
  .sx-cap--p { width: 390px; }
  .sx-cap--d { width: 1440px; }

  /* ---------- phone app additions ---------- */
  .mode-store .m-tabbar { padding: 6px 0 0; }
  .mode-store .m-tab { font-weight: 600; }
  .mode-store .m-tab.is-on { font-weight: 700; }
  .mode-store .m-tab svg { width: 22px; height: 22px; }
  .mode-store .m-tab__badge { min-width: 20px; height: 20px; font-size: 13px; top: -2px; }
  .sx-sb-light { color: #FFFFFF; }
  .sx-home-light div { background: #FFFFFF; opacity: .7; }
  .sx-avbtn { background: var(--star-500) !important; color: #1A1300 !important; font-size: 14px; font-weight: 800; }
  .sx-av-on { box-shadow: 0 0 0 3px var(--brand-100); }
  .sx-link { color: var(--brand-600); font-weight: 700; }
  .sx-fest { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: #9A6400; white-space: nowrap; }
  .sx-fest svg { width: 13px; height: 13px; }
  .sx-dash { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px; border-radius: 999px; border: 1.5px dashed var(--st-offline-bd); font-size: 13px; font-weight: 700; color: var(--st-offline-fg); white-space: nowrap; }
  .sx-dash svg { width: 14px; height: 14px; }
  .m-hero.sx-hero--dashed { background: transparent; box-shadow: none; border: 1.5px dashed var(--st-offline-bd); }
  .m-hero.sx-hero--warn { background: var(--tint-warn); box-shadow: none; }
  .m-hero.sx-hero--brand .m-hero__value { color: #FFFFFF; }
  .sx-hero-sub { font-size: 15px; font-weight: 700; }
  .sx-actionrow { display: flex; gap: 10px; }
  .sx-actionrow .m-btn { flex: 1; }

  /* splash */
  .sx-splash { display: flex; flex-direction: column; flex: 1; min-height: 0; background: linear-gradient(165deg, #0A0F2E 0%, #141B4D 38%, #2A3590 72%, #3B4CCA 100%); color: #FFFFFF; }
  .sx-splash__mid { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; flex: 1; padding: 0 32px; text-align: center; }
  .sx-splash__mark { width: 176px; height: 176px; }
  .sx-splash__t { font-family: var(--font-display); font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
  .sx-splash__s { font-size: 16px; color: #C9CFE8; }
  .sx-splash__foot { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 32px 22px; }
  .sx-splash__load { display: flex; width: 120px; height: 4px; border-radius: 999px; background: rgba(255,255,255,.16); overflow: hidden; }
  .sx-splash__load div { width: 45%; border-radius: 999px; background: var(--star-500); }
  .sx-splash__wg { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #FFFFFF; }
  .sx-splash__brands { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: #B9C0E6; }
  .sx-splash__brands span { display: flex; align-items: center; gap: 6px; }
  .sx-splash__brands i { width: 8px; height: 8px; border-radius: 50%; }

  /* sign in */
  .sx-auth { display: flex; flex-direction: column; gap: 22px; flex: 1; min-height: 0; padding: 8px 0 12px; }
  .sx-brandrow { display: flex; align-items: center; gap: 12px; padding: 0 20px; font-family: var(--font-display); font-size: 17px; font-weight: 800; color: var(--text); }
  .sx-brandrow svg { width: 44px; height: 44px; }
  .sx-brandrow span { display: flex; flex-direction: column; }
  .sx-brandrow small { font-family: var(--font-ui); font-size: 13px; font-weight: 600; color: var(--text-3); }
  .sx-field { display: flex; flex-direction: column; gap: 8px; margin: 0 20px; }
  .sx-field__l { font-size: 13px; font-weight: 700; color: var(--text-2); }
  .sx-field__box { display: flex; align-items: center; gap: 12px; height: 60px; padding: 0 16px; border-radius: 16px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line-strong); }
  .sx-field__box.is-focus { box-shadow: inset 0 0 0 2px var(--brand-600), 0 0 0 4px var(--tint-brand); }
  .sx-field__pre { display: flex; align-items: center; gap: 8px; height: 32px; padding-right: 12px; border-right: 1px solid var(--line); font-size: 17px; font-weight: 700; color: var(--text); flex-shrink: 0; }
  .sx-field__pre small { font-size: 13px; font-weight: 700; color: var(--text-3); }
  .sx-field__v { font-family: var(--font-display); font-size: 21px; font-weight: 700; letter-spacing: .02em; color: var(--text); font-variant-numeric: tabular-nums; }
  .sx-field__ph { font-size: 15px; color: var(--text-3); }
  .sx-field__hint { font-size: 13px; line-height: 1.45; color: var(--text-3); }
  .sx-caret { width: 2px; height: 26px; border-radius: 1px; background: var(--brand-600); flex-shrink: 0; }
  .sx-keypad { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px 4px; background: #D3D7E0; flex-shrink: 0; }
  .sx-keys { display: flex; gap: 6px; }
  .sx-key { display: flex; align-items: center; justify-content: center; flex: 1; height: 48px; border-radius: 8px; background: #FFFFFF; font-size: 24px; font-weight: 500; color: #0F1422; box-shadow: 0 1px 0 rgba(0,0,0,.22); }
  .sx-key--fn { background: transparent; box-shadow: none; }
  .sx-key svg { width: 24px; height: 24px; }
  .sx-kbd-home { background: #D3D7E0; }
  .sx-otp { display: flex; gap: 8px; margin: 0 20px; }
  .sx-otp__c { display: flex; align-items: center; justify-content: center; flex: 1; height: 62px; border-radius: 14px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line-strong); font-family: var(--font-display); font-size: 26px; font-weight: 800; color: var(--text); }
  .sx-otp__c.is-focus { box-shadow: inset 0 0 0 2px var(--brand-600), 0 0 0 4px var(--tint-brand); }

  /* onboarding */
  .sx-ob { display: flex; flex-direction: column; gap: 22px; flex: 1; min-height: 0; padding: 0 0 8px; }
  .sx-ob__top { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 20px; flex-shrink: 0; }
  .sx-ob__step { font-size: 13px; font-weight: 700; color: var(--text-3); }
  .sx-ob__skip { font-size: 15px; font-weight: 700; color: var(--brand-600); }
  .sx-ill { display: flex; align-items: center; justify-content: center; height: 330px; margin: 0 16px; border-radius: 28px; background: linear-gradient(160deg, #141B4D 0%, #2A3590 60%, #3B4CCA 100%); overflow: hidden; flex-shrink: 0; }
  .sx-ill svg { width: 326px; height: 300px; }
  .sx-ill--soft { background: linear-gradient(160deg, #EEF0FF 0%, #E0E4FF 100%); }
  .sx-ill--sm { height: 200px; }
  .sx-dots { display: flex; gap: 6px; padding: 0 20px; }
  .sx-dots div { width: 8px; height: 8px; border-radius: 999px; background: var(--line-strong); }
  .sx-dots div.is-on { width: 24px; background: var(--brand-600); }
  .sx-ob .m-title { gap: 10px; }

  /* toggles, time chip */
  .sx-tg { display: flex; align-items: center; width: 48px; height: 28px; padding: 3px; border-radius: 999px; background: var(--line-strong); flex-shrink: 0; }
  .sx-tg div { width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
  .sx-tg.is-on { justify-content: flex-end; background: var(--brand-600); }
  .sx-tg.is-lock { opacity: .5; }
  .sx-chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 10px; background: var(--surface-3); font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; flex-shrink: 0; }

  /* vertical order thread */
  .sx-vt { display: flex; flex-direction: column; padding: 16px 16px 4px; }
  .sx-vt__i { display: flex; gap: 12px; }
  .sx-vt__rail { display: flex; flex-direction: column; align-items: center; width: 24px; flex-shrink: 0; }
  .sx-vt__dot { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--st-delivered-fg); color: #FFFFFF; flex-shrink: 0; }
  .sx-vt__dot svg { width: 13px; height: 13px; stroke-width: 3; }
  .sx-vt__dot--now { background: var(--st-enroute-fg); box-shadow: 0 0 0 4px var(--st-enroute-bg); }
  .sx-vt__dot--warn { background: var(--st-deferred-fg); }
  .sx-vt__dot--todo { background: var(--surface); box-shadow: inset 0 0 0 2px var(--line-strong); }
  .sx-vt__line { width: 2px; flex: 1; min-height: 10px; margin: 3px 0; border-radius: 1px; background: var(--st-delivered-fg); }
  .sx-vt__line--todo { background: var(--line-strong); }
  .sx-vt__body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; padding: 1px 0 16px; }
  .sx-vt__top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .sx-vt__t { font-size: 15px; font-weight: 700; color: var(--text); }
  .sx-vt__time { font-size: 13px; font-weight: 600; color: var(--text-3); font-variant-numeric: tabular-nums; white-space: nowrap; flex-shrink: 0; }
  .sx-vt__m { font-size: 13px; line-height: 1.45; color: var(--text-2); }

  /* bottom sheet */
  .sx-dimwrap { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #7F8294; }
  .sx-behind { position: relative; display: flex; flex-direction: column; height: 128px; flex-shrink: 0; overflow: hidden; background: var(--app-bg); }
  .sx-scrim { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(10,15,46,.5); }
  .sx-sheet { display: flex; flex-direction: column; flex: 1; min-height: 0; border-radius: 28px 28px 0 0; background: var(--surface); box-shadow: 0 -8px 30px rgba(10,15,46,.25); }
  .sx-grab { width: 40px; height: 5px; margin: 10px auto 2px; border-radius: 3px; background: var(--line-strong); flex-shrink: 0; }
  .sx-sheet__head { display: flex; align-items: flex-start; gap: 12px; padding: 8px 20px 0; flex-shrink: 0; }
  .sx-sheet .m-group { background: var(--app-bg); box-shadow: none; }
  .sx-sheet .m-row__lead { background: var(--surface); }
  .sx-sheet .m-actionbar { background: var(--surface); }
  .sx-win { display: flex; flex-direction: column; gap: 8px; margin: 0 16px; padding: 14px 16px 12px; border-radius: 20px; background: var(--app-bg); }
  .sx-win__track { position: relative; height: 52px; }
  .sx-win__rail { position: absolute; left: 0; right: 0; top: 30px; height: 8px; border-radius: 999px; background: var(--surface-3); }
  .sx-win__band { position: absolute; top: 26px; height: 16px; border-radius: 999px; background: var(--grad-brand); }
  .sx-win__dock { position: absolute; top: 22px; width: 2px; height: 24px; background: var(--st-delivered-fg); }
  .sx-win__eta { position: absolute; top: 0; display: flex; flex-direction: column; align-items: center; width: 70px; margin-left: -35px; }
  .sx-win__eta b { font-size: 13px; font-weight: 800; color: var(--brand-600); white-space: nowrap; }
  .sx-win__eta i { width: 2px; height: 22px; margin-top: 2px; background: var(--brand-900); }
  .sx-win__ticks { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-3); font-variant-numeric: tabular-nums; }
  .sx-win__legend { display: flex; gap: 14px; font-size: 13px; color: var(--text-2); }
  .sx-win__legend span { display: flex; align-items: center; gap: 6px; }
  .sx-win__legend i { width: 14px; height: 8px; border-radius: 4px; background: var(--grad-brand); }
  .sx-win__legend i.dock { width: 2px; height: 12px; border-radius: 0; background: var(--st-delivered-fg); }

  /* report issue / photos / note */
  .m-choice.sx-choice--bad { background: var(--st-exception-fg); color: #FFFFFF; box-shadow: 0 6px 16px rgba(180,35,24,.22); }
  .m-choice.sx-choice--bad svg { color: #FFFFFF; }
  .sx-photos { display: flex; gap: 10px; margin: 0 16px; }
  .sx-shot { display: flex; flex-direction: column; justify-content: flex-end; width: 104px; height: 104px; padding: 8px; border-radius: 16px; overflow: hidden; flex-shrink: 0; background: linear-gradient(160deg, #E8D9C4 0%, #CDB592 100%); }
  .sx-shot span { white-space: nowrap; align-self: flex-start; padding: 2px 7px; border-radius: 999px; background: rgba(15,20,34,.72); color: #FFFFFF; font-size: 13px; font-weight: 700; }
  .sx-addshot { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 104px; height: 104px; border-radius: 16px; border: 1.5px dashed var(--line-strong); color: var(--brand-600); font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .sx-addshot svg { width: 24px; height: 24px; }
  .sx-textarea { display: flex; flex-direction: column; gap: 6px; margin: 0 16px; padding: 14px 16px; min-height: 84px; border-radius: 18px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line); font-size: 15px; line-height: 1.45; color: var(--text); }
  .sx-textarea small { font-size: 13px; color: var(--text-3); }
  .sx-steprow { display: flex; align-items: center; gap: 12px; margin: 0 16px; padding: 12px 12px 12px 16px; border-radius: 20px; background: var(--surface); }
  .sx-steprow__t { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .sx-steprow__t b { font-size: 16px; font-weight: 700; color: var(--text); }
  .sx-steprow__t span { font-size: 13px; color: var(--text-2); }
  .sx-steprow .m-stepper__b { width: 44px; height: 44px; font-size: 22px; }
  .sx-steprow .m-stepper__v { min-width: 52px; font-size: 24px; }

  /* order lines on phone */
  .m-row.sx-line { min-height: 56px; padding: 8px 12px 8px 16px; gap: 10px; }
  .sx-line .m-row__title { font-size: 15px; }
  .sx-addrow { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 16px; border-top: 1px solid var(--hair); font-size: 15px; font-weight: 700; color: var(--brand-600); }
  .sx-strip { display: flex; align-items: center; gap: 12px; margin: 0 16px; padding: 12px 16px; border-radius: 18px; background: var(--tint-brand); }
  .sx-strip__l { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 14px; font-weight: 700; color: var(--brand-600); }
  .sx-strip__v { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: var(--brand-600); font-variant-numeric: tabular-nums; }

  /* profile */
  .sx-prof { display: flex; align-items: center; gap: 14px; margin: 0 16px; padding: 18px; border-radius: 24px; background: var(--surface); box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 8px 24px rgba(15,20,50,.06); }
  .sx-prof__av { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 20px; background: var(--star-500); color: #1A1300; font-family: var(--font-display); font-size: 22px; font-weight: 800; flex-shrink: 0; }
  .sx-prof__t { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .sx-prof__t b { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
  .sx-prof__t span { font-size: 14px; color: var(--text-2); }
  .sx-kv2 { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 50px; padding: 10px 16px; font-size: 15px; }
  .sx-kv2 + .sx-kv2 { border-top: 1px solid var(--hair); }
  .sx-kv2 > span { color: var(--text-2); flex-shrink: 0; }
  .sx-kv2 > b { font-weight: 700; text-align: right; color: var(--text); }
  .sx-kv2 > b small { display: block; font-size: 13px; font-weight: 500; color: var(--text-3); }

  /* notices list */
  .sx-nrow { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; }
  .sx-nrow + .sx-nrow { border-top: 1px solid var(--hair); }
  .sx-nrow .m-row__lead { width: 40px; height: 40px; border-radius: 13px; }
  .sx-nrow .m-row__lead svg { width: 20px; height: 20px; }
  .sx-nrow__main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .sx-nrow__k { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .sx-nrow__t { font-size: 15px; font-weight: 700; line-height: 1.35; color: var(--text); }
  .sx-nrow__m { font-size: 13px; line-height: 1.45; color: var(--text-2); }
  .sx-nrow--new { background: #F7F8FF; }
  .sx-unread { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-600); flex-shrink: 0; }

  /* empty state */
  .sx-empty { display: flex; flex-direction: column; align-items: center; gap: 14px; margin: 0 16px; padding: 24px 20px 22px; border-radius: 24px; background: var(--surface); text-align: center; box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 8px 24px rgba(15,20,50,.06); }
  .sx-empty svg.sx-empty__ill { width: 180px; height: 132px; }
  .sx-empty__t { font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.12; color: var(--text); }
  .sx-empty__p { font-size: 15px; line-height: 1.5; color: var(--text-2); }

  /* ---------- desktop additions ---------- */
  .sx-dauth { display: flex; flex: 1; min-height: 0; background: var(--app-bg); }
  .sx-dauth__brand { display: flex; flex-direction: column; gap: 28px; width: 620px; flex-shrink: 0; padding: 56px 56px 0; background: linear-gradient(160deg, #0A0F2E 0%, #141B4D 40%, #2A3590 80%, #3B4CCA 100%); color: #FFFFFF; }
  .sx-dauth__logo { display: flex; align-items: center; gap: 14px; font-family: var(--font-display); font-size: 22px; font-weight: 800; }
  .sx-dauth__logo svg { width: 44px; height: 44px; }
  .sx-dauth__h { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.12; }
  .sx-dauth__li { display: flex; align-items: center; gap: 14px; font-size: 16px; color: #D5DAF2; }
  .sx-dauth__li span { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,.1); color: var(--star-400); flex-shrink: 0; }
  .sx-dauth__li b { color: #FFFFFF; }
  .sx-dauth__foot { display: flex; align-items: center; gap: 12px; margin-top: auto; font-size: 14px; color: #B9C0E6; }
  .sx-dauth__form { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; }
  .sx-dcard { display: flex; flex-direction: column; gap: 22px; width: 460px; padding: 36px; border-radius: 24px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 12px 40px rgba(15,20,50,.08); }
  .sx-dcard .sx-field { margin: 0; }
  .sx-dcard .sx-otp { margin: 0; }
  .sx-check { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-2); }
  .sx-check i { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 6px; background: var(--brand-600); color: #FFFFFF; }
  .sx-check i svg { width: 13px; height: 13px; stroke-width: 3; }
  .d-btn.sx-dbtn-xl { height: 52px; border-radius: 14px; font-size: 16px; }
  .sx-divider { height: 1px; background: var(--hair); }
  .sx-help { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-2); }

  .sx-tr { display: flex; align-items: center; gap: 14px; min-height: 48px; padding: 0 18px; font-size: 14px; border-top: 1px solid var(--hair); }
  .sx-tr--head { min-height: 38px; border-top: none; font-size: 13px; font-weight: 700; color: var(--text-3); background: #FAFBFD; }
  .sx-tr--sel { background: var(--tint-brand); box-shadow: inset 3px 0 0 var(--brand-600); }
  .sx-tr--sel .m-pill { background: #FFFFFF; }
  .sx-tr .c { display: flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap; overflow: hidden; }
  .sx-tr .m-pill { height: 26px; }
  .sx-okc { display: inline-flex; align-items: center; gap: 5px; color: var(--st-delivered-fg); font-weight: 700; }
  .sx-okc svg { width: 14px; height: 14px; stroke-width: 3; }
  .sx-pkv { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; font-size: 14px; border-top: 1px solid var(--hair); }
  .sx-pkv span { color: var(--text-2); }
  .sx-pkv b { font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .sx-ptitle { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
  .sx-dthread { display: flex; justify-content: center; padding: 14px 0 6px; }
  .sx-dthread .thread { width: 100%; justify-content: space-between; }
  .sx-dthread .thread__step { width: 64px; flex-shrink: 0; }
  .sx-dthread .thread__label { font-size: 13px; }
  .sx-dthread .thread__time { font-family: var(--font-ui); font-size: 12.5px; font-weight: 600; }
  .sx-dthread .thread__bar { flex: 1; width: auto; min-width: 8px; margin-left: -18px; margin-right: -18px; }

  .sx-dlist { display: flex; flex-direction: column; }
  .sx-dn { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-top: 1px solid var(--hair); }
  .sx-dn--sel { background: var(--tint-brand); box-shadow: inset 3px 0 0 var(--brand-600); }
  .sx-dn .m-row__lead { width: 38px; height: 38px; border-radius: 12px; }
  .sx-dn .m-row__lead svg { width: 19px; height: 19px; }
  .sx-dn__main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .sx-dn__k { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .sx-dn__t { font-size: 14.5px; font-weight: 700; line-height: 1.35; color: var(--text); }
  .sx-dn__m { font-size: 13px; line-height: 1.4; color: var(--text-2); white-space: nowrap; overflow: hidden; }
  .sx-dday { padding: 12px 18px 6px; font-size: 13px; font-weight: 700; color: var(--text-3); border-top: 1px solid var(--hair); }
  .sx-evid { display: flex; gap: 14px; }
  .sx-evid__c { display: flex; flex-direction: column; gap: 6px; flex: 1; padding: 16px; border-radius: 16px; background: var(--app-bg); }
  .sx-evid__k { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .sx-evid__v { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); font-variant-numeric: tabular-nums; }
  .sx-evid__s { font-size: 13.5px; color: var(--text-2); }

  .sx-subnav { display: flex; flex-direction: column; gap: 2px; width: 232px; flex-shrink: 0; }
  .sx-subnav .d-side__item { height: 40px; }
  .sx-set-row { display: flex; align-items: center; gap: 14px; min-height: 60px; padding: 0 18px; border-top: 1px solid var(--hair); font-size: 14px; }
  .sx-set-row__main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .sx-set-row__main b { font-size: 14.5px; font-weight: 700; color: var(--text); }
  .sx-set-row__main span { font-size: 13px; color: var(--text-2); }
  .sx-set-av { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: var(--tint-brand); color: var(--brand-600); font-size: 13px; font-weight: 800; flex-shrink: 0; }
  .sx-col-h { width: 64px; flex-shrink: 0; display: flex; justify-content: center; font-size: 13px; font-weight: 700; color: var(--text-3); }

  /* photo auto-fill hint: value read from a photo, the person confirms (manual entry stays) */
  .cv-hint { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--brand-600); white-space: nowrap; }
  .cv-hint svg { width: 14px; height: 14px; flex-shrink: 0; }
  .cv-hint b { font-weight: 800; }
  .mode-driver .cv-hint { color: #A9B4FF; }

  /* ---------- access & system states (SM-31 to SM-36, page-local "ax-") ---------- */
  .m-btn.ax-btn--wait { opacity: .5; box-shadow: none; }
  .ax-hero-t { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: var(--text); }
  .ax-disc { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 16px; background: var(--tint-brand); color: var(--brand-600); flex-shrink: 0; }
  .ax-disc svg { width: 24px; height: 24px; }
  .ax-disc--off { background: transparent; border: 1.5px dashed var(--st-offline-bd); color: var(--st-offline-fg); }
  .ax-disc--ok { background: var(--tint-ok); color: var(--st-delivered-fg); }
  .sx-empty.ax-empty { gap: 12px; padding: 20px; }
  .ax-empty .sx-empty__t { font-size: 26px; }
  .ax-empty svg.sx-empty__ill { width: 160px; height: 112px; }
  .ax-empty .sx-empty__p b { color: var(--text); }
  .d-card.ax-dash { background: transparent; box-shadow: none; border: 1.5px dashed var(--st-offline-bd); }
  .ax-orow { display: flex; align-items: center; gap: 16px; min-height: 60px; font-size: 14px; border-top: 1px solid var(--hair); }
  .ax-orow__t { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .ax-orow__t b { font-size: 15px; font-weight: 700; color: var(--text); }
  .ax-orow__t span { font-size: 13px; color: var(--text-3); }
  .ax-orow__v { width: 110px; flex-shrink: 0; text-align: right; font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--text); }
  .ax-orow__v small { font-family: var(--font-ui); font-size: 13px; font-weight: 600; letter-spacing: 0; color: var(--text-3); margin-left: 4px; }
  .ax-orow__kg { width: 80px; flex-shrink: 0; text-align: right; color: var(--text-2); font-variant-numeric: tabular-nums; }
  .ax-orow__st { display: flex; justify-content: flex-end; width: 150px; flex-shrink: 0; }
  .ax-wi { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; padding: 4px 0; }
  .ax-wi__t { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .ax-wi__t b { font-size: 14.5px; font-weight: 700; color: var(--text); }
  .ax-wi__t span { font-size: 13px; line-height: 1.45; color: var(--text-2); }
  .ax-sent { display: flex; align-items: center; gap: 14px; }
  .ax-sent__t { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .ax-sent__t b { font-size: 15px; font-weight: 700; color: var(--text); }
  .ax-sent__t span { font-size: 13px; line-height: 1.45; color: var(--text-2); }
  .ax-back { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
  .ax-back svg { width: 16px; height: 16px; }
  .ax-help { align-items: flex-start; line-height: 1.45; }
  .ax-help svg { margin-top: 2px; flex-shrink: 0; }
  /* ---------- on-device voice read-aloud (page-local "vo-") ---------- */
  .vo-read { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 14px; border-radius: 999px; background: var(--tint-brand); color: var(--brand-600); font-size: 14px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .vo-read svg { width: 20px; height: 20px; }
  .vo-read.is-on { background: var(--brand-600); color: #FFFFFF; box-shadow: 0 6px 16px rgba(59,76,202,.28); }
  .vo-read.is-off { background: transparent; border: 1.5px dashed var(--st-offline-bd); color: var(--st-offline-fg); }
  .vo-lvl { display: flex; align-items: flex-end; gap: 2px; height: 14px; flex-shrink: 0; }
  .vo-lvl span { width: 3px; border-radius: 2px; background: currentColor; }
  .vo-row { display: flex; align-items: center; gap: 10px; }
  .vo-row__t { font-size: 13px; font-weight: 600; color: var(--text-3); }
  /* SM-02 phone: spacing trimmed so the control fits the 844 frame */
  .m-body.m-body--tight.vo-fit { gap: 12px; padding-bottom: 10px; }
  .vo-fit .m-hero { padding: 16px 20px; gap: 8px; }
  .vo-fit .m-row.m-row--c { padding-top: 8px; padding-bottom: 8px; }
  .vo-si { font-family: 'Noto Sans Sinhala', 'Inter', sans-serif; }
  .vo-ta { font-family: 'Noto Sans Tamil', 'Inter', sans-serif; }
  .vo-actrow { display: flex; align-items: center; gap: 8px; }
  .vo-actrow .m-btn--ghost { flex: 1; gap: 8px; white-space: nowrap; }
  .vo-actrow .vo-read { gap: 6px; padding: 0 14px 0 12px; }
  .m-body.m-body--tight.vo-tight { gap: 10px; }
  .vo-tight .m-hero { padding: 16px 20px; gap: 6px; }
  .vo-tight .m-hero__value { font-size: 42px; }
  .vo-tight .kvl__r { padding: 7px 0; }
  .m-seg.vo-seg { margin: 0; width: 212px; flex-shrink: 0; }
  .m-seg.vo-seg .m-seg__i { height: 32px; font-size: 13px; }
  .vo-cap { display: flex; flex-direction: column; gap: 6px; margin: 0 16px; padding: 12px 16px; border-radius: 18px; background: var(--tint-brand); }
  .vo-cap__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 700; color: var(--brand-600); }
  .vo-cap__head > span { display: flex; align-items: center; gap: 8px; }
  .vo-cap__alt { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 9px; border-radius: 999px; background: var(--surface); font-size: 12px; font-weight: 700; color: var(--text-2); white-space: nowrap; }
  .vo-cap__txt { font-size: 14px; line-height: 1.55; color: var(--text); }
  .vo-cap__now { font-weight: 700; color: var(--brand-700); }
  .vo-cap__en { font-size: 12px; line-height: 1.4; color: var(--text-3); }
  .vo-pack { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 13px; font-weight: 700; color: var(--text-2); white-space: nowrap; flex-shrink: 0; }
  .sx-countbtn { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px 0 12px; border-radius: 999px; background: #EEF0FF; color: #3B4CCA; font-size: 13px; font-weight: 700; white-space: nowrap; }
  .sx-countbtn svg { width: 14px; height: 14px; }
  .sx-countof { font-weight: 600; color: var(--text-3); }
</style>
<link rel="stylesheet" href="/assets/modern.css">
<link rel="stylesheet" href="/assets/ui2.css">
</head>
<body>
<main class="board sx-board" data-name="Store manager · complete app screens">
  <header class="page-head">
    <div class="page-head__left">
      <div class="page-head__eyebrow"><span class="page-head__num">P1</span>Prototype screens · Lodestar Store · Fathima Rizwan, Waypoint Fresh Nuwara Eliya (OUT106)</div>
      <div class="page-head__title">Store manager · complete app screens</div>
      <div class="page-head__lede">Every screen the store manager needs, on both devices she uses: her own phone (390 × 844) and the counter PC (1440 × 900). 42 screens: 33 phone, 9 desktop. Six come unchanged from page 04. Captions under each frame name the prototype link.</div>
    </div>
    <div class="page-head__right"><div class="brandmark"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#141B4D"/><path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D"/><circle cx="16" cy="16" r="2.2" fill="#141B4D"/></svg>Waypoint Lodestar</div><span class="brandmark__sub">Team Adagard · Tue 7 Apr 2026 run</span></div>
  </header>

  <section class="sx-flow" data-name="Screen inventory">
    <div class="sx-flow__h"><span class="sx-flow__n">00</span><span class="sx-flow__t">Screen inventory</span><span class="sx-flow__d">Every ID, its platform and where it links in the Figma prototype. Phone flow starts at SM-04, desktop at SM-26.</span></div>
    <div class="sx-inv">
      <div class="sx-inv__card" style="width:1240px;">
        <div class="sx-inv__title">Phone<span>33 screens · 390 × 844 (tall 390 × 1100)</span></div>
        <div class="sx-inv__r sx-inv__r--head"><span class="sx-inv__id">ID</span><span class="sx-inv__name">Screen</span><span class="sx-inv__plat">Platform</span><span class="sx-inv__to">Prototype links</span></div>
        <div class="sx-inv__r sx-inv__r--flow">01 · Entry</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-04</span></span><span class="sx-inv__name">Splash</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">tap → SM-05</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-05</span></span><span class="sx-inv__name">Sign in</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Send code → SM-06 · "New number?" hint → SM-31</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-06</span></span><span class="sx-inv__name">Verify code</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Verify → SM-07 · back → SM-05 · resend note → SM-31</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-07</span></span><span class="sx-inv__name">Onboarding 1 of 3</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Next → SM-08 · Skip → SM-10</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-08</span></span><span class="sx-inv__name">Onboarding 2 of 3</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Next → SM-09 · Skip → SM-10</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-09</span></span><span class="sx-inv__name">Onboarding 3 of 3</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Get started → SM-10</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-10</span></span><span class="sx-inv__name">Allow notifications</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Allow / Not now → SM-11</span></div>
        <div class="sx-inv__r sx-inv__r--flow">02 · Ordering</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-11</span></span><span class="sx-inv__name">Today · order day</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Start order → SM-13 · Orders tab → SM-12 · avatar → SM-22</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-13</span></span><span class="sx-inv__name">New order</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Review → SM-14 · close → SM-11</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-14</span></span><span class="sx-inv__name">Review &amp; submit</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Submit → SM-01 phone · back → SM-13</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-01</span></span><span class="sx-inv__name">Received<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Done → SM-12 · Edit → SM-13</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-12</span></span><span class="sx-inv__name">Orders</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Tue card → SM-15 · + → SM-13 · Today tab → SM-11</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-15</span></span><span class="sx-inv__name">Order detail</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Back → SM-02 phone</span></div>
        <div class="sx-inv__r sx-inv__r--flow">03 · Delivery day</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-02</span></span><span class="sx-inv__name">Order status &amp; ETA<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Window → SM-16 · thread → SM-15 · Start count → SM-03 count · Read aloud → speaks in place (state as SM-39)</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-16</span></span><span class="sx-inv__name">Why this window</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Got it / close → SM-02 phone</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-17</span></span><span class="sx-inv__name">Deferral notice · OUT027</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Acknowledge → SM-21 · Read aloud → SM-39</span></div>
        <div class="sx-inv__r sx-inv__r--flow">04 · Receiving</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-03</span></span><span class="sx-inv__name">Confirm receipt · count<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Damaged chip → SM-18 · Confirm → SM-03 confirmed</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-18</span></span><span class="sx-inv__name">Report issue</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Save issue / close → SM-03 count</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-03</span></span><span class="sx-inv__name">Receipt confirmed<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Receipts tab → SM-19</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-19</span></span><span class="sx-inv__name">Receipts &amp; credit notes</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">CN-2604-0441 → SM-20 · tabs → SM-11 / SM-12 / SM-21</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-20</span></span><span class="sx-inv__name">Credit note detail</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Back → SM-19</span></div>
        <div class="sx-inv__r sx-inv__r--flow">05 · Account</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-21</span></span><span class="sx-inv__name">Messages</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Matched → SM-20 · window → SM-16 · tabs</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-22</span></span><span class="sx-inv__name">Profile &amp; settings</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Back → SM-11 · Voice &amp; read aloud → SM-37 · Sign out → SM-05</span></div>
        <div class="sx-inv__r sx-inv__r--flow">06 · States</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-23</span></span><span class="sx-inv__name">Orders closed</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Start Wed 8 Apr order → SM-13 · back → SM-11</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-24</span></span><span class="sx-inv__name">No delivery today</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Start order → SM-13 · tabs</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-25</span></span><span class="sx-inv__name">Offline · draft saved</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Try sending now → SM-01 phone · Keep editing → SM-13</span></div>
        <div class="sx-inv__r sx-inv__r--flow">11 · Access &amp; system states</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-31</span></span><span class="sx-inv__name">Can't sign in</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Resend / voice call → SM-06 · I changed my number → SM-32</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-32</span></span><span class="sx-inv__name">Access request sent</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Done → SM-05 · Call Kandy Hub → phone dialer</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-33</span></span><span class="sx-inv__name">Session expired</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Sign in again → SM-05</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-34</span></span><span class="sx-inv__name">Update required</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Update now → SM-04 · Remind me after today's order → SM-11</span></div>
        <div class="sx-inv__r sx-inv__r--flow">12 · Voice</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-37</span></span><span class="sx-inv__name">Voice &amp; language</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Sinhala Download → SM-38 · back → SM-22</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-38</span></span><span class="sx-inv__name">Voice pack downloading</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Keep using the app → SM-11 · done / back → SM-37</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-39</span></span><span class="sx-inv__name">Deferral notice speaking</span><span class="sx-inv__plat">Phone</span><span class="sx-inv__to">Pause → SM-17 · Acknowledge → SM-21</span></div>
      </div>
      <div class="sx-inv__card" style="width:1240px;">
        <div class="sx-inv__title">Desktop<span>9 screens · 1440 × 900</span></div>
        <div class="sx-inv__r sx-inv__r--head"><span class="sx-inv__id">ID</span><span class="sx-inv__name">Screen</span><span class="sx-inv__plat">Platform</span><span class="sx-inv__to">Prototype links</span></div>
        <div class="sx-inv__r sx-inv__r--flow">07 · Entry &amp; today</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-26</span></span><span class="sx-inv__name">Sign in</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Sign in → SM-02 desktop · Trouble signing in? → SM-35</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-02</span></span><span class="sx-inv__name">Deliveries (dashboard)<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Start Wed order → SM-01 · Order → SM-27 · Receipts → SM-28 · Messages → SM-29 · avatar → SM-30</span></div>
        <div class="sx-inv__r sx-inv__r--flow">08 · Ordering</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-01</span></span><span class="sx-inv__name">Place order<span class="sx-kept">from page 04</span></span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Submit → SM-27 · Deliveries → SM-02</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-27</span></span><span class="sx-inv__name">Orders &amp; history</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">New order → SM-01 · Deliveries → SM-02 · Receipts → SM-28</span></div>
        <div class="sx-inv__r sx-inv__r--flow">09 · Receiving &amp; messages</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-28</span></span><span class="sx-inv__name">Receipts &amp; credit notes</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Messages → SM-29 · Order → SM-27 · Deliveries → SM-02</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-29</span></span><span class="sx-inv__name">Messages</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">View credit note → SM-28 · Open order thread → SM-27</span></div>
        <div class="sx-inv__r sx-inv__r--flow">10 · Account</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-30</span></span><span class="sx-inv__name">Settings</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Save / Discard → SM-02 desktop</span></div>
        <div class="sx-inv__r sx-inv__r--flow">11 · Access &amp; system states</div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-35</span></span><span class="sx-inv__name">Reset access</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Link in email → SM-02 · Back to sign in → SM-26</span></div>
        <div class="sx-inv__r"><span class="sx-inv__id"><span class="sid">SM-36</span></span><span class="sx-inv__name">Service unavailable</span><span class="sx-inv__plat">Desktop</span><span class="sx-inv__to">Try now → SM-27 · Keep editing → SM-01</span></div>
      </div>
    </div>
  </section>

  <div class="sx-plat" data-name="Platform · Phone"><div class="sx-plat__ic"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg></div><div class="vstack" style="gap:4px;"><span class="sx-plat__t">Phone · Lodestar Store</span><span class="sx-plat__d">Fathima's own phone. Tab bar (Today · Orders · Receipts · Messages) on top-level screens only, never mid-task.</span></div></div>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">01</span><span class="sx-flow__t">Entry</span><span class="sx-flow__d">First launch on Fathima's own phone: sign in with her number, three onboarding cards, notifications</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-04</span>Splash<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-04 Splash · phone">
            <div class="m-screen">

              <div class="sx-splash">
                <div class="statusbar sx-sb-light"><span class="mono">2:29</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
                <div class="sx-splash__mid">
                  <svg class="sx-splash__mark" viewBox="0 0 176 176">
                    <circle cx="88" cy="88" r="86" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="2"/>
                    <circle cx="88" cy="88" r="66" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="2"/>
                    <rect x="44" y="44" width="88" height="88" rx="24" fill="#141B4D" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="1.5"/>
                    <path d="M88 55 L95.2 80.8 L121 88 L95.2 95.2 L88 121 L80.8 95.2 L55 88 L80.8 80.8 Z" fill="#F5B83D"/>
                    <circle cx="88" cy="88" r="6" fill="#141B4D"/>
                    <circle cx="150" cy="38" r="3" fill="#FFCB5C"/><circle cx="26" cy="132" r="2.5" fill="#FFCB5C" fill-opacity=".7"/><circle cx="142" cy="150" r="2" fill="#FFFFFF" fill-opacity=".5"/><circle cx="36" cy="40" r="2" fill="#FFFFFF" fill-opacity=".4"/>
                  </svg>
                  <div class="sx-splash__t">Lodestar Store</div>
                  <div class="sx-splash__s">Every order, one thread.</div>
                </div>
                <div class="sx-splash__foot">
                  <div class="sx-splash__load"><div></div></div>
                  <div class="sx-splash__wg">Waypoint Group</div>
                  <div class="sx-splash__brands"><span><i style="background:#4ADE80;"></i>Fresh</span><span><i style="background:#F472B6;"></i>Style</span><span><i style="background:#CBD5E1;"></i>Tech</span></div>
                </div>
                <div class="homebar sx-home-light"><div></div></div>
              </div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Brand screen on launch. <b>Tap anywhere → SM-05</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-05</span>Sign in<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-05 Sign in · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:30</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="sx-auth">
                <div class="sx-brandrow"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg><span>Lodestar Store<small>Waypoint Group</small></span></div>
                <div class="m-title"><div class="m-h1">Sign in to your store</div><div class="m-sub">Use your registered phone number. We'll text you a 6-digit code.</div></div>
                <div class="sx-field">
                  <span class="sx-field__l">Phone number</span>
                  <div class="sx-field__box is-focus"><span class="sx-field__pre"><small>LK</small>+94</span><span class="sx-field__v">77 318 4526</span><span class="sx-caret"></span></div>
                  <span class="sx-field__hint">Store managers and receiving staff only. New number? Ask Kandy Hub to add you.</span>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Send code</div></div>
              <div class="sx-keypad">
                <div class="sx-keys"><div class="sx-key">1</div><div class="sx-key">2</div><div class="sx-key">3</div></div>
                <div class="sx-keys"><div class="sx-key">4</div><div class="sx-key">5</div><div class="sx-key">6</div></div>
                <div class="sx-keys"><div class="sx-key">7</div><div class="sx-key">8</div><div class="sx-key">9</div></div>
                <div class="sx-keys"><div class="sx-key sx-key--fn"></div><div class="sx-key">0</div><div class="sx-key sx-key--fn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div>
              </div>
              <div class="homebar sx-kbd-home"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Phone number sign-in. <b>Send code → SM-06</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-06</span>Verify code<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-06 Verify code · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Verify</b></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="sx-auth" style="padding-top:0;">
                <div class="m-title"><div class="m-h1">Enter the code</div><div class="m-sub">Sent by SMS to <b style="color:var(--text);">+94 77 318 4526</b></div></div>
                <div class="sx-otp"><div class="sx-otp__c">4</div><div class="sx-otp__c">8</div><div class="sx-otp__c">1</div><div class="sx-otp__c">2</div><div class="sx-otp__c">0</div><div class="sx-otp__c is-focus"><span class="sx-caret"></span></div></div>
                <div class="note" style="padding:0 20px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Resend code in <b>0:24</b></span></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Verify</div></div>
              <div class="sx-keypad">
                <div class="sx-keys"><div class="sx-key">1</div><div class="sx-key">2</div><div class="sx-key">3</div></div>
                <div class="sx-keys"><div class="sx-key">4</div><div class="sx-key">5</div><div class="sx-key">6</div></div>
                <div class="sx-keys"><div class="sx-key">7</div><div class="sx-key">8</div><div class="sx-key">9</div></div>
                <div class="sx-keys"><div class="sx-key sx-key--fn"></div><div class="sx-key">0</div><div class="sx-key sx-key--fn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div>
              </div>
              <div class="homebar sx-kbd-home"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">SMS code check. <b>Verify → SM-07</b> · back → SM-05</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-07</span>Onboarding 1 of 3<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-07 Onboarding 1 · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:32</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="sx-ob">
                <div class="sx-ob__top"><span class="sx-ob__step">1 of 3</span><span class="sx-ob__skip">Skip</span></div>
                <div class="sx-ill"><svg viewBox="0 0 326 300">
                  <circle cx="124" cy="150" r="106" fill="#FFFFFF" fill-opacity=".06"/>
                  <circle cx="124" cy="150" r="84" fill="#FFFFFF"/>
                  <circle cx="124" cy="150" r="76" fill="none" stroke="#F5B83D" stroke-width="10" stroke-linecap="round" stroke-dasharray="54 424" transform="rotate(-11 124 150)"/>
                  <path d="M124 84v8M190 150h-8M124 216v-8M58 150h8" stroke="#C3CAFA" stroke-width="4" stroke-linecap="round"/>
                  <path d="M124 150 L124 100" stroke="#141B4D" stroke-width="5" stroke-linecap="round"/>
                  <path d="M124 150 L155 168" stroke="#141B4D" stroke-width="7" stroke-linecap="round"/>
                  <circle cx="124" cy="150" r="7" fill="#F5B83D"/>
                  <rect x="80" y="246" width="88" height="32" rx="16" fill="#F5B83D"/>
                  <text x="124" y="267" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="15" font-weight="800" fill="#1A1300">4:00 PM</text>
                  <rect x="214" y="72" width="96" height="124" rx="16" fill="#FFFFFF"/>
                  <circle cx="234" cy="100" r="8" fill="#10B981"/><path d="M230 100l3 3 5-5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="248" y="96" width="48" height="8" rx="4" fill="#E0E4FF"/>
                  <circle cx="234" cy="134" r="8" fill="#10B981"/><path d="M230 134l3 3 5-5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="248" y="130" width="38" height="8" rx="4" fill="#E0E4FF"/>
                  <circle cx="234" cy="168" r="8" fill="#E3F7FB"/><path d="M234 162v12M229 165l10 6M229 171l10-6" stroke="#0E7490" stroke-width="1.8" stroke-linecap="round"/><rect x="248" y="164" width="44" height="8" rx="4" fill="#E0E4FF"/>
                  <path d="M288 30 L290.4 37.6 L298 40 L290.4 42.4 L288 50 L285.6 42.4 L278 40 L285.6 37.6 Z" fill="#F5B83D"/>
                  <path d="M36 50 L37.6 55 L42.6 56.6 L37.6 58.2 L36 63.2 L34.4 58.2 L29.4 56.6 L34.4 55 Z" fill="#FFCB5C" fill-opacity=".8"/>
                </svg></div>
                <div class="sx-dots"><div class="is-on"></div><div></div><div></div></div>
                <div class="m-title"><div class="m-h1">Order before 4 PM</div><div class="m-sub">Orders placed by 4:00 PM arrive the next morning, before you open. Quantities are suggested from your last orders and upcoming festivals.</div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Next</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Cutoff rule. <b>Next → SM-08</b> · Skip → SM-10</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-08</span>Onboarding 2 of 3<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-08 Onboarding 2 · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:32</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="sx-ob">
                <div class="sx-ob__top"><span class="sx-ob__step">2 of 3</span><span class="sx-ob__skip">Skip</span></div>
                <div class="sx-ill"><svg viewBox="0 0 326 300">
                  <circle cx="264" cy="56" r="16" fill="#FFCB5C"/><circle cx="272" cy="50" r="14" fill="#1E2A78"/>
                  <circle cx="40" cy="40" r="2" fill="#FFFFFF" fill-opacity=".6"/><circle cx="96" cy="24" r="1.6" fill="#FFFFFF" fill-opacity=".5"/><circle cx="210" cy="30" r="2" fill="#FFFFFF" fill-opacity=".5"/><circle cx="300" cy="104" r="1.6" fill="#FFFFFF" fill-opacity=".5"/>
                  <text x="163" y="98" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="14" font-weight="600" fill="#C9CFE8">Arrival window</text>
                  <rect x="94" y="110" width="138" height="46" rx="23" fill="#FFFFFF"/>
                  <text x="163" y="140" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="20" font-weight="800" fill="#141B4D">6:15–6:55</text>
                  <path d="M156 155 l7 9 l7 -9 z" fill="#FFFFFF"/>
                  <path d="M0 200 C60 150 110 140 170 176 C220 204 270 140 326 156 L326 300 L0 300 Z" fill="#5566E0" fill-opacity=".45"/>
                  <path d="M0 236 C80 200 150 210 210 228 C260 242 300 222 326 226 L326 300 L0 300 Z" fill="#0A0F2E"/>
                  <path d="M-6 292 C60 262 120 268 166 250 C212 232 262 232 332 226" stroke="#F5B83D" stroke-width="4" stroke-dasharray="10 10" fill="none"/>
                  <g transform="translate(0 -6)">
                    <rect x="126" y="206" width="60" height="34" rx="8" fill="#FFFFFF"/>
                    <path d="M186 214 h15 l11 13 v13 h-26 z" fill="#FFFFFF"/>
                    <path d="M189 217 h10 l8 10 h-18 z" fill="#9EE3F0"/>
                    <path d="M156 214v18M148.2 218.5l15.6 9M148.2 227.5l15.6-9" stroke="#0E7490" stroke-width="2.2" stroke-linecap="round"/>
                    <circle cx="143" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/><circle cx="197" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/>
                  </g>
                </svg></div>
                <div class="sx-dots"><div></div><div class="is-on"></div><div></div></div>
                <div class="m-title"><div class="m-h1">See your arrival window</div><div class="m-sub">By 7 PM you get a 40-minute window for the next morning, then live updates while the van is on the road.</div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Next</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Arrival window. <b>Next → SM-09</b> · Skip → SM-10</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-09</span>Onboarding 3 of 3<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-09 Onboarding 3 · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:33</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="sx-ob">
                <div class="sx-ob__top"><span class="sx-ob__step">3 of 3</span><span></span></div>
                <div class="sx-ill"><svg viewBox="0 0 326 300">
                  <circle cx="163" cy="150" r="118" fill="#FFFFFF" fill-opacity=".05"/>
                  <rect x="30" y="250" width="272" height="4" rx="2" fill="#FFFFFF" fill-opacity=".18"/>
                  <rect x="40" y="172" width="94" height="78" rx="8" fill="#F5B83D"/><rect x="79" y="172" width="16" height="78" fill="#FFD37A"/>
                  <rect x="54" y="106" width="74" height="66" rx="8" fill="#FFCB5C"/><rect x="83" y="106" width="16" height="66" fill="#FFE3A3"/>
                  <rect x="136" y="192" width="66" height="58" rx="8" fill="#9EE3F0"/><path d="M169 208v26M157.8 214.5l22.4 13M157.8 227.5l22.4-13" stroke="#0E7490" stroke-width="2.6" stroke-linecap="round"/>
                  <rect x="200" y="58" width="100" height="136" rx="14" fill="#FFFFFF"/><rect x="230" y="50" width="40" height="16" rx="6" fill="#C3CAFA"/>
                  <circle cx="220" cy="96" r="8" fill="#10B981"/><path d="M216 96l3 3 5-5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="234" y="92" width="52" height="8" rx="4" fill="#E0E4FF"/>
                  <circle cx="220" cy="126" r="8" fill="#10B981"/><path d="M216 126l3 3 5-5" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="234" y="122" width="42" height="8" rx="4" fill="#E0E4FF"/>
                  <circle cx="220" cy="156" r="8" fill="#F5B83D"/><path d="M216 156h8" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><rect x="234" y="152" width="46" height="8" rx="4" fill="#E0E4FF"/>
                  <circle cx="272" cy="214" r="28" fill="#10B981"/><path d="M260 214l8 8 16-16" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M30 60 L32 66.5 L38.5 68.5 L32 70.5 L30 77 L28 70.5 L21.5 68.5 L28 66.5 Z" fill="#F5B83D"/>
                </svg></div>
                <div class="sx-dots"><div></div><div></div><div class="is-on"></div></div>
                <div class="m-title"><div class="m-h1">Confirm what arrived</div><div class="m-sub">Count at the dock, report anything short or damaged with a photo, and the credit note is raised for you.</div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Get started</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Confirm receipt. <b>Get started → SM-10</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-10</span>Allow notifications<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-10 Allow notifications · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:33</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="sx-ob">
                <div class="sx-ob__top"><span class="sx-ob__step">Last step</span><span></span></div>
                <div class="sx-ill sx-ill--soft sx-ill--sm"><svg viewBox="0 0 326 200" style="width:326px; height:200px;">
                  <circle cx="163" cy="100" r="68" fill="#FFFFFF"/>
                  <g transform="translate(127 64) scale(3)" fill="none" stroke="#3B4CCA" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></g>
                  <circle cx="200" cy="64" r="13" fill="#F5B83D"/>
                  <rect x="20" y="46" width="72" height="24" rx="12" fill="#FFFFFF" fill-opacity=".85"/><rect x="32" y="55" width="40" height="6" rx="3" fill="#C3CAFA"/>
                  <rect x="236" y="124" width="72" height="24" rx="12" fill="#FFFFFF" fill-opacity=".85"/><rect x="248" y="133" width="44" height="6" rx="3" fill="#C3CAFA"/>
                </svg></div>
                <div class="m-title"><div class="m-h1">Know before the van arrives</div><div class="m-sub">Three kinds of alerts, only when something changes for your store.</div></div>
                <div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="m-row__main"><div class="m-row__title">Arrival window</div><div class="m-row__meta">By 7 PM, for the next morning</div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div><div class="m-row__main"><div class="m-row__title">Short or changed orders</div><div class="m-row__meta">The moment the depot knows</div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--star"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg></div><div class="m-row__main"><div class="m-row__title">Cutoff reminder</div><div class="m-row__meta">3:00 PM, if you haven't ordered</div></div></div>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Allow notifications</div><div class="m-btn m-btn--ghost">Not now</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Permission ask. <b>Allow → SM-11</b> · Not now → SM-11</div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">02</span><span class="sx-flow__t">Ordering</span><span class="sx-flow__d">Mon 6 Apr afternoon: build tomorrow's dry and chilled orders before the 4:00 PM cutoff</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-11</span>Today · order day<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-11 Today · order day · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:34</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Today · Mon 6 Apr</b><span>Nuwara Eliya · OUT106</span></div><div class="m-iconbtn sx-avbtn">FR</div></div>
              <div class="m-body m-body--xtight">
                <div class="m-hero m-hero--brand sx-hero--brand">
                  <div class="m-hero__label">Order for Tue 7 Apr closes at 4:00 PM</div>
                  <div class="m-hero__value">1 h 26 m<small>left</small></div>
                  <div class="m-progress" style="background:rgba(255,255,255,.14);"><div class="m-progress--star" style="width:70%; background:linear-gradient(90deg,#FFD37A,#F5B83D);"></div></div>
                  <div class="m-hero__meta">After 4:00 PM it goes to the <b style="color:#FFFFFF;">Wed 8 Apr</b> run</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Ready for you</b><span>from last Tuesday</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div><div class="m-row__main"><div class="m-row__title">Dry order</div><div class="m-row__meta">9 lines<span class="m-sep"></span>452 kg</div></div><div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">units</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></div><div class="m-row__main"><div class="m-row__title">Chilled order</div><div class="m-row__meta">7 lines<span class="m-sep"></span>296 kg</div></div><div class="m-row__trail"><span class="m-row__value">34</span><span class="m-row__unit">units</span></div></div>
                </div></div>
                <div class="m-banner m-banner--warn" style="background:#FFF6E0; color:#7A4B00;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg><div class="m-banner__txt"><b>New Year in 6 days</b><span>+18% on 5 lines, already in the suggested quantities.</span></div></div>
                <div class="m-section"><div class="m-section__head"><b>This morning</b><span>Mon 6 Apr</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Received 91 of 91</div><div class="m-row__meta">Arrived 6:38<span class="m-sep"></span><span class="m-tag m-tag--ok">Matched</span></div></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Start Tue 7 Apr order</div></div>
              <div class="m-tabbar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Order day home. <b>Start order → SM-13</b> · Orders → SM-12</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-13</span>New order<span class="screen-label__device">· Phone 390 × 1100</span></div>
<div class="frame frame--phone frame--tall mode-store" data-name="SM-13 New order · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div><div class="m-nav__stack"><b>New order</b><span>Tue 7 Apr · from last Tuesday</span></div><span class="m-pill"><span class="dot"></span>Draft</span></div>
              <div class="m-body m-body--xtight">
                <div class="sx-strip"><span class="sx-strip__l"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Orders close at 4:00 PM</span><span class="sx-strip__v">1 h 29 m</span></div>
                <div class="m-seg"><span class="m-seg__i is-on">Dry · 9 lines</span><span class="m-seg__i"><svg class="ic ic--sm" viewBox="0 0 24 24" style="color:var(--chilled-fg); margin-right:6px;"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled · 7 lines</span></div>
                <div class="m-section"><div class="m-section__head"><b>Dry order · ambient</b><span>quantities suggested</span></div><div class="m-group">
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Samba rice 5 kg</div><div class="m-row__meta">bag<span class="m-sep"></span>last Tue 14</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">14</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Soap bars</div><div class="m-row__meta">carton<span class="m-sep"></span>last Tue 6</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Red dhal 1 kg</div><div class="m-row__meta">case of 20<span class="m-sep"></span>last Tue 5</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">5</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Coconut oil 1 L</div><div class="m-row__meta">last Tue 5<span class="m-sep"></span><span class="sx-fest"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span></div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Wheat flour 1 kg</div><div class="m-row__meta">case of 20<span class="m-sep"></span>last Tue 4</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">4</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Sugar 1 kg</div><div class="m-row__meta">case of 20<span class="m-sep"></span>last Tue 2</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">2</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Biscuits, assorted</div><div class="m-row__meta">last Tue 8<span class="m-sep"></span><span class="sx-fest"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span></div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">10</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Tea 100 g</div><div class="m-row__meta">carton<span class="m-sep"></span>last Tue 5</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">5</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="m-row sx-line"><div class="m-row__main"><div class="m-row__title">Instant noodles</div><div class="m-row__meta">carton<span class="m-sep"></span>last Tue 6</div></div><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></div>
                  <div class="sx-addrow"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add item</div>
                </div></div>
                <div class="m-stats"><div class="m-stat"><span class="m-stat__v">58</span><span class="m-stat__l">units</span></div><div class="m-stat"><span class="m-stat__v">452</span><span class="m-stat__l">kg</span></div><div class="m-stat"><span class="m-stat__v">2.2</span><span class="m-stat__l">m³</span></div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Review 2 orders<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div><div class="m-actionbar__cap">Chilled: <b>34 units</b> · 296 kg · 1.3 m³</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Dry / chilled lines. <b>Review → SM-14</b> · close → SM-11</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-14</span>Review &amp; submit<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-14 Review & submit · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:37</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Review</b><span>Tue 7 Apr · Kandy Hub run</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero">
                  <div class="m-hero__label">You're ordering for Tue 7 Apr</div>
                  <div class="m-hero__value">92<small>units</small></div>
                  <div class="m-hero__meta">2 orders · 748 kg · 3.5 m³ · arrives before your 8:00 opening</div>
                </div>
                <div class="m-group">
                  <div class="m-row"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div><div class="m-row__main"><div class="m-row__title">Dry order</div><div class="m-row__meta">9 lines<span class="m-sep"></span>452 kg<span class="m-sep"></span>2.2 m³</div></div><div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">units</span></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row"><div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></div><div class="m-row__main"><div class="m-row__title">Chilled order</div><div class="m-row__meta">7 lines<span class="m-sep"></span>296 kg<span class="m-sep"></span>1.3 m³</div></div><div class="m-row__trail"><span class="m-row__value">34</span><span class="m-row__unit">units</span></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Delivery window</span><b>05:30–08:00</b></div>
                  <div class="m-kv"><span>Dock</span><b>Rear dock · Lawson St lane</b></div>
                  <div class="m-kv"><span>Arrival window</span><b>by 7 PM tonight</b></div>
                  <div class="m-kv"><span>Changes</span><b>open until 4:00 PM</b></div>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Submit 2 orders</div><div class="m-actionbar__cap">1 h 23 m before cutoff · chilled travels in a reefer</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Last check. <b>Submit → SM-01 phone</b> · back → SM-13</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-01</span>Received<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-01 Received · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">2:38</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__stack"><b>Lodestar Store</b><span>Nuwara Eliya · OUT106</span></div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
              </div>
              <div class="m-body m-body--xtight">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="vstack" style="gap:8px;">
                      <span class="m-hero__label" style="font-size:15px; font-weight:700; color:var(--st-delivered-fg);">Both orders received</span>
                      <span class="m-hero__value">2:38<small>PM</small></span>
                    </div>
                    <div class="okdisc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-hero__meta">In Kandy Hub's queue for <b>Tue 7 Apr</b></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Your orders</b><span>92 units</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dry order</div><div class="m-row__meta"><span class="id">ORD0104216</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">452 kg · 2.2 m³</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Chilled order</div><div class="m-row__meta"><span class="id">ORD0104217</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">34</span><span class="m-row__unit">296 kg · 1.3 m³</span></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Order thread</b><span>both orders</span></div>
                  <div class="m-group">
                    <div class="m-thread">
                      <div class="thread">
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">2:38 PM</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Planned</div><div class="thread__time">by 7 PM</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Loaded</div><div class="thread__time">·</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">En route</div><div class="thread__time">·</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">Tue</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--info">
                  <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <div class="m-banner__txt"><b>Your delivery window by 7 PM tonight</b><span>With the van and any changes.</span></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Done</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit orders · open until 4:00 PM</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Both orders in the queue. <b>Done → SM-12</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-12</span>Orders<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-12 Orders · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Orders</b><span>Nuwara Eliya · OUT106</span></div><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div></div>
              <div class="m-body m-body--tight">
                <div class="m-section"><div class="m-section__head"><b>Upcoming</b><span>1 delivery</span></div><div class="m-hero" style="gap:12px;">
                  <div class="m-hero__row" style="align-items:flex-start;"><div class="vstack" style="gap:6px;"><span class="m-hero__label">Next delivery · Tue 7 Apr</span><span class="m-hero__value" style="font-size:44px;">92<small>units</small></span></div><span class="m-pill m-pill--brand"><span class="dot"></span>Received</span></div>
                  <div class="m-hero__meta">2 orders in Kandy Hub's queue · arrival window by 7 PM · editable until 4:00 PM</div>
                  <div class="hstack" style="gap:16px;"><span class="m-tag"><span class="dot"></span>Dry 58</span><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled 34</span><div class="spacer"></div><span class="sx-link" style="font-size:14px;">Open</span><svg class="ic m-chev" viewBox="0 0 24 24" style="color:var(--brand-600);"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Past</b><span>last 7 days</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Mon 6 Apr</div><div class="m-row__meta">2 orders<span class="m-sep"></span>91 units</div></div><span class="m-tag m-tag--ok">Matched</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></div><div class="m-row__main"><div class="m-row__title">Sat 4 Apr</div><div class="m-row__meta">2 orders<span class="m-sep"></span>84 units</div></div><span class="m-tag m-tag--warn">1 credited</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Fri 3 Apr</div><div class="m-row__meta">Dry only<span class="m-sep"></span>52 units</div></div><span class="m-tag m-tag--ok">Matched</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Thu 2 Apr</div><div class="m-row__meta">2 orders<span class="m-sep"></span>88 units</div></div><span class="m-tag m-tag--ok">Matched</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Wed 1 Apr</div><div class="m-row__meta">Dry only<span class="m-sep"></span>49 units</div></div><span class="m-tag m-tag--ok">Matched</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
              </div>
              <div class="m-tabbar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Upcoming and past. <b>Tue card → SM-15</b> · + → SM-13</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-15</span>Order detail<span class="screen-label__device">· Phone 390 × 1100</span></div>
<div class="frame frame--phone frame--tall mode-store" data-name="SM-15 Order detail · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">5:10</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Chilled order</b><span>ORD0104217 · Tue 7 Apr</span></div><span class="m-pill m-pill--info"><span class="dot"></span>En route</span></div>
              <div class="m-body m-body--xtight">
                <div class="m-hero">
                  <div class="m-hero__row"><div class="vstack" style="gap:8px;"><span class="m-hero__label">On the van · VEH057</span><span class="m-hero__value">32<small>of 34</small></span></div><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></div>
                  <div class="m-hero__meta"><b style="color:var(--text);">2 cases yoghurt short</b> at loading, already credited. Follow-up on the Wed 8 Apr run.</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Order thread</b><span>every step, one record</span></div><div class="m-group"><div class="sx-vt"><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="sx-vt__line"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Received</span><span class="sx-vt__time">Mon 2:38 PM</span></div><span class="sx-vt__m">You submitted 34 units, 7 lines</span></div></div><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="sx-vt__line"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Planned</span><span class="sx-vt__time">Mon 6:40 PM</span></div><span class="sx-vt__m">VEH057 · Trip 1 · window 6:15–6:55</span></div></div><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot sx-vt__dot--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div><div class="sx-vt__line"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Short at loading</span><span class="sx-vt__time">3:21 AM</span></div><span class="sx-vt__m">Yoghurt 80 g, 2 of 6 cases out of stock · you saw it 3:24</span></div></div><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="sx-vt__line"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Loaded</span><span class="sx-vt__time">3:34 AM</span></div><span class="sx-vt__m">Kandy Hub Bay K2 · reefer at 3 °C · seal KDY-57-10413</span></div></div><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot sx-vt__dot--now"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div><div class="sx-vt__line sx-vt__line--todo"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">En route</span><span class="sx-vt__time">3:40 AM</span></div><span class="sx-vt__m">You're stop 1 of 2 · ETA ~6:35 (plan 5:31)</span></div></div><div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot sx-vt__dot--todo"></div></div><div class="sx-vt__body" style="padding-bottom:12px;"><div class="sx-vt__top"><span class="sx-vt__t">Delivered</span><span class="sx-vt__time">~6:35</span></div><span class="sx-vt__m">Then confirm your count</span></div></div></div></div></div>
                <div class="m-section"><div class="m-section__head"><b>Lines</b><span>7 lines · 296 kg</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--warn">−2</div><div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta">4 of 6 cases<span class="m-sep"></span><span class="m-tag m-tag--warn">Credited</span></div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">6 other lines, all loaded</div><div class="m-row__meta">Milk, chicken, sausages, butter, cheese, flavoured milk</div></div><div class="m-row__trail"><span class="m-row__value">28</span><span class="m-row__unit">units</span></div></div>
                </div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call Kandy Hub</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Order Thread, step by step. <b>Back → SM-02 phone</b></div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">03</span><span class="sx-flow__t">Delivery day</span><span class="sx-flow__d">Tue 7 Apr before dawn: when the van arrives, why that window, and what a moved order looks like</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-02</span>Order status &amp; ETA<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-02 Order status & ETA · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">5:05</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="13" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__stack"><b>Today · Tue 7 Apr</b><span>2 orders · Nuwara Eliya</span></div>
                <span class="m-pill m-pill--info"><span class="dot"></span>En route</span>
              </div>
              <div class="m-body m-body--tight vo-fit">
                <div class="m-hero">
                  <div class="m-hero__label">Arriving · VEH057 · you're stop 1</div>
                  <div class="m-hero__value" style="font-size:46px;">6:15–6:55</div>
                  <div class="m-hero__meta">ETA <b style="color:var(--text);">~6:35</b> · plan 5:31 · <span style="color:var(--st-delivered-fg); font-weight:700;">on time</span> · late risk 12%</div>
                  <span class="m-tag" style="color:var(--st-offline-fg);"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Updates pause above Ramboda · last 4:38</span>
                  <div class="vo-row"><div class="vo-read"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Read aloud</div><span class="vo-row__t">English · works offline</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Get ready to receive <span class="sx-countof">· 1 of 3</span></b><span class="sx-countbtn">Start count<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></div>
                  <div class="m-group">
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">2 staff at the door from 6:15</div></div>
                    </div>
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--ring"></div>
                      <div class="m-row__main"><div class="m-row__title">Chilled first, to the cold room</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>ORD0104217</span></div></div>
                    </div>
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--ring"></div>
                      <div class="m-row__main"><div class="m-row__title">Rear dock open</div><div class="m-row__meta">Van enters via the Lawson St lane</div></div>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--warn">
                  <svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>
                  <div class="m-banner__txt"><b>2 cases yoghurt short at loading</b><span>3:24 · credited · follow-up Wed 8 Apr</span></div>
                </div>
                <div class="m-group">
                  <div class="m-thread">
                    <div class="thread">
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded</div><div class="thread__time">3:34</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-now"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div><div class="thread__label">En route</div><div class="thread__time">3:40</div></div>
                      <div class="thread__bar"></div>
                      <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">~6:35</div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tabbar">
                <div class="tabbar__item is-active"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div>
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div>
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div>
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Van en route. <b>Window → SM-16</b> · <b>Start count → SM-03</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-16</span>Why this window<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-16 Why this window · sheet · phone">
            <div class="m-screen">

              <div class="sx-dimwrap">
                <div class="sx-behind">
                  <div class="statusbar"><span class="mono">5:05</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
                  <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Today · Tue 7 Apr</b><span>2 orders · Nuwara Eliya</span></div><span class="m-pill m-pill--info"><span class="dot"></span>En route</span></div>
                  <div class="m-hero" style="margin-top:4px;"><div class="m-hero__label">Arriving · VEH057 · you're stop 1</div></div>
                  <div class="sx-scrim"></div>
                </div>
                <div class="sx-sheet">
                  <div class="sx-grab"></div>
                  <div class="sx-sheet__head"><div class="vstack" style="gap:4px; flex:1;"><span class="m-h2" style="font-size:26px;">Why 6:15–6:55?</span><span class="m-sub" style="font-size:14px;">How Lodestar works it out</span></div><div class="m-iconbtn" style="background:var(--surface-3); box-shadow:none;"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div></div>
                  <div class="m-body m-body--xtight" style="padding-top:14px;">
                    <div class="sx-win">
                      <div class="sx-win__track">
                        <div class="sx-win__rail"></div>
                        <div class="sx-win__band" style="left:37.5%; width:33.3%;"></div>
                        <div class="sx-win__eta" style="left:54.2%;"><b>ETA ~6:35</b><i></i></div>
                      </div>
                      <div class="sx-win__ticks"><span>5:30</span><span>6:00</span><span>6:30</span><span>7:00</span><span>7:30</span></div>
                      <div class="sx-win__legend"><span><i></i>Arrival window</span><span>Free-flow plan said 5:31</span></div>
                    </div>
                    <div class="m-group">
                      <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg></div><div class="m-row__main"><div class="m-row__title">1,096 past deliveries</div><div class="m-row__meta">to OUT106, the basis of this window</div></div></div>
                      <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div><div class="m-row__main"><div class="m-row__title">Typical unload 12 min</div><div class="m-row__meta">per order · you have 2 today</div></div></div>
                      <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div><div class="m-row__main"><div class="m-row__title">Leaves Kandy 3:40, plan 5:31</div><div class="m-row__meta">monsoon hill road adds about 1 h</div></div></div>
                      <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M4 21 8 3M20 21 16 3M12 5v2M12 11v2M12 17v2"/></svg></div><div class="m-row__main"><div class="m-row__title">Roads clear today</div><div class="m-row__meta">Disruption index 100 of 100</div></div></div>
                    </div>
                    <div class="note"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span><b>Late risk 12%, advisory.</b> Staff from 6:15, not 5:30. The van's live ETA takes over on the road.</span></div>
                  </div>
                  <div class="m-actionbar"><div class="m-btn">Got it</div></div>
                  <div class="homebar"><div></div></div>
                </div>
              </div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">ML explainer sheet. <b>Got it → SM-02 phone</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-17</span>Deferral notice · OUT027<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-17 Deferral notice · OUT027 · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">6:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Notice</b><span>Kiribathgoda · OUT027</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero sx-hero--warn">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label" style="color:var(--st-deferred-fg); font-weight:700;">Chilled order moved</span><span style="font-size:13px; font-weight:600; color:var(--text-3);">Mon 6 Apr · 6:40 PM</span></div>
                  <div class="m-hero__value">Wed 8 Apr</div>
                  <div class="m-hero__meta"><span class="id" style="color:var(--text);">ORD0104188</span> · 1.6 m³ · first stop on Trip 1, window 05:00–07:30</div>
                </div>
                <div class="m-group" style="padding:4px 16px;">
                  <div class="kvl">
                    <div class="kvl__r"><span>Reason</span><span>Reefer space full on Tue 7 Apr · <span class="id" style="color:var(--st-deferred-fg);">CAP-REEFER</span></span></div>
                    <div class="kvl__r"><span>Your shelves</span><span>Last delivery this morning, so chilled cover lasts to Wed.</span></div>
                    <div class="kvl__r"><span>Fair to you</span><span>Your <b>next order won't be moved</b>. It's protected.</span></div>
                  </div>
                </div>
                <div class="m-group"><div class="m-thread"><div class="thread"><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">6:40 PM</div></div><div class="thread__bar is-warn"></div><div class="thread__step is-warn"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><div class="thread__label">Moved</div><div class="thread__time">Tue</div></div><div class="thread__bar"></div><div class="thread__step"><div class="thread__node"></div><div class="thread__label">En route</div><div class="thread__time">Wed</div></div><div class="thread__bar"></div><div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">Wed</div></div></div></div></div>
                <div class="quote" style="padding:0 20px; font-size:14px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>"Reserved your first slot on Wed Trip 1." · N. Perera, dispatcher</span></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Acknowledge</div><div class="vo-actrow"><div class="vo-read"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Read aloud</div><div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatcher</div></div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Variant for another store. <b>Acknowledge → SM-21</b> · Read aloud → SM-39</div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">04</span><span class="sx-flow__t">Receiving</span><span class="sx-flow__d">At the dock: count, report what is wrong, and see the credit note that follows</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-03</span>Confirm receipt · count<span class="screen-label__device">· Phone 390 × 1100</span></div>
<div class="frame frame--phone frame--tall mode-store" data-name="SM-03 Confirm receipt · count">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">7:08</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__stack"><b>Confirm receipt</b><span>Tue 7 Apr · VEH057 · arrived 6:33</span></div>
                <div style="width:40px; flex-shrink:0;"></div>
              </div>
              <div class="m-body m-body--xtight">
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>
                  <div class="m-banner__txt"><b>Driver's record not synced yet</b><span>Low signal on his phone. Confirm your own count now, we'll match it later.</span></div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__row">
                    <div class="vstack" style="gap:8px;">
                      <span class="m-hero__label">Chilled received · <span class="id">ORD0104217</span></span>
                      <span class="m-hero__value">31<small>of 34</small></span>
                    </div>
                    <span class="m-pill m-pill--warn">3 to credit</span>
                  </div>
                  <div class="m-hero__meta"><b style="color:var(--text);">2 yoghurt short</b> (known 3:24) + <b style="color:var(--text);">1 chicken tray damaged</b>, credited on confirm.</div>
                </div>
                <div class="m-group">
                    <div class="cmp cmp--head"><span class="cmp__o">Order</span><span class="cmp__n">Ordered</span><span class="cmp__n">Loaded</span><span class="cmp__c">Your count</span></div>
                    <div class="cmp"><span class="cmp__o"><b>Dry</b><span class="id">ORD0104216</span></span><span class="cmp__n">58</span><span class="cmp__n">58</span><span class="cmp__c"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">58</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span></div>
                    <div class="cmp"><span class="cmp__o"><b style="color:var(--chilled-fg);">Chilled</b><span class="id">ORD0104217</span></span><span class="cmp__n">34</span><span class="cmp__n" style="color:var(--st-deferred-fg);">32</span><span class="cmp__c"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">31</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Chilled lines</b><span>7 lines</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--warn">−2</div>
                      <div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta">4 of 6 cases<span class="m-sep"></span><span class="m-tag m-tag--warn">Short at the dock, 3:24</span></div></div>
                    </div>
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--bad">−1</div>
                      <div class="m-row__main"><div class="m-row__title">Whole chicken 1 kg</div><div class="m-row__meta">5 of 6 trays<span class="m-sep"></span><span class="m-tag m-tag--bad">1 damaged</span></div></div>
                    </div>
                    <div class="issue-x">
                      <div class="hstack" style="gap:12px; align-items:flex-start;">
                        <div class="m-photo m-photo--sm"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                        <div class="ichips"><span class="ichip">Short</span><span class="ichip is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Damaged · 1</span><span class="ichip">Temperature</span><span class="ichip">Wrong item</span></div>
                      </div>
                      <span style="font-size:13px; color:var(--text-2);"><b style="color:var(--text);">Tray torn, leaking</b> · photo 6:52</span>
                      <span class="cv-hint" style="margin-top:-4px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Suggested from your photo · <b>confirm</b></span>
                    </div>
                    <div class="m-row m-row--c">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">5 other lines</div><div class="m-row__meta">Milk, sausages, butter, cheese, flavoured milk</div></div>
                      <div class="m-row__trail"><span class="m-row__value">22</span><span class="m-row__unit">of 22</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Confirm receipt</div>
                <div class="m-actionbar__cap">Received by <b>M. Ilyas</b> · confirming as <b>Fathima Rizwan</b></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Count both orders; damage suggested from her photo. <b>Damaged → SM-18</b> · Confirm → next</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-18</span>Report issue<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-18 Report issue · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">6:52</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div><div class="m-nav__stack"><b>Report an issue</b><span>ORD0104217 · chilled</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--xtight">
                <div class="m-title"><div class="m-eyebrow"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Whole chicken 1 kg</span></div><div class="m-h2" style="font-size:26px;">1 tray damaged</div><div class="m-sub" style="font-size:14px;">6 trays ordered · tray of 10 · counted 6:52</div></div>
                <div class="m-section"><div class="m-section__head"><b>What's wrong?</b><span>pick one</span></div><div class="m-choices">
                  <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>Short</div>
                  <div class="m-choice sx-choice--bad"><svg class="ic" viewBox="0 0 24 24"><path d="M4 4h16v6l-3 2 3 2v6H4v-6l3-2-3-2z"/></svg>Damaged</div>
                  <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>Temperature</div>
                  <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg>Wrong item</div>
                </div></div>
                <div class="sx-steprow"><div class="sx-steprow__t"><b>Trays affected</b><span>credited on confirm</span></div><div class="m-stepper"><span class="m-stepper__b">−</span><span class="m-stepper__v">1</span><span class="m-stepper__b">+</span></div></div>
                <div class="m-section"><div class="m-section__head"><b>Photo</b><span>1 added</span></div><div class="sx-photos"><div class="sx-shot"><span>6:52</span></div><div class="sx-addshot"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Add photo</div></div></div>
                <div class="sx-textarea">Tray torn, leaking at one corner.<small>Note for Kandy Hub · optional</small></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Save issue</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Type, quantity, photo, note. <b>Save issue → SM-03 count</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-03</span>Receipt confirmed<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-03 Receipt confirmed">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">7:10</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__stack"><b>Lodestar Store</b><span>Nuwara Eliya · OUT106</span></div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
              </div>
              <div class="m-body m-body--xtight">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="vstack" style="gap:8px;">
                      <span class="m-hero__label" style="font-size:15px; font-weight:700; color:var(--st-delivered-fg);">Receipt confirmed</span>
                      <span class="m-hero__value">7:10<small>AM</small></span>
                    </div>
                    <div class="okdisc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-hero__meta">Credit note <b class="id" style="color:var(--text);">CN-2604-0441</b> raised for <b style="color:var(--text);">3 units</b></div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Dry order</div><div class="m-row__meta"><span class="id">ORD0104216</span><span class="m-sep"></span><span class="m-tag m-tag--ok">Complete</span></div></div>
                    <div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">of 58</span></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Chilled order</div><div class="m-row__meta"><span class="id">ORD0104217</span><span class="m-sep"></span><span class="m-tag m-tag--warn">3 credited</span></div></div>
                    <div class="m-row__trail"><span class="m-row__value">31</span><span class="m-row__unit">of 34</span></div>
                  </div>
                </div>
                <div class="m-banner m-banner--info">
                  <svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  <div class="m-banner__txt"><b>Follow-up on the Wed 8 Apr run</b><span>Yoghurt 80 g × 2 cases, already booked</span></div>
                </div>
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <div class="m-banner__txt"><b>Waiting for the driver's record</b><span>VEH057 in low signal since 4:38. We'll match its POD automatically. Nothing to do.</span></div>
                </div>
                <div class="m-group">
                  <div class="m-thread">
                    <div class="thread">
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded</div><div class="thread__time">3:34</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">En route</div><div class="thread__time">3:40</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Delivered</div><div class="thread__time">6:33</div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tabbar">
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div>
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div>
                <div class="tabbar__item is-active"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div>
                <div class="tabbar__item"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Done at 7:10. <b>Receipts tab → SM-19</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-19</span>Receipts &amp; credit notes<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-19 Receipts & credit notes · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">9:04</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Receipts</b><span>Nuwara Eliya · OUT106</span></div><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero">
                  <div class="m-hero__label">Credited this week</div>
                  <div class="m-hero__value">3<small>units</small></div>
                  <div class="m-hero__meta">Every receipt this week matches the driver's record.</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Credit notes</b><span>April</span></div><div class="m-group">
                  <div class="m-row m-row--c m-row--sel"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></div><div class="m-row__main"><div class="m-row__title"><span class="id">CN-2604-0441</span></div><div class="m-row__meta">Tue 7 Apr<span class="m-sep"></span>2 lines</div></div><div class="m-row__trail"><span class="m-row__value">3</span><span class="m-row__unit">units</span></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></div><div class="m-row__main"><div class="m-row__title"><span class="id">CN-2604-0417</span></div><div class="m-row__meta">Sat 4 Apr<span class="m-sep"></span>1 line</div></div><div class="m-row__trail"><span class="m-row__value">1</span><span class="m-row__unit">unit</span></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Receipts</b><span>this week</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Tue 7 Apr</div><div class="m-row__meta">You 7:10<span class="m-sep"></span>driver 8:40</div></div><div class="m-row__trail"><span class="m-row__value">89</span><span class="m-row__unit">of 92</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Mon 6 Apr</div><div class="m-row__meta">You 6:59<span class="m-sep"></span>matched</div></div><div class="m-row__trail"><span class="m-row__value">91</span><span class="m-row__unit">of 91</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Sat 4 Apr</div><div class="m-row__meta">M. Ilyas 6:49<span class="m-sep"></span>matched</div></div><div class="m-row__trail"><span class="m-row__value">83</span><span class="m-row__unit">of 84</span></div></div>
                </div></div>
              </div>
              <div class="m-tabbar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">All receipts. <b>CN-2604-0441 → SM-20</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-20</span>Credit note detail<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-20 Credit note detail · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">9:05</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Credit note</b><span>CN-2604-0441</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--xtight">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label">Credited · Tue 7 Apr</span><span class="m-pill m-pill--ok"><span class="dot"></span>Matched</span></div>
                  <div class="m-hero__value">3<small>units</small></div>
                  <div class="m-hero__meta">On <span class="id" style="color:var(--text);">ORD0104217</span> · your count 7:10 · driver's record 8:40</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Lines</b><span>2 lines</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--warn">−2</div><div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta">Short at loading<span class="m-sep"></span>3:24</div></div><div class="m-row__trail"><span class="m-row__value">2</span><span class="m-row__unit">cases</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--bad">−1</div><div class="m-row__main"><div class="m-row__title">Whole chicken 1 kg</div><div class="m-row__meta">Damaged<span class="m-sep"></span>2 photos</div></div><div class="m-row__trail"><span class="m-row__value">1</span><span class="m-row__unit">tray</span></div></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Evidence</b><span>both sides</span></div><div class="sx-photos"><div class="sx-shot"><span>You 6:52</span></div><div class="sx-shot" style="background:linear-gradient(160deg,#DCCDB6 0%,#B99E78 100%);"><span>Driver 6:57</span></div></div></div>
                <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><div class="m-banner__txt"><b>Yoghurt follow-up on Wed 8 Apr</b><span>2 cases, already booked on the run</span></div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Download PDF</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">What was credited and why. <b>Back → SM-19</b></div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">05</span><span class="sx-flow__t">Account</span><span class="sx-flow__d">Notices in one place, and the store profile that tells drivers how to receive</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-21</span>Messages<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-21 Messages · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">8:44</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Messages</b><span>Notices for OUT106</span></div><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div></div>
              <div class="m-body m-body--xtight">
                <div class="m-seg"><span class="m-seg__i is-on">All</span><span class="m-seg__i">Needs action · 0</span></div>
                <div class="m-section"><div class="m-section__head"><b>Today</b><span>Tue 7 Apr</span></div><div class="m-group">
                  <div class="sx-nrow sx-nrow--new"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div><div class="sx-nrow__main"><div class="sx-nrow__k"><span>Receipt matched</span><span class="hstack" style="gap:6px;">8:40<span class="sx-unread"></span></span></div><div class="sx-nrow__t">Your count agrees with the driver's record</div><div class="sx-nrow__m">CN-2604-0441 now has both photos</div></div></div>
                  <div class="sx-nrow sx-nrow--new"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div><div class="sx-nrow__main"><div class="sx-nrow__k"><span>Delivery</span><span class="hstack" style="gap:6px;">6:33<span class="sx-unread"></span></span></div><div class="sx-nrow__t">VEH057 arrived at your rear dock</div></div></div>
                  <div class="sx-nrow"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div><div class="sx-nrow__main"><div class="sx-nrow__k"><span>Shortfall · seen 3:24</span><span class="hstack" style="gap:6px;">3:21</span></div><div class="sx-nrow__t">2 cases yoghurt 80 g short</div><div class="sx-nrow__m">Credited · follow-up Wed 8 Apr</div></div></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Yesterday</b><span>Mon 6 Apr</span></div><div class="m-group">
                  <div class="sx-nrow"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="sx-nrow__main"><div class="sx-nrow__k"><span>Arrival window</span><span class="hstack" style="gap:6px;">6:40 PM</span></div><div class="sx-nrow__t">Tue 7 Apr: 6:15–6:55, stop 1</div></div></div>
                  <div class="sx-nrow"><div class="m-row__lead m-row__lead--star"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg></div><div class="sx-nrow__main"><div class="sx-nrow__k"><span>New Year</span><span class="hstack" style="gap:6px;">9:00 AM</span></div><div class="sx-nrow__t">Last run before the holiday: Sat 11 Apr</div><div class="sx-nrow__m">Order by Fri 10 Apr, 4:00 PM</div></div></div>
                </div></div>
              </div>
              <div class="m-tabbar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages<span class="m-tab__badge">2</span></div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Structured notices. <b>Matched → SM-20</b> · window → SM-16</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-22</span>Profile &amp; settings<span class="screen-label__device">· Phone 390 × 1100</span></div>
<div class="frame frame--phone frame--tall mode-store" data-name="SM-22 Profile & settings · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">7:10</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Profile & settings</b></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="sx-prof"><div class="sx-prof__av">FR</div><div class="sx-prof__t"><b>Fathima Rizwan</b><span>Store manager · +94 77 318 4526</span></div></div>
                <div class="m-section"><div class="m-section__head"><b>Store</b><span>OUT106</span></div><div class="m-group">
                  <div class="sx-kv2"><span>Outlet</span><b>Waypoint Fresh Nuwara Eliya<small>supplied from Kandy Hub</small></b></div>
                  <div class="sx-kv2"><span>Dock</span><b>Rear dock, normal access<small>via the Lawson St service lane</small></b></div>
                  <div class="sx-kv2"><span>Delivery window</span><b>05:30–08:00</b></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Receiving</b><span>shown to the driver</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="m-row__main"><div class="m-row__title">At the door from</div></div><span class="sx-chip">6:15 AM</span></div>
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg></div><div class="m-row__main"><div class="m-row__title">Receiving staff</div><div class="m-row__meta">M. Ilyas · S. Kumar</div></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Notifications</b><span></span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Arrival window</div><div class="m-row__meta">by 7 PM the evening before</div></div><div class="sx-tg is-on"><div></div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Van on the way</div><div class="m-row__meta">live updates from departure</div></div><div class="sx-tg is-on"><div></div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Short or moved orders</div><div class="m-row__meta">always on</div></div><div class="sx-tg is-on is-lock"><div></div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Cutoff reminder</div><div class="m-row__meta">3:00 PM if you haven't ordered</div></div><div class="sx-tg"><div></div></div></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Language</b><span style="color:var(--brand-600);">Voice &amp; read aloud ›</span></div><div class="m-seg"><span class="m-seg__i is-on">English</span><span class="m-seg__i vo-si">සිංහල</span><span class="m-seg__i vo-ta">தமிழ்</span></div></div>
                <div class="m-group"><div class="m-row m-row--c"><div class="m-row__lead m-row__lead--bad"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></div><div class="m-row__main"><div class="m-row__title"><span style="color:var(--st-exception-fg);">Sign out</span></div></div></div></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Store, staff, alerts, language. <b>Back → SM-11</b> · Voice &amp; read aloud → SM-37</div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">06</span><span class="sx-flow__t">States</span><span class="sx-flow__d">After cutoff, a non-operating day, and no internet at the store</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-23</span>Orders closed<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-23 Orders closed · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">4:05</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div><div class="m-nav__stack"><b>New order</b><span>Mon 6 Apr · 4:05 PM</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero sx-hero--dashed">
                  <div class="m-hero__label" style="display:flex; align-items:center; gap:8px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Tuesday's orders closed at 4:00 PM</div>
                  <div class="m-hero__value">Wed 8 Apr</div>
                  <div class="m-hero__meta">A new order now goes to the <b style="color:var(--text);">Wed 8 Apr</b> run. Same thread, new date, stated before you submit.</div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Delivery</span><b>Wed 8 Apr · 05:30–08:00</b></div>
                  <div class="m-kv"><span>Orders close</span><b>Tue 7 Apr · 4:00 PM</b></div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Already on Tuesday's van</b><span>not affected</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">2 orders, 92 units</div><div class="m-row__meta">Received 2:38 PM<span class="m-sep"></span>window by 7 PM</div></div></div>
                </div></div>
                <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg><div class="m-banner__txt"><b>Something urgent for tomorrow?</b><span>Call Kandy Hub. They add it only if the van has space.</span></div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Start Wed 8 Apr order</div><div class="m-btn m-btn--ghost">Back to Today</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">After 4:00 PM. <b>Start Wed order → SM-13</b> · back → SM-11</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-24</span>No delivery today<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-24 No delivery today · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">8:10</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Today · Sun 12 Apr</b><span>Nuwara Eliya · OUT106</span></div><div class="m-iconbtn sx-avbtn">FR</div></div>
              <div class="m-body m-body--tight">
                <div class="sx-empty">
                  <svg class="sx-empty__ill" viewBox="0 0 180 132">
                    <rect x="40" y="16" width="100" height="104" rx="16" fill="#EEF0FF"/>
                    <path d="M40 32a16 16 0 0 1 16-16h68a16 16 0 0 1 16 16v14H40z" fill="#3B4CCA"/>
                    <rect x="62" y="8" width="8" height="18" rx="4" fill="#141B4D"/><rect x="110" y="8" width="8" height="18" rx="4" fill="#141B4D"/>
                    <text x="90" y="39" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">Sun</text>
                    <text x="90" y="98" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="40" font-weight="800" fill="#141B4D">12</text>
                    <circle cx="152" cy="32" r="14" fill="#F5B83D"/><circle cx="158" cy="26" r="12" fill="#FFFFFF"/>
                    <path d="M22 62 L24 68.5 L30.5 70.5 L24 72.5 L22 79 L20 72.5 L13.5 70.5 L20 68.5 Z" fill="#F5B83D"/>
                  </svg>
                  <div class="sx-empty__t">No delivery today</div>
                  <div class="sx-empty__p">Depots are closed on Sunday, and on Mon 13 and Tue 14 Apr for Sinhala &amp; Tamil New Year.</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><div class="m-row__main"><div class="m-row__title">Next delivery</div><div class="m-row__meta">Wed 15 Apr · 05:30–08:00</div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Last delivery</div><div class="m-row__meta">Sat 11 Apr<span class="m-sep"></span><span class="m-tag m-tag--ok">Matched</span></div></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Start Wed 15 Apr order</div></div>
              <div class="m-tabbar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Today</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>Orders</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Sun 12 Apr, closed. <b>Start Wed 15 Apr order → SM-13</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-25</span>Offline · draft saved<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-25 Offline · draft saved · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:35</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Review</b><span>Tue 7 Apr · Kandy Hub run</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><div class="m-banner__txt"><b>No internet at the store</b><span>Your orders are safe on this phone.</span></div></div>
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label">Saved as a draft · 2:35 PM</span><span class="sx-dash"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Not sent</span></div>
                  <div class="m-hero__value">92<small>units</small></div>
                  <div class="m-hero__meta">Sends by itself the moment you're back online.</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div><div class="m-row__main"><div class="m-row__title">Dry order</div><div class="m-row__meta"><span class="sx-dash">Draft</span></div></div><div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">452 kg</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></div><div class="m-row__main"><div class="m-row__title">Chilled order</div><div class="m-row__meta"><span class="sx-dash">Draft</span></div></div><div class="m-row__trail"><span class="m-row__value">34</span><span class="m-row__unit">296 kg</span></div></div>
                </div>
                <div class="cstate cstate--warn" style="margin:0 16px;">
                  <div class="cstate__top"><span class="cstate__l" style="color:var(--st-deferred-fg);"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Orders close at 4:00 PM</span><span class="cstate__v" style="color:var(--st-deferred-fg);">1 h 25 m</span></div>
                  <span class="cstate__s" style="font-size:14px;">Still offline at 3:30 PM? Call Kandy Hub and read out the draft.</span>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Try sending now</div><div class="m-btn m-btn--ghost">Keep editing</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Store Wi-Fi down. <b>Try sending → SM-01 phone</b></div>
    </div>
    </div>
  </section>

  <div class="sx-plat" data-name="Platform · Desktop"><div class="sx-plat__ic"><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div><div class="vstack" style="gap:4px;"><span class="sx-plat__t">Desktop · Lodestar Store</span><span class="sx-plat__d">The counter PC. Same top navigation on every screen: Order · Deliveries · Receipts · Messages, settings under the avatar.</span></div></div>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">07</span><span class="sx-flow__t">Entry &amp; today</span><span class="sx-flow__d">The counter PC: sign in once, then today's delivery is the home page</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-26</span>Sign in<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-26 Sign in · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/sign-in</div></div>
              <div class="sx-dauth">
                <div class="sx-dauth__brand">
                  <div class="sx-dauth__logo"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="sx-dauth__h">Every order,<br>one thread.</div>
                  <div class="vstack" style="gap:16px;">
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span><div><b>Order before 4:00 PM</b> for the next morning's run</div></div>
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><div><b>Arrival window by 7 PM</b>, live while the van is out</div></div>
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><div><b>Confirm what arrived</b>, credit notes raised for you</div></div>
                  </div>
                  <div class="sx-dauth__foot"><b style="color:#FFFFFF;">Waypoint Group</b><span class="m-sep" style="background:#B9C0E6;"></span>Fresh · Style · Tech</div>
                  <svg viewBox="0 0 620 200" style="width:620px; height:200px; margin:0 -56px; flex-shrink:0;">
                    <path d="M0 100 C90 50 180 40 270 84 C350 120 450 40 620 60 L620 200 L0 200 Z" fill="#5566E0" fill-opacity=".35"/>
                    <path d="M0 146 C130 104 250 116 360 134 C460 150 540 130 620 134 L620 200 L0 200 Z" fill="#0A0F2E" fill-opacity=".85"/>
                    <path d="M0 188 C110 160 200 168 290 152 C380 136 480 136 620 130" stroke="#F5B83D" stroke-width="4" stroke-dasharray="10 10" fill="none"/>
                    <g transform="translate(150 -86)"><rect x="126" y="206" width="60" height="34" rx="8" fill="#FFFFFF"/><path d="M186 214 h15 l11 13 v13 h-26 z" fill="#FFFFFF"/><path d="M189 217 h10 l8 10 h-18 z" fill="#9EE3F0"/><path d="M156 214v18M148.2 218.5l15.6 9M148.2 227.5l15.6-9" stroke="#0E7490" stroke-width="2.2" stroke-linecap="round"/><circle cx="143" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/><circle cx="197" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/></g>
                    <circle cx="540" cy="30" r="14" fill="#FFCB5C"/><circle cx="547" cy="25" r="12" fill="#27348F"/>
                  </svg>
                </div>
                <div class="sx-dauth__form">
                  <div class="sx-dcard">
                    <div class="vstack" style="gap:6px;"><span class="d-h1" style="font-size:30px;">Sign in</span><span class="d-sub" style="font-size:15px;">For store managers and receiving staff of Waypoint outlets.</span></div>
                    <div class="sx-field">
                      <div class="between"><span class="sx-field__l">Phone number</span><span class="sx-link" style="font-size:13px;">Change</span></div>
                      <div class="sx-field__box" style="height:54px;"><span class="sx-field__pre"><small>LK</small>+94</span><span class="sx-field__v" style="font-size:19px;">77 318 4526</span></div>
                    </div>
                    <div class="sx-field">
                      <div class="between"><span class="sx-field__l">6-digit code from SMS</span><span style="font-size:13px; color:var(--text-3);">Resend in 0:24</span></div>
                      <div class="sx-otp"><div class="sx-otp__c" style="height:56px;">4</div><div class="sx-otp__c" style="height:56px;">8</div><div class="sx-otp__c" style="height:56px;">1</div><div class="sx-otp__c" style="height:56px;">2</div><div class="sx-otp__c" style="height:56px;">0</div><div class="sx-otp__c is-focus" style="height:56px;">7</div></div>
                    </div>
                    <div class="sx-check"><i><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></i>Remember this counter PC for 30 days</div>
                    <span class="d-btn d-btn--primary sx-dbtn-xl">Sign in<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                    <div class="sx-divider"></div>
                    <div class="sx-help"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Trouble signing in? Call Kandy Hub, +94 81 222 4410</div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Phone + SMS code, remembered for 30 days. <b>Sign in → SM-02 desktop</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-02</span>Deliveries (dashboard)<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-02 Deliveries · desktop">
            <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/deliveries</div></div>
            <div class="s-shell">
              <div class="s-top">
                <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                <div class="s-top__nav">
                  <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                  <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries<span class="s-top__count">1</span></span>
                  <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                  <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                </div>
                <div class="spacer"></div>
                <span class="s-top__clock">Tue 7 Apr · 3:30 AM</span>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                <span class="d-avatar">FR</span>
              </div>
              <div class="d-main">
                <div class="d-head">
                  <div class="d-head__txt">
                    <div class="d-eyebrow">Tue 7 Apr <span class="m-sep"></span> 2 orders <span class="m-sep"></span> 1 van <span class="m-sep"></span> live from Kandy Hub</div>
                    <div class="d-h1">Today's delivery</div>
                  </div>
                  <span class="m-pill m-pill--loaded"><span class="dot"></span>Loading at Kandy Hub · Bay K2</span>
                </div>
                <div class="hstack" style="gap:18px; align-items:stretch;">
                  <div class="d-card" style="flex:1;">
                    <div class="arr">
                      <div class="vstack" style="gap:10px; width:430px; flex-shrink:0;">
                        <span class="d-kpi__l">Expected arrival · you're stop 1 of 2</span>
                        <span class="arr__v">6:15–6:55</span>
                        <span class="d-sub">ETA <b style="color:var(--text);">~6:35</b> · plan 5:31 (monsoon hill road) · <span class="id">VEH057</span> reefer van · Driver <b style="color:var(--text);">Ruwan B.</b> · departs ~3:40</span>
                        <span class="m-tag m-tag--ok"><span class="dot"></span>On time for your 08:00 window · late risk 12%</span>
                      </div>
                      <div class="arr__plan">
                        <span class="d-kpi__l" style="padding-bottom:2px;">Receiving plan</span>
                        <div class="plan-i"><span class="plan-i__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg></span><span><b>2 staff</b> at the door from 6:15</span></div>
                        <div class="plan-i"><span class="plan-i__lead plan-i__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></span><span><b>Chilled first</b>, to the cold room (<span class="id">ORD0104217</span>)</span></div>
                        <div class="plan-i"><span class="plan-i__lead plan-i__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><span><b>Rear dock open</b>: van enters via the Lawson St lane</span></div>
                      </div>
                    </div>
                    <div class="arr__foot">
                      <div class="thread thread--wide">
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38 PM</div></div>
                        <div class="thread__bar is-done"></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40 PM</div></div>
                        <div class="thread__bar is-done"></div>
                        <div class="thread__step is-now"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div><div class="thread__label">Loading</div><div class="thread__time">now</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">En route</div><div class="thread__time">~3:40</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">6:15–6:55</div></div>
                      </div>
                      <div class="spacer"></div>
                      <div class="vstack" style="gap:8px;">
                        <div class="ord-mini"><span class="m-tag"><span class="dot"></span>Dry</span><span class="id" style="color:var(--text);">ORD0104216</span><span>58 units</span></div>
                        <div class="ord-mini"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="id" style="color:var(--text);">ORD0104217</span><span style="color:var(--st-deferred-fg); font-weight:700;">32 of 34</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="d-panel">
                    <div class="d-card d-card--warn">
                      <div class="ncard">
                        <span class="ncard__meta"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Needs your attention · 3:24 AM · Kasun J.</span>
                        <span class="ncard__t">2 cases Yoghurt 80 g short</span>
                        <span class="ncard__p">Short at loading. <span class="id">ORD0104217</span> leaves with 32 of 34. <b>Credited</b>, follow-up booked on the Wed 8 Apr run.</span>
                        <div class="hstack" style="gap:10px; margin-top:4px;"><span class="d-btn d-btn--primary" style="height:36px;">Got it</span><span style="font-size:13px; color:var(--text-2);">No call needed</span></div>
                      </div>
                    </div>
                    <div class="d-card">
                      <div class="ncard" style="gap:6px;">
                        <span class="ncard__meta" style="color:var(--brand-600);"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Wed 8 Apr orders close 4:00 PM today</span>
                        <span class="ncard__p">Start from today's order, with the yoghurt follow-up already included. <b style="color:var(--brand-600);">Start Wed order</b></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-card" style="flex:1;">
                  <div class="d-card__head"><span class="d-card__title">This week</span><span style="font-size:13px; color:var(--text-3);">every order, delivery and receipt in one list</span><div class="spacer"></div><div class="m-seg" style="margin:0; width:260px;"><span class="m-seg__i is-on" style="height:30px; font-size:13px;">This week</span><span class="m-seg__i" style="height:30px; font-size:13px;">Last 4 weeks</span></div></div>
                  <div class="wk-row wk-row--head"><span class="c" style="width:120px;">Delivery day</span><span class="c" style="width:130px;">Order</span><span class="c" style="width:120px;">Temperature</span><span class="c" style="width:110px;">Units</span><span class="c" style="width:150px;">Status</span><span class="c" style="width:150px;">Arrival</span><span class="c" style="flex:1;">Receipt</span></div>
                  <div class="wk-row"><span class="c" style="width:120px;">Wed 8 Apr</span><span class="c" style="width:130px; color:var(--text-3);">Follow-up</span><span class="c" style="width:120px;"><span class="m-tag m-tag--cold"><span class="dot"></span>Chilled</span></span><span class="c" style="width:110px;">2 cases</span><span class="c" style="width:150px;"><span class="m-pill m-pill--brand"><span class="dot"></span>Booked</span></span><span class="c" style="width:150px; color:var(--text-3);">window by 7 PM</span><span class="c" style="flex:1; color:var(--text-2);">Replaces the yoghurt short</span></div>
                  <div class="wk-row wk-row--sel"><span class="c fw7" style="width:120px;">Tue 7 Apr</span><span class="c id" style="width:130px;">ORD0104216</span><span class="c" style="width:120px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:110px;">58</span><span class="c" style="width:150px;"><span class="m-pill m-pill--loaded"><span class="dot"></span>Loading</span></span><span class="c fw7" style="width:150px;">6:15–6:55</span><span class="c" style="flex:1; color:var(--text-3);">after delivery</span></div>
                  <div class="wk-row wk-row--sel"><span class="c fw7" style="width:120px;">Tue 7 Apr</span><span class="c id" style="width:130px;">ORD0104217</span><span class="c" style="width:120px;"><span class="m-tag m-tag--cold"><span class="dot"></span>Chilled</span></span><span class="c fw7" style="width:110px; color:var(--st-deferred-fg);">32 of 34</span><span class="c" style="width:150px;"><span class="m-pill m-pill--loaded"><span class="dot"></span>Loading</span></span><span class="c fw7" style="width:150px;">6:15–6:55</span><span class="c" style="flex:1; color:var(--text-2);">2 short already credited · count after delivery</span></div>
                  <div class="wk-row"><span class="c" style="width:120px;">Mon 6 Apr</span><span class="c id" style="width:130px;">ORD0104011</span><span class="c" style="width:120px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:110px;">61</span><span class="c" style="width:150px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:150px;">6:38</span><span class="c" style="flex:1; color:var(--st-delivered-fg); font-weight:700;"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Confirmed 6:59 · matched POD</span></div>
                  <div class="wk-row"><span class="c" style="width:120px;">Mon 6 Apr</span><span class="c id" style="width:130px;">ORD0104012</span><span class="c" style="width:120px;"><span class="m-tag m-tag--cold"><span class="dot"></span>Chilled</span></span><span class="c" style="width:110px;">30</span><span class="c" style="width:150px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:150px;">6:38</span><span class="c" style="flex:1; color:var(--st-delivered-fg); font-weight:700;"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Confirmed 6:59 · matched POD</span></div>
                </div>
              </div>
            </div>
          </div>
      <div class="sx-cap sx-cap--d">Home: arrival window, alerts, this week. <b>Start Wed order → SM-01 desktop</b> · nav → SM-27 / SM-28 / SM-29</div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">08</span><span class="sx-flow__t">Ordering</span><span class="sx-flow__d">Place the order at the counter with suggested quantities, and look back at every order</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-01</span>Place order<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-01 Place order · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/order/2026-04-07</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="s-top__clock">Mon 6 Apr · 2:38 PM</span>
                  <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                  <span class="d-avatar">FR</span>
                </div>
                <div class="d-main" style="padding-bottom:20px;">
                  <div class="d-head">
                    <div class="d-head__txt">
                      <div class="d-eyebrow">New order <span class="m-sep"></span> Kandy Hub run <span class="m-sep"></span> started from last Tuesday</div>
                      <div class="d-h1">Order for Tue 7 Apr</div>
                      <div class="d-sub">Delivered before your 8:00 opening · window 05:30–08:00 · rear dock, normal access</div>
                    </div>
                    <div class="vstack" style="gap:2px; align-items:flex-end; margin-right:4px;">
                      <span class="fw7" style="font-size:14px; color:var(--text);">2 orders · 92 units · 748 kg · 3.5 m³</span>
                      <span style="font-size:13px; color:var(--text-3);">"Received" with order numbers at once · window by 7 PM</span>
                    </div>
                    <span class="d-btn d-btn--ghost">Save draft</span>
                    <span class="d-btn d-btn--primary" style="padding:0 20px;"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Submit 2 orders</span>
                  </div>

                  <div class="d-kpis">
                    <div class="d-kpi d-kpi--hero" style="flex:1.75; gap:8px;">
                      <div class="between"><span class="d-kpi__l"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Orders close at 4:00 PM</span><span class="d-kpi__l">for the Tue 7 Apr run</span></div>
                      <span class="d-kpi__v cd__v">1 h 22 m<small>left</small></span>
                      <div class="m-progress cd__bar"><div style="width:72%;"></div></div>
                      <span class="d-kpi__s">After 4:00 PM this order goes to the <b style="color:#FFFFFF;">Wed 8 Apr run</b></span>
                    </div>
                    <div class="d-kpi">
                      <span class="d-kpi__l"><span class="m-tag"><span class="dot"></span>Dry order</span><span class="m-sep"></span>9 lines</span>
                      <span class="d-kpi__v">58<small>units</small></span>
                      <span class="d-kpi__s">452 kg · 2.2 m³ · every operating day</span>
                    </div>
                    <div class="d-kpi">
                      <span class="d-kpi__l"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled order</span><span class="m-sep"></span>7 lines</span>
                      <span class="d-kpi__v">34<small>units</small></span>
                      <span class="d-kpi__s">296 kg · 1.3 m³ · travels in a reefer</span>
                    </div>
                    <div class="d-kpi d-kpi--fest">
                      <span class="d-kpi__l"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>New Year in 6 days</span>
                      <span class="d-kpi__v">+18%</span>
                      <span class="d-kpi__s">Last year's New Year week. Already in the suggested quantities.</span>
                    </div>
                  </div>

                  <div class="hstack" style="gap:16px; align-items:stretch; flex:1; min-height:0;">
                    <!-- DRY -->
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><span class="d-card__title">Dry order</span><span class="m-tag"><span class="dot"></span>Ambient</span><div class="spacer"></div><span style="font-size:13px; color:var(--text-3);">every operating day</span></div>
                      <div class="ot-row ot-row--head"><span class="ot-item">Item</span><span class="ot-last">Last Tue</span><span class="ot-sug">Suggested</span><span class="ot-qty">Qty</span><span class="ot-kg">kg</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Samba rice 5 kg</b><span>bag</span></span><span class="ot-last">14</span><span class="ot-sug">14</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">14</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">70</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Soap bars</b><span>carton</span></span><span class="ot-last">6</span><span class="ot-sug">6</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">30</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Red dhal 1 kg</b><span>case of 20</span></span><span class="ot-last">5</span><span class="ot-sug">5</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">5</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">100</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Coconut oil 1 L</b><span>case of 12</span></span><span class="ot-last">5</span><span class="ot-sug"><span class="fest2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span>6</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">66</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Wheat flour 1 kg</b><span>case of 20</span></span><span class="ot-last">4</span><span class="ot-sug">4</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">4</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">80</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Sugar 1 kg</b><span>case of 20</span></span><span class="ot-last">2</span><span class="ot-sug">2</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">2</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">40</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Biscuits, assorted</b><span>carton</span></span><span class="ot-last">8</span><span class="ot-sug"><span class="fest2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span>10</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">10</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">36</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Tea 100 g</b><span>carton</span></span><span class="ot-last">5</span><span class="ot-sug">5</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">5</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">15</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Instant noodles</b><span>carton</span></span><span class="ot-last">6</span><span class="ot-sug">6</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">15</span></div>
                      <div class="ot-row ot-row--total"><span class="ot-item"><b>Total</b><span>kg and m³ from the catalogue, never estimated</span></span><span class="ot-qty">58</span><span class="ot-kg">452</span></div>
                    </div>
                    <!-- CHILLED -->
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><span class="d-card__title">Chilled order</span><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><div class="spacer"></div><span style="font-size:13px; color:var(--text-3);">Mon · Tue · Thu · Sat · needs a reefer</span></div>
                      <div class="ot-row ot-row--head"><span class="ot-item">Item</span><span class="ot-last">Last Tue</span><span class="ot-sug">Suggested</span><span class="ot-qty">Qty</span><span class="ot-kg">kg</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Yoghurt 80 g</b><span>case of 24</span></span><span class="ot-last">5</span><span class="ot-sug"><span class="fest2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span>6</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">13.2</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Fresh milk 1 L</b><span>case of 12</span></span><span class="ot-last">7</span><span class="ot-sug"><span class="fest2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span>8</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">8</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">100.8</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Whole chicken 1 kg</b><span>tray of 10</span></span><span class="ot-last">5</span><span class="ot-sug"><span class="fest2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>New Year</span>6</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">6</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">60</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Chicken sausages 500 g</b><span>case</span></span><span class="ot-last">4</span><span class="ot-sug">4</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">4</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">40</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Butter 200 g</b><span>case</span></span><span class="ot-last">3</span><span class="ot-sug">3</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">3</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">24</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Cheese slices</b><span>case</span></span><span class="ot-last">3</span><span class="ot-sug">3</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">3</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">18</span></div>
                      <div class="ot-row"><span class="ot-item"><b>Flavoured milk 180 ml</b><span>case of 24</span></span><span class="ot-last">4</span><span class="ot-sug">4</span><span class="ot-qty"><span class="qty"><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></span><span class="qty__v">4</span><span class="qty__b"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span></span></span><span class="ot-kg">40</span></div>
                      <div class="ot-row ot-row--add"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add item</div>
                      <div class="ot-row ot-row--total"><span class="ot-item"><b>Total</b><span>kept separate so it can travel in a reefer</span></span><span class="ot-qty">34</span><span class="ot-kg">296</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Dry and chilled side by side. <b>Submit 2 orders → SM-27</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-27</span>Orders &amp; history<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-27 Orders & history · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/orders</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="s-top__clock">Tue 7 Apr · 8:50 AM</span>
                  <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                  <span class="d-avatar">FR</span>
                </div>

                <div class="d-main">
                  <div class="d-head">
                    <div class="d-head__txt"><div class="d-eyebrow">OUT106 <span class="m-sep"></span> Kandy Hub runs <span class="m-sep"></span> dry every operating day, chilled Mon · Tue · Thu · Sat</div><div class="d-h1">Orders &amp; history</div></div>
                    <div class="d-search"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>Search orders, items or dates</div>
                    <span class="d-btn d-btn--primary"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New order for Wed 8 Apr</span>
                  </div>
                  <div class="d-kpis">
                    <div class="d-kpi d-kpi--hero" style="flex:1.6;">
                      <span class="d-kpi__l"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Wed 8 Apr orders close at 4:00 PM today</span>
                      <span class="d-kpi__v cd__v" style="font-size:36px;">7 h 10 m<small>left</small></span>
                      <span class="d-kpi__s">Yoghurt follow-up (2 cases) is already on the Wed run</span>
                    </div>
                    <div class="d-kpi"><span class="d-kpi__l">On time · last 4 weeks</span><span class="d-kpi__v">23<small>of 24</small></span><span class="d-kpi__s">arrived inside 05:30–08:00</span></div>
                    <div class="d-kpi"><span class="d-kpi__l">Units credited · April</span><span class="d-kpi__v">4</span><span class="d-kpi__s">2 credit notes, both matched</span></div>
                    <div class="d-kpi"><span class="d-kpi__l">Orders this week</span><span class="d-kpi__v">4<small>+1 booked</small></span><span class="d-kpi__s">Mon 6 to Wed 8 Apr</span></div>
                  </div>
                  <div class="d-split">
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><span class="d-card__title">All orders</span><div class="d-toolbar" style="margin-left:8px;"><span class="d-filter is-on">All <b>11</b></span><span class="d-filter">Upcoming <b>1</b></span><span class="d-filter">Delivered</span><span class="d-filter">Credited <b>2</b></span></div><div class="spacer"></div><span style="font-size:13px; color:var(--text-3);">Wed 1 to Wed 8 Apr</span></div>
                      <div class="sx-tr sx-tr--head"><span class="c" style="width:110px;">Delivery day</span><span class="c" style="width:130px;">Order</span><span class="c" style="width:116px;">Temperature</span><span class="c" style="width:96px;">Units</span><span class="c" style="width:130px;">Status</span><span class="c" style="width:110px;">Arrived</span><span class="c" style="flex:1;">Receipt</span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Wed 8 Apr</span><span class="c" style="width:130px;"><span style="color:var(--text-3);">Follow-up</span></span><span class="c" style="width:116px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:96px;">2 cases</span><span class="c" style="width:130px;"><span class="m-pill m-pill--brand"><span class="dot"></span>Booked</span></span><span class="c" style="width:110px;"><span style="color:var(--text-3);">by 7 PM today</span></span><span class="c" style="flex:1;"><span style="color:var(--text-2);">Replaces the yoghurt short</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Tue 7 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0104216</span></span><span class="c" style="width:116px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:96px;">58</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:33</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 8:40</span></span></div>
                      <div class="sx-tr sx-tr--sel"><span class="c" style="width:110px;font-weight:700;">Tue 7 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0104217</span></span><span class="c" style="width:116px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:96px;"><b style="color:var(--st-deferred-fg);">31 of 34</b></span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:33</span><span class="c" style="flex:1;"><span class="id" style="color:var(--st-deferred-fg);">CN-2604-0441</span><span style="color:var(--text-2);">3 units</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Mon 6 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0104011</span></span><span class="c" style="width:116px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:96px;">61</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:38</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:59</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Mon 6 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0104012</span></span><span class="c" style="width:116px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:96px;">30</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:38</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:59</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Sat 4 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0103870</span></span><span class="c" style="width:116px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:96px;"><b style="color:var(--st-deferred-fg);">54 of 55</b></span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:27</span><span class="c" style="flex:1;"><span class="id" style="color:var(--st-deferred-fg);">CN-2604-0417</span><span style="color:var(--text-2);">1 unit</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Sat 4 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0103871</span></span><span class="c" style="width:116px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:96px;">29</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:27</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:49</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Fri 3 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0103750</span></span><span class="c" style="width:116px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:96px;">52</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:51</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 7:13</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:110px;">Thu 2 Apr</span><span class="c" style="width:130px;"><span class="id">ORD0103628</span></span><span class="c" style="width:116px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:96px;">31</span><span class="c" style="width:130px;"><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></span><span class="c" style="width:110px;">6:22</span><span class="c" style="flex:1;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:44</span></span></div>
                    </div>
                    <div class="d-panel">
                      <div class="d-card">
                        <div class="d-card__head" style="min-height:58px;"><span class="d-card__title id" style="font-family:var(--font-mono);">ORD0104217</span><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><div class="spacer"></div><span class="m-pill m-pill--ok"><span class="dot"></span>Delivered</span></div>
                        <div class="d-card__body" style="gap:0;">
                          <div class="sx-dthread"><div class="thread"><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded</div><div class="thread__time">3:34</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">En route</div><div class="thread__time">3:40</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Delivered</div><div class="thread__time">6:33</div></div></div></div>
                          <div class="sx-pkv" style="margin-top:10px;"><span>Ordered</span><b>34 units · 7 lines</b></div>
                          <div class="sx-pkv"><span>Loaded</span><b style="color:var(--st-deferred-fg);">32 · yoghurt short 3:21</b></div>
                          <div class="sx-pkv"><span>You received</span><b>31 · counted 7:10</b></div>
                          <div class="sx-pkv"><span>Driver's record</span><b style="color:var(--st-delivered-fg);">Matched 8:40</b></div>
                          <div class="sx-pkv"><span>Credit note</span><b><span class="id">CN-2604-0441</span> · 3 units</b></div>
                          <div class="hstack" style="gap:8px; margin-top:12px;"><span class="d-btn">Open order thread</span><span class="d-btn d-btn--ghost">Reorder for Wed</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Every order with its outcome. <b>New order → SM-01 desktop</b> · Deliveries → SM-02</div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">09</span><span class="sx-flow__t">Receiving &amp; messages</span><span class="sx-flow__d">Receipts matched to driver records, credit notes, and structured notices</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-28</span>Receipts &amp; credit notes<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-28 Receipts & credit notes · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/receipts</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="s-top__clock">Tue 7 Apr · 8:50 AM</span>
                  <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                  <span class="d-avatar">FR</span>
                </div>

                <div class="d-main">
                  <div class="d-head">
                    <div class="d-head__txt"><div class="d-eyebrow">OUT106 <span class="m-sep"></span> April 2026 <span class="m-sep"></span> your count and the driver's record, side by side</div><div class="d-h1">Receipts &amp; credit notes</div></div>
                    <span class="d-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>April statement</span>
                  </div>
                  <div class="d-kpis">
                    <div class="d-kpi d-kpi--hero" style="flex:1.6;"><span class="d-kpi__l"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Receipts matched · April</span><span class="d-kpi__v cd__v" style="font-size:36px;">10<small>of 10</small></span><span class="d-kpi__s">Every count agrees with the driver's proof of delivery</span></div>
                    <div class="d-kpi"><span class="d-kpi__l">Units credited · April</span><span class="d-kpi__v">4</span><span class="d-kpi__s">2 credit notes</span></div>
                    <div class="d-kpi"><span class="d-kpi__l">Open disputes</span><span class="d-kpi__v">0</span><span class="d-kpi__s">nothing waiting on you</span></div>
                    <div class="d-kpi"><span class="d-kpi__l">Counted after arrival</span><span class="d-kpi__v">22<small>min avg</small></span><span class="d-kpi__s">before the 8:00 opening</span></div>
                  </div>
                  <div class="d-split">
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><div class="m-seg" style="margin:0; width:280px;"><span class="m-seg__i is-on" style="height:30px; font-size:13px;">Receipts · 9</span><span class="m-seg__i" style="height:30px; font-size:13px;">Credit notes · 2</span></div><div class="spacer"></div><span style="font-size:13px; color:var(--text-3);">This week and last</span></div>
                      <div class="sx-tr sx-tr--head"><span class="c" style="width:104px;">Delivery</span><span class="c" style="width:128px;">Order</span><span class="c" style="width:112px;">Temperature</span><span class="c" style="width:104px;">Received</span><span class="c" style="width:118px;">Counted by</span><span class="c" style="width:124px;">Driver record</span><span class="c" style="flex:1;">Credit</span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Tue 7 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0104216</span></span><span class="c" style="width:112px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:104px;">58 of 58</span><span class="c" style="width:118px;">You · 7:10</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 8:40</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr sx-tr--sel"><span class="c" style="width:104px;font-weight:700;">Tue 7 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0104217</span></span><span class="c" style="width:112px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:104px;"><b style="color:var(--st-deferred-fg);">31 of 34</b></span><span class="c" style="width:118px;">You · 7:10</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 8:40</span></span><span class="c" style="flex:1;"><span class="id" style="color:var(--st-deferred-fg);">CN-2604-0441</span><span style="color:var(--text-2);">3 units</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Mon 6 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0104011</span></span><span class="c" style="width:112px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:104px;">61 of 61</span><span class="c" style="width:118px;">You · 6:59</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:59</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Mon 6 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0104012</span></span><span class="c" style="width:112px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:104px;">30 of 30</span><span class="c" style="width:118px;">You · 6:59</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:59</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Sat 4 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0103870</span></span><span class="c" style="width:112px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:104px;"><b style="color:var(--st-deferred-fg);">54 of 55</b></span><span class="c" style="width:118px;">M. Ilyas · 6:49</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:49</span></span><span class="c" style="flex:1;"><span class="id" style="color:var(--st-deferred-fg);">CN-2604-0417</span><span style="color:var(--text-2);">1 unit</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Sat 4 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0103871</span></span><span class="c" style="width:112px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:104px;">29 of 29</span><span class="c" style="width:118px;">M. Ilyas · 6:49</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:49</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Fri 3 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0103750</span></span><span class="c" style="width:112px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:104px;">52 of 52</span><span class="c" style="width:118px;">You · 7:13</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 7:13</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Thu 2 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0103627</span></span><span class="c" style="width:112px;"><span class="m-tag"><span class="dot"></span>Ambient</span></span><span class="c" style="width:104px;">57 of 57</span><span class="c" style="width:118px;">You · 6:44</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:44</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                      <div class="sx-tr"><span class="c" style="width:104px;">Thu 2 Apr</span><span class="c" style="width:128px;"><span class="id">ORD0103628</span></span><span class="c" style="width:112px;"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></span><span class="c" style="width:104px;">31 of 31</span><span class="c" style="width:118px;">You · 6:44</span><span class="c" style="width:124px;"><span class="sx-okc"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Matched 6:44</span></span><span class="c" style="flex:1;"><span style="color:var(--text-3);">None</span></span></div>
                    </div>
                    <div class="d-panel">
                      <div class="d-card">
                        <div class="d-card__head" style="min-height:58px;"><span class="d-card__title">Credit note</span><span class="id" style="font-size:14px; color:var(--text-2);">CN-2604-0441</span><div class="spacer"></div><span class="m-pill m-pill--ok"><span class="dot"></span>Matched</span></div>
                        <div class="d-card__body" style="gap:0;">
                          <div class="vstack" style="gap:2px; padding-bottom:12px;"><span class="d-kpi__v" style="font-size:40px;">3<small>units</small></span><span class="d-sub">Tue 7 Apr · on <span class="id">ORD0104217</span> · raised 7:10</span></div>
                          <div class="sx-pkv"><span>Yoghurt 80 g · short at loading</span><b>2 cases</b></div>
                          <div class="sx-pkv"><span>Whole chicken 1 kg · damaged</span><b>1 tray</b></div>
                          <div class="sx-pkv"><span>Driver's record</span><b style="color:var(--st-delivered-fg);">VEH057 · synced 8:40</b></div>
                          <div class="sx-pkv"><span>Follow-up</span><b>Yoghurt × 2 on Wed 8 Apr</b></div>
                          <div class="hstack" style="gap:10px; padding:14px 0 4px;"><div class="sx-shot" style="width:92px; height:72px;"><span>You 6:52</span></div><div class="sx-shot" style="width:92px; height:72px; background:linear-gradient(160deg,#DCCDB6 0%,#B99E78 100%);"><span>Driver 6:57</span></div></div>
                          <span class="d-btn d-btn--primary" style="margin-top:12px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Download PDF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Counts, matches, credits. <b>Messages → SM-29</b> · Order → SM-27</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-29</span>Messages<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-29 Messages · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/messages</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="s-top__clock">Tue 7 Apr · 8:44 AM</span>
                  <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                  <span class="d-avatar">FR</span>
                </div>

                <div class="d-main">
                  <div class="d-head">
                    <div class="d-head__txt"><div class="d-eyebrow">Structured notices from Kandy Hub, drivers and Lodestar <span class="m-sep"></span> nothing needs action</div><div class="d-h1">Messages</div></div>
                    <div class="d-toolbar"><span class="d-filter is-on">All <b>7</b></span><span class="d-filter">Needs action <b>0</b></span><span class="d-filter">Deliveries</span><span class="d-filter">Credits</span></div>
                  </div>
                  <div class="d-split">
                    <div class="d-card" style="width:480px; flex-shrink:0;">
                      <div class="sx-dlist">
                        <div class="sx-dday" style="border-top:none;">Today · Tue 7 Apr</div>
                        <div class="sx-dn sx-dn--sel"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>Receipt matched</span><span>8:40</span></div><div class="sx-dn__t">Your count agrees with the driver's record</div><div class="sx-dn__m">ORD0104216 · ORD0104217 · CN-2604-0441</div></div></div>
                        <div class="sx-dn"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>Delivery</span><span>6:33</span></div><div class="sx-dn__t">VEH057 arrived at your rear dock</div><div class="sx-dn__m">Ruwan B. · stop 1 of 2</div></div></div>
                        <div class="sx-dn"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>Shortfall · you saw it 3:24</span><span>3:21</span></div><div class="sx-dn__t">2 cases yoghurt 80 g short at loading</div><div class="sx-dn__m">Credited · follow-up booked Wed 8 Apr</div></div></div>
                        <div class="sx-dday">Mon 6 Apr</div>
                        <div class="sx-dn"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>Arrival window</span><span>6:40 PM</span></div><div class="sx-dn__t">Tue 7 Apr: 6:15–6:55, you're stop 1</div><div class="sx-dn__m">Plan published by Kandy Hub</div></div></div>
                        <div class="sx-dn"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>Orders received</span><span>2:38 PM</span></div><div class="sx-dn__t">2 orders, 92 units for Tue 7 Apr</div><div class="sx-dn__m">ORD0104216 · ORD0104217</div></div></div>
                        <div class="sx-dn"><div class="m-row__lead m-row__lead--star"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg></div><div class="sx-dn__main"><div class="sx-dn__k"><span>New Year</span><span>9:00 AM</span></div><div class="sx-dn__t">Last run before the holiday is Sat 11 Apr</div><div class="sx-dn__m">Orders close Fri 10 Apr, 4:00 PM</div></div></div>
                      </div>
                    </div>
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__body" style="padding:24px 28px; gap:18px;">
                        <div class="between"><span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Receipt matched</span><span style="font-size:13px; font-weight:600; color:var(--text-3);">Tue 7 Apr · 8:40 AM · automatic</span></div>
                        <div class="vstack" style="gap:6px;"><span class="d-h1" style="font-size:30px;">Your receipt agrees with the driver's record</span><span class="d-sub" style="font-size:15px;">Two independent records of the same delivery, so there is nothing to dispute.</span></div>
                        <div class="sx-evid">
                          <div class="sx-evid__c"><span class="sx-evid__k"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>Your count · 7:10</span><span class="sx-evid__v">58 + 31</span><span class="sx-evid__s">Dry 58 of 58 · chilled 31 of 34</span></div>
                          <div class="sx-evid__c"><span class="sx-evid__k"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>VEH057 proof of delivery · 6:58</span><span class="sx-evid__v">58 + 31</span><span class="sx-evid__s">Made offline above Ramboda, synced 8:40</span></div>
                        </div>
                        <div class="kvl">
                          <div class="kvl__r"><span>Orders</span><span><span class="id">ORD0104216</span> dry · <span class="id">ORD0104217</span> chilled</span></div>
                          <div class="kvl__r"><span>Credit note</span><span><span class="id">CN-2604-0441</span> · 3 units · yoghurt × 2 short, chicken × 1 damaged</span></div>
                          <div class="kvl__r"><span>Evidence</span><span>Your photo 6:52 and the driver's photo 6:57, both attached</span></div>
                          <div class="kvl__r"><span>Signed by</span><span>M. Ilyas at the dock · confirmed by Fathima Rizwan</span></div>
                        </div>
                        <div class="hstack" style="gap:10px;"><span class="d-btn d-btn--primary">View credit note</span><span class="d-btn">Open order thread</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Notice list and detail. <b>View credit note → SM-28</b></div>
    </div>
    </div>
  </section>
  <section class="sx-flow">
    <div class="sx-flow__h"><span class="sx-flow__n">10</span><span class="sx-flow__t">Account</span><span class="sx-flow__d">Receiving staff, notifications and who can use the store account</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-30</span>Settings<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-30 Settings · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/settings</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="s-top__clock">Tue 7 Apr · 7:30 AM</span>
                  <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                  <span class="d-avatar sx-av-on">FR</span>
                </div>

                <div class="d-main">
                  <div class="d-head">
                    <div class="d-head__txt"><div class="d-eyebrow">Waypoint Fresh Nuwara Eliya <span class="m-sep"></span> OUT106 <span class="m-sep"></span> Kandy Hub</div><div class="d-h1">Settings</div></div>
                    <span class="d-btn d-btn--ghost">Discard</span><span class="d-btn d-btn--primary">Save changes</span>
                  </div>
                  <div class="d-split">
                    <div class="sx-subnav">
                      <span class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg>Store details</span>
                      <span class="d-side__item is-on"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg>Receiving</span>
                      <span class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Notifications</span>
                      <span class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Users &amp; access</span>
                      <span class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>Language</span>
                      <div class="d-card" style="margin-top:18px; padding:16px; gap:8px;">
                        <span style="font-size:13px; font-weight:700; color:var(--text-3);">Your dock, as drivers see it</span>
                        <span style="font-size:14px; line-height:1.5; color:var(--text);">Rear dock · normal access · enter via the Lawson St service lane; dock door opens 5:30</span>
                        <span class="sx-link" style="font-size:13px;">Request a change</span>
                      </div>
                    </div>
                    <div class="vstack" style="gap:18px; flex:1; min-width:0;">
                      <div class="d-card">
                        <div class="d-card__head"><span class="d-card__title">Receiving staff</span><span style="font-size:13px; color:var(--text-3);">shown to the driver and Kandy Hub</span><div class="spacer"></div><span class="d-btn" style="height:34px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add staff</span></div>
                        <div class="sx-set-row"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="sx-set-row__main"><b>Staff at the door from</b><span>Van ETA ~6:35 (plan 5:31) · window 05:30–08:00</span></div><span class="sx-chip">6:15 AM</span></div>
                        <div class="sx-set-row"><span class="sx-set-av">MI</span><div class="sx-set-row__main"><b>M. Ilyas</b><span>Receiver · +94 71 552 0193 · signs for deliveries</span></div><span class="m-tag m-tag--ok"><span class="dot"></span>On shift Tue</span></div>
                        <div class="sx-set-row"><span class="sx-set-av">SK</span><div class="sx-set-row__main"><b>S. Kumar</b><span>Receiver · +94 76 284 7715 · counts chilled first</span></div><span class="m-tag m-tag--ok"><span class="dot"></span>On shift Tue</span></div>
                      </div>
                      <div class="d-card">
                        <div class="d-card__head"><span class="d-card__title">Users &amp; access</span><div class="spacer"></div><span class="d-btn" style="height:34px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Invite</span></div>
                        <div class="sx-set-row"><span class="d-avatar">FR</span><div class="sx-set-row__main"><b>Fathima Rizwan</b><span>Store manager · orders, receipts, settings</span></div><span class="m-pill m-pill--brand">Owner</span></div>
                        <div class="sx-set-row"><span class="sx-set-av">MI</span><div class="sx-set-row__main"><b>M. Ilyas</b><span>Receiver · can confirm receipts, cannot order</span></div><span class="m-pill">Receiver</span></div>
                        <div class="sx-set-row"><span class="sx-set-av"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg></span><div class="sx-set-row__main"><b>Counter PC</b><span>Signed in Mon 6 Apr, 2:20 PM · remembered for 30 days</span></div><span class="sx-link" style="font-size:13px;">Sign out</span></div>
                      </div>
                    </div>
                    <div class="vstack" style="gap:18px; width:420px; flex-shrink:0;">
                      <div class="d-card">
                        <div class="d-card__head"><span class="d-card__title">Notifications</span><div class="spacer"></div><span class="sx-col-h">App</span><span class="sx-col-h">SMS</span></div>
                        <div class="sx-set-row"><div class="sx-set-row__main"><b>Arrival window</b><span>by 7 PM the evening before</span></div><div class="sx-col-h"><div class="sx-tg is-on"><div></div></div></div><div class="sx-col-h"><div class="sx-tg is-on"><div></div></div></div></div>
                        <div class="sx-set-row"><div class="sx-set-row__main"><b>Van on the way</b><span>live from departure</span></div><div class="sx-col-h"><div class="sx-tg is-on"><div></div></div></div><div class="sx-col-h"><div class="sx-tg"><div></div></div></div></div>
                        <div class="sx-set-row"><div class="sx-set-row__main"><b>Short or moved orders</b><span>always on, both channels</span></div><div class="sx-col-h"><div class="sx-tg is-on is-lock"><div></div></div></div><div class="sx-col-h"><div class="sx-tg is-on is-lock"><div></div></div></div></div>
                        <div class="sx-set-row"><div class="sx-set-row__main"><b>Cutoff reminder</b><span>3:00 PM if not ordered</span></div><div class="sx-col-h"><div class="sx-tg is-on"><div></div></div></div><div class="sx-col-h"><div class="sx-tg"><div></div></div></div></div>
                        <div class="sx-set-row"><div class="sx-set-row__main"><b>Credit notes</b><span>when raised and matched</span></div><div class="sx-col-h"><div class="sx-tg is-on"><div></div></div></div><div class="sx-col-h"><div class="sx-tg"><div></div></div></div></div>
                      </div>
                      <div class="d-card">
                        <div class="d-card__head"><span class="d-card__title">Language</span></div>
                        <div class="d-card__body"><div class="m-seg" style="margin:0;"><span class="m-seg__i is-on">English</span><span class="m-seg__i vo-si">සිංහල</span><span class="m-seg__i vo-ta">தமிழ்</span></div><span style="font-size:13px; color:var(--text-3);">For this PC. Staff phones keep their own setting.</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Receiving, users, alerts, language. <b>Save changes → SM-02 desktop</b></div>
    </div>
    </div>
  </section>
  <section class="sx-flow" data-name="Access & system states">
    <div class="sx-flow__h"><span class="sx-flow__n">11</span><span class="sx-flow__t">Access &amp; system states</span><span class="sx-flow__d">When sign-in, the session, the app version or the server gets in the way: the draft is always kept, and Kandy Hub's phone line is named before the 4:00 PM cutoff</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-31</span>Can't sign in<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-31 Can't sign in · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Sign-in help</b><span>+94 77 318 4526</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-title"><div class="m-h1">Didn't get the code?</div><div class="m-sub">Texts can take a minute on hill-country signal. A new code is the quickest way in.</div></div>
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label">Last code sent 2:30 PM</span><span class="m-tag m-tag--brand"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Codes last 10 min</span></div>
                  <div class="m-hero__value">0:42<small>to resend</small></div>
                  <div class="m-hero__meta">Look for a text from <b style="color:var(--text);">WAYPOINT</b>. The new code goes to the same number.</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Other ways in</b></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94M14.05 6A5 5 0 0 1 18 10"/></svg></div><div class="m-row__main"><div class="m-row__title">Get the code by voice call</div><div class="m-row__meta">An automated call reads it out</div></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg></div><div class="m-row__main"><div class="m-row__title">I changed my number</div><div class="m-row__meta">Ask the admin to update it</div></div><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                </div></div>
                <div class="note"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Still locked out near <b>4:00 PM</b>? Call Kandy Hub on <b>+94 81 222 4410</b>. The dispatcher logs today's order for you.</span></div>
              </div>
              <div class="m-actionbar"><div class="m-btn ax-btn--wait">Resend code in 0:42</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">From "New number?" on SM-05 or the resend note on SM-06. <b>Resend code → SM-06</b> · Voice call → SM-06 · I changed my number → SM-32</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-32</span>Access request sent<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-32 Access request sent · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:33</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div><div class="m-nav__stack"><b>Access request</b><span>AR-2604-0112</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label">Mon 6 Apr · 2:33 PM</span><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Sent</span></div>
                  <div class="ax-hero-t">Number change sent to the Lodestar admin</div>
                  <div class="m-hero__meta">For security, number changes are checked by a call to the store next morning.</div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>What happens next</b></div><div class="m-group">
                  <div class="sx-vt">
                    <div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="sx-vt__line"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Request sent</span><span class="sx-vt__time">2:33 PM</span></div><span class="sx-vt__m">For Fathima Rizwan, OUT106 store manager</span></div></div>
                    <div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot sx-vt__dot--now"></div><div class="sx-vt__line sx-vt__line--todo"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Admin checks it's you</span><span class="sx-vt__time">Tue ~10 AM</span></div><span class="sx-vt__m">A call to the store's landline</span></div></div>
                    <div class="sx-vt__i"><div class="sx-vt__rail"><div class="sx-vt__dot sx-vt__dot--todo"></div></div><div class="sx-vt__body"><div class="sx-vt__top"><span class="sx-vt__t">Code to your new number</span><span class="sx-vt__time">Tue by 11 AM</span></div><span class="sx-vt__m">Orders and settings carry over</span></div></div>
                  </div>
                </div></div>
                <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8"/></svg><div class="m-banner__txt"><b>Your saved draft order stays on this phone</b><span>For Tue 7 Apr, call Kandy Hub before 4:00 PM</span></div></div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Done</div><div class="m-btn m-btn--ghost">Call Kandy Hub to order instead</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Confirmation with a reference. <b>Done → SM-05</b> · call Kandy Hub → phone dialer (DSP-10 on their side)</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-33</span>Session expired<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-33 Session expired · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:20</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Lodestar Store</b><span>Nuwara Eliya · OUT106</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="sx-empty ax-empty">
                  <svg class="sx-empty__ill" viewBox="0 0 160 112">
                    <rect x="50" y="4" width="60" height="104" rx="14" fill="#EEF0FF"/>
                    <rect x="58" y="16" width="44" height="80" rx="8" fill="#FFFFFF"/>
                    <path d="M71 52v-7a9 9 0 0 1 18 0v7" fill="none" stroke="#141B4D" stroke-width="5" stroke-linecap="round"/>
                    <rect x="64" y="51" width="32" height="28" rx="7" fill="#3B4CCA"/>
                    <circle cx="80" cy="64" r="4" fill="#F5B83D"/>
                    <circle cx="130" cy="30" r="15" fill="#F5B83D"/>
                    <path d="M130 22v8l5 3" fill="none" stroke="#141B4D" stroke-width="3" stroke-linecap="round"/>
                    <path d="M26 56 L28 62.5 L34.5 64.5 L28 66.5 L26 73 L24 66.5 L17.5 64.5 L24 62.5 Z" fill="#F5B83D"/>
                  </svg>
                  <div class="sx-empty__t">You've been signed out</div>
                  <div class="sx-empty__p">For security, Lodestar signs you out after a long time without use, or after a change to your account.</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8"/></svg></div><div class="m-row__main"><div class="m-row__title">Tue 7 Apr order · draft</div><div class="m-row__meta">92 units<span class="m-sep"></span>saved 2:12 PM</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Kept</span></div>
                </div>
                <div class="cstate cstate--warn" style="margin:0 16px;">
                  <div class="cstate__top"><span class="cstate__l" style="color:var(--st-deferred-fg);"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Orders close at 4:00 PM</span><span class="cstate__v" style="color:var(--st-deferred-fg);">1 h 40 m</span></div>
                  <span class="cstate__s" style="font-size:14px;">Sign in again to send the draft. It takes about a minute.</span>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Sign in again</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Shown on open after a sign-out. <b>Sign in again → SM-05</b></div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-34</span>Update required<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-34 Update required · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">2:15</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div><div class="m-nav__stack"><b>Lodestar Store</b><span>Version 2.3.1</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="sx-empty ax-empty">
                  <svg class="sx-empty__ill" viewBox="0 0 160 112">
                    <rect x="50" y="4" width="60" height="104" rx="14" fill="#EEF0FF"/>
                    <rect x="58" y="16" width="44" height="80" rx="8" fill="#FFFFFF"/>
                    <circle cx="80" cy="50" r="18" fill="#3B4CCA"/>
                    <path d="M80 40v18M72 51l8 8 8-8" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <rect x="66" y="80" width="28" height="6" rx="3" fill="#D5DAF2"/>
                    <rect x="66" y="80" width="17" height="6" rx="3" fill="#F5B83D"/>
                    <path d="M132 22 L134 28.5 L140.5 30.5 L134 32.5 L132 39 L130 32.5 L123.5 30.5 L130 28.5 Z" fill="#F5B83D"/>
                    <circle cx="28" cy="72" r="4" fill="#3B4CCA" fill-opacity=".35"/>
                  </svg>
                  <div class="sx-empty__t">Update to keep ordering</div>
                  <div class="sx-empty__p">Version 2.4 is needed. <b>What's new:</b> drafts send faster on weak signal.</div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>New version</span><b>2.4.0 · 18 MB</b></div>
                  <div class="m-kv"><span>Your draft order</span><b style="color:var(--st-delivered-fg);">Kept on this phone</b></div>
                </div>
                <div class="note"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Mid-order? You can send today's order first. The app asks again at <b>4:00 PM</b>, after orders close.</span></div>
              </div>
              <div class="m-actionbar"><div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>Update now</div><div class="m-btn m-btn--ghost">Remind me after today's order</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">On launch, one reminder allowed before cutoff. <b>Update now → SM-04</b> · Remind me → SM-11</div>
    </div>
    </div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-35</span>Reset access<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-35 Reset access · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/sign-in/help</div></div>
              <div class="sx-dauth">
                <div class="sx-dauth__brand">
                  <div class="sx-dauth__logo"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="sx-dauth__h">Every order,<br>one thread.</div>
                  <div class="vstack" style="gap:16px;">
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span><div><b>Order before 4:00 PM</b> for the next morning's run</div></div>
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><div><b>Arrival window by 7 PM</b>, live while the van is out</div></div>
                    <div class="sx-dauth__li"><span><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><div><b>Confirm what arrived</b>, credit notes raised for you</div></div>
                  </div>
                  <div class="sx-dauth__foot"><b style="color:#FFFFFF;">Waypoint Group</b><span class="m-sep" style="background:#B9C0E6;"></span>Fresh · Style · Tech</div>
                  <svg viewBox="0 0 620 200" style="width:620px; height:200px; margin:0 -56px; flex-shrink:0;">
                    <path d="M0 100 C90 50 180 40 270 84 C350 120 450 40 620 60 L620 200 L0 200 Z" fill="#5566E0" fill-opacity=".35"/>
                    <path d="M0 146 C130 104 250 116 360 134 C460 150 540 130 620 134 L620 200 L0 200 Z" fill="#0A0F2E" fill-opacity=".85"/>
                    <path d="M0 188 C110 160 200 168 290 152 C380 136 480 136 620 130" stroke="#F5B83D" stroke-width="4" stroke-dasharray="10 10" fill="none"/>
                    <g transform="translate(150 -86)"><rect x="126" y="206" width="60" height="34" rx="8" fill="#FFFFFF"/><path d="M186 214 h15 l11 13 v13 h-26 z" fill="#FFFFFF"/><path d="M189 217 h10 l8 10 h-18 z" fill="#9EE3F0"/><path d="M156 214v18M148.2 218.5l15.6 9M148.2 227.5l15.6-9" stroke="#0E7490" stroke-width="2.2" stroke-linecap="round"/><circle cx="143" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/><circle cx="197" cy="242" r="7" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/></g>
                    <circle cx="540" cy="30" r="14" fill="#FFCB5C"/><circle cx="547" cy="25" r="12" fill="#27348F"/>
                  </svg>
                </div>
                <div class="sx-dauth__form">
                  <div class="sx-dcard">
                    <span class="sx-link ax-back"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Back to sign in</span>
                    <div class="vstack" style="gap:6px;"><span class="d-h1" style="font-size:30px;">Sign-in help</span><span class="d-sub" style="font-size:15px;">Get back into the counter PC without the SMS code.</span></div>
                    <div class="m-seg" style="margin:0;"><span class="m-seg__i is-on">Email me a link</span><span class="m-seg__i">Ask the admin</span></div>
                    <div class="ax-sent"><span class="ax-disc ax-disc--ok"><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></span><div class="ax-sent__t"><b>Link sent to fathima.r•••@waypoint.lk</b><span>Mon 6 Apr, 2:24 PM · works once, for 15 minutes, on this PC</span></div></div>
                    <span class="d-btn d-btn--primary sx-dbtn-xl">Open work email<svg class="ic" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></span>
                    <span style="font-size:14px; color:var(--text-2); text-align:center;">Not in your inbox? Check junk, or resend in <b style="color:var(--text);">0:48</b></span>
                    <div class="sx-divider"></div>
                    <div class="sx-help ax-help"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>No access to that inbox? <span class="sx-link">Ask the Lodestar admin</span> to reset your sign-in. Usually within 1 hour.</span></div>
                    <div class="sx-help ax-help"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Order due before 4:00 PM? Call Kandy Hub, <span style="white-space:nowrap;">+94 81 222 4410</span></span></div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">From "Trouble signing in?" on SM-26. Email link sent state. <b>Link in email → SM-02 desktop</b> · Back to sign in → SM-26 · Ask the admin → request, as SM-32</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-36</span>Service unavailable<span class="screen-label__device">· Desktop 1440</span></div>
<div class="frame frame--desktop mode-store" data-name="SM-36 Service unavailable · desktop">
              <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>store.lodestar.waypoint.lk/OUT106/order/2026-04-07</div></div>
              <div class="s-shell">
                <div class="s-top">
                  <div class="s-top__brand"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg>Lodestar Store</div>
                  <div class="s-top__outlet"><span class="bb bb--fresh">F</span>Waypoint Fresh Nuwara Eliya<span class="id">OUT106</span><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>
                  <div class="s-top__nav">
                    <span class="s-top__i is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Order</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Deliveries</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Receipts</span>
                    <span class="s-top__i"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Messages</span>
                  </div>
                  <div class="spacer"></div>
                  <span class="sx-dash"><svg class="ic" viewBox="0 0 24 24"><path d="m2 2 20 20"/><path d="M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.19"/><path d="M21.53 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10 5.07"/></svg>Not connected</span>
                  <span class="s-top__clock">Mon 6 Apr · 2:30 PM</span>
                  <span class="d-avatar">FR</span>
                </div>

                <div class="d-main">
                  <div class="d-head">
                    <div class="d-head__txt"><div class="d-eyebrow">New order <span class="m-sep"></span> Kandy Hub run <span class="m-sep"></span> started from last Tuesday</div><div class="d-h1">Order for Tue 7 Apr</div></div>
                  </div>
                  <div class="hstack" style="gap:18px; align-items:stretch;">
                    <div class="d-card ax-dash" style="flex:1;">
                      <div class="vstack" style="gap:18px; padding:28px 32px;">
                        <div class="hstack" style="gap:14px;"><span class="ax-disc ax-disc--off"><svg class="ic" viewBox="0 0 24 24"><path d="m2 2 20 20"/><path d="M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.19"/><path d="M21.53 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10 5.07"/></svg></span><span style="font-size:14px; font-weight:700; color:var(--st-offline-fg);">Lodestar can't reach its server · since 2:22 PM</span></div>
                        <div class="vstack" style="gap:8px;"><span class="d-h1" style="font-size:36px;">Your order is saved in this browser</span><span class="d-sub" style="font-size:15px; line-height:1.5;">Nothing is lost and nothing to type again. We retry every 30 seconds and send both orders the moment the server answers.</span></div>
                        <div class="vstack" style="gap:0;">
                          <div class="ax-orow"><span class="plan-i__lead plan-i__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></span><div class="ax-orow__t"><b>Dry order</b><span>9 lines · ambient</span></div><span class="ax-orow__v">58<small>units</small></span><span class="ax-orow__kg">452 kg</span><span class="ax-orow__st"><span class="sx-dash">Draft · not sent</span></span></div>
                          <div class="ax-orow"><span class="plan-i__lead plan-i__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg></span><div class="ax-orow__t"><b>Chilled order</b><span>7 lines · travels in a reefer</span></div><span class="ax-orow__v">34<small>units</small></span><span class="ax-orow__kg">296 kg</span><span class="ax-orow__st"><span class="sx-dash">Draft · not sent</span></span></div>
                        </div>
                        <div class="hstack" style="gap:16px;"><span class="d-btn d-btn--primary sx-dbtn-xl" style="padding:0 22px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Try now</span><span class="d-btn d-btn--ghost" style="height:52px;">Keep editing</span><span style="font-size:14px; color:var(--text-2);">Next automatic retry in <b style="color:var(--text);">0:18</b></span></div>
                      </div>
                    </div>
                    <div class="vstack" style="gap:18px; width:420px; flex-shrink:0;">
                      <div class="cstate cstate--warn">
                        <div class="cstate__top"><span class="cstate__l" style="color:var(--st-deferred-fg);"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Orders close at 4:00 PM</span><span class="cstate__v" style="color:var(--st-deferred-fg);">1 h 30 m</span></div>
                        <span class="cstate__s" style="font-size:14px;">Still not connected at 3:30 PM? Call Kandy Hub on <b style="white-space:nowrap;">+94 81 222 4410</b>. The dispatcher logs your order into the same thread.</span>
                      </div>
                      <div class="d-card" style="flex:1;">
                        <div class="d-card__head"><span class="d-card__title">Connection</span></div>
                        <div class="d-card__body" style="gap:0;">
                          <div class="sx-pkv"><span>Last successful sync</span><b>2:21 PM · 9 min ago</b></div>
                          <div class="sx-pkv"><span>This PC's internet</span><b style="color:var(--st-delivered-fg);">Working</b></div>
                          <div class="sx-pkv"><span>Lodestar server</span><b style="color:var(--st-offline-fg);">Not answering</b></div>
                          <div class="sx-pkv"><span>Automatic retries</span><b>16 so far</b></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="d-card">
                    <div class="d-card__head"><span class="d-card__title">While you wait</span><span style="font-size:13px; color:var(--text-3);">what still works in this browser</span></div>
                    <div class="hstack" style="gap:24px; align-items:flex-start; padding:0 18px 20px;">
                      <div class="ax-wi"><span class="plan-i__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span><div class="ax-wi__t"><b>Keep editing</b><span>Changes save in this browser as you type</span></div></div>
                      <div class="ax-wi"><span class="plan-i__lead plan-i__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><div class="ax-wi__t"><b>Today's delivery</b><span>Last copy from 2:21 PM, marked as not live</span></div></div>
                      <div class="ax-wi"><span class="plan-i__lead plan-i__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><div class="ax-wi__t"><b>Receipts &amp; messages</b><span>Open again once the server answers</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      <div class="sx-cap sx-cap--d">Server unreachable while ordering. <b>Try now → SM-27</b> (once sent) · Keep editing → SM-01 desktop</div>
    </div>
    </div>
  </section>
  <section class="sx-flow" data-name="Voice">
    <div class="sx-flow__h"><span class="sx-flow__n">12</span><span class="sx-flow__t">Voice</span><span class="sx-flow__d">Read aloud in English, Sinhala or Tamil for a busy counter: the voice runs on the phone, works with no signal, and only speaks; the text is always on screen</span></div>
    <div class="sx-row">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-37</span>Voice &amp; language<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-37 Voice and language · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">7:11</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Voice &amp; language</b><span>Profile &amp; settings</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--xtight">
                <div class="m-section"><div class="m-section__head"><b>Language</b><span>screen and voice</span></div><div class="m-seg"><span class="m-seg__i is-on">English</span><span class="m-seg__i vo-si">සිංහල</span><span class="m-seg__i vo-ta">தமிழ்</span></div></div>
                <div class="m-section"><div class="m-section__head"><b>Read aloud</b><span>speaks only, never listens</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div><div class="m-row__main"><div class="m-row__title">Read ETA and notices aloud</div><div class="m-row__meta">adds Read aloud to each</div></div><div class="sx-tg is-on"><div></div></div></div>
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Speed</div></div><div class="m-seg vo-seg"><span class="m-seg__i">Slower</span><span class="m-seg__i is-on">Normal</span><span class="m-seg__i">Faster</span></div></div>
                  <div class="m-row m-row--c"><div class="m-row__main"><div class="m-row__title">Test</div><div class="m-row__meta">"Van arrives between 6:15 and 6:55."</div></div><div class="vo-read"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Read aloud</div></div>
                </div></div>
                <div class="m-section"><div class="m-section__head"><b>Voice packs</b><span>on this phone · works offline</span></div><div class="m-group">
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">English</div><div class="m-row__meta">On this phone · works offline</div></div><span class="vo-pack">Built in</span></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title vo-ta">தமிழ்</div><div class="m-row__meta">On this phone · works offline</div></div><span class="vo-pack">34 MB</span></div>
                  <div class="m-row m-row--c"><div class="m-row__lead m-row__lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg></div><div class="m-row__main"><div class="m-row__title vo-si">සිංහල</div><div class="m-row__meta">Not downloaded · store Wi-Fi only</div></div><span class="sx-chip" style="color:var(--brand-600);">Download</span></div>
                </div></div>
                <div class="note"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span><b>The voice is made on this phone.</b> Nothing is sent anywhere, so it keeps working when the Nuwara Eliya signal drops.</span></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">Language, read aloud, voice packs. <b>Sinhala Download → SM-38</b> · back → SM-22</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-38</span>Voice pack downloading<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-38 Voice pack downloading · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">7:12</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Voice pack</b><span>Voice &amp; language</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label" style="display:flex; align-items:center; gap:6px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>Downloading on store Wi-Fi</span><span class="m-hero__label"><span class="vo-si">සිංහල</span> voice</span></div>
                  <div class="m-hero__value">64<small>%</small></div>
                  <div class="m-progress"><div style="width:64%;"></div></div>
                  <div class="m-hero__meta">23 of 36 MB · about 1 min left</div>
                </div>
                <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><div class="m-banner__txt"><b>Everything works without it; text is always shown</b><span>Orders, arrival windows and notices read the same on screen while this finishes.</span></div></div>
                <div class="m-group">
                  <div class="m-kv"><span>Downloads</span><b>Once, on Wi-Fi only</b></div>
                  <div class="m-kv"><span>Mobile data</span><b>Not used</b></div>
                  <div class="m-kv"><span>After that</span><b style="color:var(--st-delivered-fg);">Works with no signal</b></div>
                </div>
                <div class="m-section"><div class="m-section__head"><b>Until it's ready</b><span>in Sinhala</span></div>
                  <div class="vo-row" style="padding:0 16px;"><div class="vo-read is-off"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>Voice not downloaded, text still works</div></div>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Keep using the app</div><div class="m-btn m-btn--ghost">Pause download</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">One-time pack on store Wi-Fi. <b>Keep using → SM-11</b> · done → SM-37</div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-39</span>Deferral notice speaking<span class="screen-label__device">· Phone 390</span></div>
<div class="frame frame--phone mode-store" data-name="SM-39 Deferral notice speaking · phone">
            <div class="m-screen">

              <div class="statusbar"><span class="mono">6:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav"><div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div><div class="m-nav__stack"><b>Notice</b><span>Kiribathgoda · OUT027</span></div><div style="width:40px; flex-shrink:0;"></div></div>
              <div class="m-body m-body--tight vo-tight">
                <div class="m-hero sx-hero--warn">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label" style="color:var(--st-deferred-fg); font-weight:700;">Chilled order moved</span><span style="font-size:13px; font-weight:600; color:var(--text-3);">Mon 6 Apr · 6:40 PM</span></div>
                  <div class="m-hero__value">Wed 8 Apr</div>
                  <div class="m-hero__meta"><span class="id" style="color:var(--text);">ORD0104188</span> · 1.6 m³ · first stop on Trip 1, window 05:00–07:30</div>
                </div>
                <div class="m-group" style="padding:4px 16px;">
                  <div class="kvl">
                    <div class="kvl__r"><span>Reason</span><span>Reefer space full on Tue 7 Apr · <span class="id" style="color:var(--st-deferred-fg);">CAP-REEFER</span></span></div>
                    <div class="kvl__r"><span>Your shelves</span><span>Last delivery this morning, so chilled cover lasts to Wed.</span></div>
                    <div class="kvl__r"><span>Fair to you</span><span>Your <b>next order won't be moved</b>. It's protected.</span></div>
                  </div>
                </div>
                <div class="quote" style="padding:0 20px; font-size:14px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>"Reserved your first slot on Wed Trip 1." · N. Perera, dispatcher</span></div>
                <div class="vo-cap">
                  <div class="vo-cap__head"><span><span class="vo-lvl"><span style="height:6px;"></span><span style="height:13px;"></span><span style="height:9px;"></span></span>Now speaking</span><span class="vo-cap__alt"><span class="vo-ta">தமிழ்</span> also available</span></div>
                  <div class="vo-cap__txt vo-si"><span class="vo-cap__now">ඔබේ ශීත කළ ඇණවුම ORD0104188, අප්‍රේල් 8 බදාදාට මාරු කර ඇත.</span> අප්‍රේල් 7 අඟහරුවාදා ශීතකරණ වාහනයේ ඉඩ පිරී ඇති නිසාය. ඔබේ ඊළඟ ඇණවුම මාරු නොකෙරේ.</div>
                </div>
              </div>
              <div class="m-actionbar"><div class="m-btn">Acknowledge</div><div class="vo-actrow"><div class="vo-read is-on"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Speaking · <span class="vo-si">සිංහල</span><span class="vo-lvl"><span style="height:6px;"></span><span style="height:13px;"></span><span style="height:9px;"></span></span></div><div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatcher</div></div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <div class="sx-cap sx-cap--p">OUT027's notice read aloud in Sinhala. <b>Pause → SM-17</b> · Acknowledge → SM-21</div>
    </div>
    </div>
  </section>
</main>
</body>
</html>
` }} />
  );
}
