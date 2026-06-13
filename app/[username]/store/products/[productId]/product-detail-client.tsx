"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, Zap, Shield, RotateCcw, Truck,
  Star, ChevronDown, ChevronUp, Package, Download, Briefcase, RefreshCw, Check, Loader2,
  Heart, Share2, ZoomIn, X,
} from "lucide-react";
import { useDisplayCurrency, CurrencySwitcher } from "../../currency";
import { StoreSections } from "../../store-sections";
import { trackEvent } from "@/lib/analytics-events";

function readableTextOn(hex: string): string {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(f.slice(0, 2), 16) || 0;
  const g = parseInt(f.slice(2, 4), 16) || 0;
  const b = parseInt(f.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#111111" : "#ffffff";
}
import { STORE_THEMES, BUTTON_STYLES, FONT_STYLES, type StoreSettings } from "@/lib/store-themes";

interface Variant {
  id: string;
  optionType: string;
  name: string;
  colorHex: string | null;
  image: string | null;
  price: number | null;
  inventory: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verified?: boolean;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  author: { id: string; name: string | null; image: string | null; username: string | null };
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
  metafields?: { label: string; value: string }[] | unknown;
  variants: Variant[];
  reviews: Review[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  type: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  DIGITAL:      { label: "Instant download after purchase", icon: Download },
  PHYSICAL:     { label: "Ships in 3–5 business days",      icon: Truck    },
  SERVICE:      { label: "Scheduled after booking",         icon: Briefcase },
  SUBSCRIPTION: { label: "Access starts immediately",       icon: RefreshCw },
};

export default function ProductDetailClient({
  user, product, relatedProducts, storeSettings, isOwner, sellerHasPayments, currentUserId,
}: {
  user: { name: string | null; username: string; image: string | null };
  product: Product;
  relatedProducts: RelatedProduct[];
  storeSettings: StoreSettings;
  isOwner: boolean;
  sellerHasPayments: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const theme = STORE_THEMES[storeSettings.theme] ?? STORE_THEMES.default;
  const btnStyle = BUTTON_STYLES[storeSettings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const fontClass = (FONT_STYLES[storeSettings.fontStyle] ?? FONT_STYLES.modern).className;
  const accent = storeSettings.primaryColor;
  const cardBg = theme.surface;

  // Product page layout customization
  const galleryStyle = storeSettings.productGalleryStyle ?? "thumbnails";
  const infoLayout   = storeSettings.productInfoLayout ?? "accordion";
  const showRelated  = storeSettings.showRelatedProducts ?? true;
  const relatedCount = storeSettings.relatedProductsCount ?? 4;
  const zoomEnabled  = storeSettings.showProductZoom ?? true;
  const shareEnabled = storeSettings.showShareButtons ?? true;
  const wishlistEnabled = storeSettings.showWishlist ?? false;
  const stockBadgeOn = storeSettings.stockBadge ?? true;
  const stockThreshold = storeSettings.stockBadgeThreshold ?? 5;
  const ratingsEnabled = storeSettings.showRatings ?? true;
  const buyNowEnabled  = storeSettings.showBuyNow ?? true;
  const trustRowEnabled = storeSettings.productTrustBadges ?? true;

  const baseCurrency = storeSettings.baseCurrency || "USD";
  const currencyOptions = Array.from(new Set([baseCurrency, ...(storeSettings.enabledCurrencies ?? [])]));
  const showCurrencySwitcher = !!storeSettings.showCurrencySwitcher && currencyOptions.length > 1;
  const cur = useDisplayCurrency(baseCurrency, currencyOptions);
  const fmt = cur.fmt;

  // Funnel analytics: a product page view is the top of the purchase funnel.
  useEffect(() => {
    trackEvent("view_item", { value: product.price, items: [{ item_id: product.id, item_name: product.name, price: product.price }] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Image zoom lightbox, wishlist heart & share button state.
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!wishlistEnabled) return;
    fetch("/api/wishlist")
      .then(r => r.json())
      .then(d => setWishlisted(((d.productIds ?? []) as string[]).includes(product.id)))
      .catch(() => {});
  }, [wishlistEnabled, product.id]);

  useEffect(() => {
    if (!zoomSrc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomSrc]);

  const toggleWishlist = async () => {
    if (wishBusy) return;
    setWishBusy(true);
    try {
      const res = wishlisted
        ? await fetch(`/api/wishlist?productId=${product.id}`, { method: "DELETE" })
        : await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/${user.username}/store/products/${product.id}`);
        return;
      }
      if (res.ok) setWishlisted(w => !w);
    } finally {
      setWishBusy(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: product.name, url }); return; } catch { return; /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {}
  };

  // Sticky add-to-cart: visible once the main buy row has scrolled above the fold.
  const buyRowRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = buyRowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const [reviews, setReviews] = useState<Review[]>(product.reviews);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const alreadyReviewed = !!currentUserId && reviews.some(r => r.author.id === currentUserId);

  // Group variants by optionType
  const variantGroups = useMemo(() => {
    const map: Record<string, Variant[]> = {};
    for (const v of product.variants) {
      if (!map[v.optionType]) map[v.optionType] = [];
      map[v.optionType].push(v);
    }
    return Object.entries(map);
  }, [product.variants]);

  const selectedVariantObj = useMemo(() => {
    if (variantGroups.length === 0) return null;
    for (const [type, variants] of variantGroups) {
      const sel = selectedVariants[type];
      if (sel) {
        const found = variants.find(v => v.id === sel);
        if (found?.price != null) return found;
      }
    }
    return null;
  }, [selectedVariants, variantGroups]);

  // Image of the currently-selected variant (if any has one), overrides the
  // main gallery image so picking e.g. a colour swaps the hero photo.
  const activeVariantImage = useMemo(() => {
    for (const [type, variants] of variantGroups) {
      const sel = selectedVariants[type];
      if (sel) {
        const found = variants.find(v => v.id === sel);
        if (found?.image) return found.image;
      }
    }
    return null;
  }, [selectedVariants, variantGroups]);

  const displayPrice = selectedVariantObj?.price ?? product.price;
  const discount = product.comparePrice && product.comparePrice > displayPrice
    ? Math.round((1 - displayPrice / product.comparePrice) * 100)
    : null;

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;

  const allVariantsSelected = variantGroups.every(([type]) => selectedVariants[type]);
  const canAddToCart = variantGroups.length === 0 || allVariantsSelected;

  const images = product.images.length > 0 ? product.images : [];

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    trackEvent("add_to_cart", { value: displayPrice * qty, items: [{ item_id: product.id, item_name: product.name, price: displayPrice, quantity: qty }] });
    setAdding(true);
    try {
      const cartKey = `cart_${user.username}`;
      const existing: { product: { id: string; name: string; price: number; comparePrice: number | null; images: string[]; type: string; inventory: number | null }; quantity: number }[] =
        JSON.parse(localStorage.getItem(cartKey) ?? "[]");
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: displayPrice,
        comparePrice: product.comparePrice,
        images: product.images,
        type: product.type,
        inventory: product.inventory,
      };
      const idx = existing.findIndex(i => i.product.id === product.id);
      if (idx >= 0) {
        existing[idx].quantity += qty;
      } else {
        existing.push({ product: cartProduct, quantity: qty });
      }
      localStorage.setItem(cartKey, JSON.stringify(existing));
      setAdded(true);
      setTimeout(() => { setAdding(false); setAdded(false); }, 1500);
    } catch {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!canAddToCart || !sellerHasPayments) return;
    trackEvent("begin_checkout", { value: displayPrice * qty, items: [{ item_id: product.id, item_name: product.name, price: displayPrice, quantity: qty }] });
    setBuyingNow(true);
    setBuyNowError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: qty }],
          creatorUsername: user.username,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setBuyNowError(err.message ?? "Something went wrong");
    } finally {
      setBuyingNow(false);
    }
  };

  const toggle = (key: string) => setOpenSection(o => o === key ? null : key);

  const handleSubmitReview = async () => {
    if (!reviewRating) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      setReviews(prev => [data, ...prev]);
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment("");
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReply = async (reviewId: string) => {
    setReplySaving(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, sellerReply: updated.sellerReply, sellerRepliedAt: updated.sellerRepliedAt } : r));
        setReplyingTo(null);
        setReplyText("");
      }
    } finally {
      setReplySaving(false);
    }
  };

  const typeMeta = TYPE_META[product.type];
  const TypeIcon = typeMeta?.icon;

  return (
    <div className={`min-h-screen ${fontClass}`} style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Nav */}
      <header className="border-b sticky top-0 z-40" style={{ borderColor: theme.border, background: theme.navBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-4">
          <Link href={`/${user.username}/store`} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: theme.muted }}>
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </Link>
          <span style={{ color: theme.border }}>·</span>
          <span className="text-sm" style={{ color: theme.muted }}>{user.name ?? user.username}</span>
          <span style={{ color: theme.border }}>·</span>
          <span className="text-sm line-clamp-1" style={{ color: theme.text }}>{product.name}</span>
          {showCurrencySwitcher && (
            <div className="ml-auto">
              <CurrencySwitcher code={cur.code} options={currencyOptions} onChange={cur.set} accent={accent} textColor={theme.text} />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* ── Left: Image gallery ── */}
          {galleryStyle === "stacked" ? (
            /* Stacked, every image full width, scrolling down */
            <div className="flex flex-col gap-3">
              {(images.length ? images : [null]).map((img, i) => (
                <div key={i} className={`aspect-[3/4] rounded-2xl overflow-hidden relative ${img && zoomEnabled ? "cursor-zoom-in" : ""}`} style={{ background: cardBg }}
                  onClick={() => img && zoomEnabled && setZoomSrc(img)}>
                  {img
                    ? <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">{TypeIcon && <TypeIcon className="w-24 h-24 opacity-20" />}</div>}
                  {i === 0 && discount && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold" style={{ background: accent, color: "#fff" }}>-{discount}%</div>
                  )}
                </div>
              ))}
            </div>
          ) : galleryStyle === "grid" ? (
            /* Grid – 2-column mosaic of all images */
            <div className="grid grid-cols-2 gap-3">
              {(images.length ? images : [null]).map((img, i) => (
                <div key={i} className={`aspect-square rounded-2xl overflow-hidden relative ${i === 0 && images.length > 1 ? "col-span-2 aspect-[3/2]" : ""} ${img && zoomEnabled ? "cursor-zoom-in" : ""}`} style={{ background: cardBg }}
                  onClick={() => img && zoomEnabled && setZoomSrc(img)}>
                  {img
                    ? <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">{TypeIcon && <TypeIcon className="w-16 h-16 opacity-20" />}</div>}
                  {i === 0 && discount && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold" style={{ background: accent, color: "#fff" }}>-{discount}%</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Thumbnails (default), thumb strip + main image */
            <div className="flex gap-3">
              {images.length > 1 && (
                <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0"
                      style={{ borderColor: activeImage === i ? accent : theme.border }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className={`flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 relative group ${zoomEnabled && (activeVariantImage || images.length > 0) ? "cursor-zoom-in" : ""}`} style={{ background: cardBg }}
                onClick={() => { const src = activeVariantImage || images[activeImage]; if (zoomEnabled && src) setZoomSrc(src); }}>
                {activeVariantImage ? (
                  <img src={activeVariantImage} alt={product.name} className="w-full h-full object-cover" />
                ) : images.length > 0 ? (
                  <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {TypeIcon && <TypeIcon className="w-24 h-24 opacity-20" />}
                  </div>
                )}
                {zoomEnabled && (activeVariantImage || images.length > 0) && (
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                )}
                {discount && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold" style={{ background: accent, color: "#fff" }}>
                    -{discount}%
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Right: Product info ── */}
          <div className="flex flex-col">
            {/* Type badge */}
            {typeMeta && (
              <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: theme.muted }}>
                {TypeIcon && <TypeIcon className="w-3.5 h-3.5" />}
                {typeMeta.label}
              </div>
            )}

            {/* Name + save/share actions */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: "inherit", color: theme.text }}>
                {product.name}
              </h1>
              {(wishlistEnabled || shareEnabled) && (
                <div className="flex items-center gap-2 flex-shrink-0 mt-1.5">
                  {wishlistEnabled && (
                    <button onClick={toggleWishlist} disabled={wishBusy}
                      title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                      className="w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105"
                      style={{ borderColor: wishlisted ? accent : theme.border, color: wishlisted ? accent : theme.muted, background: wishlisted ? `${accent}12` : theme.surface }}>
                      <Heart className="w-4 h-4" fill={wishlisted ? accent : "none"} />
                    </button>
                  )}
                  {shareEnabled && (
                    <button onClick={handleShare}
                      title="Share this product"
                      className="w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105"
                      style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
                      {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rating */}
            {ratingsEnabled && avgRating && (
              <div className="flex items-center gap-1.5 mb-4">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-4 h-4" fill={s <= Math.round(avgRating) ? accent : "none"} style={{ color: accent }} />
                ))}
                <span className="text-sm" style={{ color: theme.muted }}>({product.reviews.length})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold" style={{ color: theme.text }}>{fmt(displayPrice)}</span>
              {product.comparePrice && (
                <span className="text-lg line-through" style={{ color: theme.muted }}>{fmt(product.comparePrice)}</span>
              )}
              {discount && (
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Variant selectors */}
            {variantGroups.map(([optionType, variants]) => (
              <div key={optionType} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{optionType}</span>
                  {selectedVariants[optionType] && (
                    <span className="text-sm" style={{ color: theme.muted }}>
                      {variants.find(v => v.id === selectedVariants[optionType])?.name}
                    </span>
                  )}
                </div>
                {optionType.toLowerCase() === "color" ? (
                  <div className="flex flex-wrap gap-2">
                    {variants.map(v => {
                      const isSelected = selectedVariants[optionType] === v.id;
                      return (
                        <button key={v.id} onClick={() => setSelectedVariants(s => ({ ...s, [optionType]: v.id }))}
                          title={v.name}
                          className="w-9 h-9 rounded-full border-2 transition-all relative"
                          style={{
                            background: v.colorHex ?? "#ccc",
                            borderColor: isSelected ? accent : "transparent",
                            outline: isSelected ? `2px solid ${accent}` : "2px solid transparent",
                            outlineOffset: 2,
                          }}>
                          {isSelected && <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {variants.map(v => {
                      const isSelected = selectedVariants[optionType] === v.id;
                      const outOfStock = v.inventory != null && v.inventory <= 0;
                      return (
                        <button key={v.id} disabled={outOfStock}
                          onClick={() => setSelectedVariants(s => ({ ...s, [optionType]: v.id }))}
                          className={`px-4 py-2 text-sm border-2 transition-all ${btnStyle.radius} ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                          style={{
                            borderColor: isSelected ? accent : theme.border,
                            background: isSelected ? `${accent}15` : cardBg,
                            color: isSelected ? accent : theme.text,
                            fontWeight: isSelected ? 600 : 400,
                          }}>
                          {v.name}
                          {v.price != null && v.price !== product.price && (
                            <span className="ml-1.5 text-xs" style={{ color: theme.muted }}>+{fmt(v.price - product.price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Stock status (threshold for "Only X left" is configurable) */}
            {stockBadgeOn && product.inventory != null && (
              <div className="flex items-center gap-1.5 text-sm mb-5">
                <div className={`w-2 h-2 rounded-full ${product.inventory > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                <span style={{ color: theme.muted }}>
                  {product.inventory <= 0 ? "Out of stock" : product.inventory <= stockThreshold ? `Only ${product.inventory} left` : "In stock"}
                </span>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex gap-3 mb-4" ref={buyRowRef}>
              <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: theme.border }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-3 hover:opacity-70 transition-opacity text-lg leading-none" style={{ color: theme.text }}>−</button>
                <span className="w-10 text-center text-sm font-medium" style={{ color: theme.text }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="px-3 py-3 hover:opacity-70 transition-opacity text-lg leading-none" style={{ color: theme.text }}>+</button>
              </div>
              <button onClick={handleAddToCart} disabled={adding || !canAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${btnStyle.radius} ${!canAddToCart ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ background: theme.dark ? "#fff" : "#111", color: theme.dark ? "#111" : "#fff" }}>
                {added ? <><Check className="w-4 h-4" />Added!</> : <><ShoppingBag className="w-4 h-4" />Add to bag</>}
              </button>
            </div>

            {/* Image zoom lightbox */}
            {zoomSrc && (
              <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomSrc(null)}>
                <button onClick={() => setZoomSrc(null)} aria-label="Close zoom"
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <img src={zoomSrc} alt={product.name} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
              </div>
            )}

            {/* Sticky add-to-cart: appears once the main buy row scrolls out of
                view, so the purchase action is always one tap away (mobile-first). */}
            {(storeSettings.stickyAddToCart ?? false) && showStickyBar && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 flex items-center gap-3"
                style={{ background: theme.surface, borderColor: theme.border, boxShadow: "0 -6px 24px rgba(0,0,0,0.08)" }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: theme.surfaceHover }}>
                  {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{product.name}</p>
                  <p className="text-xs font-bold" style={{ color: accent }}>{fmt(displayPrice)}</p>
                </div>
                <button onClick={handleAddToCart} disabled={adding || !canAddToCart}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold flex-shrink-0 transition-all ${btnStyle.radius} ${!canAddToCart ? "opacity-50" : ""}`}
                  style={{ background: accent, color: "#fff" }}>
                  {added ? <><Check className="w-4 h-4" />Added!</> : <><ShoppingBag className="w-4 h-4" />Add to bag</>}
                </button>
              </div>
            )}

            {/* Buy now */}
            {buyNowEnabled && sellerHasPayments && (
              <div className="mb-6">
                <button onClick={handleBuyNow} disabled={!canAddToCart || buyingNow}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold border-2 transition-all ${btnStyle.radius} ${(!canAddToCart || buyingNow) ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ borderColor: accent, color: accent, background: `${accent}10` }}>
                  {buyingNow
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                    : <><Zap className="w-4 h-4" />Buy now</>}
                </button>
                {buyNowError && (
                  <p className="mt-2 text-xs text-red-500">{buyNowError}</p>
                )}
              </div>
            )}

            {/* Trust badges */}
            {trustRowEnabled && (
              <div className="grid grid-cols-3 gap-3 mb-6 py-4 border-t border-b" style={{ borderColor: theme.border }}>
                {[
                  { icon: Shield, label: "Secure checkout" },
                  { icon: RotateCcw, label: "Easy returns" },
                  { icon: product.type === "DIGITAL" ? Download : Truck, label: product.type === "DIGITAL" ? "Instant delivery" : "Fast shipping" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <Icon className="w-4 h-4" style={{ color: theme.muted }} />
                    <span className="text-xs" style={{ color: theme.muted }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Description / details, accordion or tabs (store setting) */}
            {(() => {
              const specRows = (Array.isArray(product.metafields) ? product.metafields : [])
                .filter((m): m is { label: string; value: string } => !!m && typeof m.label === "string" && !!m.label.trim());
              const specsContent = specRows.length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map((m, i) => (
                      <tr key={i} className="border-b last:border-0" style={{ borderColor: theme.border }}>
                        <td className="py-2.5 pr-4 font-medium align-top" style={{ color: theme.text }}>{m.label}</td>
                        <td className="py-2.5 align-top" style={{ color: theme.muted }}>{m.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null;
              const infoSections: { key: string; label: string; content: ReactNode }[] = [
                { key: "description", label: "Description", content: product.description },
                ...(specsContent ? [{ key: "specs", label: "Specifications", content: specsContent }] : []),
                { key: "returns", label: "Returns & Refunds", content: (storeSettings.policies as Record<string, string>)?.returns || "Please contact us within 14 days of purchase for a refund or exchange." },
              ].filter(s => s.content);
              if (infoSections.length === 0) return null;

              if (infoLayout === "tabs") {
                const active = infoSections.find(s => s.key === openSection) ?? infoSections[0];
                return (
                  <div>
                    <div className="flex gap-1 border-b" style={{ borderColor: theme.border }}>
                      {infoSections.map(({ key, label }) => (
                        <button key={key} onClick={() => setOpenSection(key)}
                          className="px-4 py-3 text-sm font-medium -mb-px border-b-2 transition-colors"
                          style={{ color: active.key === key ? theme.text : theme.muted, borderColor: active.key === key ? accent : "transparent" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="py-4 text-sm leading-relaxed" style={{ color: theme.muted }}>{active.content}</div>
                  </div>
                );
              }

              return infoSections.map(({ key, label, content }) => (
                <div key={key} className="border-b" style={{ borderColor: theme.border }}>
                  <button onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between py-4 text-sm font-medium"
                    style={{ color: theme.text }}>
                    {label}
                    {openSection === key ? <ChevronUp className="w-4 h-4" style={{ color: theme.muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: theme.muted }} />}
                  </button>
                  {openSection === key && (
                    <div className="pb-4 text-sm leading-relaxed" style={{ color: theme.muted }}>{content}</div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 border-t pt-12" style={{ borderColor: theme.border }}>
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>
              Reviews
            </h2>
            <span className="text-sm" style={{ color: theme.muted }}>
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Write a review */}
          {currentUserId && !isOwner && !alreadyReviewed && !reviewSuccess && (
            <div className="mb-10 p-5 rounded-2xl border" style={{ borderColor: theme.border, background: theme.surface }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Write a review</h3>
              {/* Star picker */}
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onClick={() => setReviewRating(s)}
                    onMouseEnter={() => setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    className="transition-transform hover:scale-110">
                    <Star className="w-7 h-7" fill={(reviewHover || reviewRating) >= s ? accent : "none"} style={{ color: accent }} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={3}
                className="w-full text-sm rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 mb-3"
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text, focusRingColor: accent } as React.CSSProperties}
              />
              {reviewError && <p className="text-red-500 text-xs mb-3">{reviewError}</p>}
              <button
                onClick={handleSubmitReview}
                disabled={!reviewRating || submittingReview}
                className={`px-5 py-2.5 text-sm font-semibold ${btnStyle.radius} transition-all disabled:opacity-50`}
                style={{ background: accent, color: "#fff" }}>
                {submittingReview ? "Submitting…" : "Submit review"}
              </button>
            </div>
          )}

          {reviewSuccess && (
            <div className="mb-8 flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <Check className="w-4 h-4" /> Review submitted, thank you!
            </div>
          )}

          {alreadyReviewed && !reviewSuccess && (
            <p className="text-sm mb-8" style={{ color: theme.muted }}>You've already reviewed this product.</p>
          )}

          {!currentUserId && (
            <p className="text-sm mb-8" style={{ color: theme.muted }}>
              <Link href="/login" style={{ color: accent, textDecoration: "underline" }}>Sign in</Link> to leave a review.
            </p>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-sm" style={{ color: theme.muted }}>No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map(r => (
                <div key={r.id} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold overflow-hidden"
                    style={{ background: `${accent}20`, color: accent }}>
                    {r.author.image
                      ? <img src={r.author.image} alt={r.author.name ?? ""} className="w-full h-full object-cover" />
                      : (r.author.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: theme.text }}>{r.author.name ?? "Anonymous"}</span>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#059669" }}>
                          <Check className="w-2.5 h-2.5" /> Verified purchase
                        </span>
                      )}
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="w-3.5 h-3.5" fill={s <= r.rating ? accent : "none"} style={{ color: accent }} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm" style={{ color: theme.muted }}>{r.comment}</p>}

                    {/* Seller reply */}
                    {r.sellerReply && (
                      <div className="mt-2.5 ml-1 pl-3 border-l-2 rounded-r-lg py-2 pr-3" style={{ borderColor: accent, background: theme.surface }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: accent }}>Response from {user.name ?? "the seller"}</p>
                        <p className="text-sm" style={{ color: theme.muted }}>{r.sellerReply}</p>
                      </div>
                    )}

                    {/* Owner reply controls */}
                    {isOwner && (
                      replyingTo === r.id ? (
                        <div className="mt-2.5">
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                            placeholder="Write a public reply…"
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                            style={{ borderColor: theme.border, background: theme.surface, color: theme.text }} />
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={() => submitReply(r.id)} disabled={replySaving}
                              className={`px-3 py-1.5 text-xs font-semibold text-white ${btnStyle.radius} disabled:opacity-50`} style={{ background: accent }}>
                              {replySaving ? "Saving…" : "Post reply"}
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="px-3 py-1.5 text-xs font-medium" style={{ color: theme.muted }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReplyingTo(r.id); setReplyText(r.sellerReply ?? ""); }}
                          className="mt-2 text-xs font-medium hover:underline" style={{ color: accent }}>
                          {r.sellerReply ? "Edit reply" : "Reply"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        {showRelated && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "inherit", color: theme.text }}>
              You might also like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.slice(0, relatedCount).map(p => (
                <Link key={p.id} href={`/${user.username}/store/products/${p.id}`}
                  className="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: theme.border, background: cardBg }}>
                  <div className="aspect-square overflow-hidden bg-gray-100" style={{ background: theme.bg }}>
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center opacity-20"><Package className="w-8 h-8" /></div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-1" style={{ color: theme.text }}>{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold" style={{ color: accent }}>{fmt(p.price)}</span>
                      {p.comparePrice && <span className="text-xs line-through" style={{ color: theme.muted }}>{fmt(p.comparePrice)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner-configured custom product-page sections (full width) */}
      <StoreSections
        sections={storeSettings.productSections ?? []}
        theme={theme}
        accent={accent}
        accentText={readableTextOn(accent)}
        products={relatedProducts.map(p => ({ id: p.id, name: p.name, price: p.price, images: p.images }))}
        username={user.username ?? ""}
        formatCurrency={fmt}
        btnRadius={btnStyle.radius}
      />
    </div>
  );
}
