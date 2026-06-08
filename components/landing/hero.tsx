"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Play, TrendingUp, DollarSign, Zap, BarChart3, Sparkles, Globe, ShoppingBag, LayoutDashboard } from "lucide-react";

export function Hero() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden pt-32 pb-0"
      style={{
        background: "linear-gradient(180deg, #054d8a 0%, #0a7cc4 14%, #1099e0 30%, #1ab4ea 50%, #3dc8f5 70%, #92e0fb 86%, #d4f3fd 95%, #f0faff 100%)"
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Central glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-white/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Text + CTAs ───────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center pt-7">

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-[52px] sm:text-6xl lg:text-7xl font-bold leading-[1.04] mb-6"
          style={{
            color: "#ffffff",
            letterSpacing: "-0.035em",
            textShadow: "0 1px 20px rgba(0,40,90,0.25)",
          }}
        >
          Your creator business,
          <br />
          <span
            style={{
              background: "linear-gradient(100deg, #d4f3fd 0%, #ffffff 40%, #c8e83c 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            all in one place.
          </span>
        </motion.h1>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[17px] sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          Portfolio. Crowdfunding. Store. Community. Analytics.
          One login, one dashboard, zero tab-switching.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
        >
          {isLoggedIn ? (
            <Link href="/dashboard">
              <span
                className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  background: "#c8e83c",
                  color: "#162000",
                  boxShadow: "0 4px 20px rgba(200,232,60,0.45), 0 1px 3px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(200,232,60,0.5), 0 2px 6px rgba(0,0,0,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(200,232,60,0.45), 0 1px 3px rgba(0,0,0,0.1)"; }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </span>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <span
                  className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: "#c8e83c",
                    color: "#162000",
                    boxShadow: "0 4px 20px rgba(200,232,60,0.45), 0 1px 3px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(200,232,60,0.5), 0 2px 6px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(200,232,60,0.45), 0 1px 3px rgba(0,0,0,0.1)"; }}
                >
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <button
                className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-2xl transition-all duration-200"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              >
                <Play className="w-3.5 h-3.5" fill="rgba(255,255,255,0.9)" />
                Watch demo
              </button>
            </>
          )}
        </motion.div>

        {/* Social proof — logos row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-[12px] uppercase tracking-widest font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Trusted by creators at
          </p>
          <div className="flex items-center gap-6 sm:gap-8">
            {["Behance", "Dribbble", "Product Hunt", "Indie Hackers"].map((brand) => (
              <span
                key={brand}
                className="text-[13px] font-semibold"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Floating UI cards ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto px-4 mt-16 flex items-end justify-center gap-4"
        style={{ perspective: "1400px" }}
      >
        {/* Card — analytics */}
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          className="hidden lg:flex flex-col flex-shrink-0 w-44 rounded-2xl p-4"
          style={{
            background: "#0b1e34",
            border: "1px solid rgba(255,255,255,0.07)",
            transform: "rotateY(28deg) rotateX(5deg) scale(0.84) translateX(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wide">Revenue</span>
            <BarChart3 className="w-3 h-3 text-nexus-400" />
          </div>
          <div className="text-white font-bold text-2xl tracking-tight mb-0.5">$8,420</div>
          <div className="text-emerald-400 text-[11px] font-medium mb-4">↑ 24% this month</div>
          <div className="flex items-end gap-0.5 h-10">
            {[25, 42, 35, 62, 48, 74, 58, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[2px]"
                style={{ height: `${h}%`, background: i === 7 ? "#0ea5e9" : "rgba(14,165,233,0.25)" }}
              />
            ))}
          </div>
        </motion.div>

        {/* Card — smart growth */}
        <motion.div
          animate={{ y: [0, -13, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="hidden sm:flex flex-col flex-shrink-0 w-52 bg-white rounded-2xl p-4"
          style={{
            transform: "rotateY(16deg) rotateX(4deg) scale(0.91) translateX(12px)",
            boxShadow: "0 20px 56px rgba(0,0,0,0.22)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 rounded-xl bg-nexus-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-nexus-600" />
            </div>
            <div>
              <div className="text-gray-900 text-xs font-semibold">Smart growth</div>
              <div className="text-gray-400 text-[10px]">AI-powered</div>
            </div>
          </div>
          <div className="space-y-2 mb-3.5">
            {["AI copywriting", "SEO optimized", "Auto-analytics"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-[11px] text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {f}
              </div>
            ))}
          </div>
          <div className="pt-2.5 border-t border-gray-100">
            <div className="text-gray-900 font-bold text-lg leading-none">520k+</div>
            <div className="text-gray-400 text-[10px] mt-0.5">backers reached</div>
          </div>
        </motion.div>

        {/* Center card — most prominent */}
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="flex-shrink-0 w-56 sm:w-[260px] bg-white rounded-2xl p-5"
          style={{
            transform: "rotateX(2deg) scale(1.04)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-nexus-500 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <div>
              <div className="text-gray-900 text-sm font-semibold">Creator toolkit</div>
              <div className="text-gray-400 text-[11px]">Everything you need</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: Globe, label: "Portfolio", bg: "#f0f9ff", color: "#0284c7" },
              { icon: DollarSign, label: "Campaigns", bg: "#f0fdf4", color: "#16a34a" },
              { icon: ShoppingBag, label: "Store", bg: "#fffbeb", color: "#d97706" },
            ].map(({ icon: Icon, label, bg, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-gray-500 text-[10px] font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Monthly revenue</span>
            <span className="text-sm font-bold text-emerald-600">$12,400</span>
          </div>
        </motion.div>

        {/* Card — ai powered */}
        <motion.div
          animate={{ y: [0, -11, 0] }}
          transition={{ duration: 4.9, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
          className="hidden sm:flex flex-col flex-shrink-0 w-52 rounded-2xl p-4"
          style={{
            background: "#0b1e34",
            transform: "rotateY(-16deg) rotateX(4deg) scale(0.91) translateX(-12px)",
            boxShadow: "0 20px 56px rgba(0,0,0,0.38)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#c8e83c] flex items-center justify-center">
              <Zap className="w-3 h-3 text-gray-900" fill="#1a2400" />
            </div>
            <span className="text-white/75 text-xs font-semibold">AI assistant</span>
          </div>
          <p className="text-white/50 text-[11px] leading-relaxed mb-3.5">
            Generate copy, analyze performance, and get personalized growth recommendations.
          </p>
          <div className="space-y-1.5">
            {["Content strategy", "Revenue insights", "Audience growth"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#c8e83c]" />
                <span className="text-white/45 text-[11px]">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card — analytics chart */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          className="hidden lg:flex flex-col flex-shrink-0 w-44 bg-white rounded-2xl p-4"
          style={{
            transform: "rotateY(-28deg) rotateX(5deg) scale(0.84) translateX(-24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-gray-600 text-[10px] font-semibold">Followers</span>
          </div>
          <div className="text-gray-900 font-bold text-xl tracking-tight">8,924</div>
          <div className="text-emerald-500 text-[10px] font-medium mb-3">+5.2% this week</div>
          <div className="relative h-12">
            <svg viewBox="0 0 120 42" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,38 C15,34 28,28 45,22 C62,16 75,12 90,8 C102,5 112,4 120,3 L120,42 L0,42 Z" fill="url(#followerGrad)" />
              <path d="M0,38 C15,34 28,28 45,22 C62,16 75,12 90,8 C102,5 112,4 120,3" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Cloud base ─────────────────────────────────────── */}
      <div className="relative w-full mt-10" style={{ height: "160px" }}>
        <svg
          viewBox="0 0 1440 160"
          className="absolute bottom-0 left-0 w-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="160" cy="148" rx="190" ry="55" fill="rgba(225,245,255,0.75)" />
          <ellipse cx="310" cy="136" rx="145" ry="52" fill="rgba(235,249,255,0.85)" />
          <ellipse cx="1280" cy="148" rx="190" ry="55" fill="rgba(225,245,255,0.75)" />
          <ellipse cx="1130" cy="136" rx="155" ry="52" fill="rgba(235,249,255,0.85)" />

          <ellipse cx="90" cy="158" rx="170" ry="58" fill="rgba(245,252,255,0.92)" />
          <ellipse cx="250" cy="148" rx="138" ry="56" fill="white" />
          <ellipse cx="380" cy="156" rx="115" ry="50" fill="rgba(250,253,255,0.96)" />
          <ellipse cx="680" cy="160" rx="155" ry="48" fill="rgba(248,252,255,0.92)" />
          <ellipse cx="840" cy="150" rx="128" ry="52" fill="white" />
          <ellipse cx="1040" cy="156" rx="138" ry="54" fill="rgba(245,252,255,0.96)" />
          <ellipse cx="1190" cy="148" rx="148" ry="58" fill="white" />
          <ellipse cx="1390" cy="155" rx="155" ry="54" fill="rgba(248,252,255,0.92)" />

          <ellipse cx="195" cy="166" rx="118" ry="42" fill="white" />
          <ellipse cx="305" cy="163" rx="98" ry="40" fill="white" />
          <ellipse cx="490" cy="168" rx="78" ry="36" fill="rgba(252,255,255,0.92)" />
          <ellipse cx="775" cy="168" rx="88" ry="38" fill="white" />
          <ellipse cx="955" cy="165" rx="98" ry="40" fill="white" />
          <ellipse cx="1148" cy="164" rx="108" ry="42" fill="white" />
          <ellipse cx="1340" cy="166" rx="125" ry="40" fill="white" />

          <rect x="0" y="154" width="1440" height="10" fill="white" />
        </svg>
      </div>
    </section>
  );
}
