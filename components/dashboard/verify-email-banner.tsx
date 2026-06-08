"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Mail, X, Loader2 } from "lucide-react";

export function VerifyEmailBanner() {
  const { data: session, update } = useSession();
  const [dismissed, setDismissed] = useState(false);

  // After email verification redirect, refresh the session so the banner disappears.
  // Read the query string directly (client-only) to avoid useSearchParams()'s CSR
  // bailout, which would force every dashboard page out of static generation.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("verified") === "1") {
      update();
    }
  }, []);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  // Only show for credential users who haven't verified
  if (dismissed || !session?.user || (session.user as any).emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? "Failed to send email");
      } else if (data.alreadyVerified) {
        await update();
      } else {
        setSent(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-sm text-amber-800">
        <Mail className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <span>
          Please verify your email address to unlock all features.
        </span>
        {!sent ? (
          <button
            onClick={handleResend}
            disabled={sending}
            className="underline font-medium hover:no-underline flex items-center gap-1 disabled:opacity-60"
          >
            {sending && <Loader2 className="w-3 h-3 animate-spin" />}
            Resend email
          </button>
        ) : (
          <span className="font-medium text-amber-700">Verification email sent!</span>
        )}
        {sendError && <span className="text-red-600 font-medium">{sendError}</span>}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
