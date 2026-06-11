"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutTemplate, Palette, Search, Settings2, X, Plus, Trash2,
  Save, Loader2, Check, Monitor, Shield, Zap, RefreshCw,
  ShoppingCart, SlidersHorizontal, ChevronDown, ChevronUp, Star, Upload, ImageIcon, Move,
  Undo2, Redo2, Layers, Globe, Smartphone, HelpCircle, Sparkles, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { SectionsBuilder } from "./sections-builder";
import { defaultHomeLayout, pageUid, slugify, type CustomPage } from "@/lib/store-sections";
import { StoreSections } from "@/app/[username]/store/store-sections";
import { CURRENCIES, CURRENCY_CODES } from "@/lib/currencies";

// Readable text colour for content on a coloured background (mirrors the storefront).
function previewReadableTextOn(hex: string): string {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(f.slice(0, 2), 16) || 0, g = parseInt(f.slice(2, 4), 16) || 0, b = parseInt(f.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#111111" : "#ffffff";
}
import {
  STORE_THEMES, THEME_CATEGORIES, BUTTON_STYLES, CARD_STYLES, LAYOUTS, IMAGE_RATIOS,
  FONT_STYLES, HERO_STYLES, NAV_STYLES, NAV_HEIGHTS, BACKGROUND_EFFECTS, FOOTER_STYLES,
  HERO_SIZES, STORE_TEMPLATES, DEFAULT_SETTINGS,
  type StoreSettings,
  type CustomButton,
  type HeroItem,
} from "@/lib/store-themes";

type SectionId =
  | "announcements"
  | "header"
  | "hero"
  | "products"
  | "sections"
  | "productpage"
  | "markets"
  | "content"
  | "social"
  | "templates"
  | "theme"
  | "seo"
  | "advanced";

function PanelSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  /** When true the section can be folded away, used for advanced/optional settings. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Optional one-line description shown under the header for scannability. */
  hint?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <div className="px-4 py-4">
        {/* Stronger header hierarchy: darker, slightly larger title so sections
            are scannable and clearly separated rather than all looking alike. */}
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-left group"
            aria-expanded={isOpen}
          >
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform group-hover:text-gray-600 ${isOpen ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
        )}
        {hint && isOpen && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{hint}</p>}
        {isOpen && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

// Mini mockup of each hero layout, matched to how it actually renders.
// Gray gradient = the hero background photo; white bars = text over the photo;
// dark bars = text on a white background; orange pill = CTA button.
function HeroThumb({ id }: { id: string }) {
  const wrap = "w-full h-16 rounded-md overflow-hidden border border-gray-200";
  const photo = "bg-gradient-to-br from-slate-400 to-slate-300";

  switch (id) {
    case "showcase": // text + 2 buttons left, image card right, white bg
      return (
        <div className={`${wrap} bg-white flex items-center gap-1.5 p-2`}>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2 w-3/4 rounded-full bg-gray-800" />
            <div className="h-1 w-1/2 rounded-full bg-gray-300" />
            <div className="flex gap-1 mt-0.5">
              <div className="h-2 w-5 rounded-[2px] bg-orange-400" />
              <div className="h-2 w-5 rounded-[2px] border border-gray-300" />
            </div>
          </div>
          <div className={`${photo} w-2/5 self-stretch rounded-lg`} />
        </div>
      );
    case "marquee": // full photo with one giant line of text across it
      return (
        <div className={`${wrap} ${photo} flex items-center justify-center p-1.5`}>
          <div className="h-3.5 w-full rounded-[2px] bg-white/85" />
        </div>
      );
    case "editorial": // centered headline + button, then a wide image below
      return (
        <div className={`${wrap} bg-white flex flex-col items-center gap-1 p-2`}>
          <div className="h-2 w-1/2 rounded-full bg-gray-800" />
          <div className="h-1.5 w-5 rounded-[2px] bg-orange-400" />
          <div className={`${photo} w-full flex-1 rounded mt-0.5`} />
        </div>
      );
    case "product": // full photo, left-aligned text + outlined button
      return (
        <div className={`${wrap} ${photo} flex flex-col items-start justify-center gap-1 p-2`}>
          <div className="h-2 w-3/5 rounded-full bg-white/90" />
          <div className="h-1 w-2/5 rounded-full bg-white/60" />
          <div className="h-2.5 w-7 rounded-[2px] border border-white/85 mt-0.5" />
        </div>
      );
    case "cover": // full photo, centered title + subtitle, no button
      return (
        <div className={`${wrap} ${photo} flex flex-col items-center justify-center gap-1 p-2`}>
          <div className="h-2.5 w-2/5 rounded-full bg-white/90" />
          <div className="h-1 w-1/4 rounded-full bg-white/60" />
        </div>
      );
    case "centered": // full photo, centered logo + text
      return (
        <div className={`${wrap} ${photo} flex flex-col items-center justify-center gap-1 p-2`}>
          <div className="w-3 h-3 rounded-full bg-white/85" />
          <div className="h-1.5 w-2/5 rounded-full bg-white/90" />
          <div className="h-1 w-1/4 rounded-full bg-white/60" />
        </div>
      );
    case "split": // slim header, thin photo strip, logo + details on the left
      return (
        <div className={`${wrap} bg-white flex flex-col`}>
          <div className={`${photo} h-1/3 w-full`} />
          <div className="flex-1 flex items-center gap-1.5 px-2">
            <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="flex flex-col gap-1"><div className="h-1.5 w-10 rounded-full bg-gray-700" /><div className="h-1 w-7 rounded-full bg-gray-300" /></div>
          </div>
        </div>
      );
    case "minimal": // slim nav bar, then straight to a product grid
      return (
        <div className={`${wrap} bg-white flex flex-col p-2 gap-1.5`}>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300" /><div className="h-1 w-1/4 rounded-full bg-gray-300" /><div className="flex-1" /><div className="h-1 w-1/6 rounded-full bg-gray-300" /></div>
          <div className="grid grid-cols-4 gap-1 flex-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-200 rounded-[2px]" />)}</div>
        </div>
      );
    default: // storefront, full photo, centered headline + outlined button
      return (
        <div className={`${wrap} ${photo} flex flex-col items-center justify-center gap-1 p-2`}>
          <div className="h-2 w-3/5 rounded-full bg-white/90" />
          <div className="h-2.5 w-7 rounded-[2px] border border-white/85 mt-0.5" />
        </div>
      );
  }
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative inline-flex flex-shrink-0 w-10 h-5 rounded-full transition-colors ${value ? "bg-[#2e9cfe]" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#2e9cfe] focus:ring-1 focus:ring-[#2e9cfe]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 font-mono focus:outline-none focus:border-[#2e9cfe]"
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-700">{label}</label>
        <span className="text-xs text-gray-400 font-medium">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#2e9cfe]"
      />
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) onChange(json.url);
    } catch {}
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2" style={{ aspectRatio: "16/7" }}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border border-dashed border-gray-300 hover:border-[#2e9cfe] cursor-pointer transition-colors mb-2"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Click to upload</span>
            </>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 text-red-400 hover:text-red-500 transition-all"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

interface PreviewProduct {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  type: string;
  images: string[];
  inventory: number | null;
}

