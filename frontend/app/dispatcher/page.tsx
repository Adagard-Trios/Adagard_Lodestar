"use client";
import React, { useEffect, useState } from "react";

export default function DispatcherDashboard() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/planning/plan?depot=PELIYAGODA`)
      .then(r => r.json())
      .then(data => setSummary(data.summary))
      .catch(console.error);
  }, []);

  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header style={{ padding: "16px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="brandmark">
          <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2766"/><path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D"/><circle cx="16" cy="16" r="2.2" fill="#141B4D"/></svg>
          Waypoint Lodestar
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-2)" }}>
          Peliyagoda Depot (DSP)
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)" }}>Plan Board</h1>
        
        {summary && (
          <div className="row">
            <div className="doc-card" style={{ flex: 1 }}>
              <div className="stat">
                <span className="stat__n">{summary.orders.total}</span>
                <span className="stat__l">Total Orders</span>
              </div>
            </div>
            <div className="doc-card" style={{ flex: 1 }}>
              <div className="stat">
                <span className="stat__n">{summary.trips}</span>
                <span className="stat__l">Active Trips</span>
              </div>
            </div>
            <div className="doc-card" style={{ flex: 1 }}>
              <div className="stat">
                <span className="stat__n">{summary.vehiclesInWorkshop}</span>
                <span className="stat__l">Vehicles in Workshop</span>
              </div>
            </div>
          </div>
        )}

        <div className="doc-card">
          <h2 className="doc-h">Live Operations</h2>
          <p className="doc-p">Monitoring trips and fleet status. Real-time ETA updates and offline sync notifications will appear here.</p>
        </div>
      </main>
    </div>
  );
}
