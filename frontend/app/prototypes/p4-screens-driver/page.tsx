
import React from 'react';

export default function p4screensdriver() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Driver screens · prototype screens</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&amp;family=Noto+Sans+Tamil:wght@400;600;700&amp;display=swap">
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/components.css">
<style>
  /* ---------- Board-level (page 07) ---------- */
  .flow-row { display: flex; gap: 40px; align-items: flex-start; }
  .flow-row .flow-arrow { align-self: flex-start; margin-top: 420px; width: 72px; }

  .ctx-row { display: flex; gap: 20px; align-items: stretch; }
  .persona {
    display: flex; flex-direction: column; gap: 14px; width: 400px; flex-shrink: 0;
    padding: 24px; border-radius: 16px; background: var(--brand-950); color: #E8EBF7;
  }
  .persona__top { display: flex; align-items: center; gap: 14px; }
  .persona__av {
    display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px;
    background: var(--star-500); color: #1A1300; font-size: 20px; font-weight: 800; flex-shrink: 0;
  }
  .persona__name { font-size: 20px; font-weight: 800; color: #FFFFFF; }
  .persona__role { font-size: 14px; color: #9AA3C7; font-weight: 600; }
  .persona__facts { display: flex; flex-direction: column; gap: 8px; }
  .persona__fact { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #C9CFE8; }
  .persona__fact svg { color: var(--star-400); }
  .ctx {
    display: flex; flex-direction: column; gap: 12px; width: 300px; flex-shrink: 0;
    padding: 20px; border-radius: 16px; background: #FFFFFF; border: 1px solid var(--n-200); box-shadow: var(--shadow-1);
  }
  .ctx__cond { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 800; color: var(--n-900); }
  .ctx__ic { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: var(--n-100); color: var(--n-700); flex-shrink: 0; }
  .ctx__arrow { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--brand-600); }
  .ctx__resp { font-size: 15px; line-height: 1.5; color: var(--n-700); }
  .ctx__resp b { color: var(--n-900); }

  /* annotation pins on the bezel + legend under the frame */
  .annot--pin { padding: 4px; border-radius: 999px; box-shadow: 0 4px 10px rgba(120,80,0,.35), 0 0 0 3px #FFFFFF; }
  .annot--pin .annot__n { width: 22px; height: 22px; font-size: 12px; }
  .annot--left { left: -15px; }
  .annot--right { left: 375px; }
  .pins { display: flex; flex-direction: column; gap: 8px; width: 390px; padding: 14px 16px; border-radius: 12px; background: var(--star-100); border: 1px solid #F3D38C; }
  .pins__i { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; font-weight: 600; line-height: 1.45; color: #4A3A10; }
  .pins__i .annot__n { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #1A1300; color: var(--star-400); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }


  /* ---------- Lodestar 2.0 driver pieces (page-local, used with ui2.css m-* kit) ---------- */
  .dv-sb-note { font-size: 13px; font-weight: 700; color: var(--text-2); }
  .frame .dv-name { font-size: 40px; line-height: 1.05; }
  .frame .dv-name-sm { font-size: 38px; line-height: 1.05; }
  .dv-check { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .dv-check svg { width: 16px; height: 16px; color: var(--st-delivered-fg); stroke-width: 3; flex-shrink: 0; }
  .dv-check b { color: var(--text); font-weight: 700; }
  .dv-callbtn { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 18px; border-radius: 16px; background: var(--surface-3); color: var(--text); font-size: 16px; font-weight: 700; flex-shrink: 0; }
  .dv-callbtn svg { width: 20px; height: 20px; color: var(--st-delivered-fg); }
  .dv-lock { display: flex; align-items: center; gap: 5px; height: 56px; padding: 0 14px; border-radius: 16px; border: 1.5px dashed var(--line-strong); color: var(--text-2); font-size: 14px; font-weight: 700; flex-shrink: 0; }
  .dv-lock b { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--text); }
  .dv-lock svg { width: 16px; height: 16px; }
  .frame .dv-step .m-stepper__b { width: 52px; height: 52px; }
  .frame .dv-step .m-stepper__v { min-width: 48px; }
  .dv-thumb { width: 56px; height: 56px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 0 2px var(--st-exception-fg); }
  .dv-addphoto { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; width: 56px; height: 56px; border-radius: 14px; border: 1.5px dashed var(--line-strong); color: var(--text-2); font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .dv-addphoto svg { width: 20px; height: 20px; }
  .dv-okval { display: flex; align-items: center; gap: 6px; color: var(--st-delivered-fg); }
  .dv-okval svg { width: 20px; height: 20px; stroke-width: 3; }
  .frame .dv-okval .m-row__value { color: var(--st-delivered-fg); }
  .dv-threadwrap { display: flex; justify-content: center; margin: 2px -12px 0; padding-top: 14px; border-top: 1px solid var(--hair); }
  .frame .dv-thread .thread__step { width: 62px; gap: 5px; }
  .frame .dv-thread .thread__label { font-size: 13px; white-space: nowrap; }
  .frame .dv-thread .thread__time { font-size: 13px; font-family: var(--font-ui); font-weight: 600; white-space: nowrap; }
  .frame .dv-thread .thread__bar { width: 36px; margin-left: -16px; margin-right: -16px; }
  .dv-sigwrap { display: flex; flex-direction: column; padding: 14px 16px 12px; }
  .dv-sig { position: relative; height: 112px; border-radius: 16px; background: var(--surface); overflow: hidden; }
  .dv-sig > svg { position: absolute; left: 30px; top: 6px; color: var(--text); }
  .dv-sig__base { position: absolute; left: 16px; right: 16px; bottom: 40px; height: 1px; background: var(--line-strong); }
  .dv-sig__cap { position: absolute; left: 16px; bottom: 12px; font-size: 13px; font-weight: 600; color: var(--text-3); }
  .dv-sig__clear { position: absolute; right: 10px; top: 10px; display: flex; align-items: center; height: 32px; padding: 0 12px; border-radius: 10px; background: var(--surface-3); font-size: 13px; font-weight: 700; color: var(--text-2); }
  .dv-input { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 14px; flex: 1; min-width: 0; border-radius: 16px; background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--line); font-size: 15px; color: var(--text-3); }
  .dv-input svg { width: 18px; height: 18px; }
  .dv-smallbtn { display: flex; align-items: center; justify-content: center; height: 56px; padding: 0 18px; border-radius: 16px; background: var(--surface-3); color: var(--text); font-size: 16px; font-weight: 700; flex-shrink: 0; }
  .dv-done { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; background: var(--tint-ok); color: var(--st-delivered-fg); flex-shrink: 0; }
  .dv-done svg { width: 28px; height: 28px; stroke-width: 3; }
  .dv-note { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-2); padding-bottom: 2px; }
  .dv-note svg { width: 15px; height: 15px; }
  .frame .m-body.dv-tight { gap: 16px; }
  .frame .m-body > * { flex-shrink: 0; }
  .frame .m-body.dv-tight-b { padding-bottom: 8px; }
  .frame .m-body.dv-gap14 { gap: 14px; }
  .frame .m-row.dv-row-pad { padding-top: 8px; padding-bottom: 8px; }

  /* Principles / micro-state */
  .prin-col { display: flex; flex-direction: column; gap: 20px; width: 820px; }
  .prin-row { display: flex; gap: 20px; }
  .prin { display: flex; flex-direction: column; gap: 10px; flex: 1; padding: 20px; border-radius: 16px; background: #FFFFFF; border: 1px solid var(--n-200); box-shadow: var(--shadow-1); }
  .prin__ic { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: var(--brand-950); color: var(--star-400); }
  .prin__t { font-size: 17px; font-weight: 800; color: var(--n-900); }
  .prin__b { font-size: 14px; line-height: 1.55; color: var(--n-600); }
  .moving { display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 16px; border-radius: 20px; }
  .reach { position: relative; width: 150px; height: 220px; border-radius: 22px; border: 5px solid #10131C; background: #0B1020; overflow: hidden; flex-shrink: 0; }

  /* ---------- rx: complete app screen set (board) ---------- */
  .rx-head { display: flex; flex-direction: column; gap: 6px; width: 390px; }
  .rx-cap { font-size: 14px; line-height: 1.45; color: var(--n-600); }
  .rx-cap b { color: var(--n-900); font-weight: 700; }
  .rx-sect { display: flex; flex-direction: column; gap: 32px; }
  .rx-sect__head { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid #C9CFDB; }
  .rx-sect__n { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: var(--grad-navy); color: var(--star-400); font-family: var(--font-mono); font-size: 15px; font-weight: 700; flex-shrink: 0; }
  .rx-sect__t { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); }
  .rx-sect__d { font-size: 16px; color: var(--n-600); }
  .rx-subhead { font-size: 15px; font-weight: 800; color: var(--n-700); }
  .rx-inv-wrap { display: flex; gap: 24px; align-items: flex-start; }
  .rx-inv { display: flex; flex-direction: column; width: 1160px; border-radius: 18px; background: #FFFFFF; box-shadow: var(--shadow-1); overflow: hidden; }
  .rx-inv__r { display: flex; align-items: center; gap: 14px; min-height: 40px; padding: 6px 18px; font-size: 14px; line-height: 1.35; color: var(--n-700); border-top: 1px solid #ECEEF3; }
  .rx-inv__r--h { border-top: none; min-height: 38px; background: #FAFBFD; font-size: 13px; font-weight: 700; color: var(--n-500); }
  .rx-inv__r--g { min-height: 32px; background: #F3F5FA; font-size: 13px; font-weight: 800; color: var(--brand-700); }
  .rx-inv__id { width: 120px; flex-shrink: 0; font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--n-900); }
  .rx-inv__n { width: 250px; flex-shrink: 0; font-weight: 700; color: var(--n-900); }
  .rx-inv__l { flex: 1; min-width: 0; }
  .rx-inv__l b { color: var(--n-900); font-weight: 700; }

  /* ---------- rx: frame pieces ---------- */
  .frame .m-row__unit { font-size: 13px; line-height: 16px; }
  .frame[data-name="DR-02 Stop arrival"] .m-body { padding-top: 0; }
  .frame .m-body.rx-g12 { gap: 12px; }
  .frame .m-body.rx-g14 { gap: 14px; }
  .frame .m-body.rx-g16 { gap: 16px; }
  .frame .m-body.rx-pt { padding-top: 10px; }
  .frame .rx-hv { font-family: var(--font-display); font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; color: var(--text); }
  .frame .m-hero.rx-hero--ok { background: var(--tint-ok); box-shadow: none; }
  .rx-okdot { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--st-delivered-fg); color: #07140F; flex-shrink: 0; }
  .rx-okdot svg { width: 26px; height: 26px; stroke-width: 3; }
  .rx-kvbar + .m-kv { border-top: 1px solid var(--hair); }
  .frame .m-row__unit.rx-unit--bad { color: var(--st-exception-fg); font-weight: 700; }
  .frame .m-row.rx-row56 { min-height: 56px; padding-top: 8px; padding-bottom: 8px; }
  .frame .m-row.rx-row56 .m-row__lead { width: 38px; height: 38px; border-radius: 12px; }
  .frame .m-row.rx-row56 .m-row__lead svg { width: 19px; height: 19px; }
  .frame .m-row__lead.rx-lead--plain { background: var(--surface-3); color: var(--text-2); }
  .frame .m-row__lead.rx-lead--off { background: transparent; border: 1.5px dashed var(--st-offline-bd); color: var(--st-offline-fg); }
  .frame .m-row__lead.rx-lead--glyph { font-family: var(--font-ui); font-size: 21px; font-weight: 700; }
  .frame .m-row__lead.rx-lead--lg { width: 52px; height: 52px; border-radius: 16px; }
  .frame .m-row__lead.rx-lead--lg svg { width: 24px; height: 24px; }
  .frame .rx-titlebad { color: var(--st-exception-fg); }
  .rx-note { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600; line-height: 1.4; color: var(--text-3); text-align: center; }
  .rx-note svg { width: 15px; height: 15px; flex-shrink: 0; }
  .rx-hint { display: flex; align-items: flex-start; gap: 8px; padding: 0 20px; font-size: 14px; line-height: 1.45; color: var(--text-2); }
  .rx-hint svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; color: var(--text-3); }
  .rx-btn--wait { opacity: .45; }
  .rx-tick { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--tint-ok); color: var(--st-delivered-fg); flex-shrink: 0; }
  .rx-tick svg { width: 20px; height: 20px; stroke-width: 3; }
  .rx-tick--busy { background: var(--tint-info); color: var(--st-enroute-fg); }
  .rx-tick--busy svg { stroke-width: 2.5; }
  .rx-tick--wait { background: transparent; border: 1.5px dashed var(--line-strong); color: var(--text-3); }
  .rx-tick--wait svg { stroke-width: 2; width: 18px; height: 18px; }
  .rx-radio { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--line-strong); flex-shrink: 0; }
  .rx-radio.is-on { border: none; background: var(--star-500); color: #111522; }
  .rx-radio svg { width: 17px; height: 17px; stroke-width: 3; }
  .rx-allow { display: flex; align-items: center; justify-content: center; height: 56px; padding: 0 20px; border-radius: 16px; background: var(--surface-3); font-size: 15px; font-weight: 700; color: var(--text); flex-shrink: 0; }
  .rx-dots { display: flex; justify-content: center; gap: 6px; }
  .rx-dots i { width: 8px; height: 8px; border-radius: 999px; background: var(--surface-3); }
  .rx-dots i.is-on { width: 24px; background: var(--star-500); }

  /* splash */
  .frame .m-screen.rx-splash { position: relative; background: linear-gradient(180deg, #050919 0%, #0C1238 45%, #1A2463 100%); }
  .rx-splash .statusbar { position: relative; color: #E8EBF7; }
  .rx-sky { position: absolute; left: 0; top: 0; width: 374px; height: 600px; }
  .rx-sky i { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #FFFFFF; }
  .rx-hills { position: absolute; left: 0; bottom: 0; width: 374px; height: 260px; }
  .rx-splash__c { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex: 1; padding: 0 28px 120px; }
  .rx-star { display: flex; align-items: center; justify-content: center; width: 116px; height: 116px; border-radius: 36px; background: rgba(245,184,61,.08); box-shadow: 0 0 0 1px rgba(245,184,61,.22), 0 0 90px rgba(245,184,61,.30); margin-bottom: 10px; }
  .rx-brand { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: #FFFFFF; }
  .rx-brand span { color: var(--star-400); }
  .rx-tagline { font-size: 16px; font-weight: 500; color: #B9C0E6; }
  .rx-splash__foot { position: relative; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 0 22px; font-size: 13px; font-weight: 600; color: #C9CFE8; }
  .rx-splash__foot .m-progress { width: 132px; height: 6px; background: rgba(255,255,255,.12); }
  .rx-splash__by { font-size: 13px; font-weight: 600; color: #7F89B8; }

  /* phone field, code boxes, keypad */
  .rx-field { display: flex; gap: 10px; margin: 0 16px; }
  .rx-cc { display: flex; align-items: center; gap: 8px; height: 64px; padding: 0 16px; border-radius: 18px; background: var(--surface-2); font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text); flex-shrink: 0; }
  .rx-cc small { font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--text-3); }
  .rx-num { display: flex; align-items: center; flex: 1; min-width: 0; height: 64px; padding: 0 18px; border-radius: 18px; background: var(--surface-2); box-shadow: inset 0 0 0 2px var(--star-500); font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: .02em; color: var(--text); white-space: nowrap; }
  .rx-caret { width: 2px; height: 26px; margin-left: 3px; background: var(--star-500); }
  .rx-otp { display: flex; gap: 8px; margin: 0 20px; }
  .rx-otp__c { display: flex; align-items: center; justify-content: center; flex: 1; height: 64px; border-radius: 16px; background: var(--surface-2); font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text); }
  .rx-otp__c.is-ok { box-shadow: inset 0 0 0 2px var(--st-delivered-fg); }
  .rx-otp--big { gap: 12px; margin: 0 28px; }
  .rx-otp--big .rx-otp__c { height: 84px; border-radius: 20px; font-size: 40px; }
  .rx-keys { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px 4px; flex-shrink: 0; background: var(--surface); border-top: 1px solid var(--hair); }
  .rx-keys__r { display: flex; gap: 8px; }
  .rx-key { display: flex; align-items: center; justify-content: center; flex: 1; height: 56px; border-radius: 14px; background: var(--surface-3); font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text); }
  .rx-key--flat { background: transparent; color: var(--text-2); }
  .rx-key svg { width: 26px; height: 26px; }

  /* route rail */
  .rx-route { display: flex; flex-direction: column; padding: 16px 16px 2px; }
  .rx-rt { display: flex; gap: 14px; }
  .rx-rt__rail { display: flex; flex-direction: column; align-items: center; width: 32px; flex-shrink: 0; }
  .rx-rt__node { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--surface-3); color: var(--text-2); font-family: var(--font-display); font-size: 15px; font-weight: 800; flex-shrink: 0; }
  .rx-rt__node svg { width: 17px; height: 17px; }
  .rx-rt__node--star { background: var(--star-500); color: #1A1300; }
  .mode-driver-day .rx-rt__node--star { background: var(--brand-900); color: #FFFFFF; }
  .rx-rt__node--off { background: transparent; border: 1.5px dashed var(--st-offline-bd); color: var(--st-offline-fg); }
  .rx-rt__line { flex: 1; width: 3px; min-height: 12px; margin: 4px 0; border-radius: 3px; background: var(--line-strong); }
  .rx-rt__line--dash { width: 0; border-radius: 0; background: transparent; border-left: 3px dashed var(--st-offline-bd); }
  .rx-rt__main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; padding: 5px 0 16px; }
  .rx-rt__t { font-size: 16px; font-weight: 700; line-height: 1.3; color: var(--text); }
  .rx-rt__m { font-size: 13px; font-weight: 500; line-height: 1.4; color: var(--text-2); }
  .rx-rt__trail { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; padding-top: 4px; flex-shrink: 0; }

  /* problem tiles */
  .rx-tiles { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 16px; }
  .rx-tile { display: flex; flex-direction: column; justify-content: space-between; width: calc(50% - 5px); height: 112px; padding: 16px; border-radius: 20px; background: var(--surface-2); font-size: 16px; font-weight: 700; line-height: 1.25; color: var(--text); }
  .rx-tile__ic { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 14px; background: var(--surface-3); color: var(--text-2); }
  .rx-tile__ic svg { width: 22px; height: 22px; }
  .rx-tile__ic--cold { background: var(--tint-cold); color: var(--chilled-fg); }
  .rx-tile.is-on { background: var(--tint-warn); box-shadow: inset 0 0 0 2px var(--star-500); }
  .rx-tile.is-on .rx-tile__ic { background: var(--star-500); color: #1A1300; }

  /* photos, profile, segmented, states sheet */
  .rx-photo { display: flex; height: 176px; overflow: hidden; }
  .rx-photo84 { width: 84px; height: 84px; border-radius: 16px; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 0 2px var(--st-exception-fg); }
  .rx-thumb { width: 56px; height: 56px; border-radius: 14px; overflow: hidden; flex-shrink: 0; }
  .rx-prof { display: flex; align-items: center; gap: 14px; padding: 0 20px; }
  .rx-av { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 20px; background: var(--star-500); color: #1A1300; font-family: var(--font-display); font-size: 22px; font-weight: 800; flex-shrink: 0; }
  .frame .rx-seg .m-seg__i { height: 48px; }
  .frame.mode-driver .rx-seg .m-seg__i.is-on { background: #2C3760; color: #FFFFFF; box-shadow: none; }
  .rx-trailtxt { font-size: 15px; font-weight: 600; color: var(--text-2); white-space: nowrap; }
  .rx-sheet { display: flex; flex-direction: column; gap: 12px; padding: 22px 0 24px; }
  .rx-sheet__l { display: flex; align-items: center; gap: 8px; padding: 6px 20px 0; font-size: 13px; font-weight: 700; color: var(--text-3); }
  .rx-sheet__l b { font-family: var(--font-mono); color: var(--star-400); font-weight: 700; }
  .rx-sheet__t { padding: 0 20px 4px; font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
  .rx-pills { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px; }
  .rx-kvbar { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 14px; border-top: 1px solid var(--hair); font-size: 15px; }
  .rx-kvbar__h { display: flex; justify-content: space-between; }
  .rx-kvbar__h span { color: var(--text-2); }
  .rx-kvbar__h b { font-weight: 700; font-variant-numeric: tabular-nums; }
  /* photo auto-fill hint: value read from a photo, the person confirms (manual entry stays) */
  .cv-hint { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--brand-600); white-space: nowrap; }
  .cv-hint svg { width: 14px; height: 14px; flex-shrink: 0; }
  .cv-hint b { font-weight: 800; }
  .mode-driver .cv-hint { color: #A9B4FF; }

  /* ---------- vo: on-device read-aloud control (shared pill, same across apps) ---------- */
  .vo-btn { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 16px 0 14px; border-radius: 999px; background: var(--surface-3); color: var(--text); font-size: 15px; font-weight: 700; line-height: 1; white-space: nowrap; flex-shrink: 0; }
  .vo-btn svg { width: 20px; height: 20px; flex-shrink: 0; color: var(--brand-600); }
  .mode-driver .vo-btn svg { color: var(--star-400); }
  .vo-btn--on { background: var(--tint-warn); box-shadow: inset 0 0 0 1.5px var(--star-500); }
  .vo-btn--off { background: transparent; border: 1.5px dashed var(--line-strong); color: var(--text-2); font-size: 14px; }
  .vo-btn--off svg { color: var(--text-3); }
  .mode-driver .vo-btn--off svg { color: var(--text-3); }
  .vo-lvl { display: flex; align-items: flex-end; gap: 2px; height: 14px; flex-shrink: 0; }
  .vo-lvl i { display: block; width: 3px; border-radius: 2px; background: var(--brand-600); }
  .mode-driver .vo-lvl i { background: var(--star-400); }
  .vo-hrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .frame .m-body.vo-fit { gap: 12px; }
  .frame .vo-fit .m-hero { gap: 8px; padding-top: 16px; padding-bottom: 16px; }
  .frame .vo-fit .m-section { gap: 6px; }
  .frame .vo-fit .m-group > .m-row:first-child { padding-top: 10px; padding-bottom: 10px; }
  /* vo: P4-only pieces (DR-01 icon, DR-33 to DR-35) */
  .vo-si { font-family: 'Noto Sans Sinhala', 'Nirmala UI', var(--font-ui); }
  .vo-ta { font-family: 'Noto Sans Tamil', 'Nirmala UI', var(--font-ui); }
  .frame .m-hero.vo-card { position: relative; }
  .vo-ico { position: absolute; right: 14px; top: 14px; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; background: var(--surface-3); color: var(--star-400); }
  .vo-ico svg { width: 20px; height: 20px; }
  .vo-tog { display: flex; align-items: center; justify-content: flex-end; width: 52px; height: 32px; padding: 3px; border-radius: 999px; background: var(--star-500); flex-shrink: 0; }
  .vo-tog i { display: block; width: 26px; height: 26px; border-radius: 50%; background: #111522; }
  .vo-tog--lock { opacity: .5; }
  .frame .vo-seg .m-seg__i { height: 48px; font-size: 15px; }
  .vo-hrow--end { justify-content: flex-end; }
  .vo-cap { display: flex; padding: 1px 0 1px 11px; box-shadow: inset 3px 0 0 var(--star-500); font-size: 13px; line-height: 1.45; color: var(--text-3); }
  .vo-cap b { font-weight: 700; color: var(--text); }
  .vo-cap .id { color: var(--text-2); }
  .frame .m-body.vo-fit2 { gap: 6px; }
  .frame .vo-fit2 .m-hero { gap: 5px; padding-top: 10px; padding-bottom: 10px; }
  .frame .vo-fit2 .dv-name { font-size: 38px; }
  .frame .vo-fit2 .m-section { gap: 4px; }
  .frame .vo-fit2 .m-group > .m-row:first-child { padding-top: 8px; padding-bottom: 8px; }
  .frame .vo-fit2 .m-row.dv-row-pad { padding-top: 4px; padding-bottom: 4px; }
  .frame .vo-fit2 .m-row { min-height: 58px; padding-top: 8px; padding-bottom: 8px; }
  .frame .m-actionbar.vo-ab { padding-top: 8px; gap: 4px; }
  .vo-center { display: flex; justify-content: center; padding: 0 16px; }

  /* ---------- sx: account and app states (DR-29 to DR-32) ---------- */
  .frame .m-hero.sx-hero--off { background: transparent; box-shadow: none; border: 1.5px dashed var(--st-offline-bd); }
  .frame .sx-hero--off .m-hero__label { color: var(--st-offline-fg); }
  /* ---------- rd: driving mode + on-the-road alerts (DR-36 to DR-38) ---------- */
  .rd-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; height: 60px; padding: 0 16px; flex-shrink: 0; }
  .rd-mode { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-2); white-space: nowrap; }
  .rd-mode svg { width: 18px; height: 18px; color: var(--star-400); }
  .rd-temp { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 16px 0 14px; border-radius: 999px; background: var(--tint-ok); color: var(--st-delivered-fg); font-size: 15px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .rd-temp svg { width: 18px; height: 18px; }
  .rd-temp span { color: var(--text); }
  .rd-body { display: flex; flex-direction: column; gap: 20px; flex: 1; min-height: 0; overflow: hidden; padding: 6px 20px 8px; }
  .rd-next { display: flex; flex-direction: column; gap: 6px; }
  .rd-eyebrow { font-size: 14px; font-weight: 700; color: var(--text-3); }
  .rd-stop { font-family: var(--font-display); font-size: 46px; font-weight: 800; line-height: 1.02; letter-spacing: -0.03em; color: var(--text); }
  .rd-meta { font-size: 17px; font-weight: 600; color: var(--text-2); }
  .rd-meta .id { color: var(--text); }
  .rd-eta { display: flex; align-items: flex-end; gap: 16px; }
  .rd-eta__v { font-family: var(--font-display); font-size: 76px; font-weight: 800; line-height: .9; letter-spacing: -0.04em; color: var(--star-400); font-variant-numeric: tabular-nums; }
  .rd-eta__side { display: flex; flex-direction: column; gap: 3px; padding-bottom: 4px; white-space: nowrap; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .rd-eta__side b { font-size: 16px; font-weight: 800; color: var(--text); }
  .rd-prog { display: flex; flex-direction: column; gap: 8px; }
  .rd-track { display: flex; align-items: center; height: 36px; }
  .rd-node { width: 16px; height: 16px; border-radius: 50%; background: var(--st-delivered-fg); flex-shrink: 0; }
  .rd-node--end { width: 20px; height: 20px; background: transparent; border: 3px solid var(--star-400); }
  .rd-seg { flex: 1; height: 5px; border-radius: 3px; background: var(--st-delivered-fg); }
  .rd-seg--off { height: 0; border-radius: 0; background: transparent; border-top: 3px dashed var(--st-offline-bd); }
  .rd-seg--todo { background: var(--surface-3); }
  .rd-van { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--star-500); color: #1A1300; flex-shrink: 0; }
  .rd-van svg { width: 20px; height: 20px; }
  .rd-labels { display: flex; justify-content: space-between; gap: 8px; }
  .rd-lab { display: flex; flex-direction: column; gap: 1px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--text-3); }
  .rd-lab b { font-size: 14px; font-weight: 700; color: var(--text); }
  .rd-lab--c { align-items: center; text-align: center; }
  .rd-lab--r { align-items: flex-end; text-align: right; }
  .frame .rd-body .m-banner { margin: 0; }
  .rd-foot { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .rd-voice { display: flex; align-items: center; gap: 8px; min-height: 24px; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .rd-voice svg { width: 18px; height: 18px; color: var(--star-400); flex-shrink: 0; }
  .rd-link { display: flex; align-items: center; gap: 6px; height: 48px; font-size: 15px; font-weight: 700; color: #A9B4FF; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; flex-shrink: 0; }
  .rd-link svg { width: 16px; height: 16px; }
  .frame .m-btn.rd-btn--wait { opacity: .5; box-shadow: none; }
  .frame .m-btn.rd-btn--off { height: 52px; background: transparent; border: 1.5px dashed var(--st-offline-bd); color: var(--st-offline-fg); box-shadow: none; font-family: var(--font-ui); font-size: 15px; font-weight: 700; }
  .frame .m-btn.rd-btn--off svg { width: 18px; height: 18px; }
  .rd-trend { display: flex; flex-direction: column; gap: 6px; }
  .rd-trend__l { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-3); }
  .rd-trend__l b { color: var(--st-deferred-fg); font-weight: 700; }
  .frame .m-hero.rd-hero--warn { background: var(--tint-warn); box-shadow: inset 0 0 0 1.5px var(--st-deferred-bd); }
  .frame .rd-hero--warn .m-hero__value { color: var(--st-deferred-fg); }
  .rd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 16px; }
  .rd-chip { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 18px 0 14px; border-radius: 16px; background: var(--surface-2); font-size: 16px; font-weight: 700; color: var(--text); white-space: nowrap; }
  .rd-chip svg { width: 20px; height: 20px; color: var(--text-2); flex-shrink: 0; }
  .rd-chip.is-on { background: var(--tint-warn); box-shadow: inset 0 0 0 2px var(--star-500); }
  .rd-chip.is-on svg { color: var(--star-400); }
  .frame .m-stepper.rd-step .m-stepper__v { min-width: 72px; font-size: 22px; }
  .frame .m-stepper.rd-step .m-stepper__v small { font-size: 13px; font-weight: 700; margin-left: 3px; color: var(--text-2); }
</style>
<link rel="stylesheet" href="/assets/modern.css">
<link rel="stylesheet" href="/assets/ui2.css">
</head>
<body>
<main class="board" data-name="Driver · complete app screens" style="gap:72px;">
  <header class="section__head" style="max-width:1500px;">
    <div class="section__kicker">Prototype screens · Lodestar Run · phone PWA, offline-first</div>
    <h2 class="section__title">Driver · complete app screens</h2>
    <p class="section__desc">Ruwan Bandara, reefer van <span class="id">VEH057</span>, Kandy Hub to Nuwara Eliya, Tue 7 Apr 2026. 42 frames from first launch to end of shift, night-run by default with daylight variants. Tab bar (Run · Records · Dispatch) only on top-level screens.</p>
  </header>

  <!-- ================= Screen inventory ================= -->
  <section class="rx-sect" data-name="Screen inventory">
    <div class="rx-sect__head"><div class="rx-sect__n">#</div><div class="rx-sect__t">Screen inventory</div><div class="rx-sect__d">Tap targets for wiring the Figma prototype</div></div>
    <div class="rx-inv-wrap">
      <div class="rx-inv">
        <div class="rx-inv__r rx-inv__r--h"><div class="rx-inv__id">ID</div><div class="rx-inv__n">Screen</div><div class="rx-inv__l">Prototype links (tap → target)</div></div>
        <div class="rx-inv__r rx-inv__r--g">1 · Entry</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-05</div><div class="rx-inv__n">Splash</div><div class="rx-inv__l">After delay → DR-06</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-06</div><div class="rx-inv__n">Sign in · phone number</div><div class="rx-inv__l"><b>Send code</b> → DR-07</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-07</div><div class="rx-inv__n">Verify code</div><div class="rx-inv__l"><b>Verify</b> → DR-08 · back → DR-06</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-29</div><div class="rx-inv__n">Can't sign in</div><div class="rx-inv__l"><b>Resend code</b> → DR-07 · voice call → DR-07 · <b>Ask dispatch to verify you</b> → phone dialer · back → DR-07</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-08</div><div class="rx-inv__n">Permissions</div><div class="rx-inv__l"><b>Continue</b> → DR-09</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-09</div><div class="rx-inv__n">Language (optional)</div><div class="rx-inv__l"><b>Continue</b> or <b>Skip</b> → DR-10</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-10</div><div class="rx-inv__n">First-run tips</div><div class="rx-inv__l"><b>Got it</b> → DR-11</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-32</div><div class="rx-inv__n">Run moved to a new phone</div><div class="rx-inv__l"><b>Download today's run</b> → DR-13</div></div>
        <div class="rx-inv__r rx-inv__r--g">2 · Before the trip</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-11</div><div class="rx-inv__n">Load handover received</div><div class="rx-inv__l"><b>Accept load</b> → DR-12</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-12</div><div class="rx-inv__n">Pre-trip vehicle check</div><div class="rx-inv__l"><b>Checks done</b> → DR-13</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-13</div><div class="rx-inv__n">Saving run for offline</div><div class="rx-inv__l">When saved → DR-14 · voice pack still coming → DR-34</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-14</div><div class="rx-inv__n">Run ready · available offline</div><div class="rx-inv__l"><b>Open today's run</b> → DR-01</div></div>
        <div class="rx-inv__r rx-inv__r--g">3 · On the road</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-01</div><div class="rx-inv__n">Today's run</div><div class="rx-inv__l"><b>Start trip</b> → DR-36 · hero → DR-15 · star → DR-24 · moon → DR-01 day · tabs → DR-21, DR-23</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-01 · day</div><div class="rx-inv__n">Today's run · daylight</div><div class="rx-inv__l">Same links as DR-01 · sun → DR-01</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-15</div><div class="rx-inv__n">Route overview</div><div class="rx-inv__l"><b>Open in Google Maps</b> → external deep link · back → DR-01</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-15 · day</div><div class="rx-inv__n">Route overview · daylight</div><div class="rx-inv__l">Same links as DR-15</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR micro</div><div class="rx-inv__n">Vehicle moving lock</div><div class="rx-inv__l">Van stops → DR-02 (stop 1) or DR-19 (stop 2)</div></div>
        <div class="rx-inv__r rx-inv__r--g">3b · On the road · driving</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-36</div><div class="rx-inv__n">En route · driving mode</div><div class="rx-inv__l"><b>Arrived at stop 1</b> → DR-02 · <b>Report a delay</b> → DR-38 · reefer pill → DR-37 · <b>Open in Maps</b> → external deep link</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-37</div><div class="rx-inv__n">Reefer temperature alert</div><div class="rx-inv__l"><b>Checked, back to 3 °C</b> → DR-36 · <b>Call dispatch when signal</b> → phone dialer (once online) · back → DR-36</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-38</div><div class="rx-inv__n">Report a delay</div><div class="rx-inv__l"><b>Send when possible</b> → DR-36 · back → DR-36</div></div>
      </div>
      <div class="rx-inv">
        <div class="rx-inv__r rx-inv__r--h"><div class="rx-inv__id">ID</div><div class="rx-inv__n">Screen</div><div class="rx-inv__l">Prototype links (tap → target)</div></div>
        <div class="rx-inv__r rx-inv__r--g">4 · At the stop</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-02</div><div class="rx-inv__n">Stop arrival · Nuwara Eliya</div><div class="rx-inv__l"><b>Start delivery</b> → DR-03 · <b>Report a problem</b> → DR-17 · <b>Read aloud</b> → DR-35</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-17</div><div class="rx-inv__n">Report a problem</div><div class="rx-inv__l"><b>Next</b> → DR-18 · back → DR-02</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-18</div><div class="rx-inv__n">Problem detail · damaged</div><div class="rx-inv__l"><b>Save and back to count</b> → DR-03</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-03</div><div class="rx-inv__n">Proof of delivery</div><div class="rx-inv__l"><b>Complete stop</b> → Vehicle moving → DR-19 · <b>Use store OTP</b> → DR-16</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-16</div><div class="rx-inv__n">Store code (OTP)</div><div class="rx-inv__l"><b>Confirm with store code</b> → Vehicle moving → DR-19</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-19</div><div class="rx-inv__n">Stop 2 arrival · Hawa Eliya</div><div class="rx-inv__l"><b>Start delivery</b> → DR-20 · problem → DR-17</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-20</div><div class="rx-inv__n">Stop 2 proof of delivery</div><div class="rx-inv__l"><b>Complete stop</b> → DR-04 · OTP → DR-16</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-04</div><div class="rx-inv__n">Run complete</div><div class="rx-inv__l"><b>End shift</b> → DR-28 · tabs → DR-21, DR-23</div></div>
        <div class="rx-inv__r rx-inv__r--g">5 · Tabs</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-21</div><div class="rx-inv__n">Records</div><div class="rx-inv__l">Any row → DR-22 · "All synced" pill → DR-26 · tabs → DR-01, DR-23</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-22</div><div class="rx-inv__n">Record detail · POD</div><div class="rx-inv__l">Back → DR-21</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-23</div><div class="rx-inv__n">Dispatch notices</div><div class="rx-inv__l"><b>Call dispatch</b> → phone dialer · notice 8:43 → DR-27 · tabs → DR-01, DR-21</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-24</div><div class="rx-inv__n">Settings · me</div><div class="rx-inv__l"><b>Language and voice</b> → DR-33 · <b>Sign out</b> → DR-06 · back → DR-01</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-33</div><div class="rx-inv__n">Voice and language</div><div class="rx-inv__l"><b>Play a test line</b> → DR-35 · back → DR-24</div></div>
        <div class="rx-inv__r rx-inv__r--g">6 · States</div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-25</div><div class="rx-inv__n">Connection banner states</div><div class="rx-inv__l">Component sheet, no links (swap into DR-01, DR-02, DR-21)</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-26</div><div class="rx-inv__n">Sync in progress</div><div class="rx-inv__l">When sent → DR-27</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-27</div><div class="rx-inv__n">Sync conflict notice</div><div class="rx-inv__l"><b>Got it</b> → DR-04</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-28 (+ day)</div><div class="rx-inv__n">End of shift summary</div><div class="rx-inv__l"><b>Close shift</b> → DR-06 (signed out)</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-30</div><div class="rx-inv__n">Session expired while offline</div><div class="rx-inv__l"><b>Continue run</b> → DR-01 · <b>Sign in when you have signal</b> → DR-06 (once online)</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-31</div><div class="rx-inv__n">Update required</div><div class="rx-inv__l"><b>Continue run</b> → DR-04 · <b>Update on depot Wi-Fi</b> → DR-04 (reminder at End shift)</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-34</div><div class="rx-inv__n">Voice pack downloading</div><div class="rx-inv__l">Starts on depot Wi-Fi after DR-12 (3:38) · <b>Continue</b> → DR-13 (download keeps going) · <b>Skip voice for today</b> → DR-13</div></div>
        <div class="rx-inv__r"><div class="rx-inv__id">DR-35</div><div class="rx-inv__n">Stop arrival · speaking</div><div class="rx-inv__l"><b>Speaking</b> (pause) → DR-02 · <b>Start delivery</b> → DR-03 · problem → DR-17</div></div>
      </div>
    </div>
  </section>

  <!-- ================= 1 · Entry ================= -->
  <section class="rx-sect" data-name="1 · Entry">
    <div class="rx-sect__head"><div class="rx-sect__n">1</div><div class="rx-sect__t">Entry</div><div class="rx-sect__d">First launch at Kandy Hub, 3:18 AM. Sign in once; setup is skippable after day one.</div></div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-05</span>Splash</div><div class="rx-cap">Brand moment while today's run loads. Auto → DR-06</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-05 Splash · phone">
            <div class="m-screen rx-splash">
              <div class="rx-sky">
                <i style="left:40px; top:90px; opacity:.7;"></i><i style="left:96px; top:150px; opacity:.4;"></i><i style="left:300px; top:80px; opacity:.6;"></i><i style="left:330px; top:190px; opacity:.35;"></i><i style="left:220px; top:120px; opacity:.5;"></i><i style="left:60px; top:260px; opacity:.35;"></i><i style="left:150px; top:60px; opacity:.45;"></i><i style="left:280px; top:300px; opacity:.4;"></i><i style="left:24px; top:380px; opacity:.3;"></i><i style="left:350px; top:420px; opacity:.3;"></i>
              </div>
              <svg class="rx-hills" viewBox="0 0 374 260" preserveAspectRatio="none"><path d="M0 150 C 50 110, 90 120, 130 92 C 170 64, 200 96, 240 80 C 280 64, 320 70, 374 40 L374 260 L0 260 Z" fill="#26327A" opacity=".7"/><path d="M0 200 C 60 160, 110 176, 160 150 C 210 124, 250 160, 300 140 C 330 128, 352 132, 374 120 L374 260 L0 260 Z" fill="#0A0F2E"/></svg>
              <div class="statusbar"><span class="mono">3:18</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="rx-splash__c">
                <div class="rx-star"><svg width="64" height="64" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="rx-brand">Lodestar <span>Run</span></div>
                <div class="rx-tagline">Every order, one thread.</div>
              </div>
              <div class="rx-splash__foot">
                <div class="m-progress m-progress--star"><div style="width:55%;"></div></div>
                <span>Checking for today's run</span>
                <span class="rx-splash__by">Waypoint Lodestar · for Waypoint Group</span>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-06</span>Sign in</div><div class="rx-cap">Phone number, no password. <b>Send code</b> → DR-07</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-06 Sign in · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:18</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Lodestar Run</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-pt">
                <div class="m-title">
                  <div class="m-h1">Sign in with your phone</div>
                  <div class="m-sub">Use the mobile number Kandy Hub has for you. We'll text you a 6-digit code.</div>
                </div>
                <div class="rx-field">
                  <div class="rx-cc"><small>LK</small>+94</div>
                  <div class="rx-num">77 234 5610<span class="rx-caret"></span></div>
                </div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>The code comes by SMS, so a weak signal is fine.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Send code<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              </div>
              <div class="rx-keys">
                <div class="rx-keys__r"><div class="rx-key">1</div><div class="rx-key">2</div><div class="rx-key">3</div></div>
                <div class="rx-keys__r"><div class="rx-key">4</div><div class="rx-key">5</div><div class="rx-key">6</div></div>
                <div class="rx-keys__r"><div class="rx-key">7</div><div class="rx-key">8</div><div class="rx-key">9</div></div>
                <div class="rx-keys__r"><div class="rx-key rx-key--flat"></div><div class="rx-key">0</div><div class="rx-key rx-key--flat"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-07</span>Verify code</div><div class="rx-cap">Code auto-fills from the SMS. <b>Verify</b> → DR-08</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-07 Verify code · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:19</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Verify</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-pt">
                <div class="m-title">
                  <div class="m-h1">Enter the code</div>
                  <div class="m-sub">Sent to <b style="color:var(--text);">+94 77 234 5610</b></div>
                </div>
                <div class="rx-otp">
                  <div class="rx-otp__c is-ok">4</div><div class="rx-otp__c is-ok">8</div><div class="rx-otp__c is-ok">2</div><div class="rx-otp__c is-ok">1</div><div class="rx-otp__c is-ok">9</div><div class="rx-otp__c is-ok">3</div>
                </div>
                <div class="rx-hint" style="justify-content:space-between;"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Filled from SMS</span><span style="color:var(--text-3);">Resend in 0:24</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Verify</div>
              </div>
              <div class="rx-keys">
                <div class="rx-keys__r"><div class="rx-key">1</div><div class="rx-key">2</div><div class="rx-key">3</div></div>
                <div class="rx-keys__r"><div class="rx-key">4</div><div class="rx-key">5</div><div class="rx-key">6</div></div>
                <div class="rx-keys__r"><div class="rx-key">7</div><div class="rx-key">8</div><div class="rx-key">9</div></div>
                <div class="rx-keys__r"><div class="rx-key rx-key--flat"></div><div class="rx-key">0</div><div class="rx-key rx-key--flat"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-29</span>Can't sign in</div><div class="rx-cap">Help when no code arrives. <b>Resend code</b> → DR-07</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-29 Can't sign in · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:20</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Sign-in help</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Code sent 3:19 to +94 77 234 5610</div>
                  <div class="m-h1">Didn't get a code?</div>
                  <div class="m-sub">A new code is ready to send now. If SMS keeps failing, try one of these.</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Get the code by voice call</div><div class="m-row__meta">An automatic call reads out the 6 digits.</div></div>
                    <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Ask dispatch to verify you</div><div class="m-row__meta">Call Kandy Hub dispatch. They confirm it's you and unlock sign-in.</div></div>
                    <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg><div class="m-banner__txt"><b>Run already saved on this phone?</b><span>Keep delivering. You only need to sign in to send records.</span></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Resend code</div>
                <div class="rx-note">Codes can take up to 2 minutes on a weak signal.</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-08</span>Permissions</div><div class="rx-cap">Each permission says why it's needed. <b>Continue</b> → DR-09</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-08 Permissions · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:19</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Set up</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Step 1 of 3</div>
                  <div class="m-h1">Three things the app needs</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Location</div><div class="m-row__meta">Saves arrival time and place at each stop, even with no signal.</div></div>
                    <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>On</span>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Camera</div><div class="m-row__meta">Photos of damaged goods and proof of delivery.</div></div>
                    <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>On</span>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Notifications</div><div class="m-row__meta">Plan changes from dispatch, even with the app closed.</div></div>
                    <div class="rx-allow">Allow</div>
                  </div>
                </div>
                <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg><div class="m-banner__txt"><b>Location only while on shift</b><span>It stops the moment you tap End shift.</span></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Continue<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-09</span>Language</div><div class="rx-cap">Optional step. <b>Continue</b> or <b>Skip</b> → DR-10</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-09 Language · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:20</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Set up</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Step 2 of 3 <span class="m-sep"></span> optional</div>
                  <div class="m-h1">Choose your language</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--sel">
                    <div class="m-row__lead rx-lead--glyph">A</div>
                    <div class="m-row__main"><div class="m-row__title">English</div><div class="m-row__meta">Current</div></div>
                    <div class="rx-radio is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead rx-lead--glyph">අ</div>
                    <div class="m-row__main"><div class="m-row__title">සිංහල</div><div class="m-row__meta">Sinhala</div></div>
                    <div class="rx-radio"></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__lead rx-lead--glyph">அ</div>
                    <div class="m-row__main"><div class="m-row__title">தமிழ்</div><div class="m-row__meta">Tamil</div></div>
                    <div class="rx-radio"></div>
                  </div>
                </div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>Store names, order numbers and times stay the same in every language.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Continue<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost">Skip for now</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-10</span>First-run tips</div><div class="rx-cap">Three rules before the first run. <b>Got it</b> → DR-11</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-10 First-run tips · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:20</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Set up</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Step 3 of 3</div>
                  <div class="m-h1">Use it only when you're stopped</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--warn rx-lead--lg"><svg class="ic" viewBox="0 0 24 24"><path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M9 9v6M15 9v6"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Stopped, not driving</div><div class="m-row__meta">While the van moves, you only see the next stop in big type. Buttons wait until you stop.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead rx-lead--off rx-lead--lg"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Works without signal</div><div class="m-row__meta">Your run is saved on this phone. Records send by themselves when signal returns.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--ok rx-lead--lg"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Call, don't type</div><div class="m-row__meta">Dispatch sends notices to you. To talk, tap Call dispatch.</div></div>
                  </div>
                </div>
                <div class="rx-dots"><i></i><i></i><i class="is-on"></i></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Got it</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-32</span>Run moved to a new phone</div><div class="rx-cap">Old phone lost. <b>Download today's run</b> → DR-13</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-32 Run moved to a new phone · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:38</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">New phone</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Signed in 3:38 · Ruwan Bandara</div>
                  <div class="rx-hv">Today's run is ready to download</div>
                  <div class="m-hero__meta">Restored from the server. Save it here before you leave hub Wi-Fi.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Restored from the server</b><span><span class="id">VEH057</span></span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Plan v3 · 2 stops</div><div class="m-row__meta">Trip 1 · Fresh · Nuwara Eliya</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Load accepted 3:34</div><div class="m-row__meta">3 orders · 1 shortfall noted</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dispatch notices</div><div class="m-row__meta">Shortfall acknowledged 3:24</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--warn"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg><div class="m-banner__txt"><b>Old phone last synced 3:36</b><span>Anything saved after that is still on it. Hand the old phone to the depot; admin will recover or revoke it.</span></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Download today's run</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 2 · Before the trip ================= -->
  <section class="rx-sect" data-name="2 · Before the trip">
    <div class="rx-sect__head"><div class="rx-sect__n">2</div><div class="rx-sect__t">Before the trip</div><div class="rx-sect__d">Bay K2, 3:35 to 3:41: take the load from Kasun, check the van, then save the final run for offline.</div></div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-11</span>Load handover received</div><div class="rx-cap">What the dock released. <b>Accept load</b> → DR-12</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-11 Load handover received · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:35</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Load handover</div>
                <span class="m-pill"><span class="id">VEH057</span></span>
              </div>
              <div class="m-body rx-g14">
                <div class="m-hero">
                  <div class="m-hero__label">Released by Kasun J. · Bay K2 · 3:34</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">3<small>orders</small></div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>Sealed</span>
                  </div>
                  <div class="m-hero__meta">22 lines · 988 of 1,040 kg · 4.6 of 7.0 m³</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--warn m-row--tall">
                    <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">1 shortfall · yoghurt 80 g</div><div class="m-row__meta">2 of 6 cases short (stock). Dispatch acknowledged 3:24; credit + follow-up Wed 8 Apr.</div></div>
                  </div>
                  <div class="m-row">
                    <div class="m-row__main"><div class="m-row__title">I've seen the shortfall</div><div class="m-row__meta">Stop 1 will expect 32 chilled, not 34</div></div>
                    <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>On the van</b><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Reefer 3 °C</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 1 · chilled</div><div class="m-row__meta"><span class="id">ORD0104217</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">32</span><span class="m-row__unit">of 34</span></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 1 · dry</div><div class="m-row__meta"><span class="id">ORD0104216</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">units</span></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 2 · chilled</div><div class="m-row__meta"><span class="id">ORD0104209</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">28</span><span class="m-row__unit">units</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Accept load</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-12</span>Pre-trip vehicle check</div><div class="rx-cap">Reefer and seal read from photos. <b>Checks done</b> → DR-13</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-12 Pre-trip vehicle check · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:37</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Pre-trip check</div>
                <span class="m-pill"><span class="id">VEH057</span></span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Reefer · your reading 3:37</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">3 °C</div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>Cold enough</span>
                  </div>
                  <div class="m-hero__meta">Must be ≤ 4 °C. Dock read 3 °C at 3:32.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Walk-around</b><span>5 of 5 done</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Reefer temperature</div><div class="m-row__meta"><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>3 °C</span><span class="m-sep"></span>needs ≤ 4 °C</div><div class="m-row__meta"><span class="cv-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Read from display photo</span></div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Seal <span class="id">KDY-57-10413</span></div><div class="m-row__meta"><span class="cv-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Read from seal photo · matches</span></div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Fuel</div><div class="m-row__meta">Enough for 170 km (about 17 L)</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Tyres</div><div class="m-row__meta">Pressure and tread look fine</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Lights and wipers</div><div class="m-row__meta">Hill fog and rain likely today</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Checks done</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Something's wrong with the van</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-13</span>Saving run for offline</div><div class="rx-cap">Final run saved to the phone on hub Wi-Fi. Auto → DR-14</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-13 Saving run for offline · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body">
                <div class="m-hero">
                  <div class="m-hero__label">Saving your run to this phone</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">82<small>%</small></div>
                    <span class="m-pill m-pill--info"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Kandy Hub Wi-Fi</span>
                  </div>
                  <div class="m-progress m-progress--star"><div style="width:82%;"></div></div>
                  <div class="m-hero__meta">About 10 seconds left</div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="m9 3-6 3v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Route and 2 stops</div><div class="m-row__meta">170 km · hill road</div></div>
                    <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">3 orders</div><div class="m-row__meta">as loaded 3:34</div></div>
                    <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">22 lines</div><div class="m-row__meta">for counting at the door</div></div>
                    <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Store notes and photos</div><div class="m-row__meta">1.4 of 2.1 MB</div></div>
                    <div class="rx-tick rx-tick--busy"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></div>
                  </div>
                </div>
                <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><div class="m-banner__txt"><b>Signal drops above Ramboda</b><span>Once this is saved, you won't need it.</span></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn rx-btn--wait">Saving, one moment</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-14</span>Run ready</div><div class="rx-cap">Proof the run is on the phone. <b>Open today's run</b> → DR-01</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-14 Run ready · available offline · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body">
                <div class="m-hero rx-hero--ok">
                  <div class="m-hero__row" style="align-items:center; justify-content:flex-start; gap:14px;">
                    <div class="rx-okdot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="rx-hv">Available offline</div>
                  </div>
                  <div class="m-hero__meta">Saved <b style="color:var(--text);">3:41</b> on this phone. Everything below works with no signal.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Saved on this phone</b><span>2.1 MB</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="m9 3-6 3v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Route · 2 stops</div><div class="m-row__meta">Nuwara Eliya, Hawa Eliya</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">3 orders · 22 lines</div><div class="m-row__meta">1 shortfall noted</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Store notes and photos</div><div class="m-row__meta">Dock directions, receiver phone numbers</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Plan v3</div><div class="m-row__meta">published Mon 6:40 PM</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </div>
                  </div>
                </div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>If dispatch changes the plan while you have no data, it comes by SMS.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Open today's run<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 3 · On the road ================= -->
  <section class="rx-sect" data-name="3 · On the road">
    <div class="rx-sect__head"><div class="rx-sect__n">3</div><div class="rx-sect__t">On the road</div><div class="rx-sect__d">Departs 3:40. No in-app turn-by-turn: Google Maps does navigation, Lodestar Run keeps the stops.</div></div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-01</span>Today's run</div><div class="rx-cap">Home for the day. <b>Start trip</b> → DR-36; hero → DR-15</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-01 Today's run">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Offline-ready</span>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></div>
              </div>
              <div class="m-body dv-tight">
                <div class="m-title">
                                    <div class="m-h1">Good morning, Ruwan</div>
                </div>
                <div class="m-hero vo-card">
                  <div class="vo-ico"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div>
                  <div class="m-hero__label">First stop · Waypoint Fresh Nuwara Eliya</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">~6:35<small>ETA</small></div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="m-hero__meta">Plan 5:31 · model ~6:35 (monsoon hill road)</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Trip 1 · Fresh · Nuwara Eliya</b><span>2 stops · no Trip 2</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--star">1</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Nuwara Eliya</div>
                        <div class="m-row__meta"><span class="id">OUT106</span><span class="m-sep"></span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>2 orders</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">~6:35</span><span class="m-row__unit">05:30–08:00</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead">2</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Hawa Eliya</div>
                        <div class="m-row__meta"><span class="id">OUT108</span><span class="m-sep"></span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>1 order</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">~7:25</span><span class="m-row__unit">04:00–07:45</span></div>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--warn">
                  <svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>
                  <div class="m-banner__txt"><b>2 cases yoghurt short</b><span>Flagged 3:21 · dispatch acknowledged</span></div>
                </div>
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>
                  <div class="m-banner__txt"><b>Saved 3:41 · works without signal</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Start trip</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-01</span>Today's run · Daylight</div><div class="rx-cap">After sunrise, auto day mode. Sun icon → DR-01</div></div>
<div class="frame frame--phone mode-driver-day" data-name="DR-01 Today's run · Daylight">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">12:15</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Offline-ready</span>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></div>
              </div>
              <div class="m-body dv-tight">
                <div class="m-title">
                                    <div class="m-h1" style="font-size:27px;">Good afternoon, Ruwan</div>
                </div>
                <div class="m-hero">
                  <div class="m-hero__label">First stop · Waypoint Fresh Nuwara Eliya</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">~6:35<small>ETA</small></div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="m-hero__meta">Plan 5:31 · model ~6:35 (monsoon hill road)</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Trip 1 · Fresh · Nuwara Eliya</b><span>2 stops · no Trip 2</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--star">1</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Nuwara Eliya</div>
                        <div class="m-row__meta"><span class="id">OUT106</span><span class="m-sep"></span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>2 orders</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">~6:35</span><span class="m-row__unit">05:30–08:00</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead">2</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Hawa Eliya</div>
                        <div class="m-row__meta"><span class="id">OUT108</span><span class="m-sep"></span><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>1 order</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">~7:25</span><span class="m-row__unit">04:00–07:45</span></div>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--warn">
                  <svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>
                  <div class="m-banner__txt"><b>2 cases yoghurt short</b><span>Flagged 3:21 · dispatch acknowledged</span></div>
                </div>
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>
                  <div class="m-banner__txt"><b>Saved 3:41 · works without signal</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Start trip</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-15</span>Route overview</div><div class="rx-cap">Whole trip at a glance. <b>Open in Google Maps</b> → external</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-15 Route overview · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Route</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Offline-ready</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Trip 1 · Fresh · Nuwara Eliya</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">170<small>km</small></div>
                    <span class="m-pill"><span class="dot"></span>Hill road</span>
                  </div>
                  <div class="m-hero__meta">Plan 5:31 · model ~6:35 (monsoon hill road)</div>
                </div>
                <div class="m-group">
                  <div class="rx-route">
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg></div><div class="rx-rt__line"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Kandy Hub · Bay K2</div><div class="rx-rt__m">78 km to stop 1 · ~2 h 55 m</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">3:40</span><span class="m-row__unit">leave</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node rx-rt__node--off"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg></div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Above Ramboda</div><div class="rx-rt__m">Signal usually drops here. The app keeps working.</div></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node rx-rt__node--star">1</div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Nuwara Eliya · <span class="id">OUT106</span></div><div class="rx-rt__m">Rear dock · 05:30–08:00 · then 14 km</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">~6:35</span><span class="m-row__unit">ETA</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node">2</div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Hawa Eliya · <span class="id">OUT108</span></div><div class="rx-rt__m">Rear dock · 04:00–07:45 · then 78 km back</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">~7:25</span><span class="m-row__unit">ETA</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Back to Kandy Hub</div><div class="rx-rt__m">Signal returns near Pussellawa</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">9:30</span><span class="m-row__unit">about</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Open in Google Maps</div>
                <div class="rx-note">Turn-by-turn runs in Google Maps. Your stops stay here.</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-15</span>Route overview · Daylight</div><div class="rx-cap">Daylight variant for checking the route after sunrise.</div></div>
<div class="frame frame--phone mode-driver-day" data-name="DR-15 Route overview · phone · daylight">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Route</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Offline-ready</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Trip 1 · Fresh · Nuwara Eliya</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">170<small>km</small></div>
                    <span class="m-pill"><span class="dot"></span>Hill road</span>
                  </div>
                  <div class="m-hero__meta">Plan 5:31 · model ~6:35 (monsoon hill road)</div>
                </div>
                <div class="m-group">
                  <div class="rx-route">
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg></div><div class="rx-rt__line"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Kandy Hub · Bay K2</div><div class="rx-rt__m">78 km to stop 1 · ~2 h 55 m</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">3:40</span><span class="m-row__unit">leave</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node rx-rt__node--off"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg></div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Above Ramboda</div><div class="rx-rt__m">Signal usually drops here. The app keeps working.</div></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node rx-rt__node--star">1</div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Nuwara Eliya · <span class="id">OUT106</span></div><div class="rx-rt__m">Rear dock · 05:30–08:00 · then 14 km</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">~6:35</span><span class="m-row__unit">ETA</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node">2</div><div class="rx-rt__line rx-rt__line--dash"></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Hawa Eliya · <span class="id">OUT108</span></div><div class="rx-rt__m">Rear dock · 04:00–07:45 · then 78 km back</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">~7:25</span><span class="m-row__unit">ETA</span></div>
                    </div>
                    <div class="rx-rt">
                      <div class="rx-rt__rail"><div class="rx-rt__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg></div></div>
                      <div class="rx-rt__main"><div class="rx-rt__t">Back to Kandy Hub</div><div class="rx-rt__m">Signal returns near Pussellawa</div></div>
                      <div class="rx-rt__trail"><span class="m-row__value">9:30</span><span class="m-row__unit">about</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Open in Google Maps</div>
                <div class="rx-note">Turn-by-turn runs in Google Maps. Your stops stay here.</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head" style="width:300px;"><div class="screen-label"><span class="screen-label__id">DR</span>micro-state · Vehicle moving</div><div class="rx-cap">Van moving: next stop only. Stops → DR-02</div></div>
<div class="frame mode-driver" data-name="DR micro-state · Vehicle moving" style="width:300px; height:300px; border-radius:28px; border:6px solid #10131C; box-shadow:var(--shadow-2); flex-shrink:0;">
            <div class="m-screen" style="gap:14px; padding:16px;">
              <span class="m-pill" style="align-self:flex-start;"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Moving · locked to next stop</span>
              <div class="vstack" style="gap:4px;">
                <div class="m-eyebrow">Next stop · <span class="id">OUT106</span></div>
                <div class="m-h1">Nuwara Eliya</div>
              </div>
              <div class="m-hero__row" style="justify-content:flex-start; gap:16px;">
                <div class="m-hero__value" style="color:var(--star-400); font-size:44px;">6:35<small>ETA</small></div>
                <div class="vstack" style="gap:2px; padding-bottom:2px;"><span class="m-eyebrow">Window</span><span class="mono" style="font-size:15px; font-weight:700; white-space:nowrap;">05:30–08:00</span></div>
              </div>
              <div class="spacer"></div>
              <span class="m-tag" style="color:var(--st-offline-fg);"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline since 4:38 · all saved</span>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 3b · On the road (driving) ================= -->
  <section class="rx-sect" data-name="3b · On the road">
    <div class="rx-sect__head"><div class="rx-sect__n">3b</div><div class="rx-sect__t">On the road · driving</div><div class="rx-sect__d">Kandy Hub to Nuwara Eliya, about 2 hours. Eyes on the road, works offline, protects the cold chain, gives honest ETAs.</div></div>
    <div class="rx-subhead">Offline from 4:38 above Ramboda · arrives <span class="id">OUT106</span> 6:33</div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-36</span>En route · driving mode</div><div class="rx-cap">Big type, one glance. <b>Arrived at stop 1</b> → DR-02 · <b>Report a delay</b> → DR-38 · reefer pill → DR-37</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-36 En route · driving mode · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">5:10</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="rd-top">
                <div class="rd-mode"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Driving mode</div>
                <div class="rd-temp" data-name="Reefer pill → DR-37"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg><span>Reefer 3 °C</span>· OK</div>
              </div>
              <div class="rd-body">
                <div class="rd-next">
                  <div class="rd-eyebrow">Next stop · 1 of 2</div>
                  <div class="rd-stop">Nuwara Eliya</div>
                  <div class="rd-meta"><span class="id">OUT106</span> · rear dock</div>
                </div>
                <div class="rd-eta">
                  <div class="rd-eta__v">~6:35</div>
                  <div class="rd-eta__side"><b>ETA</b><span>likely 6:15–6:55</span></div>
                </div>
                <div class="rd-prog">
                  <div class="rd-track">
                    <div class="rd-node"></div>
                    <div class="rd-seg"></div>
                    <div class="rd-node"></div>
                    <div class="rd-seg rd-seg--off" style="flex:.35;"></div>
                    <div class="rd-van"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                    <div class="rd-seg rd-seg--todo" style="flex:.65;"></div>
                    <div class="rd-node rd-node--end"></div>
                  </div>
                  <div class="rd-labels">
                    <div class="rd-lab"><b>Kandy Hub</b>left 3:40</div>
                    <div class="rd-lab rd-lab--c"><b>Ramboda</b>passed</div>
                    <div class="rd-lab rd-lab--r"><b>Nuwara Eliya</b>~6:35</div>
                  </div>
                </div>
                <div class="m-banner m-banner--offline">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>
                  <div class="m-banner__txt"><b>No signal since 4:38 · run saved on phone</b></div>
                </div>
                <div class="rd-foot">
                  <div class="rd-voice"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Voice: next stop in 85 min</div>
                  <div class="rd-link"><svg class="ic" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Open in Maps</div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn rd-btn--wait"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>Arrived at stop 1</div>
                <div class="rx-note">Tap when parked · unlocks when the van stops</div>
                <div class="m-btn m-btn--secondary"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Report a delay</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-37</span>Reefer temperature alert</div><div class="rx-cap">Chilled load warming, logged offline. <b>Checked, back to 3 °C</b> → DR-36</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-37 Reefer temperature alert · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">5:52</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Reefer · <span class="id">VEH057</span></div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body rx-g14 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Chilled load · 3 chilled orders on board</div>
                  <div class="m-h2">Reefer at 6 °C, needs ≤ 4 °C</div>
                </div>
                <div class="m-hero rd-hero--warn">
                  <div class="m-hero__row">
                    <div class="m-hero__value">6 °C<small>now</small></div>
                    <span class="m-pill m-pill--warn"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Too warm</span>
                  </div>
                  <div class="rd-trend">
                    <svg width="302" height="60" viewBox="0 0 302 60" fill="none">
                      <line x1="0" y1="30" x2="302" y2="30" stroke="#8F98AA" stroke-width="1.5" stroke-dasharray="5 5"/>
                      <polyline points="0,45 38,45 76,44 113,42 151,36 189,28 227,20 264,13 298,10" stroke="#FFC266" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="297" cy="10" r="4.5" fill="#FFC266"/>
                    </svg>
                    <div class="rd-trend__l"><span>5:32</span><span>dashed line = 4 °C limit</span><b>5:52</b></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>What to do</b><span>keep driving until safe</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead">1</div>
                      <div class="m-row__main"><div class="m-row__title">Pull over when safe</div><div class="m-row__meta">Not on a bend or the narrow pass</div></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead">2</div>
                      <div class="m-row__main"><div class="m-row__title">Check the rear door seal</div><div class="m-row__meta">Close it fully, look for a gap</div></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead">3</div>
                      <div class="m-row__main"><div class="m-row__title">Set the reefer to 2 °C</div><div class="m-row__meta">It should read ≤ 4 °C in about 10 min</div></div>
                    </div>
                  </div>
                </div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><span>Logged on this phone at 5:52, sent to dispatch when signal returns.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Checked, back to 3 °C</div>
                <div class="m-btn rd-btn--off"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch when signal</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-38</span>Report a delay</div><div class="rx-cap">Two taps, queued offline. <b>Send when possible</b> → DR-36</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-38 Report a delay · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:05</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Report a delay</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body rx-g14 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">On the way to stop 1 · <span class="id">OUT106</span></div>
                  <div class="m-h2">What's slowing you?</div>
                </div>
                <div class="rd-chips">
                  <div class="rd-chip"><svg class="ic" viewBox="0 0 24 24"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>Landslide or rock fall</div>
                  <div class="rd-chip is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 17H7M17 21H9"/></svg>Heavy rain or fog</div>
                  <div class="rd-chip"><svg class="ic" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>Traffic</div>
                  <div class="rd-chip"><svg class="ic" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Vehicle issue</div>
                  <div class="rd-chip"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>Other</div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__main"><div class="m-row__title">Expected delay</div><div class="m-row__meta">Stop 1 now ~6:45</div></div>
                    <div class="m-stepper dv-step rd-step"><div class="m-stepper__b">−</div><div class="m-stepper__v">+10<small>min</small></div><div class="m-stepper__b">+</div></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>What happens</b><span>when signal returns</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dispatch</div><div class="m-row__meta">New ETA and your reason</div></div>
                      <span class="m-pill m-pill--offline">Queued</span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">OUT106</span> and <span class="id">OUT108</span></div><div class="m-row__meta">Stores get a new ETA</div></div>
                      <span class="m-pill m-pill--offline">Queued</span>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title"><span class="id">OUT108</span> late risk</div><div class="m-row__meta">Window closes 07:45</div></div>
                      <span class="m-pill m-pill--warn">Now high</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Send when possible</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 4 · At the stop ================= -->
  <section class="rx-sect" data-name="4 · At the stop">
    <div class="rx-sect__head"><div class="rx-sect__n">4</div><div class="rx-sect__t">At the stop</div><div class="rx-sect__d">No signal from 4:38. Everything below is saved on the phone and syncs at 8:40.</div></div>
    <div class="rx-subhead">Stop 1 · Nuwara Eliya <span class="id">OUT106</span> · 6:33 to 7:02</div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-02</span>Stop arrival</div><div class="rx-cap">Arrived. <b>Start delivery</b> → DR-03; problem → DR-17</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-02 Stop arrival">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:33</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Stop 1 of 2</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Saved on phone</span>
              </div>
              <div class="m-body dv-tight dv-tight-b vo-fit">
                <div class="m-hero">
                  <div class="m-hero__label">Stop 1 · Waypoint Fresh · <span class="id">OUT106</span></div>
                  <div class="m-hero__value dv-name">Nuwara Eliya</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <span class="m-hero__meta">Window <b class="mono" style="color:var(--text);">05:30–08:00</b></span>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="vo-hrow"><div class="dv-check"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg><span>Arrived <b>6:33</b><br>time + GPS saved</span></div><div class="vo-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Read aloud</div></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Where to unload</b><span>written by the store</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Rear dock · normal access</div>
                        <div class="m-row__meta">Enter via the Lawson St service lane; dock door opens 5:30.</div>
                      </div>
                    </div>
                    <div class="m-row dv-row-pad">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">M. Ilyas</div>
                        <div class="m-row__meta">Receiving</div>
                      </div>
                      <div class="dv-callbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call</div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>To drop · 2 orders</b><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled first</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Chilled</div>
                        <div class="m-row__meta"><span class="id">ORD0104217</span><span class="m-sep"></span>34 less 2 short</div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">32</span><span class="m-row__unit">units</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Dry</div>
                        <div class="m-row__meta"><span class="id">ORD0104216</span><span class="m-sep"></span>ambient</div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">units</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Start delivery<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Report a problem at this stop</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-17</span>Report a problem</div><div class="rx-cap">One big tap per problem, works offline. <b>Next</b> → DR-18</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-17 Report a problem · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:56</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Stop 1 · Nuwara Eliya</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Report a problem</div>
                  <div class="m-h1">What's wrong at this stop?</div>
                </div>
                <div class="rx-tiles">
                  <div class="rx-tile"><div class="rx-tile__ic"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg></div>Store closed</div>
                  <div class="rx-tile"><div class="rx-tile__ic"><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="6" rx="1"/><path d="M7 7l-3 6M13 7l-3 6M19 7l-3 6M5 13v8M19 13v8"/></svg></div>Access blocked</div>
                  <div class="rx-tile"><div class="rx-tile__ic"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0"/><path d="m17 8 5 5M22 8l-5 5"/></svg></div>Receiver refused</div>
                  <div class="rx-tile is-on"><div class="rx-tile__ic"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>Damaged goods</div>
                  <div class="rx-tile"><div class="rx-tile__ic rx-tile__ic--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg></div>Temperature</div>
                  <div class="rx-tile"><div class="rx-tile__ic"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div>Something else</div>
                </div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><span>Saved on the phone now. Dispatch gets it when signal returns.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Next<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch instead</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-18</span>Problem detail</div><div class="rx-cap">Item, photo, who's told. <b>Save and back to count</b> → DR-03</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-18 Problem detail · damaged goods · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:57</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Damaged goods</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Stop 1 · chilled <span class="id">ORD0104217</span></div>
                  <div class="m-h2">1 chicken tray crushed</div>
                  <span class="cv-hint"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Suggested from photo · <b>confirm</b></span>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__main"><div class="m-row__title">Chicken 1 kg tray</div><div class="m-row__meta">6 sent · damaged</div></div>
                    <div class="m-stepper dv-step"><div class="m-stepper__b">−</div><div class="m-stepper__v">1</div><div class="m-stepper__b">+</div></div>
                  </div>
                  <div class="m-row">
                    <div class="rx-photo84"><svg width="84" height="84" viewBox="0 0 52 52"><rect width="52" height="52" fill="#3a2f2a"/><rect x="6" y="16" width="40" height="26" rx="3" fill="#c9b99a"/><rect x="9" y="19" width="16" height="10" rx="2" fill="#e8c9a8"/><rect x="27" y="19" width="16" height="10" rx="2" fill="#e8c9a8"/><rect x="9" y="30" width="16" height="10" rx="2" fill="#e8c9a8"/><path d="M28 30 L44 42 M30 40 L42 30" stroke="#8a2a20" stroke-width="2.5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Photo 6:57</div><div class="m-row__meta">Saved on the phone</div></div>
                    <div class="dv-addphoto"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Add</div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Who's told</b></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Store, on the delivery</div><div class="m-row__meta">M. Ilyas sees it before signing</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Now</span>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead rx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dispatch</div><div class="m-row__meta">Sent first when signal returns</div></div>
                      <span class="m-pill m-pill--offline">Queued</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Save and back to count</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-03</span>Proof of delivery</div><div class="rx-cap">Count and sign. <b>Complete stop</b> → DR-19; OTP → DR-16</div></div>
<div class="frame frame--phone frame--tall mode-driver" data-name="DR-03 Proof of delivery">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:58</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Proof of delivery</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body dv-tight dv-tight-b dv-gap14">
                <div class="m-hero">
                  <div class="m-hero__label">Received · chilled <span class="id">ORD0104217</span></div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">31<small>of 34</small></div>
                    <span class="m-pill m-pill--bad"><span class="dot"></span>1 damaged</span>
                  </div>
                  <div class="m-hero__meta">2 short at the dock, locked · 1 tray crushed</div>
                  <div class="dv-threadwrap">
                    <div class="thread dv-thread">
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40</div></div>
                      <div class="thread__bar is-done"></div>
                      <div class="thread__step is-warn"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded −2</div><div class="thread__time">3:34</div></div>
                      <div class="thread__bar is-warn"></div>
                      <div class="thread__step is-now"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div><div class="thread__label">En route</div><div class="thread__time">now</div></div>
                      <div class="thread__bar"></div>
                      <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">·</div></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Chilled · 7 lines · unload first</b><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>5 others 22/22</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__main">
                        <div class="m-row__title">Yoghurt 80 g × 24</div>
                        <div class="m-row__meta"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>2 short at loading · Kasun 3:21</div>
                      </div>
                      <div class="dv-lock"><b>4</b>of 6</div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__main">
                        <div class="m-row__title">Chicken 1 kg</div>
                        <div class="m-row__meta">tray of 10 · 6 sent</div>
                      </div>
                      <div class="m-stepper dv-step"><div class="m-stepper__b">−</div><div class="m-stepper__v">5</div><div class="m-stepper__b">+</div></div>
                    </div>
                    <div class="m-row m-row--bad" style="flex-wrap:wrap; row-gap:4px;">
                      <div class="dv-thumb"><svg width="56" height="56" viewBox="0 0 52 52"><rect width="52" height="52" fill="#3a2f2a"/><rect x="6" y="16" width="40" height="26" rx="3" fill="#c9b99a"/><rect x="9" y="19" width="16" height="10" rx="2" fill="#e8c9a8"/><rect x="27" y="19" width="16" height="10" rx="2" fill="#e8c9a8"/><rect x="9" y="30" width="16" height="10" rx="2" fill="#e8c9a8"/><path d="M28 30 L44 42 M30 40 L42 30" stroke="#8a2a20" stroke-width="2.5"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">1 tray damaged</div>
                        <div class="m-row__meta"><span class="m-tag m-tag--bad"><span class="dot"></span>Crushed</span><span class="m-sep"></span>photo 6:57</div>
                      </div>
                      <div class="dv-addphoto"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Add</div>
                      <div class="cv-hint" style="flex-basis:100%; padding-left:70px;"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Suggested from photo · <b>confirm</b></div>
                    </div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Dry · all counted</div><div class="m-row__meta"><span class="id">ORD0104216</span><span class="m-sep"></span>9 lines</div></div>
                    <div class="dv-okval"><span class="m-row__value">58/58</span><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Received by M. Ilyas</b><span>receiving</span></div>
                  <div class="m-group">
                    <div class="dv-sigwrap">
                      <div class="dv-sig">
                        <svg width="215" height="64" viewBox="0 0 280 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 62 C 14 30, 22 10, 30 16 C 38 22, 26 58, 22 70 C 34 44, 46 28, 54 34 C 60 40, 50 60, 58 60 C 66 60, 72 36, 80 38 C 88 40, 82 62, 92 60 C 104 58, 108 26, 116 22 C 122 20, 118 58, 124 62 C 132 66, 140 40, 150 42 C 160 44, 152 60, 162 58 C 176 56, 184 44, 196 46"/><path d="M190 30 C 214 26, 238 28, 268 20"/></svg>
                        <div class="dv-sig__base"></div>
                        <div class="dv-sig__cap">Signed 6:58 · saved on phone</div>
                        <div class="dv-sig__clear">Clear</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5;"><path d="M20 6 9 17l-5-5"/></svg>Complete stop</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>Can't sign? Use store OTP</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-16</span>Store code (OTP)</div><div class="rx-cap">Receiver can't sign, code instead. <b>Confirm</b> → DR-19</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-16 Store code entry · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:58</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Store code</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="m-title">
                  <div class="m-eyebrow">Stop 1 · <span class="id">OUT106</span> · instead of a signature</div>
                  <div class="m-h2">Ask M. Ilyas for today's store code</div>
                </div>
                <div class="rx-otp rx-otp--big">
                  <div class="rx-otp__c is-ok">4</div><div class="rx-otp__c is-ok">7</div><div class="rx-otp__c is-ok">2</div><div class="rx-otp__c is-ok">9</div>
                </div>
                <div class="rx-hint" style="justify-content:center;"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Matches <span class="id">OUT106</span> · no signal needed</span></div>
                <div class="rx-hint"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>The store sees today's code in its Lodestar Store app. It changes every day.</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Confirm with store code</div>
              </div>
              <div class="rx-keys">
                <div class="rx-keys__r"><div class="rx-key">1</div><div class="rx-key">2</div><div class="rx-key">3</div></div>
                <div class="rx-keys__r"><div class="rx-key">4</div><div class="rx-key">5</div><div class="rx-key">6</div></div>
                <div class="rx-keys__r"><div class="rx-key">7</div><div class="rx-key">8</div><div class="rx-key">9</div></div>
                <div class="rx-keys__r"><div class="rx-key rx-key--flat"></div><div class="rx-key">0</div><div class="rx-key rx-key--flat"><svg class="ic" viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/></svg></div></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>

    <div class="rx-subhead">Stop 2 · Hawa Eliya <span class="id">OUT108</span> · 7:26 to 7:41, then trip done</div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-19</span>Stop 2 arrival</div><div class="rx-cap">One-order arrival. <b>Start delivery</b> → DR-20</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-19 Stop 2 arrival · Hawa Eliya · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">7:26</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Stop 2 of 2</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>5 waiting</span>
              </div>
              <div class="m-body dv-tight dv-tight-b">
                <div class="m-hero">
                  <div class="m-hero__label">Stop 2 · Waypoint Fresh · <span class="id">OUT108</span></div>
                  <div class="m-hero__value dv-name">Hawa Eliya</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <span class="m-hero__meta">Window <b class="mono" style="color:var(--text);">04:00–07:45</b></span>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="dv-check"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg><span>Arrived <b>7:26</b> · time + GPS saved</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Where to unload</b><span>written by the store</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Rear dock · normal access</div><div class="m-row__meta">Chilled goes straight to the cold room.</div></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>To drop · 1 order</b><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Chilled</div><div class="m-row__meta"><span class="id">ORD0104209</span><span class="m-sep"></span>6 lines</div></div>
                      <div class="m-row__trail"><span class="m-row__value">28</span><span class="m-row__unit">units</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Start delivery<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Report a problem at this stop</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-20</span>Stop 2 proof of delivery</div><div class="rx-cap">All 28 received. <b>Complete stop</b> → DR-04</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-20 Stop 2 proof of delivery · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">7:38</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Proof of delivery</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Offline</span>
              </div>
              <div class="m-body dv-tight dv-tight-b">
                <div class="m-hero">
                  <div class="m-hero__label">Received · chilled <span class="id">ORD0104209</span></div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">28<small>of 28</small></div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>All received</span>
                  </div>
                  <div class="m-hero__meta">Hawa Eliya · <span class="id">OUT108</span> · counted with the store</div>
                </div>
                <div class="m-group">
                  <div class="m-row">
                    <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">6 lines · all counted</div><div class="m-row__meta">none short or damaged</div></div>
                    <div class="dv-okval"><span class="m-row__value">28/28</span><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                  </div>
                  <div class="m-row">
                    <div class="rx-thumb"><svg width="56" height="56" viewBox="0 0 52 52"><rect width="52" height="52" fill="#26303f"/><rect x="0" y="36" width="52" height="16" fill="#1a212c"/><rect x="6" y="20" width="18" height="16" rx="2" fill="#5b7fa6"/><rect x="8" y="10" width="14" height="10" rx="2" fill="#7c9cc2"/><rect x="27" y="18" width="19" height="18" rx="2" fill="#5b7fa6"/><rect x="29" y="22" width="15" height="4" rx="1" fill="#9ec3e6"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Photo of the drop</div><div class="m-row__meta">7:27 · saved on phone</div></div>
                    <div class="dv-addphoto"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Add</div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Received by store receiving</b><span><span class="id">OUT108</span></span></div>
                  <div class="m-group">
                    <div class="dv-sigwrap">
                      <div class="dv-sig">
                        <svg width="200" height="60" viewBox="0 0 280 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 58 C 20 20, 36 12, 40 30 C 44 48, 30 66, 38 64 C 50 60, 58 30, 70 32 C 80 34, 70 58, 82 58 C 96 58, 100 36, 112 36 C 124 36, 116 56, 128 56 C 144 56, 150 28, 164 26 C 176 24, 170 50, 182 52 C 196 54, 206 40, 222 40"/><path d="M60 72 C 110 66, 170 68, 250 60"/></svg>
                        <div class="dv-sig__base"></div>
                        <div class="dv-sig__cap">Signed 7:38 · saved on phone</div>
                        <div class="dv-sig__clear">Clear</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg>Complete stop</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>Can't sign? Use store OTP</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-04</span>Run complete</div><div class="rx-cap">Trip done and synced. <b>End shift</b> → DR-28</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-04 Run complete">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:41</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="7" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Trip 1 · <span class="id">VEH057</span></div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>Synced 8:40</span>
              </div>
              <div class="m-body dv-tight dv-tight-b">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center; justify-content:flex-start; gap:14px;">
                    <div class="dv-done"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-hero__value dv-name-sm">Trip 1 done</div>
                  </div>
                  <div class="m-hero__meta">Last stop 7:41, in window · 2 stops · 3 orders</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3;"><path d="M20 6 9 17l-5-5"/></svg>All 7 records synced 8:40</span>
                    <span class="m-tag m-tag--bad"><span class="dot"></span>1 exception</span>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Saved offline, now synced</b><span>7 records</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 1 · Nuwara Eliya</div><div class="m-row__meta">Arrival 6:33 · 2 PODs · 1 photo</div></div>
                      <div class="m-row__trail"><span class="m-tag m-tag--ok">8:40</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 2 · Hawa Eliya</div><div class="m-row__meta">Arrival 7:26 · 1 POD · 1 photo</div></div>
                      <div class="m-row__trail"><span class="m-tag m-tag--ok">8:40</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dispatch change, resolved</div><div class="m-row__meta"><span><span class="id">ORD0104209</span>: your POD overrode the 6:10 provisional deferral. Nothing to do.</span></div></div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Next</b><span>No Trip 2 today</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Return to Kandy Hub</div><div class="m-row__meta">~40 km · back ~9:32</div></div>
                      <div class="m-row__trail"><span class="m-row__value">51 min</span><span class="m-row__unit">to go</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>End shift</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 5 · Tabs ================= -->
  <section class="rx-sect" data-name="5 · Tabs">
    <div class="rx-sect__head"><div class="rx-sect__n">5</div><div class="rx-sect__t">Tabs</div><div class="rx-sect__d">Run · Records · Dispatch. Settings opens from the star. Shown after sync, 8:47.</div></div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-21</span>Records</div><div class="rx-cap">Today's PODs and sync status. Any row → DR-22</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-21 Records · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:47</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Records</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>All synced</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-title">
                  <div class="m-eyebrow">Tue 7 Apr <span class="m-sep"></span> <span class="id">VEH057</span></div>
                  <div class="m-h1">7 of 7 synced</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Proof of delivery · 3</b><span>synced 8:40</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 1 · chilled</div><div class="m-row__meta"><span class="id">ORD0104217</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">31/34</span><span class="m-row__unit rx-unit--bad">1 damaged</span></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 1 · dry</div><div class="m-row__meta"><span class="id">ORD0104216</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">58/58</span></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Stop 2 · chilled</div><div class="m-row__meta"><span class="id">ORD0104209</span></div></div>
                      <div class="m-row__trail"><span class="m-row__value">28/28</span></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Shift records</b><span>2 arrivals · 2 photos</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Load accepted 3:35</div><div class="m-row__meta">1 shortfall seen</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Pre-trip check 3:37</div><div class="m-row__meta">Reefer 3 °C · 5 of 5</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--bad"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Problem 6:57</div><div class="m-row__meta">Damaged goods · 1 photo</div></div>
                      <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-22</span>Record detail</div><div class="rx-cap">One POD with its photo and signature. Back → DR-21</div></div>
<div class="frame frame--phone frame--tall mode-driver" data-name="DR-22 Record detail · POD · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:47</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Proof of delivery</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Synced 8:40</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Stop 1 · Nuwara Eliya · chilled <span class="id">ORD0104217</span></div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">31<small>of 34</small></div>
                    <span class="m-pill m-pill--bad"><span class="dot"></span>1 damaged</span>
                  </div>
                  <div class="m-hero__meta">2 short at the dock · 1 tray crushed</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Photo</b><span>6:57 · chicken tray</span></div>
                  <div class="m-group">
                    <div class="rx-photo"><svg width="342" height="176" viewBox="0 0 342 176" preserveAspectRatio="xMidYMid slice"><rect width="342" height="176" fill="#2b2320"/><rect x="0" y="128" width="342" height="48" fill="#1c1715"/><rect x="34" y="40" width="160" height="96" rx="6" fill="#7d6f5b"/><rect x="42" y="48" width="144" height="80" rx="4" fill="#c9b99a"/><rect x="50" y="56" width="60" height="30" rx="5" fill="#e8c9a8"/><rect x="118" y="56" width="60" height="30" rx="5" fill="#e8c9a8"/><rect x="50" y="92" width="60" height="30" rx="5" fill="#e8c9a8"/><path d="M118 94 L178 124 M124 124 L176 92" stroke="#8a2a20" stroke-width="5" stroke-linecap="round"/><rect x="214" y="58" width="96" height="78" rx="6" fill="#3d5a7a"/><rect x="222" y="66" width="80" height="18" rx="3" fill="#5b7fa6"/><rect x="222" y="90" width="80" height="18" rx="3" fill="#5b7fa6"/><rect x="12" y="12" width="92" height="22" rx="11" fill="rgba(0,0,0,.55)"/><text x="58" y="27" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#fff">6:57 · OUT106</text></svg></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Signed by M. Ilyas</b><span>receiving</span></div>
                  <div class="m-group">
                    <div class="dv-sigwrap">
                      <div class="dv-sig">
                        <svg width="215" height="64" viewBox="0 0 280 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 62 C 14 30, 22 10, 30 16 C 38 22, 26 58, 22 70 C 34 44, 46 28, 54 34 C 60 40, 50 60, 58 60 C 66 60, 72 36, 80 38 C 88 40, 82 62, 92 60 C 104 58, 108 26, 116 22 C 122 20, 118 58, 124 62 C 132 66, 140 40, 150 42 C 160 44, 152 60, 162 58 C 176 56, 184 44, 196 46"/><path d="M190 30 C 214 26, 238 28, 268 20"/></svg>
                        <div class="dv-sig__base"></div>
                        <div class="dv-sig__cap">Signed 6:58</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Record</b></div>
                  <div class="m-group">
                    <div class="m-kv"><span>Arrived</span><b>6:33</b></div>
                    <div class="m-kv"><span>Signed</span><b>6:58</b></div>
                    <div class="m-kv"><span>Store's own count</span><b>7:10 · matched</b></div>
                    <div class="m-kv"><span>Synced</span><b>8:40</b></div>
                    <div class="m-kv"><span>Credit note · 3 units</span><b class="mono">CN-2604-0441</b></div>
                  </div>
                </div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-23</span>Dispatch</div><div class="rx-cap">Notices only, no chat. <b>Call dispatch</b> → phone dialer</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-23 Dispatch notices · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:47</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Dispatch</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g16">
                <div class="m-title">
                  <div class="m-eyebrow">From Nilanthi P. · Peliyagoda</div>
                  <div class="m-h1">Nothing needs you now</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Notices today</b><span>newest first</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Plan change resolved</div><div class="m-row__meta"><span><span class="id">ORD0104209</span>: your delivery record was kept.</span></div></div>
                      <div class="m-row__trail"><span class="m-row__unit">8:43</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead rx-lead--off"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">SMS from dispatch</div><div class="m-row__meta">"Skip OUT108 if after 7:30." Reached you 8:40; you delivered 7:26.</div></div>
                      <div class="m-row__trail"><span class="m-row__unit">6:10</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Shortfall acknowledged</div><div class="m-row__meta">Yoghurt 2 of 6 cases short. Credit + follow-up Wed 8 Apr.</div></div>
                      <div class="m-row__trail"><span class="m-row__unit">3:24</span></div>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Plan v3 published</div><div class="m-row__meta">Mon 6:40 PM · Trip 1 · Fresh · Nuwara Eliya</div></div>
                      <div class="m-row__trail"><span class="m-row__unit">Mon</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch</div>
                <div class="rx-note">No chat. When data is down, dispatch texts you.</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-24</span>Settings · me</div><div class="rx-cap">Opened from the star. <b>Language and voice</b> → DR-33; <b>Sign out</b> → DR-06</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-24 Settings · me · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:47</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Settings</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="rx-prof">
                  <div class="rx-av">RB</div>
                  <div class="m-row__main"><div class="m-h2">Ruwan Bandara</div><div class="m-row__meta">Driver · Kandy Hub · +94 77 234 5610</div></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Night or day screen</b><span>auto follows sunrise</span></div>
                  <div class="m-seg rx-seg"><div class="m-seg__i is-on">Auto</div><div class="m-seg__i"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>&nbsp;Night</div><div class="m-seg__i"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>&nbsp;Day</div></div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Language and voice</div><div class="m-row__meta">Read aloud at stops · on</div></div>
                    <span class="rx-trailtxt vo-si">සිංහල</span><svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Vehicle today</div><div class="m-row__meta">Reefer van · 1,040 kg · 7.0 m³</div></div>
                    <span class="rx-trailtxt"><span class="id">VEH057</span></span>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Saved on this phone</div><div class="m-row__meta">Today's run · saved 3:41</div></div>
                    <span class="rx-trailtxt">2.1 MB</span>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Help and safety tips</div></div>
                    <svg class="ic m-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead m-row__lead--bad"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title rx-titlebad">Sign out</div><div class="m-row__meta">Unsent records stay on the phone</div></div>
                  </div>
                </div>
                <div class="rx-note">Lodestar Run 2.0 · works offline</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-33</span>Voice and language</div><div class="rx-cap">Voice runs on the phone, no signal needed. <b>Play a test line</b> → DR-35</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-33 Voice and language · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:48</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Language and voice</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g16 rx-pt">
                <div class="m-section">
                  <div class="m-section__head"><b>Language</b><span>screens and voice</span></div>
                  <div class="m-seg rx-seg vo-seg"><div class="m-seg__i">English</div><div class="m-seg__i is-on vo-si">සිංහල</div><div class="m-seg__i vo-ta">தமிழ்</div></div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Read aloud at stops</div><div class="m-row__meta">Speaks the stop, the dock and what comes off first</div></div>
                    <div class="vo-tog"><i></i></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Only when stopped</div><div class="m-row__meta">Always on. While the van moves you hear a short chime, nothing more.</div></div>
                    <div class="vo-tog vo-tog--lock"><i></i></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Speed</b><span>normal suits most drivers</span></div>
                  <div class="m-seg rx-seg vo-seg"><div class="m-seg__i">Slower</div><div class="m-seg__i is-on">Normal</div><div class="m-seg__i">Faster</div></div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title"><span class="vo-si">සිංහල</span> voice on this phone · works offline</div><div class="m-row__meta">Downloaded 3:39 on Kandy Hub Wi-Fi · 38 MB</div></div>
                  </div>
                </div>
                <div class="rx-note"><span>English and <span class="vo-ta">தமிழ்</span> voices download on depot Wi-Fi when chosen</span></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn m-btn--secondary"><svg class="ic" style="color:var(--star-400);" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Play a test line</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    </div>
  </section>

  <!-- ================= 6 · States ================= -->
  <section class="rx-sect" data-name="6 · States">
    <div class="rx-sect__head"><div class="rx-sect__n">6</div><div class="rx-sect__t">States</div><div class="rx-sect__d">Connection, sync, sign-in and updates, voice read-aloud, end of shift. Offline is calm and dashed, never red.</div></div>
    <div class="row" style="gap:64px;">

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-25</span>Connection banner states</div><div class="rx-cap">One banner, five moments. Component sheet, no links.</div></div>
<div class="frame mode-driver" data-name="DR-25 Connection banner states · phone components" style="width:390px; border-radius:32px; border:6px solid #10131C; background:var(--app-bg);">
            <div class="rx-sheet">
              <div class="rx-sheet__t">Connection banner</div>
              <div class="rx-sheet__l"><b>3:41</b> At the hub · run saved</div>
              <div class="m-banner m-banner--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg><div class="m-banner__txt"><b>Online · saved for offline 3:41</b></div></div>
              <div class="rx-sheet__l"><b>4:38</b> Signal lost above Ramboda</div>
              <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><div class="m-banner__txt"><b>No signal · keep going</b><span>Your run is on this phone. Nothing is lost.</span></div></div>
              <div class="rx-sheet__l"><b>6:58</b> Offline with records waiting</div>
              <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><div class="m-banner__txt"><b>No signal since 4:38 · 4 waiting</b><span>They send by themselves when signal returns.</span></div></div>
              <div class="rx-sheet__l"><b>8:40</b> Back online near Pussellawa</div>
              <div class="m-banner m-banner--info"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><div class="m-banner__txt"><b>Back online · sending 3 of 7</b><span>Text first, photos last.</span></div></div>
              <div class="rx-sheet__l"><b>8:42</b> Everything sent</div>
              <div class="m-banner m-banner--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:2.5"><path d="M20 6 9 17l-5-5"/></svg><div class="m-banner__txt"><b>All 7 records synced</b></div></div>
              <div class="rx-sheet__l">Matching nav pills</div>
              <div class="rx-pills">
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Offline-ready</span>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Saved on phone</span>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>4 waiting</span>
                <span class="m-pill m-pill--info"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Sending</span>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Synced 8:40</span>
              </div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-26</span>Sync in progress</div><div class="rx-cap">Signal back at 8:40, smallest records first. Auto → DR-27</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-26 Sync in progress · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Sync</div>
                <span class="m-pill m-pill--info"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Sending</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Back online 8:40 · near Pussellawa</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">3 of 7<small>sent</small></div>
                    <span class="m-pill m-pill--ok">0 lost</span>
                  </div>
                  <div class="m-progress m-progress--star"><div style="width:43%;"></div></div>
                  <div class="m-hero__meta">No need to wait. It finishes by itself.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Sending in this order</b><span>text first, photos last</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT106</span></div><div class="m-row__meta">6:33</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT108</span></div><div class="m-row__meta">7:26</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104216</span></div><div class="m-row__meta">Dry 58/58</div></div>
                      <div class="rx-tick"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    </div>
                    <div class="m-row rx-row56 m-row--sel">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104217</span></div><div class="m-row__meta">Chilled 31/34 · sending now</div></div>
                      <div class="rx-tick rx-tick--busy"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104209</span></div><div class="m-row__meta">Chilled 28/28</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Photo · chicken tray</div><div class="m-row__meta">6:57 · 1.8 MB</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Photo · drop at <span class="id">OUT108</span></div><div class="m-row__meta">7:27</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-27</span>Sync conflict notice</div><div class="rx-cap">Offline plan change; your record wins. <b>Got it</b> → DR-04</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-27 Sync conflict notice · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:43</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Sync</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Resolved 8:43</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero rx-hero--ok">
                  <div class="m-hero__label" style="color:var(--st-delivered-fg);">Hawa Eliya · <span class="id">ORD0104209</span></div>
                  <div class="rx-hv">Your delivery record was kept</div>
                  <div class="m-hero__meta">Dispatch changed this order while you had no signal. Nothing for you to do.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>What happened</b></div>
                  <div class="m-group">
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Dispatch · 6:10</div><div class="m-row__meta">Moved to Wed 8 Apr, provisional</div></div>
                      <span class="m-tag">Replaced</span>
                    </div>
                    <div class="m-row m-row--tall">
                      <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">You · 7:26</div><div class="m-row__meta">Delivered 28 of 28 · signed · photo 7:27</div></div>
                      <span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Kept</span>
                    </div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-kv"><span>Order</span><b>Delivered</b></div>
                  <div class="m-kv"><span>Space on <span class="id">VEH058</span>, Wed</span><b>Released</b></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Got it</div>
                <div class="rx-note">A signed delivery always beats an offline plan change.</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-28</span>End of shift</div><div class="rx-cap">Shift totals at Kandy Hub. <b>Close shift</b> → DR-06</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-28 End of shift summary · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">9:35</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">End of shift</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>All synced</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center; justify-content:flex-start; gap:14px;">
                    <div class="dv-done"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-hero__value dv-name-sm">Shift done</div>
                  </div>
                  <div class="m-hero__meta">Back at Kandy Hub 9:32 · out since 3:40</div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><div class="m-stat__v">2</div><div class="m-stat__l">Stops</div></div>
                  <div class="m-stat"><div class="m-stat__v">3</div><div class="m-stat__l">Orders</div></div>
                  <div class="m-stat"><div class="m-stat__v" style="color:var(--st-exception-fg);">1</div><div class="m-stat__l">Exception</div></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Logged</b><span><span class="id">VEH057</span></span></div>
                  <div class="m-group">
                    <div class="m-kv"><span>Distance</span><b>170 km</b></div>
                    <div class="m-kv"><span>Fuel used</span><b>17 L</b></div>
                    <div class="rx-kvbar">
                      <div class="rx-kvbar__h"><span>Fuel this week</span><b>315 / 450 L</b></div>
                      <div class="m-progress m-progress--star"><div style="width:70%;"></div></div>
                    </div>
                    <div class="m-kv"><span>Exception</span><b>1 chicken tray damaged</b></div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Next run · Wed 8 Apr</div><div class="m-row__meta">Plan arrives the evening before</div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Close shift</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-28</span>End of shift · Daylight</div><div class="rx-cap">What auto mode shows at 9:35, after sunrise.</div></div>
<div class="frame frame--phone mode-driver-day" data-name="DR-28 End of shift summary · phone · daylight">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">9:35</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">End of shift</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>All synced</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__row" style="align-items:center; justify-content:flex-start; gap:14px;">
                    <div class="dv-done"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-hero__value dv-name-sm">Shift done</div>
                  </div>
                  <div class="m-hero__meta">Back at Kandy Hub 9:32 · out since 3:40</div>
                </div>
                <div class="m-stats">
                  <div class="m-stat"><div class="m-stat__v">2</div><div class="m-stat__l">Stops</div></div>
                  <div class="m-stat"><div class="m-stat__v">3</div><div class="m-stat__l">Orders</div></div>
                  <div class="m-stat"><div class="m-stat__v" style="color:var(--st-exception-fg);">1</div><div class="m-stat__l">Exception</div></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Logged</b><span><span class="id">VEH057</span></span></div>
                  <div class="m-group">
                    <div class="m-kv"><span>Distance</span><b>170 km</b></div>
                    <div class="m-kv"><span>Fuel used</span><b>17 L</b></div>
                    <div class="rx-kvbar">
                      <div class="rx-kvbar__h"><span>Fuel this week</span><b>315 / 450 L</b></div>
                      <div class="m-progress"><div style="width:70%; background:linear-gradient(135deg, #243080 0%, #141B4D 100%);"></div></div>
                    </div>
                    <div class="m-kv"><span>Exception</span><b>1 chicken tray damaged</b></div>
                  </div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Next run · Wed 8 Apr</div><div class="m-row__meta">Plan arrives the evening before</div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Close shift</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-30</span>Session expired while offline</div><div class="rx-cap">Offline, the run never locks. <b>Continue run</b> → DR-01</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-30 Session expired while offline · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">7:03</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Saved on phone</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero sx-hero--off">
                  <div class="m-hero__label">Session ended 7:03 · no signal since 4:38</div>
                  <div class="rx-hv">Keep delivering</div>
                  <div class="m-hero__meta">Your records stay on this phone and sync after you sign in.</div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Waiting to send</b><span>4 records</span></div>
                  <div class="m-group">
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT106</span></div><div class="m-row__meta">6:33</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104216</span></div><div class="m-row__meta">Dry 58/58</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104217</span></div><div class="m-row__meta">Chilled 31/34 · signed 6:58</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                    <div class="m-row rx-row56">
                      <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Photo · chicken tray</div><div class="m-row__meta">6:57 · 1.8 MB</div></div>
                      <div class="rx-tick rx-tick--wait"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Continue run<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost">Sign in when you have signal</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-31</span>Update required</div><div class="rx-cap">Never forced mid-run. <b>Continue run</b> → DR-04</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-31 Update required · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">8:44</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">App update</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg>Synced 8:40</span>
              </div>
              <div class="m-body rx-g16">
                <div class="m-hero">
                  <div class="m-hero__label">Lodestar Run 2.1 · needed before Wed 8 Apr</div>
                  <div class="rx-hv">Update after your run</div>
                  <div class="m-hero__meta">This version works until the run is complete. Nothing changes during your trip.</div>
                </div>
                <div class="m-group">
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead m-row__lead--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Today's run stays as it is</div><div class="m-row__meta">Stops, records and sync keep working on 2.0.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">18 MB on depot Wi-Fi</div><div class="m-row__meta">About a minute at Kandy Hub. No mobile data used.</div></div>
                  </div>
                  <div class="m-row m-row--tall">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">We'll remind you</div><div class="m-row__meta">Again when you tap End shift.</div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Continue run<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost">Update on depot Wi-Fi</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-34</span>Voice pack downloading</div><div class="rx-cap">Once, on depot Wi-Fi, 3:38. <b>Continue</b> → DR-13</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-34 Voice pack downloading · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:38</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Tue 7 Apr</div>
                <div style="width:40px;"></div>
              </div>
              <div class="m-body rx-g14 rx-pt">
                <div class="m-hero">
                  <div class="m-hero__label">Getting the <span class="vo-si">සිංහල</span> voice for read-aloud</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">64<small>%</small></div>
                    <span class="m-pill m-pill--info"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Kandy Hub Wi-Fi</span>
                  </div>
                  <div class="m-progress m-progress--star"><div style="width:64%;"></div></div>
                  <div class="m-hero__meta">24 of 38 MB · once only · about 20 seconds left</div>
                </div>
                <div class="m-group">
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Speaks from this phone</div><div class="m-row__meta">No signal needed for the 4 h 02 m above Ramboda</div></div>
                  </div>
                  <div class="m-row rx-row56">
                    <div class="m-row__lead rx-lead--plain"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                    <div class="m-row__main"><div class="m-row__title">Only when the van is stopped</div><div class="m-row__meta">A short chime while moving</div></div>
                  </div>
                </div>
                <div class="m-banner m-banner--ok"><svg class="ic" style="stroke-width:2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg><div class="m-banner__txt"><b>Your run works without it; text is always shown</b><span>Leave now and it finishes next time you are on depot Wi-Fi.</span></div></div>
                <div class="m-section">
                  <div class="m-section__head"><b>Until it is ready, stops show</b></div>
                  <div class="vo-center"><div class="vo-btn vo-btn--off"><svg class="ic" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Voice not downloaded, text still works</div></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Continue<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost">Skip voice for today</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>

    <div class="screen-block"><div class="rx-head"><div class="screen-label"><span class="screen-label__id">DR-35</span>Stop arrival · speaking</div><div class="rx-cap">Van stopped, read aloud on the phone. <b>Speaking</b> → pause, DR-02</div></div>
<div class="frame frame--phone mode-driver" data-name="DR-35 Stop arrival speaking · phone">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:33</span><div class="statusbar__icons"><span class="dv-sb-note">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Stop 1 of 2</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Saved on phone</span>
              </div>
              <div class="m-body dv-tight dv-tight-b vo-fit vo-fit2">
                <div class="m-hero">
                  <div class="m-hero__label">Stop 1 · Waypoint Fresh · <span class="id">OUT106</span></div>
                  <div class="m-hero__value dv-name">Nuwara Eliya</div>
                  <div class="m-hero__row" style="align-items:center;">
                    <span class="m-hero__meta">Window <b class="mono" style="color:var(--text);">05:30–08:00</b></span>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="dv-check"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg><span>Arrived <b>6:33</b> · time + GPS saved</span></div>
                  <div class="vo-hrow vo-hrow--end"><div class="vo-btn vo-btn--on"><svg class="ic" viewBox="0 0 24 24"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>Speaking · <span class="vo-si">සිංහල</span><span class="vo-lvl"><i style="height:6px;"></i><i style="height:13px;"></i><i style="height:9px;"></i></span></div></div>
                  <div class="vo-cap"><span class="vo-si">නුවරඑළිය, <span class="id">OUT106</span>. <b>පසුපස ඩොක් එක.</b> ඇණවුම් දෙකයි: මුලින් සිසිල්, පසුව වියළි.</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Where to unload</b><span>written by the store</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Rear dock · normal access</div>
                        <div class="m-row__meta">Enter via the Lawson St service lane; dock door opens 5:30.</div>
                      </div>
                    </div>
                    <div class="m-row dv-row-pad">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">M. Ilyas</div>
                        <div class="m-row__meta">Receiving</div>
                      </div>
                      <div class="dv-callbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call</div>
                    </div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>To drop · 2 orders</b><span class="m-tag m-tag--cold"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/></svg>Chilled first</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Chilled</div>
                        <div class="m-row__meta"><span class="id">ORD0104217</span><span class="m-sep"></span>34 less 2 short</div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">32</span><span class="m-row__unit">units</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main">
                        <div class="m-row__title">Dry</div>
                        <div class="m-row__meta"><span class="id">ORD0104216</span><span class="m-sep"></span>ambient</div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">58</span><span class="m-row__unit">units</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar vo-ab">
                <div class="m-btn">Start delivery<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Report a problem at this stop</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
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
