"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Indie Game Developer",
    initials: "AR",
    avatarBg: "#0ea5e9",
    quote: "I raised $45K for my game in 3 weeks. The campaign tools are genuinely impressive — the AI-generated copy alone probably added 20% to my funding.",
    metric: "$45K",
    metricLabel: "raised in 21 days",
    cardBg: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  {
    name: "Sarah Chen",
    role: "UX Designer & Educator",
    initials: "SC",
    avatarBg: "#0284c7",
    quote: "My Sellora portfolio landed me 3 contract clients in the first month. The AI builder created a site I genuinely love in under an hour.",
    metric: "3 contracts",
    metricLabel: "in the first month",
    cardBg: "#ffffff",
    borderColor: "#e2e8f0",
  },
  {
    name: "Marcus Williams",
    role: "Digital Artist",
    initials: "MW",
    avatarBg: "#d97706",
    quote: "I was using Gumroad + Kickstarter + Linktree + a WordPress site. Now it's all on Sellora and I'm saving $200/month while doing more than ever.",
    metric: "$200/mo",
    metricLabel: "saved on tools",
    cardBg: "#fffbeb",
    borderColor: "#fde68a",
  },
  {
    name: "Priya Sharma",
    role: "Course Creator",
    initials: "PS",
    avatarBg: "#16a34a",
    quote: "The community features turned my audience into a real community. Subscriber count tripled in 2 months and my course sales followed.",
    metric: "3× growth",
    metricLabel: "in 2 months",
    cardBg: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  {
    name: "Jordan Kim",
    role: "Freelance Developer",
    initials: "JK",
    avatarBg: "#7c3aed",
    quote: "As a developer, I was skeptical about no-code tools. But the Sellora portfolio builder is genuinely impressive — the output is clean and the SEO is excellent.",
    metric: "Top 3",
    metricLabel: "Google for my niche",
    cardBg: "#fdf4ff",
    borderColor: "#e9d5ff",
  },
  {
    name: "Elena Vasquez",
    role: "Jewelry Maker",
    initials: "EV",
    avatarBg: "#db2777",
    quote: "The store is so easy. I listed 40 products in an afternoon. Shipping integration and inventory tracking alone save me hours every week.",
    metric: "40 products",
    metricLabel: "live in one afternoon",
    cardBg: "#ffffff",
    borderColor: "#e2e8f0",
  },
];

function TestimonialCard({ t, delay }: { t: (typeof testimonials)[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="break-inside-avoid rounded-2xl p-6 border card-hover card-sm"
      style={{ background: t.cardBg, borderColor: t.borderColor }}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 text-[14px] leading-relaxed mb-5">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Author row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: t.avatarBg }}
          >
            {t.initials}
          </div>
          <div>
            <div className="text-gray-900 text-[13px] font-semibold">{t.name}</div>
            <div className="text-gray-400 text-[11px]">{t.role}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-900 text-[13px] font-bold">{t.metric}</div>
          <div className="text-gray-400 text-[11px]">{t.metricLabel}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-16"
        >
          <div className="section-label mb-4">Real creators</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.07" }}
          >
            Creators love
            <br />
            <span className="gradient-text">Sellora.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            From indie makers to digital educators — here's what our creators say.
          </p>
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  );
}
