"use client";
import React, { useEffect, useState } from "react";

export default function DeliveryDetail({ params }: { params: { id: string } }) {
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, we'd fetch the specific trip using the ID
    // For demo, we'll just fetch a generic trip to show the UI
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/trips`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setTrip(data[0]);
      })
      .catch(console.error);
  }, [params.id]);

  return (
    <div className="mode-store" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header style={{ padding: "16px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="/store" style={{ textDecoration: "none", color: "var(--text-3)", fontSize: "20px" }}>←</a>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
          Delivery {params.id}
        </div>
      </header>

      <main style={{ padding: "32px 24px", maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {trip ? (
          <>
            <div className="doc-card" style={{ padding: "24px", textAlign: "center" }}>
              <h2 style={{ fontSize: "16px", color: "var(--text-2)", margin: "0 0 8px 0" }}>Expected Arrival</h2>
              <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>
                {trip.stops?.[0]?.etaModel ? new Date(trip.stops[0].etaModel).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '6:35 AM'}
              </div>
              <p style={{ marginTop: "12px", color: "var(--text-3)", fontSize: "14px" }}>
                Vehicle: {trip.vehicle?.id || "VEH057"} • Driver: {trip.driver?.name || "Ruwan"}
              </p>
            </div>

            <div className="doc-card" style={{ padding: "24px" }}>
              <h3 className="doc-h" style={{ marginBottom: "16px" }}>Order Thread</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {/* Timeline UI mock */}
                {[
                  { status: 'RECEIVED', time: 'Yesterday 2:38 PM', desc: 'Order placed by Fathima' },
                  { status: 'PLANNED', time: 'Yesterday 6:40 PM', desc: 'Assigned to Trip ' + trip.tripNumber },
                  { status: 'LOADED', time: 'Today 3:25 AM', desc: 'Loaded at Kandy Hub Bay K2' },
                  { status: 'ENROUTE', time: 'Today 3:40 AM', desc: 'Departed depot' }
                ].map((event, idx, arr) => (
                  <div key={idx} style={{ display: "flex", gap: "16px", position: "relative", paddingBottom: idx === arr.length - 1 ? "0" : "24px" }}>
                    {idx !== arr.length - 1 && <div style={{ position: "absolute", left: "11px", top: "24px", bottom: "0", width: "2px", background: "var(--line)" }} />}
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `var(--st-${event.status.toLowerCase()}-bg)`, border: `2px solid var(--st-${event.status.toLowerCase()}-bd)`, zIndex: 1 }} />
                    <div style={{ flex: 1, marginTop: "-2px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{event.status}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-3)", margin: "4px 0" }}>{event.time}</div>
                      <div style={{ fontSize: "14px", color: "var(--text-2)" }}>{event.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="doc-p" style={{ textAlign: "center" }}>Loading delivery details...</p>
        )}
      </main>
    </div>
  );
}
