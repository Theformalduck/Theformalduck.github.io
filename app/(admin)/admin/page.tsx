export const dynamic = "force-dynamic";

import { Users, ShoppingBag, Rocket, DollarSign, UserX, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function StatCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide metrics</p>
      </div>

      {!stats ? (
        <p className="text-red-500 text-sm">Failed to load stats.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users" value={stats.totalUsers.toLocaleString()}
            sub={`+${stats.newUsers} last 30 days`}
            icon={Users} color="bg-blue-50 text-blue-600" href="/admin/users"
          />
          <StatCard
            label="Total Orders" value={stats.totalOrders.toLocaleString()}
            sub={`+${stats.newOrders} last 30 days`}
            icon={ShoppingBag} color="bg-green-50 text-green-600" href="/admin/orders"
          />
          <StatCard
            label="Total Revenue" value={`$${(stats.totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            icon={DollarSign} color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Active Campaigns" value={stats.activeCampaigns.toLocaleString()}
            sub={`${stats.totalCampaigns} total`}
            icon={Rocket} color="bg-purple-50 text-purple-600" href="/admin/campaigns"
          />
          <StatCard
            label="Banned Users" value={stats.bannedUsers.toLocaleString()}
            icon={UserX} color="bg-red-50 text-red-600" href="/admin/users?filter=banned"
          />
          <StatCard
            label="Admin Accounts" value="–"
            icon={TrendingUp} color="bg-gray-100 text-gray-600" href="/admin/users?filter=admin"
          />
        </div>
      )}
    </div>
  );
}
