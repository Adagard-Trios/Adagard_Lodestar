import Link from "next/link";
import { FACES, FLOWS } from "@/screens";

const LOGO: Record<string, string> = { store: "#047857", plan: "#3B4CCA", admin: "#334155" };

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", padding: "56px 64px 80px", background: "#F4F6FA", fontFamily: "Inter, system-ui, sans-serif", color: "#0A0F1A" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 36 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#5B6475" }}>Waypoint Group</span>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Waypoint Lodestar</h1>
        <p style={{ fontSize: 16, color: "#4A5467", margin: 0 }}>Every order, one thread. The desk faces run here; Lodestar Dock and Lodestar Run are in the mobile app.</p>
      </div>

      {FLOWS.length > 0 && (
        <section style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
          {FLOWS.map(f => (
            <Link key={f.name} href={f.href} style={{ padding: "10px 16px", borderRadius: 999, background: "#141B4D", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Start: {f.name}
            </Link>
          ))}
        </section>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {Object.entries(FACES).map(([app, face]) => (
          <section key={app} style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 14, padding: 24, borderRadius: 18, background: "#fff", border: "1px solid #E3E7EF" }}>
            <Link href={face.start} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: LOGO[app] ?? "#141B4D" }} />
              <span style={{ fontSize: 20, fontWeight: 800 }}>{face.title}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#3B4CCA" }}>Open →</span>
            </Link>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {face.screens.map(s => (
                <li key={s.href}>
                  <Link href={s.href} style={{ display: "flex", gap: 10, padding: "6px 8px", borderRadius: 8, textDecoration: "none", color: "#1D2433", fontSize: 14 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#5B6475", minWidth: 64 }}>{s.id}</span>
                    {s.name.replace(/^\S+\s/, "")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
