"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    desc: "Perfect for getting started and exploring the platform.",
    icon: Star,
    iconBg: "from-slate-500 to-slate-600",
    cta: "Get started free",
    ctaStyle: "bg-white/[0.05] border border-white/[0.1] text-white/80 hover:bg-white/[0.06]",
    features: [
      { label: "3 resume versions", included: true },
      { label: "Basic AI suggestions", included: true },
      { label: "2 PDF exports / month", included: true },
      { label: "1 portfolio site", included: true },
      { label: "Standard themes", included: true },
      { label: "folio.ai subdomain", included: true },
      { label: "Unlimited AI rewrites", included: false },
      { label: "Custom domain", included: false },
      { label: "ATS optimization", included: false },
      { label: "Recruiter analytics", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, annual: 14 },
    desc: "Everything you need to land your dream job faster.",
    icon: Zap,
    iconBg: "from-white/20 to-white/10",
    cta: "Start Pro trial",
    ctaStyle: "bg-white text-[#060608] hover:bg-white/90",
    badge: "Most popular",
    features: [
      { label: "Unlimited resume versions", included: true },
      { label: "Full AI suite (5 modes)", included: true },
      { label: "Unlimited PDF exports", included: true },
      { label: "3 portfolio sites", included: true },
      { label: "50+ premium themes", included: true },
      { label: "Custom domain (1)", included: true },
      { label: "ATS score + optimization", included: true },
      { label: "Recruiter view analytics", included: true },
      { label: "GitHub integration", included: true },
      { label: "AI project descriptions", included: true },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "team",
    name: "Team",
    price: { monthly: 49, annual: 38 },
    desc: "For bootcamps, career coaches, and small teams.",
    icon: Building2,
    iconBg: "from-emerald-500 to-teal-600",
    cta: "Contact sales",
    ctaStyle: "bg-white/[0.05] border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "5 team members", included: true },
      { label: "Unlimited portfolios", included: true },
      { label: "3 custom domains", included: true },
      { label: "Recruiter review dashboard", included: true },
      { label: "Team resume templates", included: true },
      { label: "Bulk PDF export", included: true },
      { label: "White-label option", included: true },
      { label: "API access", included: true },
      { label: "Dedicated success manager", included: true },
      { label: "24/7 priority support", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "Is there a free trial for Pro?",
    a: "Yes! Every new account gets a 14-day Pro trial with full access, no credit card required. Cancel anytime.",
  },
  {
    q: "Can I export ATS-safe PDFs on the free plan?",
    a: "You get 2 PDF exports per month on the free plan. Pro gives you unlimited exports with additional formatting options.",
  },
  {
    q: "What AI models power the resume rewriting?",
    a: "We use GPT-4o for all resume optimization and rewriting. Folio AI adds a custom career intelligence layer on top.",
  },
  {
    q: "Can I use my own domain for my portfolio?",
    a: "Custom domains are available on Pro ($19/mo) and Team plans. Setup takes under 2 minutes with our DNS wizard.",
  },
  {
    q: "How does the recruiter analytics work?",
    a: "When a recruiter views your portfolio, we capture anonymous session data: time on page, sections read, projects clicked. You get real insight into what's resonating.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#050508]">
      <Navbar />

      <div className="relative pt-32 pb-24 px-4">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:"absolute", top:"10%", left:"50%", transform:"translateX(-50%)", width:600, height:400, background:"radial-gradient(ellipse at center, rgba(52,211,153,0.05) 0%, transparent 65%)", filter:"blur(40px)" }} />
          <div className="bg-grid absolute inset-0 opacity-40" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12 relative"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-white/40 mb-5 uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            Simple, honest pricing
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white" style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Invest in your career.<br />
            <span style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Start free, upgrade when ready.</span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed">
            No hidden fees. No feature gates you'll hit on day one. A real free plan that actually works.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm transition-colors ${!annual ? "text-white/80" : "text-white/35"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-white/[0.3]" : "bg-white/[0.08]"}`}
          >
            <motion.div
              animate={{ x: annual ? 24 : 2 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
          <span className={`text-sm transition-colors ${annual ? "text-white/80" : "text-white/35"}`}>
            Annual
            <span className="ml-1.5 text-xs text-emerald-400 font-medium">Save 25%</span>
          </span>
        </div>

        {/* Plans */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 mb-20">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-7 flex flex-col transition-all ${
                plan.id === "pro"
                  ? "bg-white/[0.04] border-white/[0.15]"
                  : "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.1]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#060608]">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.iconBg} flex items-center justify-center mb-4 shadow-lg`}>
                <plan.icon className="w-5 h-5 text-white" />
              </div>

              <h2 className="text-xl font-bold mb-1 text-white">{plan.name}</h2>
              <p className="text-sm text-white/35 mb-5">{plan.desc}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-sm text-white/35">/month</span>
                  )}
                </div>
                {annual && plan.price.monthly > 0 && (
                  <div className="text-xs text-white/35 mt-0.5">
                    Billed ${annual ? plan.price.annual * 12 : plan.price.monthly * 12}/year
                  </div>
                )}
                {plan.price.monthly === 0 && (
                  <div className="text-xs text-white/35 mt-0.5">Free forever</div>
                )}
              </div>

              <Link
                href="/dashboard"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all mb-7 ${plan.ctaStyle}`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex-1 space-y-3">
                {plan.features.map(f => (
                  <div key={f.label} className={`flex items-start gap-3 text-sm ${f.included ? "text-white/60" : "text-white/25"}`}>
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-white/25 flex-shrink-0 mt-0.5" />
                    )}
                    {f.label}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compare table teaser */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">Compare all features</h2>
          <p className="text-white/35 text-center text-sm mb-8">Every detail, side by side.</p>
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
            {[
              { feature: "Resume versions", free: "3", pro: "Unlimited", team: "Unlimited" },
              { feature: "AI rewrite modes", free: "1 (Basic)", pro: "All 5", team: "All 5 + Custom" },
              { feature: "PDF exports/month", free: "2", pro: "Unlimited", team: "Unlimited" },
              { feature: "Portfolio sites", free: "1", pro: "3", team: "Unlimited" },
              { feature: "Custom domains", free: "—", pro: "1", team: "3" },
              { feature: "ATS score + optimizer", free: "Basic", pro: "Full", team: "Full" },
              { feature: "Recruiter analytics", free: "—", pro: "✓", team: "✓" },
            ].map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 items-center px-5 py-3 text-sm ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                <span className="text-white/45">{row.feature}</span>
                <span className="text-center text-white/35">{row.free}</span>
                <span className="text-center text-white/75 font-medium">{row.pro}</span>
                <span className="text-center text-emerald-400">{row.team}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 px-5 py-3 border-t border-white/[0.05] text-xs text-white/35 font-medium uppercase tracking-wider">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center">Pro</span>
              <span className="text-center">Team</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-10 text-white">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {faq.q}
                  <motion.div animate={{ rotate: expandedFaq === i ? 45 : 0 }} className="flex-shrink-0 ml-4">
                    <X className="w-4 h-4 text-white/35" />
                  </motion.div>
                </button>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="px-5 pb-4 text-sm text-white/45 leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-white/40">Join 47,000+ professionals</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#060608] font-semibold hover:bg-white/90 transition-all"
            >
              <Zap className="w-4 h-4" />
              Start free — no card needed
            </Link>
            <span className="text-white/35 text-sm">or</span>
            <button
              onClick={() => toast("Opening sales contact…", { description: "We'll redirect you to our calendar booking page", action: { label: "Email us", onClick: () => window.open("mailto:sales@folio.ai") } })}
              className="text-sm text-white/35 hover:text-white/55 underline underline-offset-4 transition-colors"
            >
              Talk to sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
