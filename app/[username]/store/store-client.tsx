"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingCart, X, Plus, Minus, Download,
  Loader2, Check, Shield, Truck, Star, RefreshCw, Package,
  Globe, Briefcase, Search, ChevronLeft, ChevronRight, Zap, Settings, ChevronDown, SlidersHorizontal,
  Heart, ZoomIn,
} from "lucide-react";
import {
  STORE_THEMES, BUTTON_STYLES, CARD_STYLES, LAYOUTS, IMAGE_RATIOS, FONT_STYLES,
  HERO_SIZES, HERO_TEXT_ALIGNS, NAV_HEIGHTS,
  type StoreSettings, type CustomButton, type HeroItem,
} from "@/lib/store-themes";
import { StoreSections } from "./store-sections";
import { isCoreItem, defaultHomeLayout, type LayoutItem } from "@/lib/store-sections";
import { useDisplayCurrency, useFmt, CurrencyProvider, CurrencySwitcher } from "./currency";
import { StoreScripts } from "./store-scripts";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface StoreClientProps {
  user: { name: string | null; username: string; image: string | null; bio: string | null };
  storeSettings: StoreSettings;
  products: Product[];
  isOwner: boolean;
  sellerHasPayments: boolean;
  isPreview?: boolean;
  collections?: { name: string; slug: string }[];
  currentUserId?: string | null;
  initialWishlist?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Readable text/icon color for content placed ON a colored background.
// Returns dark text for light colors (white/yellow) so labels stay visible.
function readableTextOn(hex: string): string {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(f.slice(0, 2), 16) || 0;
  const g = parseInt(f.slice(2, 4), 16) || 0;
  const b = parseInt(f.slice(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#111111" : "#ffffff";
}

type TypeMetaEntry = { label: string; icon: React.ComponentType<{ className?: string }>; delivery: string };
const TYPE_META: Record<string, TypeMetaEntry> = {
  DIGITAL:      { label: "Digital",      icon: Download,   delivery: "Instant download after purchase" },
  PHYSICAL:     { label: "Physical",     icon: Package,    delivery: "Ships in 3–5 business days" },
  SERVICE:      { label: "Service",      icon: Briefcase,  delivery: "Scheduled after booking" },
  SUBSCRIPTION: { label: "Subscription", icon: RefreshCw,  delivery: "Access starts immediately" },
};
function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = TYPE_META[type]?.icon;
  return Icon ? <Icon className={className} /> : null;
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  { id: "__ph1", name: "Digital Download",     description: "A sample digital product",    price: 29,  comparePrice: 49,  type: "DIGITAL",      images: [], inventory: null },
  { id: "__ph2", name: "Online Course",         description: "A sample course bundle",      price: 97,  comparePrice: 147, type: "DIGITAL",      images: [], inventory: null },
  { id: "__ph3", name: "1-on-1 Consultation",  description: "A sample service offering",   price: 150, comparePrice: null, type: "SERVICE",     images: [], inventory: null },
  { id: "__ph4", name: "Monthly Membership",    description: "A sample subscription tier",  price: 19,  comparePrice: null, type: "SUBSCRIPTION", images: [], inventory: null },
  { id: "__ph5", name: "Template Pack",         description: "A sample template bundle",    price: 35,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "__ph6", name: "Strategy Session",      description: "A sample strategy call",      price: 200, comparePrice: null, type: "SERVICE",      images: [], inventory: null },
  { id: "__ph7", name: "Preset Collection",     description: "A sample preset pack",        price: 24,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "__ph8", name: "Pro Mentorship",        description: "A sample mentorship package", price: 299, comparePrice: null, type: "SERVICE",      images: [], inventory: null },
];

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <span className="text-xs font-bold">IG</span>,
  twitter:   <span className="text-xs font-bold">X</span>,
  tiktok:    <span className="text-xs font-bold">TT</span>,
  youtube:   <span className="text-xs font-bold">YT</span>,
  linkedin:  <span className="text-xs font-bold">in</span>,
  website:   <Globe className="w-4 h-4" />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function bgEffectStyle(effect: string, dark: boolean, accent: string): React.CSSProperties {
  // Theme-aware texture, applied to a fixed full-viewport layer that sits behind
  // all content (see the root render). Dark themes swallow low-opacity texture,
  // so they get more weight than light ones to stay clearly visible.
  if (effect === "dots") {
    // Dots are tiny points, so they need more weight than lines to read.
    const c = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
    return { backgroundImage: `radial-gradient(${c} 1.7px, transparent 1.8px)`, backgroundSize: "22px 22px" };
  }
  if (effect === "lines") {
    const c = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)";
    return { backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: "30px 30px" };
  }
  if (effect === "gradient")
    // Anchored to the top of the (fixed) viewport so the accent glow stays
    // visible in the content area while scrolling — not buried behind the hero.
    return { backgroundImage: `radial-gradient(ellipse 120% 70% at 50% 0%, ${accent}33 0%, transparent 60%)` };
  return {};
}

// Parse a CSS color (hex or rgb/rgba) into [r,g,b,a].
function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith("rgb")) {
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
    return [m[0] ?? 0, m[1] ?? 0, m[2] ?? 0, m[3] ?? 1];
  }
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.padEnd(6, "0");
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0, 1];
}

