"use client";

import { motion } from "framer-motion";
import {
  Layout,
  Rocket,
  ShoppingBag,
  Users,
  Sparkles,
  BarChart3,
  Globe,
  Shield,
  Zap,
  Palette,
  CreditCard,
  Bell,
  ArrowRight,
} from "lucide-react";

const mainFeatures = [
  {
    icon: Layout,
    label: "Portfolio Builder",
    title: "A portfolio that actually looks like you made it",
    description:
      "Drag, drop, publish. Choose from templates designed by real designers, customize every pixel in the visual editor, and connect your own domain.",
    highlights: ["50+ templates", "Custom domains", "SEO built-in", "Mobile-first"],
    accent: "#e0f2fe",
    iconColor: "#0284c7",
  },
  {
    icon: Rocket,
    label: "Crowdfunding",
    title: "Fund your next project the modern way",
    description:
      "Set a goal, offer rewards, track backers in real time. Campaign pages that convert — with built-in fraud protection and direct Stripe payouts.",
    highlights: ["Reward tiers", "Stretch goals", "Live tracking", "Backer updates"],
    accent: "#fdf4ff",
    iconColor: "#9333ea",
  },
  {
    icon: ShoppingBag,
    label: "Digital Store",
    title: "Sell anything — digital or physical",
    description:
      "Launch your storefront in minutes. Digital downloads, physical goods, courses, subscriptions — all under one roof with global shipping built in.",
    highlights: ["Digital files", "Subscriptions", "Discount codes", "Inventory"],
    accent: "#fffbeb",
    iconColor: "#d97706",
  },
  {
    icon: Users,
    label: "Community",
    title: "Turn followers into a real audience",
    description:
      "Posts, updates, discussions — all connected to your creator profile. Get verified, grow your following, and convert fans into customers.",
    highlights: ["Follow system", "Activity feed", "Creator badges", "DMs"],
    accent: "#f0fdf4",
    iconColor: "#16a34a",
  },
  {
    icon: Sparkles,
    label: "AI Tools",
    title: "An AI that actually understands creators",
    description:
      "Write campaign copy, generate portfolio text, optimize SEO, and get personalized growth suggestions — all trained on what works for creators.",
    highlights: ["AI copywriting", "SEO optimizer", "Brand assistant", "Logo gen"],
    accent: "#fdf2f8",
    iconColor: "#db2777",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    title: "Numbers that tell you something useful",
    description:
      "Revenue, conversions, traffic, audience growth — all on one dashboard. Real-time data, clean charts, and insights you can actually act on.",
    highlights: ["Real-time", "Revenue insights", "Traffic sources", "Custom reports"],
    accent: "#f0f9ff",
    iconColor: "#0284c7",
  },
];

const extraFeatures = [
  { icon: Globe, label: "Custom Domains" },
  { icon: Shield, label: "Fraud Protection" },
  { icon: Zap, label: "Instant Payouts" },
  { icon: Palette, label: "Theme Builder" },
  { icon: CreditCard, label: "Stripe" },
  { icon: Bell, label: "Smart Notifications" },
];

function FeatureCard({ feature, index }: { feature: (typeof mainFeatures)[0]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white rounded-2xl p-6 border border-gray-100 card-hover card-sm cursor-default"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: feature.accent }}
      >
        <Icon className="w-5 h-5" style={{ color: feature.iconColor }} />
      </div>

      {/* Label */}
      <div className="section-label mb-2" style={{ color: feature.iconColor }}>
        {feature.label}
      </div>

      {/* Title */}
      <h3 className="text-gray-900 font-semibold text-[15px] leading-snug mb-2.5">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-[13px] leading-relaxed mb-4">
        {feature.description}
      </p>

      {/* Highlights */}
      <div className="flex flex-wrap gap-1.5">
        {feature.highlights.map((h) => (
          <span
            key={h}
            className="text-[11px] px-2.5 py-1 rounded-full font-medium border"
            style={{
              background: feature.accent,
              color: feature.iconColor,
              borderColor: `${feature.iconColor}22`,
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Hover arrow */}
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight className="w-4 h-4 text-gray-300" />
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-16"
        >
          <div className="section-label mb-4">Everything you need</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.07" }}
          >
            One platform.
            <br />
            <span className="gradient-text">Infinite possibilities.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Stop juggling six different subscriptions. Sellora replaces your portfolio site,
            crowdfunding page, Shopify store, and community — in one login.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {mainFeatures.map((feature, i) => (
            <FeatureCard key={feature.label} feature={feature} index={i} />
          ))}
        </div>

        {/* Extra features strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          {extraFeatures.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 text-[13px] text-gray-600"
            >
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
