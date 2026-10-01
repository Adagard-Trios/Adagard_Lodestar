/** One clickable element (data-lk code) on a desktop screen. `to` for same-site links, `app` for phone-only targets. */
export type ScreenLink = {
  code: string;
  kind: string; // go | nav | back
  label?: string;
  to?: string;
  app?: string;
  screen?: string;
};

export type ScreenSpec = {
  key: string;
  id: string;
  app: string;
  path: string;
  links: ScreenLink[];
  auto?: ScreenLink;
};

export type ScreenManifest = { source: string; screens: ScreenSpec[] };
