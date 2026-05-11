"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, ArrowDown, ChevronRight,
  Brain, Globe, BarChart3, Shield, TrendingUp, GitBranch,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const FLOAT_CARDS = [
  { label: "Resume Score",  value: "94",    sub: "+12 this week",   x: "6%",   y: "22%",  delay: 0.9 },
  { label: "Recruiters",    value: "2,847", sub: "viewed today",    x: "74%",  y: "18%",  delay: 1.0 },
  { label: "ATS Match",     value: "97%",   sub: "keyword match",   x: "4%",   y: "62%",  delay: 1.1 },
  { label: "Offers sent",   value: "1,240", sub: "this month",      x: "76%",  y: "60%",  delay: 1.2 },
];

const BRANDS = ["Stripe", "Notion", "Linear", "Figma", "Vercel", "GitHub", "Anthropic", "OpenAI", "Raycast", "Zapier"];

const FEATURES = [
  { icon: Brain,      title: "AI Resume Intelligence",  desc: "Type rough notes. Get polished, recruiter-ready bullet points with metrics and impact in seconds."         },
  { icon: Globe,      title: "Instant Portfolio Sites", desc: "One-click portfolio from your resume data. Custom domains, themes, zero code required."                    },
  { icon: BarChart3,  title: "ATS Score & Optimizer",   desc: "AI scores your resume for ATS compatibility, keyword density, and gives targeted improvement suggestions."  },
  { icon: Shield,     title: "ATS-Safe PDF Export",     desc: "Beautiful interactive resume AND a clean, machine-readable PDF — both generated from one source."           },
  { icon: TrendingUp, title: "Recruiter Analytics",     desc: "See who viewed your portfolio, which sections got attention, and where recruiters drop off."                },
  { icon: GitBranch,  title: "GitHub Integration",      desc: "Auto-detect your tech stack, import contribution graphs, and generate polished project summaries."          },
];

