"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, X, ExternalLink, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupState {
  hasUsername: boolean;
  hasStore: boolean;
  hasProduct: boolean;
  hasSale: boolean;
}

const DISMISS_KEY = "sellora_getstarted_dismissed";

/**
 * The "success path" for a new creator, answers "what do I click first?".
 * Shows ordered, actionable steps with real completion state, surfaces the live
 * store link once it's shareable, and auto-hides once everything is done.
 */
export function GetStarted({ setup, username }: { setup?: SetupState; username?: string | null }) {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (!setup || dismissed) return null;

  const liveUrl = username ? `/${username}/store` : null;

  const steps = [
    {
      label: "Claim your link",
      desc: "Pick the username your store lives at.",
      href: "/settings",
      cta: "Set username",
      done: setup.hasUsername,
    },
    {
      label: "Set up your store",
      desc: "Name it and choose a look that fits your brand.",
      href: "/store/customize",
      cta: "Customize",
      done: setup.hasStore,
    },
    {
      label: "Add your first product",
      desc: "Sell a digital download, physical good, or service.",
      href: "/store/products/new",
      cta: "Add product",
      done: setup.hasProduct,
    },
    {
      label: "Share your page",
      desc: "Your store is live, send the link to your audience.",
      href: liveUrl ?? "/settings",
      cta: liveUrl ? "View live page" : "Set username",
      done: setup.hasSale,
      external: !!liveUrl,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null; // fully set up, get out of the way

  // The first not-yet-done step is the single most obvious next action.
  const nextIndex = steps.findIndex((s) => !s.done);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-5 rounded-2xl border border-nexus-100 bg-gradient-to-br from-nexus-50/80 to-white p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-nexus-600 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 leading-tight">Get your store live</h3>
            <p className="text-gray-500 text-[12px] mt-0.5">{doneCount} of {steps.length} done, pick up where you left off.</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-nexus-100 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-nexus-600 transition-[width] duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <motion.li
              key={step.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: "easeOut" }}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                step.done ? "border-transparent bg-transparent" : isNext ? "border-nexus-200 bg-white" : "border-gray-100 bg-white/60 hover:border-gray-200"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-semibold",
                  step.done ? "bg-emerald-500 text-white" : isNext ? "bg-nexus-600 text-white" : "bg-gray-100 text-gray-400"
                )}
              >
                {step.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[13px] font-semibold", step.done ? "text-gray-400 line-through" : "text-gray-900")}>
                  {step.label}
                </p>
                {!step.done && <p className="text-gray-500 text-[12px] mt-0.5">{step.desc}</p>}
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  {...(step.external ? { target: "_blank" } : {})}
                  className={cn(
                    "inline-flex flex-none items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    isNext ? "bg-nexus-600 text-white hover:bg-nexus-700" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {step.cta}
                  {step.external ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
}
