// Shared test helpers (not a test file).

/** base64url of UTF-8 JSON, without Node's Buffer. */
export function b64url(o: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(o));
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** An unsigned JWT-shaped token carrying `claims` (the app only reads claims; services verify). */
export const jwt = (claims: object) => `${b64url({ alg: 'RS256' })}.${b64url(claims)}.sig`;
