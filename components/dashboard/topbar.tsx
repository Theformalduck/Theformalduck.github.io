"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Search, ChevronDown, ExternalLink, Settings, LogOut, Menu, X, Plus, LayoutDashboard, Layout, Rocket, ShoppingBag, Users, User, Package, Megaphone, FileText } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccountSwitcher } from "@/components/dashboard/account-switcher";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

interface TopbarProps {
  title?: string;
  onMenuOpen?: () => void;
}

const quickLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/portfolio", icon: Layout, label: "Portfolio" },
  { href: "/campaigns", icon: Rocket, label: "Campaigns" },
  { href: "/store", icon: ShoppingBag, label: "Store" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const newActions = [
  { href: "/store/products/new", label: "New Product" },
  { href: "/campaigns/new", label: "New Campaign" },
  { href: "/community", label: "New Post" },
];

export function Topbar({ title, onMenuOpen }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Snapshot "now" in state (pure render) and tick it once a minute so relative
  // timestamps stay fresh without reading Date.now() during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Account";
  const userEmail = session?.user?.email ?? "";
  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const username = (session?.user as any)?.username as string | undefined;

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredLinks = quickLinks.filter((l) =>
    l.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runSearch = useCallback((q: string) => {
    if (q.length < 2) { setSearchResults(null); return; }
    setSearchLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setSearchResults)
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, []);

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(v), 300);
  };

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); setSearchResults(null); };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  function timeAgo(date: string) {
    const secs = Math.floor((now - new Date(date).getTime()) / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  return (
    <header className="h-[68px] flex items-center justify-between px-4 md:px-6 border-b border-gray-100 bg-white flex-shrink-0 sticky top-0 z-20">
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger, mobile only */}
        <button
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="relative">
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchRef.current?.focus(), 50);
            }}
            className="flex items-center gap-2.5 h-9 w-36 sm:w-64 px-3 bg-gray-50 border border-gray-100 rounded-xl cursor-text group hover:border-gray-200 transition-colors text-left"
          >
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 text-[13px] flex-1 select-none truncate">{title || "Search..."}</span>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 font-mono flex-shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Search dropdown */}
          {searchOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeSearch} />
              <div className="absolute left-0 top-11 z-50 w-80 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredLinks[0] && !searchQuery) {
                        router.push(filteredLinks[0].href); closeSearch();
                      }
                      if (e.key === "Escape") closeSearch();
                    }}
                    placeholder="Search people, products, posts…"
                    className="flex-1 text-[13px] text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                  {searchQuery ? (
                    <button onClick={() => handleSearchChange("")}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>
                  ) : (
                    <button onClick={closeSearch}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto py-1.5">
                  {/* Nav shortcuts when no query */}
                  {!searchQuery && (
                    <>
                      <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Go to</p>
                      {filteredLinks.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={closeSearch} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-[13px] text-gray-700">{label}</span>
                        </Link>
                      ))}
                    </>
                  )}

                  {/* Live search results */}
                  {searchQuery.length >= 2 && (
                    searchLoading ? (
                      <p className="text-gray-400 text-[12px] text-center py-6">Searching…</p>
                    ) : searchResults && (
                      Object.values(searchResults).every((arr: any) => arr.length === 0) ? (
                        <p className="text-gray-400 text-[12px] text-center py-6">No results for "{searchQuery}"</p>
                      ) : (
                        <>
                          {searchResults.users?.length > 0 && (
                            <>
                              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">People</p>
                              {searchResults.users.map((u: any) => (
                                <Link key={u.id} href={`/${u.username}`} target="_blank" onClick={closeSearch} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                  {u.image ? <img src={u.image} className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> : <div className="w-6 h-6 rounded-full bg-nexus-500 flex items-center justify-center flex-shrink-0"><User className="w-3 h-3 text-white" /></div>}
                                  <div className="min-w-0"><p className="text-[13px] text-gray-700 truncate">{u.name ?? u.username}</p><p className="text-[11px] text-gray-400 truncate">@{u.username}</p></div>
                                </Link>
                              ))}
                            </>
                          )}
                          {searchResults.products?.length > 0 && (
                            <>
                              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Your Products</p>
                              {searchResults.products.map((p: any) => (
                                <Link key={p.id} href={`/store/products/${p.id}/edit`} onClick={closeSearch} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0"><p className="text-[13px] text-gray-700 truncate">{p.name}</p><p className="text-[11px] text-gray-400">${p.price}</p></div>
                                </Link>
                              ))}
                            </>
                          )}
                          {searchResults.campaigns?.length > 0 && (
                            <>
                              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Your Campaigns</p>
                              {searchResults.campaigns.map((c: any) => (
                                <Link key={c.id} href={`/campaigns/${c.id}/edit`} onClick={closeSearch} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                  <Megaphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <p className="text-[13px] text-gray-700 truncate">{c.title}</p>
                                </Link>
                              ))}
                            </>
                          )}
                          {searchResults.posts?.length > 0 && (
                            <>
                              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Posts</p>
                              {searchResults.posts.map((p: any) => (
                                <Link key={p.id} href="/community" onClick={closeSearch} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <p className="text-[13px] text-gray-700 truncate line-clamp-1">{p.content}</p>
                                </Link>
                              ))}
                            </>
                          )}
                        </>
                      )
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Account switcher (only when staffing other accounts) */}
        <AccountSwitcher />

        {/* + New button */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#2e9cfe] text-white text-[13px] font-semibold hover:bg-[#1a8cf0] transition-colors mr-1">
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-40 rounded-xl bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-1 mt-2"
              sideOffset={8} align="end"
            >
              {newActions.map(({ href, label }) => (
                <DropdownMenu.Item key={href} asChild>
                  <Link href={href} className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-[13px] cursor-pointer outline-none">
                    {label}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Notifications */}
        <DropdownMenu.Root open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenu.Trigger asChild>
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-nexus-500 ring-1 ring-white" />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-72 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-1.5 mt-2"
              sideOffset={8} align="end"
            >
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-50 mb-1">
                <span className="text-gray-900 font-semibold text-[13px]">
                  Notifications {unreadCount > 0 && <span className="text-nexus-500">({unreadCount})</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-nexus-600 text-[11px] font-medium hover:text-nexus-700">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
                        n.read ? "hover:bg-gray-50" : "bg-nexus-50 hover:bg-nexus-100"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", n.read ? "bg-gray-200" : "bg-nexus-500")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] leading-snug font-medium", n.read ? "text-gray-500" : "text-gray-700")}>{n.title}</p>
                        {n.body && <p className="text-gray-400 text-[11px] mt-0.5">{n.body}</p>}
                        <p className="text-gray-400 text-[11px] mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-100 mx-1.5" />

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 md:gap-3 h-10 px-2 md:px-3 rounded-xl hover:bg-gray-50 transition-all">
              <div className="text-right hidden sm:block">
                <div className="text-gray-900 text-[12px] font-semibold leading-tight">{userName}</div>
                <div className="text-gray-400 text-[11px] leading-tight truncate max-w-[120px]">{userEmail}</div>
              </div>
              {session?.user?.image ? (
                <img src={session.user.image} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-nexus-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {userInitials}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-44 rounded-xl bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-1 mt-2"
              sideOffset={8} align="end"
            >
              {username && (
                <DropdownMenu.Item asChild>
                  <Link href={`/${username}`} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-[13px] cursor-pointer outline-none">
                    <ExternalLink className="w-3.5 h-3.5" />Public page
                  </Link>
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item asChild>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-[13px] cursor-pointer outline-none">
                  <Settings className="w-3.5 h-3.5" />Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item asChild>
                <button onClick={() => signOut({ redirectTo: "/" })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-all text-[13px] cursor-pointer outline-none">
                  <LogOut className="w-3.5 h-3.5" />Sign out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
