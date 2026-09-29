"use client";
import React, { useEffect, useState } from "react";

export default function CapacityOutlook() {
  const [outlook, setOutlook] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/planning/capacity/outlook?depot=PELIYAGODA`)
      .then(res => res.json())
      .then(setOutlook)
      .catch(console.error);
  }, []);

  return (
    <div className="mode-dispatcher" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header className="page-head" style={{ padding: "24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div className="page-head__left">
          <div className="page-head__eyebrow">Lodestar Plan</div>
          <h1 className="page-head__title">10-Week Capacity Outlook (DSP-05)</h1>
        </div>
      </header>

      <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="doc-card">
          <h2 className="doc-h">Peliyagoda Depot</h2>
          <p className="doc-p" style={{ marginBottom: "24px" }}>Projected refrigerated vs ambient volume demand against current fleet capacity (W15 - W24).</p>
          
          {outlook ? (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Chilled Demand (m³)</th>
                  <th>Chilled Capacity (m³)</th>
                  <th>Ambient Demand (m³)</th>
                  <th>Ambient Capacity (m³)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outlook.weeks.map((w: any) => {
                  const chilledShort = w.chilledDemand - w.chilledCapacity;
                  const ambientShort = w.ambientDemand - w.ambientCapacity;
                  const hasShortfall = chilledShort > 0 || ambientShort > 0;
                  
                  return (
                    <tr key={w.week}>
                      <td className="mono" style={{ fontWeight: "bold" }}>{w.week}</td>
                      <td style={{ color: chilledShort > 0 ? "var(--warn)" : "inherit" }}>{w.chilledDemand.toFixed(1)}</td>
                      <td>{w.chilledCapacity.toFixed(1)}</td>
                      <td style={{ color: ambientShort > 0 ? "var(--warn)" : "inherit" }}>{w.ambientDemand.toFixed(1)}</td>
                      <td>{w.ambientCapacity.toFixed(1)}</td>
                      <td>
                        {hasShortfall ? (
                          <span className="ptag" style={{ backgroundColor: "var(--st-deferred-bg)", color: "var(--st-deferred-fg)", border: "1px solid var(--st-deferred-bd)" }}>
                            CAPACITY RISK
                          </span>
                        ) : (
                          <span className="ptag" style={{ backgroundColor: "var(--st-delivered-bg)", color: "var(--st-delivered-fg)", border: "1px solid var(--st-delivered-bd)" }}>
                            HEALTHY
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>Loading capacity outlook...</p>
          )}
        </div>
      </main>
    </div>
  );
}
