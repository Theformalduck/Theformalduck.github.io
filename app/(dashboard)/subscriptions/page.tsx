"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Users, TrendingUp, AlertCircle } from "lucide-react";

interface CreatorSub {
  id: string; status: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; createdAt: string;
  subscriber: { id: string; name: string | null; username: string | null; image: string | null; email: string };
  product: { id: string; name: string; price: number; billingInterval: string | null };
}

interface MySub {
  id: string; status: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; createdAt: string;
  product: { id: string; name: string; price: number; billingInterval: string | null; images: string[] };
  creator: { id: string; name: string | null; username: string | null; image: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-green-50 text-green-700",
  cancelled:  "bg-gray-100 text-gray-500",
  past_due:   "bg-red-50 text-red-600",
  trialing:   "bg-blue-50 text-blue-700",
  incomplete: "bg-yellow-50 text-yellow-700",
};

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<"mine" | "creator">("creator");
  const [creatorSubs, setCreatorSubs] = useState<CreatorSub[]>([]);
  const [mySubs, setMySubs] = useState<MySub[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    try { return await res.json(); } catch { return null; }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/subscriptions?role=creator").then(safeJson),
      fetch("/api/subscriptions?role=subscriber").then(safeJson),
    ]).then(([c, m]) => {
      if (Array.isArray(c)) setCreatorSubs(c);
      if (Array.isArray(m)) setMySubs(m);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cancelSub = async (id: string) => {
    setCancelling(id);
    await fetch("/api/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: id }),
    });
    setMySubs(prev => prev.map(s => s.id === id ? { ...s, cancelAtPeriodEnd: true } : s));
    setCancelling(null);
  };

  // Compute creator stats
  const activeCreatorSubs = creatorSubs.filter(s => s.status === "active" && !s.cancelAtPeriodEnd);
  const mrr = activeCreatorSubs.reduce((sum, s) => {
    const interval = s.product.billingInterval ?? "month";
    const monthly = interval === "year" ? s.product.price / 12 : s.product.price;
    return sum + monthly;
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your subscription products and memberships</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([["creator", "My Subscribers"], ["mine", "My Subscriptions"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : tab === "creator" ? (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 font-medium">Active Subscribers</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeCreatorSubs.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 font-medium">Est. MRR</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${mrr.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{creatorSubs.length}</p>
            </div>
          </div>

          {creatorSubs.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
              <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No subscribers yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a Subscription product in your store to start earning recurring revenue.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subscriber</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Renews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {creatorSubs.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.subscriber.image
                            ? <img src={s.subscriber.image} className="w-7 h-7 rounded-full" alt="" />
                            : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {(s.subscriber.name ?? s.subscriber.email)[0].toUpperCase()}
                              </div>
                          }
                          <div>
                            <p className="font-medium text-gray-900">{s.subscriber.name ?? "—"}</p>
                            <p className="text-xs text-gray-400">{s.subscriber.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{s.product.name}</p>
                        <p className="text-xs text-gray-400">${s.product.price}/{s.product.billingInterval ?? "month"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {s.cancelAtPeriodEnd ? "Cancels at period end" : s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(s.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {mySubs.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
              <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active subscriptions</p>
              <p className="text-gray-400 text-sm mt-1">Subscribe to creators' subscription products to see them here.</p>
            </div>
          ) : (
            mySubs.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {s.product.images[0]
                      ? <img src={s.product.images[0]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-gray-400" /></div>
                    }
                    <div>
                      <p className="font-semibold text-gray-900">{s.product.name}</p>
                      <p className="text-sm text-gray-500">
                        ${s.product.price}/{s.product.billingInterval ?? "month"} · from{" "}
                        <span className="font-medium">{s.creator.name ?? s.creator.username}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.cancelAtPeriodEnd
                          ? `Cancels ${new Date(s.currentPeriodEnd).toLocaleDateString()}`
                          : `Renews ${new Date(s.currentPeriodEnd).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {s.status}
                    </span>
                    {s.status === "active" && !s.cancelAtPeriodEnd && (
                      <button
                        onClick={() => cancelSub(s.id)}
                        disabled={cancelling === s.id}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                    {s.cancelAtPeriodEnd && (
                      <span className="text-xs text-orange-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Cancelling
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
