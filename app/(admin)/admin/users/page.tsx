"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Ban, ShieldCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface AdminUser {
  id: string; name: string | null; email: string; username: string | null;
  image: string | null; role: string; verified: boolean;
  bannedAt: string | null; createdAt: string;
  _count: { orders: number; products: number; campaigns: number };
}

const ROLES = ["CREATOR", "SUPPORTER", "BUYER", "INVESTOR", "RECRUITER", "ADMIN"];
const FILTERS = [
  { value: "all",    label: "All" },
  { value: "banned", label: "Banned" },
  { value: "admin",  label: "Admins" },
];

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q, filter });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }, [page, q, filter]);

  useEffect(() => { load(); }, [load]);

  async function action(userId: string, act: string, role?: string) {
    setBusy(userId + act);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: act, role }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Search name, email, username…"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-2 text-sm rounded-xl transition-colors ${
                filter === f.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Activity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50/50 ${u.bannedAt ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.image
                        ? <img src={u.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                        : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {(u.name ?? u.email)[0].toUpperCase()}
                          </div>
                      }
                      <div>
                        <p className="font-medium text-gray-900">{u.name ?? "—"}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busy === u.id + "setRole"}
                      onChange={e => action(u.id, "setRole", e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {u.bannedAt && (
                      <span className="ml-2 text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">BANNED</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                    {u._count.orders} orders · {u._count.products} products · {u._count.campaigns} campaigns
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.bannedAt ? (
                      <button
                        onClick={() => action(u.id, "unban")}
                        disabled={busy === u.id + "unban"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3 h-3" /> Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => action(u.id, "ban")}
                        disabled={busy === u.id + "ban"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3" /> Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
