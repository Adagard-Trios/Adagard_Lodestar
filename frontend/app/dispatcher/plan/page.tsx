"use client";
import React, { useEffect, useState } from "react";

export default function PlanBoard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/planning/plan?depot=PELIYAGODA`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const runAutoPlan = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/planning/autoplan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depot: "PELIYAGODA" })
    })
      .then(res => res.json())
      .then(res => {
        alert("Auto-plan run complete. Deferrals suggested: " + res.suggestions?.length);
        window.location.reload();
      });
  };

  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header className="page-head" style={{ padding: "24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div className="page-head__left">
          <div className="page-head__eyebrow">Lodestar Plan</div>
          <h1 className="page-head__title">Plan Board (DSP-01)</h1>
        </div>
        <div className="page-head__right">
          <button onClick={runAutoPlan} style={{ padding: "12px 24px", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
            Run Auto-Plan
          </button>
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", gap: "32px" }}>
        {/* Left Column: Orders */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 className="doc-h">Unplanned Orders</h2>
          {data?.orders ? (
            <table className="dtable" style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Brand</th>
                  <th>Temp</th>
                  <th>Vol (m³)</th>
                  <th>Defer Score</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.filter((o:any) => o.status === 'RECEIVED').map((o: any) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>
                      <span className="ptag" style={{ backgroundColor: `var(--st-${o.status.toLowerCase()}-bg)`, color: `var(--st-${o.status.toLowerCase()}-fg)`, border: `1px solid var(--st-${o.status.toLowerCase()}-bd)` }}>
                        {o.status}
                      </span>
                    </td>
                    <td>{o.brand}</td>
                    <td>
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: `var(--${o.tempClass.toLowerCase()}-bg)`, color: `var(--${o.tempClass.toLowerCase()}-fg)` }}>
                        {o.tempClass}
                      </span>
                    </td>
                    <td>{o.m3.toFixed(2)}</td>
                    <td style={{ color: o.isProtected ? "var(--ok)" : "var(--warn)", fontWeight: "bold" }}>
                      {o.computedScore} {o.isProtected && "(Protected)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Loading orders...</p>
          )}
        </div>

        {/* Right Column: Trips */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 className="doc-h">Planned Trips</h2>
          {data?.trips ? data.trips.map((trip: any) => (
            <div key={trip.id} className="doc-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "20px" }}>{trip.vehicle?.id || "Unassigned"} • {trip.district}</h3>
                <span className="ptag" style={{ backgroundColor: `var(--st-${trip.status.toLowerCase()}-bg)`, color: `var(--st-${trip.status.toLowerCase()}-fg)` }}>
                  {trip.status}
                </span>
              </div>
              <p className="muted" style={{ marginBottom: "12px" }}>Driver: {trip.driver?.name || "Unassigned"} | Brand: {trip.brand}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {trip.stops.map((stop: any, idx: number) => (
                  <div key={stop.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "8px", background: "var(--surface-2)", borderRadius: "6px" }}>
                    <span>{idx + 1}. {stop.outlet.name}</span>
                    <span className="mono">{stop.order.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <p>Loading trips...</p>
          )}
        </div>
      </main>
    </div>
  );
}
