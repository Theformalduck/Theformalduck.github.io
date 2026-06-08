"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_OPEN_EVENT,
  CONSENT_VERSION,
  type ConsentState,
  defaultConsent,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * Subscribe to the current consent decision. Returns `null` until the visitor
 * has chosen (or while the policy version is newer than their saved choice).
 * Re-renders whenever consent changes anywhere in the app.
 */
export function useConsent(): ConsentState | null {
  const [state, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    setState(readConsent());
    const sync = () => setState(readConsent());
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
  }, []);

  return state;
}

const CATEGORIES = [
  {
    key: "necessary" as const,
    title: "Strictly necessary",
    desc: "Required to sign in, keep you secure, and remember this cookie choice. Always on.",
    locked: true,
  },
  {
    key: "analytics" as const,
    title: "Analytics",
    desc: "Help us and store owners understand how pages are used so the experience can be improved.",
    locked: false,
  },
  {
    key: "marketing" as const,
    title: "Marketing",
    desc: "Used by store owners for advertising and retargeting (e.g. Meta Pixel) and similar embeds.",
    locked: false,
  },
];

/**
 * Global cookie-consent banner, built to the strict EU opt-in bar:
 *  - nothing non-essential runs until the visitor accepts,
 *  - "Reject all" is exactly as prominent as "Accept all",
 *  - choices can be reopened any time via openConsentPreferences().
 * Mounted once near the app root.
 */
export function CookieConsent() {
  // `undefined` = still reading; `null` = no decision yet (show banner).
  const [decision, setDecision] = useState<ConsentState | null | undefined>(undefined);
  const [showPrefs, setShowPrefs] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    setDecision(readConsent());
    const reopen = () => {
      const current = readConsent();
      setDraft({
        analytics: current?.analytics ?? false,
        marketing: current?.marketing ?? false,
      });
      setShowPrefs(true);
      setDecision(null); // force the surface open even if previously decided
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const save = useCallback((analytics: boolean, marketing: boolean) => {
    const next: ConsentState = {
      ...defaultConsent(),
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    writeConsent(next);
    setDecision(next);
    setShowPrefs(false);
  }, []);

  // Nothing to show: still loading, or a decision already exists and prefs closed.
  const visible = decision === null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:p-5 pointer-events-none"
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-nexus-50 text-nexus-600">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900">We value your privacy</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    We use strictly necessary cookies to run Sellora. With your permission we also
                    use analytics and marketing cookies to improve the experience. You can accept,
                    reject, or choose what to allow. See our{" "}
                    <Link href="/cookies" className="font-medium text-nexus-600 underline underline-offset-2">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {showPrefs && (
                <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
                  {CATEGORIES.map((cat) => {
                    const checked = cat.locked
                      ? true
                      : draft[cat.key as "analytics" | "marketing"];
                    return (
                      <label
                        key={cat.key}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3",
                          cat.locked ? "border-gray-100 bg-gray-50" : "border-gray-200"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-nexus-600"
                          checked={checked}
                          disabled={cat.locked}
                          onChange={(e) =>
                            !cat.locked &&
                            setDraft((d) => ({ ...d, [cat.key]: e.target.checked }))
                          }
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                            {cat.title}
                            {cat.locked && <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                            {cat.desc}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                {showPrefs ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => save(false, false)}
                      className="sm:order-1"
                    >
                      Reject all
                    </Button>
                    <Button
                      onClick={() => save(draft.analytics, draft.marketing)}
                      className="sm:order-2"
                    >
                      Save choices
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPrefs(true)}
                      className="sm:order-1 sm:mr-auto"
                    >
                      Manage preferences
                    </Button>
                    <Button variant="outline" onClick={() => save(false, false)} className="sm:order-2">
                      Reject all
                    </Button>
                    <Button onClick={() => save(true, true)} className="sm:order-3">
                      Accept all
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
