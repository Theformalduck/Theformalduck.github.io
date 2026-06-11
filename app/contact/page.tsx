import type { Metadata } from "next";
import { InfoPage, SUPPORT_EMAIL, LEGAL_EMAIL } from "@/components/site/info-page";
import { Mail, LifeBuoy, Briefcase, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Sellora team, support, partnerships, press, and legal.",
};

const channels = [
  { icon: LifeBuoy, title: "Support", desc: "Account help, billing, or anything not working right.", email: SUPPORT_EMAIL },
  { icon: Briefcase, title: "Partnerships", desc: "Collaborations, integrations, and business inquiries.", email: "partners@sellora.com" },
  { icon: Mail, title: "Press", desc: "Media requests and press kit access.", email: "press@sellora.com" },
  { icon: Shield, title: "Legal & Privacy", desc: "Data requests, privacy questions, and legal notices.", email: LEGAL_EMAIL },
];

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact us"
      subtitle="We’d love to hear from you. Reach the right team directly below."
    >
      <div className="grid sm:grid-cols-2 gap-4 not-prose my-2">
        {channels.map(({ icon: Icon, title, desc, email }) => (
          <a
            key={title}
            href={`mailto:${email}`}
            className="block border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-gray-900 font-semibold mb-1">{title}</div>
            <div className="text-sm text-gray-500 leading-relaxed mb-2">{desc}</div>
            <div className="text-sm font-medium text-blue-600">{email}</div>
          </a>
        ))}
      </div>

      <h2>Response times</h2>
      <p>
        We typically reply within <strong>1–2 business days</strong>. For account or payment issues,
        include your account email and any relevant order or campaign IDs so we can help faster.
      </p>

      <h2>Looking for help docs?</h2>
      <p>
        Many common questions are answered in your dashboard’s Help section. If you’re a buyer with a
        question about a specific order, you can also reply directly to your order confirmation email
        to reach the seller.
      </p>
    </InfoPage>
  );
}
