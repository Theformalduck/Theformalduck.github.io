"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, ShoppingBag, DollarSign, Package, Star,
  Search, MoreHorizontal, Edit3, Trash2, Eye, Download, Loader2, ExternalLink, Check, Palette,
  Briefcase, RefreshCw, MessageCircle, X as XIcon, Mail,
} from "lucide-react";
import { OrderThread } from "@/components/store/order-thread";
import { formatCurrency, cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

function TypeIcon({ type }: { type: string }) {
  const props = { className: "w-5 h-5 text-gray-400" };
  switch (type) {
    case "DIGITAL":      return <Download {...props} />;
    case "PHYSICAL":     return <Package {...props} />;
    case "SERVICE":      return <Briefcase {...props} />;
    case "SUBSCRIPTION": return <RefreshCw {...props} />;
    default:             return <Package {...props} />;
  }
}

function TypeBadge({ type }: { type: string }) {
  type Meta = { label: string; icon: React.ComponentType<{ className?: string }>; cls: string };
  const meta: Record<string, Meta> = {
    DIGITAL:      { label: "Digital",      icon: Download,  cls: "" },
    PHYSICAL:     { label: "Physical",     icon: Package,   cls: "" },
    SERVICE:      { label: "Service",      icon: Briefcase, cls: "" },
    SUBSCRIPTION: { label: "Subscription", icon: RefreshCw, cls: "" },
  };
  const m = meta[type] ?? { label: type, icon: Package, cls: "" };
  const Icon = m.icon;
  // Single on-brand blue tint, calm and cohesive; the icon distinguishes the type.
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-nexus-50 text-nexus-700 border border-nexus-100">
      <Icon className="w-3 h-3 text-nexus-400" />
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; dot: string; cls: string }> = {
    ACTIVE:   { label: "Active",   dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
    DRAFT:    { label: "Draft",    dot: "bg-gray-400",    cls: "bg-gray-100 text-gray-500 border border-gray-200" },
    ARCHIVED: { label: "Archived", dot: "bg-amber-400",   cls: "bg-amber-50 text-amber-600 border border-amber-100" },
  };
  const m = meta[status] ?? { label: status, dot: "bg-gray-400", cls: "bg-gray-100 text-gray-500 border border-gray-200" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", m.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
      {m.label}
    </span>
  );
}

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function StorePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [usernameLoaded, setUsernameLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then((u: any) => { if (u?.username) setUsername(u.username); })
      .finally(() => setUsernameLoaded(true));
  }, []);

  useEffect(() => {
    // Only ever store arrays, an error response ({ error }) would otherwise make
    // products/orders a non-array and crash the .filter()/.reduce() below.
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Failed to delete product. Please try again.");
    }
    setDeleting(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } else {
      alert("Failed to update product status. Please try again.");
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm("Issue a full refund for this order? This cannot be undone.")) return;
    setRefunding(orderId);
    const res = await fetch(`/api/orders/${orderId}/refund`, { method: "POST" });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "REFUNDED" } : o));
    } else {
      const data = await res.json();
      alert(data.error ?? "Refund failed. Please try again.");
    }
    setRefunding(null);
  };

  const handleOrderStatus = async (orderId: string, status: string, tracking?: { trackingNumber?: string; trackingUrl?: string }) => {
    setUpdatingOrder(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(tracking ?? {}) }),
    });
    if (res.ok) {
      const updated = await res.json().catch(() => null);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(updated ? { trackingNumber: updated.trackingNumber, trackingUrl: updated.trackingUrl } : {}) } : o));
    }
    setUpdatingOrder(null);
  };

  // Marking an order shipped opens a modal to optionally attach tracking info.
  const [shipModal, setShipModal] = useState<{ orderId: string; trackingNumber: string; trackingUrl: string } | null>(null);
  const [msgOrder, setMsgOrder] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; total: number; errors: string[] } | null>(null);

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) { setImportResult({ created: 0, total: 0, errors: [data.error ?? "Import failed"] }); }
      else {
        setImportResult(data);
        // Refresh the product list to show the imported items.
        fetch("/api/products").then(r => r.json()).then(setProducts).catch(() => {});
      }
    } catch {
      setImportResult({ created: 0, total: 0, errors: ["Could not read the file"] });
    } finally {
      setImporting(false);
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgRating = products.length > 0
    ? products.reduce((s, p) => {
        const ratings = p.reviews?.map((r: any) => r.rating) ?? [];
        const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
        return s + avg;
      }, 0) / products.filter((p) => (p.reviews?.length ?? 0) > 0).length || 0
    : 0;

  // `loading` gates each value so the cards show a skeleton instead of a
  // computed 0 while the data is still being fetched (avoids a flash of zeros
  // every time the page mounts).
  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "emerald", loading: loadingOrders },
    { label: "Orders", value: orders.length.toString(), icon: ShoppingBag, color: "blue", loading: loadingOrders },
    { label: "Products", value: products.length.toString(), icon: Package, color: "nexus", loading: loadingProducts },
    { label: "Avg. Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "–", icon: Star, color: "amber", loading: loadingProducts },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your products and orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/store/bulk">
            <Button variant="outline" size="sm" className="text-gray-600 border-gray-200">Import / Export</Button>
          </Link>
          {usernameLoaded && (
            username ? (
              <Link href={`/${username}/store`} target="_blank">
                <Button variant="outline" size="sm" className="text-gray-600 border-gray-200">
                  <ExternalLink className="w-4 h-4" />View Store
                </Button>
              </Link>
            ) : (
              <Link href="/settings">
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100">
                  <ExternalLink className="w-4 h-4" />Set username to view store
                </Button>
              </Link>
            )
          )}
          <Link href="/store/collections">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
              <Package className="w-4 h-4" />Collections
            </Button>
          </Link>
          <Link href="/store/discounts">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
              <DollarSign className="w-4 h-4" />Discounts
            </Button>
          </Link>
          <Link href="/store/subscribers">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
              <Mail className="w-4 h-4" />Email &amp; Newsletter
            </Button>
          </Link>
          <Link href="/store/customize">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-200">
              <Palette className="w-4 h-4" />Customize
            </Button>
          </Link>
          <Link href="/store/products/new">
            <Button variant="lime" size="sm"><Plus className="w-4 h-4" />Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, loading }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl bg-${color}-500/15 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? <span className="inline-block h-7 w-20 rounded-md bg-gray-100 animate-pulse" /> : value}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="products">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                <Download className="w-4 h-4 rotate-180" /> Import
              </button>
              <a href="/api/products/export" download
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export
              </a>
            </div>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-2xl text-center">
              <Package className="w-10 h-10 text-gray-200 mb-3" />
              <h3 className="text-gray-900 font-semibold mb-1">No products yet</h3>
              <p className="text-gray-400 text-sm mb-4">Create your first product to start selling.</p>
              <Link href="/store/products/new"><Button variant="lime" size="sm"><Plus className="w-4 h-4" />Add Product</Button></Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Product</th>
                    <th className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase hidden sm:table-cell">Type</th>
                    <th className="text-right px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Price</th>
                    <th className="text-right px-5 py-3 text-gray-400 text-xs font-semibold uppercase hidden md:table-cell">Sales</th>
                    <th className="text-center px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className={cn("border-b border-gray-200 hover:bg-gray-50 transition-colors", deleting === product.id && "opacity-50")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <TypeIcon type={product.type} />
                          </div>
                          <div>
                            <div className="text-gray-900 text-sm font-medium">{product.name}</div>
                            {product.inventory !== null && (
                              product.inventory <= 0 ? (
                                <span className="inline-block text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600">Out of stock</span>
                              ) : product.inventory <= 5 ? (
                                <span className="inline-block text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Low stock · {product.inventory} left</span>
                              ) : (
                                <div className="text-xs text-gray-400">{product.inventory} in stock</div>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <TypeBadge type={product.type} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-700 text-sm font-medium">{formatCurrency(product.price)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <span className="text-gray-600 text-sm">{product._count?.orderItems ?? 0}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content className="z-50 w-40 rounded-xl bg-white border border-gray-200 shadow-xl p-1" sideOffset={4} align="end">
                              {product.status === "DRAFT" && (
                                <DropdownMenu.Item onClick={() => handleStatusChange(product.id, "ACTIVE")}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-emerald-600 hover:bg-emerald-50 transition-all">
                                  <Eye className="w-3.5 h-3.5" />Publish
                                </DropdownMenu.Item>
                              )}
                              {product.status === "ACTIVE" && (
                                <DropdownMenu.Item onClick={() => handleStatusChange(product.id, "DRAFT")}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-gray-700 hover:bg-gray-50 transition-all">
                                  <Eye className="w-3.5 h-3.5" />Unpublish
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Item onClick={() => router.push(`/store/products/${product.id}/edit`)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-gray-700 hover:bg-gray-50 transition-all">
                                <Edit3 className="w-3.5 h-3.5" />Edit
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                              <DropdownMenu.Item onClick={() => handleDelete(product.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />Delete
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-2xl text-center">
              <ShoppingBag className="w-10 h-10 text-gray-200 mb-3" />
              <h3 className="text-gray-900 font-semibold mb-1">No orders yet</h3>
              <p className="text-gray-400 text-sm mb-5">Share your store link to start getting sales.</p>
              {username ? (
                <Link href={`/${username}/store`} target="_blank">
                  <Button variant="lime"><ExternalLink className="w-4 h-4" /> Share your store</Button>
                </Link>
              ) : (
                <Link href="/store/products/new">
                  <Button variant="lime"><Plus className="w-4 h-4" /> Add a product</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Order</th>
                    <th className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Items</th>
                    <th className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase hidden md:table-cell">Customer</th>
                    <th className="text-right px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Amount</th>
                    <th className="text-center px-5 py-3 text-gray-400 text-xs font-semibold uppercase">Status</th>
                    <th className="text-right px-5 py-3 text-gray-400 text-xs font-semibold uppercase hidden sm:table-cell">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/orders/${order.id}/receipt`} className="text-nexus-600 text-sm font-mono hover:underline" title="View receipt">
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700 text-sm truncate max-w-[180px] block">
                          {order.items[0]?.product?.name ?? "–"}{order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-600 text-sm">{order.buyer?.name ?? "Unknown"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-emerald-400 font-medium text-sm">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button disabled={updatingOrder === order.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all hover:opacity-80 disabled:opacity-50">
                              {updatingOrder === order.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : (
                                  <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold",
                                    order.status === "COMPLETED" || order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                                    order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                                    order.status === "REFUNDED" || order.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                                    "bg-amber-100 text-amber-700")}>
                                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()} ▾
                                  </span>
                                )}
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content className="z-50 w-44 rounded-xl bg-white border border-gray-200 shadow-xl p-1" sideOffset={4} align="center">
                              {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "REFUNDED", "CANCELLED"].map(s => (
                                <DropdownMenu.Item key={s} onClick={() => s === "SHIPPED" ? setShipModal({ orderId: order.id, trackingNumber: order.trackingNumber ?? "", trackingUrl: order.trackingUrl ?? "" }) : handleOrderStatus(order.id, s)}
                                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer outline-none transition-all capitalize",
                                    order.status === s ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50")}>
                                  {order.status === s && <Check className="w-3 h-3" />}
                                  {s.charAt(0) + s.slice(1).toLowerCase()}
                                </DropdownMenu.Item>
                              ))}
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        <span className="text-gray-400 text-xs">{timeAgo(order.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {order.buyerId && (
                            <button
                              onClick={() => setMsgOrder(order.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              <MessageCircle className="w-3 h-3" /> Message
                            </button>
                          )}
                          {order.status !== "REFUNDED" && order.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleRefund(order.id)}
                              disabled={refunding === order.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              {refunding === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => { setImportOpen(false); setImportResult(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Import products</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a CSV with columns <span className="font-mono text-xs">name, price</span> (required) and optionally
              <span className="font-mono text-xs"> description, compare_price, type, status, inventory, image_urls</span>. Tip: export first to get the exact format.
            </p>
            {importResult ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">
                  Imported {importResult.created} of {importResult.total} product{importResult.total !== 1 ? "s" : ""}.
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-xl bg-amber-50 text-amber-700 px-4 py-3 text-xs max-h-32 overflow-auto">
                    {importResult.errors.slice(0, 20).map((e, i) => <div key={i}>{e}</div>)}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="lime" onClick={() => { setImportOpen(false); setImportResult(null); }}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <label className={cn("flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#2e9cfe] transition-colors", importing && "opacity-60 pointer-events-none")}>
                  {importing ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : <Download className="w-6 h-6 text-gray-300 rotate-180" />}
                  <span className="text-sm text-gray-500">{importing ? "Importing…" : "Click to choose a .csv file"}</span>
                  <input type="file" accept=".csv,text/csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
                </label>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setImportOpen(false)} className="text-gray-600 border-gray-200">Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Order messages modal */}
      {msgOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => setMsgOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Order #{msgOrder.slice(-8).toUpperCase()} · Messages</h3>
              <button onClick={() => setMsgOrder(null)} className="text-gray-400 hover:text-gray-700"><XIcon className="w-4 h-4" /></button>
            </div>
            <div className="p-4">
              <OrderThread orderId={msgOrder} />
            </div>
          </div>
        </div>
      )}

      {/* Mark-as-shipped tracking modal */}
      {shipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => setShipModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Mark as shipped</h3>
            <p className="text-sm text-gray-500 mb-5">Add optional tracking details. The customer will be emailed a shipping notification.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tracking number <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={shipModal.trackingNumber} onChange={e => setShipModal({ ...shipModal, trackingNumber: e.target.value })}
                  placeholder="1Z999AA10123456784"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tracking link <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={shipModal.trackingUrl} onChange={e => setShipModal({ ...shipModal, trackingUrl: e.target.value })}
                  placeholder="https://carrier.com/track/…"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShipModal(null)} className="text-gray-600 border-gray-200">Cancel</Button>
              <Button variant="lime" disabled={updatingOrder === shipModal.orderId}
                onClick={async () => {
                  const m = shipModal;
                  setShipModal(null);
                  await handleOrderStatus(m.orderId, "SHIPPED", { trackingNumber: m.trackingNumber.trim(), trackingUrl: m.trackingUrl.trim() });
                }}>
                {updatingOrder === shipModal.orderId && <Loader2 className="w-4 h-4 animate-spin" />}
                Mark Shipped & Notify
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
