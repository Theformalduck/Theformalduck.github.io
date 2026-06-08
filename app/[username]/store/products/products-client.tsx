"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, X, Plus, Minus, ArrowLeft, Download,
  Loader2, Check, Shield, Truck, Star, RefreshCw, Package,
  Briefcase, Search,
} from "lucide-react";
import {
  STORE_THEMES, BUTTON_STYLES, CARD_STYLES, LAYOUTS, IMAGE_RATIOS, FONT_STYLES,
  type StoreSettings,
} from "@/lib/store-themes";
import { StoreSections } from "../store-sections";
import { useDisplayCurrency, CurrencySwitcher } from "../currency";

function readableTextOn(hex: string): string {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h.padEnd(6, "0");
  const lum = (0.299 * parseInt(f.slice(0, 2), 16) + 0.587 * parseInt(f.slice(2, 4), 16) + 0.114 * parseInt(f.slice(4, 6), 16)) / 255;
  return lum > 0.62 ? "#111111" : "#ffffff";
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  type: string;
  images: string[];
  inventory: number | null;
}

interface CartItem { product: Product; quantity: number }

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  DIGITAL:      { label: "Digital",      icon: Download  },
  PHYSICAL:     { label: "Physical",     icon: Package   },
  SERVICE:      { label: "Service",      icon: Briefcase },
  SUBSCRIPTION: { label: "Subscription", icon: RefreshCw },
};

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = TYPE_META[type]?.icon;
  return Icon ? <Icon className={className} /> : null;
}

