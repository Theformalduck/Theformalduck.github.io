import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/site/info-page";
import { LayoutTemplate, DollarSign, ShoppingBag, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Sellora is the all-in-one operating system for creators, portfolio, crowdfunding, store, community, and analytics in one place.",
};

const pillars = [
  { icon: LayoutTemplate, title: "Portfolio", desc: "A drag-and-drop builder to showcase your work and tell your story." },
  { icon: DollarSign, title: "Crowdfunding", desc: "Launch campaigns, set reward tiers, and rally your community behind your next project." },
  { icon: ShoppingBag, title: "Store", desc: "Sell digital and physical products with built-in checkout and payouts." },
  { icon: Users, title: "Community", desc: "Grow an audience, post updates, and turn followers into supporters." },
];

export default function AboutPage() {
  return (
    <InfoPage
      title="About Sellora"
      subtitle="The creator operating system, build, launch, and grow your business all in one place."
    >
      <h2>Our mission</h2>
      <p>
        Creators today juggle a dozen disconnected tools, one for a portfolio, another for
        crowdfunding, a third for selling, and yet more for community and analytics. Every tool
        means another login, another subscription, and another tab to switch between.
      </p>
      <p>
        <strong>Sellora brings it all into one platform.</strong> Your portfolio, store, campaigns,
        community, and analytics live together, share one audience, and work as a single business –
        so you can spend less time managing tools and more time creating.
      </p>

      <h2>What you can build</h2>
      <div className="grid sm:grid-cols-2 gap-4 not-prose my-6">
        {pillars.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="border border-gray-200 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-gray-900 font-semibold mb-1">{title}</div>
            <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>

      <h2>Built for independent creators</h2>
      <p>
        Whether you’re a designer, developer, musician, photographer, writer, or entrepreneur,
        Sellora gives you professional tools without the enterprise complexity, and a fair,
        transparent fee structure so the value you create stays with you.
      </p>

      <h2>Get started</h2>
      <p>
        Ready to bring your creator business together? <Link href="/signup">Create a free account</Link>{" "}
        or <Link href="/discover">browse creators</Link> already building on Sellora. Questions?{" "}
        <Link href="/contact">Get in touch</Link>.
      </p>
    </InfoPage>
  );
}
