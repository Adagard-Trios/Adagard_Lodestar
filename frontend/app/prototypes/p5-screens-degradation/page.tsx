
import React from 'react';

export default function p5screensdegradation() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Degradation screens · prototype screens</title>
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/components.css">
<link rel="stylesheet" href="/assets/modern.css">
<style>
  /* =================== Board-level (page 08) · Lodestar 2.0 soft language =================== */
  .board { min-width: 2320px; --soft: 0 1px 2px rgba(15,20,50,.04), 0 8px 24px rgba(15,20,50,.06); --soft-line: #EEF0F5; }
  .page-head__title, .section__title { font-family: var(--font-display); letter-spacing: -0.03em; }
  .flow-row { display: flex; gap: 32px; align-items: flex-start; }
  .flow-row .flow-arrow { align-self: flex-start; margin-top: 400px; width: 88px; }

  /* Scenario index */
  .ov { display: flex; gap: 24px; }
  .ov__card { display: flex; gap: 24px; align-items: flex-start; width: 1052px; padding: 28px 32px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); }
  .ov__letter { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #1E2766 0%, #141B4D 100%); color: var(--star-400); font-family: var(--font-display); font-size: 30px; font-weight: 800; flex-shrink: 0; }
  .ov__letter--b { background: #EEF0F6; color: var(--n-800); }
  .ov__body { display: flex; flex-direction: column; gap: 8px; }
  .ov__k { font-size: 14px; font-weight: 700; color: var(--brand-600); }
  .ov__t { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); }
  .ov__d { font-size: 15px; line-height: 1.6; color: var(--n-600); }
  .ov__screens { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .sid { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border-radius: 8px; background: var(--n-900); color: var(--star-400); font-family: var(--font-mono); font-size: 12px; font-weight: 700; }

  /* Scenario header blocks */
  .scn-row { display: flex; gap: 24px; align-items: stretch; width: 2128px; }
  .scn-card { display: flex; flex-direction: column; gap: 18px; padding: 40px 44px; border-radius: 28px; background: linear-gradient(135deg, #1E2766 0%, #0A0F2E 100%); color: #E8EBF7; width: 1180px; flex-shrink: 0; box-shadow: 0 12px 32px rgba(20,27,77,.22); }
  .scn-card--light { background: #FFFFFF; color: var(--n-900); box-shadow: var(--soft); }
  .scn-tag { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: var(--star-400); }
  .scn-card--light .scn-tag { color: var(--brand-600); }
  .scn-name { font-family: var(--font-display); font-size: 46px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.08; color: #FFFFFF; }
  .scn-card--light .scn-name { color: var(--n-900); }
  .scn-why { font-size: 18px; line-height: 1.65; color: #C9CFE8; }
  .scn-card--light .scn-why { color: var(--n-700); }
  .scn-why b { color: #FFFFFF; }
  .scn-card--light .scn-why b { color: var(--n-900); }
  .scn-facts { display: flex; gap: 10px; flex-wrap: wrap; }
  .scn-fact { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 999px; background: rgba(255,255,255,.08); color: #DDE2FF; font-size: 13px; font-weight: 700; }
  .scn-fact svg { color: var(--star-400); }
  .scn-card--light .scn-fact { background: #F1F3F9; color: var(--n-700); }
  .scn-card--light .scn-fact svg { color: var(--brand-600); }
  .glance { display: flex; flex-direction: column; gap: 0; flex: 1; min-width: 0; padding: 30px 34px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); }
  .glance__h { font-size: 14px; font-weight: 700; color: var(--n-500); padding-bottom: 12px; }
  .glance__row { display: flex; align-items: center; gap: 20px; padding: 16px 0; border-top: 1px solid var(--soft-line); }
  .glance__n { width: 170px; flex-shrink: 0; font-family: var(--font-display); font-size: 34px; font-weight: 800; letter-spacing: -0.01em; word-spacing: 2px; color: var(--n-900); font-variant-numeric: tabular-nums; }
  .glance__t { display: flex; flex-direction: column; gap: 2px; font-size: 15px; color: var(--n-600); line-height: 1.5; }
  .glance__t b { color: var(--n-900); font-size: 16px; }

  /* Incident timeline (swimlanes) */
  .tl { display: flex; flex-direction: column; width: 2128px; padding: 30px 32px 24px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); border: 0; }
  .tl__head { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 20px; }
  .tl__title { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--n-900); }
  .tl__sub { font-size: 14px; color: var(--n-500); }
  .tl__legend { display: flex; gap: 18px; font-size: 13px; font-weight: 600; color: var(--n-600); }
  .tl__legend span { display: inline-flex; align-items: center; gap: 6px; }
  .tl__legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
  .tl__axis { display: flex; height: 26px; }
  .tl__lbl { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 2px; padding-right: 16px; }
  .tl__lbl b { font-family: var(--font-display); font-size: 15px; color: var(--n-900); }
  .tl__lbl span { font-size: 13px; color: var(--n-500); font-weight: 500; }
  .tl__track { position: relative; width: 1800px; flex-shrink: 0; }
  .tl__tick { position: absolute; top: 4px; width: 48px; margin-left: -24px; text-align: center; font-size: 12px; font-weight: 600; color: var(--n-400); font-variant-numeric: tabular-nums; }
  .tl__lanes { position: relative; display: flex; flex-direction: column; }
  .tl__grid { position: absolute; top: 0; bottom: 0; width: 1px; background: #F1F3F7; }
  .tl__band { position: absolute; top: 0; bottom: 0; border-left: 1.5px dashed #BDB7B1; border-right: 1.5px dashed #BDB7B1; background: rgba(87,83,78,.045); border-radius: 4px; }
  .tl__bandlbl { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; }
  .tl__bandlbl span { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 14px; border-radius: 999px; background: #FFFFFF; border: 1.5px dashed #A8A29E; color: #57534E; font-size: 13px; font-weight: 700; }
  .tl__lane { position: relative; display: flex; height: 132px; border-top: 1px solid #F1F3F7; }
  .tl__lane--foot { height: 56px; }
  .tl__line { position: absolute; top: 21px; height: 2px; border-radius: 2px; background: var(--n-200); }
  .tl__line--dash { background: none; border-top: 2px dashed #A8A29E; height: 0; }
  .ev { position: absolute; top: 0; width: 176px; height: 120px; }
  .ev__dot { position: absolute; left: 0; top: 15px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 0 1.5px currentColor; background: currentColor; }
  .ev__card { position: absolute; left: 0; top: 38px; width: 172px; display: flex; flex-direction: column; gap: 2px; padding: 9px 11px; border-radius: 12px; background: #F5F6FA; }
  .ev--off .ev__card { background: #FFFFFF; border: 1.5px dashed #BDB7B1; }
  .ev--off .ev__dot { background: #FFFFFF; box-shadow: none; border: 2px dashed #57534E; }
  .ev__t { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .ev__h { font-family: var(--font-display); font-size: 13px; font-weight: 800; color: var(--n-900); line-height: 1.25; }
  .ev__d { font-size: 12px; color: var(--n-600); line-height: 1.35; }
  .ev--ok { color: var(--ok); } .ev--bad { color: var(--danger); } .ev--warn { color: var(--warn); } .ev--off { color: #57534E; } .ev--plan { color: var(--brand-600); }

  /* Failure-mode table */
  .fm { width: 2128px; }
  .fm.doc-card { border: 0; border-radius: 28px; box-shadow: var(--soft); padding: 32px 36px; }
  .fm .doc-h { font-family: var(--font-display); letter-spacing: -0.02em; }
  .fm .rtag { height: 30px; padding: 0 14px; border: 0; }
  .fm .dtable th { font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 700; color: var(--n-500); border-bottom: 1px solid var(--soft-line); padding: 12px 16px; }
  .fm .dtable td { font-size: 15px; border-bottom: 1px solid #F3F4F8; padding: 16px; }
  .fm .dtable tr:last-child td { border-bottom: 0; }
  .fm .dtable td:first-child { font-family: var(--font-display); font-weight: 800; color: var(--n-900); }
  .fm .dtable td .sid { margin: 0 4px 4px 0; }

  /* Act headers */
  .act { display: flex; align-items: center; gap: 20px; padding: 20px 26px; border-radius: 22px; background: linear-gradient(135deg, #1E2766 0%, #0A0F2E 100%); color: #E8EBF7; width: 2128px; box-shadow: 0 10px 28px rgba(20,27,77,.18); }
  .act__n { display: flex; align-items: center; justify-content: center; height: 34px; padding: 0 14px; border-radius: 999px; background: var(--star-500); color: #1A1300; font-size: 13px; font-weight: 800; letter-spacing: .04em; flex-shrink: 0; }
  .act__time { font-size: 16px; font-weight: 700; color: var(--star-400); flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .act__t { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; flex-shrink: 0; }
  .act__d { font-size: 15px; color: #AEB6D8; }

  /* Side doc cards next to frames */
  .side { display: flex; flex-direction: column; gap: 16px; padding: 30px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); flex-shrink: 0; }
  .side__k { font-size: 14px; font-weight: 700; color: var(--brand-600); }
  .side__t { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--n-900); letter-spacing: -0.02em; line-height: 1.25; }
  .side__p { font-size: 15px; line-height: 1.6; color: var(--n-700); }
  .kit { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-top: 1px solid var(--soft-line); }
  .kit__ic { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 12px; background: #EEF0FF; color: var(--brand-600); flex-shrink: 0; }
  .kit__b { display: flex; flex-direction: column; gap: 2px; font-size: 14px; line-height: 1.5; color: var(--n-600); }
  .kit__b b { font-size: 15px; color: var(--n-900); }
  .num { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 10px; background: #141B4D; color: var(--star-400); font-size: 13px; font-weight: 800; flex-shrink: 0; font-variant-numeric: tabular-nums; }

  /* Sync state diagram */
  .sd { display: flex; flex-direction: column; gap: 0; width: 2128px; padding: 34px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); }
  .sd__states { position: relative; display: flex; align-items: stretch; padding-top: 56px; }
  .sd__lbl { width: 180px; flex-shrink: 0; }
  .sd__st { display: flex; flex-direction: column; gap: 8px; width: 316px; flex-shrink: 0; padding: 18px 20px; border-radius: 20px; background: #F5F6FA; }
  .sd__st--on { background: var(--st-delivered-bg); }
  .sd__st--off { border: 1.5px dashed var(--st-offline-bd); background: #FBFAF9; }
  .sd__st--sync { background: var(--st-enroute-bg); }
  .sd__st--conf { background: var(--st-deferred-bg); }
  .sd__st--res { background: #F1F3F9; }
  .sd__name { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--n-900); }
  .sd__desc { font-size: 13px; line-height: 1.5; color: var(--n-600); }
  .sd__arr { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 70px; flex-shrink: 0; text-align: center; font-size: 11px; font-weight: 700; color: var(--n-500); line-height: 1.3; }
  .sd__arr svg { width: 34px; height: 20px; color: var(--n-400); }
  .sd__bypass { position: absolute; top: 8px; height: 40px; border: 1.5px solid var(--n-300); border-bottom: 0; border-radius: 16px 16px 0 0; }
  .sd__bypass span { position: absolute; top: -14px; left: 50%; margin-left: -220px; width: 440px; text-align: center; }
  .sd__bypass b { display: inline-flex; align-items: center; height: 26px; padding: 0 12px; border-radius: 999px; background: #F1F3F9; font-size: 12px; font-weight: 700; color: var(--n-700); }
  .sd__mx { display: flex; flex-direction: column; margin-top: 28px; }
  .sd__mrow { display: flex; align-items: stretch; border-top: 1px solid var(--soft-line); }
  .sd__role { display: flex; flex-direction: column; justify-content: center; gap: 2px; width: 180px; flex-shrink: 0; padding: 14px 12px 14px 0; }
  .sd__role b { font-family: var(--font-display); font-size: 16px; color: var(--n-900); }
  .sd__role span { font-size: 12px; color: var(--n-500); font-weight: 600; }
  .sd__cell { width: 316px; flex-shrink: 0; padding: 16px 4px; font-size: 13px; line-height: 1.5; color: var(--n-700); display: flex; flex-direction: column; gap: 6px; }
  .sd__gap { width: 70px; flex-shrink: 0; }
  .q { display: inline-flex; align-self: flex-start; padding: 5px 10px; border-radius: 10px; background: #F1F3F9; font-size: 12px; font-weight: 700; color: var(--n-800); }

  /* Copy guidelines */
  .cg { display: flex; gap: 24px; width: 2128px; }
  .cg__rules { display: flex; flex-direction: column; gap: 0; width: 640px; flex-shrink: 0; padding: 30px; border-radius: 28px; background: linear-gradient(135deg, #1E2766 0%, #0A0F2E 100%); color: #E8EBF7; }
  .cg__rule { display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,.08); }
  .cg__rule:first-of-type { border-top: 0; }
  .cg__rule .num { background: var(--star-500); color: #1A1300; }
  .cg__rt { font-family: var(--font-display); font-size: 17px; font-weight: 800; color: #FFFFFF; }
  .cg__rd { font-size: 14px; line-height: 1.55; color: #AEB6D8; }
  .cg__pairs { display: flex; flex-direction: column; gap: 0; flex: 1; padding: 30px; border-radius: 28px; background: #FFFFFF; box-shadow: var(--soft); }
  .cg__pairs .doc-h { font-family: var(--font-display); letter-spacing: -0.02em; }
  .cg__pair { display: flex; gap: 16px; align-items: stretch; padding: 14px 0; border-top: 1px solid var(--soft-line); }
  .cg__ctx { width: 190px; flex-shrink: 0; display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--n-500); font-weight: 600; }
  .cg__ctx b { font-family: var(--font-display); font-size: 14px; color: var(--n-900); }
  .cg__bad, .cg__good { display: flex; gap: 10px; align-items: flex-start; flex: 1; padding: 12px 14px; border-radius: 14px; font-size: 15px; line-height: 1.45; }
  .cg__bad { background: #FEF3F2; color: #7A271A; text-decoration: line-through; text-decoration-color: rgba(180,35,24,.45); }
  .cg__good { background: #ECFDF3; color: #054F31; font-weight: 600; }
  .cg__why { width: 300px; flex-shrink: 0; font-size: 13px; line-height: 1.5; color: var(--n-600); display: flex; align-items: center; }
  .cg__mark { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 1px; }
  .cg__mark .ic { width: 12px; height: 12px; stroke-width: 3.5; }

  /* Notification mockups (OUT108) */
  .notif { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 20px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15,20,50,.05), 0 10px 28px rgba(15,20,50,.10); }
  .notif .chip--neutral { color: var(--n-600); background: #F1F3F9; border-color: transparent; }
  .notif .chip { height: 26px; padding: 0 11px; }
  .notif__h { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--n-500); }
  .notif__h svg { width: 20px; height: 20px; }
  .notif__t { font-family: var(--font-display); font-size: 15px; font-weight: 800; color: var(--n-900); }
  .notif__b { font-size: 14px; line-height: 1.45; color: var(--n-700); }

  /* =================== Screen extras (Lodestar 2.0, page-local) ===================
     Page CSS loads before ui2.css, so overrides are scoped with .frame to win. */
  .frame .g-sbnote { font-size: 13px; font-weight: 700; color: var(--text-2); }
  .frame .m-row__unit { font-size: 13px; }
  .frame .m-body { gap: 18px; }
  .frame .m-row--compact { min-height: 54px; padding: 8px 16px; gap: 12px; }
  .frame .m-row--compact .m-row__lead { width: 36px; height: 36px; border-radius: 12px; font-size: 14px; }
  .frame .m-row--compact .m-row__lead svg { width: 18px; height: 18px; }
  .frame .m-row__title .id, .frame .m-row__meta .id { font-size: 14px; }
  .frame .m-row__lead.g-lead--off { background: transparent; box-shadow: inset 0 0 0 1.5px var(--st-offline-bd); color: var(--st-offline-fg); }
  .frame .m-row__lead.g-lead--plain { background: var(--surface-3); color: var(--text-2); }
  .frame .m-hero.g-hero--off { background: transparent; border: 1.5px dashed var(--st-offline-bd); box-shadow: none; }
  .mode-store .m-hero.g-hero--off { background: #FBFAF9; }
  .frame .m-hero.g-hero--ok { background: var(--tint-ok); box-shadow: none; }
  .frame .m-hero.g-hero--bad { background: var(--tint-bad); box-shadow: none; }
  .frame .g-herov { font-family: var(--font-display); font-size: 34px; font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; color: var(--text); }
  .frame .g-herohead { display: flex; align-items: center; gap: 10px; }
  .frame .g-okdot { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--st-delivered-fg); color: #07140F; flex-shrink: 0; }
  .frame .g-okdot svg { width: 18px; height: 18px; stroke-width: 3; }
  .frame .g-heronote { display: flex; align-items: flex-start; gap: 8px; padding-top: 10px; border-top: 1px dashed var(--st-offline-bd); font-size: 13px; line-height: 1.4; color: var(--text-3); }
  .frame .g-heronote svg { margin-top: 2px; }
  .frame .g-actrow { display: flex; gap: 10px; }
  .frame .g-sq { width: 58px; flex-shrink: 0; padding: 0; }
  .frame .g-note { font-size: 13px; font-weight: 600; line-height: 1.4; color: var(--text-3); text-align: center; }
  .frame .g-side { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .frame .g-side span { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-3); }
  .frame .g-side b { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .frame .g-trend { display: flex; gap: 16px; padding-top: 10px; border-top: 1px solid rgba(180,35,24,.14); font-size: 15px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
  .frame .g-threadrow { display: flex; justify-content: center; padding: 12px 8px 10px; }
  .frame .thread__step { width: 66px; }
  .frame .thread__label { font-size: 13px; }
  .frame .thread__time { font-size: 13px; font-family: var(--font-ui); font-variant-numeric: tabular-nums; }
  .frame .m-banner--offline .m-banner__txt span { color: var(--text-3); }
  .frame .g-thread { position: relative; display: flex; align-items: flex-start; width: 100%; }
  .frame .g-thread .thread__step { position: relative; z-index: 1; width: 20%; flex-shrink: 0; }
  .frame .g-thread__line { position: absolute; top: 10px; height: 2px; border-radius: 2px; background: var(--line-strong); }
  .frame .g-thread__line--ok { background: var(--st-delivered-fg); }
  .frame .g-thread__line--warn { background: var(--st-deferred-fg); }
  .frame .g-thread__line--dash { height: 0; background: none; border-top: 2px dashed var(--st-offline-bd); }
  .frame .g-tight .m-body { gap: 14px; }
  .frame .g-eq { font-family: var(--font-display); font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }

  /* desktop extras */
  .frame .d-main { gap: 16px; }
  .frame .g-dhero { display: flex; align-items: stretch; gap: 0; border-radius: 22px; background: #FBFAF9; border: 1.5px dashed var(--st-offline-bd); }
  .frame .g-dhero__a { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; padding: 20px 24px; }
  .frame .g-dhero__b { display: flex; flex-direction: column; gap: 8px; width: 290px; flex-shrink: 0; padding: 20px 24px; border-left: 1.5px dashed #D6D1CC; }
  .frame .g-dhero__v { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--st-offline-fg); font-variant-numeric: tabular-nums; }
  .frame .g-dhero__v small { font-size: 18px; font-weight: 700; margin-left: 6px; opacity: .75; }
  .frame .g-risk { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--st-exception-fg); font-variant-numeric: tabular-nums; }
  .frame .g-risk small { font-size: 16px; font-weight: 700; margin-left: 8px; letter-spacing: 0; }
  .frame .g-dhero__v small { letter-spacing: 0; }
  .frame .g-bar { display: flex; height: 8px; border-radius: 999px; background: #EEF0F6; overflow: hidden; }
  .frame .g-bar div { border-radius: 999px; }
  .frame .g-mini { display: flex; width: 64px; height: 6px; border-radius: 999px; background: #EEF0F6; overflow: hidden; flex-shrink: 0; }
  .frame .g-mini div { border-radius: 999px; }
  .frame .d-sub { font-size: 14px; line-height: 1.5; }
  .frame .g-lbl { font-size: 13px; font-weight: 700; color: var(--text-3); }
  .frame .g-dash-row { background: #FBFAF9; }
  .frame .g-muted { color: var(--st-offline-fg); }
  .frame .g-corr { position: relative; height: 132px; margin: 0 18px; }
  .frame .g-corr__lbl { position: absolute; display: flex; flex-direction: column; gap: 1px; font-size: 13px; line-height: 1.35; color: var(--text-2); white-space: nowrap; }
  .frame .g-corr__lbl b { font-size: 13px; color: var(--text); }
  .frame .g-legend { display: flex; gap: 20px; padding: 0 18px 16px; font-size: 13px; font-weight: 600; color: var(--text-2); }
  .frame .g-legend span { display: inline-flex; align-items: center; gap: 8px; }
  .frame .g-li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.45; color: var(--text); }
  .frame .g-li .t-2 { color: var(--text-2); }
  .frame .g-mark { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 1px; }
  .frame .g-mark svg { width: 12px; height: 12px; stroke-width: 3.5; }
  .frame .g-mark--ok { background: var(--st-delivered-fg); color: #FFFFFF; }
  .frame .g-mark--pred { border: 1.5px dashed var(--st-offline-fg); color: var(--st-offline-fg); }
  .frame .g-mark--warn { background: var(--st-deferred-fg); color: #FFFFFF; }
  .frame .g-mark--n { width: 22px; height: 22px; background: #141B4D; color: var(--star-400); font-size: 12px; font-weight: 800; }
  .frame .g-sect { display: flex; flex-direction: column; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--hair); }
  .frame .g-sect--pred { background: #FBFAF9; }
  .frame .g-note-d { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 14px; font-size: 13px; line-height: 1.45; }
  .frame .g-note-d svg { margin-top: 1px; flex-shrink: 0; }
  .frame .g-dbanner { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 16px; font-size: 14px; line-height: 1.4; }
  .frame .g-dbanner svg { flex-shrink: 0; }
  .frame .g-dbanner--info { background: var(--tint-info); color: var(--st-enroute-fg); }
  .frame .g-dbanner--bad { background: var(--tint-bad); color: var(--st-exception-fg); }
  .frame .g-dbanner span { color: var(--text-2); }
  .frame .g-dbanner b { color: var(--text); }
  .frame .g-drawer { display: flex; flex-direction: column; width: 540px; flex-shrink: 0; background: #FFFFFF; box-shadow: -24px 0 56px rgba(15,20,50,.16); }
  .frame .g-dim { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 0; padding: 22px 28px; opacity: .42; }
  .frame .g-field { display: flex; flex-direction: column; gap: 6px; }
  .frame .g-field > span { font-size: 13px; font-weight: 700; color: var(--text-2); }
  .frame .g-input { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border-radius: 12px; background: #F4F5F9; font-size: 14px; color: var(--text); }
  .frame .g-av { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--star-500); color: #1A1300; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .frame .g-cmp { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px; border-radius: 20px; min-width: 0; }
  .frame .g-cmp--plan { flex: 0.85; background: #FFFCF6; border: 1.5px dashed var(--st-deferred-bd); }
  .frame .g-cmp--field { flex: 1.15; background: #FFFFFF; box-shadow: 0 0 0 2px var(--st-delivered-bd), 0 8px 24px rgba(4,120,87,.12); }
  .frame .g-cmp__who { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-2); }
  .frame .g-cmp__what { font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
  .frame .g-ev { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 1.4; color: var(--text-2); }
  .frame .g-ev b { color: var(--text); }
  .frame .g-vs { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; align-self: center; border-radius: 50%; background: #FFFFFF; font-size: 12px; font-weight: 800; color: var(--text-3); box-shadow: 0 1px 3px rgba(15,20,50,.1); flex-shrink: 0; margin: 0 -8px; z-index: 1; }
  .frame .g-res { display: flex; flex-wrap: wrap; column-gap: 24px; }
  .frame .g-res .g-li { width: calc(50% - 12px); padding: 9px 0; border-top: 1px solid rgba(4,120,87,.14); }
  .frame .g-audit { display: flex; gap: 10px; padding: 7px 0; font-size: 13px; line-height: 1.4; color: var(--text); }
  .frame .g-audit__t { width: 36px; flex-shrink: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
  .frame .g-audit__rail { display: flex; flex-direction: column; align-items: center; width: 10px; flex-shrink: 0; padding-top: 5px; }
  .frame .g-audit__rail i { width: 8px; height: 8px; border-radius: 50%; background: var(--n-300); }
  .frame .g-chg { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
  .frame .g-chg__h { display: flex; align-items: center; gap: 10px; }
  .frame .g-chg__t { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
  .frame .g-ord { display: flex; align-items: center; gap: 10px; padding-left: 30px; font-size: 14px; }
  .frame .g-diff { display: flex; align-items: center; gap: 10px; padding-left: 30px; font-size: 13px; font-weight: 600; }
  .frame .g-diff s { color: var(--st-exception-fg); }
  .frame .g-diff b { color: var(--st-delivered-fg); }
  .frame .g-opt { display: flex; flex-direction: column; gap: 5px; flex: 1; padding: 12px 14px; border-radius: 16px; background: #F6F7FB; }
  .frame .g-opt--on { background: var(--tint-brand); box-shadow: inset 0 0 0 2px var(--brand-600); }
  .frame .g-cap { display: flex; flex-direction: column; gap: 6px; }
  .frame .g-cap__h { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-2); }
  .frame .g-cap__h b { color: var(--text); font-variant-numeric: tabular-nums; }
  .frame .g-num { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 8px; background: #141B4D; color: var(--star-400); font-size: 12px; font-weight: 800; flex-shrink: 0; }

  /* extended dispatcher sidebar (standard on every Lodestar Plan desktop frame) */
  .dx-bell { position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; margin-left: auto; border-radius: 10px; color: var(--text-2); }
  .dx-bell svg { width: 18px; height: 18px; }
  .dx-bell__dot { position: absolute; top: 1px; right: 0; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--st-exception-fg); color: #FFFFFF; font-family: var(--font-ui); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .d-side__count.dx-count--bad { background: var(--st-exception-fg); color: #FFFFFF; }
</style>
<link rel="stylesheet" href="/assets/ui2.css">
</head>
<body>
<main class="board" data-name="Degradation screens · prototype screens" style="gap:56px;">
  <header class="section__head"><div class="section__kicker">Prototype screens · import into the Figma "Prototype" page</div><h2 class="section__title">Degradation screens</h2><p class="section__desc">Flow 2 (Dead Zone above Ramboda) and Flow 3 (Reefer Down at 3:45)</p></header>
  <div class="row" style="gap:64px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DR-A1</span>Offline run</div>
<div class="frame frame--phone mode-driver" data-name="DR-A1 Offline run">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">4:52</span><div class="statusbar__icons"><span class="g-sbnote">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Trip 1 · Fresh</div>
                <span class="m-pill m-pill--offline" data-p="1"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>0 waiting</span>
              </div>
              <div class="m-body">
                <div class="m-title" data-p="2">
                  <div class="m-eyebrow"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>No signal since 4:38 <span class="m-sep"></span> above Ramboda</div>
                  <div class="m-h1">Offline, and your run is saved here</div>
                </div>
                <div class="m-hero" data-p="3">
                  <div class="m-hero__label">Next · stop 1 of 2 · Nuwara Eliya</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">6:35<small>ETA</small></div>
                    <span class="m-pill m-pill--ok"><span class="dot"></span>In window</span>
                  </div>
                  <div class="m-hero__meta"><span class="id">OUT106</span> · 05:30–08:00 · unload 30 min</div>
                  <div class="g-heronote"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg><span>Plan 5:31 · model 6:35 (monsoon hill road), worked out on this phone with GPS.</span></div>
                </div>
                <div class="m-section">
                  <div class="m-section__head"><b>Stops on this trip</b><span>3 orders</span></div>
                  <div class="m-group">
                    <div class="m-row">
                      <div class="m-row__lead m-row__lead--star">1</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Nuwara Eliya</div>
                        <div class="m-row__meta"><span class="m-tag">Dry 58</span><span class="m-sep"></span><span class="m-tag m-tag--cold">Chilled 32 of 34</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">6:35</span><span class="m-row__unit">by 8:00</span></div>
                    </div>
                    <div class="m-row">
                      <div class="m-row__lead">2</div>
                      <div class="m-row__main">
                        <div class="m-row__title">Hawa Eliya</div>
                        <div class="m-row__meta"><span class="id">OUT108</span><span class="m-sep"></span><span class="m-tag m-tag--cold">1 chilled order</span></div>
                      </div>
                      <div class="m-row__trail"><span class="m-row__value">7:25</span><span class="m-row__unit">by 7:45</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar" data-p="4">
                <div class="g-actrow"><div class="m-btn" style="flex:1;"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>Arrived at stop 1</div><div class="m-btn m-btn--secondary g-sq"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div></div>
                <div class="g-note">Calls and SMS can work where data doesn't</div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DR-A2</span>POD saved offline</div>
<div class="frame frame--phone mode-driver" data-name="DR-A2 POD saved offline">
            <div class="m-screen g-tight">
              <div class="statusbar"><span class="mono">6:58</span><div class="statusbar__icons"><span class="g-sbnote">No service</span><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Stop 1 · Nuwara Eliya</div>
                <span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>4 waiting</span>
              </div>
              <div class="m-body">
                <div class="m-hero" data-p="1" style="padding:18px 20px; gap:8px;">
                  <div class="g-herohead"><span class="g-okdot"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span class="m-hero__label"><span class="id">OUT106</span> · proof of delivery recorded</span></div>
                  <div class="g-herov">Saved on phone<br><span style="color:var(--st-delivered-fg);">at 6:58</span></div>
                  <div class="m-hero__meta">Will sync by itself when signal returns. Nothing else to do.</div>
                </div>
                <div class="m-section" data-p="2">
                  <div class="m-section__head"><b>Waiting to sync · 4</b><span class="m-tag"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>All queued</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--compact">
                      <div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT106</span></div><div class="m-row__meta">6:33 · GPS at store</div></div>
                      <span class="m-tag"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                    </div>
                    <div class="m-row m-row--compact">
                      <div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104216</span></div><div class="m-row__meta">Dry <b>58 of 58</b> · signed M. Ilyas</div></div>
                      <span class="m-tag"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                    </div>
                    <div class="m-row m-row--compact">
                      <div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104217</span></div><div class="m-row__meta">Chilled <b>31 of 34</b> · 2 short · 1 damaged</div></div>
                      <span class="m-tag"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                    </div>
                    <div class="m-row m-row--compact" data-p="3">
                      <div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                      <div class="m-row__main"><div class="m-row__title">Photo · chicken tray</div><div class="m-row__meta">1.8 MB · sends after the records</div></div>
                      <span class="m-tag"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--offline"><svg class="ic" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><div class="m-banner__txt"><b>No signal since 4:38</b><span>Kept safe through a restart until the server confirms.</span></div></div>
              </div>
              <div class="m-actionbar" data-p="4">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Next: Hawa Eliya · 7:25</div>
                <div class="g-note">The store gets its receipt as soon as this syncs</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DR-A3</span>Sync queue</div>
<div class="frame frame--phone frame--tall mode-driver" data-name="DR-A3 Sync queue">
            <div class="m-screen g-tight">
              <div class="statusbar"><span class="mono">8:43</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8"/><path d="M17 20V8M22 4v16" style="opacity:.3"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#0369A1"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></g></svg></div>
                <div class="m-nav__title">Sync</div>
                <span class="m-pill m-pill--ok"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>All synced</span>
              </div>
              <div class="m-body">
                <div class="m-hero g-hero--ok" data-p="1">
                  <div class="m-hero__label" style="color:var(--st-delivered-fg);">Back online 8:40 · near Pussellawa</div>
                  <div class="m-hero__row">
                    <div class="m-hero__value">7 of 7<small>synced</small></div>
                    <span class="m-pill m-pill--ok">0 lost</span>
                  </div>
                  <div class="m-progress m-progress--ok"><div style="width:100%"></div></div>
                  <div class="m-hero__meta">2 arrivals · 3 PODs · 2 photos · smallest first</div>
                </div>
                <div class="m-banner m-banner--warn" data-p="3"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg><div class="m-banner__txt"><b>Dispatcher changed <span class="id">ORD0104209</span> while you were offline. Your delivery record was kept.</b><span>Resolved 8:43. Nothing for you to do.</span></div></div>
                <div class="m-section" data-p="2">
                  <div class="m-section__head"><b>Sent in this order</b><span>text first, photos last</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--compact"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div><div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT106</span></div><div class="m-row__meta">at the store 6:33</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:40</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div><div class="m-row__main"><div class="m-row__title">Arrival · <span class="id">OUT108</span></div><div class="m-row__meta">at the store 7:26</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:40</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg></div><div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104216</span></div><div class="m-row__meta">Dry 58/58</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:40</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div><div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104217</span></div><div class="m-row__meta">Chilled 31/34</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:40</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg></div><div class="m-row__main"><div class="m-row__title">POD · <span class="id">ORD0104209</span></div><div class="m-row__meta">Chilled 28/28 <span class="m-sep"></span> <span class="m-tag m-tag--warn">heads-up</span></div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:40</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div><div class="m-row__main"><div class="m-row__title">Photo · chicken tray</div><div class="m-row__meta">taken 6:57 · 1.8 MB</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:41</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div><div class="m-row__main"><div class="m-row__title">Photo · POD <span class="id">OUT108</span></div><div class="m-row__meta">taken 7:27</div></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>8:42</span></div>
                  </div>
                </div>
                <div class="m-section" data-p="4">
                  <div class="m-section__head"><b>SMS received late</b><span>sent 6:10 · got 8:40</span></div>
                  <div class="m-group">
                    <div class="m-row"><div class="m-row__lead g-lead--plain"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="m-row__main"><div class="m-row__title">"Skip OUT108 if after 7:30"</div><div class="m-row__meta"><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>You delivered 7:26. No action needed.</span></div></div></div>
                  </div>
                </div>
              </div>
              <div class="m-tabbar" data-name="Tab bar"><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Run</div><div class="m-tab is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/></svg>Records</div><div class="m-tab"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Dispatch</div></div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-A1</span>Store · in progress, low signal</div>
<div class="frame frame--phone mode-store" data-name="SM-A1 Store · in progress, low signal">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">6:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__title">Nuwara Eliya · <span class="id">OUT106</span></div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
              </div>
              <div class="m-body">
                <div class="m-title">
                  <div class="m-eyebrow">Today <span class="m-sep"></span> <span class="id">ORD0104216</span> · <span class="id">ORD0104217</span></div>
                  <div class="m-h2">Delivery in progress</div>
                </div>
                <div class="m-hero g-hero--off" data-p="1">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label">Arrival window</span><span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Updates paused</span></div>
                  <div class="m-hero__value" style="font-size:44px;">6:15–6:55</div>
                  <div class="m-hero__meta">Model ETA ~6:35 (plan 5:31, monsoon hill road). Last heard <b style="color:var(--text);">4:38 near Ramboda</b>, on pace. The van is in a low-signal area.</div>
                </div>
                <div class="m-section" data-p="2">
                  <div class="m-section__head"><b>2 orders · 1 van</b><span><span class="id">VEH057</span> · Ruwan B.</span></div>
                  <div class="m-group">
                    <div class="g-threadrow">
                      <div class="g-thread">
                        <div class="g-thread__line g-thread__line--ok" style="left:10%; width:40%;"></div>
                        <div class="g-thread__line g-thread__line--dash" style="left:50%; width:40%;"></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded</div><div class="thread__time">3:34</div></div>
                        <div class="thread__step is-offline"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div><div class="thread__label">En route</div><div class="thread__time">last 4:38</div></div>
                        <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">·</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="m-banner m-banner--info" data-p="3"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><div class="m-banner__txt"><b>Van already at your door?</b><span>Receive and count as normal. Confirm your receipt now, and we'll match it to the driver's record when it syncs.</span></div></div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Confirm my receipt</div>
                <div class="g-actrow"><div class="m-btn m-btn--ghost" style="flex:1;"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call driver</div><div class="m-btn m-btn--ghost" style="flex:1;"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch</div></div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-A1</span>Store · recorded offline</div>
<div class="frame frame--phone mode-store" data-name="SM-A1 Store · recorded offline">
            <div class="m-screen g-tight">
              <div class="statusbar"><span class="mono">8:40</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__title">Nuwara Eliya · <span class="id">OUT106</span></div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
              </div>
              <div class="m-body">
                <div class="m-hero g-hero--ok" data-p="1">
                  <div class="m-hero__row" style="align-items:center;"><span class="m-hero__label" style="color:var(--st-delivered-fg);">Your delivery · Tue 7 Apr</span><span class="m-pill m-pill--offline" style="background:#FFFFFF;">Recorded offline</span></div>
                  <div class="m-hero__value">6:33<small>delivered</small></div>
                  <div class="m-hero__meta">Synced 8:40. We show when it happened at your store, not when it reached us.</div>
                </div>
                <div class="m-section" data-p="2">
                  <div class="m-section__head"><b>Your receipt 7:10 vs driver's POD</b><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Match</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--compact"><div class="m-row__main"><div class="m-row__title hstack" style="gap:8px;"><span class="id">ORD0104216</span><span class="m-tag">Dry</span></div><div class="m-row__meta">All 58 units received</div></div><span class="g-eq">58 = 58</span></div>
                    <div class="m-row m-row--compact"><div class="m-row__main"><div class="m-row__title hstack" style="gap:8px;"><span class="id">ORD0104217</span><span class="m-tag m-tag--cold">Chilled</span></div><div class="m-row__meta">2 yoghurt short · credited 3:24</div><div class="m-row__meta">1 chicken tray damaged · both noted it</div></div><span class="g-eq">31 = 31</span></div>
                    <div class="m-row m-row--compact"><div class="photo" style="width:36px; height:36px; border:0; flex-shrink:0;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div><div class="m-row__main"><div class="m-row__title">Driver photo attached</div><div class="m-row__meta">Received by M. Ilyas · signed 6:58</div></div></div>
                  </div>
                </div>
                <div class="m-section">
                  <div class="m-group">
                    <div class="g-threadrow">
                      <div class="g-thread">
                        <div class="g-thread__line g-thread__line--ok" style="left:10%; width:80%;"></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon 2:38</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Planned</div><div class="thread__time">Mon 6:40</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Loaded</div><div class="thread__time">3:34</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">En route</div><div class="thread__time">3:40</div></div>
                        <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Delivered</div><div class="thread__time">6:33</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar" data-p="3">
                <div class="hstack" style="gap:8px; justify-content:center; font-size:14px; color:var(--text-2);"><span style="color:var(--st-delivered-fg); display:flex;"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b style="color:var(--text);">Nothing else to do.</b> Credit note <span class="id">CN-2604-0441</span> covers 3 units.</span></div>
                <div class="m-btn">View receipt &amp; credit note</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
  </div>
  <div class="row" style="gap:64px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DSP-A1</span>Blackout view</div>
<div class="frame frame--desktop mode-dispatcher" data-name="DSP-A1 Blackout view">
            <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>plan.lodestar.waypoint.lk/live?depot=kandy</div></div>
            <div class="d-app">
              <aside class="d-side"><div class="d-side__brand" style="white-space:nowrap; padding-right:0;"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg>Lodestar Plan<span class="dx-bell"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Today</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Cutoff queue<span class="d-side__count">90</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Plan board</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Deferrals<span class="d-side__count d-side__count--warn">2</span></div><div class="d-side__item is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Live operations<span class="d-side__count d-side__count--warn">1</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Exceptions</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>Capacity outlook</div><div class="d-side__sect">Records</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Fleet &amp; outlets</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Intelligence</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</div><div class="d-side__sect">Depots</div><div class="d-side__item" style="color:var(--text);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Peliyagoda DC<span class="d-side__count">35/38</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Kandy Hub<span class="d-side__count">22/22</span></div><div class="d-side__foot"><span class="d-avatar">NP</span><div class="vstack" style="gap:0;"><b>Nilanthi Perera</b><span class="t-3">Dispatcher · on call</span></div></div></aside>
              <div class="d-main">
                <div class="d-head">
                  <div class="d-head__txt">
                    <div class="d-eyebrow">Kandy Hub <span class="m-sep"></span> Tue 7 Apr, 5:50 AM <span class="m-sep"></span> 14 on the road · 13 reporting live · 9 of 31 stops confirmed, 2 more predicted</div>
                    <div class="d-h1">Live operations</div>
                  </div>
                  <div class="d-toolbar"><span class="d-filter">All depots</span><span class="d-filter is-on">Kandy Hub</span><span class="d-filter">Peliyagoda</span></div>
                </div>
                <div class="d-split">
                  <div class="vstack" style="gap:16px; flex:1; min-width:0;">
                    <div class="g-dhero" data-p="1">
                      <div class="g-dhero__a">
                        <div class="hstack" style="gap:10px;"><div class="d-eyebrow" style="white-space:nowrap;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg><span class="id">VEH057</span> <span class="m-sep"></span> Reefer van <span class="m-sep"></span> Ruwan Bandara</div><div class="spacer"></div><span class="m-pill m-pill--offline"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg>Predicted, not live</span></div>
                        <div class="g-dhero__v">Unknown since 4:38</div>
                        <span class="d-sub">Last seen at Ramboda, 72 min without a ping. The van is inside a known signal-loss zone on Trip 1 to Nuwara Eliya.</span>
                      </div>
                      <div class="g-dhero__b" data-p="3">
                        <span class="g-lbl"><span class="id">OUT108</span> late risk · chilled, window closes 7:45</span>
                        <div class="g-risk">61%<small>up from 18%</small></div>
                        <div class="g-bar"><div style="width:61%; background:linear-gradient(90deg,#F04438,#B42318);"></div></div>
                        <span style="font-size:13px; line-height:1.45; color:var(--text-2);">Rising because we can't hear from the van, not because it's known to be late.</span>
                      </div>
                    </div>
                    <div class="d-card">
                      <div class="d-card__head"><span class="d-card__title">Hill corridor · Kandy to Nuwara Eliya</span><span class="d-sub" style="font-size:13px; color:var(--text-3);">signal-loss zones learned from 30 days of pings</span></div>
                      <div class="g-corr">
                        <svg width="736" height="132" viewBox="0 0 736 132" style="position:absolute; left:0; top:0;">
                          <rect x="300" y="2" width="434" height="74" rx="14" fill="rgba(87,83,78,0.05)" stroke="#A8A29E" stroke-width="1.5" stroke-dasharray="6 5"/>
                          <path d="M12 44 H 330" stroke="#3B4CCA" stroke-width="5" stroke-linecap="round"/>
                          <path d="M330 44 H 706" stroke="#57534E" stroke-width="3" stroke-dasharray="8 7" stroke-linecap="round"/>
                          <rect x="3" y="35" width="18" height="18" rx="5" fill="#141B4D"/>
                          <circle cx="170" cy="44" r="6" fill="#FFFFFF" stroke="#8F98AA" stroke-width="3"/>
                          <circle cx="330" cy="44" r="17" fill="rgba(59,76,202,0.14)"/>
                          <circle cx="330" cy="44" r="9" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/>
                          <circle cx="520" cy="44" r="16" fill="#FFFFFF" stroke="#57534E" stroke-width="2" stroke-dasharray="4 3"/>
                          <circle cx="520" cy="44" r="6" fill="#FFFFFF" stroke="#15803D" stroke-width="3"/>
                          <circle cx="706" cy="44" r="16" fill="#FFFFFF" stroke="#57534E" stroke-width="2" stroke-dasharray="4 3"/>
                          <circle cx="706" cy="44" r="6" fill="#FFFFFF" stroke="#15803D" stroke-width="3"/>
                        </svg>
                        <span style="position:absolute; right:12px; top:8px; font-size:13px; font-weight:700; color:#57534E;">Known signal-loss zone</span>
                        <div class="g-corr__lbl" style="left:0; top:72px;"><b>Kandy Hub</b><span>departed 3:40</span></div>
                        <div class="g-corr__lbl" style="left:140px; top:72px;"><b>Pussellawa</b><span>coverage returns here</span></div>
                        <div class="g-corr__lbl" style="left:290px; top:84px;"><b><span class="id">VEH057</span> last seen 4:38</b><span>Ramboda · reefer 3 °C</span></div>
                        <div class="g-corr__lbl" style="left:470px; top:84px; color:var(--st-offline-fg);"><b><span class="id">OUT106</span> ~6:35–7:04</b><span>predicted on site</span></div>
                        <div class="g-corr__lbl" style="right:0; top:84px; align-items:flex-end; color:var(--st-offline-fg);"><b><span class="id">OUT108</span> ~7:28</b><span>predicted arrival</span></div>
                      </div>
                      <div class="g-legend">
                        <span><svg width="24" height="6"><path d="M1 3h22" stroke="#3B4CCA" stroke-width="4" stroke-linecap="round"/></svg>Confirmed GPS</span>
                        <span><svg width="24" height="6"><path d="M1 3h22" stroke="#57534E" stroke-width="2.5" stroke-dasharray="5 4"/></svg>Predicted (ETA + service model)</span>
                        <span><svg width="18" height="12"><rect x="1" y="1" width="16" height="10" rx="3" fill="rgba(87,83,78,0.06)" stroke="#A8A29E" stroke-dasharray="3 2"/></svg>Known signal-loss zone</span>
                      </div>
                    </div>
                    <div class="d-card" style="flex:1;">
                      <div class="d-table">
                        <div class="d-tr d-tr--head"><span class="d-td" style="width:160px">Vehicle · route</span><span class="d-td" style="width:170px">Status</span><span class="d-td" style="width:86px">Last ping</span><span class="d-td" style="width:50px">Stops</span><span class="d-td" style="width:90px">Next stop</span><span class="d-td" style="flex:1">Late risk</span></div>
                        <div class="d-tr g-dash-row"><span class="d-td" style="width:160px"><b class="id">VEH057</b> <span class="t-3">Nuwara Eliya</span></span><span class="d-td" style="width:170px"><span class="m-pill m-pill--offline" style="height:26px;">Unknown · predicted</span></span><span class="d-td g-muted" style="width:86px">4:38 · 72m</span><span class="d-td" style="width:50px">0/2</span><span class="d-td id" style="width:90px">OUT108</span><span class="d-td hstack" style="flex:1; gap:10px;"><span class="g-mini"><div style="width:61%; background:#D92D20;"></div></span><b style="color:var(--st-exception-fg);">61%</b></span></div>
                        <div class="d-tr"><span class="d-td" style="width:160px"><b class="id">VEH039</b> <span class="t-3">Kandy</span></span><span class="d-td" style="width:170px"><span class="m-tag m-tag--info"><span class="dot"></span>En route</span></span><span class="d-td" style="width:86px">5:49</span><span class="d-td" style="width:50px">3/4</span><span class="d-td id" style="width:90px">OUT085</span><span class="d-td hstack" style="flex:1; gap:10px;"><span class="g-mini"><div style="width:8%; background:#10B981;"></div></span>8%</span></div>
                        <div class="d-tr"><span class="d-td" style="width:160px"><b class="id">VEH040</b> <span class="t-3">Matale</span></span><span class="d-td" style="width:170px"><span class="m-tag m-tag--info"><span class="dot"></span>En route</span></span><span class="d-td" style="width:86px">5:50</span><span class="d-td" style="width:50px">2/5</span><span class="d-td" style="width:90px">Matale</span><span class="d-td hstack" style="flex:1; gap:10px;"><span class="g-mini"><div style="width:11%; background:#10B981;"></div></span>11%</span></div>
                        <div class="d-tr"><span class="d-td" style="width:160px"><b class="id">VEH041</b> <span class="t-3">Kegalle</span></span><span class="d-td" style="width:170px"><span class="m-tag m-tag--info"><span class="dot"></span>En route</span></span><span class="d-td" style="width:86px">5:48</span><span class="d-td" style="width:50px">1/3</span><span class="d-td" style="width:90px">Kegalle</span><span class="d-td hstack" style="flex:1; gap:10px;"><span class="g-mini"><div style="width:14%; background:#10B981;"></div></span>14%</span></div>
                        <div class="d-tr"><span class="d-td" style="width:160px"><b class="id">VEH058</b> <span class="t-3">Kandy</span></span><span class="d-td" style="width:170px"><span class="m-tag m-tag--ok"><span class="dot"></span>Trip 1 done</span></span><span class="d-td" style="width:86px">5:47</span><span class="d-td" style="width:50px">3/3</span><span class="d-td" style="width:90px">Kandy Hub</span><span class="d-td t-3" style="flex:1">·</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="d-panel">
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head" style="min-height:64px; padding-top:6px;">
                        <div class="m-row__lead g-lead--off" style="width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:transparent; box-shadow:inset 0 0 0 1.5px var(--st-offline-bd); color:var(--st-offline-fg);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg></div>
                        <div class="vstack" style="gap:1px; flex:1; min-width:0;"><span class="d-card__title"><span class="id">VEH057</span> · Reefer van</span><span style="font-size:13px; color:var(--text-2);">Trip 1 · Fresh · Nuwara Eliya</span></div>
                        <span class="m-pill m-pill--offline" style="height:26px;">Unknown</span>
                      </div>
                      <div class="g-sect" data-p="2">
                        <span class="g-lbl">Confirmed</span>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>3:34</b> Loaded · 3 orders · 988 kg · 4.6 m³</span></div>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>3:40</b> Departed Kandy Hub</span></div>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>4:38</b> On pace at Ramboda · reefer 3 °C</span></div>
                      </div>
                      <div class="g-sect g-sect--pred">
                        <span class="g-lbl">Predicted · not confirmed</span>
                        <div class="g-li"><span class="g-mark g-mark--pred"></span><span class="t-2"><b style="color:var(--text);">~6:35</b> At <span class="id">OUT106</span>, on site (service 29 min predicted)</span></div>
                        <div class="g-li"><span class="g-mark g-mark--pred"></span><span class="t-2"><b style="color:var(--text);">~7:28</b> Arrive <span class="id">OUT108</span> · window closes 7:45</span></div>
                        <div class="g-li"><span class="g-mark g-mark--pred"></span><span class="t-2"><b style="color:var(--text);">~7:43</b> Trip 1 done · 2 stops, 3 orders</span></div>
                        <span style="font-size:13px; line-height:1.45; color:var(--text-3);">Plan 5:31 · model ~6:35 (monsoon hill road). Signal returns near Pussellawa.</span>
                      </div>
                      <div class="g-sect" data-p="4" style="gap:8px;">
                        <span class="g-lbl">Act without the van's data link</span>
                        <div class="d-btn d-btn--primary" style="height:44px;"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Send SMS to driver</div>
                        <div class="d-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call Ruwan</div>
                        <div class="d-btn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Warn stores: possible delay</div>
                      </div>
                      <div class="spacer"></div>
                      <div style="padding:0 18px 18px;"><div class="g-note-d" style="background:var(--tint-brand); color:var(--brand-700);"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg><span><b>Honesty rule:</b> Lodestar never shows "on time" for a vehicle it can't hear from. Predictions stay dashed until a real ping confirms them.</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DSP-A1b</span>Provisional deferral</div>
<div class="frame frame--desktop mode-dispatcher" data-name="DSP-A1b Provisional deferral">
            <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>plan.lodestar.waypoint.lk/live/ORD0104209/defer</div></div>
            <div class="d-app">
              <aside class="d-side"><div class="d-side__brand" style="white-space:nowrap; padding-right:0;"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg>Lodestar Plan<span class="dx-bell"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Today</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Cutoff queue<span class="d-side__count">90</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Plan board</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Deferrals<span class="d-side__count d-side__count--warn">2</span></div><div class="d-side__item is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Live operations<span class="d-side__count d-side__count--warn">1</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Exceptions</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>Capacity outlook</div><div class="d-side__sect">Records</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Fleet &amp; outlets</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Intelligence</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</div><div class="d-side__sect">Depots</div><div class="d-side__item" style="color:var(--text);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Peliyagoda DC<span class="d-side__count">35/38</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Kandy Hub<span class="d-side__count">22/22</span></div><div class="d-side__foot"><span class="d-avatar">NP</span><div class="vstack" style="gap:0;"><b>Nilanthi Perera</b><span class="t-3">Dispatcher · on call</span></div></div></aside>
              <div class="g-dim">
                <div class="d-head">
                  <div class="d-head__txt">
                    <div class="d-eyebrow">Kandy Hub <span class="m-sep"></span> Tue 7 Apr, 6:10 AM <span class="m-sep"></span> 13 reporting live</div>
                    <div class="d-h1">Live operations</div>
                  </div>
                </div>
                <div class="g-dhero" style="padding:0;">
                  <div class="g-dhero__a" style="padding:16px 20px; gap:6px;">
                    <div class="d-eyebrow"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/></svg><span class="id">VEH057</span> · Unknown · predicted</div>
                    <div class="g-dhero__v" style="font-size:28px;">Unknown since 4:38</div>
                    <span class="d-sub">Last seen Ramboda · 92 min without a ping · SMS "Skip OUT108 if after 7:30" sent 6:10, not delivered</span>
                  </div>
                </div>
                <div class="d-card">
                  <div class="d-table">
                    <div class="d-tr d-tr--head"><span class="d-td" style="width:140px">Vehicle · route</span><span class="d-td" style="width:180px">Status</span><span class="d-td" style="width:88px">Last ping</span><span class="d-td" style="width:50px">Stops</span><span class="d-td" style="flex:1">Late risk</span></div>
                    <div class="d-tr g-dash-row"><span class="d-td" style="width:140px"><b class="id">VEH057</b> <span class="t-3">Nuwara Eliya</span></span><span class="d-td" style="width:180px"><span class="m-pill m-pill--offline" style="height:26px;">Unknown · predicted</span></span><span class="d-td g-muted" style="width:88px">4:38 · 92m</span><span class="d-td" style="width:50px">0/2</span><span class="d-td" style="flex:1"><b style="color:var(--st-exception-fg);">61%</b></span></div>
                    <div class="d-tr"><span class="d-td" style="width:140px"><b class="id">VEH039</b> <span class="t-3">Kandy</span></span><span class="d-td" style="width:180px"><span class="m-tag m-tag--ok"><span class="dot"></span>Trip 1 done</span></span><span class="d-td" style="width:88px">6:09</span><span class="d-td" style="width:50px">4/4</span><span class="d-td t-3" style="flex:1">·</span></div>
                    <div class="d-tr"><span class="d-td" style="width:140px"><b class="id">VEH040</b> <span class="t-3">Matale</span></span><span class="d-td" style="width:180px"><span class="m-tag m-tag--info"><span class="dot"></span>En route</span></span><span class="d-td" style="width:88px">6:10</span><span class="d-td" style="width:50px">3/5</span><span class="d-td" style="flex:1">9%</span></div>
                    <div class="d-tr"><span class="d-td" style="width:140px"><b class="id">VEH041</b> <span class="t-3">Kegalle</span></span><span class="d-td" style="width:180px"><span class="m-tag m-tag--info"><span class="dot"></span>En route</span></span><span class="d-td" style="width:88px">6:09</span><span class="d-td" style="width:50px">2/3</span><span class="d-td" style="flex:1">12%</span></div>
                  </div>
                </div>
                <div class="d-card">
                  <div class="d-card__head"><span class="d-card__title">Hill corridor · Kandy to Nuwara Eliya</span></div>
                  <div class="g-corr" style="height:96px;">
                    <svg width="580" height="80" viewBox="0 0 580 80" style="position:absolute; left:0; top:0;">
                      <rect x="236" y="2" width="342" height="74" rx="14" fill="rgba(87,83,78,0.05)" stroke="#A8A29E" stroke-width="1.5" stroke-dasharray="6 5"/>
                      <path d="M12 40 H 260" stroke="#3B4CCA" stroke-width="5" stroke-linecap="round"/>
                      <path d="M260 40 H 556" stroke="#57534E" stroke-width="3" stroke-dasharray="8 7" stroke-linecap="round"/>
                      <rect x="3" y="31" width="18" height="18" rx="5" fill="#141B4D"/>
                      <circle cx="260" cy="40" r="9" fill="#0A0F2E" stroke="#FFFFFF" stroke-width="3"/>
                      <circle cx="410" cy="40" r="15" fill="#FFFFFF" stroke="#57534E" stroke-width="2" stroke-dasharray="4 3"/>
                      <circle cx="410" cy="40" r="6" fill="#FFFFFF" stroke="#15803D" stroke-width="3"/>
                      <circle cx="556" cy="40" r="15" fill="#FFFFFF" stroke="#57534E" stroke-width="2" stroke-dasharray="4 3"/>
                      <circle cx="556" cy="40" r="6" fill="#FFFFFF" stroke="#B45309" stroke-width="3"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Drawer: the hero of this screen -->
              <div class="g-drawer">
                <div class="vstack" style="gap:6px; padding:18px 26px 12px;" data-p="1">
                  <div class="hstack" style="gap:10px;"><span class="m-tag m-tag--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Defer order · vehicle unreachable</span><div class="spacer"></div><div class="m-iconbtn" style="width:34px; height:34px; background:#F4F5F9; box-shadow:none;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></div></div>
                  <div class="d-h1" style="font-size:26px;">Defer <span class="id">ORD0104209</span> to Wed 8 Apr?</div>
                  <div class="hstack" style="gap:10px; font-size:14px; color:var(--text-2);"><span><span class="id">OUT108</span> Hawa Eliya · 28 units · 240 kg · 1.1 m³</span><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>Chilled</span></div>
                </div>
                <div style="padding:0 26px;">
                  <div class="vstack" style="gap:6px; padding:16px 18px; border-radius:18px; background:#FFFBF3; border:1.5px dashed var(--st-deferred-bd);">
                    <span class="hstack" style="gap:8px; font-family:var(--font-display); font-size:17px; font-weight:800; color:var(--st-deferred-fg);"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg>This will be provisional</span>
                    <span style="font-size:14px; line-height:1.5; color:var(--text);">VEH057 is offline and this order may already be delivered: it is predicted at <span class="id">OUT108</span> ~7:28. The deferral stays provisional until VEH057 syncs. If a delivery record arrives, it wins, and you'll be asked to confirm the undo.</span>
                    <span class="hstack" style="gap:8px; font-size:13px; color:var(--text-2);"><span class="m-pill m-pill--offline" style="height:24px; font-size:12px;">On VEH057 · stop 2</span>last ping 4:38</span>
                  </div>
                </div>
                <div class="vstack" style="gap:8px; padding:14px 26px 0;" data-p="2">
                  <span class="g-lbl">What happens when you confirm</span>
                  <div class="g-li"><span class="g-mark g-mark--n">1</span><span><b>Wed 8 Apr:</b> 1.1 m³ <b>held</b> (not booked) on <span class="id">VEH058</span> Trip 1</span></div>
                  <div class="g-li"><span class="g-mark g-mark--n">2</span><span><b>OUT108 told "at risk"</b>, not "cancelled" (preview below)</span></div>
                  <div class="g-li"><span class="g-mark g-mark--n">3</span><span><b>SMS to Ruwan:</b> "Skip OUT108 if after 7:30" · delivery tracked</span></div>
                  <div class="g-li"><span class="g-mark g-mark--n">4</span><span><b>When VEH057 syncs</b>, its records are checked against this first</span></div>
                </div>
                <div class="vstack" style="gap:8px; padding:14px 26px 0;" data-p="3">
                  <div class="hstack" style="gap:10px; align-items:flex-start;">
                    <div class="g-field" style="flex:1;"><span>Reason code</span><div class="g-input"><span class="id">CAP-TIME</span><span class="t-3">Fresh window at risk</span><div class="spacer"></div><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div></div>
                    <div class="g-field" style="width:140px;"><span>Defer to</span><div class="g-input">Wed 8 Apr</div></div>
                  </div>
                  <div class="g-input" style="height:auto; min-height:44px; padding:10px 12px; color:var(--text-2);">Vehicle unreachable since 4:38. Chilled goods must not miss the 7:45 window.</div>
                  <div class="g-li" style="font-size:13px; color:var(--text-2);"><span style="color:var(--st-delivered-fg); display:flex;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span><span>OUT108 not deferred yesterday · counts as a skip only if confirmed</span></div>
                </div>
                <div class="vstack" style="gap:6px; padding:12px 26px 0;" data-p="4">
                  <span class="g-lbl">Store will see · Lodestar Store</span>
                  <div class="vstack" style="gap:3px; padding:12px 14px; border-radius:16px; background:#F4F5F9;">
                    <span style="font-family:var(--font-display); font-size:14px; font-weight:800;">Chilled order may arrive late</span>
                    <span style="font-size:13px; line-height:1.45; color:var(--text-2);">The van is in a low-signal area. We've held a Wed 8 Apr slot just in case. <b style="color:var(--text);">This is not a cancellation.</b></span>
                  </div>
                </div>
                <div class="spacer"></div>
                <div class="hstack" style="gap:8px; padding:14px 26px; border-top:1px solid var(--hair);">
                  <div class="d-btn d-btn--ghost">Cancel</div>
                  <div class="spacer"></div>
                  <div class="d-btn">Wait 15 min more</div>
                  <div class="d-btn d-btn--primary" style="background:linear-gradient(135deg,#D97706 0%,#B45309 100%); box-shadow:0 6px 16px rgba(180,83,9,.28);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Make provisional deferral</div>
                </div>
              </div>
            </div>
          </div>
    </div>
  </div>
  <div class="row" style="gap:64px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DSP-A2</span>Reconcile conflict</div>
<div class="frame frame--desktop mode-dispatcher" data-name="DSP-A2 Reconcile conflict">
            <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>plan.lodestar.waypoint.lk/live/sync/VEH057</div></div>
            <div class="d-app">
              <aside class="d-side"><div class="d-side__brand" style="white-space:nowrap; padding-right:0;"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg>Lodestar Plan<span class="dx-bell"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Today</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Cutoff queue<span class="d-side__count">90</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Plan board</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Deferrals<span class="d-side__count d-side__count--warn">3</span></div><div class="d-side__item is-on"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Live operations<span class="d-side__count d-side__count--warn">1</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Exceptions</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>Capacity outlook</div><div class="d-side__sect">Records</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Fleet &amp; outlets</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Intelligence</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</div><div class="d-side__sect">Depots</div><div class="d-side__item" style="color:var(--text);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Peliyagoda DC<span class="d-side__count">35/38</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Kandy Hub<span class="d-side__count">22/22</span></div><div class="d-side__foot"><span class="d-avatar">NP</span><div class="vstack" style="gap:0;"><b>Nilanthi Perera</b><span class="t-3">Dispatcher · on call</span></div></div></aside>
              <div class="d-main">
                <div class="d-head">
                  <div class="d-head__txt">
                    <div class="d-eyebrow">Live operations <span class="m-sep"></span> Sync · <span class="id">VEH057</span> <span class="m-sep"></span> Tue 7 Apr, 8:40 AM</div>
                    <div class="d-h1">1 conflict needs your decision</div>
                  </div>
                  <span class="m-pill m-pill--ok"><span class="dot"></span>14 reporting live</span>
                </div>
                <div class="g-dbanner g-dbanner--info" data-p="1"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><span><b>VEH057 back online at 8:40</b> near Pussellawa · 7 records received · <b>6 applied automatically</b> · 1 needs you</span><div class="spacer"></div><span>Offline 4:38 to 8:40 · 4 h 02 m</span></div>
                <div class="d-split">
                  <div class="vstack" style="gap:14px; flex:1; min-width:0;">
                    <div class="hstack" style="gap:10px;"><span style="color:var(--st-deferred-fg); display:flex;"><svg class="ic" viewBox="0 0 24 24"><path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/></svg></span><span class="d-card__title">Conflict on <span class="id">ORD0104209</span> · <span class="id">OUT108</span> Hawa Eliya</span><span class="m-tag m-tag--cold"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>Chilled · 28 units · 240 kg · 1.1 m³</span><div class="spacer"></div><span class="m-pill m-pill--warn">Needs your decision</span></div>
                    <div class="hstack" style="gap:0; align-items:stretch;" data-p="2">
                      <div class="g-cmp g-cmp--plan">
                        <div class="g-cmp__who"><span class="g-av">NP</span><span>Your change · 6:10</span><div class="spacer"></div><span class="m-pill m-pill--warn" style="height:24px; font-size:12px;">Provisional</span></div>
                        <div class="g-cmp__what" style="color:var(--text-2);">Deferred to Wed 8 Apr</div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg><span>Reason <b class="id">CAP-TIME</b> · "Vehicle unreachable since 4:38"</span></div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg><span>Held <b>1.1 m³</b> on <b class="id">VEH058</b> · Wed Trip 1</span></div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span>OUT108 told <b>"at risk"</b> at 6:10</span></div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/></svg><span>Field evidence at the time: <b>none</b> (vehicle offline)</span></div>
                      </div>
                      <div class="g-vs">vs</div>
                      <div class="g-cmp g-cmp--field">
                        <div class="g-cmp__who"><span class="g-av" style="background:#141B4D; color:#FFFFFF;">RB</span><span>Field record · 7:26 · captured offline</span><div class="spacer"></div><span class="m-pill m-pill--ok" style="height:24px; font-size:12px;"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Evidence</span></div>
                        <div class="g-cmp__what" style="color:var(--st-delivered-fg); font-size:24px;">Delivered at OUT108 · POD 28/28</div>
                        <div class="hstack" style="gap:10px;">
                          <div class="photo" style="width:84px; height:56px; border:0;"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>
                          <div style="display:flex; align-items:center; justify-content:center; width:124px; height:56px; border-radius:12px; background:#F6F7FB;"><svg width="96" height="34" viewBox="0 0 96 34"><path d="M4 24 C 14 6, 20 30, 30 16 S 44 4, 50 20 S 64 28, 70 12 C 74 4, 80 22, 92 14" fill="none" stroke="#1D2433" stroke-width="2" stroke-linecap="round"/></svg></div>
                          <div class="vstack" style="gap:1px; font-size:13px; color:var(--text-2);"><span>Photo + signature</span><span>by R. Bandara</span></div>
                        </div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>GPS <b>at the store</b> at 7:26 (±12 m)</span></div>
                        <div class="g-ev"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Device time <b>matches GPS clock</b> · synced 8:40</span></div>
                      </div>
                    </div>
                    <div class="d-card" style="flex:1; background:linear-gradient(180deg,#F1FBF6 0%,#FFFFFF 100%); box-shadow:0 0 0 1.5px var(--st-delivered-bd), 0 8px 24px rgba(4,120,87,.08);" data-p="3">
                      <div class="vstack" style="gap:6px; padding:18px 20px 8px;">
                        <div class="hstack" style="gap:10px;"><span class="g-okdot" style="display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; background:var(--st-delivered-fg); color:#FFFFFF;"><svg class="ic ic--sm" viewBox="0 0 24 24" style="stroke-width:3"><path d="M20 6 9 17l-5-5"/></svg></span><span class="d-h1" style="font-size:22px;">Recommended: keep the delivery</span><div class="spacer"></div><span class="d-sub" style="font-size:13px;">5 changes · all reversible for 24 h</span></div>
                        <span style="font-size:14px; line-height:1.5; color:var(--text-2); padding-left:40px;"><b style="color:var(--text);">Rule: signed field evidence wins.</b> A POD with signature, photo and GPS at the store beats a plan edit made without contact with the field.</span>
                      </div>
                      <div class="g-res" style="padding:4px 20px 6px 60px;">
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Keep delivery:</b> <span class="id">ORD0104209</span> → Delivered 7:26</span></div>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Undo provisional deferral:</b> no skip recorded against OUT108</span></div>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Release 1.1 m³</b> held on <span class="id">VEH058</span> (Wed Trip 1)</span></div>
                        <div class="g-li"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Correct OUT108:</b> "Delivered 7:26. Please ignore the 6:10 at-risk notice."</span></div>
                        <div class="g-li"><span class="g-mark" style="background:#EEF0F6; color:var(--text-3);"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><span><b>Keep both events in the audit log</b> <span class="t-3">(always on)</span></span></div>
                      </div>
                      <div class="spacer"></div>
                      <div class="hstack" style="gap:10px; padding:12px 20px 18px 60px;" data-p="4">
                        <div class="d-btn d-btn--primary" style="height:44px; padding:0 22px; background:linear-gradient(135deg,#10B981 0%,#047857 100%); box-shadow:0 6px 16px rgba(4,120,87,.28);"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Resolve: keep the delivery</div>
                        <div class="d-btn d-btn--ghost">Keep my deferral (requires reason)</div>
                        <div class="spacer"></div>
                        <span class="d-sub" style="font-size:13px; line-height:1.4; width:160px; margin-left:16px;">Ruwan and OUT108 are told the outcome automatically</span>
                      </div>
                    </div>
                  </div>
                  <div class="d-panel" style="width:340px;">
                    <div class="d-card">
                      <div class="d-card__head"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg><span class="d-card__title">Audit log · <span class="id">ORD0104209</span></span><span class="spacer"></span><span class="m-tag m-tag--ok" style="font-size:12.5px;"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Tamper-evident</span></div>
                      <div class="vstack" style="gap:0; padding:0 18px 12px;">
                        <div class="g-audit"><span class="g-audit__t">3:40</span><span class="g-audit__rail"><i></i></span><span>Departed Kandy Hub on <span class="id">VEH057</span></span></div>
                        <div class="g-audit"><span class="g-audit__t">4:38</span><span class="g-audit__rail"><i></i></span><span>Last ping · Ramboda</span></div>
                        <div class="g-audit"><span class="g-audit__t">4:53</span><span class="g-audit__rail"><i style="background:#FFFFFF; border:1.5px dashed var(--st-offline-fg);"></i></span><span>Status → Unknown · predicted <span class="t-3">(system)</span></span></div>
                        <div class="g-audit"><span class="g-audit__t">6:10</span><span class="g-audit__rail"><i style="background:var(--st-deferred-fg);"></i></span><span><b>Provisional deferral</b> by N. Perera · <span class="id">CAP-TIME</span></span></div>
                        <div class="g-audit"><span class="g-audit__t">6:10</span><span class="g-audit__rail"><i style="background:var(--st-deferred-fg);"></i></span><span>OUT108 notified "at risk" · SMS to driver sent</span></div>
                        <div class="g-audit"><span class="g-audit__t">7:26</span><span class="g-audit__rail"><i style="background:var(--st-delivered-fg);"></i></span><span><b>Delivered</b> by R. Bandara · POD 28/28 <span class="t-3">(received 8:40)</span></span></div>
                        <div class="g-audit"><span class="g-audit__t">8:40</span><span class="g-audit__rail"><i></i></span><span>SMS delivered to driver (2 h 30 m late)</span></div>
                        <div class="g-audit"><span class="g-audit__t">8:40</span><span class="g-audit__rail"><i style="background:var(--st-exception-fg);"></i></span><span><b>Conflict detected</b> · awaiting N. Perera</span></div>
                      </div>
                    </div>
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><span style="color:var(--st-delivered-fg); display:flex;"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span class="d-card__title">Synced without conflict</span><div class="spacer"></div><span style="font-size:13px; color:var(--text-3);">6 at 8:40</span></div>
                      <div class="vstack" style="gap:0; padding:0 18px 12px;">
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">Arrival <span class="id">OUT106</span></span><span class="t-3">6:33</span></div>
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">POD <span class="id">ORD0104216</span> · 58/58</span><span class="t-3">6:58</span></div>
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">POD <span class="id">ORD0104217</span> · 31/34</span><span class="t-3">6:58</span></div>
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">Photo · damaged chicken tray</span><span class="t-3">6:57</span></div>
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">Arrival <span class="id">OUT108</span></span><span class="t-3">7:26</span></div>
                        <div class="g-li" style="padding:5px 0;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span style="flex:1;">Photo · POD <span class="id">OUT108</span></span><span class="t-3">7:27</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  </div>
  <div class="row" style="gap:64px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">LD-B1</span>Vehicle can't depart</div>
<div class="frame frame--phone frame--tall mode-loader" data-name="LD-B1 Vehicle can't depart">
            <div class="m-screen">
              <div class="statusbar"><span class="mono">3:45</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
                <div class="m-nav__title">Pre-departure check</div>
                <span class="m-pill m-pill--ok"><span class="dot"></span>Online</span>
              </div>
              <div class="m-body">
                <div class="m-title">
                  <div class="m-eyebrow">Peliyagoda <span class="m-sep"></span> Bay P5 <span class="m-sep"></span> 3:45</div>
                  <div class="m-h1"><span style="color:var(--st-exception-fg);">VEH006</span> can't depart</div>
                </div>
                <div class="m-hero g-hero--bad" data-p="1">
                  <div class="m-hero__row">
                    <div class="vstack" style="gap:6px;"><span class="m-hero__label" style="color:var(--st-exception-fg);">Reefer unit reads</span><div class="m-hero__value" style="font-size:64px; color:var(--st-exception-fg);">9 °C</div></div>
                    <div class="g-side"><span>Needs</span><b>≤ 4 °C</b></div>
                  </div>
                  <div class="g-trend"><span>3:15 · 6°</span><span>3:30 · 8°</span><span style="color:var(--st-exception-fg); font-weight:800;">3:45 · 9° rising</span></div>
                </div>
                <div class="m-section" data-p="2">
                  <div class="m-section__head"><b>What's wrong?</b><span>tap one</span></div>
                  <div class="m-choices">
                    <div class="m-choice is-on"><svg class="ic" viewBox="0 0 24 24"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>Not cooling</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Engine</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Door seal</div>
                    <div class="m-choice"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Other</div>
                  </div>
                </div>
                <div class="m-section" data-p="3">
                  <div class="m-section__head"><b>On the dock · 6 orders · 2 trips</b><span>10.3 m³</span></div>
                  <div class="m-group">
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--ok">T1</div><div class="m-row__main"><div class="m-row__title">Wattala</div><div class="m-row__meta"><span class="id">OUT034</span> · Trip 1 Gampaha</div></div><div class="m-row__trail"><span class="m-row__value">1.8</span><span class="m-row__unit">m³</span></div></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--ok">T1</div><div class="m-row__main"><div class="m-row__title">Negombo</div><div class="m-row__meta"><span class="id">OUT031</span> · Trip 1 Gampaha</div></div><div class="m-row__trail"><span class="m-row__value">1.6</span><span class="m-row__unit">m³</span></div></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--ok">T1</div><div class="m-row__main"><div class="m-row__title">Ja-Ela</div><div class="m-row__meta"><span class="id">OUT028</span><span class="m-sep"></span><span class="m-tag m-tag--brand"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Protected</span></div></div><div class="m-row__trail"><span class="m-row__value">1.5</span><span class="m-row__unit">m³</span></div></div>
                    <div class="m-row m-row--compact"><div class="m-row__lead m-row__lead--ok">T2</div><div class="m-row__main"><div class="m-row__title">Colombo · 3 stores</div><div class="m-row__meta">Trip 2 Colombo</div></div><div class="m-row__trail"><span class="m-row__value">5.4</span><span class="m-row__unit">m³</span></div></div>
                    <div class="m-row m-row--ok"><div class="m-row__lead m-row__lead--ok" style="background:var(--st-delivered-fg); color:#FFFFFF;"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="m-row__main"><div class="m-row__title">Goods back in cold room</div><div class="m-row__meta">Keeps the cold chain</div></div></div>
                  </div>
                </div>
              </div>
              <div class="m-actionbar" data-p="4">
                <div class="m-btn m-btn--danger"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Notify dispatch now</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Add photo of reefer display</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">SM-B1</span>Store · later arrival notice</div>
<div class="frame frame--phone mode-store" data-name="SM-B1 Store · later arrival notice">
            <div class="m-screen g-tight">
              <div class="statusbar"><span class="mono">3:50</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/></svg></div></div>
              <div class="m-nav">
                <div class="m-iconbtn" style="background:transparent;box-shadow:none;border:0;padding:0;"><svg viewBox="0 0 32 32" width="36" height="36" style="width:36px;height:36px;flex-shrink:0;"><rect width="32" height="32" rx="8" fill="#047857"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/></g></svg></div>
                <div class="m-nav__title">Negombo · <span class="id">OUT031</span></div>
                <div class="m-iconbtn"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
              </div>
              <div class="m-body">
                <div class="m-title">
                  <div class="m-eyebrow">Chilled · <span class="id">ORD0104158</span> <span class="m-sep"></span> re-planned 3:47</div>
                  <div class="m-h2">Coming later than usual</div>
                </div>
                <div class="m-hero" data-p="1">
                  <div class="m-hero__row">
                    <div class="vstack" style="gap:6px;"><span class="m-hero__label">New arrival</span><div class="m-hero__value" style="font-size:56px;">~7:20</div></div>
                    <div class="g-side"><span>Window closes</span><b>8:00</b></div>
                  </div>
                  <div class="m-progress m-progress--warn"><div style="width:80%"></div></div>
                  <div class="m-hero__meta" data-p="3">About 40 min to spare. We'll message you if anything changes.</div>
                </div>
                <div class="m-banner m-banner--warn" data-p="2"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg><div class="m-banner__txt"><b>Vehicle fault at the depot, 3:45</b><span>Your goods stayed cold. We prioritised you over deferral: they now go on reefer van <span class="id">VEH036</span> instead of waiting until Wed.</span></div></div>
                <div class="m-group">
                  <div class="g-threadrow">
                    <div class="g-thread">
                      <div class="g-thread__line g-thread__line--warn" style="left:10%; width:20%;"></div>
                      <div class="g-thread__line" style="left:30%; width:60%;"></div>
                      <div class="thread__step is-done"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div class="thread__label">Received</div><div class="thread__time">Mon</div></div>
                      <div class="thread__step is-warn"><div class="thread__node"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></div><div class="thread__label">Moved</div><div class="thread__time">3:47</div></div>
                      <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Loaded</div><div class="thread__time">·</div></div>
                      <div class="thread__step"><div class="thread__node"></div><div class="thread__label">En route</div><div class="thread__time">·</div></div>
                      <div class="thread__step"><div class="thread__node"></div><div class="thread__label">Delivered</div><div class="thread__time">~7:20</div></div>
                    </div>
                  </div>
                  <div class="m-row" data-p="4"><span class="check"></span><div class="m-row__main"><div class="m-row__title" style="font-size:15px;">Keep 1 receiver until 8:00</div><div class="m-row__meta">Your dry order is on its usual run</div></div></div>
                </div>
              </div>
              <div class="m-actionbar">
                <div class="m-btn">Got it</div>
                <div class="m-btn m-btn--ghost"><svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call dispatch</div>
              </div>
              <div class="homebar"><div></div></div>
            </div>
          </div>
    </div>
  </div>
  <div class="row" style="gap:64px; align-items:flex-start;">
    <div class="screen-block"><div class="screen-label"><span class="screen-label__id">DSP-B1</span>Re-plan diff</div>
<div class="frame frame--desktop mode-dispatcher" data-name="DSP-B1 Re-plan diff">
            <div class="browserbar"><div class="browserbar__dots"><div></div><div></div><div></div></div><div class="browserbar__url"><svg class="ic ic--sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>plan.lodestar.waypoint.lk/plan/PLG/replan/VEH006</div></div>
            <div class="d-app">
              <aside class="d-side"><div class="d-side__brand" style="white-space:nowrap; padding-right:0;"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#3B4CCA"/><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg>Lodestar Plan<span class="dx-bell"><svg class="ic" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Today</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Cutoff queue<span class="d-side__count">90</span></div><div class="d-side__item is-on"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Plan board<span class="d-side__count d-side__count--warn">1</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></svg>Deferrals<span class="d-side__count d-side__count--warn">2</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Live operations</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>Exceptions</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>Capacity outlook</div><div class="d-side__sect">Records</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>Fleet &amp; outlets</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Intelligence</div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</div><div class="d-side__sect">Depots</div><div class="d-side__item" style="color:var(--text);"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Peliyagoda DC<span class="d-side__count">35/38</span></div><div class="d-side__item"><svg class="ic" viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/></svg>Kandy Hub<span class="d-side__count">22/22</span></div><div class="d-side__foot"><span class="d-avatar">NP</span><div class="vstack" style="gap:0;"><b>Nilanthi Perera</b><span class="t-3">Dispatcher · on call</span></div></div></aside>
              <div class="d-main">
                <div class="d-head">
                  <div class="d-head__txt">
                    <div class="d-eyebrow"><span class="m-tag m-tag--brand"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/></svg>Planning agent drafted this re-plan at 3:47</span> <span class="m-sep"></span> approve to send <span class="m-sep"></span> Peliyagoda DC</div>
                    <div class="d-h1">Re-plan for VEH006: 3 changes, 6 orders</div>
                    <div class="d-sub">6 of 6 orders served · 0 deferrals · protected outlet first · OUT031 at 22% late risk, noted</div>
                  </div>
                  <span class="d-btn d-btn--ghost">Discard</span>
                  <span class="d-btn">Edit manually</span>
                  <span class="d-btn d-btn--primary" data-p="5"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Approve &amp; send</span>
                </div>
                <div class="g-dbanner g-dbanner--bad" data-p="1" style="padding-right:44px;"><svg class="ic" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg><span><b>VEH006 can't depart</b> · reefer 9 °C (needs ≤ 4 °C) · flagged at Bay P5, 3:45 · goods back in cold room</span><div class="spacer"></div><b style="color:var(--st-exception-fg); white-space:nowrap;">6 chilled orders · 2 trips · 10.3 m³</b></div>
                <div class="d-split">
                  <div class="vstack" style="gap:12px; flex:1; min-width:0;">
                    <div class="d-card" data-p="2">
                      <div class="g-chg">
                        <div class="g-chg__h"><span class="g-num">1</span><span class="g-chg__t">Merge into <span class="id">VEH002</span> Trip 2 · Fresh · Gampaha</span><div class="spacer"></div><span class="m-pill m-pill--ok" style="height:26px;">100 → 149 min · 258/270</span></div>
                        <div class="g-ord"><b>OUT028 Ja-Ela</b><span class="id t-3">ORD0104173</span><span class="m-tag m-tag--cold"><span class="dot"></span>1.5 m³</span><span class="m-tag m-tag--brand"><svg class="ic" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>Protected · score 91 · first stop</span><div class="spacer"></div><b style="color:var(--st-delivered-fg); font-size:13px;">~6:40 · closes 8:00</b></div>
                        <div class="g-ord"><b>OUT034 Wattala</b><span class="id t-3">ORD0104150</span><span class="m-tag m-tag--cold"><span class="dot"></span>1.8 m³</span><div class="spacer"></div><b style="color:var(--st-delivered-fg); font-size:13px;">inside window</b></div>
                        <div class="g-diff"><s>VEH006 Trip 1</s><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg><b>VEH002 Trip 2 (now 5 stops)</b><span class="t-3" style="font-weight:500;">same brand + district · 3.3 m³</span></div>
                      </div>
                    </div>
                    <div class="d-card">
                      <div class="g-chg">
                        <div class="g-chg__h"><span class="g-num">2</span><span class="g-chg__t">Move VEH006 Trip 2 · Fresh · Colombo, whole</span><span class="d-sub" style="font-size:13px; color:var(--text-3);">3 orders · 5.4 m³ · 85 min</span><div class="spacer"></div><span class="m-pill m-pill--ok" style="height:26px;">VEH005 · 247/270</span></div>
                        <div class="g-diff"><s>VEH006 Trip 2</s><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg><b>VEH005 Trip 2</b><span class="t-3" style="font-weight:500;">after Trip 1 Kalutara (162 min) · stop order unchanged</span></div>
                      </div>
                    </div>
                    <div class="d-card" style="box-shadow:0 0 0 1.5px var(--st-deferred-bd), 0 4px 14px rgba(15,20,50,.04);" data-p="3">
                      <div class="g-chg">
                        <div class="g-chg__h"><span class="g-num">3</span><span class="g-chg__t">OUT031 Negombo</span><span class="id t-3" style="font-size:13px;">ORD0104158</span><span class="m-tag m-tag--cold"><span class="dot"></span>Chilled 1.6 m³</span><div class="spacer"></div><span class="m-pill m-pill--warn" style="height:26px;">Your call · agent suggests A</span></div>
                        <div class="hstack" style="gap:10px; padding-left:32px; align-items:stretch;">
                          <div class="g-opt g-opt--on">
                            <div class="hstack" style="gap:8px;"><span class="radio is-on" style="border-color:var(--brand-600);"><div style="background:var(--brand-600);"></div></span><b style="font-size:14px;">A · VEH036 reefer van · Trip 2</b></div>
                            <span style="font-size:13px; color:var(--text-2);">Arrives <b style="color:var(--text);">~7:20</b> · 40 min before window closes</span>
                            <div class="hstack" style="gap:8px; font-size:13px;"><span class="g-mini"><div style="width:22%; background:#F5B83D;"></div></span><b style="color:var(--st-deferred-fg);">late risk 22%</b></div>
                          </div>
                          <div class="g-opt">
                            <div class="hstack" style="gap:8px;"><span class="radio"></span><b style="font-size:14px;">B · Defer to Wed 8 Apr</b></div>
                            <span style="font-size:13px; color:var(--text-2);">Reason <b class="id" style="color:var(--text);">VEH-DOWN</b> · days since served 1</span>
                            <span style="font-size:13px; color:var(--text-2);">Deferral score <b style="color:var(--text);">27</b> · allowed, not protected</span>
                          </div>
                        </div>
                        <div class="g-input" style="margin-left:32px; font-size:13px; color:var(--text-2);"><svg class="ic ic--sm" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Note: "Chose A: New Year week, Negombo shelves low. Window to 8:00, store warned."</div>
                      </div>
                    </div>
                    <div class="g-note-d" style="background:#EEF0F6; color:var(--text-2);"><svg class="ic ic--sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>The agent rejected: <b>OUT031 onto VEH002 Trip 2</b> (285/270 min · CAP-TIME) · <b>chilled on a dry truck</b> (CAP-REEFER) · <b>3rd trip on any vehicle</b> (max 2/day) · <b>defer OUT028</b> (protected).</span></div>
                  </div>
                  <div class="d-panel" data-p="4">
                    <div class="d-card">
                      <div class="d-card__head"><span class="d-card__title">Rules the agent checked</span><div class="spacer"></div><span class="m-tag m-tag--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>All pass</span></div>
                      <div class="g-sect" style="padding-top:12px; gap:8px;">
                        <span class="g-lbl"><span class="id">VEH002</span> · Trip 2 · Gampaha · 3 → 5 stops</span>
                        <div class="g-cap"><div class="g-cap__h"><span>Fresh minutes · Trip 1 109 + Trip 2 149</span><b>258 / 270</b></div><div class="g-bar"><div style="width:96%; background:linear-gradient(90deg,#FFD37A,#F5B83D);"></div></div></div>
                        <span style="font-size:13px; color:var(--text-3);">Trip 2 = 37 + 9×4 + 45 + 15 + 16 = 149 (was 100)</span>
                        <div class="hstack" style="gap:16px;"><div class="g-cap" style="flex:1;"><div class="g-cap__h"><span>Weight</span><b>1,700 / 3,990 kg</b></div><div class="g-bar"><div style="width:43%; background:linear-gradient(90deg,#10B981,#047857);"></div></div></div><div class="g-cap" style="flex:0.8;"><div class="g-cap__h"><span>Chilled</span><b>7.9 / 21.1 m³</b></div><div class="g-bar"><div style="width:37%; background:linear-gradient(90deg,#10B981,#047857);"></div></div></div></div>
                      </div>
                      <div class="g-sect">
                        <span class="g-lbl"><span class="id">VEH005</span> · Trip 2 · Colombo (from VEH006)</span>
                        <div class="g-cap"><div class="g-cap__h"><span>Fresh min · Kalutara 162 + Colombo 85</span><b>247 / 270</b></div><div class="g-bar"><div style="width:91%; background:linear-gradient(90deg,#10B981,#047857);"></div></div></div>
                        <div class="g-cap__h" style="font-size:13px;"><span>Chilled vol · weight</span><b>5.4/33.4 m³ · 1,160/6,840 kg</b></div>
                      </div>
                      <div class="g-sect">
                        <span class="g-lbl"><span class="id">VEH036</span> · Trip 2 · option A · OUT031</span>
                        <div class="g-cap__h" style="font-size:13px;"><span>Chilled vol · weight</span><b>1.6/7.0 m³ · 350/1,040 kg</b></div>
                        <span style="font-size:13px; color:var(--text-2);">2nd trip of 2 allowed · ~7:20, 40 min buffer</span>
                      </div>
                    </div>
                    <div class="d-card" style="flex:1;">
                      <div class="d-card__head"><span class="d-card__title">On approval, not before</span></div>
                      <div class="vstack" style="gap:8px; padding:0 18px 16px;">
                        <div class="g-li" style="font-size:13px;"><span class="g-mark g-mark--warn"><svg class="ic" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></span><span><b>Bay P2:</b> VEH002 returns 5:43 and reloads Trip 2 with OUT028 + OUT034</span></div>
                        <div class="g-li" style="font-size:13px;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>VEH005 · VEH036:</b> updated load sheets · VEH006 goods in cold room</span></div>
                        <div class="g-li" style="font-size:13px;"><span class="g-mark g-mark--ok"><svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>6 stores told</b> their new times · OUT031 told ~7:20</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  </div>
</main>
</body>
</html>
` }} />
  );
}
