
import React from 'react';

export default function p3screensloader() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Loader · complete app screens</title>
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/components.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700;800&family=Noto+Sans+Tamil:wght@400;600;700;800&display=swap">
<style>
  /* ---------- Board-level (page 06) ---------- */
  .flow-row { display: flex; gap: 40px; align-items: flex-start; }
  .flow-row .flow-arrow { align-self: flex-start; margin-top: 420px; width: 72px; }

  .ctx-row { display: flex; gap: 20px; align-items: stretch; }
  .persona { display: flex; flex-direction: column; gap: 14px; width: 400px; flex-shrink: 0; padding: 24px; border-radius: 16px; background: var(--brand-950); color: #E8EBF7; }
  .persona__top { display: flex; align-items: center; gap: 14px; }
  .persona__av { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: var(--star-500); color: #1A1300; font-size: 20px; font-weight: 800; flex-shrink: 0; }
  .persona__name { font-size: 20px; font-weight: 800; color: #FFFFFF; }
  .persona__role { font-size: 14px; color: #9AA3C7; font-weight: 600; }
  .persona__facts { display: flex; flex-direction: column; gap: 8px; }
  .persona__fact { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #C9CFE8; }
  .persona__fact svg { color: var(--star-400); }
  .ctx { display: flex; flex-direction: column; gap: 12px; width: 300px; flex-shrink: 0; padding: 20px; border-radius: 16px; background: #FFFFFF; border: 1px solid var(--n-200); box-shadow: var(--shadow-1); }
  .ctx__cond { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 800; color: var(--n-900); }
  .ctx__ic { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: var(--n-100); color: var(--n-700); flex-shrink: 0; }
  .ctx__arrow { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--brand-600); }
  .ctx__resp { font-size: 15px; line-height: 1.5; color: var(--n-700); }
  .ctx__resp b { color: var(--n-900); }

  /* annotation pins + legend */
  .annot--pin { padding: 4px; border-radius: 999px; box-shadow: 0 4px 10px rgba(120,80,0,.35), 0 0 0 3px #FFFFFF; }
  .annot--pin .annot__n { width: 22px; height: 22px; font-size: 12px; }
  .annot--left { left: -15px; }
  .annot--right { left: 375px; }
  .annot--tright { left: 1009px; }
  .pins { display: flex; flex-direction: column; gap: 8px; width: 390px; padding: 14px 16px; border-radius: 12px; background: var(--star-100); border: 1px solid #F3D38C; }
  .pins--wide { width: 1024px; flex-direction: row; flex-wrap: wrap; column-gap: 24px; }
  .pins--wide .pins__i { width: 470px; }
  .pins__i { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; font-weight: 600; line-height: 1.45; color: #4A3A10; }
  .pins__i .annot__n { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #1A1300; color: var(--star-400); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }

  /* ---------- Lodestar 2.0 loader pieces (page-local, used with ui2.css m-* kit) ---------- */
  .ld-user { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px 0 5px; border-radius: 999px; background: var(--surface); box-shadow: 0 1px 2px rgba(0,0,0,.06); flex-shrink: 0; }
  .ld-user__av { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--brand-900); color: var(--star-400); font-size: 13px; font-weight: 800; flex-shrink: 0; }
  .ld-user__t { display: flex; flex-direction: column; line-height: 1.2; white-space: nowrap; }
  .ld-user__t b { font-size: 13px; font-weight: 700; color: var(--text); }
  .ld-user__t span { font-size: 13px; font-weight: 600; color: var(--text-3); }
  .frame .ld-box { background: transparent; box-shadow: inset 0 0 0 2.5px #8F98AA; }
  .frame .ld-bay { font-size: 15px; }
  .ld-flag { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--line); color: var(--text-2); flex-shrink: 0; }
  .ld-flag svg { width: 22px; height: 22px; }
  .ld-flag--on { background: var(--st-exception-fg); color: #FFFFFF; box-shadow: none; }
  .ld-van { display: flex; flex-direction: column; gap: 6px; }
  .ld-van__legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; font-weight: 600; color: var(--text-2); }
  .frame .ld-hero-tight { gap: 8px; }
  .ld-col { display: flex; flex-direction: column; gap: 4px; }
  .ld-col--end { align-items: flex-end; }
  .frame .ld-short { color: var(--st-exception-fg); }
  .ld-seal { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 9px; border-radius: 8px; background: var(--surface-3); font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--text); }
  .ld-seal svg { width: 13px; height: 13px; }
  .ld-threadwrap { display: flex; justify-content: center; padding: 16px 8px 14px; }
  .frame .ld-thread .thread__step { width: 62px; gap: 5px; }
  .frame .ld-thread .thread__label { font-size: 13px; white-space: nowrap; }
  .frame .ld-thread .thread__time { font-size: 13px; font-family: var(--font-ui); font-weight: 600; white-space: nowrap; }
  .frame .ld-thread .thread__bar { width: 36px; margin-left: -16px; margin-right: -16px; }
  .ld-minibtn { display: flex; align-items: center; justify-content: center; height: 44px; padding: 0 16px; border-radius: 14px; background: #1A1300; color: #FFFFFF; font-size: 14px; font-weight: 700; flex-shrink: 0; }
  .frame .m-body.ld-tight { gap: 16px; }
  .frame .m-body > *, .frame .ld-tleft > *, .frame .ld-tright > * { flex-shrink: 0; }
  .frame .m-body.ld-tight-b { padding-bottom: 8px; }
  .ld-state { display: flex; flex-direction: column; gap: 10px; width: 390px; padding: 16px; border-radius: 16px; background: #FFFFFF; border: 1px solid var(--n-200); }
  .ld-state__t { font-size: 13px; font-weight: 700; color: var(--n-500); }
  .ld-state__b { font-size: 13px; line-height: 1.45; color: var(--n-600); }
  .ld-state .m-banner { margin: 0; }

  /* tablet */
  .ld-tbar { display: flex; align-items: center; justify-content: space-between; height: 28px; padding: 0 22px; flex-shrink: 0; font-size: 13px; font-weight: 600; color: var(--text); }
  .ld-tbar svg { width: 15px; height: 15px; }
  .ld-tnav { display: flex; align-items: center; gap: 18px; height: 72px; padding: 0 22px; flex-shrink: 0; }
  .ld-tmeta { display: flex; flex-direction: column; gap: 2px; }
  .ld-tmeta span { font-size: 13px; font-weight: 600; color: var(--text-3); white-space: nowrap; }
  .ld-tmeta b { font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.01em; color: var(--text); white-space: nowrap; }
  .ld-tvr { width: 1px; height: 36px; background: var(--hair); flex-shrink: 0; }
  .ld-tbody { display: flex; gap: 18px; flex: 1; min-height: 0; padding: 4px 22px 12px; overflow: hidden; }
  .ld-tleft { display: flex; flex-direction: column; gap: 16px; width: 404px; flex-shrink: 0; }
  .ld-tright { display: flex; flex-direction: column; gap: 14px; flex: 1; min-width: 0; }
  .frame .ld-tbody .m-hero, .frame .ld-tbody .m-group, .frame .ld-tbody .m-stats, .frame .ld-tbody .m-section__head { margin-left: 0; margin-right: 0; }
  .frame .ld-tbody .m-section__head { padding: 0 4px; }
  .frame .ld-tbody .m-row { min-height: 60px; padding-top: 8px; padding-bottom: 8px; }
  .ld-tfoot { display: flex; align-items: center; gap: 14px; height: 84px; padding: 0 22px; flex-shrink: 0; }
  .ld-tprog { display: flex; flex-direction: column; gap: 8px; width: 404px; }
  .ld-tprog__t { display: flex; align-items: baseline; justify-content: space-between; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .ld-tprog__t b { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text); }
  .frame .ld-tfoot .m-btn { height: 58px; padding: 0 24px; }
  .frame .ld-tfoot .m-btn--secondary { padding: 0 20px; }
  .frame .ld-locked, .ld-state .ld-locked { background: var(--surface-3) !important; color: var(--text-2) !important; box-shadow: none !important; }
  .ld-statbar { display: flex; height: 6px; margin-top: 4px; border-radius: 999px; background: var(--surface-3); overflow: hidden; }
  .ld-statbar div { border-radius: 999px; }
  .ld-flagrow { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
  .ld-flagrow .m-btn { height: 56px; padding: 0 18px; font-size: 16px; flex-shrink: 0; }
  .ld-flagrow .m-btn svg { color: var(--st-exception-fg); }


  /* ---------- Complete screen set: board pieces (lx-) ---------- */
  .lx-cap { width: 390px; margin: 0; font-size: 14px; line-height: 1.45; color: var(--n-600); }
  .lx-cap--wide { width: 1024px; }
  .lx-cap b { color: var(--n-900); font-weight: 700; }
  .lx-plat { display: flex; flex-direction: column; gap: 48px; padding-top: 40px; border-top: 1px solid #C9CFDB; }
  .lx-plat__head { display: flex; flex-direction: column; gap: 6px; max-width: 1100px; }
  .lx-plat__k { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--brand-600); }
  .lx-plat__head h3 { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); }
  .lx-plat__head p { font-size: 17px; line-height: 1.5; color: var(--n-600); }
  .lx-flow { display: flex; flex-direction: column; gap: 22px; }
  .lx-flow__head { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; color: var(--n-900); }
  .lx-flow__n { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; background: var(--brand-900); color: var(--star-400); font-family: var(--font-mono); font-size: 14px; font-weight: 700; }

  /* inventory table */
  .lx-inv { display: flex; flex-direction: column; gap: 14px; width: 1400px; }
  .lx-inv__title { display: flex; align-items: baseline; gap: 14px; font-size: 22px; font-weight: 800; color: var(--n-900); }
  .lx-inv__title span { font-size: 14px; font-weight: 600; color: var(--n-500); }
  .lx-inv__tbl { display: flex; flex-direction: column; border-radius: 16px; background: #FFFFFF; overflow: hidden; box-shadow: var(--shadow-1); }
  .lx-inv__tr { display: flex; align-items: center; gap: 16px; min-height: 38px; padding: 4px 20px; font-size: 14px; color: var(--n-700); border-top: 1px solid #ECEEF3; }
  .lx-inv__tr--head { min-height: 40px; border-top: none; background: #F6F7FB; font-size: 13px; font-weight: 700; color: var(--n-500); }
  .lx-inv__id { font-family: var(--font-mono); font-size: 13px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: var(--n-900); color: var(--star-400); white-space: nowrap; }
  .lx-c1 { width: 110px; flex-shrink: 0; }
  .lx-c2 { width: 290px; flex-shrink: 0; font-weight: 700; color: var(--n-900); }
  .lx-c3 { width: 90px; flex-shrink: 0; }
  .lx-c4 { width: 170px; flex-shrink: 0; }
  .lx-c5 { flex: 1; min-width: 0; }

  /* ---------- Phone pieces ---------- */
  .frame .lx-splash { display: flex; flex-direction: column; flex: 1; min-height: 0; background: linear-gradient(170deg, #26318A 0%, #141B4D 52%, #0A0F2E 100%); color: #FFFFFF; }
  .lx-splash__art { display: flex; justify-content: center; padding-top: 96px; flex-shrink: 0; }
  .lx-splash__brand { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 28px; flex-shrink: 0; }
  .lx-splash__name { font-family: var(--font-display); font-size: 38px; font-weight: 800; letter-spacing: -0.03em; color: #FFFFFF; }
  .lx-splash__tag { font-size: 17px; font-weight: 500; color: #B9C0E6; }
  .lx-splash__foot { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 56px 28px; flex-shrink: 0; }
  .lx-splash__bar { display: flex; width: 100%; height: 6px; border-radius: 999px; background: rgba(255,255,255,.14); overflow: hidden; }
  .lx-splash__bar div { border-radius: 999px; background: linear-gradient(90deg, #FFD37A, #F5B83D); }
  .lx-splash__load { font-size: 14px; font-weight: 600; color: #B9C0E6; }
  .lx-splash__org { display: flex; align-items: center; gap: 8px; padding-top: 10px; font-size: 13px; font-weight: 700; color: #8E97C7; }

  .lx-link { display: flex; align-items: center; height: 44px; padding: 0 4px; font-size: 15px; font-weight: 700; color: var(--brand-600); white-space: nowrap; flex-shrink: 0; }
  .lx-link--quiet { width: 56px; justify-content: flex-end; color: var(--text-2); }
  .lx-fieldv { font-family: var(--font-mono); font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: .02em; }
  .lx-pin { display: flex; align-items: center; gap: 14px; padding-top: 4px; }
  .lx-pin__d { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--brand-900); }
  .lx-pin__d.is-on { background: var(--brand-900); }
  .lx-keypad { display: flex; flex-direction: column; gap: 10px; margin: 0 16px; }
  .lx-keyrow { display: flex; gap: 10px; }
  .lx-key { display: flex; align-items: center; justify-content: center; flex: 1; height: 60px; border-radius: 16px; background: var(--surface); font-family: var(--font-display); font-size: 26px; font-weight: 800; color: var(--text); box-shadow: 0 1px 2px rgba(15,20,50,.08); }
  .lx-key svg { width: 26px; height: 26px; }
  .lx-key--ghost { background: transparent; box-shadow: none; color: var(--text-2); }
  .lx-key--txt { font-family: var(--font-ui); font-size: 16px; font-weight: 700; }

  .lx-bays { display: flex; gap: 10px; margin: 0 16px; }
  .lx-bay { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; flex: 1; height: 80px; border-radius: 18px; background: var(--surface); box-shadow: 0 1px 2px rgba(15,20,50,.06); }
  .lx-bay b { font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--text); }
  .lx-bay .id { font-size: 13px; color: var(--text-3); }
  .lx-bay.is-on { background: var(--brand-900); box-shadow: 0 6px 16px rgba(20,27,77,.25); }
  .lx-bay.is-on b { color: var(--star-400); }
  .lx-bay.is-on .id { color: #C9CFE8; }
  .lx-toggle { display: flex; justify-content: flex-end; align-items: center; width: 56px; height: 34px; padding: 3px; border-radius: 999px; background: var(--brand-900); flex-shrink: 0; }
  .lx-toggle span { width: 28px; height: 28px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.2); }

  .frame .lx-side { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .frame .lx-side span { font-size: 13px; font-weight: 600; color: var(--text-3); }
  .frame .lx-side b { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
  .frame .lx-metarow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .frame .lx-camscreen { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #05070D; }
  .frame .lx-darkbtn { background: rgba(255,255,255,.14); color: #FFFFFF; box-shadow: none; }
  .lx-cam { display: flex; justify-content: center; align-items: center; flex: 1; min-height: 0; overflow: hidden; }
  .lx-cam svg { flex-shrink: 0; }
  .lx-sheet { display: flex; flex-direction: column; gap: 10px; padding: 20px 20px 0; border-radius: 28px 28px 0 0; background: var(--surface); flex-shrink: 0; }
  .lx-sheet__acts { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }

  .frame .lx-code { display: flex; flex-direction: column; gap: 6px; padding: 14px 18px 16px; box-shadow: inset 0 0 0 2px var(--brand-900); }
  .lx-code__v { display: flex; align-items: center; gap: 2px; font-family: var(--font-mono); font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: .02em; }
  .lx-caret { width: 2px; height: 28px; margin-left: 4px; background: var(--brand-600); }

  .frame .m-hero.lx-hero--warn { background: var(--tint-warn); box-shadow: none; }
  .frame .m-hero.lx-hero--off { background: transparent; border: 1.5px dashed var(--st-offline-bd); box-shadow: none; }
  .frame .m-row__lead.lx-lead--off { background: transparent; box-shadow: inset 0 0 0 1.5px var(--st-offline-bd); color: var(--st-offline-fg); }
  .frame .m-row__lead.lx-lead--plain { background: var(--surface-3); color: var(--text-2); }
  .frame .lx-tag--off { color: var(--st-offline-fg); }
  .frame .lx-row--locked { background: var(--surface-2); }
  .frame .lx-row--locked .m-row__title, .frame .lx-row--locked .m-row__value { color: var(--text-2); }
  .frame .lx-herohead { display: flex; align-items: center; gap: 12px; }
  .frame .m-row__meta s { color: var(--text-3); }

  .lx-done { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 28px 0; text-align: center; }
  .lx-bigok { display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; border-radius: 50%; background: var(--st-delivered-fg); color: #FFFFFF; box-shadow: 0 0 0 10px var(--tint-ok); margin-bottom: 10px; }
  .lx-bigok svg { width: 42px; height: 42px; stroke-width: 3; }
  .lx-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 28px; text-align: center; }

  /* ---------- Tablet pieces ---------- */
  .lx-tsign { display: flex; flex: 1; min-height: 0; }
  .lx-tsign__brand { display: flex; flex-direction: column; gap: 10px; width: 320px; flex-shrink: 0; padding: 28px; background: linear-gradient(170deg, #26318A 0%, #141B4D 55%, #0A0F2E 100%); color: #FFFFFF; }
  .lx-tsign__logo { display: flex; align-items: center; gap: 12px; }
  .lx-tsign__logo b { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .lx-tsign__logo span { font-size: 13px; font-weight: 600; color: #B9C0E6; }
  .lx-tsign__clock { font-family: var(--font-display); font-size: 88px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
  .lx-tsign__date { font-size: 16px; font-weight: 600; color: #B9C0E6; }
  .lx-tsign__next { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 15px; font-weight: 700; color: var(--star-400); }
  .lx-tsign__foot { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; line-height: 1.45; color: #B9C0E6; }
  .lx-tsign__main { display: flex; flex-direction: column; gap: 22px; flex: 1; min-width: 0; padding: 28px 32px; }
  .lx-tsign__cols { display: flex; gap: 28px; }
  .lx-names { display: flex; flex-wrap: wrap; gap: 12px; width: 320px; flex-shrink: 0; align-content: flex-start; }
  .lx-name { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 154px; height: 118px; border-radius: 20px; background: var(--surface); box-shadow: 0 1px 2px rgba(15,20,50,.06); }
  .lx-name__av { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: 4px; border-radius: 50%; background: var(--tint-brand); color: var(--brand-900); font-size: 15px; font-weight: 800; }
  .lx-name b { font-size: 16px; font-weight: 700; color: var(--text); }
  .lx-name span { font-size: 13px; font-weight: 600; color: var(--text-3); }
  .lx-name.is-on { background: var(--brand-900); box-shadow: 0 8px 20px rgba(20,27,77,.25); }
  .lx-name.is-on .lx-name__av { background: var(--star-500); color: #1A1300; }
  .lx-name.is-on b { color: #FFFFFF; }
  .lx-name.is-on span { color: #C9CFE8; }
  .lx-pinpad { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 0; }
  .lx-pinpad__head { display: flex; align-items: center; justify-content: space-between; height: 32px; font-size: 15px; font-weight: 600; color: var(--text-2); }
  .lx-pinpad__head b { color: var(--text); }
  .frame .lx-keypad--t { margin: 0; }

  .frame .lx-tbody--col { flex-direction: column; gap: 16px; }
  .frame .lx-thero { flex-direction: row; align-items: center; gap: 24px; padding: 18px 24px; }
  .lx-thero__side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  .lx-baycards { display: flex; gap: 14px; flex: 1; min-height: 0; }
  .lx-baycard { display: flex; flex-direction: column; gap: 12px; flex: 1; min-width: 0; padding: 18px; border-radius: 22px; background: var(--surface); box-shadow: 0 1px 2px rgba(15,20,50,.04), 0 4px 14px rgba(15,20,50,.05); }
  .lx-baycard.is-mine { box-shadow: inset 0 0 0 3px var(--brand-900), 0 8px 20px rgba(20,27,77,.14); }
  .lx-baycard__head { display: flex; align-items: center; gap: 12px; }
  .lx-baycard__veh { font-size: 17px; font-weight: 700; color: var(--text); }
  .lx-baycard__dest { font-size: 13px; font-weight: 600; color: var(--text-3); white-space: nowrap; }
  .lx-baycard__meta { display: flex; align-items: center; gap: 8px; min-height: 20px; }
  .lx-baycard__time { font-family: var(--font-display); font-size: 40px; font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; color: var(--text); }
  .lx-baycard__sub { font-size: 13px; font-weight: 600; color: var(--text-2); }
  .lx-baycard__sub b { color: var(--text); }
  .lx-baycard__flag { display: flex; align-items: center; min-height: 36px; padding: 0 12px; border-radius: 12px; background: var(--surface-2); }
  .lx-baycard .m-pill { align-self: flex-start; }
  .lx-tnote { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .frame .lx-statnote { font-size: 13px; font-weight: 600; color: var(--text-3); }
  .lx-diff { display: flex; align-items: center; gap: 10px; flex-shrink: 0; color: var(--text-3); }
  .lx-diff__c { display: flex; flex-direction: column; gap: 1px; }
  .lx-diff__c span { font-size: 13px; font-weight: 700; color: var(--text-3); }
  .lx-diff__c s { font-size: 15px; font-weight: 600; color: var(--text-3); }
  .lx-diff__c b { font-size: 15px; font-weight: 800; color: var(--st-deferred-fg); }
  .frame .lx-mapbox { gap: 10px; padding: 14px 16px; }
  .lx-new .m-row__unit { font-size: 13px; }
  .lx-flowrow { display: flex; gap: 96px; align-items: flex-start; }
  .lx-nw { white-space: nowrap; }
  .lx-baycard { gap: 16px; }
  .lx-baycard__time { font-size: 54px; }
  .lx-baycard__sub { font-size: 14px; }
  .lx-baycard .m-progress { height: 12px; }
  .lx-baycard__flag { min-height: 48px; }
  .lx-baycard__flag .m-tag { font-size: 15px; }
  .lx-baycard__flag .m-tag svg { width: 17px; height: 17px; }
  .lx-baycard .m-pill { height: 34px; padding: 0 14px; font-size: 14px; }
  .lx-tsign__date { line-height: 1.5; }
  .frame .ld-tbody .lx-bigrows .m-row { min-height: 80px; }

  /* photo auto-fill hint: value read from a photo, the person confirms (manual entry stays) */
  .cv-hint { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--brand-600); white-space: nowrap; }
  .cv-hint svg { width: 14px; height: 14px; flex-shrink: 0; }
  .cv-hint b { font-weight: 800; }
  .mode-driver .cv-hint { color: #A9B4FF; }

  /* ---------- Access & system states (la-) ---------- */
  .frame .la-bigrow { min-height: 76px; }
  .frame .la-chev { width: 22px; height: 22px; color: var(--text-3); flex-shrink: 0; }
  .la-note { display: flex; align-items: center; gap: 10px; margin: 0 20px; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--text-2); }
  .la-note svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--st-delivered-fg); }
  .la-baynow { display: flex; flex-direction: column; gap: 6px; margin-top: 18px; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,.08); }
  .la-baynow__k { font-size: 13px; font-weight: 700; color: var(--star-400); }
  .la-baynow b { font-size: 16px; font-weight: 700; color: #FFFFFF; }
  .la-baynow span { font-size: 13px; font-weight: 600; color: #C9CFE8; }
  .la-baynow__bar { display: flex; height: 6px; border-radius: 999px; background: rgba(255,255,255,.14); overflow: hidden; }
  .la-baynow__bar div { border-radius: 999px; background: #C9CFE8; }
  .la-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 280px; flex-shrink: 0; border-radius: 24px; background: var(--tint-brand); box-shadow: inset 0 0 0 2px var(--brand-600); text-align: center; }
  .la-badge svg { margin-bottom: 8px; }
  .la-badge b { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--brand-900); }
  .la-badge span { font-size: 14px; font-weight: 600; color: var(--text-2); }
  .la-forgot { display: flex; align-items: center; justify-content: center; gap: 10px; height: 56px; border-radius: 16px; background: var(--surface); font-size: 16px; font-weight: 700; color: var(--brand-600); }
  .la-forgot svg { width: 20px; height: 20px; }
  /* ---------- On-device read-aloud (vo-): output only, voice runs on the phone, works offline ---------- */
  .vo-btn { display: inline-flex; align-items: center; gap: 10px; height: 56px; padding: 0 22px 0 18px; border-radius: 999px; background: var(--surface); box-shadow: inset 0 0 0 2px var(--brand-900); color: var(--brand-900); font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -0.01em; white-space: nowrap; flex-shrink: 0; }
  .vo-btn svg { width: 22px; height: 22px; }
  .vo-btn--on { background: var(--brand-900); box-shadow: 0 6px 16px rgba(20,27,77,.25); color: #FFFFFF; }
  .vo-btn--on svg { color: var(--star-400); }
  .vo-btn--off { background: transparent; box-shadow: none; border: 2px dashed var(--line-strong); color: var(--text-2); font-family: var(--font-ui); font-size: 14px; font-weight: 700; }
  .vo-lvl { display: flex; align-items: flex-end; gap: 3px; height: 18px; flex-shrink: 0; }
  .vo-lvl span { width: 4px; border-radius: 2px; background: var(--star-400); }
  .vo-bar { display: flex; align-items: center; gap: 12px; }
  .vo-hint { display: flex; flex-direction: column; gap: 1px; min-width: 0; font-size: 13px; font-weight: 600; line-height: 1.3; color: var(--text-3); }
  .vo-hint b { font-weight: 700; color: var(--text-2); }
  .vo-hint svg { width: 14px; height: 14px; vertical-align: -2px; }
  .vo-ta { font-family: 'Noto Sans Tamil', var(--font-ui); }
  .vo-si { font-family: 'Noto Sans Sinhala', var(--font-ui); }
  .frame .m-body.vo-tight { gap: 10px; }
  .frame .vo-tight .ld-hero-tight { gap: 6px; }
  .frame .vo-tight .m-row { padding-top: 8px; padding-bottom: 8px; }
  .frame .m-actionbar.vo-ab { gap: 6px; padding-top: 8px; }
  .frame .vo-lang b { font-size: 20px; }
  .vo-seg { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--surface-3); flex-shrink: 0; }
  .vo-seg span { display: flex; align-items: center; justify-content: center; height: 40px; padding: 0 10px; border-radius: 999px; font-size: 14px; font-weight: 700; color: var(--text-2); white-space: nowrap; }
  .vo-seg span.is-on { background: var(--brand-900); color: #FFFFFF; }
  .vo-cap { display: flex; align-items: flex-start; gap: 12px; padding: 10px 14px 11px; border-radius: 16px; background: var(--surface); box-shadow: inset 0 0 0 2px var(--star-500); }
  .vo-cap .vo-lvl { height: 14px; margin-top: 4px; }
  .vo-cap .vo-lvl span { background: var(--star-500); }
  .vo-cap__ta { font-family: 'Noto Sans Tamil', var(--font-ui); font-size: 15px; font-weight: 600; line-height: 1.45; color: var(--text); }
  .frame .vo-btn--off { justify-content: center; margin: 0 16px; }
</style>
<link rel="stylesheet" href="/assets/modern.css">
<link rel="stylesheet" href="/assets/ui2.css">
</head>
<body>
<main class="board" data-name="Loader · complete app screens" style="gap:64px;">
  <header class="section__head"><div class="section__kicker">Prototype screens · import into the Figma "Prototype" page</div><h2 class="section__title">Loader · complete app screens</h2><p class="section__desc">Lodestar Dock for Kasun Jayawardena, dock team lead, Kandy Hub, night shift 01:30–09:30 · Tue 7 Apr 2026 · phone and shared bay tablet</p></header>
  <section class="lx-inv" data-name="Screen inventory">
    <div class="lx-inv__title">Screen inventory <span>32 screens · 26 phone · 6 tablet · LD-01 to LD-04 from page 06 (LD-01 adds the tab bar)</span></div>
    <div class="lx-inv__tbl">
      <div class="lx-inv__tr lx-inv__tr--head"><span class="lx-c1">ID</span><span class="lx-c2">Screen</span><span class="lx-c3">Platform</span><span class="lx-c4">Flow</span><span class="lx-c5">Prototype links (tap → target)</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-05</span></span><span class="lx-c2">Splash</span><span class="lx-c3">Phone</span><span class="lx-c4">Entry</span><span class="lx-c5">auto → LD-06</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-06</span></span><span class="lx-c2">Sign in (staff ID + PIN)</span><span class="lx-c3">Phone</span><span class="lx-c4">Entry</span><span class="lx-c5">Sign in → LD-07</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-07</span></span><span class="lx-c2">Start shift, choose bay</span><span class="lx-c3">Phone</span><span class="lx-c4">Entry</span><span class="lx-c5">Start shift → LD-08 (→ LD-29 first if a voice pack is missing)</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-08</span></span><span class="lx-c2">Quick tips</span><span class="lx-c3">Phone</span><span class="lx-c4">Entry</span><span class="lx-c5">Got it / Skip → LD-01</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-01</span></span><span class="lx-c2">Dock queue</span><span class="lx-c3">Phone</span><span class="lx-c4">Before loading</span><span class="lx-c5">Start loading → LD-09 · tabs → LD-13 / LD-16</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-09</span></span><span class="lx-c2">Pre-cool check</span><span class="lx-c3">Phone</span><span class="lx-c4">Before loading</span><span class="lx-c5">Start loading → LD-02 · Report it → LD-B1</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-02</span></span><span class="lx-c2">Load sheet</span><span class="lx-c3">Phone</span><span class="lx-c4">Loading</span><span class="lx-c5">Tick → LD-10 · yoghurt flag → LD-03 · Read next line → LD-30 · voice hint → LD-28</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-10</span></span><span class="lx-c2">Scan a line</span><span class="lx-c3">Phone</span><span class="lx-c4">Loading</span><span class="lx-c5">Confirm 6 cases → LD-04 · Type the code → LD-11</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-11</span></span><span class="lx-c2">Type a code</span><span class="lx-c3">Phone</span><span class="lx-c4">Loading</span><span class="lx-c5">Confirm 6 cases → LD-04 · back → LD-10</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-03</span></span><span class="lx-c2">Flag shortfall</span><span class="lx-c3">Phone</span><span class="lx-c4">Problems</span><span class="lx-c5">Send flag → LD-03 ack</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-03 ack</span></span><span class="lx-c2">Flag acknowledged</span><span class="lx-c3">Phone</span><span class="lx-c4">Problems</span><span class="lx-c5">Tick tea → LD-10</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-12</span></span><span class="lx-c2">Plan changed v3 → v4</span><span class="lx-c3">Phone</span><span class="lx-c4">Problems</span><span class="lx-c5">Got it → VEH044 sheet (LD-02 layout)</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-13</span></span><span class="lx-c2">Flags tab</span><span class="lx-c3">Phone</span><span class="lx-c4">Problems</span><span class="lx-c5">Flag row → LD-03 ack · tabs → LD-19 / LD-16</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-14</span></span><span class="lx-c2">Re-plan received (after LD-B1)</span><span class="lx-c3">Phone</span><span class="lx-c4">Problems</span><span class="lx-c5">Got it → LD-01</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-04</span></span><span class="lx-c2">Release vehicle</span><span class="lx-c3">Phone</span><span class="lx-c4">Release & handover</span><span class="lx-c5">Release → LD-15</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-15</span></span><span class="lx-c2">Handover confirmed</span><span class="lx-c3">Phone</span><span class="lx-c4">Release & handover</span><span class="lx-c5">Back to the dock → LD-19</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-16</span></span><span class="lx-c2">Shift summary, sign out</span><span class="lx-c3">Phone</span><span class="lx-c4">Shift</span><span class="lx-c5">Sign out → LD-06 · tabs → LD-19 / LD-13</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-17</span></span><span class="lx-c2">Offline dock Wi-Fi</span><span class="lx-c3">Phone</span><span class="lx-c4">States</span><span class="lx-c5">Wi-Fi back → LD-02</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-18</span></span><span class="lx-c2">Plan locked</span><span class="lx-c3">Phone</span><span class="lx-c4">States</span><span class="lx-c5">v4 published → LD-12</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-19</span></span><span class="lx-c2">Empty queue</span><span class="lx-c3">Phone</span><span class="lx-c4">States</span><span class="lx-c5">Help load VEH044 → LD-18 · tabs → LD-13 / LD-16</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-24</span></span><span class="lx-c2">Can't sign in</span><span class="lx-c3">Phone</span><span class="lx-c4">Access</span><span class="lx-c5">from LD-06 "Can't sign in?" · Enter one-time PIN → LD-06</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-25</span></span><span class="lx-c2">Signed out at shift end</span><span class="lx-c3">Phone</span><span class="lx-c4">Access</span><span class="lx-c5">auto at shift end (after LD-16) · Sign in for a new shift → LD-06</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-26</span></span><span class="lx-c2">Update required</span><span class="lx-c3">Phone</span><span class="lx-c4">Access</span><span class="lx-c5">Keep loading VEH057 → LD-02 · Update now → LD-05</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-28</span></span><span class="lx-c2">Voice and language</span><span class="lx-c3">Phone</span><span class="lx-c4">Voice</span><span class="lx-c5">from LD-02 voice hint or LD-29 · Done → LD-02</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-29</span></span><span class="lx-c2">Voice pack downloading</span><span class="lx-c3">Phone</span><span class="lx-c4">Voice</span><span class="lx-c5">after LD-07 on dock Wi-Fi · Continue → LD-08</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-30</span></span><span class="lx-c2">Load sheet speaking</span><span class="lx-c3">Phone</span><span class="lx-c4">Voice</span><span class="lx-c5">Tick → LD-10 · pause → LD-02</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-20</span></span><span class="lx-c2">Shared sign in</span><span class="lx-c3">Tablet</span><span class="lx-c4">Entry</span><span class="lx-c5">Sign in → LD-21</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-21</span></span><span class="lx-c2">Bay overview</span><span class="lx-c3">Tablet</span><span class="lx-c4">Before loading</span><span class="lx-c5">Open Bay K2 → LD-02 tablet · Flags → LD-13</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-02</span></span><span class="lx-c2">Load sheet</span><span class="lx-c3">Tablet</span><span class="lx-c4">Loading</span><span class="lx-c5">Release (when 22 of 22) → LD-22</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-22</span></span><span class="lx-c2">Release checklist</span><span class="lx-c3">Tablet</span><span class="lx-c4">Release & handover</span><span class="lx-c5">Release → LD-21 (driver sees LD-15 moment)</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-23</span></span><span class="lx-c2">Plan changed v3 → v4</span><span class="lx-c3">Tablet</span><span class="lx-c4">Problems</span><span class="lx-c5">Got it → LD-21 · Print v4</span></div>
      <div class="lx-inv__tr"><span class="lx-c1"><span class="lx-inv__id">LD-27</span></span><span class="lx-c2">Tablet locked</span><span class="lx-c3">Tablet</span><span class="lx-c4">Access</span><span class="lx-c5">after 2 min idle on LD-21 / LD-02 tablet · badge or PIN → LD-21</span></div>
    </div>
  </section>
  <section class="lx-plat" data-name="Phone screens">
    <div class="lx-plat__head"><span class="lx-plat__k">Phone · 390 × 844</span><h3>Lodestar Dock on Kasun's own phone</h3><p>Carried in a jacket pocket on the dock. Tab bar (Dock · Flags · Shift) only on top-level screens; task screens keep one primary action.</p></div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">1</span>Entry</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-05</span>Splash · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-05 Splash · phone">
            <div class="m-screen">
              <div class="lx-splash">
              <div class="statusbar" style="color:#FFFFFF;"><span class="mono">1:28</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="lx-splash__art"><svg width="374" height="236" viewBox="-37 0 374 236" data-name="Splash illustration">
  <defs><linearGradient id="lxHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B4CCA" stop-opacity=".55"/><stop offset="1" stop-color="#3B4CCA" stop-opacity="0"/></linearGradient><linearGradient id="lxHill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0F2E" stop-opacity=".6"/><stop offset="1" stop-color="#0A0F2E" stop-opacity="0"/></linearGradient></defs>
  <circle cx="150" cy="92" r="88" fill="#3B4CCA" opacity=".16"/>
  <circle cx="150" cy="92" r="58" fill="#3B4CCA" opacity=".24"/>
  <circle cx="44" cy="40" r="2" fill="#FFFFFF" opacity=".7"/><circle cx="252" cy="30" r="2.5" fill="#FFFFFF" opacity=".6"/><circle cx="270" cy="96" r="1.8" fill="#FFFFFF" opacity=".5"/><circle cx="26" cy="120" r="1.8" fill="#FFFFFF" opacity=".5"/><circle cx="92" cy="18" r="1.5" fill="#FFFFFF" opacity=".6"/><circle cx="214" cy="150" r="1.5" fill="#FFFFFF" opacity=".4"/>
  <path d="M150 38 L161 81 L204 92 L161 103 L150 146 L139 103 L96 92 L139 81 Z" fill="#F5B83D"/>
  <circle cx="150" cy="92" r="7" fill="#141B4D"/>
  <path d="M-37 190 C0 172 46 166 88 170 C110 172 118 178 128 182 C170 200 214 162 300 174 C316 176 328 178 337 180 V236 H-37 Z" fill="url(#lxHill)"/>
  <path d="M-37 214 C20 204 120 222 180 210 C230 200 270 206 337 214 V236 H-37 Z" fill="url(#lxHill2)"/>
  <path d="M-30 226 H330" stroke="#3B4CCA" stroke-width="2" stroke-dasharray="10 9" stroke-linecap="round"/>
  <rect x="96" y="168" width="78" height="44" rx="7" fill="#E6E9F8"/>
  <path d="M174 178 H192 L206 194 V212 H174 Z" fill="#C9CFDB"/>
  <path d="M179 183 H190 L199 194 H179 Z" fill="#141B4D"/>
  <path d="M135 177 V203 M124 183.5 L146 196.5 M124 196.5 L146 183.5" stroke="#22B8CF" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="116" cy="213" r="9" fill="#0A0F2E" stroke="#E6E9F8" stroke-width="3"/>
  <circle cx="188" cy="213" r="9" fill="#0A0F2E" stroke="#E6E9F8" stroke-width="3"/>
  <rect x="204" y="198" width="6" height="5" rx="2" fill="#F5B83D"/>
</svg></div>
              <div class="lx-splash__brand">
                <div class="lx-splash__name">Lodestar Dock</div>
                <div class="lx-splash__tag">Every order, one thread.</div>
              </div>
              <div class="spacer"></div>
              <div class="lx-splash__foot">
                <div class="lx-splash__bar"><div style="width:62%;"></div></div>
                <div class="lx-splash__load">Downloading tonight's plan</div>
                <div class="lx-splash__org"><svg viewBox="0 0 32 32" style="width:18px; height:18px;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg>Waypoint Group</div>
              </div>
              <div class="homebar"><div style="background:#FFFFFF;"></div></div>
              </div>
            </div>
          </div>
      <p class="lx-cap">Brand splash while tonight's plan downloads. <b>Next:</b> auto-advances to <span class="lx-nw">LD-06</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-06</span>Sign in · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-06 Sign in · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:29</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Lodestar Dock</div>
                <span class="m-pill m-pill--brand">Kandy Hub</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Night shift · Tue 7 Apr</div>
                  <div class="m-h1">Sign in</div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
                    <div class="m-row__main"><div class="m-row__meta">Staff ID</div><div class="lx-fieldv">KDY-0427</div></div>
                    <span class="lx-link">Not you?</span>
                  </div>
                  <div class="m-row m-row--sel">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__meta">PIN · 4 digits</div><div class="lx-pin"><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span></div></div>
                    <span class="lx-link">Can't sign in?</span>
                  </div>
                </div>
                <div class="lx-keypad"><div class="lx-keyrow"><div class="lx-key" style="height:64px;">1</div><div class="lx-key" style="height:64px;">2</div><div class="lx-key" style="height:64px;">3</div></div><div class="lx-keyrow"><div class="lx-key" style="height:64px;">4</div><div class="lx-key" style="height:64px;">5</div><div class="lx-key" style="height:64px;">6</div></div><div class="lx-keyrow"><div class="lx-key" style="height:64px;">7</div><div class="lx-key" style="height:64px;">8</div><div class="lx-key" style="height:64px;">9</div></div><div class="lx-keyrow"><div class="lx-key lx-key--ghost lx-key--txt" style="height:64px;">Clear</div><div class="lx-key" style="height:64px;">0</div><div class="lx-key lx-key--ghost" style="height:64px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Sign in<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Staff ID remembered, 4-digit PIN on a gloves-size keypad. <b>Sign in →</b> <span class="lx-nw">LD-07</span> · <b>Can't sign in? →</b> <span class="lx-nw">LD-24</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-07</span>Start shift · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-07 Start shift · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:30</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Kandy Hub</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J.</b><span>Team lead</span></div></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Tue 7 Apr · Kandy Hub</div>
                  <div class="m-h1">Start your shift</div>
                </div>
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Night shift</div>
                  <div class="m-hero__value" style="font-size:42px;">01:30–09:30</div>
                  <div class="m-hero__meta">4 vehicles tonight · first out <b style="color:#FFFFFF;">VEH039 at 3:30</b></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Your bay</b><span>change any time</span></div>
                  <div class="lx-bays">
                    <div class="lx-bay"><b>K1</b><span class="id">VEH039</span></div>
                    <div class="lx-bay is-on"><b>K2</b><span class="id">VEH057</span></div>
                    <div class="lx-bay"><b>K3</b><span class="id">VEH040</span></div>
                    <div class="lx-bay"><b>K4</b><span class="id">VEH044</span></div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Gloves mode</div><div class="m-row__meta">Big buttons, no swipes</div></div>
                    <div class="lx-toggle"><span></span></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Loud alerts</div><div class="m-row__meta">Vibrate and sound on plan changes</div></div>
                    <div class="lx-toggle"><span></span></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Start shift at Bay K2</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Confirms hub, shift and bay; gloves mode on by default. <b>Start shift →</b> <span class="lx-nw">LD-08</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-08</span>Quick tips · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-08 Quick tips · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div style="width:56px; flex-shrink:0;"></div>
                <div class="m-nav__title">Quick tips</div>
                <span class="lx-link lx-link--quiet">Skip</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Before your first vehicle</div>
                  <div class="m-h1">Three things to know</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Gloves mode is on</div><div class="m-row__meta">Every button fits a gloved thumb. No swipes, no small links.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--bad"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Flag it, don't phone it</div><div class="m-row__meta">Short, damaged or warm? One flag tells dispatch, the store and the driver.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Watch the plan version</div><div class="m-row__meta">Green means latest. Amber means it changed: read it and tap Got it before you load on.</div></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>A plan change looks like this</b></div>
                  <div class="m-banner m-banner--warn">
                    <svg class="ic" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>
                    <div class="m-banner__txt"><b>Plan changed 3:52 · v4 · 2 items moved</b><span>Tap to see what moved</span></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Got it, show my dock</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">First-run tips: gloves mode, flags, plan versions. <b>Got it or Skip →</b> <span class="lx-nw">LD-01</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flowrow">
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">2</span>Before loading</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-01</span>Dock queue · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-01 Dock queue">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">2:55</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Kandy Hub</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J. · K2</b><span>Switch user</span></div></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-banner m-banner--ok">
                  <svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>
                  <div class="m-banner__txt"><b>Plan v3 · latest, published 6:40 PM Mon</b></div>
                </div>
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Next at your bay K2</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">VEH057</div>
                    <span class="m-pill" style="background:rgba(255,255,255,.14); color:#FFFFFF;"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>in 45 min</span>
                  </div>
                  <div class="m-hero__meta">Reefer van · Nuwara Eliya · 3 orders</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Loading tonight · 4</b><span>soonest first</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead ld-bay">K1</div>
                      <div class="m-row__main">
                        <div class="m-row__title"><span class="id">VEH039</span> · Kandy</div>
                        <div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer</span><span class="m-sep"></span><span class="m-tag m-tag--info"><span class="dot"></span>Loading 60%</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">3:30</span><span class="m-row__unit">in 35 min</span></div>
                    </div>
                    <div class="m-row m-row--sel">
                      <div class="m-row__lead ld-bay" style="background:var(--brand-900); color:var(--star-400);">K2</div>
                      <div class="m-row__main">
                        <div class="m-row__title"><span class="id">VEH057</span> · Nuwara Eliya</div>
                        <div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer van</span><span class="m-sep"></span><b style="color:var(--brand-900);">Your bay</b></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">3:40</span><span class="m-row__unit">in 45 min</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead ld-bay">K3</div>
                      <div class="m-row__main">
                        <div class="m-row__title"><span class="id">VEH040</span> · Matale</div>
                        <div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer</span><span class="m-sep"></span>4 orders</div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">3:50</span><span class="m-row__unit">in 55 min</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead ld-bay">K4</div>
                      <div class="m-row__main">
                        <div class="m-row__title"><span class="id">VEH044</span> · Style</div>
                        <div class="m-row__meta"><span class="m-tag m-tag--warn"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Mall 10:30–12:30</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">10:05</span><span class="m-row__unit">loads now</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Start loading VEH057</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Dock</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flags</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Shift</div></div>
              <div class="homebar" style="background:var(--surface);"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Tonight's queue under the plan version banner (from page 06, plus tab bar). <b>Start loading →</b> <span class="lx-nw">LD-09</span>; <b>tabs →</b> <span class="lx-nw">LD-13</span> / <span class="lx-nw">LD-16</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-09</span>Pre-cool check · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-09 Pre-cool check · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:02</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · Bay K2</div>
                <span class="m-pill m-pill--ok">Plan v3</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Arrived at Bay K2 3:00 <span class="m-sep"></span> reefer van</div>
                  <div class="m-h1">Check the van first</div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__row">
                    <div class="ld-col"><span class="m-hero__label">Reefer reads</span><div class="m-hero__value" style="font-size:56px; color:var(--chilled-fg);">3 °C</div></div>
                    <div class="lx-side"><span>Needs</span><b>≤ 4 °C</b></div>
                  </div>
                  <span class="cv-hint" style="margin-top:-2px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Read from display photo · <b>confirm</b></span>
                  <div class="m-hero__meta lx-metarow"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Set-point 2 °C</span><span class="m-sep"></span>pre-cooling since 2:40</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Before you load</b><span>3 of 3 done</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Reefer at or below 4 °C</div><div class="m-row__meta">Read from the display photo 3:02</div></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Doors and seals intact</div><div class="m-row__meta">No tears, doors close tight</div></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Floor clean and dry</div><div class="m-row__meta">Nothing left from the last run</div></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Start loading VEH057</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>Above 4 °C? Report it</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Van arrives: reefer 3 °C read from a photo of the display and confirmed, doors and floor ticked. <b>Start loading →</b> <span class="lx-nw">LD-02</span>; <b>Report it →</b> <span class="lx-nw">LD-B1</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">3</span>Loading</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-02</span>Load sheet · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-02 Load sheet · Phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:10</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · departs 3:40</div>
                <span class="m-pill m-pill--ok">Plan v3</span>
              </div>
              <div class="m-body ld-tight ld-tight-b vo-tight">
                <div class="m-title">
                  <div class="m-h1">Load stop 2 first</div>
                </div>
                <div class="m-hero ld-hero-tight" style="padding-top:12px; padding-bottom:12px;">
                  <div class="m-hero__row">
                    <div class="m-hero__value">14<small>of 22 lines</small></div>
                    <span class="m-pill m-pill--brand">8 to go · 30 min</span>
                  </div>
                  <div class="m-progress"><div style="width:64%"></div></div>
                  <div class="ld-van" style="padding-top:2px;">
                    <svg width="302" height="96" viewBox="0 0 302 96" font-family="Inter, sans-serif">
                    <rect x="0" y="22" width="26" height="52" rx="9" fill="#C9CFDB"/><rect x="5" y="30" width="9" height="36" rx="3" fill="#8F98AA"/>
                    <rect x="30" y="1" width="262" height="94" rx="12" fill="#FFFFFF" stroke="#C9CFDB" stroke-width="1.5"/>
                    <path d="M31 13 a11 11 0 0 1 11 -11 H280 a11 11 0 0 1 11 11 V47 H31 Z" fill="#DDF4F9"/>
                    <path d="M31 49 H291 V83 a11 11 0 0 1 -11 11 H42 a11 11 0 0 1 -11 -11 Z" fill="#F1EFEC"/>
                    <rect x="36" y="6" width="92" height="37" rx="8" fill="#E3F6EC" stroke="#10B981" stroke-width="1.5"/>
                    <text x="44" y="21" font-size="13" font-weight="800" fill="#065F46">1st · Stop 2</text><text x="44" y="37" font-size="13" font-weight="600" fill="#065F46">1.1 m³ ✓</text>
                    <rect x="132" y="6" width="120" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="140" y="21" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="140" y="37" font-size="13" font-weight="600" fill="#7A4B00">chilled 1.3 m³</text>
                    <rect x="36" y="53" width="64" height="37" rx="8" fill="none" stroke="#A6AEBD" stroke-width="1.5" stroke-dasharray="4 3"/>
                    <text x="68" y="76" font-size="13" font-weight="600" fill="#6B7385" text-anchor="middle">free</text>
                    <rect x="104" y="53" width="148" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="112" y="68" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="112" y="84" font-size="13" font-weight="600" fill="#7A4B00">dry 2.2 m³</text>
                    <text x="272" y="30" font-size="13" font-weight="800" fill="#0E7490" text-anchor="middle">3°</text>
                    <rect x="293" y="6" width="7" height="38" rx="3" fill="#344054"/><rect x="293" y="52" width="7" height="38" rx="3" fill="#344054"/>
                  </svg>
                    <div class="ld-van__legend">Cab left, rear doors right <span class="m-sep"></span> <span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>top zone 3 °C</span></div>
                  </div>
                  <div class="m-hero__meta">Weight <b>988 / 1,040 kg</b> (95%, the tight one) · Volume <b>4.6 / 7.0 m³</b></div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--ok">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">1st · Stop 2 · Hawa Eliya</div><div class="m-row__meta"><span class="id">OUT108</span><span class="m-sep"></span>all in the front zone</div></div>
                    <div class="m-row__trail"><span class="m-row__value">6/6</span><span class="m-row__unit">lines</span></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>2nd · Stop 1 · Nuwara Eliya</b><span>8 of 16</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Fresh milk 1 L</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>crate of 12</div></div><div class="m-row__trail"><span class="m-row__value">8</span><span class="m-row__unit">crates</span></div></div>
                    <div class="m-row m-row--sel" style="padding-top:8px; padding-bottom:8px;"><div class="m-row__lead ld-box"></div><div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>×24</div></div><div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">cases</span></div><div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar vo-ab">
                <div class="vo-bar" data-name="Read next line">
                  <div class="vo-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Read next line</div>
                  <div class="vo-hint"><b>Earpiece · <span class="vo-ta">தமிழ்</span></b><span>Voice on this phone, works offline</span></div>
                </div>
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Tick yoghurt 80 g</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Load sheet in reverse stop order (kept). <b>Tick →</b> <span class="lx-nw">LD-10</span>; <b>yoghurt flag icon →</b> <span class="lx-nw">LD-03</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-10</span>Scan a line · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-10 Scan a line · phone">
            <div class="m-screen">
              <div class="lx-camscreen">
              <div class="statusbar" style="color:#FFFFFF;"><span class="mono">3:27</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="9" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn lx-darkbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div>
                <div class="m-nav__title" style="color:#FFFFFF;">Scan · <span class="id">VEH057</span></div>
                <div class="m-iconbtn lx-darkbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
              </div>
              <div class="lx-cam"><svg width="374" height="400" viewBox="0 0 374 400" data-name="Camera view">
  <rect width="374" height="400" fill="#141820"/>
  <rect x="-10" y="20" width="120" height="96" rx="4" fill="#6E5537"/><rect x="116" y="8" width="140" height="108" rx="4" fill="#7A5E3D"/><rect x="262" y="24" width="124" height="92" rx="4" fill="#6A5134"/>
  <rect x="-10" y="122" width="96" height="120" rx="4" fill="#735A3A"/><rect x="92" y="122" width="190" height="136" rx="6" fill="#A07C52"/><rect x="288" y="122" width="100" height="120" rx="4" fill="#6E5537"/>
  <rect x="-10" y="266" width="130" height="120" rx="4" fill="#6A5134"/><rect x="126" y="266" width="130" height="120" rx="4" fill="#7A5E3D"/><rect x="262" y="266" width="124" height="120" rx="4" fill="#6E5537"/>
  <path d="M92 190 H282" stroke="#8A6A45" stroke-width="3"/>
  <rect x="126" y="146" width="122" height="84" rx="6" fill="#F4F1EA"/>
  <text x="137" y="160" font-size="13" font-weight="700" fill="#141414" font-family="Inter, sans-serif">NOODLES 24</text>
  <rect x="136" y="164" width="3" height="44" fill="#141414"/><rect x="142.39999999999998" y="164" width="2" height="44" fill="#141414"/><rect x="147.79999999999995" y="164" width="3" height="44" fill="#141414"/><rect x="155.19999999999993" y="164" width="1" height="44" fill="#141414"/><rect x="159.5999999999999" y="164" width="3" height="44" fill="#141414"/><rect x="165.9999999999999" y="164" width="2" height="44" fill="#141414"/><rect x="173.39999999999986" y="164" width="1" height="44" fill="#141414"/><rect x="178.79999999999984" y="164" width="1" height="44" fill="#141414"/><rect x="183.19999999999982" y="164" width="3" height="44" fill="#141414"/><rect x="190.5999999999998" y="164" width="1" height="44" fill="#141414"/><rect x="195.99999999999977" y="164" width="1" height="44" fill="#141414"/><rect x="202.39999999999975" y="164" width="1" height="44" fill="#141414"/><rect x="206.79999999999973" y="164" width="2" height="44" fill="#141414"/><rect x="214.1999999999997" y="164" width="1" height="44" fill="#141414"/><rect x="219.59999999999968" y="164" width="1" height="44" fill="#141414"/><rect x="225.99999999999966" y="164" width="2" height="44" fill="#141414"/>
  <text x="137" y="224" font-size="13" font-weight="600" fill="#141414" font-family="JetBrains Mono, monospace">4792034118052</text>
  <path d="M0 0H374V400H0Z M104 132 H270 V246 H104 Z" fill="#000000" fill-opacity=".5" fill-rule="evenodd"/>
  <path d="M104 156 V132 H128 M246 132 H270 V156 M270 222 V246 H246 M128 246 H104 V222" fill="none" stroke="#F5B83D" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112 189 H262" stroke="#F5B83D" stroke-width="2.5" opacity=".9"/>
  <rect x="97" y="286" width="180" height="36" rx="18" fill="#000000" fill-opacity=".55"/>
  <text x="187" y="309" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle" font-family="Inter, sans-serif">Counted 6 labels</text>
</svg></div>
              <div class="lx-sheet">
                <div class="m-eyebrow"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Matched</span><span class="m-sep"></span>Line 21 of 22<span class="m-sep"></span>Stop 1</div>
                <div class="m-h2">Instant noodles, case</div>
                <div class="m-hero__row">
                  <div class="m-hero__value">6<small>of 6 cases</small></div>
                  <span class="m-pill m-pill--ok">Count matches</span>
                </div>
                <span class="cv-hint" style="margin-top:-4px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Read from label · 6 cases · <b>confirm</b></span>
                <div class="m-row__meta"><span class="id">ORD0104216</span><span class="m-sep"></span><span class="m-tag"><span class="dot"></span>Dry</span></div>
                <div class="lx-sheet__acts" style="padding-top:2px;">
                  <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Confirm 6 cases</div>
                  <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>Type the code instead</div>
                </div>
              </div>
              <div class="homebar" style="background:var(--surface);"><div></div></div>
              </div>
            </div>
          </div>
      <p class="lx-cap">Camera reads and counts the case labels; the loader confirms. <b>Confirm 6 cases →</b> <span class="lx-nw">LD-04</span>; <b>Type the code →</b> <span class="lx-nw">LD-11</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-11</span>Type a code · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-11 Type a code · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:27</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="9" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Type the code</div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></svg></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-group lx-code">
                  <span class="m-row__meta">Number under the barcode</span>
                  <div class="lx-code__v">4792 0341 1805 2<span class="lx-caret"></span></div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--ok"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Instant noodles, case</div><div class="m-row__meta">Line 21<span class="m-sep"></span><span class="id">ORD0104216</span><span class="m-sep"></span>Stop 1</div></div></div>
                  <div class="m-row">
                    <div class="m-row__main"><div class="m-row__title">Cases loaded</div><div class="m-row__meta">Expected 6</div></div>
                    <div class="m-stepper"><div class="m-stepper__b">−</div><div class="m-stepper__v">6</div><div class="m-stepper__b">+</div></div>
                  </div>
                </div>
                <div class="lx-keypad"><div class="lx-keyrow"><div class="lx-key" style="height:52px;">1</div><div class="lx-key" style="height:52px;">2</div><div class="lx-key" style="height:52px;">3</div></div><div class="lx-keyrow"><div class="lx-key" style="height:52px;">4</div><div class="lx-key" style="height:52px;">5</div><div class="lx-key" style="height:52px;">6</div></div><div class="lx-keyrow"><div class="lx-key" style="height:52px;">7</div><div class="lx-key" style="height:52px;">8</div><div class="lx-key" style="height:52px;">9</div></div><div class="lx-keyrow"><div class="lx-key lx-key--ghost lx-key--txt" style="height:52px;">Clear</div><div class="lx-key" style="height:52px;">0</div><div class="lx-key lx-key--ghost" style="height:52px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Confirm 6 cases</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Manual fallback when a label won't scan in the cold room. <b>Confirm 6 cases →</b> <span class="lx-nw">LD-04</span>.</p>
    </div>
    </div>
  </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">4</span>Problems</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-03</span>Flag shortfall · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-03 Flag shortfall">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:21</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div>
                <div class="m-nav__title">Flag a problem</div>
                <div style="width:40px; flex-shrink:0;"></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span> <span class="m-sep"></span> <span class="id">ORD0104217</span> <span class="m-sep"></span> Stop 1 · <span class="id">OUT106</span></div>
                  <div class="m-h2">Yoghurt 80 g, case of 24</div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:flex-end;">
                    <div class="ld-col">
                      <span class="m-hero__label">Short</span>
                      <div class="m-hero__value ld-short">2<small>cases</small></div>
                    </div>
                    <div class="ld-col ld-col--end">
                      <span class="m-hero__label">Loaded</span>
                      <div class="m-stepper"><div class="m-stepper__b">−</div><div class="m-stepper__v">4</div><div class="m-stepper__b">+</div></div>
                    </div>
                  </div>
                  <div class="m-hero__meta">Expected 6 · short is calculated for you</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Reason</b><span>one tap</span></div>
                  <div class="m-choices">
                    <div class="m-choice is-on"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Out of stock</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m9 9 6 6M15 9l-6 6"/></svg>Damaged</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg>Wrong item</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>Temperature</div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Add photo</div><div class="m-row__meta">Optional</div></div>
                    <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Dispatch, store and driver see this</b></div>
                  <div class="m-group">
                    <div class="ld-threadwrap">
                      <div class="thread ld-thread">
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38</div></div>
                        <div class="thread__bar is-done"></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40</div></div>
                        <div class="thread__bar is-done"></div>
                        <div class="thread__step is-warn"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01"/></svg></div><div class="thread__label">Loaded −2</div><div class="thread__time">now</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">En route</div><div class="thread__time">3:40</div></div>
                        <div class="thread__bar"></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">·</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Send flag</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Short is calculated, reason is one tap (kept). <b>Send flag →</b> <span class="lx-nw">LD-03 ack</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-03 ack</span>Flag acknowledged · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-03 Flag acknowledged">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:24</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · Bay K2</div>
                <span class="m-pill m-pill--ok">Plan v3</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-banner m-banner--ok">
                  <svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>
                  <div class="m-banner__txt"><b>Acknowledged by Nilanthi (dispatch) 3:24</b><span>Credit raised, follow-up Wed 8 Apr. Store notified and Ruwan's run updated.</span></div>
                </div>
                <div class="m-hero ld-hero-tight">
                  <div class="m-hero__row">
                    <div class="m-hero__value">18<small>of 22 accounted</small></div>
                    <span class="m-pill m-pill--brand">4 to go</span>
                  </div>
                  <div class="m-progress"><div style="width:82%"></div></div>
                  <div class="m-hero__meta">Stop 2 all in · departs 3:40, in 16 min</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>2nd · Stop 1 · Nuwara Eliya</b><span>12 of 16</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--warn">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M5 12h14"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta"><span class="m-pill m-pill--bad" style="height:24px; padding:0 9px;">Short 2</span><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Ack'd 3:24</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">4/6</span><span class="m-row__unit">cases</span></div>
                      <div class="ld-flag ld-flag--on"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Whole chicken 1 kg</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>+5 lines done</div></div>
                      <div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">trays</span></div>
                    </div>
                    <div class="m-row m-row--sel">
                      <div class="m-row__lead ld-box"></div>
                      <div class="m-row__main"><div class="m-row__title">Tea 400 g</div><div class="m-row__meta"><span class="m-tag"><span class="dot"></span>Dry</span><span class="m-sep"></span>carton of 24</div></div>
                      <div class="m-row__trail"><span class="m-row__value">5</span><span class="m-row__unit">ctns</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Tick tea 400 g</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Nilanthi acknowledges at 3:24; loading carries on (kept). <b>Tick tea →</b> <span class="lx-nw">LD-10</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-12</span>Plan changed · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-12 Plan changed · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:52</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div style="width:40px; flex-shrink:0;"></div>
                <div class="m-nav__title"><span class="id">VEH044</span> · Bay K4</div>
                <span class="m-pill m-pill--warn"><span class="dot"></span>Plan v4</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero lx-hero--warn">
                  <div class="m-hero__label" style="color:var(--st-deferred-fg);">Plan changed 3:52 · Nilanthi, dispatch</div>
                  <div class="m-hero__value">2<small>items moved</small></div>
                  <div class="m-hero__meta">Neither is loaded yet, so nothing comes off the truck. Everything else is the same.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>What moved · v3 → v4</b><span>2 of 40 lines</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">New Year sarongs</div><div class="m-row__meta"><s>Middle</s> <svg class="ic" viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg> <b style="color:var(--text);">By the doors</b></div></div>
                      <div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">ctns</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Kids' shoes</div><div class="m-row__meta"><s>Middle</s> <svg class="ic" viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg> <b style="color:var(--text);">By the doors</b></div></div>
                      <div class="m-row__trail"><span class="m-row__value">4</span><span class="m-row__unit">ctns</span></div>
                    </div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Why</span><b>Store wants New Year stock first</b></div>
                  <div class="m-kv"><span>Store</span><b><span class="id">OUT089</span> · mall 10:30–12:30</b></div>
                  <div class="m-kv"><span>Your v3 printout</span><b style="color:var(--st-exception-fg);">Out of date</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Got it, load v4</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">v3 → v4 diff blocks the sheet until acknowledged. <b>Got it →</b> VEH044 sheet (<span class="lx-nw">LD-02</span> layout).</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-13</span>Flags tab · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-13 Flags tab · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:30</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="9" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Flags</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J. · K2</b><span>Switch user</span></div></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero">
                  <div class="m-hero__label">Your flags tonight</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">0<small>open</small></div>
                    <span class="m-pill m-pill--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>1 answered</span>
                  </div>
                  <div class="m-hero__meta">Dispatch answered your 3:21 flag in 3 minutes.</div>
                </div>
                <div class="m-seg"><div class="m-seg__i is-on">Mine</div><div class="m-seg__i">Whole hub</div></div>
                <div class="m-section">
                  <div class="m-section__head"><b>Tonight</b><span>Tue 7 Apr</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--bad"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta"><span class="m-tag m-tag--bad">Short 2</span><span class="m-sep"></span><span class="id">VEH057</span></div></div>
                      <span class="m-pill m-pill--ok">Ack'd 3:24</span>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Earlier this week</b></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead lx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Damaged milk crate</div><div class="m-row__meta"><span class="id">VEH040</span><span class="m-sep"></span>Mon 6 Apr</div></div>
                      <span class="m-tag m-tag--ok"><span class="dot"></span>Closed</span>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead lx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Reefer slow to cool</div><div class="m-row__meta"><span class="id">VEH058</span><span class="m-sep"></span>Sat 4 Apr</div></div>
                      <span class="m-tag m-tag--ok"><span class="dot"></span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Dock</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flags</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Shift</div></div>
              <div class="homebar" style="background:var(--surface);"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Every flag Kasun raised and its answer. <b>Row →</b> <span class="lx-nw">LD-03 ack</span>; <b>tabs →</b> <span class="lx-nw">LD-19</span> / <span class="lx-nw">LD-16</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-14</span>Re-plan received · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-14 Re-plan received · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:49</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH006</span> · Bay P5</div>
                <span class="m-pill m-pill--bad"><span class="dot"></span>Can't depart</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-banner m-banner--ok">
                  <svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>
                  <div class="m-banner__txt"><b>Dispatch re-planned 3:47</b><span>Applied 3:49. All 6 stores already told.</span></div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__label">Peliyagoda · VEH006's chilled orders</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">6<small>of 6 re-homed</small></div>
                    <span class="m-pill m-pill--ok">0 deferred</span>
                  </div>
                  <div class="m-hero__meta">Goods stay in the cold room until each vehicle is at its bay.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Where the goods go</b><span>10.3 m³</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead ld-bay">P2</div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">VEH002</span> · Trip 2 Gampaha</div><div class="m-row__meta"><span class="id">OUT028</span> + <span class="id">OUT034</span><span class="m-sep"></span>5:43</div></div>
                      <div class="m-row__trail"><span class="m-row__value">3.3</span><span class="m-row__unit">m³</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">VEH005</span> · Trip 2 Colombo</div><div class="m-row__meta">3 stores, the whole trip moves</div></div>
                      <div class="m-row__trail"><span class="m-row__value">5.4</span><span class="m-row__unit">m³</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">VEH036</span> · Trip 2 Negombo</div><div class="m-row__meta"><span class="id">OUT031</span><span class="m-sep"></span>arrives ~7:20</div></div>
                      <div class="m-row__trail"><span class="m-row__value">1.6</span><span class="m-row__unit">m³</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Got it, back to the dock</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">After <span class="lx-nw">LD-B1</span> (degradation B, Peliyagoda Bay P5): where the failed reefer's goods go. <b>Got it →</b> <span class="lx-nw">LD-01</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flowrow">
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">5</span>Release & handover</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-04</span>Release vehicle · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-04 Release vehicle">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:34</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="9" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Release <span class="id">VEH057</span></div>
                <span class="m-pill m-pill--brand"><span class="dot"></span>Loaded</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Departs 3:40 · in 6 min</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">5<small>of 5 checks</small></div>
                    <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Ready to release</span>
                  </div>
                  <div class="m-hero__meta">Run, dock notice and seal number go to Ruwan's phone the moment you release.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Release checklist</b><span>all passed</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">All 22 lines accounted</div><div class="m-row__meta">21 loaded · 1 short, ack'd 3:24</div></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Loaded in stop order</div><div class="m-row__meta">Stop 2 at the front · Stop 1 by the doors</div></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Reefer checked</div><div class="m-row__meta">Needs ≤ 4 °C · read 3:32</div></div>
                      <div class="m-row__trail"><span class="m-row__value" style="color:var(--chilled-fg);">3 °C</span><span class="m-row__unit" style="font-size:13px;">passes</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Doors sealed</div><div class="m-row__meta"><span class="ld-seal"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>KDY-57-10413</span><span class="cv-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Read from seal photo · matches</span></div></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--star" style="font-size:14px;">RB</div>
                      <div class="m-row__main"><div class="m-row__title">Hand over to Ruwan Bandara</div><div class="m-row__meta">Driver · reefer van <span class="id">VEH057</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Release VEH057 to driver</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">All 5 checks passed, seal number read from a photo and matched. <b>Release →</b> <span class="lx-nw">LD-15</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-15</span>Handover confirmed · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-15 Handover confirmed · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div style="width:40px; flex-shrink:0;"></div>
                <div class="m-nav__title">Bay K2</div>
                <span class="m-pill m-pill--info"><span class="dot"></span>En route</span>
              </div>
              <div class="m-body ld-tight">
                <div class="lx-done">
                  <div class="lx-bigok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg></div>
                  <div class="m-h1">Ruwan has the run</div>
                  <div class="m-sub">Accepted on his phone at 3:40. <span class="id">VEH057</span> is on the road to Nuwara Eliya.</div>
                </div>
                <div class="m-group">
                  <div class="ld-threadwrap"><div class="thread ld-thread"><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38</div></div><div class="thread__bar is-done"></div><div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40</div></div><div class="thread__bar is-done"></div><div class="thread__step is-warn"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01"/></svg></div><div class="thread__label">Loaded −2</div><div class="thread__time">3:34</div></div><div class="thread__bar is-done"></div><div class="thread__step is-now"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div><div class="thread__label">En route</div><div class="thread__time">now</div></div><div class="thread__bar"></div><div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">ETA ~6:35</div></div></div></div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Seal</span><span class="ld-seal"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>KDY-57-10413</span></div>
                  <div class="m-kv"><span>Lines</span><b>21 loaded · 1 short, ack'd</b></div>
                  <div class="m-kv"><span>Reefer at release</span><b style="color:var(--chilled-fg);">3 °C</b></div>
                  <div class="m-kv"><span>First stop</span><b><span class="id">OUT106</span> · ETA ~6:35 (plan 5:31)</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Back to the dock</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Ruwan accepts the run on his phone at 3:40. <b>Back to the dock →</b> <span class="lx-nw">LD-19</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">6</span>Shift</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-16</span>Shift summary · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-16 Shift summary · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">9:30</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="5" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Shift</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J. · K2</b><span>Team lead</span></div></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Tue 7 Apr · 01:30–09:30 · Kandy Hub</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">3<small>released</small></div>
                    <span class="m-pill" style="background:rgba(255,255,255,.14); color:#FFFFFF;"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>All on time</span>
                  </div>
                  <div class="m-hero__meta"><span class="id">VEH044</span> handed to the day team at 36 of 40 lines. It departs 10:05.</div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><span class="m-stat__v">141</span><span class="m-stat__l">lines loaded</span></div>
                  <div class="m-stat"><span class="m-stat__v">1</span><span class="m-stat__l">flag raised</span></div>
                  <div class="m-stat"><span class="m-stat__v">0</span><span class="m-stat__l">left open</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Released tonight</b><span>departure</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead ld-bay">K1</div><div class="m-row__main"><div class="m-row__title"><span class="id">VEH039</span> · Kandy</div><div class="m-row__meta">46 of 46 lines</div></div><div class="m-row__trail"><span class="m-row__value">3:30</span><span class="m-row__unit">on time</span></div></div>
                    <div class="m-row"><div class="m-row__lead ld-bay" style="background:var(--brand-900); color:var(--star-400);">K2</div><div class="m-row__main"><div class="m-row__title"><span class="id">VEH057</span> · Nuwara Eliya</div><div class="m-row__meta">21 of 22 · 1 short, ack'd</div></div><div class="m-row__trail"><span class="m-row__value">3:40</span><span class="m-row__unit">on time</span></div></div>
                    <div class="m-row"><div class="m-row__lead ld-bay">K3</div><div class="m-row__main"><div class="m-row__title"><span class="id">VEH040</span> · Matale</div><div class="m-row__meta">38 of 38 lines</div></div><div class="m-row__trail"><span class="m-row__value">3:50</span><span class="m-row__unit">on time</span></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Sign out</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Dock</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flags</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Shift</div></div>
              <div class="homebar" style="background:var(--surface);"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Shift tab at 9:30: released, flags, lines, then out. <b>Sign out →</b> <span class="lx-nw">LD-06</span>.</p>
    </div>
    </div>
  </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">7</span>States</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-17</span>Offline dock Wi-Fi · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-17 Offline dock Wi-Fi · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:15</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · departs 3:40</div>
                <span class="m-pill m-pill--offline">Offline</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>
                  <div class="m-banner__txt"><b>Dock Wi-Fi lost 3:14</b><span>Keep loading. Ticks save on this phone and send when Wi-Fi is back.</span></div>
                </div>
                <div class="m-hero lx-hero--off">
                  <div class="m-hero__row">
                    <div class="m-hero__value">16<small>of 22 lines</small></div>
                    <span class="m-pill m-pill--offline">2 to send</span>
                  </div>
                  <div class="m-progress"><div style="width:73%; background:#78716C;"></div></div>
                  <div class="m-hero__meta">Flags still reach dispatch by SMS while Wi-Fi is down.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Saved on this phone · 2</b><span>not sent yet</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead lx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg></div><div class="m-row__main"><div class="m-row__title">Whole chicken 1 kg</div><div class="m-row__meta">6 trays<span class="m-sep"></span>ticked 3:14</div></div><span class="m-tag lx-tag--off"><span class="dot"></span>Waiting</span></div>
                    <div class="m-row"><div class="m-row__lead lx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg></div><div class="m-row__main"><div class="m-row__title">Wheat flour 1 kg</div><div class="m-row__meta">4 bales<span class="m-sep"></span>ticked 3:15</div></div><span class="m-tag lx-tag--off"><span class="dot"></span>Waiting</span></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Next</b><span>Stop 1 · dry</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--sel"><div class="m-row__lead ld-box"></div><div class="m-row__main"><div class="m-row__title">Coconut oil</div><div class="m-row__meta"><span class="m-tag"><span class="dot"></span>Dry</span><span class="m-sep"></span>66 kg</div></div><div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">cases</span></div><div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Tick coconut oil</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Wi-Fi drops mid-load: ticks save on the phone, shown dashed. <b>Wi-Fi back →</b> <span class="lx-nw">LD-02</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-18</span>Plan locked · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-18 Plan locked · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:51</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH044</span> · Bay K4</div>
                <span class="m-pill">Plan v3</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero">
                  <div class="lx-herohead"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><span class="m-hero__label">Sheet locked 3:51</span></div>
                  <div class="m-h2">Plan is being changed</div>
                  <div class="m-hero__meta">Nilanthi is editing <span class="id">VEH044</span>. The new version lands here the moment she publishes, usually within 5 minutes.</div>
                </div>
                <div class="m-banner m-banner--info">
                  <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <div class="m-banner__txt"><b>Nothing to undo</b><span>Leave what's on the truck. New ticks wait for the new version.</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Style · Kandy · next up</b><span>12 of 40 loaded</span></div>
                  <div class="m-group">
                    <div class="m-row lx-row--locked"><div class="m-row__lead lx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div class="m-row__main"><div class="m-row__title">New Year sarongs</div><div class="m-row__meta">carton of 20<span class="m-sep"></span>middle</div></div><div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">ctns</span></div></div>
                    <div class="m-row lx-row--locked"><div class="m-row__lead lx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div class="m-row__main"><div class="m-row__title">Kids' shoes</div><div class="m-row__meta">carton of 12<span class="m-sep"></span>middle</div></div><div class="m-row__trail"><span class="m-row__value">4</span><span class="m-row__unit">ctns</span></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn ld-locked"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Waiting for the new plan</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Dispatch is editing VEH044: sheet locked with a reason. <b>v4 published →</b> <span class="lx-nw">LD-12</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-19</span>Empty queue · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-19 Empty queue · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:50</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Kandy Hub</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J. · K2</b><span>Switch user</span></div></div>
              </div>
              <div class="m-body ld-tight">
                <div class="m-banner m-banner--ok">
                  <svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>
                  <div class="m-banner__txt"><b>Plan v3 · you're on the latest</b><span>Published 6:40 PM Mon by dispatch</span></div>
                </div>
                <div class="lx-empty">
                  <svg width="240" height="132" viewBox="0 0 240 132" data-name="Empty bay illustration">
  <circle cx="120" cy="64" r="60" fill="#E6E9F8"/>
  <rect x="62" y="34" width="116" height="68" rx="12" fill="#FFFFFF" stroke="#8F98AA" stroke-width="2" stroke-dasharray="7 6"/>
  <text x="120" y="76" font-size="22" font-weight="800" text-anchor="middle" fill="#8F98AA" font-family="Plus Jakarta Sans, Inter, sans-serif">K2</text>
  <path d="M184 14 L187.6 26.4 L200 30 L187.6 33.6 L184 46 L180.4 33.6 L168 30 L180.4 26.4 Z" fill="#F5B83D"/>
  <path d="M28 126 H212" stroke="#C9CFDB" stroke-width="3" stroke-linecap="round" stroke-dasharray="12 9"/>
</svg>
                  <div class="m-h2">Your queue is empty</div>
                  <div class="m-sub">All 3 Fresh vehicles left on time. Nothing else is planned for Bay K2 tonight.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Still on the dock · 1</b><span>other bays</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead ld-bay">K4</div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">VEH044</span> · Style</div><div class="m-row__meta"><span class="m-tag m-tag--warn"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Mall 10:30–12:30</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">10:05</span><span class="m-row__unit">30% loaded</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg>Help load VEH044 at K4</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Dock</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flags</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Shift</div></div>
              <div class="homebar" style="background:var(--surface);"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">All Fresh vehicles out, Bay K2 clear. <b>Help load VEH044 →</b> <span class="lx-nw">LD-18</span>; <b>tabs →</b> <span class="lx-nw">LD-13</span> / <span class="lx-nw">LD-16</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">8</span>Access &amp; system states</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-24</span>Can't sign in · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-24 Can't sign in · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Can't sign in</div>
                <span class="m-pill m-pill--brand">Kandy Hub</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Staff ID <span class="id">KDY-0427</span> · no email needed</div>
                  <div class="m-h1">Get back in</div>
                </div>
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Quickest way</div>
                  <div class="m-h2" style="color:#FFFFFF;">Ask your shift lead for a <span class="lx-nw">one-time PIN</span></div>
                  <div class="m-hero__meta">They make it on the Kandy Hub office screen. It works once, for tonight's shift, then you set a new PIN.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Other ways</b><span>if the lead is away</span></div>
                  <div class="m-group">
                    <div class="m-row la-bigrow"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="m-row__main"><div class="m-row__title">Send the code again</div><div class="m-row__meta">SMS to 077 ••• ••27</div></div><svg class="ic la-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                    <div class="m-row la-bigrow"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><div class="m-row__main"><div class="m-row__title">Call the depot lead</div><div class="m-row__meta">Kandy Hub office · open all night</div></div><svg class="ic la-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
                  </div>
                </div>
                <div class="la-note"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg><span>Your ticks and flags stay saved while you're signed out.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>Enter one-time PIN</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">No email needed: a one-time PIN from the shift lead, big rows for SMS or a call. <b>Enter one-time PIN →</b> <span class="lx-nw">LD-06</span>; <b>Call the depot lead</b> dials the hub office.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-25</span>Signed out at shift end · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-25 Signed out at shift end · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">9:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="5" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Lodestar Dock</div>
                <span class="m-pill">Signed out</span>
              </div>
              <div class="m-body ld-tight">
                <div class="lx-done">
                  <div class="lx-bigok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg></div>
                  <div class="m-eyebrow">Shift ended 9:30 · signed out 9:31</div>
                  <div class="m-h2">Nothing lost</div>
                  <div class="m-sub">Everything from your night shift is saved at Kandy Hub. Safe to hand the phone on.</div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><span class="m-stat__v">3</span><span class="m-stat__l">released</span></div>
                  <div class="m-stat"><span class="m-stat__v">1</span><span class="m-stat__l">flag raised</span></div>
                  <div class="m-stat"><span class="m-stat__v">0</span><span class="m-stat__l">left unsent</span></div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Handed to day team</span><b><span class="id">VEH044</span> · 36 of 40</b></div>
                  <div class="m-kv"><span>Flag</span><b>Yoghurt short 2 · answered</b></div>
                  <div class="m-kv"><span>Lines loaded</span><b>141</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Sign in for a new shift<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Auto sign-out at 9:30 on a shared phone, with proof nothing was lost. <b>Sign in for a new shift →</b> <span class="lx-nw">LD-06</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-26</span>Update required · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-26 Update required · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:05</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · departs 3:40</div>
                <span class="m-pill">13 of 22</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-hero">
                  <div class="lx-herohead"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg></div><span class="m-hero__label">Update ready · Lodestar Dock 2.5</span></div>
                  <div class="m-h2">Finish releasing VEH057 first, update after</div>
                  <div class="m-hero__meta">You're mid-load, so nothing stops now. The update is needed before your next shift and takes about 2 minutes.</div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>What's new</span><b>Faster cold-room scanning</b></div>
                  <div class="m-kv"><span>Your ticks</span><b>Saved, nothing lost</b></div>
                  <div class="m-kv"><span>If you update now</span><b>Sheet pauses 2 min</b></div>
                  <div class="m-kv"><span>Needed by</span><b>Start of next shift</b></div>
                </div>
                <div class="la-note"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span>We'll remind you after you release <span class="id">VEH057</span>.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Keep loading VEH057</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>Update now</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">The update never interrupts a live load. <b>Keep loading VEH057 →</b> <span class="lx-nw">LD-02</span>; <b>Update now →</b> <span class="lx-nw">LD-05</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">9</span>Voice read-aloud</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-28</span>Voice and language · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-28 Voice and language · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:31</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Voice</div>
                <span class="m-pill m-pill--ok">Works offline</span>
              </div>
              <div class="m-body ld-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Settings · Kasun J. · this phone</div>
                  <div class="m-h1">Read aloud</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Language of the voice</b><span>screen text stays</span></div>
                  <div class="lx-bays">
                    <div class="lx-bay vo-lang"><b>English</b><span class="id">EN</span></div>
                    <div class="lx-bay vo-lang"><b class="vo-si">සිංහල</b><span class="id">SI</span></div>
                    <div class="lx-bay vo-lang is-on"><b class="vo-ta">தமிழ்</b><span class="id">TA</span></div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Read next line</div><div class="m-row__meta">Speaks the highlighted line</div></div>
                    <div class="lx-toggle"><span></span></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Earpiece</div><div class="m-row__meta"><span class="m-tag m-tag--ok"><span class="dot"></span>Connected</span><span class="m-sep"></span>voice goes only here</div></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Speed</div><div class="m-row__meta">Slower is clearer</div></div>
                    <div class="vo-seg"><span>Slow</span><span class="is-on">Normal</span></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title"><span class="vo-ta">தமிழ்</span> voice pack</div><div class="m-row__meta">On this phone<span class="m-sep"></span>works offline</div></div>
                    <div class="m-row__trail"><span class="m-row__value">48</span><span class="m-row__unit">MB</span></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar vo-ab">
                <div class="vo-bar" data-name="Play test line">
                  <div class="vo-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Test line</div>
                  <div class="vo-hint"><b class="vo-ta">இந்தக் குரல் தெளிவாகக் கேட்கிறதா?</b><span>"Can you hear this clearly?"</span></div>
                </div>
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Done</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">Voice language (EN, SI, TA), earpiece, speed and a test line; the voice pack lives on the phone. <b>Done →</b> <span class="lx-nw">LD-02</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-29</span>Voice pack downloading · phone</div>
<div class="frame frame--phone mode-loader lx-new" data-name="LD-29 Voice pack downloading · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">1:30</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
                <div class="m-nav__title" style="text-align:left;">Kandy Hub</div>
                <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J. · K2</b><span>Team lead</span></div></div>
              </div>
              <div class="m-body ld-tight vo-tight">
                <div class="m-title">
                  <div class="m-eyebrow">Start of shift · on dock Wi-Fi</div>
                  <div class="m-h1">Downloading voice</div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__label"><span class="vo-ta">தமிழ்</span> voice pack · downloads once</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">30<small>of 48 MB</small></div>
                    <span class="m-pill m-pill--brand">62% · about 1 min</span>
                  </div>
                  <div class="m-progress"><div style="width:62%"></div></div>
                </div>
                <div class="m-banner m-banner--info">
                  <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <div class="m-banner__txt"><b>Loading works without it</b><span>Text is always shown. The pack stays on this phone and speaks with no network.</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Voices on this phone</b><span>1 of 3 ready</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">English</div><div class="m-row__meta">Ready<span class="m-sep"></span>works offline</div></div></div>
                    <div class="m-row m-row--sel"><div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg></div><div class="m-row__main"><div class="m-row__title"><span class="vo-ta">தமிழ்</span> · Tamil</div><div class="m-row__meta">Downloading on dock Wi-Fi</div></div><div class="m-row__trail"><span class="m-row__value">62%</span></div></div>
                    <div class="m-row"><div class="m-row__lead lx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg></div><div class="m-row__main"><div class="m-row__title"><span class="vo-si">සිංහල</span> · Sinhala</div><div class="m-row__meta">Not downloaded<span class="m-sep"></span>add in Voice</div></div></div>
                  </div>
                </div>
                <div class="vo-btn vo-btn--off" data-name="Read aloud unavailable"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Voice not downloaded, text still works</div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Continue, it finishes by itself</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">After <b>Start shift</b> on dock Wi-Fi when a voice pack is missing; the dashed control shows the voice is not ready yet. <b>Continue →</b> <span class="lx-nw">LD-08</span>.</p>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-30</span>Load sheet speaking · phone</div>
<div class="frame frame--phone mode-loader" data-name="LD-30 Load sheet speaking · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:11</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title"><span class="id">VEH057</span> · departs 3:40</div>
                <span class="m-pill m-pill--ok">Plan v3</span>
              </div>
              <div class="m-body ld-tight ld-tight-b vo-tight">
                <div class="m-hero ld-hero-tight" style="padding-top:12px; padding-bottom:12px;">
                  <div class="m-hero__row">
                    <div class="m-hero__value">14<small>of 22 lines</small></div>
                    <span class="m-pill m-pill--brand">8 to go · 30 min</span>
                  </div>
                  <div class="m-progress"><div style="width:64%"></div></div>
                  <div class="ld-van" style="padding-top:2px;">
                    <svg width="302" height="96" viewBox="0 0 302 96" font-family="Inter, sans-serif">
                    <rect x="0" y="22" width="26" height="52" rx="9" fill="#C9CFDB"/><rect x="5" y="30" width="9" height="36" rx="3" fill="#8F98AA"/>
                    <rect x="30" y="1" width="262" height="94" rx="12" fill="#FFFFFF" stroke="#C9CFDB" stroke-width="1.5"/>
                    <path d="M31 13 a11 11 0 0 1 11 -11 H280 a11 11 0 0 1 11 11 V47 H31 Z" fill="#DDF4F9"/>
                    <path d="M31 49 H291 V83 a11 11 0 0 1 -11 11 H42 a11 11 0 0 1 -11 -11 Z" fill="#F1EFEC"/>
                    <rect x="36" y="6" width="92" height="37" rx="8" fill="#E3F6EC" stroke="#10B981" stroke-width="1.5"/>
                    <text x="44" y="21" font-size="13" font-weight="800" fill="#065F46">1st · Stop 2</text><text x="44" y="37" font-size="13" font-weight="600" fill="#065F46">1.1 m³ ✓</text>
                    <rect x="132" y="6" width="120" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="140" y="21" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="140" y="37" font-size="13" font-weight="600" fill="#7A4B00">chilled 1.3 m³</text>
                    <rect x="36" y="53" width="64" height="37" rx="8" fill="none" stroke="#A6AEBD" stroke-width="1.5" stroke-dasharray="4 3"/>
                    <text x="68" y="76" font-size="13" font-weight="600" fill="#6B7385" text-anchor="middle">free</text>
                    <rect x="104" y="53" width="148" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="112" y="68" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="112" y="84" font-size="13" font-weight="600" fill="#7A4B00">dry 2.2 m³</text>
                    <text x="272" y="30" font-size="13" font-weight="800" fill="#0E7490" text-anchor="middle">3°</text>
                    <rect x="293" y="6" width="7" height="38" rx="3" fill="#344054"/><rect x="293" y="52" width="7" height="38" rx="3" fill="#344054"/>
                  </svg>
                    <div class="ld-van__legend">Cab left, rear doors right <span class="m-sep"></span> <span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>top zone 3 °C</span></div>
                  </div>
                  <div class="m-hero__meta">Weight <b>988 / 1,040 kg</b> (95%, the tight one) · Volume <b>4.6 / 7.0 m³</b></div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--ok">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">1st · Stop 2 · Hawa Eliya</div><div class="m-row__meta"><span class="id">OUT108</span><span class="m-sep"></span>all in the front zone</div></div>
                    <div class="m-row__trail"><span class="m-row__value">6/6</span><span class="m-row__unit">lines</span></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>2nd · Stop 1 · Nuwara Eliya</b><span>8 of 16</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--sel" style="padding-top:8px; padding-bottom:8px;"><div class="m-row__lead ld-box"></div><div class="m-row__main"><div class="m-row__title">Yoghurt 80 g</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>×24</div></div><div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">cases</span></div><div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar vo-ab">
                <div class="vo-cap" data-name="Spoken caption"><span class="vo-lvl"><span style="height:6px;"></span><span style="height:12px;"></span><span style="height:9px;"></span></span><div class="vo-cap__ta">அடுத்தது: யோகட் 80 g, 6 பெட்டிகள், நிறுத்தம் 1, OUT106. மேல் குளிர் பகுதி, கதவருகில்.</div></div>
                <div class="vo-bar" data-name="Read next line · speaking">
                  <div class="vo-btn vo-btn--on"><svg class="ic" viewBox="0 0 24 24"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg><span>Speaking · <span class="vo-ta">தமிழ்</span></span><span class="vo-lvl"><span style="height:8px;"></span><span style="height:18px;"></span><span style="height:12px;"></span></span></div>
                  <div class="vo-hint"><b>Tap to pause</b><span>Earpiece, offline</span></div>
                </div>
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Tick yoghurt 80 g</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
      <p class="lx-cap">LD-02 scrolled to the next line, spoken in Tamil into the earpiece with a caption: "Next: yoghurt 80 g, 6 cases, stop 1, OUT106. Top chilled zone, by the door." <b>Tick →</b> <span class="lx-nw">LD-10</span>; <b>pause →</b> <span class="lx-nw">LD-02</span>.</p>
    </div>
    </div>
  </div>
  </section>
  <section class="lx-plat" data-name="Tablet screens">
    <div class="lx-plat__head"><span class="lx-plat__k">Tablet · 1024 × 768 landscape</span><h3>Shared rugged terminal at the bay</h3><p>Mounted at Bay K2, used by the whole dock team with gloves on. Anyone signs in by name tile and PIN; everything reads from 2 m.</p></div>
  <div class="lx-flowrow">
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">1</span>Entry</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-20</span>Shared sign in · tablet</div>
<div class="frame frame--tablet mode-loader lx-new" data-name="LD-20 Shared sign in · tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">1:32</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="lx-tsign">
              <div class="lx-tsign__brand">
                <div class="lx-tsign__logo"><svg viewBox="0 0 32 32" style="width:44px; height:44px;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg><div class="vstack" style="gap:2px;"><b>Lodestar Dock</b><span>Bay K2 terminal · Kandy Hub</span></div></div>
                <div class="spacer"></div>
                <div class="lx-tsign__clock">1:32</div>
                <div class="lx-tsign__date">Tue 7 Apr<br>Night shift 01:30–09:30</div>
                <div class="lx-tsign__next"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg>First out: <span class="id">VEH039</span> at 3:30</div>
                <div class="spacer"></div>
                <div class="lx-tsign__foot"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg>Shared terminal. Sign out when you leave the bay.</div>
              </div>
              <div class="lx-tsign__main">
                <div class="m-title" style="padding:0;">
                  <div class="m-eyebrow">Tap your name, then your PIN</div>
                  <div class="m-h1">Who's loading at K2?</div>
                </div>
                <div class="lx-tsign__cols">
                  <div class="lx-names">
                    <div class="lx-name is-on"><div class="lx-name__av">KJ</div><b>Kasun J.</b><span>Team lead</span></div>
                    <div class="lx-name"><div class="lx-name__av">TS</div><b>Tharindu S.</b><span>Loader</span></div>
                    <div class="lx-name"><div class="lx-name__av">DF</div><b>Dilshan F.</b><span>Loader</span></div>
                    <div class="lx-name"><div class="lx-name__av">RM</div><b>Rinas M.</b><span>Loader</span></div>
                    <div class="lx-name"><div class="lx-name__av">SK</div><b>Sanjeewa K.</b><span>Checker</span></div>
                    <div class="lx-name"><div class="lx-name__av">CH</div><b>Chamari H.</b><span>Checker</span></div>
                  </div>
                  <div class="lx-pinpad">
                    <div class="lx-pinpad__head"><span>PIN for <b>Kasun J.</b></span><div class="lx-pin"><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span><span class="lx-pin__d is-on"></span></div></div>
                    <div class="lx-keypad lx-keypad--t"><div class="lx-keyrow"><div class="lx-key" style="height:76px;">1</div><div class="lx-key" style="height:76px;">2</div><div class="lx-key" style="height:76px;">3</div></div><div class="lx-keyrow"><div class="lx-key" style="height:76px;">4</div><div class="lx-key" style="height:76px;">5</div><div class="lx-key" style="height:76px;">6</div></div><div class="lx-keyrow"><div class="lx-key" style="height:76px;">7</div><div class="lx-key" style="height:76px;">8</div><div class="lx-key" style="height:76px;">9</div></div><div class="lx-keyrow"><div class="lx-key lx-key--ghost lx-key--txt" style="height:76px;">Clear</div><div class="lx-key" style="height:76px;">0</div><div class="lx-key lx-key--ghost" style="height:76px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div></div>
                    <div class="m-btn">Sign in to Bay K2<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <p class="lx-cap lx-cap--wide">Name tiles and a big PIN pad for the shared terminal. <b>Sign in →</b> <span class="lx-nw">LD-21</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">2</span>Before loading</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-21</span>Bay overview · tablet</div>
<div class="frame frame--tablet mode-loader lx-new" data-name="LD-21 Bay overview · tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">3:22</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="ld-tnav">
              <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
              <div class="ld-tmeta"><span>Kandy Hub · Tue 7 Apr · night shift</span><b>Bay overview</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Next out</span><b style="color:var(--brand-600);"><span class="id">VEH039</span> · in 8 min</b></div>
              <div class="spacer"></div>
              <span class="m-pill m-pill--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Plan v3</span>
              <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J.</b><span>Switch user</span></div></div>
            </div>
            <div class="ld-tbody lx-tbody--col">
              <div class="m-hero m-hero--brand lx-thero">
                <div class="vstack" style="gap:6px; flex:1; min-width:0;">
                  <div class="m-hero__label">Kandy Hub right now</div>
                  <div class="m-hero__value">4<small>of 4 bays on time</small></div>
                </div>
                <div class="lx-thero__side">
                  <span class="m-pill m-pill--bad"><span class="dot"></span>1 flag waiting</span>
                  <div class="m-hero__meta">K2 · yoghurt 80 g short 2, sent 3:21</div>
                </div>
              </div>
              <div class="lx-baycards">
                <div class="lx-baycard">
                  <div class="lx-baycard__head"><div class="m-row__lead ld-bay">K1</div><div class="vstack" style="gap:1px; min-width:0;"><b class="lx-baycard__veh"><span class="id">VEH039</span></b><span class="lx-baycard__dest">Fresh · Kandy</span></div></div>
                  <div class="lx-baycard__meta"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer truck</span></div>
                  <div class="vstack" style="gap:0;"><span class="lx-baycard__time">3:30</span><span class="lx-baycard__sub">departs in 8 min</span></div>
                  <div class="vstack" style="gap:8px;"><div class="m-progress m-progress--ok"><div style="width:100%"></div></div><span class="lx-baycard__sub"><b>100%</b> · 46 of 46 lines</span></div>
                  <div class="lx-baycard__flag"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>No flags</span></div>
                  <div class="spacer"></div>
                  <span class="m-pill m-pill--ok"><span class="dot"></span>Ready to release</span>
                </div>
                <div class="lx-baycard is-mine">
                  <div class="lx-baycard__head"><div class="m-row__lead ld-bay" style="background:var(--brand-900); color:var(--star-400);">K2</div><div class="vstack" style="gap:1px; min-width:0;"><b class="lx-baycard__veh"><span class="id">VEH057</span></b><span class="lx-baycard__dest">Fresh · Nuwara Eliya</span></div></div>
                  <div class="lx-baycard__meta"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer van</span></div>
                  <div class="vstack" style="gap:0;"><span class="lx-baycard__time">3:40</span><span class="lx-baycard__sub">departs in 18 min</span></div>
                  <div class="vstack" style="gap:8px;"><div class="m-progress"><div style="width:77%"></div></div><span class="lx-baycard__sub"><b>77%</b> · 17 of 22 lines</span></div>
                  <div class="lx-baycard__flag"><span class="m-tag m-tag--bad"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>1 flag · waiting</span></div>
                  <div class="spacer"></div>
                  <span class="m-pill m-pill--brand"><span class="dot"></span>Loading · your bay</span>
                </div>
                <div class="lx-baycard">
                  <div class="lx-baycard__head"><div class="m-row__lead ld-bay">K3</div><div class="vstack" style="gap:1px; min-width:0;"><b class="lx-baycard__veh"><span class="id">VEH040</span></b><span class="lx-baycard__dest">Fresh · Matale</span></div></div>
                  <div class="lx-baycard__meta"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer truck</span></div>
                  <div class="vstack" style="gap:0;"><span class="lx-baycard__time">3:50</span><span class="lx-baycard__sub">departs in 28 min</span></div>
                  <div class="vstack" style="gap:8px;"><div class="m-progress"><div style="width:68%"></div></div><span class="lx-baycard__sub"><b>68%</b> · 26 of 38 lines</span></div>
                  <div class="lx-baycard__flag"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>No flags</span></div>
                  <div class="spacer"></div>
                  <span class="m-pill m-pill--brand"><span class="dot"></span>Loading</span>
                </div>
                <div class="lx-baycard">
                  <div class="lx-baycard__head"><div class="m-row__lead ld-bay">K4</div><div class="vstack" style="gap:1px; min-width:0;"><b class="lx-baycard__veh"><span class="id">VEH044</span></b><span class="lx-baycard__dest">Style · Kandy</span></div></div>
                  <div class="lx-baycard__meta"><span class="m-tag m-tag--warn"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Mall 10:30–12:30</span></div>
                  <div class="vstack" style="gap:0;"><span class="lx-baycard__time">10:05</span><span class="lx-baycard__sub">departs · loads now</span></div>
                  <div class="vstack" style="gap:8px;"><div class="m-progress"><div style="width:13%"></div></div><span class="lx-baycard__sub"><b>13%</b> · 5 of 40 lines</span></div>
                  <div class="lx-baycard__flag"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>No flags</span></div>
                  <div class="spacer"></div>
                  <span class="m-pill"><span class="dot"></span>Dry truck</span>
                </div>
              </div>
            </div>
            <div class="ld-tfoot">
              <span class="lx-tnote"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Tap any bay to open its load sheet. Your bay is outlined.</span>
              <div class="spacer"></div>
              <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flags · 1 waiting</div>
              <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Open Bay K2</div>
            </div>
          </div>
        </div>
      <p class="lx-cap lx-cap--wide">All 4 bays: vehicle, departure, % loaded, flags. <b>Open Bay K2 →</b> <span class="lx-nw">LD-02 tablet</span>; <b>Flags →</b> <span class="lx-nw">LD-13</span>.</p>
    </div>
    </div>
  </div>
  </div>
  <div class="lx-flowrow">
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">3</span>Loading</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-02</span>Load sheet · tablet</div>
<div class="frame frame--tablet mode-loader" data-name="LD-02 Load sheet · Tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">3:10</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="ld-tnav">
              <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
              <div class="ld-tmeta"><span>Bay K2 · Trip 1 · Fresh · Nuwara Eliya</span><b><span class="id">VEH057</span> · Reefer van</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Departs 3:40</span><b style="color:var(--brand-600);">in 30 min</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Driver</span><b>Ruwan Bandara</b></div>
              <div class="spacer"></div>
              <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Plan v3</span>
              <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J.</b><span>Switch user</span></div></div>
            </div>
            <div class="ld-tbody">
              <div class="ld-tleft">
                <div class="m-hero ld-hero-tight">
                  <div class="m-hero__label">Load in this order: last stop goes in first</div>
                  <div class="m-h2">Load stop 2 first</div>
                  <div class="ld-van" style="padding-top:6px;">
                    <svg width="368" height="117" viewBox="0 0 302 96" font-family="Inter, sans-serif">
                    <rect x="0" y="22" width="26" height="52" rx="9" fill="#C9CFDB"/><rect x="5" y="30" width="9" height="36" rx="3" fill="#8F98AA"/>
                    <rect x="30" y="1" width="262" height="94" rx="12" fill="#FFFFFF" stroke="#C9CFDB" stroke-width="1.5"/>
                    <path d="M31 13 a11 11 0 0 1 11 -11 H280 a11 11 0 0 1 11 11 V47 H31 Z" fill="#DDF4F9"/>
                    <path d="M31 49 H291 V83 a11 11 0 0 1 -11 11 H42 a11 11 0 0 1 -11 -11 Z" fill="#F1EFEC"/>
                    <rect x="36" y="6" width="92" height="37" rx="8" fill="#E3F6EC" stroke="#10B981" stroke-width="1.5"/>
                    <text x="44" y="21" font-size="13" font-weight="800" fill="#065F46">1st · Stop 2</text><text x="44" y="37" font-size="13" font-weight="600" fill="#065F46">1.1 m³ ✓</text>
                    <rect x="132" y="6" width="120" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="140" y="21" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="140" y="37" font-size="13" font-weight="600" fill="#7A4B00">chilled 1.3 m³</text>
                    <rect x="36" y="53" width="64" height="37" rx="8" fill="none" stroke="#A6AEBD" stroke-width="1.5" stroke-dasharray="4 3"/>
                    <text x="68" y="76" font-size="13" font-weight="600" fill="#6B7385" text-anchor="middle">free</text>
                    <rect x="104" y="53" width="148" height="37" rx="8" fill="#FFF1D6" stroke="#F5B83D" stroke-width="1.5"/>
                    <text x="112" y="68" font-size="13" font-weight="800" fill="#7A4B00">2nd · Stop 1</text><text x="112" y="84" font-size="13" font-weight="600" fill="#7A4B00">dry 2.2 m³</text>
                    <text x="272" y="30" font-size="13" font-weight="800" fill="#0E7490" text-anchor="middle">3°</text>
                    <rect x="293" y="6" width="7" height="38" rx="3" fill="#344054"/><rect x="293" y="52" width="7" height="38" rx="3" fill="#344054"/>
                  </svg>
                    <div class="ld-van__legend"><span class="m-tag m-tag--ok"><span class="dot"></span>Stop 2 · load 1st</span><span class="m-tag m-tag--warn"><span class="dot"></span>Stop 1 · load 2nd</span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Top zone 3 °C</span></div>
                    <div class="ld-van__legend">Cab on the left, rear doors on the right; bottom zone ambient</div>
                  </div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><span class="m-stat__l">Weight · 95%, binds first</span><span class="m-stat__v">988<span style="font-size:15px; color:var(--text-3);"> / 1,040 kg</span></span><div class="ld-statbar"><div style="width:95%; background:linear-gradient(90deg,#FFD37A,#F5B83D);"></div></div></div>
                  <div class="m-stat"><span class="m-stat__l">Volume · 66%</span><span class="m-stat__v">4.6<span style="font-size:15px; color:var(--text-3);"> / 7.0 m³</span></span><div class="ld-statbar"><div style="width:66%; background:linear-gradient(90deg,#10B981,#047857);"></div></div></div>
                </div>
                <div class="m-group">
                  <div class="ld-flagrow">
                    <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Flag an issue</div>
                    <span class="m-row__meta" style="flex:1;">Goes to dispatch, store and driver in one step</span>
                    <span class="m-pill">0 open</span>
                  </div>
                </div>
              </div>
              <div class="ld-tright">
                <div class="m-group">
                  <div class="m-row m-row--ok">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">1st · Stop 2 · <span class="id">OUT108</span> Hawa Eliya</div><div class="m-row__meta"><span class="id">ORD0104209</span><span class="m-sep"></span>front of van<span class="m-sep"></span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></div></div>
                    <div class="m-row__trail"><span class="m-row__value">6/6</span><span class="m-row__unit">lines</span></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>2nd · Stop 1 · <span class="id">OUT106</span> Nuwara Eliya · chilled <span class="id">ORD0104217</span></b><span>5 of 7</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">5 lines loaded</div><div class="m-row__meta">Fresh milk, sausages, butter, cheese slices, flavoured milk</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                    <div class="m-row m-row--sel">
                      <div class="m-row__lead ld-box"></div>
                      <div class="m-row__main"><div class="m-row__title">Yoghurt 80 g, case of 24</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>Stack on chilled side, rear</div></div>
                      <div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">cases</span></div>
                      <div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead ld-box"></div>
                      <div class="m-row__main"><div class="m-row__title">Whole chicken 1 kg, tray of 10</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span><span class="m-sep"></span>Top of stack, don't load under cases</div></div>
                      <div class="m-row__trail"><span class="m-row__value">6</span><span class="m-row__unit">trays</span></div>
                      <div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>2nd · Stop 1 · ambient <span class="id">ORD0104216</span></b><span>3 of 9</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">3 lines loaded</div><div class="m-row__meta">Samba rice 5 kg, red dhal 1 kg, sugar 1 kg</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead ld-box"></div>
                      <div class="m-row__main"><div class="m-row__title">Wheat flour 1 kg, bale of 20</div><div class="m-row__meta"><span class="m-tag"><span class="dot"></span>Dry</span><span class="m-sep"></span>Heavy, so it goes at the bottom</div></div>
                      <div class="m-row__trail"><span class="m-row__value">4</span><span class="m-row__unit">bales</span></div>
                      <div class="ld-flag"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__main"><div class="m-row__title" style="color:var(--text-2);">5 more ambient lines</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ld-tfoot">
              <div class="ld-tprog">
                <div class="ld-tprog__t"><span><b>14</b> of 22 lines</span><span>8 to go · 30 min left</span></div>
                <div class="m-progress"><div style="width:64%"></div></div>
              </div>
              <div class="spacer"></div>
              <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print v3 backup</div>
              <div class="m-btn ld-locked"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Release · 8 lines left</div>
            </div>
          </div>
        </div>
      <p class="lx-cap lx-cap--wide">Tablet load sheet with the van map (kept). <b>Release</b> unlocks at 22 of 22 <b>→</b> <span class="lx-nw">LD-22</span>.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">4</span>Release & handover</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-22</span>Release checklist · tablet</div>
<div class="frame frame--tablet mode-loader lx-new" data-name="LD-22 Release checklist · tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">3:34</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="ld-tnav">
              <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
              <div class="ld-tmeta"><span>Bay K2 · Trip 1 · Fresh · Nuwara Eliya</span><b><span class="id">VEH057</span> · Reefer van</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Departs 3:40</span><b style="color:var(--brand-600);">in 6 min</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Driver</span><b>Ruwan Bandara</b></div>
              <div class="spacer"></div>
              <span class="m-pill m-pill--brand"><span class="dot"></span>Loaded</span>
              <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J.</b><span>Switch user</span></div></div>
            </div>
            <div class="ld-tbody">
              <div class="ld-tleft">
                <div class="m-hero m-hero--brand">
                  <div class="m-hero__label">Release check · departs in 6 min</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <div class="m-hero__value">5<small>of 5 checks</small></div>
                    <span class="m-pill m-pill--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Ready to release</span>
                  </div>
                  <div class="m-hero__meta">Run, dock notice and seal number go to Ruwan's phone the moment you release.</div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><span class="m-stat__l">Reefer · needs ≤ 4 °C</span><span class="m-stat__v" style="color:var(--chilled-fg);">3 °C</span><span class="lx-statnote">read 3:32</span></div>
                  <div class="m-stat"><span class="m-stat__l">Lines accounted</span><span class="m-stat__v">22<span style="font-size:15px; color:var(--text-3);"> / 22</span></span><span class="lx-statnote">21 loaded · 1 short</span></div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Seal number</div><div class="m-row__meta">Goes on the driver's run</div></div>
                    <span class="ld-seal"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>KDY-57-10413</span>
                  </div>
                </div>
              </div>
              <div class="ld-tright">
                <div class="m-section">
                  <div class="m-section__head"><b>Release checklist</b><span>all passed</span></div>
                  <div class="m-group lx-bigrows">
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">All 22 lines accounted</div><div class="m-row__meta">21 loaded · yoghurt 80 g short 2, ack'd 3:24 by Nilanthi</div></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Loaded in stop order</div><div class="m-row__meta">Stop 2 <span class="id">OUT108</span> at the front · Stop 1 <span class="id">OUT106</span> by the doors</div></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Reefer checked</div><div class="m-row__meta">Needs ≤ 4 °C · read 3:32</div></div><div class="m-row__trail"><span class="m-row__value" style="color:var(--chilled-fg);">3 °C</span><span class="m-row__unit">passes</span></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Doors sealed</div><div class="m-row__meta">Seal <span class="id">KDY-57-10413</span></div></div></div>
                    <div class="m-row"><div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Driver at the bay</div><div class="m-row__meta">Ruwan Bandara · signed in on his phone 3:31</div></div><div class="m-row__lead m-row__lead--star" style="font-size:14px;">RB</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ld-tfoot">
              <div class="ld-tprog">
                <div class="ld-tprog__t"><span><b>22</b> of 22 lines accounted</span><span>1 short, ack'd</span></div>
                <div class="m-progress m-progress--ok"><div style="width:100%"></div></div>
              </div>
              <div class="spacer"></div>
              <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print driver copy</div>
              <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Release VEH057 to Ruwan</div>
            </div>
          </div>
        </div>
      <p class="lx-cap lx-cap--wide">Release checklist at terminal size, all 5 passed. <b>Release →</b> <span class="lx-nw">LD-21</span>.</p>
    </div>
    </div>
  </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">5</span>Problems</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-23</span>Plan changed · tablet</div>
<div class="frame frame--tablet mode-loader lx-new" data-name="LD-23 Plan changed · tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">3:52</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="ld-tnav">
              <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg></div>
              <div class="ld-tmeta"><span>Bay K4 · Style · Kandy</span><b><span class="id">VEH044</span> · Dry truck</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Departs 10:05</span><b>Mall 10:30–12:30</b></div>
              <div class="ld-tvr"></div>
              <div class="ld-tmeta"><span>Loaded</span><b>12 of 40 lines</b></div>
              <div class="spacer"></div>
              <span class="m-pill m-pill--warn"><span class="dot"></span>Plan v4 · new</span>
              <div class="ld-user"><div class="ld-user__av">KJ</div><div class="ld-user__t"><b>Kasun J.</b><span>Switch user</span></div></div>
            </div>
            <div class="ld-tbody">
              <div class="ld-tleft">
                <div class="m-hero lx-hero--warn">
                  <div class="m-hero__label" style="color:var(--st-deferred-fg);">Plan changed 3:52 · Nilanthi, dispatch</div>
                  <div class="m-hero__value">2<small>items moved</small></div>
                  <div class="m-hero__meta">Neither is loaded yet, so nothing comes off the truck. The other 38 lines are unchanged.</div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Why</span><b>Store wants New Year stock first</b></div>
                  <div class="m-kv"><span>Store</span><b><span class="id">OUT089</span> · Kandy City Centre</b></div>
                  <div class="m-kv"><span>Unloads at</span><b>Mall bay · 10:30–12:30</b></div>
                  <div class="m-kv"><span>Your v3 printout</span><b style="color:var(--st-exception-fg);">Out of date</b></div>
                </div>
              </div>
              <div class="ld-tright">
                <div class="m-section">
                  <div class="m-section__head"><b>What moved · v3 → v4</b><span>2 of 40 lines</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">New Year sarongs</div><div class="m-row__meta">carton of 20<span class="m-sep"></span>not loaded yet</div></div>
                      <div class="lx-diff"><div class="lx-diff__c"><span>v3</span><s>Middle</s></div><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg><div class="lx-diff__c"><span>v4</span><b>By the doors</b></div></div>
                      <div class="m-row__trail" style="width:52px;"><span class="m-row__value">6</span><span class="m-row__unit">ctns</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Kids' shoes</div><div class="m-row__meta">carton of 12<span class="m-sep"></span>not loaded yet</div></div>
                      <div class="lx-diff"><div class="lx-diff__c"><span>v3</span><s>Middle</s></div><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg><div class="lx-diff__c"><span>v4</span><b>By the doors</b></div></div>
                      <div class="m-row__trail" style="width:52px;"><span class="m-row__value">4</span><span class="m-row__unit">ctns</span></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Where they go now</b><span>top view · cab on the left</span></div>
                  <div class="m-group lx-mapbox">
                    <svg width="506" height="150" viewBox="0 0 506 150" font-family="Inter, sans-serif" data-name="Truck top view">
  <rect x="0" y="40" width="50" height="70" rx="12" fill="#C9CFDB"/><rect x="8" y="50" width="16" height="50" rx="4" fill="#8F98AA"/>
  <rect x="56" y="2" width="438" height="146" rx="14" fill="#FFFFFF" stroke="#C9CFDB" stroke-width="1.5"/>
  <path d="M202 12 V140 M348 12 V140" stroke="#D8DDE6" stroke-width="1.5" stroke-dasharray="5 5"/>
  <text x="129" y="26" font-size="13" font-weight="700" fill="#4A5467" text-anchor="middle">Front</text>
  <text x="275" y="26" font-size="13" font-weight="700" fill="#4A5467" text-anchor="middle">Middle</text>
  <text x="421" y="26" font-size="13" font-weight="700" fill="#4A5467" text-anchor="middle">Doors</text>
  <rect x="66" y="36" width="126" height="100" rx="10" fill="#E3F6EC" stroke="#10B981" stroke-width="1.5"/>
  <text x="80" y="80" font-size="14" font-weight="800" fill="#065F46">Loaded</text><text x="80" y="98" font-size="13" font-weight="600" fill="#065F46">12 lines</text>
  <rect x="212" y="36" width="126" height="46" rx="10" fill="#F1EFEC"/>
  <text x="224" y="64" font-size="13" font-weight="700" fill="#4A5467">Shirts · 10 ctns</text>
  <rect x="212" y="90" width="126" height="46" rx="10" fill="none" stroke="#B45309" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="224" y="118" font-size="13" font-weight="600" fill="#B45309">Was here</text>
  <path d="M318 113 H350" stroke="#B45309" stroke-width="2.5"/><path d="M346 107 L354 113 L346 119 Z" fill="#B45309"/>
  <rect x="358" y="36" width="126" height="46" rx="10" fill="#FFF1D6" stroke="#F5B83D" stroke-width="2"/>
  <text x="370" y="64" font-size="13" font-weight="800" fill="#7A4B00">Sarongs · 6</text>
  <rect x="358" y="90" width="126" height="46" rx="10" fill="#FFF1D6" stroke="#F5B83D" stroke-width="2"/>
  <text x="370" y="118" font-size="13" font-weight="800" fill="#7A4B00">Kids' shoes · 4</text>
  <rect x="495" y="10" width="8" height="60" rx="3" fill="#344054"/><rect x="495" y="80" width="8" height="60" rx="3" fill="#344054"/>
</svg>
                    <div class="ld-van__legend"><span class="m-tag m-tag--warn"><span class="dot"></span>Moved in v4</span><span class="m-sep"></span>Dashed box: old v3 place<span class="m-sep"></span>Doors on the right</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ld-tfoot">
              <span class="lx-tnote"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Sheet stays locked until you tap Got it.</span>
              <div class="spacer"></div>
              <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print v4</div>
              <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Got it, load v4</div>
            </div>
          </div>
        </div>
      <p class="lx-cap lx-cap--wide">v3 → v4 diff with a top-view truck map. <b>Got it →</b> <span class="lx-nw">LD-21</span>; <b>Print v4</b> prints a versioned copy.</p>
    </div>
    </div>
  </div>
  <div class="lx-flow">
    <div class="lx-flow__head"><span class="lx-flow__n">6</span>Access &amp; system states</div>
    <div class="row" style="gap:56px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-27</span>Tablet locked · tablet</div>
<div class="frame frame--tablet mode-loader lx-new" data-name="LD-27 Tablet locked · tablet">
          <div class="m-screen">
            <div class="ld-tbar"><span class="mono">3:23</span><span class="hstack" style="gap:6px;"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></span></div>
            <div class="lx-tsign">
              <div class="lx-tsign__brand">
                <div class="lx-tsign__logo"><svg viewBox="0 0 32 32" style="width:44px; height:44px;"><rect width="32" height="32" rx="8" fill="#6D28D9"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></g></svg><div class="vstack" style="gap:2px;"><b>Lodestar Dock</b><span>Bay K2 terminal · Kandy Hub</span></div></div>
                <div class="spacer"></div>
                <div class="lx-tsign__clock">3:23</div>
                <div class="lx-tsign__date">Tue 7 Apr<br>Night shift 01:30–09:30</div>
                <div class="la-baynow">
                  <span class="la-baynow__k">Bay K2 now</span>
                  <b><span class="id">VEH057</span> · Nuwara Eliya</b>
                  <div class="la-baynow__bar"><div style="width:77%;"></div></div>
                  <span>17 of 22 lines · departs 3:40</span>
                  <span>1 flag waiting for dispatch</span>
                </div>
                <div class="spacer"></div>
                <div class="lx-tsign__foot"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Locked after 2 min idle. Every tick is saved.</div>
              </div>
              <div class="lx-tsign__main">
                <div class="m-title" style="padding:0;">
                  <div class="m-eyebrow">Bay K2 terminal is locked</div>
                  <div class="m-h1" style="font-size:40px;">Tap your badge or enter<br>your <span class="lx-nw">4-digit PIN</span></div>
                </div>
                <div class="lx-tsign__cols">
                  <div class="la-badge">
                    <svg width="120" height="120" viewBox="0 0 120 120" data-name="Badge tap illustration">
  <circle cx="60" cy="60" r="58" fill="#FFFFFF"/>
  <rect x="26" y="32" width="44" height="60" rx="8" fill="#141B4D"/>
  <rect x="34" y="42" width="28" height="6" rx="3" fill="#F5B83D"/>
  <circle cx="48" cy="64" r="8" fill="#3B4CCA"/>
  <rect x="36" y="78" width="24" height="4" rx="2" fill="#8F98AA"/>
  <path d="M80 50a14 14 0 0 1 0 20M87 43a24 24 0 0 1 0 34M94 36a34 34 0 0 1 0 48" fill="none" stroke="#3B4CCA" stroke-width="4" stroke-linecap="round"/>
</svg>
                    <b>Tap badge here</b>
                    <span>Reader is under the screen</span>
                  </div>
                  <div class="lx-pinpad">
                    <div class="lx-pinpad__head"><span>Or your <b>PIN</b></span><div class="lx-pin"><span class="lx-pin__d"></span><span class="lx-pin__d"></span><span class="lx-pin__d"></span><span class="lx-pin__d"></span></div></div>
                    <div class="lx-keypad lx-keypad--t"><div class="lx-keyrow"><div class="lx-key" style="height:72px;">1</div><div class="lx-key" style="height:72px;">2</div><div class="lx-key" style="height:72px;">3</div></div><div class="lx-keyrow"><div class="lx-key" style="height:72px;">4</div><div class="lx-key" style="height:72px;">5</div><div class="lx-key" style="height:72px;">6</div></div><div class="lx-keyrow"><div class="lx-key" style="height:72px;">7</div><div class="lx-key" style="height:72px;">8</div><div class="lx-key" style="height:72px;">9</div></div><div class="lx-keyrow"><div class="lx-key lx-key--ghost lx-key--txt" style="height:72px;">Clear</div><div class="lx-key" style="height:72px;">0</div><div class="lx-key lx-key--ghost" style="height:72px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div></div>
                    <div class="la-forgot"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/></svg>Forgot PIN? Ask the shift lead</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
      <p class="lx-cap lx-cap--wide">Shared terminal locks after 2 min idle; bay status stays readable, no names shown. <b>Badge or PIN →</b> <span class="lx-nw">LD-21</span>; <b>Forgot PIN</b> points to the shift lead.</p>
    </div>
    </div>
  </div>
  </section>
</main>
</body>
</html>
` }} />
  );
}
