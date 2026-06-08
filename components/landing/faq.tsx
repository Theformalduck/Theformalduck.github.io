"use client";

import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What is Sellora?",
    a: "Sellora is an all-in-one creator platform combining a portfolio builder, crowdfunding system, ecommerce store, and community tools — designed for creators, freelancers, and entrepreneurs who want to run their entire online business from one place.",
  },
  {
    q: "How is Sellora different from Kickstarter or Shopify?",
    a: "Kickstarter only does crowdfunding. Shopify only does ecommerce. Sellora does both — plus your portfolio, community, analytics, and AI tools — all connected in one ecosystem. Your backers can become followers, your followers can buy from your store, and your store can fund your next campaign.",
  },
  {
    q: "What are the transaction fees?",
    a: "Payments are processed through Stripe and paid out to your connected Stripe account. Stripe's standard processing fees apply per transaction, plus any platform fee.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Pro and Business plans include custom domain support — connect any domain you own to your Sellora portfolio and store. Free plans get a free sellora.app/username subdomain.",
  },
  {
    q: "How do campaign payouts work?",
    a: "We use Stripe for all payments. Funds from successful campaigns are paid out to your connected Stripe account as backers check out. You retain full control of your funds.",
  },
  {
    q: "Can I sell both digital and physical products?",
    a: "Absolutely. You can sell digital downloads (PDFs, courses, software, art), physical products with inventory tracking and shipping, and subscription memberships — all from the same store.",
  },
  {
    q: "Is there a limit on campaigns?",
    a: "Free plans can run 1 active campaign at a time. Pro and Business plans allow unlimited simultaneous campaigns with no limits on duration or funding goals.",
  },
  {
    q: "Do you offer a free trial of Pro?",
    a: "Yes — all new accounts get a 14-day full-access Pro trial with no credit card required. After 14 days, you'll be asked to upgrade or you'll automatically downgrade to the Free plan.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-32 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="section-label mb-4">Questions</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-gray-900"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.07" }}
          >
            Frequently asked
            <br />
            questions.
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Accordion.Root type="single" collapsible className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="py-1">
                <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left group focus:outline-none">
                  <span className="text-gray-900 font-medium text-[15px] pr-8 group-hover:text-nexus-700 transition-colors duration-150">
                    {faq.q}
                  </span>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 group-hover:border-nexus-200 group-hover:bg-nexus-50 transition-all duration-150">
                    <Plus className="w-3 h-3 text-gray-400 group-hover:text-nexus-500 transition-all duration-200 group-data-[state=open]:rotate-45" />
                  </div>
                </Accordion.Trigger>
                <Accordion.Content
                  className={cn(
                    "overflow-hidden",
                    "data-[state=open]:animate-[accordion-down_0.2s_ease-out]",
                    "data-[state=closed]:animate-[accordion-up_0.2s_ease-out]"
                  )}
                >
                  <p className="text-gray-500 text-[14px] leading-relaxed pb-5 pr-8">
                    {faq.a}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>
      </div>
    </section>
  );
}
