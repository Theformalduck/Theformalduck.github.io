"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send, Check, Loader2 } from "lucide-react";

const CATEGORIES = ["Idea", "Bug", "Question", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Category>("Idea");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const close = () => {
    if (status === "sending") return;
    setOpen(false);
    // reset shortly after the close animation
    setTimeout(() => { setStatus("idle"); setError(""); }, 200);
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed) { setError("Please enter your feedback."); return; }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, category }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to send feedback.");
      }
      setStatus("sent");
      setMessage("");
      setTimeout(() => close(), 1600);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to send feedback.");
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2e9cfe] text-white shadow-lg shadow-[#2e9cfe]/30 hover:bg-[#1a8cf0] hover:shadow-xl transition-all text-sm font-semibold"
        title="Send feedback"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {status === "sent" ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Thanks for the feedback!</h2>
                <p className="text-sm text-gray-500">It&apos;s on its way to the team.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquarePlus className="w-5 h-5 text-[#2e9cfe]" />
                  <h2 className="text-lg font-bold text-gray-900">Send feedback</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Tell us what&apos;s working, what&apos;s broken, or what you&apos;d love to see. It goes straight to the team.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        category === c
                          ? "bg-[#2e9cfe] text-white border-[#2e9cfe]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }}
                  placeholder="Share your thoughts…"
                  rows={5}
                  maxLength={5000}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:bg-white focus:border-[#2e9cfe] focus:outline-none focus:ring-1 focus:ring-[#2e9cfe]/20 resize-none"
                />

                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

                <button
                  onClick={submit}
                  disabled={status === "sending" || !message.trim()}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2e9cfe] text-white text-sm font-semibold hover:bg-[#1a8cf0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === "sending"
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <><Send className="w-4 h-4" /> Send feedback</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
