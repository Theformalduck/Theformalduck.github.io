"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "Get started with the essentials",
    features: [
      "1 portfolio site",
      "1 active campaign",
      "Store, up to 10 products",
      "500 community followers",
      "sellora.app/username subdomain",
      "Standard analytics",
      "3% transaction fee",
    ],
    cta: "Start for free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 29,
    yearly: 23,
    description: "For creators who are serious about growth",
    features: [
      "Unlimited portfolios",
      "Unlimited campaigns",
      "Unlimited products",
      "Unlimited followers",
      "Custom domain included",
      "Advanced analytics",
      "1.5% transaction fee",
      "AI writing tools",
      "Priority support",
      "Recurring subscriptions",
    ],
    cta: "Start Pro – 14 days free",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    monthly: 99,
    yearly: 79,
    description: "For teams, agencies, and studios",
    features: [
      "Everything in Pro",
      "5 team seats",
      "White-label option",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "0.5% transaction fee",
      "Advanced AI suite",
      "Custom analytics reports",
      "99.9% SLA",
    ],
    cta: "Contact sales",
    href: "/signup?plan=business",
    highlight: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="section-label mb-4">Simple pricing</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.07" }}
          >
            Start free.
            <br />
            <span className="gradient-text">Scale on your terms.</span>
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            No hidden fees. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                !annual ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                annual ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${annual ? "bg-[#c8e83c] text-gray-900" : "bg-gray-100 text-gray-500"}`}>
                −20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan, i) => {
            const price = annual ? plan.yearly : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-nexus-300 bg-white ring-1 ring-nexus-200 card-lg"
                    : "border-gray-200 bg-white card-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-6">
                    <span className="inline-flex items-center gap-1 bg-nexus-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-gray-900 font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-[13px]">{plan.description}</p>
                </div>

                <div className="mb-7">
                  <div className="flex items-end gap-1.5">
                    <span
                      className="font-bold text-gray-900"
                      style={{ fontSize: price === 0 ? "36px" : "44px", letterSpacing: "-0.04em", lineHeight: 1 }}
                    >
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-400 text-sm mb-1">/mo</span>
                    )}
                  </div>
                  {annual && plan.monthly > 0 && (
                    <p className="text-gray-400 text-xs mt-1.5">Billed ${plan.yearly * 12}/year · Save ${(plan.monthly - plan.yearly) * 12}/yr</p>
                  )}
                </div>

                <Link href={plan.href}>
                  <span
                    className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer mb-7 ${
                      plan.highlight
                        ? "bg-[#c8e83c] text-gray-900 hover:bg-[#b8d82c] shadow-sm"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}
                  </span>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px]">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.highlight ? "text-nexus-500" : "text-gray-400"
                        }`}
                      />
                      <span className={plan.highlight ? "text-gray-700" : "text-gray-500"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-400 text-[13px] mt-10"
        >
          All plans include SSL, daily backups, and 99.9% uptime. Prices in USD. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
