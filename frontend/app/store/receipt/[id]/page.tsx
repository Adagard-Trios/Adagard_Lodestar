"use client";
import React, { useState } from "react";

export default function ReceiptConfirmation({ params }: { params: { id: string } }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="mode-store" style={{ minHeight: "100vh", backgroundColor: "var(--surface-2)" }}>
      <header style={{ padding: "16px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href={`/store/delivery/${params.id}`} style={{ textDecoration: "none", color: "var(--text-3)", fontSize: "20px" }}>←</a>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
          Receipt Confirmation
        </div>
      </header>

      <main style={{ padding: "32px 24px", maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {confirmed ? (
          <div className="doc-card" style={{ padding: "32px", textAlign: "center", background: "var(--st-delivered-bg)", borderColor: "var(--st-delivered-bd)" }}>
            <h2 style={{ color: "var(--st-delivered-fg)", marginBottom: "8px" }}>Receipt Confirmed!</h2>
            <p style={{ color: "var(--st-delivered-fg)", fontSize: "14px" }}>
              Delivery {params.id} has been signed off.
              <br/><br/>
              <b>Credit Note CN-2604-0441</b> generated for 2 yoghurt & 1 chicken tray (damaged).
            </p>
          </div>
        ) : (
          <div className="doc-card">
            <h2 className="doc-h">Delivery {params.id}</h2>
            <p className="doc-p" style={{ marginBottom: "24px" }}>Please verify the quantities delivered against the manifest before signing off.</p>
            
            <div style={{ padding: "16px", background: "var(--surface-2)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Mixed Fruit Yoghurt (ORD0104217)</div>
                <div style={{ fontSize: "14px", color: "var(--text-3)" }}>Driver reported short: 4/6 boxes</div>
              </div>
              <div style={{ color: "var(--warn)", fontWeight: 700 }}>4 / 6</div>
            </div>

            <div style={{ padding: "16px", background: "var(--surface-2)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Chicken Trays (ORD0104216)</div>
                <div style={{ fontSize: "14px", color: "var(--text-3)" }}>Exception: 1 tray damaged</div>
              </div>
              <div style={{ color: "var(--warn)", fontWeight: 700 }}>11 / 12</div>
            </div>

            <button 
              onClick={() => setConfirmed(true)}
              style={{ width: "100%", padding: "16px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
              Generate Credit Note & Sign Off
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