// Flatten a (possibly translucent) foreground color over an opaque background so
// a background texture can't bleed through cards/badges that use it.
function compositeOver(bg: string, fg: string): string {
  const [fr, fg_, fb, fa] = parseColor(fg);
  if (fa >= 1) return fg;
  const [br, bg_, bb] = parseColor(bg);
  const r = Math.round(br * (1 - fa) + fr * fa);
  const g = Math.round(bg_ * (1 - fa) + fg_ * fa);
  const b = Math.round(bb * (1 - fa) + fb * fa);
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StoreClient({ user, storeSettings, products, isOwner, sellerHasPayments, isPreview = false, collections = [], currentUserId = null, initialWishlist = [] }: StoreClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Keep a live copy of settings updated directly from the API so heroSize
  // and other visual settings always reflect DB state without relying on
  // router.refresh() successfully re-delivering server component props.
  const [liveSettings, setLiveSettings] = useState<StoreSettings>(storeSettings);

  const rawTheme  = STORE_THEMES[liveSettings.theme]        ?? STORE_THEMES.default;
  // When a background texture is active, flatten translucent surface colors over
  // the page bg so the texture sits BEHIND cards/buttons (showing in the gaps),
  // never bleeding THROUGH them. No effect = leave the theme untouched.
  const theme     = (liveSettings.backgroundEffect ?? "none") === "none"
    ? rawTheme
    : { ...rawTheme, surface: compositeOver(rawTheme.bg, rawTheme.surface), surfaceHover: compositeOver(rawTheme.bg, rawTheme.surfaceHover) };
  const btnStyle  = BUTTON_STYLES[liveSettings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const cardStyle = CARD_STYLES[liveSettings.cardStyle]     ?? CARD_STYLES.shadow;
  const layout    = LAYOUTS[liveSettings.layout]            ?? LAYOUTS.grid;
  const imgRatio  = IMAGE_RATIOS[liveSettings.imageRatio]   ?? IMAGE_RATIOS.square;
  const fontClass = (FONT_STYLES[liveSettings.fontStyle]    ?? FONT_STYLES.modern).className;
  const accent    = liveSettings.primaryColor;
  const accentText = readableTextOn(accent);

  const cartBehavior = liveSettings.cartBehavior ?? "drawer";
  const openCart = () => {
    if (cartBehavior === "page") router.push(`/${user.username}/store/cart`);
    else setCartOpen(true);
  };

  // Editor mode: when rendered inside the customize iframe (?preview=1), clicking
  // a section selects it — we postMessage the section id up to the customizer,
  // which opens the matching panel. Click-to-edit, across the iframe boundary.
  //
  // This must be scoped to the iframe ONLY. The real storefront is always a
  // top-level window, so requiring `isEmbedded` guarantees the editor chrome
  // (click interception + hover outline) never leaks onto the live site — even
  // for the logged-in owner, and even if a stale ?preview=1 is in the URL.
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    try { setIsEmbedded(window.self !== window.top); } catch { setIsEmbedded(true); }
  }, []);
  const previewEdit = isOwner && isEmbedded && (isPreview || searchParams.get("preview") === "1");
  const onPreviewClick = useCallback((e: React.MouseEvent) => {
    if (!previewEdit) return;
    const target = e.target as HTMLElement;
    // Let form fields stay usable even inside the editor preview.
    if (target.closest("input, textarea, select")) return;
    const el = target.closest("[data-edit-section]");
    const section = el?.getAttribute("data-edit-section");
    if (!section) return;
    e.preventDefault();
    e.stopPropagation();
    try { window.parent?.postMessage({ type: "nexus_edit_section", section }, "*"); } catch {}
  }, [previewEdit]);

  // Multi-currency display: shopper-selected currency, converted from the base.
  const baseCurrency = liveSettings.baseCurrency || "USD";
  const currencyOptions = Array.from(new Set([baseCurrency, ...(liveSettings.enabledCurrencies ?? [])]));
  const showCurrencySwitcher = !!liveSettings.showCurrencySwitcher && currencyOptions.length > 1;
  const cur = useDisplayCurrency(baseCurrency, currencyOptions);
  const fmt = cur.fmt;

  // "storefront" is the new default; treat it identically to "centered" for backward compat
  const heroStyle  = (liveSettings.heroStyle === "storefront" || !liveSettings.heroStyle)
    ? "storefront"
    : liveSettings.heroStyle;
  const navStyle   = liveSettings.navStyle   ?? "default";
  const footerStyle = liveSettings.footerStyle ?? "standard";

  const heroSize       = HERO_SIZES[liveSettings.heroSize ?? "large"]           ?? HERO_SIZES.large;
  const heroTextAlign  = HERO_TEXT_ALIGNS[liveSettings.heroTextAlign ?? "left"] ?? HERO_TEXT_ALIGNS.left;
  const navHeightPx    = (NAV_HEIGHTS[liveSettings.navHeight ?? "default"] ?? NAV_HEIGHTS.default).px;
  const ctaLabel       = liveSettings.ctaText ?? "Shop Now";
  const heroOverlay    = liveSettings.heroOverlay ?? 50;
  const showNewsletter = liveSettings.showNewsletter ?? false;
  const customButtons  = (liveSettings.customButtons ?? []) as CustomButton[];

  // New settings
  const stickyHeader   = liveSettings.stickyHeader ?? true;
  const tickerEnabled  = liveSettings.tickerEnabled ?? false;
  const tickerText     = liveSettings.tickerText ?? null;
  const tickerSpeed    = liveSettings.tickerSpeed ?? "normal";
  const showSaleBadge  = liveSettings.showSaleBadge ?? true;
  const showNewBadge   = liveSettings.showNewBadge ?? false;
  const showQuickAdd   = liveSettings.showQuickAdd ?? true;
  const showProductType = liveSettings.showProductType ?? true;
  const showTrustBar   = liveSettings.showTrustBar ?? true;
  const trustBadges    = (liveSettings.trustBadges ?? []).length > 0
    ? (liveSettings.trustBadges ?? [])
    : ["Secure Checkout", "Instant Delivery", "30-Day Returns"];
  const customCss      = liveSettings.customCss ?? null;
  const typographyScale = liveSettings.typographyScale ?? "normal";

  const showProductZoom       = liveSettings.showProductZoom ?? true;
  const showFreeShippingBar   = liveSettings.showFreeShippingBar ?? false;
  const freeShippingThreshold = liveSettings.freeShippingThreshold ?? 50;
  const cartNote              = liveSettings.cartNote ?? false;
  const showShareButtons      = liveSettings.showShareButtons ?? true;
  const stockBadge            = liveSettings.stockBadge ?? true;
  const stockBadgeThreshold   = liveSettings.stockBadgeThreshold ?? 5;
  const showPaymentIcons      = liveSettings.showPaymentIcons ?? true;
  const popupEnabled          = liveSettings.popupEnabled ?? false;
  const popupTitle            = liveSettings.popupTitle ?? null;
  const popupDelay            = liveSettings.popupDelay ?? 5;
  const testimonialsEnabled   = liveSettings.testimonialsEnabled ?? false;
  const testimonialItems      = liveSettings.testimonialItems ?? [];
  const imageBannerEnabled    = liveSettings.imageBannerEnabled ?? false;
  const imageBannerHeading    = liveSettings.imageBannerHeading ?? null;
  const imageBannerText       = liveSettings.imageBannerText ?? null;
  const imageBannerImage      = liveSettings.imageBannerImage ?? null;
  const imageBannerCtaText    = liveSettings.imageBannerCtaText ?? null;
  const imageBannerLayout     = liveSettings.imageBannerLayout ?? "left";
  const iconRowEnabled        = liveSettings.iconRowEnabled ?? false;
  const iconRowItems          = liveSettings.iconRowItems ?? [];

  const [scrolled, setScrolled] = useState(false);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter]       = useState("ALL");
  const [sort, setSort]           = useState("recommended");
  const [sortOpen, setSortOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);
  const [cartNoteText, setCartNoteText] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const subscribeEmail = useCallback(async (email: string): Promise<boolean> => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { showToast("error", "Enter a valid email"); return false; }
    if (isPreview) { showToast("success", "You're subscribed!"); return true; }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorUsername: user.username, email: clean }),
      });
      if (res.ok) { showToast("success", "You're subscribed!"); return true; }
      const data = await res.json().catch(() => ({}));
      showToast("error", data.error ?? "Could not subscribe");
      return false;
    } catch {
      showToast("error", "Could not subscribe");
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [isPreview, user.username, showToast]);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set(initialWishlist));

  const toggleWishlist = useCallback((productId: string) => {
    if (isPreview) return;
    if (!currentUserId) { router.push(`/login?callbackUrl=/${user.username}/store`); return; }
    setWishlist(prev => {
      const next = new Set(prev);
      const adding = !next.has(productId);
      if (adding) next.add(productId); else next.delete(productId);
      // Persist optimistically.
      fetch(adding ? "/api/wishlist" : `/api/wishlist?productId=${productId}`, {
        method: adding ? "POST" : "DELETE",
        ...(adding ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) } : {}),
      }).catch(() => {});
      return next;
    });
  }, [currentUserId, isPreview, router, user.username]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cart_${user.username}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Drop any stale items that don't have the expected { product, quantity } shape
        const valid = (Array.isArray(parsed) ? parsed : []).filter(
          (i: unknown) => i != null && typeof i === "object" && "product" in (i as object) && (i as { product?: unknown }).product != null
        );
        // Hydrating cart from localStorage on mount — must run client-side.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(valid);
        if (valid.length !== parsed?.length) {
          localStorage.setItem(`cart_${user.username}`, JSON.stringify(valid));
        }
      }
    } catch {}
    setCartLoaded(true);
  }, [user.username]);

  useEffect(() => {
    if (searchParams.get("stripe") === "success") {
      // Reacting to the post-checkout redirect (an external navigation result).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart([]);
      localStorage.removeItem(`cart_${user.username}`);
      showToast("success", "Payment successful! Check your email for confirmation.");
      // Verify the Stripe session and create the local order.
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});
      }
      router.replace(`/${user.username}/store`);
    } else if (searchParams.get("stripe") === "cancelled") {
      showToast("error", "Checkout was cancelled.");
      router.replace(`/${user.username}/store`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cartLoaded) localStorage.setItem(`cart_${user.username}`, JSON.stringify(cart));
  }, [cart, cartLoaded, user.username]);

  // Owner-only: keep the storefront in sync with the customize editor.
  // In PREVIEW mode (the customize iframe / ?preview=1) the BroadcastChannel is
  // the source of truth — we never poll the live columns there, otherwise the
  // 1.5s poll would clobber in-progress edits. In a normal owner tab we poll the
  // live (published) columns so the page reflects publishes.
  useEffect(() => {
    if (!isOwner) return;
    const previewMode = isPreview || searchParams.get("preview") === "1";

    // The broadcast carries the editor's live (unsaved) state, which is fresher
    // than the debounced draft on the server. While edits are streaming in, the
    // draft poll must NOT run — otherwise it reverts to a stale draft and the
    // change appears to "glitch" back. The poll only acts once editing settles.
    let lastBroadcastAt = 0;

    const loadFromDraft = async () => {
      if (Date.now() - lastBroadcastAt < 2500) return; // a broadcast just won
      try {
        const res = await fetch("/api/store/settings", { cache: "no-store" });
        if (!res.ok) return;
        if (Date.now() - lastBroadcastAt < 2500) return; // raced with a broadcast
        const data = await res.json();
        if (data?.draftSettings && typeof data.draftSettings === "object") {
          setLiveSettings(prev => ({ ...prev, ...data.draftSettings }));
        }
      } catch {}
    };
    const loadFromLive = async () => {
      try {
        const res = await fetch("/api/store/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || Object.keys(data).length === 0) return;
        setLiveSettings(prev => ({ ...prev, ...data }));
      } catch {}
    };

    // Instant updates from the customize editor.
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("nexus_store_preview");
      bc.onmessage = (e: MessageEvent) => {
        if (e.data?.type === "settings_update" && e.data?.settings) {
          lastBroadcastAt = Date.now();
          setLiveSettings((prev) => ({ ...prev, ...e.data.settings }));
        } else if (previewMode) {
          loadFromDraft();
        } else {
          loadFromLive();
        }
      };
    } catch {}

    let id: ReturnType<typeof setInterval> | undefined;
    if (previewMode) {
      // Broadcast gives near-instant updates; the draft-only poll reliably
      // converges the preview to the saved draft (never the live columns, so
      // it can't clobber edits). This is what makes consecutive edits stick.
      loadFromDraft();
      id = setInterval(loadFromDraft, 1000);
    } else {
      loadFromLive();
      id = setInterval(loadFromLive, 1500);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== "nexus_settings_updated") return;
      if (previewMode) loadFromDraft(); else loadFromLive();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (id) clearInterval(id);
      try { bc?.close(); } catch {}
      window.removeEventListener("storage", onStorage);
    };
  }, [isOwner, isPreview, searchParams]);

  useEffect(() => {
    if (!popupEnabled || isOwner) return;
    const dismissed = localStorage.getItem(`nexus_popup_dismissed_${user.username}`);
    if (dismissed) return;
    const id = setTimeout(() => setPopupVisible(true), popupDelay * 1000);
    return () => clearTimeout(id);
  }, [popupEnabled, isOwner, popupDelay, user.username]);

  const getBtnHref = (btn: CustomButton): string => {
    if (btn.pageType === "portfolio") return `/${user.username}`;
    if (btn.pageType)                  return `/${user.username}/store/${btn.pageType}`;
    return btn.url || "#";
  };

  const addToCart = (product: Product) => {
    if (product.id.startsWith("__ph")) return;
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

  const isPlaceholder = products.length === 0;
  const activeProducts = isPlaceholder ? PLACEHOLDER_PRODUCTS : products;

  const featuredIds = (liveSettings.featuredIds ?? []) as string[];
  const availableTypes = Array.from(new Set(activeProducts.map(p => p.type)));
  const filteredProducts = (() => {
    let list = filter === "ALL" ? [...activeProducts] : activeProducts.filter(p => p.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.type ?? "").toLowerCase().includes(q)
      );
    }
    if (sort === "price-asc")  list = list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = list.sort((a, b) => b.price - a.price);
    if (sort === "newest")     list = list.sort((a, b) => a.id < b.id ? 1 : -1);
    if (sort === "sale")       list = list.sort((a, b) => (b.comparePrice ? 1 : 0) - (a.comparePrice ? 1 : 0));
    if (sort === "recommended" && featuredIds.length > 0) {
      list = [...list.filter(p => featuredIds.includes(p.id)), ...list.filter(p => !featuredIds.includes(p.id))];
    }
    return list;
  })();

  const displayName = liveSettings.name ?? user.name ?? user.username;
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const socialLinks  = liveSettings.socialLinks as Record<string, string>;
  const activeSocials = Object.entries(socialLinks).filter(([, v]) => v);
  const policies     = liveSettings.policies as Record<string, string>;

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, creatorUsername: user.username, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
        setPromoInput("");
      } else {
        setAppliedPromo(null);
        setPromoError(data.error ?? "Invalid code");
      }
    } catch {
      setPromoError("Could not validate code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => { setAppliedPromo(null); setPromoError(null); };

  // Keep an applied promo in sync as the cart total changes (refresh % amount,
  // or drop it if the order no longer qualifies).
  useEffect(() => {
    if (!appliedPromo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Nav style computations ─────────────────────────────────────────────────

  const isTransparentNav = navStyle === "transparent" || navStyle === "minimal" || navStyle === "transparent-colored";

  const isColoredOnScroll = navStyle === "transparent-colored";

  const navBg =
    navStyle === "colored"  ? accent :
    isTransparentNav        ? "transparent" :
    theme.navBg;

  // When scrolled: transparent-colored → accent; regular transparent → frosted glass
  const navBgScrolled = isColoredOnScroll
    ? accent
    : theme.dark ? "rgba(10,10,10,0.88)" : "rgba(255,255,255,0.88)";

  const navBorderColor =
    (isTransparentNav && !scrolled) ||
    navStyle === "colored" ||
    (isColoredOnScroll && scrolled)
      ? "transparent"
      : theme.border;

  // Heroes whose top sits on the THEME background (not a darkened image/gradient).
  // Over these, a transparent nav must use the theme's own text colour or it
  // vanishes on light themes — only the image/overlay heroes get forced white.
  const navOverThemeBg = ["editorial", "showcase", "split", "minimal"].includes(heroStyle);
  const transparentNavWhite = isTransparentNav && !scrolled && !navOverThemeBg;

  // Text is white when: always-colored, transparent-colored-scrolled, or
  // transparent-unscrolled over a dark image/overlay hero.
  const isWhiteText = navStyle === "colored" || (isColoredOnScroll && scrolled) || transparentNavWhite;
  const navTextColor  = isWhiteText ? "#ffffff" : theme.text;
  const navMutedColor = isWhiteText ? "rgba(255,255,255,0.75)" : theme.muted;
  // Drop-shadow for legibility only when text sits over a hero image.
  const navTextShadow = transparentNavWhite ? "0 1px 3px rgba(0,0,0,0.45)" : undefined;

  // ── Logo/avatar helper ─────────────────────────────────────────────────────

  const renderAvatar = (size: "sm" | "md" | "lg") => {
    const szMap = { sm: "w-7 h-7 text-xs", md: "w-16 h-16 text-xl", lg: "w-24 h-24 text-2xl" };
    const sz = szMap[size];
    if (liveSettings.logoImage)
      return <img src={liveSettings.logoImage} alt={displayName} className={`${sz} object-contain`} style={{ background: "transparent" }} />;
    if (user.image)
      return <img src={user.image} alt={displayName} className={`${sz} rounded-2xl object-cover ring-4 ring-white/20 shadow-lg`} />;
    return (
      <div className={`${sz} rounded-2xl flex items-center justify-center text-white font-bold shadow-lg`}
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
        {initials}
      </div>
    );
  };

  // ── Hero section ──────────────────────────────────────────────────────────

  const renderHero = () => {
    const hasBanner = !!liveSettings.bannerImage;
    const taglineText = liveSettings.tagline || user.bio;
    // Optional custom hero copy — falls back to tagline/name when unset.
    const heroTitle = liveSettings.heroHeading || taglineText || displayName;
    const heroSub = liveSettings.heroSubheading || null;

    // Creator-added text & button blocks rendered in the hero content. `onDark`
    // switches the default text/button colours for heroes set over an image.
    const heroItems = (liveSettings.heroItems ?? []) as HeroItem[];
    const renderHeroExtras = (onDark: boolean) => {
      if (!heroItems.length) return null;
      const textColor = onDark ? "rgba(255,255,255,0.88)" : theme.muted;
      return (
        <div className="flex flex-wrap items-center gap-3 mt-5">
          {heroItems.map((it) => {
            if (it.type === "text") {
              const sz = it.size === "lg" ? "text-lg sm:text-xl" : it.size === "sm" ? "text-xs" : "text-sm sm:text-base";
              return <p key={it.id} className={`w-full leading-relaxed ${sz}`} style={{ color: textColor }}>{it.text}</p>;
            }
            const variant = it.style ?? "primary";
            const cls = `inline-flex items-center text-sm font-semibold px-6 py-3 transition-opacity hover:opacity-90 ${btnStyle.radius}`;
            const style: React.CSSProperties =
              variant === "primary"
                ? { background: accent, color: accentText }
                : variant === "outline"
                ? (onDark ? { border: "1.5px solid rgba(255,255,255,0.6)", color: "#fff" } : { border: `1.5px solid ${theme.border}`, color: theme.text })
                : { color: onDark ? "#fff" : theme.text };
            return (
              <a key={it.id} href={it.url?.trim() || "#products"} className={cls} style={style}>{it.text || "Button"}</a>
            );
          })}
        </div>
      );
    };

    if (heroStyle === "minimal") {
      return (
        <div className="border-b" style={{ borderColor: theme.border, background: theme.heroBg }}>
          <div className="max-w-full mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex-shrink-0" style={{ background: liveSettings.logoImage ? "transparent" : theme.surfaceHover, borderRadius: liveSettings.logoImage ? 0 : "0.75rem", overflow: "hidden" }}>
                {liveSettings.logoImage ? <img src={liveSettings.logoImage} alt="" className="w-full h-full object-contain" style={{ background: "transparent" }} />
                  : user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: accent, color: accentText }}>{initials}</div>}
              </div>
              <div>
                <h1 className="font-bold text-sm" style={{ color: theme.text }}>{displayName}</h1>
                {taglineText && <p className="text-xs" style={{ color: theme.muted }}>{taglineText}</p>}
              </div>
            </div>
            {liveSettings.showProductCount && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
                {products.length} product{products.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (heroStyle === "split") {
      return (
        <div className="border-b" style={{ borderColor: theme.border, background: theme.heroBg }}>
          {hasBanner && (
            <div className="h-32 overflow-hidden relative">
              <img src={liveSettings.bannerImage!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}
          <div className="max-w-full mx-auto px-4 py-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">{renderAvatar("md")}</div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-black text-3xl mb-2" style={{ color: theme.text }}>{displayName}</h1>
              {taglineText && <p className="text-sm max-w-lg leading-relaxed mb-3" style={{ color: theme.muted }}>{taglineText}</p>}
              <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                {liveSettings.showProductCount && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
                    {products.length} product{products.length !== 1 ? "s" : ""}
                  </span>
                )}
                {availableTypes.slice(0, 3).map(t => (
                  <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
                    {TYPE_META[t]?.label ?? t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Showcase — headline + CTA on the left, image card on the right ──
    if (heroStyle === "showcase") {
      const featuredProduct =
        activeProducts.find(p => featuredIds.includes(p.id) && p.images.length > 0) ||
        activeProducts.find(p => p.images.length > 0) ||
        null;
      return (
        <section className="border-b" style={{ borderColor: theme.border, background: theme.heroBg }}>
          <div className="max-w-full mx-auto px-6 sm:px-12 lg:px-20 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className={`flex flex-col ${liveSettings.heroTextAlign === "center" ? "items-center text-center" : liveSettings.heroTextAlign === "right" ? "items-end text-right lg:order-2" : "items-start text-left"}`}>
              {liveSettings.showProductCount && (
                <span className="text-xs font-semibold uppercase tracking-wider mb-4 px-3 py-1.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </span>
              )}
              <h1 className="font-black leading-[1.05] mb-5" style={{ color: theme.text, fontSize: "clamp(2.25rem, 4.5vw, 4rem)" }}>{heroTitle}</h1>
              {heroSub && <p className="text-base sm:text-lg max-w-md leading-relaxed mb-7" style={{ color: theme.muted }}>{heroSub}</p>}
              <div className="flex items-center gap-3 flex-wrap">
                <a href="#products" className={`inline-flex items-center text-sm font-bold px-8 py-3.5 ${btnStyle.radius}`} style={{ background: accent, color: accentText }}>{ctaLabel}</a>
                {customButtons.slice(0, 1).map(btn => (
                  <a key={btn.id} href={getBtnHref(btn)} className={`inline-flex items-center text-sm font-medium px-6 py-3.5 border ${btnStyle.radius}`} style={{ borderColor: theme.border, color: theme.text }}>{btn.label}</a>
                ))}
              </div>
              {renderHeroExtras(false)}
            </div>
            <div className={`${liveSettings.heroTextAlign === "right" ? "lg:order-1" : ""}`}>
              <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl aspect-[4/5] w-full max-w-md mx-auto" style={{ background: theme.surfaceHover }}>
                {hasBanner
                  ? <img src={liveSettings.bannerImage!} alt="" className="w-full h-full object-cover" />
                  : featuredProduct?.images?.[0]
                    ? <img src={featuredProduct.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}55, ${accent}15)` }}>{renderAvatar("lg")}</div>}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── Marquee — full-bleed image with a giant scrolling-text carousel ──
    if (heroStyle === "marquee") {
      const marqueeText = (liveSettings.heroMarqueeText || heroTitle || displayName).trim();
      const speed = liveSettings.tickerSpeed === "slow" ? 45 : liveSettings.tickerSpeed === "fast" ? 18 : 30;
      const repeats = Array.from({ length: 4 });
      // Position the floating CTA from the user's chosen spot (e.g. "top-right").
      const [ctaV, ctaH] = (liveSettings.heroCtaPos || "top-right").split("-");
      const ctaTransforms: string[] = [];
      const ctaPosStyle: React.CSSProperties = { position: "absolute", zIndex: 20 };
      if (ctaV === "bottom") ctaPosStyle.bottom = 24;
      else if (ctaV === "mid") { ctaPosStyle.top = "50%"; ctaTransforms.push("translateY(-50%)"); }
      else ctaPosStyle.top = 24;
      if (ctaH === "left") ctaPosStyle.left = 24;
      else if (ctaH === "center") { ctaPosStyle.left = "50%"; ctaTransforms.push("translateX(-50%)"); }
      else ctaPosStyle.right = 24;
      if (ctaTransforms.length) ctaPosStyle.transform = ctaTransforms.join(" ");
      return (
        <section className="relative overflow-hidden flex flex-col justify-end" style={{ height: heroSize.h }}>
          <style>{`@keyframes nexus-hero-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          {hasBanner
            ? <img src={liveSettings.bannerImage!} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}cc 0%, #0a0a0a 100%)` }} />
          }
          <div className="absolute inset-0 bg-black" style={{ opacity: heroOverlay / 100 }} />
          {/* Optional headline above the marquee — follows the Text Alignment setting */}
          {(liveSettings.heroHeading || heroSub) && (
            <div className="relative z-10 px-6 sm:px-12 mb-6" style={{ textAlign: (liveSettings.heroTextAlign as "left" | "center" | "right") || "left" }}>
              {liveSettings.heroHeading && <h2 className="text-white font-bold drop-shadow-lg" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}>{liveSettings.heroHeading}</h2>}
              {heroSub && <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl inline-block">{heroSub}</p>}
            </div>
          )}
          {/* Giant scrolling text — duplicated for a seamless loop */}
          <div className="relative z-10 overflow-hidden pb-6 sm:pb-10" style={{ maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}>
            <div className="marquee-anim flex w-max whitespace-nowrap" style={{ animation: `nexus-hero-marquee ${speed}s linear infinite` }}>
              {repeats.map((_, i) => (
                <span key={i} className="font-black text-white/95 leading-none pr-12 select-none" style={{ fontSize: "clamp(3rem, 11vw, 11rem)", letterSpacing: "-0.02em" }} aria-hidden={i > 0}>
                  {marqueeText}
                </span>
              ))}
            </div>
          </div>
          <a href="#products" style={ctaPosStyle} className="inline-flex items-center border border-white/70 text-white text-sm font-semibold px-6 py-2.5 rounded-full backdrop-blur-sm hover:bg-white hover:text-black transition-colors">{ctaLabel}</a>
        </section>
      );
    }

    // ── Editorial — large headline above a wide image ──
    if (heroStyle === "editorial") {
      const alignCls = heroTextAlign.cls;
      return (
        <section className="border-b" style={{ borderColor: theme.border, background: theme.heroBg }}>
          <div className={`max-w-full mx-auto px-6 sm:px-12 lg:px-20 pt-14 lg:pt-20 pb-8 flex flex-col ${alignCls}`}>
            <h1 className="font-black leading-[0.95] mb-4" style={{ color: theme.text, fontSize: "clamp(2.5rem, 7vw, 6.5rem)", letterSpacing: "-0.02em" }}>{heroTitle}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {heroSub && <p className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: theme.muted }}>{heroSub}</p>}
              <a href="#products" className={`inline-flex items-center text-sm font-bold px-7 py-3 ${btnStyle.radius}`} style={{ background: accent, color: accentText }}>{ctaLabel}</a>
            </div>
            {renderHeroExtras(false)}
          </div>
          <div className="px-6 sm:px-12 lg:px-20 pb-14 lg:pb-20">
            <div className="relative rounded-2xl overflow-hidden w-full" style={{ height: heroSize.h, background: theme.surfaceHover }}>
              {hasBanner
                ? <img src={liveSettings.bannerImage!} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}44, ${accent}11)` }} />}
            </div>
          </div>
        </section>
      );
    }

    const heroContentPos = (liveSettings.elementPositions as Record<string, { x: number; y: number }>)?.heroContent;
    const heroContentMaxWidth = heroContentPos
      ? `${Math.min(heroContentPos.x, 100 - heroContentPos.x) * 2}%`
      : undefined;

    if (heroStyle === "cover") {
      const alignCls = heroTextAlign.cls;
      const coverPosStyle: React.CSSProperties = heroContentPos
        ? { position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%, -50%)", zIndex: 10, textAlign: "center", maxWidth: heroContentMaxWidth }
        : {};
      return (
        <div className="relative overflow-hidden flex flex-col justify-end" style={{ height: heroSize.h }}>
          {hasBanner
            ? <img src={liveSettings.bannerImage!} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}40 0%, ${accent}15 50%, ${theme.bg} 100%)` }} />
          }
          <div className="absolute inset-0 bg-black/50" />
          {heroContentPos ? (
            <div className="flex flex-col items-center max-w-md" style={coverPosStyle}>
              <h1 className="font-black text-4xl mb-2 text-white drop-shadow-lg">{liveSettings.heroHeading || displayName}</h1>
              {(heroSub || taglineText) && <p className="text-base text-white/80">{heroSub || taglineText}</p>}
            </div>
          ) : (
            <div className={`relative z-10 max-w-full mx-auto px-10 sm:px-40 w-full flex flex-col ${alignCls}`} style={{ paddingBottom: heroSize.pb }}>
              <h1 className="font-black text-4xl mb-2 text-white drop-shadow-lg">{liveSettings.heroHeading || displayName}</h1>
              {(heroSub || taglineText) && <p className="text-base max-w-md text-white/80 leading-relaxed">{heroSub || taglineText}</p>}
              {renderHeroExtras(true)}
            </div>
          )}
        </div>
      );
    }

    // product hero — bold left-aligned text over a gradient background
    if (heroStyle === "product") {
      const heroBg = hasBanner
        ? undefined
        : `linear-gradient(130deg, ${accent}ee 0%, ${accent}99 45%, ${theme.bg} 100%)`;
      const defaultStyle: React.CSSProperties = { paddingBottom: heroSize.pb };
      const posStyle: React.CSSProperties = heroContentPos
        ? { position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%, -50%)", zIndex: 10, maxWidth: heroContentMaxWidth }
        : {};

      const alignCls = heroTextAlign.cls;
      return (
        <section className="relative overflow-hidden" style={{ height: heroSize.h, background: heroBg }}>
          {hasBanner && (
            <>
              <img src={liveSettings.bannerImage!} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black" style={{ opacity: heroOverlay / 100 }} />
            </>
          )}
          {heroContentPos ? (
            <div className="flex flex-col justify-center max-w-xl" style={posStyle}>
              <h1 className="font-black text-white leading-none mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>{heroTitle}</h1>
              {(heroSub || taglineText) && <p className="text-white/70 text-base mb-6 max-w-md leading-relaxed">{heroSub || displayName}</p>}
              <div className="flex items-center gap-3 flex-wrap">
                <a href="#products" className={`inline-flex items-center text-white text-sm font-bold px-8 py-3.5 ${btnStyle.radius}`}
                  style={{ background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)" }}>{ctaLabel}</a>
              </div>
            </div>
          ) : (
            <div className={`relative z-10 h-full flex items-center px-10 sm:px-40 ${liveSettings.heroTextAlign === "center" ? "justify-center" : liveSettings.heroTextAlign === "right" ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col ${alignCls}`} style={defaultStyle}>
                <h1 className="font-black text-white leading-none mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>{heroTitle}</h1>
                {(heroSub || taglineText) && <p className="text-white/70 text-base mb-6 max-w-md leading-relaxed">{heroSub || displayName}</p>}
                {liveSettings.showProductCount && <p className="text-white/50 text-sm mb-4">{products.length} product{products.length !== 1 ? "s" : ""} available</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <a href="#products" className={`inline-flex items-center text-white text-sm font-bold px-8 py-3.5 ${btnStyle.radius}`}
                    style={{ background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>{ctaLabel}</a>
                  {customButtons.slice(0, 1).map(btn => (
                    <a key={btn.id} href={getBtnHref(btn)} className={`inline-flex items-center text-white/80 text-sm font-medium px-6 py-3.5 border border-white/30 ${btnStyle.radius}`}>{btn.label}</a>
                  ))}
                </div>
                {renderHeroExtras(true)}
              </div>
            </div>
          )}
        </section>
      );
    }

    // storefront / centered — Shopify Dawn style: full-width banner, centered text lower half, outlined CTA
    const isStorefront = heroStyle === "storefront" || heroStyle === "centered";
    if (isStorefront) {
      const heroBg = hasBanner ? undefined : `linear-gradient(160deg, ${accent}cc 0%, ${accent}88 100%)`;
      const alignCls = heroTextAlign.cls;
      const posStyle: React.CSSProperties = heroContentPos
        ? { position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%, -50%)", zIndex: 10, textAlign: "center", maxWidth: heroContentMaxWidth }
        : {};

      return (
        <section className="relative overflow-hidden flex flex-col justify-end"
          style={{ height: heroSize.h, background: heroBg }}>
          {hasBanner && (
            <>
              <img src={liveSettings.bannerImage!} alt="Store banner" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black" style={{ opacity: heroOverlay / 100 }} />
            </>
          )}
          {heroContentPos ? (
            <div className="flex flex-col items-center max-w-2xl" style={posStyle}>
              <h1 className="font-bold text-white leading-tight mb-5" style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)" }}>{heroTitle}</h1>
              {heroSub && <p className="text-white/75 text-base max-w-md mb-5 leading-relaxed">{heroSub}</p>}
              <a href="#products" className="inline-flex items-center border border-white text-white text-sm font-medium px-8 py-3">{ctaLabel}</a>
            </div>
          ) : (
            <div className={`relative z-10 flex flex-col ${alignCls} px-10 sm:px-40 w-full`} style={{ paddingBottom: heroSize.pb }}>
              <h1 className="font-bold text-white leading-tight mb-5" style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)" }}>{heroTitle}</h1>
              {heroSub && <p className="text-white/75 text-base max-w-md mb-5 leading-relaxed">{heroSub}</p>}
              <a href="#products"
                className="inline-flex items-center border border-white text-white text-sm font-medium px-8 py-3 transition-colors hover:bg-white"
                style={{ color: "#fff" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.text; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}>
                {ctaLabel}
              </a>
              {renderHeroExtras(true)}
            </div>
          )}
        </section>
      );
    }

    // Fallback (should never hit, all branches covered above)
    return null;
  };

  // ── Trust bar ─────────────────────────────────────────────────────────────

  const renderTrustBar = () => {
    if (heroStyle === "minimal" || !showTrustBar) return null;
    const TRUST_ICONS = [Shield, Zap, RefreshCw, Shield, Zap, RefreshCw];
    return (
      <div className="border-b" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="max-w-full mx-auto px-10 sm:px-40 py-3">
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {trustBadges.map((label, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <React.Fragment key={label}>
                  {i > 0 && <span className="hidden sm:block w-px h-3.5" style={{ background: theme.border }} />}
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.muted }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
                    {label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Product grid rendering ─────────────────────────────────────────────────

  const isList     = liveSettings.layout === "list";
  const isMasonry  = liveSettings.layout === "masonry";
  const isFeatured = liveSettings.layout === "featured";
  const isCarousel = liveSettings.layout === "carousel";

  const renderProducts = () => {
    if (filteredProducts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.surfaceHover }}>
            <Package className="w-8 h-8" style={{ color: theme.muted }} />
          </div>
          <h3 className="font-semibold mb-1">
            {searchQuery.trim() ? `No results for "${searchQuery}"` : `No ${TYPE_META[filter]?.label ?? filter} products`}
          </h3>
          <p className="text-sm" style={{ color: theme.muted }}>
            {searchQuery.trim() ? "Try a different search term." : "Try a different category."}
          </p>
        </div>
      );
    }

    const LAYOUT_MAX: Record<string, number> = {
      grid: 8, "6col": 12, "3col": 6, "2col": 4, compact: 10, list: 6, masonry: 6, featured: 7, carousel: Infinity,
    };
    const maxToShow = LAYOUT_MAX[liveSettings.layout] ?? 6;
    const visibleProducts = isCarousel ? filteredProducts : filteredProducts.slice(0, maxToShow);
    const hasMore = !isCarousel && filteredProducts.length > maxToShow;

    const viewAllLink = hasMore ? (
      <div className="mt-6 text-center">
        <Link href={`/${user.username}/store/products`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-75"
          style={{ color: accent }}>
          View all {filteredProducts.length} products →
        </Link>
      </div>
    ) : null;

    const newestIds = filteredProducts.slice(0, 3).map(p => p.id);
    const sharedTheme = { bg: theme.bg, surface: theme.surface, surfaceHover: theme.surfaceHover, border: theme.border, text: theme.text, muted: theme.muted };
    const cardProps = (product: Product, index: number) => ({
      product, accent, username: user.username,
      theme: sharedTheme,
      btnRadius: btnStyle.radius, cardRadius: cardStyle.radius, cardShadow: cardStyle.shadow,
      imgRatioClass: imgRatio.cls, index, isList,
      showRatings: liveSettings.showRatings ?? true,
      showSaleBadge,
      showQuickAdd,
      showNewBadge,
      showProductType,
      stockBadge,
      stockBadgeThreshold,
      showWishlist: liveSettings.showWishlist ?? false,
      wishlisted: wishlist.has(product.id),
      onToggleWishlist: () => toggleWishlist(product.id),
      isNew: showNewBadge && newestIds.includes(product.id),
      onView: () => { if (!product.id.startsWith("__ph")) setSelectedProduct(product); },
      onAddToCart: () => addToCart(product),
    });

    if (isCarousel) {
      return (
        <>
          <CarouselProducts
            products={filteredProducts}
            rows={liveSettings.carouselRows ?? 1}
            autoplay={liveSettings.carouselAutoplay ?? false}
            accent={accent}
            theme={sharedTheme}
            btnRadius={btnStyle.radius}
            cardRadius={cardStyle.radius}
            cardShadow={cardStyle.shadow}
            imgRatioClass={imgRatio.cls}
            showRatings={liveSettings.showRatings ?? true}
            onView={(p) => router.push(`/${user.username}/store/products/${p.id}`)}
            onAddToCart={(p) => addToCart(p)}
          />
          {viewAllLink}
        </>
      );
    }

    if (isFeatured && visibleProducts.length > 0) {
      const [first, ...rest] = visibleProducts;
      return (
        <>
          <div className="flex flex-col gap-4">
            <FeaturedCard
              product={first}
              accent={accent}
              theme={sharedTheme}
              btnRadius={btnStyle.radius}
              cardRadius={cardStyle.radius}
              cardShadow={cardStyle.shadow}
              showRatings={liveSettings.showRatings ?? true}
              onView={() => router.push(`/${user.username}/store/products/${first.id}`)}
              onAddToCart={() => addToCart(first)}
            />
            {rest.length > 0 && (
              <div className={`grid gap-6 ${layout.cols}`}>
                {rest.map((p, i) => <ProductCard key={p.id} {...cardProps(p, i + 1)} />)}
              </div>
            )}
          </div>
          {viewAllLink}
        </>
      );
    }

    return (
      <>
        <div className={isList ? "flex flex-col divide-y" : `grid gap-6 ${layout.cols}`}
          style={isList ? { borderColor: theme.border } : undefined}>
          {visibleProducts.map((p, i) => <ProductCard key={p.id} {...cardProps(p, i)} />)}
        </div>
        {viewAllLink}
      </>
    );
  };

  // ── Footer ─────────────────────────────────────────────────────────────────

  const renderFooter = () => {
    if (footerStyle === "none" && !isOwner) return null;
    const hasContent = activeSocials.length > 0 || Object.values(policies).some(Boolean) || isOwner;
    if (!hasContent) return null;

    return (
      <div className="border-t mt-10" style={{ borderColor: theme.border }}>
        <div className={`max-w-full mx-auto px-10 sm:px-40 ${footerStyle === "compact" ? "py-4" : "py-8"}`}>
          {activeSocials.length > 0 && (
            <div className={`flex items-center justify-center gap-3 ${footerStyle === "compact" ? "mb-3" : "mb-6"}`}>
              {activeSocials.map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-110"
                  style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
                  {SOCIAL_ICONS[platform] ?? <Globe className="w-4 h-4" />}
                </a>
              ))}
            </div>
          )}

          {footerStyle !== "compact" && Object.values(policies).some(Boolean) && (
            <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
              {policies.shipping && (
                <button onClick={() => setPolicyModal({ title: "Shipping Policy", content: policies.shipping! })}
                  className="text-xs transition-opacity hover:opacity-70" style={{ color: theme.muted }}>
                  Shipping Policy
                </button>
              )}
              {policies.returns && (
                <button onClick={() => setPolicyModal({ title: "Returns & Refunds", content: policies.returns! })}
                  className="text-xs transition-opacity hover:opacity-70" style={{ color: theme.muted }}>
                  Returns & Refunds
                </button>
              )}
              {policies.privacy && (
                <button onClick={() => setPolicyModal({ title: "Privacy Policy", content: policies.privacy! })}
                  className="text-xs transition-opacity hover:opacity-70" style={{ color: theme.muted }}>
                  Privacy Policy
                </button>
              )}
            </div>
          )}

          {showPaymentIcons && footerStyle !== "compact" && (
            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "Stripe"].map(brand => (
                <span key={brand} className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                  {brand}
                </span>
              ))}
            </div>
          )}

          {isOwner && (
            <div className={`rounded-2xl p-4 border flex items-center justify-between gap-4 ${footerStyle === "compact" ? "mt-2" : ""}`}
              style={{ background: theme.surface, borderColor: theme.border }}>
              <div>
                <p className="text-sm font-semibold">You&apos;re previewing your store</p>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>This is exactly what customers see</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/store/customize"
                  className={`flex items-center gap-1.5 px-3 py-2 border text-sm font-medium transition-all hover:opacity-80 ${btnStyle.radius}`}
                  style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                  <Settings className="w-3.5 h-3.5" /> Customize
                </Link>
                <Link href="/store"
                  className={`flex items-center gap-1.5 px-3 py-2 border text-sm font-medium transition-all hover:opacity-80 ${btnStyle.radius}`}
                  style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                  <Package className="w-3.5 h-3.5" /> Manage
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Newsletter section ─────────────────────────────────────────────────────

  const renderNewsletter = () => {
    if (!showNewsletter) return null;
    return (
      <div className="border-t mt-12" style={{ borderColor: theme.border }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
          <h2 className="font-black text-2xl mb-2" style={{ color: theme.text }}>Stay in the loop</h2>
          <p className="text-sm mb-6 max-w-md" style={{ color: theme.muted }}>Get notified about new products, exclusive drops, and special offers.</p>
          <div className="flex gap-2 w-full max-w-md">
            <input type="email" placeholder="Enter your email"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") subscribeEmail(newsletterEmail).then(ok => { if (ok) setNewsletterEmail(""); }); }}
              className="flex-1 h-12 px-4 rounded-xl border text-sm outline-none"
              style={{ borderColor: theme.border, background: theme.surface, color: theme.text }} />
            <button
              onClick={() => subscribeEmail(newsletterEmail).then(ok => { if (ok) setNewsletterEmail(""); })}
              disabled={subscribing}
              className={`h-12 px-6 text-white text-sm font-semibold disabled:opacity-60 ${btnStyle.radius}`} style={{ background: accent, color: accentText }}>
              {subscribing ? "…" : "Subscribe"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTestimonials = () => {
    if (!testimonialsEnabled || testimonialItems.length === 0) return null;
    return (
      <div className="border-t mt-12" style={{ borderColor: theme.border }}>
        <div className="max-w-full mx-auto px-10 sm:px-40 py-12">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.text }}>What customers say</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonialItems.map(item => (
              <div key={item.id} className="p-6 rounded-2xl border" style={{ background: theme.surface, borderColor: theme.border }}>
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= item.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: theme.text }}>&ldquo;{item.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.author}</p>
                  {item.role && <p className="text-xs" style={{ color: theme.muted }}>{item.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderImageBanner = () => {
    if (!imageBannerEnabled) return null;
    const isLeft = imageBannerLayout === "left";
    return (
      <div className="border-t mt-12" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className={`max-w-full mx-auto flex flex-col md:flex-row ${isLeft ? "" : "md:flex-row-reverse"}`}>
          <div className="md:w-1/2 min-h-[280px] flex-shrink-0" style={{ background: theme.surfaceHover }}>
            {imageBannerImage
              ? <img src={imageBannerImage} alt="" className="w-full h-full object-cover" style={{ minHeight: 280 }} />
              : <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 280, background: `linear-gradient(135deg, ${accent}22, ${accent}44)` }} />
            }
          </div>
          <div className="md:w-1/2 flex flex-col justify-center px-10 sm:px-16 py-12">
            {imageBannerHeading && (
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: theme.text }}>{imageBannerHeading}</h2>
            )}
            {imageBannerText && (
              <p className="text-sm leading-relaxed mb-6" style={{ color: theme.muted }}>{imageBannerText}</p>
            )}
            {imageBannerCtaText && (
              <a href="#products" className={`inline-flex items-center self-start px-6 py-3 text-white text-sm font-semibold transition-opacity hover:opacity-90 ${btnStyle.radius}`}
                style={{ background: accent, color: accentText }}>
                {imageBannerCtaText}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderIconRow = () => {
    if (!iconRowEnabled || iconRowItems.length === 0) return null;
    return (
      <div className="border-b" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="max-w-full mx-auto px-10 sm:px-40 py-8">
          <div className={`grid gap-6 ${iconRowItems.length <= 2 ? "grid-cols-2" : iconRowItems.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
            {iconRowItems.map(item => (
              <div key={item.id} className="flex flex-col items-center text-center gap-2">
                <span className="text-3xl">{item.icon}</span>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.title}</p>
                {item.text && <p className="text-xs" style={{ color: theme.muted }}>{item.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProductsSection = () => (
      <div id="products" data-edit-section="products" className="max-w-full mx-auto px-10 sm:px-40 py-10">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <h2 className="text-xl font-medium truncate" style={{ color: theme.text }}>
                {liveSettings.sectionTitle ?? "Featured products"}
              </h2>
              {liveSettings.showProductCount && (
                <span className="text-sm font-medium" style={{ color: theme.muted }}>
                  {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
            {liveSettings.showFilters && (
              <div className="relative">
                <button
                  onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                  style={{ background: theme.surface, borderColor: theme.border, color: theme.text }}>
                  <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                  {sort === "recommended" ? "Recommended" :
                   sort === "newest"      ? "Newest" :
                   sort === "price-asc"   ? "Price: Low to High" :
                   sort === "price-desc"  ? "Price: High to Low" :
                                           "On Sale First"}
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-2xl border shadow-xl overflow-hidden"
                      style={{ background: theme.surface, borderColor: theme.border }}>
                      {[
                        { value: "recommended", label: "Recommended" },
                        { value: "newest",      label: "Newest" },
                        { value: "price-asc",   label: "Price: Low to High" },
                        { value: "price-desc",  label: "Price: High to Low" },
                        { value: "sale",        label: "On Sale First" },
                      ].map(opt => (
                        <button key={opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:opacity-70 flex items-center justify-between"
                          style={{
                            color: theme.text,
                            background: sort === opt.value ? `${accent}15` : "transparent",
                            fontWeight: sort === opt.value ? 600 : 400,
                          }}>
                          {opt.label}
                          {sort === opt.value && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <Link href={`/${user.username}/store/products`}
              className="text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: accent }}>
              View all →
            </Link>
          </div>
          </div>
          {liveSettings.showFilters && availableTypes.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter("ALL")}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: filter === "ALL" ? accent : theme.surface,
                  borderColor: filter === "ALL" ? accent : theme.border,
                  color: filter === "ALL" ? accentText : theme.muted,
                }}>
                All
              </button>
              {availableTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background: filter === t ? accent : theme.surface,
                    borderColor: filter === t ? accent : theme.border,
                    color: filter === t ? accentText : theme.muted,
                  }}>
                  {TYPE_META[t]?.label ?? t}
                </button>
              ))}
            </div>
          )}
        </div>
        {isPlaceholder && isOwner && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed text-sm"
            style={{ borderColor: accent, background: `${accent}12`, color: accent }}>
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">These are sample products — <Link href="/store/products/new" className="underline underline-offset-2 hover:opacity-75">add your first real product</Link> to replace them.</span>
          </div>
        )}
        <div className="mt-0">
          {renderProducts()}
        </div>
      </div>
  );

  // Unified, reorderable page layout: render every section (core + custom) in
  // the owner-defined order. Falls back to the default order for legacy stores.
  const homeLayout: LayoutItem[] = (Array.isArray(liveSettings.homeLayout) && liveSettings.homeLayout.length)
    ? liveSettings.homeLayout
    : defaultHomeLayout(liveSettings.homeSections ?? []);

  const renderLayout = () => homeLayout.map((item) => {
    if (isCoreItem(item)) {
      switch (item.core) {
        case "hero":
          return <div key={item.id} data-edit-section="hero" style={{ marginTop: isTransparentNav ? `-${navHeightPx}px` : undefined }}>{renderHero()}</div>;
        case "trustbar":     return <React.Fragment key={item.id}>{renderTrustBar()}</React.Fragment>;
        case "iconrow":      return <React.Fragment key={item.id}>{renderIconRow()}</React.Fragment>;
        case "products":     return <React.Fragment key={item.id}>{renderProductsSection()}</React.Fragment>;
        case "testimonials": return <React.Fragment key={item.id}>{renderTestimonials()}</React.Fragment>;
        case "imagebanner":  return <React.Fragment key={item.id}>{renderImageBanner()}</React.Fragment>;
        case "newsletter":   return showNewsletter ? <div key={item.id} data-edit-section="content">{renderNewsletter()}</div> : null;
        default:             return null;
      }
    }
    return (
      <div key={item.id} data-edit-section="sections">
        <StoreSections
          sections={[item]}
          theme={theme}
          accent={accent}
          accentText={accentText}
          products={activeProducts}
          username={user.username}
          formatCurrency={fmt}
          onAddToCart={(p) => { const full = activeProducts.find(x => x.id === p.id); if (full) addToCart(full); }}
          btnRadius={btnStyle.radius}
        />
      </div>
    );
  });

  const typographyFontSize = typographyScale === "sm" ? "93.75%" : typographyScale === "lg" ? "112.5%" : "100%";

  return (
    <CurrencyProvider code={cur.code}>
    <div className={fontClass} onClickCapture={onPreviewClick} style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", fontSize: typographyFontSize, position: "relative", isolation: "isolate" }}>

      {/* Background texture: a fixed, full-viewport layer painted ABOVE the page
          background colour but BEHIND all content (zIndex -1). Opaque sections
          cover it where they sit; it shows consistently through every transparent
          gap, so the effect reads across the whole page instead of one band. */}
      {(liveSettings.backgroundEffect ?? "none") !== "none" && (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", ...bgEffectStyle(liveSettings.backgroundEffect, theme.dark, accent) }} />
      )}

      {/* Inject custom CSS */}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* Editor: highlight selectable sections on hover */}
      {previewEdit && (
        <style dangerouslySetInnerHTML={{ __html: `
          [data-edit-section]{cursor:pointer}
          [data-edit-section]:hover{outline:2px solid ${accent};outline-offset:-2px;border-radius:2px}
        ` }} />
      )}

      {/* Inject favicon */}
      {liveSettings.favicon && (
        <link rel="icon" href={liveSettings.favicon} />
      )}

      {/* Owner analytics & custom code (not fired during owner preview) */}
      <StoreScripts
        ga={liveSettings.googleAnalyticsId}
        pixel={liveSettings.metaPixelId}
        headCode={liveSettings.customHeadCode}
        bodyCode={liveSettings.customBodyCode}
        enabled={!isPreview && !isOwner}
      />

      {/* Ticker animation keyframes */}
      {tickerEnabled && tickerText && (
        <style>{`@keyframes nexus-ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-sm ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Policy Modal ── */}
      <AnimatePresence>
        {policyModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setPolicyModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="fixed inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-20 md:bottom-20 md:w-full md:max-w-lg z-[91] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: theme.surface, color: theme.text }} onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border }}>
                <h2 className="font-bold text-lg">{policyModal.title}</h2>
                <button onClick={() => setPolicyModal(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.muted }}>{policyModal.content}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cart Backdrop ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Cart Drawer ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-md shadow-2xl flex flex-col"
            style={{ background: theme.surface, color: theme.text }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5" style={{ color: theme.muted }} />
                <h2 className="font-bold text-lg">Cart</h2>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: accent, color: accentText }}>
                    {totalItems}
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70" style={{ color: theme.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {showFreeShippingBar && cart.length > 0 && (() => {
                const reached = totalPrice >= freeShippingThreshold;
                const pct = Math.min(100, (totalPrice / freeShippingThreshold) * 100);
                const remaining = fmt(freeShippingThreshold - totalPrice);
                return (
                  <div className="mb-4 p-3 rounded-xl" style={{ background: theme.surfaceHover }}>
                    <p className="text-xs font-semibold mb-2 text-center" style={{ color: reached ? "#16a34a" : theme.muted }}>
                      {reached ? "You've unlocked free shipping!" : `You're ${remaining} away from free shipping!`}
                    </p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: reached ? "#16a34a" : accent }} />
                    </div>
                  </div>
                );
              })()}
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-16">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.surfaceHover }}>
                    <ShoppingCart className="w-8 h-8" style={{ color: theme.muted }} />
                  </div>
                  <p className="font-medium mb-1">Your cart is empty</p>
                  <p className="text-sm mb-5" style={{ color: theme.muted }}>Add items to get started</p>
                  <button onClick={() => setCartOpen(false)} className="text-sm font-semibold hover:opacity-70" style={{ color: accent }}>
                    Continue Shopping →
                  </button>
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
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: theme.border, color: theme.muted }}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: theme.border, color: theme.muted }}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold">{fmt(item.product.price * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 mt-auto">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cartNote && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>Add a note to your order</label>
                      <textarea
                        value={cartNoteText}
                        onChange={e => setCartNoteText(e.target.value)}
                        rows={3}
                        placeholder="Special instructions, gift message..."
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                        style={{ borderColor: theme.border, background: theme.surfaceHover, color: theme.text }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-5 border-t space-y-3.5" style={{ borderColor: theme.border }}>
                {/* Promo code */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between text-sm rounded-xl px-3 py-2" style={{ background: theme.surfaceHover }}>
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: theme.text }}>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-mono">{appliedPromo.code}</span> applied
                    </span>
                    <button onClick={removePromo} className="text-xs hover:opacity-70" style={{ color: theme.muted }}>Remove</button>
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
                  <span className="text-sm" style={{ color: theme.muted }}>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
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
                {checkoutError && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{checkoutError}</p>}
                {sellerHasPayments ? (
                  <button onClick={checkout} disabled={checkingOut}
                    className={`w-full h-12 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 ${btnStyle.radius}`}
                    style={{ background: accent, color: accentText }}>
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Detail Modal ── */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-10 md:bottom-10 md:w-full md:max-w-3xl z-[81] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: theme.surface, color: theme.text }} onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl backdrop-blur border flex items-center justify-center shadow-sm hover:opacity-70"
                style={{ background: theme.surface, borderColor: theme.border, color: theme.muted }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col md:flex-row h-full overflow-auto">
                <div className="md:w-5/12 aspect-square md:aspect-auto flex-shrink-0 relative group/img" style={{ background: theme.surfaceHover }}>
                  {selectedProduct.images[0]
                    ? <>
                        <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        {showProductZoom && (
                          <a href={selectedProduct.images[0]} target="_blank" rel="noopener noreferrer"
                            className="absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-md"
                            style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                            onClick={e => e.stopPropagation()}>
                            <ZoomIn className="w-4 h-4" />
                          </a>
                        )}
                      </>
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: "260px", color: theme.muted }}>
                        <TypeIcon type={selectedProduct.type} className="w-16 h-16 opacity-30" />
                        <span className="text-xs uppercase tracking-widest font-semibold">{TYPE_META[selectedProduct.type]?.label}</span>
                      </div>
                  }
                </div>

                <div className="flex-1 flex flex-col p-7 overflow-y-auto">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit mb-3"
                    style={{ background: `${accent}15`, color: accent }}>
                    <TypeIcon type={selectedProduct.type} className="w-3 h-3" /> {TYPE_META[selectedProduct.type]?.label}
                  </span>

                  <h2 className="font-bold text-2xl leading-tight mb-3">{selectedProduct.name}</h2>

                  <div className="flex items-baseline gap-2.5 mb-4">
                    <span className="text-3xl font-black" style={{ color: accent }}>{fmt(selectedProduct.price)}</span>
                    {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                      <>
                        <span className="text-lg line-through" style={{ color: theme.muted }}>{fmt(selectedProduct.comparePrice)}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {Math.round((1 - selectedProduct.price / selectedProduct.comparePrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {selectedProduct.description && (
                    <p className="text-sm leading-relaxed mb-5" style={{ color: theme.muted }}>{selectedProduct.description}</p>
                  )}

                  <div className="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5" style={{ background: `${accent}0e` }}>
                    {selectedProduct.type === "DIGITAL"      && <Download   className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />}
                    {selectedProduct.type === "PHYSICAL"     && <Truck      className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />}
                    {selectedProduct.type === "SERVICE"      && <Star       className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />}
                    {selectedProduct.type === "SUBSCRIPTION" && <RefreshCw  className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />}
                    <span className="text-sm font-semibold" style={{ color: accent }}>
                      {TYPE_META[selectedProduct.type]?.delivery}
                    </span>
                  </div>

                  {selectedProduct.inventory !== null && selectedProduct.inventory <= 10 && selectedProduct.inventory > 0 && (
                    <p className="text-amber-600 text-xs font-semibold mb-4">⚠ Only {selectedProduct.inventory} left in stock!</p>
                  )}

                  <div className="mt-auto">
                    {selectedProduct.inventory !== null && selectedProduct.inventory <= 0 ? (
                      <button disabled className={`w-full h-12 font-semibold text-sm cursor-not-allowed ${btnStyle.radius}`}
                        style={{ background: theme.surfaceHover, color: theme.muted }}>
                        Out of Stock
                      </button>
                    ) : (
                      <button onClick={() => addToCart(selectedProduct)}
                        className={`w-full h-12 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 ${btnStyle.radius}`}
                        style={{ background: accent, color: accentText }}>
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                    {showShareButtons && (
                      <div className="flex items-center gap-2 mt-3">
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 h-9 flex items-center justify-center text-xs font-semibold border rounded-xl hover:opacity-80 transition-opacity"
                          style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                          Share on X
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 h-9 flex items-center justify-center text-xs font-semibold border rounded-xl hover:opacity-80 transition-opacity"
                          style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                          Share on Facebook
                        </a>
                        <button
                          onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); showToast("success", "Link copied!"); }}
                          className="flex-1 h-9 flex items-center justify-center text-xs font-semibold border rounded-xl hover:opacity-80 transition-opacity"
                          style={{ borderColor: theme.border, color: theme.muted, background: theme.surfaceHover }}>
                          Copy link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Announcement / Ticker ── */}
      {tickerEnabled && tickerText ? (
        <div data-edit-section="announcements" className="overflow-hidden py-2" style={{ background: liveSettings.announcementColor }}>
          <div className="marquee-anim whitespace-nowrap text-white text-sm font-semibold" style={{
            display: "inline-block",
            animation: `nexus-ticker ${tickerSpeed === "slow" ? "35s" : tickerSpeed === "fast" ? "12s" : "22s"} linear infinite`,
          }}>
            {tickerText} &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp; {tickerText} &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp; {tickerText}
          </div>
        </div>
      ) : liveSettings.announcementText ? (
        <div data-edit-section="announcements" className="px-4 py-2 text-center text-sm font-medium text-white" style={{ background: liveSettings.announcementColor }}>
          {liveSettings.announcementText}
        </div>
      ) : null}

      {/* ── Owner: Stripe not connected warning ── */}
      {isOwner && !sellerHasPayments && (
        <div className="px-4 py-2.5 text-center text-sm flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 text-amber-800">
          <span>⚠ Your store can&apos;t accept payments yet.</span>
          <Link href="/settings?tab=payments" className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors">
            Connect Stripe →
          </Link>
        </div>
      )}

      {/* ── Navbar — Shopify Dawn style: logo left · nav center · icons right ── */}
      <header
        data-edit-section="header"
        className={`${stickyHeader ? "sticky top-0" : ""} z-40 transition-all duration-300 ${(!isTransparentNav || scrolled) ? "border-b" : ""}`}
        style={{
          background: isTransparentNav && scrolled ? navBgScrolled : navBg,
          backdropFilter: isTransparentNav && scrolled && !isColoredOnScroll ? "blur(14px)" : "none",
          borderColor: navBorderColor,
        }}
      >
        <div className="max-w-full mx-auto px-10 sm:px-40 flex items-center relative" style={{ height: navHeightPx }}>

          {/* Left: logo or store name — position can be overridden via elementPositions.navLogo */}
          {(() => {
            const logoPos = liveSettings.elementPositions?.navLogo;
            const logoContent = liveSettings.logoImage
              ? <img src={liveSettings.logoImage} alt={displayName} className="h-8 w-auto object-contain" />
              : <span className="text-base font-semibold tracking-tight" style={{ color: navTextColor, textShadow: navTextShadow }}>{displayName}</span>;
            return logoPos
              ? <div style={{ position: "absolute", left: `${logoPos.x}%`, top: "50%", transform: "translate(-50%, -50%)" }}>{logoContent}</div>
              : <div className="flex items-center gap-2.5 flex-shrink-0">{logoContent}</div>;
          })()}

          {/* Center: nav links */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm hover:underline underline-offset-4 transition-colors" style={{ color: navTextColor, textShadow: navTextShadow }}>Shop</a>
            {collections.length > 0 && (
              <Link href={`/${user.username}/store/collections`} className="text-sm hover:underline underline-offset-4 transition-colors" style={{ color: navTextColor, textShadow: navTextShadow }}>
                Collections
              </Link>
            )}
            {customButtons.map(btn => {
              const href = getBtnHref(btn);
              return (
                <a key={btn.id} href={href}
                  target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="text-sm hover:underline underline-offset-4 transition-colors" style={{ color: navTextColor, textShadow: navTextShadow }}>
                  {btn.label}
                </a>
              );
            })}
            {(liveSettings.customPages ?? []).map(pg => (
              <Link key={pg.id} href={`/${user.username}/store/p/${pg.slug}`}
                className="text-sm hover:underline underline-offset-4 transition-colors" style={{ color: navTextColor, textShadow: navTextShadow }}>
                {pg.title}
              </Link>
            ))}
            <Link href={`/${user.username}`} className="text-sm hover:underline underline-offset-4 transition-colors" style={{ color: navMutedColor, textShadow: navTextShadow }}>
              Portfolio
            </Link>
          </nav>

          {/* Right: search + cart */}
          <div className="ml-auto flex items-center">
            {showCurrencySwitcher && (
              <div className="mr-1">
                <CurrencySwitcher code={cur.code} options={currencyOptions} onChange={cur.set} accent={accent} textColor={navTextColor} />
              </div>
            )}
            <button
              onClick={() => {
                const next = !searchOpen;
                setSearchOpen(next);
                if (!next) setSearchQuery("");
                else setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:opacity-70"
              style={{ color: searchOpen ? accent : navTextColor }}
              aria-label="Search"
            >
              {searchOpen
                ? <X style={{ width: "1.125rem", height: "1.125rem" }} />
                : <Search style={{ width: "1.125rem", height: "1.125rem" }} />}
            </button>
            <button onClick={openCart}
              className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:opacity-70"
              style={{ color: navTextColor }} aria-label="Open cart">
              <ShoppingCart style={{ width: "1.125rem", height: "1.125rem" }} />
              {cartLoaded && totalItems > 0 && (
                <motion.span key={totalItems} initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: accent, color: accentText }}>
                  {totalItems}
                </motion.span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ── Search bar + predictive dropdown ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className={`${stickyHeader ? "sticky top-14" : ""} z-30 border-b overflow-hidden`}
            style={{ background: theme.surface, borderColor: theme.border }}
          >
            {/* Input row */}
            <div className="px-10 sm:px-40 py-3 flex items-center gap-3">
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: theme.muted }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchHighlight(-1); }}
                onKeyDown={(e) => {
                  const results = searchQuery.trim()
                    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
                    : [];
                  if (e.key === "ArrowDown") { e.preventDefault(); setSearchHighlight(h => Math.min(h + 1, results.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setSearchHighlight(h => Math.max(h - 1, -1)); }
                  else if (e.key === "Enter" && searchHighlight >= 0 && results[searchHighlight]) {
                    router.push(`/${user.username}/store/products/${results[searchHighlight].id}`);
                    setSearchOpen(false); setSearchQuery("");
                  }
                  else if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                }}
                placeholder="Search products…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: theme.text }}
                autoComplete="off"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchHighlight(-1); searchInputRef.current?.focus(); }}
                  className="hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: theme.muted }}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Predictive results dropdown */}
            {searchQuery.trim() && (() => {
              const q = searchQuery.toLowerCase();
              const results = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description ?? "").toLowerCase().includes(q) ||
                (p.type ?? "").toLowerCase().includes(q)
              ).slice(0, 6);
              return (
                <div className="border-t" style={{ borderColor: theme.border }}>
                  {results.length === 0 ? (
                    <div className="px-10 sm:px-40 py-4 text-sm" style={{ color: theme.muted }}>
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <>
                      {results.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => { router.push(`/${user.username}/store/products/${p.id}`); setSearchOpen(false); setSearchQuery(""); }}
                          onMouseEnter={() => setSearchHighlight(i)}
                          className="w-full px-10 sm:px-40 py-2.5 flex items-center gap-3 transition-colors text-left"
                          style={{ background: searchHighlight === i ? theme.surfaceHover : "transparent" }}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ background: theme.surfaceHover }}>
                            {p.images[0]
                              ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              : <TypeIcon type={p.type} className="w-5 h-5 opacity-40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{p.name}</p>
                            <p className="text-xs" style={{ color: theme.muted }}>{TYPE_META[p.type]?.label ?? p.type}</p>
                          </div>
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: accent }}>
                            {fmt(p.price)}
                          </span>
                        </button>
                      ))}
                      {products.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q) || (p.type ?? "").toLowerCase().includes(q)).length > 6 && (
                        <div className="px-10 sm:px-40 py-2 border-t text-xs" style={{ borderColor: theme.border, color: theme.muted }}>
                          Showing top 6 results — refine your search to narrow down
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reorderable page layout (core sections + custom blocks) ── */}
      {renderLayout()}

      {/* ── Footer ── */}
      <div data-edit-section="social">{renderFooter()}</div>

      {/* ── Popup ── */}
      <AnimatePresence>
        {popupVisible && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setPopupVisible(false);
                try { localStorage.setItem(`nexus_popup_dismissed_${user.username}`, "1"); } catch {}
              }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="fixed inset-x-4 bottom-8 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-md z-[111] rounded-3xl overflow-hidden shadow-2xl p-8"
              style={{ background: theme.surface, color: theme.text }} onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setPopupVisible(false);
                  try { localStorage.setItem(`nexus_popup_dismissed_${user.username}`, "1"); } catch {}
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
                style={{ color: theme.muted }}>
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-bold text-xl mb-2">{popupTitle ?? "Get 10% off your first order"}</h2>
              <p className="text-sm mb-5" style={{ color: theme.muted }}>Enter your email to receive your discount code.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={popupEmail}
                  onChange={e => setPopupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 h-11 px-4 rounded-xl border text-sm outline-none"
                  style={{ borderColor: theme.border, background: theme.surfaceHover, color: theme.text }}
                />
                <button
                  onClick={async () => {
                    const ok = await subscribeEmail(popupEmail);
                    if (ok) {
                      setPopupEmail("");
                      setPopupVisible(false);
                      try { localStorage.setItem(`nexus_popup_dismissed_${user.username}`, "1"); } catch {}
                    }
                  }}
                  disabled={subscribing}
                  className={`h-11 px-5 text-white text-sm font-semibold disabled:opacity-60 ${btnStyle.radius}`}
                  style={{ background: accent, color: accentText }}>
                  {subscribing ? "…" : "Subscribe"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </CurrencyProvider>
  );
}

// ── Carousel Products ─────────────────────────────────────────────────────────

function CarouselRow({
  products, autoplay, startIndex, accent, theme, btnRadius, cardRadius, cardShadow, imgRatioClass, showRatings, onView, onAddToCart,
}: {
  products: Product[]; autoplay: boolean; startIndex: number; accent: string;
  theme: { surface: string; surfaceHover: string; border: string; text: string; muted: string };
  btnRadius: string; cardRadius: string; cardShadow: string; imgRatioClass: string;
  showRatings: boolean; onView: (p: Product) => void; onAddToCart: (p: Product) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [hovered, setHovered] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scroll = useCallback((dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoplay || hovered) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [autoplay, hovered]);

  return (
    <div
      className="relative pb-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {canPrev && (
        <button onClick={() => scroll("prev")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-110"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.muted }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canNext && (
        <button onClick={() => scroll("next")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-110"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.muted }}>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth px-1 pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p, i) => (
          <CarouselCard
            key={p.id}
            product={p}
            index={startIndex + i}
            accent={accent}
            theme={theme}
            btnRadius={btnRadius}
            cardRadius={cardRadius}
            cardShadow={cardShadow}
            imgRatioClass={imgRatioClass}
            showRatings={showRatings}
            onView={() => onView(p)}
            onAddToCart={() => onAddToCart(p)}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselProducts({
  products, rows, autoplay, accent, theme, btnRadius, cardRadius, cardShadow, imgRatioClass, showRatings, onView, onAddToCart,
}: {
  products: Product[]; rows: number; autoplay: boolean; accent: string;
  theme: { surface: string; surfaceHover: string; border: string; text: string; muted: string };
  btnRadius: string; cardRadius: string; cardShadow: string; imgRatioClass: string;
  showRatings: boolean; onView: (p: Product) => void; onAddToCart: (p: Product) => void;
}) {
  const numRows = Math.max(1, Math.min(3, rows));
  const perRow = Math.ceil(products.length / numRows);
  const chunks = Array.from({ length: numRows }, (_, i) => products.slice(i * perRow, (i + 1) * perRow));

  return (
    <div className="flex flex-col gap-14 -mx-1">
      {chunks.map((chunk, i) => (
        <CarouselRow
          key={i}
          products={chunk}
          autoplay={autoplay}
          startIndex={i * perRow}
          accent={accent}
          theme={theme}
          btnRadius={btnRadius}
          cardRadius={cardRadius}
          cardShadow={cardShadow}
          imgRatioClass={imgRatioClass}
          showRatings={showRatings}
          onView={onView}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

function CarouselCard({
  product, index, accent, theme, btnRadius, cardRadius, cardShadow, imgRatioClass, showRatings, onView, onAddToCart,
}: {
  product: Product; index: number; accent: string;
  theme: { surface: string; surfaceHover: string; border: string; text: string; muted: string };
  btnRadius: string; cardRadius: string; cardShadow: string; imgRatioClass: string;
  showRatings: boolean; onView: () => void; onAddToCart: () => void;
}) {
  const accentText = readableTextOn(accent);
  const fmt = useFmt();
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = product.inventory !== null && product.inventory <= 0;
  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setJustAdded(true);
    onAddToCart();
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onView}
      className={`flex-shrink-0 w-52 overflow-hidden cursor-pointer border snap-start transition-all hover:-translate-y-0.5 ${cardRadius} ${cardShadow}`}
      style={{ background: theme.surface, borderColor: theme.border }}>
      <div className={`${imgRatioClass} overflow-hidden relative`} style={{ background: theme.surfaceHover }}>
        {product.images[0]
          ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-1.5" style={{ color: theme.muted }}>
              <TypeIcon type={product.type} className="w-8 h-8 opacity-50" />
              <span className="text-[9px] font-semibold uppercase tracking-wider opacity-50">{TYPE_META[product.type]?.label ?? product.type}</span>
            </div>
        }
        {discountPct && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">-{discountPct}%</span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-snug line-clamp-2 mb-0.5">{product.name}</p>
        {showRatings && (
          <div className="flex gap-0.5 mb-1.5">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
          </div>
        )}
        <div className="flex items-center justify-between gap-1">
          <span className="font-black text-sm" style={{ color: accent }}>{fmt(product.price)}</span>
          <button onClick={handleAdd} disabled={isOutOfStock}
            className={`w-7 h-7 flex items-center justify-center text-white flex-shrink-0 transition-all hover:scale-110 disabled:opacity-40 ${btnRadius}`}
            style={{ background: accent, color: accentText }}>
            <AnimatePresence mode="wait">
              {justAdded
                ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="w-3.5 h-3.5" /></motion.span>
                : <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Plus className="w-3.5 h-3.5" /></motion.span>
              }
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({
  product, accent, theme, btnRadius, cardRadius, cardShadow, showRatings, onView, onAddToCart,
}: {
  product: Product; accent: string;
  theme: { surface: string; surfaceHover: string; border: string; text: string; muted: string };
  btnRadius: string; cardRadius: string; cardShadow: string;
  showRatings: boolean; onView: () => void; onAddToCart: () => void;
}) {
  const accentText = readableTextOn(accent);
  const fmt = useFmt();
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = product.inventory !== null && product.inventory <= 0;
  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setJustAdded(true);
    onAddToCart();
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      onClick={onView}
      className={`overflow-hidden cursor-pointer group border flex flex-col md:flex-row ${cardRadius} ${cardShadow}`}
      style={{ background: theme.surface, borderColor: theme.border }}>
      <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden relative" style={{ minHeight: "280px", background: theme.surfaceHover }}>
        {product.images[0]
          ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: theme.muted }}>
              <TypeIcon type={product.type} className="w-16 h-16 opacity-50" />
              <span className="text-sm uppercase tracking-wider font-semibold opacity-60">{TYPE_META[product.type]?.label}</span>
            </div>
        }
        <div className="absolute top-3 left-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur">Featured</span>
        </div>
        {discountPct && (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">-{discountPct}%</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col p-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit mb-4"
          style={{ background: `${accent}15`, color: accent }}>
          <TypeIcon type={product.type} className="w-3 h-3" /> {TYPE_META[product.type]?.label}
        </span>
        <h3 className="font-black text-2xl mb-3 leading-tight">{product.name}</h3>
        {product.description && <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: theme.muted }}>{product.description}</p>}
        {showRatings && (
          <div className="flex items-center gap-1 mb-4">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
            <span className="text-sm ml-1" style={{ color: theme.muted }}>(4.0)</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-3xl" style={{ color: accent }}>{fmt(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-base line-through" style={{ color: theme.muted }}>{fmt(product.comparePrice)}</span>
            )}
          </div>
          <button onClick={handleAdd} disabled={isOutOfStock}
            className={`flex items-center gap-2 px-5 py-3 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 ${btnRadius}`}
            style={{ background: accent, color: accentText }}>
            <AnimatePresence mode="wait">
              {justAdded
                ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="w-4 h-4" /></motion.span>
                : <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><ShoppingCart className="w-4 h-4" /></motion.span>
              }
            </AnimatePresence>
            {justAdded ? "Added!" : "Add to Cart"}
          </button>
        </div>
        {product.inventory !== null && product.inventory <= 10 && product.inventory > 0 && (
          <p className="text-amber-500 text-xs font-semibold mt-3">Only {product.inventory} left!</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({
  product, accent, username, theme, btnRadius, cardRadius, cardShadow, imgRatioClass,
  index, isList, showRatings, showSaleBadge, showQuickAdd, showNewBadge, showProductType, isNew,
  stockBadge, stockBadgeThreshold, showWishlist, wishlisted = false, onToggleWishlist,
  onView, onAddToCart,
}: {
  product: Product; accent: string; username: string;
  theme: { bg: string; surface: string; surfaceHover: string; border: string; text: string; muted: string };
  btnRadius: string; cardRadius: string; cardShadow: string; imgRatioClass: string;
  index: number; isList: boolean;
  showRatings: boolean; showSaleBadge: boolean; showQuickAdd: boolean;
  showNewBadge: boolean; showProductType: boolean; isNew: boolean;
  stockBadge: boolean; stockBadgeThreshold: number; showWishlist: boolean;
  wishlisted?: boolean; onToggleWishlist?: () => void;
  onView: () => void; onAddToCart: () => void;
}) {
  const accentText = readableTextOn(accent);
  const fmt = useFmt();
  const router = useRouter();
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = product.inventory !== null && product.inventory <= 0;
  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setJustAdded(true);
    onAddToCart();
    setTimeout(() => setJustAdded(false), 1000);
  };

  const productUrl = `/${username}/store/products/${product.id}`;

  if (isList) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        onClick={() => router.push(productUrl)}
        className="flex items-center gap-4 py-4 cursor-pointer border-b transition-colors hover:bg-opacity-50"
        style={{ borderColor: theme.border }}>
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden" style={{ background: theme.surfaceHover }}>
          {product.images[0]
            ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1" />
            : <div className="w-full h-full flex items-center justify-center" style={{ color: theme.muted }}><TypeIcon type={product.type} className="w-7 h-7 opacity-50" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug line-clamp-1" style={{ color: theme.text }}>{product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm" style={{ color: theme.text }}>{fmt(product.price)}</span>
            {discountPct && <span className="text-xs line-through" style={{ color: theme.muted }}>{fmt(product.comparePrice!)}</span>}
          </div>
        </div>
        <button onClick={handleAdd} disabled={isOutOfStock}
          className="flex-shrink-0 h-9 px-4 text-sm font-medium border transition-colors disabled:opacity-40"
          style={{ borderColor: theme.border, color: theme.text, background: "transparent" }}>
          {justAdded ? "Added" : isOutOfStock ? "Sold out" : "Add"}
        </button>
      </motion.div>
    );
  }

  // Shopify Dawn grid card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => router.push(productUrl)}
      className="cursor-pointer group">
      {/* Image area */}
      <div className={`relative overflow-hidden ${imgRatioClass} ${cardRadius} ${cardShadow}`} style={{ background: theme.surfaceHover }}>
        {product.images[0]
          ? <img src={product.images[0]} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: theme.muted }}>
              <TypeIcon type={product.type} className="w-10 h-10 opacity-50" />
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">{TYPE_META[product.type]?.label ?? product.type}</span>
            </div>
        }
        {/* Sale badge */}
        {discountPct && showSaleBadge && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-500 text-white uppercase tracking-wide">Sale</span>
          </div>
        )}
        {/* New badge */}
        {isNew && !discountPct && !isOutOfStock && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 text-white uppercase tracking-wide" style={{ background: accent, color: accentText }}>New</span>
          </div>
        )}
        {/* Wishlist button */}
        {showWishlist && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            style={{ background: "rgba(255,255,255,0.9)", color: wishlisted ? "#ef4444" : "#6b7280" }}>
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-red-500" : ""}`} />
          </button>
        )}
        {/* Sold out overlay */}
        {isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 py-2 text-center text-xs font-semibold text-white bg-black/60">
            Sold out
          </div>
        )}
        {/* Quick add — slides up on hover */}
        {!isOutOfStock && showQuickAdd && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
            <button
              onClick={handleAdd}
              className="w-full py-2.5 text-xs font-semibold border-t transition-colors"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}>
              <AnimatePresence mode="wait">
                {justAdded
                  ? <motion.span key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1.5"><Check className="w-3 h-3" />Added</motion.span>
                  : <motion.span key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Quick add</motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="pt-2">
        {showProductType && TYPE_META[product.type] && (
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.muted }}>
            {TYPE_META[product.type].label}
          </p>
        )}
        <p className="text-xs leading-snug line-clamp-2" style={{ color: theme.text }}>{product.name}</p>
        {showRatings && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs font-semibold" style={{ color: theme.text }}>{fmt(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs line-through" style={{ color: theme.muted }}>{fmt(product.comparePrice)}</span>
          )}
        </div>
        {stockBadge && product.inventory !== null && product.inventory <= stockBadgeThreshold && product.inventory > 0 && (
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#d97706" }}>Only {product.inventory} left!</p>
        )}
      </div>
    </motion.div>
  );
}
