"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface OrderItem {
  id: string; quantity: number; price: number;
  product: { id: string; name: string; userId: string };
}

interface AdminOrder {
  id: string; total: number; status: string;
  guestEmail: string | null; createdAt: string;
  buyer: { id: string; name: string | null; email: string; username: string | null } | null;
  items: OrderItem[];
}

const STATUS_OPTIONS = ["", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "REFUNDED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-50 text-yellow-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SHIPPED:    "bg-indigo-50 text-indigo-700",
  DELIVERED:  "bg-teal-50 text-teal-700",
  COMPLETED:  "bg-green-50 text-green-700",
  REFUNDED:   "bg-gray-100 text-gray-600",
  CANCELLED:  "bg-red-50 text-red-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<AdminOrder[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status });
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUS_OPTIONS.map(s => (
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
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No orders found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Buyer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <>
                  <tr
                    key={o.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(-8)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.buyer?.name ?? o.guestEmail ?? "Guest"}</p>
                      <p className="text-gray-400 text-xs">{o.buyer?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${(o.total / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={o.id + "-exp"}>
                      <td colSpan={5} className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Order Items</p>
                        <div className="space-y-1">
                          {o.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-xs text-gray-700">
                              <span>{item.product.name} × {item.quantity}</span>
                              <span className="font-medium">${(item.price / 100).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">{o.id}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
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
