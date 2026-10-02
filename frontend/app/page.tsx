// The start page: Waypoint Group's front door to Lodestar. One URL, every role. Each role button opens that role's
// app on this origin: the desk faces (/store, /plan, /admin) and the field app's browser build (/field/, Dock and
// Run, sized for a phone). Face logos and colours come from the design (Designing/assets/face-logos.html); brand
// colours from styles/tokens.css. Network figures are the brief's shared datasets (outlets.csv, vehicles.csv).
import Link from "next/link";
import type { ReactNode } from "react";

// The password hint is read per request from the container's environment (docker-compose.yml): the dev defaults
// locally, the deployment's persona password on the demo VM. The admin password is never shown there.
export const dynamic = "force-dynamic";

type Role = {
  key: string;
  face: string;
  role: string;
  text: string;
  href: string;
  persona: string;
  color: string;
  device: string;
  icon: ReactNode;
  also?: { label: string; href: string };
};

const ROLES: Role[] = [
  {
    key: "store", face: "Lodestar Store", role: "Store manager", text: "Place tomorrow's order before 4 PM, see the arrival time, confirm receipt.",
    href: "/store", persona: "fathima", color: "#047857", device: "Desktop or phone",
    icon: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v8h14v-8M10 21v-5h4v5" /></>,
    also: { label: "Phone app", href: "/field/s/sm-05-sign-in" },
  },
  {
    key: "plan", face: "Lodestar Plan", role: "Dispatcher", text: "Allocate orders to vehicles and trips, explain every deferral, watch the run live.",
    href: "/plan", persona: "nilanthi", color: "#3B4CCA", device: "Planning office",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    key: "dock", face: "Lodestar Dock", role: "Loader", text: "Load in stop order, flag missing or damaged items, release the vehicle.",
    href: "/field/s/ld-06-sign-in", persona: "kasun", color: "#6D28D9", device: "Dock tablet",
    icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7 12 12l8.7-5M12 22V12" /></>,
  },
  {
    key: "run", face: "Lodestar Run", role: "Driver", text: "Follow the route, record each stop with proof of delivery, even offline.",
    href: "/field/s/dr-06-sign-in", persona: "ruwan", color: "#0369A1", device: "Personal phone",
    icon: <path d="m3 11 19-9-9 19-2-8-8-2z" />,
  },
  {
    key: "admin", face: "Lodestar Admin", role: "Admin", text: "People, phones, outlets and the audit log.",
    href: "/admin", persona: "admin", color: "#334155", device: "Head office",
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

const BRANDS: { key: string; name: string; outlets: number; goods: string; schedule: string; icon: ReactNode }[] = [
  {
    key: "fresh", name: "Waypoint Fresh", outlets: 80, goods: "Groceries, chilled and frozen", schedule: "Daily, before 8 AM",
    icon: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
  },
  {
    key: "style", name: "Waypoint Style", outlets: 25, goods: "Hanging garments and cartons", schedule: "Weekly, seasonal peaks",
    icon: <path d="M12 6a2 2 0 1 1 2-2c0 1.1-.9 2-2 2.6V8l9 7a1.5 1.5 0 0 1-.9 2.7H3.9A1.5 1.5 0 0 1 3 15l9-7" />,
  },
  {
    key: "tech", name: "Waypoint Tech", outlets: 15, goods: "Appliances and electronics", schedule: "As needed, fragile",
    icon: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  },
];

const NETWORK: { value: string; label: string }[] = [
  { value: "120", label: "outlets" },
  { value: "2", label: "depots · Peliyagoda, Kandy" },
  { value: "60", label: "vehicles · trucks and vans" },
  { value: "16", label: "refrigerated" },
];

const FLOW: { step: string; who: string; color: string }[] = [
  { step: "Order", who: "Store manager", color: "#047857" },
  { step: "Plan", who: "Dispatcher", color: "#3B4CCA" },
  { step: "Load", who: "Loader", color: "#6D28D9" },
  { step: "Deliver", who: "Driver", color: "#0369A1" },
  { step: "Confirm", who: "Store manager", color: "#047857" },
];

function Icon({ color, size = 48, children }: { color: string; size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="9" fill={color} />
      <g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{children}</g>
    </svg>
  );
}

function Mark() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141B4D" />
      <path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D" />
      <circle cx="16" cy="16" r="2.2" fill="#141B4D" />
    </svg>
  );
}

