"use client";

import { motion } from "framer-motion";
import { UserPlus, Wand2, TrendingUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create your profile",
    description:
      "Sign up in under a minute. Tell us about your work, pick your role, and your Sellora profile becomes your professional home base — instantly.",
  },
  {
    num: "02",
    icon: Wand2,
    title: "Build and launch",
    description:
      "Use AI-powered tools to build your portfolio, write campaign copy, set up your store, and design your brand. Everything ships from one dashboard.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Grow and earn",
    description:
      "Watch your audience grow, campaigns fund, and orders arrive. Track it all in real-time — with AI insights that tell you what's actually working.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-20"
        >
          <div className="section-label mb-4">Simple to start</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.07" }}
          >
            Up and running
            <br />
            in minutes.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            No developer needed. Go from signup to live creator business in three steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-8 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px"
            style={{ background: "linear-gradient(90deg, #e2e8f0 0%, #bae6fd 50%, #e2e8f0 100%)" }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Step icon + number */}
                <div className="relative flex items-center gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center card-sm">
                      <Icon className="w-6 h-6 text-nexus-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-nexus-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <span
                    className="font-bold text-gray-100"
                    style={{ fontSize: "48px", lineHeight: 1, letterSpacing: "-0.04em" }}
                  >
                    {step.num}
                  </span>
                </div>

                <h3
                  className="text-gray-900 font-semibold text-xl mb-3"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
