'use client';
// DSP-24 Offline banner, live. The design (frontend/screens/dsp-24-offline-banner.tsx) is the Today overview with
// the desk cut off from the Lodestar API: the dashed offline banner under the header ("Retry now"), the numbers
// frozen at what was last loaded and marked "Not live", live operations off. It renders the live DSP-08 in that
// mode. Reached from the sidebar's offline marker on any Plan screen while offline (DSP-08 itself shows the same
// banner in place). Once the API answers again the banner says so and, as in the design, links back to the
// live overview (L174).
import LiveDsp08TodayOverview from './dsp-08-today-overview';

export default function LiveDsp24OfflineBanner() {
  return <LiveDsp08TodayOverview offlineView />;
}
