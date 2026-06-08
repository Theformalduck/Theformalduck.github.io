"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Rocket,
  Plus, ArrowUpRight, Heart, MessageSquare, Star, CheckCircle2, Circle,
  Loader2, Bell, Package,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function PillBar(props: any) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(width / 2, 10);
  return (
    <g>
      <rect x={x} y={y + r} width={width} height={Math.max(height - r, 0)} fill={fill} />
      <ellipse cx={x + r} cy={y + r} rx={r} ry={r} fill={fill} />
    </g>
  );
}

function ProgressRing({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const { stats, weeklyRevenue, campaigns, recentOrders, notifications } = data ?? {};

  const totalRaised = (campaigns ?? []).reduce((s: number, c: any) => s + c.raised, 0);
  const totalGoal = (campaigns ?? []).reduce((s: number, c: any) => s + c.goal, 0);
  const overallProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

  const thisWeekRevenue = (weeklyRevenue ?? []).reduce((s: number, d: any) => s + d.revenue, 0);

  const statCards = [
    {
      label: "Total Revenue",
      value: stats?.revenue ?? 0,
      format: "currency",
      change: stats?.revenueChange ?? 0,
      up: (stats?.revenueChange ?? 0) >= 0,
      icon: DollarSign,
      featured: true,
    },
    {
      label: "Followers",
      value: stats?.followers ?? 0,
      format: "number",
      change: Math.abs(stats?.followersChange ?? 0),
      up: (stats?.followersChange ?? 0) >= 0,
      icon: Users,
      featured: false,
    },
    {
      label: "Store Orders",
      value: stats?.orders ?? 0,
      format: "number",
      change: Math.abs(stats?.ordersChange ?? 0),
      up: (stats?.ordersChange ?? 0) >= 0,
      icon: ShoppingBag,
      featured: false,
    },
    {
      label: "Active Campaigns",
      value: stats?.activeCampaigns ?? 0,
      format: "number",
      change: 0,
      up: true,
      icon: Rocket,
      featured: false,
    },
  ];

  const activeCampaigns = (campaigns ?? []).filter((c: any) => c.status === "ACTIVE");

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 leading-none mb-1.5" style={{ letterSpacing: "-0.035em" }}>
            Dashboard
          </h1>
          <p className="text-gray-400 text-[14px]">Plan, launch, and grow your creator business.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/campaigns/new">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2e9cfe] text-white text-[13px] font-semibold hover:bg-[#1a8cf0] transition-colors cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />New Campaign
            </span>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const formatted = stat.format === "currency" ? formatCurrency(stat.value) : formatNumber(stat.value);
          if (stat.featured) {
            return (
              <div key={stat.label} className="rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, #2e9cfe 0%, #1a8cf0 100%)", minHeight: "148px" }}>
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
                <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
                <div className="flex items-start justify-between relative z-10">
                  <p className="text-white/60 text-[12px] font-semibold">{stat.label}</p>
                  <Link href="/analytics">
                    <button className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </Link>
                </div>
                <div className="relative z-10">
                  <div className="text-white font-bold mb-3" style={{ fontSize: "36px", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {formatted}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#c8e83c]" />
                    <span className="text-[#c8e83c] font-semibold">{stat.change > 0 ? "+" : ""}{stat.change}%</span>
                    <span className="text-white/50">from last month</span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <p className="text-gray-500 text-[12px] font-medium">{stat.label}</p>
              </div>
              <div className="text-gray-900 font-bold mb-2.5" style={{ fontSize: "32px", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {formatted}
              </div>
              <div className="flex items-center gap-1.5 text-[12px]">
                {stat.up ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                <span className={cn("font-semibold", stat.up ? "text-emerald-600" : "text-red-500")}>
                  {stat.up ? "+" : ""}{stat.change}%
                </span>
                <span className="text-gray-400">this month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-gray-900 font-semibold text-[15px]">Revenue Analytics</h3>
              <p className="text-gray-400 text-[12px] mt-0.5">This week's performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[12px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                This week
              </div>
            </div>
          </div>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.04em" }}>
              {formatCurrency(thisWeekRevenue)}
            </span>
            <span className="text-gray-400 text-[13px]">total this week</span>
          </div>
          {weeklyRevenue && weeklyRevenue.some((d: any) => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyRevenue} barCategoryGap="30%" margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "10px", color: "#111827", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "8px 12px" }}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" shape={<PillBar />} maxBarSize={36}>
                  {weeklyRevenue.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.peak ? "#2e9cfe" : "#e0f2fe"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet. Orders will appear here.
            </div>
          )}
        </div>

        {/* Active campaigns upcoming */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-gray-900 font-semibold text-[15px]">Active Campaigns</h3>
            <Link href="/campaigns">
              <span className="text-[11px] text-nexus-600 font-medium hover:text-nexus-700">View all</span>
            </Link>
          </div>
          {activeCampaigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <Rocket className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No active campaigns</p>
              <Link href="/campaigns/new">
                <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2e9cfe] text-white text-xs font-medium hover:bg-[#1a8cf0] transition-colors cursor-pointer">
                  <Plus className="w-3 h-3" /> Create one
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {activeCampaigns.slice(0, 3).map((c: any) => {
                const pct = Math.min(Math.round((c.raised / c.goal) * 100), 100);
                const daysLeft = c.deadline ? Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)) : null;
                return (
                  <div key={c.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="text-gray-800 text-[12px] font-medium mb-1 truncate">{c.title}</div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                      <span>{formatCurrency(c.raised)} raised</span>
                      {daysLeft !== null && <span>{daysLeft}d left</span>}
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2e9cfe] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900 font-semibold text-[15px]">Recent Orders</h3>
              <p className="text-gray-400 text-[12px] mt-0.5">Latest store activity</p>
            </div>
            <Link href="/store" className="text-nexus-600 text-[12px] font-medium hover:text-nexus-700">View all</Link>
          </div>
          {(recentOrders ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No orders yet</p>
              <Link href="/store/products/new">
                <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2e9cfe] text-white text-xs font-medium hover:bg-[#1a8cf0] transition-colors cursor-pointer">
                  <Plus className="w-3 h-3" /> Add a product
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-[13px] leading-snug">
                      {o.buyer?.name ?? "Someone"} ordered {o.items[0]?.product?.name ?? "a product"}
                    </p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{timeAgo(o.createdAt)}</p>
                  </div>
                  <span className="text-emerald-500 text-sm font-medium">{formatCurrency(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign progress */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900 font-semibold text-[15px]">Campaign Progress</h3>
              <p className="text-gray-400 text-[12px] mt-0.5">All campaigns</p>
            </div>
          </div>

          {(campaigns ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Rocket className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No campaigns yet</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <ProgressRing value={overallProgress} color="#1a8fc2" size={100} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900" style={{ letterSpacing: "-0.04em" }}>{overallProgress}%</span>
                    <span className="text-gray-400 text-[10px] font-medium">Overall</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3.5">
                {(campaigns ?? []).slice(0, 4).map((c: any) => {
                  const pct = Math.min(Math.round((c.raised / c.goal) * 100), 100);
                  const color = c.status === "FUNDED" ? "#16a34a" : c.status === "ACTIVE" ? "#1a8fc2" : "#9ca3af";
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-gray-700 text-[12px] font-medium truncate pr-3">{c.title}</p>
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