export default function ProductsPageClient({
  user, storeSettings, products, isOwner,
  pageTitle = "All Products", pageDescription, pageImage,
}: {
  user: { name: string | null; username: string; image: string | null };
  storeSettings: StoreSettings;
  products: Product[];
  isOwner: boolean;
  pageTitle?: string;
  pageDescription?: string | null;
  pageImage?: string | null;
}) {
  const theme     = STORE_THEMES[storeSettings.theme]        ?? STORE_THEMES.default;
  const btnStyle  = BUTTON_STYLES[storeSettings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const cardStyle = CARD_STYLES[storeSettings.cardStyle]     ?? CARD_STYLES.shadow;
  const layout    = LAYOUTS[storeSettings.layout === "carousel" ? "3col" : storeSettings.layout] ?? LAYOUTS["3col"];
  const imgRatio  = IMAGE_RATIOS[storeSettings.imageRatio]   ?? IMAGE_RATIOS.square;
  const fontClass = (FONT_STYLES[storeSettings.fontStyle]    ?? FONT_STYLES.modern).className;
  const accent    = storeSettings.primaryColor;

  const baseCurrency = storeSettings.baseCurrency || "USD";
  const currencyOptions = Array.from(new Set([baseCurrency, ...(storeSettings.enabledCurrencies ?? [])]));
  const showCurrencySwitcher = !!storeSettings.showCurrencySwitcher && currencyOptions.length > 1;
  const cur = useDisplayCurrency(baseCurrency, currencyOptions);
  const fmt = cur.fmt;

  const navStyle = storeSettings.navStyle ?? "default";
  const navBg =
    navStyle === "colored"     ? accent :
    navStyle === "transparent" ? theme.navBg :
    navStyle === "minimal"     ? "transparent" :
    theme.navBg;
  const navBorderColor = navStyle === "minimal" ? "transparent" : theme.border;
  const navTextColor   = navStyle === "colored" ? "#ffffff" : theme.text;
  const navMutedColor  = navStyle === "colored" ? "rgba(255,255,255,0.75)" : theme.muted;

  const displayName = storeSettings.name ?? user.name ?? user.username;
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const router = useRouter();

  const [cart, setCart]               = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter]           = useState("ALL");
  const [search, setSearch]           = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    let lastUpdatedAt: string | null = null;
    const poll = async () => {
      try {
        const res = await fetch("/api/store/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (lastUpdatedAt === null) { lastUpdatedAt = data.updatedAt ?? null; return; }
        if (data.updatedAt && data.updatedAt !== lastUpdatedAt) {
          lastUpdatedAt = data.updatedAt;
          router.refresh();
        }
      } catch {}
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [isOwner, router]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    showToast("success", `${product.name} added to cart`);
    setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const availableTypes = Array.from(new Set(products.map(p => p.type)));
  const filteredProducts = products.filter(p => {
    const matchesType   = filter === "ALL" || p.type === filter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const checkout = async () => {
    if (!cart.length) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })), creatorUsername: user.username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className={fontClass} style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-sm ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Backdrop */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-md shadow-2xl flex flex-col"
            style={{ background: theme.surface, color: theme.text }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5" style={{ color: theme.muted }} />
                <h2 className="font-bold text-lg">Cart</h2>
                {totalItems > 0 && <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: accent }}>{totalItems}</span>}
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70" style={{ color: theme.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.surfaceHover }}>
                    <ShoppingCart className="w-8 h-8" style={{ color: theme.muted }} />
                  </div>
                  <p className="font-medium mb-1">Your cart is empty</p>
                  <button onClick={() => setCartOpen(false)} className="text-sm font-semibold mt-2 hover:opacity-70" style={{ color: accent }}>Continue Shopping →</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 py-1">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: theme.surfaceHover }}>
                        {item.product.images[0]
                          ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><TypeIcon type={item.product.type} className="w-7 h-7 text-gray-400" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug line-clamp-2">{item.product.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{fmt(item.product.price)} each</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: theme.border }}><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: theme.border }}><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold">{fmt(item.product.price * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 mt-auto"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t space-y-3.5" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.muted }}>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                  <span className="font-bold text-xl">{fmt(totalPrice)}</span>
                </div>
                {checkoutError && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{checkoutError}</p>}
                <button onClick={checkout} disabled={checkingOut}
                  className={`w-full h-12 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 ${btnStyle.radius}`}
                  style={{ background: accent }}>
                  {checkingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Shield className="w-4 h-4" /> Checkout Securely</>}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-10 md:bottom-10 md:w-full md:max-w-3xl z-[81] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: theme.surface, color: theme.text }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl backdrop-blur border flex items-center justify-center shadow-sm hover:opacity-70"
                style={{ background: theme.surface, borderColor: theme.border, color: theme.muted }}>
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col md:flex-row h-full overflow-auto">
                <div className="md:w-5/12 aspect-square md:aspect-auto flex-shrink-0" style={{ background: theme.surfaceHover }}>
                  {selectedProduct.images[0]
                    ? <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: "260px", color: theme.muted }}>
                        <TypeIcon type={selectedProduct.type} className="w-16 h-16 opacity-50" />
                        <span className="text-sm uppercase tracking-wider font-semibold opacity-60">{TYPE_META[selectedProduct.type]?.label ?? selectedProduct.type}</span>
                      </div>
                  }
                </div>
                <div className="flex-1 flex flex-col p-7 overflow-y-auto">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit mb-3" style={{ background: `${accent}15`, color: accent }}>
                    <TypeIcon type={selectedProduct.type} className="w-3 h-3" /> {TYPE_META[selectedProduct.type]?.label}
                  </span>
                  <h2 className="font-bold text-2xl leading-tight mb-3">{selectedProduct.name}</h2>
                  <div className="flex items-baseline gap-2.5 mb-4">
                    <span className="text-3xl font-black" style={{ color: accent }}>{fmt(selectedProduct.price)}</span>
                    {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                      <span className="text-lg line-through" style={{ color: theme.muted }}>{fmt(selectedProduct.comparePrice)}</span>
                    )}
                  </div>
                  {selectedProduct.description && <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: theme.muted }}>{selectedProduct.description}</p>}
                  {selectedProduct.inventory !== null && selectedProduct.inventory <= 10 && selectedProduct.inventory > 0 && (
                    <p className="text-amber-600 text-xs font-semibold mb-4">⚠ Only {selectedProduct.inventory} left in stock!</p>
                  )}
                  <div className="mt-auto">
                    {selectedProduct.inventory !== null && selectedProduct.inventory <= 0 ? (
                      <button disabled className={`w-full h-12 font-semibold text-sm cursor-not-allowed ${btnStyle.radius}`} style={{ background: theme.surfaceHover, color: theme.muted }}>Out of Stock</button>
                    ) : (
                      <button onClick={() => addToCart(selectedProduct)}
                        className={`w-full h-12 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 ${btnStyle.radius}`}
                        style={{ background: accent }}>
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Announcement */}
      {storeSettings.announcementText && (
        <div className="px-4 py-2.5 text-center text-white text-sm font-semibold" style={{ background: storeSettings.announcementColor }}>
          {storeSettings.announcementText}
        </div>
      )}

      {/* Navbar */}
      <div className="sticky top-0 z-40 border-b shadow-sm backdrop-blur-md" style={{ background: navBg, borderColor: navBorderColor }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0" style={{ background: theme.surfaceHover }}>
              {storeSettings.logoImage
                ? <img src={storeSettings.logoImage} alt="" className="w-full h-full object-cover" />
                : user.image
                  ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: accent }}>{initials}</div>
              }
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base leading-none truncate block" style={{ color: navTextColor }}>{displayName}</span>
              <Link href={`/${user.username}/store`}
                className="flex items-center gap-1 text-[11px] font-medium hover:opacity-80 transition-opacity mt-0.5"
                style={{ color: navMutedColor }}>
                <ArrowLeft className="w-2.5 h-2.5" />
                Back to store
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showCurrencySwitcher && (
              <CurrencySwitcher code={cur.code} options={currencyOptions} onChange={cur.set} accent={accent} textColor={navTextColor} />
            )}
            <button onClick={() => { if ((storeSettings.cartBehavior ?? "drawer") === "page") router.push(`/${user.username}/store/cart`); else setCartOpen(true); }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all hover:opacity-80"
              style={{ borderColor: navStyle === "colored" ? "rgba(255,255,255,0.25)" : theme.border, color: navMutedColor, background: theme.surfaceHover }}>
              <ShoppingCart style={{ width: "1.125rem", height: "1.125rem" }} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: accent }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        {pageImage && (
          <div className="mb-6 rounded-2xl overflow-hidden h-40 sm:h-52 relative">
            <img src={pageImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-end p-6">
              <h1 className="font-black text-3xl sm:text-4xl tracking-tight text-white">{pageTitle}</h1>
            </div>
          </div>
        )}
        <div className="mb-8">
          {!pageImage && <h1 className="font-black text-3xl tracking-tight mb-1" style={{ color: theme.text }}>{pageTitle}</h1>}
          {pageDescription
            ? <p className="text-sm max-w-2xl" style={{ color: theme.muted }}>{pageDescription}</p>
            : <p className="text-sm" style={{ color: theme.muted }}>{products.length} product{products.length !== 1 ? "s" : ""} available</p>}
        </div>

        {/* Search + filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px] max-w-xs"
            style={{ borderColor: theme.border, background: theme.surface }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: theme.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              style={{ color: theme.text }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="flex-shrink-0" style={{ color: theme.muted }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filters */}
          {availableTypes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {["ALL", ...availableTypes].map(type => (
                <button key={type} onClick={() => setFilter(type)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border transition-all ${btnStyle.radius}`}
                  style={filter === type
                    ? { background: accent, color: "#fff", borderColor: accent }
                    : { background: theme.surface, borderColor: theme.border, color: theme.muted }}>
                  {type !== "ALL" && <TypeIcon type={type} className="w-3.5 h-3.5" />}
                  {type === "ALL" ? "All" : TYPE_META[type]?.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.surfaceHover }}>
              <Package className="w-8 h-8" style={{ color: theme.muted }} />
            </div>
            <h3 className="font-semibold mb-1">No products found</h3>
            <p className="text-sm" style={{ color: theme.muted }}>{search ? "Try a different search term." : "Check back soon!"}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${layout.cols}`}>
            {filteredProducts.map((product, index) => {
              const discountPct = product.comparePrice && product.comparePrice > product.price
                ? Math.round((1 - product.price / product.comparePrice) * 100) : null;
              const isOutOfStock = product.inventory !== null && product.inventory <= 0;

              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  onClick={() => setSelectedProduct(product)}
                  className={`overflow-hidden cursor-pointer group border transition-all duration-300 hover:-translate-y-0.5 ${cardStyle.radius} ${cardStyle.shadow}`}
                  style={{ background: theme.surface, borderColor: theme.border }}>
                  <div className={`${imgRatio.cls} overflow-hidden relative`} style={{ background: theme.surfaceHover }}>
                    {product.images[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: theme.muted }}>
                          <TypeIcon type={product.type} className="w-10 h-10 opacity-50" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">{TYPE_META[product.type]?.label ?? product.type}</span>
                        </div>
                    }
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 text-white ${btnStyle.radius}`} style={{ background: `${accent}dd` }}>
                        {TYPE_META[product.type]?.label}
                      </span>
                    </div>
                    {discountPct && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">-{discountPct}%</span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug mb-0.5 line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs leading-relaxed mb-2 line-clamp-1" style={{ color: theme.muted }}>{product.description}</p>
                    )}
                    {storeSettings.showRatings && (
                      <div className="flex items-center gap-0.5 mb-1.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                        <span className="text-[10px] ml-1" style={{ color: theme.muted }}>(4.0)</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-sm" style={{ color: accent }}>{fmt(product.price)}</span>
                        {discountPct && <span className="text-xs line-through" style={{ color: theme.muted }}>{fmt(product.comparePrice!)}</span>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); if (!isOutOfStock) addToCart(product); }}
                        disabled={isOutOfStock}
                        className={`w-7 h-7 flex items-center justify-center text-white flex-shrink-0 transition-all hover:scale-110 disabled:opacity-40 ${btnStyle.radius}`}
                        style={{ background: accent }}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-page custom sections (collection page) */}
      <StoreSections
        sections={storeSettings.collectionSections ?? []}
        theme={theme}
        accent={accent}
        accentText={readableTextOn(accent)}
        products={products}
        username={user.username}
        formatCurrency={fmt}
        onAddToCart={(p) => { const full = products.find(x => x.id === p.id); if (full) addToCart(full); }}
        btnRadius={btnStyle.radius}
      />
    </div>
  );
}
