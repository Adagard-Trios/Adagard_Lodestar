"use client";
import React, { useEffect, useState } from "react";

export default function LiveOpsBoard() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/trips?depot=PELIYAGODA`)
      .then(res => res.json())
      .then(setTrips)
      .catch(console.error);

    // In a full implementation, we would connect to the WebSocket here
    // const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080');
    // ws.onmessage = ...
  }, []);

  const activeTrips = trips.filter(t => t.status === 'ENROUTE' || t.status === 'LOADING');

  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header className="page-head" style={{ padding: "24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div className="page-head__left">
          <div className="page-head__eyebrow">Lodestar Plan</div>
          <h1 className="page-head__title">Live Operations (DSP-04)</h1>
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Alerts / Degradation Panel */}
        <div className="doc-card" style={{ background: "var(--brand-950)", color: "white", borderColor: "var(--brand-900)" }}>
          <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <span style={{ color: "var(--star-500)" }}>⚠️</span> Live Alerts
          </h2>
          <p style={{ color: "#9AA3C7", margin: "8px 0 0 0" }}>
            Monitoring connection status for {activeTrips.length} active vehicles...
          </p>
          {/* Deg-A Blackout Mock */}
          <div style={{ marginTop: "16px", padding: "16px", background: "var(--exception-bg, #3D1210)", border: "1px solid var(--exception-bd, #6E231D)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: "var(--exception-fg, #FF8A7A)" }}>VEH057 • Offline (Dead Zone)</strong>
              <div style={{ fontSize: "14px", color: "#B5BDD1", marginTop: "4px" }}>Last sync 4:38 AM above Ramboda. Provisional deferrals may be required for at-risk stops.</div>
            </div>
            <button style={{ padding: "8px 16px", background: "rgba(255,138,122,0.1)", color: "#FF8A7A", border: "1px solid #FF8A7A", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              View Impact
            </button>
          </div>
        </div>

        <h2 className="doc-h">En Route Tracker</h2>
        <div className="row" style={{ flexWrap: "wrap", gap: "24px" }}>
          {activeTrips.length > 0 ? activeTrips.map(trip => (
            <div key={trip.id} className="doc-card" style={{ width: "calc(33.333% - 16px)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <strong style={{ fontSize: "18px" }}>{trip.vehicle?.id}</strong>
                <span className="ptag" style={{ backgroundColor: `var(--st-${trip.status.toLowerCase()}-bg)`, color: `var(--st-${trip.status.toLowerCase()}-fg)` }}>
                  {trip.status}
                </span>
              </div>
              <p className="muted" style={{ marginBottom: "16px", fontSize: "14px" }}>Driver: {trip.driver?.name} • {trip.district}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {trip.stops.map((stop: any, idx: number) => (
                  <div key={stop.id} style={{ display: "flex", flexDirection: "column", padding: "12px", background: "var(--surface-3)", borderRadius: "8px", borderLeft: stop.lateRiskPct > 50 ? "4px solid var(--warn)" : "4px solid var(--primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                      <span>{idx + 1}. {stop.outlet.name}</span>
                      <span>ETA: {stop.etaModel ? new Date(stop.etaModel).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-3)", display: "flex", justifyContent: "space-between" }}>
                      <span>Order: {stop.order.id}</span>
                      {stop.lateRiskPct > 0 && <span style={{ color: "var(--warn)" }}>Late Risk: {stop.lateRiskPct}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <p className="muted">No trips currently en route or loading.</p>
          )}
        </div>
      </main>
    </div>
  );
}
