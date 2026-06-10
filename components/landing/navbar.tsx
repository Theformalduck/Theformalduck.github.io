"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { SelloraIcon } from "@/components/ui/logo";

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/discover/campaigns", label: "Campaigns" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Stories" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          scrolled
            ? "mx-4 mt-3 rounded-2xl border border-gray-200/80 bg-white/92 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
            : "bg-transparent"
        )}
      >
        <div className={cn(
          "max-w-7xl mx-auto flex items-center justify-between transition-all duration-300",
          scrolled ? "px-5 py-3.5" : "px-4 sm:px-6 py-5"
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <SelloraIcon size={30} />
            <span
              className={cn(
                "font-bold text-[17px] tracking-tight transition-colors duration-300",
                scrolled ? "text-gray-900" : "text-white"
              )}
            >
              Sellora
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
                  scrolled
                    ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl bg-[#c8e83c] text-gray-900 hover:bg-[#b8d82c] transition-colors duration-200 cursor-pointer shadow-sm">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span
                    className={cn(
                      "px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 cursor-pointer",
                      scrolled
                        ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Sign in
                  </span>
                </Link>
                <Link href="/signup">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl bg-[#c8e83c] text-gray-900 hover:bg-[#b8d82c] transition-colors duration-200 cursor-pointer shadow-sm">
                    Get started free
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-all",
              scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
            )}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mx-4 mt-1 rounded-2xl border border-gray-200 bg-white/96 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="p-3 space-y-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="px-3 pb-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                <span className="flex items-center justify-center gap-2 w-full text-center px-4 py-2.5 text-sm font-semibold bg-[#c8e83c] text-gray-900 rounded-xl hover:bg-[#b8d82c] transition-colors cursor-pointer">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <span className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                    Sign in
                  </span>
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  <span className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-[#c8e83c] text-gray-900 rounded-xl hover:bg-[#b8d82c] transition-colors cursor-pointer">
                    Get started free
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
