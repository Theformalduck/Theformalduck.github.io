// Cookie/consent state shared across the app.
//
// Built to the strictest (EU GDPR + ePrivacy) bar: non-essential categories
// default to OFF and nothing in those categories may run until the visitor
// explicitly opts in. "Necessary" cookies (auth/session, CSRF, the consent
// record itself) are exempt from consent and always on.

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  necessary: true; // always granted — required for the Service to function
  analytics: boolean; // e.g. Google Analytics
  marketing: boolean; // e.g. Meta Pixel, ad/retargeting, arbitrary embeds
  /** ISO timestamp of the decision, so we can show "last updated". */
  updatedAt: string;
  /** Bumped when the cookie policy materially changes to force re-consent. */
  version: number;
}

// Bump when the set of cookies/categories changes materially — visitors who
// consented under an older version will be re-prompted.
export const CONSENT_VERSION = 1;

export const CONSENT_COOKIE = "sellora_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days, then re-prompt

// Fired on the window whenever consent is saved, so listeners (tracking
// scripts, the banner) react without a page reload.
export const CONSENT_CHANGE_EVENT = "sellora:consent-change";
// Fired to re-open the preferences UI (e.g. from a footer "Cookie settings" link).
export const CONSENT_OPEN_EVENT = "sellora:consent-open";

/** Default state before any decision: only strictly-necessary is on. */
export function defaultConsent(): ConsentState {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}

function isValid(value: unknown): value is ConsentState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.analytics === "boolean" &&
    typeof v.marketing === "boolean" &&
    typeof v.version === "number"
  );
}

/**
 * Read the stored decision, or `null` if the visitor hasn't chosen yet (or
 * their choice predates the current policy version and needs refreshing).
 * Reads the cookie so the value is available both client- and server-side.
 */
export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    if (!isValid(parsed) || parsed.version !== CONSENT_VERSION) return null;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

/** Persist a decision and notify listeners. */
export function writeConsent(state: ConsentState): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(state));
  const secure = location.protocol === "https:" ? "; Secure" : "";
  // SameSite=Lax + readable by JS (not HttpOnly) so client scripts can gate on it.
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }));
}

/** Whether a given non-necessary category is currently allowed to run. */
export function isAllowed(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  const state = readConsent();
  return state ? state[category] === true : false;
}

/** Ask the UI to re-open the cookie preferences dialog. */
export function openConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}
