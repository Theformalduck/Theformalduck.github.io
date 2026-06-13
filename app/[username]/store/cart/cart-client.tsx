"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Plus, Minus, X, Shield, Loader2, Truck, Check, MapPin } from "lucide-react";
import { trackEvent } from "@/lib/analytics-events";
import { STORE_THEMES, BUTTON_STYLES, FONT_STYLES, type StoreSettings } from "@/lib/store-themes";
import { useDisplayCurrency, CurrencySwitcher } from "../currency";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  type: string;
  images: string[];
  inventory: number | null;
}
interface CartItem { product: CartProduct; quantity: number }

export default function CartClient({
  user, storeSettings, sellerHasPayments, recommendations = [],
}: {
  user: { name: string | null; username: string; image: string | null };
  storeSettings: StoreSettings;
  sellerHasPayments: boolean;
  recommendations?: CartProduct[];
}) {
  const theme    = STORE_THEMES[storeSettings.theme] ?? STORE_THEMES.default;
  const accent   = storeSettings.primaryColor;
  const btnStyle = BUTTON_STYLES[storeSettings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const fontClass = (FONT_STYLES[storeSettings.fontStyle] ?? FONT_STYLES.modern).className;

  const baseCurrency = storeSettings.baseCurrency || "USD";
  const currencyOptions = Array.from(new Set([baseCurrency, ...(storeSettings.enabledCurrencies ?? [])]));
  const showCurrencySwitcher = !!storeSettings.showCurrencySwitcher && currencyOptions.length > 1;
  const cur = useDisplayCurrency(baseCurrency, currencyOptions);
  const fmt = cur.fmt;

  const storeKey = `cart_${user.username}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [storeKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storeKey, JSON.stringify(cart));
  }, [cart, loaded, storeKey]);

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product.id !== id)); return; }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  const addRecommended = (p: CartProduct) => {
    trackEvent("add_to_cart", { value: p.price, items: [{ item_id: p.id, item_name: p.name, price: p.price, quantity: 1 }] });
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === p.id);
      if (idx >= 0) return prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  // Cross-sell pool: active products not already in the cart, featured first.
  const featuredIds = storeSettings.featuredIds ?? [];
  const crossSellPicks = (() => {
    if (!(storeSettings.cartCrossSell ?? false) || cart.length === 0) return [];
    const inCart = new Set(cart.map(i => i.product.id));
    const pool = recommendations.filter(p => !inCart.has(p.id));
    return [...pool.filter(p => featuredIds.includes(p.id)), ...pool.filter(p => !featuredIds.includes(p.id))].slice(0, 4);
  })();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const freeShipThreshold = storeSettings.freeShippingThreshold ?? 50;
  const freeShipText = storeSettings.freeShippingText || "free shipping";
  const freeShipReached = totalPrice >= freeShipThreshold;

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setApplyingPromo(true); setPromoError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, creatorUsername: user.username, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) { setAppliedPromo({ code: data.code, discountAmount: data.discountAmount }); setPromoInput(""); }
      else { setAppliedPromo(null); setPromoError(data.error ?? "Invalid code"); }
    } catch { setPromoError("Could not validate code"); }
    finally { setApplyingPromo(false); }
  };

  useEffect(() => {
    if (!appliedPromo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discounts/validate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedPromo.code, creatorUsername: user.username, subtotal: totalPrice }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
        else { setAppliedPromo(null); setPromoError(data.error ?? "Code no longer valid"); }
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice]);

  const discountValue = appliedPromo ? Math.min(appliedPromo.discountAmount, totalPrice) : 0;
  const grandTotal = Math.max(0, totalPrice - discountValue);

  const checkout = async () => {
    if (!cart.length) return;
    trackEvent("begin_checkout", {
      value: totalPrice,
      items: cart.map(i => ({ item_id: i.product.id, item_name: i.product.name, price: i.product.price, quantity: i.quantity })),
    });
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          creatorUsername: user.username,
          ...(appliedPromo && { discountCode: appliedPromo.code }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className={fontClass} style={{ background: theme.bg, color: theme.text, minHeight: "100vh" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-40" style={{ borderColor: theme.border, background: theme.navBg }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-4">
          <Link href={`/${user.username}/store`} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: theme.muted }}>
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </Link>
          <span className="ml-auto font-semibold text-sm" style={{ color: theme.text }}>
            {storeSettings.name ?? user.name ?? user.username}
          </span>
          {showCurrencySwitcher && (
            <CurrencySwitcher code={cur.code} options={currencyOptions} onChange={cur.set} accent={accent} textColor={theme.text} />
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: theme.text }}>
          Your Cart {totalItems > 0 && <span className="text-base font-normal" style={{ color: theme.muted }}>· {totalItems} item{totalItems !== 1 ? "s" : ""}</span>}
        </h1>

        {!loaded ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
        ) : cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: theme.surfaceHover }}>
              <ShoppingBag className="w-8 h-8" style={{ color: theme.muted }} />
            </div>
            <p className="text-lg font-semibold mb-1" style={{ color: theme.text }}>Your cart is empty</p>
            <p className="text-sm mb-6" style={{ color: theme.muted }}>Add some products to get started.</p>
            <Link href={`/${user.username}/store`}
              className={`px-5 h-11 inline-flex items-center font-semibold text-sm ${btnStyle.radius}`}
              style={{ background: accent, color: "#fff" }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl border" style={{ borderColor: theme.border, background: theme.surface }}>
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: theme.surfaceHover }}>
                    {item.product.images?.[0]
                      ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6" style={{ color: theme.muted }} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm" style={{ color: theme.text }}>{item.product.name}</p>
                      <button onClick={() => setQty(item.product.id, 0)} className="hover:opacity-70" style={{ color: theme.muted }} aria-label="Remove">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{fmt(item.product.price)} each</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: theme.border }}>
                        <button onClick={() => setQty(item.product.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:opacity-70" style={{ color: theme.text }}><Minus className="w-3 h-3" /></button>
                        <span className="w-9 text-center text-sm font-medium" style={{ color: theme.text }}>{item.quantity}</span>
                        <button onClick={() => setQty(item.product.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:opacity-70" style={{ color: theme.text }}><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-sm" style={{ color: theme.text }}>{fmt(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Cross-sell: one-tap additions, featured products first */}
              {crossSellPicks.length > 0 && (
                <div className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.surface }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: theme.muted }}>You might also like</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {crossSellPicks.map(p => (
                      <div key={p.id} className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border }}>
                        <Link href={`/${user.username}/store/products/${p.id}`} className="block aspect-square" style={{ background: theme.surfaceHover }}>
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          )}
                        </Link>
                        <div className="p-2">
                          <p className="text-[11px] font-semibold leading-tight line-clamp-1" style={{ color: theme.text }}>{p.name}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] font-bold" style={{ color: theme.muted }}>{fmt(p.price)}</span>
                            <button onClick={() => addRecommended(p)}
                              className="w-6 h-6 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
                              style={{ background: accent, color: "#fff" }} title={`Add ${p.name}`}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border p-5 space-y-4 sticky top-20" style={{ borderColor: theme.border, background: theme.surface }}>
                {storeSettings.localPickupOnly ? (
                  <div className="p-3 rounded-xl text-xs" style={{ background: theme.surfaceHover }}>
                    <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: theme.text }}>
                      <MapPin className="w-3.5 h-3.5" /> Local pickup only
                    </div>
                    <p style={{ color: theme.muted }}>
                      {storeSettings.localPickupNote || "This store doesn't ship, you'll collect your order in person. No shipping address needed at checkout."}
                    </p>
                  </div>
                ) : storeSettings.showFreeShippingBar && (
                  <div className="p-3 rounded-xl text-xs" style={{ background: theme.surfaceHover }}>
                    <div className="flex items-center gap-1.5 font-semibold mb-2" style={{ color: freeShipReached ? "#16a34a" : theme.muted }}>
                      <Truck className="w-3.5 h-3.5" />
                      {freeShipReached ? `You've unlocked ${freeShipText}!` : `${fmt(freeShipThreshold - totalPrice)} away from ${freeShipText}`}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (totalPrice / freeShipThreshold) * 100)}%`, background: freeShipReached ? "#16a34a" : accent }} />
                    </div>
                  </div>
                )}
                {/* Promo code */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between text-sm rounded-xl px-3 py-2" style={{ background: theme.surfaceHover }}>
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: theme.text }}>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-mono">{appliedPromo.code}</span> applied
                    </span>
                    <button onClick={() => { setAppliedPromo(null); setPromoError(null); }} className="text-xs hover:opacity-70" style={{ color: theme.muted }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                        onKeyDown={e => { if (e.key === "Enter") applyPromo(); }}
                        placeholder="Promo code"
                        className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none font-mono uppercase"
                        style={{ borderColor: theme.border, background: theme.surfaceHover, color: theme.text }} />
                      <button onClick={applyPromo} disabled={applyingPromo || !promoInput.trim()}
                        className={`px-4 h-10 text-sm font-semibold border ${btnStyle.radius} disabled:opacity-50`}
                        style={{ borderColor: theme.border, color: theme.text }}>
                        {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.muted }}>Subtotal</span>
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{fmt(totalPrice)}</span>
                </div>
                {appliedPromo && discountValue > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: theme.muted }}>Discount</span>
                    <span className="font-medium text-emerald-600">−{fmt(discountValue)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: theme.border }}>
                  <span className="text-sm font-semibold" style={{ color: theme.text }}>Total</span>
                  <span className="font-bold text-xl" style={{ color: theme.text }}>{fmt(grandTotal)}</span>
                </div>
                {checkoutError && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{checkoutError}</p>}
                {sellerHasPayments ? (
                  <button onClick={checkout} disabled={checkingOut}
                    className={`w-full h-12 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 ${btnStyle.radius}`}
                    style={{ background: accent }}>
                    {checkingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Shield className="w-4 h-4" /> Checkout Securely</>}
                  </button>
                ) : (
                  <div className={`w-full h-12 flex items-center justify-center text-sm font-medium text-gray-400 bg-gray-100 ${btnStyle.radius}`}>
                    Checkout unavailable
                  </div>
                )}
                <p className="text-xs text-center" style={{ color: theme.muted }}>Powered by Stripe · SSL encrypted</p>
                {cur.code !== baseCurrency && (
                  <p className="text-[11px] text-center" style={{ color: theme.muted }}>
                    Prices shown in {cur.code} are approximate. You'll be charged in {baseCurrency}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
