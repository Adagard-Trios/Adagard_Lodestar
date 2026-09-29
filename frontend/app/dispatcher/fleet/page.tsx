"use client";
import React, { useEffect, useState } from "react";

export default function FleetBoard() {
  const [fleet, setFleet] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/fleet?depot=PELIYAGODA`)
      .then(res => res.json())
      .then(setFleet)
      .catch(console.error);
  }, []);

  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header className="page-head" style={{ padding: "24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div className="page-head__left">
          <div className="page-head__eyebrow">Lodestar Plan</div>
          <h1 className="page-head__title">Fleet Management (DSP-03)</h1>
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="doc-card">
          <h2 className="doc-h">Peliyagoda Fleet Status</h2>
          
          <table className="dtable" style={{ marginTop: "16px" }}>
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Type</th>
                <th>Temp Class</th>
                <th>Capacity (kg / m³)</th>
                <th>Status</th>
                <th>Active Trip</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((v: any) => (
                <tr key={v.id}>
                  <td className="mono" style={{ fontWeight: "bold" }}>{v.id}</td>
                  <td>{v.type}</td>
                  <td>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: `var(--${v.tempClass.toLowerCase()}-bg)`, color: `var(--${v.tempClass.toLowerCase()}-fg)` }}>
                      {v.tempClass}
                    </span>
                  </td>
                  <td>{v.capacityKg} kg / {v.capacityM3} m³</td>
                  <td>
                    {v.status === 'WORKSHOP' ? (
                      <span className="ptag" style={{ backgroundColor: "var(--st-exception-bg)", color: "var(--st-exception-fg)", border: "1px solid var(--st-exception-bd)" }}>
                        {v.status}
                      </span>
                    ) : v.status === 'ENROUTE' ? (
                      <span className="ptag" style={{ backgroundColor: "var(--st-enroute-bg)", color: "var(--st-enroute-fg)", border: "1px solid var(--st-enroute-bd)" }}>
                        {v.status}
                      </span>
                    ) : (
                      <span className="ptag" style={{ backgroundColor: "var(--st-received-bg)", color: "var(--st-received-fg)", border: "1px solid var(--st-received-bd)" }}>
                        {v.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {v.trips && v.trips.length > 0 ? (
                      <span className="mono">Trip {v.trips[0].id.substring(0,8)}</span>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fleet.length === 0 && <p style={{ textAlign: "center", padding: "24px", color: "var(--text-3)" }}>Loading fleet data...</p>}
        </div>
      </main>
    </div>
  );
}