export default function LandingPage() {
  const [sectionIdx, setSectionIdx] = useState(1);

  useEffect(() => {
    const fn = () => setSectionIdx(Math.min(Math.floor(window.scrollY / (window.innerHeight * 0.7)) + 1, 3));
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "#060608", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

        {/* Ambient blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Left muted blob */}
          <div style={{ position: "absolute", top: "5%", left: "-8%", width: "48%", height: "75%", background: "radial-gradient(ellipse at 60% 40%, rgba(100,110,130,0.07) 0%, transparent 68%)", filter: "blur(50px)" }} />
          {/* Right teal glow */}
          <div style={{ position: "absolute", top: "0%", right: "-6%", width: "55%", height: "80%", background: "radial-gradient(ellipse at 40% 30%, rgba(52,211,153,0.10) 0%, rgba(16,185,129,0.05) 45%, transparent 70%)", filter: "blur(65px)" }} />
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />
        </div>

        {/* Floating stat cards */}
        {FLOAT_CARDS.map(card => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.6 }}
            className="float-card"
            style={{
              position: "absolute",
              left: card.x, top: card.y,
              zIndex: 10,
            }}
          >
            <div style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "10px 16px",
              minWidth: 136,
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginBottom: 5, letterSpacing: "0.03em" }}>• {card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 4 }}>{card.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{card.sub}</div>
            </div>
          </motion.div>
        ))}

        {/* Center content */}
        <div style={{ textAlign: "center", maxWidth: 660, padding: "0 24px", position: "relative", zIndex: 10 }}>

          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 36, cursor: "default" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
            AI-powered resume + portfolio platform
            <ChevronRight style={{ width: 12, height: 12, opacity: 0.45 }} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            style={{ fontSize: "clamp(3rem,8.5vw,5.8rem)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.04, marginBottom: 24 }}
          >
            One-click for{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Career Defense</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", maxWidth: 430, margin: "0 auto 44px", lineHeight: 1.68 }}
          >
            Dive into AI-powered resumes, where innovative technology meets career expertise
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}
          >
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Open App <ArrowUpRight style={{ width: 14, height: 14 }} />
            </Link>
            <Link href="/editor/resume" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 26px", borderRadius: 999, background: "#fff", color: "#060608", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Discover More
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator — bottom left */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ position: "absolute", bottom: 36, left: 40, display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.28)", fontSize: 11, letterSpacing: "0.02em" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowDown style={{ width: 12, height: 12 }} />
          </div>
          {String(sectionIdx).padStart(2, "0")}/03 · Scroll down
        </motion.div>

        {/* Section label — bottom right */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ position: "absolute", bottom: 36, right: 40, color: "rgba(255,255,255,0.22)", fontSize: 11, textAlign: "right" }}>
          <div style={{ marginBottom: 6, letterSpacing: "0.04em" }}>Career horizons</div>
          <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.12)", marginLeft: "auto" }} />
        </motion.div>
      </section>

      {/* ─── BRAND STRIP ─── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "18px 0", overflow: "hidden", background: "rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", gap: 0 }}>
          <motion.div
            animate={{ x: [0, -960] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            style={{ display: "flex", gap: 64, whiteSpace: "nowrap", flexShrink: 0, paddingRight: 64 }}
          >
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: "108px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 22, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Platform
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 16 }}>
              Everything in one place.
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>
              Resume, portfolio, analytics, ATS — all AI-powered.
            </p>
          </motion.div>

          {/* 3×2 grid with hairline borders */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{
                  padding: "32px 28px",
                  background: "rgba(255,255,255,0.018)",
                  borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.018)"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <f.icon style={{ width: 18, height: 18, color: "rgba(255,255,255,0.55)" }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "72px 24px", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }}>
          {[["47K+","Resumes created"],["12K+","Portfolios live"],["89%","Interview rate lift"],["4.9★","Average rating"]].map(([val, lbl], i) => (
            <motion.div key={lbl} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>{val}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{lbl}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: "108px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 16 }}>From rough to ready.</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", lineHeight: 1.65 }}>No blank page. No endless forms. Just tell us what you did.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
            {[
              { n: "01", title: "Import anything",   desc: "Connect GitHub, paste your old resume, type rough notes, or upload a PDF." },
              { n: "02", title: "AI generates",       desc: "Polished resume, project summaries, skill breakdowns — all tailored to your profile in seconds." },
              { n: "03", title: "Publish & export",   desc: "Pick a theme, tweak the copy, publish your portfolio, and export an ATS-ready PDF." },
            ].map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: "36px 32px", background: "rgba(255,255,255,0.018)", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: "rgba(255,255,255,0.04)", fontFamily: "monospace", lineHeight: 1, marginBottom: 24, letterSpacing: "-0.05em" }}>{step.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "96px 24px 120px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
        {/* Subtle center glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "100%", background: "radial-gradient(ellipse at center, rgba(52,211,153,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(2.2rem,5.5vw,4.2rem)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
            Your dream job is<br />
            <span style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>one resume away.</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", marginBottom: 48, lineHeight: 1.65 }}>
            Free to start. Takes two minutes. No credit card.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 999, background: "#fff", color: "#060608", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Build my resume <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/editor/portfolio" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", fontSize: 15, textDecoration: "none" }}>
              Create portfolio
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.svg" alt="Logo" style={{ width: 20, height: 20 }} className="invert opacity-50" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              Folio<span style={{ color: "rgba(255,255,255,0.25)" }}>.ai</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
            {[{ label: "Privacy", href: "/pricing" }, { label: "Terms", href: "/pricing" }, { label: "Blog", href: "/dashboard" }, { label: "Status", href: "/analytics" }].map(l => (
              <Link key={l.label} href={l.href} style={{ color: "inherit", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>© 2026 Folio AI, Inc.</span>
        </div>
      </footer>
    </div>
  );
}
