// Reset access (DSP-34, SM-35). Keycloak owns credentials: the desk never sees or resets a password itself.
//  - Self-service: Keycloak's own "forgot password" flow (login-actions/reset-credentials), which emails a one-time
//    link. It works only when the realm allows it (resetPasswordAllowed) and has SMTP, so it is switched on at
//    build time with NEXT_PUBLIC_SELF_SERVICE_RESET=true. The shipped realm (backend/identity/lodestar-realm.json)
//    has it off.
//  - Otherwise, and always as a fallback: the admin-request path the designs show — the Lodestar admin resets
//    single sign-on and depot access (ADM-03/ADM-04); NEXT_PUBLIC_SUPPORT_EMAIL / NEXT_PUBLIC_SUPPORT_PHONE add a
//    mail or call link when set.
import type { RuntimeConfig } from '../config';

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function resetOptions() {
  return {
    selfService: process.env.NEXT_PUBLIC_SELF_SERVICE_RESET === 'true',
    supportEmail: clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
    supportPhone: clean(process.env.NEXT_PUBLIC_SUPPORT_PHONE),
  };
}

/** Keycloak's reset-credentials page for this client (the realm's "Forgot password?" flow). */
export function resetCredentialsUrl(cfg: Pick<RuntimeConfig, 'authority' | 'clientId'>): string {
  return `${cfg.authority}/login-actions/reset-credentials?client_id=${encodeURIComponent(cfg.clientId)}`;
}

/** A mailto: link asking the admin to reset access, with the face and (when known) the account in the text. */
export function adminRequestMail(to: string, face: 'Lodestar Plan' | 'Lodestar Store', account?: string | null): string {
  const subject = `${face}: please reset my sign-in`;
  const body = `Hello,\n\nI cannot sign in to ${face}${account ? ` as ${account}` : ''}. Please reset my single sign-on access.\n\nThank you.`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** A tel: link for a configured phone number. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/**
 * The signed-in user's own depot by name (`name` resolves a code through the Depots registry, useDepots), or the
 * generic "your depot" when no depot is known (signed out).
 */
export function depotLabel(depots: readonly string[] | undefined, name: (code: string) => string = (c) => c): string {
  const d = depots?.[0];
  return d ? name(d) : 'your depot';
}
