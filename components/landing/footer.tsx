import Link from "next/link";
import { Share2, Link as LinkIcon, Globe, PlayCircle, AtSign } from "lucide-react";
import { SelloraIcon } from "@/components/ui/logo";

const footerLinks = {
  Product: [
    { label: "Portfolio Builder", href: "#features" },
    { label: "Crowdfunding", href: "#features" },
    { label: "Digital Store", href: "#features" },
    { label: "Community", href: "#features" },
    { label: "AI Tools", href: "#features" },
    { label: "Analytics", href: "#features" },
  ],
  Platform: [
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "API Docs", href: "/docs" },
    { label: "Status", href: "/status" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Creator Agreement", href: "/creator-agreement" },
  ],
};

const socials = [
  { icon: AtSign, href: "#", label: "Twitter" },
  { icon: Share2, href: "#", label: "GitHub" },
  { icon: LinkIcon, href: "#", label: "LinkedIn" },
  { icon: PlayCircle, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-[#071828] border-t border-sky-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <SelloraIcon size={32} />
              <span className="text-white font-bold text-xl">Sellora</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-[220px]">
              The creator operating system. Build, launch, and grow  —  all in one place.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-blue-400/25 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white text-sm font-semibold mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/40 hover:text-white/80 text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-blue-500/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Sellora Technologies, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-white/30 text-sm">
            <span>Made with</span>
            <span className="text-red-400">♥</span>
            <span>for creators everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
