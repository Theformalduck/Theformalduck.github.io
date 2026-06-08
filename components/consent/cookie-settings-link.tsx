"use client";

import { openConsentPreferences } from "@/lib/consent";

/**
 * A text link that re-opens the cookie preferences dialog. Lets visitors change
 * or withdraw consent at any time — a requirement under GDPR/ePrivacy.
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      Cookie Settings
    </button>
  );
}
