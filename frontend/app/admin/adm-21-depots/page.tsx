// Hand-written (no design board): ADM-21 Depots is not in Designing/pages, so tools/screengen never writes this
// folder. Same shape as the generated admin pages: ScreenShell with the admin sidebar's link table, the live screen
// in both modes (there is no static design to fall back to).
import type { Metadata } from 'next';
import ScreenShell from '@/components/ScreenShell';
import Live from '@/live/adm-21-depots';

export const metadata: Metadata = { title: "ADM-21 Depots · Lodestar Admin" };

const nav = {
  "links": {
    "N0": {
      "href": "/admin/adm-02-overview",
      "kind": "nav"
    },
    "N1": {
      "href": "/admin/adm-05-access-requests",
      "kind": "nav"
    },
    "N2": {
      "href": "/admin/adm-03-people-and-roles",
      "kind": "nav"
    },
    "N3": {
      "href": "/admin/adm-06-devices",
      "kind": "nav"
    },
    "N4": {
      "href": "/admin/adm-08-outlets",
      "kind": "nav"
    },
    "N5": {
      "href": "/admin/adm-10-vehicles",
      "kind": "nav"
    },
    "N6": {
      "href": "/admin/adm-12-operating-rules",
      "kind": "nav"
    },
    "N7": {
      "href": "/admin/adm-13-calendar",
      "kind": "nav"
    },
    "N8": {
      "href": "/admin/adm-14-data-imports",
      "kind": "nav"
    },
    "N9": {
      "href": "/admin/adm-16-audit-log",
      "kind": "nav"
    },
    "N10": {
      "href": "/admin/adm-17-planning-agent-guardrails",
      "kind": "nav"
    },
    "N11": {
      "href": "/admin/adm-18-notifications-and-integrations",
      "kind": "nav"
    }
  }
};

export default function Page() {
  return (
    <ScreenShell board="P6" nav={nav} live>
      <Live />
    </ScreenShell>
  );
}
