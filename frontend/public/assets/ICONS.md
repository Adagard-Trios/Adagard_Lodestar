# Inline SVG icon library (copy-paste; never use <use> sprites — html.to.design needs inline paths)

Wrapper for every icon (24×24 viewBox, stroke icons):
`<svg class="ic" viewBox="0 0 24 24">…paths…</svg>`   sizes: add `ic--sm` (14) / `ic--lg` (24) / `ic--xl` (32)

| name | inner paths |
|---|---|
| lodestar (logo, FILLED) | `<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#141B4D"/><path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D"/><circle cx="16" cy="16" r="2.2" fill="#141B4D"/></svg>` |
| check | `<path d="M20 6 9 17l-5-5"/>` |
| x | `<path d="M18 6 6 18M6 6l12 12"/>` |
| alert | `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>` |
| info | `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>` |
| clock | `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>` |
| truck | `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>` |
| van | `<path d="M3 17V7a2 2 0 0 1 2-2h10l4 5h1a2 2 0 0 1 2 2v5h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M15 5v5h4"/>` |
| snowflake (chilled) | `<path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>` |
| package | `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>` |
| wifi | `<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>` |
| wifi-off | `<path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/>` |
| cloud-upload | `<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/>` |
| refresh | `<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>` |
| camera | `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>` |
| pen (signature) | `<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>` |
| map-pin | `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>` |
| navigation | `<path d="m3 11 19-9-9 19-2-8-8-2z"/>` |
| phone | `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>` |
| bell | `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>` |
| user | `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>` |
| users | `<circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M16 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/>` |
| calendar | `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>` |
| layers | `<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>` |
| lock (seal) | `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` |
| fuel | `<path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>` |
| weight | `<circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.9 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.93-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>` |
| box (volume) | `<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>` |
| arrow-right | `<path d="M5 12h14M12 5l7 7-7 7"/>` |
| arrow-left | `<path d="M19 12H5M12 19l-7-7 7-7"/>` |
| chevron-right | `<path d="m9 18 6-6-6-6"/>` |
| chevron-down | `<path d="m6 9 6 6 6-6"/>` |
| plus | `<path d="M12 5v14M5 12h14"/>` |
| minus | `<path d="M5 12h14"/>` |
| search | `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>` |
| filter | `<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>` |
| grip (drag) | `<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>` |
| sparkles (auto-plan) | `<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>` |
| shield (protected) | `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>` |
| history | `<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>` |
| message | `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` |
| thermometer | `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>` |
| store | `<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/>` |
| home/depot (warehouse) | `<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>` |
| list | `<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>` |
| grid | `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>` |
| chart (trend) | `<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>` |
| battery | `<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/>` |
| signal (status bar) | `<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>` |
| eye | `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>` |
| dots (more) | `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>` |
| log-out | `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>` |
| moon | `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>` |
| sun | `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>` |
| split (conflict) | `<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M21 3l-7.83 7.83"/>` |

Status bar snippet (phone):
```html
<div class="statusbar"><span class="mono">4:52</span><div class="statusbar__icons"><svg class="ic" viewBox="0 0 24 24"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/></svg></div></div>
```
