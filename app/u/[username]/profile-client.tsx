"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare, BadgeCheck, Loader2, Store, LayoutGrid, FileText, ShoppingBag } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { SelloraIcon } from "@/components/ui/logo";

type Post = { id: string; content: string; images: string[]; tags: string[]; likes: number; comments: number; createdAt: string };
type Product = { id: string; name: string; price: number; images: string[]; type: string };

interface ProfileUser {
  id: string; name: string | null; username: string; image: string | null; bio: string | null;
  verified: boolean; role: string; followers: number; following: number; postCount: number; joined: string;
}

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function ProfileClient({
  user, posts, products, storeName, hasStore, hasPortfolio, isOwner, isFollowing, isLoggedIn,
}: {
  user: ProfileUser;
  posts: Post[];
  products: Product[];
  storeName: string | null;
  hasStore: boolean;
  hasPortfolio: boolean;
  isOwner: boolean;
  isFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [followers, setFollowers] = useState(user.followers);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"posts" | "shop">(posts.length === 0 && hasStore ? "shop" : "posts");

  const toggleFollow = async () => {
    if (!isLoggedIn) { router.push(`/login?callbackUrl=/u/${user.username}`); return; }
    const prev = following;
    setBusy(true);
    setFollowing(!prev);
    setFollowers((f) => f + (prev ? -1 : 1));
    try {
      const res = await fetch("/api/follow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(!!data.following);
    } catch {
      setFollowing(prev);
      setFollowers((f) => f + (prev ? 1 : -1));
    } finally {
      setBusy(false);
    }
  };

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="text-center">
      <div className="text-lg font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><SelloraIcon size={24} /><span className="font-bold text-gray-900">Sellora</span></Link>
          {isOwner && <Link href="/community" className="text-sm font-medium text-[#2e9cfe] hover:text-[#1a8cf0]">Go to community →</Link>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6">
        {/* Profile header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            {user.image
              ? <img src={user.image} alt={user.name ?? user.username} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
              : <div className="w-20 h-20 rounded-full bg-[#2e9cfe] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{getInitials(user.name ?? user.username)}</div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900 truncate">{user.name ?? user.username}</h1>
                {user.verified && <BadgeCheck className="w-5 h-5 text-[#2e9cfe] flex-shrink-0" />}
              </div>
              <p className="text-sm text-gray-400">@{user.username} · {user.role.toLowerCase()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Joined {timeAgo(user.joined)}</p>
            </div>
            {isOwner ? (
              <Link href="/settings" className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">Edit profile</Link>
            ) : (
              <button onClick={toggleFollow} disabled={busy}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 disabled:opacity-60 ${following ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-[#2e9cfe] text-white hover:bg-[#1a8cf0]"}`}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : following ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {user.bio && <p className="text-sm text-gray-700 leading-relaxed mt-4 whitespace-pre-line">{user.bio}</p>}

          <div className="flex items-center gap-8 mt-5 pt-4 border-t border-gray-100">
            <Stat label="Followers" value={followers} />
            <Stat label="Following" value={user.following} />
            <Stat label="Posts" value={user.postCount} />
          </div>

          {(hasStore || hasPortfolio) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {hasStore && (
                <Link href={`/${user.username}/store`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <Store className="w-4 h-4" /> {storeName ? `${storeName}` : "Visit store"}
                </Link>
              )}
              {hasPortfolio && (
                <Link href={`/${user.username}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <LayoutGrid className="w-4 h-4" /> Portfolio
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mt-5">
          <button onClick={() => setTab("posts")} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${tab === "posts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <FileText className="w-4 h-4" /> Posts ({user.postCount})
          </button>
          <button onClick={() => setTab("shop")} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${tab === "shop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <ShoppingBag className="w-4 h-4" /> Shop ({products.length})
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {tab === "posts" ? (
            posts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-1">No posts yet</p>
                <p className="text-gray-400 text-sm">{isOwner ? "Share something with the community to see it here." : `@${user.username} hasn't posted yet.`}</p>
              </div>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <span className="font-semibold text-gray-700">{user.name ?? user.username}</span> · {timeAgo(p.createdAt)}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{p.content}</p>
                  {p.images?.length > 0 && (
                    <div className="rounded-xl overflow-hidden mt-3"><img src={p.images[0]} alt="" className="w-full object-cover max-h-72" /></div>
                  )}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.map((t) => <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">#{t}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {p.likes}</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {p.comments}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            products.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-1">No products yet</p>
                <p className="text-gray-400 text-sm">{isOwner ? "Add products to your store to showcase them here." : `@${user.username} hasn't listed any products yet.`}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.map((p) => (
                    <Link key={p.id} href={`/${user.username}/store/products/${p.id}`} className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-8 h-8" /></div>}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-sm font-bold text-[#2e9cfe] mt-0.5">{fmt(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/${user.username}/store`} className="block text-center text-sm font-medium text-[#2e9cfe] hover:text-[#1a8cf0] py-2">Visit full store →</Link>
              </>
            )
          )}
        </div>
      </main>
    </div>
  );
}
