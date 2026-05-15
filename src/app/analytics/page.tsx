"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye, TrendingUp, BarChart3, Globe, ArrowUpRight,
  Clock, Link2, RefreshCw,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const TIMEFRAMES = [
  { label: "7 days",  days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
];

interface DayCount  { date: string; count: number }
interface Source    { source: string; count: number; pct: number; color: string }
interface Visit     { id: string; source: string; referrer: string | null; createdAt: string; color: string }
interface Analytics {
  total: number;
  avgPerDay: number;
  dailyViews: DayCount[];
  sources: Source[];
  recentViews: Visit[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function BarChart({ data, days }: { data: DayCount[]; days: number }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const show = days <= 30 ? data : data.filter((_, i) => i % Math.ceil(data.length / 30) === 0);

  return (
    <div className="flex items-end gap-1 h-32">
      {show.map((d, i) => {
        const h = Math.max((d.count / max) * 100, d.count > 0 ? 4 : 1);
        return (
          <div key={d.date} className="flex-1 flex items-end group relative">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.4, delay: i * 0.01 }}
              className="w-full rounded-t-sm bg-white/[0.18] hover:bg-white/[0.35] transition-colors min-h-[2px] cursor-default"
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-center whitespace-nowrap">
                <div className="text-xs font-semibold text-white">{d.count} view{d.count !== 1 ? "s" : ""}</div>
                <div className="text-[10px] text-white/40">{d.date}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        <BarChart3 className="w-7 h-7 text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/50 mb-1">No views yet</p>
      <p className="text-xs text-white/25 max-w-xs">
        Share your portfolio link and analytics will appear here. Add <code className="text-white/40">?utm_source=linkedin</code> to your URL to track traffic sources.
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [tfIdx, setTfIdx] = useState(1); // default 30 days
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const { days } = TIMEFRAMES[tfIdx];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/analytics?days=${days}`)
      .then(r => r.json())
      .then(json => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const topSource = data?.sources[0];

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 md:ml-[220px] min-h-screen">
        {/* Top bar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-4 pl-14 md:px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-white/50" />
            <h1 className="font-semibold text-white/90">Analytics</h1>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-white/30 animate-spin" />}
          </div>
          <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg p-1">
            {TIMEFRAMES.map((tf, i) => (
              <button
                key={tf.label}
                onClick={() => setTfIdx(i)}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  i === tfIdx ? "bg-white/[0.08] text-white/90" : "text-white/35 hover:text-white/45"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Views",
                value: loading ? "—" : (data?.total ?? 0).toLocaleString(),
                icon: Eye,
                sub: TIMEFRAMES[tfIdx].label,
              },
              {
                label: "Avg per Active Day",
                value: loading ? "—" : (data?.avgPerDay ?? 0).toString(),
                icon: TrendingUp,
                sub: "views / day",
              },
              {
                label: "Top Source",
                value: loading ? "—" : (topSource?.source ?? "—"),
                icon: Globe,
                sub: topSource ? `${topSource.pct}% of traffic` : "no data yet",
              },
              {
                label: "Unique Sources",
                value: loading ? "—" : (data?.sources.length ?? 0).toString(),
                icon: Link2,
                sub: "referral channels",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/50">
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-0.5 text-white/90">{stat.value}</div>
                <div className="text-xs text-white/35">{stat.label}</div>
                <div className="text-[10px] text-white/20 mt-0.5">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          {data?.total === 0 && !loading ? <EmptyState /> : (
            <>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Views over time */}
                <div className="lg:col-span-2 rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-sm font-semibold text-white/90">Portfolio Traffic</h2>
                      <p className="text-xs text-white/35 mt-0.5">
                        Views per day — {TIMEFRAMES[tfIdx].label}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white/70">
                      {data?.total.toLocaleString() ?? "—"}
                    </span>
                  </div>
                  {data?.dailyViews.length ? (
                    <BarChart data={data.dailyViews} days={days} />
                  ) : (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-xs text-white/25">No data for this period</p>
                    </div>
                  )}
                </div>

                {/* Traffic sources */}
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                  <h2 className="text-sm font-semibold text-white/90 mb-5">Traffic Sources</h2>
                  {data?.sources.length ? (
                    <div className="space-y-4">
                      {data.sources.map(src => (
                        <div key={src.source}>
                          <div className="flex justify-between text-xs text-white/45 mb-1.5">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: src.color }} />
                              {src.source}
                            </span>
                            <span className="font-medium text-white/60">
                              {src.count} <span className="text-white/30">({src.pct}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${src.pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: src.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/25 mt-8 text-center">No source data yet</p>
                  )}
                  <div className="mt-5 pt-4 border-t border-white/[0.05]">
                    <p className="text-[10px] text-white/25 leading-relaxed">
                      Tip: add <code className="text-white/40">?utm_source=linkedin</code> to your portfolio URL when sharing to track exactly where clicks come from.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent visitors */}
              <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-white/90">Recent Visitors</h2>
                  <span className="text-xs text-white/35">{data?.recentViews.length ?? 0} most recent</span>
                </div>
                {data?.recentViews.length ? (
                  <div className="space-y-1">
                    {data.recentViews.map((v, i) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: v.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white/70 font-medium">{v.source}</span>
                          {v.referrer && (
                            <span className="ml-2 text-xs text-white/25 truncate hidden sm:inline">
                              {v.referrer.replace(/^https?:\/\//, "").slice(0, 60)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/30 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {timeAgo(v.createdAt)}
                        </div>
                        {v.referrer && (
                          <a
                            href={v.referrer}
                            target="_blank"
                            rel="noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-white/55"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/25 py-8 text-center">No visitors recorded yet</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
