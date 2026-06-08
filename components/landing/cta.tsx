"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #054d8a 0%, #0a7cc4 18%, #1099e0 38%, #1ab4ea 58%, #3dc8f5 78%, #d4f3fd 96%, #f0faff 100%)"
      }}
    >
      {/* Subtle dot overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/12 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-6"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Start today
          </p>

          <h2
            className="text-4xl sm:text-5xl lg:text-[60px] font-bold text-white mb-6"
            style={{
              letterSpacing: "-0.035em",
              lineHeight: "1.06",
              textShadow: "0 2px 24px rgba(0,40,100,0.3)",
            }}
          >
            Your creator business
            <br />
            starts{" "}
            <span
              style={{
                background: "linear-gradient(100deg, #d4f3fd 0%, #ffffff 40%, #c8e83c 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              right now.
            </span>
          </h2>

          <p className="text-lg mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            Free to start. No credit card required.
            Upgrade when you're ready to scale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <span
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer"
                style={{
                  background: "#c8e83c",
                  color: "#162000",
                  boxShadow: "0 4px 24px rgba(200,232,60,0.4), 0 1px 3px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                Create your free account
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/signup?plan=pro">
              <span
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.16)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
              >
                Start Pro trial free
              </span>
            </Link>
          </div>

          <p className="text-[12px] mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            14-day Pro trial included. Downgrade to Free anytime.
          </p>
        </motion.div>
      </div>

      {/* Cloud base */}
      <div className="relative w-full mt-12" style={{ height: "100px" }}>
        <svg viewBox="0 0 1440 100" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none">
          <ellipse cx="200" cy="92" rx="180" ry="48" fill="rgba(240,250,255,0.85)" />
          <ellipse cx="350" cy="82" rx="140" ry="44" fill="white" />
          <ellipse cx="700" cy="96" rx="160" ry="44" fill="rgba(248,252,255,0.9)" />
          <ellipse cx="900" cy="86" rx="130" ry="46" fill="white" />
          <ellipse cx="1200" cy="92" rx="168" ry="48" fill="rgba(240,250,255,0.85)" />
          <ellipse cx="1380" cy="88" rx="120" ry="44" fill="white" />
          <rect x="0" y="88" width="1440" height="16" fill="white" />
        </svg>
      </div>
    </section>
  );
}