/** The desk faces are routes of this app; the field app (/field/) is another app on the same origin. */
function Go({ href, className, label, children }: { href: string; className: string; label?: string; children: ReactNode }) {
  if (href.startsWith("/field/")) return <a href={href} className={className} aria-label={label}>{children}</a>;
  return <Link href={href} className={className} aria-label={label}>{children}</Link>;
}

export default function Home() {
  const personaPassword = process.env.DEMO_PASSWORD_HINT?.trim();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD_HINT?.trim();

  return (
    <main className="lv-home">
      <section className="lv-home__hero">
        <div className="lv-home__wrap">
          <div className="lv-home__brandline">
            <Mark />
            <span>Waypoint Group <small>(Pvt) Ltd</small></span>
          </div>
          <h1>Waypoint Lodestar</h1>
          <p className="lv-home__lede">
            One delivery network for three brands. Every order follows one thread, from the store&apos;s order to the
            signed receipt, across Peliyagoda and Kandy.
          </p>
          <ul className="lv-home__stats" aria-label="The network">
            {NETWORK.map(n => (
              <li key={n.label}><b>{n.value}</b><span>{n.label}</span></li>
            ))}
          </ul>
          <ul className="lv-home__brands" aria-label="Brands">
            {BRANDS.map(b => (
              <li key={b.key} className="lv-home__brand" data-brand={b.key}>
                <span className="lv-home__brandicon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </span>
                <span className="lv-home__brandtxt">
                  <b>{b.name}</b>
                  <span>{b.outlets} outlets · {b.goods}</span>
                  <span>{b.schedule}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lv-home__wrap lv-home__roles" aria-labelledby="roles-title">
        <h2 id="roles-title">Choose your role</h2>
        <p className="lv-home__sub">Each role signs in to its own app. Dock and Run are phone apps; they work in any browser.</p>

        <nav className="lv-home__grid" aria-label="Roles">
          {ROLES.map(r => (
            <div key={r.key} className="lv-home__card" data-role={r.key} style={{ ["--role" as string]: r.color }}>
              <Go href={r.href} className="lv-home__main" label={`${r.role}: ${r.face}`}>
                <Icon color={r.color}>{r.icon}</Icon>
                <span className="lv-home__txt">
                  <b>{r.role}</b>
                  <span>{r.face}</span>
                </span>
              </Go>
              <p className="lv-home__desc">{r.text}</p>
              <span className="lv-home__meta">Sign in as <code>{r.persona}</code> · {r.device}</span>
              <span className="lv-home__actions">
                <Go href={r.href} className="lv-home__btn">Sign in <span aria-hidden="true">→</span></Go>
                {r.also && <Go href={r.also.href} className="lv-home__also">{r.also.label} →</Go>}
              </span>
            </div>
          ))}
        </nav>

        <ol className="lv-home__flow" aria-label="How an order moves">
          {FLOW.map((f, i) => (
            <li key={f.step} style={{ ["--role" as string]: f.color }}>
              <span className="lv-home__n">{i + 1}</span>
              <b>{f.step}</b>
              <span>{f.who}</span>
            </li>
          ))}
        </ol>

        <p className="lv-home__note">
          {personaPassword
            ? <>Demo accounts: <code>fathima</code>, <code>nilanthi</code>, <code>kasun</code>, <code>ruwan</code> with password <code>{personaPassword}</code>{adminPassword && <> (admin: <code>{adminPassword}</code>)</>}. </>
            : <>The demo accounts and passwords are in the README. </>}
          Waypoint Group is fictional and all data is synthetic.{" "}
          <Link href="/screens">All design screens</Link>
        </p>
      </section>
    </main>
  );
}
