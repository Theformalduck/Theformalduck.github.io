"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Layout,
  Rocket,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Package,
  Heart,
  RefreshCw,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SelloraIcon } from "@/components/ui/logo";
import { signOut } from "next-auth/react";

const navGroups = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/portfolio", icon: Layout, label: "Portfolio" },
      { href: "/campaigns", icon: Rocket, label: "Campaigns" },
      { href: "/store", icon: ShoppingBag, label: "Store" },
      { href: "/community", icon: Users, label: "Community" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics",     icon: BarChart3,  label: "Analytics" },
      { href: "/subscriptions", icon: RefreshCw,  label: "Subscriptions" },
      { href: "/ai-tools",      icon: Sparkles,   label: "AI Tools", badge: "Soon" },
    ],
  },
  {
    label: "General",
    items: [
      { href: "/orders",   icon: Package,    label: "My Orders" },
      { href: "/wishlist", icon: Heart,      label: "Wishlist" },
      { href: "/team",     icon: UserCog,    label: "Team" },
      { href: "/settings", icon: Settings,   label: "Settings" },
      { href: "/help",     icon: HelpCircle, label: "Help" },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  collapsed,
  setCollapsed,
  onLinkClick,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Account";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-250 ease-out flex-shrink-0",
        collapsed ? "w-[68px]" : "w-[228px]"
      )}
    >
      {/* Logo — only the mark + name link back to the home page */}
      <div className={cn(
        "flex items-center h-[68px] border-b border-gray-100 px-5",
        collapsed && "justify-center px-0"
      )}>
        <Link
          href="/"
          onClick={onLinkClick}
          title="Back to home"
          className="inline-flex items-center rounded-lg hover:opacity-70 transition-opacity"
        >
          <SelloraIcon size={28} />
          {!collapsed && (
            <span className="ml-2.5 text-gray-900 font-bold text-[17px] tracking-tight">Sellora</span>
          )}
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 px-3 mb-2">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, badge }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                const isSoon = badge === "Soon";
                return (
                  <li key={href}>
                    {isSoon ? (
                      <span
                        title={collapsed ? label : undefined}
                        className={cn(
                          "flex items-center rounded-xl text-[13.5px] font-medium cursor-not-allowed opacity-50",
                          collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
                          "text-gray-400"
                        )}
                      >
                        <Icon className="flex-shrink-0 w-4 h-4 text-gray-400" size={16} />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none bg-gray-100 text-gray-500">
                              Soon
                            </span>
                          </>
                        )}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center rounded-xl text-[13.5px] font-medium transition-all duration-150 group",
                          collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
                          active
                            ? "bg-[#2e9cfe] text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          )}
                          size={collapsed ? 18 : 16}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{label}</span>
                            {badge && badge !== "Soon" && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none",
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-nexus-100 text-nexus-700"
                              )}>
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Sign out */}
        {!collapsed && (
          <div className="pt-1">
            <button
              onClick={() => signOut({ redirectTo: "/" })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </nav>

      {/* Upgrade promo card */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <div
            className="rounded-2xl p-4 text-white"
            style={{ background: "linear-gradient(135deg, #2e9cfe 0%, #1a8cf0 100%)" }}
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-[#c8e83c]" />
            </div>
            <p className="font-semibold text-[13px] leading-snug mb-1">
              Upgrade to Pro
            </p>
            <p className="text-white/50 text-[11px] mb-3 leading-relaxed">
              Unlock AI tools, custom domains & advanced analytics.
            </p>
            <Link href="/settings?tab=billing" onClick={onLinkClick}>
              <span className="block w-full text-center py-2 rounded-xl bg-[#c8e83c] text-gray-900 text-[12px] font-bold hover:bg-[#b8d82c] transition-colors cursor-pointer">
                Upgrade now
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[82px] w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all z-10 shadow-sm hidden md:flex"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile nav on route change
  const pathname = usePathname();
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 flex-shrink-0">
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full">
            <div className="relative h-full">
              <SidebarContent
                collapsed={false}
                setCollapsed={() => {}}
                onLinkClick={onMobileClose}
              />
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
