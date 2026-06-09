"use client";

import { useState, useEffect } from "react";
import { Download, Package, ChevronDown, ChevronUp, Compass } from "lucide-react";
import Link from "next/link";
import { OrderThread } from "@/components/store/order-thread";

interface OrderProduct {
  id: string; name: string; type: string; images: string[];
  digital: { fileUrl?: string; downloadLimit?: number } | null;
}

interface OrderItem {
  id: string; quantity: number; price: number;
  product: OrderProduct;
}

interface Order {
  id: string; total: number; status: string; createdAt: string;
  trackingNumber?: string | null; trackingUrl?: string | null;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-50 text-yellow-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED:  "bg-green-50 text-green-700",
  REFUNDED:   "bg-gray-100 text-gray-600",
  CANCELLED:  "bg-red-50 text-red-600",
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders/my")
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Your purchase history and digital downloads</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">When you purchase products, they'll appear here.</p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c8e83c] text-gray-900 text-sm font-semibold hover:bg-[#b8d82c] transition-colors"
          >
            <Compass className="w-4 h-4" /> Discover creators
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isOpen = expanded === order.id;
            const hasDigital = order.items.some(i => i.product.type === "DIGITAL" && i.product.digital?.fileUrl);

            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.items.map(i => i.product.name).join(", ").slice(0, 60)}
                        {order.items.map(i => i.product.name).join(", ").length > 60 ? "…" : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        {" · "}Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasDigital && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Download className="w-3 h-3" /> Downloads
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50 px-5 py-4 space-y-3">
                    <div className="flex justify-end">
                      <Link href={`/orders/${order.id}/receipt`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        View receipt →
                      </Link>
                    </div>
                    {(order.trackingNumber || order.trackingUrl) && (
                      <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-xl px-3 py-2.5">
                        <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700">
                          {order.trackingNumber ? <>Tracking: <span className="font-medium">{order.trackingNumber}</span></> : "Shipment tracking"}
                        </span>
                        {order.trackingUrl && (
                          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700">Track package →</a>
                        )}
                      </div>
                    )}
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-start gap-3">
                        {item.product.images[0] ? (
                          <img src={item.product.images[0]} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity} · ${item.price.toFixed(2)}</p>
                          {item.product.type === "DIGITAL" && item.product.digital?.fileUrl && (
                            <a
                              href={item.product.digital.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Download className="w-3 h-3" /> Download file
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Message the seller</p>
                      <OrderThread orderId={order.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
