// The start page: one URL, every role. Each card opens that role's app on this origin: the desk faces
// (/store, /plan, /admin) and the field app's browser build (/field/, Dock and Run, sized for a phone).
// Face logos and colours come from the design (Designing/assets/face-logos.html).
import Link from "next/link";
import type { ReactNode } from "react";

type Role = {
  key: string;
  face: string;
  role: string;
  text: string;
  href: string;
  persona: string;
  color: string;
  icon: ReactNode;
  also?: { label: string; href: string };
};

const ROLES: Role[] = [
  {
    key: "store", face: "Lodestar Store", role: "Store manager", text: "Place an order, see the ETA, confirm receipt.",
    href: "/store", persona: "fathima", color: "#047857",
    icon: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v8h14v-8M10 21v-5h4v5" /></>,
    also: { label: "Phone app", href: "/field/s/sm-05-sign-in" },
  },
  {
    key: "plan", face: "Lodestar Plan", role: "Dispatcher", text: "Plan the run, approve it, watch it live.",
    href: "/plan", persona: "nilanthi", color: "#3B4CCA",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    key: "dock", face: "Lodestar Dock", role: "Loader", text: "Load the vehicle, flag a shortfall, release it.",
    href: "/field/s/ld-06-sign-in", persona: "kasun", color: "#6D28D9",
    icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7 12 12l8.7-5M12 22V12" /></>,
  },
  {
    key: "run", face: "Lodestar Run", role: "Driver", text: "Drive the run, prove each delivery.",
    href: "/field/s/dr-06-sign-in", persona: "ruwan", color: "#0369A1",
    icon: <path d="m3 11 19-9-9 19-2-8-8-2z" />,
  },
  {
    key: "admin", face: "Lodestar Admin", role: "Admin", text: "People, phones, outlets, audit log.",
    href: "/admin", persona: "admin", color: "#334155",
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

function Logo({ color, children }: { color: string; children: ReactNode }) {
  return (
    <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="8" fill={color} />
      <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{children}</g>
    </svg>
  );
}

/** The desk faces are routes of this app; the field app (/field/) is another app on the same origin. */
function Go({ href, className, label, children }: { href: string; className: string; label?: string; children: ReactNode }) {
  if (href.startsWith("/field/")) return <a href={href} className={className} aria-label={label}>{children}</a>;
  return <Link href={href} className={className} aria-label={label}>{children}</Link>;
}

export default function Home() {
  return (
    <main className="lv-start">
      <header className="lv-start__head">
        <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#141B4D" />
          <path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D" />
          <circle cx="16" cy="16" r="2.2" fill="#141B4D" />
        </svg>
        <div>
          <span className="lv-start__eyebrow">Waypoint Group</span>
          <h1>Waypoint Lodestar</h1>
        </div>
      </header>
      <p className="lv-start__lede">Every order, one thread. Choose your role and sign in.</p>

      <nav className="lv-start__grid" aria-label="Roles">
        {ROLES.map(r => (
          <div key={r.key} className="lv-start__card" data-role={r.key}>
            <Go href={r.href} className="lv-start__main" label={`${r.role}: ${r.face}`}>
              <Logo color={r.color}>{r.icon}</Logo>
              <span className="lv-start__txt">
                <b>{r.role}</b>
                <span>{r.face}</span>
              </span>
              <span className="lv-start__go" aria-hidden="true">→</span>
            </Go>
            <span className="lv-start__desc">{r.text}</span>
            <span className="lv-start__foot">
              Sign in as <code>{r.persona}</code>
              {r.also && <Go href={r.also.href} className="lv-start__also">{r.also.label} →</Go>}
            </span>
          </div>
        ))}
      </nav>

      <p className="lv-start__note">
        Demo stack: password <code>lodestar-dev-only</code> (admin: <code>lodestar-admin-dev-only</code>). Dock and Run are phone apps; they work in any browser.
        {" "}<Link href="/screens">All design screens</Link>
      </p>
    </main>
  );
}
