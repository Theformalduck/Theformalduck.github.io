"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Menu, X, ArrowUpRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Home",      href: "/" },
  { label: "Resume",    href: "/editor/resume" },
  { label: "Portfolio", href: "/editor/portfolio" },
  { label: "Features",  href: "#features" },
  { label: "Pricing",   href: "/pricing" },
  { label: "Dashboard", href: "/dashboard", external: true },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.05]" : ""}`}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo.svg" alt="Logo" className="w-7 h-7 invert opacity-90" />
          <span className="font-semibold text-[15px] tracking-tight text-white">
            Folio<span className="text-white/35">.ai</span>
          </span>
        </Link>

        {/* Center pill nav */}
        <div className="hidden md:flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-2 py-1.5 backdrop-blur-sm">
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] text-white/45 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              {link.label}
              {link.external && <ArrowUpRight className="w-3 h-3 opacity-60" />}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/sign-in" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-white/40 hover:text-white/65 transition-colors">
            <User className="w-3.5 h-3.5" />
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded-full bg-white text-[#060608] text-[13px] font-semibold hover:bg-white/90 transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-4 h-4 text-white/45" /> : <Menu className="w-4 h-4 text-white/45" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#060608]/95 backdrop-blur-xl border-b border-white/[0.05] overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-sm text-white/45 hover:text-white transition-colors"
                >
                  {link.label}
                  {link.external && <ArrowUpRight className="w-3 h-3" />}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/[0.05]">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block text-center py-2.5 rounded-full bg-white text-[#060608] text-sm font-semibold">
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