export default function StoreCustomizePage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("My Store");
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [realProducts, setRealProducts] = useState<PreviewProduct[]>([]);
  const [heroSnapEnabled, setHeroSnapEnabled] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [focusMode, setFocusMode] = useState(false); // hides section tabs + settings panel so the preview is the hero
  // First-time "Get started" guide. Shown by default in the right panel until the
  // user dismisses it; reopenable any time via the toolbar "Guide" button.
  const [showGuide, setShowGuide] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);   // unpublished changes exist
  const [publishing, setPublishing] = useState(false);
  // Ref always holds the latest settings so the debounce timer captures current value
  const latestSettings = useRef<StoreSettings>(DEFAULT_SETTINGS);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyStack = useRef<StoreSettings[]>([DEFAULT_SETTINGS]);
  const historyCursor = useRef(0);
  const historyGroupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyGroupKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, pRes, prodRes] = await Promise.all([
          fetch("/api/store/settings"),
          fetch("/api/user/profile"),
          fetch("/api/products"),
        ]);
        if (sRes.ok) {
          const data = await sRes.json();
          if (data && Object.keys(data).length > 0) {
            // If an unpublished draft exists, edit the draft; otherwise edit the live settings.
            const draft = data.draftSettings && typeof data.draftSettings === "object" ? data.draftSettings : null;
            const merged = { ...DEFAULT_SETTINGS, ...data, ...(draft ?? {}) };
            setHasDraft(!!draft);
            latestSettings.current = merged;
            historyStack.current = [merged];
            historyCursor.current = 0;
            setCanUndo(false);
            setCanRedo(false);
            setSettings(merged);
            if (data.name) setStoreName(data.name);
          }
        }
        if (pRes.ok) {
          const p = await pRes.json();
          if (p.username) setUsername(p.username);
          if (p.image) setUserImage(p.image);
          if (p.name) setStoreName((prev) => (prev === "My Store" ? p.name : prev));
        }
        if (prodRes.ok) {
          const prods = await prodRes.json();
          if (Array.isArray(prods)) {
            setRealProducts(prods.filter((p: PreviewProduct) => p.id).slice(0, 8));
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Persistent channel, creating a new channel and closing it right after
  // postMessage can drop the message, so we keep one open for the session.
  const previewChannelRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    try { previewChannelRef.current = new BroadcastChannel("nexus_store_preview"); } catch {}
    return () => { try { previewChannelRef.current?.close(); } catch {} previewChannelRef.current = null; };
  }, []);

  const broadcast = useCallback((s: StoreSettings) => {
    try { previewChannelRef.current?.postMessage({ type: "settings_update", settings: s }); } catch {}
    try { localStorage.setItem("nexus_settings_updated", Date.now().toString()); } catch {}
  }, []);

  const doSave = useCallback(async (s: StoreSettings) => {
    try {
      // Auto-save writes to the DRAFT, changes don't go live until you Publish.
      const res = await fetch("/api/store/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (res.ok) {
        setSaved(true);
        setHasDraft(true);
        setSaveError(null);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const raw = await res.text().catch(() => "(unreadable)");
        console.error("[doSave] raw server response:", res.status, raw.slice(0, 3000));
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(raw); } catch {}
        const msg = (body?.error as string | undefined) ?? `HTTP ${res.status}`;
        setSaveError(msg);
        setTimeout(() => setSaveError(null), 8000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[doSave] fetch error:", err);
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 8000);
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(latestSettings.current), 1200);
  }, [doSave]);

  // Publish the draft, make the current edits live on the store.
  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      // Ensure the latest draft is saved first, then publish it.
      await doSave(latestSettings.current);
      const res = await fetch("/api/store/draft", { method: "POST" });
      if (res.ok) {
        setHasDraft(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const body = await res.json().catch(() => ({}));
        setSaveError((body as any)?.error ?? "Failed to publish");
        setTimeout(() => setSaveError(null), 6000);
      }
    } finally {
      setPublishing(false);
    }
  }, [doSave]);

  // Discard the draft, revert the editor to the live (published) settings.
  const discardDraft = useCallback(async () => {
    if (!confirm("Discard all unpublished changes and revert to the live store?")) return;
    setPublishing(true);
    try {
      await fetch("/api/store/draft", { method: "DELETE" });
      const sRes = await fetch("/api/store/settings");
      if (sRes.ok) {
        const data = await sRes.json();
        const merged = { ...DEFAULT_SETTINGS, ...data };
        latestSettings.current = merged;
        historyStack.current = [merged];
        historyCursor.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setSettings(merged);
        broadcast(merged);
      }
      setHasDraft(false);
    } finally {
      setPublishing(false);
    }
  }, [broadcast]);

  const update = useCallback(
    (patch: Partial<StoreSettings>) => {
      const next = { ...latestSettings.current, ...patch };
      latestSettings.current = next;

      const patchKeys = Object.keys(patch);
      // Group consecutive changes to the same keys (e.g. slider/color drags) into one history entry
      const isSameGroup =
        historyGroupTimer.current !== null &&
        patchKeys.length > 0 &&
        patchKeys.every(k => historyGroupKeys.current.has(k));

      if (isSameGroup) {
        // Replace the latest entry, don't add a new undo step
        historyStack.current[historyCursor.current] = next;
        clearTimeout(historyGroupTimer.current!);
      } else {
        // New action, push a fresh history entry
        const stack = historyStack.current.slice(0, historyCursor.current + 1);
        stack.push(next);
        if (stack.length > 50) stack.shift();
        historyStack.current = stack;
        historyCursor.current = stack.length - 1;
        setCanUndo(historyCursor.current > 0);
        setCanRedo(false);
        historyGroupKeys.current = new Set(patchKeys);
      }

      // Extend / start the grouping window (800ms of inactivity closes the group)
      historyGroupTimer.current = setTimeout(() => {
        historyGroupTimer.current = null;
        historyGroupKeys.current = new Set();
      }, 800);

      setSettings(next);
      setSaved(false);
      broadcast(next);
      scheduleSave();
    },
    [broadcast, scheduleSave]
  );

  const undo = useCallback(() => {
    if (historyCursor.current <= 0) return;
    historyCursor.current--;
    const prev = historyStack.current[historyCursor.current];
    latestSettings.current = prev;
    setSettings(prev);
    setSaved(false);
    broadcast(prev);
    setCanUndo(historyCursor.current > 0);
    setCanRedo(true);
    scheduleSave();
  }, [broadcast, scheduleSave]);

  const redo = useCallback(() => {
    if (historyCursor.current >= historyStack.current.length - 1) return;
    historyCursor.current++;
    const next = historyStack.current[historyCursor.current];
    latestSettings.current = next;
    setSettings(next);
    setSaved(false);
    broadcast(next);
    setCanUndo(true);
    setCanRedo(historyCursor.current < historyStack.current.length - 1);
    scheduleSave();
  }, [broadcast, scheduleSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "y")                { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const save = async () => {
    setSaving(true);
    await doSave(latestSettings.current);
    setSaving(false);
  };

  const openSection = (s: SectionId) => {
    setActiveSection((prev) => (prev === s ? null : s));
  };

  // Show the get-started guide to first-time users (until they dismiss it).
  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowGuide(localStorage.getItem("sellora:customizeGuideDismissed") !== "1");
  }, []);
  const dismissGuide = () => {
    setShowGuide(false);
    try { localStorage.setItem("sellora:customizeGuideDismissed", "1"); } catch {}
  };
  const openGuide = () => { setActiveSection(null); setShowGuide(true); };
  // Open a section from the guide.
  const goToFromGuide = (s: SectionId) => { setShowGuide(true); setActiveSection(s); };

  // Click-to-edit: the live preview iframe posts the section a shopper clicked;
  // open that panel (set, not toggle, so repeated clicks keep it open).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "nexus_edit_section" && typeof e.data.section === "string") {
        const valid: SectionId[] = ["announcements", "header", "hero", "products", "sections", "content", "social"];
        if (valid.includes(e.data.section as SectionId)) setActiveSection(e.data.section as SectionId);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const PANEL_TITLES: Record<SectionId, string> = {
    announcements: "Announcement Bar",
    header: "Header & Navigation",
    hero: "Hero Section",
    products: "Products & Cards",
    sections: "Page Sections",
    productpage: "Product Page",
    markets: "Markets & Currency",
    content: "Content Sections",
    social: "Footer & Social",
    templates: "Templates",
    theme: "Theme & Colors",
    seo: "SEO Settings",
    advanced: "Advanced",
  };

  const renderPanel = (section: SectionId) => {
    if (section === "sections") {
      // Core sections that won't actually render on the live store (their
      // feature is toggled off or empty), the builder marks these "Hidden"
      // so it never lists a section that doesn't appear on the page.
      const hiddenCores = new Set<string>();
      if (!(settings.showTrustBar ?? true) || settings.heroStyle === "minimal") hiddenCores.add("trustbar");
      if (!settings.iconRowEnabled || !((settings.iconRowItems ?? []).length)) hiddenCores.add("iconrow");
      if (!settings.testimonialsEnabled || !((settings.testimonialItems ?? []).length)) hiddenCores.add("testimonials");
      if (!settings.imageBannerEnabled) hiddenCores.add("imagebanner");
      if (!settings.showNewsletter) hiddenCores.add("newsletter");

      // Custom pages, user-created, each rendered at /store/p/{slug}.
      const customPages = settings.customPages ?? [];
      const updatePage = (id: string, patch: Partial<CustomPage>) =>
        update({ customPages: customPages.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
      const addPage = () => {
        const id = pageUid();
        update({ customPages: [...customPages, { id, title: "New page", slug: "page-" + id.slice(-4), sections: [] }] });
      };
      const deletePage = (id: string) =>
        update({ customPages: customPages.filter((p) => p.id !== id) });

      return (
        <SectionsBuilder
          onEditCore={(panel) => panel && openSection(panel as SectionId)}
          hiddenCores={hiddenCores}
          onAddPage={addPage}
          pages={[
            { key: "home", label: "Home", hasCore: true,
              sections: (settings.homeLayout?.length ? settings.homeLayout : defaultHomeLayout(settings.homeSections ?? [])),
              onChange: (next) => update({ homeLayout: next }) },
            { key: "collection", label: "Collection", sections: settings.collectionSections ?? [], onChange: (next) => update({ collectionSections: next as StoreSettings["collectionSections"] }) },
            { key: "product", label: "Product", sections: settings.productSections ?? [], onChange: (next) => update({ productSections: next as StoreSettings["productSections"] }) },
            ...customPages.map((pg) => ({
              key: "page:" + pg.id,
              label: pg.title || "Untitled",
              custom: true,
              slug: pg.slug,
              sections: (pg.sections ?? []) as StoreSettings["collectionSections"],
              onChange: (next: import("@/lib/store-sections").LayoutItem[]) => updatePage(pg.id, { sections: next as unknown as CustomPage["sections"] }),
              onRename: (title: string) => updatePage(pg.id, { title }),
              onSlugChange: (slug: string) => updatePage(pg.id, { slug: slugify(slug) }),
              onDelete: () => deletePage(pg.id),
            })),
          ]}
        />
      );
    }
    if (section === "productpage") {
      return (
        <>
          <PanelSection title="Image Gallery">
            <SelectRow
              label="Gallery style"
              value={settings.productGalleryStyle ?? "thumbnails"}
              options={[
                { value: "thumbnails", label: "Thumbnails + main image" },
                { value: "stacked", label: "Stacked (scrolling)" },
                { value: "grid", label: "Grid mosaic" },
              ]}
              onChange={(v) => update({ productGalleryStyle: v as StoreSettings["productGalleryStyle"] })}
            />
          </PanelSection>
          <PanelSection title="Product Info">
            <SelectRow
              label="Description layout"
              value={settings.productInfoLayout ?? "accordion"}
              options={[
                { value: "accordion", label: "Accordion" },
                { value: "tabs", label: "Tabs" },
              ]}
              onChange={(v) => update({ productInfoLayout: v as StoreSettings["productInfoLayout"] })}
            />
          </PanelSection>
          <PanelSection title="Related Products">
            <ToggleRow
              label="Show related products"
              value={settings.showRelatedProducts ?? true}
              onChange={(v) => update({ showRelatedProducts: v })}
            />
            {(settings.showRelatedProducts ?? true) && (
              <SliderRow
                label="How many to show"
                value={settings.relatedProductsCount ?? 4}
                min={2}
                max={8}
                onChange={(v) => update({ relatedProductsCount: v })}
              />
            )}
          </PanelSection>
        </>
      );
    }
    if (section === "markets") {
      const base = settings.baseCurrency || "USD";
      const enabled = settings.enabledCurrencies ?? [];
      const toggleCurrency = (code: string) => {
        const next = enabled.includes(code)
          ? enabled.filter((c) => c !== code)
          : [...enabled, code];
        update({ enabledCurrencies: next });
      };
      return (
        <>
          <PanelSection title="Base Currency">
            <p className="text-xs text-gray-500 mb-3">All checkout payments are processed in this currency via Stripe.</p>
            <SelectRow
              label="Store currency"
              value={base}
              options={CURRENCY_CODES.map((c) => ({ value: c, label: `${CURRENCIES[c].name} (${c})` }))}
              onChange={(v) => update({ baseCurrency: v })}
            />
          </PanelSection>
          <PanelSection title="Currency Switcher">
            <ToggleRow
              label="Show currency switcher"
              value={settings.showCurrencySwitcher ?? false}
              onChange={(v) => update({ showCurrencySwitcher: v })}
            />
            <p className="text-xs text-gray-500 mt-2">
              Lets shoppers preview prices in their own currency. Amounts are converted using approximate rates for display only, charges are still made in {base}.
            </p>
          </PanelSection>
          {(settings.showCurrencySwitcher ?? false) && (
            <PanelSection title="Display Currencies">
              <p className="text-xs text-gray-500 mb-3">Choose which currencies shoppers can switch to (in addition to your base currency).</p>
              <div className="space-y-1.5">
                {CURRENCY_CODES.filter((c) => c !== base).map((code) => (
                  <label key={code} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled.includes(code)}
                      onChange={() => toggleCurrency(code)}
                      className="w-4 h-4 rounded accent-[#2e9cfe]"
                    />
                    <span className="text-sm text-gray-700">{CURRENCIES[code].name}</span>
                    <span className="ml-auto text-xs text-gray-400">{code} {CURRENCIES[code].symbol}</span>
                  </label>
                ))}
              </div>
            </PanelSection>
          )}
        </>
      );
    }
    if (section === "templates") {
      return (
        <PanelSection title="Choose a Template">
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            A template applies a full look, palette, fonts, hero layout &amp; grid. You can fine-tune everything afterwards.
          </p>
          <div className="space-y-3">
            {STORE_TEMPLATES.map((t) => {
              const active = settings.theme === t.settings.theme && settings.heroStyle === t.settings.heroStyle;
              return (
                <button
                  key={t.id}
                  onClick={() => update(t.settings)}
                  className={`block w-full rounded-2xl border bg-white text-left transition-all overflow-hidden ${
                    active ? "border-[#2e9cfe] ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <TemplatePreview t={t} />
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-800">{t.name}</div>
                      {active && <span className="text-[10px] font-semibold text-[#2e9cfe]">Applied</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">{t.desc}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </PanelSection>
      );
    }

    if (section === "theme") {
      return (
        <>
          <PanelSection title="Theme">
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Each theme sets a colour palette, font &amp; button style together. You can fine-tune any of them below afterwards.
            </p>
            <div className="space-y-4">
              {THEME_CATEGORIES.map((cat) => {
                const entries = Object.entries(STORE_THEMES).filter(([, t]) => t.category === cat);
                if (!entries.length) return null;
                return (
                  <div key={cat}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{cat}</div>
                    <div className="space-y-2">
                      {entries.map(([id, t]) => {
                        const selected = settings.theme === id;
                        const btnRadius = BUTTON_STYLES[t.button]?.radius ?? "rounded-lg";
                        const fontCls = FONT_STYLES[t.font]?.className ?? "font-sans";
                        return (
                          <button
                            key={id}
                            onClick={() => update({ theme: id, fontStyle: t.font, buttonStyle: t.button, primaryColor: t.accent })}
                            title={t.name}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all ${
                              selected ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={{ background: t.bg }}
                          >
                            {/* Aa specimen in the theme's font */}
                            <span className={`${fontCls} text-2xl leading-none font-bold w-9 text-center flex-shrink-0`} style={{ color: t.text }}>Aa</span>
                            {/* palette swatches */}
                            <span className="flex h-7 flex-1 rounded-md overflow-hidden border" style={{ borderColor: t.border }}>
                              {t.palette.map((c, i) => (
                                <span key={i} className="flex-1" style={{ background: c }} />
                              ))}
                            </span>
                            {/* button sample */}
                            <span className={`text-[10px] font-semibold px-2.5 py-1.5 ${btnRadius} flex-shrink-0`} style={{ background: t.accent, color: t.accentText }}>
                              Button
                            </span>
                            {selected && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelSection>
          <PanelSection title="Accent Color">
            <ColorInput label="Primary Color" value={settings.primaryColor} onChange={(v) => update({ primaryColor: v })} />
          </PanelSection>
          <PanelSection title="Typography">
            <SelectRow
              label="Font Style"
              value={settings.fontStyle}
              options={Object.entries(FONT_STYLES).map(([id, f]) => ({ value: id, label: f.name }))}
              onChange={(v) => update({ fontStyle: v })}
            />
            <SelectRow
              label="Text Scale"
              value={settings.typographyScale ?? "normal"}
              options={[
                { value: "sm", label: "Small" },
                { value: "normal", label: "Normal" },
                { value: "lg", label: "Large" },
              ]}
              onChange={(v) => update({ typographyScale: v })}
            />
          </PanelSection>
          <PanelSection title="Background">
            <SelectRow
              label="Background Effect"
              value={settings.backgroundEffect}
              options={Object.entries(BACKGROUND_EFFECTS).map(([id, e]) => ({ value: id, label: e.name }))}
              onChange={(v) => update({ backgroundEffect: v })}
            />
          </PanelSection>
          <PanelSection title="Button Shape">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(BUTTON_STYLES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ buttonStyle: id })}
                  className={`py-2 text-xs font-medium transition-all border ${
                    settings.buttonStyle === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                  style={{
                    borderRadius:
                      s.radius === "rounded-full"
                        ? "9999px"
                        : s.radius === "rounded-none"
                        ? "0"
                        : s.radius === "rounded-2xl"
                        ? "16px"
                        : s.radius === "rounded-xl"
                        ? "12px"
                        : "8px",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </PanelSection>
        </>
      );
    }

    if (section === "announcements") {
      return (
        <>
          <PanelSection title="Announcement Bar">
            <ToggleRow
              label="Show Announcement"
              value={!!settings.announcementText}
              onChange={(v) =>
                update({
                  announcementText: v ? settings.announcementText || "Free shipping on orders over $50!" : null,
                })
              }
            />
            {settings.announcementText !== null && (
              <>
                <div className="mb-3 mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Message</label>
                  <input
                    type="text"
                    value={settings.announcementText ?? ""}
                    onChange={(e) => update({ announcementText: e.target.value })}
                    placeholder="Free shipping on orders over $50!"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <ColorInput
                  label="Bar Color"
                  value={settings.announcementColor}
                  onChange={(v) => update({ announcementColor: v })}
                />
              </>
            )}
          </PanelSection>
          <PanelSection title="Ticker / Marquee">
            <ToggleRow
              label="Enable Ticker"
              value={settings.tickerEnabled}
              onChange={(v) => update({ tickerEnabled: v })}
            />
            {settings.tickerEnabled && (
              <>
                <div className="mb-3 mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Ticker Text</label>
                  <input
                    type="text"
                    value={settings.tickerText ?? ""}
                    onChange={(e) => update({ tickerText: e.target.value })}
                    placeholder="NEW ARRIVALS ✦ FREE SHIPPING ✦ LIMITED TIME"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <SelectRow
                  label="Speed"
                  value={settings.tickerSpeed ?? "normal"}
                  options={[
                    { value: "slow", label: "Slow" },
                    { value: "normal", label: "Normal" },
                    { value: "fast", label: "Fast" },
                  ]}
                  onChange={(v) => update({ tickerSpeed: v })}
                />
              </>
            )}
          </PanelSection>
        </>
      );
    }

    if (section === "header") {
      return (
        <>
          <PanelSection title="Store Identity">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.name ?? ""}
                onChange={(e) => update({ name: e.target.value || null })}
                placeholder="Your store name"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline ?? ""}
                onChange={(e) => update({ tagline: e.target.value || null })}
                placeholder="Your store tagline"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
              />
            </div>
          </PanelSection>
          <PanelSection title="Logo Image">
            <ImageUploadField
              label="Store Logo"
              value={settings.logoImage}
              onChange={(url) => update({ logoImage: url })}
              hint="Square or landscape logo. Shown in the store header."
            />
          </PanelSection>
          <PanelSection title="Popup">
            <ToggleRow label="Enable Popup" value={settings.popupEnabled ?? false} onChange={(v) => update({ popupEnabled: v })} />
            {(settings.popupEnabled ?? false) && (
              <>
                <div className="mb-3 mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Popup Title</label>
                  <input
                    type="text"
                    value={settings.popupTitle ?? ""}
                    onChange={(e) => update({ popupTitle: e.target.value || null })}
                    placeholder="Get 10% off your first order"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <SliderRow
                  label="Delay (seconds)"
                  value={settings.popupDelay ?? 5}
                  min={0}
                  max={30}
                  onChange={(v) => update({ popupDelay: v })}
                />
              </>
            )}
          </PanelSection>
          <PanelSection title="Navigation Style">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(NAV_STYLES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ navStyle: id })}
                  className={`px-3 py-2 rounded-lg text-xs text-left border transition-all ${
                    settings.navStyle === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Header Size">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(NAV_HEIGHTS).map(([id, h]) => (
                <button
                  key={id}
                  onClick={() => update({ navHeight: id })}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    (settings.navHeight ?? "default") === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Behavior">
            <ToggleRow label="Sticky Header" value={settings.stickyHeader} onChange={(v) => update({ stickyHeader: v })} />
          </PanelSection>
        </>
      );
    }

    if (section === "hero") {
      const heroItems = (settings.heroItems ?? []) as HeroItem[];
      const setHeroItems = (next: HeroItem[]) => update({ heroItems: next });
      const addHeroItem = (type: "text" | "button") =>
        setHeroItems([...heroItems, type === "button"
          ? { id: "hi_" + Math.random().toString(36).slice(2, 9), type, text: "Learn more", url: "#products", style: "outline" }
          : { id: "hi_" + Math.random().toString(36).slice(2, 9), type, text: "Add a line of text", size: "md" }]);
      const patchHeroItem = (id: string, p: Partial<HeroItem>) =>
        setHeroItems(heroItems.map((it) => (it.id === id ? { ...it, ...p } : it)));
      const removeHeroItem = (id: string) => setHeroItems(heroItems.filter((it) => it.id !== id));
      const moveHeroItem = (from: number, to: number) => {
        if (to < 0 || to >= heroItems.length) return;
        const arr = [...heroItems];
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        setHeroItems(arr);
      };
      return (
        <>
          <PanelSection title="Hero Image">
            <ImageUploadField
              label="Background Image"
              value={settings.bannerImage}
              onChange={(url) => update({ bannerImage: url })}
              hint="Recommended: 1400×500px or wider. Used as the hero background."
            />
          </PanelSection>
          <PanelSection title="Hero Layout">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(HERO_STYLES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ heroStyle: id })}
                  className={`p-2 rounded-lg text-xs text-left border transition-all ${
                    settings.heroStyle === id
                      ? "border-blue-400 bg-blue-50 text-blue-600 ring-1 ring-blue-400"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <HeroThumb id={id} />
                  <div className="font-medium mt-1.5">{s.name}</div>
                  <div className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Hero Text">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Headline</label>
              <input
                type="text"
                value={settings.heroHeading ?? ""}
                onChange={(e) => update({ heroHeading: e.target.value || null })}
                placeholder={settings.tagline || "Your store headline"}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
              />
              <p className="text-[10px] text-gray-400 mt-1">Leave blank to use your tagline or store name.</p>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Subheading</label>
              <textarea
                value={settings.heroSubheading ?? ""}
                onChange={(e) => update({ heroSubheading: e.target.value || null })}
                placeholder="A short supporting line under the headline"
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe] resize-none"
              />
            </div>
            {settings.heroStyle === "marquee" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Scrolling Text</label>
                <input
                  type="text"
                  value={settings.heroMarqueeText ?? ""}
                  onChange={(e) => update({ heroMarqueeText: e.target.value || null })}
                  placeholder={settings.heroHeading || settings.tagline || "Big scrolling words"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                />
                <p className="text-[10px] text-gray-400 mt-1">The giant text that scrolls across the hero. Scroll speed follows your Ticker speed setting.</p>
              </div>
            )}
          </PanelSection>
          <PanelSection title="Hero Content">
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Add extra text lines and buttons to the hero, they appear beneath the headline.
            </p>
            <div className="space-y-2">
              {heroItems.map((it, i) => (
                <div key={it.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-2 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{it.type}</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <button onClick={() => moveHeroItem(i, i - 1)} disabled={i === 0} className="p-1 text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveHeroItem(i, i + 1)} disabled={i === heroItems.length - 1} className="p-1 text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeHeroItem(it.id)} className="p-1 text-gray-300 hover:text-red-500" title="Remove"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <input
                    value={it.text}
                    onChange={(e) => patchHeroItem(it.id, { text: e.target.value })}
                    placeholder={it.type === "button" ? "Button label" : "Text"}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                  {it.type === "button" && (
                    <>
                      <input
                        value={it.url ?? ""}
                        onChange={(e) => patchHeroItem(it.id, { url: e.target.value })}
                        placeholder="#products or https://…"
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {(["primary", "outline", "ghost"] as const).map((s) => (
                          <button key={s} onClick={() => patchHeroItem(it.id, { style: s })}
                            className={`py-1 text-[11px] rounded-md border capitalize transition-colors ${ (it.style ?? "primary") === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {it.type === "text" && (
                    <div className="grid grid-cols-3 gap-1">
                      {(["sm", "md", "lg"] as const).map((s) => (
                        <button key={s} onClick={() => patchHeroItem(it.id, { size: s })}
                          className={`py-1 text-[11px] rounded-md border uppercase transition-colors ${ (it.size ?? "md") === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => addHeroItem("text")} className="flex-1 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">+ Text</button>
              <button onClick={() => addHeroItem("button")} className="flex-1 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">+ Button</button>
            </div>
          </PanelSection>
          <PanelSection title="Hero Size">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(HERO_SIZES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ heroSize: id })}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    settings.heroSize === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Text Alignment">
            <div className="grid grid-cols-3 gap-2">
              {["left", "center", "right"].map((align) => (
                <button
                  key={align}
                  onClick={() => update({ heroTextAlign: align })}
                  className={`py-2 rounded-lg text-xs font-medium border capitalize transition-all ${
                    settings.heroTextAlign === align
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="CTA Button">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Button Text</label>
              <input
                type="text"
                value={settings.ctaText ?? ""}
                onChange={(e) => update({ ctaText: e.target.value || null })}
                placeholder="Shop Now"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
              />
            </div>
            {settings.heroStyle === "marquee" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Button Position</label>
                <div className="grid grid-cols-3 gap-1 w-[88px]">
                  {(["top", "mid", "bottom"] as const).flatMap((v) =>
                    (["left", "center", "right"] as const).map((h) => {
                      const pos = `${v}-${h}`;
                      const active = (settings.heroCtaPos ?? "top-right") === pos;
                      return (
                        <button
                          key={pos}
                          onClick={() => update({ heroCtaPos: pos })}
                          title={pos.replace("-", " ")}
                          className={`h-7 rounded-md border flex items-center justify-center transition-all ${active ? "border-[#2e9cfe] bg-blue-50" : "border-gray-200 hover:border-gray-400"}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${active ? "bg-[#2e9cfe]" : "bg-gray-300"}`} />
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Where the Shop button floats over the marquee hero.</p>
              </div>
            )}
          </PanelSection>
          <PanelSection title="Overlay">
            <SliderRow
              label="Background Overlay"
              value={settings.heroOverlay ?? 50}
              min={0}
              max={90}
              step={5}
              onChange={(v) => update({ heroOverlay: v })}
            />
          </PanelSection>
          <PanelSection title="Content Position">
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Click or drag anywhere in the hero preview to reposition the text block.
            </p>
            <ToggleRow
              label="Snap to grid"
              value={heroSnapEnabled}
              onChange={setHeroSnapEnabled}
            />
            {!!(settings.elementPositions as Record<string, unknown>)?.heroContent && (
              <button
                onClick={() => {
                  const elPos = { ...(settings.elementPositions ?? {}) } as Record<string, { x: number; y: number }>;
                  delete elPos.heroContent;
                  update({ elementPositions: elPos });
                }}
                className="mt-2 w-full py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 transition-all"
              >
                Reset to default position
              </button>
            )}
          </PanelSection>
        </>
      );
    }

    if (section === "products") {
      return (
        <>
          <PanelSection title="Product Grid">
            <SelectRow
              label="Layout"
              value={settings.layout}
              options={Object.entries(LAYOUTS).map(([id, l]) => ({ value: id, label: l.name }))}
              onChange={(v) => update({ layout: v })}
            />
            {settings.layout === "carousel" && (
              <>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Carousel Rows</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => update({ carouselRows: n })}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                          (settings.carouselRows ?? 1) === n
                            ? "border-blue-400 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {n === 1 ? "1 Row" : `${n} Rows`}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow
                  label="Auto-scroll carousel"
                  value={settings.carouselAutoplay ?? false}
                  onChange={(v) => update({ carouselAutoplay: v })}
                />
              </>
            )}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.sectionTitle ?? ""}
                onChange={(e) => update({ sectionTitle: e.target.value || null })}
                placeholder="Featured Products"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
              />
            </div>
          </PanelSection>
          <PanelSection title="Card Style">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CARD_STYLES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ cardStyle: id })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    settings.cardStyle === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Image Ratio">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(IMAGE_RATIOS).map(([id, r]) => (
                <button
                  key={id}
                  onClick={() => update({ imageRatio: id })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    settings.imageRatio === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Product Features">
            <ToggleRow label="Sale Badge" value={settings.showSaleBadge} onChange={(v) => update({ showSaleBadge: v })} />
            <ToggleRow label="New Badge" value={settings.showNewBadge} onChange={(v) => update({ showNewBadge: v })} />
            <ToggleRow label="Quick Add Button" value={settings.showQuickAdd} onChange={(v) => update({ showQuickAdd: v })} />
            <ToggleRow label="Product Type Label" value={settings.showProductType} onChange={(v) => update({ showProductType: v })} />
            <ToggleRow label="Trust Bar" value={settings.showTrustBar} onChange={(v) => update({ showTrustBar: v })} />
            <ToggleRow label="Star Ratings" value={settings.showRatings} onChange={(v) => update({ showRatings: v })} />
            <ToggleRow label="Filters & Search" value={settings.showFilters} onChange={(v) => update({ showFilters: v })} />
            <ToggleRow label="Product Count" value={settings.showProductCount} onChange={(v) => update({ showProductCount: v })} />
            <ToggleRow label="Wishlist Button" value={settings.showWishlist ?? false} onChange={(v) => update({ showWishlist: v })} />
            <ToggleRow label="Product Zoom" value={settings.showProductZoom ?? true} onChange={(v) => update({ showProductZoom: v })} />
            <ToggleRow label="Stock Badge" value={settings.stockBadge ?? true} onChange={(v) => update({ stockBadge: v })} />
            {(settings.stockBadge ?? true) && (
              <SliderRow
                label="Stock badge threshold"
                value={settings.stockBadgeThreshold ?? 5}
                min={1}
                max={20}
                onChange={(v) => update({ stockBadgeThreshold: v })}
              />
            )}
            <ToggleRow label="Share Buttons" value={settings.showShareButtons ?? true} onChange={(v) => update({ showShareButtons: v })} />
          </PanelSection>
        </>
      );
    }

    if (section === "content") {
      return (
        <>
          <PanelSection title="Cart">
            <SelectRow
              label="Cart type"
              value={settings.cartBehavior ?? "drawer"}
              options={[
                { value: "drawer", label: "Slide-out drawer" },
                { value: "page", label: "Full cart page" },
              ]}
              onChange={(v) => update({ cartBehavior: v as StoreSettings["cartBehavior"] })}
            />
            <ToggleRow label="Free Shipping Bar" value={settings.showFreeShippingBar ?? false} onChange={(v) => update({ showFreeShippingBar: v })} />
            {(settings.showFreeShippingBar ?? false) && (
              <SliderRow
                label="Free shipping threshold ($)"
                value={settings.freeShippingThreshold ?? 50}
                min={0}
                max={500}
                step={5}
                onChange={(v) => update({ freeShippingThreshold: v })}
              />
            )}
            <ToggleRow label="Cart Note" value={settings.cartNote ?? false} onChange={(v) => update({ cartNote: v })} />
            <ToggleRow label="Share Buttons" value={settings.showShareButtons ?? true} onChange={(v) => update({ showShareButtons: v })} />
          </PanelSection>
          <PanelSection title="Inventory">
            <SliderRow
              label="Low-stock alert at"
              value={settings.lowStockThreshold ?? 5}
              min={0}
              max={50}
              step={1}
              onChange={(v) => update({ lowStockThreshold: v })}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(settings.lowStockThreshold ?? 5) > 0
                ? `Get notified when a product drops to ${settings.lowStockThreshold ?? 5} or fewer in stock. Takes effect after you publish.`
                : "Low-stock alerts are off. Drag above 0 to enable."}
            </p>
          </PanelSection>
          <PanelSection title="Newsletter">
            <ToggleRow
              label="Show Newsletter Section"
              value={settings.showNewsletter}
              onChange={(v) => update({ showNewsletter: v })}
            />
          </PanelSection>
          <PanelSection title="Testimonials">
            <ToggleRow label="Show Testimonials" value={settings.testimonialsEnabled ?? false} onChange={(v) => update({ testimonialsEnabled: v })} />
            {(settings.testimonialsEnabled ?? false) && (
              <>
                <div className="space-y-2 mt-2 mb-3">
                  {(settings.testimonialItems ?? []).map((item, i) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700">{item.author || "Author"}</span>
                        <button
                          onClick={() => update({ testimonialItems: (settings.testimonialItems ?? []).filter((_, j) => j !== i) })}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.author}
                        onChange={(e) => update({ testimonialItems: (settings.testimonialItems ?? []).map((t, j) => j === i ? { ...t, author: e.target.value } : t) })}
                        placeholder="Author name"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none mb-1"
                      />
                      <input
                        type="text"
                        value={item.role}
                        onChange={(e) => update({ testimonialItems: (settings.testimonialItems ?? []).map((t, j) => j === i ? { ...t, role: e.target.value } : t) })}
                        placeholder="Role / title"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none mb-1"
                      />
                      <textarea
                        value={item.text}
                        onChange={(e) => update({ testimonialItems: (settings.testimonialItems ?? []).map((t, j) => j === i ? { ...t, text: e.target.value } : t) })}
                        placeholder="Testimonial text"
                        rows={2}
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none resize-none mb-1"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Rating:</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={item.rating}
                          onChange={(e) => update({ testimonialItems: (settings.testimonialItems ?? []).map((t, j) => j === i ? { ...t, rating: Math.min(5, Math.max(1, Number(e.target.value))) } : t) })}
                          className="w-12 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none"
                        />
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= item.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => update({ testimonialItems: [...(settings.testimonialItems ?? []), { id: Date.now().toString(), text: "", author: "", role: "", rating: 5 }] })}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Testimonial
                </button>
              </>
            )}
          </PanelSection>
          <PanelSection title="Image + Text Banner">
            <ToggleRow label="Show Banner" value={settings.imageBannerEnabled ?? false} onChange={(v) => update({ imageBannerEnabled: v })} />
            {(settings.imageBannerEnabled ?? false) && (
              <>
                <div className="mb-2 mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Heading</label>
                  <input
                    type="text"
                    value={settings.imageBannerHeading ?? ""}
                    onChange={(e) => update({ imageBannerHeading: e.target.value || null })}
                    placeholder="Our Story"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Text</label>
                  <textarea
                    value={settings.imageBannerText ?? ""}
                    onChange={(e) => update({ imageBannerText: e.target.value || null })}
                    rows={3}
                    placeholder="Tell your story..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe] resize-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={settings.imageBannerImage ?? ""}
                    onChange={(e) => update({ imageBannerImage: e.target.value || null })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={settings.imageBannerCtaText ?? ""}
                    onChange={(e) => update({ imageBannerCtaText: e.target.value || null })}
                    placeholder="Shop Now"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["left", "right"] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => update({ imageBannerLayout: side })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition-all ${
                        (settings.imageBannerLayout ?? "left") === side
                          ? "border-blue-400 bg-blue-50 text-blue-600"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      Image {side}
                    </button>
                  ))}
                </div>
              </>
            )}
          </PanelSection>
          <PanelSection title="Icon Row">
            <ToggleRow label="Show Icon Row" value={settings.iconRowEnabled ?? false} onChange={(v) => update({ iconRowEnabled: v })} />
            {(settings.iconRowEnabled ?? false) && (
              <>
                <div className="space-y-2 mt-2 mb-3">
                  {(settings.iconRowItems ?? []).map((item, i) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">{item.icon || "⭐"}</span>
                        <button
                          onClick={() => update({ iconRowItems: (settings.iconRowItems ?? []).filter((_, j) => j !== i) })}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => update({ iconRowItems: (settings.iconRowItems ?? []).map((t, j) => j === i ? { ...t, icon: e.target.value } : t) })}
                        placeholder="Emoji icon (e.g. 🚀)"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none mb-1"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => update({ iconRowItems: (settings.iconRowItems ?? []).map((t, j) => j === i ? { ...t, title: e.target.value } : t) })}
                        placeholder="Title"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none mb-1"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => update({ iconRowItems: (settings.iconRowItems ?? []).map((t, j) => j === i ? { ...t, text: e.target.value } : t) })}
                        placeholder="Description"
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => update({ iconRowItems: [...(settings.iconRowItems ?? []), { id: Date.now().toString(), icon: "⭐", title: "", text: "" }] })}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </>
            )}
          </PanelSection>
          <PanelSection title="Custom Buttons">
            <div className="space-y-2 mb-3">
              {(settings.customButtons ?? []).map((btn, i) => (
                <div key={btn.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700 truncate">{btn.label || "Button"}</span>
                  <button
                    onClick={() =>
                      update({ customButtons: settings.customButtons.filter((_, j) => j !== i) })
                    }
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                update({
                  customButtons: [
                    ...(settings.customButtons ?? []),
                    { id: Date.now().toString(), label: "New Button", url: "", style: "primary" },
                  ],
                })
              }
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Button
            </button>
          </PanelSection>
        </>
      );
    }

    if (section === "social") {
      return (
        <>
          <PanelSection title="Footer Options">
            <ToggleRow label="Payment Icons" value={settings.showPaymentIcons ?? true} onChange={(v) => update({ showPaymentIcons: v })} />
            <ToggleRow label="Cart Note" value={settings.cartNote ?? false} onChange={(v) => update({ cartNote: v })} />
          </PanelSection>
          <PanelSection title="Social Links">
            {["instagram", "twitter", "tiktok", "youtube", "linkedin", "website"].map((platform) => (
              <div key={platform} className="mb-2">
                <label className="block text-xs text-gray-500 mb-1 capitalize">{platform}</label>
                <input
                  type="text"
                  value={(settings.socialLinks as Record<string, string>)?.[platform] ?? ""}
                  onChange={(e) =>
                    update({
                      socialLinks: {
                        ...(settings.socialLinks as Record<string, string>),
                        [platform]: e.target.value,
                      },
                    })
                  }
                  placeholder={`https://${platform}.com/yourprofile`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
                />
              </div>
            ))}
          </PanelSection>
          <PanelSection title="Footer Style">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FOOTER_STYLES).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => update({ footerStyle: id })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    settings.footerStyle === id
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Policies">
            {["shipping", "returns", "privacy"].map((policy) => (
              <div key={policy} className="mb-3">
                <label className="block text-xs text-gray-500 mb-1 capitalize">{policy} Policy</label>
                <textarea
                  value={(settings.policies as Record<string, string>)?.[policy] ?? ""}
                  onChange={(e) =>
                    update({
                      policies: {
                        ...(settings.policies as Record<string, string>),
                        [policy]: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  placeholder={`Your ${policy} policy...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe] resize-none"
                />
              </div>
            ))}
          </PanelSection>
        </>
      );
    }

    if (section === "seo") {
      return (
        <PanelSection title="Search Engine Optimization">
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Page Title</label>
            <input
              type="text"
              value={settings.seoTitle ?? ""}
              onChange={(e) => update({ seoTitle: e.target.value || null })}
              placeholder="My Store – Best Products Online"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
            <textarea
              value={settings.seoDescription ?? ""}
              onChange={(e) => update({ seoDescription: e.target.value || null })}
              rows={4}
              placeholder="Describe your store for search engines..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe] resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  (settings.seoDescription?.length ?? 0) > 160 ? "text-red-400" : "text-gray-500"
                }`}
              >
                {settings.seoDescription?.length ?? 0} / 160
              </span>
            </div>
          </div>
        </PanelSection>
      );
    }

    if (section === "advanced") {
      const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2e9cfe]";
      const codeCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-mono focus:outline-none focus:border-[#2e9cfe] resize-none";
      return (
        <>
          <PanelSection title="Analytics" collapsible defaultOpen={false} hint="Connect Google Analytics or Meta Pixel.">
            <label className="block text-xs font-medium text-gray-600 mb-1">Google Analytics ID</label>
            <input
              value={settings.googleAnalyticsId ?? ""}
              onChange={(e) => update({ googleAnalyticsId: e.target.value || null })}
              placeholder="G-XXXXXXXXXX"
              className={inputCls}
            />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Meta (Facebook) Pixel ID</label>
            <input
              value={settings.metaPixelId ?? ""}
              onChange={(e) => update({ metaPixelId: e.target.value || null })}
              placeholder="123456789012345"
              className={inputCls}
            />
            <p className="text-xs text-gray-500 mt-2">Tracking fires on your live storefront only, never while you preview.</p>
          </PanelSection>
          <PanelSection title="Custom Code" collapsible defaultOpen={false} hint="Inject scripts or widgets. For advanced users.">
            <p className="text-xs text-gray-500 mb-2">
              Inject scripts or widgets (chat, pixels, verification tags). Added to the page <span className="font-medium">head</span>.
            </p>
            <textarea
              value={settings.customHeadCode ?? ""}
              onChange={(e) => update({ customHeadCode: e.target.value || null })}
              rows={6}
              placeholder={`<!-- e.g. chat widget, verification meta -->\n<script src="https://...">`}
              className={codeCls}
            />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Body code (end of page)</label>
            <textarea
              value={settings.customBodyCode ?? ""}
              onChange={(e) => update({ customBodyCode: e.target.value || null })}
              rows={5}
              placeholder={`<!-- runs at end of <body> -->`}
              className={codeCls}
            />
            <p className="text-[11px] text-amber-600 mt-2">⚠ Only paste code from sources you trust, it runs on your storefront.</p>
          </PanelSection>
          <PanelSection title="Custom CSS" collapsible defaultOpen={false} hint="Override store styles with your own CSS.">
            <p className="text-xs text-gray-500 mb-3">
              Add custom CSS to override any store styles.
            </p>
            <textarea
              value={settings.customCss ?? ""}
              onChange={(e) => update({ customCss: e.target.value || null })}
              rows={12}
              placeholder={`.store-hero {\n  background: linear-gradient(...);\n}`}
              className={codeCls}
            />
          </PanelSection>
        </>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f0f4f8]">
        <Loader2 className="w-8 h-8 text-[#2e9cfe] animate-spin" />
      </div>
    );
  }

  const TOOLBAR: { id: SectionId; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "templates", label: "Templates", icon: <LayoutTemplate className="w-3.5 h-3.5" />, desc: "Start from a ready-made store design" },
    { id: "theme", label: "Theme", icon: <Palette className="w-3.5 h-3.5" />, desc: "Colors, fonts & button style" },
    { id: "sections", label: "Sections", icon: <Layers className="w-3.5 h-3.5" />, desc: "Add, remove & reorder the blocks on each page" },
    { id: "productpage", label: "Product Page", icon: <ShoppingCart className="w-3.5 h-3.5" />, desc: "How each product page looks" },
    { id: "markets", label: "Markets", icon: <Globe className="w-3.5 h-3.5" />, desc: "Currency & where you sell" },
    { id: "seo", label: "SEO", icon: <Search className="w-3.5 h-3.5" />, desc: "How your store appears on Google" },
    { id: "advanced", label: "Advanced", icon: <Settings2 className="w-3.5 h-3.5" />, desc: "Custom code & extra options" },
  ];

  // The handful of steps a new store owner should do first, in order.
  const GUIDE_STEPS: { n: number; icon: React.ReactNode; title: string; desc: string; section: SectionId }[] = [
    { n: 1, icon: <LayoutTemplate className="w-4 h-4" />, title: "Pick a template", desc: "Choose a ready-made design as your starting point. You can change anything later.", section: "templates" },
    { n: 2, icon: <Palette className="w-4 h-4" />, title: "Set your colors & fonts", desc: "Match your store to your brand with a theme, accent color and font.", section: "theme" },
    { n: 3, icon: <ImageIcon className="w-4 h-4" />, title: "Add your logo & store name", desc: "Upload a logo and set your store name and tagline in the header.", section: "header" },
    { n: 4, icon: <Layers className="w-4 h-4" />, title: "Arrange your page", desc: "Add, remove and reorder the sections shoppers see, like your hero and products.", section: "sections" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#f0f4f8] text-gray-900 overflow-hidden">
      <div className="flex items-center justify-between h-12 px-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/store" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
            ← Store
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{storeName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Publish status, always visible so draft vs. live is impossible to miss. */}
          {hasDraft ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Draft · unpublished changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live · all changes published
            </span>
          )}
          {username && (
            <a
              href={`/${username}/store${hasDraft ? "?preview=1" : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              title={hasDraft ? "Preview your unpublished draft" : "View your live store"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
            >
              <Monitor className="w-3.5 h-3.5" />
              {hasDraft ? "Preview" : "View Live"}
            </a>
          )}
          {hasDraft && (
            <button
              onClick={discardDraft}
              disabled={publishing}
              title="Discard unpublished changes"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
            >
              Discard
            </button>
          )}
          <button
            onClick={publish}
            disabled={publishing || !hasDraft}
            title={hasDraft ? "Publish your changes to the live store" : "No unpublished changes"}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 bg-green-500 hover:bg-green-600 text-white"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Publish
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={save}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                saveError
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : saved
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveError ? (
                <X className="w-3.5 h-3.5" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? "Saving…" : saveError ? "Save failed" : saved ? "Saved" : "Save"}
            </button>
            {saveError && (
              <span className="text-[10px] text-red-400 max-w-[200px] text-right leading-tight">{saveError}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
            {!focusMode && (
              <button
                onClick={openGuide}
                title="Open the get-started guide"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showGuide && !activeSection
                    ? "bg-[#2e9cfe] text-white border border-[#2e9cfe]"
                    : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Guide
              </button>
            )}
            {!focusMode && TOOLBAR.map((btn) => (
              <button
                key={btn.id}
                onClick={() => openSection(btn.id)}
                title={btn.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === btn.id
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
            <div className="flex-1" />
            {!focusMode && <span className="text-xs text-gray-400 hidden xl:block mr-2">Click any section in the preview to edit</span>}
            <button
              onClick={() => setFocusMode((v) => !v)}
              title="Focus mode, hide panels and preview your store full-width"
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-semibold transition-all mr-1 ${
                focusMode ? "bg-[#c8e83c] text-gray-900" : "bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700"
              }`}
            >
              {focusMode ? "Exit Focus" : "Focus"}
            </button>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewDevice("desktop")}
                title="Desktop preview"
                className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
                  previewDevice === "desktop" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                title="Mobile preview"
                className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
                  previewDevice === "mobile" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Browser-style URL bar */}
          {username && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#f0f4f8] border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 min-w-0">
                <div className="flex gap-1 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">nexus.app/</span>
                <span className="text-xs text-gray-600 truncate">{username}/store</span>
              </div>
              <a
                href={`/${username}/store`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2e9cfe] hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-all flex-shrink-0"
              >
                <Monitor className="w-3 h-3" />
                Open
              </a>
            </div>
          )}

          {/* Live preview, a real, in-preview render of the storefront (draft mode).
              It mirrors the live site 1:1 and updates instantly as you edit via the
              "nexus_store_preview" BroadcastChannel that the store listens to. */}
          <div className="flex-1 min-h-0 flex items-stretch justify-center p-6 bg-[#f0f4f8]">
            <div
              className={`transition-all duration-300 bg-white overflow-hidden ${
                previewDevice === "mobile"
                  ? "rounded-[2rem] border-[6px] border-gray-900 shadow-xl flex-shrink-0"
                  : "rounded-xl shadow-xl ring-1 ring-black/5 w-full"
              }`}
              style={{ width: previewDevice === "mobile" ? 390 : undefined, maxWidth: previewDevice === "mobile" ? 390 : 1200, height: "100%" }}
            >
              {username ? (
                <iframe
                  ref={iframeRef}
                  src={`/${username}/store?preview=1`}
                  title="Store preview"
                  className="w-full h-full border-0 block"
                  onLoad={() => {
                    // Push the current editor state once the iframe's store has
                    // mounted its BroadcastChannel listener (after hydration).
                    try {
                      broadcast(latestSettings.current);
                      setTimeout(() => broadcast(latestSettings.current), 450);
                    } catch {}
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Loading preview…</div>
              )}
            </div>
          </div>
        </div>

        {/* Get-started guide, shown for new users when no section is open. */}
        {!activeSection && showGuide && !focusMode && (
          <div className="w-[360px] flex-shrink-0 flex flex-col bg-white border-l border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2e9cfe]" /> Get started
              </h2>
              <button
                onClick={dismissGuide}
                title="Hide this guide"
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Set up your store in a few quick steps. Everything updates the preview on the left instantly, and nothing goes live until you hit <span className="font-semibold text-gray-700">Publish</span>.
              </p>
              <div className="space-y-2.5">
                {GUIDE_STEPS.map((step) => (
                  <button
                    key={step.n}
                    onClick={() => goToFromGuide(step.section)}
                    className="group w-full flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white text-left hover:border-[#2e9cfe] hover:bg-blue-50/40 transition-all"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 text-[#2e9cfe] flex items-center justify-center text-xs font-bold">
                      {step.n}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        {step.icon}{step.title}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5 leading-snug">{step.desc}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#2e9cfe] flex-shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-700">Tip:</span> You don't have to use every option. Pick a template, tweak the colors, and you're ready to go. Click any part of the preview to edit it directly.
                </p>
              </div>

              <button
                onClick={dismissGuide}
                className="mt-4 w-full py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-all"
              >
                Got it, hide this guide
              </button>
            </div>
          </div>
        )}

        {activeSection && !focusMode && (
          <div className="w-[360px] flex-shrink-0 flex flex-col bg-white border-l border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm">{PANEL_TITLES[activeSection]}</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderPanel(activeSection)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const HERO_SNAP_POINTS = [10, 25, 33, 50, 66, 75, 90];
const HERO_SNAP_THRESHOLD = 4;

function HeroDragOverlay({
  snapEnabled,
  currentPos,
  onPositionChange,
}: {
  snapEnabled: boolean;
  currentPos: { x: number; y: number } | undefined;
  onPositionChange: (pos: { x: number; y: number }) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);
  const snapRef = useRef(snapEnabled);
  useEffect(() => { snapRef.current = snapEnabled; }, [snapEnabled]);

  function computePos(e: MouseEvent): { x: number; y: number } {
    const rect = overlayRef.current!.getBoundingClientRect();
    const rawX = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
    if (!snapRef.current) return { x: rawX, y: rawY };
    const snappedX = HERO_SNAP_POINTS.find(p => Math.abs(rawX - p) < HERO_SNAP_THRESHOLD) ?? rawX;
    const snappedY = HERO_SNAP_POINTS.find(p => Math.abs(rawY - p) < HERO_SNAP_THRESHOLD) ?? rawY;
    return { x: snappedX, y: snappedY };
  }

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setLivePos(computePos(e));
    const onUp = (e: MouseEvent) => {
      const pos = computePos(e);
      setIsDragging(false);
      onPositionChange(pos);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const displayPos = isDragging ? livePos : (currentPos ?? null);
  const guideX = isDragging && displayPos ? HERO_SNAP_POINTS.find(p => Math.abs(displayPos.x - p) < 0.5) ?? null : null;
  const guideY = isDragging && displayPos ? HERO_SNAP_POINTS.find(p => Math.abs(displayPos.y - p) < 0.5) ?? null : null;

  return (
    <div
      ref={overlayRef}
      style={{ position: "absolute", inset: 0, zIndex: 15, cursor: isDragging ? "grabbing" : "crosshair" }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setLivePos(currentPos ?? null);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* snap guide lines */}
      {guideX !== null && (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${guideX}%`, width: 1, background: "rgba(96,165,250,0.75)", pointerEvents: "none" }} />
      )}
      {guideY !== null && (
        <div style={{ position: "absolute", left: 0, right: 0, top: `${guideY}%`, height: 1, background: "rgba(96,165,250,0.75)", pointerEvents: "none" }} />
      )}
      {/* position marker */}
      {displayPos && (
        <div style={{ position: "absolute", left: `${displayPos.x}%`, top: `${displayPos.y}%`, transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 20 }}>
          <div style={{ width: 28, height: 28, border: `2px ${isDragging ? "solid" : "dashed"} #60a5fa`, borderRadius: 6, background: "rgba(96,165,250,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Move style={{ width: 12, height: 12, color: "#60a5fa" }} />
          </div>
        </div>
      )}
      {/* hint when no position set yet */}
      {!isDragging && !currentPos && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", background: "rgba(0,0,0,0.65)", borderRadius: 6, fontSize: 11, color: "rgba(255,255,255,0.8)", pointerEvents: "none", whiteSpace: "nowrap", userSelect: "none" }}>
          Click or drag to set text position
        </div>
      )}
    </div>
  );
}

function Zone({
  id,
  label,
  active,
  onClick,
  children,
}: {
  id: SectionId;
  label: string;
  active: SectionId | null;
  onClick: (s: SectionId) => void;
  children: React.ReactNode;
}) {
  const isActive = active === id;
  return (
    <div
      className="relative group cursor-pointer"
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      {children}
      <div
        className="absolute inset-0 border-2 pointer-events-none z-20 transition-all duration-100"
        style={{
          borderColor: isActive ? "#60a5fa" : "transparent",
          background: isActive ? "rgba(96,165,250,0.07)" : "transparent",
        }}
      />
      {/* hover handled via JS to avoid group-hover issues inside transform */}
      <div
        className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold bg-blue-500 text-white pointer-events-none z-30 shadow transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {label}
      </div>
    </div>
  );
}

const PREVIEW_W = 1100;

const PREVIEW_HERO_H: Record<string, number> = {
  fullscreen: 580,
  large: 460,
  medium: 340,
  small: 220,
  banner: 150,
};

const PREVIEW_PRODUCTS: PreviewProduct[] = [
  { id: "1",  name: "Premium Course Bundle",  price: 97,  comparePrice: 147,  type: "DIGITAL",      images: [], inventory: null },
  { id: "2",  name: "Design Template Kit",    price: 29,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "3",  name: "1-Hour Consultation",    price: 150, comparePrice: null, type: "SERVICE",      images: [], inventory: null },
  { id: "4",  name: "Monthly Membership",     price: 19,  comparePrice: null, type: "SUBSCRIPTION", images: [], inventory: null },
  { id: "5",  name: "Brand Identity Pack",    price: 49,  comparePrice: 79,   type: "DIGITAL",      images: [], inventory: null },
  { id: "6",  name: "Social Media Kit",       price: 35,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "7",  name: "Strategy Session",       price: 200, comparePrice: null, type: "SERVICE",      images: [], inventory: null },
  { id: "8",  name: "Preset Collection",      price: 24,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "9",  name: "Website Audit",          price: 99,  comparePrice: 149,  type: "SERVICE",      images: [], inventory: null },
  { id: "10", name: "Content Calendar",       price: 15,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "11", name: "Email Swipe File",       price: 27,  comparePrice: null, type: "DIGITAL",      images: [], inventory: null },
  { id: "12", name: "Pro Mentorship",         price: 299, comparePrice: null, type: "SERVICE",      images: [], inventory: null },
];

function btnRadiusPx(cls: string): number {
  if (cls.includes("full"))  return 9999;
  if (cls.includes("none"))  return 0;
  if (cls.includes("2xl"))   return 16;
  if (cls.includes("xl"))    return 12;
  if (cls.includes("md"))    return 6;
  return 8;
}

function cardRadiusPx(cls: string): number {
  if (cls.includes("none"))  return 0;
  if (cls.includes("3xl"))   return 24;
  if (cls.includes("2xl"))   return 16;
  if (cls.includes("xl"))    return 12;
  return 12;
}

function PreviewProductCard({
  p, theme, accent, settings,
}: {
  p: PreviewProduct;
  theme: (typeof STORE_THEMES)[string];
  accent: string;
  settings: StoreSettings;
}) {
  const btnStyle  = BUTTON_STYLES[settings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const cardStyle = CARD_STYLES[settings.cardStyle]     ?? CARD_STYLES.shadow;
  const imgRatio  = IMAGE_RATIOS[settings.imageRatio]   ?? IMAGE_RATIOS.square;
  const bR = btnRadiusPx(btnStyle.radius);
  const cR = cardRadiusPx(cardStyle.radius);
  const isList = settings.layout === "list";
  const firstImage = p.images?.[0] ?? null;

  const discountPct = p.comparePrice && p.comparePrice > p.price
    ? Math.round((1 - p.price / p.comparePrice) * 100) : null;

  const cardShadow = cardStyle.shadow.includes("shadow-2xl") ? "0 20px 50px rgba(0,0,0,0.25)"
    : cardStyle.shadow.includes("shadow-xl") ? "0 10px 30px rgba(0,0,0,0.2)"
    : cardStyle.shadow.includes("shadow-lg") ? "0 8px 24px rgba(0,0,0,0.18)"
    : cardStyle.shadow.includes("shadow-md") ? "0 4px 14px rgba(0,0,0,0.13)"
    : "none";

  if (isList) {
    return (
      <div style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
        <div style={{ width: 80, height: 80, flexShrink: 0, background: theme.surfaceHover, borderRadius: 12, overflow: "hidden", position: "relative" }}>
          {firstImage
            ? <img src={firstImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : null}
          {settings.showSaleBadge && discountPct && (
            <div style={{ position: "absolute", top: 4, right: 4, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999 }}>-{discountPct}%</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {settings.showProductType && <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{p.type}</div>}
          <div style={{ fontWeight: 600, fontSize: 15, color: theme.text, marginBottom: 4 }}>{p.name}</div>
          {settings.showRatings && (
            <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
              {[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 12, height: 12, fill: s <= 4 ? "#f59e0b" : "transparent", color: s <= 4 ? "#f59e0b" : "#d1d5db" }} />)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 16, color: accent }}>${p.price}</span>
            {p.comparePrice && <span style={{ fontSize: 13, color: theme.muted, textDecoration: "line-through" }}>${p.comparePrice}</span>}
          </div>
        </div>
        {settings.showQuickAdd && (
          <button style={{ padding: "10px 22px", background: accent, color: "#fff", fontWeight: 600, fontSize: 14, borderRadius: bR, border: "none", cursor: "default", flexShrink: 0 }}>
            Add to Cart
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: cR, overflow: "hidden", boxShadow: cardShadow }}>
      <div className={imgRatio.cls} style={{ background: theme.surfaceHover, position: "relative", overflow: "hidden" }}>
        {firstImage && <img src={firstImage} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        {settings.showSaleBadge && discountPct && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999 }}>-{discountPct}%</div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        {settings.showProductType && (
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{p.type}</div>
        )}
        <div style={{ fontWeight: 600, fontSize: 14, color: theme.text, marginBottom: 4, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {p.name}
        </div>
        {settings.showRatings && (
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 12, height: 12, fill: s <= 4 ? "#f59e0b" : "transparent", color: s <= 4 ? "#f59e0b" : "#d1d5db" }} />)}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 16, color: accent }}>${p.price}</span>
            {p.comparePrice && <span style={{ fontSize: 13, color: theme.muted, textDecoration: "line-through" }}>${p.comparePrice}</span>}
          </div>
          {settings.showQuickAdd && (
            <button style={{ width: 32, height: 32, background: accent, color: "#fff", borderRadius: bR, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", flexShrink: 0 }}>
              <Plus style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function renderPreviewHero(
  settings: StoreSettings,
  theme: (typeof STORE_THEMES)[string],
  accent: string,
  heroH: number,
  userImage: string | null,
): React.ReactNode {
  const heroStyle      = settings.heroStyle ?? "storefront";
  const overlay        = (settings.heroOverlay ?? 50) / 100;
  const name           = settings.name    ?? "My Store";
  const tagline        = settings.tagline ?? "Shop our latest collection";
  const cta            = settings.ctaText ?? "Shop Now";
  const btnStyle       = BUTTON_STYLES[settings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const bR             = btnRadiusPx(btnStyle.radius);
  const heroContentPos = (settings.elementPositions as Record<string, { x: number; y: number }>)?.heroContent;
  const textAlign  = settings.heroTextAlign ?? "left";
  const banner     = settings.bannerImage;
  const logo       = settings.logoImage;

  const centerAlign = { display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const };
  const leftAlign   = { display: "flex", flexDirection: "column" as const, alignItems: "flex-start" };
  const rightAlign  = { display: "flex", flexDirection: "column" as const, alignItems: "flex-end", textAlign: "right" as const, marginLeft: "auto" };
  const alignStyle  = textAlign === "center" ? centerAlign : textAlign === "right" ? rightAlign : leftAlign;

  // Logo/avatar helper, mirrors the real store
  const avatarEl = logo
    ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    : userImage
      ? <img src={userImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, color: "#fff", fontWeight: 900, fontSize: 22 }}>{name.slice(0, 2).toUpperCase()}</div>;

  if (heroStyle === "minimal") {
    return (
      <div style={{ borderBottom: `1px solid ${theme.border}`, background: theme.heroBg }}>
        <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: logo ? 0 : 10, overflow: "hidden", background: theme.surfaceHover, flexShrink: 0 }}>
            {avatarEl}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{name}</div>
            <div style={{ fontSize: 12, color: theme.muted }}>{tagline}</div>
          </div>
        </div>
      </div>
    );
  }

  if (heroStyle === "split") {
    return (
      <div style={{ borderBottom: `1px solid ${theme.border}`, background: banner ? undefined : theme.heroBg, position: "relative", overflow: "hidden" }}>
        {banner && (
          <>
            <img src={banner} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1, padding: "40px 40px", display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: logo ? 8 : 16, overflow: "hidden", flexShrink: 0, background: theme.surfaceHover }}>
            {avatarEl}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 30, color: banner ? "#fff" : theme.text, marginBottom: 8, letterSpacing: -0.5 }}>{name}</h1>
            <p style={{ fontSize: 15, color: banner ? "rgba(255,255,255,0.75)" : theme.muted, maxWidth: 440, lineHeight: 1.5 }}>{tagline}</p>
          </div>
        </div>
      </div>
    );
  }

  if (heroStyle === "product") {
    const heroBg = banner ? undefined : `linear-gradient(130deg, ${accent}ee 0%, ${accent}88 45%, ${theme.bg} 100%)`;
    const contentEl = (
      <div style={{ maxWidth: 500, ...alignStyle }}>
        <h1 style={{ fontWeight: 900, color: "#fff", fontSize: 52, lineHeight: 1, marginBottom: 16 }}>{tagline || name}</h1>
        {tagline && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 28, lineHeight: 1.5 }}>{name}</p>}
        <a style={{ display: "inline-flex", alignItems: "center", color: "#fff", fontSize: 14, fontWeight: 700, padding: "14px 36px", borderRadius: bR, background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)", cursor: "default" }}>{cta}</a>
      </div>
    );
    return (
      <section style={{ height: heroH, position: "relative", overflow: "hidden", background: heroBg }}>
        {banner && (
          <>
            <img src={banner} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlay})` }} />
          </>
        )}
        {heroContentPos ? (
          <div style={{ position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%,-50%)", zIndex: 10, ...alignStyle }}>
            {contentEl}
          </div>
        ) : (
          <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 80px", justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start" }}>
            {contentEl}
          </div>
        )}
      </section>
    );
  }

  if (heroStyle === "cover") {
    const heroBg = banner ? undefined : `linear-gradient(135deg, ${accent}40 0%, ${accent}15 50%, ${theme.bg} 100%)`;
    const contentEl = (
      <>
        <h1 style={{ fontWeight: 900, fontSize: 42, color: "#fff", marginBottom: 8 }}>{name}</h1>
        {tagline && <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{tagline}</p>}
      </>
    );
    return (
      <section style={{ height: heroH, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: heroBg }}>
        {banner ? <img src={banner} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlay})` }} />
        {heroContentPos ? (
          <div style={{ position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%,-50%)", zIndex: 10, ...alignStyle }}>
            {contentEl}
          </div>
        ) : (
          <div style={{ position: "relative", zIndex: 10, width: "100%", padding: "0 40px 64px", ...alignStyle }}>
            {contentEl}
          </div>
        )}
      </section>
    );
  }

  // storefront / centered (default)
  const heroBg = banner ? undefined : `linear-gradient(160deg, ${accent}cc 0%, ${accent}88 100%)`;
  const storefrontContent = (
    <>
      <h1 style={{ fontWeight: 700, color: "#fff", fontSize: 42, marginBottom: 24, lineHeight: 1.2 }}>{tagline || name}</h1>
      <a style={{ display: "inline-flex", alignItems: "center", color: "#fff", fontSize: 15, fontWeight: 500, padding: "14px 36px", border: "1.5px solid rgba(255,255,255,0.9)", borderRadius: bR, cursor: "default" }}>{cta}</a>
    </>
  );
  return (
    <section style={{ height: heroH, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: heroBg }}>
      {banner && <img src={banner} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlay})` }} />
      {heroContentPos ? (
        <div style={{ position: "absolute", left: `${heroContentPos.x}%`, top: `${heroContentPos.y}%`, transform: "translate(-50%,-50%)", zIndex: 10, ...alignStyle }}>
          {storefrontContent}
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 10, width: "100%", padding: "0 40px 56px", ...alignStyle }}>
          {storefrontContent}
        </div>
      )}
    </section>
  );
}

function StorePreviewLive({
  settings,
  activeSection,
  onSectionClick,
  username,
  userImage,
  realProducts,
  heroSnapEnabled,
  onHeroPositionChange,
  deviceMode = "desktop",
}: {
  settings: StoreSettings;
  activeSection: SectionId | null;
  onSectionClick: (s: SectionId) => void;
  username: string;
  userImage: string | null;
  realProducts: PreviewProduct[];
  heroSnapEnabled: boolean;
  onHeroPositionChange: (pos: { x: number; y: number }) => void;
  deviceMode?: "desktop" | "mobile";
}) {
  const isMobile = deviceMode === "mobile";
  const PW = isMobile ? 430 : PREVIEW_W;
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [outerW, setOuterW]   = useState(840);
  const [innerH, setInnerH]   = useState(1400);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target === outerRef.current) setOuterW(e.contentRect.width);
        if (e.target === innerRef.current) setInnerH(e.contentRect.height);
      }
    });
    if (outerRef.current) obs.observe(outerRef.current);
    if (innerRef.current) obs.observe(innerRef.current);
    return () => obs.disconnect();
  }, []);

  const scale = outerW / PW;

  const theme      = STORE_THEMES[settings.theme]        ?? STORE_THEMES.default;
  const accent     = settings.primaryColor;
  const btnStyle   = BUTTON_STYLES[settings.buttonStyle] ?? BUTTON_STYLES.rounded;
  const layout     = LAYOUTS[settings.layout]            ?? LAYOUTS.grid;
  const navStyle   = settings.navStyle ?? "default";
  const heroStyle  = settings.heroStyle ?? "storefront";
  const heroH      = PREVIEW_HERO_H[settings.heroSize ?? "large"] ?? 460;

  const isTransparentPreviewNav =
    navStyle === "transparent" || navStyle === "minimal";
  const navBg =
    navStyle === "colored" || navStyle === "transparent-colored" ? accent :
    isTransparentPreviewNav                                      ? "transparent" :
    theme.navBg;
  const navBorderColor = isTransparentPreviewNav || navStyle === "colored" || navStyle === "transparent-colored" ? "transparent" : theme.border;
  const isWhitePreviewNav = navStyle === "colored" || navStyle === "transparent-colored" ||
    navStyle === "transparent" || navStyle === "minimal";
  const navTextColor  = isWhitePreviewNav ? "#fff" : theme.text;
  const navMutedColor = isWhitePreviewNav ? "rgba(255,255,255,0.7)" : theme.muted;

  const bR = btnRadiusPx(btnStyle.radius);

  const customButtons = (settings.customButtons ?? []) as CustomButton[];
  const trustBadges   = Array.isArray(settings.trustBadges) && settings.trustBadges.length > 0
    ? settings.trustBadges
    : ["Secure Checkout", "Instant Delivery", "30-Day Returns"];
  const socialLinks = settings.socialLinks as Record<string, string>;

  const gridCols = isMobile ? 2
    : layout.cols.includes("lg:grid-cols-6") ? 6
    : layout.cols.includes("lg:grid-cols-5") ? 5
    : layout.cols.includes("lg:grid-cols-4") ? 4
    : layout.cols.includes("sm:grid-cols-4") ? 4
    : layout.cols.includes("sm:grid-cols-3") ? 3
    : layout.cols.includes("sm:grid-cols-2") ? 2
    : 1;

  const sourceProducts = realProducts.length > 0 ? realProducts : PREVIEW_PRODUCTS;
  const carouselRows = Math.max(1, Math.min(3, settings.carouselRows ?? 1));
  const displayProducts = settings.layout === "carousel"
    ? sourceProducts.slice(0, Math.min(carouselRows * 3, sourceProducts.length))
    : sourceProducts.slice(0, gridCols * 2);

  return (
    <div
      ref={outerRef}
      className="transition-[max-width] duration-300 w-full"
      style={{ maxWidth: isMobile ? 390 : activeSection ? 600 : 840 }}
    >
      <div
        className={`overflow-hidden shadow-xl ring-1 ring-black/5 ${isMobile ? "rounded-[2rem] border-[6px] border-gray-900" : "rounded-xl"}`}
        style={{ height: innerH * scale, position: "relative" }}
      >
        <div
          ref={innerRef}
          style={{
            width: PW,
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            background: theme.bg,
            color: theme.text,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* ── Announcement / Ticker ── */}
          {(settings.announcementText || (settings.tickerEnabled && settings.tickerText)) && (
            <Zone id="announcements" label="Announcement" active={activeSection} onClick={onSectionClick}>
              {settings.tickerEnabled && settings.tickerText ? (
                <div style={{ overflow: "hidden", padding: "10px 0", background: settings.announcementColor }}>
                  <div style={{ whiteSpace: "nowrap", color: "#fff", fontSize: 14, fontWeight: 600, paddingLeft: 40 }}>
                    {settings.tickerText}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{settings.tickerText}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{settings.tickerText}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "8px 16px", textAlign: "center", fontSize: 14, fontWeight: 500, color: "#fff", background: settings.announcementColor }}>
                  {settings.announcementText}
                </div>
              )}
            </Zone>
          )}

          {/* ── Nav ── */}
          <Zone id="header" label="Header" active={activeSection} onClick={onSectionClick}>
            <header style={{ background: navBg, borderBottom: `1px solid ${navBorderColor}` }}>
              <div style={{ maxWidth: "100%", padding: "0 40px", height: (NAV_HEIGHTS[settings.navHeight ?? "default"] ?? NAV_HEIGHTS.default).px, display: "flex", alignItems: "center", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {settings.logoImage
                    ? <img src={settings.logoImage} alt="" style={{ height: 32, maxWidth: 120, objectFit: "contain" }} />
                    : <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3, color: navTextColor }}>{settings.name ?? "My Store"}</span>
                  }
                </div>
                <nav style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 32 }}>
                  <span style={{ fontSize: 14, color: navTextColor }}>Shop</span>
                  {customButtons.slice(0, 2).map((btn) => (
                    <span key={btn.id} style={{ fontSize: 14, color: navTextColor }}>{btn.label}</span>
                  ))}
                  <span style={{ fontSize: 14, color: navMutedColor }}>Portfolio</span>
                </nav>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: navTextColor }}>
                    <Search style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: navTextColor }}>
                    <ShoppingCart style={{ width: 18, height: 18 }} />
                  </div>
                </div>
              </div>
            </header>
          </Zone>

          {/* ── Hero ── */}
          <Zone id="hero" label="Hero" active={activeSection} onClick={onSectionClick}>
            <div style={{ position: "relative" }}>
              {renderPreviewHero(settings, theme, accent, heroH, userImage)}
              {activeSection === "hero" && (
                <HeroDragOverlay
                  snapEnabled={heroSnapEnabled}
                  currentPos={(settings.elementPositions as Record<string, { x: number; y: number }>)?.heroContent}
                  onPositionChange={onHeroPositionChange}
                />
              )}
            </div>
          </Zone>

          {/* ── Trust Bar ── */}
          {heroStyle !== "minimal" && settings.showTrustBar && (
            <Zone id="products" label="Products" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderBottom: `1px solid ${theme.border}`, background: theme.surface }}>
                <div style={{ padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
                  {trustBadges.map((badge, i) => (
                    <span key={badge} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: theme.muted }}>
                      {i % 3 === 0 ? <Shield style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />
                        : i % 3 === 1 ? <Zap style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />
                        : <RefreshCw style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />}
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </Zone>
          )}

          {/* ── Products ── */}
          <Zone id="products" label="Products" active={activeSection} onClick={onSectionClick}>
            <div style={{ padding: "40px 40px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 500, color: theme.text, margin: 0 }}>
                    {settings.sectionTitle ?? "Featured products"}
                  </h2>
                  {settings.showProductCount && (
                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.muted }}>4 items</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {settings.showFilters && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, fontSize: 14, color: theme.text, fontWeight: 500 }}>
                      <SlidersHorizontal style={{ width: 14, height: 14, color: theme.muted }} />
                      Recommended
                      <ChevronDown style={{ width: 14, height: 14, color: theme.muted }} />
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: accent }}>View all →</span>
                </div>
              </div>

              {settings.layout === "list" ? (
                <div>
                  {displayProducts.map((p) => (
                    <PreviewProductCard key={p.id} p={p} theme={theme} accent={accent} settings={settings} />
                  ))}
                </div>
              ) : settings.layout === "carousel" ? (
                <div style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${Math.max(1, Math.min(3, settings.carouselRows ?? 1))}, auto)`,
                  gridAutoFlow: "column",
                  gap: 16,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}>
                  {displayProducts.map((p) => (
                    <PreviewProductCard key={p.id} p={p} theme={theme} accent={accent} settings={settings} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 24 }}>
                  {displayProducts.map((p) => (
                    <PreviewProductCard key={p.id} p={p} theme={theme} accent={accent} settings={settings} />
                  ))}
                </div>
              )}
            </div>
          </Zone>

          {/* ── Testimonials Preview ── */}
          {(settings.testimonialsEnabled ?? false) && (settings.testimonialItems ?? []).length > 0 && (
            <Zone id="content" label="Content" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderTop: `1px solid ${theme.border}`, padding: "48px 40px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.text, textAlign: "center", marginBottom: 32 }}>What customers say</h2>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, (settings.testimonialItems ?? []).length)}, 1fr)`, gap: 16 }}>
                  {(settings.testimonialItems ?? []).slice(0, 3).map(item => (
                    <div key={item.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20 }}>
                      <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 14, height: 14, fill: s <= item.rating ? "#f59e0b" : "transparent", color: s <= item.rating ? "#f59e0b" : "#d1d5db" }} />)}
                      </div>
                      <p style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, marginBottom: 12 }}>&ldquo;{item.text || "Great product!"}&rdquo;</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{item.author || "Customer"}</p>
                      {item.role && <p style={{ fontSize: 11, color: theme.muted }}>{item.role}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </Zone>
          )}

          {/* ── Image Banner Preview ── */}
          {(settings.imageBannerEnabled ?? false) && (
            <Zone id="content" label="Content" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderTop: `1px solid ${theme.border}`, background: theme.surface, display: "flex", flexDirection: (settings.imageBannerLayout ?? "left") === "left" ? "row" : "row-reverse" }}>
                <div style={{ width: "50%", minHeight: 200, background: theme.surfaceHover, flexShrink: 0, backgroundImage: settings.imageBannerImage ? `url(${settings.imageBannerImage})` : `linear-gradient(135deg, ${accent}22, ${accent}44)`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div style={{ flex: 1, padding: "40px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {settings.imageBannerHeading && <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 12, lineHeight: 1.3 }}>{settings.imageBannerHeading}</h2>}
                  {settings.imageBannerText && <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6, marginBottom: 20 }}>{settings.imageBannerText}</p>}
                  {settings.imageBannerCtaText && (
                    <a style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", padding: "10px 24px", background: accent, color: "#fff", fontWeight: 600, fontSize: 14, borderRadius: btnRadiusPx(btnStyle.radius), cursor: "default" }}>
                      {settings.imageBannerCtaText}
                    </a>
                  )}
                </div>
              </div>
            </Zone>
          )}

          {/* ── Icon Row Preview ── */}
          {(settings.iconRowEnabled ?? false) && (settings.iconRowItems ?? []).length > 0 && (
            <Zone id="content" label="Content" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderTop: `1px solid ${theme.border}`, background: theme.surface, padding: "32px 40px" }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, (settings.iconRowItems ?? []).length)}, 1fr)`, gap: 24 }}>
                  {(settings.iconRowItems ?? []).slice(0, 4).map(item => (
                    <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
                      <span style={{ fontSize: 28 }}>{item.icon || "⭐"}</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{item.title || "Feature"}</p>
                      {item.text && <p style={{ fontSize: 12, color: theme.muted }}>{item.text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </Zone>
          )}

          {/* ── Newsletter ── */}
          {settings.showNewsletter && (
            <Zone id="content" label="Content" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 48 }}>
                <div style={{ padding: "64px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: theme.text, marginBottom: 8, letterSpacing: -0.3 }}>Stay in the loop</h2>
                  <p style={{ fontSize: 14, color: theme.muted, marginBottom: 24, maxWidth: 400, lineHeight: 1.5 }}>
                    Get notified about new products, exclusive drops, and special offers.
                  </p>
                  <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 400 }}>
                    <input
                      readOnly
                      placeholder="Enter your email"
                      style={{ flex: 1, height: 48, padding: "0 16px", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface, color: theme.text, fontSize: 14, outline: "none" }}
                    />
                    <button style={{ height: 48, padding: "0 24px", background: accent, color: "#fff", fontSize: 14, fontWeight: 600, borderRadius: bR, border: "none", cursor: "default" }}>
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </Zone>
          )}

          {/* ── Custom drag/drop sections (same renderer as the live store) ── */}
          {(settings.homeSections ?? []).length > 0 && (
            <Zone id="sections" label="Sections" active={activeSection} onClick={onSectionClick}>
              <StoreSections
                sections={settings.homeSections ?? []}
                theme={theme}
                accent={accent}
                accentText={previewReadableTextOn(accent)}
                products={sourceProducts.map((p) => ({ id: p.id, name: p.name, price: p.price, images: p.images }))}
                username={username}
                formatCurrency={(n) => `$${n}`}
                btnRadius={btnStyle.radius}
              />
            </Zone>
          )}

          {/* ── Footer ── */}
          {settings.footerStyle !== "none" && (
            <Zone id="social" label="Footer" active={activeSection} onClick={onSectionClick}>
              <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 40 }}>
                <div style={{ padding: settings.footerStyle === "compact" ? "16px 40px" : "32px 40px" }}>
                  {Object.values(socialLinks).some(Boolean) && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: settings.footerStyle === "compact" ? 12 : 24 }}>
                      {Object.entries(socialLinks).filter(([, v]) => v).slice(0, 6).map(([k]) => (
                        <div key={k} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                          {k.slice(0, 2)}
                        </div>
                      ))}
                    </div>
                  )}
                  {settings.footerStyle !== "compact" && Object.values(settings.policies as Record<string, string>).some(Boolean) && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                      {["Shipping Policy", "Returns & Refunds", "Privacy Policy"].map((pol) => (
                        <span key={pol} style={{ fontSize: 12, color: theme.muted, cursor: "default" }}>{pol}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ textAlign: "center", fontSize: 12, color: theme.muted, margin: 0 }}>
                    © 2025 {settings.name ?? "My Store"} · Powered by Nexus
                  </p>
                </div>
              </div>
            </Zone>
          )}
        </div>
      </div>
    </div>
  );
}

// A small, faithful mock of how a template's storefront looks, palette, font,
// hero layout and a product grid, all derived from the template's settings.
function TemplatePreview({ t }: { t: (typeof STORE_TEMPLATES)[number] }) {
  const s = t.settings;
  const theme = STORE_THEMES[(s.theme as string) ?? "default"] ?? STORE_THEMES.default;
  const accent = s.primaryColor ?? theme.accent;
  const onAccent = previewReadableTextOn(accent);
  const fontCls = FONT_STYLES[(s.fontStyle as string) ?? theme.font]?.className ?? "font-sans";
  const rad = BUTTON_STYLES[(s.buttonStyle as string) ?? theme.button]?.radius ?? "rounded-md";
  const rPx = rad.includes("full") ? 999 : rad.includes("none") ? 0 : rad.includes("2xl") ? 8 : rad.includes("md") ? 3 : 6;
  const hero = (s.heroStyle as string) ?? "storefront";

  const btn = (
    <span style={{ background: accent, color: onAccent, borderRadius: rPx, fontSize: 5, fontWeight: 700, padding: "2px 6px", display: "inline-block", lineHeight: 1.4 }}>Shop now</span>
  );
  const HERO_H = 60;

  let heroBody: React.ReactNode;
  if (hero === "editorial") {
    heroBody = (
      <div style={{ height: HERO_H, padding: "5px 8px", display: "flex", flexDirection: "column" }}>
        <div className={fontCls} style={{ fontWeight: 800, color: theme.text, fontSize: 16, lineHeight: 0.9, letterSpacing: "-0.03em" }}>{t.name}</div>
        <div style={{ marginTop: 4, flex: 1, background: theme.surfaceHover, borderRadius: 4 }} />
      </div>
    );
  } else if (hero === "marquee") {
    heroBody = (
      <div style={{ height: HERO_H, background: `linear-gradient(135deg, ${accent}, ${theme.text})`, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className={fontCls} style={{ fontWeight: 900, color: "#fff", fontSize: 22, whiteSpace: "nowrap", letterSpacing: "-0.02em", opacity: 0.95, paddingLeft: 6 }}>SHOP · NEW · SHOP ·</div>
      </div>
    );
  } else if (hero === "showcase" || hero === "split") {
    heroBody = (
      <div style={{ height: HERO_H, display: "flex", gap: 6, padding: "6px 8px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div className={fontCls} style={{ fontWeight: 800, color: theme.text, fontSize: 11, lineHeight: 1 }}>Design,<br />Elevated</div>
          <div style={{ marginTop: 5 }}>{btn}</div>
        </div>
        <div style={{ width: 48, height: 48, background: theme.surfaceHover, borderRadius: 6, flexShrink: 0 }} />
      </div>
    );
  } else if (hero === "product" || hero === "cover") {
    heroBody = (
      <div style={{ height: HERO_H, background: `linear-gradient(135deg, ${accent}cc, ${theme.text})`, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 8 }}>
        <div className={fontCls} style={{ fontWeight: 800, color: "#fff", fontSize: 13, lineHeight: 1 }}>New Season</div>
        <div style={{ marginTop: 4 }}>{btn}</div>
      </div>
    );
  } else {
    heroBody = (
      <div style={{ height: HERO_H, background: `linear-gradient(160deg, ${accent}22, ${theme.surface})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <div className={fontCls} style={{ fontWeight: 800, color: theme.text, fontSize: 12 }}>Shop the latest</div>
        {btn}
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, height: 150, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: theme.surface, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", flexShrink: 0 }}>
        <span className={fontCls} style={{ fontSize: 7, fontWeight: 800, color: theme.text }}>Studio</span>
        <span style={{ display: "flex", gap: 3 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 2, borderRadius: 2, background: theme.muted, opacity: 0.5 }} />)}
        </span>
      </div>
      <div style={{ flexShrink: 0 }}>{heroBody}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, padding: 8, flex: 1, minHeight: 0 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, minHeight: 0 }}>
            <div style={{ flex: 1, background: theme.surfaceHover, borderRadius: 4, minHeight: 0 }} />
            <div style={{ height: 3, width: "70%", background: theme.muted, opacity: 0.4, borderRadius: 2 }} />
            <div style={{ height: 3, width: "40%", background: accent, borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
