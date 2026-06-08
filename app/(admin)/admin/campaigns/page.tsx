"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface AdminCampaign {
  id: string; title: string; goal: number; raised: number;
  status: string; createdAt: string;
  user: { id: string; name: string | null; email: string; username: string | null };
  _count: { backers: number };
}

const STATUSES = ["", "DRAFT", "ACTIVE", "FUNDED", "FAILED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-600",
  ACTIVE:    "bg-green-50 text-green-700",
  FUNDED:    "bg-blue-50 text-blue-700",
  FAILED:    "bg-red-50 text-red-600",
  CANCELLED: "bg-yellow-50 text-yellow-700",
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [busy, setBusy]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status });
    const res = await fetch(`/api/admin/campaigns?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  async function setStatus2(campaignId: string, newStatus: string) {
    setBusy(campaignId);
    await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, status: newStatus }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s || "all"}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-xl transition-colors ${
              status === s
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No campaigns found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Creator</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Backers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map(c => {
                const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{c.title}</p>
                      <p className="text-gray-400 text-xs font-mono">{c.id.slice(-8)}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-900">{c.user.name ?? "—"}</p>
                      <p className="text-gray-400 text-xs">{c.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{pct}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ${c.raised.toLocaleString()} / ${c.goal.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        disabled={busy === c.id}
                        onChange={e => setStatus2(c.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        {STATUSES.filter(Boolean).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {c._count.backers}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
