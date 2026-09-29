"use client";
import React from "react";

export default function AdminDashboard() {
  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header style={{ padding: "16px 24px", background: "var(--brand-950)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="brandmark" style={{ color: "white" }}>
          <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2766"/><path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D"/><circle cx="16" cy="16" r="2.2" fill="#141B4D"/></svg>
          Lodestar Admin Console
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-2)" }}>Back Office</div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <h1 className="doc-h" style={{ fontSize: "32px" }}>System Health</h1>
        
        <div className="row" style={{ gap: "24px" }}>
          <a href="#" className="doc-card" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <h2 className="doc-h">Outlets</h2>
            <p className="doc-p">Manage all 120 store locations, window schedules, and access notes.</p>
          </a>
          <a href="#" className="doc-card" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <h2 className="doc-h">Fleet</h2>
            <p className="doc-p">Manage all 60 vehicles, capacities, and maintenance schedules.</p>
          </a>
          <a href="#" className="doc-card" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <h2 className="doc-h">Users</h2>
            <p className="doc-p">Role management for Dispatchers, Loaders, Drivers, and Store Managers.</p>
          </a>
        </div>

        <div className="doc-card" style={{ marginTop: "16px" }}>
          <h2 className="doc-h">Microservice Status</h2>
          <table className="dtable" style={{ marginTop: "16px" }}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Port</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {['Gateway', 'Auth', 'Orders', 'Planning', 'Fleet', 'Outlets', 'Trips', 'Sync', 'Notifications'].map(s => (
                <tr key={s}>
                  <td style={{ fontWeight: 'bold' }}>{s}</td>
                  <td className="mono">8080</td>
                  <td>
                    <span className="ptag" style={{ backgroundColor: 'var(--st-delivered-bg)', color: 'var(--st-delivered-fg)' }}>HEALTHY</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
