"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, Clock, Rocket, BadgeCheck, Flame, TrendingUp, Sparkles, Hourglass } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export interface ExploreCampaign {
  id: string;
  title: string;
  shortDesc: string | null;
  coverImage: string | null;
  goal: number;
  raised: number;
  category: string | null;
  deadline: string | null;
  createdAt: string;
  backers: number;
  creator: { username: string | null; name: string | null; image: string | null; verified: boolean };
}

type Sort = "trending" | "funded" | "newest" | "ending";

const SORTS: { id: Sort; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "funded", label: "Most funded", icon: TrendingUp },
  { id: "newest", label: "Newest", icon: Sparkles },
  { id: "ending", label: "Ending soon", icon: Hourglass },
];

function pct(raised: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

function timeLabel(deadline: string | null): string {
  const d = daysLeft(deadline);
  if (d === null) return "Ongoing";
  if (d === 0) return "Ending today";
  return `${d} day${d !== 1 ? "s" : ""} left`;
}

function initials(name?: string | null, username?: string | null) {
  return (name ?? username ?? "?").trim().slice(0, 2).toUpperCase();
}

function CreatorBadge({ creator }: { creator: ExploreCampaign["creator"] }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {creator.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={creator.image} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
          {initials(creator.name, creator.username)}
        </div>
      )}
      <span className="text-xs text-gray-500 truncate">{creator.name ?? creator.username}</span>
      {creator.verified && <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#2e9cfe] rounded-full transition-[width]" style={{ width: `${value}%` }} />
    </div>
  );
}

function CampaignCard({ c }: { c: ExploreCampaign }) {
  const p = pct(c.raised, c.goal);
  const href = `/${c.creator.username}/campaigns/${c.id}`;
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#2e9cfe]/50 hover:shadow-lg transition-all"
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {c.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Rocket className="w-8 h-8" />
          </div>
        )}
        {c.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium capitalize">
            {c.category}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 group-hover:text-[#2e9cfe] transition-colors">{c.title}</h3>
        {c.shortDesc && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{c.shortDesc}</p>}

        <div className="mt-3 mb-3"><CreatorBadge creator={c.creator} /></div>

        <div className="mt-auto space-y-2">
          <ProgressBar value={p} />
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-900">{p}% funded</span>
            <span className="text-gray-400">{formatCurrency(c.raised)} raised</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
            <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {c.backers} backer{c.backers !== 1 ? "s" : ""}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {timeLabel(c.deadline)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CampaignsExplore({ campaigns }: { campaigns: ExploreCampaign[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("trending");

  const categories = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => c.category && set.add(c.category.toLowerCase()));
    return ["all", ...Array.from(set).sort()];
  }, [campaigns]);

  const isDefaultView = category === "all" && query.trim() === "";

  // Spotlight = the best-funded campaign, featured only in the default browse view.
  const spotlight = useMemo(() => {
    if (!isDefaultView || campaigns.length < 3) return null;
    return [...campaigns].sort((a, b) => pct(b.raised, b.goal) - pct(a.raised, a.goal))[0] ?? null;
  }, [campaigns, isDefaultView]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = campaigns.filter((c) => {
      if (category !== "all" && c.category?.toLowerCase() !== category) return false;
      if (q && !(`${c.title} ${c.shortDesc ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
    if (spotlight) list = list.filter((c) => c.id !== spotlight.id);

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "funded":
          return pct(b.raised, b.goal) - pct(a.raised, a.goal);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "ending": {
          const da = daysLeft(a.deadline);
          const db_ = daysLeft(b.deadline);
          if (da === null) return 1;
          if (db_ === null) return -1;
          return da - db_;
        }
        case "trending":
        default:
          return b.backers - a.backers || b.raised - a.raised;
      }
    });
    return list;
  }, [campaigns, category, query, sort, spotlight]);

  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-10 px-4 sm:px-6"
        style={{ background: "linear-gradient(180deg,#0a7cc4 0%,#1099e0 55%,#3dc8f5 100%)" }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Explore campaigns</h1>
          <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto">
            Back bold ideas from creators — and bring them to life.
          </p>
          {/* Search */}
          <div className="mt-7 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-gray-800 text-sm shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </section>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters + sort */}
        <div className="flex flex-col gap-3 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize",
                  category === cat
                    ? "bg-[#2e9cfe] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                )}
              >
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {SORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  sort === id ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:text-gray-800"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spotlight */}
        {spotlight && (
          <Link
            href={`/${spotlight.creator.username}/campaigns/${spotlight.id}`}
            className="group grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#2e9cfe]/50 hover:shadow-xl transition-all mb-10"
          >
            <div className="relative aspect-video md:aspect-auto md:min-h-[260px] bg-gray-100 overflow-hidden">
              {spotlight.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spotlight.coverImage} alt={spotlight.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Rocket className="w-10 h-10" /></div>
              )}
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8e83c] text-gray-900 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" /> Spotlight
              </span>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              {spotlight.category && <span className="text-xs font-semibold text-[#2e9cfe] uppercase tracking-wide capitalize mb-2">{spotlight.category}</span>}
              <h2 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#2e9cfe] transition-colors">{spotlight.title}</h2>
              {spotlight.shortDesc && <p className="text-gray-500 text-sm mt-2 line-clamp-3">{spotlight.shortDesc}</p>}
              <div className="mt-4 mb-4"><CreatorBadge creator={spotlight.creator} /></div>
              <ProgressBar value={pct(spotlight.raised, spotlight.goal)} />
              <div className="flex items-center gap-5 mt-3 text-sm">
                <span className="font-bold text-gray-900">{pct(spotlight.raised, spotlight.goal)}% funded</span>
                <span className="text-gray-500">{formatCurrency(spotlight.raised)} raised</span>
                <span className="text-gray-400 inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{spotlight.backers}</span>
                <span className="text-gray-400 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeLabel(spotlight.deadline)}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Results */}
        {results.length === 0 && !spotlight ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-20 text-center">
            <Rocket className="w-9 h-9 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-900 font-semibold mb-1">
              {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match your search"}
            </p>
            <p className="text-gray-500 text-sm">
              {campaigns.length === 0 ? "Be the first to launch one." : "Try a different category or search term."}
            </p>
          </div>
        ) : (
          <>
            {!isDefaultView && (
              <p className="text-sm text-gray-500 mb-4">{results.length} campaign{results.length !== 1 ? "s" : ""}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((c) => (
                <CampaignCard key={c.id} c={c} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
