export default function Home() {
  return (
    <div className="board">
      <div className="page-head">
        <div className="page-head__left">
          <div className="page-head__eyebrow">Waypoint Group</div>
          <h1 className="page-head__title">Waypoint Lodestar</h1>
          <p className="page-head__lede">Select an interface to continue</p>
        </div>
      </div>
      
      <h2 style={{marginTop: "32px", fontSize: "20px", fontWeight: 800}}>Live Functional Apps</h2>
      <div className="row" style={{marginTop: "16px"}}>
        <a href="/dispatcher/plan" className="rationale rationale--desktop" style={{textDecoration: 'none'}}>
          <div className="rationale__title">Dispatcher (DSP)</div>
          <div className="rationale__body">Plan board, live ops, and fleet management for Peliyagoda/Kandy depots.</div>
        </a>
      </div>
      <div className="row">
        <a href="/store" className="rationale rationale--desktop" style={{textDecoration: 'none'}}>
          <div className="rationale__title">Store Manager (STR)</div>
          <div className="rationale__body">Order placement and ETA tracking for Outlet managers.</div>
        </a>
      </div>
      <div className="row">
        <a href="/admin" className="rationale rationale--desktop" style={{textDecoration: 'none'}}>
          <div className="rationale__title">Admin Console (ADM)</div>
          <div className="rationale__body">System health, fleet, and outlet management portal.</div>
        </a>
      </div>

      <h2 style={{marginTop: "48px", fontSize: "20px", fontWeight: 800}}>Figma Complete UI Prototypes (180+ Screens)</h2>
      <p style={{marginTop: "8px", color: "var(--text-3)", fontSize: "14px"}}>All static screens generated directly from Figma exports.</p>
      <div className="row" style={{marginTop: "16px", flexWrap: "wrap", gap: "16px"}}>
        <a href="/prototypes/p1-screens-store" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P1: Store Manager (42)</div>
        </a>
        <a href="/prototypes/p2-screens-dispatcher" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P2: Dispatcher (40)</div>
        </a>
        <a href="/prototypes/p3-screens-loader" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P3: Loader (32)</div>
        </a>
        <a href="/prototypes/p4-screens-driver" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P4: Driver (42)</div>
        </a>
        <a href="/prototypes/p5-screens-degradation" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P5: Degradation (11)</div>
        </a>
        <a href="/prototypes/p6-screens-admin" className="rationale" style={{textDecoration: 'none', padding: "16px"}}>
          <div className="rationale__title" style={{fontSize: "14px"}}>P6: Admin (20)</div>
        </a>
      </div>
    </div>
  );
}
