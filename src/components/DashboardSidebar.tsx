"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, Globe, Palette, BarChart3, Users, Settings, Zap, LogOut, Menu, X, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard",  desc: "Home & overview",    href: "/dashboard",        icon: LayoutDashboard },
  { label: "Resume",     desc: "Build & export PDF", href: "/editor/resume",    icon: FileText },
  { label: "Portfolio",  desc: "Your public website",href: "/editor/portfolio", icon: Globe },
  { label: "Themes",     desc: "Visual styles",      href: "/themes",           icon: Palette },
  { label: "Analytics",  desc: "Visitor tracking",   href: "/analytics",        icon: BarChart3 },
  { label: "AI Review",  desc: "Resume feedback",    href: "/review",           icon: Users },
];

export default function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    fetch("/api/user/subscription")
      .then(r => r.json())
      .then(json => setIsPro(json.isPro === true))
      .catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else toast.error("Could not start checkout");
    } catch {
      toast.error("Could not start checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleManage = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else toast.error("Could not open billing portal");
    } catch {
      toast.error("Could not open billing portal");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger — sits in the top bar area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-0 left-0 z-50 w-14 h-16 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[220px] min-h-screen bg-[#060608] border-r border-white/[0.05] flex flex-col fixed left-0 top-0 z-50 transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center gap-2.5 flex-1" onClick={() => setMobileOpen(false)}>
            <img src="/logo.svg" alt="Logo" className="w-6 h-6 invert opacity-80" />
            <span className="font-semibold text-white text-sm tracking-tight">
              Folio<span className="text-white/30">.ai</span>
            </span>
          </Link>
          {isPro && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/20">PRO</span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-2 p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/38 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px] w-[3px] h-5 bg-white/50 rounded-r-full" />
                )}
                <item.icon className="w-[15px] h-[15px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate leading-tight">{item.label}</div>
                  <div className={cn("text-[10px] truncate leading-tight", isActive ? "text-white/40" : "text-white/22")}>{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Pro upgrade / manage */}
        {isPro ? (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-amber-400/[0.07] border border-amber-400/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Pro Plan</span>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed mb-2.5">
              All features unlocked. Manage your billing anytime.
            </p>
            <button
              onClick={handleManage}
              disabled={loadingCheckout}
              className="w-full h-7 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors disabled:opacity-50"
            >
              {loadingCheckout ? "Loading…" : "Manage Subscription"}
            </button>
          </div>
        ) : (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs font-semibold text-white/65">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed mb-2.5">
              Unlock AI rewrites, unlimited themes & recruiter analytics.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={loadingCheckout}
              className="w-full h-7 rounded-lg bg-white text-[#060608] text-xs font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {loadingCheckout ? "Loading…" : "Go Pro — $9/mo"}
            </button>
          </div>
        )}

        {/* User bottom */}
        <div className="border-t border-white/[0.05] px-3 py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/[0.08] flex items-center justify-center text-[10px] font-semibold text-white/65 shrink-0">
            {user?.image
              ? <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/75 truncate">{user?.name ?? "Loading…"}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email ?? ""}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                pathname === "/settings" ? "text-white bg-white/[0.08]" : "text-white/30 hover:text-white/65 hover:bg-white/[0.05]"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
