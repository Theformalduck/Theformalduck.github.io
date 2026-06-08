import { HelpCircle, MessageCircle, BookOpen, Zap, ChevronDown } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    q: "How do I publish my portfolio?",
    a: "Go to Portfolio → click Publish in the top right. Your portfolio will be live at your public URL immediately.",
  },
  {
    q: "How do I add products to my store?",
    a: "Navigate to Store → Products → click New Product. Fill in the details, set a price, and publish when ready.",
  },
  {
    q: "How do I accept payments?",
    a: "Go to Settings → Payments and connect your Stripe account (a quick guided onboarding through Stripe). Once connected, buyers can purchase your products and payouts go straight to your Stripe account.",
  },
  {
    q: "Can I use a custom domain?",
    a: "Custom domains are available on the Pro plan. Upgrade in Settings → Billing, then configure your domain in Settings → Domain.",
  },
  {
    q: "How do I start a crowdfunding campaign?",
    a: "Go to Campaigns → New Campaign. Set your goal, deadline, and rewards. Publish when you're ready to start accepting backers.",
  },
  {
    q: "How do I change my username?",
    a: "Go to Settings → Profile → edit your username. Note that changing your username will update your public URL.",
  },
];

const quickLinks = [
  { icon: BookOpen, label: "Documentation", desc: "Full guides and API references", href: "#" },
  { icon: MessageCircle, label: "Community", desc: "Ask questions and share ideas", href: "/community" },
  { icon: Zap, label: "Changelog", desc: "See what's new", href: "#" },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1 text-[14px]">Find answers, explore guides, or reach out to us.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ icon: Icon, label, desc, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-2 p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#2e9cfe]/30 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Icon className="w-4 h-4 text-[#2e9cfe]" />
            </div>
            <div>
              <p className="font-semibold text-[13px] text-gray-800">{label}</p>
              <p className="text-gray-400 text-[12px]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-[15px] font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                <span className="text-[13.5px] font-medium text-gray-800">{q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 text-[13px] text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5 text-[#2e9cfe]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[14px] text-gray-800">Still need help?</p>
          <p className="text-gray-400 text-[13px]">Our support team usually responds within a few hours.</p>
        </div>
        <a
          href="mailto:support@sellora.com"
          className="px-4 py-2 rounded-xl bg-[#2e9cfe] text-white text-[13px] font-semibold hover:bg-[#1a8cf0] transition-colors flex-shrink-0"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
