export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CanvasThumbnail } from "@/app/[username]/canvas-renderer";
import { IframePreview } from "./iframe-preview";
import { BadgeCheck, Store as StoreIcon, LayoutTemplate, Users, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Discover Creators",
  description: "Browse creator portfolios and shops on Sellora, find designers, artists, developers, musicians and more.",
};

function initials(name?: string | null, username?: string | null) {
  const s = (name ?? username ?? "?").trim();
  return s.slice(0, 2).toUpperCase();
}

export default async function DiscoverPage() {
  // Fetch portfolios and shops in parallel, they're independent, so there's no
  // reason to wait for one before starting the other.
  const [creators, shops] = await Promise.all([
    // Published creator portfolios
    db.user.findMany({
      where: { username: { not: null }, bannedAt: null, portfolio: { published: true } },
      select: {
        username: true, name: true, image: true, bio: true, verified: true,
        portfolio: { select: { title: true, canvasData: true, primaryColor: true } },
        _count: { select: { followers: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
    }),
    // Shops, users with at least one active product
    db.user.findMany({
      where: { username: { not: null }, bannedAt: null, products: { some: { status: "ACTIVE" } } },
      select: {
        username: true, name: true, image: true, verified: true,
        store: { select: { name: true, tagline: true, logoImage: true, bannerImage: true, primaryColor: true } },
        // The card now shows a live storefront preview, so individual product
        // rows are no longer needed here, just the active count.
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
    }),
  ]);

  const portfolioBg = (c: typeof creators[number]) => {
    const data = c.portfolio?.canvasData as any;
    return data?.pages?.[0]?.bg ?? c.portfolio?.primaryColor ?? "#1099e0";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-10 px-4 sm:px-6"
        style={{ background: "linear-gradient(180deg,#0a7cc4 0%,#1099e0 55%,#3dc8f5 100%)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Discover creators</h1>
          <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto">
            Explore portfolios and shops from creators building their business on Sellora.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm font-medium">
            <span className="inline-flex items-center gap-1.5"><LayoutTemplate className="w-4 h-4" /> {creators.length} portfolios</span>
            <span className="inline-flex items-center gap-1.5"><StoreIcon className="w-4 h-4" /> {shops.length} shops</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── Portfolios ─────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">Featured portfolios</h2>
                <p className="text-sm text-gray-500">Creator profiles and showcases</p>
              </div>
            </div>
          </div>

          {creators.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
              <LayoutTemplate className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold mb-1">No published portfolios yet</p>
              <p className="text-gray-500 text-sm">Be the first, build and publish yours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {creators.map((c) => (
                <Link key={c.username} href={`/${c.username}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="relative">
                    {(c.portfolio?.canvasData as any)?.version === 1 ? (
                      <CanvasThumbnail doc={c.portfolio!.canvasData as any} height={184} />
                    ) : (
                      <IframePreview src={`/${c.username}`} height={184} />
                    )}
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 -mt-8 border-2 border-white shadow" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex-shrink-0 -mt-8 border-2 border-white shadow bg-gray-700 text-white flex items-center justify-center text-xs font-bold">
                        {initials(c.name, c.username)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 text-sm truncate">{c.name ?? c.username}</span>
                        {c.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-gray-400 text-xs truncate">@{c.username}</p>
                    </div>
                    {c._count.followers > 0 && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                        <Users className="w-3 h-3" /> {c._count.followers}
                      </span>
                    )}
                  </div>
                  {c.bio && <p className="px-4 pb-4 -mt-2 text-xs text-gray-500 line-clamp-2">{c.bio}</p>}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Shops ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Shops</h2>
              <p className="text-sm text-gray-500">Products and digital goods from creators</p>
            </div>
          </div>

          {shops.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
              <StoreIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold mb-1">No shops yet</p>
              <p className="text-gray-500 text-sm">Open a store and list your first product.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shops.map((s) => {
                const totalActive = s._count.products;
                return (
                <Link key={s.username} href={`/${s.username}/store`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all">
                  {/* live storefront preview */}
                  <div className="relative">
                    <IframePreview src={`/${s.username}/store`} height={184} />
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    {s.store?.logoImage || s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(s.store?.logoImage || s.image)!} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                        {initials(s.store?.name ?? s.name, s.username)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 text-sm truncate">{s.store?.name ?? `${s.name ?? s.username}'s store`}</span>
                        {s.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{s.store?.tagline ?? `@${s.username}`}</p>
                    </div>
                    <span className="text-[11px] font-medium text-amber-600 flex-shrink-0">{totalActive} item{totalActive !== 1 ? "s" : ""}</span>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
