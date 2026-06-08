"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type Stats = {
  revenue: number; revenueChange: number;
  orders: number; ordersChange: number;
  uniqueBuyers: number; uniqueBuyersChange: number;
};
type DayRevenue = { date: string; revenue: number; orders: number };
type TopProduct = { name: string; type: string; revenue: number; units: number };
type TypeRevenue = { type: string; revenue: number };

const TYPE_COLORS: Record<string, string> = {
  DIGITAL: "#6366f1", PHYSICAL: "#10b981", SERVICE: "#f59e0b", SUBSCRIPTION: "#06b6d4",
};

export default function AnalyticsPage() {
  const [stats, setStats]             = useState<Stats | null>(null);
  const [daily, setDaily]             = useState<DayRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [byType, setByType]           = useState<TypeRevenue[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(data => {
        setStats(data.stats);
        setDaily(data.dailyRevenue);
        setTopProducts(data.topProducts);
        setByType(data.revenueByType);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Revenue (30d)",
      value: formatCurrency(stats?.revenue ?? 0),
      change: stats?.revenueChange ?? 0,
      icon: DollarSign,
    },
    {
      label: "Orders (30d)",
      value: String(stats?.orders ?? 0),
      change: stats?.ordersChange ?? 0,
      icon: ShoppingBag,
    },
    {
      label: "Unique Buyers",
      value: String(stats?.uniqueBuyers ?? 0),
      change: stats?.uniqueBuyersChange ?? null,
      icon: Users,
    },
  ];

  // Show only every 5th label to avoid clutter on the 30-day chart
  const tickFormatter = (val: string, idx: number) => idx % 5 === 0 ? val : "";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Last 30 days · Live data</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-nexus-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-nexus-500" />
              </div>
              {change !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* 30-day revenue chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-gray-900 font-semibold mb-1">Revenue — Last 30 Days</h3>
        <p className="text-gray-400 text-xs mb-5">Daily revenue from completed orders</p>
        {daily.every(d => d.revenue === 0) ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No sales yet in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
              <YAxis hide />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-gray-900 font-semibold mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales recorded yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRev = topProducts[0]?.revenue ?? 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(p.revenue / maxRev) * 100}%`, background: TYPE_COLORS[p.type] ?? "#6366f1" }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.revenue)}</p>
                      <p className="text-xs text-gray-400">{p.units} sold</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by type */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-gray-900 font-semibold mb-4">Revenue by Type</h3>
          {byType.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales recorded yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byType} barSize={32}>
                  <XAxis dataKey="type" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={t => t.charAt(0) + t.slice(1).toLowerCase()} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }}
                    labelFormatter={(t: any) => String(t).charAt(0) + String(t).slice(1).toLowerCase()}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {byType.map((entry, i) => (
                      <Cell key={i} fill={TYPE_COLORS[entry.type] ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {byType.map(({ type, revenue }) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[type] ?? "#6366f1" }} />
                    {type.charAt(0) + type.slice(1).toLowerCase()} · {formatCurrency(revenue)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
