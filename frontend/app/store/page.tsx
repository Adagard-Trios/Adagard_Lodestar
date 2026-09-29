"use client";
import React, { useEffect, useState } from "react";

export default function StoreManagerDashboard() {
  const [outlet, setOutlet] = useState<any>(null);

  useEffect(() => {
    // Assuming OUT108 for the demo (the one with the blackout incident)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/outlets/OUT108`)
      .then(r => r.json())
      .then(data => setOutlet(data))
      .catch(console.error);
  }, []);

  return (
    <div className="mode-store" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header style={{ padding: "16px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="brandmark">
          <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2766"/><path d="M16 4 L18.6 13.4 L28 16 L18.6 18.6 L16 28 L13.4 18.6 L4 16 L13.4 13.4 Z" fill="#F5B83D"/><circle cx="16" cy="16" r="2.2" fill="#141B4D"/></svg>
          Waypoint Lodestar
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-2)" }}>
          {outlet ? outlet.name : 'Store Manager (STR)'}
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)" }}>Store Dashboard</h1>
        
        {outlet && (
          <div className="doc-card">
            <h2 className="doc-h">Recent Orders</h2>
            {outlet.orders && outlet.orders.length > 0 ? (
              <table className="dtable" style={{ marginTop: "16px" }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {outlet.orders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="mono">{o.id}</td>
                      <td>{new Date(o.runDate).toLocaleDateString()}</td>
                      <td>
                        <span className="ptag" style={{ backgroundColor: `var(--st-${o.status.toLowerCase()}-bg)`, color: `var(--st-${o.status.toLowerCase()}-fg)`, border: `1px solid var(--st-${o.status.toLowerCase()}-bd)` }}>
                          {o.status}
                        </span>
                      </td>
                      <td>{o.units} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="doc-p">No recent orders found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
